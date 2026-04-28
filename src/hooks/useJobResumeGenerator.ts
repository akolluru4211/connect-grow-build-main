import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfileData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  experience?: Array<{
    title: string;
    company: string;
    description?: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
  }>;
  skills?: string[];
}

interface GenerateFromJobRequest {
  jobTitle: string;
  jobDescription: string;
  userData: UserProfileData;
}

export interface GeneratedResumeData {
  professional_summary: string;
  keywords: string[];
  required_skills: string[];
  matching_skills?: string[];
  skills_to_add?: string[];
  experience_bullets?: string[];
  match_score: number;
  recommendations?: string[];
}

export function useGenerateResumeFromJob() {
  return useMutation({
    mutationFn: async ({
      jobTitle,
      jobDescription,
      userData,
    }: GenerateFromJobRequest): Promise<GeneratedResumeData | null> => {
      const { data, error } = await supabase.functions.invoke("resume-ai", {
        body: {
          type: "generate_from_job",
          jobTitle,
          jobDescription,
          data: userData,
        },
      });

      if (error) {
        console.error("Generate resume error:", error);
        if (error.message?.includes("429")) {
          toast.error("Rate limit exceeded. Please try again later.");
        } else if (error.message?.includes("402")) {
          toast.error("AI credits exhausted. Please add funds.");
        } else {
          toast.error("Failed to generate resume");
        }
        return null;
      }

      return data as GeneratedResumeData;
    },
    onSuccess: (data) => {
      if (data) {
        toast.success("Resume generated successfully!");
      }
    },
  });
}
