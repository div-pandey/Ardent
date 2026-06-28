import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ClientLayout from './client-layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Check Supabase profile first (fast, reliable)
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single();

  // 2. If onboarding not completed, redirect immediately (no Neo4j needed)
  if (!profile?.onboarding_completed) {
    redirect('/onboarding');
  }

  return <ClientLayout>{children}</ClientLayout>;
}
