import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ResumeData } from "./useResumes";

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
    mutationFn: async ({ resume, jobDescription, jobTitle }: TailorRequest): Promise<TailorResponse | null> => {
      const { data, error } = await supabase.functions.invoke("resume-ai", {
        body: {
          type: "tailor",
          resume,
          jobDescription,
          jobTitle,
        },
      });

      if (error) {
        console.error("Tailor error:", error);
        toast.error("Failed to tailor resume");
        return null;
      }

      return data as TailorResponse;
    },
    onSuccess: () => {
      toast.success("Resume tailored to job description!");
    },
  });
}
