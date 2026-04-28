import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: input,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onError: (error) => {
      toast.error("Failed to evaluate response: " + error.message);
    },
  });
}
