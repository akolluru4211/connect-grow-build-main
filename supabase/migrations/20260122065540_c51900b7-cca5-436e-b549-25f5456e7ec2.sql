-- Create a function to send achievement notification
CREATE OR REPLACE FUNCTION public.notify_achievement_unlock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement_record RECORD;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Get achievement details
  SELECT name, description, icon, points INTO achievement_record
  FROM public.achievements
  WHERE id = NEW.achievement_id;

  -- Get user details
  SELECT email, full_name INTO user_email, user_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Insert in-app notification
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.user_id,
    'badge',
    'Achievement Unlocked! 🏆',
    'You earned the "' || achievement_record.name || '" badge! ' || achievement_record.description,
    '/achievements'
  );

  RETURN NEW;
END;
$$;

-- Create trigger to fire on new achievement unlock
DROP TRIGGER IF EXISTS on_achievement_unlock ON public.user_achievements;
CREATE TRIGGER on_achievement_unlock
  AFTER INSERT ON public.user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_achievement_unlock();