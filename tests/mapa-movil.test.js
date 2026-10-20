// Mapa en teléfono apaisado: HUD compacto, zoom con puertas tocables y dossier como modal con scroll.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const leer = (f) => readFileSync(join(__dirname, '..', f), 'utf8');
const traga = new Proxy(function () {}, { get: () => traga, apply: () => traga, set: () => true });

function cargar() {
  const ctx = vm.createContext({ Phaser: { Scene: class { constructor() {} } }, console, Math, Object, Array, JSON, document: traga, window: traga });
  vm.runInContext(leer('js/scenes/MapScene.js'), ctx, { filename: 'MapScene.js' });
  const e = vm.runInContext('Object.create(MapScene.prototype)', ctx);
  return { e, ctx };
}

test('el mapa está migrado al lienzo del teléfono', () => {
  const { ctx } = cargar();
  assert.equal(vm.runInContext('MapScene.DISENO_MOVIL', ctx), true);
});

for (const [w, h] of [[812, 375], [667, 375], [932, 430]]) {
  test(`teléfono ${w}×${h}: la puerta del nodo actual se toca bien y el HUD no ocupa demasiado`, () => {
    const { e, ctx } = cargar();
    const L = e._layout(w, h);
    const DW = vm.runInContext('_DW', ctx), DH = vm.runInContext('_DH', ctx);
    assert.equal(L.compacto, true);
    // La zona táctil de la puerta (hit = tamaño + 14) a la escala con la que se hace zoom al nodo.
    assert.ok((DW + 14) * L.zoomNode >= 44 && (DH + 14) * L.zoomNode >= 44, 'puerta actual ≥ 44 px');
    assert.ok(L.hudH <= 60, 'el HUD deja casi toda la pantalla al mapa');
    assert.ok(L.zoomMin <= 0.55, 'se puede alejar hasta ver casi todo el mundo');
    assert.ok(L.dragMin > L.zoomMin && L.dragMin < L.zoomNode, 'se puede arrastrar el mapa alejado');
    // El mundo (1024×700) cabe dentro de los límites de la cámara.
    const [bx, by, bw, bh] = L.bounds;
    assert.ok(bx <= 0 && by <= 0 && bx + bw >= 1024 && by + bh >= 700, 'límites de cámara cubren el mundo');
  });
}

test('escritorio y tablet conservan el HUD y el zoom de siempre', () => {
  const { e } = cargar();
  const L = e._layout(1024, 700);
  assert.equal(L.compacto, false);
  assert.equal(L.hudH, 100); assert.equal(L.zoomMin, 1.0); assert.equal(L.zoomNode, 1.8);
  assert.equal(L.dragMin, 1.05); assert.equal(L.panDy, 40);
  assert.deepEqual([...L.bounds], [-20, 40, 1064, 680]);
});

test('el HUD del teléfono usa botones de 44 px y letra de 14 px; el dossier es un modal DOM', () => {
  const src = leer('js/scenes/MapScene.js');
  assert.match(src, /setFixedSize\(0, 44\)/, 'botones superiores de 44 px');
  assert.match(src, /const hx = L\.compacto \? 80 : 16, hy = L\.compacto \? 7 : 16, fz = L\.compacto \? '14px'/);
  assert.match(src, /_showDossierMovil\(mIdx\)/);
  assert.match(src, /if\(this\.L\.compacto\)\{ this\._showDossierMovil\(mIdx\); return; \}/);
  assert.match(src, /min-height:44px;width:160px/, 'botón ¡Enfrentar! táctil');
  assert.match(leer('js/render/monster-svg.js'), /function monsterSvgHTML\(/);
  assert.match(leer('js/core/utils.js'), /function openItemModal\(html, titulo\)/);
});
