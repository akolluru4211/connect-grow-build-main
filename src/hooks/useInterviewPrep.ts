import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { generateJSON } from "@/lib/gemini";

export interface InterviewQuestion {
  question: string;
  type: "behavioral" | "technical" | "situational" | "culture-fit";
  tips: string[];
  example_answer: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface InterviewPrepResult {
  questions: InterviewQuestion[];
  general_tips: string[];
  company_research_tips?: string[];
}

interface InterviewPrepInput {
  jobTitle: string;
  jobDescription: string;
  company?: string;
  difficulty?: "easy" | "medium" | "hard";
  questionCount?: number;
}

export function useInterviewPrep() {
  return useMutation({
    mutationFn: async (input: InterviewPrepInput): Promise<InterviewPrepResult> => {
      const prompt = `
        Generate interview preparation materials for the following job:
        Job Title: ${input.jobTitle}
        Company: ${input.company || "N/A"}
        Job Description: ${input.jobDescription}
        Difficulty: ${input.difficulty || "medium"}
        Number of Questions: ${input.questionCount || 5}

        Return a JSON object with the following structure:
        {
          "questions": [
            {
              "question": "The interview question",
              "type": "behavioral" | "technical" | "situational" | "culture-fit",
              "tips": ["Tip 1", "Tip 2"],
              "example_answer": "A detailed example answer framework",
              "difficulty": "easy" | "medium" | "hard"
            }
          ],
          "general_tips": ["General tip 1", "General tip 2"],
          "company_research_tips": ["Research tip 1", "Research tip 2"]
        }
      `;

      return await generateJSON<InterviewPrepResult>(prompt);
    },
    onError: (error) => {
      toast.error("Failed to generate interview questions: " + error.message);
    },
  });
}
