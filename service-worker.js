const CACHE_NAME = "rosie-shell-v20260404";
const CORE_ASSETS = ["/", "/assets/site.css", "/assets/chrome.js", "/assets/admin-auth.js", "/assets/admin-shell.js", "/admin.html", "/detailer-jobs", "/manifest.webmanifest"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(req).catch(() => new Response(JSON.stringify({ ok:false, offline:true, error:"Offline" }), { status: 503, headers: { "Content-Type": "application/json" } })));
    return;
  }
  event.respondWith(caches.match(req).then((cached) => cached || fetch(req).then((res) => {
    const copy = res.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
    return res;
  }).catch(() => caches.match("/admin.html") || caches.match("/"))));
});
