import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, subDays } from "date-fns";

export function useHabits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const habits = useQuery({
    queryKey: ["habits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const completions = useQuery({
    queryKey: ["habit-completions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", user!.id)
        .gte("completed_date", sevenDaysAgo);
      if (error) throw error;
      return data;
    },
  });

  const streak = useQuery({
    queryKey: ["learning-streak", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_streaks")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const createHabit = useMutation({
    mutationFn: async (input: { name: string; description?: string; color?: string }) => {
      const { error } = await supabase.from("habits").insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habit created!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleCompletion = useMutation({
    mutationFn: async ({ habitId, date, completed }: { habitId: string; date: string; completed: boolean }) => {
      if (completed) {
        await supabase.from("habit_completions").delete().eq("habit_id", habitId).eq("completed_date", date);
      } else {
        const { error } = await supabase.from("habit_completions").insert({
          habit_id: habitId,
          user_id: user!.id,
          completed_date: date,
        });
        if (error) throw error;

        // Log daily activity for streak
        await supabase.from("daily_activity_log").upsert(
          { user_id: user!.id, activity_date: date, activities: [{ type: "habit", habitId }] },
          { onConflict: "user_id,activity_date" }
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit-completions"] });
      queryClient.invalidateQueries({ queryKey: ["learning-streak"] });
    },
  });

  const deleteHabit = useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase.from("habits").update({ is_active: false }).eq("id", habitId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habit removed");
    },
  });

  return {
    habits: habits.data || [],
    completions: completions.data || [],
    streak: streak.data,
    isLoading: habits.isLoading,
    createHabit,
    toggleCompletion,
    deleteHabit,
  };
}
