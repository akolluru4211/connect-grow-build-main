
-- Enable the pg_net extension for HTTP requests from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to send email when a new notification is created
CREATE OR REPLACE FUNCTION public.send_notification_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  -- Get the Supabase URL and service role key from vault or hardcode project URL
  supabase_url := 'https://scwliaddydtnadqvkahk.supabase.co';
  
  -- Use the service role key from Supabase secrets
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;

  -- Call the send-notification edge function
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', service_key
    ),
    body := jsonb_build_object(
      'type', 'general_notification',
      'recipientId', NEW.user_id,
      'data', jsonb_build_object(
        'title', NEW.title,
        'message', NEW.message,
        'link', NEW.link,
        'notificationType', NEW.type
      )
    )
  );

  RETURN NEW;
END;
$$;

-- Function to send email when a new message is created
CREATE OR REPLACE FUNCTION public.send_message_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
  recipient_id UUID;
  sender_name TEXT;
  conv RECORD;
BEGIN
  supabase_url := 'https://scwliaddydtnadqvkahk.supabase.co';
  
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'
  LIMIT 1;

  -- Get conversation to find the other participant
  SELECT participant_1, participant_2 INTO conv
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  -- Determine recipient (the other participant)
  IF conv.participant_1 = NEW.sender_id THEN
    recipient_id := conv.participant_2;
  ELSE
    recipient_id := conv.participant_1;
  END IF;

  -- Get sender name
  SELECT COALESCE(full_name, 'Someone') INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Call the send-notification edge function
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', service_key
    ),
    body := jsonb_build_object(
      'type', 'new_message',
      'recipientId', recipient_id::text,
      'data', jsonb_build_object(
        'senderName', sender_name,
        'messagePreview', LEFT(NEW.content, 100)
      )
    )
  );

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_notification_created_send_email
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_notification_email();

CREATE TRIGGER on_message_created_send_email
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.send_message_email();
