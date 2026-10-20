/**
 * config.js — Constantes globales del juego
 * Centraliza todos los "magic numbers" para fácil ajuste.
 */
const DIFICULTADES = {
  facil:     { label:'⭐ Fácil',       hpHero:200, atkBase:10, defBase:6, monsterHpMult:0.75, monsterAtkMult:0.75, itemsIniciales:3, resBonus:1, atkPorJefe:1,
               desc:'Más HP, monstruos más débiles, 3 objetos iniciales + resiliencia.' },
  normal:    { label:'⚔ Normal',      hpHero:150, atkBase:8,  defBase:5, monsterHpMult:1.0,  monsterAtkMult:1.0,  itemsIniciales:2, resBonus:0, atkPorJefe:2.5,
               desc:'Experiencia estándar balanceada.' },
  heroe:     { label:'🗡 Héroe',       hpHero:120, atkBase:7,  defBase:4, monsterHpMult:1.25, monsterAtkMult:1.25, itemsIniciales:1, resBonus:0, atkPorJefe:3.5,
               desc:'Menos HP, monstruos más fuertes, solo 1 objeto inicial.' },
  legendario:{ label:'💀 Legendario',  hpHero:90,  atkBase:6,  defBase:3, monsterHpMult:1.5,  monsterAtkMult:1.5,  itemsIniciales:0, resBonus:0, atkPorJefe:5.5,
               desc:'Sin objetos, monstruos al 150%. Solo para maestros.' },
};

/* HP, ataque y defensa de un monstruo según la dificultad. UNA sola cuenta que
   usan la batalla (BattleScene.create) y la ficha del mapa (MapScene): la ficha
   mostraba los números base (HP 60, ATK 4, DEF 4) aunque en Héroe o Legendario
   el monstruo luchara con ×1,25 o ×1,5. */
function statsDeMonstruo(m, dificultad){
  const d = DIFICULTADES[dificultad] || DIFICULTADES.normal;
  return {
    hp:      Math.round(m.hpMax   * d.monsterHpMult),
    ataque:  Math.round(m.ataque  * d.monsterAtkMult),
    defensa: Math.round(m.defensa * d.monsterAtkMult),
  };
}

/* Equilibrio de la campaña (se mide con tools/simular.js).
   - El héroe base no crecía: sin poderes no pasaba del jefe 4-5 (el jefe 5 pide ~31
     turnos y le hace ~570 de daño contra 150 HP). Gana `atkPorJefe` de ataque por
     cada jefe derrotado (según la dificultad: los monstruos de Héroe y Legendario son
     más fuertes, así que el héroe crece más), aplicado al empezar cada batalla.
   - Al morir se revive con REVIVIR_FRAC del HP máximo (antes 30 %, y sin tienda a la
     que volver era una espiral). */
const REVIVIR_FRAC = 0.5;
function bonusAtaqueCampaña(jefeActual, dificultad){
  const d = DIFICULTADES[dificultad] || DIFICULTADES.normal;
  return Math.floor((jefeActual || 0) * d.atkPorJefe);
}

const CFG = Object.freeze({
  // Mecánica de dados
  DICE_COMBOS:        144,   // Combinaciones totales de 2d12 (12×12)
  DICE_FACES:         12,    // Caras de cada dado
  DICE_MIN_SUM:       2,     // Suma mínima posible
  DICE_MAX_SUM:       24,    // Suma máxima posible

  // Inventario
  MAX_INVENTORY_SLOTS: 6,    // Máximo de slots en la bolsa del héroe

  // Diosa de la Probabilidad
  DIOSA_INTERVAL:     5,     // Tiradas entre bendiciones de la Diosa

  // Animación del monstruo
  MONSTER_ANIM_MS:    50,    // Intervalo del timer de flotación (ms)

  // Audio
  MUSIC_VOL:          0.07,  // Volumen del canal de música (0-1)
});
