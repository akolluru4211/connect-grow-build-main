import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  is_virtual: boolean | null;
  virtual_link: string | null;
  max_attendees: number | null;
  cover_image_url: string | null;
  created_by: string | null;
  company_id: string | null;
  created_at: string;
  rsvp_count?: number;
  user_rsvp?: string | null;
}

export interface EventRSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  rsvp_at: string;
}

export function useEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) throw error;

      // Get RSVP counts and user's RSVP status
      const eventsWithRsvps = await Promise.all(
        (data || []).map(async (event) => {
          const { count } = await supabase
            .from("event_rsvps")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "going");

          let userRsvp = null;
          if (user) {
            const { data: rsvpData } = await supabase
              .from("event_rsvps")
              .select("status")
              .eq("event_id", event.id)
              .eq("user_id", user.id)
              .maybeSingle();
            userRsvp = rsvpData?.status || null;
          }

          return {
            ...event,
            rsvp_count: count || 0,
            user_rsvp: userRsvp,
          };
        })
      );

      return eventsWithRsvps as Event[];
    },
  });

  const createEvent = useMutation({
    mutationFn: async (eventData: Partial<Event>) => {
      const { data, error } = await supabase
        .from("events")
        .insert({
          title: eventData.title || "Untitled Event",
          description: eventData.description,
          event_type: eventData.event_type || "workshop",
          start_date: eventData.start_date || new Date().toISOString(),
          end_date: eventData.end_date,
          location: eventData.location,
          is_virtual: eventData.is_virtual,
          virtual_link: eventData.virtual_link,
          max_attendees: eventData.max_attendees,
          cover_image_url: eventData.cover_image_url,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Event created successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error creating event", description: error.message, variant: "destructive" });
    },
  });

  const rsvpEvent = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      if (!user) throw new Error("Must be logged in");

      // Check if user already has RSVP
      const { data: existing } = await supabase
        .from("event_rsvps")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("event_rsvps")
          .update({ status })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .insert({ event_id: eventId, user_id: user.id, status });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "RSVP updated!" });
    },
    onError: (error) => {
      toast({ title: "Error updating RSVP", description: error.message, variant: "destructive" });
    },
  });

  const cancelRsvp = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("event_rsvps")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "RSVP cancelled" });
    },
  });

  return {
    events,
    isLoading,
    createEvent,
    rsvpEvent,
    cancelRsvp,
  };
}
