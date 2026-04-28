import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CampusEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  college_name: string | null;
  club_name: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  is_virtual: boolean;
  virtual_link: string | null;
  max_attendees: number | null;
  created_by: string;
  created_at: string;
  rsvp_count?: number;
  user_rsvp?: string | null;
}

export function useCampusEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const events = useQuery({
    queryKey: ["campus-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campus_events")
        .select("*")
        .order("start_date", { ascending: true });
      if (error) throw error;

      const eventIds = data.map((e: any) => e.id);
      const { data: rsvps } = await supabase
        .from("campus_event_rsvps")
        .select("event_id, user_id, status")
        .in("event_id", eventIds);

      return data.map((event: any) => {
        const eventRsvps = rsvps?.filter((r: any) => r.event_id === event.id) || [];
        return {
          ...event,
          rsvp_count: eventRsvps.length,
          user_rsvp: eventRsvps.find((r: any) => r.user_id === user?.id)?.status || null,
        } as CampusEvent;
      });
    },
  });

  const createEvent = useMutation({
    mutationFn: async (input: Omit<CampusEvent, "id" | "created_at" | "created_by" | "rsvp_count" | "user_rsvp" | "updated_at">) => {
      const { error } = await supabase.from("campus_events").insert({ ...input, created_by: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campus-events"] });
      toast.success("Campus event created!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rsvpEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from("campus_event_rsvps").insert({ event_id: eventId, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campus-events"] });
      toast.success("RSVP confirmed!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cancelRsvp = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from("campus_event_rsvps").delete().eq("event_id", eventId).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campus-events"] });
      toast.success("RSVP cancelled");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { events: events.data || [], isLoading: events.isLoading, createEvent, rsvpEvent, cancelRsvp };
}
