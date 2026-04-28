import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  location: string | null;
  website: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  is_mentor: boolean | null;
  is_freelancer: boolean | null;
}

export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, headline, bio, avatar_url, banner_url, location, website, linkedin_url, github_url, twitter_url, is_mentor, is_freelancer")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!userId,
  });
}
