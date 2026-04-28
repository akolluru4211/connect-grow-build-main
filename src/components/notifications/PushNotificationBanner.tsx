import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, X, BellRing, Sparkles } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function PushNotificationBanner() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, subscribe, isSubscribing } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show banner after a delay if user is logged in and not subscribed
    if (user && isSupported && !isSubscribed && permission !== "denied") {
      const dismissedKey = `push-banner-dismissed-${user.id}`;
      const wasDismissed = localStorage.getItem(dismissedKey);
      
      if (!wasDismissed) {
        const timer = setTimeout(() => setShowBanner(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isSupported, isSubscribed, permission]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    if (user) {
      localStorage.setItem(`push-banner-dismissed-${user.id}`, "true");
    }
  };

  const handleSubscribe = () => {
    subscribe();
    setShowBanner(false);
  };

  if (!showBanner || dismissed || !user || !isSupported || isSubscribed || permission === "denied") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-4 right-4 z-50 md:bottom-8 md:left-auto md:right-8 md:max-w-sm"
      >
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5 shadow-lg">
          <CardContent className="p-4">
            <button
              onClick={handleDismiss}
              className="absolute right-2 top-2 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BellRing className="h-6 w-6 text-primary" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                </motion.div>
              </div>

              <div className="flex-1 pr-4">
                <h3 className="font-semibold text-foreground mb-1">
                  Stay Updated!
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get instant notifications for new jobs, messages, and achievements.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSubscribe}
                    disabled={isSubscribing}
                    className="gap-1.5"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    {isSubscribing ? "Enabling..." : "Enable Notifications"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
