const CACHE_NAME = 'mediq-shell-v1';
const APP_SHELL = ['/', '/manifest.json', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('mediq-shell-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache patient data, authentication responses, or realtime traffic.
  if (
    url.pathname === '/api' ||
    url.pathname.startsWith('/api/') ||
    url.pathname === '/socket.io' ||
    url.pathname.startsWith('/socket.io/')
  ) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match('/')) || Response.error();
        })
    );
    return;
  }

  // Cache static app assets only; Vite's fingerprinted assets can be cached safely.
  if (
    url.pathname.startsWith('/assets/') ||
    /\.(js|css|svg|png|jpg|jpeg|webp|ico|woff2?)$/i.test(url.pathname) ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
