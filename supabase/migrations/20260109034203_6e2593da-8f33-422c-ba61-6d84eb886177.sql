-- Add banner_url to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;

-- Add scheduled_at to blog_posts for post scheduling
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone;