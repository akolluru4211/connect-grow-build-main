import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { safeInvoke } from "@/lib/gemini";

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
      return await safeInvoke<CoverLetterResult>("cover-letter", input);
    },
    onSuccess: () => {
      toast.success("Cover letter generated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to generate cover letter: " + error.message);
    },
  });
}
