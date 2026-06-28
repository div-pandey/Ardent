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
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
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

    const { count: monthlyInterviews } = await supabase
      .from('mock_interviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStartUTC.toISOString());

    if ((monthlyInterviews ?? 0) >= tierLimits.interviewsPerMonth) {
      return NextResponse.json({
        error: `Monthly interview limit (${tierLimits.interviewsPerMonth}) reached for your ${tierLimits.label} plan. Upgrade to unlock more.`
      }, { status: 403 });
    }

    if (topic.toLowerCase().includes('system design') && !tierLimits.advancedInterviews) {
        return NextResponse.json({
            error: `System Design interviews are only available on the Max plan.`
          }, { status: 403 });
    }

    // 3. Create interview record
    const { data: interview, error: insertError } = await supabase
      .from('mock_interviews')
      .insert({
        user_id: user.id,
        topic,
        status: 'in_progress'
      })
      .select()
      .single();

    if (insertError || !interview) {
      return NextResponse.json({ error: 'Failed to create interview' }, { status: 500 });
    }

    const questionCount = tierName === 'max' ? 20 : (tierName === 'pro' ? 12 : 5);

    // 4. Generate initial AI greeting
    const systemPrompt = `You are an expert technical interviewer at a top tech company named Ardent. Your name is Priya. 
You are interviewing the user for a role focusing on: "${topic}".
Start the interview by greeting the user professionally, introducing yourself as Priya from Ardent. Briefly mention that this will be a ${questionCount}-question interview. Then, ask the very first interview question.
Keep your response concise and conversational. Do not give away answers.
Your feedback detail level for this candidate is: ${tierLimits.interviewFeedbackLevel}.`;

    const aiGreeting = await chatCompletion([
      { role: 'system', content: systemPrompt }
    ]);

    // 5. Save messages
    await supabase.from('interview_messages').insert([
      { interview_id: interview.id, role: 'system', content: systemPrompt },
      { interview_id: interview.id, role: 'assistant', content: aiGreeting }
    ]);

    return NextResponse.json({ success: true, interviewId: interview.id, initialMessage: aiGreeting });

  } catch (error) {
    console.error('Interview POST error:', error);
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
      const { interviewId, message, action } = await req.json();
  
      if (!interviewId) {
        return NextResponse.json({ error: 'Interview ID required' }, { status: 400 });
      }

      // Verify ownership
      const { data: interview } = await supabase
        .from('mock_interviews')
        .select('*')
        .eq('id', interviewId)
        .eq('user_id', user.id)
        .single();
        
      if (!interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
      if (interview.status === 'completed') return NextResponse.json({ error: 'Interview already completed' }, { status: 400 });

      // Handle finish action
      if (action === 'finish') {
          // Fetch all messages to generate feedback
          const { data: messages } = await supabase
            .from('interview_messages')
            .select('role, content')
            .eq('interview_id', interviewId)
            .order('created_at', { ascending: true });

          const chatHistory = messages?.filter(m => m.role !== 'system').map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n') || '';

          const feedbackPrompt = `You are the technical interviewer. The interview is now over. 
Here is the transcript of the interview:
${chatHistory}

Provide constructive feedback for the candidate.
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
          const { data: updatedInterview } = await supabase
            .from('mock_interviews')
            .update({ 
                status: 'completed', 
                score: feedbackData.score, 
                feedback: feedbackData 
            })
            .eq('id', interviewId)
            .select()
            .single();

          return NextResponse.json({ success: true, interview: updatedInterview });
      }
  
      // Handle normal message
      if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

      // Save user message
      await supabase.from('interview_messages').insert({
          interview_id: interviewId,
          role: 'user',
          content: message
      });

      // Fetch conversation history
      const { data: history } = await supabase
        .from('interview_messages')
        .select('role, content')
        .eq('interview_id', interviewId)
        .order('created_at', { ascending: true });

      const messagesForAi = history?.map(m => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content
      })) || [];

      // Get user tier to determine length
      const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
      const tierName = (profile?.subscription_tier as TierName) || 'free';
      const questionCount = tierName === 'max' ? 20 : (tierName === 'pro' ? 12 : 5);

      // Add instruction to continue interview
      const userMessageCount = messagesForAi.filter(m => m.role === 'user').length;
      
      if (userMessageCount >= questionCount) {
        messagesForAi.push({ role: 'system', content: 'This is the end of the interview. Thank the candidate for their time, let them know you will review their answers, and explicitly end your message with EXACTLY this string: [INTERVIEW_COMPLETE]. Do NOT ask any more questions.' });
      } else {
        messagesForAi.push({ role: 'system', content: `Respond to the candidate. This is question/interaction ${userMessageCount + 1} of ${questionCount}. Either ask a follow-up question, or move on to the next topic. Keep it conversational like a real interview.` });
      }

      const aiResponse = await chatCompletion(messagesForAi);

      // Save AI message
      await supabase.from('interview_messages').insert({
        interview_id: interviewId,
        role: 'assistant',
        content: aiResponse
      });

      return NextResponse.json({ success: true, message: aiResponse });
  
    } catch (error) {
      console.error('Interview PATCH error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
