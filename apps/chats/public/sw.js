/**
 * SOMION HQ - SERVICE WORKER
 *
 * Minimal and deliberately so: it exists to make the prototype installable on a
 * phone for the last two minutes of the demo. It does not cache application
 * data, because the workspace is mock data held in memory and a stale cache
 * would only produce confusing behaviour in front of an audience.
 */

const SHELL_CACHE = "somion-hq-shell-v1";
const SHELL_ASSETS = ["/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!SHELL_ASSETS.includes(url.pathname)) return;
  event.respondWith(caches.match(request).then((hit) => hit ?? fetch(request)));
});
