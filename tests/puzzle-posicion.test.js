// Dónde cae la respuesta correcta entre las cuatro opciones.
//
// Los enigmas barajan, así que en principio la correcta tendría que caer en
// cada posición un 25 % de las veces. Medido sobre 2000 generaciones por
// escena, La Urna daba:
//
//     posición 1 → 29 %     posición 3 → 27 %
//     posición 2 → 29 %     posición 4 → 15 %
//
// La causa: el relleno se agregaba DESPUÉS de barajar.
//
//     const opts4 = _shuffle([correcta, ...distractores]);   // 3 elementos
//     while (opts4.length < 4) opts4.push({ label: ..., ok:false });
//
// Cuando los distractores no llegaban a tres —y en las urnas fáciles pasa
// seguido, el propio código lo comenta— se barajaban tres opciones y la cuarta
// se pegaba al final. O sea: en esas partidas **la correcta nunca podía estar
// en el último botón**.
//
// No lo veía ningún test: los que había comprueban que haya cuatro opciones,
// que ninguna se repita y que ninguna incorrecta valga lo mismo que la
// correcta. Todo eso seguía siendo cierto. Lo que faltaba era mirar el orden.
//
// El chico que descarta la última opción sin leerla acierta más seguido, que es
// exactamente lo contrario de lo que el enigma quiere enseñar.
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

const ESCENAS = ['PuzzleMoneda', 'PuzzleRuleta', 'PuzzleDados', 'PuzzleUrna', 'PuzzleApuesta'];
for (const e of ESCENAS) {
  vm.runInContext(leer(`js/scenes/${e}.js`), contexto, { filename: `${e}.js` });
}

const DIFICULTADES = ['facil', 'normal', 'heroe', 'legendario'];
const VUELTAS = 600;

function generar(escena, dif) {
  return vm.runInContext(
    `(function(){ const e = Object.create(${escena}.prototype); return e._gen(${JSON.stringify(dif)}); })()`,
    contexto,
  );
}

for (const escena of ESCENAS) {
  test(`${escena}: la correcta no evita ninguna posición`, () => {
    const cuenta = [0, 0, 0, 0];
    let total = 0;
    for (const dif of DIFICULTADES) {
      for (let i = 0; i < VUELTAS; i++) {
        const p = generar(escena, dif);
        const idx = p.opts.findIndex((o) => o.ok);
        assert.ok(idx >= 0 && idx < 4, `${escena}/${dif}: la correcta no está entre las opciones`);
        cuenta[idx]++;
        total++;
      }
    }
    const pct = cuenta.map((n) => (n / total) * 100);
    const detalle = pct.map((v, i) => `pos ${i + 1}: ${v.toFixed(0)} %`).join('  ');
    // Con cuatro opciones lo esperable es 25 % en cada una. El margen es ancho
    // —de 18 a 32— porque son 2400 sorteos, no infinitos; lo que no puede pasar
    // es que una posición quede sistemáticamente por debajo.
    pct.forEach((v, i) => {
      assert.ok(v >= 18, `${escena}: la posición ${i + 1} sale poco (${detalle})`);
      assert.ok(v <= 32, `${escena}: la posición ${i + 1} sale de más (${detalle})`);
    });
  });
}

test('las opciones de fracciones se arman con _opcionesFrac, que baraja al final', () => {
  // Comprobación estructural: si vuelve un `push` sobre el array ya barajado,
  // esa posición nunca puede tener la correcta aunque la medición de arriba
  // tarde en delatarlo. _opcionesFrac agrega todo ANTES de barajar.
  for (const archivo of ['PuzzleMoneda', 'PuzzleRuleta', 'PuzzleUrna', 'PuzzleDados']) {
    const codigo = leer(`js/scenes/${archivo}.js`);
    const gen = codigo.slice(codigo.indexOf('_gen('), codigo.indexOf('create()'));
    assert.ok(/_opcionesFrac\(/.test(gen), `${archivo}: ya no arma las opciones con _opcionesFrac`);
    assert.ok(!/\.push\(\s*\{\s*label/.test(gen), `${archivo}: agrega una opción a mano después de armarlas`);
  }
  const base = leer('js/scenes/PuzzleBase.js');
  const fn = base.slice(base.indexOf('function _opcionesFrac'), base.indexOf('function _fraccionesDe'));
  const barajado = fn.lastIndexOf('_shuffle([');
  assert.ok(barajado > -1, '_opcionesFrac no baraja el resultado');
  assert.ok(!/\.push\(/.test(fn.slice(barajado)), '_opcionesFrac agrega algo después de barajar');
});

// Rango de la correcta entre las opciones ORDENADAS por valor (la 1ª, 2ª, 3ª o
// 4ª más chica). La posición en pantalla puede salir 25/25/25/25 y aun así la
// correcta ser siempre "la segunda más chica": el alumno lo aprende sin hacer
// la cuenta. Se mide acá, no sólo el índice del botón.
const valor = (l) => { const [n, d] = String(l).split('/').map(Number); return d ? n / d : n; };

for (const escena of ['PuzzleMoneda', 'PuzzleRuleta', 'PuzzleDados', 'PuzzleUrna']) {
  for (const dif of DIFICULTADES) {
    test(`${escena}/${dif}: la correcta cae en cualquier rango de valor`, () => {
      const rango = [0, 0, 0, 0];
      const N = 1500;
      for (let i = 0; i < N; i++) {
        const p = generar(escena, dif);
        const valores = p.opts.map((o) => valor(o.label)).sort((a, b) => a - b);
        rango[valores.indexOf(valor(p.opts.find((o) => o.ok).label))]++;
      }
      const pct = rango.map((n) => (n / N) * 100);
      const detalle = pct.map((v, i) => `${i + 1}ª más chica: ${v.toFixed(0)} %`).join('  ');
      // Hay combinaciones en las que la correcta es tan chica (o tan grande) que
      // no hay lugar de un lado: ahí el tope es real y no un patrón aprendible.
      // Lo que no puede pasar es que un rango domine o que quede casi vacío.
      pct.forEach((v) => {
        assert.ok(v <= 55, `${escena}/${dif}: un rango concentra demasiado (${detalle})`);
      });
      assert.ok(pct.filter((v) => v >= 8).length >= 3, `${escena}/${dif}: la correcta sólo cae en uno o dos rangos (${detalle})`);
    });
  }
}

test('el relleno nunca repite una etiqueta que ya está', () => {
  // El relleno de los Dados era una constante: si hacía falta más de uno,
  // aparecían dos opciones idénticas en pantalla.
  for (const escena of ESCENAS) {
    for (const dif of DIFICULTADES) {
      for (let i = 0; i < 200; i++) {
        const etiquetas = generar(escena, dif).opts.map((o) => o.label);
        assert.equal(
          new Set(etiquetas).size, 4,
          `${escena}/${dif}: opciones repetidas -> ${etiquetas.join(', ')}`,
        );
      }
    }
  }
});
