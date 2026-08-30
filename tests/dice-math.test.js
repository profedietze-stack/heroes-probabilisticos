// tests/dice-math.test.js — matemática del 2d12 (state.js combosExact/casosFavorables)
const assert = require('assert');

// Espeja js/core/state.js (funciones globales de browser, sin export)
function combosExact(k){ if(k<2||k>24) return 0; return Math.min(k-1, 25-k, 12); }
function casosFavorables(umbral){ let c=0; for(let k=umbral;k<=24;k++) c+=combosExact(k); return c; }

// Total de combinaciones = 12×12 = 144
let total = 0; for(let k=2;k<=24;k++) total += combosExact(k);
assert.strictEqual(total, 144, 'suman 144');

// Simetría de la distribución triangular
for(let k=2;k<=13;k++) assert.strictEqual(combosExact(k), combosExact(26-k), `simetria ${k}/${26-k}`);

// Pico en 13
assert.strictEqual(combosExact(13), 12);
assert.strictEqual(combosExact(2), 1);
assert.strictEqual(combosExact(24), 1);
assert.strictEqual(combosExact(25), 0);
assert.strictEqual(combosExact(1), 0);

// Casos favorables
assert.strictEqual(casosFavorables(2), 144, 'umbral 2 = todo');
assert.strictEqual(casosFavorables(13), 78, 'umbral 13 = 78/144');
assert.strictEqual(casosFavorables(24), 1, 'umbral 24 = 1/144');
assert.ok(casosFavorables(9) > casosFavorables(15), 'monotonia decreciente');

// Media teórica del 2d12 = 13
let esperanza = 0; for(let k=2;k<=24;k++) esperanza += k * combosExact(k) / 144;
assert.ok(Math.abs(esperanza - 13) < 1e-9, 'E[2d12] = 13');

console.log('OK');
