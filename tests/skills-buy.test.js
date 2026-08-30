// tests/skills-buy.test.js
const assert = require('assert');
const S = require('../js/core/skills.js');

const st = { xp: 100, skills: {} };
assert.strictEqual(S.nextRankCost(st.skills, 'regeneracion'), 30);
assert.ok(S.canBuy(st, 'regeneracion'), 'puede comprar con 100 xp');
assert.ok(S.buySkill(st, 'regeneracion'), 'compra ok');
assert.strictEqual(st.xp, 70, 'desconto 30');
assert.strictEqual(st.skills.regeneracion, 1, 'rank 1');
assert.strictEqual(S.nextRankCost(st.skills, 'regeneracion'), 50);
assert.ok(S.buySkill(st, 'regeneracion')); assert.strictEqual(st.skills.regeneracion, 2); assert.strictEqual(st.xp, 20);
assert.ok(!S.canBuy(st, 'regeneracion'), 'no alcanza para rank 3');
assert.ok(!S.buySkill(st, 'regeneracion'), 'compra falla'); assert.strictEqual(st.xp, 20, 'xp intacta');
const st2 = { xp: 9999, skills: { regeneracion: 3 } };
assert.strictEqual(S.nextRankCost(st2.skills, 'regeneracion'), null, 'maxeado');
assert.ok(!S.canBuy(st2, 'regeneracion'), 'no compra maxeado');
// vigor ya no es comprable
assert.strictEqual(S.nextRankCost({}, 'vigor'), null, 'vigor no existe');
// erudicion: costos propios [35,60,90]
assert.strictEqual(S.nextRankCost({}, 'erudicion'), 35, 'erudicion R1 = 35');
console.log('OK');
