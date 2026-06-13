// Network-first service worker: always show the latest when online,
// fall back to the cached copy when offline. Enables offline + Add to Home Screen.
const CACHE = "drame-pwa-1";
const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest", "./cover.jpg",
  "./favicon.ico", "./favicon-32.png", "./apple-touch-icon-180.png",
  "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ASSETS.map(a =>
        fetch(a, { cache: "reload" }).then(r => c.put(a, r)).catch(() => {})
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const isHTML = e.request.mode === "navigate" ||
                 (e.request.headers.get("accept") || "").includes("text/html");
  if (isHTML) {
    // network-first (bypass HTTP cache) → freshest page online, cached page offline
    e.respondWith(
      fetch(e.request, { cache: "reload" }).then(resp => {
        const cp = resp.clone();
        caches.open(CACHE).then(c => c.put("./index.html", cp));
        return resp;
      }).catch(() => caches.match("./index.html"))
    );
  } else {
    // cache-first for static assets, fall back to network
    e.respondWith(
      caches.match(e.request).then(r =>
        r || fetch(e.request).then(resp => {
          const cp = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, cp));
          return resp;
        }).catch(() => r)
      )
    );
  }
});
