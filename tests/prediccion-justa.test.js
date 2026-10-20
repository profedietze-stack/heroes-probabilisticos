// D6: la Predicción no puede tener una opción que domine a otra.
// El pago esperado (probabilidad × pago) tiene que ser parecido en todos los rangos.
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/core/skills.js');

const opciones = (bins) => (bins === 2 ? ['bajo', 'alto'] : ['bajo', 'medio', 'alto']);

function probDe(apuesta, rank) {
  let casos = 0;
  for (let s = 2; s <= 24; s++) if (S.prediccionBonus(apuesta, s, rank) > 0) casos += S.combos2d12(s);
  return casos / 144;
}

test('en cada rank, ninguna apuesta rinde más del 15 % que otra (pago esperado)', () => {
  for (let rank = 1; rank <= 3; rank++) {
    const bins = S.getPower('prediccion').ranks[rank - 1].bins;
    const ev = opciones(bins).map((op) => probDe(op, rank) * S.prediccionBonus(op, op === 'bajo' ? 2 : op === 'alto' ? 24 : 13, rank));
    const max = Math.max(...ev), min = Math.min(...ev);
    assert.ok(min > 0, `rank ${rank}: una apuesta no paga nunca`);
    assert.ok(max / min <= 1.15, `rank ${rank}: EV ${ev.map((x) => x.toFixed(2)).join(' / ')} — una opción domina`);
  }
});

test('la apuesta menos probable paga más que la más probable (rank 2 y 3)', () => {
  for (const rank of [2, 3]) {
    assert.ok(S.prediccionBonus('bajo', 2, rank) > S.prediccionBonus('medio', 13, rank), `rank ${rank}: "bajo" (25 %) paga igual o menos que "medio" (50 %)`);
    assert.equal(S.prediccionBonus('bajo', 2, rank), S.prediccionBonus('alto', 24, rank), `rank ${rank}: los extremos son simétricos`);
  }
});
