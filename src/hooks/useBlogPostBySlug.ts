import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BlogPost } from "./useBlogs";

export function useBlogPostBySlug(slug: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Check if it's one of our mock AI Hub blogs
          if (["1", "2", "3"].includes(slug)) {
            const mockTitles: Record<string, string> = {
              "1": "How Claude 3.5 Sonnet is Revolutionizing React Development",
              "2": "Top 10 AI Jobs to Watch in 2026",
              "3": "Automating Resume Tailoring with LLMs"
            };
            return {
              id: slug,
              slug: slug,
              title: mockTitles[slug],
              content: `<p>This is a synthesized AI-generated article highlighting the rapid developments in intelligent ecosystem tooling. In modern tech workflows, AI is no longer a novelty—it is a critical driver of efficiency.</p><p>As AI agents assist in complex coding structures or autonomous data manipulation, professionals must shift their focus toward systemic architecture and critical problem solving.</p><h2>The Core Benefits</h2><ul><li>Massively accelerated boilerplate generation.</li><li>Intelligent real-time debugging.</li><li>Adaptive continuous learning models.</li></ul><p>Stay ahead of the curve by integrating these capabilities natively into your operations today.</p>`,
              excerpt: "A deep dive into how modern AI is reshaping developmental paradigms.",
              cover_image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80",
              category_id: null,
              author_id: "system",
              is_published: true,
              published_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              views_count: 1205,
              likes_count: 340,
              comments_count: 12,
              user_liked: false,
              tags: ["AI", "Career", "Technology"],
              author: {
                full_name: "EdWorld AI Engine",
                avatar_url: null
              }
            } as any;
          }
          return null; // Normal Not found
        }
        throw error;
      }

      // Get author from profiles_public view
      const { data: author } = await supabase
        .from("profiles_public")
        .select("full_name, avatar_url")
        .eq("id", data.author_id)
        .single();

      // Get likes count
      const { count: likesCount } = await supabase
        .from("blog_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", data.id);

      // Get comments count
      const { count: commentsCount } = await supabase
        .from("blog_comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", data.id);

      // Check if user liked
      let userLiked = false;
      if (user) {
        const { data: like } = await supabase
          .from("blog_likes")
          .select("id")
          .eq("post_id", data.id)
          .eq("user_id", user.id)
          .maybeSingle();
        userLiked = !!like;
      }

      return {
        ...data,
        author,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        user_liked: userLiked,
      } as BlogPost;
    },
    enabled: !!slug,
  });

  const incrementViewsMutation = useMutation({
    mutationFn: async () => {
      if (!post?.id) return;
      if (["1", "2", "3"].includes(post.id)) return; // Bypass for mock posts
      
      // Increment views count directly
      await supabase
        .from("blog_posts")
        .update({ views_count: (post.views_count || 0) + 1 })
        .eq("id", post.id);
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !post) throw new Error("Must be logged in");
      
      if (["1", "2", "3"].includes(post.id)) {
        // Toggle optimistic like for mock post
        return;
      }

      const { data: existing } = await supabase
        .from("blog_likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("blog_likes").delete().eq("id", existing.id);
      } else {
        await supabase.from("blog_likes").insert({ post_id: post.id, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-post", slug] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts-infinite"] });
    },
  });

  return {
    post,
    isLoading,
    incrementViews: () => incrementViewsMutation.mutate(),
    toggleLike: () => toggleLikeMutation.mutate(),
  };
}
