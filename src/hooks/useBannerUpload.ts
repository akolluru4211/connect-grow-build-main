import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useBannerUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const uploadBanner = async (file: File) => {
    if (!user) {
      toast.error("You must be logged in to upload a banner");
      return null;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return null;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const timestamp = Date.now();
      const fileName = `${user.id}/banner-${timestamp}.${fileExt}`;

      // Delete old banner if exists
      try {
        const { data: existingFiles } = await supabase.storage
          .from("avatars")
          .list(user.id);
        
        if (existingFiles && existingFiles.length > 0) {
          const oldBanners = existingFiles.filter(f => f.name.startsWith('banner-'));
          if (oldBanners.length > 0) {
            await supabase.storage
              .from("avatars")
              .remove(oldBanners.map(f => `${user.id}/${f.name}`));
          }
        }
      } catch (deleteError) {
        // No existing banner to delete
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Add cache-busting query parameter
      const urlWithCacheBust = `${publicUrl}?t=${timestamp}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ banner_url: urlWithCacheBust })
        .eq("id", user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Banner updated successfully");
      return urlWithCacheBust;
      return publicUrl;
    } catch (error: any) {
      toast.error("Failed to upload banner: " + error.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadBanner, isUploading };
}
