import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface UserSettings {
  id: string;
  user_id: string;
  email_notifications: boolean | null;
  job_alerts: boolean | null;
  mentorship_notifications: boolean | null;
  message_notifications: boolean | null;
  event_reminders: boolean | null;
  profile_visibility: string | null;
  show_email: boolean | null;
  show_phone: boolean | null;
  show_location: boolean | null;
}

const defaultSettings: Omit<UserSettings, "id" | "user_id"> = {
  email_notifications: true,
  job_alerts: true,
  mentorship_notifications: true,
  message_notifications: true,
  event_reminders: true,
  profile_visibility: "public",
  show_email: false,
  show_phone: false,
  show_location: true,
};

export function useSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["user-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, return defaults
      if (!data) {
        return {
          ...defaultSettings,
          id: "",
          user_id: user.id,
        } as UserSettings;
      }

      return data as UserSettings;
    },
    enabled: !!user,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      if (!user) throw new Error("Must be logged in");

      // Check if settings exist
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_settings")
          .update(updates)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_settings").insert({
          user_id: user.id,
          ...defaultSettings,
          ...updates,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      toast({ title: "Settings saved!" });
    },
    onError: (error) => {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings,
  };
}
