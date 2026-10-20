// Las clases y el balance de campaña DENTRO de la batalla: se carga BattleScene
// de verdad (con un Phaser de mentira) y se comprueba lo que muestra y calcula.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const RAIZ = join(__dirname, '..');
const leer = (f) => readFileSync(join(RAIZ, f), 'utf8');
const fuenteBatalla = leer('js/scenes/BattleScene.js');

function montar(estado) {
  const ctx = vm.createContext({ Phaser: { Scene: class { constructor() {} } }, console, Math, Object, Array, JSON, snd_curse() {} });
  const previo = ['js/core/state.js', 'js/core/config.js', 'js/core/clases.js', 'js/core/skills.js']
    .map((f) => leer(f).replace(/^if \(typeof module.*$/m, '')).join('\n;\n');
  vm.runInContext(previo + '\n;this.__g = { STATE, CFG, DIFICULTADES, bonusAtaqueCampaña, REVIVIR_FRAC };', ctx);
  Object.assign(ctx.__g.STATE, estado);
  vm.runInContext(fuenteBatalla, ctx, { filename: 'BattleScene.js' });
  const e = vm.runInContext('Object.create(BattleScene.prototype)', ctx);
  e.monster = { umbral: 13 };
  return { ctx, e, S: ctx.__g };
}

test('la barra de probabilidad cuenta los bonos permanentes (Resiliencia y Arquero)', () => {
  // Con +3 de Resiliencia los dados solo tienen que sumar 10: la barra decía "13+ = 54 %"
  // igual, y la probabilidad "exacta" que mostraba no era la real.
  const { e } = montar({ clase: 'guerrero', resiliencia: 0, flagStar: false });
  assert.match(e._probTexto(), /Necesitas 13\+ \| 78 casos \/ 144/);
  const { e: e2 } = montar({ clase: 'guerrero', resiliencia: 3, flagStar: false });
  assert.match(e2._probTexto(), /Necesitas 13\+ \(−3 por tus bonos: 10\+ en los dados\) \| 108 casos/);
  const { e: e3 } = montar({ clase: 'arquero', resiliencia: 0, flagStar: false });
  assert.match(e3._probTexto(), /\(−1 por tus bonos: 12\+ en los dados\) \| 89 casos/);
  const { e: e4 } = montar({ clase: 'arquero', resiliencia: 2, flagStar: false });
  assert.match(e4._probTexto(), /\(−3 por tus bonos: 10\+ en los dados\)/, 'Resiliencia y Arquero se suman');
});

test('el costo de un poder cambia solo para el primero del Hechicero', () => {
  const { e } = montar({ clase: 'hechicero', skills: { escarcha: 1 } });
  e._primerPoderUsado = false;
  assert.equal(e._costoPoder('escarcha'), 1, 'el primero cuesta 1 MP menos (2 → 1)');
  e._primerPoderUsado = true;
  assert.equal(e._costoPoder('escarcha'), 2, 'el segundo cuesta lo normal');
  const { e: g } = montar({ clase: 'guerrero', skills: { escarcha: 1 } });
  g._primerPoderUsado = false;
  assert.equal(g._costoPoder('escarcha'), 2);
});

test('la Escarcha ya no se puede lanzar cada turno: cuesta 2 MP en todos los rangos', () => {
  // Con 1 MP (rango 2 y 3) y +1 MP de recarga por tirada, el monstruo quedaba congelado
  // TODOS los turnos: 0 ataques y 0 HP perdido contra cualquier jefe.
  const { ctx } = montar({});
  const mp = vm.runInContext('getPower("escarcha").mp.join()', ctx);
  assert.equal(mp, '2,2,2');
  const md = vm.runInContext('getPower("maldicionDado").mp.join()', ctx);
  assert.equal(md, '2,2,2');
});

test('el ataque del héroe crece con los jefes derrotados, más rápido en las dificultades duras', () => {
  const { S } = montar({});
  const f = S.bonusAtaqueCampaña;
  assert.equal(f(0, 'normal'), 0, 'el primer jefe se pelea con el ataque base');
  assert.ok(f(9, 'normal') > f(1, 'normal'));
  for (const d of ['facil', 'normal', 'heroe', 'legendario']) {
    for (let j = 1; j <= 10; j++) assert.ok(f(j, d) >= f(j - 1, d), `${d}: no baja entre jefes`);
  }
  assert.ok(f(9, 'legendario') > f(9, 'heroe') && f(9, 'heroe') > f(9, 'normal') && f(9, 'normal') > f(9, 'facil'));
  assert.equal(f(5, 'dios'), f(5, 'normal'), 'dificultad desconocida = Normal');
});

test('al morir se revive con la mitad del HP', () => {
  const { S } = montar({});
  assert.equal(S.REVIVIR_FRAC, 0.5);
});

test('la batalla usa las funciones de clase en cada punto donde la clase importa', () => {
  // Comprobación estructural: si alguien las saca, la clase vuelve a ser decorativa.
  const piezas = {
    'bonus a la tirada (Arquero)': /bonusTirada\(STATE\.clase\)/,
    'racha en el daño (Guerrero)': /bonusRacha\(STATE\.clase, this\._racha\)/,
    'costo del primer poder (Hechicero)': /costoPoder\(STATE\.clase,/,
    'potencia de ítems (Alquimista)': /potenciaItem\(STATE\.clase, it\.valor\)/,
    'ítems iniciales (Alquimista)': /itemsIniciales\(STATE\.clase,/,
    'ataque de campaña': /bonusAtaqueCampaña\(STATE\.jefeActual, STATE\.dificultad\)/,
    'revivir con REVIVIR_FRAC': /STATE\.hpMax \* REVIVIR_FRAC/,
  };
  for (const [nombre, re] of Object.entries(piezas)) assert.match(fuenteBatalla, re, `la batalla ya no aplica: ${nombre}`);
  assert.match(leer('js/scenes/PuzzleScene.js'), /precioItem\(STATE\.clase, it\.precio\)/, 'la tienda ya no aplica el descuento');
  assert.match(leer('js/scenes/IntroScene.js'), /aplicarClaseInicial\(STATE, c\.key\)/, 'elegir clase ya no hornea los stats');
  assert.match(leer('js/scenes/IntroScene.js'), /CLASES_ORDEN\.map/, 'la pantalla de selección no lee clases.js');
});
