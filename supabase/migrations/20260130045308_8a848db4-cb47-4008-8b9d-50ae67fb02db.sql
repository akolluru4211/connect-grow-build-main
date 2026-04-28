-- Create a function to send notification when user subscribes to newsletter
CREATE OR REPLACE FUNCTION public.notify_newsletter_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a notification for welcome message
  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT id, 'system', 'Welcome to EdWorld Newsletter!', 
         'Thank you for subscribing! You''ll receive updates on jobs, courses, and career tips.',
         '/settings'
  FROM auth.users 
  WHERE email = NEW.email
  LIMIT 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_newsletter_subscription ON public.newsletter_subscribers;
CREATE TRIGGER on_newsletter_subscription
AFTER INSERT ON public.newsletter_subscribers
FOR EACH ROW EXECUTE FUNCTION public.notify_newsletter_subscription();

-- Add push_notifications column to user_settings if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'push_notifications') THEN
    ALTER TABLE public.user_settings ADD COLUMN push_notifications BOOLEAN DEFAULT true;
  END IF;
END $$;