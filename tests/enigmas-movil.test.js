// Enigmas y escena del Mercader/Oráculo en teléfono apaisado: zonas de pantalla, tamaños táctiles
// y que en escritorio/tablet no se cree nada (scene._pz = null).
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const leer = (f) => readFileSync(join(__dirname, '..', f), 'utf8');
const traga = new Proxy(function () {}, { get: () => traga, apply: () => traga, set: () => true });

function base() {
  const ctx = vm.createContext({ Phaser: { Scene: class { constructor() {} } }, console, Math, Object, Array, JSON, Set, document: traga, window: traga, snd_item() {}, snd_buff() {}, snd_fail() {} });
  vm.runInContext(leer('js/scenes/PuzzleBase.js'), ctx, { filename: 'PuzzleBase.js' });
  return ctx;
}
const escena = (w, h) => {
  const eventos = [];
  return { scale: { width: w, height: h }, sys: { events: { on: (n) => eventos.push(n), off() {} } }, events: { on: (n) => eventos.push(n), once() {}, off() {} }, _ev: eventos };
};

const ENIGMAS = ['Urna', 'Moneda', 'Ruleta', 'Dados', 'Puertas', 'Tesoro', 'Apuesta'];

test('los 7 enigmas y la escena del NPC están migrados al lienzo del teléfono', () => {
  for (const n of ENIGMAS) assert.match(leer(`js/scenes/Puzzle${n}.js`), new RegExp(`Puzzle${n}\\.DISENO_MOVIL = true`), n);
  assert.match(leer('js/scenes/PuzzleScene.js'), /PuzzleScene\.DISENO_MOVIL = true/);
});

test('cada enigma abre y cierra el modo teléfono (pzCompactoInit y pzCompactoFin)', () => {
  for (const n of ENIGMAS) {
    const src = leer(`js/scenes/Puzzle${n}.js`);
    assert.match(src, /pzCompactoInit\(/, `${n}: falta pzCompactoInit`);
    assert.match(src, /pzCompactoFin\(this\)/, `${n}: falta pzCompactoFin`);
  }
});

for (const [w, h] of [[812, 375], [667, 375], [932, 430]]) {
  test(`teléfono ${w}×${h}: zonas de pantalla con lugar para las respuestas de 44 px`, () => {
    const ctx = base();
    const Z = vm.runInContext('pzZonas', ctx)(escena(w, h), false);
    assert.ok(Z.ui.w >= 300, 'la columna de pregunta y respuestas tiene que ser ancha');
    assert.ok(Z.ill.w >= 250, 'la ventana de ilustración tiene que ser usable');
    assert.ok(Z.ill.x + Z.ill.w + Z.pad <= Z.ui.x, 'ilustración y respuestas no se pisan');
    assert.ok(Z.ui.x + Z.ui.w <= w, 'las respuestas entran en el ancho');
    assert.ok(Z.ill.y + Z.ill.h <= h && Z.ui.y + Z.ui.h <= h, 'todo entra en el alto');
    // Dos filas de respuestas de 48 px + hueco de 8 caben en la columna con lugar para la pregunta.
    assert.ok(Z.ui.h >= 2 * 48 + 8 + 100, 'lugar para pregunta y 2×2 respuestas');
    const ancho = vm.runInContext('pzZonas', ctx)(escena(w, h), true);
    assert.ok(ancho.ill.w >= w - 24 && ancho.ui.w === 0, 'en modo ancho la ilustración usa toda la pantalla');
  });
}

test('pzCompactoInit: en teléfono crea el estado y en escritorio/tablet no hace nada', () => {
  const ctx = base();
  const init = vm.runInContext('pzCompactoInit', ctx);
  const movil = escena(812, 375);
  const pz = init(movil, { x: 100, y: 100, w: 300, h: 200 });
  assert.ok(pz && movil._pz, 'teléfono: hay estado');
  assert.equal(pz.zoom, 1, 'una ilustración que entra no se achica');
  assert.ok(movil._ev.includes('postupdate'), 'reparte las cámaras antes de cada dibujo');
  const pc = escena(1024, 700);
  assert.equal(init(pc, { x: 0, y: 0, w: 300, h: 200 }), null);
  assert.equal(pc._pz, null, 'escritorio: scene._pz es null y todo sigue igual');
  assert.equal(pc._ev.length, 0, 'escritorio: no se registra nada');
});

test('una ilustración más grande que la ventana se achica (zoom < 1) y nunca se agranda', () => {
  const ctx = base();
  const init = vm.runInContext('pzCompactoInit', ctx);
  const grande = init(escena(812, 375), { x: 0, y: 0, w: 900, h: 600 });
  assert.ok(grande.zoom < 1 && grande.zoom > 0.3, `zoom ${grande.zoom}`);
  const chica = init(escena(812, 375), { x: 0, y: 0, w: 100, h: 80 });
  assert.equal(chica.zoom, 1);
});

test('botones y textos del teléfono: 44 px o más y letras de 13 px o más', () => {
  const b = leer('js/scenes/PuzzleBase.js');
  assert.match(b, /GAP = 8; BH = 48;/, 'respuestas 2×2 de 48 px');
  assert.match(b, /BH = 46; BW = Math\.floor\(\(pz\.Z\.w/, 'respuestas en fila de 46 px');
  assert.match(b, /BH = Math\.ceil\(46 \* K\)/, 'botón de acción de 46 px reales aunque haya zoom');
  assert.match(b, /btn\.fillCircle\(bx, by, 20\)/, 'el "?" mide 40 px de diámetro');
  assert.match(b, /scene\.add\.circle\(bx, by, 22, 0, 0\)/, '…y su zona táctil, 44 px');
  assert.match(b, /fontSize:'14px', color:'#c3d2e2'/, 'explicación del resultado en 14 px');
  assert.match(b, /rectangle\(bx, by, 220, 44, 0, 0\)\.setDepth\(60\)\.setScrollFactor\(0\)/, 'Continuar de 44 px, fijo a la pantalla');
  const s = leer('js/scenes/PuzzleScene.js');
  assert.match(s, /fontSize: C \? '14px' : '12\.5px'/, 'diálogo del NPC en 14 px');
  assert.match(s, /padding: C \? \{x:18, y:16\}/, '"Volver al mapa" táctil');
});

test('el panel del enigma se reparte por scrollFactor real (también para lo que se crea tarde)', () => {
  const b = leer('js/scenes/PuzzleBase.js');
  assert.match(b, /pz\.sync = \(\) =>/);
  assert.match(b, /scene\.events\.on\('postupdate', pz\.sync\)/);
  assert.match(b, /go\.list\) go\.list\.forEach\(c => marcar\(c, f\)\)/, 'los hijos de un contenedor siguen a su contenedor');
});

// Bug hallado midiendo el teléfono: el aviso "Antes de continuar" del Mercader no dejaba continuar con el mouse.
// Phaser también recibe el "soltar" de un clic hecho SOBRE el modal; si cae encima del botón de un enigma, lo dispara,
// el aviso se vuelve a armar y el "click" del botón del modal se pierde.
test('con un modal abierto, un clic que Phaser ve "debajo" no reabre el aviso ni la tienda', () => {
  const ctx = vm.createContext({ Phaser: { Scene: class { constructor() {} } }, console, Math, Object, Array, JSON, Set,
    document: { getElementById: () => ({ classList: { contains: () => ctx.__abierto } }) }, window: traga, snd_item() {}, closeItemModal() {} });
  vm.runInContext(leer('js/scenes/PuzzleScene.js'), ctx, { filename: 'PuzzleScene.js' });
  const e = vm.runInContext('Object.create(PuzzleScene.prototype)', ctx);
  let avisos = 0, tiendas = 0;
  Object.assign(e, { _npcKey: 'mercader', _confirmedAdvance: false, _selecting: false });
  e._confirmAdvance = () => { avisos++; };
  ctx.__abierto = true;
  e._selectPuzzle(0);
  assert.equal(avisos, 0, 'con el modal abierto no se vuelve a armar el aviso');
  ctx.__abierto = false;
  e._selectPuzzle(0);
  assert.equal(avisos, 1, 'con el modal cerrado sí se abre una vez');
  // La tienda: abrirla con el modal ya abierto no la rearma.
  e._compacto = true;
  const ventanas = [];
  ctx.openItemModal = () => ventanas.push(1);
  ctx.STATE = { oro: 10, jefeActual: 0, inventario: [], clase: 'guerrero' };
  ctx.ITEMS = []; ctx.CFG = { MAX_INVENTORY_SLOTS: 6 }; ctx.coinSpan = () => ''; ctx.precioItem = () => 0;
  ctx.__abierto = true;
  e._abrirTienda();
  assert.equal(ventanas.length, 0, 'tienda ya abierta: no se rearma');
});
