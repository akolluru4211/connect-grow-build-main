import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BlogPost } from "./useBlogs";

async function fetchPostDetails(post: any, userId: string | undefined) {
  // Use profiles_public view for better security
  const { data: author } = await supabase
    .from("profiles_public")
    .select("full_name, avatar_url")
    .eq("id", post.author_id)
    .single();

  const { count: likesCount } = await supabase
    .from("blog_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", post.id);

  const { count: commentsCount } = await supabase
    .from("blog_comments")
    .select("*", { count: "exact", head: true })
    .eq("post_id", post.id);

  let userLiked = false;
  if (userId) {
    const { data: like } = await supabase
      .from("blog_likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", userId)
      .maybeSingle();
    userLiked = !!like;
  }

  return {
    ...post,
    author,
    likes_count: likesCount || 0,
    comments_count: commentsCount || 0,
    user_liked: userLiked,
  } as BlogPost;
}

export function useForYouFeed() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["for-you-feed", user?.id],
    queryFn: async () => {
      if (!user) {
        // For non-logged in users, return popular posts
        const { data: popularPosts, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("is_published", true)
          .order("views_count", { ascending: false })
          .limit(20);

        if (error) throw error;

        return Promise.all(
          (popularPosts || []).map((post) => fetchPostDetails(post, undefined))
        );
      }

      // Get users the current user is following
      const { data: followingData } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = (followingData || []).map((f) => f.following_id);

      // Get user's liked posts to understand their interests
      const { data: likedPosts } = await supabase
        .from("blog_likes")
        .select("post_id")
        .eq("user_id", user.id);

      // Get user's saved posts
      const { data: savedPosts } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", user.id);

      const interactedPostIds = [
        ...(likedPosts || []).map((l) => l.post_id),
        ...(savedPosts || []).map((s) => s.post_id),
      ];

      // Get tags from interacted posts
      let userInterestTags: string[] = [];
      if (interactedPostIds.length > 0) {
        const { data: interactedPostsData } = await supabase
          .from("blog_posts")
          .select("tags")
          .in("id", interactedPostIds);

        const tagCounts: Record<string, number> = {};
        (interactedPostsData || []).forEach((post) => {
          (post.tags || []).forEach((tag: string) => {
            const normalizedTag = tag.toLowerCase().trim();
            if (normalizedTag) {
              tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
            }
          });
        });

        // Get top interest tags
        userInterestTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag]) => tag);
      }

      let allPosts: any[] = [];

      // Priority 1: Posts from followed authors (most important)
      if (followingIds.length > 0) {
        const { data: followedPosts } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("is_published", true)
          .in("author_id", followingIds)
          .order("published_at", { ascending: false })
          .limit(20);

        allPosts = [...(followedPosts || [])];
      }

      // Priority 2: Posts matching user's interests (based on tags)
      if (userInterestTags.length > 0 && allPosts.length < 20) {
        const existingIds = allPosts.map((p) => p.id);
        const { data: matchingPosts } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("is_published", true)
          .neq("author_id", user.id)
          .overlaps("tags", userInterestTags)
          .order("published_at", { ascending: false })
          .limit(30);

        const newPosts = (matchingPosts || []).filter(
          (p) => !existingIds.includes(p.id)
        );
        allPosts = [...allPosts, ...newPosts];
      }

      // Priority 3: Popular posts to fill remaining slots
      if (allPosts.length < 15) {
        const existingIds = allPosts.map((p) => p.id);
        const { data: popularPosts } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("is_published", true)
          .neq("author_id", user.id)
          .order("views_count", { ascending: false })
          .limit(20);

        const newPosts = (popularPosts || []).filter(
          (p) => !existingIds.includes(p.id)
        );
        allPosts = [...allPosts, ...newPosts];
      }

      // Exclude already interacted posts (liked/saved)
      const filteredPosts = allPosts.filter(
        (p) => !interactedPostIds.includes(p.id)
      );

      // Fetch full details for each post (limit to 25)
      const postsWithDetails = await Promise.all(
        filteredPosts.slice(0, 25).map((post) => fetchPostDetails(post, user.id))
      );

      return postsWithDetails;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
