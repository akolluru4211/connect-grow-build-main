
-- 1. Welcome message trigger: send a welcome message from the system when a user signs up
CREATE OR REPLACE FUNCTION public.send_welcome_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  edworld_user_id UUID;
  conv_id UUID;
BEGIN
  -- Find the Edworld admin account (Adarsh Kolluru)
  SELECT id INTO edworld_user_id
  FROM public.profiles
  WHERE full_name ILIKE '%adarsh kolluru%' OR full_name ILIKE '%edworld%'
  LIMIT 1;

  -- If no admin found, skip
  IF edworld_user_id IS NULL OR edworld_user_id = NEW.id THEN
    RETURN NEW;
  END IF;

  -- Create conversation between new user and Edworld
  INSERT INTO public.conversations (participant_1, participant_2, last_message_at)
  VALUES (edworld_user_id, NEW.id, now())
  ON CONFLICT DO NOTHING
  RETURNING id INTO conv_id;

  -- If conversation already exists, find it
  IF conv_id IS NULL THEN
    SELECT id INTO conv_id FROM public.conversations
    WHERE (participant_1 = edworld_user_id AND participant_2 = NEW.id)
       OR (participant_1 = NEW.id AND participant_2 = edworld_user_id)
    LIMIT 1;
  END IF;

  IF conv_id IS NOT NULL THEN
    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (
      conv_id,
      edworld_user_id,
      '👋 Welcome to EdWorld! I''m Adarsh, the founder. We''re thrilled to have you here! Explore jobs, internships, courses, and connect with fellow students. Feel free to message me anytime if you need help. Happy learning! 🚀'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on profile creation (which happens after signup)
CREATE TRIGGER on_profile_created_send_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_message();

-- 2. Study Groups tables
CREATE TABLE public.study_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  college_name TEXT,
  max_members INT DEFAULT 20,
  is_public BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Study groups are viewable by everyone"
  ON public.study_groups FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create study groups"
  ON public.study_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their study groups"
  ON public.study_groups FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their study groups"
  ON public.study_groups FOR DELETE
  USING (auth.uid() = created_by);

CREATE TABLE public.study_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members are viewable by everyone"
  ON public.study_group_members FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join groups"
  ON public.study_group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.study_group_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE public.study_group_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_group_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts viewable by everyone"
  ON public.study_group_posts FOR SELECT USING (true);

CREATE POLICY "Members can post"
  ON public.study_group_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their posts"
  ON public.study_group_posts FOR DELETE
  USING (auth.uid() = author_id);

-- 3. Campus Events table
CREATE TABLE public.campus_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'campus',
  college_name TEXT,
  club_name TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  virtual_link TEXT,
  max_attendees INT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campus_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campus events viewable by everyone"
  ON public.campus_events FOR SELECT USING (true);

CREATE POLICY "Users can create campus events"
  ON public.campus_events FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their events"
  ON public.campus_events FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their events"
  ON public.campus_events FOR DELETE
  USING (auth.uid() = created_by);

CREATE TABLE public.campus_event_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.campus_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'going',
  rsvp_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.campus_event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RSVPs viewable by everyone"
  ON public.campus_event_rsvps FOR SELECT USING (true);

CREATE POLICY "Users can RSVP"
  ON public.campus_event_rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel RSVP"
  ON public.campus_event_rsvps FOR DELETE
  USING (auth.uid() = user_id);
