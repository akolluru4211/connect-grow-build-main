import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ResumeData } from "./useResumes";
import { safeInvoke } from "@/lib/gemini";

interface TailorRequest {
  resume: ResumeData;
  jobDescription: string;
  jobTitle?: string;
}

interface TailorResponse {
  tailored_summary: string;
  suggested_skills: string[];
  keyword_matches: string[];
  improvement_tips: string[];
  match_score: number;
}

export function useTailorResume() {
  return useMutation({
    mutationFn: async ({ resume, jobDescription, jobTitle }: TailorRequest): Promise<TailorResponse> => {
      return await safeInvoke<TailorResponse>("resume-ai", {
        type: "tailor",
        resume,
        jobDescription,
        jobTitle,
      });
    },
    onSuccess: () => {
      toast.success("Resume tailored to job description!");
    },
    onError: (error) => {
      toast.error("Failed to tailor resume: " + error.message);
    }
  });
}
