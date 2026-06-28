-- Migration 007: Certificates of Completion

CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    roadmap_title TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    unique_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued')),
    issued_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT one_cert_per_roadmap UNIQUE (roadmap_id)
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own certificates" 
    ON public.certificates FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view issued certificates" 
    ON public.certificates FOR SELECT 
    USING (status = 'issued');

CREATE POLICY "Users can insert their own draft certificates" 
    ON public.certificates FOR INSERT 
    WITH CHECK (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Users can update their own draft certificates" 
    ON public.certificates FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
