import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { safeInvoke } from "@/lib/gemini";

interface RoadmapSkill {
  name: string;
  priority: "essential" | "important" | "nice-to-have";
  resources?: string[];
}

interface RoadmapProject {
  name: string;
  description: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

interface RoadmapPhase {
  name: string;
  duration: string;
  description?: string;
  skills: RoadmapSkill[];
  projects?: RoadmapProject[];
  milestones?: string[];
}

interface Certification {
  name: string;
  provider: string;
  cost?: string;
  difficulty?: string;
}

export interface AIRoadmap {
  title: string;
  summary: string;
  totalDuration?: string;
  phases: RoadmapPhase[];
  certifications?: Certification[];
  salaryExpectations?: {
    entry: string;
    mid: string;
    senior: string;
  };
  interviewTips?: string[];
}

interface RoadmapInput {
  careerGoal: string;
  currentSkills?: string;
  timeframe?: string;
  experienceLevel?: "beginner" | "intermediate" | "advanced";
}

export function useAIRoadmap() {
  return useMutation({
    mutationFn: async (input: RoadmapInput): Promise<AIRoadmap> => {
      return await safeInvoke<AIRoadmap>("ai-roadmap", input);
    },
    onError: (error) => {
      toast.error("Failed to generate roadmap: " + error.message);
    },
  });
}
