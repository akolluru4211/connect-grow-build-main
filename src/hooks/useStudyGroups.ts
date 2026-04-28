import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  college_name: string | null;
  max_members: number;
  is_public: boolean;
  created_by: string;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
  creator_name?: string;
}

export function useStudyGroups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const groups = useQuery({
    queryKey: ["study-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_groups")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get member counts and membership status
      const groupIds = data.map((g: any) => g.id);
      const { data: members } = await supabase
        .from("study_group_members")
        .select("group_id, user_id")
        .in("group_id", groupIds);

      const { data: creators } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", data.map((g: any) => g.created_by));

      const creatorMap = new Map(creators?.map((c: any) => [c.id, c.full_name]) || []);

      return data.map((group: any) => {
        const groupMembers = members?.filter((m: any) => m.group_id === group.id) || [];
        return {
          ...group,
          member_count: groupMembers.length,
          is_member: groupMembers.some((m: any) => m.user_id === user?.id),
          creator_name: creatorMap.get(group.created_by) || "Unknown",
        } as StudyGroup;
      });
    },
  });

  const createGroup = useMutation({
    mutationFn: async (input: { name: string; description: string; subject: string; college_name?: string; max_members?: number }) => {
      const { data, error } = await supabase
        .from("study_groups")
        .insert({ ...input, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      // Auto-join as admin
      await supabase.from("study_group_members").insert({ group_id: data.id, user_id: user!.id, role: "admin" });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-groups"] });
      toast.success("Study group created!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const joinGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.from("study_group_members").insert({ group_id: groupId, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-groups"] });
      toast.success("Joined group!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const leaveGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.from("study_group_members").delete().eq("group_id", groupId).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-groups"] });
      toast.success("Left group");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteGroup = useMutation({
    mutationFn: async (groupId: string) => {
      // Delete members and posts first, then the group
      await supabase.from("study_group_posts").delete().eq("group_id", groupId);
      await supabase.from("study_group_members").delete().eq("group_id", groupId);
      const { error } = await supabase.from("study_groups").delete().eq("id", groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-groups"] });
      toast.success("Study group deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { groups: groups.data || [], isLoading: groups.isLoading, createGroup, joinGroup, leaveGroup, deleteGroup };
}

export function useGroupPosts(groupId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const posts = useQuery({
    queryKey: ["group-posts", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data, error } = await supabase
        .from("study_group_posts")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const authorIds = [...new Set(data.map((p: any) => p.author_id))];
      const { data: authors } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", authorIds);

      const authorMap = new Map(authors?.map((a: any) => [a.id, a]) || []);

      return data.map((post: any) => ({
        ...post,
        author: authorMap.get(post.author_id) || { full_name: "Unknown", avatar_url: null },
      }));
    },
    enabled: !!groupId,
  });

  const createPost = useMutation({
    mutationFn: async ({ groupId, content }: { groupId: string; content: string }) => {
      const { error } = await supabase.from("study_group_posts").insert({ group_id: groupId, author_id: user!.id, content });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-posts", groupId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { posts: posts.data || [], isLoading: posts.isLoading, createPost };
}
