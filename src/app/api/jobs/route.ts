import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatCompletion } from '@/lib/sarvam/client';
import { readQuery } from '@/lib/neo4j/driver';

// Simple in-memory rate limiter to protect Sarvam AI credits (3 reqs / day / user)
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const MAX_REQUESTS = 3;
const ONE_DAY = 24 * 60 * 60 * 1000;

const JOBS_SYSTEM_PROMPT = `
You are an expert tech recruiter and job matching algorithm.
The user is transitioning in their career. 
Their current role is: "{CURRENT_ROLE}"
Their target role is: "{TARGET_ROLE}"
Their currently acquired skills: "{SKILLS}"

Your task is to generate 3 to 4 highly tailored job postings that bridge the gap between their current skills and target role. The match percentage should be between 50% and 95% based on their actual skills.

CRITICAL INSTRUCTIONS FOR REALISM:
1. "company": You MUST use REAL, well-known tech companies or prominent startups (e.g., Stripe, Vercel, Google, Netflix, Linear, OpenAI, Shopify). Do NOT use fake names like "TechCorp" or "AI Innovations".
2. "location": Use real tech hub cities (e.g., "San Francisco, CA (Hybrid)", "New York, NY (On-site)", "Remote - US").
3. "posted": Use realistic recent times (e.g., "4 hours ago", "1 day ago", "3 days ago").

IMPORTANT: You MUST respond with ONLY a raw JSON array. No explanation, no markdown, no backticks. Just the JSON array directly.

Create objects with these exact keys:
{"title":"Job Title","company":"Real Company Name","location":"City, Remote, or Hybrid","posted":"e.g. 2 days ago","match":85,"tags":["skill1","skill2","skill3"]}

Respond with ONLY the JSON array starting with [ and ending with ]. Nothing else.
`;

// Helper to extract JSON from potentially messy AI output
function extractJsonArray(text: string): any[] {
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    // If exact parsing fails, try to find an array with regex
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        throw new Error('Failed to parse extracted array');
      }
    }
    throw new Error('No JSON array found');
  }
}

// Fallback generator in case AI fails
function generateFallbackJobs(targetRole: string, skillsArray: string[]): any[] {
  return [
    {
      title: `Junior ${targetRole}`,
      company: 'TechFlow Solutions',
      location: 'Remote',
      posted: 'Just now',
      match: 82,
      tags: skillsArray.slice(0, 3)
    },
    {
      title: `${targetRole} Associate`,
      company: 'Global Systems Inc',
      location: 'Hybrid',
      posted: '2 days ago',
      match: 68,
      tags: [skillsArray[0] || 'SQL', 'Agile', 'Communication']
    },
    {
      title: targetRole,
      company: 'Innovate Startup',
      location: 'Remote',
      posted: '1 week ago',
      match: 55,
      tags: [skillsArray[1] || 'Python', 'Fast-paced', 'Startup']
    }
  ];
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate Limiting Logic
  const now = Date.now();
  const limit = rateLimitMap.get(user.id);
  
  if (limit) {
    if (now > limit.resetTime) {
      rateLimitMap.set(user.id, { count: 1, resetTime: now + ONE_DAY });
    } else if (limit.count >= MAX_REQUESTS) {
      return NextResponse.json({ error: 'Daily job generation limit (3) exceeded. Please try again tomorrow.' }, { status: 429 });
    } else {
      limit.count++;
    }
  } else {
    rateLimitMap.set(user.id, { count: 1, resetTime: now + ONE_DAY });
  }

  try {
    // 1. Fetch User Context from Neo4j
    const roleQuery = await readQuery<Record<string, any>>(
      `MATCH (u:User {userId: $userId})
       OPTIONAL MATCH (u)-[:CURRENTLY_IN]->(cr:Role)
       OPTIONAL MATCH (u)-[:TARGETS_ROLE]->(tr:Role)
       RETURN cr.name AS currentRole, tr.name AS targetRole`,
      { userId: user.id }
    );
    
    const skillsQuery = await readQuery<Record<string, any>>(
      `MATCH (u:User {userId: $userId})-[:HAS_SKILL]->(s:Skill)
       RETURN collect(s.name) AS skills`,
      { userId: user.id }
    );

    const currentRole = roleQuery[0]?.currentRole || 'Unknown';
    const targetRole = roleQuery[0]?.targetRole || 'Software Engineer';
    const skillsArray = skillsQuery[0]?.skills || ['General Tech Skills'];
    const skillsString = skillsArray.join(', ');

    // 2. Call Sarvam AI
    const prompt = JOBS_SYSTEM_PROMPT
      .replace('{CURRENT_ROLE}', currentRole)
      .replace('{TARGET_ROLE}', targetRole)
      .replace('{SKILLS}', skillsString);

    let jobs = [];

    try {
      const aiResponse = await chatCompletion([
        { role: 'user', content: prompt }
      ], { temperature: 0.3, enableThinking: false, maxTokens: 4096 });
      
      jobs = extractJsonArray(aiResponse);
      
      // Ensure it's an array
      if (!Array.isArray(jobs)) {
        throw new Error('Parsed result is not an array');
      }
    } catch (aiError) {
      console.error('[Jobs API] AI failed, using fallback.', aiError);
      jobs = generateFallbackJobs(targetRole, skillsArray);
    }

    return NextResponse.json({ data: jobs });

  } catch (error) {
    console.error('[Jobs API] Error:', error);
    return NextResponse.json({ error: 'Failed to generate personalized jobs' }, { status: 500 });
  }
}
