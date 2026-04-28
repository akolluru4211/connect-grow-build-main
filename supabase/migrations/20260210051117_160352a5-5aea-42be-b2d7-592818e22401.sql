
-- Resource Library tables
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL DEFAULT 'notes',
  subject TEXT NOT NULL,
  file_url TEXT,
  external_link TEXT,
  tags TEXT[],
  uploaded_by UUID NOT NULL,
  college_name TEXT,
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Auth users can upload resources" ON public.resources FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users can update own resources" ON public.resources FOR UPDATE USING (auth.uid() = uploaded_by);
CREATE POLICY "Users can delete own resources" ON public.resources FOR DELETE USING (auth.uid() = uploaded_by);

CREATE TABLE public.resource_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(resource_id, user_id)
);

ALTER TABLE public.resource_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON public.resource_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like" ON public.resource_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.resource_likes FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for resources
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view resource files" ON storage.objects FOR SELECT USING (bucket_id = 'resources');
CREATE POLICY "Auth users can upload resource files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Career counseling chat history
CREATE TABLE public.career_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.career_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own chats" ON public.career_chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own chats" ON public.career_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own chats" ON public.career_chat_messages FOR DELETE USING (auth.uid() = user_id);
