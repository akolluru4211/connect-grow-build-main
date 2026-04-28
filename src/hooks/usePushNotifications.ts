import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Generate VAPID keys for web push (in production, use env vars)
const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isSupported = "serviceWorker" in navigator && "PushManager" in window;

  const { data: subscription } = useQuery({
    queryKey: ["push-subscription", user?.id],
    queryFn: async () => {
      if (!user?.id || !isSupported) return null;

      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user?.id && isSupported,
  });

  const { data: permission } = useQuery({
    queryKey: ["notification-permission"],
    queryFn: () => {
      if (!isSupported) return "denied";
      return Notification.permission;
    },
    enabled: isSupported,
  });

  const subscribe = useMutation({
    mutationFn: async () => {
      if (!user?.id || !isSupported) throw new Error("Push notifications not supported");

      // Request permission
      const permissionResult = await Notification.requestPermission();
      if (permissionResult !== "granted") {
        throw new Error("Notification permission denied");
      }

      // Register service worker
      const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistration & { pushManager: PushManager };

      // Subscribe to push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subscriptionJson = pushSubscription.toJSON();
      
      if (!subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
        throw new Error("Invalid push subscription");
      }

      // Save to database
      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subscriptionJson.endpoint,
        p256dh: subscriptionJson.keys.p256dh,
        auth: subscriptionJson.keys.auth,
      }, {
        onConflict: "user_id,endpoint",
      });

      if (error) throw error;

      return pushSubscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["notification-permission"] });
      toast.success("Push notifications enabled!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const unsubscribe = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      // Unsubscribe from push manager
      const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistration & { pushManager: PushManager };
      const pushSubscription = await registration.pushManager.getSubscription();
      
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }

      // Remove from database
      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscription"] });
      toast.success("Push notifications disabled");
    },
  });

  return {
    isSupported,
    isSubscribed: !!subscription,
    permission: permission || "default",
    subscribe: subscribe.mutate,
    unsubscribe: unsubscribe.mutate,
    isSubscribing: subscribe.isPending,
  };
}
