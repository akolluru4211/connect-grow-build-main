-- Create function to notify on connection request
CREATE OR REPLACE FUNCTION public.notify_connection_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requester_name TEXT;
BEGIN
  -- Get requester's name
  SELECT full_name INTO requester_name
  FROM public.profiles
  WHERE id = NEW.requester_id;

  -- Notify receiver about the connection request
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.receiver_id,
    'connection',
    'New Connection Request',
    COALESCE(requester_name, 'Someone') || ' wants to connect with you',
    '/network'
  );

  RETURN NEW;
END;
$function$;

-- Create function to notify when connection is accepted
CREATE OR REPLACE FUNCTION public.notify_connection_accepted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  accepter_name TEXT;
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Get accepter's name (the receiver who accepted)
    SELECT full_name INTO accepter_name
    FROM public.profiles
    WHERE id = NEW.receiver_id;

    -- Notify the original requester that their request was accepted
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      NEW.requester_id,
      'connection',
      'Connection Accepted!',
      COALESCE(accepter_name, 'Someone') || ' accepted your connection request',
      '/network'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger for new connection requests
CREATE TRIGGER on_connection_request_created
  AFTER INSERT ON public.user_connections
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_connection_request();

-- Create trigger for connection acceptance
CREATE TRIGGER on_connection_accepted
  AFTER UPDATE ON public.user_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_connection_accepted();