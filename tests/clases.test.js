// Las clases del héroe: números, coherencia con lo que la pantalla de selección
// promete, y los logros/títulos que desbloquean.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const RAIZ = join(__dirname, '..');
const C = require(join(RAIZ, 'js/core/clases.js'));
const leer = (f) => readFileSync(join(RAIZ, f), 'utf8');

test('hay cuatro clases, cada una con al menos una ventaja y un costo', () => {
  assert.deepEqual([...C.CLASES_ORDEN].sort(), ['alquimista', 'arquero', 'guerrero', 'hechicero']);
  for (const k of C.CLASES_ORDEN) {
    const c = C.CLASES[k];
    assert.ok(c.ventajas.length >= 1 && c.costos.length >= 1, `${k}: falta ventaja o costo`);
    assert.ok(c.titulo && c.idea && c.nombre && c.emoji, `${k}: faltan textos`);
  }
});

test('una clase desconocida cae en Guerrero (guardado viejo o dañado)', () => {
  assert.equal(C.claseDe('mago').key, 'guerrero');
  assert.equal(C.claseDe(undefined).key, 'guerrero');
});

test('aplicarClaseInicial hornea HP, MP, ataque y defensa sobre la dificultad', () => {
  const base = () => ({ hpMax: 150, hp: 150, ataqueBase: 8, ataque: 8, defensaBase: 5, defensa: 5, mpMax: 4 });
  const g = C.aplicarClaseInicial(base(), 'guerrero');
  assert.equal(g.hpMax, 175); assert.equal(g.hp, 175);
  const a = C.aplicarClaseInicial(base(), 'arquero');
  assert.equal(a.hpMax, 125);
  const h = C.aplicarClaseInicial(base(), 'hechicero');
  assert.equal(h.mpMax, 7); assert.equal(h.hpMax, 135);
  const q = C.aplicarClaseInicial(base(), 'alquimista');
  assert.equal(q.defensaBase, 4); assert.equal(q.defensa, 4);
});

test('ninguna clase deja al héroe en un estado inválido, en ninguna dificultad', () => {
  const dif = { facil: [200, 10, 6], normal: [150, 8, 5], heroe: [120, 7, 4], legendario: [90, 6, 3] };
  for (const [d, [hp, atk, def]] of Object.entries(dif)) {
    for (const k of C.CLASES_ORDEN) {
      const e = C.aplicarClaseInicial({ hpMax: hp, hp, ataqueBase: atk, ataque: atk, defensaBase: def, defensa: def, mpMax: 4 }, k);
      assert.ok(e.hpMax >= 1 && e.ataqueBase >= 1 && e.defensaBase >= 0, `${k}/${d}`);
      assert.ok(e.mpMax >= 4 && e.mpMax <= 8, `${k}/${d}: mpMax ${e.mpMax} fuera de [4,8]`);
    }
  }
});

test('Arquero: +1 a la tirada; el resto, 0', () => {
  assert.equal(C.bonusTirada('arquero'), 1);
  for (const k of ['guerrero', 'hechicero', 'alquimista']) assert.equal(C.bonusTirada(k), 0, k);
  assert.equal(C.bonoPermanente('arquero', 2), 3);
  assert.equal(C.bonoPermanente('guerrero', 2), 2);
});

test('Guerrero: la racha suma hasta su tope y no es negativa', () => {
  assert.equal(C.bonusRacha('guerrero', 0), 0);
  assert.equal(C.bonusRacha('guerrero', 2), 2);
  assert.equal(C.bonusRacha('guerrero', 99), C.CLASES.guerrero.racha);
  assert.equal(C.bonusRacha('guerrero', -3), 0);
  assert.equal(C.bonusRacha('arquero', 5), 0, 'las demás clases no tienen racha');
});

test('Hechicero: el primer poder cuesta 1 MP menos, nunca menos de 1', () => {
  assert.equal(C.costoPoder('hechicero', 2, true), 1);
  assert.equal(C.costoPoder('hechicero', 2, false), 2);
  assert.equal(C.costoPoder('hechicero', 1, true), 1, 'el piso es 1 MP');
  assert.equal(C.costoPoder('guerrero', 2, true), 2);
});

test('Alquimista: ítems más fuertes, uno extra y descuento en la tienda', () => {
  assert.equal(C.potenciaItem('alquimista', 15), 22);
  assert.equal(C.potenciaItem('alquimista', 40), 60);
  assert.equal(C.potenciaItem('alquimista', 2), 3, 'un buff de +2 pasa a +3, no se queda igual');
  assert.equal(C.potenciaItem('guerrero', 15), 15);
  assert.equal(C.itemsIniciales('alquimista', 2), 3);
  assert.equal(C.itemsIniciales('guerrero', 2), 2);
  assert.equal(C.precioItem('alquimista', 30), 27);
  assert.equal(C.precioItem('alquimista', 1), 1, 'el precio nunca llega a 0');
  assert.equal(C.precioItem('guerrero', 30), 30);
});

// ── Lo que la pantalla de selección dice tiene que ser lo que el código hace ──
test('los textos de ventajas y costos coinciden con los números de cada clase', () => {
  const num = (txt, re) => { const m = txt.match(re); assert.ok(m, `no se encontró ${re} en: ${txt}`); return +m[1]; };
  const todo = (k) => C.CLASES[k].ventajas.concat(C.CLASES[k].costos).join(' | ');
  const g = C.CLASES.guerrero, a = C.CLASES.arquero, h = C.CLASES.hechicero, q = C.CLASES.alquimista;
  assert.equal(num(todo('guerrero'), /\+(\d+) HP/), g.hp);
  assert.equal(num(todo('guerrero'), /hasta \+(\d+)/), g.racha);
  assert.equal(num(todo('arquero'), /\+(\d+) a la suma/), a.tirada);
  assert.equal(num(todo('arquero'), /−(\d+) HP/), -a.hp);
  assert.equal(num(todo('hechicero'), /\+(\d+) MP/), h.mp);
  assert.equal(num(todo('hechicero'), /empieza con (\d+)/), 4 + h.mp);
  assert.equal(num(todo('hechicero'), /cuesta (\d+) MP menos/), h.primerPoder);
  assert.equal(num(todo('hechicero'), /−(\d+) HP/), -h.hp);
  assert.equal(num(todo('alquimista'), /(\d+) % más fuertes/), (q.potenciaItems - 1) * 100);
  assert.equal(num(todo('alquimista'), /(\d+) objeto extra/), q.itemsExtra);
  assert.equal(num(todo('alquimista'), /−(\d+) %/), q.descuento * 100);
  assert.equal(num(todo('alquimista'), /−(\d+) de defensa/), -q.def);
});

test('el costo declarado de cada clase existe (no hay clases gratis)', () => {
  // Ninguna clase puede ser "todo ventajas": cada una paga algo medible.
  const paga = (c) => c.hp < 0 || c.atk < 0 || c.def < 0 || c.mp < 0 || /No tiene/.test(c.costos.join(' '));
  for (const k of C.CLASES_ORDEN) assert.ok(paga(C.CLASES[k]), `${k} no paga nada`);
});

// ── Logros y títulos ──
function montarLogros(clase) {
  const almacen = new Map();
  const falso = new Proxy(function () {}, { get: () => falso, apply: () => falso, set: () => true });
  const ctx = vm.createContext({
    console, Math, Object, Array, JSON, Date,
    localStorage: { getItem: (k) => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, v), removeItem: (k) => almacen.delete(k) },
    document: { getElementById: () => null, createElement: () => falso, body: { appendChild() {} } },
    setTimeout() {}, clearTimeout() {},
    STATE: { clase, dificultad: 'normal', stats: { tiradas: [] } },
    _arcadeStatsLoad: () => ({ arcade: {}, libre: {} }),
  });
  const codigo = leer('js/core/clases.js').replace(/^if \(typeof module.*$/m, '') + '\n' + leer('js/core/achievements.js');
  vm.runInContext(codigo + '\n;this.__api = { logrosEvent, logrosGet, getTituloClase, LOGROS_DEF };', ctx);
  return ctx;
}

test('hay un logro por clase, uno de campaña por clase y uno por las cuatro', () => {
  const { __api } = montarLogros('guerrero');
  const ids = __api.LOGROS_DEF.map((l) => l.id);
  for (const k of C.CLASES_ORDEN) {
    assert.ok(ids.includes('clase_' + k), `falta clase_${k}`);
    assert.ok(ids.includes('campana_' + k), `falta campana_${k}`);
  }
  assert.ok(ids.includes('todas_clases'));
  assert.equal(new Set(ids).size, ids.length, 'ids repetidos');
  // El título que promete la descripción del logro es el de clases.js
  for (const k of C.CLASES_ORDEN) {
    const l = __api.LOGROS_DEF.find((x) => x.id === 'clase_' + k);
    assert.ok(l.desc.includes(C.CLASES[k].titulo), `${k}: la descripción no nombra el título «${C.CLASES[k].titulo}»`);
  }
});

test('la primera victoria con una clase desbloquea su logro y su título', () => {
  const ctx = montarLogros('arquero');
  const { logrosEvent, logrosGet, getTituloClase } = ctx.__api;
  assert.equal(getTituloClase('arquero'), null, 'sin victoria todavía no hay título');
  logrosEvent('victoria', { jefe: 0, esFinal: false, hpFinal: 100 });
  assert.ok(logrosGet().desbloqueados.clase_arquero);
  assert.equal(getTituloClase('arquero'), 'Ojo de Laplace');
  assert.equal(getTituloClase('guerrero'), null, 'los títulos de otras clases siguen bloqueados');
  assert.ok(!logrosGet().desbloqueados.campana_arquero, 'sin jefe final no hay logro de campaña');
});

test('derrotar al Demiurgo desbloquea la campaña de esa clase, y las cuatro dan el logro final', () => {
  const ctx = montarLogros('guerrero');
  const { logrosEvent, logrosGet } = ctx.__api;
  for (const k of C.CLASES_ORDEN) {
    ctx.STATE.clase = k;
    assert.ok(!logrosGet().desbloqueados.todas_clases, `no debería estar antes de ${k}`);
    logrosEvent('victoria', { jefe: 9, esFinal: true, hpFinal: 50 });
    assert.ok(logrosGet().desbloqueados['campana_' + k], `campana_${k}`);
  }
  assert.ok(logrosGet().desbloqueados.todas_clases);
  assert.equal(logrosGet().stats.campañasPorClase.guerrero, 1);
});

test('terminar dos veces con la misma clase no da el logro de las cuatro', () => {
  const ctx = montarLogros('mago');   // clase desconocida cuenta como Guerrero
  const { logrosEvent, logrosGet } = ctx.__api;
  logrosEvent('victoria', { jefe: 9, esFinal: true, hpFinal: 50 });
  logrosEvent('victoria', { jefe: 9, esFinal: true, hpFinal: 50 });
  assert.ok(!logrosGet().desbloqueados.todas_clases);
  assert.equal(logrosGet().stats.campañasPorClase.guerrero, 2);
});
