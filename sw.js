/* ══════════════════════════════════════
   sw.js — Service Worker (PWA offline)
   Estrategia: cache-first con actualización en segundo plano
   (stale-while-revalidate). Subí CACHE_VERSION al publicar cambios
   para invalidar el cache viejo.
══════════════════════════════════════ */

const CACHE_VERSION = 'heroesprob-v6';

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

/* Lo último que se contesta cuando no hay ni red ni copia guardada.
   `respondWith` con `undefined` —o con una promesa rechazada— es un error de
   red para el navegador: pantalla rota, sin banner, sin nada que el docente
   pueda leer, y el banner de errores del juego tampoco lo ve porque el fallo
   pasa en el hilo del service worker. */
function sinNadaQueServir() {
  return new Response('Sin conexión y sin copia guardada.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      // Revalidación en segundo plano: actualiza el cache para la próxima carga.
      // El `catch` del `put` importa: sin él, una escritura que falla queda como
      // promesa rechazada sin atender.
      const fetched = fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          const guardado = caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
          if (e.waitUntil) e.waitUntil(guardado.catch(() => {}));
          else guardado.catch(() => {});
        }
        return resp;
      }).catch(() => cached || sinNadaQueServir());
      return cached || fetched;
    }).catch(() => sinNadaQueServir())
  );
});
