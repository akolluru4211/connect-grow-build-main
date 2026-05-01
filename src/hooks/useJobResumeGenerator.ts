import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { safeInvoke } from "@/lib/gemini";

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
      try {
        return await safeInvoke<GeneratedResumeData>("resume-ai", {
          type: "generate_from_job",
          jobTitle,
          jobDescription,
          data: userData,
        });
      } catch (error: any) {
        toast.error(error.message || "Failed to generate resume");
        return null;
      }
    },
    onSuccess: (data) => {
      if (data) {
        toast.success("Resume generated successfully!");
      }
    },
  });
}
