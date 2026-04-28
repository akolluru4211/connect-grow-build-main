import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Assessment {
  id: string;
  skill_id: string | null;
  title: string;
  description: string | null;
  difficulty: string;
  time_limit_minutes: number | null;
  passing_score: number | null;
  questions_count: number | null;
  skills?: { name: string; category: string | null } | null;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  order_index: number | null;
}

export interface AttemptResult {
  id: string;
  score: number;
  passed: boolean;
  time_taken_seconds: number | null;
  completed_at: string;
}

export interface Badge {
  id: string;
  skill_id: string;
  badge_level: string;
  earned_at: string;
  skills?: { name: string; category: string | null } | null;
}

export interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  badge_count: number;
  total_score: number;
}

export function useAssessments() {
  return useQuery({
    queryKey: ["assessments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skill_assessments")
        .select(`*, skills(name, category)`)
        .eq("is_active", true);
      if (error) throw error;
      return data as Assessment[];
    },
  });
}

export function useAssessment(id: string) {
  return useQuery({
    queryKey: ["assessment", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skill_assessments")
        .select(`*, skills(name, category)`)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Assessment;
    },
    enabled: !!id,
  });
}

export function useAssessmentQuestions(assessmentId: string) {
  return useQuery({
    queryKey: ["assessmentQuestions", assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_questions")
        .select("*")
        .eq("assessment_id", assessmentId)
        .order("order_index");
      if (error) throw error;
      return data.map(q => ({
        ...q,
        options: q.options as string[]
      })) as Question[];
    },
    enabled: !!assessmentId,
  });
}

export function useSubmitAssessment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assessmentId,
      answers,
      score,
      passed,
      timeTaken,
      skillId,
      difficulty,
    }: {
      assessmentId: string;
      answers: Record<string, number>;
      score: number;
      passed: boolean;
      timeTaken: number;
      skillId: string;
      difficulty: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Save attempt
      const { error: attemptError } = await supabase
        .from("assessment_attempts")
        .insert({
          user_id: user.id,
          assessment_id: assessmentId,
          score,
          passed,
          answers,
          time_taken_seconds: timeTaken,
        });
      if (attemptError) throw attemptError;

      // Award badge if passed
      if (passed) {
        const { error: badgeError } = await supabase
          .from("user_badges")
          .insert({
            user_id: user.id,
            skill_id: skillId,
            assessment_id: assessmentId,
            badge_level: difficulty,
          });
        // Ignore duplicate error
        if (badgeError && !badgeError.message.includes("duplicate")) {
          console.error("Badge error:", badgeError);
        }

        // Create notification
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "badge",
          title: "Badge Earned!",
          message: `You earned a ${difficulty} badge!`,
          link: "/assessments",
        });
      }

      return { score, passed };
    },
    onSuccess: (_, { passed }) => {
      queryClient.invalidateQueries({ queryKey: ["userBadges"] });
      queryClient.invalidateQueries({ queryKey: ["assessmentAttempts"] });
      if (passed) {
        toast.success("Congratulations! You earned a badge!");
      } else {
        toast.info("Keep practicing! You can try again.");
      }
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUserBadges(userId?: string) {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  return useQuery({
    queryKey: ["userBadges", targetId],
    queryFn: async () => {
      if (!targetId) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select(`*, skills(name, category)`)
        .eq("user_id", targetId)
        .order("earned_at", { ascending: false });
      if (error) throw error;
      return data as Badge[];
    },
    enabled: !!targetId,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      // Get all badges with user profiles
      const { data: badges, error } = await supabase
        .from("user_badges")
        .select("user_id");
      
      if (error) throw error;

      // Count badges per user
      const badgeCounts: Record<string, number> = {};
      badges.forEach(b => {
        badgeCounts[b.user_id] = (badgeCounts[b.user_id] || 0) + 1;
      });

      // Get profiles for users with badges
      const userIds = Object.keys(badgeCounts);
      if (userIds.length === 0) return [];

      // Use profiles_public view for privacy
      const { data: profiles, error: profileError } = await supabase
        .from("profiles_public")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      if (profileError) throw profileError;

      // Combine data
      const leaderboard: LeaderboardEntry[] = (profiles || []).map(p => ({
        user_id: p.id!,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        badge_count: badgeCounts[p.id!] || 0,
        total_score: (badgeCounts[p.id!] || 0) * 100,
      }));

      return leaderboard.sort((a, b) => b.badge_count - a.badge_count).slice(0, 10);
    },
  });
}
