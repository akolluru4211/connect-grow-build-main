import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  requirement_type: string;
  requirement_value: number;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async (): Promise<Achievement[]> => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("points", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useUserAchievements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async (): Promise<UserAchievement[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

export function useAwardAchievement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("user_achievements").insert({
        user_id: user.id,
        achievement_id: achievementId,
      });

      if (error) {
        if (error.code === "23505") {
          // Already has achievement
          return null;
        }
        throw error;
      }

      // Get achievement details for toast
      const { data: achievement } = await supabase
        .from("achievements")
        .select("name, points")
        .eq("id", achievementId)
        .single();

      return achievement;
    },
    onSuccess: (achievement) => {
      if (achievement) {
        toast.success(`🏆 Achievement Unlocked: ${achievement.name}! +${achievement.points} points`);
        queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
        queryClient.invalidateQueries({ queryKey: ["user-streak"] });
      }
    },
    onError: (error) => {
      console.error("Failed to award achievement:", error);
    },
  });
}

export function useCheckAndAwardAchievements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityType: string) => {
      if (!user?.id) return [];

      // Get all achievements
      const { data: achievements } = await supabase
        .from("achievements")
        .select("*");

      // Get user's current achievements
      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);

      const earnedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || []);
      const newAchievements: Achievement[] = [];

      // Check each unearned achievement
      for (const achievement of achievements || []) {
        if (earnedIds.has(achievement.id)) continue;

        let earned = false;

        if (achievement.requirement_type === activityType) {
          earned = true;
        }

        if (earned) {
          const { error } = await supabase.from("user_achievements").insert({
            user_id: user.id,
            achievement_id: achievement.id,
          });

          if (!error) {
            newAchievements.push(achievement);
          }
        }
      }

      return newAchievements;
    },
    onSuccess: (achievements) => {
      achievements.forEach((a) => {
        toast.success(`🏆 Achievement Unlocked: ${a.name}! +${a.points} points`);
      });
      if (achievements.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
      }
    },
  });
}

export const ACHIEVEMENT_ICONS: Record<string, string> = {
  "user-check": "UserCheck",
  "file-text": "FileText",
  "briefcase": "Briefcase",
  "mic": "Mic",
  "mail": "Mail",
  "video": "Video",
  "flame": "Flame",
  "award": "Award",
  "users": "Users",
  "pen-tool": "PenTool",
  "calendar": "Calendar",
  "star": "Star",
  "trophy": "Trophy",
};
