// tests/skills-catalog.test.js
const assert = require('assert');
const S = require('../js/core/skills.js');

// 3 ramas: vitalidad 4, sabotaje 4, sabiduria 5 (erudicion reemplazo a vigor) = 13
assert.strictEqual(S.SKILL_TREE.length, 13, '13 poderes');
const ramas = [...new Set(S.SKILL_TREE.map(p => p.rama))];
assert.deepStrictEqual(ramas.sort(), ['sabiduria','sabotaje','vitalidad'], '3 ramas');
assert.strictEqual(S.SKILL_TREE.filter(p => p.rama === 'vitalidad').length, 4, 'vitalidad 4');
assert.strictEqual(S.SKILL_TREE.filter(p => p.rama === 'sabotaje').length,  4, 'sabotaje 4');
assert.strictEqual(S.SKILL_TREE.filter(p => p.rama === 'sabiduria').length, 5, 'sabiduria 5');
assert.ok(!S.SKILL_TREE.find(p => p.id === 'vigor'), 'vigor eliminado del arbol');
assert.ok(S.SKILL_TREE.find(p => p.id === 'erudicion'), 'erudicion existe');
// cada poder: id unico, 3 ranks de xpCost, tipo valido
const ids = new Set();
for (const p of S.SKILL_TREE) {
  assert.ok(p.id && !ids.has(p.id), 'id unico: ' + p.id); ids.add(p.id);
  assert.strictEqual(p.xpCost.length, 3, p.id + ' 3 xpCost');
  assert.strictEqual(p.mp.length, 3, p.id + ' 3 mp');
  assert.ok(['pasivo','activo','reactivo','postroll'].includes(p.tipo), p.id + ' tipo valido');
}
// pasivos cuestan 0 MP
for (const p of S.SKILL_TREE.filter(p => p.tipo === 'pasivo')) {
  assert.deepStrictEqual(p.mp, [0,0,0], p.id + ' pasivo MP 0');
}
console.log('OK');
