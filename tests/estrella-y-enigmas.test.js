// Dos decisiones de diseño de la auditoría:
//  D3: la Estrella de Varianza vale UNA tirada (el -2 duraba toda la batalla).
//  D7: fallar un enigma da un tercio de la XP, y salir sin jugar pide confirmación.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const RAIZ = join(__dirname, '..');
const leer = (f) => readFileSync(join(RAIZ, f), 'utf8');
const traga = new Proxy(function () {}, { get: () => traga, apply: () => traga, set: () => true });
const escena = (obj) => new Proxy(obj, { get: (t, k) => (k in t ? t[k] : traga), set: (t, k, v) => { t[k] = v; return true; } });

function ctxBase(extra = {}) {
  return vm.createContext({
    Phaser: { Scene: class { constructor() {} } }, console, Math, Object, Array, JSON,
    document: traga, window: traga, snd_impact() {}, snd_fail() {}, snd_critical() {}, snd_curse() {}, snd_item() {}, snd_buff() {}, ...extra,
  });
}

// ── D3 ──
function batalla(estado) {
  const ctx = ctxBase();
  const previo = ['js/core/state.js', 'js/core/config.js', 'js/core/clases.js', 'js/data/items.js']
    .map((f) => leer(f).replace(/^if \(typeof module.*$/m, '')).join('\n;\n');
  vm.runInContext(previo + '\n;this.__g = { STATE, ITEMS };', ctx);
  Object.assign(ctx.__g.STATE, { buffs: [], ...estado });
  vm.runInContext(leer('js/scenes/BattleScene.js'), ctx, { filename: 'BattleScene.js' });
  const base = vm.runInContext('Object.create(BattleScene.prototype)', ctx);
  Object.assign(base, { monster: { umbral: 13, defensa: 5, forma: 'x' }, _battleLog: { jugador: [], monstruo: [] }, turnoJugador: true, _racha: 0, _cargaArmada: 0, monsterCX: 0, monsterCY: 0 });
  // Lo gráfico se anula: se prueba la regla, no el dibujo.
  for (const m of ['mostrarMensaje', 'drawEnemyBar', 'flashMonster', 'showDmgNumber', 'hitStop', 'updateStatsText', 'revertirMaldicion', 'victoria', 'turnoMonstruo']) base[m] = () => {};
  return { e: escena(base), S: ctx.__g };
}

test('la Estrella de Varianza baja el umbral solo en la tirada siguiente', () => {
  const { e, S } = batalla({ flagStar: true, buffs: [{ tipo: 'star' }], jefeHp: 99, jefeHpMax: 99, ataque: 8, stats: { dañoTotalFinal: 0 } });
  assert.equal(e.getUmbralEfectivo(), 11, 'con la Estrella el umbral baja 2');
  e.fase2(10, 10, 5, 5);                         // una tirada (falla con 10 < 11)
  assert.equal(S.STATE.flagStar, false, 'la bandera sigue encendida tras la tirada');
  assert.equal(S.STATE.buffs.some((b) => b.tipo === 'star'), false);
  assert.equal(e.getUmbralEfectivo(), 13, 'la tirada siguiente ya usa el umbral normal');
});

test('la tirada de la Estrella se evalúa con el umbral reducido', () => {
  const { e, S } = batalla({ flagStar: true, buffs: [], jefeHp: 99, jefeHpMax: 99, ataque: 8, stats: { dañoTotalFinal: 0 } });
  e.fase2(11, 11, 5, 6);                         // 11 impacta SOLO porque el umbral era 11
  assert.ok(e._battleLog.jugador[0].impacto, 'con la Estrella 11 tiene que impactar');
  assert.equal(S.STATE.flagStar, false);
});

test('la Estrella cuesta 30 y su texto dice "solo la próxima tirada"', () => {
  const { S } = batalla({});
  const it = S.ITEMS.find((x) => x.tipo === 'star');
  assert.equal(it.precio, 30);
  assert.match(it.efecto, /Solo la próxima tirada/);
  assert.doesNotMatch(it.efecto, /50%/, 'ya no promete un "+50 % de rango" que no era cierto');
});

// ── D7 ──
function puzzleBase(dif) {
  const ctx = ctxBase({ ptsAdd() {}, ptsCalc: () => 0, showConfirm() {}, saveGameLegend() {} });
  const previo = ['js/core/state.js', 'js/core/config.js', 'js/core/skills.js'].map((f) => leer(f).replace(/^if \(typeof module.*$/m, '')).join('\n;\n');
  vm.runInContext(previo + '\n;this.__g = { STATE };', ctx);
  vm.runInContext(leer('js/scenes/PuzzleBase.js'), ctx, { filename: 'PuzzleBase.js' });
  Object.assign(ctx.__g.STATE, { xp: 0, xpTotal: 0, oro: 0, hp: 50, hpMax: 150, nodeActual: 0, enigmasCompletados: {} });
  const scene = escena({ _ptsMult: 1, _data: { dificultad: dif }, cameras: { main: { fadeOut() {}, once() {} } } });
  return { ctx, scene, STATE: ctx.__g.STATE };
}

test('acertar un enigma da la XP completa y fallarlo, un tercio', () => {
  const ok = puzzleBase('normal');
  vm.runInContext('pzComplete', ok.ctx)(ok.scene, 15, 0, true);
  assert.equal(ok.STATE.xp, 40);
  const mal = puzzleBase('normal');
  vm.runInContext('pzComplete', mal.ctx)(mal.scene, 5, 0, false);
  assert.equal(mal.STATE.xp, 13);
  assert.ok(mal.STATE.xp < ok.STATE.xp / 2, 'fallar tiene que costar XP');
  assert.equal(mal.STATE.xpTotal, 13, 'el total acumulado sigue a la XP');
});

test('en cualquier dificultad fallar da menos XP que acertar (pero algo)', () => {
  for (const dif of ['facil', 'normal', 'heroe', 'legendario']) {
    const a = puzzleBase(dif); vm.runInContext('pzComplete', a.ctx)(a.scene, 10, 0, true);
    const f = puzzleBase(dif); vm.runInContext('pzComplete', f.ctx)(f.scene, 10, 0, false);
    assert.ok(f.STATE.xp > 0 && f.STATE.xp < a.STATE.xp, `${dif}: ${f.STATE.xp} vs ${a.STATE.xp}`);
  }
});

test('salir de un enigma sin jugarlo pide confirmación antes de avanzar el nodo', () => {
  const ctx = ctxBase();
  let pedida = null;
  ctx.showConfirm = (msg, ok, op) => { pedida = { msg, ok, op }; };
  vm.runInContext(leer('js/scenes/PuzzleScene.js'), ctx, { filename: 'PuzzleScene.js' });
  const e = vm.runInContext('Object.create(PuzzleScene.prototype)', ctx);
  let salio = false;
  e._exitToMap = () => { salio = true; };
  e._confirmarSalida();
  assert.equal(salio, false, 'salió sin preguntar');
  assert.ok(pedida && /recompensa/.test(pedida.msg), 'el aviso no menciona la recompensa');
  pedida.ok();
  assert.equal(salio, true, 'al confirmar tiene que salir');
  assert.match(leer('js/scenes/PuzzleScene.js'), /backBtn\.on\('pointerup',\s*\(\)=>this\._confirmarSalida\(\)\)/, 'el botón volvió a salir directo');
});
