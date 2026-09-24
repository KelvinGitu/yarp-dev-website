/* pdfsign's service worker, for the browser version: after the first visit
   it opens and works with no connection at all.

   web/build.py fills in BUILD (a hash of everything it built, so every
   deploy gets a fresh cache) and CORE (the files every visit needs). The
   rest (pdf.js's wasm, cmaps and standard fonts, only needed by some PDFs)
   is cached the first time a PDF asks for it. */

const BUILD = "1.0.1-0255888d61";
const CORE = [
  "icons/apple-touch-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "manifest.webmanifest",
  "static/app.js",
  "static/fonts/LICENSE.md",
  "static/fonts/caveat-latin-500-normal.woff2",
  "static/fonts/caveat-latin-ext-500-normal.woff2",
  "static/fonts/herr-von-muellerhoff-latin-400-normal.woff2",
  "static/fonts/herr-von-muellerhoff-latin-ext-400-normal.woff2",
  "static/fonts/homemade-apple-latin-400-normal.woff2",
  "static/fonts/mrs-saint-delafield-latin-400-normal.woff2",
  "static/fonts/mrs-saint-delafield-latin-ext-400-normal.woff2",
  "static/fonts/schibsted-grotesk-latin-400-normal.woff2",
  "static/fonts/schibsted-grotesk-latin-500-normal.woff2",
  "static/fonts/schibsted-grotesk-latin-600-normal.woff2",
  "static/fonts/schibsted-grotesk-latin-700-normal.woff2",
  "static/ink.js",
  "static/styles.css",
  "static/vendor/noble-ed25519.js",
  "static/vendor/pdf-lib.LICENSE.md",
  "static/vendor/pdf-lib.min.js",
  "static/vendor/pdfjs/LICENSE",
  "static/vendor/pdfjs/pdf.min.mjs",
  "static/vendor/pdfjs/pdf.worker.min.mjs",
  "static/web/license.js",
  "static/web/local-api.js"
];
const CACHE = `pdfsign-${BUILD}`;

// The page itself lives at /pdfsign, with no trailing slash (the site's
// hosting strips it), which is why this worker's scope is "/pdfsign" and the
// hosting sends Service-Worker-Allowed for it.
const PAGE = new URL("/pdfsign", self.location).href;

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
      if (key.startsWith("pdfsign-") && key !== CACHE) await caches.delete(key);
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
    if (url.pathname !== "/pdfsign") return;
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

  if (!url.pathname.startsWith("/pdfsign/")) return;
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
