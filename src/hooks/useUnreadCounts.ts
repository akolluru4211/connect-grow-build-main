import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface UnreadCounts {
  messages: number;
  notifications: number;
  jobs: number;
  courses: number;
  events: number;
}

export function useUnreadCounts() {
  const { user } = useAuth();

  const { data: counts, refetch } = useQuery({
    queryKey: ["unread-counts", user?.id],
    queryFn: async (): Promise<UnreadCounts> => {
      if (!user?.id) return { messages: 0, notifications: 0, jobs: 0, courses: 0, events: 0 };

      // Get conversations for the user first
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`);

      const conversationIds = conversations?.map(c => c.id) || [];
      
      // Get unread messages count
      let messagesCount = 0;
      if (conversationIds.length > 0) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("is_read", false)
          .in("conversation_id", conversationIds)
          .neq("sender_id", user.id);
        messagesCount = count || 0;
      }

      // Get unread notifications count
      const { count: notificationsCount } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      // Get new jobs in last 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: jobsCount } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .gte("created_at", yesterday.toISOString());

      // Get new courses in last week
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const { count: coursesCount } = await supabase
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .gte("created_at", lastWeek.toISOString());

      // Get upcoming events
      const { count: eventsCount } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .gte("start_date", new Date().toISOString())
        .lte("start_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

      return {
        messages: messagesCount,
        notifications: notificationsCount || 0,
        jobs: Math.min(jobsCount || 0, 99),
        courses: Math.min(coursesCount || 0, 99),
        events: Math.min(eventsCount || 0, 99),
      };
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  // Real-time subscription for messages and notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`unread-counts-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => refetch()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => refetch()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => refetch()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  return {
    counts: counts || { messages: 0, notifications: 0, jobs: 0, courses: 0, events: 0 },
    refetch,
  };
}
