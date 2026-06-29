'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { writeQuery } from '@/lib/neo4j/driver';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/home');
  redirect('/home');
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Create Neo4j User Node using the Supabase UUID
  if (data.user?.id) {
    try {
      await writeQuery(
        `
        MERGE (u:User {id: $userId})
        ON CREATE SET u.email = $email, u.name = $name, u.createdAt = datetime()
        `,
        {
          userId: data.user.id,
          email: email,
          name: fullName || email.split('@')[0],
        }
      );
    } catch (err) {
      console.error('Failed to create Neo4j User node:', err);
      // We don't fail the entire signup if Neo4j is temporarily down,
      // but in production we'd want a retry mechanism or webhook.
    }
  }

  return { success: true, requireEmailVerification: !data.session };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
