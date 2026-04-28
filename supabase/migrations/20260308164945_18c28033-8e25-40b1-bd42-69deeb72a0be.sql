
-- Code rooms for "Code with EdWorld" feature
CREATE TABLE public.code_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL DEFAULT 'javascript',
  code_content TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  study_group_id UUID REFERENCES public.study_groups(id) ON DELETE SET NULL,
  share_code TEXT NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.code_rooms ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view public rooms or rooms they created
CREATE POLICY "Users can view own and public rooms" ON public.code_rooms
  FOR SELECT TO authenticated
  USING (is_public = true OR created_by = auth.uid());

-- Users can create rooms
CREATE POLICY "Users can create rooms" ON public.code_rooms
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Only creator can update
CREATE POLICY "Creator can update room" ON public.code_rooms
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

-- Only creator can delete
CREATE POLICY "Creator can delete room" ON public.code_rooms
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.code_rooms;
