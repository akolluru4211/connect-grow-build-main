import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useAvatarUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = async (file: File) => {
    if (!user?.id) {
      toast.error("You must be logged in to upload an avatar");
      return null;
    }

    // Validate file
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
      // Generate unique filename with cache busting
      const fileExt = file.name.split(".").pop();
      const timestamp = Date.now();
      const fileName = `${user.id}/avatar-${timestamp}.${fileExt}`;

      // Delete old avatar if exists
      try {
        const { data: existingFiles } = await supabase.storage
          .from("avatars")
          .list(user.id);
        
        if (existingFiles && existingFiles.length > 0) {
          const oldAvatars = existingFiles.filter(f => f.name.startsWith('avatar-'));
          if (oldAvatars.length > 0) {
            await supabase.storage
              .from("avatars")
              .remove(oldAvatars.map(f => `${user.id}/${f.name}`));
          }
        }
      } catch (deleteError) {
        // No existing avatar to delete
      }

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL with cache busting
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      
      // Add cache-busting query parameter
      const urlWithCacheBust = `${publicUrl}?t=${timestamp}`;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlWithCacheBust })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Invalidate profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });

      toast.success("Avatar updated successfully!");
      return urlWithCacheBust;
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload avatar");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAvatar, isUploading };
}
