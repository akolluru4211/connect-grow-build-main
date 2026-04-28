import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useSavedPosts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: savedPostIds = [], isLoading } = useQuery({
    queryKey: ["saved-posts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((item) => item.post_id);
    },
    enabled: !!user,
  });

  const toggleSavePost = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Must be logged in");

      const isSaved = savedPostIds.includes(postId);

      if (isSaved) {
        const { error } = await supabase
          .from("saved_posts")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);
        if (error) throw error;
        return { saved: false };
      } else {
        const { error } = await supabase
          .from("saved_posts")
          .insert({ user_id: user.id, post_id: postId });
        if (error) throw error;
        return { saved: true };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      toast({ 
        title: result.saved ? "Post saved!" : "Post removed from saved",
      });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const isPostSaved = (postId: string) => savedPostIds.includes(postId);

  return {
    savedPostIds,
    isLoading,
    toggleSavePost,
    isPostSaved,
  };
}
