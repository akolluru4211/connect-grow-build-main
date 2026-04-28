import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  project_url?: string;
  github_url?: string;
  cover_image_url?: string;
  tech_stack: string[];
  tags: string[];
  looking_for: string[];
  team_size: number;
  max_team_size: number;
  status: "open" | "in_progress" | "completed" | "closed";
  college_name?: string;
  is_featured: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
  likes_count?: number;
  comments_count?: number;
  collaborators_count?: number;
  is_liked?: boolean;
}

export function useProjects(filters?: { status?: string; search?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["projects", filters],
    queryFn: async () => {
      let query = supabase
        .from("student_projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get profile data and counts for each project
      const projectsWithDetails = await Promise.all(
        (data || []).map(async (project) => {
          // Fetch profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, headline")
            .eq("id", project.user_id)
            .maybeSingle();

          const [likesRes, commentsRes, collaboratorsRes] = await Promise.all([
            supabase.from("project_likes").select("id", { count: "exact" }).eq("project_id", project.id),
            supabase.from("project_comments").select("id", { count: "exact" }).eq("project_id", project.id),
            supabase.from("project_collaborators").select("id", { count: "exact" }).eq("project_id", project.id).eq("status", "accepted"),
          ]);

          let isLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from("project_likes")
              .select("id")
              .eq("project_id", project.id)
              .eq("user_id", user.id)
              .maybeSingle();
            isLiked = !!likeData;
          }

          return {
            ...project,
            profiles: profileData,
            likes_count: likesRes.count || 0,
            comments_count: commentsRes.count || 0,
            collaborators_count: collaboratorsRes.count || 0,
            is_liked: isLiked,
          };
        })
      );

      return projectsWithDetails as Project[];
    },
  });
}

export function useMyProjects() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-projects", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("student_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (project: Omit<Project, "id" | "user_id" | "created_at" | "updated_at" | "views_count" | "is_featured">) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("student_projects")
        .insert({ ...project, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      toast.success("Project created successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create project: " + error.message);
    },
  });
}

export function useLikeProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, isLiked }: { projectId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Must be logged in");

      if (isLiked) {
        const { error } = await supabase
          .from("project_likes")
          .delete()
          .eq("project_id", projectId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("project_likes")
          .insert({ project_id: projectId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useApplyToProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, role }: { projectId: string; role: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("project_collaborators")
        .insert({ project_id: projectId, user_id: user.id, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Application submitted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to apply: " + error.message);
    },
  });
}
