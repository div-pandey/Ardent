import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      userId,
      planName
    } = await req.json();

    if (!userId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || '1234567890abcdef12345678';
    
    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Payment is verified! Upgrade the user via Supabase Auth Admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { plan: planName.toLowerCase() }
    });

    if (error) {
      console.error('[SUPABASE_UPGRADE_ERROR]', error);
      return NextResponse.json({ error: 'Failed to upgrade user metadata' }, { status: 500 });
    }

    // Update the profile table too
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ subscription_tier: planName.toLowerCase() })
      .eq('id', userId);

    if (profileError) {
      console.error('[SUPABASE_PROFILE_UPGRADE_ERROR]', profileError);
      return NextResponse.json({ error: 'Failed to upgrade profile tier' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[RAZORPAY_VERIFY_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
