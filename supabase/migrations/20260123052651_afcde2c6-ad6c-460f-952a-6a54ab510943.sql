-- Fix user_skills table public exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "User skills are viewable by everyone" ON public.user_skills;

-- Create restrictive policies
-- Users can view their own skills
CREATE POLICY "Users can view own skills"
  ON public.user_skills FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all skills
CREATE POLICY "Admins can view all skills"
  ON public.user_skills FOR SELECT
  USING (has_role(auth.uid(), 'admin'));