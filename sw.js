/* ══════════════════════════════════════
   sw.js — Service Worker (PWA offline)
   Estrategia: cache-first con actualización en segundo plano
   (stale-while-revalidate). Subí CACHE_VERSION al publicar cambios
   para invalidar el cache viejo.
══════════════════════════════════════ */

const CACHE_VERSION = 'heroesprob-v5';

const PRECACHE = [
  './',
  './index.html',
  './main.js',
  './manifest.json',
  'vendor/phaser.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      // Revalidación en segundo plano: actualiza el cache para la próxima carga
      const fetched = fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && (resp.type === 'basic' || resp.type === 'cors')) {
          const clone = resp.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);   // sin red: lo cacheado o nada
      return cached || fetched;
    })
  );
});
