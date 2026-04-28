import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrendingTopic {
  tag: string;
  count: number;
}

export function useTrendingTopics() {
  return useQuery({
    queryKey: ["trending-topics"],
    queryFn: async () => {
      // Fetch all published posts' tags
      const { data: posts, error } = await supabase
        .from("blog_posts")
        .select("tags")
        .eq("is_published", true)
        .not("tags", "is", null);

      if (error) throw error;

      // Count tag occurrences
      const tagCounts: Record<string, number> = {};
      (posts || []).forEach((post) => {
        (post.tags || []).forEach((tag: string) => {
          const normalizedTag = tag.toLowerCase().trim();
          if (normalizedTag) {
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          }
        });
      });

      // Convert to array and sort by count
      const sortedTags: TrendingTopic[] = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return sortedTags;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
