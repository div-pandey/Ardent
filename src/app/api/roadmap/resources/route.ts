import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TIER_CONFIG, SKILL_RESOURCES, type TierName } from '@/lib/tiers';
import { chatCompletion } from '@/lib/sarvam/client';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { milestoneTitle, skills } = await request.json();
    if (!milestoneTitle || !skills || !Array.isArray(skills)) {
      return NextResponse.json({ error: 'Missing milestone data' }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = (profile?.subscription_tier || 'free') as TierName;
    const tierConfig = TIER_CONFIG[tier];

    // Only 'max' tier can use AI for resources
    if (tierConfig.resourceAccess !== 'ai') {
      return NextResponse.json({ error: 'AI resources require Max plan.' }, { status: 403 });
    }

    // Attempt to pull from pre-mapped database first for fast hits
    const mappedResources: any[] = [];
    skills.forEach(skill => {
      if (SKILL_RESOURCES[skill]) {
        mappedResources.push(...SKILL_RESOURCES[skill]);
      }
    });

    // If we have some mapped, we can augment with AI, or just use AI for everything else
    const prompt = `You are an expert technical mentor. The user is learning for milestone: "${milestoneTitle}".
The specific skills covered are: ${skills.join(', ')}.

Please recommend exactly 3 highly relevant, high-quality learning resources (documentation, free courses, articles, or videos).
Format your response as a pure JSON array containing objects with these exact keys:
[{"title": "string", "url": "string (must be a valid URL)", "type": "doc" | "video" | "course" | "article"}]

No explanation, no markdown blocks. Just the raw JSON array.`;

    const aiText = await chatCompletion([
      { role: 'system', content: prompt }
    ]);

    let aiResources: any[] = [];
    try {
      const cleaned = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      aiResources = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse AI resources:', aiText);
      // Fallback if parsing fails
      aiResources = [
        { title: `${skills[0] || 'Skill'} Official Documentation`, url: `https://www.google.com/search?q=${encodeURIComponent((skills[0] || '') + ' official documentation')}`, type: 'doc' },
      ];
    }

    // Deduplicate and combine
    const combined = [...mappedResources, ...aiResources];
    const unique = Array.from(new Set(combined.map(r => r.url)))
      .map(url => combined.find(r => r.url === url))
      .slice(0, 8); // return top 8 resources

    return NextResponse.json({ success: true, resources: unique });
  } catch (error) {
    console.error('Resources API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}
