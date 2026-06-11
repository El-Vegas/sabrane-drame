// Self-destructing service worker: removes itself and clears all caches so any
// browser stuck on an older cached build is reset to load the live version.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach(c => c.navigate(c.url));
    } catch (err) {}
  })());
});
// Never serve from cache — always go to the network.
self.addEventListener("fetch", () => {});
