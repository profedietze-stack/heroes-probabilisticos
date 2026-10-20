// Guardados dañados, editados o de otra versión: el juego tiene que leer lo que
// sirva, conservar el progreso y no romperse. Se carga el código real de
// js/core (config, state, esquema, items, skills y save) en un contexto de node
// con un localStorage de mentira.
//
// Antes, `loadGame` copiaba los campos con `d.campo || default` (sólo se
// defiende de lo que FALTA) y BORRABA el guardado entero si alguna invariante
// fallaba: con `inventario` como número el alumno perdía toda la partida y el
// juego le decía "No hay partida guardada".
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

function montar(guardado) {
  const almacen = new Map();
  if (guardado !== undefined) almacen.set('heroesProb_save', typeof guardado === 'string' ? guardado : JSON.stringify(guardado));
  const ctx = vm.createContext({
    console: { warn() {}, log() {}, error() {} }, Math, Object, Array, Set, Number, String, JSON, Date,
    window: {},
    localStorage: {
      getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
      setItem: (k, v) => { almacen.set(k, String(v)); },
      removeItem: (k) => { almacen.delete(k); },
    },
    showToast() {},
  });
  // Los `const` de nivel superior no quedan en el objeto global del contexto:
  // se los junta en un solo script con una línea que los expone.
  const codigo = ['js/core/config.js', 'js/data/items.js', 'js/core/state.js', 'js/core/state-schema.js',
                  'js/core/skills.js', 'js/core/save.js']
    .map((f) => readFileSync(join(__dirname, '..', f), 'utf8')).join('\n;\n');
  vm.runInContext(codigo + '\n;this.__api = { STATE, loadGame, checkStateInvariants, hasSave, ITEMS, CFG };', ctx);
  return { api: ctx.__api, almacen };
}

const sano = () => ({
  nombre: 'Ana', jefeActual: 3, dificultad: 'normal', hp: 90, hpMax: 150, ataque: 8, defensa: 5,
  ataqueBase: 8, defensaBase: 5, resiliencia: 1, inventario: [{ id: 1, cantidad: 2 }],
  stats: { tiradas: [{ valor: 9, d1: 4, d2: 5, jefe: 'x', turno: 1 }], derrotas: 1, objetosUsados: {}, tiempoInicio: 1, dañoTotalFinal: 10, objetosUsadosFinal: 0, turnosEpicos: [] },
  loreVisto: [0, 1], tiradaGlobal: 12, diosaContador: 2, nodeActual: 10, enigmasCompletados: { 0: 2 },
  oro: 40, xp: 30, xpTotal: 90, mpMax: 5, hpUpgrades: 1, eventoNodo: 9, quizHechas: [1, 2],
  skills: { regeneracion: 2 }, clase: 'arquero',
});

test('un guardado sano se lee tal cual', () => {
  const { api } = montar(sano());
  assert.equal(api.loadGame(), true);
  const s = api.STATE;
  assert.equal(s.nombre, 'Ana'); assert.equal(s.jefeActual, 3); assert.equal(s.hp, 90);
  assert.equal(s.inventario[0].cantidad, 2); assert.equal(s.skills.regeneracion, 2);
  assert.equal(s.clase, 'arquero'); assert.equal(s.xpTotal, 90);
});

// Cada caso rompe UN campo. Tiene que cargar, conservar el progreso (el jefe y
// el oro siguen siendo los del guardado) y dejar un estado que pase las invariantes.
const CASOS = {
  'inventario = número': { inventario: 5 },
  'inventario = texto': { inventario: 'hola' },
  'inventario con null': { inventario: [null, 7] },
  'inventario con id inexistente': { inventario: [{ id: 999, cantidad: 1 }] },
  'inventario con cantidad negativa': { inventario: [{ id: 1, cantidad: -3 }] },
  'inventario con cantidad texto': { inventario: [{ id: 1, cantidad: 'x' }] },
  'inventario con 9 slots': { inventario: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => ({ id, cantidad: 1 })) },
  'stats = texto': { stats: 'x' },
  'stats = null': { stats: null },
  'stats.tiradas = número': { stats: { tiradas: 7, derrotas: 'x' } },
  'skills = array': { skills: [1, 2] },
  'skills con rangos absurdos': { skills: { regeneracion: 9, egida: -2, escarcha: 'x', inventada: 3 } },
  'loreVisto = número': { loreVisto: 4 },
  'quizHechas = texto': { quizHechas: 'abc' },
  'enigmasCompletados = array': { enigmasCompletados: [1] },
  'hp = texto': { hp: '100' },
  'hp > hpMax': { hp: 999 },
  'hp negativo': { hp: -50 },
  'hpMax = 0': { hpMax: 0 },
  'hpMax enorme': { hpMax: 1e9, hp: 1e9 },
  'jefeActual = texto': { jefeActual: '3' },
  'jefeActual = 99': { jefeActual: 99 },
  'jefeActual = -1': { jefeActual: -1 },
  'jefeActual decimal': { jefeActual: 2.5 },
  'nodeActual = 99': { nodeActual: 99 },
  'dificultad inventada': { dificultad: 'dios' },
  'clase inventada': { clase: 'mago' },
  'oro negativo': { oro: -100 },
  'oro = texto': { oro: 'mucho' },
  'xp = texto': { xp: 'x', xpTotal: 'y' },
  'mpMax = 99': { mpMax: 99 },
  'hpUpgrades = texto': { hpUpgrades: 'x' },
  'ataque = 0 y defensa = null': { ataque: 0, defensa: null, ataqueBase: 0 },
  'resiliencia = 50': { resiliencia: 50 },
  'nombre = número': { nombre: 42 },
};

for (const [nombre, cambio] of Object.entries(CASOS)) {
  test(`campo dañado: ${nombre}`, () => {
    const { api, almacen } = montar({ ...sano(), ...cambio });
    assert.equal(api.loadGame(), true, 'tiene que cargar');
    assert.ok(almacen.has('heroesProb_save'), 'no se borra el guardado');
    const e = api.checkStateInvariants();
    assert.equal(e.length, 0, `invariantes: ${e.join('; ')}`);
    // El progreso de los campos sanos se conserva.
    if (!('jefeActual' in cambio)) assert.equal(api.STATE.jefeActual, 3, 'se perdió el jefe');
    if (!('oro' in cambio)) assert.equal(api.STATE.oro, 40, 'se perdió el oro');
    if (!('nombre' in cambio)) assert.equal(api.STATE.nombre, 'Ana');
    // Lo que las escenas hacen apenas arrancan: recorrer y empujar a estas estructuras.
    const s = api.STATE;
    assert.ok(Array.isArray(s.inventario) && s.inventario.length <= 6);
    s.inventario.forEach((it) => assert.ok(api.ITEMS[it.id - 1] && it.cantidad >= 1, `ítem inválido ${JSON.stringify(it)}`));
    assert.ok(Array.isArray(s.stats.tiradas)); s.stats.tiradas.push({});
    assert.ok(Array.isArray(s.loreVisto)); s.loreVisto.includes(0);
    assert.ok(Array.isArray(s.quizHechas)); s.quizHechas.includes(0);
    assert.ok(s.hp >= 1 && s.hp <= s.hpMax && Number.isFinite(s.hp / s.hpMax), 'barra de vida');
    assert.ok(Object.values(s.skills).every((r) => r >= 1 && r <= 3));
  });
}

test('lo que no se puede leer se descarta, pero un campo roto no borra la partida', () => {
  for (const ilegible of ['{"nombre":"x",', '42', 'null', '[1,2,3]']) {
    const { api, almacen } = montar(ilegible);
    assert.equal(api.loadGame(), false, ilegible);
    assert.ok(!almacen.has('heroesProb_save'), `basura ilegible (${ilegible}) se descarta`);
  }
});

test('sin guardado, loadGame dice que no hay', () => {
  const { api } = montar(undefined);
  assert.equal(api.loadGame(), false);
  assert.equal(api.hasSave(), false);
});

test('un guardado de una versión sin campos nuevos carga con valores por defecto', () => {
  const viejo = { nombre: 'Luis', jefeActual: 1, dificultad: 'heroe', hp: 100, hpMax: 120 };
  const { api } = montar(viejo);
  assert.equal(api.loadGame(), true);
  assert.equal(api.STATE.dificultad, 'heroe'); assert.equal(api.STATE.hp, 100);
  assert.equal(api.STATE.ataqueBase, 7, 'el ataque por defecto sale de la dificultad, no de 8');
  assert.equal(api.STATE.mpMax, 4);
});
