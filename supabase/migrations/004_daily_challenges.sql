-- ============================================
-- Daily Challenges & Streak System
-- ============================================

-- 1. Add streak tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_challenge_date DATE;

-- 2. Create daily_challenges table
CREATE TABLE IF NOT EXISTS public.daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_ist DATE NOT NULL,
    roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE SET NULL,
    task_title TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, date_ist)
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- Policies for daily_challenges
CREATE POLICY "Users can view their own challenges" 
ON public.daily_challenges FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges" 
ON public.daily_challenges FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges" 
ON public.daily_challenges FOR UPDATE 
USING (auth.uid() = user_id);
