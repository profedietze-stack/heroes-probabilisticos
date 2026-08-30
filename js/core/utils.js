function showConfirm(msg, onOk, { title='¿Estás seguro?', okLabel='Aceptar' } = {}){
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent   = msg;
  document.getElementById('confirmOk').textContent    = okLabel;
  window.__confirmOk = ()=>{ closeConfirmModal(); onOk(); };
  // Desactivar input de Phaser mientras el modal está abierto: sin esto, el click
  // en el botón DOM del modal se filtra al canvas y dispara el botón de Phaser que
  // queda debajo (ej. "Cargar Partida" → BattleScene), encimando escenas.
  try{ if(window.game) window.game.input.enabled = false; }catch(e){}
  document.getElementById('confirmModal').classList.add('active');
}
function closeConfirmModal(){
  document.getElementById('confirmModal').classList.remove('active');
  // Reactivar input en el próximo tick para que el pointerup del click que cerró
  // el modal NO llegue al canvas (evita el click-through al botón de abajo).
  try{ if(window.game) setTimeout(()=>{ try{ window.game.input.enabled = true; }catch(e){} }, 80); }catch(e){}
}

function showToast(text, duration=4000){
  const t=document.getElementById('toast'); t.textContent=text; t.classList.add('show');
  clearTimeout(t._to); t._to=setTimeout(()=>t.classList.remove('show'), duration);
}

function fmtTime(ms){
  const s=Math.floor(ms/1000);
  const m=Math.floor(s/60), r=s%60;
  const h=Math.floor(m/60), rm=m%60;
  if(h>0) return `${h}h ${rm}m ${r}s`;
  return `${m}m ${r}s`;
}

function openEduModal(){ openInfoDidactica(); }
function closeEduModal(){
  closeInfoDidactica();
  if(typeof window.__battleResumed === 'function') window.__battleResumed();
}
function showTab(ev,name){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  ev.target.classList.add('active');
  document.getElementById('tab-'+name).classList.add('active');
}
function openInfoDidactica(){ document.getElementById('infoDidModal').classList.add('active'); }
function closeInfoDidactica(){ document.getElementById('infoDidModal').classList.remove('active'); }
function openItemModal(html){ document.getElementById('itemContent').innerHTML=html; document.getElementById('itemModal').classList.add('active'); }
function closeItemModal(){ document.getElementById('itemModal').classList.remove('active'); }
/* Moneda — el emoji 🪙 no renderiza en algunas fuentes (PC): usar estas alternativas. */
function coinSpan(size=14){
  const s = size;
  return `<span style="display:inline-block;width:${s}px;height:${s}px;border-radius:50%;` +
    `background:radial-gradient(circle at 35% 30%, #FBE58A 0%, #E8C24A 45%, #B8860B 100%);` +
    `border:1px solid #8a6508;box-shadow:0 0 4px rgba(212,175,55,.6);` +
    `vertical-align:-2px"></span>`;
}
/* Dibuja una moneda dorada en un Phaser.Graphics (g) centrada en (x,y). */
function drawCoinIcon(g, x, y, r){
  g.fillStyle(0x8a6508, 1);            g.fillCircle(x, y+1, r);
  g.fillStyle(0xE8C24A, 1);            g.fillCircle(x, y, r);
  g.fillStyle(0xFBE58A, 1);            g.fillCircle(x - r*0.28, y - r*0.28, r*0.45);
  g.lineStyle(Math.max(1, r*0.18), 0xB8860B, 0.9); g.strokeCircle(x, y, r*0.62);
}

/* ══ Botón global de Pantalla Completa ══
   DOM fijo (persiste entre escenas Phaser). Visible en todas las escenas
   excepto el Menú Inicio (el splash es DOM previo, sin Phaser → ya oculto). */
const _FS_ICON_ENTER = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
const _FS_ICON_EXIT  = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';

function _isFullscreen(){
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}
function toggleFullscreen(){
  try{
    if(_isFullscreen()){
      const ex = document.exitFullscreen || document.webkitExitFullscreen;
      if(ex) ex.call(document);
    } else {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      if(req) req.call(el).catch && req.call(el).catch(()=>{});
    }
  }catch(e){ /* fullscreen puede estar bloqueado en algunos navegadores */ }
}
function _ensureFsButton(){
  let b = document.getElementById('fsToggleBtn');
  if(b) return b;
  b = document.createElement('button');
  b.id = 'fsToggleBtn';
  b.setAttribute('aria-label', 'Pantalla completa');
  b.title = 'Pantalla completa';
  b.style.cssText =
    'position:fixed;top:8px;right:8px;z-index:900;width:32px;height:32px;'+
    'display:none;align-items:center;justify-content:center;padding:0;'+
    'background:rgba(12,16,26,0.55);color:#D4AF37;border:1px solid rgba(212,175,55,0.45);'+
    'border-radius:7px;cursor:pointer;opacity:0.5;transition:opacity .15s,background .15s;'+
    '-webkit-tap-highlight-color:transparent;';
  b.onmouseenter = ()=>{ b.style.opacity='1'; b.style.background='rgba(20,30,50,0.9)'; };
  b.onmouseleave = ()=>{ b.style.opacity='0.5'; b.style.background='rgba(12,16,26,0.55)'; };
  b.onclick = ()=>{ toggleFullscreen(); };
  document.body.appendChild(b);
  const sync = ()=>{ b.innerHTML = _isFullscreen() ? _FS_ICON_EXIT : _FS_ICON_ENTER;
                     b.title = _isFullscreen() ? 'Salir de pantalla completa' : 'Pantalla completa'; };
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
  sync();
  return b;
}
/* Mostrar/ocultar según escena. Oculto en el Menú Inicio. */
function updateFsButtonForScene(sceneKey){
  const b = _ensureFsButton();
  b.style.display = (sceneKey === 'MenuScene') ? 'none' : 'flex';
}

/* Plugin de escena: llama a updateFsButtonForScene en cada 'create'. */
class FsButtonPlugin extends Phaser.Plugins.ScenePlugin {
  boot(){
    this.scene.events.on('create', ()=>{
      try{ updateFsButtonForScene(this.scene.scene.key); }catch(e){}
    });
  }
}

function openReportModal(title, html){
  document.getElementById('reportTitle').textContent=title;
  document.getElementById('reportContent').innerHTML=html;
  document.getElementById('reportModal').classList.add('active');
}
function closeReportModal(){ document.getElementById('reportModal').classList.remove('active'); }

/* ══════════════════════════════════════
   sceneWipe — transición de cortina dorada entre escenas
   Reemplaza el fade negro genérico en las transiciones clave.
   Una cortina oscura con borde dorado barre la pantalla de izquierda
   a derecha; al cubrirla, arranca la escena destino.
   Uso: sceneWipe(this, 'BattleScene')  ó  sceneWipe(this, 'PuzzleScene', data)
══════════════════════════════════════ */
function sceneWipe(scene, targetKey, data){
  try{
    const w = scene.scale.width, h = scene.scale.height;
    const DUR = 420;

    // Cortina principal (por encima de todo, fija a cámara)
    const curtain = scene.add.graphics().setDepth(9999).setScrollFactor(0);
    curtain.fillGradientStyle(0x0A0806, 0x14100A, 0x0A0806, 0x14100A, 1);
    curtain.fillRect(0, 0, w, h);
    // Borde de avance dorado
    curtain.fillStyle(0xD4AF37, 0.85);
    curtain.fillRect(w-4, 0, 4, h);
    curtain.fillStyle(0xD4AF37, 0.25);
    curtain.fillRect(w-14, 0, 10, h);
    curtain.x = -w;

    // Si hay cámara HUD (MapScene), que también la renderice
    scene.tweens.add({
      targets: curtain, x: 0, duration: DUR, ease: 'Cubic.easeIn',
      onComplete: ()=> scene.scene.start(targetKey, data)
    });
  }catch(e){
    // Fallback: transición clásica
    try{
      scene.cameras.main.fadeOut(350, 0, 0, 0);
      scene.cameras.main.once('camerafadeoutcomplete', ()=>scene.scene.start(targetKey, data));
    }catch(e2){ scene.scene.start(targetKey, data); }
  }
}

/* ══════════════════════════════════════
   Auto-save de emergencia — guarda al ocultar/cerrar la pestaña.
   Cubre: tablet que se bloquea, alumno que cierra el navegador, cambio
   de app en Android. Solo guarda si hay una partida real en curso
   (nunca desde el menú, donde STATE puede estar reseteado).
══════════════════════════════════════ */
(function initEmergencySave(){
  function _partidaEnCurso(){
    try{
      if(typeof STATE === 'undefined' || !window.game) return false;
      const activas = window.game.scene.getScenes(true).map(s => s.scene.key);
      if(activas.length === 0 || activas.includes('MenuScene')) return false;
      // Escenas de juego real (historia): mapa, batalla, puzzles, victoria
      return activas.some(k => ['MapScene','BattleScene','PuzzleScene','VictoryScene'].includes(k));
    }catch(e){ return false; }
  }
  function _emergencySave(){
    if(_partidaEnCurso() && typeof saveGame === 'function') saveGame();
  }
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'hidden') _emergencySave();
  });
  window.addEventListener('pagehide', _emergencySave);
})();

/* ══════════════════════════════════════
   Botón de pánico del docente — Ctrl+Shift+Q
   Para partidas trabadas en el aula: resetea la partida en curso y
   vuelve al menú SIN tocar logros ni estadísticas globales del alumno.
══════════════════════════════════════ */
(function initPanicButton(){
  document.addEventListener('keydown', function(e){
    if(!(e.ctrlKey && e.shiftKey && (e.key === 'Q' || e.key === 'q'))) return;
    e.preventDefault();
    if(!window.game) return;
    const ok = window.confirm(
      'BOTÓN DE PÁNICO (docente)\n\n' +
      'Esto reinicia la partida trabada y vuelve al menú.\n' +
      'Los logros y estadísticas globales NO se pierden.\n\n¿Continuar?'
    );
    if(!ok) return;
    try{
      if(typeof clearSave === 'function') clearSave();
      // Cerrar modales DOM que puedan estar bloqueando
      try{ if(typeof closeItemModal === 'function') closeItemModal(); }catch(err){}
      try{ document.querySelectorAll('#__tutOverlay').forEach(el=>el.remove()); }catch(err){}
      // Frenar todas las escenas y volver al menú
      const mgr = window.game.scene;
      mgr.getScenes(false).forEach(s => { try{ mgr.stop(s.scene.key); }catch(err){} });
      if(typeof freshRunState === 'function' && typeof STATE !== 'undefined') Object.assign(STATE, freshRunState());
      mgr.start('MenuScene');
      if(typeof showToast === 'function') showToast('🆘 Partida reiniciada por el docente');
    }catch(err){
      // Último recurso: recargar la página
      location.reload();
    }
  });
})();
