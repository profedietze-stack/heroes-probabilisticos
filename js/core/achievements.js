/* ================================================================
   achievements.js — Sistema de Logros y Estadísticas Persistentes
   Storage: heroesProb_logros (independiente del save de historia)
   No se borra con clearSave().
================================================================ */

const LOGROS_KEY = 'heroesProb_logros';

const _DIF_ORDER = { facil:0, normal:1, heroe:2, legendario:3 };
const _DIF_BONUS  = { facil:0, normal:10, heroe:25, legendario:40 };

const _PUZZLE_KEYS = ['PuzzleUrna','PuzzleMoneda','PuzzleApuesta','PuzzleRuleta','PuzzleDados','PuzzlePuertas','PuzzleTesoro'];

const LOGROS_DEF = [
  // — COMBATE —
  { id:'primera_victoria', emoji:'⚔️',  nombre:'Primera Sangre',         cat:'Combate',
    desc:'Derrotá tu primer monstruo matemático.' },
  { id:'cinco_victorias',  emoji:'🏆',  nombre:'Veterano',               cat:'Combate',
    desc:'Derrotá 5 monstruos en total (acumulado entre todas las partidas).' },
  { id:'demiurgo',         emoji:'👑',  nombre:'Héroe de Arithmos',      cat:'Combate',
    desc:'Derrotá al Demiurgo del Determinismo y completá la campaña completa.' },
  { id:'sin_objetos',      emoji:'🎯',  nombre:'Manos Limpias',          cat:'Combate',
    desc:'Derrotá un monstruo sin usar ningún objeto durante esa batalla.' },
  { id:'borde_muerte',     emoji:'❤️',  nombre:'Al Filo del Abismo',     cat:'Combate',
    desc:'Terminá una batalla victoriosa con 5 HP o menos.' },
  { id:'suma_maxima',      emoji:'🎲',  nombre:'Máxima Potencia',        cat:'Combate',
    desc:'Sacá 24 (doble 12) en una sola tirada de combate.' },
  { id:'maldicion',        emoji:'💀',  nombre:'Golpe del Destino',      cat:'Combate',
    desc:'Sufrí la Maldición del Doble 1 (probabilidad: 1/144 ≈ 0.69%).' },
  { id:'cien_tiradas',     emoji:'🔢',  nombre:'Centenar de Dados',      cat:'Combate',
    desc:'Realizá 100 tiradas de combate en total (acumulado).' },
  { id:'sin_daño',         emoji:'🛡️',  nombre:'Escudo Perfecto',        cat:'Combate',
    desc:'Completá una batalla entera sin recibir ningún daño del monstruo.' },
  { id:'racha_3',          emoji:'🔥',  nombre:'Racha Imparable',        cat:'Combate',
    desc:'Derrotá 3 monstruos consecutivos sin sufrir ninguna derrota entre ellos.' },
  // — HABILIDADES —
  { id:'primera_skill',    emoji:'✨',  nombre:'Primer Poder',           cat:'Habilidades',
    desc:'Comprá tu primera habilidad en el Grimorio de Poderes.' },
  { id:'skill_max',        emoji:'⭐',  nombre:'Maestría',              cat:'Habilidades',
    desc:'Llevá cualquier habilidad al rango 3 (nivel máximo).' },
  { id:'dado_sagrado_5',   emoji:'💚',  nombre:'Bendición Divina',       cat:'Habilidades',
    desc:'Usá el Dado Sagrado 5 veces en total (acumulado).' },
  // — PUZZLES —
  { id:'primer_puzzle',    emoji:'🧩',  nombre:'Primer Acertijo',        cat:'Puzzles',
    desc:'Respondé correctamente tu primer puzzle matemático.' },
  { id:'arcade_completo',  emoji:'🎡',  nombre:'Explorador del Azar',    cat:'Puzzles',
    desc:'Completá el Modo Arcade (los 7 puzzles en secuencia).' },
  { id:'arcade_oro',       emoji:'🥇',  nombre:'Maestro del Azar',       cat:'Puzzles',
    desc:'Obtené rango ORO en el Modo Arcade (6 o más aciertos de 7).' },
  { id:'todos_puzzles',    emoji:'📚',  nombre:'Enciclopedia Viva',      cat:'Puzzles',
    desc:'Ganá cada uno de los 7 puzzles al menos una vez en Modo Libre.' },
  { id:'maestro_puzzle',   emoji:'👑',  nombre:'Corona de Sabiduría',    cat:'Puzzles',
    desc:'Dominá 3 puzzles distintos (70%+ aciertos en 3 o más intentos en Modo Libre).' },
  // — DEDICACION —
  { id:'media_hora',       emoji:'⏱️',  nombre:'Aprendiz Dedicado',      cat:'Dedicación',
    desc:'Jugá 30 minutos en total (acumulado en todas las sesiones).' },
  { id:'una_hora',         emoji:'⌛',  nombre:'Estudioso Comprometido', cat:'Dedicación',
    desc:'Jugá 1 hora en total (acumulado en todas las sesiones).' },
  // — CONCEPTOS —
  { id:'buho_perfecto',    emoji:'🦉',  nombre:'Sabiduría del Búho',     cat:'Conceptos',
    desc:'Respondé correctamente las 10 preguntas de sabiduría del mapa.' },
  { id:'glosario_completo',emoji:'📘',  nombre:'Bibliotecario',          cat:'Conceptos',
    desc:'Consultá el glosario matemático completo en el Grimorio.' },
  { id:'precision_laplace',emoji:'🎯',  nombre:'Precisión de Laplace',   cat:'Conceptos',
    desc:'Terminá la campaña con una media de tiradas a ±0.5 del valor esperado (13).' },
];

/* ── Estado en memoria ───────────────────────────────────────── */
let _logros = null;

function _logrosDefault(){
  return {
    desbloqueados: {},
    stats: {
      totalTiradas:        0,
      totalVictorias:      0,
      totalDerrotas:       0,
      maxJefeDerrotado:    -1,
      campañasCompletadas: 0,
      tiempoTotalMs:       0,
      sesionInicio:        Date.now(),
      dadoSagradoUsos:     0,
      victoriasSeguidas:   0,
      maxVictoriasSeguidas:0,
      mejorDificultad:     'normal',
      quizCorrectas:       {},
    }
  };
}

function logrosLoad(){
  try {
    const raw = localStorage.getItem(LOGROS_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    const def = _logrosDefault();
    _logros = {
      desbloqueados: saved.desbloqueados || {},
      stats: Object.assign(def.stats, saved.stats || {})
    };
    _logros.stats.sesionInicio = Date.now();
  } catch(e) { _logros = _logrosDefault(); }
}

function logrosSave(){
  try { localStorage.setItem(LOGROS_KEY, JSON.stringify(_logros)); } catch(e) {}
}

function logrosGet(){ if(!_logros) logrosLoad(); return _logros; }

function _acumularTiempo(){
  if(!_logros) return;
  const now = Date.now();
  const elapsed = now - (_logros.stats.sesionInicio || now);
  _logros.stats.tiempoTotalMs = (_logros.stats.tiempoTotalMs||0) + Math.max(0, elapsed);
  _logros.stats.sesionInicio = now;
}

/* ── Toast de logro desbloqueado ─────────────────────────────── */
function _showLogroToast(def){
  let el = document.getElementById('_logroToastBanner');
  if(!el){
    el = document.createElement('div');
    el.id = '_logroToastBanner';
    el.style.cssText = [
      'position:fixed','bottom:90px','left:50%',
      'transform:translateX(-50%) translateY(20px)',
      'background:linear-gradient(135deg,#0e1220,#1a1830)',
      'border:2px solid #D4AF37','border-radius:14px',
      'padding:12px 22px','z-index:99999',
      'opacity:0','transition:all 0.4s cubic-bezier(.2,.8,.3,1)',
      'text-align:center','min-width:260px','pointer-events:none',
      'box-shadow:0 4px 24px rgba(212,175,55,0.25)'
    ].join(';');
    document.body.appendChild(el);
  }
  el.innerHTML =
    '<div style="font-size:10px;color:#D4AF37;font-family:Poppins,sans-serif;font-weight:700;letter-spacing:2px;margin-bottom:4px">LOGRO DESBLOQUEADO</div>' +
    '<div style="font-size:18px;margin:2px 0">' + def.emoji + ' <span style="color:#fff;font-family:Cinzel,serif;font-weight:700">' + def.nombre + '</span></div>' +
    '<div style="font-size:12px;color:#9eb5c8;margin-top:4px">' + def.desc + '</div>';
  el.style.opacity = '1';
  el.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(el._to);
  el._to = setTimeout(function(){ el.style.opacity='0'; el.style.transform='translateX(-50%) translateY(20px)'; }, 4200);
}

/* ── Desbloquear logro ───────────────────────────────────────── */
function unlockLogro(id){
  if(!_logros) logrosLoad();
  if(_logros.desbloqueados[id]) return false;
  _logros.desbloqueados[id] = Date.now();
  logrosSave();
  const def = LOGROS_DEF.find(function(l){ return l.id===id; });
  if(def) _showLogroToast(def);
  return true;
}

/* ── Checks auxiliares ───────────────────────────────────────── */
function _checkTodosPuzzles(){
  try {
    const d2 = _arcadeStatsLoad();
    const ganados = _PUZZLE_KEYS.filter(function(k){
      const puzData = d2.libre[k];
      return puzData && Object.values(puzData).some(function(dif){ return dif.correct > 0; });
    });
    if(ganados.length >= 7) unlockLogro('todos_puzzles');
  } catch(e){}
}

function _checkMaestroPuzzle(){
  try {
    const d2 = _arcadeStatsLoad();
    let dominados = 0;
    _PUZZLE_KEYS.forEach(function(k){
      const puzData = d2.libre[k];
      if(!puzData) return;
      const allPlayed  = Object.values(puzData).reduce(function(a,x){ return a+x.played; }, 0);
      const allCorrect = Object.values(puzData).reduce(function(a,x){ return a+x.correct; }, 0);
      if(allPlayed >= 3 && allCorrect/allPlayed >= 0.7) dominados++;
    });
    if(dominados >= 3) unlockLogro('maestro_puzzle');
  } catch(e){}
}

/* ── API principal: disparar evento ─────────────────────────── */
function logrosEvent(type, data){
  data = data || {};
  if(!_logros) logrosLoad();
  const s = _logros.stats;
  const d = _logros.desbloqueados;

  if(type === 'victoria'){
    s.totalVictorias = (s.totalVictorias||0) + 1;
    s.victoriasSeguidas = (s.victoriasSeguidas||0) + 1;
    s.maxVictoriasSeguidas = Math.max(s.maxVictoriasSeguidas||0, s.victoriasSeguidas);
    if(typeof data.jefe === 'number')
      s.maxJefeDerrotado = Math.max(s.maxJefeDerrotado||-1, data.jefe);
    if(data.esFinal){
      s.campañasCompletadas = (s.campañasCompletadas||0) + 1;
      try {
        const rolls = (typeof STATE !== 'undefined' && STATE.stats && STATE.stats.tiradas) || [];
        if(rolls.length > 0){
          const media = rolls.reduce(function(a,t){ return a+t.valor; }, 0) / rolls.length;
          if(Math.abs(media - 13) <= 0.5 && !d.precision_laplace) unlockLogro('precision_laplace');
        }
      } catch(e){}
    }
    // Guardar mejor dificultad
    const curDif = (typeof STATE !== 'undefined' && STATE.dificultad) ? STATE.dificultad : 'normal';
    if((_DIF_ORDER[curDif]||0) > (_DIF_ORDER[s.mejorDificultad||'normal']||0))
      s.mejorDificultad = curDif;
    _acumularTiempo();
    logrosSave();
    if(!d.primera_victoria)                          unlockLogro('primera_victoria');
    if(s.totalVictorias >= 5 && !d.cinco_victorias) unlockLogro('cinco_victorias');
    if(data.esFinal && !d.demiurgo)                 unlockLogro('demiurgo');
    if(data.sinObjetos && !d.sin_objetos)           unlockLogro('sin_objetos');
    if(data.sinDaño && !d.sin_daño)                 unlockLogro('sin_daño');
    if(data.hpFinal <= 5 && !d.borde_muerte)        unlockLogro('borde_muerte');
    if(s.victoriasSeguidas >= 3 && !d.racha_3)      unlockLogro('racha_3');
  }

  if(type === 'derrota'){
    s.totalDerrotas = (s.totalDerrotas||0) + 1;
    s.victoriasSeguidas = 0;
    _acumularTiempo();
    logrosSave();
  }

  if(type === 'tirada'){
    s.totalTiradas = (s.totalTiradas||0) + 1;
    if(data.suma === 24 && !d.suma_maxima)            unlockLogro('suma_maxima');
    if(data.d1 === 1 && data.d2 === 1 && !d.maldicion) unlockLogro('maldicion');
    if(s.totalTiradas >= 100 && !d.cien_tiradas)      unlockLogro('cien_tiradas');
    logrosSave();
  }

  if(type === 'dadoSagrado'){
    s.dadoSagradoUsos = (s.dadoSagradoUsos||0) + 1;
    if(s.dadoSagradoUsos >= 5 && !d.dado_sagrado_5) unlockLogro('dado_sagrado_5');
    logrosSave();
  }

  if(type === 'skillComprada'){
    if(!d.primera_skill)                   unlockLogro('primera_skill');
    if(data.rank >= 3 && !d.skill_max)    unlockLogro('skill_max');
    logrosSave();
  }

  if(type === 'arcade_run'){
    if(!d.arcade_completo) unlockLogro('arcade_completo');
    if((data.score||0) >= 6 && !d.arcade_oro) unlockLogro('arcade_oro');
  }

  if(type === 'libre_result'){
    if(data.correct && !d.primer_puzzle) unlockLogro('primer_puzzle');
    _checkTodosPuzzles();
    _checkMaestroPuzzle();
  }

  if(type === 'quizCorrecta'){
    s.quizCorrectas = s.quizCorrectas || {};
    s.quizCorrectas[data.qi] = true;
    if(Object.keys(s.quizCorrectas).length >= 10 && !d.buho_perfecto) unlockLogro('buho_perfecto');
    logrosSave();
  }

  if(type === 'glosarioVisto'){
    if(!d.glosario_completo) unlockLogro('glosario_completo');
  }

  if(type === 'tiempo'){
    _acumularTiempo();
    const ms = _logros.stats.tiempoTotalMs;
    if(ms >= 30*60*1000 && !d.media_hora) unlockLogro('media_hora');
    if(ms >= 60*60*1000 && !d.una_hora)  unlockLogro('una_hora');
    logrosSave();
  }
}

/* ── Puntaje 0-1000 ──────────────────────────────────────────── */
function calcScore(){
  if(!_logros) logrosLoad();
  const s = _logros.stats;
  const d = _logros.desbloqueados;
  let score = 0;

  // 1. Progresión campaña (max 300): jefes derrotados / 10 × 300
  const maxJefe = Math.max(s.maxJefeDerrotado||-1, 0);
  score += Math.min(Math.round((maxJefe + 1) / 10 * 300), 300);

  // 2. Ratio de combate (max 150)
  const tv = s.totalVictorias||0, td = s.totalDerrotas||0;
  const totalB = tv + td;
  const winRate = totalB > 0 ? tv / totalB : 0;
  score += Math.min(Math.round(winRate * 150), 150);

  // 3. Puzzles (max 200): arcade + libre únicos, cap 200
  var arcadeData = null;
  try { arcadeData = _arcadeStatsLoad(); } catch(e) { arcadeData = {arcade:{},libre:{}}; }
  const allDifs = ['facil','normal','heroe','legendario'];
  let bestArcade = 0;
  allDifs.forEach(function(dif){
    if(arcadeData.arcade[dif]) bestArcade = Math.max(bestArcade, arcadeData.arcade[dif].best||0);
  });
  const arcadeScore = bestArcade >= 6 ? 150 : bestArcade >= 4 ? 100 : bestArcade >= 2 ? 60 : 0;
  let libreUnicos = 0;
  _PUZZLE_KEYS.forEach(function(k){
    const pd = arcadeData.libre[k];
    if(pd && Object.values(pd).some(function(x){ return x.correct>0; })) libreUnicos++;
  });
  score += Math.min(arcadeScore + libreUnicos * 7, 200);

  // 4. Logros desbloqueados (max 200): 20 logros × 10 pts
  const numLogros = Object.keys(d).length;
  score += Math.min(numLogros * 10, 200);

  // 5. Skills compradas (max 100): suma de ranks × 8, cap 100
  if(typeof STATE !== 'undefined' && STATE.skills){
    const totalRanks = Object.values(STATE.skills).reduce(function(a,b){ return a+(b||0); }, 0);
    score += Math.min(totalRanks * 8, 100);
  }

  // 6. Tiempo jugado (max 50): 1 hora = 50 pts
  const tiempoHoras = (_logros.stats.tiempoTotalMs||0) / 3600000;
  score += Math.min(Math.round(tiempoHoras * 50), 50);

  return Math.min(Math.max(Math.round(score), 0), 1000);
}

/* ── Init en carga de página ─────────────────────────────────── */
logrosLoad();
