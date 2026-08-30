/* ══════════════════════════════════════
   npc-render.js — Creación y control de animaciones NPC
   Requiere: NPC_DATA (js/data/npcs.js), npc-animations.css
══════════════════════════════════════ */

/**
 * Crea el elemento DOM del NPC envuelto en contenedor animable.
 * @param {string} npcKey  — 'mercader' | 'oraculo'
 * @param {number} [w=340] — ancho CSS en px
 * @param {number} [h=340] — alto  CSS en px
 * @returns {HTMLDivElement|null}
 */
function createNPCElement(npcKey, w, h) {
  const data = NPC_DATA[npcKey];
  if (!data) { console.warn('NPC no encontrado:', npcKey); return null; }

  w = w || 340;
  h = h || 340;

  const container = document.createElement('div');
  container.className = 'npc-container';
  container.dataset.npc = npcKey;
  container.style.cssText = `width:${w}px;height:${h}px;display:inline-block;line-height:0;overflow:visible;`;

  const bobWrap = document.createElement('div');
  bobWrap.className = 'npc-bob-wrap';
  bobWrap.style.cssText = `width:100%;height:100%;display:inline-block;line-height:0;`;
  bobWrap.innerHTML = data.svgMarkup;

  container.appendChild(bobWrap);
  return container;
}

/**
 * Cambia el estado de animación del NPC.
 * @param {HTMLElement} el    — elemento retornado por createNPCElement
 * @param {string|null} state — 'idle' | 'talking' | null (sin animación)
 */
function setNPCState(el, state) {
  if (!el) return;
  el.classList.remove('npc-idle', 'npc-talking');
  if (state) el.classList.add('npc-' + state);
}

/**
 * Anima habla durante `ms` milisegundos, luego vuelve a idle.
 * @param {HTMLElement} el
 * @param {number}      ms
 * @param {Function}    [onComplete]
 */
function playNPCTalk(el, ms, onComplete) {
  if (!el) return;
  setNPCState(el, 'talking');
  setTimeout(function() {
    setNPCState(el, 'idle');
    if (onComplete) onComplete();
  }, ms || 2000);
}
