// Speichert alle Dateien beim ersten Besuch, danach läuft die App offline.
const VERSION = "14";
const CACHE = `flugspiel-${VERSION}`;
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/app.css",
  "./icons/icon-180.png",
  "./icons/icon-512.png",
  "./js/main.js",
  "./js/core/catchUp.js",
  "./js/core/games.js",
  "./js/core/rng.js",
  "./js/core/roundLoop.js",
  "./js/core/settings.js",
  "./js/engines/balloonRace.js",
  "./js/engines/ballToss.js",
  "./js/shell/effects.js",
  "./js/shell/parentMenu.js",
  "./js/shell/stars.js",
  "./js/shell/wakeLock.js",
  "./js/views/balloonRace.js",
  "./js/views/ballToss.js",
  "./js/views/canvas.js",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(ASSETS.map(url => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("flugspiel-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(
      hit =>
        hit ||
        fetch(request).catch(() =>
          request.mode === "navigate" ? caches.match("./index.html") : Response.error(),
        ),
    ),
  );
});
