import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CoverLetterInput {
  jobTitle: string;
  jobDescription: string;
  companyName?: string;
  userProfile?: {
    name?: string;
    headline?: string;
    bio?: string;
    skills?: string[];
    experience?: string;
  };
  tone?: "professional" | "enthusiastic" | "conversational";
}

interface CoverLetterResult {
  cover_letter: string;
  key_highlights: string[];
  customization_tips: string[];
  word_count: number;
}

export function useGenerateCoverLetter() {
  return useMutation({
    mutationFn: async (input: CoverLetterInput): Promise<CoverLetterResult> => {
      const { data, error } = await supabase.functions.invoke("cover-letter", {
        body: input,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Cover letter generated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to generate cover letter: " + error.message);
    },
  });
}
