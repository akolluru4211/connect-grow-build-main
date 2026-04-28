import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, CheckCircle, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <MainLayout>
      <div className="container py-12 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-3xl font-bold mb-4">
            E
          </div>
          <h1 className="text-3xl font-bold">Install EdWorld</h1>
          <p className="text-muted-foreground mt-2">
            Get the full app experience on your device
          </p>
        </div>

        {isInstalled ? (
          <Card className="border-success bg-success/5">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
              <h2 className="text-xl font-semibold">EdWorld is installed!</h2>
              <p className="text-muted-foreground mt-2">
                You can now access EdWorld from your home screen
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Why install?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    "Access EdWorld instantly from your home screen",
                    "Work offline and see cached content",
                    "Faster load times with cached resources",
                    "Full-screen experience without browser UI",
                    "Receive push notifications for updates",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Install Instructions */}
            {isIOS ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Install on iOS
                  </CardTitle>
                  <CardDescription>
                    Follow these steps to install on your iPhone or iPad
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        1
                      </span>
                      <div>
                        <p className="font-medium">Tap the Share button</p>
                        <p className="text-sm text-muted-foreground">
                          Look for <Share className="inline h-4 w-4" /> at the bottom of Safari
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        2
                      </span>
                      <div>
                        <p className="font-medium">Select "Add to Home Screen"</p>
                        <p className="text-sm text-muted-foreground">
                          Scroll down and tap <Plus className="inline h-4 w-4" /> Add to Home Screen
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        3
                      </span>
                      <div>
                        <p className="font-medium">Tap "Add"</p>
                        <p className="text-sm text-muted-foreground">
                          Confirm to add EdWorld to your home screen
                        </p>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            ) : deferredPrompt ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Ready to Install
                  </CardTitle>
                  <CardDescription>
                    Click the button below to install EdWorld
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleInstall} size="lg" className="w-full">
                    <Download className="mr-2 h-5 w-5" />
                    Install EdWorld
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Install on Desktop or Android
                  </CardTitle>
                  <CardDescription>
                    Look for the install option in your browser
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        1
                      </span>
                      <div>
                        <p className="font-medium">Look for the install icon</p>
                        <p className="text-sm text-muted-foreground">
                          In Chrome, look for <Download className="inline h-4 w-4" /> in the address bar
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        2
                      </span>
                      <div>
                        <p className="font-medium">Click "Install"</p>
                        <p className="text-sm text-muted-foreground">
                          Confirm the installation in the prompt
                        </p>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
