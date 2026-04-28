import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hasNewNotification, setHasNewNotification] = useState(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Real-time subscription with enhanced handling
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Trigger animation
          setHasNewNotification(true);
          setTimeout(() => setHasNewNotification(false), 2000);
          
          // Optimistically update the cache
          queryClient.setQueryData<Notification[]>(
            ["notifications", user.id],
            (old = []) => {
              if (old.some(n => n.id === newNotification.id)) {
                return old;
              }
              return [newNotification, ...old];
            }
          );
          
          // Show toast notification with enhanced styling
          toast(newNotification.title, {
            description: newNotification.message,
            action: newNotification.link ? {
              label: "View",
              onClick: () => window.location.href = newNotification.link!,
            } : undefined,
            duration: 5000,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          
          queryClient.setQueryData<Notification[]>(
            ["notifications", user.id],
            (old = []) => old.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Notifications realtime connected
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", user?.id] });
      
      queryClient.setQueryData<Notification[]>(
        ["notifications", user?.id],
        (old = []) => old.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications", user?.id] });
      
      queryClient.setQueryData<Notification[]>(
        ["notifications", user?.id],
        (old = []) => old.map(n => ({ ...n, is_read: true }))
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    notifications,
    isLoading,
    unreadCount,
    hasNewNotification,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
  };
}
