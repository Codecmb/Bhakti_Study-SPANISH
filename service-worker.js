const CACHE = 'bhakti-study-spanish-offline-v2';
const PREFIX = 'bhakti-study-spanish-';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key => key.startsWith(PREFIX) && key !== CACHE)
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.registration.scope)) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request, {
        cache: 'no-store'
      });

      if (response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
      }

      return response;
    } catch (error) {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);

      if (cached) return cached;

      return Response.error();
    }
  })());
});
