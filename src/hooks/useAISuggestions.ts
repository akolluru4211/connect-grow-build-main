import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TitleSuggestions {
  titles: string[];
}

interface TagSuggestions {
  tags: string[];
}

interface ImprovementSuggestion {
  area: string;
  suggestion: string;
}

interface ImprovementSuggestions {
  suggestions: ImprovementSuggestion[];
}

export function useAISuggestions() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<ImprovementSuggestion[]>([]);

  const getSuggestions = async (
    type: "title" | "tags" | "improve",
    content: string,
    excerpt?: string
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/blog-ai-suggestions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ content, excerpt, type }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast({
            title: "Rate Limited",
            description: "Please wait a moment before trying again.",
            variant: "destructive",
          });
          return null;
        }
        if (response.status === 402) {
          toast({
            title: "AI Credits Exhausted",
            description: "Please add credits to continue using AI suggestions.",
            variant: "destructive",
          });
          return null;
        }
        throw new Error(errorData.error || "Failed to get suggestions");
      }

      const data = await response.json();

      if (type === "title" && data.titles) {
        setTitleSuggestions(data.titles);
        return data as TitleSuggestions;
      } else if (type === "tags" && data.tags) {
        setTagSuggestions(data.tags);
        return data as TagSuggestions;
      } else if (type === "improve" && data.suggestions) {
        setImprovements(data.suggestions);
        return data as ImprovementSuggestions;
      }

      return data;
    } catch (error) {
      console.error("AI suggestion error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI suggestions",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearSuggestions = () => {
    setTitleSuggestions([]);
    setTagSuggestions([]);
    setImprovements([]);
  };

  return {
    isLoading,
    titleSuggestions,
    tagSuggestions,
    improvements,
    getSuggestions,
    clearSuggestions,
  };
}
