// Revisión visual 812×375 / 932×430 (2026-10-21): contraste del hub y de los avisos de batalla, aire abajo en los
// enigmas, ancho del botón de acción según su etiqueta, aire de los botones del final.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const leer = (f) => readFileSync(join(__dirname, '..', f), 'utf8');

function luz(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contraste = (a, b) => { const [x, y] = [luz(a), luz(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('hub del arcade (teléfono): colores de dificultad legibles sobre el fondo de piedra oscura', () => {
  const src = leer('js/scenes/ArcadeHubScene.js');
  const m = src.match(/const dColors = C \? \{([^}]*)\}/);
  assert.ok(m, 'falta la paleta del teléfono');
  const colores = [...m[1].matchAll(/#[0-9a-f]{6}/gi)].map((x) => x[0]);
  assert.equal(colores.length, 4);
  for (const c of colores) assert.ok(contraste(c, '#1a1a24') >= 6, `${c}: ${contraste(c, '#1a1a24').toFixed(1)}:1`);
});

test('hub del arcade: _aclarar mezcla con blanco y el texto de «Elegir Minijuego» (azul) pasa de 4,5:1', () => {
  const ctx = vm.createContext({ Phaser: { Scene: class {} } });
  vm.runInContext(leer('js/scenes/ArcadeHubScene.js'), ctx);
  const a = (n, f) => vm.runInContext(`_aclarar(${n}, ${f})`, ctx);
  assert.equal(a(0x000000, 1), '#ffffff');
  assert.equal(a(0x336699, 0), '#336699');
  const azul = parseInt(leer('js/scenes/ArcadeHubScene.js').match(/0x([0-9a-f]{6}), *\d*,? *\(\) => this\._fadeGo\('ArcadeScene', \{ *mode: *'select'/i)?.[1] || '4080d0', 16);
  assert.ok(contraste(a(azul, 0.4), '#1a2a44') >= 4.5, 'el texto del botón del Modo Libre sigue apagado');
  assert.match(leer('js/scenes/ArcadeHubScene.js'), /color: C \? _aclarar\(accentColor, 0\.4\) : accentHex/);
});

test('batalla: los avisos de concepto/tutorial no usan el violeta #9b59b6 (poco contraste sobre el panel oscuro)', () => {
  const src = leer('js/scenes/BattleScene.js');
  assert.doesNotMatch(src, /mostrarMensaje\(TUTORIALES\[[^)]*\)[^,]*, '#9b59b6'/);
  assert.doesNotMatch(src, /mostrarMensaje\(MSG_COMBATE\[[^)]*\)[^,]*, '#9b59b6'/);
  assert.ok(contraste('#cfa6e6', '#1a1026') >= 7);
});

test('enigmas: la interfaz (respuestas) deja al menos 12 px libres abajo', () => {
  const ctx = vm.createContext({ Phaser: { Scene: class {} }, console, Math, Object, Array, Set, Number, String, JSON });
  vm.runInContext(leer('js/scenes/PuzzleBase.js'), ctx);
  for (const [w, h] of [[667, 375], [812, 375], [932, 430]]) {
    for (const ancho of [false, true]) {
      const Z = vm.runInContext(`pzZonas({ scale: { width: ${w}, height: ${h} } }, ${ancho})`, ctx);
      assert.ok(h - (Z.ui.y + Z.ui.h) >= 12, `${w}×${h}: ${h - (Z.ui.y + Z.ui.h)} px abajo (interfaz)`);
      assert.equal(Z.ill.y + Z.ill.h, h - 8, 'la ilustración conserva su alto (recortaría botones de acción dibujados contra el borde)');
    }
  }
});

test('botón de acción del teléfono: el ancho crece con la etiqueta', () => {
  assert.match(leer('js/scenes/PuzzleBase.js'), /BW = Math\.max\(Math\.ceil\(190 \* K\), Math\.ceil\(\(String\(label\)\.length \* 14 \* 0\.68 \+ 36\) \* K\)\)/);
});

test('final (teléfono): los botones dejan al menos 9 px abajo', () => {
  const src = leer('js/scenes/FinalScene.js');
  const m = src.match(/bh?w = Math\.floor\(\(w - 16 - gap\*\(n-1\)\) \/ n\), by = h - (\d+);/) || src.match(/by = h - (\d+);/);
  assert.ok(m, 'no se encontró la fila de botones');
  assert.ok(+m[1] - 46 / 2 >= 9, `margen ${+m[1] - 23} px`);
});

test('aviso «Partida guardada» (#toast): no traga toques y en teléfono apaisado sube arriba (tapaba respuestas)', () => {
  const css = leer('css/ui.css').replace(/\r\n/g, '\n');
  const base = css.match(/#toast\{([^}]*)\}/)[1];
  assert.match(base, /pointer-events:\s*none/);
  const corto = css.match(/@media \(max-height:500px\)\{\s*#toast\{([^}]*)\}/);
  assert.ok(corto, 'falta la regla de teléfono apaisado');
  assert.match(corto[1], /bottom:auto/);
  assert.match(corto[1], /top:/);
});
