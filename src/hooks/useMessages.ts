import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback } from "react";

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string | null;
  created_at: string;
  other_user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean | null;
  created_at: string;
  sender?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useConversations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;

          // Use profiles_public view for privacy
          const { data: otherUser } = await supabase
            .from("profiles_public")
            .select("id, full_name, avatar_url")
            .eq("id", otherUserId)
            .single();

          const { data: lastMessage } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("is_read", false)
            .neq("sender_id", user.id);

          return {
            ...conv,
            other_user: otherUser,
            last_message: lastMessage,
            unread_count: unreadCount || 0,
          } as Conversation;
        })
      );

      return conversationsWithDetails;
    },
    enabled: !!user,
  });

  const startConversation = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error("Must be logged in");

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
        )
        .maybeSingle();

      if (existing) {
        return existing.id;
      }

      const { data, error } = await supabase
        .from("conversations")
        .insert({
          participant_1: user.id,
          participant_2: otherUserId,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      toast({ title: "Error starting conversation", description: error.message, variant: "destructive" });
    },
  });

  // Real-time subscription for new conversations and messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => queryClient.invalidateQueries({ queryKey: ["conversations"] })
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => queryClient.invalidateQueries({ queryKey: ["conversations"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    conversations,
    isLoading,
    startConversation,
  };
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const messagesWithSenders = await Promise.all(
        (data || []).map(async (msg) => {
          // Use profiles_public view for privacy
          const { data: sender } = await supabase
            .from("profiles_public")
            .select("full_name, avatar_url")
            .eq("id", msg.sender_id)
            .single();

          return { ...msg, sender } as Message;
        })
      );

      return messagesWithSenders;
    },
    enabled: !!conversationId,
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !conversationId) throw new Error("Invalid state");

      // Get other participant for notification
      const { data: conversation } = await supabase
        .from("conversations")
        .select("participant_1, participant_2")
        .eq("id", conversationId)
        .single();

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      });

      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      // Create notification for the recipient
      if (conversation) {
        const recipientId = conversation.participant_1 === user.id 
          ? conversation.participant_2 
          : conversation.participant_1;

        // Get sender's name - using profiles_public view for privacy
        const { data: senderProfile } = await supabase
          .from("profiles_public")
          .select("full_name")
          .eq("id", user.id)
          .single();

        const senderName = senderProfile?.full_name || "Someone";
        const messagePreview = content.length > 50 ? content.substring(0, 50) + "..." : content;

        await supabase.from("notifications").insert({
          user_id: recipientId,
          type: "message",
          title: "New Message",
          message: `${senderName}: ${messagePreview}`,
          link: "/messages",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!user || !conversationId) return;

      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("is_read", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });

  // Real-time subscription for new messages and updates
  useEffect(() => {
    if (!conversationId || !user) return;

    const messagesChannel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] })
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] })
      )
      .subscribe();

    // Presence channel for typing indicators
    const presenceChannel = supabase
      .channel(`typing-${conversationId}`)
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const typing = Object.values(state)
          .flat()
          .filter((p: any) => p.typing && p.user_id !== user.id)
          .map((p: any) => p.user_id);
        setTypingUsers(typing);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [conversationId, user, queryClient]);

  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!conversationId || !user?.id) return;

    const channel = supabase.channel(`typing-${conversationId}`);
    await channel.track({ user_id: user.id, typing: isTyping });
  }, [conversationId, user?.id]);

  return {
    messages,
    isLoading,
    sendMessage,
    markAsRead,
    typingUsers,
    sendTypingIndicator,
  };
}
