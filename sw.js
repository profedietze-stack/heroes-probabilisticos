/* ══════════════════════════════════════
   sw.js — Service Worker (PWA offline)

   Qué hace:
   - Al instalarse guarda TODO el código del juego (scripts, CSS, tipografías,
     Phaser): después de una sola visita con red, el juego anda sin internet.
     Antes sólo se guardaban 5 archivos y el resto recién quedaba en la caché a
     la segunda visita (primera visita: sin wifi = pantalla en blanco).
   - Las pantallas de fondo (≈ 4 MB) se bajan aparte y sin apuro: si alguna
     falla no se pierde la instalación.
   - index.html: primero la red (con tope de 3 s) y si no contesta, la copia.
     Así una versión nueva llega apenas se abre el juego con wifi, y con wifi
     malo no se queda esperando.
   - Todo lo demás: primero la copia y se revalida en segundo plano.

   AL PUBLICAR UN CAMBIO en algo que se precachea: subir GAME_VERSION (acá y en
   index.html, que tienen que coincidir) y CACHE_VERSION, y correr
       node tests/sellar-cache.js
   Los tests fallan si no se hizo (tests/cache-version.test.js).
══════════════════════════════════════ */

const GAME_VERSION  = '15';
const CACHE_VERSION = 'heroesprob-v17';

/* index.html pide los scripts con ?v=<GAME_VERSION>: se precachean con el MISMO
   URL (la caché compara el pedido completo, con su query). */
const V = (ruta) => ruta + '?v=' + GAME_VERSION;

/* Sin esto el juego no arranca: instalación TODO O NADA (son pocos archivos). */
const NUCLEO = [
  './',
  './index.html',
  V('main.js'),
  V('js/ui/error-banner.js'),
  './manifest.json',
  V('vendor/phaser.min.js'),
];

/* El resto del código. Tolerante: un archivo que falla se avisa y se reintenta
   al usarse, sin tirar abajo toda la instalación (`cache.addAll` rechaza entera
   con un solo 404 y no deja NADA guardado). */
const CODIGO = [
  V('js/core/rng.js'),
  V('js/core/i18n.js'),
  V('js/data/monsters.js'),
  V('js/data/items.js'),
  V('js/data/npcs.js'),
  V('js/data/puzzles.js'),
  V('js/core/state.js'),
  V('js/core/config.js'),
  V('js/core/clases.js'),
  V('js/core/state-schema.js'),
  V('js/core/audio.js'),
  V('js/core/save.js'),
  V('js/core/utils.js'),
  V('js/core/movil.js'),
  V('js/core/skills.js'),
  V('js/ui/grimorio.js'),
  V('js/ui/map-events.js'),
  V('js/ui/tutorial.js'),
  V('js/render/monster-svg.js'),
  V('js/render/npc-render.js'),
  V('js/render/bg-effects.js'),
  V('js/render/class-fx.js'),
  V('js/ui/DiosaOverlay.js'),
  V('js/scenes/MenuScene.js'),
  V('js/scenes/IntroScene.js'),
  V('js/scenes/BattleScene.js'),
  V('js/scenes/VictoryScene.js'),
  V('js/scenes/MapScene.js'),
  V('js/scenes/PuzzleScene.js'),
  V('js/scenes/PuzzleBase.js'),
  V('js/scenes/PuzzleUrna.js'),
  V('js/scenes/PuzzleMoneda.js'),
  V('js/scenes/PuzzleApuesta.js'),
  V('js/scenes/PuzzleRuleta.js'),
  V('js/scenes/PuzzleDados.js'),
  V('js/scenes/PuzzlePuertas.js'),
  V('js/scenes/PuzzleTesoro.js'),
  V('js/core/arcadeStats.js'),
  V('js/core/achievements.js'),
  V('js/ui/logrosModal.js'),
  V('js/core/points.js'),
  V('js/scenes/ArcadeHubScene.js'),
  V('js/scenes/LibreScene.js'),
  V('js/scenes/ArcadeScene.js'),
  V('js/scenes/FinalScene.js'),
  V('js/dev/dev-plugin.js'),
  'css/fuentes.css',
  'css/variables.css',
  'css/modals.css',
  'css/buttons.css',
  'css/ui.css',
  'css/npc-animations.css',
  /* Subconjunto latino de cada tipografía (lo que el castellano usa). Los
     `-latin-ext` se guardan cuando alguna pantalla los pide. */
  'fonts/cinzel-600-latin.woff2',
  'fonts/cinzel-800-latin.woff2',
  'fonts/courier-prime-400-latin.woff2',
  'fonts/lora-400-i-latin.woff2',
  'fonts/lora-400-latin.woff2',
  'fonts/lora-600-latin.woff2',
  'fonts/poppins-400-latin.woff2',
  'fonts/poppins-600-latin.woff2',
  'fonts/poppins-800-latin.woff2',
  'assets/icons/icon-192.png',
];

/* Fondos de pantalla: pesan 4 MB en total. Se bajan después del código y sin
   que su fallo cuente. No entran en la huella de tests/cache-version.test.js
   (si un fondo cambia, la revalidación en segundo plano lo actualiza). */
const FONDOS = [
  'assets/backgrounds/ui/bg-menu.jpg',
  'assets/backgrounds/ui/bg-hub.jpg',
  'assets/backgrounds/npcs/bg-mercader.jpg',
  'assets/backgrounds/npcs/bg-oraculo.jpg',
  'assets/backgrounds/monsters/bg-espectro.jpg',
  'assets/backgrounds/monsters/bg-hidra.jpg',
  'assets/backgrounds/monsters/bg-golem.jpg',
  'assets/backgrounds/monsters/bg-bruja.jpg',
  'assets/backgrounds/monsters/bg-tiburon.jpg',
  'assets/backgrounds/monsters/bg-dragon.jpg',
  'assets/backgrounds/monsters/bg-espiritu.jpg',
  'assets/backgrounds/monsters/bg-titan.jpg',
  'assets/backgrounds/monsters/bg-esfinge.jpg',
  'assets/backgrounds/monsters/bg-demiurgo.jpg',
];

/* Lo que se precachea y entra en la huella (todo salvo los fondos). */
const PRECACHE = [...NUCLEO, ...CODIGO];

const ESPERA_HTML_MS = 3000;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) =>
      c.addAll(NUCLEO)
        .then(() => Promise.allSettled(CODIGO.map((u) => c.add(u))))
        .then((res) => {
          const fallidos = CODIGO.filter((_, i) => res[i].status === 'rejected');
          if (fallidos.length) console.warn('[sw] no se pudo guardar:', fallidos.join(', '));
          return Promise.allSettled(FONDOS.map((u) => c.add(u)));
        })
    ).then(() => self.skipWaiting())
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

/* Guarda una respuesta buena (200, del propio origen). Una con error NO se
   guarda: quedaría congelada en la caché. El `catch` importa: sin él, una
   escritura que falla queda como promesa rechazada sin atender. */
function guardar(e, resp) {
  if (resp && resp.status === 200 && resp.type === 'basic') {
    const clone = resp.clone();
    const guardado = caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
    if (e.waitUntil) e.waitUntil(guardado.catch(() => {}));
    else guardado.catch(() => {});
  }
  return resp;
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  /* index.html (navegación): la red manda, con tope de tiempo. */
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const red = fetch(e.request).then(resp => guardar(e, resp));
        red.catch(() => {});                 // si gana el tope, que su fallo no quede sin atender
        const tope = new Promise(res => setTimeout(() => res(cached), ESPERA_HTML_MS));
        return Promise.race([red, tope]).then(r => r || red);
      }).catch(() => caches.match('./index.html').then(c => c || sinNadaQueServir()))
        .catch(() => sinNadaQueServir())
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Revalidación en segundo plano: actualiza el cache para la próxima carga.
      const fetched = fetch(e.request).then(resp => guardar(e, resp))
        .catch(() => cached || sinNadaQueServir());
      return cached || fetched;
    }).catch(() => sinNadaQueServir())
  );
});
