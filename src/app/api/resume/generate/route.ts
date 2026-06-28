import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_tier, resume_generations_count, resume_generations_reset_date')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }

  const tier = profile.subscription_tier || 'free';
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Count resumes generated this month
  const { count, error: countError } = await supabase
    .from('resumes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth);

  if (countError) {
    return NextResponse.json({ error: 'Failed to check usage' }, { status: 500 });
  }

  const currentCount = count || 0;

  // Check limits
  let limit = 1;
  if (tier === 'pro') limit = 5;
  if (tier === 'max') limit = 999999;

  if (currentCount >= limit) {
    return NextResponse.json({ 
      error: `You have reached your ${tier.toUpperCase()} tier limit of ${limit} resume generations this month. Upgrade to generate more.` 
    }, { status: 403 });
  }

  // Insert a dummy record to track this generation
  const { error: insertError } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      filename: `ATS_Resume_${Date.now()}.pdf`,
      file_url: 'builder',
      file_size: 0,
      mime_type: 'application/pdf',
      parsing_status: 'completed'
    });

  if (insertError) {
    return NextResponse.json({ error: 'Failed to record generation' }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    remaining: limit - (currentCount + 1)
  });
}
