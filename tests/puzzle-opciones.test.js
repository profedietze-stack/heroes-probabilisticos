// Las opciones de todos los enigmas que ofrecen fracciones.
//
// Un juego de probabilidad puede equivocarse de una manera que ningún test de
// interfaz ve: ofrecer dos opciones que valen lo mismo, o marcar como
// incorrecta una fracción que es exactamente la respuesta. El alumno elige
// bien, el juego le dice que no, y lo que aprende es al revés.
//
// Los enigmas son <script> clásicos sobre Phaser. Se cargan en un contexto de
// node con un Phaser de mentira: así se prueba el código que corre en el aula.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const leer = (rel) => readFileSync(join(__dirname, '..', rel), 'utf8');

const contexto = vm.createContext({
  Phaser: { Scene: class { constructor() {} } },
  console, Math, Object, Array, Set, Number, String, JSON,
});
vm.runInContext(leer('js/scenes/PuzzleBase.js'), contexto, { filename: 'PuzzleBase.js' });
for (const escena of ['PuzzleMoneda', 'PuzzleRuleta', 'PuzzleDados', 'PuzzleUrna',
                      'PuzzleApuesta', 'PuzzlePuertas', 'PuzzleTesoro']) {
  vm.runInContext(leer(`js/scenes/${escena}.js`), contexto, { filename: `${escena}.js` });
}

const DIFICULTADES = ['facil', 'normal', 'heroe', 'legendario'];
const ESCENAS = ['PuzzleMoneda', 'PuzzleRuleta', 'PuzzleDados', 'PuzzleUrna'];

function generar(escena, dificultad) {
  return vm.runInContext(
    `(function(){ const e = Object.create(${escena}.prototype); return e._gen(${JSON.stringify(dificultad)}); })()`,
    contexto,
  );
}

const aNumero = (fraccion) => {
  const [n, d] = String(fraccion).split('/').map(Number);
  return d ? n / d : n;
};

// Cuántas veces se genera cada combinación. Los enunciados se sortean, así que
// una sola pasada no ve los casos raros: los que fallaban salían una de cada
// cinco veces.
const VUELTAS = 400;

for (const escena of ESCENAS) {
  test(`${escena}: cuatro opciones, una sola correcta`, () => {
    for (const dif of DIFICULTADES) {
      for (let i = 0; i < VUELTAS; i++) {
        const p = generar(escena, dif);
        assert.equal(p.opts.length, 4, `${escena}/${dif}: ${p.opts.length} opciones`);
        assert.equal(p.opts.filter((o) => o.ok).length, 1, `${escena}/${dif}: correctas != 1`);
      }
    }
  });

  test(`${escena}: ninguna opción se repite`, () => {
    for (const dif of DIFICULTADES) {
      for (let i = 0; i < VUELTAS; i++) {
        const etiquetas = generar(escena, dif).opts.map((o) => o.label);
        assert.equal(
          new Set(etiquetas).size, 4,
          `${escena}/${dif}: repetidas -> ${etiquetas.join(', ')}`,
        );
      }
    }
  });

  test(`${escena}: ninguna opción incorrecta vale lo mismo que la correcta`, () => {
    for (const dif of DIFICULTADES) {
      for (let i = 0; i < VUELTAS; i++) {
        const p = generar(escena, dif);
        const correcta = aNumero(p.opts.find((o) => o.ok).label);
        for (const o of p.opts.filter((x) => !x.ok)) {
          assert.ok(
            Math.abs(aNumero(o.label) - correcta) > 1e-12,
            `${escena}/${dif}: "${o.label}" vale lo mismo que la correcta`,
          );
        }
      }
    }
  });

  test(`${escena}: todas las opciones son probabilidades posibles`, () => {
    for (const dif of DIFICULTADES) {
      for (let i = 0; i < 100; i++) {
        for (const o of generar(escena, dif).opts) {
          const v = aNumero(o.label);
          assert.ok(v >= 0 && v <= 1, `${escena}/${dif}: probabilidad imposible ${o.label}`);
        }
      }
    }
  });
}

test('Cara o Ceca: la respuesta es C(n,k) / 2^n', () => {
  for (const dif of DIFICULTADES) {
    for (let i = 0; i < 200; i++) {
      const p = generar('PuzzleMoneda', dif);
      const binom = vm.runInContext(`_binomial(${p.n}, ${p.k})`, contexto);
      const esperado = binom / Math.pow(2, p.n);
      assert.ok(
        Math.abs(aNumero(p.corr) - esperado) < 1e-12,
        `${dif}: n=${p.n} k=${p.k} dijo ${p.corr}, esperado ${esperado}`,
      );
    }
  }
});

test('Ruleta: la respuesta es partes del sector sobre partes totales', () => {
  for (const dif of DIFICULTADES) {
    for (let i = 0; i < 200; i++) {
      const p = generar('PuzzleRuleta', dif);
      const esperado = p.ask.parts / p.wheel.total;
      assert.ok(Math.abs(aNumero(p.corr) - esperado) < 1e-12, `${dif}: ${p.corr}`);
    }
  }
});

test('Ruleta: los sectores declarados suman el total de la rueda', () => {
  // Si no suman, la probabilidad que se enseña está mal aunque la cuenta del
  // juego sea consistente consigo misma.
  for (const dif of DIFICULTADES) {
    for (let i = 0; i < 50; i++) {
      const { wheel } = generar('PuzzleRuleta', dif);
      const suma = wheel.sects.reduce((s, x) => s + x.parts, 0);
      assert.equal(suma, wheel.total, `${dif}: los sectores suman ${suma} y el total dice ${wheel.total}`);
    }
  }
});

test('Dados: la respuesta es el peso de la cara cargada sobre el peso total', () => {
  for (const dif of DIFICULTADES) {
    for (let i = 0; i < 200; i++) {
      const p = generar('PuzzleDados', dif);
      const esperado = p.prim.extra / p.prim.total;
      assert.ok(Math.abs(aNumero(p.corr) - esperado) < 1e-12, `${dif}: ${p.corr}`);
    }
  }
});


// ── Los enigmas que no ofrecen fracciones ────────────────────────────────────

test('Apuesta: la categoria que se marca correcta coincide con el valor esperado', () => {
  // Es el enigma mas facil de romper editando datos: alcanza con cambiar un
  // pago para que la apuesta rotulada "favorable" pase a ser mala, y el juego
  // seguiria premiando la respuesta vieja.
  for (const dif of DIFICULTADES) {
    for (let i = 0; i < 300; i++) {
      const p = generar('PuzzleApuesta', dif);
      const prob = p.pN / p.pD;
      const ev = prob * p.gan - (1 - prob) * p.pago;
      const esperado = ev > 0.02 ? 'Favorable' : ev < -0.02 ? 'Desfavorable' : 'Neutro';
      const correcta = p.opts.find((o) => o.ok);
      assert.ok(correcta, `${dif}: ninguna opcion marcada correcta`);
      assert.equal(
        correcta.label, esperado,
        `${dif}: E(X)=${ev.toFixed(2)} deberia ser ${esperado} y dice ${correcta.label} (${p.desc})`,
      );
      assert.equal(p.opts.filter((o) => o.ok).length, 1);
      assert.equal(new Set(p.opts.map((o) => o.label)).size, 4);
    }
  }
});

test('Apuesta: la explicacion muestra la cuenta con los numeros de la apuesta', () => {
  for (const dif of DIFICULTADES) {
    const p = generar('PuzzleApuesta', dif);
    assert.match(p.explain, new RegExp(`${p.pN}/${p.pD}`));
    assert.match(p.explain, new RegExp(`${p.pD - p.pN}/${p.pD}`));
  }
});

test('Puertas: cambiar gana con probabilidad (N-1)/N', () => {
  // Monty Hall generalizado. Si esta cuenta se equivoca, el juego ensena lo
  // contrario de lo que quiere ensenar.
  for (const dif of DIFICULTADES) {
    const c = generar('PuzzlePuertas', dif);
    assert.ok(c.doors >= 3, `${dif}: ${c.doors} puertas`);
    assert.equal(c.winChance, (c.doors - 1) / c.doors);
    // El oraculo abre todas las vacias menos una: quedan la elegida y una mas.
    assert.equal(c.opens, c.doors - 2);
    assert.ok(c.opens <= c.doors - 2);
  }
});

test('Tesoro: nunca hay mas cofres con tesoro que cofres', () => {
  for (const dif of DIFICULTADES) {
    for (let i = 0; i < 100; i++) {
      const c = generar('PuzzleTesoro', dif);
      assert.equal(c.total, c.levels.reduce((a, b) => a * b, 1));
      assert.ok(c.tes <= c.total, `${dif}: ${c.tes} tesoros en ${c.total} cofres`);
      assert.equal(c.treasureLeaves.size, Math.min(c.tes, c.total));
    }
  }
});
