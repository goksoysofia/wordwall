/* Wordwall service worker — PWA offline + hızlı tekrar yükleme.
   Stratejiler:
   - API (/api/*) ve cross-origin (Supabase, fontlar): dokunma, her zaman ağ.
   - Navigasyon (HTML): network-first, çevrimdışıyken offline.html fallback.
   - Statik varlıklar (_next/static, ikonlar): stale-while-revalidate.
   Sürüm değişince CACHE adını artır; eski cache'ler activate'te temizlenir. */
const CACHE = "wordwall-v1";
const PRECACHE = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Sadece kendi origin'imiz — Supabase/CDN isteklerine karışma.
  if (url.origin !== self.location.origin) return;

  // API isteklerini asla cache'leme.
  if (url.pathname.startsWith("/api/")) return;

  // Navigasyon istekleri: network-first, çevrimdışı fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline.html"))
        )
    );
    return;
  }

  // Statik varlıklar: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
