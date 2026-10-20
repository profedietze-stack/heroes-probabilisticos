// La Maldición del Doble 1 (BattleScene): reduce ataque y defensa a la mitad
// hasta el próximo impacto. Se prueba el código real de la escena con un
// Phaser de mentira que ignora todo lo gráfico.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const traga = new Proxy(function () {}, { get: () => traga, apply: () => traga });
const contexto = vm.createContext({
  Phaser: { Scene: class { constructor() {} } },
  console, Math, Object, Array, Set, Number, String, JSON,
  snd_curse() {},
});
const fuente = readFileSync(join(__dirname, '..', 'js', 'scenes', 'BattleScene.js'), 'utf8');
vm.runInContext(fuente, contexto, { filename: 'BattleScene.js' });

function escena(estado) {
  contexto.STATE = estado;
  const e = vm.runInContext('Object.create(BattleScene.prototype)', contexto);
  Object.assign(e, {
    w: 1024, h: 700, cameras: { main: traga }, add: traga, tweens: traga,
    time: { delayedCall: (_ms, cb) => cb() },
    mostrarMensaje() {}, updateStatsText() {},
  });
  return e;
}

test('dos Doble 1 seguidos no dejan el ataque a la mitad para toda la batalla', () => {
  const s = { ataque: 8, defensa: 5, ataqueBase: 8, defensaBase: 5 };
  const e = escena(s);
  e.ejecutarMaldicion(() => {});
  assert.equal(s.ataque, 4, 'la maldición reduce el ataque a la mitad');
  e.ejecutarMaldicion(() => {});            // segundo Doble 1 antes de un impacto
  assert.equal(s.ataque, 4, 'la segunda maldición no reduce más');
  e.revertirMaldicion();                    // el próximo impacto la revierte
  assert.equal(s.ataque, 8, 'tras el impacto el ataque vuelve al original');
  assert.equal(s.defensa, 5, 'y la defensa también');
});

test('una maldición revertida no deja residuo', () => {
  const s = { ataque: 9, defensa: 6, ataqueBase: 9, defensaBase: 6 };
  const e = escena(s);
  e.ejecutarMaldicion(() => {});
  e.revertirMaldicion();
  e.revertirMaldicion();                    // revertir dos veces no suma de más
  assert.equal(s.ataque, 9);
  assert.equal(s.defensa, 6);
});

test('create() descarta la maldición pendiente de la batalla anterior', () => {
  // La escena se reutiliza: tras una derrota con la maldición puesta, el primer
  // impacto de la batalla siguiente "revertía" una reducción que no existía y
  // regalaba ataque y defensa. No hay forma barata de correr create() entero
  // sin Phaser, así que se comprueba que lo reinicie.
  const create = fuente.slice(fuente.indexOf('  create(){'), fuente.indexOf('_mostrarLore(m){'));
  assert.match(create, /_curseAtkReduc\s*=\s*this\._curseDefReduc\s*=\s*0/);
});
