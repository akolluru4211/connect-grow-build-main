// Service Worker for Push Notifications

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || data.message || "You have a new notification",
      icon: "/pwa-192x192.svg",
      badge: "/pwa-192x192.svg",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || data.link || "/",
        ...data,
      },
      actions: data.actions || [],
      tag: data.tag || "default",
      renotify: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "EdWorld", options)
    );
  } catch (error) {
    console.error("Error handling push event:", error);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window open
      for (const client of windowClients) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  // Handle subscription change (e.g., when browser refreshes the push subscription)
  console.log("Push subscription changed");
});
