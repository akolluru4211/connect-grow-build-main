-- Fix education table public exposure
-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view education" ON public.education;
DROP POLICY IF EXISTS "Public can view education" ON public.education;
DROP POLICY IF EXISTS "Education is viewable by everyone" ON public.education;

-- Create restrictive policies
-- Users can view their own education records
CREATE POLICY "Users can view own education"
  ON public.education FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all education records
CREATE POLICY "Admins can view all education"
  ON public.education FOR SELECT
  USING (has_role(auth.uid(), 'admin'));