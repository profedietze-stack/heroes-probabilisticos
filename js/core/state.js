const STATE = {
  nombre:"Héroe", jefeActual:0, dificultad:'normal',
  hp:150, hpMax:150,
  ataque:8, defensa:5, ataqueBase:8, defensaBase:5,
  resiliencia:0, inventario:[], buffs:[], enigmasCompletados:{},
  oro:0,
  nodeActual:0,
  stats:{ tiradas:[], derrotas:0, objetosUsados:{}, tiempoInicio:Date.now(),
          dañoTotalFinal:0, objetosUsadosFinal:0, turnosEpicos:[] },
  turnoActual:0, jefeHp:0, jefeHpMax:0,
  flagCrown:false, flagGem:false, flagStar:false, flagKey:false,
  reduccionDaño:0,
  tiradaGlobal:0,
  loreVisto:[],
  diosaContador:0,
  xp:0, xpTotal:0,
  mpMax:4,
  hpUpgrades:0,
  skills:{}
};

function combosExact(k){ if(k<2||k>24) return 0; return Math.min(k-1, 25-k, 12); }
function casosFavorables(umbral){ let c=0; for(let k=umbral;k<=24;k++) c+=combosExact(k); return c; }
