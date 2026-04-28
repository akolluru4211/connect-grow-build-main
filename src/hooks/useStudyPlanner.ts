import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { generateJSON } from "@/lib/gemini";

export function useStudyPlanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const plans = useQuery({
    queryKey: ["study-plans", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const generatePlan = useMutation({
    mutationFn: async (input: { goal: string; subjects: string[]; examDate?: string; hoursPerDay?: number }) => {
      const prompt = `
        Create a detailed study plan for the following goal:
        Goal: ${input.goal}
        Subjects: ${input.subjects.join(", ")}
        Target Date: ${input.examDate || "Flexible"}
        Available Hours Per Day: ${input.hoursPerDay || 3}

        Return a JSON object with this structure:
        {
          "title": "A catchy title for the study plan",
          "weeklySchedule": [
            {
              "week": 1,
              "theme": "Core Concepts",
              "days": [
                {
                  "day": "Monday",
                  "tasks": [
                    { "subject": "Subject Name", "topic": "Specific Topic", "duration": "1.5 hours" }
                  ]
                }
              ]
            }
          ],
          "tips": ["Tip 1", "Tip 2"]
        }
        Generate a plan for 4 weeks.
      `;

      const plan = await generateJSON<any>(prompt);

      // Save plan to DB
      const { error: saveError } = await supabase.from("study_plans").insert({
        user_id: user!.id,
        title: plan.title || input.goal,
        goal: input.goal,
        exam_date: input.examDate || null,
        subjects: input.subjects,
        schedule: plan,
      });
      if (saveError) throw saveError;
      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      toast.success("Study plan generated!");
    },
    onError: (e: any) => toast.error(e.message || "Failed to generate plan"),
  });

  const deletePlan = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase.from("study_plans").delete().eq("id", planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      toast.success("Plan deleted");
    },
  });

  return { plans: plans.data || [], isLoading: plans.isLoading, generatePlan, deletePlan };
}
