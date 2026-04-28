import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, Zap, Gift, Copy, Users, Share2 } from "lucide-react";
import { useIsPremium } from "@/hooks/useSubscription";
import { useReferrals } from "@/hooks/useReferrals";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { Progress } from "@/components/ui/progress";

export default function Pricing() {
  const { isPremium } = useIsPremium();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { referralCode, referralCount, requiredReferrals, remaining, isProViaReferral } = useReferrals();

  const shareLink = `${window.location.origin}/auth?mode=signup&ref=${referralCode}`;
  const progress = Math.min((referralCount / requiredReferrals) * 100, 100);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Referral code copied!" });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({ title: "Share link copied!" });
  };

  const shareVia = (platform: string) => {
    const text = `Join me on EdWorld — the best platform for students! Use my referral code: ${referralCode}`;
    const encodedText = encodeURIComponent(text);
    const encodedLink = encodeURIComponent(shareLink);
    
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedLink}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedLink}`,
      telegram: `https://t.me/share/url?url=${encodedLink}&text=${encodedText}`,
    };
    window.open(urls[platform], "_blank");
  };

  return (
    <MainLayout>
      <Helmet>
        <title>EdWorld Pro - Refer 3 Friends & Unlock Pro | EdWorld</title>
        <meta name="description" content="Refer 3 friends to EdWorld and unlock Pro features for free! Get your unique referral code and share it with friends." />
      </Helmet>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm">
            <Gift className="h-4 w-4 mr-1" /> Referral Program
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Refer 3 Friends, Get EdWorld Pro Free
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            All AI tools are free for every student. Refer 3 friends who sign up with your code to unlock Pro features!
          </p>
        </div>

        {/* Free Features */}
        <Card className="max-w-4xl mx-auto mb-12 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="py-8">
            <div className="text-center mb-6">
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-foreground">Free for All Students</h2>
              <p className="text-muted-foreground">No paywall on learning tools</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["AI Mentors", "Resume Builder", "Interview Prep", "Career Counseling", "Study Planner", "Exam Helper", "Mock Interviews", "Cover Letter"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-foreground">{f}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referral Section */}
        {user ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Already Pro */}
            {isPremium && (
              <Card className="text-center border-primary">
                <CardContent className="pt-6">
                  <Crown className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-foreground mb-1">You're an EdWorld Pro Member! 🎉</h3>
                  <p className="text-muted-foreground">
                    {isProViaReferral
                      ? `You unlocked Pro by referring ${referralCount} friends! Keep sharing to help others.`
                      : "Enjoy your EdWorld Pro badge and call features."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Referral Progress */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Your Referral Progress
                  </h3>
                  <Badge variant={isPremium ? "default" : "secondary"}>
                    {referralCount}/{requiredReferrals} referred
                  </Badge>
                </div>
                <Progress value={progress} className="h-3 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isPremium
                    ? "You've unlocked Pro! Share your code to help friends join."
                    : `${remaining} more referral${remaining !== 1 ? "s" : ""} needed to unlock EdWorld Pro`}
                </p>
              </div>

              <CardContent className="p-6 space-y-5">
                {/* Your Code */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Your Referral Code</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted/50 border rounded-xl px-4 py-3 font-mono text-lg font-bold text-foreground tracking-widest text-center">
                      {referralCode || "Loading..."}
                    </div>
                    <Button variant="outline" size="icon" onClick={copyCode} className="h-12 w-12 rounded-xl">
                      <Copy className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Share Link */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Share Link</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted/50 border rounded-xl px-3 py-2.5 text-sm text-muted-foreground truncate">
                      {shareLink}
                    </div>
                    <Button variant="outline" size="sm" onClick={copyLink}>
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => shareVia("whatsapp")}>
                    <Share2 className="h-4 w-4 mr-2" /> WhatsApp
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => shareVia("twitter")}>
                    <Share2 className="h-4 w-4 mr-2" /> Twitter
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => shareVia("telegram")}>
                    <Share2 className="h-4 w-4 mr-2" /> Telegram
                  </Button>
                </div>

                {/* Pro Features Preview */}
                {!isPremium && (
                  <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      <Crown className="h-4 w-4 text-primary" /> What you'll unlock
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "Gold EdWorld Pro Badge",
                        "Voice/Video Call Any User",
                        "Priority in Search Results",
                        "Early Access to New Features",
                        "Featured Profile Highlight",
                        "Unlimited AI Tool Access",
                        "Priority Support",
                      ].map((f) => (
                        <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="max-w-lg mx-auto text-center">
            <CardContent className="pt-8 pb-6 space-y-4">
              <Gift className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-bold text-foreground">Sign Up to Get Your Referral Code</h3>
              <p className="text-muted-foreground">Create an account to get your unique code and start referring friends!</p>
              <Button onClick={() => navigate("/auth?mode=signup")} size="lg" className="min-w-[200px]">
                Sign Up Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
