import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getDisplayName, getDisplayAvatar } from "@/lib/edworldProfile";

// Activity types and their point values
export const ACTIVITY_POINTS = {
  profile_update: 10,
  resume_created: 25,
  assessment_completed: 50,
  badge_earned: 100,
  job_applied: 15,
  event_registered: 10,
  post_published: 20,
  connection_made: 5,
  daily_login: 5,
} as const;

export type ActivityType = keyof typeof ACTIVITY_POINTS;

interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_points: number;
  profile_completion_percent: number;
}

interface ActivityPoint {
  id: string;
  user_id: string;
  activity_type: string;
  points: number;
  description: string | null;
  created_at: string;
}

export function useUserStreak() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-streak", user?.id],
    queryFn: async (): Promise<UserStreak | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useActivityHistory(limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activity-history", user?.id, limit],
    queryFn: async (): Promise<ActivityPoint[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_activity_points")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useGamificationLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ["gamification-leaderboard", limit],
    queryFn: async () => {
      const { data: streaks, error } = await supabase
        .from("user_streaks")
        .select("user_id, total_points, current_streak, longest_streak")
        .order("total_points", { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!streaks?.length) return [];

      const userIds = streaks.map((s) => s.user_id);
      // Use profiles_public view for privacy
      const { data: profiles, error: profileError } = await supabase
        .from("profiles_public")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      if (profileError) throw profileError;

      return streaks.map((s) => {
        const profile = profiles?.find((p) => p.id === s.user_id);
        return {
          user_id: s.user_id,
          full_name: getDisplayName(profile?.full_name),
          avatar_url: getDisplayAvatar(profile?.full_name, profile?.avatar_url),
          total_points: s.total_points,
          current_streak: s.current_streak,
          longest_streak: s.longest_streak,
        };
      });
    },
  });
}

export function useRecordActivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityType,
      description,
    }: {
      activityType: ActivityType;
      description?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const points = ACTIVITY_POINTS[activityType];

      const { error } = await supabase.from("user_activity_points").insert({
        user_id: user.id,
        activity_type: activityType,
        points,
        description: description || activityType.replace(/_/g, " "),
      });

      if (error) throw error;
      return { points };
    },
    onSuccess: ({ points }) => {
      queryClient.invalidateQueries({ queryKey: ["user-streak"] });
      queryClient.invalidateQueries({ queryKey: ["activity-history"] });
      queryClient.invalidateQueries({ queryKey: ["gamification-leaderboard"] });
      toast.success(`+${points} points earned!`);
    },
    onError: (error) => {
      console.error("Failed to record activity:", error);
    },
  });
}

export function calculateProfileCompletion(profile: any): number {
  if (!profile) return 0;

  const weights: Record<string, number> = {
    full_name: 15,
    headline: 10,
    bio: 15,
    location: 5,
    avatar_url: 15,
    linkedin_url: 15,
    github_url: 15,
    phone: 5,
    website: 5,
  };

  let score = 0;
  for (const [field, weight] of Object.entries(weights)) {
    if (profile[field] && profile[field].toString().trim().length > 0) {
      score += weight;
    }
  }

  return Math.min(score, 100);
}
