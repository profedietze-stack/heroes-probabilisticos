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

test('el relleno se agrega antes de barajar, no después', () => {
  // Comprobación estructural: si vuelve el `push` sobre el array ya barajado,
  // el sesgo vuelve con él aunque la medición de arriba tarde en delatarlo.
  for (const archivo of ['PuzzleUrna', 'PuzzleDados']) {
    const codigo = leer(`js/scenes/${archivo}.js`);
    const gen = codigo.slice(codigo.indexOf('_gen('), codigo.indexOf('create()'));
    const barajado = gen.search(/_shuffle\(\s*\[\s*\{\s*label\s*:\s*corr/);
    assert.ok(barajado > -1, `${archivo}: no se encontró el barajado de las opciones`);
    const relleno = gen.slice(barajado).search(/\.push\(\s*\{\s*label/);
    assert.equal(
      relleno, -1,
      `${archivo}: se sigue agregando una opción después de barajar, ` +
      'así que esa posición nunca puede tener la correcta',
    );
  }
});

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
