import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const ONBOARDING_STEPS = [
  { id: "profile", label: "Complete Profile", description: "Add your name, photo, and headline" },
  { id: "skills", label: "Add Skills", description: "Showcase your expertise" },
  { id: "experience", label: "Add Experience", description: "Share your work history" },
  { id: "network", label: "Build Network", description: "Connect with professionals" },
  { id: "explore", label: "Explore Features", description: "Discover jobs, courses, and more" },
] as const;

export type OnboardingStepId = typeof ONBOARDING_STEPS[number]["id"];

interface OnboardingStatus {
  id: string;
  user_id: string;
  completed_steps: string[];
  is_completed: boolean;
  skipped_at: string | null;
  completed_at: string | null;
}

export function useOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ["onboarding-status", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("onboarding_status")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      
      // If no status exists, create one
      if (!data) {
        const { data: newStatus, error: insertError } = await supabase
          .from("onboarding_status")
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newStatus as OnboardingStatus;
      }

      return data as OnboardingStatus;
    },
    enabled: !!user?.id,
  });

  const completeStep = useMutation({
    mutationFn: async (stepId: OnboardingStepId) => {
      if (!user?.id || !status) throw new Error("Not authenticated");

      const newSteps = status.completed_steps.includes(stepId)
        ? status.completed_steps
        : [...status.completed_steps, stepId];

      const isNowComplete = newSteps.length === ONBOARDING_STEPS.length;

      const { error } = await supabase
        .from("onboarding_status")
        .update({
          completed_steps: newSteps,
          is_completed: isNowComplete,
          completed_at: isNowComplete ? new Date().toISOString() : null,
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });

  const skipOnboarding = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("onboarding_status")
        .update({
          is_completed: true,
          skipped_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });

  const resetOnboarding = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("onboarding_status")
        .update({
          completed_steps: [],
          is_completed: false,
          skipped_at: null,
          completed_at: null,
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    },
  });

  const completedSteps = status?.completed_steps || [];
  const currentStepIndex = completedSteps.length;
  const currentStep = ONBOARDING_STEPS[currentStepIndex] || null;
  const progress = (completedSteps.length / ONBOARDING_STEPS.length) * 100;
  const showOnboarding = !isLoading && status && !status.is_completed;

  return {
    status,
    isLoading,
    completedSteps,
    currentStep,
    currentStepIndex,
    progress,
    showOnboarding,
    completeStep: completeStep.mutate,
    skipOnboarding: skipOnboarding.mutate,
    resetOnboarding: resetOnboarding.mutate,
  };
}
