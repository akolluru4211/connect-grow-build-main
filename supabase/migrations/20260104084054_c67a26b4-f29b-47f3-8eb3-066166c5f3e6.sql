-- Create skill endorsements table to track who endorsed whom
CREATE TABLE public.skill_endorsements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  endorsed_user_id UUID NOT NULL,
  endorser_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(skill_id, endorsed_user_id, endorser_id)
);

-- Enable RLS
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Endorsements are viewable by everyone" 
ON public.skill_endorsements 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can endorse" 
ON public.skill_endorsements 
FOR INSERT 
WITH CHECK (auth.uid() = endorser_id AND auth.uid() != endorsed_user_id);

CREATE POLICY "Users can remove their endorsements" 
ON public.skill_endorsements 
FOR DELETE 
USING (auth.uid() = endorser_id);

-- Create onboarding_status table to track user onboarding progress
CREATE TABLE public.onboarding_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  completed_steps TEXT[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  skipped_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_status ENABLE ROW LEVEL SECURITY;

-- Policies for onboarding
CREATE POLICY "Users can view their own onboarding status" 
ON public.onboarding_status 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their onboarding status" 
ON public.onboarding_status 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding status" 
ON public.onboarding_status 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create push_subscriptions table for web push notifications
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for push subscriptions
CREATE POLICY "Users can manage their own push subscriptions" 
ON public.push_subscriptions 
FOR ALL 
USING (auth.uid() = user_id);

-- Add trigger for onboarding updated_at
CREATE TRIGGER update_onboarding_status_updated_at
  BEFORE UPDATE ON public.onboarding_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();