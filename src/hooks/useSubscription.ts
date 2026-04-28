import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  razorpay_subscription_id: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  cancelled_at: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  tier: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: string[];
  is_active: boolean;
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_monthly", { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });
}

export function useUserSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as (UserSubscription & { subscription_plans: SubscriptionPlan }) | null;
    },
    enabled: !!user?.id,
  });
}

export function useIsPremium() {
  const { user } = useAuth();
  const { data: subscription, isLoading: subLoading } = useUserSubscription();

  // Check referral-based pro
  const { data: referralCount = 0, isLoading: refLoading } = useQuery({
    queryKey: ["referral-count-premium", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", user!.id);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  const isLoading = subLoading || refLoading;

  const hasActiveSubscription = !!subscription && 
    subscription.status === "active" &&
    new Date(subscription.current_period_end) > new Date();

  const isProViaReferral = referralCount >= 3;
  const isPremium = hasActiveSubscription || isProViaReferral;

  const tier = isPremium ? "pro" : "free";
  const isPro = isPremium;

  return { isPremium, isPro, tier, isLoading, subscription };
}
