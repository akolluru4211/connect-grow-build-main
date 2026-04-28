-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  location TEXT,
  industry TEXT,
  company_size TEXT,
  founded_year INTEGER,
  culture_values TEXT[],
  work_environment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[],
  responsibilities TEXT[],
  location TEXT,
  job_type TEXT NOT NULL CHECK (job_type IN ('full-time', 'part-time', 'contract', 'remote', 'hybrid')),
  experience_level TEXT NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  skills_required UUID[],
  is_active BOOLEAN DEFAULT true,
  posted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create internships table
CREATE TABLE public.internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[],
  location TEXT,
  internship_type TEXT NOT NULL CHECK (internship_type IN ('paid', 'unpaid', 'stipend')),
  duration_months INTEGER,
  stipend_amount INTEGER,
  stipend_currency TEXT DEFAULT 'USD',
  skills_required UUID[],
  is_active BOOLEAN DEFAULT true,
  posted_by UUID REFERENCES auth.users(id),
  start_date DATE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(job_id, user_id)
);

-- Create internship applications table
CREATE TABLE public.internship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(internship_id, user_id)
);

-- Create saved jobs table
CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(job_id, user_id)
);

-- Create saved internships table
CREATE TABLE public.saved_internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(internship_id, user_id)
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_internships ENABLE ROW LEVEL SECURITY;

-- Companies policies (public read)
CREATE POLICY "Companies are viewable by everyone" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Company accounts can manage their companies" ON public.companies FOR ALL USING (public.has_role(auth.uid(), 'company'));

-- Jobs policies
CREATE POLICY "Active jobs are viewable by everyone" ON public.jobs FOR SELECT USING (is_active = true);
CREATE POLICY "Companies can manage their jobs" ON public.jobs FOR ALL USING (posted_by = auth.uid());

-- Internships policies
CREATE POLICY "Active internships are viewable by everyone" ON public.internships FOR SELECT USING (is_active = true);
CREATE POLICY "Companies can manage their internships" ON public.internships FOR ALL USING (posted_by = auth.uid());

-- Job applications policies
CREATE POLICY "Users can view their own applications" ON public.job_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own applications" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own applications" ON public.job_applications FOR UPDATE USING (auth.uid() = user_id);

-- Internship applications policies
CREATE POLICY "Users can view their own internship applications" ON public.internship_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own internship applications" ON public.internship_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own internship applications" ON public.internship_applications FOR UPDATE USING (auth.uid() = user_id);

-- Saved jobs policies
CREATE POLICY "Users can view their saved jobs" ON public.saved_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their saved jobs" ON public.saved_jobs FOR ALL USING (auth.uid() = user_id);

-- Saved internships policies
CREATE POLICY "Users can view their saved internships" ON public.saved_internships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their saved internships" ON public.saved_internships FOR ALL USING (auth.uid() = user_id);

-- Update triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_internships_updated_at BEFORE UPDATE ON public.internships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_internship_applications_updated_at BEFORE UPDATE ON public.internship_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert sample companies
INSERT INTO public.companies (id, name, description, location, industry, company_size, culture_values, work_environment) VALUES
  ('11111111-1111-1111-1111-111111111111', 'TechCorp Inc.', 'Leading technology company specializing in AI and cloud solutions', 'San Francisco, CA', 'Technology', '1000-5000', ARRAY['Innovation', 'Collaboration', 'Growth'], 'hybrid'),
  ('22222222-2222-2222-2222-222222222222', 'StartupXYZ', 'Fast-growing startup revolutionizing the fintech space', 'New York, NY', 'FinTech', '50-200', ARRAY['Agility', 'Ownership', 'Impact'], 'remote'),
  ('33333333-3333-3333-3333-333333333333', 'DesignHub', 'Creative design agency with a focus on digital experiences', 'Los Angeles, CA', 'Design', '10-50', ARRAY['Creativity', 'Excellence', 'Teamwork'], 'onsite'),
  ('44444444-4444-4444-4444-444444444444', 'DataDriven Co.', 'Data analytics and business intelligence solutions', 'Austin, TX', 'Data Analytics', '200-500', ARRAY['Data-First', 'Transparency', 'Learning'], 'hybrid'),
  ('55555555-5555-5555-5555-555555555555', 'CloudNine Systems', 'Enterprise cloud infrastructure and DevOps', 'Seattle, WA', 'Cloud Computing', '500-1000', ARRAY['Reliability', 'Innovation', 'Customer Focus'], 'remote');

-- Insert sample jobs
INSERT INTO public.jobs (company_id, title, description, requirements, responsibilities, location, job_type, experience_level, salary_min, salary_max) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Senior React Developer', 'Join our frontend team to build cutting-edge web applications using React and TypeScript.', ARRAY['5+ years React experience', 'TypeScript proficiency', 'State management expertise'], ARRAY['Develop new features', 'Code reviews', 'Mentor junior developers'], 'San Francisco, CA', 'hybrid', 'senior', 120000, 160000),
  ('11111111-1111-1111-1111-111111111111', 'Full Stack Engineer', 'Build and maintain our core platform infrastructure.', ARRAY['3+ years full stack experience', 'Node.js and React', 'Database design'], ARRAY['Design APIs', 'Implement features', 'Optimize performance'], 'Remote', 'remote', 'mid', 100000, 140000),
  ('22222222-2222-2222-2222-222222222222', 'Backend Engineer', 'Design and implement scalable backend services for our fintech platform.', ARRAY['4+ years backend experience', 'Python or Go', 'Microservices architecture'], ARRAY['Build APIs', 'Database optimization', 'System design'], 'New York, NY', 'remote', 'mid', 110000, 150000),
  ('33333333-3333-3333-3333-333333333333', 'UI/UX Designer', 'Create beautiful and intuitive user interfaces for our clients.', ARRAY['3+ years UI/UX experience', 'Figma proficiency', 'User research skills'], ARRAY['Design interfaces', 'User testing', 'Design systems'], 'Los Angeles, CA', 'full-time', 'mid', 80000, 120000),
  ('44444444-4444-4444-4444-444444444444', 'Data Scientist', 'Apply machine learning to solve complex business problems.', ARRAY['MS in Data Science or related', 'Python, SQL, ML frameworks', '2+ years experience'], ARRAY['Build ML models', 'Data analysis', 'Stakeholder presentations'], 'Austin, TX', 'hybrid', 'mid', 95000, 135000),
  ('55555555-5555-5555-5555-555555555555', 'DevOps Engineer', 'Manage and scale our cloud infrastructure on AWS and Kubernetes.', ARRAY['3+ years DevOps experience', 'AWS/GCP', 'Kubernetes, Docker', 'Terraform'], ARRAY['Infrastructure automation', 'CI/CD pipelines', 'Monitoring'], 'Seattle, WA', 'remote', 'mid', 105000, 145000),
  ('11111111-1111-1111-1111-111111111111', 'Junior Frontend Developer', 'Start your career building modern web applications.', ARRAY['1+ year React experience', 'HTML, CSS, JavaScript', 'Eager to learn'], ARRAY['Implement UI components', 'Fix bugs', 'Write tests'], 'San Francisco, CA', 'full-time', 'entry', 70000, 90000),
  ('22222222-2222-2222-2222-222222222222', 'Product Manager', 'Lead product strategy and execution for our core platform.', ARRAY['5+ years PM experience', 'Technical background', 'Agile methodology'], ARRAY['Define roadmap', 'Stakeholder management', 'User research'], 'New York, NY', 'hybrid', 'senior', 140000, 180000);

-- Insert sample internships
INSERT INTO public.internships (company_id, title, description, requirements, location, internship_type, duration_months, stipend_amount) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Software Engineering Intern', 'Work on real projects and learn from experienced engineers.', ARRAY['Currently pursuing CS degree', 'Basic programming skills', 'Problem-solving aptitude'], 'San Francisco, CA', 'paid', 3, 6000),
  ('22222222-2222-2222-2222-222222222222', 'Data Analytics Intern', 'Analyze data and create insights for business decisions.', ARRAY['Statistics or Math background', 'SQL knowledge', 'Excel proficiency'], 'New York, NY', 'paid', 4, 5000),
  ('33333333-3333-3333-3333-333333333333', 'Design Intern', 'Assist in creating visual designs for digital products.', ARRAY['Design portfolio', 'Figma or Adobe skills', 'Creative mindset'], 'Los Angeles, CA', 'stipend', 3, 2500),
  ('44444444-4444-4444-4444-444444444444', 'Marketing Intern', 'Support digital marketing campaigns and content creation.', ARRAY['Marketing or Communications student', 'Social media savvy', 'Writing skills'], 'Austin, TX', 'paid', 3, 3500),
  ('55555555-5555-5555-5555-555555555555', 'Cloud Engineering Intern', 'Learn cloud technologies and help maintain infrastructure.', ARRAY['CS or IT student', 'Linux basics', 'Interest in cloud'], 'Remote', 'paid', 3, 5500);