const SAVE_KEY = 'heroesProb_save';

function saveGame(){
  try{
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      nombre:STATE.nombre, jefeActual:STATE.jefeActual,
      dificultad:STATE.dificultad||'normal',
      hp:STATE.hp, hpMax:STATE.hpMax,
      ataque:STATE.ataque, defensa:STATE.defensa,
      ataqueBase:STATE.ataqueBase, defensaBase:STATE.defensaBase,
      resiliencia:STATE.resiliencia,
      inventario:STATE.inventario, stats:STATE.stats,
      loreVisto:STATE.loreVisto||[],
      tiradaGlobal:STATE.tiradaGlobal||0,
      diosaContador:STATE.diosaContador||0,
      nodeActual:STATE.nodeActual||0,
      enigmasCompletados:STATE.enigmasCompletados||{},
      oro:STATE.oro||0,
      xp:STATE.xp||0,
      xpTotal:STATE.xpTotal||0,
      mpMax:STATE.mpMax||4,
      hpUpgrades:STATE.hpUpgrades||0,
      eventoNodo:STATE.eventoNodo||0,
      quizHechas:STATE.quizHechas||[],
      skills:STATE.skills||{},
      clase:STATE.clase||'guerrero',
      timestamp:Date.now()
    }));
    return true;
  }catch(e){
    // iOS Safari en modo privado: localStorage.setItem lanza QuotaExceededError
    console.warn('[saveGame] Error al guardar:', e);
    return false;
  }
}

/** Guarda y muestra toast de confirmación/error. Usar sólo en momentos clave (post-victoria). */
function saveGameWithFeedback(){
  const ok = saveGame();
  if(ok){
    showToast('💾 Juego Guardado Automáticamente', 2500);
  } else {
    showToast('⚠️ No se pudo guardar — verificá que no estés en modo privado', 5000);
  }
}

/** Guarda y muestra "Partida guardada correctamente". Para inicio/fin de minijuegos. */
function saveGameLegend(){
  const ok = saveGame();
  if(typeof showToast === 'function'){
    showToast(ok ? '💾 Partida guardada correctamente'
                 : '⚠️ No se pudo guardar la partida', ok ? 2200 : 5000);
  }
  return ok;
}

function loadGame(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw) return false;
    const d=JSON.parse(raw);
    STATE.nombre=d.nombre||"Héroe";
    STATE.jefeActual=d.jefeActual||0;
    STATE.dificultad=d.dificultad||'normal';
    STATE.hp=(typeof d.hp==='number')?d.hp:150; STATE.hpMax=(typeof d.hpMax==='number'&&d.hpMax>0)?d.hpMax:150;
    STATE.ataque=(typeof d.ataque==='number')?d.ataque:8; STATE.defensa=(typeof d.defensa==='number')?d.defensa:5;
    STATE.ataqueBase=d.ataqueBase||8; STATE.defensaBase=d.defensaBase||5;
    STATE.resiliencia=d.resiliencia||0;
    STATE.inventario=d.inventario||[];
    STATE.stats=d.stats||STATE.stats;
    STATE.loreVisto=d.loreVisto||[];
    STATE.tiradaGlobal=d.tiradaGlobal||0;
    STATE.diosaContador=d.diosaContador||0;
    STATE.nodeActual=d.nodeActual||0;
    STATE.enigmasCompletados=d.enigmasCompletados||{};
    STATE.oro=d.oro||0;
    STATE.xp=d.xp||0;
    STATE.xpTotal=d.xpTotal||0;
    STATE.mpMax=d.mpMax||4;
    STATE.hpUpgrades=d.hpUpgrades||0;
    STATE.eventoNodo=d.eventoNodo||0;
    STATE.quizHechas=d.quizHechas||[];
    STATE.skills=d.skills||{};
    STATE.clase=d.clase||'guerrero';
    STATE.buffs=[];
    if(typeof checkStateInvariants==='function'){
      const errs=checkStateInvariants();
      if(errs.length){
        console.warn('[loadGame] Save invalido, invariantes violadas:', errs);
        clearSave();
        return false;
      }
    }
    return true;
  }catch(e){ return false; }
}

function clearSave(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }
function hasSave(){ try{ return !!localStorage.getItem(SAVE_KEY); }catch(e){ return false; } }

function addItemToInventory(itemId){
  const ex=STATE.inventario.find(i=>i.id===itemId);
  if(ex){ ex.cantidad++; return true; }
  if(STATE.inventario.length<CFG.MAX_INVENTORY_SLOTS){ STATE.inventario.push({id:itemId,cantidad:1}); return true; }
  return false;
}

function getRandomItemId(){
  const weights=[10,7,10,10,10,6,4,7,7,8,7,8,6,7,3];
  const total=weights.reduce((a,b)=>a+b,0);
  let r=Math.random()*total;
  for(let i=0;i<weights.length;i++){ r-=weights[i]; if(r<=0) return i+1; }
  return 1;
}

function darItemsAleatorios(n){
  const resultado=[];
  for(let i=0;i<n;i++){
    const id=getRandomItemId();
    const agregado=addItemToInventory(id);
    resultado.push({id, agregado});
  }
  return resultado;
}
