-- ============================================
-- Add columns for AI-generated roadmap storage
-- ============================================

-- Make career_path_id optional (AI roadmaps don't always have a career path)
ALTER TABLE public.roadmaps ALTER COLUMN career_path_id DROP NOT NULL;

-- Add target_role to roadmaps
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS target_role TEXT;

-- Add milestones_data JSONB column to store entire milestone tree
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS milestones_data JSONB DEFAULT '[]'::jsonb;

-- Make total_weeks optional
ALTER TABLE public.roadmaps ALTER COLUMN total_weeks DROP NOT NULL;
ALTER TABLE public.roadmaps ALTER COLUMN total_weeks SET DEFAULT 0;
