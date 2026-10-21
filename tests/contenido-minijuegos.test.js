// Contenido de los minijuegos (revisión 2026-10-21): que ninguna pantalla regale la respuesta antes de que el
// alumno conteste, que los textos estén bien escritos y que cada minijuego se llame igual en todos lados.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const leer = (f) => readFileSync(join(__dirname, '..', f), 'utf8');

/* ── Apuesta: el medidor de E(X) no puede marcar la respuesta antes de contestar ── */
test('Apuesta: el medidor de E(X) espera a que el alumno conteste (antes se animaba solo a los 1,2 s)', () => {
  const src = leer('js/scenes/PuzzleApuesta.js');
  const medidor = src.slice(src.indexOf('_drawEVMeter(cx, cy, p) {'), src.indexOf('/* ══ Pregunta + botones'));
  assert.ok(medidor.length > 500, 'no se encontró _drawEVMeter');
  assert.doesNotMatch(medidor, /delayedCall\(/, 'el medidor se anima solo: regala favorable/desfavorable/neutra');
  assert.match(medidor, /this\._revelarEV = \(\) =>/);
  // se dispara al contestar, antes de cualquier otra cosa de _signDecision
  assert.match(src, /_signDecision\(p, classOk\) \{\s*\n\s*if \(this\._revelarEV\) this\._revelarEV\(\);/);
  // la bandera se reinicia en init() (Phaser reutiliza la instancia de la escena)
  assert.match(src, /init\(d\) \{[\s\S]{0,200}this\._evRevelado = false/);
});

/* ── Moneda: la leyenda C(n,k) = … era el numerador de la respuesta ── */
test('Moneda: no se muestra «C(n,k) = …» antes de contestar (sólo en la explicación del resultado)', () => {
  const src = leer('js/scenes/PuzzleMoneda.js');
  assert.doesNotMatch(src, /combinaciones con/, 'la leyenda con el numerador sigue en pantalla');
  assert.match(src, /const explain = `C\(\$\{n\},\$\{k\}\) = \$\{C\}/, 'la explicación del resultado tiene que seguir diciéndolo');
});

/* ── Textos ── */
test('Dados: tildes y concordancia en la consigna', () => {
  const src = leer('js/scenes/PuzzleDados.js');
  assert.doesNotMatch(src, /descubri |cuales estan|cual esta /);
  assert.match(src, /descubrí \$\{pl \? 'cuáles están' : 'cuál está'\}/);
  assert.match(src, /verboSalir = faces\.length === 1 \? 'salga' : 'salgan'/);
  assert.doesNotMatch(src, /para que salga casi siempre/);
});

test('Moneda: «Lanzás» (voseo, como el resto del juego)', () => {
  assert.doesNotMatch(leer('js/scenes/PuzzleMoneda.js'), /Lanzas una moneda/);
});

test('aNombre: «Has derrotado al Golem» / «a la Hidra» para todos los monstruos', () => {
  const ctx = vm.createContext({
    window: { addEventListener() {} }, document: { addEventListener() {} },
    setTimeout, setInterval, clearInterval, clearTimeout, Math, String, Phaser: { Math: { Between: () => 0 }, Plugins: { ScenePlugin: class {} } },
  });
  vm.runInContext(leer('js/core/utils.js'), ctx);
  const a = (n) => vm.runInContext(`aNombre(${JSON.stringify(n)})`, ctx);
  assert.equal(a('El Golem Gaussiano'), 'al Golem Gaussiano');
  assert.equal(a('La Hidra de las Variables'), 'a la Hidra de las Variables');
  const nombres = [...leer('js/data/monsters.js').matchAll(/nombre:"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(nombres.length >= 10);
  for (const n of nombres) assert.doesNotMatch(a(n), /^a (El|La) /, n);
  assert.doesNotMatch(leer('js/scenes/VictoryScene.js'), /Has derrotado a \$\{jefeAnt/);
});

/* ── Un minijuego, un nombre ── */
test('cada minijuego se llama igual en el catálogo, el arcade, los logros y las guías', () => {
  const ctx = vm.createContext({});
  vm.runInContext(leer('js/data/puzzles.js'), ctx);
  const catalogo = vm.runInContext('PUZZLE_CATALOG.map(p => p.nombre)', ctx);
  assert.ok(catalogo.length >= 7, 'catálogo: ' + catalogo.length);
  const arcade = [...leer('js/scenes/ArcadeScene.js').matchAll(/name:'([^']+)'.*?pid:(\d+)/g)];
  assert.equal(arcade.length, 7);
  for (const [, nombre, pid] of arcade) assert.equal(nombre, catalogo[+pid], `ArcadeScene pid ${pid}`);
  const logros = leer('js/ui/logrosModal.js');
  for (const n of catalogo.slice(0, 4)) assert.ok(logros.includes(n), 'logrosModal no nombra «' + n + '»');
  for (const viejo of ['La Urna Mágica', 'La Moneda del Destino', 'La Gran Apuesta', 'La Ruleta del Azar']) {
    for (const f of ['js/scenes/ArcadeScene.js', 'js/ui/logrosModal.js', 'index.html']) assert.ok(!leer(f).includes(viejo), `${f} todavía dice «${viejo}»`);
  }
});

test('el Modo Arcade se llama Modo Arcade en el hub y en su pantalla (antes «Modo Práctica»)', () => {
  const src = leer('js/scenes/ArcadeScene.js');
  assert.match(src, /'MODO ARCADE'/);
  assert.doesNotMatch(src, /MODO PRÁCTICA|Iniciar Práctica/);
});
