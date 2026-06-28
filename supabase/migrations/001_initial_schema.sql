-- Ardent: Supabase PostgreSQL Migration
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  avatar_url      TEXT,
  bio             TEXT,
  "current_role"  TEXT,
  target_role     TEXT,
  experience_level TEXT CHECK (experience_level IN ('student', 'entry', 'mid', 'senior', 'lead')),
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 3. RESUMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.resumes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  filename        TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_size       INTEGER NOT NULL,
  mime_type       TEXT NOT NULL,
  raw_text        TEXT,
  parsed_skills   JSONB DEFAULT '[]'::jsonb,
  parsed_roles    JSONB DEFAULT '[]'::jsonb,
  parsed_projects JSONB DEFAULT '[]'::jsonb,
  parsed_education JSONB DEFAULT '[]'::jsonb,
  parsed_certifications JSONB DEFAULT '[]'::jsonb,
  resume_score    INTEGER CHECK (resume_score >= 0 AND resume_score <= 100),
  is_primary      BOOLEAN DEFAULT false,
  parsing_status  TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'parsing', 'completed', 'failed')),
  parsing_error   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own resumes" ON public.resumes FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER resumes_updated_at BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 4. CAREER PATHS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.career_paths (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  "current_role"  TEXT NOT NULL,
  target_role     TEXT NOT NULL,
  selected_route  JSONB NOT NULL,
  all_routes      JSONB NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  readiness_score INTEGER DEFAULT 0 CHECK (readiness_score >= 0 AND readiness_score <= 100),
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_career_paths_user ON public.career_paths(user_id, is_active) WHERE is_active = true;
ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own paths" ON public.career_paths FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER career_paths_updated_at BEFORE UPDATE ON public.career_paths FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 5. ROADMAPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  career_path_id  UUID NOT NULL REFERENCES public.career_paths(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  total_weeks     INTEGER NOT NULL,
  total_milestones INTEGER NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  started_at      TIMESTAMPTZ DEFAULT now(),
  estimated_completion TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own roadmaps" ON public.roadmaps FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 6. MILESTONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id      UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  week_start      INTEGER NOT NULL,
  week_end        INTEGER NOT NULL,
  order_index     INTEGER NOT NULL,
  skills_covered  JSONB DEFAULT '[]'::jsonb,
  status          TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'in_progress', 'completed', 'skipped')),
  project         JSONB,
  resources       JSONB DEFAULT '[]'::jsonb,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_milestones_roadmap ON public.milestones(roadmap_id, order_index);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own milestones" ON public.milestones FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 7. DAILY TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id    UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_number      INTEGER NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  is_completed    BOOLEAN DEFAULT false,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own tasks" ON public.daily_tasks FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 8. AI CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT DEFAULT 'New Conversation',
  summary         TEXT,
  message_count   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 9. AI MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  "role"          TEXT NOT NULL CHECK ("role" IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  context_snapshot JSONB,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_ai_messages_conversation ON public.ai_messages(conversation_id, created_at);
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own messages" ON public.ai_messages FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 10. USER SKILLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_skills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name      TEXT NOT NULL,
  category        TEXT,
  proficiency     TEXT DEFAULT 'beginner' CHECK (proficiency IN ('beginner', 'intermediate', 'advanced')),
  "source"        TEXT DEFAULT 'manual' CHECK ("source" IN ('manual', 'resume', 'onboarding')),
  is_verified     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, skill_name)
);

ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own skills" ON public.user_skills FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 11. PROGRESS TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.progress_tracking (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tracked_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  readiness_score INTEGER DEFAULT 0,
  skills_total    INTEGER DEFAULT 0,
  skills_completed INTEGER DEFAULT 0,
  milestones_total INTEGER DEFAULT 0,
  milestones_completed INTEGER DEFAULT 0,
  streak_count    INTEGER DEFAULT 0,
  activities      JSONB DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, tracked_date)
);

ALTER TABLE public.progress_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users CRUD own progress" ON public.progress_tracking FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 12. STORAGE BUCKET FOR RESUMES
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload own resumes" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own resumes" ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own resumes" ON storage.objects FOR DELETE
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
