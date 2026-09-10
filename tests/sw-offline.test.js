// El service worker, corrido de verdad fuera del navegador.
//
// Es lo único del juego que falla en silencio: no rompe nada visible, el juego
// simplemente no anda sin internet. Acá se lo ejecuta con un `self`, un `caches`
// y un `fetch` de mentira, y se le disparan los eventos a mano.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const RAIZ = join(__dirname, '..');
const CODIGO = readFileSync(join(RAIZ, 'sw.js'), 'utf8');

function respuesta(url, status = 200) {
  const r = { url, status, ok: status >= 200 && status < 300, type: 'basic', cuerpo: 'x' };
  r.clone = () => ({ ...r, clone: r.clone });
  return r;
}

/** Monta el service worker con un entorno falso. */
function montar({ sinRed = false } = {}) {
  const almacen = new Map();
  const pedidos = [];
  const oyentes = {};
  let cortada = sinRed;

  const clave = (r) => new URL(typeof r === 'string' ? r : r.url, 'https://juego.example/sw.js').href;

  function traer(req) {
    pedidos.push(clave(req));
    if (cortada) return Promise.reject(new TypeError('Failed to fetch'));
    return Promise.resolve(respuesta(clave(req)));
  }

  function abrir(nombre) {
    if (!almacen.has(nombre)) almacen.set(nombre, new Map());
    const mapa = almacen.get(nombre);
    const cache = {
      add: (req) => traer(req).then((res) => {
        if (!res.ok) throw new Error(`no se pudo precachear ${clave(req)}`);
        mapa.set(clave(req), res);
      }),
      addAll: (reqs) => Promise.all(reqs.map((r) => cache.add(r))).then(() => undefined),
      put: (req, res) => { mapa.set(clave(req), res); return Promise.resolve(); },
      match: (req) => Promise.resolve(mapa.get(clave(req))),
      delete: (req) => Promise.resolve(mapa.delete(clave(req))),
    };
    return cache;
  }

  const caches = {
    open: (n) => Promise.resolve(abrir(n)),
    keys: () => Promise.resolve([...almacen.keys()]),
    delete: (n) => Promise.resolve(almacen.delete(n)),
    match: (req) => {
      for (const mapa of almacen.values()) {
        const hit = mapa.get(clave(req));
        if (hit) return Promise.resolve(hit);
      }
      return Promise.resolve(undefined);
    },
  };

  class RespuestaPropia {
    constructor(cuerpo, init = {}) {
      this.cuerpo = cuerpo;
      this.status = init.status ?? 200;
      this.ok = this.status >= 200 && this.status < 300;
    }
    clone() { return this; }
  }

  const self = {
    location: { origin: 'https://juego.example', href: 'https://juego.example/sw.js' },
    addEventListener: (t, fn) => { (oyentes[t] ??= []).push(fn); },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
    caches,
  };

  const ctx = vm.createContext({
    self, caches, fetch: traer, console, URL, TypeError, Promise,
    Object, Array, Math, JSON, Set, Map, Response: RespuestaPropia, setTimeout,
  });
  vm.runInContext(CODIGO, ctx, { filename: 'sw.js' });

  const disparar = (tipo, ev) => { for (const fn of oyentes[tipo] ?? []) fn(ev); };

  return {
    PRECACHE: vm.runInContext('PRECACHE', ctx),
    CACHE_VERSION: vm.runInContext('CACHE_VERSION', ctx),
    install() {
      const tareas = [];
      disparar('install', { waitUntil: (p) => tareas.push(p) });
      return Promise.all(tareas);
    },
    fetch(url, extra = {}) {
      let respondida;
      disparar('fetch', {
        request: { url, method: 'GET', ...extra },
        waitUntil: () => {},
        respondWith: (p) => { respondida = Promise.resolve(p); },
      });
      return respondida ?? traer(url);
    },
    cortarRed() { cortada = true; },
    contenido: () => [...almacen.values()].flatMap((m) => [...m.keys()]),
  };
}

test('todo lo que precachea existe en el disco', () => {
  // `cache.addAll` es todo o nada: un solo 404 rechaza la instalación entera y
  // el juego se queda sin caché ninguna, ni siquiera de lo que sí estaba.
  const { PRECACHE } = montar();
  // `Array.from` a propósito: el array viene de dentro del `vm`, y un `.map()`
  // sobre él devuelve otro array de ese realm — `assert.deepEqual` en modo
  // estricto compara prototipos y falla aunque el contenido esté bien.
  const faltan = Array.from(PRECACHE)
    .map((r) => r.replace(/^\.?\//, ''))
    .filter((r) => r !== '' && !existsSync(join(RAIZ, r)));
  assert.deepEqual(faltan, [], `PRECACHE nombra archivos que no existen: ${faltan.join(', ')}`);
});

test('el install deja el juego en la caché', async () => {
  const sw = montar();
  await sw.install();
  const guardado = sw.contenido();
  assert.ok(guardado.some((u) => /index\.html/.test(u)), `no quedó el HTML: ${guardado.join(', ')}`);
  assert.ok(guardado.some((u) => /phaser/.test(u)), 'no quedó Phaser');
});

/**
 * Sin red y sin copia guardada, `respondWith` recibía `undefined`.
 *
 *     const fetched = fetch(e.request).then(...).catch(() => cached);
 *     return cached || fetched;
 *
 * Cuando no hay nada en caché, `cached` es `undefined`, así que el `catch`
 * devuelve `undefined` y `respondWith` resuelve a nada. Para el navegador eso es
 * un error de red: pantalla rota, sin banner, sin nada que el docente pueda
 * leer — y el banner de errores del juego tampoco lo ve, porque el fallo pasa
 * en el hilo del service worker.
 *
 * Pasa justo cuando más molesta: el aula sin wifi pidiendo un archivo que esa
 * tablet todavía no había cargado (una escena a la que nadie había entrado, un
 * sonido, una fuente).
 */
test('sin red y sin caché, contesta algo en vez de romper la pantalla', async () => {
  const sw = montar({ sinRed: true });
  await sw.install().catch(() => {});
  const res = await sw.fetch('https://juego.example/js/scenes/PuzzleTesoro.js?v=4')
    .catch(() => 'RECHAZO');
  assert.notEqual(res, 'RECHAZO', 'la promesa de respondWith se rechazó');
  assert.notEqual(res, undefined, 'respondWith resolvió a undefined: el navegador lo toma como error de red');
});

test('con la copia guardada, sin red sigue sirviendo el juego', async () => {
  const sw = montar();
  await sw.install();
  await sw.fetch('https://juego.example/js/core/state.js?v=4');
  sw.cortarRed();
  const res = await sw.fetch('https://juego.example/js/core/state.js?v=4').catch(() => null);
  assert.ok(res && res.ok, 'sin red no devolvió la copia que ya tenía');
});

test('no intercepta lo que no es GET', async () => {
  const sw = montar();
  await sw.install();
  // Sin `respondWith`, el arnés cae al fetch normal: lo importante es que no
  // intente guardar un POST, que en el navegador tira TypeError.
  const res = await sw.fetch('https://juego.example/algo', { method: 'POST' }).catch(() => 'RECHAZO');
  assert.notEqual(res, 'RECHAZO');
});
