const CACHE = "drame-v7";
const ASSETS = ["./","./index.html","./manifest.webmanifest","./cover.jpg",
  "./icon-192.png","./icon-512.png","./icon-512-maskable.png","./apple-touch-icon-180.png"];

self.addEventListener("install", e => {
  // fetch index fresh (bypass HTTP cache) so a new SW always seeds the latest page
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(
    ASSETS.map(a => fetch(a, {cache: "reload"}).then(r => c.put(a, r)).catch(() => {}))
  )).then(() => self.skipWaiting()));
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
    // network-first AND bypass the browser HTTP cache, so deploys show up immediately
    e.respondWith(
      fetch(e.request, {cache: "reload"}).then(resp => {
        const cp = resp.clone();
        caches.open(CACHE).then(c => c.put("./index.html", cp));
        return resp;
      }).catch(() => caches.match("./index.html"))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        const cp = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
        return resp;
      }))
    );
  }
});
