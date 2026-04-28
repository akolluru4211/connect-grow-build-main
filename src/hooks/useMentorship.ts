import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MentorshipProfile {
  id: string;
  user_id: string;
  is_mentor: boolean | null;
  is_mentee: boolean | null;
  skills: string[];
  goals: string[];
  bio: string | null;
  availability: string | null;
  experience_years: number | null;
  max_mentees: number | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  };
}

export interface MentorshipConnection {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: string;
  message: string | null;
  created_at: string;
  mentor_profile?: MentorshipProfile;
  mentee_profile?: MentorshipProfile;
}

export function useMentorship() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: myProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["mentorship-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("mentorship_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as MentorshipProfile | null;
    },
    enabled: !!user,
  });

  const { data: mentors, isLoading: mentorsLoading } = useQuery({
    queryKey: ["mentors"],
    queryFn: async () => {
      const { data: mentorProfiles, error } = await supabase
        .from("mentorship_profiles")
        .select("*")
        .eq("is_mentor", true);

      if (error) throw error;

      // Get profile info for each mentor - using profiles_public view for privacy
      const mentorsWithProfiles = await Promise.all(
        (mentorProfiles || []).map(async (mp) => {
          const { data: profile } = await supabase
            .from("profiles_public")
            .select("full_name, avatar_url, headline")
            .eq("id", mp.user_id)
            .single();

          return { ...mp, profile } as MentorshipProfile;
        })
      );

      return mentorsWithProfiles;
    },
  });

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ["mentorship-connections", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("mentorship_connections")
        .select("*")
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`);

      if (error) throw error;
      return data as MentorshipConnection[];
    },
    enabled: !!user,
  });

  const saveProfile = useMutation({
    mutationFn: async (profileData: Partial<MentorshipProfile>) => {
      if (!user) throw new Error("Must be logged in");

      const existing = myProfile;
      
      if (existing) {
        const { error } = await supabase
          .from("mentorship_profiles")
          .update(profileData)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("mentorship_profiles")
          .insert({ ...profileData, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorship-profile"] });
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      toast({ title: "Mentorship profile saved!" });
    },
    onError: (error) => {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
    },
  });

  const requestMentorship = useMutation({
    mutationFn: async ({ mentorId, message }: { mentorId: string; message?: string }) => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("mentorship_connections")
        .insert({
          mentor_id: mentorId,
          mentee_id: user.id,
          message,
          status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorship-connections"] });
      toast({ title: "Mentorship request sent!" });
    },
    onError: (error) => {
      toast({ title: "Error requesting mentorship", description: error.message, variant: "destructive" });
    },
  });

  const updateConnectionStatus = useMutation({
    mutationFn: async ({ connectionId, status }: { connectionId: string; status: string }) => {
      const { error } = await supabase
        .from("mentorship_connections")
        .update({ status })
        .eq("id", connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorship-connections"] });
      toast({ title: "Connection updated!" });
    },
  });

  return {
    myProfile,
    profileLoading,
    mentors,
    mentorsLoading,
    connections,
    connectionsLoading,
    saveProfile,
    requestMentorship,
    updateConnectionStatus,
  };
}
