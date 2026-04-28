import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      const { data, error } = await supabase.functions.invoke("ai-mentor", {
        body: input,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onError: (error) => {
      toast.error("Failed to get mentor response: " + error.message);
    },
  });
}
