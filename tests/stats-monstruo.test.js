// La ficha del monstruo en el mapa tiene que mostrar los números con los que
// va a pelear. Mostraba los base (HP 60, ATK 4, DEF 4) aunque en Héroe el
// monstruo luchara con ×1,25 y en Legendario con ×1,5: el alumno elegía la
// dificultad y la ficha le mentía sobre cuánto aguantaba el enemigo.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const RAIZ = join(__dirname, '..');
const leer = (f) => readFileSync(join(RAIZ, f), 'utf8');

const ctx = vm.createContext({ console, Math, Object });
vm.runInContext(
  leer('js/data/monsters.js').replace(/^const /gm, 'var ') + '\n' +
  leer('js/core/config.js').replace(/^const /gm, 'var '),
  ctx, { filename: 'config+monsters' });
const { MONSTERS, DIFICULTADES } = ctx;
const stats = (m, d) => vm.runInContext(`statsDeMonstruo(${JSON.stringify(m)}, ${JSON.stringify(d)})`, ctx);

test('statsDeMonstruo aplica los multiplicadores de la dificultad', () => {
  for (const dif of Object.keys(DIFICULTADES)) {
    const d = DIFICULTADES[dif];
    for (const m of MONSTERS) {
      const s = stats(m, dif);
      assert.equal(s.hp, Math.round(m.hpMax * d.monsterHpMult), `${m.nombre}/${dif} HP`);
      assert.equal(s.ataque, Math.round(m.ataque * d.monsterAtkMult), `${m.nombre}/${dif} ATK`);
      assert.equal(s.defensa, Math.round(m.defensa * d.monsterAtkMult), `${m.nombre}/${dif} DEF`);
    }
  }
});

test('una dificultad desconocida cae en Normal (sin multiplicar)', () => {
  const m = MONSTERS[0];
  const s = stats(m, 'dios');
  assert.equal(s.hp, m.hpMax);
  assert.equal(s.ataque, m.ataque);
});

test('Héroe y Legendario muestran un monstruo más fuerte que Normal', () => {
  const m = MONSTERS[0];
  assert.ok(stats(m, 'heroe').hp > stats(m, 'normal').hp);
  assert.ok(stats(m, 'legendario').hp > stats(m, 'heroe').hp);
  assert.ok(stats(m, 'facil').hp < stats(m, 'normal').hp);
});

test('la ficha del mapa y la batalla usan la misma función', () => {
  const mapa = leer('js/scenes/MapScene.js');
  const batalla = leer('js/scenes/BattleScene.js');
  assert.match(mapa, /statsDeMonstruo\(m, STATE\.dificultad\)/, 'MapScene no usa statsDeMonstruo');
  assert.match(batalla, /statsDeMonstruo\(m, STATE\.dificultad\)/, 'BattleScene no usa statsDeMonstruo');
  // La ficha no puede volver a leer los números base directamente.
  const ficha = mapa.slice(mapa.indexOf('this._dStats.setText('), mapa.indexOf('this._dStats.setText(') + 260);
  assert.doesNotMatch(ficha, /m\.hpMax|m\.ataque|m\.defensa/, 'la ficha vuelve a mostrar los números base');
});
