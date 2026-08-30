// tests/skills-effects.test.js
const assert = require('assert');
const S = require('../js/core/skills.js');

assert.strictEqual(S.combos2d12(2), 1);
assert.strictEqual(S.combos2d12(24), 1);
assert.strictEqual(S.combos2d12(13), 12);
assert.strictEqual(S.combos2d12(1), 0);

assert.ok(S.cargaDamage(24, 1) > S.cargaDamage(13, 1), 'cola pega mas');
assert.ok(S.cargaDamage(24, 3) > S.cargaDamage(24, 1), 'rank3 > rank1');

assert.strictEqual(S.espejoReflect(13, 1), 0, 'media no refleja');
assert.ok(S.espejoReflect(24, 1) > 0, 'extremo refleja');
assert.ok(S.espejoReflect(24, 3) > S.espejoReflect(24, 1), 'rank3 refleja mas');

assert.strictEqual(S.truncarValor(1), 13);
assert.strictEqual(S.truncarValor(3), 9);

// vigor deprecado: siempre 0 (HP se compra en el Grimorio)
assert.strictEqual(S.vigorBonus(0), 0);
assert.strictEqual(S.vigorBonus(1), 0);
assert.strictEqual(S.vigorBonus(3), 0);

// erudicion: multiplicador de XP por rank
assert.strictEqual(S.erudicionMult({}), 1.0, 'sin erudicion ×1');
assert.strictEqual(S.erudicionMult({erudicion:1}), 1.2, 'R1 ×1.2');
assert.strictEqual(S.erudicionMult({erudicion:2}), 1.35, 'R2 ×1.35');
assert.strictEqual(S.erudicionMult({erudicion:3}), 1.5, 'R3 ×1.5');

assert.ok(S.prediccionBonus('alto', 20, 1) > 0, 'acierto alto');
assert.strictEqual(S.prediccionBonus('bajo', 20, 1), 0, 'fallo');
console.log('OK');
