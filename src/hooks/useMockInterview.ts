import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { safeInvoke } from "@/lib/gemini";

interface MockInterviewInput {
  question: string;
  answer: string;
  jobTitle?: string;
  questionType?: "behavioral" | "technical" | "situational";
}

interface StarAnalysis {
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
}

interface MockInterviewFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  improved_answer: string;
  tips: string[];
  star_analysis?: StarAnalysis;
}

export function useEvaluateResponse() {
  return useMutation({
    mutationFn: async (input: MockInterviewInput): Promise<MockInterviewFeedback> => {
      return await safeInvoke<MockInterviewFeedback>("mock-interview", input);
    },
    onError: (error) => {
      toast.error("Failed to evaluate response: " + error.message);
    },
  });
}
