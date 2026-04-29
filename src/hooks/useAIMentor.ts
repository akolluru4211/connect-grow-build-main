import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { safeInvoke } from "@/lib/gemini";

export type MentorType = 
  | "career" 
  | "technical" 
  | "interview" 
  | "resume" 
  | "learning"
  | "startup"
  | "freelance"
  | "networking"
  | "productivity"
  | "leadership";

interface MentorMessage {
  role: "user" | "assistant";
  content: string;
}

interface MentorInput {
  mentorType: MentorType;
  message: string;
  conversationHistory?: MentorMessage[];
}

interface MentorResponse {
  reply: string;
  mentorName: string;
}

export function useAIMentor() {
  return useMutation({
    mutationFn: async (input: MentorInput): Promise<MentorResponse> => {
      return await safeInvoke<MentorResponse>("ai-mentor", input);
    },
    onError: (error) => {
      toast.error("Failed to get mentor response: " + error.message);
    },
  });
}
