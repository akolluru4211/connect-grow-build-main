
CREATE TABLE public.engagement_emails_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_engagement_emails_user_type ON public.engagement_emails_log(user_id, email_type, created_at);

ALTER TABLE public.engagement_emails_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.engagement_emails_log
  FOR ALL USING (false);
