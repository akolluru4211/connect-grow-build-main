-- Add RLS policies for companies to view and update applications to their internships
CREATE POLICY "Companies can view applications to their internships"
ON public.internship_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.internships
    WHERE internships.id = internship_applications.internship_id
    AND internships.posted_by = auth.uid()
  )
);

CREATE POLICY "Companies can update applications to their internships"
ON public.internship_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.internships
    WHERE internships.id = internship_applications.internship_id
    AND internships.posted_by = auth.uid()
  )
);