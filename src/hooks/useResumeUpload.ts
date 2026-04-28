import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useResumeUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const uploadResume = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get the URL
      const { data: urlData } = supabase.storage
        .from("resumes")
        .getPublicUrl(fileName);

      // For private buckets, we need signed URLs
      const { data: signedData } = await supabase.storage
        .from("resumes")
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

      return {
        path: fileName,
        url: signedData?.signedUrl || urlData.publicUrl,
      };
    },
    onSuccess: () => {
      toast.success("Resume uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["resumeFiles"] });
    },
    onError: (error) => {
      toast.error("Failed to upload resume: " + error.message);
    },
  });

  const deleteResumeFile = useMutation({
    mutationFn: async (path: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase.storage
        .from("resumes")
        .remove([path]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resume file deleted");
      queryClient.invalidateQueries({ queryKey: ["resumeFiles"] });
    },
    onError: (error) => {
      toast.error("Failed to delete file: " + error.message);
    },
  });

  const getSignedUrl = async (path: string, userId?: string) => {
    const fullPath = userId ? `${userId}/${path}` : path;
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(fullPath, 60 * 60); // 1 hour

    if (error) throw error;
    return data.signedUrl;
  };

  const deleteFile = async (path: string, userId?: string) => {
    const fullPath = userId ? `${userId}/${path}` : path;
    const { error } = await supabase.storage.from("resumes").remove([fullPath]);
    if (error) throw error;
  };

  const listResumeFiles = async () => {
    if (!user?.id) return [];

    const { data, error } = await supabase.storage
      .from("resumes")
      .list(user.id, {
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) throw error;
    return data || [];
  };

  return {
    uploadResume,
    deleteResumeFile,
    deleteFile,
    getSignedUrl,
    listResumeFiles,
    userId: user?.id,
  };
}
