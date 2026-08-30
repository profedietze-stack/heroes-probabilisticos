// tests/skills-economy.test.js
const assert = require('assert');
const S = require('../js/core/skills.js');

assert.ok(S.xpForBattle(9,'normal') > S.xpForBattle(0,'normal'), 'jefe alto rinde mas');
assert.ok(S.xpForBattle(3,'facil')  > S.xpForBattle(3,'normal'), 'facil > normal');
assert.ok(S.xpForBattle(3,'normal') > S.xpForBattle(3,'heroe'),  'normal > heroe');
assert.ok(S.xpForBattle(3,'heroe')  > S.xpForBattle(3,'legendario'), 'heroe > legendario');
assert.strictEqual(S.xpMult('facil'), 1.3);
assert.strictEqual(S.xpMult('legendario'), 0.7);
// 12 skills estandar (160) + erudicion (35+60+90=185) = 2105
assert.strictEqual(S.totalTreeCost(), 12 * (30+50+80) + 185, 'costo total 12*160+185=2105');
let runNormal = 0; for (let i=0;i<10;i++) runNormal += S.xpForBattle(i,'normal');
const frac = runNormal / S.totalTreeCost();
assert.ok(frac > 0.30 && frac < 0.60, 'batallas normal ~⅓-½ del arbol (resto sale de puzzles), fue ' + frac.toFixed(2));
console.log('OK');
