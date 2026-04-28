import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface JobFairEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string | null;
  virtual_link: string | null;
  host_company_id: string | null;
  max_participants: number | null;
  is_active: boolean;
  created_at: string;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

interface JobFairRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  registered_at: string;
}

export function useJobFairEvents() {
  return useQuery({
    queryKey: ["job-fair-events"],
    queryFn: async (): Promise<JobFairEvent[]> => {
      const { data, error } = await supabase
        .from("job_fair_events")
        .select(`
          *,
          company:companies(id, name, logo_url)
        `)
        .eq("is_active", true)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useUserRegistrations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["job-fair-registrations", user?.id],
    queryFn: async (): Promise<JobFairRegistration[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("job_fair_registrations")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useRegisterForEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("job_fair_registrations").insert({
        event_id: eventId,
        user_id: user.id,
        status: "registered",
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Already registered for this event");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-fair-registrations"] });
      toast.success("Successfully registered for the event!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to register");
    },
  });
}

export function useCancelRegistration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("job_fair_registrations")
        .update({ status: "cancelled" })
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-fair-registrations"] });
      toast.success("Registration cancelled");
    },
    onError: () => {
      toast.error("Failed to cancel registration");
    },
  });
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  job_fair: "Virtual Job Fair",
  live_interview: "Live Interview",
  employer_panel: "Employer Panel",
  workshop: "Workshop",
};

export const EVENT_TYPE_COLORS: Record<string, string> = {
  job_fair: "bg-primary/10 text-primary",
  live_interview: "bg-success/10 text-success",
  employer_panel: "bg-warning/10 text-warning",
  workshop: "bg-accent text-accent-foreground",
};
