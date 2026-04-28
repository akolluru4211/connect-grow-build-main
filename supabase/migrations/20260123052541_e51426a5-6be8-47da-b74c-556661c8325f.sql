-- Fix profiles table exposure by removing overly permissive policy
-- and keeping only necessary access

-- Drop the overly permissive policy that exposes all profiles to authenticated users
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Drop duplicate policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Keep only necessary policies:
-- 1. Users can view their own profile (already exists as "Users can view their own profile")
-- 2. Users can update their own profile (already exists)
-- 3. Admins can view all profiles for admin operations

-- Add admin policy to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Note: For viewing other users' public information, the application should use
-- the profiles_public view which only exposes: id, full_name, headline, avatar_url, is_mentor, is_freelancer