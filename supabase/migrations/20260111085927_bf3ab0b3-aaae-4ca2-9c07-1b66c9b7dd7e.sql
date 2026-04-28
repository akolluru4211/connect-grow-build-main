-- Create a secure profiles view that respects privacy settings
-- This view will hide email and phone based on user_settings

CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  p.id,
  p.full_name,
  p.headline,
  p.bio,
  p.avatar_url,
  p.banner_url,
  p.location,
  p.website,
  p.linkedin_url,
  p.github_url,
  p.twitter_url,
  p.is_mentor,
  p.is_freelancer,
  p.created_at,
  p.updated_at,
  -- Conditionally expose email based on privacy settings
  CASE 
    WHEN auth.uid() = p.id THEN p.email
    WHEN COALESCE(s.show_email, false) = true THEN p.email
    ELSE NULL
  END as email,
  -- Conditionally expose phone based on privacy settings  
  CASE 
    WHEN auth.uid() = p.id THEN p.phone
    WHEN COALESCE(s.show_phone, false) = true THEN p.phone
    ELSE NULL
  END as phone
FROM public.profiles p
LEFT JOIN public.user_settings s ON s.user_id = p.id;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;

-- Add comment explaining the view
COMMENT ON VIEW public.profiles_public IS 'Public profiles view that respects user privacy settings for email and phone';

-- Update profiles table policies to restrict direct access
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new policies that are more restrictive
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow authenticated users to view basic profile info of others
-- This is needed for author names, connections, etc.
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');