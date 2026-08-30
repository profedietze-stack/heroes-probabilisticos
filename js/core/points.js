/* ══════════════════════════════════════════════════════════════
   points.js — Sistema de puntos global (todos los modos)
   Buckets separados: pts_aventura, pts_arcade, pts_libre
   Total = suma de los tres (para futura tabla de highscores)
══════════════════════════════════════════════════════════════ */

const POINTS_KEY = 'heroesProb_points';

const _PTS_DIF  = { facil:1.0, normal:1.5, heroe:2.0, legendario:3.0 };
const _PTS_MODE = { aventura:1.0, libre:1.0, arcade:1.2 };
const _PTS_BASE_OK   = 100;
const _PTS_BASE_FAIL = 30;

function ptsLoad() {
  try {
    const raw = localStorage.getItem(POINTS_KEY);
    return raw ? JSON.parse(raw) : { pts_aventura:0, pts_arcade:0, pts_libre:0 };
  } catch(e) { return { pts_aventura:0, pts_arcade:0, pts_libre:0 }; }
}

function _ptsSave(data) {
  try { localStorage.setItem(POINTS_KEY, JSON.stringify(data)); } catch(e) {}
}

/** Calcula delta de puntos sin guardar. */
function ptsCalc(correct, dif, modeKey) {
  const dm   = _PTS_DIF[dif]     || 1.0;
  const mm   = _PTS_MODE[modeKey] || 1.0;
  const base = correct ? _PTS_BASE_OK : -_PTS_BASE_FAIL;
  return Math.round(base * dm * mm);
}

/** Aplica delta al bucket correspondiente y guarda. Devuelve datos actualizados. */
function ptsAdd(delta, modeKey) {
  const d = ptsLoad();
  const field = modeKey === 'arcade' ? 'pts_arcade'
              : modeKey === 'libre'  ? 'pts_libre'
              :                        'pts_aventura';
  d[field] = (d[field] || 0) + delta;
  _ptsSave(d);
  return d;
}

/** Devuelve todos los buckets + total calculado. */
function ptsGet() {
  const d = ptsLoad();
  d.ptsTotal = (d.pts_aventura || 0) + (d.pts_arcade || 0) + (d.pts_libre || 0);
  return d;
}

/** Resetea todos los puntos (útil para debug). */
function ptsReset() {
  _ptsSave({ pts_aventura:0, pts_arcade:0, pts_libre:0 });
}
