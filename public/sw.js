// Service Worker for Soundroom Offline Commute Caching
const CACHE_NAME = "soundroom-audio-v1";
const STATIC_CACHE = "soundroom-static-v1";

const STATIC_ASSETS = [
  "/radio",
  "/favicon.ico",
  "/models/batmobile.glb",
];

// Install: Cache essential shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: Clean up older cache generations
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== STATIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache-First for Audio Files (/audio/*.m4a) to guarantee offline playback in dead-zones
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Audio files: Cache First with network fallback & background store
  if (url.pathname.startsWith("/audio/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          return cached;
        }
        try {
          const response = await fetch(event.request);
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        } catch (err) {
          if (cached) return cached;
          throw err;
        }
      })
    );
    return;
  }

  // Normal network-first for other requests
  event.respondWith(
    fetch(event.request).catch(async () => {
      const match = await caches.match(event.request);
      if (match) return match;
      return new Response("Offline", { status: 503 });
    })
  );
});
