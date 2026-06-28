import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatCompletion } from '@/lib/sarvam/client';
import { getUserGraph } from '@/services/graph.service';

const GUIDE_SYSTEM_PROMPT = `
You are the Ardent Guide, an elite AI career strategist and technical mentor.
You have access to the user's Career Intelligence Graph.

User's Context:
- Skills Acquired: {SKILLS}
- Current Role: {CURRENT_ROLE}
- Target Role: {TARGET_ROLE}

Your personality: Encouraging, highly technical, strategic, and concise.
Rules for your responses:
1. Provide highly actionable, specific advice.
2. Use markdown for emphasis, lists, and structure.
3. DO NOT give generic advice. Always tie your answers back to their specific skills and target role.
4. If they ask what to learn next, recommend a logical next step based on their target role.
5. Keep responses concise and easy to read (max 3-4 short paragraphs).
`;

// Simple in-memory rate limiter to protect Sarvam AI credits (10 reqs / hour / user)
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const MAX_REQUESTS = 10;
const ONE_HOUR = 60 * 60 * 1000;

export async function POST(request: Request) {
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
      rateLimitMap.set(user.id, { count: 1, resetTime: now + ONE_HOUR });
    } else if (limit.count >= MAX_REQUESTS) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again in an hour.' }, { status: 429 });
    } else {
      limit.count++;
    }
  } else {
    rateLimitMap.set(user.id, { count: 1, resetTime: now + ONE_HOUR });
  }

  try {
    const { messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Fetch user graph context dynamically
    const graph = await getUserGraph(user.id);
    const skills = graph.nodes.filter(n => n.type === 'skill').map(n => n.label).join(', ') || 'No specific skills mapped yet.';
    
    // In our Neo4j model, current role has a CURRENTLY_IN edge, but we can also infer from properties if needed.
    // For simplicity, we just look for nodes of type 'role' and 'role_target' if available,
    // otherwise fallback to generic.
    const currentRoleNode = graph.nodes.find(n => n.type === 'role');
    const targetRoleNode = graph.nodes.find(n => n.type === 'role_target');
    
    const currentRole = currentRoleNode ? currentRoleNode.label : 'Unknown';
    const targetRole = targetRoleNode ? targetRoleNode.label : 'Unknown';

    const systemMessage = GUIDE_SYSTEM_PROMPT
      .replace('{SKILLS}', skills)
      .replace('{CURRENT_ROLE}', currentRole)
      .replace('{TARGET_ROLE}', targetRole);

    const apiMessages = [
      { role: 'system', content: systemMessage },
      // We exclude the initial local welcome message to save tokens, only passing user/assistant turns
      ...messages.filter((m: any) => m.id !== 'welcome').map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    ];

    const aiResponse = await chatCompletion(apiMessages, { 
      temperature: 0.7
    });
    
    return NextResponse.json({ data: aiResponse });
  } catch (error) {
    console.error('[Guide API] Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
