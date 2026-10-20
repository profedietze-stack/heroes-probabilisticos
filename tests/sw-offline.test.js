// El service worker, corrido de verdad fuera del navegador.
//
// Es lo único del juego que falla en silencio: no rompe nada visible, el juego
// simplemente no anda sin internet. Acá se lo ejecuta con un `self`, un `caches`
// y un `fetch` de mentira (tests/helpers/sw-harness.js), y se le disparan los
// eventos a mano.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const { montar, RAIZ } = require('./helpers/sw-harness');

const sinQuery = (r) => r.replace(/\?.*$/, '').replace(/^\.?\//, '');

test('todo lo que precachea existe en el disco', () => {
  // `cache.addAll` es todo o nada: un solo 404 rechaza la instalación entera y
  // el juego se queda sin caché ninguna, ni siquiera de lo que sí estaba.
  const { PRECACHE, FONDOS } = montar();
  // `Array.from` a propósito: el array viene de dentro del `vm`, y un `.map()`
  // sobre él devuelve otro array de ese realm — `assert.deepEqual` en modo
  // estricto compara prototipos y falla aunque el contenido esté bien.
  const faltan = [...Array.from(PRECACHE), ...Array.from(FONDOS)]
    .map(sinQuery)
    .filter((r) => r !== '' && !existsSync(join(RAIZ, r)));
  assert.deepEqual(faltan, [], `el service worker nombra archivos que no existen: ${faltan.join(', ')}`);
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
  const res = await sw.fetch('https://juego.example/js/scenes/PuzzleTesoro.js?v=5')
    .catch(() => 'RECHAZO');
  assert.notEqual(res, 'RECHAZO', 'la promesa de respondWith se rechazó');
  assert.notEqual(res, undefined, 'respondWith resolvió a undefined: el navegador lo toma como error de red');
});

test('con la copia guardada, sin red sigue sirviendo el juego', async () => {
  const sw = montar();
  await sw.install();
  await sw.fetch('https://juego.example/js/core/state.js?v=5');
  sw.cortarRed();
  const res = await sw.fetch('https://juego.example/js/core/state.js?v=5').catch(() => null);
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

// ── Cobertura del precacheo ────────────────────────────────────────────────

test('index.html pide los scripts con la versión que el service worker precachea', () => {
  // Los scripts se piden como `js/x.js?v=<GAME_VERSION>` y la caché compara el
  // pedido completo, con su query. Si las dos versiones no coinciden, el
  // precacheo guarda archivos que nadie va a pedir.
  const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');
  const enHtml = html.match(/var GAME_VERSION = '([^']+)'/);
  assert.ok(enHtml, 'no se encontró GAME_VERSION en index.html');
  assert.equal(montar().GAME_VERSION, enHtml[1], 'GAME_VERSION de sw.js e index.html tienen que ser el mismo');
});

test('cada script, hoja de estilo y tipografía que arranca el juego está precacheada', () => {
  const sw = montar();
  const precacheados = new Set(Array.from(sw.PRECACHE).map((r) => r.replace(/^\.\//, '')));
  const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');
  const v = '?v=' + sw.GAME_VERSION;

  const pedidos = [];
  for (const m of html.matchAll(/src:'([^']+)'/g)) pedidos.push(m[1] + v);          // lista de scripts del splash
  for (const m of html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)) pedidos.push(m[1]);
  pedidos.push('main.js' + v, 'js/ui/error-banner.js' + v);                            // los carga el propio index
  const css = readFileSync(join(RAIZ, 'css', 'fuentes.css'), 'utf8');
  for (const m of css.matchAll(/fonts\/([a-z0-9-]+-latin)\.woff2/g)) pedidos.push(`fonts/${m[1]}.woff2`);

  const faltan = [...new Set(pedidos)].filter((p) => !precacheados.has(p));
  assert.deepEqual(faltan, [], `el juego pide archivos que el service worker no precachea: ${faltan.join(', ')}`);
  assert.ok(pedidos.length > 50, `se esperaban >50 pedidos y el barrido vio ${pedidos.length}: ¿cambió el formato de index.html?`);
});

test('después de UNA visita con red, el juego anda sin red (no hace falta una segunda)', async () => {
  // Antes se precacheaban 5 archivos: lo demás entraba a la caché recién en la
  // segunda visita, así que una tablet que abría el juego una vez con wifi y lo
  // abría de nuevo sin wifi se quedaba sin scripts.
  const sw = montar();
  await sw.install();
  sw.cortarRed();
  for (const ruta of ['js/scenes/BattleScene.js?v=5', 'js/core/save.js?v=5', 'css/modals.css', 'fonts/cinzel-600-latin.woff2', 'main.js?v=5']) {
    const res = await sw.fetch(sw.url(ruta));
    assert.ok(res && res.status === 200, `${ruta}: sin red no salió de la caché (${res && res.status})`);
  }
});

test('un archivo que falta no tira abajo toda la instalación', async () => {
  // `cache.addAll` es todo o nada. Con la lista tolerante, un 404 se avisa y el
  // resto queda guardado.
  const sw = montar({ fallan: [/PuzzleTesoro\.js/] });
  await sw.install();
  const guardado = sw.contenido();
  assert.ok(guardado.some((u) => /BattleScene\.js/.test(u)), 'no quedó nada guardado por un solo 404');
  assert.ok(!guardado.some((u) => /PuzzleTesoro\.js/.test(u)));
  assert.ok(sw.avisos.some((a) => /PuzzleTesoro/.test(a)), 'el archivo que falló no se avisó por consola');
});

test('si falla un archivo del núcleo (HTML, main, Phaser) la instalación no se da por buena', async () => {
  // Sin el núcleo el juego no arranca: mejor no instalar y reintentar que dejar
  // un service worker que sirve un juego incompleto.
  const sw = montar({ fallan: [/phaser\.min\.js/] });
  await assert.rejects(sw.install());
});

test('los fondos pesan 4 MB y su fallo no cuenta', async () => {
  const sw = montar({ fallan: [/assets\/backgrounds\//] });
  await sw.install();                                        // no rechaza
  const guardado = sw.contenido();
  assert.ok(guardado.some((u) => /BattleScene\.js/.test(u)));
  assert.ok(!guardado.some((u) => /bg-menu/.test(u)));
});

// ── index.html: la red manda, con tope ─────────────────────────────────────

test('la navegación trae la versión nueva del HTML cuando hay red', async () => {
  const sw = montar();
  await sw.install();
  sw.pedidos.length = 0;
  const res = await sw.fetch(sw.url('./'), { mode: 'navigate' });
  assert.equal(res.status, 200);
  assert.ok(sw.pedidos.includes(sw.url('./')), 'no fue a la red a buscar el HTML');
});

test('sin red, la navegación sirve la copia del HTML', async () => {
  const sw = montar();
  await sw.install();
  sw.cortarRed();
  const res = await sw.fetch(sw.url('./'), { mode: 'navigate' });
  assert.equal(res.status, 200, 'sin red no sirvió la copia del HTML');
});

test('con wifi lento, la navegación no espera más de ~3 s teniendo una copia', async () => {
  const sw = montar();
  await sw.install();
  sw.demorar(3600);                                          // el HTML tarda 3,6 s en llegar
  const t0 = Date.now();
  const res = await sw.fetch(sw.url('./'), { mode: 'navigate' });
  const demoro = Date.now() - t0;
  assert.equal(res.status, 200);
  assert.ok(demoro >= 2800 && demoro < 3500, `tenía que ganar la copia a los ~3 s y tardó ${demoro} ms`);
});

test('sin red y sin ninguna copia, la navegación contesta algo legible', async () => {
  const sw = montar({ sinRed: true });
  const res = await sw.fetch(sw.url('./'), { mode: 'navigate' }).catch(() => 'RECHAZO');
  assert.notEqual(res, 'RECHAZO');
  assert.ok(res && res.status === 503);
});
