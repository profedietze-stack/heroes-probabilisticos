// tests/skills-persist.test.js
// Verifica el roundtrip de xp/skills emulando save/load sobre un objeto plano.
const assert = require('assert');

function saveShape(STATE){
  return { xp: STATE.xp || 0, skills: STATE.skills || {} };
}
function loadInto(STATE, d){
  STATE.xp = d.xp || 0;
  STATE.skills = d.skills || {};
}
const orig = { xp: 240, skills: { vigor:2, reflejo:1 } };
const json = JSON.parse(JSON.stringify(saveShape(orig)));
const restored = {};
loadInto(restored, json);
assert.strictEqual(restored.xp, 240);
assert.deepStrictEqual(restored.skills, { vigor:2, reflejo:1 });
const fresh = {}; loadInto(fresh, {});
assert.strictEqual(fresh.xp, 0);
assert.deepStrictEqual(fresh.skills, {});
console.log('OK');
