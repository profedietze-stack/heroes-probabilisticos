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

/* ── Lectura defensiva del guardado ───────────────────────────────────────
   Un guardado es entrada no confiable: lo puede editar un alumno desde las
   DevTools, pero sobre todo lo puede dejar una versión anterior (o posterior)
   del juego con otro tipo en algún campo. Antes, `loadGame` copiaba cada campo
   con `d.campo || default` —que sólo se defiende de lo que falta— y después
   BORRABA TODO el guardado si alguna invariante fallaba: con `inventario`
   guardado como número el alumno perdía la partida entera y el juego le decía
   "No hay partida guardada".
   `sanitizeSave` valida campo por campo (tipo, rango, ids que existen) y cae al
   valor por defecto SOLO en el campo dañado: el resto del progreso se conserva.
   Es una función pura (no toca STATE) para poder probarla. */
function _ent(v, def, min, max){
  if(typeof v!=='number' || !isFinite(v)) return def;
  return Math.min(max, Math.max(min, Math.round(v)));
}
function _esObj(v){ return !!v && typeof v==='object' && !Array.isArray(v); }
function _listaEnt(v, min, max, tope){
  if(!Array.isArray(v)) return [];
  return v.filter(x=>typeof x==='number' && isFinite(x) && Math.round(x)===x && x>=min && x<=max).slice(0, tope);
}

function sanitizeSave(d){
  if(!_esObj(d)) return null;
  const dif = (typeof d.dificultad==='string' && Object.prototype.hasOwnProperty.call(DIFICULTADES, d.dificultad)) ? d.dificultad : 'normal';
  const cfg = DIFICULTADES[dif];
  const hpMax = _ent(d.hpMax, cfg.hpHero, 1, 5000);
  const ataqueBase = _ent(d.ataqueBase, cfg.atkBase, 1, 99);
  const defensaBase = _ent(d.defensaBase, cfg.defBase, 0, 99);
  const nItems = (typeof ITEMS!=='undefined' && ITEMS.length) || 15;

  // Inventario: sólo ítems que existen, cantidades enteras, sin duplicados, tope de slots.
  const inventario = [];
  if(Array.isArray(d.inventario)){
    for(const it of d.inventario){
      if(!_esObj(it)) continue;
      const id = _ent(it.id, 0, 0, nItems), cantidad = _ent(it.cantidad, 0, 0, 99);
      if(id<1 || cantidad<1) continue;
      const ya = inventario.find(x=>x.id===id);
      if(ya) ya.cantidad = Math.min(99, ya.cantidad+cantidad);
      else if(inventario.length < CFG.MAX_INVENTORY_SLOTS) inventario.push({id, cantidad});
    }
  }

  // Skills: sólo poderes del árbol, rango entero de 0 a 3.
  const skills = {};
  if(_esObj(d.skills) && typeof SKILL_TREE!=='undefined'){
    for(const p of SKILL_TREE){
      const r = _ent(d.skills[p.id], 0, 0, 3);
      if(r>0) skills[p.id] = r;
    }
  }

  // Estadísticas: se conserva lo que sirve y se reparan los tipos.
  const s0 = _esObj(d.stats) ? d.stats : {};
  const stats = Object.assign({}, s0, {
    tiradas: Array.isArray(s0.tiradas) ? s0.tiradas.filter(_esObj).slice(-2000) : [],
    derrotas: _ent(s0.derrotas, 0, 0, 1e6),
    objetosUsados: _esObj(s0.objetosUsados) ? s0.objetosUsados : {},
    tiempoInicio: _ent(s0.tiempoInicio, Date.now(), 0, 8.64e15),
    dañoTotalFinal: _ent(s0.dañoTotalFinal, 0, 0, 1e9),
    objetosUsadosFinal: _ent(s0.objetosUsadosFinal, 0, 0, 1e6),
    turnosEpicos: Array.isArray(s0.turnosEpicos) ? s0.turnosEpicos.filter(_esObj) : [],
  });

  const enigmas = {};
  if(_esObj(d.enigmasCompletados)){
    for(const k of Object.keys(d.enigmasCompletados)) enigmas[k] = _ent(d.enigmasCompletados[k], 0, 0, 1e6);
  }

  const xp = _ent(d.xp, 0, 0, 1e7);
  const nombre = (typeof d.nombre==='string' ? d.nombre.trim().slice(0,15) : '') || 'Héroe';
  return {
    nombre, dificultad: dif,
    jefeActual: _ent(d.jefeActual, 0, 0, 10),
    nodeActual: _ent(d.nodeActual, 0, 0, 29),
    hpMax, hp: _ent(d.hp, hpMax, 1, hpMax),
    ataqueBase, ataque: _ent(d.ataque, ataqueBase, 1, 99),
    defensaBase, defensa: _ent(d.defensa, defensaBase, 0, 99),
    resiliencia: _ent(d.resiliencia, 0, 0, 3),
    inventario, stats, skills,
    loreVisto: _listaEnt(d.loreVisto, 0, 99, 100),
    quizHechas: _listaEnt(d.quizHechas, 0, 99, 100),
    enigmasCompletados: enigmas,
    tiradaGlobal: _ent(d.tiradaGlobal, 0, 0, 1e7),
    diosaContador: _ent(d.diosaContador, 0, 0, 1e6),
    oro: _ent(d.oro, 0, 0, 1e7),
    xp, xpTotal: Math.max(xp, _ent(d.xpTotal, xp, 0, 1e7)),
    mpMax: _ent(d.mpMax, 4, 4, 8),
    hpUpgrades: _ent(d.hpUpgrades, 0, 0, 200),
    eventoNodo: _ent(d.eventoNodo, 0, 0, 29),
    clase: (['guerrero','hechicero','arquero','alquimista'].includes(d.clase)) ? d.clase : 'guerrero',
  };
}

function loadGame(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw) return false;
    let d;
    try{ d=JSON.parse(raw); }catch(e){ console.warn('[loadGame] Guardado ilegible, se descarta.'); clearSave(); return false; }
    const s=sanitizeSave(d);
    if(!s){ console.warn('[loadGame] El guardado no es un objeto, se descarta.'); clearSave(); return false; }
    Object.assign(STATE, s, { buffs:[] });
    if(typeof checkStateInvariants==='function'){
      const errs=checkStateInvariants();
      if(errs.length){
        // No debería pasar tras sanitizeSave. Si pasa, NO se borra el guardado:
        // mejor un error visible que perder la partida en silencio.
        console.warn('[loadGame] Invariantes violadas tras sanear:', errs);
        return false;
      }
    }
    return true;
  }catch(e){ console.warn('[loadGame] Error al cargar:', e); return false; }
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
