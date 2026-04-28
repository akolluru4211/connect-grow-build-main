-- Create gamification tables for activity tracking, streaks, and rewards

-- Activity points table
CREATE TABLE public.user_activity_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity_points ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity
CREATE POLICY "Users can view own activity" ON public.user_activity_points
    FOR SELECT USING (auth.uid() = user_id);

-- System can insert activity (via edge functions)
CREATE POLICY "System can insert activity" ON public.user_activity_points
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User streaks table
CREATE TABLE public.user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    total_points INTEGER NOT NULL DEFAULT 0,
    profile_completion_percent INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Users can view all streaks (for leaderboard)
CREATE POLICY "Anyone can view streaks" ON public.user_streaks
    FOR SELECT USING (true);

-- Users can manage own streak
CREATE POLICY "Users can update own streak" ON public.user_streaks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak" ON public.user_streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Job fair events table
CREATE TABLE public.job_fair_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('job_fair', 'live_interview', 'employer_panel', 'workshop')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    virtual_link TEXT,
    host_company_id UUID REFERENCES public.companies(id),
    max_participants INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_fair_events ENABLE ROW LEVEL SECURITY;

-- Anyone can view active job fair events
CREATE POLICY "Anyone can view active events" ON public.job_fair_events
    FOR SELECT USING (is_active = true);

-- Job fair registrations
CREATE TABLE public.job_fair_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.job_fair_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.job_fair_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view own registrations
CREATE POLICY "Users can view own registrations" ON public.job_fair_registrations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can register themselves
CREATE POLICY "Users can register" ON public.job_fair_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can cancel own registration
CREATE POLICY "Users can update own registration" ON public.job_fair_registrations
    FOR UPDATE USING (auth.uid() = user_id);

-- User language preferences
CREATE TABLE public.user_language_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_language_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage own preferences
CREATE POLICY "Users can view own preferences" ON public.user_language_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_language_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_language_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Insert sample job fair events
INSERT INTO public.job_fair_events (title, description, event_type, start_time, end_time, virtual_link, max_participants) VALUES
('TechCorp Virtual Hiring Day', 'Join us for exclusive interviews with TechCorp recruiters. Multiple roles available in engineering and product.', 'live_interview', now() + interval '3 days', now() + interval '3 days' + interval '4 hours', 'https://meet.example.com/techcorp-hiring', 50),
('Startup Founders Panel', 'Hear from successful startup founders about career opportunities in the startup ecosystem.', 'employer_panel', now() + interval '5 days', now() + interval '5 days' + interval '2 hours', 'https://meet.example.com/startup-panel', 200),
('Resume Building Workshop', 'Learn how to craft the perfect resume with expert career coaches.', 'workshop', now() + interval '7 days', now() + interval '7 days' + interval '1 hour', 'https://meet.example.com/resume-workshop', 100),
('Multi-Company Job Fair 2025', 'Connect with 20+ companies hiring for various roles. Live Q&A sessions with HR managers.', 'job_fair', now() + interval '14 days', now() + interval '14 days' + interval '6 hours', 'https://meet.example.com/job-fair-2025', 500);

-- Function to update user points
CREATE OR REPLACE FUNCTION public.update_user_points()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_streaks (user_id, total_points, last_activity_date, current_streak)
    VALUES (NEW.user_id, NEW.points, CURRENT_DATE, 1)
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = user_streaks.total_points + NEW.points,
        current_streak = CASE 
            WHEN user_streaks.last_activity_date = CURRENT_DATE - 1 THEN user_streaks.current_streak + 1
            WHEN user_streaks.last_activity_date = CURRENT_DATE THEN user_streaks.current_streak
            ELSE 1
        END,
        longest_streak = GREATEST(
            user_streaks.longest_streak,
            CASE 
                WHEN user_streaks.last_activity_date = CURRENT_DATE - 1 THEN user_streaks.current_streak + 1
                ELSE user_streaks.current_streak
            END
        ),
        last_activity_date = CURRENT_DATE,
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically update points
CREATE TRIGGER on_activity_points_insert
    AFTER INSERT ON public.user_activity_points
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_points();