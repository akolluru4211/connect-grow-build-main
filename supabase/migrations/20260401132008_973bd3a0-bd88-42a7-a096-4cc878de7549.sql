
-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique referral code column to profiles
ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;

-- Create unique index on referrals to prevent duplicates
CREATE UNIQUE INDEX referrals_referred_id_unique ON public.referrals (referred_id);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies for referrals
CREATE POLICY "Anyone can view referrals" ON public.referrals FOR SELECT USING (true);
CREATE POLICY "System can insert referrals" ON public.referrals FOR INSERT WITH CHECK (true);

-- Function to generate unique referral code on profile creation
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code TEXT;
  name_part TEXT;
BEGIN
  -- Generate code from name + random chars
  name_part := UPPER(LEFT(REGEXP_REPLACE(COALESCE(NEW.full_name, 'EDW'), '[^a-zA-Z]', '', 'g'), 4));
  IF LENGTH(name_part) < 2 THEN
    name_part := 'EDW';
  END IF;
  code := name_part || UPPER(SUBSTRING(MD5(NEW.id::text || now()::text) FROM 1 FOR 4));
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM profiles WHERE referral_code = code) LOOP
    code := name_part || UPPER(SUBSTRING(MD5(random()::text) FROM 1 FOR 4));
  END LOOP;
  
  NEW.referral_code := code;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION public.generate_referral_code();

-- Generate codes for existing profiles that don't have one
UPDATE public.profiles 
SET referral_code = UPPER(LEFT(REGEXP_REPLACE(COALESCE(full_name, 'EDW'), '[^a-zA-Z]', '', 'g'), 4)) || UPPER(SUBSTRING(MD5(id::text || created_at::text) FROM 1 FOR 4))
WHERE referral_code IS NULL;
