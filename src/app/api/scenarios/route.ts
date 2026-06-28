import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatCompletion } from '@/lib/sarvam/client';
import { TIER_CONFIG, TierName } from '@/lib/tiers';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { role: targetRole } = await req.json();

    if (!targetRole) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    // 1. Get tier limits
    const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
    const tierName = (profile?.subscription_tier as TierName) || 'free';
    const tierLimits = TIER_CONFIG[tierName];

    // 2. Check monthly limits
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const monthStart = new Date(istNow.getFullYear(), istNow.getMonth(), 1);
    const monthStartUTC = new Date(monthStart.getTime() - istOffset);

    const { count: monthlyScenarios } = await supabase
      .from('scenarios')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStartUTC.toISOString());

    if ((monthlyScenarios ?? 0) >= tierLimits.scenariosPerMonth) {
      return NextResponse.json({
        error: `Monthly scenario limit (${tierLimits.scenariosPerMonth}) reached for your ${tierLimits.label} plan. Upgrade to unlock more.`
      }, { status: 403 });
    }

    // 3. Create scenario record
    const { data: scenario, error: insertError } = await supabase
      .from('scenarios')
      .insert({
        user_id: user.id,
        role: targetRole,
        status: 'in_progress'
      })
      .select()
      .single();

    if (insertError || !scenario) {
      return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 });
    }

    // 4. Generate initial AI greeting
    const systemPrompt = `You are a text-adventure game master simulating a "Day in the Life" of a ${targetRole}.
The simulation should have a complexity level of: ${tierLimits.scenarioComplexity}.
Start the scenario by setting the scene. It is 9:00 AM on a Monday. 
Describe the environment, the current project they are working on, and present them with their first situation, task, or crisis to handle.
Ask them what they want to do next. Keep the response under 150 words.`;

    const aiGreeting = await chatCompletion([
      { role: 'system', content: systemPrompt }
    ]);

    // 5. Save messages
    await supabase.from('scenario_events').insert([
      { scenario_id: scenario.id, role: 'system', content: systemPrompt },
      { scenario_id: scenario.id, role: 'assistant', content: aiGreeting }
    ]);

    return NextResponse.json({ success: true, scenarioId: scenario.id, initialMessage: aiGreeting });

  } catch (error) {
    console.error('Scenario POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    try {
      const { scenarioId, action, message } = await req.json();
  
      if (!scenarioId) {
        return NextResponse.json({ error: 'Scenario ID required' }, { status: 400 });
      }

      // Verify ownership
      const { data: scenario } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .eq('user_id', user.id)
        .single();
        
      if (!scenario) return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
      if (scenario.status === 'completed') return NextResponse.json({ error: 'Scenario already completed' }, { status: 400 });

      // Handle finish action
      if (action === 'finish') {
          // Fetch all events to generate feedback
          const { data: events } = await supabase
            .from('scenario_events')
            .select('role, content')
            .eq('scenario_id', scenarioId)
            .order('created_at', { ascending: true });

          const chatHistory = events?.filter(e => e.role !== 'system').map(e => `${e.role.toUpperCase()}: ${e.content}`).join('\n\n') || '';

          const feedbackPrompt = `You are a career coach. The "Day in the Life" simulation is now over. 
Here is the transcript of the user's actions:
${chatHistory}

Evaluate the user's decision-making, technical approach, and communication.
Format the response STRICTLY as a JSON object with two keys:
- "score": an integer from 0 to 100 representing their overall performance.
- "feedback": a string containing your detailed feedback.

Output ONLY valid JSON.`;

          const feedbackRes = await chatCompletion([
              { role: 'user', content: feedbackPrompt }
          ], { temperature: 0.2 });

          let feedbackData = { score: 0, feedback: "Failed to generate feedback." };
          try {
              const match = feedbackRes.match(/\{[\s\S]*\}/);
              if (match) {
                  feedbackData = JSON.parse(match[0]);
              }
          } catch(e) {
              console.error("Failed to parse feedback JSON", e);
          }

          // Mark complete and save feedback
          const { data: updatedScenario } = await supabase
            .from('scenarios')
            .update({ 
                status: 'completed', 
                score: feedbackData.score, 
                feedback: feedbackData 
            })
            .eq('id', scenarioId)
            .select()
            .single();

          return NextResponse.json({ success: true, scenario: updatedScenario });
      }
  
      // Handle normal message
      if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

      // Save user message
      await supabase.from('scenario_events').insert({
          scenario_id: scenarioId,
          role: 'user',
          content: message
      });

      // Fetch conversation history
      const { data: history } = await supabase
        .from('scenario_events')
        .select('role, content')
        .eq('scenario_id', scenarioId)
        .order('created_at', { ascending: true });

      const messagesForAi = history?.map(m => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content
      })) || [];

      // Get user tier to determine length
      const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
      const tierName = (profile?.subscription_tier as TierName) || 'free';
      const turnCount = tierName === 'max' ? 10 : (tierName === 'pro' ? 6 : 3);

      // Add instruction to continue scenario
      const userMessageCount = messagesForAi.filter(m => m.role === 'user').length;
      const isFinalTurn = userMessageCount >= turnCount;
      
      if (isFinalTurn) {
        messagesForAi.push({ role: 'system', content: 'IMPORTANT: This is the FINAL turn. The simulation is NOW OVER. Briefly describe the outcome of their last action in 2-3 sentences. Then say their shift has ended and thank them. Do NOT ask any follow-up questions. Do NOT continue the scenario.' });
      } else {
        messagesForAi.push({ role: 'system', content: `Describe the consequences of the user's action, advance time slightly, and present the next part of the day or a new complication. This is turn ${userMessageCount} of ${turnCount}. Keep it engaging and under 100 words.` });
      }

      const aiResponse = await chatCompletion(messagesForAi);

      // Save AI message
      await supabase.from('scenario_events').insert({
        scenario_id: scenarioId,
        role: 'assistant',
        content: aiResponse
      });

      return NextResponse.json({ 
        success: true, 
        message: aiResponse, 
        simulationComplete: isFinalTurn,
        turnInfo: { current: userMessageCount, total: turnCount }
      });
  
    } catch (error) {
      console.error('Scenario PATCH error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
