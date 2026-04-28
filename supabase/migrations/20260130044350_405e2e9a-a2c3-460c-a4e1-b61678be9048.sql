-- Create student_projects table for project sharing and collaboration
CREATE TABLE public.student_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  project_url TEXT,
  github_url TEXT,
  cover_image_url TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  looking_for TEXT[] DEFAULT '{}', -- Roles they're looking for (e.g., 'Frontend Developer', 'UI Designer')
  team_size INTEGER DEFAULT 1,
  max_team_size INTEGER DEFAULT 5,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'closed')),
  college_name TEXT,
  is_featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_collaborators table to track team members
CREATE TABLE public.project_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.student_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create project_comments table
CREATE TABLE public.project_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.student_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_likes table
CREATE TABLE public.project_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.student_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create ai_generated_content table for daily AI content
CREATE TABLE public.ai_generated_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'job_update', 'hackathon_update', 'internship_update')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_projects
CREATE POLICY "Anyone can view projects" ON public.student_projects FOR SELECT USING (true);
CREATE POLICY "Users can create own projects" ON public.student_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.student_projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.student_projects FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for project_collaborators
CREATE POLICY "Anyone can view collaborators" ON public.project_collaborators FOR SELECT USING (true);
CREATE POLICY "Users can apply to projects" ON public.project_collaborators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Project owners can update collaborators" ON public.project_collaborators FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.student_projects WHERE id = project_id AND user_id = auth.uid()));
CREATE POLICY "Users can withdraw applications" ON public.project_collaborators FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for project_comments
CREATE POLICY "Anyone can view comments" ON public.project_comments FOR SELECT USING (true);
CREATE POLICY "Users can add comments" ON public.project_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.project_comments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for project_likes
CREATE POLICY "Anyone can view likes" ON public.project_likes FOR SELECT USING (true);
CREATE POLICY "Users can like projects" ON public.project_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike projects" ON public.project_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_generated_content
CREATE POLICY "Anyone can view published AI content" ON public.ai_generated_content FOR SELECT USING (is_published = true);

-- Create indexes for better performance
CREATE INDEX idx_student_projects_user_id ON public.student_projects(user_id);
CREATE INDEX idx_student_projects_status ON public.student_projects(status);
CREATE INDEX idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_id ON public.project_collaborators(user_id);
CREATE INDEX idx_ai_content_type ON public.ai_generated_content(content_type);
CREATE INDEX idx_ai_content_published ON public.ai_generated_content(is_published);

-- Create trigger for updated_at
CREATE TRIGGER update_student_projects_updated_at
  BEFORE UPDATE ON public.student_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();