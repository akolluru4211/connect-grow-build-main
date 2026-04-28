import { ReactNode, useEffect } from "react";
import { useFeatureTrials } from "@/hooks/useFeatureTrials";
import { useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Lock, Gift, Users, ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PremiumGateProps {
  children: ReactNode;
  featureName?: string;
}

const PREMIUM_FEATURES = [
  { icon: Gift, label: "Refer 3 Friends" },
  { icon: Users, label: "Unlock Pro Free" },
  { icon: Crown, label: "Unlimited Access" },
];

export function PremiumGate({ children, featureName }: PremiumGateProps) {
  const { isPremium, isLoading, remaining, canUse, consumeTrial, dailyLimit } = useFeatureTrials(featureName || "general");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isPremium && user && canUse) {
      consumeTrial();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isPremium, user]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-20 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MainLayout>
    );
  }

  if (isPremium || canUse) {
    return (
      <>
        {!isPremium && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center text-sm">
            <Clock className="inline h-4 w-4 mr-1 -mt-0.5" />
            Free trial: <strong>{Math.max(remaining - 1, 0)}</strong> of {dailyLimit} uses remaining today.{" "}
            <button onClick={() => navigate("/pricing")} className="underline font-semibold text-primary hover:text-primary/80">
              Refer 3 friends for unlimited access
            </button>
          </div>
        )}
        {children}
      </>
    );
  }

  return (
    <MainLayout>
      <div className="container py-12 max-w-2xl mx-auto">
        <Card className="overflow-hidden border-primary/30">
          <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 p-8 text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Lock className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Daily Free Limit Reached
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              You've used your {dailyLimit} free {featureName || "feature"} uses for today. Refer 3 friends to unlock unlimited access!
            </p>
          </div>

          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {PREMIUM_FEATURES.map((f) => (
                <div key={f.label} className="flex flex-col items-center gap-2 text-sm text-muted-foreground text-center">
                  <f.icon className="h-5 w-5 text-primary" />
                  <span>{f.label}</span>
                </div>
              ))}
            </div>

            <div className="text-center bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Unlock Pro by referring</p>
              <p className="text-3xl font-bold text-foreground">
                3 Friends
              </p>
              <p className="text-sm text-muted-foreground mt-1">completely free!</p>
            </div>

            <div className="flex flex-col gap-3 items-center">
              {user ? (
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-md"
                  onClick={() => navigate("/pricing")}
                >
                  <Gift className="h-5 w-5 mr-2" />
                  Get Your Referral Code
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Button size="lg" className="w-full" onClick={() => navigate("/auth")}>
                    Sign In to Continue
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Sign in first, then refer friends to unlock Pro
                  </p>
                </>
              )}
              <p className="text-xs text-muted-foreground">
                Come back tomorrow for {dailyLimit} more free uses!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
