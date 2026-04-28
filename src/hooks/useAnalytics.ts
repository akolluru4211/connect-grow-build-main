import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, startOfDay, eachDayOfInterval } from "date-fns";

export interface AnalyticsData {
  userGrowth: { date: string; count: number }[];
  jobApplications: { date: string; count: number }[];
  engagement: { date: string; posts: number; comments: number; events: number }[];
  totals: {
    newUsersThisWeek: number;
    newUsersLastWeek: number;
    applicationsThisWeek: number;
    applicationsLastWeek: number;
  };
}

export function useAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ["admin-analytics", days],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      const lastWeekStart = subDays(endDate, 7);
      const twoWeeksAgoStart = subDays(endDate, 14);

      // Generate date range
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const dateLabels = dateRange.map((d) => format(d, "yyyy-MM-dd"));

      // Get user signups over time
      const { data: profiles } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

      // Count users per day
      const userCountsByDate: Record<string, number> = {};
      dateLabels.forEach((d) => (userCountsByDate[d] = 0));
      profiles?.forEach((p) => {
        const date = format(new Date(p.created_at), "yyyy-MM-dd");
        if (userCountsByDate[date] !== undefined) {
          userCountsByDate[date]++;
        }
      });

      // Cumulative user growth
      let cumulative = 0;
      const userGrowth = dateLabels.map((date) => {
        cumulative += userCountsByDate[date] || 0;
        return { date: format(new Date(date), "MMM d"), count: cumulative };
      });

      // Get job applications over time
      const { data: applications } = await supabase
        .from("job_applications")
        .select("applied_at")
        .gte("applied_at", startDate.toISOString());

      const appCountsByDate: Record<string, number> = {};
      dateLabels.forEach((d) => (appCountsByDate[d] = 0));
      applications?.forEach((a) => {
        const date = format(new Date(a.applied_at), "yyyy-MM-dd");
        if (appCountsByDate[date] !== undefined) {
          appCountsByDate[date]++;
        }
      });

      const jobApplications = dateLabels.map((date) => ({
        date: format(new Date(date), "MMM d"),
        count: appCountsByDate[date] || 0,
      }));

      // Get engagement metrics (posts, comments, events)
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

      const { data: comments } = await supabase
        .from("blog_comments")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

      const { data: eventRsvps } = await supabase
        .from("event_rsvps")
        .select("rsvp_at")
        .gte("rsvp_at", startDate.toISOString());

      const postsByDate: Record<string, number> = {};
      const commentsByDate: Record<string, number> = {};
      const eventsByDate: Record<string, number> = {};

      dateLabels.forEach((d) => {
        postsByDate[d] = 0;
        commentsByDate[d] = 0;
        eventsByDate[d] = 0;
      });

      posts?.forEach((p) => {
        const date = format(new Date(p.created_at), "yyyy-MM-dd");
        if (postsByDate[date] !== undefined) postsByDate[date]++;
      });

      comments?.forEach((c) => {
        const date = format(new Date(c.created_at), "yyyy-MM-dd");
        if (commentsByDate[date] !== undefined) commentsByDate[date]++;
      });

      eventRsvps?.forEach((e) => {
        const date = format(new Date(e.rsvp_at), "yyyy-MM-dd");
        if (eventsByDate[date] !== undefined) eventsByDate[date]++;
      });

      const engagement = dateLabels.map((date) => ({
        date: format(new Date(date), "MMM d"),
        posts: postsByDate[date] || 0,
        comments: commentsByDate[date] || 0,
        events: eventsByDate[date] || 0,
      }));

      // Calculate week-over-week comparisons
      const thisWeekUsers = profiles?.filter(
        (p) => new Date(p.created_at) >= lastWeekStart
      ).length || 0;

      const lastWeekUsers = profiles?.filter(
        (p) =>
          new Date(p.created_at) >= twoWeeksAgoStart &&
          new Date(p.created_at) < lastWeekStart
      ).length || 0;

      const thisWeekApps = applications?.filter(
        (a) => new Date(a.applied_at) >= lastWeekStart
      ).length || 0;

      const lastWeekApps = applications?.filter(
        (a) =>
          new Date(a.applied_at) >= twoWeeksAgoStart &&
          new Date(a.applied_at) < lastWeekStart
      ).length || 0;

      return {
        userGrowth,
        jobApplications,
        engagement,
        totals: {
          newUsersThisWeek: thisWeekUsers,
          newUsersLastWeek: lastWeekUsers,
          applicationsThisWeek: thisWeekApps,
          applicationsLastWeek: lastWeekApps,
        },
      } as AnalyticsData;
    },
  });
}
