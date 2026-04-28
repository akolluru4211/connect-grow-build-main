-- Fix SECURITY DEFINER view issue by using SECURITY INVOKER
-- Drop and recreate the view with proper security model

DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS
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