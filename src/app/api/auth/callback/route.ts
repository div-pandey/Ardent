import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { writeQuery } from '@/lib/neo4j/driver';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/home';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      // Ensure the Neo4j User Node exists
      try {
        await writeQuery(
          `
          MERGE (u:User {id: $userId})
          ON CREATE SET u.email = $email, u.name = $name, u.createdAt = datetime()
          `,
          {
            userId: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          }
        );
      } catch (err) {
        console.error('Failed to create/merge Neo4j User node during OAuth callback:', err);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
