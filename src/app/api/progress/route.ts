import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeSkillGap } from '@/services/graph.service';
import { readQuery } from '@/lib/neo4j/driver';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get Target Role
    const roleQuery = await readQuery<Record<string, any>>(
      `MATCH (u:User {userId: $userId})-[:TARGETS_ROLE]->(tr:Role) RETURN tr.name AS targetRole`,
      { userId: user.id }
    );
    
    const targetRole = roleQuery.length > 0 ? roleQuery[0].targetRole : 'ML Engineer'; // Fallback

    // 2. Get Skill Gap & Readiness
    const skillGap = await analyzeSkillGap(user.id, targetRole);
    
    // 3. Get Total Skills Count
    const skillsQuery = await readQuery<Record<string, any>>(
      `MATCH (u:User {userId: $userId})-[:HAS_SKILL]->(s:Skill) RETURN count(s) AS totalSkills`,
      { userId: user.id }
    );
    
    // Extract integer from Neo4j Integer object
    const rawTotal = skillsQuery[0]?.totalSkills;
    const totalSkills = typeof rawTotal === 'object' && rawTotal !== null ? Number(rawTotal.low) : Number(rawTotal || 0);

    // 4. Get Streak
    const { data: profile } = await supabase.from('profiles').select('current_streak').eq('id', user.id).single();
    const currentStreak = profile?.current_streak || 0;

    // 5. Build Recent Activity
    const activities: any[] = [];

    // - Daily Challenges
    const { data: challenges } = await supabase.from('daily_challenges').select('task_title, created_at').eq('user_id', user.id).eq('is_completed', true).order('created_at', { ascending: false }).limit(3);
    if (challenges) {
      challenges.forEach(c => activities.push({ text: `Completed daily task: "${c.task_title}"`, time: new Date(c.created_at).getTime(), type: 'task' }));
    }

    // - Resumes
    const { data: resumes } = await supabase.from('resumes').select('created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2);
    if (resumes) {
      resumes.forEach(r => activities.push({ text: `Generated ATS-friendly Resume`, time: new Date(r.created_at).getTime(), type: 'resume' }));
    }

    // - Scenarios
    const { data: scenarios } = await supabase.from('scenarios').select('role, created_at').eq('user_id', user.id).eq('status', 'completed').order('created_at', { ascending: false }).limit(2);
    if (scenarios) {
      scenarios.forEach(s => activities.push({ text: `Completed scenario: ${s.role}`, time: new Date(s.created_at).getTime(), type: 'scenario' }));
    }

    // Sort combined activities by time DESC, limit 5
    activities.sort((a, b) => b.time - a.time);
    const recentActivity = activities.slice(0, 5).map(a => {
        // Calculate relative time string
        const diffMs = Date.now() - a.time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        let timeStr = 'Just now';
        if (diffDays > 0) timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        else if (diffHours > 0) timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        else if (diffMins > 0) timeStr = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

        return {
           text: a.text,
           time: timeStr,
           type: a.type
        }
    });

    return NextResponse.json({
      data: {
        readinessScore: skillGap.readinessScore,
        totalSkills,
        targetRole,
        acquiredTargetSkills: skillGap.acquiredCount,
        totalRequiredTargetSkills: skillGap.totalRequired,
        currentStreak,
        recentActivity
      }
    });

  } catch (error) {
    console.error('[Progress API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress stats' }, { status: 500 });
  }
}
