/* ══════════════════════════════════════════════════════════════
   arcadeStats.js — Estadísticas del Modo Minijuegos
   Separado del save de historia. Nunca toca STATE.
══════════════════════════════════════════════════════════════ */

const ARCADE_STATS_KEY = 'heroesProb_arcadeStats';

function _arcadeStatsLoad() {
  try {
    const raw = localStorage.getItem(ARCADE_STATS_KEY);
    return raw ? JSON.parse(raw) : { arcade:{}, libre:{} };
  } catch(e) { return { arcade:{}, libre:{} }; }
}

function _arcadeStatsSave(data) {
  try { localStorage.setItem(ARCADE_STATS_KEY, JSON.stringify(data)); } catch(e) {}
}

/** Guarda resultado de una corrida arcade (7 rondas). */
function arcadeSaveRun(dif, score, total) {
  const d = _arcadeStatsLoad();
  if (!d.arcade[dif]) d.arcade[dif] = { best:0, played:0 };
  d.arcade[dif].played++;
  if (score > d.arcade[dif].best) d.arcade[dif].best = score;
  _arcadeStatsSave(d);
  if(typeof logrosEvent==='function') logrosEvent('arcade_run',{score});
}

/** Guarda resultado de una partida en modo libre. */
function arcadeSaveLibre(puzKey, dif, correct) {
  const d = _arcadeStatsLoad();
  if (!d.libre[puzKey]) d.libre[puzKey] = {};
  if (!d.libre[puzKey][dif]) d.libre[puzKey][dif] = { played:0, correct:0 };
  d.libre[puzKey][dif].played++;
  if (correct) d.libre[puzKey][dif].correct++;
  _arcadeStatsSave(d);
  if(typeof logrosEvent==='function') logrosEvent('libre_result',{puzKey,correct});
}

/** Devuelve stats de libre para un puzzle/dificultad. */
function arcadeGetLibre(puzKey, dif) {
  const d = _arcadeStatsLoad();
  return (d.libre[puzKey] && d.libre[puzKey][dif]) || { played:0, correct:0 };
}

/** Devuelve mejor puntaje arcade para una dificultad (null si nunca jugó). */
function arcadeGetBest(dif) {
  const d = _arcadeStatsLoad();
  return d.arcade[dif] ? d.arcade[dif] : null;
}
