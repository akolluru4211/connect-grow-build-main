import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { escapeSearchQuery } from "@/lib/searchUtils";

export interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[];
  is_published: boolean | null;
  published_at: string | null;
  scheduled_at: string | null;
  views_count: number | null;
  created_at: string;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  likes_count?: number;
  comments_count?: number;
  user_liked?: boolean;
}

export interface BlogComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const PAGE_SIZE = 10;

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

export function useInfiniteBlogPosts(search?: string) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ["blog-posts-infinite", user?.id, search],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("blog_posts")
        .select("*", { count: "exact" })
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (search && search.trim()) {
        const escapedSearch = escapeSearchQuery(search.trim());
        query = query.or(`title.ilike.%${escapedSearch}%,content.ilike.%${escapedSearch}%,excerpt.ilike.%${escapedSearch}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      const postsWithDetails = await Promise.all(
        (data || []).map((post) => fetchPostDetails(post, user?.id))
      );

      return {
        posts: postsWithDetails,
        nextPage: postsWithDetails.length === PAGE_SIZE ? pageParam + 1 : undefined,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}

export function useBlogs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Keep legacy query for backwards compatibility
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const postsWithDetails = await Promise.all(
        (data || []).map((post) => fetchPostDetails(post, user?.id))
      );

      return postsWithDetails;
    },
  });

  const { data: myPosts } = useQuery({
    queryKey: ["my-blog-posts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
    enabled: !!user,
  });

  const createPost = useMutation({
    mutationFn: async (postData: Partial<BlogPost> & { scheduled_at?: string }) => {
      if (!user) throw new Error("Must be logged in");

      const slug = postData.title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + "-" + Date.now();

      const isScheduled = postData.scheduled_at && new Date(postData.scheduled_at) > new Date();
      const shouldPublish = postData.is_published && !isScheduled;

      const { data, error } = await supabase
        .from("blog_posts")
        .insert({
          title: postData.title || "Untitled",
          content: postData.content || "",
          excerpt: postData.excerpt,
          cover_image_url: postData.cover_image_url,
          tags: postData.tags || [],
          is_published: shouldPublish,
          author_id: user.id,
          slug,
          published_at: shouldPublish ? new Date().toISOString() : null,
          scheduled_at: isScheduled ? postData.scheduled_at : null,
        })
        .select()
        .single();

      if (error) throw error;

      // If published, notify followers/connections
      if (postData.is_published) {
        // Get author's name - using profiles_public view for privacy
        const { data: authorProfile } = await supabase
          .from("profiles_public")
          .select("full_name")
          .eq("id", user.id)
          .single();

        const authorName = authorProfile?.full_name || "Someone";

        // Get user's connections
        const { data: connections } = await supabase
          .from("user_connections")
          .select("requester_id, receiver_id")
          .eq("status", "accepted")
          .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

        if (connections && connections.length > 0) {
          const notificationPromises = connections.map(async (conn) => {
            const recipientId = conn.requester_id === user.id 
              ? conn.receiver_id 
              : conn.requester_id;

            return supabase.from("notifications").insert({
              user_id: recipientId,
              type: "blog",
              title: "New Blog Post",
              message: `${authorName} published: "${postData.title}"`,
              link: "/blogs",
            });
          });

          await Promise.all(notificationPromises);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["my-blog-posts"] });
      toast({ title: "Post created successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error creating post", description: error.message, variant: "destructive" });
    },
  });

  const updatePost = useMutation({
    mutationFn: async ({ id, ...postData }: Partial<BlogPost> & { id: string }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          ...postData,
          published_at: postData.is_published ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["my-blog-posts"] });
      toast({ title: "Post updated!" });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["my-blog-posts"] });
      toast({ title: "Post deleted" });
    },
  });

  const toggleLike = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Must be logged in");

      const { data: existing } = await supabase
        .from("blog_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("blog_likes").delete().eq("id", existing.id);
      } else {
        await supabase.from("blog_likes").insert({ post_id: postId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts-infinite"] });
    },
  });

  return {
    posts,
    myPosts,
    isLoading,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
  };
}

export function useBlogComments(postId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["blog-comments", postId],
    queryFn: async () => {
      // Mock posts don't have UUIDs, so prevent querying Supabase to avoid invalid input syntax errors
      if (["1", "2", "3"].includes(postId)) {
        return [];
      }

      const { data, error } = await supabase
        .from("blog_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const commentsWithAuthors = await Promise.all(
        (data || []).map(async (comment) => {
          // Use profiles_public view for better security
          const { data: author } = await supabase
            .from("profiles_public")
            .select("full_name, avatar_url")
            .eq("id", comment.author_id)
            .single();

          return { ...comment, author } as BlogComment;
        })
      );

      return commentsWithAuthors;
    },
  });

  const addComment = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      if (!user) throw new Error("Must be logged in");

      if (["1", "2", "3"].includes(postId)) {
        return; // Bypass for mock posts
      }

      const { error } = await supabase.from("blog_comments").insert({
        post_id: postId,
        author_id: user.id,
        content,
        parent_id: parentId || null,
      });

      if (error) throw error;

      // Notify the blog post author about the comment
      const { data: post } = await supabase
        .from("blog_posts")
        .select("author_id, title")
        .eq("id", postId)
        .single();

      if (post && post.author_id !== user.id) {
        // Get commenter's name - using profiles_public view for privacy
        const { data: commenterProfile } = await supabase
          .from("profiles_public")
          .select("full_name")
          .eq("id", user.id)
          .single();

        const commenterName = commenterProfile?.full_name || "Someone";
        const commentPreview = content.length > 40 ? content.substring(0, 40) + "..." : content;

        await supabase.from("notifications").insert({
          user_id: post.author_id,
          type: "blog",
          title: "New Comment on Your Post",
          message: `${commenterName} commented: "${commentPreview}"`,
          link: "/blogs",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast({ title: "Comment added!" });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("blog_comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast({ title: "Comment deleted" });
    },
  });

  return {
    comments,
    isLoading,
    addComment,
    deleteComment,
  };
}
