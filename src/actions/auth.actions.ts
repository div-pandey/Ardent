'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function loginAction(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/home');
}

export async function registerAction(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('fullName') as string,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/home');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function updateProfile(data: {
  full_name?: string;
  current_role?: string;
  target_role?: string;
  experience_level?: string;
  bio?: string;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  skills?: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };
  
  const { skills, ...profileData } = data;

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...profileData });

  if (error) return { error: error.message };
  
  // Save skills to Supabase if provided
  if (skills && skills.length > 0) {
    // Delete existing onboarding skills for a clean state
    await supabase.from('user_skills')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'onboarding');
      
    // Insert new skills
    const skillRows = skills.map(skill => ({
      user_id: user.id,
      skill_name: skill,
      proficiency: 'intermediate',
      source: 'onboarding',
      is_verified: true,
    }));
    
    const { error: skillsError } = await supabase.from('user_skills').insert(skillRows);
    if (skillsError) {
      console.error('Failed to save user_skills:', skillsError);
    }
  }

  revalidatePath('/', 'layout');
  return { success: true };
}
