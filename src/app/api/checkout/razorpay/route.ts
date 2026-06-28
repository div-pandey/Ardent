import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_1234567890abcd',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '1234567890abcdef12345678',
});

// Since this is server side, we use the service role key to securely interact with Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { planName, isYearly, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine pricing in USD
    let amountUSD = 0;
    
    if (planName === 'Pro') {
      amountUSD = isYearly ? 12 * 12 : 15;
    } else if (planName === 'Max') {
      amountUSD = isYearly ? 39 * 12 : 49;
    } else {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const amountInCents = Math.round(amountUSD * 100);

    const options = {
      amount: amountInCents,
      currency: 'USD',
      receipt: `rcpt_${userId.substring(0, 8)}_${Date.now().toString().slice(-6)}`,
      notes: {
        userId: userId,
        plan: planName,
        billingCycle: isYearly ? 'yearly' : 'monthly',
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('[RAZORPAY_CHECKOUT_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
