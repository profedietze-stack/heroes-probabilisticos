// js/core/skills.js
/* ══ Árbol RPG de habilidades — lógica pura (browser global + Node export) ══
   Línea roja: ningún poder re-lanza los dados propios del jugador.
   Costos XP por rank uniformes [30,50,80] (R1 barato = adquirir; R2/R3 = mejorar).
   tipo: 'pasivo' (siempre activo, 0 MP) | 'activo' (botón, gasta MP) |
         'reactivo' (commit antes del reveal enemigo) | 'postroll' (tras tu tirada). */
const _XP = [30, 50, 80];

const SKILL_TREE = [
  // 🛡 Vitalidad  (vigor reemplazado por sistema de mejoras en el Grimorio)
  { id:'regeneracion', rama:'vitalidad', nombre:'Regeneración',     tipo:'activo',  mp:[2,2,2], xpCost:_XP,
    desc:'Cura HP por turno durante varios turnos.',
    ranks:[{heal:4,turnos:2},{heal:6,turnos:3},{heal:8,turnos:4}] },
  { id:'egida',        rama:'vitalidad', nombre:'Égida',            tipo:'activo',  mp:[2,2,2], xpCost:_XP,
    desc:'Mitiga el daño enemigo durante varios turnos.',
    ranks:[{red:0.20,turnos:2},{red:0.30,turnos:2},{red:0.35,turnos:3}] },
  { id:'segundoAliento',rama:'vitalidad',nombre:'Segundo aliento',  tipo:'pasivo',  mp:[0,0,0], xpCost:_XP,
    desc:'Una vez por batalla, al bajar de 20% HP, te curas.', ranks:[15,25,40] },
  { id:'dadoSagrado',  rama:'vitalidad', nombre:'Dado Sagrado',    tipo:'activo',  mp:[0,0,0], xpCost:_XP,
    desc:'Lanzás un dado verde que te cura HP. Se recarga con cada tirada de batalla.',
    ranks:[{dados:1,bonus:0,cooldown:8},{dados:2,bonus:0,cooldown:5},{dados:2,bonus:2,cooldown:3}] },

  // 🗡 Sabotaje (manipula dados del MONSTRUO, nunca los propios)
  { id:'escarcha',     rama:'sabotaje',  nombre:'Escarcha',         tipo:'activo',  mp:[2,2,2], xpCost:_XP,
    desc:'El monstruo no tira este turno.',
    ranks:[{freeze:true},{freeze:true},{freeze:true,quitaBuff:true}] },
  { id:'reflejo',      rama:'sabotaje',  nombre:'Reflejo',          tipo:'reactivo',mp:[2,2,3], xpCost:_XP,
    desc:'Parte de la tirada enemiga le pega a él (commit antes del reveal).',
    ranks:[0.30,0.60,1.00] },
  { id:'sanguijuela',  rama:'sabotaje',  nombre:'Sanguijuela',      tipo:'reactivo',mp:[2,2,3], xpCost:_XP,
    desc:'Parte del daño enemigo se convierte en HP tuyo (commit antes del reveal).',
    ranks:[0.30,0.50,0.70] },
  { id:'maldicionDado',rama:'sabotaje',  nombre:'Maldición de un dado', tipo:'activo', mp:[2,2,2], xpCost:_XP,
    desc:'El monstruo tira un solo dado este turno.',
    ranks:[{dados:1,caras:12},{dados:1,caras:12},{dados:1,caras:6}] },

  // 🔮 Sabiduría (los dorados)
  { id:'erudicion',    rama:'sabiduria', nombre:'Erudición',         tipo:'pasivo',  mp:[0,0,0], xpCost:[35,60,90],
    desc:'+20%/+35%/+50% XP al derrotar un monstruo.', ranks:[0.20, 0.35, 0.50] },
  { id:'cargaProb',    rama:'sabiduria', nombre:'Carga de probabilidad', tipo:'postroll', mp:[2,2,3], xpCost:_XP,
    desc:'Daño según lo improbable de TU suma. Las colas valen más.',
    ranks:[{k:1.0,boost:1.0},{k:1.4,boost:1.0},{k:1.4,boost:2.0}] },
  { id:'espejoVar',    rama:'sabiduria', nombre:'Espejo de varianza', tipo:'activo', mp:[2,2,3], xpCost:_XP,
    desc:'Refleja daño según cuánto se desvió la tirada enemiga de 13.',
    ranks:[0.5,0.8,1.2] },
  { id:'prediccion',   rama:'sabiduria', nombre:'Predicción de rango', tipo:'reactivo', mp:[2,2,3], xpCost:_XP,
    desc:'Apostás el rango de la tirada enemiga antes del reveal; acertar da bonus.',
    ranks:[{bins:2,bonus:8},{bins:3,bonus:12},{bins:3,bonus:24}] },
  { id:'truncar',      rama:'sabiduria', nombre:'Truncar tirada enemiga', tipo:'activo', mp:[2,2,3], xpCost:_XP,
    desc:'La suma del monstruo este turno cuenta como un valor fijo cercano a la media.',
    ranks:[13,11,9] },
];

/** Rango de rank actual del poder en un objeto skills {id:rank}. 0 = no adquirido. */
function skillRank(skills, id){ return (skills && skills[id]) || 0; }
function getPower(id){ return SKILL_TREE.find(p => p.id === id) || null; }

const _XP_DIF = { facil:1.3, normal:1.0, heroe:0.85, legendario:0.7 };
function xpMult(dif){ return _XP_DIF[dif] || 1.0; }

/** XP base por derrotar al jefe `idx` (0-based), ajustada por dificultad.
   Base 33 + 12*idx → run de 10 jefes ≈ 33*10 + 12*45 = 870 base. */
function xpForBattle(idx, dif){
  const base = 33 + 12 * idx;
  return Math.round(base * xpMult(dif));
}
/** XP bonus por resolver un puzzle. */
function xpForPuzzle(dif){ return Math.round(40 * xpMult(dif)); }
/** XP del Oráculo por encuentro. */
function xpForOraculo(dif){ return Math.round(50 * xpMult(dif)); }

function totalTreeCost(){
  return SKILL_TREE.reduce((s,p) => s + p.xpCost.reduce((a,b)=>a+b,0), 0);
}

/** Costo del próximo rank, o null si está maxeado/no existe. */
function nextRankCost(skills, id){
  const p = getPower(id); if (!p) return null;
  const cur = skillRank(skills, id);
  if (cur >= 3) return null;
  return p.xpCost[cur]; // cur=0 → costo rank1 en índice 0
}
/** ¿Hay XP suficiente y el poder no está maxeado? */
function canBuy(state, id){
  const cost = nextRankCost(state.skills, id);
  return cost !== null && (state.xp || 0) >= cost;
}
/** Compra el próximo rank: descuenta XP y sube el rank. Devuelve true si tuvo éxito. */
function buySkill(state, id){
  if (!canBuy(state, id)) return false;
  const cost = nextRankCost(state.skills, id);
  state.xp -= cost;
  state.skills[id] = skillRank(state.skills, id) + 1;
  return true;
}

/** Combinaciones de 2d12 que suman k (0 si k fuera de [2,24]). */
function combos2d12(k){ if (k < 2 || k > 24) return 0; return Math.min(k-1, 25-k, 12); }
/** Probabilidad de la suma k en 2d12 (sobre 144). */
function prob2d12(k){ return combos2d12(k) / 144; }

/** Carga de probabilidad: daño según rareza de la suma propia.
   rareza = 1 - prob; cuanto más rara la suma, más daño. */
function cargaDamage(sum, rank){
  const p = getPower('cargaProb'); const r = p.ranks[Math.max(0,rank-1)];
  const rareza = 1 - prob2d12(sum);            // 0..~1
  let dmg = 12 * rareza * r.k;
  // R3: las colas extremas (prob mínima) explotan
  if (r.boost > 1 && combos2d12(sum) <= 2) dmg *= r.boost;
  return Math.round(dmg);
}
/** Espejo de varianza: refleja daño ∝ |suma-13| × mult del rank. */
function espejoReflect(enemySum, rank){
  const mult = getPower('espejoVar').ranks[Math.max(0,rank-1)];
  return Math.round(Math.abs(enemySum - 13) * mult);
}
/** Truncar: valor fijo al que se fuerza la suma enemiga (13/11/9). */
function truncarValor(rank){ return getPower('truncar').ranks[Math.max(0,rank-1)]; }
/** Vigor: obsoleto — HP se gestiona con hpUpgrades en el Grimorio. */
function vigorBonus(rank){ return 0; }
/** Erudición: multiplicador de XP por victoria (1.0 si no adquirido). */
function erudicionMult(skills){
  const r = skillRank(skills, 'erudicion');
  return r > 0 ? 1 + getPower('erudicion').ranks[r - 1] : 1.0;
}
/** Segundo aliento: HP que cura el trigger (0 si no adquirido). */
function segundoAlientoHeal(rank){ return rank > 0 ? getPower('segundoAliento').ranks[rank-1] : 0; }
/** Dado Sagrado: config del rank {dados, bonus, cooldown}. null si no adquirido. */
function dadoSagradoCfg(rank){ return rank > 0 ? getPower('dadoSagrado').ranks[rank-1] : null; }

/** Predicción: clasifica una suma en bin según número de bins del rank. */
function _binDe(sum, bins){
  if (bins === 2) return sum >= 13 ? 'alto' : 'bajo';
  if (sum <= 9)  return 'bajo';
  if (sum >= 17) return 'alto';
  return 'medio';
}
/** Bonus de daño si la apuesta acierta el bin de la tirada enemiga; 0 si falla. */
function prediccionBonus(apuesta, enemySum, rank){
  const r = getPower('prediccion').ranks[Math.max(0,rank-1)];
  return _binDe(enemySum, r.bins) === apuesta ? r.bonus : 0;
}

const _api = { SKILL_TREE, skillRank, getPower, xpMult, xpForBattle, xpForPuzzle, xpForOraculo,
               totalTreeCost, nextRankCost, canBuy, buySkill,
               combos2d12, prob2d12, cargaDamage, espejoReflect, truncarValor,
               vigorBonus, erudicionMult, segundoAlientoHeal, prediccionBonus, dadoSagradoCfg };
if (typeof module !== 'undefined' && module.exports) module.exports = _api;
