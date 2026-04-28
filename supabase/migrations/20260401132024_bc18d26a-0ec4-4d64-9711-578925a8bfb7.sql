
-- Fix permissive INSERT policy on referrals
DROP POLICY "System can insert referrals" ON public.referrals;
CREATE POLICY "Authenticated users can create referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = referred_id);

-- Fix RLS disabled on employees table (pre-existing)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees viewable by all" ON public.employees FOR SELECT USING (true);
