// Arnés para correr sw.js de verdad fuera del navegador: un `self`, un
// `caches` y un `fetch` de mentira, y los eventos se disparan a mano.
//
// Resuelve las rutas relativas contra el origen, como hace el navegador:
// `cache.addAll(['./'])` guarda `https://origen/`. Si no, un `caches.match` que
// en el navegador acierta falla acá y los tests pasan por la razón equivocada.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const RAIZ = join(__dirname, '..', '..');
const CODIGO = readFileSync(join(RAIZ, 'sw.js'), 'utf8');
const ORIGEN = 'https://juego.example/';

function respuesta(url, status = 200) {
  const r = { url, status, ok: status >= 200 && status < 300, type: 'basic', cuerpo: 'x' };
  r.clone = () => ({ ...r, clone: r.clone });
  return r;
}

/**
 * @param {object} op
 * @param {boolean} op.sinRed          el fetch rechaza siempre (aula sin wifi)
 * @param {RegExp[]} op.fallan         pedidos que contestan 404 (archivo que no está)
 * @param {number}  op.demoraMs        el fetch tarda esto en contestar (wifi lento)
 */
function montar({ sinRed = false, fallan = [], demoraMs = 0 } = {}) {
  const almacen = new Map();
  const pedidos = [];
  const oyentes = {};
  let cortada = sinRed;
  let demora = demoraMs;

  const clave = (r) => new URL(typeof r === 'string' ? r : r.url, ORIGEN + 'sw.js').href;

  function traer(req) {
    const url = clave(req);
    pedidos.push(url);
    if (cortada) return Promise.reject(new TypeError('Failed to fetch'));
    const resp = respuesta(url, fallan.some((re) => re.test(url)) ? 404 : 200);
    if (!demora) return Promise.resolve(resp);
    return new Promise((ok) => setTimeout(() => ok(resp), demora));
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
    location: { origin: 'https://juego.example', href: ORIGEN + 'sw.js' },
    addEventListener: (t, fn) => { (oyentes[t] ??= []).push(fn); },
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
    caches,
  };

  const avisos = [];
  const ctx = vm.createContext({
    self, caches, fetch: traer, console: { ...console, warn: (...a) => avisos.push(a.join(' ')) },
    URL, TypeError, Promise, Object, Array, Math, JSON, Set, Map, Response: RespuestaPropia, setTimeout,
  });
  vm.runInContext(CODIGO, ctx, { filename: 'sw.js' });

  const disparar = (tipo, ev) => { for (const fn of oyentes[tipo] ?? []) fn(ev); };
  const leer = (nombre) => { try { return vm.runInContext(nombre, ctx); } catch (e) { return undefined; } };

  return {
    leer,
    PRECACHE: leer('PRECACHE'),
    NUCLEO: leer('NUCLEO') || [],
    FONDOS: leer('FONDOS') || [],
    CACHE_VERSION: leer('CACHE_VERSION'),
    GAME_VERSION: leer('GAME_VERSION'),
    avisos,
    pedidos,
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
    demorar(ms) { demora = ms; },
    contenido: () => [...almacen.values()].flatMap((m) => [...m.keys()]),
    url: (ruta) => new URL(ruta, ORIGEN).href,
  };
}

module.exports = { montar, RAIZ, ORIGEN };
