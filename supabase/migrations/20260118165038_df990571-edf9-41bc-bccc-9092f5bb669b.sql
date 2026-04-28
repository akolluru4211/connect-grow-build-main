-- Create opportunities table for internships and hackathons
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('internship', 'hackathon')),
  description TEXT,
  location TEXT,
  deadline DATE,
  stipend TEXT,
  duration TEXT,
  application_link TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Opportunities are viewable by everyone
CREATE POLICY "Opportunities are viewable by everyone"
ON public.opportunities
FOR SELECT
USING (is_active = true);

-- Admins can manage opportunities
CREATE POLICY "Admins can manage opportunities"
ON public.opportunities
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can subscribe to newsletter
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (true);

-- Users can view their own subscription
CREATE POLICY "Users can view subscriptions"
ON public.newsletter_subscribers
FOR SELECT
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data from the document
INSERT INTO public.opportunities (title, organization, type, description, location, deadline, stipend, duration, application_link, tags) VALUES
('Software Development Internship', 'Google', 'internship', 'Build scalable web applications and work with cutting-edge technology', 'Mountain View, CA / Remote', '2026-03-15', '$8,000/month', '12 weeks', 'https://careers.google.com', ARRAY['Software', 'Web Development', 'Remote']),
('Data Science Internship', 'Meta', 'internship', 'Apply machine learning to solve real-world problems at scale', 'Menlo Park, CA', '2026-02-28', '$9,000/month', '10 weeks', 'https://metacareers.com', ARRAY['Data Science', 'Machine Learning', 'AI']),
('Cloud Engineering Internship', 'Microsoft', 'internship', 'Work on Azure cloud infrastructure and services', 'Redmond, WA / Remote', '2026-03-01', '$7,500/month', '12 weeks', 'https://careers.microsoft.com', ARRAY['Cloud', 'Azure', 'DevOps']),
('Product Management Internship', 'Amazon', 'internship', 'Drive product strategy and work with cross-functional teams', 'Seattle, WA', '2026-02-15', '$8,500/month', '12 weeks', 'https://amazon.jobs', ARRAY['Product', 'Strategy', 'Leadership']),
('UX Design Internship', 'Apple', 'internship', 'Create intuitive user experiences for millions of users', 'Cupertino, CA', '2026-03-10', '$7,000/month', '10 weeks', 'https://apple.com/careers', ARRAY['Design', 'UX', 'UI']),
('MLH Fellowship', 'Major League Hacking', 'hackathon', '12-week program to level up your skills by contributing to Open Source projects', 'Remote', '2026-04-01', 'Stipend Available', '12 weeks', 'https://fellowship.mlh.io', ARRAY['Open Source', 'Fellowship', 'Remote']),
('HackMIT', 'MIT', 'hackathon', 'Annual hackathon bringing together 1000+ hackers to build innovative projects', 'Cambridge, MA', '2026-09-15', 'Prizes up to $10,000', '36 hours', 'https://hackmit.org', ARRAY['Competition', 'Innovation', 'Networking']),
('TreeHacks', 'Stanford University', 'hackathon', 'Stanford''s premier hackathon focused on social impact and technology', 'Stanford, CA', '2026-02-20', 'Prizes + Mentorship', '36 hours', 'https://treehacks.com', ARRAY['Social Impact', 'Innovation', 'Stanford']),
('PennApps', 'University of Pennsylvania', 'hackathon', 'The first student-run college hackathon, now in its 25th iteration', 'Philadelphia, PA', '2026-09-01', 'Prizes + Swag', '36 hours', 'https://pennapps.com', ARRAY['Competition', 'Innovation', 'Classic']),
('CalHacks', 'UC Berkeley', 'hackathon', 'The world''s largest collegiate hackathon with 2000+ participants', 'Berkeley, CA', '2026-10-20', 'Prizes up to $50,000', '36 hours', 'https://calhacks.io', ARRAY['Large Scale', 'Innovation', 'Berkeley']);