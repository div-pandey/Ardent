import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserGraph, syncUserSkills, setUserRoles, findCareerPaths, analyzeSkillGap, getSkillRecommendations } from '@/services/graph.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/graph — Retrieve user's career graph
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const graph = await getUserGraph(user.id);
    
    // Inject user name into the User node
    const userName = user.user_metadata?.full_name || user.user_metadata?.first_name || 'You';
    graph.nodes = graph.nodes.map(node => {
      if (node.type === 'user') {
        return { ...node, label: userName };
      }
      return node;
    });

    return NextResponse.json({ data: graph });
  } catch (error) {
    console.error('[Graph API] Error fetching graph:', error);
    return NextResponse.json(
      { error: 'Failed to fetch career graph' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/graph — Update user's graph (sync skills, set roles, etc.)
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'sync_skills': {
        const { skills } = body;
        await syncUserSkills(user.id, skills);
        return NextResponse.json({ data: { success: true } });
      }

      case 'set_roles': {
        const { currentRole, targetRole } = body;
        await setUserRoles(user.id, currentRole, targetRole);
        return NextResponse.json({ data: { success: true } });
      }

      case 'find_paths': {
        const { currentRole, targetRole } = body;
        const paths = await findCareerPaths(user.id, currentRole, targetRole);
        return NextResponse.json({ data: paths });
      }

      case 'skill_gap': {
        const { targetRole } = body;
        const gap = await analyzeSkillGap(user.id, targetRole);
        return NextResponse.json({ data: gap });
      }

      case 'recommendations': {
        const { targetRole, limit } = body;
        const recs = await getSkillRecommendations(user.id, targetRole, limit);
        return NextResponse.json({ data: recs });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Graph API] Error:', error);
    return NextResponse.json(
      { error: 'Graph operation failed' },
      { status: 500 }
    );
  }
}
