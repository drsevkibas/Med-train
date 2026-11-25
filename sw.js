/* Service Worker: App offline verfügbar machen. Bei Änderungen VERSION erhöhen. */
const VERSION = "kff-v6";
const FILES = [
  "./",
  "index.html",
  "css/app.css",
  "js/geometry.js",
  "js/storage.js",
  "js/figuren-tasks.js",
  "js/figuren-board.js",
  "js/figuren-views.js",
  "js/quiz.js",
  "js/zahlenfolgen.js",
  "js/wortfluessigkeit.js",
  "js/implikationen.js",
  "js/gedaechtnis.js",
  "js/app.js",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Netzwerk zuerst (damit Updates ankommen), sonst aus dem Cache.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
