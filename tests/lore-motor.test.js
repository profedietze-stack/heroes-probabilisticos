// La ficha de cada monstruo (consejo, dato) contra el motor del juego.
//
// Es la señal de bug más fiable de las auditorías de contenido: la capa de
// referencia se escribe aparte de las reglas y termina contradiciéndolas. Acá
// seis de los diez consejos describían mecánicas que no existen (la Hidra
// "escalonada", el Golem débil en las colas, la Esfinge que pega menos si tirás
// cerca de 13...) y el Titán decía "defensa máxima" cuando el motor le suma
// ATAQUE. El alumno lee el consejo antes de pelear y arma la estrategia con él.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const RAIZ = join(__dirname, '..');
const ctx = vm.createContext({ console });
vm.runInContext(readFileSync(join(RAIZ, 'js/data/monsters.js'), 'utf8').replace(/^const /gm, 'var '), ctx);
const { MONSTERS, MONSTER_LORE } = ctx;
const BATALLA = readFileSync(join(RAIZ, 'js/scenes/BattleScene.js'), 'utf8');

const combos = (k) => (k < 2 || k > 24 ? 0 : Math.min(k - 1, 25 - k, 12));
const favorables = (u) => { let c = 0; for (let k = u; k <= 24; k++) c += combos(k); return c; };
const coma = (x) => x.toFixed(1).replace('.', ',');

test('hay una ficha por monstruo', () => {
  assert.equal(MONSTER_LORE.length, MONSTERS.length);
});

test('si el consejo cita un umbral y una probabilidad, coinciden con el motor', () => {
  MONSTERS.forEach((m, i) => {
    const consejo = MONSTER_LORE[i].consejo;
    const u = consejo.match(/[Uu]mbral (\d+)/);
    if (u) assert.equal(+u[1], m.umbral, `${m.nombre}: el consejo dice umbral ${u[1]} y el motor ${m.umbral}`);
    const f = consejo.match(/(\d+) de (?:las )?144/);
    if (f) assert.equal(+f[1], favorables(m.umbral), `${m.nombre}: ${f[1]} de 144 no es lo que da el umbral ${m.umbral}`);
    const p = consejo.match(/\((\d+,\d) %\)/);
    if (p) assert.equal(p[1], coma((favorables(m.umbral) / 144) * 100), `${m.nombre}: porcentaje del consejo`);
    // Sólo se habla del umbral de ESTE monstruo
    for (const n of consejo.matchAll(/[Uu]mbral (\d+)/g)) assert.equal(+n[1], m.umbral, `${m.nombre}: cita otro umbral`);
  });
});

test('la desviación estándar de 2d12 que cita la ficha es la de la suma (≈ 4,9)', () => {
  // Un solo d12 tiene σ ≈ 3,45; la suma de dos, √(2·143/12) ≈ 4,88. La ficha del
  // Tiburón decía 3.45 "del 2d12" mientras el glosario decía 4.9.
  const sigma = Math.sqrt(2 * (143 / 12));
  assert.ok(Math.abs(sigma - 4.88) < 0.01);
  MONSTER_LORE.forEach((l, i) => {
    for (const m of (l.dato + ' ' + l.consejo).matchAll(/2d12[^.]*?σ\s*≈\s*([\d.,]+)/g)) {
      const v = parseFloat(m[1].replace(',', '.'));
      assert.ok(Math.abs(v - sigma) < 0.06, `${MONSTERS[i].nombre}: σ ≈ ${m[1]} para 2d12 (es ${sigma.toFixed(2)})`);
    }
  });
});

test('las habilidades que la ficha promete existen en el motor', () => {
  const lore = (nombre) => MONSTER_LORE[MONSTERS.findIndex((m) => m.nombre.includes(nombre))];
  // Tiburón: ataque que crece con los turnos
  assert.match(lore('Tiburón').consejo, /aumenta con cada turno/);
  assert.match(BATALLA, /forma === 'tiburon'\) dañoMonstruo \+= Math\.floor\(STATE\.turnoActual\/2\)/);
  // Titán: +4 de daño en los turnos 6 a 8 (es ataque, no defensa)
  const titan = lore('Titán').consejo;
  assert.match(titan, /turnos 6, 7 y 8/);
  assert.doesNotMatch(titan, /defensa/i);
  assert.match(BATALLA, /forma === 'titan' && STATE\.turnoActual>=6 && STATE\.turnoActual<=8\) dañoMonstruo \+= 4/);
  // Demiurgo: fase 2 al 50 % de vida
  assert.match(lore('Demiurgo').consejo, /FASE 2 al 50/);
  assert.match(BATALLA, /forma === 'demiurgo' && STATE\.jefeHp < STATE\.jefeHpMax\*0\.5/);
});

test('la ficha no promete mecánicas que el motor no tiene', () => {
  // Frases que estaban en los consejos y no corresponden a ninguna regla.
  const inventadas = [/escalonad/i, /colas de la distribución son su debilidad/i, /alternan daño/i,
                      /defensas son variables/i, /menos daño te har/i, /reduzca tu poder/i];
  MONSTER_LORE.forEach((l, i) => {
    for (const re of inventadas) assert.doesNotMatch(l.consejo, re, `${MONSTERS[i].nombre}: ${re}`);
  });
});
