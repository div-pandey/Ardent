import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function DELETE() {
  try {
    // 1. Get the current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;

    // 2. Delete all user data from Supabase tables
    //    Order matters due to foreign key constraints (children first)
    const userDataTables = [
      'daily_tasks',
      'milestones',
      'roadmaps',
      'ai_messages',
      'ai_conversations',
      'career_paths',
      'job_analyses',
      'user_skills',
      'progress_tracking',
      'resumes',
    ];

    for (const table of userDataTables) {
      await supabase.from(table).delete().eq('user_id', userId);
    }

    // Delete profile (uses 'id' column, not 'user_id')
    await supabase.from('profiles').delete().eq('id', userId);

    // 3. Delete the auth user using the service role (admin) client
    const adminSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete account. Please contact support.' },
        { status: 500 }
      );
    }

    // 4. Sign out the current session
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
