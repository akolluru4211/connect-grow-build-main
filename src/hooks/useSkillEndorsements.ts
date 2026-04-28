import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserSkillWithDetails {
  id: string;
  user_id: string;
  skill_id: string;
  endorsement_count: number;
  skill: {
    id: string;
    name: string;
    category: string | null;
  };
  endorsers: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }[];
  user_endorsed: boolean;
}

export function useSkillEndorsements(userId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userSkills = [], isLoading } = useQuery({
    queryKey: ["user-skills-with-endorsements", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get user's skills
      const { data: skills, error } = await supabase
        .from("user_skills")
        .select(`
          id,
          user_id,
          skill_id,
          endorsement_count,
          skills:skill_id (id, name, category)
        `)
        .eq("user_id", userId);

      if (error) throw error;

      // Get endorsements for each skill
      const skillsWithEndorsers = await Promise.all(
        (skills || []).map(async (userSkill) => {
          const { data: endorsements } = await supabase
            .from("skill_endorsements")
            .select("endorser_id")
            .eq("skill_id", userSkill.skill_id)
            .eq("endorsed_user_id", userId);

          const endorserIds = endorsements?.map((e) => e.endorser_id) || [];
          
          let endorsers: { id: string; full_name: string | null; avatar_url: string | null }[] = [];
          if (endorserIds.length > 0) {
            // Use profiles_public view for privacy
            const { data: profiles } = await supabase
              .from("profiles_public")
              .select("id, full_name, avatar_url")
              .in("id", endorserIds);
            endorsers = (profiles || []).map(p => ({ id: p.id!, full_name: p.full_name, avatar_url: p.avatar_url }));
          }

          const userEndorsed = user ? endorserIds.includes(user.id) : false;

          return {
            id: userSkill.id,
            user_id: userSkill.user_id,
            skill_id: userSkill.skill_id,
            endorsement_count: userSkill.endorsement_count || 0,
            skill: userSkill.skills as { id: string; name: string; category: string | null },
            endorsers,
            user_endorsed: userEndorsed,
          } as UserSkillWithDetails;
        })
      );

      return skillsWithEndorsers;
    },
    enabled: !!userId,
  });

  const { data: allSkills = [] } = useQuery({
    queryKey: ["all-skills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const addSkill = useMutation({
    mutationFn: async (skillId: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("user_skills")
        .insert({ user_id: user.id, skill_id: skillId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-skills-with-endorsements"] });
      toast.success("Skill added!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeSkill = useMutation({
    mutationFn: async (userSkillId: string) => {
      const { error } = await supabase
        .from("user_skills")
        .delete()
        .eq("id", userSkillId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-skills-with-endorsements"] });
      toast.success("Skill removed");
    },
  });

  const endorseSkill = useMutation({
    mutationFn: async ({ skillId, endorsedUserId }: { skillId: string; endorsedUserId: string }) => {
      if (!user) throw new Error("Must be logged in");
      if (user.id === endorsedUserId) throw new Error("Cannot endorse your own skill");

      // Check if already endorsed
      const { data: existing } = await supabase
        .from("skill_endorsements")
        .select("id")
        .eq("skill_id", skillId)
        .eq("endorsed_user_id", endorsedUserId)
        .eq("endorser_id", user.id)
        .maybeSingle();

      if (existing) {
        // Remove endorsement
        await supabase.from("skill_endorsements").delete().eq("id", existing.id);
        
        // Decrement count
        const { data: userSkillDec } = await supabase
          .from("user_skills")
          .select("endorsement_count")
          .eq("user_id", endorsedUserId)
          .eq("skill_id", skillId)
          .single();
        
        if (userSkillDec) {
          await supabase
            .from("user_skills")
            .update({ endorsement_count: Math.max(0, (userSkillDec.endorsement_count || 0) - 1) })
            .eq("user_id", endorsedUserId)
            .eq("skill_id", skillId);
        }
      } else {
        // Add endorsement
        const { error } = await supabase.from("skill_endorsements").insert({
          skill_id: skillId,
          endorsed_user_id: endorsedUserId,
          endorser_id: user.id,
        });
        if (error) throw error;

        // Increment count
        const { data: userSkillInc } = await supabase
          .from("user_skills")
          .select("endorsement_count")
          .eq("user_id", endorsedUserId)
          .eq("skill_id", skillId)
          .single();
        
        if (userSkillInc) {
          await supabase
            .from("user_skills")
            .update({ endorsement_count: (userSkillInc.endorsement_count || 0) + 1 })
            .eq("user_id", endorsedUserId)
            .eq("skill_id", skillId);
        }

        // Get skill name and endorser name for notification
        const { data: skillData } = await supabase
          .from("skills")
          .select("name")
          .eq("id", skillId)
          .single();

        // Use profiles_public view for privacy
        const { data: endorserProfile } = await supabase
          .from("profiles_public")
          .select("full_name")
          .eq("id", user.id)
          .single();

        const skillName = skillData?.name || "a skill";
        const endorserName = endorserProfile?.full_name || "Someone";

        // Create notification for the endorsed user
        await supabase.from("notifications").insert({
          user_id: endorsedUserId,
          type: "endorsement",
          title: "New Skill Endorsement",
          message: `${endorserName} endorsed your ${skillName} skill`,
          link: "/profile",
        });
      }

      return { isNewEndorsement: !existing };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-skills-with-endorsements"] });
      toast.success("Endorsement updated!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    userSkills,
    allSkills,
    isLoading,
    addSkill: addSkill.mutate,
    removeSkill: removeSkill.mutate,
    endorseSkill: endorseSkill.mutate,
  };
}
