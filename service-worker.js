const CACHE = 'bhakti-study-spanish-app-v7';
const BOOKS_CACHE = 'bhakti-study-spanish-books-v6';
const PREFIX = 'bhakti-study-spanish-';

const CORE = [
  'index.html',
  'manifest.webmanifest',
  'shared/styles.css',
  'shared/home-redesign.css',
  'shared/update-checker.js',
  'shared/app.js',
  'data/programs.json',
  'offline-books.json'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE.map(path =>
      new URL(path, self.registration.scope).href
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const keys = await caches.keys();

    for (const key of keys) {
      if (key.startsWith(PREFIX) && key !== CACHE && key !== BOOKS_CACHE) {
        const old = await caches.open(key);
        const requests = await old.keys();

        for (const request of requests) {
          if (!(await cache.match(request))) {
            const response = await old.match(request);
            if (response) await cache.put(request, response);
          }
        }
      }
    }

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin ||
      !url.href.startsWith(self.registration.scope)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);

    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached =
        await cache.match(request) ||
        await cache.match(request, {ignoreSearch: true});

      if (cached) return cached;

      return Response.error();
    }
  })());
});
