import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/resume/latest — Fetch the user's most recently parsed resume data
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the user's latest completed resume
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('parsed_basic_details, parsed_skills, parsed_projects, parsed_education, parsed_certifications, parsing_status')
      .eq('user_id', user.id)
      .eq('parsing_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !resume) {
      return NextResponse.json({ data: null });
    }

    // Get the user's subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = profile?.subscription_tier || 'free';

    // Build experience from basic_details if present, otherwise empty
    const basicDetails = resume.parsed_basic_details || {};
    const skills = (resume.parsed_skills || []).map((s: any) => ({
      ...s,
      selected: s.selected ?? true,
    }));

    return NextResponse.json({
      data: {
        basic_details: basicDetails,
        education: resume.parsed_education || [],
        projects: resume.parsed_projects || [],
        experience: [],
        skills,
        certifications: resume.parsed_certifications || [],
        tier,
        remaining: undefined, // Don't show remaining on load
      }
    });
  } catch (error) {
    console.error('[Resume Latest API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch resume data' }, { status: 500 });
  }
}
