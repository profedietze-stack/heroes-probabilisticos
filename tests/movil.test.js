// Teléfono, etapa 2: el lienzo mide la pantalla real solo en escenas migradas y solo en teléfono.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const RAIZ = join(__dirname, '..');
const leer = (f) => readFileSync(join(RAIZ, f), 'utf8');

function cargarMovil(extra = {}) {
  const ctx = vm.createContext({
    Phaser: { Plugins: { ScenePlugin: class {} } }, location: { search: '' }, screen: { width: 412, height: 915 },
    window: { matchMedia: () => ({ matches: true }), innerWidth: 812, innerHeight: 375 },
    document: { documentElement: { classList: { add() {} } } }, ...extra,
  });
  vm.runInContext(leer('js/core/movil.js').replace(/^if \(typeof module.*$/m, '') + '\n;this.__api = { tamanoLienzo, esMovil, MOVIL, LIENZO_BASE };', ctx);
  return ctx.__api;
}

test('escena migrada en teléfono: el lienzo mide la pantalla; las demás, 1024×700', () => {
  const m = cargarMovil();
  assert.equal(m.MOVIL, true);
  assert.deepEqual({ ...m.tamanoLienzo(true, true, 812, 375) }, { w: 812, h: 375 });
  assert.deepEqual({ ...m.tamanoLienzo(false, true, 812, 375) }, { w: 1024, h: 700 }, 'una escena sin migrar tiene que seguir en 1024×700');
});

test('en PC o tablet nada cambia, ni siquiera para una escena migrada', () => {
  const m = cargarMovil();
  assert.deepEqual({ ...m.tamanoLienzo(true, false, 1920, 1080) }, { w: 1024, h: 700 });
  const pc = cargarMovil({ window: { matchMedia: () => ({ matches: false }), innerWidth: 1920, innerHeight: 1080 }, screen: { width: 1920, height: 1080 } });
  assert.equal(pc.MOVIL, false);
  const tablet = cargarMovil({ screen: { width: 768, height: 1024 } });
  assert.equal(tablet.MOVIL, false, 'una tablet (lado corto > 700) no es teléfono');
});

test('?movil=1 fuerza el modo teléfono (para probar en PC)', () => {
  const m = cargarMovil({ location: { search: '?movil=1' }, window: { matchMedia: () => ({ matches: false }), innerWidth: 812, innerHeight: 375 } });
  assert.equal(m.MOVIL, true);
});

test('el cableado está completo: plugin registrado, script cargado y precacheado, menú migrado', () => {
  assert.match(leer('main.js'), /key: 'LienzoMovilPlugin', plugin: LienzoMovilPlugin/);
  assert.match(leer('main.js'), /vigilarGiro\(window\.game\)/);
  assert.match(leer('index.html'), /src:'js\/core\/movil\.js'/);
  assert.match(leer('sw.js'), /V\('js\/core\/movil\.js'\)/);
  assert.ok(existsSync(join(RAIZ, 'js/core/movil.js')));
  assert.match(leer('js/scenes/MenuScene.js'), /MenuScene\.DISENO_MOVIL = true/);
});

test('el CSS quita el tope de 1024×700 en modo teléfono (si no, el lienzo se recorta)', () => {
  assert.match(leer('css/variables.css'), /html\.movil #phaserGame\{[^}]*max-width:none;max-height:none/);
});

test('el menú compacto usa botones de ≥ 44 px y letras de ≥ 14 px', () => {
  const src = leer('js/scenes/MenuScene.js');
  const bh = [...src.matchAll(/const bBh = compacto \? (\d+) : \(columna \? (\d+) : \d+\)/g)][0];
  assert.ok(bh && +bh[1] >= 44 && +bh[2] >= 44, 'alto de botón táctil');
  const fs = src.match(/const bFs = \(compacto \|\| columna\) \? '(\d+)px'/);
  assert.ok(fs && +fs[1] >= 14, 'letra del botón');
});
