-- Secure blog_likes table to prevent user activity tracking
-- Drop any existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view likes" ON public.blog_likes;
DROP POLICY IF EXISTS "Blog likes are viewable by everyone" ON public.blog_likes;
DROP POLICY IF EXISTS "Likes are publicly viewable" ON public.blog_likes;

-- Users can only view their own likes
CREATE POLICY "Users can view their own likes"
  ON public.blog_likes FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all likes for moderation
CREATE POLICY "Admins can view all likes"
  ON public.blog_likes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));