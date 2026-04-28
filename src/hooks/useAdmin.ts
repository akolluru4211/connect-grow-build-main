import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalInternships: number;
  totalCourses: number;
  totalBlogPosts: number;
  totalEvents: number;
  recentUsers: any[];
}

export function useAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: adminExists, isLoading: adminExistsLoading } = useQuery({
    queryKey: ["admin-exists"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_exists");
      if (error) return true; // assume exists on error
      return data as boolean;
    },
    enabled: !!user && isAdmin === false,
  });

  const claimFirstAdmin = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-admin"] });
      queryClient.invalidateQueries({ queryKey: ["admin-exists"] });
      toast({ title: "Admin access granted!" });
    },
    onError: (e: any) => toast({ title: "Failed to claim admin", description: e.message, variant: "destructive" }),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [users, jobs, internships, courses, posts, events] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("*", { count: "exact", head: true }),
        supabase.from("internships").select("*", { count: "exact", head: true }),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("blog_posts").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
      ]);

      const { data: recentUsers } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      return {
        totalUsers: users.count || 0,
        totalJobs: jobs.count || 0,
        totalInternships: internships.count || 0,
        totalCourses: courses.count || 0,
        totalBlogPosts: posts.count || 0,
        totalEvents: events.count || 0,
        recentUsers: recentUsers || [],
      } as AdminStats;
    },
    enabled: isAdmin === true,
  });

  const { data: allUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id);
          return {
            ...profile,
            roles: roles?.map((r) => r.role) || ["user"],
          };
        })
      );

      return usersWithRoles;
    },
    enabled: isAdmin === true,
  });

  const { data: allJobs } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: allPosts } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: allInternships } = useQuery({
    queryKey: ["admin-internships"],
    queryFn: async () => {
      const { data } = await supabase.from("internships").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: allCourses } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: allEvents } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: emailLogs } = useQuery({
    queryKey: ["admin-email-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("email_notifications").select("*").order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role, action }: { userId: string; role: "admin" | "company" | "mentor" | "freelancer" | "user"; action: "add" | "remove" }) => {
      if (action === "add") {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User role updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update role", description: e.message, variant: "destructive" }),
  });

  const updateUserProfile = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User profile updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update profile", description: e.message, variant: "destructive" }),
  });

  const updateJob = useMutation({
    mutationFn: async ({ jobId, updates }: { jobId: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("jobs").update(updates).eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Job updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update job", description: e.message, variant: "destructive" }),
  });

  const updatePost = useMutation({
    mutationFn: async ({ postId, updates }: { postId: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("blog_posts").update(updates).eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Post updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update post", description: e.message, variant: "destructive" }),
  });

  const updateInternship = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("internships").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-internships"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Internship updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update internship", description: e.message, variant: "destructive" }),
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("courses").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Course updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update course", description: e.message, variant: "destructive" }),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("events").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Event updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update event", description: e.message, variant: "destructive" }),
  });

  const deleteJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Job deleted" });
    },
    onError: (e: any) => toast({ title: "Failed to delete job", description: e.message, variant: "destructive" }),
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Post deleted" });
    },
    onError: (e: any) => toast({ title: "Failed to delete post", description: e.message, variant: "destructive" }),
  });

  const deleteInternship = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("internships").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-internships"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Internship deleted" });
    },
    onError: (e: any) => toast({ title: "Failed to delete internship", description: e.message, variant: "destructive" }),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Course deleted" });
    },
    onError: (e: any) => toast({ title: "Failed to delete course", description: e.message, variant: "destructive" }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "Event deleted" });
    },
    onError: (e: any) => toast({ title: "Failed to delete event", description: e.message, variant: "destructive" }),
  });

  return {
    isAdmin,
    isAdminLoading,
    adminExists,
    adminExistsLoading,
    claimFirstAdmin,
    stats,
    statsLoading,
    allUsers,
    allJobs,
    allPosts,
    allInternships,
    allCourses,
    allEvents,
    emailLogs,
    updateUserRole,
    updateUserProfile,
    updateJob,
    updatePost,
    updateInternship,
    updateCourse,
    updateEvent,
    deleteJob,
    deletePost,
    deleteInternship,
    deleteCourse,
    deleteEvent,
  };
}
