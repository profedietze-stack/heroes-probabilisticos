/* ══════════════════════════════════════
   state-schema.js — Fuente unica del estado inicial + validacion
   - freshRunState(): objeto de reset para una aventura nueva.
     Lo usa MenuScene (un solo lugar) → no se desincroniza.
   - checkStateInvariants(): valida invariantes; devuelve array de errores.
   Carga DESPUES de state.js y config.js.
══════════════════════════════════════ */

/* Estado de una aventura nueva. Single source of truth del reset. */
function freshRunState() {
  return {
    nombre: "Héroe",
    jefeActual: 0,
    dificultad: 'normal',
    hp: 150, hpMax: 150,
    ataque: 8, defensa: 5, ataqueBase: 8, defensaBase: 5,
    resiliencia: 0,
    inventario: [], buffs: [], loreVisto: [],
    tiradaGlobal: 0, diosaContador: 0,
    nodeActual: 0,
    enigmasCompletados: {},
    xp: 0, xpTotal: 0, oro: 0,
    mpMax: 4, hpUpgrades: 0, eventoNodo: 0, quizHechas: [],
    skills: {}, _hpMaxBase: null, clase: 'guerrero',
    stats: {
      tiradas: [], derrotas: 0, objetosUsados: {}, tiempoInicio: Date.now(),
      dañoTotalFinal: 0, objetosUsadosFinal: 0, turnosEpicos: []
    },
    /* Campos de combate — BattleScene los inicializa en create().
       Definidos aquí para que el schema sea completo y validateState()
       no informe false-positives cuando se llama fuera de una batalla. */
    jefeHp: 0, jefeHpMax: 0,
    turnoActual: 0,
    reduccionDaño: 0,
    mp: 0, mpMax: 4,
    flagCrown: false, flagGem: false, flagStar: false, flagKey: false,
    _resilNotify: false
  };
}
window.freshRunState = freshRunState;

/* Valida invariantes de STATE. Devuelve [] si todo OK. */
function checkStateInvariants() {
  if (typeof STATE === 'undefined') return ['STATE undefined'];
  var e = [];
  var maxSlots = (typeof CFG !== 'undefined' && CFG.MAX_INVENTORY_SLOTS) || 6;

  if (typeof STATE.hp !== 'number' || STATE.hp < 0) e.push('hp < 0 o no-numero (' + STATE.hp + ')');
  if (STATE.hp > STATE.hpMax) e.push('hp > hpMax (' + STATE.hp + ' > ' + STATE.hpMax + ')');
  if (STATE.hpMax <= 0) e.push('hpMax <= 0 (' + STATE.hpMax + ')');
  if (STATE.jefeActual < 0 || STATE.jefeActual > 10) e.push('jefeActual fuera de rango: ' + STATE.jefeActual);
  /* nodeActual llega a 29 justo tras derrotar al jefe final (índice 28) → se permite hasta 29 */
  if (STATE.nodeActual < 0 || STATE.nodeActual > 29) e.push('nodeActual fuera de rango: ' + STATE.nodeActual);
  if (STATE.ataqueBase <= 0) e.push('ataqueBase <= 0 (' + STATE.ataqueBase + ')');
  if (STATE.defensaBase < 0) e.push('defensaBase < 0 (' + STATE.defensaBase + ')');
  if (!Array.isArray(STATE.inventario)) e.push('inventario no es array');
  else if (STATE.inventario.length > maxSlots) e.push('inventario supera slots: ' + STATE.inventario.length + '/' + maxSlots);
  if (!Array.isArray(STATE.buffs)) e.push('buffs no es array');
  if (typeof DIFICULTADES !== 'undefined' && !DIFICULTADES[STATE.dificultad]) e.push('dificultad invalida: ' + STATE.dificultad);
  if (typeof STATE.xp !== 'number' || STATE.xp < 0) e.push('xp invalido: ' + STATE.xp);
  if (typeof STATE.oro !== 'number' || STATE.oro < 0) e.push('oro invalido: ' + STATE.oro);
  if (typeof STATE.xpTotal !== 'number' || STATE.xpTotal < 0) e.push('xpTotal invalido: ' + STATE.xpTotal);
  if (STATE.xpTotal < STATE.xp) e.push('xpTotal < xp (' + STATE.xpTotal + ' < ' + STATE.xp + ')');
  if (typeof STATE.mpMax !== 'number' || STATE.mpMax < 4 || STATE.mpMax > 8) e.push('mpMax fuera de [4,8]: ' + STATE.mpMax);
  if (typeof STATE.hpUpgrades !== 'number' || STATE.hpUpgrades < 0) e.push('hpUpgrades invalido: ' + STATE.hpUpgrades);
  if (!['guerrero','hechicero','arquero','alquimista'].includes(STATE.clase)) e.push('clase invalida: ' + STATE.clase);
  /* Campos adicionales */
  if (typeof STATE.resiliencia !== 'number' || STATE.resiliencia < 0 || STATE.resiliencia > 3) e.push('resiliencia fuera de [0,3]: ' + STATE.resiliencia);
  if (typeof STATE.tiradaGlobal !== 'number' || STATE.tiradaGlobal < 0) e.push('tiradaGlobal invalido: ' + STATE.tiradaGlobal);
  if (!Array.isArray(STATE.loreVisto)) e.push('loreVisto no es array');
  if (typeof STATE.skills !== 'object' || STATE.skills === null || Array.isArray(STATE.skills)) e.push('skills no es objeto');
  if (typeof STATE.diosaContador !== 'number' || STATE.diosaContador < 0) e.push('diosaContador invalido: ' + STATE.diosaContador);
  if (!STATE.stats || typeof STATE.stats !== 'object') e.push('stats no es objeto');
  else {
    if (!Array.isArray(STATE.stats.tiradas)) e.push('stats.tiradas no es array');
    if (typeof STATE.stats.derrotas !== 'number' || STATE.stats.derrotas < 0) e.push('stats.derrotas invalido');
  }

  return e;
}
window.checkStateInvariants = checkStateInvariants;
