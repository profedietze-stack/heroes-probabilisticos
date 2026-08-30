// js/ui/grimorio.js — Grimorio: Mejoras (HP/MP) + Árbol de habilidades

/* ── Títulos del héroe ─────────────────────────────────────────
   Basados en STATE.jefeActual (monstruos derrotados esta partida)
   ─────────────────────────────────────────────────────────────── */
const TITULOS_HEROE = [
  { min:0,  emoji:'🌱', titulo:'Novato de Arithmos',        desc:'El camino recién empieza.' },
  { min:1,  emoji:'🎲', titulo:'Aprendiz del Dado',          desc:'Primera sangre contra el azar.' },
  { min:2,  emoji:'🔢', titulo:'Iniciado Probabilístico',    desc:'Dos monstruos caídos, el camino se abre.' },
  { min:3,  emoji:'🗡', titulo:'Explorador del Azar',        desc:'Avanzas con decisión por Arithmos.' },
  { min:4,  emoji:'⚡', titulo:'Conocedor de la Suerte',     desc:'La probabilidad comienza a obedecerte.' },
  { min:5,  emoji:'🔮', titulo:'Maestro de la Media',        desc:'La mitad del camino, y Arithmos tiembla.' },
  { min:6,  emoji:'🌀', titulo:'Guardián de la Varianza',    desc:'Dominas la incertidumbre con maestría.' },
  { min:7,  emoji:'🏹', titulo:'Campeón de Laplace',         desc:'El Demiurgo siente el peso de tu avance.' },
  { min:8,  emoji:'💎', titulo:'Señor del Determinismo',     desc:'Casi nadie llega tan lejos.' },
  { min:9,  emoji:'🌟', titulo:'Leyenda de Arithmos',        desc:'Un solo paso separa a los elegidos.' },
  { min:10, emoji:'👑', titulo:'Héroe de la Probabilidad',   desc:'¡Arithmos ha sido restaurado!' },
];

function getTituloActual() {
  const n = STATE.jefeActual || 0;
  let t = TITULOS_HEROE[0];
  for (const tt of TITULOS_HEROE) { if (n >= tt.min) t = tt; else break; }
  return t;
}

const _RAMAS = [
  { key:'vitalidad', icon:'🛡', label:'Vitalidad' },
  { key:'sabotaje',  icon:'🗡', label:'Sabotaje'  },
  { key:'sabiduria', icon:'🔮', label:'Sabiduría'  },
];
const _TIPO = { pasivo:'Pasivo', activo:'Activo', reactivo:'Reactivo', postroll:'Post-tirada' };

let _gPage = 0;

/* ── Costos de upgrade MP ─────────────────────────────────── */
const _MP_COSTS = [40, 70, 110, 160]; // mp 4→5, 5→6, 6→7, 7→8

function _hpUpgradeCost() {
  return Math.round(25 * Math.pow(1.25, STATE.hpUpgrades || 0));
}
function _mpUpgradeCost() {
  const idx = (STATE.mpMax || 4) - 4;
  return idx < _MP_COSTS.length ? _MP_COSTS[idx] : null;
}

/* ── Página 0 izquierda: portada + título + resumen XP ─────── */
function _introPage() {
  const xpAvail  = STATE.xp || 0;
  const xpTotal  = STATE.xpTotal || 0;
  const nDerr    = STATE.jefeActual || 0;
  const titulo   = getTituloActual();

  const titulosHTML = TITULOS_HEROE.map(t => {
    const unlocked = nDerr >= t.min;
    const current  = t === titulo;
    return `<div style="display:flex;align-items:center;gap:6px;padding:3px 6px;
                        border-radius:3px;margin-bottom:2px;
                        ${current
                          ? 'background:linear-gradient(90deg,rgba(212,175,55,.22),rgba(212,175,55,.08));border-left:2px solid #c8a020;'
                          : 'border-left:2px solid transparent;'}
                        opacity:${unlocked ? 1 : 0.35}">
      <span style="font-size:13px;min-width:18px">${unlocked ? t.emoji : '🔒'}</span>
      <div style="flex:1;min-width:0">
        <span style="font-family:'Cinzel',serif;font-size:${current?'10.5':'9.5'}px;
                     color:${current?'#1e0e00':'#5a3200'};
                     font-weight:${current?'700':'400'};
                     ${unlocked&&!current?'':''}">
          ${t.titulo}
        </span>
        ${current ? `<div style="font-family:'Poppins',sans-serif;font-size:8.5px;color:#7a4a10;font-style:italic;margin-top:1px">${t.desc}</div>` : ''}
      </div>
      ${current ? `<span style="font-size:8px;color:#a07020;font-family:'Cinzel',serif;white-space:nowrap">◀ actual</span>` : ''}
    </div>`;
  }).join('');

  return `
    <div style="text-align:center;padding:4px 0 8px">
      <div style="font-size:24px;margin-bottom:4px">📖</div>
      <div style="font-family:'Cinzel',serif;font-size:14px;color:#1e0e00;font-weight:700;letter-spacing:2px">GRIMORIO</div>
      <div style="font-family:'Cinzel',serif;font-size:9px;color:#5a3200;letter-spacing:3px;margin-top:1px">DEL HÉROE</div>
    </div>

    <!-- Título actual destacado -->
    <div style="text-align:center;background:linear-gradient(135deg,rgba(212,175,55,.18),rgba(180,140,30,.08));
                border:1px solid rgba(212,175,55,.35);border-radius:5px;padding:9px 10px;margin-bottom:9px">
      <div style="font-size:22px;margin-bottom:3px">${titulo.emoji}</div>
      <div style="font-family:'Cinzel',serif;font-size:12.5px;color:#1e0e00;font-weight:700;letter-spacing:1px">${titulo.titulo}</div>
      <div style="font-family:'Poppins',sans-serif;font-size:10px;color:#7a4a10;margin-top:3px;font-style:italic">${titulo.desc}</div>
      <div style="font-family:'Poppins',sans-serif;font-size:9px;color:#9a6a30;margin-top:4px">
        ${nDerr} / 10 monstruos derrotados
      </div>
    </div>

    <!-- XP -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:9px">
      <div style="text-align:center;background:rgba(100,65,10,.14);border-radius:5px;padding:7px 4px">
        <div style="font-family:'Cinzel',serif;color:#5a3200;font-size:7.5px;letter-spacing:1px">XP TOTAL</div>
        <div style="font-family:'Cinzel',serif;color:#1e0e00;font-size:20px;font-weight:700">${xpTotal}</div>
      </div>
      <div style="text-align:center;background:rgba(100,65,10,.14);border-radius:5px;padding:7px 4px">
        <div style="font-family:'Cinzel',serif;color:#5a3200;font-size:7.5px;letter-spacing:1px">XP DISPONIBLE</div>
        <div style="font-family:'Cinzel',serif;color:#1e0e00;font-size:20px;font-weight:700">${xpAvail}</div>
      </div>
    </div>

    <!-- Progresión de títulos -->
    <div style="background:rgba(255,250,220,.45);border:1px solid rgba(100,65,10,.2);
                border-radius:5px;padding:8px 8px 6px;margin-bottom:0">
      <div style="font-family:'Cinzel',serif;font-size:8px;color:#5a3200;letter-spacing:2px;
                  margin-bottom:6px;text-align:center">TÍTULOS DEL HÉROE</div>
      ${titulosHTML}
    </div>`;
}

/* ── Página 0 derecha: mejoras HP/MP ───────────────────────── */
function _mejPage() {
  const xpAvail  = STATE.xp || 0;
  const hpU      = STATE.hpUpgrades || 0;
  const hpCost   = _hpUpgradeCost();
  const mpNow    = STATE.mpMax || 4;
  const mpCost   = _mpUpgradeCost();
  const canHp    = xpAvail >= hpCost;
  const canMp    = mpCost !== null && xpAvail >= mpCost;

  const btnStyle = (ok, accent) => `
    cursor:${ok?'pointer':'not-allowed'};
    background:${ok ? `linear-gradient(135deg,${accent}aa,${accent})` : '#9a8a7a'};
    color:${ok ? '#fff' : '#6b5a4a'};
    border:2px solid ${ok ? accent : '#806050'};
    border-radius:3px 3px 5px 5px;
    padding:5px 11px;
    font-family:'Cinzel',serif;font-size:10px;font-weight:700;
    white-space:nowrap;
    box-shadow:${ok?'0 2px 4px rgba(0,0,0,.3)':'none'}`;

  return `
    <div style="margin-bottom:9px;text-align:center;border-bottom:1px solid rgba(100,65,10,.3);padding-bottom:7px">
      <span style="font-size:20px">⚡</span>
      <span style="color:#1e0e00;font-family:'Cinzel',serif;font-size:13px;font-weight:700;letter-spacing:2px;margin-left:5px">MEJORAS</span>
    </div>

    <!-- HP upgrade -->
    <div style="margin:0 0 10px;padding:11px;background:rgba(255,250,220,.38);
                border:1px solid rgba(100,65,10,.22);border-left:3px solid rgba(200,50,50,.5);border-radius:3px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div style="flex:1;min-width:0">
          <b style="color:#1e0e00;font-family:'Cinzel',serif;font-size:12px">❤ Vitalidad</b>
          <p style="margin:4px 0 2px;color:#3d2005;font-family:'Poppins',sans-serif;font-size:10px;line-height:1.4">
            HP máx actual: <b>${STATE.hpMax}</b> &nbsp;·&nbsp; Mejoras compradas: <b>${hpU}</b>
          </p>
          <p style="margin:0;color:#5a3200;font-family:'Poppins',sans-serif;font-size:10px">
            Siguiente compra: +20 HP máx permanente
          </p>
        </div>
        <button onclick="window.__buyHp()" ${canHp?'':'disabled'} style="${btnStyle(canHp,'#c04040')}">
          ${canHp ? `↑ ${hpCost} XP` : `${hpCost} XP`}
        </button>
      </div>
    </div>

    <!-- MP upgrade -->
    <div style="margin:0 0 10px;padding:11px;background:rgba(255,250,220,.38);
                border:1px solid rgba(100,65,10,.22);border-left:3px solid rgba(50,80,200,.5);border-radius:3px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div style="flex:1;min-width:0">
          <b style="color:#1e0e00;font-family:'Cinzel',serif;font-size:12px">💠 Maná</b>
          <p style="margin:4px 0 2px;color:#3d2005;font-family:'Poppins',sans-serif;font-size:10px;line-height:1.4">
            MP máx actual: <b>${mpNow}</b> / 8
          </p>
          <p style="margin:0;color:#5a3200;font-family:'Poppins',sans-serif;font-size:10px">
            ${mpCost !== null ? 'Siguiente compra: +1 MP máx permanente' : 'MP máximo alcanzado'}
          </p>
        </div>
        ${mpCost !== null
          ? `<button onclick="window.__buyMp()" ${canMp?'':'disabled'} style="${btnStyle(canMp,'#2050b0')}">
               ${canMp ? `↑ ${mpCost} XP` : `${mpCost} XP`}
             </button>`
          : `<span style="color:#7a5520;font-family:'Cinzel',serif;font-size:10px;font-style:italic">✦ Máximo</span>`
        }
      </div>
    </div>

    <div style="background:rgba(100,65,10,.08);border-radius:5px;padding:8px;text-align:center">
      <p style="margin:0;color:#5a3200;font-family:'Poppins',sans-serif;font-size:10px;line-height:1.5">
        Las mejoras son permanentes para esta partida.<br>
        El costo de HP escala con cada compra. MP tiene tope en 8.
      </p>
    </div>`;
}

/* ── Carta de habilidad ─────────────────────────────────────── */
function _skillCard(p) {
  const rank  = skillRank(STATE.skills, p.id);
  const cost  = nextRankCost(STATE.skills, p.id);
  const isMax = cost === null;
  const ok    = !isMax && (STATE.xp || 0) >= cost;
  const pips  = [0,1,2].map(i =>
    `<span style="color:${i<rank?'#4a2800':'#b09060'};font-size:15px">${i<rank?'●':'○'}</span>`
  ).join('');
  const btn = isMax
    ? `<span style="color:#7a5520;font-family:'Cinzel',serif;font-size:10px;font-style:italic">✦ Máximo</span>`
    : `<button onclick="window.__buySkill('${p.id}')"
         ${ok?'':'disabled'}
         style="cursor:${ok?'pointer':'not-allowed'};
                background:${ok?'linear-gradient(135deg,#8b6914,#d4a820)':'#b09a6a'};
                color:${ok?'#1a0e00':'#6b5030'};
                border:2px solid ${ok?'#5a3e00':'#907850'};
                border-radius:3px 3px 5px 5px;
                padding:3px 9px;
                font-family:'Cinzel',serif;font-size:10px;font-weight:700;
                box-shadow:${ok?'0 2px 4px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,240,180,.35)':'none'}">
         ${ok ? `↑ ${cost} XP` : `${cost} XP`}
       </button>`;
  return `
    <div style="margin:5px 0;padding:7px 9px;
                background:rgba(255,250,220,.38);
                border:1px solid rgba(100,65,10,.22);border-left:3px solid rgba(100,65,10,.38);
                border-radius:3px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;flex-wrap:wrap">
            <b style="color:#1e0e00;font-family:'Cinzel',serif;font-size:11px">${p.nombre}</b>
            <span style="background:rgba(100,65,10,.12);color:#5a3200;font-size:9px;
                         padding:1px 5px;border-radius:2px;font-family:'Poppins',sans-serif;
                         white-space:nowrap">${_TIPO[p.tipo]||p.tipo}</span>
          </div>
          <div style="margin-bottom:3px;line-height:1">${pips}</div>
          <p style="margin:0;color:#3d2005;font-family:'Poppins',sans-serif;
                    font-size:10px;line-height:1.4">${p.desc}</p>
        </div>
        <div style="flex-shrink:0;padding-top:1px">${btn}</div>
      </div>
    </div>`;
}

/* ── Página de rama ─────────────────────────────────────────── */
function _branchPage(ramaKey) {
  const r = _RAMAS.find(x => x.key === ramaKey);
  const skills = SKILL_TREE.filter(p => p.rama === ramaKey);
  return `
    <div style="margin-bottom:9px;text-align:center;
                border-bottom:1px solid rgba(100,65,10,.3);padding-bottom:7px">
      <span style="font-size:20px">${r.icon}</span>
      <span style="color:#1e0e00;font-family:'Cinzel',serif;font-size:13px;
                   font-weight:700;letter-spacing:2px;margin-left:5px">${r.label}</span>
    </div>
    ${skills.map(_skillCard).join('')}`;
}

/* ── Diario de probabilidad: histograma de tiradas ──────────── */
function _diarioPage() {
  const tiradas = (STATE.stats && Array.isArray(STATE.stats.tiradas)) ? STATE.stats.tiradas : [];
  const n = tiradas.length;

  // Frecuencias observadas por suma (2..24)
  const obs = {};
  for (let k = 2; k <= 24; k++) obs[k] = 0;
  tiradas.forEach(t => { if (t && t.valor >= 2 && t.valor <= 24) obs[t.valor]++; });

  // Distribución teórica 2d12: P(k) = min(k-1, 25-k)/144
  const teo = {};
  for (let k = 2; k <= 24; k++) teo[k] = Math.min(k - 1, 25 - k) / 144;

  const maxObs = Math.max(1, ...Object.values(obs));
  const maxTeoCount = Math.max(...Object.values(teo)) * Math.max(n, 1); // esperado en pico
  const maxY = Math.max(maxObs, n > 0 ? maxTeoCount : 1);

  const H = 92; // altura útil del gráfico en px
  let barras = '';
  for (let k = 2; k <= 24; k++) {
    const hObs = Math.round((obs[k] / maxY) * H);
    const hTeo = n > 0 ? Math.round((teo[k] * n / maxY) * H) : Math.round(teo[k] * 144 / 12 * H / 2);
    barras += `
      <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:${H + 14}px;position:relative">
        <div title="Esperado" style="position:absolute;bottom:${14 + hTeo - 1}px;left:10%;right:10%;height:2px;background:#8b2500;opacity:.75;border-radius:1px"></div>
        <div title="${obs[k]} veces" style="width:70%;height:${hObs}px;background:linear-gradient(180deg,#c8a020,#8b6914);border-radius:2px 2px 0 0;min-height:${obs[k] > 0 ? 2 : 0}px"></div>
        <div style="font-family:'Poppins',sans-serif;font-size:6.5px;color:#5a3200;height:14px;line-height:14px">${k % 2 === 0 ? k : ''}</div>
      </div>`;
  }

  // Media observada vs teórica (13)
  const media = n > 0 ? (tiradas.reduce((s, t) => s + (t.valor || 0), 0) / n).toFixed(2) : '—';

  return `
    <div style="margin-bottom:8px;text-align:center;border-bottom:1px solid rgba(100,65,10,.3);padding-bottom:6px">
      <span style="font-size:18px">📊</span>
      <span style="color:#1e0e00;font-family:'Cinzel',serif;font-size:13px;font-weight:700;letter-spacing:2px;margin-left:5px">DIARIO DE PROBABILIDAD</span>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
      <div style="text-align:center;background:rgba(100,65,10,.12);border-radius:5px;padding:6px 4px">
        <div style="font-family:'Cinzel',serif;color:#5a3200;font-size:7.5px;letter-spacing:1px">TIRADAS</div>
        <div style="font-family:'Cinzel',serif;color:#1e0e00;font-size:18px;font-weight:700">${n}</div>
      </div>
      <div style="text-align:center;background:rgba(100,65,10,.12);border-radius:5px;padding:6px 4px">
        <div style="font-family:'Cinzel',serif;color:#5a3200;font-size:7.5px;letter-spacing:1px">TU MEDIA · TEÓRICA</div>
        <div style="font-family:'Cinzel',serif;color:#1e0e00;font-size:18px;font-weight:700">${media} <span style="font-size:11px;color:#8b2500">· 13</span></div>
      </div>
    </div>

    <div style="background:rgba(255,250,220,.5);border:1px solid rgba(100,65,10,.22);border-radius:5px;padding:8px 6px 4px">
      ${n === 0
        ? `<p style="margin:8px 4px;text-align:center;color:#8a6a40;font-family:'Poppins',sans-serif;font-size:10px;font-style:italic">
             Todavía no hay tiradas registradas.<br>¡Peleá contra un monstruo y volvé!</p>`
        : `<div style="display:flex;align-items:flex-end;gap:1px">${barras}</div>`}
    </div>

    <div style="margin-top:7px;background:rgba(100,65,10,.08);border-radius:5px;padding:7px 9px">
      <p style="margin:0;color:#3d2005;font-family:'Poppins',sans-serif;font-size:9.5px;line-height:1.5">
        <span style="display:inline-block;width:8px;height:8px;background:#c8a020;border-radius:1px;vertical-align:-1px"></span> Tus tiradas &nbsp;·&nbsp;
        <span style="display:inline-block;width:12px;height:2px;background:#8b2500;vertical-align:2px"></span> Distribución teórica del 2d12.<br>
        Cuantas más tiradas hagas, más se parecerán las barras a la curva teórica:
        es la <b>Ley de los Grandes Números</b> actuando en tu propia partida.
      </p>
    </div>`;
}

/* ── Glosario matemático ────────────────────────────────────── */
const _GLOSARIO = [
  { t:'Probabilidad de Laplace', d:'Casos favorables ÷ casos posibles. Con 2d12 hay 144 combinaciones: si 78 te sirven, tu probabilidad es 78/144 ≈ 54%.' },
  { t:'Casos favorables', d:'Las combinaciones que cumplen lo que buscás. Para "suma ≥ 13" hay 78 de las 144 posibles.' },
  { t:'Media (esperanza)', d:'El promedio de todos los resultados posibles pesados por su probabilidad. En 2d12 la media es 13: si tirás muchas veces, tu promedio se acerca a ese valor.' },
  { t:'Varianza', d:'Mide cuánto se alejan los resultados de la media. Varianza alta = resultados impredecibles (como el Espectro).' },
  { t:'Desviación estándar (σ)', d:'La raíz de la varianza: cuánto se desvía una tirada "típica" de la media. En 2d12, σ ≈ 3.45.' },
  { t:'Distribución', d:'El mapa completo de qué valores pueden salir y con qué probabilidad. La del 2d12 es triangular: pico en 13, mínimos en 2 y 24.' },
  { t:'Distribución normal', d:'La famosa "campana de Gauss": simétrica, concentrada en el centro. El 68% de los datos cae a menos de 1σ de la media.' },
  { t:'Ley de los Grandes Números', d:'Cuantas más veces repetís un experimento, más se acercan tus frecuencias a las probabilidades teóricas. ¡Miralo en tu Diario de Probabilidad!' },
  { t:'Eventos independientes', d:'Cuando el resultado de uno no afecta al otro. Cada dado ignora al anterior: no existe "estar caliente" ni "ya me toca".' },
  { t:'Frecuencia observada vs esperada', d:'Lo que SALIÓ vs lo que DEBERÍA salir según la teoría. La prueba Chi-Cuadrada (χ²) mide si la diferencia es demasiado grande para ser azar.' },
  { t:'Ensayo de Bernoulli', d:'Experimento con solo dos resultados: éxito o fracaso. Tirar "¿suma ≥ 13?" es un Bernoulli con p ≈ 0.54.' },
  { t:'Distribución de Poisson', d:'Modela cuántas veces ocurre un evento raro en un intervalo: llegadas, fallas, apariciones del Espíritu…' },
];

function _glosarioPage(desde, hasta, nro) {
  const items = _GLOSARIO.slice(desde, hasta).map(g => `
    <div style="margin:0 0 7px;padding:7px 9px;background:rgba(255,250,220,.4);
                border:1px solid rgba(100,65,10,.18);border-left:3px solid rgba(139,105,20,.5);border-radius:3px">
      <b style="color:#1e0e00;font-family:'Cinzel',serif;font-size:10.5px">${g.t}</b>
      <p style="margin:3px 0 0;color:#3d2005;font-family:'Poppins',sans-serif;font-size:9.5px;line-height:1.5">${g.d}</p>
    </div>`).join('');
  return `
    <div style="margin-bottom:8px;text-align:center;border-bottom:1px solid rgba(100,65,10,.3);padding-bottom:6px">
      <span style="font-size:17px">📚</span>
      <span style="color:#1e0e00;font-family:'Cinzel',serif;font-size:12px;font-weight:700;letter-spacing:2px;margin-left:5px">GLOSARIO ${nro}</span>
    </div>
    ${items}`;
}

/* ── Bestiario ──────────────────────────────────────────────── */
function _bestiaPage(idx) {
  const m    = (typeof MONSTERS !== 'undefined') ? MONSTERS[idx] : null;
  const lore = (typeof MONSTER_LORE !== 'undefined') ? MONSTER_LORE[idx] : null;
  if (!m) return '';
  const derrotado = (STATE.jefeActual || 0) > idx;

  // Retrato SVG real del monstruo (builders de monster-svg.js)
  let retrato = '';
  if (typeof _SVG_BUILDERS !== 'undefined' && _SVG_BUILDERS[m.forma]) {
    if (typeof _injectMonsterCSS === 'function') _injectMonsterCSS();
    const inner = _SVG_BUILDERS[m.forma](m.color);
    retrato = `<svg viewBox="0 0 200 240" width="90" height="108"
                    style="${derrotado ? '' : 'filter:brightness(0) opacity(.45);'}"
                    xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  }

  if (!derrotado) {
    return `
      <div style="text-align:center;padding:8px 0 4px">
        <div style="display:inline-block">${retrato}</div>
        <div style="font-family:'Cinzel',serif;font-size:13px;color:#5a3200;font-weight:700;letter-spacing:1px;margin-top:4px">? ? ?</div>
        <div style="font-family:'Poppins',sans-serif;font-size:10px;color:#8a6a40;font-style:italic;margin-top:6px">
          Monstruo ${idx+1} de 10 — aún no derrotado.
        </div>
        <div style="font-family:'Poppins',sans-serif;font-size:10px;color:#9a7a50;margin-top:10px">
          🔒 Derrotalo en batalla para revelar su página.
        </div>
      </div>`;
  }

  return `
    <div style="text-align:center;padding:2px 0 4px">
      <div style="display:inline-block">${retrato}</div>
      <div style="font-family:'Cinzel',serif;font-size:12.5px;color:#1e0e00;font-weight:700;letter-spacing:1px">${m.nombre}</div>
      <div style="font-family:'Poppins',sans-serif;font-size:9px;color:#9a6a30;margin-top:1px">Monstruo ${idx+1} de 10 · ✔ Derrotado</div>
    </div>
    <div style="display:flex;justify-content:center;gap:10px;margin:6px 0 8px;font-family:'Poppins',sans-serif;font-size:9px;color:#5a3200">
      <span>❤ ${m.hpMax}</span><span>⚔ ${m.ataque}</span><span>🛡 ${m.defensa}</span><span>🎯 umbral ${m.umbral}</span>
    </div>
    ${lore ? `
    <div style="background:rgba(255,250,220,.45);border:1px solid rgba(100,65,10,.2);border-radius:5px;padding:8px 10px;margin-bottom:7px">
      <p style="margin:0;color:#3d2005;font-family:'Poppins',sans-serif;font-size:9.5px;line-height:1.5;font-style:italic">${lore.historia}</p>
    </div>
    <div style="background:rgba(100,65,10,.1);border-radius:5px;padding:7px 10px">
      <p style="margin:0;color:#1e0e00;font-family:'Poppins',sans-serif;font-size:9.5px;line-height:1.5"><b>Dato:</b> ${lore.dato}</p>
    </div>` : ''}`;
}

/* ── HTML del libro ─────────────────────────────────────────── */
function _grimorioHTML() {
  const spreads = [
    { left: _introPage(),             right: _mejPage() },
    { left: _branchPage('vitalidad'), right: _branchPage('sabotaje') },
    { left: _branchPage('sabiduria'), right: _diarioPage() },
    { left: _glosarioPage(0, 6, 'I'),  right: _glosarioPage(6, 12, 'II') },
    { left: _bestiaPage(0), right: _bestiaPage(1) },
    { left: _bestiaPage(2), right: _bestiaPage(3) },
    { left: _bestiaPage(4), right: _bestiaPage(5) },
    { left: _bestiaPage(6), right: _bestiaPage(7) },
    { left: _bestiaPage(8), right: _bestiaPage(9) },
  ];
  const n = spreads.length;
  const s = spreads[_gPage];

  const pageLines = `repeating-linear-gradient(0deg,transparent,transparent 22px,rgba(100,65,10,.055) 22px,rgba(100,65,10,.055) 23px)`;
  const pageBg    = `linear-gradient(165deg,#f8eecc 0%,#f0e2ac 45%,#e7d59a 100%)`;
  const pageSt    = `flex:1;min-width:0;padding:14px 13px;overflow-y:auto;background:${pageLines},${pageBg};`;

  return `
<style>
  #itemModal .item-modal{max-width:840px!important}
  .gp::-webkit-scrollbar{width:4px}
  .gp::-webkit-scrollbar-track{background:rgba(100,65,10,.08)}
  .gp::-webkit-scrollbar-thumb{background:rgba(100,65,10,.28);border-radius:2px}
</style>

<div style="display:flex;align-items:stretch;min-height:300px;
            box-shadow:0 6px 32px rgba(0,0,0,.55);border-radius:3px 3px 0 0;overflow:hidden">

  <!-- Página izquierda -->
  <div class="gp" style="${pageSt}max-height:60vh;box-shadow:inset -6px 0 14px rgba(100,65,10,.1)">
    ${s.left}
  </div>

  <!-- Lomo -->
  <div style="width:22px;flex-shrink:0;
              background:linear-gradient(90deg,#7a4020 0%,#3a1c0c 35%,#2e1508 50%,#3a1c0c 65%,#7a4020 100%);
              box-shadow:inset 0 0 6px rgba(0,0,0,.5)"></div>

  <!-- Página derecha -->
  <div class="gp" style="${pageSt}max-height:60vh;box-shadow:inset 6px 0 14px rgba(100,65,10,.1)">
    ${s.right}
  </div>
</div>

<!-- Barra de navegación -->
<div style="display:flex;justify-content:space-between;align-items:center;
            padding:7px 12px;
            background:linear-gradient(90deg,#1a0e05,#0d0704,#1a0e05);
            border-top:1px solid rgba(100,65,10,.3);border-radius:0 0 3px 3px">

  <button onclick="window.__gNav(-1)" ${_gPage>0?'':'disabled'}
    style="background:none;border:1px solid rgba(212,175,55,${_gPage>0?.4:.15});
           color:${_gPage>0?'#D4AF37':'#4a3515'};
           font-family:'Cinzel',serif;font-size:12px;padding:4px 12px;
           border-radius:3px;cursor:${_gPage>0?'pointer':'default'}">◁ Anterior</button>

  <span style="color:#7a5520;font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px">
    ${_gPage+1} / ${n}
  </span>

  <div style="display:flex;gap:8px">
    ${_gPage < n-1
      ? `<button onclick="window.__gNav(1)"
           style="background:none;border:1px solid rgba(212,175,55,.4);color:#D4AF37;
                  font-family:'Cinzel',serif;font-size:12px;padding:4px 12px;
                  border-radius:3px;cursor:pointer">Siguiente ▷</button>`
      : ''}
    <button onclick="closeItemModal()"
      style="background:linear-gradient(135deg,#3a1c0c,#6b3a1f);color:#D4AF37;
             border:1px solid rgba(212,175,55,.4);font-family:'Cinzel',serif;
             font-size:11px;padding:4px 12px;border-radius:3px;cursor:pointer">✕ Cerrar</button>
  </div>
</div>`;
}

/* ── API pública ────────────────────────────────────────────── */
function openGrimorio() {
  _gPage = 0;

  window.__buySkill = (id) => {
    if (buySkill(STATE, id)) {
      if (typeof saveGame === 'function') saveGame();
      if (typeof logrosEvent === 'function') logrosEvent('skillComprada', { rank: STATE.skills[id] });
      openItemModal(_grimorioHTML());
    }
  };

  window.__buyHp = () => {
    const cost = _hpUpgradeCost();
    if ((STATE.xp || 0) < cost) return;
    STATE.xp         -= cost;
    STATE.hpUpgrades  = (STATE.hpUpgrades || 0) + 1;
    STATE.hpMax      += 20;
    STATE.hp          = Math.min(STATE.hp + 20, STATE.hpMax);
    if (typeof saveGame === 'function') saveGame();
    if (typeof showToast === 'function') showToast(`❤ HP máx +20 → ${STATE.hpMax}`);
    openItemModal(_grimorioHTML());
  };

  window.__buyMp = () => {
    const cost = _mpUpgradeCost();
    if (cost === null || (STATE.xp || 0) < cost) return;
    STATE.xp    -= cost;
    STATE.mpMax  = (STATE.mpMax || 4) + 1;
    if (typeof saveGame === 'function') saveGame();
    if (typeof showToast === 'function') showToast(`💠 MP máx +1 → ${STATE.mpMax}`);
    openItemModal(_grimorioHTML());
  };

  window.__gNav = (dir) => {
    _gPage = Math.max(0, Math.min(8, _gPage + dir));
    openItemModal(_grimorioHTML());
    _checkGlosarioVisto();
  };

  openItemModal(_grimorioHTML());
  _bindGrimorioSwipe();
  _checkGlosarioVisto();
}

/* El spread índice 3 muestra el glosario completo (I y II) en una sola vista. */
function _checkGlosarioVisto(){
  if (_gPage === 3 && typeof logrosEvent === 'function') logrosEvent('glosarioVisto');
}

/* Swipe táctil izq/der sobre el modal para pasar página (tablet). Botones ◁▷ siguen funcionando. */
function _bindGrimorioSwipe(){
  const modal = document.getElementById('itemModal');
  if (!modal || modal._gSwipeBound) return;
  modal._gSwipeBound = true;
  let sx = 0, sy = 0, t0 = 0;
  modal.addEventListener('touchstart', (e) => {
    if (!modal.classList.contains('active')) return;
    const p = e.changedTouches[0];
    sx = p.clientX; sy = p.clientY; t0 = Date.now();
  }, { passive: true });
  modal.addEventListener('touchend', (e) => {
    if (!modal.classList.contains('active') || typeof window.__gNav !== 'function') return;
    const p = e.changedTouches[0];
    const dx = p.clientX - sx, dy = p.clientY - sy, dt = Date.now() - t0;
    if (dt < 900 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      window.__gNav(dx < 0 ? 1 : -1);
    }
  }, { passive: true });
}
