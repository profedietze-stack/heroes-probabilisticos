// Teléfono: TODAS las escenas del juego están migradas al lienzo de la pantalla real y cada una
// tiene una rama compacta (alto < 500). Si se agrega una escena nueva y se olvida, este test avisa.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');

const RAIZ = join(__dirname, '..');
const leer = (f) => readFileSync(join(RAIZ, f), 'utf8');

function escenasRegistradas() {
  const m = leer('main.js').match(/scene:\s*\[(MenuScene[\s\S]*?)\]/);
  assert.ok(m, 'no se encontró la lista de escenas en main.js');
  return m[1].split(',').map((s) => s.trim()).filter(Boolean);
}

test('main.js registra las 17 escenas del juego', () => {
  assert.equal(escenasRegistradas().length, 17);
});

test('toda escena registrada está migrada (DISENO_MOVIL) y tiene su rama compacta', () => {
  const sinMigrar = [], sinRama = [];
  for (const nombre of escenasRegistradas()) {
    const archivo = readdirSync(join(RAIZ, 'js/scenes')).find((f) => new RegExp(`class ${nombre} extends`).test(leer('js/scenes/' + f)));
    assert.ok(archivo, `no se encontró el archivo de ${nombre}`);
    const src = leer('js/scenes/' + archivo);
    if (!new RegExp(`${nombre}\.DISENO_MOVIL = true`).test(src)) sinMigrar.push(nombre);
    // Rama compacta: el menú y la batalla/mapa usan _layout; los enigmas pzCompactoInit; el resto, `h < 500` o `_compacto`.
    if (!/h < 500|h >= 500|_compacto|pzCompactoInit|pzCompacto\(/.test(src)) sinRama.push(nombre);
  }
  assert.deepEqual(sinMigrar, [], 'escenas sin migrar: ' + sinMigrar.join(', '));
  assert.deepEqual(sinRama, [], 'escenas sin rama compacta: ' + sinRama.join(', '));
});

test('el botón "Volver" de las escenas de modo libre/arcade mide 44 px o más en el teléfono', () => {
  for (const f of ['ArcadeHubScene', 'ArcadeScene', 'LibreScene']) {
    const src = leer(`js/scenes/${f}.js`);
    assert.match(src, /padding: C \? \{x:\d+, y:1[4-5]\}/, `${f}: el texto de "Volver" tiene que tener relleno táctil`);
  }
});

test('los botones del final, la victoria y el arcade son de 44 px o más en el teléfono', () => {
  assert.match(leer('js/scenes/FinalScene.js'), /bw, 46, '14px'/);
  assert.match(leer('js/scenes/VictoryScene.js'), /RW, 46, '18px'/);
  assert.match(leer('js/scenes/VictoryScene.js'), /bw2, 44, '15px'/);
  assert.match(leer('js/scenes/IntroScene.js'), /bh = C \? 46 : 54/);
  assert.match(leer('js/scenes/ArcadeScene.js'), /bh = C \? 64 : 70/);
  assert.match(leer('js/scenes/LibreScene.js'), /BTH = C \? 44 : 32/);
});
