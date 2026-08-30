/**
 * config.js — Constantes globales del juego
 * Centraliza todos los "magic numbers" para fácil ajuste.
 */
const DIFICULTADES = {
  facil:     { label:'⭐ Fácil',       hpHero:200, atkBase:10, defBase:6, monsterHpMult:0.75, monsterAtkMult:0.75, itemsIniciales:3, resBonus:1,
               desc:'Más HP, monstruos más débiles, 3 objetos iniciales + resiliencia.' },
  normal:    { label:'⚔ Normal',      hpHero:150, atkBase:8,  defBase:5, monsterHpMult:1.0,  monsterAtkMult:1.0,  itemsIniciales:2, resBonus:0,
               desc:'Experiencia estándar balanceada.' },
  heroe:     { label:'🗡 Héroe',       hpHero:120, atkBase:7,  defBase:4, monsterHpMult:1.25, monsterAtkMult:1.25, itemsIniciales:1, resBonus:0,
               desc:'Menos HP, monstruos más fuertes, solo 1 objeto inicial.' },
  legendario:{ label:'💀 Legendario',  hpHero:90,  atkBase:6,  defBase:3, monsterHpMult:1.5,  monsterAtkMult:1.5,  itemsIniciales:0, resBonus:0,
               desc:'Sin objetos, monstruos al 150%. Solo para maestros.' },
};

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
