/* ══════════════════════════════════════
   puzzles.js — Catálogo de 7 enigmas de probabilidad
   Cada entrada define: NPC dueño, nombre, descripción, escena de minijuego
══════════════════════════════════════ */

const PUZZLE_CATALOG = [
  {
    id: 0, npc: 'mercader',
    nombre: 'La Urna Misteriosa',
    desc:   'Calcula la probabilidad de extraer una bola específica.',
    sceneKey: 'PuzzleUrna',
    recompensa: { hp: 15, desc: '+15 HP' }
  },
  {
    id: 1, npc: 'mercader',
    nombre: 'Cara o Ceca',
    desc:   'Predice frecuencias en lanzamientos de moneda.',
    sceneKey: 'PuzzleMoneda',
    recompensa: { hp: 10, item: true, desc: '+10 HP + objeto' }
  },
  {
    id: 2, npc: 'mercader',
    nombre: 'Apuesta del Mercader',
    desc:   'Evalúa si una apuesta es matemáticamente favorable.',
    sceneKey: 'PuzzleApuesta',
    recompensa: { hp: 20, desc: '+20 HP' }
  },
  {
    id: 3, npc: 'mercader',
    nombre: 'Ruleta del Reino',
    desc:   'Calcula probabilidades en la ruleta del destino.',
    sceneKey: 'PuzzleRuleta',
    recompensa: { hp: 12, item: true, desc: '+12 HP + objeto' }
  },
  {
    id: 4, npc: 'oraculo',
    nombre: 'El Falsificador de Dados',
    desc:   'Descubre cuál dado fue manipulado usando probabilidad.',
    sceneKey: 'PuzzleDados',
    recompensa: { hp: 18, desc: '+18 HP' }
  },
  {
    id: 5, npc: 'oraculo',
    nombre: 'Las Puertas del Oráculo',
    desc:   'Domina la probabilidad condicional: ¿conviene cambiar de puerta?',
    sceneKey: 'PuzzlePuertas',
    recompensa: { hp: 22, desc: '+22 HP / oro' }
  },
  {
    id: 6, npc: 'oraculo',
    nombre: 'Mapa del Tesoro',
    desc:   'Calcula la ruta más probable hacia el tesoro oculto.',
    sceneKey: 'PuzzleTesoro',
    recompensa: { hp: 15, item: true, desc: '+15 HP + objeto' }
  },
];
