import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NotificationPayload {
  type: "new_message" | "job_match" | "connection_request" | "application_status" | "achievement_unlocked";
  recipientId: string;
  data: Record<string, any>;
}

export function useSendNotification() {
  return useMutation({
    mutationFn: async (payload: NotificationPayload) => {
      const { data, error } = await supabase.functions.invoke("send-notification", {
        body: payload,
      });

      if (error) throw error;
      return data;
    },
  });
}

// Hook to trigger notification when a new message is sent
export function useNotifyNewMessage() {
  const sendNotification = useSendNotification();

  return async (recipientId: string, senderName: string, messagePreview: string) => {
    try {
      await sendNotification.mutateAsync({
        type: "new_message",
        recipientId,
        data: { senderName, messagePreview },
      });
    } catch (error) {
      console.error("Failed to send message notification:", error);
    }
  };
}

// Hook to trigger notification for job matches
export function useNotifyJobMatch() {
  const sendNotification = useSendNotification();

  return async (recipientId: string, jobTitle: string, companyName: string, matchScore: number) => {
    try {
      await sendNotification.mutateAsync({
        type: "job_match",
        recipientId,
        data: { jobTitle, companyName, matchScore },
      });
    } catch (error) {
      console.error("Failed to send job match notification:", error);
    }
  };
}

// Hook to trigger notification for connection requests
export function useNotifyConnectionRequest() {
  const sendNotification = useSendNotification();

  return async (recipientId: string, requesterName: string) => {
    try {
      await sendNotification.mutateAsync({
        type: "connection_request",
        recipientId,
        data: { requesterName },
      });
    } catch (error) {
      console.error("Failed to send connection notification:", error);
    }
  };
}

// Hook to trigger notification for achievement unlocks
export function useNotifyAchievementUnlock() {
  const sendNotification = useSendNotification();

  return async (
    recipientId: string, 
    achievementName: string, 
    description: string, 
    points: number,
    icon?: string
  ) => {
    try {
      await sendNotification.mutateAsync({
        type: "achievement_unlocked",
        recipientId,
        data: { achievementName, description, points, icon },
      });
    } catch (error) {
      console.error("Failed to send achievement notification:", error);
    }
  };
}
