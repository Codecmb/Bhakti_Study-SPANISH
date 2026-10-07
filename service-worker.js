const CACHE = 'bhakti-study-spanish-offline-v1';
const MANIFEST = './offline-files.json';

async function cacheAcademy() {
  const cache = await caches.open(CACHE);

  const manifestResponse = await fetch(MANIFEST, { cache: 'no-store' });
  if (!manifestResponse.ok) {
    throw new Error(`Offline manifest failed: ${manifestResponse.status}`);
  }

  const files = await manifestResponse.json();
  const urls = [...new Set(['./', MANIFEST, ...files])];

  const failures = [];

  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await cache.put(url, response);
    } catch (error) {
      failures.push(`${url}: ${error.message}`);
    }
  }

  if (failures.length) {
    throw new Error(
      `Academy offline download incomplete (${failures.length} failed):\n` +
      failures.join('\n')
    );
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    cacheAcademy().then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith('bhakti-study-spanish-') &&
            key !== CACHE
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(
          event.request,
          event.request.mode === 'navigate' ? { ignoreSearch: true } : undefined
        );
        if (cached) return cached;

        if (event.request.mode === 'navigate') {
          const home = await caches.match('./index.html');
          if (home) return home;
        }

        throw new Error('Offline resource unavailable');
      })
  );
});
