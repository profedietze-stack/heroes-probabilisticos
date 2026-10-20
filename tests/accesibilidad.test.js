// D8: lo mínimo de accesibilidad que se puede vigilar sin navegador.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const leer = (f) => readFileSync(join(__dirname, '..', f), 'utf8');
const css = leer('css/modals.css');

function luz(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contraste = (a, b) => { const [x, y] = [luz(a), luz(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const regla = (sel) => { const m = css.match(new RegExp(sel.replace(/[.]/g, '\\.') + '\\s*\\{([^}]*)\\}')); assert.ok(m, 'falta ' + sel); return m[1]; };

test('texto de pestañas y botón de cierre: contraste de al menos 4,5:1 sobre el fondo del modal', () => {
  for (const sel of ['.tab', '.modal-close']) {
    const c = regla(sel).match(/(?:^|[;\s])color:\s*(#[0-9a-fA-F]{6})/);
    assert.ok(c, sel + ' sin color');
    assert.ok(contraste(c[1], '#0D0D14') >= 4.5, `${sel} ${c[1]}: ${contraste(c[1], '#0D0D14').toFixed(2)}:1`);
  }
});

test('con dedo (pointer: coarse) los botones del modal miden 44 px', () => {
  assert.match(css, /@media \(pointer: coarse\)\s*\{[^@]*\.modal-close\s*\{[^}]*44px[^}]*44px/);
  assert.match(css, /@media \(pointer: coarse\)\s*\{[^@]*\.tab\s*\{[^}]*min-height:\s*44px/);
});

test('prefers-reduced-motion apaga animaciones CSS y las sacudidas/destellos de cámara', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  const main = leer('main.js');
  assert.match(main, /prefers-reduced-motion: reduce/);
  assert.match(main, /Cam\.shake\s*=/);
  assert.match(main, /Cam\.flash\s*=/);
});

// D5: Phaser 3.60 ignora scale.max, así que el tope de 1024x700 tiene que estar en el CSS del contenedor.
test('el contenedor del canvas no pasa de 1024x700 (sin upscale borroso en Full HD)', () => {
  const v = leer('css/variables.css');
  const m = v.match(/#phaserGame\s*\{([^}]*)\}/);
  assert.ok(m, 'falta la regla #phaserGame');
  assert.match(m[1], /max-width:\s*1024px/);
  assert.match(m[1], /max-height:\s*700px/);
});

// Móvil, etapa 1: en vertical se pide girar el teléfono, con salida para quien no pueda.
test('el aviso de girar el teléfono tiene botón para seguir y recuerda la elección', () => {
  const html = leer('index.html');
  assert.match(html, /id="orientWarn"/);
  assert.match(html, /Jugar así igual/);
  assert.match(html, /html:not\(\.sin-aviso-girar\) #orientWarn\{display:flex/, 'sin la clase de descarte el aviso no se puede cerrar');
  assert.match(html, /\.ow-seguir\{[^}]*min-height:44px/);
  assert.match(html, /sessionStorage\.getItem\('hpSinAvisoGirar'\)/);
});
