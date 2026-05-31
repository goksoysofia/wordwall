/* Wordwall service worker — native uygulama kalitesinde PWA: offline etkinlikler + hız.

   Cache mimarisi (sürüm değişince VERSION'ı artır; eski sürümler activate'te silinir):
   - shell   : kurulumda precache edilen kabuk (offline.html, ikonlar, manifest)
   - pages   : ziyaret edilen HTML navigasyonları  → network-first, çevrimdışı cache/offline.html
   - static  : /_next/static (hash'li, immutable)  → cache-first
   - api     : GET /api/activities + /api/templates → network-first, çevrimdışı son kopya
   - images  : etkinlik görselleri (cross-origin dahil) → cache-first, LRU sınırlı

   Mutasyonlar (POST/PUT/DELETE) ve /api/notify-completion, /api/upload gibi yan etkili
   uçlar ASLA cache'lenmez — her zaman ağ. Cross-origin (Supabase API, fontlar dışı) dokunulmaz. */

const VERSION = "v2";
const SHELL_CACHE = `wordwall-shell-${VERSION}`;
const PAGES_CACHE = `wordwall-pages-${VERSION}`;
const STATIC_CACHE = `wordwall-static-${VERSION}`;
const API_CACHE = `wordwall-api-${VERSION}`;
const IMAGE_CACHE = `wordwall-images-${VERSION}`;
const CURRENT = new Set([SHELL_CACHE, PAGES_CACHE, STATIC_CACHE, API_CACHE, IMAGE_CACHE]);

const PRECACHE = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/favicon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const IMAGE_LIMIT = 150; // en çok ~150 görsel sakla
const API_LIMIT = 100; // en çok ~100 etkinlik/şablon yanıtı

// --- yardımcılar -----------------------------------------------------------

// Basit LRU: cap aşılınca en eski (ilk eklenen) kayıtları sil.
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const excess = keys.length - maxItems;
  for (let i = 0; i < excess; i++) await cache.delete(keys[i]);
}

function isImage(request, url) {
  if (request.destination === "image") return true;
  return /\.(?:png|jpe?g|gif|webp|avif|svg)(?:\?|$)/i.test(url.pathname);
}

// Yalnızca okuma amaçlı, kişisel olmayan veya cihaz sahibine ait GET uçları.
function isCacheableApi(pathname) {
  return (
    /^\/api\/activities(?:\/[^/]+)?$/.test(pathname) ||
    /^\/api\/templates(?:\/[^/]+)?$/.test(pathname)
  );
}

// --- install: kabuğu precache et -------------------------------------------

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // Tek tek ekle: biri 404 olsa bile kurulum tüm precache'i çökertmesin.
      .then((cache) => Promise.allSettled(PRECACHE.map((u) => cache.add(u))))
    // skipWaiting yok: yeni sürüm "waiting"te bekler, kullanıcı "Yenile" deyince geçer.
  );
});

// --- activate: eski sürümleri temizle --------------------------------------

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("wordwall-") && !CURRENT.has(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// --- message: güncelleme akışı ---------------------------------------------

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// --- fetch yönlendirmesi ---------------------------------------------------

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // 1) Navigasyon (HTML): network-first → pages cache → offline.html
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // 2) Cross-origin: sadece görselleri cache'le (etkinlik resimleri offline çalışsın).
  if (!sameOrigin) {
    if (isImage(request, url)) event.respondWith(cacheFirstImage(request));
    return;
  }

  // 3) API: yalnızca güvenli okuma uçları; gerisi (mutasyon/email/upload) her zaman ağ.
  if (url.pathname.startsWith("/api/")) {
    if (isCacheableApi(url.pathname)) event.respondWith(networkFirstApi(request));
    return;
  }

  // 4) Next statikleri: cache-first (içerik hash'li, değişmez).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 5) Same-origin görseller: cache-first.
  if (isImage(request, url)) {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  // 6) Diğer same-origin statikler: stale-while-revalidate.
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

// --- stratejiler -----------------------------------------------------------

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return (
      (await cache.match(request)) ||
      (await caches.match("/offline.html")) ||
      Response.error()
    );
  }
}

async function networkFirstApi(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      cache.put(request, res.clone());
      trimCache(API_CACHE, API_LIMIT);
    }
    return res;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && (res.ok || res.type === "opaque")) cache.put(request, res.clone());
  return res;
}

async function cacheFirstImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    // Cross-origin <img> istekleri opaque döner (status 0) — yine de saklanır.
    if (res && (res.ok || res.type === "opaque")) {
      cache.put(request, res.clone());
      trimCache(IMAGE_CACHE, IMAGE_LIMIT);
    }
    return res;
  } catch {
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.ok && res.type === "basic") cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}
