// js/core/clases.js
/* ══ Clases del héroe — lógica pura (browser global + Node export) ══
   Cada clase tiene UNA ventaja y UN costo, para que ninguna sea estrictamente
   mejor. Respeta la línea roja del árbol de poderes: nada relanza los dados del
   jugador (el +1 del Arquero se SUMA a la tirada, no la repite).

   Qué se hornea al elegir la clase (queda en el guardado, como las mejoras del
   Grimorio): HP máx, MP máx, ataque base y defensa base.
   Qué se aplica en cada batalla (no se guarda, así una partida vieja también lo
   recibe): bonus a la tirada, racha, descuento del primer poder, potencia de
   los ítems, ítems iniciales y precios de la tienda.

   Los números salen de tools/simular.js (equilibrio entre clases). */

const CLASES = {
  guerrero: {
    key: 'guerrero', emoji: '⚔', nombre: 'Guerrero', color: 0xc0392b, titulo: 'Escudo de la Frecuencia',
    idea: 'Cada golpe es un ensayo de Bernoulli: confía en la frecuencia, no en un solo tiro.',
    ventajas: ['+25 HP máximos', 'Racha: cada impacto seguido suma +1 de daño (hasta +4); un fallo la corta'],
    costos:   ['No tiene bonus a la tirada, al MP ni a los ítems'],
    hp: 25, atk: 0, def: 0, mp: 0, tirada: 0, racha: 4, primerPoder: 0, potenciaItems: 1, itemsExtra: 0, descuento: 0,
  },
  arquero: {
    key: 'arquero', emoji: '🏹', nombre: 'Arquero', color: 0x27ae60, titulo: 'Ojo de Laplace',
    idea: 'Cada flecha es independiente, pero la probabilidad de acierto es siempre la misma.',
    ventajas: ['+1 a la suma de cada tirada (más probabilidad de impacto)'],
    costos:   ['−25 HP máximos'],
    hp: -25, atk: 0, def: 0, mp: 0, tirada: 1, racha: 0, primerPoder: 0, potenciaItems: 1, itemsExtra: 0, descuento: 0,
  },
  hechicero: {
    key: 'hechicero', emoji: '🔮', nombre: 'Hechicero', color: 0x8e44ad, titulo: 'Voz de la Distribución',
    idea: 'La magia es una distribución de probabilidad hecha visible.',
    ventajas: ['+3 MP máximos (empieza con 7)', 'El primer poder de cada batalla cuesta 1 MP menos'],
    costos:   ['−15 HP máximos'],
    hp: -15, atk: 0, def: 0, mp: 3, tirada: 0, racha: 0, primerPoder: 1, potenciaItems: 1, itemsExtra: 0, descuento: 0,
  },
  alquimista: {
    key: 'alquimista', emoji: '⚗', nombre: 'Alquimista', color: 0xf39c12, titulo: 'Maestro del Experimento',
    idea: 'Cada poción es un experimento: mismo procedimiento, resultado distinto.',
    ventajas: ['Pociones y buffs un 50 % más fuertes', 'Empieza con 1 objeto extra', 'Precios de la tienda −10 %'],
    costos:   ['−1 de defensa base'],
    hp: 0, atk: 0, def: -1, mp: 0, tirada: 0, racha: 0, primerPoder: 0, potenciaItems: 1.5, itemsExtra: 1, descuento: 0.1,
  },
};

const CLASES_ORDEN = ['guerrero', 'hechicero', 'arquero', 'alquimista'];

/** La clase pedida, o Guerrero si no existe (guardado viejo o dañado). */
function claseDe(key) { return CLASES[key] || CLASES.guerrero; }

/** Ajusta HP, MP, ataque y defensa BASE de un héroe recién creado. `e` trae los
    valores de la dificultad (hp, hpMax, ataqueBase...). Devuelve el mismo objeto. */
function aplicarClaseInicial(e, key) {
  const c = claseDe(key);
  e.clase = c.key;
  e.hpMax = Math.max(1, e.hpMax + c.hp);
  e.hp = e.hpMax;
  e.ataqueBase = Math.max(1, e.ataqueBase + c.atk);
  e.ataque = e.ataqueBase;
  e.defensaBase = Math.max(0, e.defensaBase + c.def);
  e.defensa = e.defensaBase;
  e.mpMax = Math.min(8, Math.max(4, (e.mpMax || 4) + c.mp));
  return e;
}

/** Bonus fijo a la suma de cada tirada. */
function bonusTirada(key) { return claseDe(key).tirada; }

/** Daño extra por la racha actual (0 si la clase no tiene). */
function bonusRacha(key, racha) { return Math.min(claseDe(key).racha, Math.max(0, racha || 0)); }

/** Costo de MP de un poder; el primero de la batalla se descuenta, mínimo 1. */
function costoPoder(key, costoBase, esPrimero) {
  const d = esPrimero ? claseDe(key).primerPoder : 0;
  return d > 0 ? Math.max(1, costoBase - d) : costoBase;
}

/** Valor de un ítem de curación o de buff con la potencia de la clase. */
function potenciaItem(key, valor) {
  const m = claseDe(key).potenciaItems;
  return m === 1 ? valor : Math.max(valor + 1, Math.floor(valor * m));
}

/** Objetos iniciales según dificultad + clase. */
function itemsIniciales(key, base) { return base + claseDe(key).itemsExtra; }

/** Precio en la tienda tras el descuento de la clase. */
function precioItem(key, precio) {
  const d = claseDe(key).descuento;
  return d > 0 ? Math.max(1, Math.round(precio * (1 - d))) : precio;
}

/** Bonos permanentes a la suma de la tirada (resiliencia + clase). */
function bonoPermanente(key, resiliencia) { return (resiliencia || 0) + bonusTirada(key); }

const _apiClases = { CLASES, CLASES_ORDEN, claseDe, aplicarClaseInicial, bonusTirada, bonusRacha, costoPoder,
                     potenciaItem, itemsIniciales, precioItem, bonoPermanente };
if (typeof module !== 'undefined' && module.exports) module.exports = _apiClases;
