import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export function useReferrals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-referral-code", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase
        .from("profiles")
        .update({ referral_code: code })
        .eq("id", user.id);
      if (error) throw error;
      return code;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-referral-code", user?.id] });
    },
  });

  useEffect(() => {
    if (user && !isLoading && profile && !profile.referral_code && !generateCodeMutation.isPending) {
      generateCodeMutation.mutate();
    }
  }, [user, profile, isLoading]);

  const { data: referralCount = 0 } = useQuery({
    queryKey: ["referral-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const REQUIRED_REFERRALS = 3;
  const isProViaReferral = referralCount >= REQUIRED_REFERRALS;

  return {
    referralCode: profile?.referral_code || "",
    referralCount,
    requiredReferrals: REQUIRED_REFERRALS,
    isProViaReferral,
    remaining: Math.max(REQUIRED_REFERRALS - referralCount, 0),
    generateCode: () => generateCodeMutation.mutate(),
    isGenerating: generateCodeMutation.isPending,
  };
}
