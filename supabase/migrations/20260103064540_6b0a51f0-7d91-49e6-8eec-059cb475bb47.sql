-- Courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor_name TEXT,
  instructor_avatar TEXT,
  thumbnail_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  duration_hours INTEGER DEFAULT 0,
  lessons_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  is_free BOOLEAN DEFAULT true,
  price DECIMAL(10,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published courses are viewable by everyone" ON public.courses
FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage courses" ON public.courses
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Course lessons
CREATE TABLE public.course_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  content TEXT,
  duration_minutes INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessons of published courses are viewable" ON public.course_lessons
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND is_published = true)
);

CREATE POLICY "Admins can manage lessons" ON public.course_lessons
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Course enrollments
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0,
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their enrollments" ON public.course_enrollments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses" ON public.course_enrollments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their enrollments" ON public.course_enrollments
FOR UPDATE USING (auth.uid() = user_id);

-- Lesson progress
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  watched_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their progress" ON public.lesson_progress
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can track their progress" ON public.lesson_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their progress" ON public.lesson_progress
FOR UPDATE USING (auth.uid() = user_id);

-- Email notifications log
CREATE TABLE public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their email notifications" ON public.email_notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert email notifications" ON public.email_notifications
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin activity log
CREATE TABLE public.admin_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log" ON public.admin_activity_log
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create activity log" ON public.admin_activity_log
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- System settings
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System settings viewable by admins" ON public.system_settings
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage settings" ON public.system_settings
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Triggers
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON public.course_lessons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample courses
INSERT INTO public.courses (title, description, instructor_name, category, difficulty, duration_hours, lessons_count, is_published, is_free) VALUES
('Introduction to Web Development', 'Learn the fundamentals of HTML, CSS, and JavaScript', 'John Smith', 'development', 'beginner', 10, 15, true, true),
('React Mastery', 'Master React.js from beginner to advanced', 'Jane Doe', 'development', 'intermediate', 20, 30, true, false),
('Career Development Skills', 'Essential skills for professional growth', 'Mike Johnson', 'career', 'beginner', 5, 10, true, true);

-- Insert sample lessons for first course
INSERT INTO public.course_lessons (course_id, title, description, duration_minutes, order_index, is_free_preview)
SELECT id, 'Introduction to HTML', 'Learn the basics of HTML structure', 30, 1, true
FROM public.courses WHERE title = 'Introduction to Web Development';

INSERT INTO public.course_lessons (course_id, title, description, duration_minutes, order_index, is_free_preview)
SELECT id, 'CSS Fundamentals', 'Style your web pages with CSS', 45, 2, false
FROM public.courses WHERE title = 'Introduction to Web Development';

INSERT INTO public.course_lessons (course_id, title, description, duration_minutes, order_index, is_free_preview)
SELECT id, 'JavaScript Basics', 'Add interactivity with JavaScript', 60, 3, false
FROM public.courses WHERE title = 'Introduction to Web Development';