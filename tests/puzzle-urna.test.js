// Pruebas del enigma de la urna.
//
// El juego enseña probabilidad, así que una opción mal armada no es un detalle
// de interfaz: es enseñar algo falso. Estas pruebas comprueban que la respuesta
// marcada como correcta sea realmente casos favorables / casos totales, y que
// nunca aparezcan dos opciones iguales en pantalla — cuando pasa, el alumno
// elige una fracción correcta y el juego se la marca mal.
//
// El código del juego son <script> clásicos que dependen de Phaser, no módulos.
// En vez de reescribirlo, se cargan los dos archivos en un contexto de node con
// un Phaser de mentira: así se prueba el código que corre de verdad en el aula,
// no una copia.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const leer = (rel) => readFileSync(join(__dirname, '..', rel), 'utf8');

function cargarEscena() {
  const contexto = vm.createContext({
    // Lo mínimo que necesita el archivo para definirse: la clase base y las
    // funciones de dibujo que el constructor no llega a usar.
    Phaser: { Scene: class { constructor() {} } },
    console,
    Math,
    Object,
    Array,
    Set,
    Number,
    String,
    JSON,
  });
  vm.runInContext(leer('js/scenes/PuzzleBase.js'), contexto, { filename: 'PuzzleBase.js' });
  vm.runInContext(leer('js/scenes/PuzzleUrna.js'), contexto, { filename: 'PuzzleUrna.js' });
  return contexto;
}

const contexto = cargarEscena();
const DIFICULTADES = ['facil', 'normal', 'heroe', 'legendario'];

function generar(dificultad) {
  return vm.runInContext(
    `(function(){ const e = Object.create(PuzzleUrna.prototype); return e._gen(${JSON.stringify(dificultad)}); })()`,
    contexto,
  );
}

function aNumero(fraccion) {
  const [n, d] = fraccion.split('/').map(Number);
  return n / d;
}

test('la respuesta correcta es casos favorables sobre casos totales', () => {
  for (const dif of DIFICULTADES) {
    for (let i = 0; i < 300; i++) {
      const p = generar(dif);
      const esperado = p.pick.count / p.total;
      assert.ok(
        Math.abs(aNumero(p.corr) - esperado) < 1e-12,
        `${dif}: dijo ${p.corr} y son ${p.pick.count}/${p.total}`,
      );
    }
  }
});

test('siempre hay cuatro opciones y una sola correcta', () => {
  for (const dif of DIFICULTADES) {
    for (let i = 0; i < 300; i++) {
      const p = generar(dif);
      assert.equal(p.opts.length, 4, `${dif}: ${p.opts.length} opciones`);
      assert.equal(p.opts.filter((o) => o.ok).length, 1);
      assert.equal(p.opts.find((o) => o.ok).label, p.corr);
    }
  }
});

test('nunca se repite una opción en pantalla', () => {
  // Era el caso real: con la urna {r:2,b:4} el complemento y "la otra bola"
  // dan la misma fracción, y con {r:3,b:3} se simplificaban las tres a 1/2.
  for (const dif of DIFICULTADES) {
    for (let i = 0; i < 500; i++) {
      const p = generar(dif);
      const etiquetas = p.opts.map((o) => o.label);
      assert.equal(
        new Set(etiquetas).size, 4,
        `${dif}: opciones repetidas -> ${etiquetas.join(', ')} (urna ${JSON.stringify(p.cfg)})`,
      );
    }
  }
});

test('ninguna opción incorrecta vale lo mismo que la correcta', () => {
  // Una fracción sin simplificar que valga lo mismo también es correcta: si
  // el alumno la elige, el juego lo estaría marcando mal por escribirla
  // distinto.
  for (const dif of DIFICULTADES) {
    for (let i = 0; i < 500; i++) {
      const p = generar(dif);
      const valorCorrecto = aNumero(p.corr);
      for (const o of p.opts.filter((x) => !x.ok)) {
        assert.ok(
          Math.abs(aNumero(o.label) - valorCorrecto) > 1e-12,
          `${dif}: "${o.label}" vale lo mismo que la correcta "${p.corr}"`,
        );
      }
    }
  }
});

test('las probabilidades que se ofrecen son posibles: entre 0 y 1', () => {
  for (const dif of DIFICULTADES) {
    for (let i = 0; i < 200; i++) {
      for (const o of generar(dif).opts) {
        const v = aNumero(o.label);
        assert.ok(v >= 0 && v <= 1, `probabilidad imposible: ${o.label}`);
      }
    }
  }
});

test('la explicación dice los números con los que se hizo la cuenta', () => {
  const p = generar('normal');
  assert.match(p.explain, new RegExp(`${p.pick.count}/${p.total}`));
  assert.match(p.explain, new RegExp(p.colorName));
});
