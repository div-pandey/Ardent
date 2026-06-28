import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeSkillGap } from '@/services/graph.service';
import { chatCompletion } from '@/lib/sarvam/client';
import { TIER_CONFIG, type TierName } from '@/lib/tiers';

const ROADMAP_PROMPT = `You are an expert career mentor. The user wants to become a "{TARGET_ROLE}".
They are missing these skills: {MISSING_SKILLS}

IMPORTANT: You MUST respond with ONLY a raw JSON array. No explanation, no markdown, no backticks, no code fences. Just the JSON array directly.

Create 4-6 milestone objects. Each object has these exact keys:
{"title":"string","description":"string","weekRange":"string like Week 1-2","status":"locked or in_progress","skills":["skill1","skill2"],"project":"project idea string","tasks":[{"title":"task name","done":false}]}

The first milestone status must be "in_progress", rest must be "locked".
Each milestone MUST have EXACTLY 12 to 14 tasks to cover daily goals for a two-week sprint.

Respond with ONLY the JSON array starting with [ and ending with ]. Nothing else.`;

// Simple in-memory rate limiter to protect Sarvam AI credits (3 reqs / day / user)
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const MAX_REQUESTS = 3;
const ONE_DAY = 24 * 60 * 60 * 1000;

function getISTDateString(date: Date = new Date()) {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
  // Intl.DateTimeFormat with 'en-CA' outputs YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  return formatter.format(date);
}

/**
 * GET /api/roadmap — Fetch user's active roadmap + all roadmaps
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch user's tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = (profile?.subscription_tier || 'free') as TierName;
    const tierConfig = TIER_CONFIG[tier];

    // Fetch all roadmaps for this user
    const { data: roadmaps, error } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Roadmap API] Fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const activeRoadmap = roadmaps?.find((r: any) => r.is_active) || null;

    return NextResponse.json({
      data: {
        roadmaps: roadmaps || [],
        activeRoadmap,
        tier,
        limits: {
          maxRoadmaps: tierConfig.maxRoadmaps,
          roadmapsPerMonth: tierConfig.roadmapsPerMonth,
          resourceAccess: tierConfig.resourceAccess,
        },
      },
    });
  } catch (error) {
    console.error('[Roadmap API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch roadmaps' }, { status: 500 });
  }
}

/**
 * POST /api/roadmap — Generate a new roadmap with AI and persist to Supabase
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- Tier-based Limits ---
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const tier = (profile?.subscription_tier || 'free') as TierName;
  const tierConfig = TIER_CONFIG[tier];

  // Check total roadmap cap
  const { count: totalRoadmaps } = await supabase
    .from('roadmaps')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if ((totalRoadmaps ?? 0) >= tierConfig.maxRoadmaps) {
    return NextResponse.json({
      error: `You've reached the maximum of ${tierConfig.maxRoadmaps} roadmaps for your ${tierConfig.label} plan. ${tier === 'free' ? 'Upgrade to Pro for up to 15 roadmaps.' : tier === 'pro' ? 'Upgrade to Max for up to 100 roadmaps.' : 'Contact support for more.'}`,
    }, { status: 403 });
  }

  // Check monthly generation limit (IST-aware)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  const monthStart = new Date(istNow.getFullYear(), istNow.getMonth(), 1);
  const monthStartUTC = new Date(monthStart.getTime() - istOffset);

  const { count: monthlyCount } = await supabase
    .from('roadmaps')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', monthStartUTC.toISOString());

  if ((monthlyCount ?? 0) >= tierConfig.roadmapsPerMonth) {
    return NextResponse.json({
      error: `Monthly roadmap limit (${tierConfig.roadmapsPerMonth}) reached for your ${tierConfig.label} plan. ${tier !== 'max' ? 'Upgrade for more.' : 'Limit resets next month.'}`,
    }, { status: 429 });
  }

  try {
    const { targetRole } = await request.json();
    if (!targetRole) {
      return NextResponse.json({ error: 'Missing target role' }, { status: 400 });
    }

    // 1. Get Missing Skills from Neo4j
    let missingSkills = 'General skills for the role';
    try {
      const skillGap = await analyzeSkillGap(user.id, targetRole);
      if (skillGap.missingSkills.length > 0) {
        missingSkills = skillGap.missingSkills.map(s => s.name).join(', ');
      }
    } catch (gapError) {
      console.warn('[Roadmap API] Could not fetch skill gap, using generic:', gapError);
    }

    // 2. Generate Roadmap with Sarvam AI
    const prompt = ROADMAP_PROMPT
      .replace('{TARGET_ROLE}', targetRole)
      .replace('{MISSING_SKILLS}', missingSkills);

    console.log('[Roadmap API] Calling Sarvam AI for:', targetRole);
    
    const aiResponse = await chatCompletion([
      { role: 'user', content: prompt }
    ], { temperature: 0.2, enableThinking: false });

    console.log('[Roadmap API] AI response length:', aiResponse.length);
    
    // 3. Parse JSON — robust extraction
    let milestones: any[] = [];

    if (!aiResponse || aiResponse.trim().length === 0) {
      console.error('[Roadmap API] Empty AI response, using fallback roadmap');
      milestones = generateFallbackRoadmap(targetRole, missingSkills);
    } else {
      try {
        // Strip markdown fences if present
        let cleaned = aiResponse.trim();
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
        
        // Try to find a JSON array in the response
        const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          cleaned = arrayMatch[0];
        }
        
        milestones = JSON.parse(cleaned);
        if (!Array.isArray(milestones)) {
          throw new Error('Parsed result is not an array');
        }
      } catch (parseError) {
        console.error('[Roadmap API] AI JSON parse error, response was:', aiResponse.slice(0, 300));
        // Use fallback
        milestones = generateFallbackRoadmap(targetRole, missingSkills);
      }
    }

    // Give each a unique ID for the UI
    milestones = milestones.map((m: any, i: number) => ({
      ...m,
      id: `ms-${Date.now()}-${i}`,
    }));

    // 4. Save to Supabase
    const { data: savedRoadmap, error: saveError } = await supabase
      .from('roadmaps')
      .insert({
        user_id: user.id,
        title: `${targetRole} Roadmap`,
        target_role: targetRole,
        milestones_data: milestones,
        total_milestones: milestones.length,
        is_active: false,
      })
      .select()
      .single();

    if (saveError) {
      console.error('[Roadmap API] Save error:', saveError);
      // Still return the milestones even if save fails
      return NextResponse.json({ data: milestones });
    }

    return NextResponse.json({
      data: milestones,
      roadmap: savedRoadmap,
    });
  } catch (error) {
    console.error('[Roadmap API] Error:', error);
    return NextResponse.json({ error: 'Failed to generate roadmap' }, { status: 500 });
  }
}

/**
 * PATCH /api/roadmap — Update roadmap (set active, mark milestone complete, toggle task)
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, roadmapId, milestoneId, taskIndex } = body;

    switch (action) {
      case 'set_active': {
        // Deactivate all other roadmaps
        await supabase
          .from('roadmaps')
          .update({ is_active: false })
          .eq('user_id', user.id);

        // Activate this one
        const { error } = await supabase
          .from('roadmaps')
          .update({ is_active: true })
          .eq('id', roadmapId)
          .eq('user_id', user.id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      case 'deactivate': {
        const { error } = await supabase
          .from('roadmaps')
          .update({ is_active: false })
          .eq('id', roadmapId)
          .eq('user_id', user.id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      case 'delete': {
        const { error } = await supabase
          .from('roadmaps')
          .delete()
          .eq('id', roadmapId)
          .eq('user_id', user.id)
          .eq('is_active', false); // Optional safety check: only delete inactive

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      case 'mark_milestone_complete': {
        // Get the roadmap
        const { data: roadmap, error: fetchErr } = await supabase
          .from('roadmaps')
          .select('milestones_data')
          .eq('id', roadmapId)
          .eq('user_id', user.id)
          .single();

        if (fetchErr || !roadmap) {
          return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
        }

        const milestones = roadmap.milestones_data as any[];
        const milestoneIndex = milestones.findIndex((m: any) => m.id === milestoneId);
        if (milestoneIndex === -1) {
          return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
        }

        // Mark all tasks as done and milestone as completed
        milestones[milestoneIndex].status = 'completed';
        milestones[milestoneIndex].tasks = milestones[milestoneIndex].tasks.map((t: any) => ({ ...t, done: true }));

        // Unlock next milestone
        if (milestoneIndex + 1 < milestones.length && milestones[milestoneIndex + 1].status === 'locked') {
          milestones[milestoneIndex + 1].status = 'in_progress';
        }

        const { error: updateErr } = await supabase
          .from('roadmaps')
          .update({ milestones_data: milestones })
          .eq('id', roadmapId)
          .eq('user_id', user.id);

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
        return NextResponse.json({ success: true, milestones });
      }

      case 'toggle_task': {
        // Get the roadmap
        const { data: roadmap, error: fetchErr } = await supabase
          .from('roadmaps')
          .select('milestones_data')
          .eq('id', roadmapId)
          .eq('user_id', user.id)
          .single();

        if (fetchErr || !roadmap) {
          return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
        }

        const ms = roadmap.milestones_data as any[];
        const mIdx = ms.findIndex((m: any) => m.id === milestoneId);
        if (mIdx === -1) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });

        if (taskIndex >= 0 && taskIndex < ms[mIdx].tasks.length) {
          const task = ms[mIdx].tasks[taskIndex];
          const isCompleting = !task.done;
          
          if (isCompleting) {
            // Check 1-task-per-day limit across ALL milestones
            const todayIST = getISTDateString();
            let hasCompletedToday = false;
            
            for (const m of ms) {
              if (m.tasks) {
                for (const t of m.tasks) {
                  if (t.done && t.completedAt && getISTDateString(new Date(t.completedAt)) === todayIST) {
                    hasCompletedToday = true;
                    break;
                  }
                }
              }
              if (hasCompletedToday) break;
            }
            
            if (hasCompletedToday) {
              return NextResponse.json({ error: "You've already completed a milestone task today. Come back tomorrow!" }, { status: 403 });
            }
            
            task.done = true;
            task.completedAt = new Date().toISOString();
          } else {
            task.done = false;
            task.completedAt = null;
          }
          
          // Auto-complete milestone if all tasks done
          const allDone = ms[mIdx].tasks.every((t: any) => t.done);
          if (allDone) {
            ms[mIdx].status = 'completed';
            // Unlock next
            if (mIdx + 1 < ms.length && ms[mIdx + 1].status === 'locked') {
              ms[mIdx + 1].status = 'in_progress';
            }
          } else if (ms[mIdx].status === 'completed') {
            // Unchecking a task reverts completion
            ms[mIdx].status = 'in_progress';
          }
        }

        const { error: updateErr } = await supabase
          .from('roadmaps')
          .update({ milestones_data: ms })
          .eq('id', roadmapId)
          .eq('user_id', user.id);

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
        return NextResponse.json({ success: true, milestones: ms });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('[Roadmap API] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update roadmap' }, { status: 500 });
  }
}

/**
 * Generate a sensible fallback roadmap when the AI fails.
 */
function generateFallbackRoadmap(targetRole: string, missingSkills: string): any[] {
  const skills = missingSkills.split(',').map(s => s.trim()).filter(Boolean);
  const chunkSize = Math.max(1, Math.ceil(skills.length / 4));
  
  const milestones = [];
  for (let i = 0; i < 4; i++) {
    const chunk = skills.slice(i * chunkSize, (i + 1) * chunkSize);
    if (chunk.length === 0 && i > 0) break;
    
    milestones.push({
      title: i === 0 ? `${targetRole} Foundations` : 
             i === 1 ? 'Core Skills Development' :
             i === 2 ? 'Advanced Techniques' : 'Capstone & Portfolio',
      description: i === 0 ? `Build a strong foundation in the core skills needed for ${targetRole}.` :
                   i === 1 ? 'Develop proficiency in the essential tools and frameworks.' :
                   i === 2 ? 'Master advanced concepts and real-world applications.' :
                   'Build a portfolio project and prepare for interviews.',
      weekRange: `Week ${i * 2 + 1}-${i * 2 + 2}`,
      status: i === 0 ? 'in_progress' : 'locked',
      skills: chunk.length > 0 ? chunk : ['General Knowledge'],
      project: i === 0 ? 'Setup development environment and complete first tutorial' :
               i === 1 ? 'Build a small working prototype' :
               i === 2 ? 'Contribute to an open-source project' :
               `Build a complete ${targetRole} portfolio project`,
      tasks: [
        { title: `Study ${chunk[0] || targetRole} fundamentals`, done: false },
        { title: 'Complete hands-on exercises', done: false },
        { title: 'Build a mini-project', done: false },
        { title: 'Review and document learnings', done: false },
      ],
    });
  }
  
  return milestones;
}
