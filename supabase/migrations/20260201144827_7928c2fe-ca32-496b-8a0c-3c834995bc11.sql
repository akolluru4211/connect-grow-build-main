-- Add policy to allow all authenticated users to view all profiles for networking
CREATE POLICY "All authenticated users can view profiles for networking" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Drop the restrictive "Users can view their own profile" policy since the new one is more permissive
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;