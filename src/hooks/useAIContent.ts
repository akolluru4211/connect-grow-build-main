import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AIContent {
  id: string;
  content_type: "blog" | "job_update" | "hackathon_update" | "internship_update";
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export function useAIContent(contentType?: string) {
  return useQuery({
    queryKey: ["ai-content", contentType],
    queryFn: async () => {
      let query = supabase
        .from("ai_generated_content")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(10);

      if (contentType && contentType !== "all") {
        query = query.eq("content_type", contentType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AIContent[];
    },
  });
}

export function useGenerateAIContent() {
  const generateContent = async (contentType: string) => {
    const response = await supabase.functions.invoke("ai-content-generator", {
      body: { contentType },
    });

    if (response.error) {
      throw new Error(response.error.message || "Failed to generate content");
    }

    return response.data;
  };

  return { generateContent };
}
