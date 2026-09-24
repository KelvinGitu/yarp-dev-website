/* Resume Maker's service worker, for the browser version: after the first
   visit it opens and works with no connection at all.

   web/build.py fills in BUILD (a hash of everything it built, so every
   deploy gets a fresh cache) and CORE (every file the app has; with its
   fonts, about a megabyte). Adapted from pdfsign's web/sw.js. */

const BUILD = "1.1.0-602aec454c";
const CORE = [
  "icons/apple-touch-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "manifest.webmanifest",
  "static/app.js",
  "static/fonts/LICENSE.md",
  "static/fonts/archivo-latin-400-normal.woff2",
  "static/fonts/archivo-latin-500-normal.woff2",
  "static/fonts/archivo-latin-600-normal.woff2",
  "static/fonts/archivo-latin-800-normal.woff2",
  "static/fonts/arimo-latin-400-italic.woff2",
  "static/fonts/arimo-latin-400-normal.woff2",
  "static/fonts/arimo-latin-700-normal.woff2",
  "static/fonts/ibm-plex-mono-latin-400-normal.woff2",
  "static/fonts/ibm-plex-mono-latin-500-normal.woff2",
  "static/fonts/ibm-plex-sans-latin-400-italic.woff2",
  "static/fonts/ibm-plex-sans-latin-400-normal.woff2",
  "static/fonts/ibm-plex-sans-latin-500-normal.woff2",
  "static/fonts/ibm-plex-sans-latin-600-normal.woff2",
  "static/fonts/ibm-plex-sans-latin-700-normal.woff2",
  "static/fonts/playfair-display-latin-400-normal.woff2",
  "static/fonts/playfair-display-latin-600-normal.woff2",
  "static/fonts/playfair-display-latin-700-normal.woff2",
  "static/fonts/schibsted-grotesk-latin-400-normal.woff2",
  "static/fonts/schibsted-grotesk-latin-500-normal.woff2",
  "static/fonts/schibsted-grotesk-latin-600-normal.woff2",
  "static/fonts/schibsted-grotesk-latin-700-normal.woff2",
  "static/fonts/source-sans-3-latin-400-italic.woff2",
  "static/fonts/source-sans-3-latin-400-normal.woff2",
  "static/fonts/source-sans-3-latin-600-normal.woff2",
  "static/fonts/source-sans-3-latin-700-normal.woff2",
  "static/fonts/source-serif-4-latin-400-italic.woff2",
  "static/fonts/source-serif-4-latin-400-normal.woff2",
  "static/fonts/source-serif-4-latin-600-normal.woff2",
  "static/fonts/source-serif-4-latin-700-normal.woff2",
  "static/fonts/tinos-latin-400-italic.woff2",
  "static/fonts/tinos-latin-400-normal.woff2",
  "static/fonts/tinos-latin-700-italic.woff2",
  "static/fonts/tinos-latin-700-normal.woff2",
  "static/styles.css",
  "static/vendor/noble-ed25519.js",
  "static/vendor/nunjucks.LICENSE",
  "static/vendor/nunjucks.min.js",
  "static/web/catalog.json",
  "static/web/license.js",
  "static/web/local-api.js",
  "static/web/render.js",
  "static/web/sample.json",
  "static/web/templates.json"
];
const CACHE = `resume-maker-${BUILD}`;

// The page itself lives at /resume-maker, with no trailing slash (the site's
// hosting strips it), which is why this worker's scope is "/resume-maker" and the
// hosting sends Service-Worker-Allowed for it.
const PAGE = new URL("/resume-maker", self.location).href;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Straight from the network, not a stale HTTP cache.
    await cache.addAll([PAGE, ...CORE].map((url) => new Request(url, { cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("resume-maker-") && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // The page: the newest one when online, the cached one when not.
  if (request.mode === "navigate") {
    if (url.pathname !== "/resume-maker") return;
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(request);
        if (fresh.ok) cache.put(PAGE, fresh.clone());
        return fresh;
      } catch {
        return (await cache.match(PAGE)) || Response.error();
      }
    })());
    return;
  }

  if (!url.pathname.startsWith("/resume-maker/")) return;
  // Everything else is fixed for this build: cached first, fetched once.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  })());
});
