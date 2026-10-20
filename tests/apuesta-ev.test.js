// Las apuestas del Mercader: que el valor esperado escrito sea el real.
//
// Cada apuesta lleva un comentario con su E(X) —`// EV=+2.5 favorable`— que es
// lo que alguien lee para calibrar la dificultad. El juego no usa ese
// comentario: calcula el EV y de ahí deriva si la apuesta es favorable,
// desfavorable o neutra. Así que un comentario equivocado no le miente al
// alumno, pero sí a quien toque la tabla después.
//
// Había uno mal: `{pN:7, pD:16, pago:6, gan:16}` decía `EV=+2.5` y vale +3.63.
//
// Este test hace que los comentarios sean de fiar: si alguien cambia un número
// de la apuesta y no el comentario, salta.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const RAIZ = join(__dirname, '..');
const FUENTE = readFileSync(join(RAIZ, 'js', 'scenes', 'PuzzleApuesta.js'), 'utf8');

const contexto = vm.createContext({
  Phaser: { Scene: class { constructor() {} } },
  console, Math, Object, Array, Set, Number, String, JSON,
});
vm.runInContext(readFileSync(join(RAIZ, 'js', 'scenes', 'PuzzleBase.js'), 'utf8'), contexto);
vm.runInContext(FUENTE, contexto, { filename: 'PuzzleApuesta.js' });

const DIFICULTADES = ['facil', 'normal', 'heroe', 'legendario'];

const generar = (dif) => vm.runInContext(
  `(function(){ const e = Object.create(PuzzleApuesta.prototype); return e._gen(${JSON.stringify(dif)}); })()`,
  contexto,
);

/** Las apuestas tal como están escritas, con el EV que declara su comentario. */
function apuestasDeclaradas() {
  const re = /\{pN:(\d+),\s*pD:(\d+),\s*pago:(\d+),\s*gan:(\d+),\s*desc:'([^']*)'\}[^/]*\/\/\s*EV=\s*([+-]?[\d.]+)\s*(\w+)/g;
  return [...FUENTE.matchAll(re)].map((m) => ({
    pN: +m[1], pD: +m[2], pago: +m[3], gan: +m[4],
    desc: m[5], evDicho: +m[6], tipoDicho: m[7],
  }));
}

const APUESTAS = apuestasDeclaradas();

test('se encontraron las apuestas con su comentario', () => {
  assert.ok(APUESTAS.length >= 12, `sólo se leyeron ${APUESTAS.length} apuestas`);
});

test('el E(X) del comentario es el que sale de la fórmula', () => {
  for (const a of APUESTAS) {
    const prob = a.pN / a.pD;
    const real = +(prob * a.gan - (1 - prob) * a.pago).toFixed(2);
    assert.ok(
      Math.abs(real - a.evDicho) < 0.02,
      `${a.pN}/${a.pD} pago ${a.pago} gan ${a.gan} ("${a.desc}"): ` +
      `el comentario dice EV=${a.evDicho} y la fórmula da ${real}`,
    );
  }
});

test('y el tipo del comentario coincide con el signo del E(X)', () => {
  for (const a of APUESTAS) {
    const prob = a.pN / a.pD;
    const real = +(prob * a.gan - (1 - prob) * a.pago).toFixed(2);
    const esperado = real > 0.02 ? 'favorable' : real < -0.02 ? 'desfavorable' : 'neutro';
    assert.equal(a.tipoDicho, esperado, `${a.desc}: EV=${real} pero el comentario dice "${a.tipoDicho}"`);
  }
});

test('la opción marcada correcta es la que corresponde al E(X)', () => {
  // Esto sí lo ve el alumno: si el tipo no coincide con el EV que el juego
  // muestra en la explicación, el enigma se contradice a sí mismo.
  for (const dif of DIFICULTADES) {
    for (let i = 0; i < 300; i++) {
      const p = generar(dif);
      const esperado = p.ev > 0.02 ? 'Favorable' : p.ev < -0.02 ? 'Desfavorable' : 'Neutro';
      const marcada = p.opts.find((o) => o.ok).label;
      assert.equal(marcada, esperado, `${dif}: EV=${p.ev} y la correcta es "${marcada}"`);
    }
  }
});

test('la explicación muestra el mismo E(X) que decide la respuesta', () => {
  for (const dif of DIFICULTADES) {
    for (let i = 0; i < 200; i++) {
      const p = generar(dif);
      assert.ok(
        p.explain.includes(`= ${p.evStr} monedas`),
        `${dif}: la explicación no muestra ${p.evStr}: ${p.explain}`,
      );
    }
  }
});

test('la condición que se le muestra al alumno describe la probabilidad real', () => {
  // El contrato dice «Condición: <desc>» y abajo el alumno calcula con pN/pD.
  // Si la descripción sugiere otro experimento, la cuenta no cierra: «sacar
  // cara en 1 de 3 opciones» hablaba de una moneda para una probabilidad de 1/3.
  for (const a of APUESTAS) {
    if (/\bcara\b/i.test(a.desc)) {
      assert.equal(
        a.pD, 2,
        `"${a.desc}" habla de una moneda pero la probabilidad es ${a.pN}/${a.pD}`,
      );
    }
    if (/\bdado de (\d+)\b/i.test(a.desc)) {
      const caras = +a.desc.match(/\bdado de (\d+)\b/i)[1];
      assert.equal(a.pD, caras, `"${a.desc}": el dado tiene ${caras} caras y el denominador es ${a.pD}`);
    }
  }
});

test('la respuesta correcta se reparte entre favorable, desfavorable y neutro', () => {
  // Sortear la apuesta (y no el tipo) dejaba "Favorable" como respuesta el 50 %
  // de las veces, y en héroe no había ninguna neutra: con contestar siempre lo
  // mismo se acertaba medio banco, sin calcular el valor esperado.
  for (const dif of DIFICULTADES) {
    const cuenta = { favorable: 0, desfavorable: 0, neutro: 0 };
    const N = 1500;
    for (let i = 0; i < N; i++) cuenta[generar(dif).tipo]++;
    for (const [tipo, n] of Object.entries(cuenta)) {
      const pct = (n / N) * 100;
      assert.ok(pct >= 22 && pct <= 45,
        `${dif}: "${tipo}" es la respuesta el ${pct.toFixed(0)} % de las veces (${JSON.stringify(cuenta)})`);
    }
  }
});
