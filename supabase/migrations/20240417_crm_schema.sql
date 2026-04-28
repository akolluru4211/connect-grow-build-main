-- Create CRM Interaction Tracking
CREATE TABLE IF NOT EXISTS public.crm_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    target_user_id UUID REFERENCES public.profiles(id),
    type TEXT NOT NULL, -- 'call', 'email', 'meeting', 'placement_offer'
    notes TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;

-- Admin Policy
CREATE POLICY "Admins can manage CRM interactions" ON public.crm_interactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Placement Pipeline tracking
CREATE TABLE IF NOT EXISTS public.placement_pipeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.profiles(id),
    company_id UUID REFERENCES public.profiles(id), -- If company has a profile
    job_id UUID REFERENCES public.jobs(id),
    stage TEXT NOT NULL DEFAULT 'shortlisted', -- 'shortlisted', 'interviewing', 'offered', 'placed', 'rejected'
    priority TEXT DEFAULT 'medium',
    expected_salary TEXT,
    last_updated TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.placement_pipeline ENABLE ROW LEVEL SECURITY;

-- Admin Policy for Pipeline
CREATE POLICY "Admins can manage placement pipeline" ON public.placement_pipeline
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
