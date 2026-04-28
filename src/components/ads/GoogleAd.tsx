import { useEffect, useRef } from "react";
import { useIsPremium } from "@/hooks/useSubscription";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface GoogleAdProps {
  adClient?: string;
  adSlot?: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  className?: string;
}

export function GoogleAd({
  adClient = "ca-pub-1367985420273106",
  adSlot = "",
  adFormat = "auto",
  fullWidthResponsive = true,
  className = "",
}: GoogleAdProps) {
  const { isPremium } = useIsPremium();
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (isPremium) return;

    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement("script");
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    const timer = setTimeout(() => {
      if (!pushed.current && adRef.current) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        } catch {
          // Ad already pushed or blocked
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [adClient, isPremium]);

  if (isPremium) return null;

  return (
    <div className={`ad-container overflow-hidden ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
