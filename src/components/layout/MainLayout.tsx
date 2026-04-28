import { ReactNode } from "react";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { PushNotificationBanner } from "@/components/notifications/PushNotificationBanner";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground selection:bg-primary/20 overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full pb-24 md:pb-0 relative overflow-x-hidden">
        {/* Subtle grid overlay - consistent with landing */}
        <div className="absolute inset-0 pointer-events-none hero-grid opacity-20" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-yellow-400/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10">{children}</div>
      </main>
      <MobileBottomNav />
      <PushNotificationBanner />
    </div>
  );
}
