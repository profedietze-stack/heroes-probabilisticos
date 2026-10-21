/* ================================================================
   logrosModal.js — Modal de Logros e Informe Docente
================================================================ */

function openLogrosModal(){
  logrosEvent('tiempo');
  _renderLogrosModal();
  document.getElementById('logrosModal').classList.add('active');
}
function closeLogrosModal(){
  document.getElementById('logrosModal').classList.remove('active');
}

function _showLogrosTab(tabId){
  document.querySelectorAll('#logrosModal .tab').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('#logrosModal .tab-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelector('#logrosModal [data-ltab="'+tabId+'"]').classList.add('active');
  document.getElementById('ltab-'+tabId).classList.add('active');
}

function _fmtDate(ts){
  if(!ts) return '';
  const d = new Date(ts);
  return d.getDate().toString().padStart(2,'0') + '/' + (d.getMonth()+1).toString().padStart(2,'0') + '/' + d.getFullYear();
}

function _fmtMs(ms){
  if(!ms || ms <= 0) return '0m';
  const s = Math.floor(ms/1000);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), r = s%60;
  if(h > 0) return h + 'h ' + m + 'm ' + r + 's';
  if(m > 0) return m + 'm ' + r + 's';
  return r + 's';
}

function _scoreColor(sc){
  if(sc >= 900) return '#00e5ff';
  if(sc >= 750) return '#D4AF37';
  if(sc >= 550) return '#C0C8D0';
  if(sc >= 350) return '#c87818';
  if(sc >= 150) return '#7a8898';
  return '#4a5568';
}
function _scoreLabel(sc){
  if(sc >= 900) return 'DIAMANTE';
  if(sc >= 750) return 'PLATINO';
  if(sc >= 550) return 'ORO';
  if(sc >= 350) return 'PLATA';
  if(sc >= 150) return 'BRONCE';
  return 'INICIADO';
}

/* ── TAB 1: Logros ───────────────────────────────────────────── */
function _renderTabLogros(){
  const ld = logrosGet();
  const desbloq = ld.desbloqueados;
  const totalDef = LOGROS_DEF.length;
  const totalUnlock = Object.keys(desbloq).length;

  const cats = [];
  const bycat = {};
  LOGROS_DEF.forEach(function(l){
    if(!bycat[l.cat]){ bycat[l.cat]=[]; cats.push(l.cat); }
    bycat[l.cat].push(l);
  });

  let html = '<div style="padding:4px 0 8px">';
  // Barra de progreso global
  const pct = Math.round(totalUnlock / totalDef * 100);
  html += '<div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">';
  html += '<div style="flex:1;height:10px;background:#0e1220;border-radius:5px;overflow:hidden">';
  html += '<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#D4AF37,#ffd700);border-radius:5px;transition:width .6s"></div>';
  html += '</div>';
  html += '<span style="font-family:Poppins,sans-serif;font-size:13px;color:#D4AF37;font-weight:700;white-space:nowrap">'+totalUnlock+' / '+totalDef+'</span>';
  html += '</div>';

  cats.forEach(function(cat){
    const logros = bycat[cat];
    html += '<div style="margin-bottom:22px">';
    html += '<h4 style="font-family:Cinzel,serif;font-size:13px;color:#6a7a8a;letter-spacing:2px;border-bottom:1px solid #1a2030;padding-bottom:6px;margin-bottom:12px">'+cat.toUpperCase()+'</h4>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">';
    logros.forEach(function(l){
      const ok = !!desbloq[l.id];
      const fechaTxt = ok ? ('<span style="font-size:10px;color:#4a8a60;margin-top:2px;display:block">' + _fmtDate(desbloq[l.id]) + '</span>') : '';
      html += '<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:10px;border:1.5px solid '+(ok?'#2a4a30':'#141c28')+';background:'+(ok?'#0a1a10':'#090d18')+';">';
      html += '<div style="font-size:26px;opacity:'+(ok?'1':'0.2')+';flex-shrink:0;margin-top:1px">'+l.emoji+'</div>';
      html += '<div>';
      html += '<div style="font-family:Cinzel,serif;font-size:13px;font-weight:700;color:'+(ok?'#c0f0a0':'#2a3448')+'">'+l.nombre+'</div>';
      html += '<div style="font-size:11px;color:'+(ok?'#6a9a70':'#2a3040')+';margin-top:2px;line-height:1.4">'+l.desc+'</div>';
      html += fechaTxt;
      html += '</div></div>';
    });
    html += '</div></div>';
  });
  html += '</div>';
  document.getElementById('ltab-logros').innerHTML = html;
}

/* ── TAB 2: Informe Docente ──────────────────────────────────── */
function _renderTabInforme(){
  const ld = logrosGet();
  const s  = ld.stats;
  const desbloq = ld.desbloqueados;

  // Arcade data
  var arcadeData = null;
  try { arcadeData = _arcadeStatsLoad(); } catch(e){ arcadeData={arcade:{},libre:{}}; }

  const _PUZZLE_NAMES = {
    PuzzleUrna:    '🏺 La Urna Misteriosa',
    PuzzleMoneda:  '🪙 Cara o Ceca',
    PuzzleApuesta: '🎯 Apuesta del Mercader',
    PuzzleRuleta:  '🎡 Ruleta del Reino',
    PuzzleDados:   '🎲 El Falsificador de Dados',
    PuzzlePuertas: '🚪 Las Puertas del Oráculo',
    PuzzleTesoro:  '🗺️ Mapa del Tesoro',
  };

  const tv = s.totalVictorias||0, td = s.totalDerrotas||0;
  const totalB = tv + td;
  const winRate = totalB > 0 ? Math.round(tv/totalB*100) : 0;

  // Mejor arcade
  const allDifs = ['facil','normal','heroe','legendario'];
  let bestArcadeScore = 0, bestArcadeDif = '—';
  allDifs.forEach(function(dif){
    if(arcadeData.arcade[dif] && (arcadeData.arcade[dif].best||0) > bestArcadeScore){
      bestArcadeScore = arcadeData.arcade[dif].best;
      bestArcadeDif   = ({ facil:'Fácil', normal:'Normal', heroe:'Héroe', legendario:'Legendario' })[dif];
    }
  });
  const bestArcadeRango = bestArcadeScore >= 6 ? 'ORO' : bestArcadeScore >= 4 ? 'PLATA' : bestArcadeScore >= 2 ? 'BRONCE' : bestArcadeScore > 0 ? 'INTENTO' : '—';

  // Skills actuales
  const skillNames = {};
  if(typeof SKILL_TREE !== 'undefined'){
    SKILL_TREE.forEach(function(sk){ skillNames[sk.id]=sk.nombre; });
  }
  const skillsActuales = (typeof STATE !== 'undefined' && STATE.skills) ? STATE.skills : {};

  // Puntaje
  const score = calcScore();
  const sColor = _scoreColor(score);
  const sLabel = _scoreLabel(score);

  function _card(title, rows){
    let h = '<div class="card" style="margin-bottom:14px">';
    h += '<h4 style="font-family:Cinzel,serif;font-size:13px;color:#4a6a8a;letter-spacing:1px;margin-bottom:10px">'+title+'</h4>';
    h += '<table style="width:100%;border-collapse:collapse;font-family:Poppins,sans-serif;font-size:13px">';
    rows.forEach(function(row){
      h += '<tr style="border-bottom:1px solid #0e1420">';
      h += '<td style="padding:5px 4px;color:#5a6a7a;width:55%">'+row[0]+'</td>';
      h += '<td style="padding:5px 4px;color:#c0d0e0;font-weight:600;text-align:right">'+row[1]+'</td>';
      h += '</tr>';
    });
    h += '</table></div>';
    return h;
  }

  // Libre puzzle table
  let libHtml = '<div class="card" style="margin-bottom:14px">';
  libHtml += '<h4 style="font-family:Cinzel,serif;font-size:13px;color:#4a6a8a;letter-spacing:1px;margin-bottom:10px">MODO LIBRE — RESULTADOS POR PUZZLE</h4>';
  libHtml += '<table style="width:100%;border-collapse:collapse;font-family:Poppins,sans-serif;font-size:12px">';
  libHtml += '<thead><tr style="color:#3a5a7a;border-bottom:1px solid #1a2a3a"><th style="text-align:left;padding:4px">Puzzle</th><th style="text-align:center">Intentos</th><th style="text-align:center">Aciertos</th><th style="text-align:center">%</th><th style="text-align:center">Estado</th></tr></thead><tbody>';
  Object.keys(_PUZZLE_NAMES).forEach(function(k){
    const pd = arcadeData.libre[k];
    let totalP = 0, totalC = 0;
    if(pd) Object.values(pd).forEach(function(d){ totalP+=d.played; totalC+=d.correct; });
    const pctL = totalP > 0 ? Math.round(totalC/totalP*100) : 0;
    const mastered = totalP >= 3 && pctL >= 70;
    const estado = mastered ? '👑 Dominado' : totalC > 0 ? '✓ Ganado' : totalP > 0 ? '✗ Sin ganar' : '— Sin jugar';
    const eColor = mastered ? '#D4AF37' : totalC > 0 ? '#4a9a60' : totalP > 0 ? '#9a4a40' : '#3a4a58';
    libHtml += '<tr style="border-bottom:1px solid #0d1520">';
    libHtml += '<td style="padding:5px 4px;color:#8a9aaa">'+_PUZZLE_NAMES[k]+'</td>';
    libHtml += '<td style="text-align:center;color:#c0d0e0">'+totalP+'</td>';
    libHtml += '<td style="text-align:center;color:#c0d0e0">'+totalC+'</td>';
    libHtml += '<td style="text-align:center;color:#c0d0e0">'+(totalP>0?pctL+'%':'—')+'</td>';
    libHtml += '<td style="text-align:center;color:'+eColor+';font-size:11px">'+estado+'</td>';
    libHtml += '</tr>';
  });
  libHtml += '</tbody></table></div>';

  // Skills table
  let skillHtml = '<div class="card" style="margin-bottom:14px">';
  skillHtml += '<h4 style="font-family:Cinzel,serif;font-size:13px;color:#4a6a8a;letter-spacing:1px;margin-bottom:10px">HABILIDADES COMPRADAS (PARTIDA ACTUAL)</h4>';
  const skillIds = Object.keys(skillsActuales).filter(function(id){ return (skillsActuales[id]||0)>0; });
  if(skillIds.length === 0){
    skillHtml += '<p style="color:#2a3a4a;font-family:Poppins,sans-serif;font-size:13px">Ninguna habilidad comprada aún.</p>';
  } else {
    skillHtml += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
    skillIds.forEach(function(id){
      const rank = skillsActuales[id];
      const nombre = skillNames[id] || id;
      skillHtml += '<span style="background:#0e1828;border:1px solid #2a4060;border-radius:6px;padding:4px 10px;font-family:Poppins,sans-serif;font-size:12px;color:#80b0d8">'
        + nombre + ' <span style="color:#D4AF37">R'+rank+'</span></span>';
    });
    skillHtml += '</div>';
  }
  skillHtml += '</div>';

  // Logros en informe
  const logrosUnlock = Object.keys(desbloq).length;
  const logrosList = LOGROS_DEF.filter(function(l){ return !!desbloq[l.id]; })
    .map(function(l){ return l.emoji+' '+l.nombre; }).join(' &nbsp;·&nbsp; ') || '—';

  let html = '';

  // Puntaje destacado
  html += '<div style="text-align:center;margin-bottom:20px;padding:16px;background:linear-gradient(135deg,#080c18,#0e1428);border:2px solid '+sColor+';border-radius:14px;box-shadow:0 0 24px '+sColor+'33">';
  html += '<div style="font-family:Poppins,sans-serif;font-size:11px;color:#5a6a7a;letter-spacing:2px;margin-bottom:4px">PUNTAJE GLOBAL</div>';
  html += '<div style="font-family:Cinzel,serif;font-size:52px;font-weight:800;color:'+sColor+';line-height:1;text-shadow:0 0 24px '+sColor+'88">'+score+'</div>';
  html += '<div style="font-family:Cinzel,serif;font-size:16px;color:'+sColor+';letter-spacing:3px;margin-top:4px">'+sLabel+'</div>';
  html += '<div style="font-size:11px;color:#3a4a5a;margin-top:8px;font-family:Poppins,sans-serif">puntaje de 0 a 1000 · actualizado en tiempo real</div>';
  html += '</div>';

  // Cards de datos
  const curJefe = (typeof STATE !== 'undefined' && STATE.jefeActual) ? STATE.jefeActual : 0;
  const maxJefe = Math.max(s.maxJefeDerrotado||-1, curJefe-1);

  html += _card('PROGRESION DE CAMPANA', [
    ['Guardián más lejano derrotado', maxJefe >= 0 ? (maxJefe+1)+' / 10' : '—'],
    ['Campañas completadas',          (s.campañasCompletadas||0)],
    ['Mejor dificultad lograda',      ({facil:'Fácil',normal:'Normal',heroe:'Héroe',legendario:'Legendario'})[s.mejorDificultad||'normal']||'Normal'],
  ]);

  html += _card('ESTADISTICAS DE COMBATE', [
    ['Total de tiradas realizadas',   (s.totalTiradas||0)],
    ['Monstruos derrotados (total)', tv],
    ['Derrotas sufridas (total)',     td],
    ['Batallas disputadas',           totalB],
    ['Tasa de victoria',              totalB > 0 ? winRate+'%' : '—'],
    ['Racha máxima de victorias',     (s.maxVictoriasSeguidas||0)],
    ['Usos del Dado Sagrado',         (s.dadoSagradoUsos||0)],
  ]);

  html += _card('MODO ARCADE (MEJOR RESULTADO)', [
    ['Mejor puntaje',         bestArcadeScore > 0 ? bestArcadeScore+' / 7 aciertos' : '—'],
    ['Dificultad',            bestArcadeDif],
    ['Rango alcanzado',       bestArcadeRango],
    ['Partidas jugadas Fácil',      (arcadeData.arcade.facil      ? arcadeData.arcade.facil.played      : 0)],
    ['Partidas jugadas Normal',     (arcadeData.arcade.normal     ? arcadeData.arcade.normal.played     : 0)],
    ['Partidas jugadas Héroe',      (arcadeData.arcade.heroe      ? arcadeData.arcade.heroe.played      : 0)],
    ['Partidas jugadas Legendario', (arcadeData.arcade.legendario ? arcadeData.arcade.legendario.played : 0)],
  ]);

  html += libHtml;
  html += skillHtml;

  html += _card('LOGROS Y TIEMPO', [
    ['Logros desbloqueados',     logrosUnlock + ' / ' + LOGROS_DEF.length],
    ['Tiempo total de juego',    _fmtMs(s.tiempoTotalMs||0)],
  ]);

  html += '<div class="card" style="margin-bottom:4px"><h4 style="font-family:Cinzel,serif;font-size:13px;color:#4a6a8a;letter-spacing:1px;margin-bottom:8px">LOGROS OBTENIDOS</h4>';
  html += '<p style="font-family:Poppins,sans-serif;font-size:12px;color:#4a7a60;line-height:1.8">'+logrosList+'</p></div>';

  document.getElementById('ltab-informe').innerHTML = html;
}

function _renderLogrosModal(){
  _renderTabLogros();
  _renderTabInforme();
}
