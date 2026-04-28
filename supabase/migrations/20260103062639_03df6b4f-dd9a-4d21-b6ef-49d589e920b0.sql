-- Create skill assessments table
CREATE TABLE public.skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'expert')),
  time_limit_minutes INTEGER DEFAULT 30,
  passing_score INTEGER DEFAULT 70,
  questions_count INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create assessment questions table
CREATE TABLE public.assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.skill_assessments(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user assessment attempts table
CREATE TABLE public.assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assessment_id UUID REFERENCES public.skill_assessments(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  time_taken_seconds INTEGER
);

-- Create user badges table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  assessment_id UUID REFERENCES public.skill_assessments(id) ON DELETE CASCADE,
  badge_level TEXT NOT NULL CHECK (badge_level IN ('beginner', 'intermediate', 'expert')),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, skill_id, badge_level)
);

-- Create resumes table
CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  template TEXT DEFAULT 'professional',
  personal_info JSONB,
  summary TEXT,
  experience JSONB,
  education JSONB,
  skills JSONB,
  certifications JSONB,
  projects JSONB,
  custom_sections JSONB,
  ats_score INTEGER,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('job_application', 'message', 'event', 'badge', 'connection', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for skill_assessments (public read)
CREATE POLICY "Assessments are viewable by everyone" ON public.skill_assessments FOR SELECT USING (is_active = true);

-- Policies for assessment_questions (public read during assessment)
CREATE POLICY "Questions are viewable by authenticated users" ON public.assessment_questions FOR SELECT TO authenticated USING (true);

-- Policies for assessment_attempts
CREATE POLICY "Users can view their own attempts" ON public.assessment_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own attempts" ON public.assessment_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for user_badges (public read for profile display)
CREATE POLICY "Badges are viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System can create badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for resumes
CREATE POLICY "Users can view their own resumes" ON public.resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own resumes" ON public.resumes FOR ALL USING (auth.uid() = user_id);

-- Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Update triggers
CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample assessments
INSERT INTO public.skill_assessments (id, skill_id, title, description, difficulty, time_limit_minutes, passing_score, questions_count) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM public.skills WHERE name = 'JavaScript'), 'JavaScript Fundamentals', 'Test your knowledge of JavaScript basics including variables, functions, and control flow.', 'beginner', 15, 70, 5),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', (SELECT id FROM public.skills WHERE name = 'React'), 'React Essentials', 'Assess your understanding of React components, hooks, and state management.', 'intermediate', 20, 75, 5),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', (SELECT id FROM public.skills WHERE name = 'TypeScript'), 'TypeScript Proficiency', 'Advanced TypeScript concepts including generics, utility types, and best practices.', 'expert', 25, 80, 5);

-- Insert sample questions for JavaScript assessment
INSERT INTO public.assessment_questions (assessment_id, question, options, correct_answer, explanation, order_index) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'What keyword is used to declare a constant in JavaScript?', '["var", "let", "const", "define"]', 2, 'The const keyword is used to declare constants that cannot be reassigned.', 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Which method is used to add an element to the end of an array?', '["push()", "pop()", "shift()", "unshift()"]', 0, 'push() adds elements to the end, while unshift() adds to the beginning.', 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'What does === operator check?', '["Value only", "Type only", "Value and type", "Reference"]', 2, 'The strict equality operator (===) checks both value and type.', 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'How do you create a function in JavaScript?', '["function:myFunc()", "function myFunc()", "create myFunc()", "def myFunc()"]', 1, 'Functions are declared using the function keyword followed by the name and parentheses.', 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'What is the output of typeof null?', '["null", "undefined", "object", "boolean"]', 2, 'This is a known quirk in JavaScript - typeof null returns "object".', 5);

-- Insert sample questions for React assessment
INSERT INTO public.assessment_questions (assessment_id, question, options, correct_answer, explanation, order_index) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'What hook is used to manage state in functional components?', '["useEffect", "useState", "useContext", "useReducer"]', 1, 'useState is the primary hook for managing local state in functional components.', 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'When does useEffect run by default?', '["Only on mount", "Only on unmount", "After every render", "Never"]', 2, 'Without a dependency array, useEffect runs after every render.', 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'What is the correct way to conditionally render in React?', '["if/else in JSX", "Ternary operator", "for loop", "while loop"]', 1, 'Ternary operators and logical && are commonly used for conditional rendering in JSX.', 3),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'What does the key prop help React do?', '["Style elements", "Identify list items", "Create events", "Define types"]', 1, 'Keys help React identify which items have changed, been added, or removed.', 4),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Which hook provides access to the React context?', '["useState", "useEffect", "useContext", "useMemo"]', 2, 'useContext is used to consume context values in functional components.', 5);

-- Insert sample questions for TypeScript assessment
INSERT INTO public.assessment_questions (assessment_id, question, options, correct_answer, explanation, order_index) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'What utility type makes all properties optional?', '["Required", "Partial", "Pick", "Omit"]', 1, 'Partial<T> constructs a type with all properties of T set to optional.', 1),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'How do you define a generic type parameter?', '["<T>", "[T]", "(T)", "{T}"]', 0, 'Generic type parameters are defined using angle brackets <T>.', 2),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'What is the difference between interface and type?', '["No difference", "Interface can be extended", "Type is faster", "Interface is deprecated"]', 1, 'Interfaces can be extended and merged, while types are more flexible for unions.', 3),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'What does the never type represent?', '["Any value", "No value", "Null value", "Unknown value"]', 1, 'never represents the type of values that never occur.', 4),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'What is a discriminated union?', '["Union with common property", "Union without types", "Intersection type", "Generic type"]', 0, 'Discriminated unions use a common property to narrow types.', 5);