// tests/upgrades-titles.test.js — mejoras HP/MP del Grimorio + títulos del héroe
// Espeja las fórmulas de js/ui/grimorio.js (lógica inline en UI, sin export propio).
const assert = require('assert');

/* ── Costos de mejora HP: 25 × 1.25^n ── */
function hpUpgradeCost(n){ return Math.round(25 * Math.pow(1.25, n)); }
assert.strictEqual(hpUpgradeCost(0), 25);
assert.strictEqual(hpUpgradeCost(1), 31);
assert.strictEqual(hpUpgradeCost(2), 39);
assert.ok(hpUpgradeCost(10) > hpUpgradeCost(9), 'costo siempre creciente');

/* ── Costos MP: [40,70,110,160] para mpMax 4→8, tope en 8 ── */
const MP_COSTS = [40, 70, 110, 160];
function mpUpgradeCost(mpMax){ const i = mpMax - 4; return i < MP_COSTS.length ? MP_COSTS[i] : null; }
assert.strictEqual(mpUpgradeCost(4), 40);
assert.strictEqual(mpUpgradeCost(7), 160);
assert.strictEqual(mpUpgradeCost(8), null, 'tope en 8');

/* ── Títulos: 11 escalones, min 0..10, monótonos ── */
const TITULOS = [0,1,2,3,4,5,6,7,8,9,10];
function tituloIdx(derrotados){
  let idx = 0;
  TITULOS.forEach((min,i) => { if (derrotados >= min) idx = i; });
  return idx;
}
assert.strictEqual(tituloIdx(0), 0,  'novato al inicio');
assert.strictEqual(tituloIdx(5), 5,  'quinto titulo con 5 victorias');
assert.strictEqual(tituloIdx(10), 10, 'titulo maximo al ganar la campaña');
for (let n = 1; n <= 10; n++) assert.ok(tituloIdx(n) > tituloIdx(n-1), `titulo sube en victoria ${n}`);

console.log('OK');
