import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TIER_CONFIG, type TierName } from '@/lib/tiers';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roadmapId = searchParams.get('roadmapId');
  const code = searchParams.get('code');

  const supabase = await createClient();
  
  if (code) {
    // Public verification route
    const { data, error } = await supabase
      .from('certificates')
      .select('*, profiles(full_name)')
      .eq('unique_code', code)
      .eq('status', 'issued')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Certificate not found or invalid' }, { status: 404 });
    }
    return NextResponse.json({ certificate: data });
  }

  if (roadmapId) {
    // Authenticated route to get cert for roadmap
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ certificate: data || null });
  }

  return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { roadmapId, roadmapTitle, recipientName, action } = await request.json();

    if (!roadmapId || !roadmapTitle) {
      return NextResponse.json({ error: 'Missing roadmap details' }, { status: 400 });
    }

    // Check user tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, full_name')
      .eq('id', user.id)
      .single();

    const tier = (profile?.subscription_tier || 'free') as TierName;

    // Check if roadmap is fully completed
    const { data: roadmap } = await supabase
      .from('roadmaps')
      .select('milestones_data')
      .eq('id', roadmapId)
      .eq('user_id', user.id)
      .single();

    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    const milestones = roadmap.milestones_data as any[];
    const isCompleted = milestones.every(m => m.status === 'completed');

    // Check existing certificate
    const { data: existingCert } = await supabase
      .from('certificates')
      .select('*')
      .eq('roadmap_id', roadmapId)
      .single();

    if (existingCert && existingCert.status === 'issued') {
      return NextResponse.json({ error: 'Certificate has already been issued and cannot be modified.' }, { status: 403 });
    }

    if (action === 'issue') {
      if (!isCompleted) {
        return NextResponse.json({ error: 'Roadmap must be fully completed to get a certificate.' }, { status: 403 });
      }

      // Free users cannot issue certificates
      if (tier === 'free') {
        return NextResponse.json({ error: 'Please upgrade to Pro or Max to generate and download certificates.' }, { status: 403 });
      }

      if (!recipientName || recipientName.trim().length < 2) {
        return NextResponse.json({ error: 'Please provide a valid recipient name.' }, { status: 400 });
      }

      const uniqueCode = existingCert?.unique_code || crypto.randomBytes(6).toString('hex').toUpperCase();

      const { data: issuedCert, error: upsertError } = await supabase
        .from('certificates')
        .upsert({
          id: existingCert?.id || undefined,
          user_id: user.id,
          roadmap_id: roadmapId,
          roadmap_title: roadmapTitle,
          recipient_name: recipientName.trim(),
          unique_code: uniqueCode,
          status: 'issued',
          issued_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'roadmap_id' })
        .select()
        .single();

      if (upsertError) throw upsertError;

      return NextResponse.json({ success: true, certificate: issuedCert });
    } else {
      // Just creating a draft
      const uniqueCode = existingCert?.unique_code || crypto.randomBytes(6).toString('hex').toUpperCase();
      const defaultName = profile?.full_name || user.email?.split('@')[0] || 'Scholar';
      
      const { data: draftCert, error: draftError } = await supabase
        .from('certificates')
        .upsert({
          id: existingCert?.id || undefined,
          user_id: user.id,
          roadmap_id: roadmapId,
          roadmap_title: roadmapTitle,
          recipient_name: recipientName || existingCert?.recipient_name || defaultName,
          unique_code: uniqueCode,
          status: 'draft',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'roadmap_id' })
        .select()
        .single();

      if (draftError) throw draftError;

      return NextResponse.json({ success: true, certificate: draftCert });
    }

  } catch (error: any) {
    console.error('[Certificate API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
