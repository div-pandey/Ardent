import { createClient } from '@/lib/supabase/server';
import { getUserGraph } from '@/services/graph.service';
import ClientHomePage from './client-page';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let graphData: any = { nodes: [], edges: [] };
  try {
    graphData = await getUserGraph(user.id);
  } catch (error) {
    console.error('Failed to fetch graph data for home page:', error);
  }

  // Serialize to remove Neo4j classes (like Integer) which Next.js blocks
  const serializedGraph = JSON.parse(JSON.stringify(graphData));

  return <ClientHomePage initialGraphData={serializedGraph} />;
}
