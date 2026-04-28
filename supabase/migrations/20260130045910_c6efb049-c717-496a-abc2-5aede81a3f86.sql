-- Create function to notify users about new jobs
CREATE OR REPLACE FUNCTION public.notify_new_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for all users who have job alerts enabled
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT 
    us.user_id,
    'job_application',
    'New Job Posted: ' || NEW.title,
    COALESCE((SELECT name FROM companies WHERE id = NEW.company_id), 'A company') || ' is hiring! Check out this opportunity.',
    '/jobs?selected=' || NEW.id
  FROM public.user_settings us
  WHERE us.job_alerts = true OR us.job_alerts IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_job_posted ON public.jobs;
CREATE TRIGGER on_new_job_posted
AFTER INSERT ON public.jobs
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION public.notify_new_job();

-- Create function to notify users about new courses
CREATE OR REPLACE FUNCTION public.notify_new_course()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT 
    us.user_id,
    'blog',
    'New Course Available: ' || NEW.title,
    'A new ' || NEW.difficulty || ' level course in ' || NEW.category || ' is now available!',
    '/courses?selected=' || NEW.id
  FROM public.user_settings us
  WHERE us.email_notifications = true OR us.email_notifications IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_course_published ON public.courses;
CREATE TRIGGER on_new_course_published
AFTER INSERT ON public.courses
FOR EACH ROW
WHEN (NEW.is_published = true)
EXECUTE FUNCTION public.notify_new_course();

-- Create function to notify users about new events
CREATE OR REPLACE FUNCTION public.notify_new_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT 
    us.user_id,
    'event',
    'New Event: ' || NEW.title,
    NEW.event_type || ' event on ' || to_char(NEW.start_date::timestamp, 'Mon DD, YYYY') || '. Don''t miss it!',
    '/events?selected=' || NEW.id
  FROM public.user_settings us
  WHERE us.event_reminders = true OR us.event_reminders IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_event_created ON public.events;
CREATE TRIGGER on_new_event_created
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_event();

-- Create function to notify users about new internships
CREATE OR REPLACE FUNCTION public.notify_new_internship()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT 
    us.user_id,
    'job_application',
    'New Internship: ' || NEW.title,
    COALESCE((SELECT name FROM companies WHERE id = NEW.company_id), 'A company') || ' posted a ' || NEW.internship_type || ' internship!',
    '/internships?selected=' || NEW.id
  FROM public.user_settings us
  WHERE us.job_alerts = true OR us.job_alerts IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_internship_posted ON public.internships;
CREATE TRIGGER on_new_internship_posted
AFTER INSERT ON public.internships
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION public.notify_new_internship();

-- Create function to notify followers about new blog posts
CREATE OR REPLACE FUNCTION public.notify_new_blog_post()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify followers of the author
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT 
    uf.follower_id,
    'blog',
    'New Post from ' || COALESCE((SELECT full_name FROM profiles WHERE id = NEW.author_id), 'Someone you follow'),
    NEW.title,
    '/blogs/' || NEW.slug
  FROM public.user_follows uf
  WHERE uf.following_id = NEW.author_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_new_blog_post ON public.blog_posts;
CREATE TRIGGER on_new_blog_post
AFTER INSERT ON public.blog_posts
FOR EACH ROW
WHEN (NEW.is_published = true)
EXECUTE FUNCTION public.notify_new_blog_post();