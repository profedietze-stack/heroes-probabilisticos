// Batalla en teléfono apaisado: el layout compacto cumple lo mínimo (botones ≥ 44 px, letras ≥ 14 px,
// todo dentro de la pantalla) y el de escritorio/tablet sigue siendo el de siempre.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const leer = (f) => readFileSync(join(__dirname, '..', f), 'utf8');
const traga = new Proxy(function () {}, { get: () => traga, apply: () => traga, set: () => true });

function layout(w, h) {
  const ctx = vm.createContext({ Phaser: { Scene: class { constructor() {} } }, console, Math, Object, Array, JSON, document: traga, window: traga });
  vm.runInContext(leer('js/scenes/BattleScene.js'), ctx, { filename: 'BattleScene.js' });
  const e = vm.runInContext('Object.create(BattleScene.prototype)', ctx);
  return { L: e._layout(w, h), migrada: vm.runInContext('BattleScene.DISENO_MOVIL', ctx) };
}
const px = (s) => parseInt(s, 10);

test('la batalla está migrada al lienzo del teléfono', () => {
  assert.equal(layout(812, 375).migrada, true);
});

for (const [w, h] of [[812, 375], [667, 375], [932, 430]]) {
  test(`teléfono ${w}×${h}: botones ≥ 44 px, letras ≥ 14 px, todo dentro de la pantalla`, () => {
    const { L } = layout(w, h);
    assert.equal(L.compacto, true);
    assert.ok(L.btnH >= 44, 'alto de los botones de Inventario y Grimorio');
    assert.ok(L.chips.h >= 44, 'alto de los chips de predicción');
    assert.ok(L.hit.h >= 44 && L.hit.w >= 44, 'zona táctil de los dados');
    for (const [nombre, fs] of Object.entries({ guardian: L.guardFs, barra: L.barFs, prob: L.probFs, hp: L.hpFs, mp: L.mpFs, stats: L.statsFs, chips: L.chips.fs, boton: L.btnFs, mensaje: L.msgFs, globo: L.balloonFs, resultado: L.resultFs, badge: L.badge.fs })) {
      assert.ok(px(fs) >= 14, `${nombre}: ${fs}`);
    }
    // El panel del jugador y sus botones caben en la pantalla.
    assert.ok(L.panel.y + L.panel.h <= h, 'panel dentro del alto');
    assert.ok(L.btnInvY + L.btnH / 2 <= h && L.btnPoderY + L.btnH / 2 <= h, 'botones dentro del alto');
    assert.ok(L.btnX + L.btnW / 2 <= w, 'botones dentro del ancho');
    assert.ok(L.btnPoderY - L.btnH / 2 >= L.btnInvY + L.btnH / 2 - 1, 'Inventario y Grimorio no se pisan');
    assert.ok(L.chips.y + L.chips.h / 2 <= h, 'chips dentro del alto');
    // Los chips de la predicción no se salen de su columna (entre el HUD y los botones).
    const centro = (L.dice1.x + L.dice2.x) / 2;
    assert.ok(centro - L.chips.dx - L.chips.w / 2 > L.seps[0] && centro + L.chips.dx + L.chips.w / 2 < L.seps[1], 'chips dentro de su columna');
    assert.ok(L.hp.y + L.hp.h < L.mp.y && L.mp.y + L.mp.h < L.statsY, 'HP, MP y stats apilados sin pisarse');
  });
}

test('escritorio y tablet (1024×700) conservan las medidas de siempre', () => {
  const { L } = layout(1024, 700);
  assert.equal(L.compacto, false);
  assert.equal(L.PY, 536);
  assert.deepEqual({ ...L.hp }, { x: 18, y: 564, w: 310, h: 15 });
  assert.deepEqual({ ...L.mp }, { x: 18, y: 586, w: 200, h: 8 });
  assert.equal(L.barW, 360); assert.equal(L.barY, 98);
  assert.equal(L.btnX, 844); assert.equal(L.btnW, 200);
  assert.equal(L.monK, 1); assert.equal(L.monBase, 165);
  assert.equal(L.msgY, 502); assert.equal(L.msgW, 600);
});

test('en escritorio los chips de predicción caben en el lienzo (antes caían en y=724 de 700)', () => {
  const { L } = layout(1024, 700);
  assert.ok(L.chips.y + 12 <= 700, `chips en y=${L.chips.y}`);
  assert.ok(L.predTitulo.y < L.chips.y);
});
