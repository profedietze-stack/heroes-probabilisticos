// Revisión de la migración a teléfono (2026-10-20): reinicio por cambio de pantalla, modales que dejan pasar
// toques al enigma, ayuda abierta al salir de la escena.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const leer = (f) => readFileSync(join(__dirname, '..', f), 'utf8');

function cargarMovil() {
  const ctx = vm.createContext({
    window: { innerWidth: 812, innerHeight: 375, matchMedia: () => ({ matches: false }), addEventListener() {} },
    document: { documentElement: { classList: { add() {} } } },
    location: { search: '' }, screen: { width: 812, height: 375 }, Phaser: { Plugins: { ScenePlugin: class {} } }, Math, setTimeout, clearTimeout,
  });
  vm.runInContext(leer('js/core/movil.js').replace(/^if \(typeof module.*$/m, '') + '\n;this.__api = { cambioJustificaReinicio };', ctx);
  return ctx.__api;
}

test('esconder la barra, abrir el teclado o la pantalla completa NO reinicia la escena; girar sí', () => {
  const { cambioJustificaReinicio: c } = cargarMovil();
  const actual = { width: 812, height: 375 };
  assert.equal(c(actual, { w: 812, h: 375 }), false, 'sin cambio');
  assert.equal(c(actual, { w: 812, h: 412 }), false, 'se escondió la barra de direcciones');
  assert.equal(c(actual, { w: 812, h: 200 }), false, 'teclado abierto');
  assert.equal(c(actual, { w: 375, h: 812 }), true, 'giró a vertical');
  assert.equal(c({ width: 375, height: 812 }, { w: 812, h: 375 }), true, 'volvió a horizontal');
  assert.equal(c(actual, { w: 1280, h: 720 }), true, 'otra pantalla (ancho +58 %)');
});

test('al reiniciar por giro se cierra el modal abierto', () => {
  assert.match(leer('js/core/movil.js'), /closeItemModal\(\);[\s\S]{0,80}s\.scene\.restart\(\)/);
});

function cargarModal() {
  const timers = [];
  const m = { classList: { _on: false, add() { this._on = true; }, remove() { this._on = false; }, contains() { return this._on; } } };
  const game = { input: { enabled: true } };
  const ctx = vm.createContext({
    window: { game, addEventListener() {} },
    document: { addEventListener() {}, getElementById: (id) => (id === 'itemModal' ? m : { textContent: '', innerHTML: '' }), querySelector: () => null },
    setTimeout: (f) => { timers.push(['t', f]); return timers.length; },
    setInterval: (f) => { timers.push(['i', f]); return timers.length; },
    clearInterval() {}, clearTimeout() {}, Math, String, Phaser: { Math: { Between: () => 0 }, Plugins: { ScenePlugin: class {} } },
  });
  vm.runInContext(leer('js/core/utils.js'), ctx);
  return { ctx, m, game, timers };
}

test('con un modal abierto Phaser no recibe toques (no se contesta un enigma por tocar el modal)', () => {
  const { ctx, game, timers } = cargarModal();
  vm.runInContext("openItemModal('<p>hola</p>', 'x')", ctx);
  assert.equal(game.input.enabled, false);
  vm.runInContext('closeItemModal()', ctx);
  assert.equal(game.input.enabled, false, 'se reactiva recién en el próximo tick');
  timers.filter((t) => t[0] === 't').forEach((t) => t[1]());
  assert.equal(game.input.enabled, true);
});

test('si el modal se cierra por otro camino, el vigía devuelve el input', () => {
  const { ctx, m, game, timers } = cargarModal();
  vm.runInContext("openItemModal('<p>hola</p>')", ctx);
  assert.equal(game.input.enabled, false);
  m.classList.remove();
  timers.filter((t) => t[0] === 'i').forEach((t) => t[1]());
  assert.equal(game.input.enabled, true);
});

test('salir de un enigma con la ayuda abierta la cierra', () => {
  assert.match(leer('js/scenes/PuzzleBase.js'), /once\('shutdown', \(\) => closeItemModal\(\)\)/);
});
