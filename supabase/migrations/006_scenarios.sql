-- ============================================
-- Day in the Life Scenarios System
-- ============================================

CREATE TABLE IF NOT EXISTS public.scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    feedback JSONB,
    score INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scenario_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_events ENABLE ROW LEVEL SECURITY;

-- Policies for scenarios
CREATE POLICY "Users can view their own scenarios" 
ON public.scenarios FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scenarios" 
ON public.scenarios FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios" 
ON public.scenarios FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies for scenario_events
CREATE POLICY "Users can view events of their scenarios" 
ON public.scenario_events FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.scenarios 
        WHERE id = scenario_events.scenario_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert events to their scenarios" 
ON public.scenario_events FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.scenarios 
        WHERE id = scenario_events.scenario_id AND user_id = auth.uid()
    )
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_scenarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_scenarios_updated_at
BEFORE UPDATE ON public.scenarios
FOR EACH ROW
EXECUTE FUNCTION update_scenarios_updated_at();
