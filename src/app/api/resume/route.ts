import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parsePdfToText } from '@/lib/parsers/resume-parser';
import { chatCompletion } from '@/lib/sarvam/client';

const RESUME_PARSING_PROMPT = `
You are an expert technical recruiter and AI resume parser.
I will provide you with the raw text of a resume.
Extract ALL of the following information and output ONLY a valid JSON object (no markdown, no backticks, no extra text).

The JSON must have exactly this structure:
{
  "basic_details": {
    "name": "Full name of the person",
    "email": "Email if found, or null",
    "phone": "Phone if found, or null",
    "location": "City/State/Country if found, or null",
    "father_name": "Father's name if mentioned, or null",
    "mother_name": "Mother's name if mentioned, or null",
    "date_of_birth": "DOB if mentioned, or null",
    "linkedin": "LinkedIn URL if found, or null",
    "github": "GitHub URL if found, or null",
    "portfolio": "Portfolio/website URL if found, or null"
  },
  "education": [
    {
      "institution": "School/College/University name",
      "degree": "Degree or level (e.g. B.Tech, 12th, 10th)",
      "field": "Field of study if applicable, or null",
      "cgpa": "CGPA/Percentage/GPA if mentioned, or null",
      "year": "Graduation year or year range, or null"
    }
  ],
  "projects": [
    {
      "title": "Project name",
      "description": "Brief description of what the project does",
      "tech_stack": ["Technology1", "Technology2"],
      "link": "Project URL if found, or null"
    }
  ],
  "experience": [
    {
      "company": "Company name",
      "role": "Job title",
      "duration": "Duration string (e.g. Jan 2023 - Present)",
      "description": "Brief description of responsibilities"
    }
  ],
  "skills": [
    {
      "name": "Skill name (capitalized correctly like React, Python)",
      "category": "One of: programming_language, framework, library, tool, concept, database, other",
      "proficiency": "One of: beginner, intermediate, advanced (guess from context, default intermediate)"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "year": "Year if found, or null"
    }
  ]
}

If any section has no data, use an empty array [] or null for individual fields.
Extract as much as possible from the resume text.

Resume Text:
{TEXT}
`;

// Tiered rate limits per day
const TIER_LIMITS: Record<string, number> = {
  free: 3,
  pro: 15,
  max: 50,
};

const ONE_DAY = 24 * 60 * 60 * 1000;

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch user's subscription tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const tier = profile?.subscription_tier || 'free';
  const maxRequests = TIER_LIMITS[tier] || TIER_LIMITS.free;

  // Rate Limiting Logic
  const now = Date.now();
  const limit = rateLimitMap.get(user.id);

  if (limit) {
    if (now > limit.resetTime) {
      rateLimitMap.set(user.id, { count: 1, resetTime: now + ONE_DAY });
    } else if (limit.count >= maxRequests) {
      return NextResponse.json(
        {
          error: `Daily resume parsing limit (${maxRequests}) exceeded for your ${tier} plan. ${tier === 'free' ? 'Upgrade to Pro for 15 scans/day.' : 'Try again tomorrow.'}`,
          tier,
          limit: maxRequests,
        },
        { status: 429 }
      );
    } else {
      limit.count++;
    }
  } else {
    rateLimitMap.set(user.id, { count: 1, resetTime: now + ONE_DAY });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF format is currently supported' }, { status: 400 });
    }

    // 1. Extract Text from PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await parsePdfToText(buffer);

    console.log(`[Resume API] Extracted text length: ${text?.length || 0}`);

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: 'Could not extract sufficient text from the PDF. The file may be image-based — try a text-based PDF.' }, { status: 400 });
    }

    // 2. Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file, {
        contentType: 'application/pdf',
        upsert: false,
      });

    let fileUrl = '';
    if (uploadError) {
      console.error('[Resume API] Storage upload error:', uploadError);
    } else if (uploadData) {
      const { data: publicUrlData } = supabase.storage.from('resumes').getPublicUrl(fileName);
      fileUrl = publicUrlData.publicUrl;
    }

    // 3. Create Record in Resumes Table
    const { data: resumeRecord, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        filename: file.name,
        file_url: fileUrl,
        file_size: file.size,
        mime_type: file.type || 'application/pdf',
        raw_text: text,
        parsing_status: 'parsing'
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('[Resume API] DB insert error:', dbError);
    }

    const resumeId = resumeRecord?.id;

    // 4. Parse with Sarvam AI — full extraction
    const prompt = RESUME_PARSING_PROMPT.replace('{TEXT}', text.substring(0, 12000));
    const aiResponse = await chatCompletion([
      { role: 'user', content: prompt }
    ], {
      temperature: 0.1,
      enableThinking: false,
    });

    // 5. Clean and parse JSON
    let parsed: any = {};
    try {
      let cleaned = aiResponse.trim();
      if (cleaned.startsWith('\`\`\`json')) cleaned = cleaned.replace('\`\`\`json', '');
      if (cleaned.startsWith('\`\`\`')) cleaned = cleaned.replace('\`\`\`', '');
      if (cleaned.endsWith('\`\`\`')) cleaned = cleaned.slice(0, -3);

      parsed = JSON.parse(cleaned.trim());
    } catch (parseError) {
      console.error('[Resume API] Failed to parse AI JSON:', aiResponse);
      return NextResponse.json({ error: 'AI returned malformed data. Please try again.' }, { status: 500 });
    }

    // Normalize structure
    const basicDetails = parsed.basic_details || {};
    const education = Array.isArray(parsed.education) ? parsed.education : [];
    const projects = Array.isArray(parsed.projects) ? parsed.projects.slice(0, 20) : [];
    const experience = Array.isArray(parsed.experience) ? parsed.experience : [];
    const certifications = Array.isArray(parsed.certifications) ? parsed.certifications : [];

    let skills = Array.isArray(parsed.skills) ? parsed.skills.slice(0, 30) : [];
    const finalSkills = skills.map((s: any) => ({
      ...s,
      selected: true,
    }));

    // 6. Update Resume Record with all extracted data
    if (resumeId) {
      await supabase
        .from('resumes')
        .update({
          parsed_basic_details: basicDetails,
          parsed_skills: finalSkills,
          parsed_projects: projects,
          parsed_education: education,
          parsed_certifications: certifications,
          parsing_status: 'completed'
        })
        .eq('id', resumeId);
    }

    return NextResponse.json({
      data: {
        basic_details: basicDetails,
        education,
        projects,
        experience,
        skills: finalSkills,
        certifications,
        tier,
        remaining: maxRequests - (rateLimitMap.get(user.id)?.count || 1),
      }
    });
  } catch (error) {
    console.error('[Resume API] Error parsing resume:', error);
    return NextResponse.json(
      { error: 'Failed to process resume' },
      { status: 500 }
    );
  }
}
