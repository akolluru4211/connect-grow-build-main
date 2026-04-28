import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface FollowProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
}

export function useFollows() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get users the current user is following with profiles
  const { data: following, isLoading: followingLoading } = useQuery({
    queryKey: ["following", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (error) throw error;
      return data.map((f) => f.following_id);
    },
    enabled: !!user,
  });

  // Get following with full profiles
  const { data: followingProfiles, isLoading: followingProfilesLoading } = useQuery({
    queryKey: ["following-profiles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: follows, error: followsError } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followsError) throw followsError;
      if (!follows || follows.length === 0) return [];

      const followingIds = follows.map((f) => f.following_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles_public")
        .select("id, full_name, avatar_url, headline")
        .in("id", followingIds);

      if (profilesError) throw profilesError;
      return (profiles || []) as FollowProfile[];
    },
    enabled: !!user,
  });

  // Get followers with full profiles
  const { data: followerProfiles, isLoading: followerProfilesLoading } = useQuery({
    queryKey: ["follower-profiles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: follows, error: followsError } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("following_id", user.id);

      if (followsError) throw followsError;
      if (!follows || follows.length === 0) return [];

      const followerIds = follows.map((f) => f.follower_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles_public")
        .select("id, full_name, avatar_url, headline")
        .in("id", followerIds);

      if (profilesError) throw profilesError;
      return (profiles || []) as FollowProfile[];
    },
    enabled: !!user,
  });

  // Get followers of the current user
  const { data: followers, isLoading: followersLoading } = useQuery({
    queryKey: ["followers", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_follows")
        .select("follower_id")
        .eq("following_id", user.id);

      if (error) throw error;
      return data.map((f) => f.follower_id);
    },
    enabled: !!user,
  });

  // Check if following a specific user
  const isFollowing = (userId: string) => {
    return following?.includes(userId) ?? false;
  };

  // Follow a user
  const followUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error("Must be logged in");
      if (userId === user.id) throw new Error("Cannot follow yourself");

      const { error } = await supabase
        .from("user_follows")
        .insert({ follower_id: user.id, following_id: userId });

      if (error) throw error;

      // Create notification for the followed user - using profiles_public view for privacy
      const { data: followerProfile } = await supabase
        .from("profiles_public")
        .select("full_name")
        .eq("id", user.id)
        .single();

      await supabase.from("notifications").insert({
        user_id: userId,
        type: "network",
        title: "New Follower",
        message: `${followerProfile?.full_name || "Someone"} started following you`,
        link: "/network",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["following-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["for-you-feed"] });
      toast({ title: "Following!" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unfollow a user
  const unfollowUser = useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["following-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["for-you-feed"] });
      toast({ title: "Unfollowed" });
    },
  });

  // Toggle follow status
  const toggleFollow = useMutation({
    mutationFn: async (userId: string) => {
      if (isFollowing(userId)) {
        await unfollowUser.mutateAsync(userId);
      } else {
        await followUser.mutateAsync(userId);
      }
    },
  });

  return {
    following,
    followers,
    followingProfiles,
    followerProfiles,
    followingLoading,
    followersLoading,
    followingProfilesLoading,
    followerProfilesLoading,
    isFollowing,
    followUser,
    unfollowUser,
    toggleFollow,
    followingCount: following?.length ?? 0,
    followersCount: followers?.length ?? 0,
  };
}

// Get follow stats for a specific user
export function useUserFollowStats(userId: string | undefined) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["user-follow-stats", userId],
    queryFn: async () => {
      if (!userId) return { followersCount: 0, followingCount: 0 };

      const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
        supabase
          .from("user_follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId),
        supabase
          .from("user_follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId),
      ]);

      return {
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
      };
    },
    enabled: !!userId,
  });

  return { stats, isLoading };
}
