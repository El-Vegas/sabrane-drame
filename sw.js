const CACHE = "drame-v2";
const ASSETS = ["./","./index.html","./manifest.webmanifest",
  "./icon-192.png","./icon-512.png","./icon-512-maskable.png","./apple-touch-icon-180.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const isHTML = e.request.mode === "navigate" ||
                 (e.request.headers.get("accept") || "").includes("text/html");
  if (isHTML) {
    // network-first so updates show when online; fall back to cache offline
    e.respondWith(
      fetch(e.request).then(resp => {
        const cp = resp.clone();
        caches.open(CACHE).then(c => c.put("./index.html", cp));
        return resp;
      }).catch(() => caches.match("./index.html"))
    );
  } else {
    // cache-first for static assets
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        const cp = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
        return resp;
      }))
    );
  }
});
