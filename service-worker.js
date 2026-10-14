const CACHE = 'bhakti-study-spanish-books-v3';
const PREFIX = 'bhakti-study-spanish-';
const FILES = ["index.html", "manifest.webmanifest", "assets/bhakti-study-icon-192.png", "assets/bhakti-study-icon-512.png", "shared/styles.css", "shared/app.js", "data/programs.json", "data/books.json", "library/index.html", "library/reader.html", "shared/student-store.js", "shared/highlighter.js", "shared/data-registry.js", "shared/study-context.js", "shared/study-return-context.js", "shared/source-resolver.js", "shared/reader.js", "library/books-es/bbd/book.json", "library/books-es/cc-adi/book.json", "library/books-es/cc-antya/book.json", "library/books-es/cc-madhya/book.json", "library/books-es/ej/book.json", "library/books-es/ekc/book.json", "library/books-es/iso/book.json", "library/books-es/kb/book.json", "library/books-es/krp/book.json", "library/books-es/lob/book.json", "library/books-es/nod/book.json", "library/books-es/noi/book.json", "library/books-es/owk/book.json", "library/books-es/pop/book.json", "library/books-es/poy/book.json", "library/books-es/pqpa/book.json", "library/books-es/rv/book.json", "library/books-es/sb-canto-1/book.json", "library/books-es/sb-canto-10/book.json", "library/books-es/sb-canto-2/book.json", "library/books-es/sb-canto-3/book.json", "library/books-es/sb-canto-4/book.json", "library/books-es/sb-canto-5/book.json", "library/books-es/sb-canto-6/book.json", "library/books-es/sb-canto-7/book.json", "library/books-es/sb-canto-8/book.json", "library/books-es/sb-canto-9/book.json", "library/books-es/ssr/book.json", "library/books-es/tlc/book.json", "library/books-es/tqk/book.json", "library/books-es/ttp/book.json", "library/books-es/bg/book.json"];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    await caches.delete(CACHE);
    const cache = await caches.open(CACHE);
    try {
      for (let i = 0; i < FILES.length; i += 10) {
        const batch = FILES.slice(i, i + 10).map(path =>
          new Request(new URL(path, self.registration.scope), {
            cache: 'reload'
          })
        );
        await cache.addAll(batch);
      }
      await self.skipWaiting();
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(PREFIX) && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.registration.scope)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await cache.match(request, {ignoreSearch: true});
      return cached || Response.error();
    }
  })());
});
