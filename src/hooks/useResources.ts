import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string;
  subject: string;
  file_url: string | null;
  external_link: string | null;
  tags: string[] | null;
  uploaded_by: string;
  college_name: string | null;
  downloads_count: number;
  created_at: string;
  uploader_name?: string;
  likes_count?: number;
  is_liked?: boolean;
}

export function useResources() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const resources = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const uploaderIds = [...new Set(data.map((r: any) => r.uploaded_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", uploaderIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p.full_name]) || []);

      const resourceIds = data.map((r: any) => r.id);
      const { data: likes } = await supabase
        .from("resource_likes")
        .select("resource_id, user_id")
        .in("resource_id", resourceIds);

      return data.map((r: any) => {
        const resourceLikes = likes?.filter((l: any) => l.resource_id === r.id) || [];
        return {
          ...r,
          uploader_name: profileMap.get(r.uploaded_by) || "Unknown",
          likes_count: resourceLikes.length,
          is_liked: resourceLikes.some((l: any) => l.user_id === user?.id),
        } as Resource;
      });
    },
  });

  const uploadResource = useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      resource_type: string;
      subject: string;
      external_link?: string;
      tags?: string[];
      college_name?: string;
      file?: File;
    }) => {
      let file_url = null;
      if (input.file) {
        const filePath = `${user!.id}/${Date.now()}-${input.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("resources")
          .upload(filePath, input.file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("resources").getPublicUrl(filePath);
        file_url = urlData.publicUrl;
      }

      const { error } = await supabase.from("resources").insert({
        title: input.title,
        description: input.description,
        resource_type: input.resource_type,
        subject: input.subject,
        external_link: input.external_link || null,
        tags: input.tags || [],
        college_name: input.college_name || null,
        file_url,
        uploaded_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Resource shared!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleLike = useMutation({
    mutationFn: async ({ resourceId, isLiked }: { resourceId: string; isLiked: boolean }) => {
      if (isLiked) {
        await supabase.from("resource_likes").delete().eq("resource_id", resourceId).eq("user_id", user!.id);
      } else {
        await supabase.from("resource_likes").insert({ resource_id: resourceId, user_id: user!.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resources"] }),
  });

  return { resources: resources.data || [], isLoading: resources.isLoading, uploadResource, toggleLike };
}
