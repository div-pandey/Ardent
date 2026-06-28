import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatCompletion } from '@/lib/sarvam/client';
import { TIER_CONFIG, TierName } from '@/lib/tiers';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get today's date in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const dateIST = istTime.toISOString().split('T')[0]; // YYYY-MM-DD

    // 2. Check if a challenge already exists for today
    const { data: existingChallenge } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('date_ist', dateIST)
      .single();

    if (existingChallenge) {
      // Fetch streak for the response
      const { data: streakProfile } = await supabase
        .from('profiles')
        .select('current_streak')
        .eq('id', user.id)
        .single();
      return NextResponse.json({ success: true, challenge: existingChallenge, streak: streakProfile?.current_streak || 0 });
    }

    // 3. If no challenge exists, we need to generate one.
    // Fetch active roadmap and user profile for tier logic
    const [profileRes, roadmapRes] = await Promise.all([
      supabase.from('profiles').select('subscription_tier, current_streak').eq('id', user.id).single(),
      supabase.from('roadmaps').select('*').eq('user_id', user.id).eq('is_active', true).single()
    ]);

    const currentStreak = profileRes.data?.current_streak || 0;

    if (roadmapRes.error || !roadmapRes.data) {
      return NextResponse.json({ success: false, requireRoadmap: true });
    }

    const tierName = (profileRes.data?.subscription_tier as TierName) || 'free';
    const tierLimits = TIER_CONFIG[tierName];
    const roadmap = roadmapRes.data;
    const milestones = roadmap.milestones_data || [];

    // 4. Find the current active daily task
    let activeTaskTitle = null;
    let milestoneId = null;
    
    for (const m of milestones) {
      if (m.tasks) {
        const uncompleted = m.tasks.find((t: any) => !t.done);
        if (uncompleted) {
          activeTaskTitle = `${m.title}: ${uncompleted.title}`;
          milestoneId = m.id;
          break;
        }
      }
    }

    // Fallback if all tasks are completed
    if (!activeTaskTitle) {
      activeTaskTitle = roadmap.target_role ? `Advanced ${roadmap.target_role} Concepts` : 'General Tech Fundamentals';
    }

    // 5. Generate Challenges via Sarvam AI
    const systemPrompt = `You are a strict technical interviewer. Generate ${tierLimits.challengesPerDay} multiple-choice micro-challenges.
The user is studying: "${activeTaskTitle}".
Format the response strictly as a JSON array of objects.
Each object must have:
- "type": "text" or "code" (If ${tierLimits.challengeIncludesCode} is true, make at least 2 questions type "code" with a "codeSnippet").
- "question": string
- "codeSnippet": string (optional, omit if type is text)
- "options": array of 3 or 4 string options
- "correctIndex": integer index of correct option
- "explanation": string (${tierLimits.challengeExplanationLevel} level of detail explaining why the answer is correct).

Return ONLY valid JSON array.`;

    const sarvamRes = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Begin generation. Output only valid JSON.' }
    ], { temperature: 0.2, enableThinking: false });

    let questions = [];
    try {
      // Find JSON array in the response string
      const match = sarvamRes.match(/\[\s*\{.*\}\s*\]/s);
      if (match) {
        questions = JSON.parse(match[0]);
      } else {
        questions = JSON.parse(sarvamRes); // Hope it's clean JSON
      }
    } catch (e) {
      console.error('Failed to parse Sarvam JSON:', e);
      return NextResponse.json({ error: 'AI Generation Failed' }, { status: 500 });
    }

    // 6. Save to Supabase
    const { data: newChallenge, error: insertError } = await supabase
      .from('daily_challenges')
      .insert({
        user_id: user.id,
        date_ist: dateIST,
        roadmap_id: roadmap.id,
        task_title: activeTaskTitle,
        questions: questions,
        is_completed: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert challenge error:', insertError);
      return NextResponse.json({ error: 'Failed to save challenge' }, { status: 500 });
    }

    return NextResponse.json({ success: true, challenge: newChallenge, streak: currentStreak });

  } catch (error) {
    console.error('Daily challenges GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { challengeId, score } = await req.json();

    // 1. Mark challenge as completed
    const { data: challenge, error: updateError } = await supabase
      .from('daily_challenges')
      .update({ is_completed: true, score })
      .eq('id', challengeId)
      .eq('user_id', user.id)
      .select('date_ist')
      .single();

    if (updateError || !challenge) {
      return NextResponse.json({ error: 'Failed to update challenge' }, { status: 400 });
    }

    // 2. Update user streak
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_challenge_date')
      .eq('id', user.id)
      .single();

    let currentStreak = profile?.current_streak || 0;
    let longestStreak = profile?.longest_streak || 0;
    const lastDate = profile?.last_challenge_date;
    const challengeDate = challenge.date_ist;

    if (lastDate !== challengeDate) {
      if (!lastDate) {
        currentStreak = 1;
      } else {
        const last = new Date(lastDate).getTime();
        const curr = new Date(challengeDate).getTime();
        const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak += 1; // Streak continues
        } else if (diffDays > 1) {
          currentStreak = 1; // Streak broken
        }
      }
      
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      await supabase
        .from('profiles')
        .update({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_challenge_date: challengeDate
        })
        .eq('id', user.id);
    }

    return NextResponse.json({ success: true, current_streak: currentStreak });

  } catch (error) {
    console.error('Daily challenges POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
