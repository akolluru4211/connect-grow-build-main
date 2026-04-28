import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface UserConnection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
}

export function useNetwork() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ["connections", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_connections")
        .select("*")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (error) throw error;

      // Get profile info for each connection - using profiles_public view for privacy
      const connectionsWithProfiles = await Promise.all(
        (data || []).map(async (conn) => {
          const otherUserId = conn.requester_id === user.id ? conn.receiver_id : conn.requester_id;
          const { data: profile } = await supabase
            .from("profiles_public")
            .select("id, full_name, avatar_url, headline")
            .eq("id", otherUserId)
            .single();

          return { ...conn, profile } as UserConnection;
        })
      );

      return connectionsWithProfiles;
    },
    enabled: !!user,
  });

  const { data: pendingRequests } = useQuery({
    queryKey: ["pending-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_connections")
        .select("*")
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      if (error) throw error;

      // Use profiles_public view for privacy
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (conn) => {
          const { data: profile } = await supabase
            .from("profiles_public")
            .select("id, full_name, avatar_url, headline")
            .eq("id", conn.requester_id)
            .single();

          return { ...conn, profile } as UserConnection;
        })
      );

      return requestsWithProfiles;
    },
    enabled: !!user,
  });

  const { data: sentRequests } = useQuery({
    queryKey: ["sent-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_connections")
        .select("*")
        .eq("requester_id", user.id)
        .eq("status", "pending");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch ALL people in the network (all registered users including current user)
  const { data: allPeople, isLoading: allPeopleLoading } = useQuery({
    queryKey: ["all-people"],
    queryFn: async () => {
      // Get all profiles - using profiles_public view for privacy
      const { data: profiles, error } = await supabase
        .from("profiles_public")
        .select("id, full_name, avatar_url, headline")
        .order("full_name", { ascending: true });

      if (error) throw error;
      return profiles || [];
    },
    enabled: true,
  });

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["connection-suggestions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all profiles except current user - no limit to show everyone
      const { data: profiles, error } = await supabase
        .from("profiles_public")
        .select("id, full_name, avatar_url, headline")
        .neq("id", user.id)
        .order("full_name", { ascending: true });

      if (error) throw error;

      // Filter out users who are already connected or have pending requests
      const connectionIds = new Set([
        ...(connections?.map((c) => c.profile?.id) || []),
        ...(sentRequests?.map((r) => r.receiver_id) || []),
        ...(pendingRequests?.map((r) => r.requester_id) || []),
      ]);

      return (profiles || []).filter((p) => !connectionIds.has(p.id));
    },
    enabled: !!user && connections !== undefined,
  });

  const sendRequest = useMutation({
    mutationFn: async (receiverId: string) => {
      if (!user) throw new Error("Must be logged in");

      // Check if connection already exists (in either direction)
      const { data: existingConnection } = await supabase
        .from("user_connections")
        .select("id, status")
        .or(
          `and(requester_id.eq.${user.id},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${user.id})`
        )
        .maybeSingle();

      if (existingConnection) {
        if (existingConnection.status === "pending") {
          return "already_pending";
        } else if (existingConnection.status === "accepted") {
          return "already_connected";
        } else if (existingConnection.status === "declined") {
          // If previously declined, update to pending instead of inserting
          const { error: updateError } = await supabase
            .from("user_connections")
            .update({ status: "pending", requester_id: user.id, receiver_id: receiverId })
            .eq("id", existingConnection.id);
          
          if (updateError) throw updateError;
          return; // Exit early since we updated instead of inserted
        }
      }

      const { error } = await supabase.from("user_connections").insert({
        requester_id: user.id,
        receiver_id: receiverId,
        status: "pending",
      });

      if (error) throw error;

      // Send notification to receiver
      try {
        const { data: senderProfile } = await supabase
          .from("profiles_public")
          .select("full_name")
          .eq("id", user.id)
          .single();

        await supabase.functions.invoke("send-notification", {
          body: {
            type: "connection_request",
            recipientId: receiverId,
            data: { requesterName: senderProfile?.full_name || "Someone" },
          },
        });
      } catch (notifyError) {
        console.error("Failed to send notification:", notifyError);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["connection-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["sent-requests"] });
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      if (result === "already_connected") {
        toast({ title: "You're already connected with this person 🤝" });
      } else if (result === "already_pending") {
        toast({ title: "Connection request already sent ⏳" });
      } else {
        toast({ title: "Connection request sent!" });
      }
    },
    onError: (error) => {
      toast({ title: "Error sending request", description: error.message, variant: "destructive" });
    },
  });

  const acceptRequest = useMutation({
    mutationFn: async (connectionId: string) => {
      if (!user) throw new Error("Must be logged in");

      // Get the connection to find the requester
      const { data: connection, error: fetchError } = await supabase
        .from("user_connections")
        .select("requester_id")
        .eq("id", connectionId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from("user_connections")
        .update({ status: "accepted" })
        .eq("id", connectionId);

      if (error) throw error;

      // Send email notification to the requester
      try {
        const { data: accepterProfile } = await supabase
          .from("profiles_public")
          .select("full_name")
          .eq("id", user.id)
          .single();

        await supabase.functions.invoke("send-notification", {
          body: {
            type: "connection_accepted",
            recipientId: connection.requester_id,
            data: { accepterName: accepterProfile?.full_name || "Someone" },
          },
        });
      } catch (notifyError) {
        console.error("Failed to send acceptance notification:", notifyError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      toast({ title: "Connection accepted!" });
    },
  });

  const declineRequest = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("user_connections")
        .update({ status: "declined" })
        .eq("id", connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-requests"] });
      toast({ title: "Connection declined" });
    },
  });

  const removeConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase.from("user_connections").delete().eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      toast({ title: "Connection removed" });
    },
  });

  const directConnect = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error("Must be logged in");
      
      console.log("Directly connecting to:", otherUserId);

      // Check if connection already exists (in either direction)
      const { data: existingConnection } = await supabase
        .from("user_connections")
        .select("id, status")
        .or(
          `and(requester_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .maybeSingle();

      if (existingConnection) {
        if (existingConnection.status === "accepted") {
          return "already_connected";
        }
        
        // Upgrade existing (pending/declined) to accepted
        const { error } = await supabase
          .from("user_connections")
          .update({ status: "accepted" })
          .eq("id", existingConnection.id);
          
        if (error) throw error;
        return;
      }

      // Create new accepted connection
      const { error } = await supabase.from("user_connections").insert({
        requester_id: user.id,
        receiver_id: otherUserId,
        status: "accepted",
      });

      if (error) throw error;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["connections", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["connection-suggestions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["sent-requests", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["pending-requests", user?.id] });
      
      if (result === "already_connected") {
        toast({ title: "Already connected! 🤝" });
      } else {
        toast({ 
          title: "Connected! ⚡", 
          description: "You've successfully connected via ID scan.",
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Connection failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  return {
    connections,
    connectionsLoading,
    pendingRequests,
    sentRequests,
    suggestions,
    suggestionsLoading,
    allPeople,
    allPeopleLoading,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeConnection,
    directConnect,
  };
}
