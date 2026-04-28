-- Add RLS policies for companies to view and update job applications
CREATE POLICY "Companies can view applications to their jobs"
ON public.job_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_applications.job_id
    AND jobs.posted_by = auth.uid()
  )
);

CREATE POLICY "Companies can update applications to their jobs"
ON public.job_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_applications.job_id
    AND jobs.posted_by = auth.uid()
  )
);