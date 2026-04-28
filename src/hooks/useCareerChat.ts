import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { generateStream } from "@/lib/gemini";

type Message = { role: "user" | "assistant"; content: string };

export function useCareerChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (input: string) => {
    if (!user) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const allMessages = [...messages, userMsg];
    const prompt = `
      You are an expert career counselor. Provide helpful, actionable advice.
      Conversation history:
      ${allMessages.map(m => `${m.role}: ${m.content}`).join("\n")}
      
      assistant:
    `;

    try {
      let assistantSoFar = "";
      
      await generateStream(prompt, (text) => {
        assistantSoFar = text;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      });

      // Save to DB
      await supabase.from("career_chat_messages").insert([
        { user_id: user.id, role: "user", content: input },
        { user_id: user.id, role: "assistant", content: assistantSoFar },
      ]);
    } catch (e: any) {
      toast.error(e.message || "Failed to get career advice");
      setMessages(prev => prev.filter(m => m !== userMsg));
    } finally {
      setIsLoading(false);
    }
  }, [messages, user]);

  const clearChat = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearChat };
}
