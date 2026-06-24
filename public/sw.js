const CACHE_VERSION = "pishbini-pwa-v2";
const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

async function precacheAssets(cache) {
  await Promise.allSettled(
    PRECACHE_URLS.map(async (url) => {
      try {
        await cache.add(url);
      } catch {
        /* optional asset — do not fail install */
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => precacheAssets(cache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // iOS standalone: intercepting navigation on first load can cause a blank screen.
  if (request.mode === "navigate") return;

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "پیش‌بینی پیشرو سرمایه", body: "", url: "/" };

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    /* keep defaults */
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      dir: "rtl",
      lang: "fa",
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
