import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, format, eachDayOfInterval } from "date-fns";

export interface PostAnalytics {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalPosts: number;
  viewsOverTime: { date: string; views: number }[];
  likesOverTime: { date: string; likes: number }[];
  engagementOverTime: { date: string; views: number; likes: number; comments: number }[];
  topPosts: {
    id: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
  }[];
  weeklyChange: {
    views: number;
    likes: number;
    comments: number;
  };
}

export function usePostAnalytics(days: number = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["post-analytics", user?.id, days],
    queryFn: async (): Promise<PostAnalytics> => {
      if (!user) throw new Error("Must be logged in");

      const endDate = new Date();
      const startDate = subDays(endDate, days);
      const lastWeekStart = subDays(endDate, 7);
      const twoWeeksAgoStart = subDays(endDate, 14);

      // Get all user's posts
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("id, title, views_count, created_at")
        .eq("author_id", user.id);

      if (!posts || posts.length === 0) {
        return {
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalPosts: 0,
          viewsOverTime: [],
          likesOverTime: [],
          engagementOverTime: [],
          topPosts: [],
          weeklyChange: { views: 0, likes: 0, comments: 0 },
        };
      }

      const postIds = posts.map((p) => p.id);

      // Get likes for user's posts
      const { data: likes } = await supabase
        .from("blog_likes")
        .select("created_at, post_id")
        .in("post_id", postIds);

      // Get comments for user's posts
      const { data: comments } = await supabase
        .from("blog_comments")
        .select("created_at, post_id")
        .in("post_id", postIds);

      // Calculate totals
      const totalViews = posts.reduce((sum, p) => sum + (p.views_count || 0), 0);
      const totalLikes = likes?.length || 0;
      const totalComments = comments?.length || 0;
      const totalPosts = posts.length;

      // Generate date range
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const dateLabels = dateRange.map((d) => format(d, "yyyy-MM-dd"));

      // Group likes by date
      const likesByDate: Record<string, number> = {};
      dateLabels.forEach((d) => (likesByDate[d] = 0));
      likes?.forEach((l) => {
        const date = format(new Date(l.created_at), "yyyy-MM-dd");
        if (likesByDate[date] !== undefined) likesByDate[date]++;
      });

      // Group comments by date
      const commentsByDate: Record<string, number> = {};
      dateLabels.forEach((d) => (commentsByDate[d] = 0));
      comments?.forEach((c) => {
        const date = format(new Date(c.created_at), "yyyy-MM-dd");
        if (commentsByDate[date] !== undefined) commentsByDate[date]++;
      });

      // Build time series data
      let cumulativeViews = 0;
      const viewsOverTime = dateLabels.map((date) => {
        // Simulate daily views based on total (since we don't track daily views)
        const dailyViews = Math.floor(totalViews / days);
        cumulativeViews += dailyViews;
        return { date: format(new Date(date), "MMM d"), views: cumulativeViews };
      });

      let cumulativeLikes = 0;
      const likesOverTime = dateLabels.map((date) => {
        cumulativeLikes += likesByDate[date] || 0;
        return { date: format(new Date(date), "MMM d"), likes: cumulativeLikes };
      });

      const engagementOverTime = dateLabels.map((date) => ({
        date: format(new Date(date), "MMM d"),
        views: Math.floor(totalViews / days),
        likes: likesByDate[date] || 0,
        comments: commentsByDate[date] || 0,
      }));

      // Get top posts by engagement
      const postsWithStats = await Promise.all(
        posts.map(async (post) => {
          const { count: postLikes } = await supabase
            .from("blog_likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          const { count: postComments } = await supabase
            .from("blog_comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          return {
            id: post.id,
            title: post.title,
            views: post.views_count || 0,
            likes: postLikes || 0,
            comments: postComments || 0,
          };
        })
      );

      const topPosts = postsWithStats
        .sort((a, b) => (b.views + b.likes * 2 + b.comments * 3) - (a.views + a.likes * 2 + a.comments * 3))
        .slice(0, 5);

      // Calculate weekly change
      const thisWeekLikes = likes?.filter(
        (l) => new Date(l.created_at) >= lastWeekStart
      ).length || 0;
      const lastWeekLikes = likes?.filter(
        (l) => new Date(l.created_at) >= twoWeeksAgoStart && new Date(l.created_at) < lastWeekStart
      ).length || 0;

      const thisWeekComments = comments?.filter(
        (c) => new Date(c.created_at) >= lastWeekStart
      ).length || 0;
      const lastWeekComments = comments?.filter(
        (c) => new Date(c.created_at) >= twoWeeksAgoStart && new Date(c.created_at) < lastWeekStart
      ).length || 0;

      const weeklyChange = {
        views: 0, // We don't track historical views
        likes: lastWeekLikes > 0 ? Math.round(((thisWeekLikes - lastWeekLikes) / lastWeekLikes) * 100) : 0,
        comments: lastWeekComments > 0 ? Math.round(((thisWeekComments - lastWeekComments) / lastWeekComments) * 100) : 0,
      };

      return {
        totalViews,
        totalLikes,
        totalComments,
        totalPosts,
        viewsOverTime,
        likesOverTime,
        engagementOverTime,
        topPosts,
        weeklyChange,
      };
    },
    enabled: !!user,
  });
}
