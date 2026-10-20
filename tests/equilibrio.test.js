// Guarda del equilibrio entre clases y de la curva de campaña, con la simulación de
// tools/simular.js y semilla fija (reproducible). Si este test falla después de tocar
// una clase, un poder, un ítem o los jefes: no es un bug, es que el balance cambió.
// Corré `node tools/simular.js` para ver la tabla y re-equilibrar.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const C = require(path.join(RAIZ, 'js/core/clases.js'));
const sim = require(path.join(RAIZ, 'tools/simular.js'));

const N = 300;
function tabla(dif) {
  const t = {};
  for (const build of Object.keys(sim.BUILDS)) {
    t[build] = {};
    for (const k of C.CLASES_ORDEN) { sim.semilla(20261020); t[build][k] = sim.medir(k, dif, build, N); }
  }
  return t;
}
const normal = tabla('normal');
const detalle = (b) => C.CLASES_ORDEN.map((k) => `${k} ${(normal[b][k].fin * 100).toFixed(0)}%/${normal[b][k].muertes.toFixed(1)}`).join('  ');

test('Normal: cualquier clase puede terminar la campaña con cualquiera de las dos builds', () => {
  for (const b of Object.keys(sim.BUILDS)) {
    for (const k of C.CLASES_ORDEN) {
      assert.ok(normal[b][k].fin >= 0.6, `${k}/${b}: solo termina el ${(normal[b][k].fin * 100).toFixed(0)} % (${detalle(b)})`);
    }
  }
});

test('Normal: ninguna clase es claramente mejor ni peor que las demás', () => {
  // Muertes medias por corrida: la mejor y la peor no pueden diferir más de ×3 en la build
  // de control (donde las muertes son pocas) ni más de ×1,8 en la de daño.
  const limite = { control: 3, dano: 1.8 };
  for (const b of Object.keys(sim.BUILDS)) {
    const m = C.CLASES_ORDEN.map((k) => normal[b][k].muertes);
    const razon = Math.max(...m) / Math.max(0.3, Math.min(...m));
    assert.ok(razon <= limite[b], `${b}: la peor clase muere ×${razon.toFixed(1)} más que la mejor (${detalle(b)})`);
  }
});

test('Escarcha ya no vuelve invulnerable al héroe (la build de control sigue muriendo)', () => {
  // Con Escarcha a 1 MP la build de control terminaba con 0 muertes en el 100 % de las
  // corridas, con cualquier clase.
  for (const k of C.CLASES_ORDEN) {
    assert.ok(normal.control[k].muertes >= 0.5, `${k}: solo ${normal.control[k].muertes.toFixed(2)} muertes en promedio`);
    assert.ok(normal.control[k].sinMorir <= 0.9, `${k}: el ${(normal.control[k].sinMorir * 100).toFixed(0)} % de las corridas no muere nunca`);
  }
});

test('la campaña es progresiva: se muere más en los últimos jefes que en los primeros', () => {
  for (const k of C.CLASES_ORDEN) {
    const p = normal.control[k].porJefe;
    const primeros = p.slice(0, 3).reduce((a, b) => a + b, 0);
    const ultimos = p.slice(7).reduce((a, b) => a + b, 0);
    assert.ok(primeros <= 0.5, `${k}: ${primeros.toFixed(2)} muertes en los 3 primeros jefes`);
    assert.ok(ultimos >= primeros, `${k}: no hay más dificultad al final`);
  }
});
