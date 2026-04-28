-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  category TEXT NOT NULL DEFAULT 'general',
  points INTEGER NOT NULL DEFAULT 50,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Achievements are viewable by everyone"
  ON public.achievements FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can award achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, points) VALUES
  ('First Steps', 'Complete your profile setup', 'user-check', 'profile', 'profile_complete', 1, 25),
  ('Resume Master', 'Create your first resume', 'file-text', 'resume', 'resume_created', 1, 50),
  ('Job Hunter', 'Apply to your first job', 'briefcase', 'jobs', 'job_applied', 1, 50),
  ('Interview Ready', 'Complete your first interview prep', 'mic', 'interview', 'interview_prep', 1, 75),
  ('Cover Letter Pro', 'Generate your first cover letter', 'mail', 'resume', 'cover_letter', 1, 50),
  ('Mock Master', 'Complete your first mock interview', 'video', 'interview', 'mock_interview', 1, 100),
  ('Consistent', 'Maintain a 3-day streak', 'flame', 'engagement', 'streak', 3, 50),
  ('Dedicated', 'Maintain a 7-day streak', 'flame', 'engagement', 'streak', 7, 100),
  ('Unstoppable', 'Maintain a 30-day streak', 'flame', 'engagement', 'streak', 30, 500),
  ('Skill Builder', 'Complete 3 skill assessments', 'award', 'learning', 'assessment_completed', 3, 100),
  ('Networker', 'Make 5 connections', 'users', 'social', 'connection_made', 5, 75),
  ('Blogger', 'Publish your first blog post', 'pen-tool', 'social', 'post_published', 1, 50),
  ('Event Enthusiast', 'Register for 3 events', 'calendar', 'events', 'event_registered', 3, 75),
  ('Point Collector', 'Earn 500 total points', 'star', 'general', 'total_points', 500, 100),
  ('Point Master', 'Earn 2000 total points', 'trophy', 'general', 'total_points', 2000, 250);