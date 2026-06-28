-- ============================================
-- Mock Interviews System
-- ============================================

CREATE TABLE IF NOT EXISTS public.mock_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    feedback JSONB,
    score INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interview_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES public.mock_interviews(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_messages ENABLE ROW LEVEL SECURITY;

-- Policies for mock_interviews
CREATE POLICY "Users can view their own interviews" 
ON public.mock_interviews FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interviews" 
ON public.mock_interviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interviews" 
ON public.mock_interviews FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies for interview_messages
CREATE POLICY "Users can view messages of their interviews" 
ON public.interview_messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.mock_interviews 
        WHERE id = interview_messages.interview_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert messages to their interviews" 
ON public.interview_messages FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.mock_interviews 
        WHERE id = interview_messages.interview_id AND user_id = auth.uid()
    )
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_mock_interviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mock_interviews_updated_at
BEFORE UPDATE ON public.mock_interviews
FOR EACH ROW
EXECUTE FUNCTION update_mock_interviews_updated_at();
