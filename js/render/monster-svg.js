// ─────────────────────────────────────────────
// monster-svg.js  —  SVG+CSS monster renderer
// Phase 0: infrastructure + placeholder
// Phases 1-5: per-monster implementations
// ─────────────────────────────────────────────

const _MONSTER_CSS_ID = '__monsterStyles';

function _injectMonsterCSS(){
  if(document.getElementById(_MONSTER_CSS_ID)) return;
  const style = document.createElement('style');
  style.id = _MONSTER_CSS_ID;
  style.textContent = `
/* ── Base ── */
.monster-svg {
  display: block;
  overflow: visible;
  pointer-events: none;
  transform-origin: center center;
}
.monster-svg * { transform-box: fill-box; transform-origin: center center; }

/* ══════════════════════════════════
   STATE CLASSES
   Applied to .monster-svg root:
     state-idle (default, always on)
     state-attack
     state-hurt
     state-enraged  (stacks with idle)
     state-dead
══════════════════════════════════ */

/* ── Idle: float up/down ── */
@keyframes m-float {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-10px); }
}
.monster-svg.state-idle {
  animation: m-float 2.8s ease-in-out infinite;
}
.monster-svg.state-enraged {
  animation: m-float 1.4s ease-in-out infinite;
  filter: drop-shadow(0 0 12px rgba(255,46,46,0.9));
}

/* ── Attack: wind-up → massive lunge → recoil bounce ── */
@keyframes m-attack {
  0%   { transform: translate(0,0)        scale(1)    rotate(0deg);  filter: brightness(1); }
  12%  { transform: translate(-18px,-6px) scale(.88)  rotate(-6deg); filter: brightness(0.7); }
  30%  { transform: translate(52px,28px)  scale(1.28) rotate(8deg);  filter: brightness(2.5) drop-shadow(0 0 18px #ff4400); }
  48%  { transform: translate(38px,22px)  scale(1.22) rotate(6deg);  filter: brightness(2.0) drop-shadow(0 0 10px #ff8800); }
  62%  { transform: translate(-14px,-4px) scale(.92)  rotate(-4deg); filter: brightness(1.4); }
  78%  { transform: translate(8px,4px)    scale(1.04) rotate(2deg);  filter: brightness(1.1); }
  90%  { transform: translate(-3px,0)     scale(.99)  rotate(-1deg); filter: brightness(1); }
  100% { transform: translate(0,0)        scale(1)    rotate(0deg);  filter: brightness(1); }
}
.monster-svg.state-attack {
  animation: m-attack 0.9s cubic-bezier(.22,1,.36,1) forwards;
}
.monster-svg.state-attack.state-enraged {
  animation: m-attack 0.65s cubic-bezier(.22,1,.36,1) forwards;
}

/* ── Hurt: red flash + horizontal shake ── */
@keyframes m-hurt {
  0%,100% { transform: translateX(0); filter: brightness(1); }
  15%     { transform: translateX(-14px); filter: brightness(2.5) sepia(1) hue-rotate(-30deg); }
  30%     { transform: translateX(12px);  filter: brightness(2.8) sepia(1) hue-rotate(-30deg); }
  45%     { transform: translateX(-9px);  filter: brightness(2); }
  60%     { transform: translateX(6px);   filter: brightness(1.5); }
  75%     { transform: translateX(-3px);  filter: brightness(1.2); }
}
.monster-svg.state-hurt {
  animation: m-hurt 0.5s ease-out forwards;
}

/* ── Dead: shrink + fade ── */
@keyframes m-dead {
  0%   { transform: scale(1) rotate(0deg);    opacity: 1; }
  40%  { transform: scale(1.1) rotate(-8deg); opacity: 0.7; }
  100% { transform: scale(0) rotate(20deg);   opacity: 0; }
}
.monster-svg.state-dead {
  animation: m-dead 0.8s ease-in forwards;
}

/* ── Enraged overlay glow ── */
@keyframes m-enrage-pulse {
  0%,100% { opacity: 0.4; }
  50%     { opacity: 0.9; }
}
.m-enrage-overlay {
  display: none;
  animation: m-enrage-pulse 0.7s ease-in-out infinite;
}
.state-enraged .m-enrage-overlay { display: block; }

/* ── Eye blink ── */
@keyframes m-blink {
  0%,94%,100% { transform: scaleY(1); }
  97%          { transform: scaleY(0.08); }
}
.m-eye { animation: m-blink 4.5s ease-in-out infinite; }
.m-eye-r { animation: m-blink 4.5s ease-in-out infinite 0.18s; }

/* ── Wing flap ── */
@keyframes m-wing-l {
  0%,100% { transform: rotate(0deg); }
  50%     { transform: rotate(-18deg); }
}
@keyframes m-wing-r {
  0%,100% { transform: rotate(0deg); }
  50%     { transform: rotate(18deg); }
}
.m-wing-l { animation: m-wing-l 1.4s ease-in-out infinite; transform-origin: right center; }
.m-wing-r { animation: m-wing-r 1.4s ease-in-out infinite; transform-origin: left center; }

/* ── Tail wag ── */
@keyframes m-tail {
  0%,100% { transform: rotate(0deg); }
  50%     { transform: rotate(14deg); }
}
.m-tail { animation: m-tail 1.1s ease-in-out infinite; transform-origin: left center; }

/* ── Tentacle wave ── */
@keyframes m-tentacle {
  0%,100% { transform: scaleX(1) rotate(0deg); }
  50%     { transform: scaleX(1.08) rotate(6deg); }
}
.m-tentacle { animation: m-tentacle 1.8s ease-in-out infinite; }
.m-tentacle:nth-child(2n) { animation-delay: 0.4s; animation-direction: alternate-reverse; }

/* ── Báculo sostenido: pivota en la empuñadura, no en su centro ──
   .m-tentacle gira sobre el centro del propio objeto (regla global de arriba),
   lo que despega el mango de la mano que lo sostiene. Un báculo agarrado tiene
   que rotar donde lo agarran: transform-box view-box permite fijar el origen en
   coordenadas del viewBox (el puño). Sincronizado con m-float para que el
   vaivén acompañe la flotación del cuerpo. */
@keyframes m-staff {
  0%,100% { transform: rotate(0deg); }
  50%     { transform: rotate(3.5deg); }
}
.m-staff {
  animation: m-staff 2.8s ease-in-out infinite;
  transform-box: view-box;
  transform-origin: 157px 156px;   /* centro del puño de la bruja */
}

/* ── Orbit ring spin ── */
@keyframes m-orbit {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.m-orbit      { animation: m-orbit 4s linear infinite; transform-origin: 100px 120px; }
.m-orbit-rev  { animation: m-orbit 3s linear infinite reverse; transform-origin: 100px 120px; }

/* ── Magic star pulse ── */
@keyframes m-star {
  0%,100% { transform: scale(1) rotate(0deg);   opacity: 0.9; }
  50%     { transform: scale(1.3) rotate(180deg); opacity: 0.5; }
}
.m-star { animation: m-star 1.6s ease-in-out infinite; }

/* ── Vortex spin ── */
@keyframes m-vortex {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.m-vortex { animation: m-vortex 3s linear infinite; transform-origin: center center; }

/* ── Rune glow ── */
@keyframes m-rune {
  0%,100% { opacity: 0.25; }
  50%     { opacity: 0.9; }
}
.m-rune { animation: m-rune 1.8s ease-in-out infinite; }

/* ── Evil eyes (attack + enraged states) ── */
@keyframes m-evil-blink {
  0%,94%,100% { transform: scaleY(0.48) translateY(3px); }
  97%          { transform: scaleY(0.04) translateY(3px); }
}
.state-attack .m-eye,  .state-attack .m-eye-r,
.state-enraged .m-eye, .state-enraged .m-eye-r {
  animation: m-evil-blink 3s ease-in-out infinite;
  filter: drop-shadow(0 0 5px #ff1100) sepia(1) hue-rotate(300deg) saturate(6) brightness(1.8);
}

/* ── Dragon fire breath ── */
@keyframes m-firebreath {
  0%,55%,100% { transform: scaleY(0) scaleX(0); opacity: 0; }
  60% { transform: scaleY(0.4) scaleX(0.5); opacity: 0.95; }
  70% { transform: scaleY(1) scaleX(1); opacity: 1; filter: drop-shadow(0 0 14px #ff4400); }
  82% { transform: scaleY(1.15) scaleX(1.05); opacity: 0.85; }
  93% { transform: scaleY(0.5) scaleX(0.6); opacity: 0.2; }
}
.m-firebreath {
  animation: m-firebreath 3.5s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center top;
}

/* ── Smoke wisps ── */
@keyframes m-smoke {
  0%   { transform: translate(0,0)    scale(1);   opacity: 0.5; }
  100% { transform: translate(0,-44px) scale(2.4); opacity: 0;   }
}
.m-smoke { animation: m-smoke 2.2s ease-out infinite; }
.m-smoke:nth-child(2n) { animation-delay: 0.8s;  animation-duration: 2.5s; }
.m-smoke:nth-child(3n) { animation-delay: 1.5s;  animation-duration: 1.9s; }
`;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────
// hexToCSS: Phaser 0xRRGGBB → "#rrggbb"
// ─────────────────────────────────────────────
function _hexToCSS(hex){
  const r = (hex >> 16) & 0xff;
  const g = (hex >>  8) & 0xff;
  const b =  hex        & 0xff;
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// Darken/lighten a CSS hex color by amt (-1..1)
function _shiftColor(cssHex, amt){
  let r = parseInt(cssHex.slice(1,3),16);
  let g = parseInt(cssHex.slice(3,5),16);
  let b = parseInt(cssHex.slice(5,7),16);
  r = Math.min(255,Math.max(0,Math.round(r + 255*amt)));
  g = Math.min(255,Math.max(0,Math.round(g + 255*amt)));
  b = Math.min(255,Math.max(0,Math.round(b + 255*amt)));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// ─────────────────────────────────────────────
// SVG BUILDERS — one function per monster
// Returns SVG *inner* markup (no <svg> wrapper)
// viewBox="0 0 200 240", monster centered 100,120
// ─────────────────────────────────────────────

// Placeholder used until a monster gets its phase
function _svgPlaceholder(color){
  const c = _hexToCSS(color);
  const dark = _shiftColor(c, -0.3);
  return `
  <!-- enrage overlay -->
  <ellipse cx="100" cy="120" rx="80" ry="80" fill="${c}" opacity="0.18" class="m-enrage-overlay"/>
  <!-- shadow -->
  <ellipse cx="100" cy="210" rx="55" ry="10" fill="#000" opacity="0.3"/>
  <!-- body -->
  <circle cx="100" cy="120" r="55" fill="${dark}"/>
  <circle cx="100" cy="120" r="42" fill="${c}"/>
  <!-- eyes -->
  <g class="m-eye"  transform-origin="86 108"><circle cx="86" cy="108" r="8" fill="#ff0000" opacity="0.9"/><circle cx="86" cy="108" r="4" fill="#ffff00"/><circle cx="87" cy="108" r="2" fill="#000"/></g>
  <g class="m-eye-r" transform-origin="114 108"><circle cx="114" cy="108" r="8" fill="#ff0000" opacity="0.9"/><circle cx="114" cy="108" r="4" fill="#ffff00"/><circle cx="115" cy="108" r="2" fill="#000"/></g>
  <!-- mouth -->
  <ellipse cx="100" cy="138" rx="14" ry="7" fill="#000" opacity="0.85"/>
  <polygon points="92,132 95,143 98,132" fill="#fff"/>
  <polygon points="102,132 105,143 108,132" fill="#fff"/>`;
}

// ── Phase 1: El Espectro de la Varianza ─────────────────────────────────────
function _svgEspectro(color){
  const c    = _hexToCSS(color);
  const dark = _shiftColor(c, -0.3);
  const lite = _shiftColor(c, 0.28);
  const pale = _shiftColor(c, 0.5);
  const vdark= _shiftColor(c, -0.5);
  return `
  <defs>
    <radialGradient id="esp_body" cx="44%" cy="33%" r="62%">
      <stop offset="0%" stop-color="${lite}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </radialGradient>
    <radialGradient id="esp_eye" cx="38%" cy="32%" r="58%">
      <stop offset="0%" stop-color="${pale}"/>
      <stop offset="55%" stop-color="${c}"/>
      <stop offset="100%" stop-color="${vdark}"/>
    </radialGradient>
  </defs>
  <ellipse cx="100" cy="118" rx="88" ry="88" fill="${c}" opacity="0.16" class="m-enrage-overlay"/>
  <ellipse cx="100" cy="224" rx="34" ry="7" fill="#000" opacity="0.22"/>
  <g class="m-wing-l">
    <path d="M90,128 C62,112 28,96 10,112 C2,122 12,140 38,145 C58,149 80,137 90,128Z" fill="${c}" opacity="0.52"/>
    <path d="M90,128 C68,120 44,106 24,114" stroke="${pale}" stroke-width="1.5" fill="none" opacity="0.45"/>
    <path d="M85,133 C66,126 46,115 34,121" stroke="${pale}" stroke-width="1" fill="none" opacity="0.3"/>
    <path d="M88,138 C72,132 54,122 44,127" stroke="${pale}" stroke-width="0.8" fill="none" opacity="0.22"/>
  </g>
  <g class="m-wing-r">
    <path d="M110,128 C138,112 172,96 190,112 C198,122 188,140 162,145 C142,149 120,137 110,128Z" fill="${c}" opacity="0.52"/>
    <path d="M110,128 C132,120 156,106 176,114" stroke="${pale}" stroke-width="1.5" fill="none" opacity="0.45"/>
    <path d="M115,133 C134,126 154,115 166,121" stroke="${pale}" stroke-width="1" fill="none" opacity="0.3"/>
    <path d="M112,138 C128,132 146,122 156,127" stroke="${pale}" stroke-width="0.8" fill="none" opacity="0.22"/>
  </g>
  <path d="M100,52 C133,52 154,73 156,107 C158,134 149,158 138,176 C127,192 116,202 108,215 C105,220 102,224 100,224 C98,224 95,220 92,215 C84,202 73,192 62,176 C51,158 42,134 44,107 C46,73 67,52 100,52Z" fill="url(#esp_body)"/>
  <path d="M100,52 C133,52 154,73 156,107 C158,134 149,158 138,176 C127,192 116,202 108,215 C105,220 102,224 100,224 C98,224 95,220 92,215 C84,202 73,192 62,176 C51,158 42,134 44,107 C46,73 67,52 100,52Z" fill="none" stroke="${pale}" stroke-width="1.8" opacity="0.38"/>
  <g class="m-tentacle">
    <path d="M80,200 C75,210 73,217 77,226" stroke="${lite}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.72"/>
  </g>
  <g class="m-tentacle">
    <path d="M100,208 C100,218 100,222 100,230" stroke="${lite}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.72"/>
  </g>
  <g class="m-tentacle">
    <path d="M120,200 C125,210 127,217 123,226" stroke="${lite}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.72"/>
  </g>
  <g class="m-rune">
    <polygon points="100,72 108,80 100,88 92,80" fill="none" stroke="${pale}" stroke-width="1.8" opacity="0.9"/>
    <line x1="100" y1="72" x2="100" y2="88" stroke="${pale}" stroke-width="1" opacity="0.55"/>
    <line x1="92" y1="80" x2="108" y2="80" stroke="${pale}" stroke-width="1" opacity="0.55"/>
    <circle cx="100" cy="80" r="2" fill="${pale}" opacity="0.7"/>
  </g>
  <g class="m-eye">
    <ellipse cx="82" cy="107" rx="12" ry="14" fill="${vdark}"/>
    <ellipse cx="82" cy="107" rx="9" ry="11" fill="url(#esp_eye)"/>
    <ellipse cx="82" cy="107" rx="3" ry="7.5" fill="${vdark}"/>
    <ellipse cx="83" cy="105" rx="2" ry="1.5" fill="#fff" opacity="0.75"/>
  </g>
  <g class="m-eye-r">
    <ellipse cx="118" cy="107" rx="12" ry="14" fill="${vdark}"/>
    <ellipse cx="118" cy="107" rx="9" ry="11" fill="url(#esp_eye)"/>
    <ellipse cx="118" cy="107" rx="3" ry="7.5" fill="${vdark}"/>
    <ellipse cx="119" cy="105" rx="2" ry="1.5" fill="#fff" opacity="0.75"/>
  </g>
  <path d="M86,128 C91,136 96,131 100,136 C104,131 109,136 114,128" stroke="${lite}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.82"/>
  <circle cx="66" cy="88" r="4"    fill="${pale}" opacity="0.52" class="m-star"/>
  <circle cx="136" cy="84" r="3"   fill="${pale}" opacity="0.44" class="m-star"/>
  <circle cx="56" cy="126" r="2.5" fill="${pale}" opacity="0.36" class="m-star"/>
  <circle cx="146" cy="122" r="3"  fill="${pale}" opacity="0.40" class="m-star"/>`;
}

// ── Phase 1: La Hidra de las Variables ──────────────────────────────────────
function _svgHidra(color){
  const c    = _hexToCSS(color);
  const dark = _shiftColor(c, -0.28);
  const lite = _shiftColor(c, 0.22);
  const pale = _shiftColor(c, 0.44);
  const vdark= _shiftColor(c, -0.48);

  // [headX, headY, neckRootX, neckRootY, controlX, controlY, headRx, headRy, animDelay]
  const H = [
    { hx:100, hy:32,  nx:100, ny:148, cpx:95,  cpy:90,  hrx:11, hry:15, d:0    },
    { hx:73,  hy:50,  nx:83,  ny:150, cpx:74,  cpy:100, hrx:10, hry:13, d:0.25 },
    { hx:127, hy:50,  nx:117, ny:150, cpx:126, cpy:100, hrx:10, hry:13, d:0.5  },
    { hx:48,  hy:70,  nx:66,  ny:155, cpx:50,  cpy:112, hrx:9,  hry:12, d:0.75 },
    { hx:152, hy:70,  nx:134, ny:155, cpx:150, cpy:112, hrx:9,  hry:12, d:1.0  },
    { hx:25,  hy:95,  nx:50,  ny:162, cpx:28,  cpy:128, hrx:8,  hry:11, d:1.25 },
    { hx:175, hy:95,  nx:150, ny:162, cpx:172, cpy:128, hrx:8,  hry:11, d:1.5  },
  ];
  const SW = [9,8,7.5,7,7,7,7];

  let svg = `
  <defs>
    <radialGradient id="hid_body" cx="50%" cy="38%" r="58%">
      <stop offset="0%" stop-color="${lite}"/>
      <stop offset="100%" stop-color="${vdark}"/>
    </radialGradient>
  </defs>
  <ellipse cx="100" cy="130" rx="90" ry="82" fill="${c}" opacity="0.15" class="m-enrage-overlay"/>
  <ellipse cx="100" cy="226" rx="60" ry="10" fill="#000" opacity="0.28"/>`;

  // Neck shadows (back layer)
  H.forEach((h, i) => {
    svg += `<path d="M${h.nx},${h.ny} Q${h.cpx},${h.cpy} ${h.hx},${h.hy}" fill="none" stroke="${vdark}" stroke-width="${SW[i]+2.5}" stroke-linecap="round"/>`;
  });

  // Neck fill + sway animation
  H.forEach((h, i) => {
    svg += `<path class="m-tentacle" d="M${h.nx},${h.ny} Q${h.cpx},${h.cpy} ${h.hx},${h.hy}" fill="none" stroke="${dark}" stroke-width="${SW[i]}" stroke-linecap="round" style="animation-delay:${h.d}s"/>`;
    svg += `<path d="M${h.nx},${h.ny} Q${h.cpx},${h.cpy} ${h.hx},${h.hy}" fill="none" stroke="${lite}" stroke-width="1.8" stroke-dasharray="5 7" opacity="0.28"/>`;
  });

  // Body
  svg += `
  <ellipse cx="100" cy="186" rx="78" ry="40" fill="url(#hid_body)"/>`;

  // Scale pattern
  for(let row = 0; row < 3; row++){
    for(let col = 0; col < 6; col++){
      const sx = 34 + col*23 + (row%2)*11;
      const sy = 172 + row*11;
      svg += `<ellipse cx="${sx}" cy="${sy}" rx="8" ry="4.5" fill="${vdark}" opacity="0.38"/>`;
      svg += `<ellipse cx="${sx}" cy="${sy}" rx="7" ry="3.5" fill="${dark}" opacity="0.22"/>`;
    }
  }

  svg += `
  <ellipse cx="100" cy="186" rx="78" ry="40" fill="none" stroke="${dark}" stroke-width="2"/>
  <ellipse cx="100" cy="186" rx="78" ry="40" fill="none" stroke="${lite}" stroke-width="1" opacity="0.26"/>
  <!-- body spots / dark markings -->
  <ellipse cx="78"  cy="178" rx="9" ry="5.5" fill="${vdark}" opacity="0.55"/>
  <ellipse cx="122" cy="176" rx="8" ry="5"   fill="${vdark}" opacity="0.55"/>
  <ellipse cx="100" cy="192" rx="10" ry="5.5" fill="${vdark}" opacity="0.5"/>
  <ellipse cx="66"  cy="191" rx="6"  ry="3.5" fill="${vdark}" opacity="0.45"/>
  <ellipse cx="136" cy="191" rx="6"  ry="3.5" fill="${vdark}" opacity="0.45"/>
  <ellipse cx="88"  cy="203" rx="5"  ry="3"   fill="${lite}"  opacity="0.22"/>
  <ellipse cx="114" cy="202" rx="5"  ry="3"   fill="${lite}"  opacity="0.22"/>
  <ellipse cx="55"  cy="182" rx="5"  ry="3"   fill="${vdark}" opacity="0.38"/>
  <ellipse cx="148" cy="183" rx="5"  ry="3"   fill="${vdark}" opacity="0.38"/>`;

  // Clawed feet (green toes + black nail tips)
  svg += `
  <ellipse cx="62"  cy="222" rx="15" ry="7" fill="${c}" opacity="0.9"/>
  <ellipse cx="138" cy="222" rx="15" ry="7" fill="${c}" opacity="0.9"/>
  <!-- left claws -->
  <path d="M50,220 L44,233" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
  <path d="M45,230 L41,237" stroke="#0a1400" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M59,218 L55,234" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
  <path d="M56,231 L53,238" stroke="#0a1400" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M70,219 L73,234" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
  <path d="M72,231 L74,238" stroke="#0a1400" stroke-width="3.5" stroke-linecap="round"/>
  <!-- right claws -->
  <path d="M126,220 L120,233" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
  <path d="M121,230 L117,237" stroke="#0a1400" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M136,218 L134,234" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
  <path d="M134,231 L133,238" stroke="#0a1400" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M150,220 L155,233" stroke="${c}" stroke-width="5" stroke-linecap="round"/>
  <path d="M154,230 L158,237" stroke="#0a1400" stroke-width="3.5" stroke-linecap="round"/>`;

  // Heads (terrifying: horn, slit pupils, open jaw, fangs)
  H.forEach((h, i) => {
    const rx = h.hrx, ry = h.hry;
    const eo  = (rx * 0.38).toFixed(1);   // eye x offset
    const ecy = (-(ry * 0.12)).toFixed(1); // eye y offset
    const esr = (rx * 0.32).toFixed(1);   // eye sclera radius
    const epr = (rx * 0.10).toFixed(1);   // pupil horizontal semi-axis
    const epH = (rx * 0.30).toFixed(1);   // pupil vertical semi-axis
    const jawY= (ry * 0.32).toFixed(1);   // upper-jaw bottom
    const jawB= (ry * 0.80).toFixed(1);   // lower-jaw tip
    const fjx = (rx * 0.44).toFixed(1);   // fang x
    const fjh = (ry * 0.40).toFixed(1);   // fang height
    const fjm = (rx * 0.25).toFixed(1);   // fang mid x
    const hnT = (ry + 3).toFixed(1);      // horn tip y above center
    const hnB = (ry * 0.55).toFixed(1);   // horn base half-width
    svg += `<g transform="translate(${h.hx},${h.hy})">
      <!-- skull outline -->
      <ellipse rx="${rx+3}" ry="${ry+2}" fill="${vdark}"/>
      <!-- upper head -->
      <ellipse rx="${rx}" ry="${(ry*0.88).toFixed(1)}" cy="${ecy}" fill="${dark}"/>
      <ellipse rx="${(rx-1.5).toFixed(1)}" ry="${(ry*0.76).toFixed(1)}" cy="${ecy}" fill="${c}"/>
      <!-- scale texture -->
      <ellipse cx="-${(rx*0.28).toFixed(1)}" cy="${ecy}" rx="${(rx*0.26).toFixed(1)}" ry="${(ry*0.22).toFixed(1)}" fill="${vdark}" opacity="0.28"/>
      <ellipse cx="${(rx*0.28).toFixed(1)}"  cy="${ecy}" rx="${(rx*0.26).toFixed(1)}" ry="${(ry*0.22).toFixed(1)}" fill="${vdark}" opacity="0.28"/>
      <!-- horn -->
      <polygon points="0,-${hnT} ${hnB},-${(ry*0.58).toFixed(1)} -${hnB},-${(ry*0.58).toFixed(1)}" fill="${vdark}"/>
      <polygon points="0,-${hnT} ${(rx*0.11).toFixed(1)},-${(ry*0.63).toFixed(1)} -${(rx*0.11).toFixed(1)},-${(ry*0.63).toFixed(1)}" fill="#0a1a00"/>
      <!-- evil eyes: yellow sclera + vertical slit pupil -->
      <ellipse class="m-eye"   cx="-${eo}" cy="${ecy}" rx="${esr}" ry="${(parseFloat(esr)*1.25).toFixed(1)}" fill="#ffdd00"/>
      <ellipse class="m-eye-r" cx="${eo}"  cy="${ecy}" rx="${esr}" ry="${(parseFloat(esr)*1.25).toFixed(1)}" fill="#ffdd00"/>
      <ellipse cx="-${eo}" cy="${ecy}" rx="${epr}" ry="${epH}" fill="#050a00"/>
      <ellipse cx="${eo}"  cy="${ecy}" rx="${epr}" ry="${epH}" fill="#050a00"/>
      <!-- lower jaw (open, dark) -->
      <path d="M-${(rx*0.78).toFixed(1)},${jawY} Q0,${jawB} ${(rx*0.78).toFixed(1)},${jawY}" fill="${vdark}"/>
      <!-- fangs upper row (3 teeth) -->
      <polygon points="-${fjx},${jawY} -${(parseFloat(fjx)-parseFloat(fjm)*0.6).toFixed(1)},${(parseFloat(jawY)+parseFloat(fjh)*1.3).toFixed(1)} -${(parseFloat(fjx)-parseFloat(fjm)*1.2).toFixed(1)},${jawY}" fill="white"/>
      <polygon points="-${(rx*0.08).toFixed(1)},${jawY} 0,${(parseFloat(jawY)+parseFloat(fjh)*1.1).toFixed(1)} ${(rx*0.08).toFixed(1)},${jawY}" fill="white"/>
      <polygon points="${fjx},${jawY} ${(parseFloat(fjx)-parseFloat(fjm)*0.6).toFixed(1)},${(parseFloat(jawY)+parseFloat(fjh)*1.3).toFixed(1)} ${(parseFloat(fjx)-parseFloat(fjm)*1.2).toFixed(1)},${jawY}" fill="white"/>
      <!-- poison drip glow -->
      <circle cx="0" cy="${(parseFloat(jawY)+parseFloat(fjh)*0.6).toFixed(1)}" r="${i===0?3:2}" fill="#00ff66" opacity="0.7" class="m-star"/>
    </g>`;
  });

  // Poison drip
  svg += `
  <circle cx="100" cy="${H[0].hy+18}" r="3"   fill="#00ff88" opacity="0.62" class="m-star"/>
  <circle cx="73"  cy="${H[1].hy+16}" r="2.5" fill="#00ff88" opacity="0.52" class="m-star"/>
  <circle cx="127" cy="${H[2].hy+16}" r="2.5" fill="#00ff88" opacity="0.52" class="m-star"/>`;

  return svg;
}

// ── PHASE 2 ──────────────────────────────────────────────────────────────────

function _svgGolem(color) {
  const c = _hexToCSS(color), dark = _shiftColor(c, -0.35), lite = _shiftColor(c, 0.25),
        vdark = _shiftColor(c, -0.55), crack = '#8B9BA8';
  return `<defs>
    <radialGradient id="gol_body" cx="45%" cy="35%" r="60%">
      <stop offset="0%" stop-color="${lite}"/>
      <stop offset="100%" stop-color="${vdark}"/>
    </radialGradient>
    <radialGradient id="gol_eye" cx="40%" cy="35%" r="55%">
      <stop offset="0%" stop-color="#FF4444"/>
      <stop offset="100%" stop-color="#880000"/>
    </radialGradient>
  </defs>
  <!-- shadow -->
  <ellipse cx="100" cy="228" rx="42" ry="8" fill="#00000044"/>
  <!-- legs -->
  <rect x="72" y="180" width="22" height="48" rx="6" fill="${dark}"/>
  <rect x="106" y="180" width="22" height="48" rx="6" fill="${dark}"/>
  <!-- feet -->
  <rect x="68" y="218" width="30" height="14" rx="5" fill="${vdark}"/>
  <rect x="102" y="218" width="30" height="14" rx="5" fill="${vdark}"/>
  <!-- torso -->
  <rect x="62" y="105" width="76" height="85" rx="10" fill="url(#gol_body)"/>
  <!-- bell-curve rune on chest -->
  <g class="m-rune">
    <rect x="74" y="118" width="52" height="30" rx="4" fill="${vdark}" opacity="0.7"/>
    <path d="M78,142 Q100,118 122,142" stroke="#D4AF37" stroke-width="2" fill="none"/>
    <line x1="78" y1="142" x2="122" y2="142" stroke="#D4AF37" stroke-width="1.5"/>
    <line x1="100" y1="118" x2="100" y2="142" stroke="#D4AF37" stroke-width="1" stroke-dasharray="2,2"/>
  </g>
  <!-- crack lines on torso -->
  <path d="M85,110 L80,130 L88,135 L83,155" stroke="${crack}" stroke-width="1.5" fill="none" opacity="0.6"/>
  <path d="M112,115 L116,128 L110,133" stroke="${crack}" stroke-width="1" fill="none" opacity="0.5"/>
  <!-- arms -->
  <rect x="30" y="108" width="34" height="22" rx="8" fill="${dark}"/>
  <rect x="136" y="108" width="34" height="22" rx="8" fill="${dark}"/>
  <!-- fists -->
  <rect x="24" y="122" width="26" height="24" rx="7" fill="${c}"/>
  <rect x="150" y="122" width="26" height="24" rx="7" fill="${c}"/>
  <!-- shoulders bolts -->
  <circle cx="48" cy="108" r="5" fill="${lite}"/><circle cx="48" cy="108" r="2.5" fill="${vdark}"/>
  <circle cx="152" cy="108" r="5" fill="${lite}"/><circle cx="152" cy="108" r="2.5" fill="${vdark}"/>
  <!-- neck -->
  <rect x="86" y="88" width="28" height="22" rx="5" fill="${dark}"/>
  <!-- head -->
  <rect x="64" y="55" width="72" height="60" rx="12" fill="url(#gol_body)"/>
  <!-- head cracks -->
  <path d="M90,58 L87,72 L93,75" stroke="${crack}" stroke-width="1.5" fill="none" opacity="0.7"/>
  <!-- eyes -->
  <g class="m-eye">
    <circle cx="86" cy="75" r="10" fill="${vdark}"/>
    <circle cx="86" cy="75" r="7" fill="url(#gol_eye)"/>
    <circle cx="83" cy="72" r="2.5" fill="#FF8888" opacity="0.8"/>
  </g>
  <g class="m-eye-r">
    <circle cx="114" cy="75" r="10" fill="${vdark}"/>
    <circle cx="114" cy="75" r="7" fill="url(#gol_eye)"/>
    <circle cx="111" cy="72" r="2.5" fill="#FF8888" opacity="0.8"/>
  </g>
  <!-- mouth slot -->
  <rect x="80" y="96" width="40" height="8" rx="4" fill="${vdark}"/>
  <rect x="84" y="98" width="7" height="4" rx="1" fill="#FF4444" opacity="0.7"/>
  <rect x="95" y="98" width="7" height="4" rx="1" fill="#FF4444" opacity="0.7"/>
  <rect x="106" y="98" width="7" height="4" rx="1" fill="#FF4444" opacity="0.7"/>
  <!-- head bolts -->
  <circle cx="68" cy="72" r="4" fill="${lite}"/><circle cx="68" cy="72" r="2" fill="${vdark}"/>
  <circle cx="132" cy="72" r="4" fill="${lite}"/><circle cx="132" cy="72" r="2" fill="${vdark}"/>
  <!-- enrage overlay -->
  <ellipse cx="100" cy="120" rx="70" ry="80" fill="#FF000022" class="m-enrage-overlay"/>`;
}

function _svgBruja(color) {
  const c = _hexToCSS(color), dark = _shiftColor(c, -0.35), lite = _shiftColor(c, 0.3),
        vdark = _shiftColor(c, -0.55), gold = '#D4AF37',
        skin = '#c39a68', skinL = '#e2c095', skinD = '#7d5228', skinM = '#cfa572',
        hair = '#150600', hair2 = '#2b1403';
  return `<defs>
    <radialGradient id="brj_body" cx="38%" cy="26%" r="72%">
      <stop offset="0%" stop-color="${lite}"/>
      <stop offset="55%" stop-color="${c}"/>
      <stop offset="100%" stop-color="${vdark}"/>
    </radialGradient>
    <radialGradient id="brj_skin" cx="40%" cy="28%" r="75%">
      <stop offset="0%" stop-color="${skinL}"/>
      <stop offset="55%" stop-color="${skin}"/>
      <stop offset="100%" stop-color="${skinD}"/>
    </radialGradient>
    <linearGradient id="brj_hat" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="${lite}"/>
      <stop offset="45%" stop-color="${dark}"/>
      <stop offset="100%" stop-color="${vdark}"/>
    </linearGradient>
    <radialGradient id="brj_orb" cx="34%" cy="28%" r="72%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="30%" stop-color="#fff2c0"/>
      <stop offset="65%" stop-color="#e8bf45"/><stop offset="100%" stop-color="#6b4a00"/>
    </radialGradient>
    <radialGradient id="brj_halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffd766" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffd766" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="brj_wood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#3d2410"/><stop offset="35%" stop-color="#7a4d24"/>
      <stop offset="65%" stop-color="#5d3618"/><stop offset="100%" stop-color="#2a1608"/>
    </linearGradient>
    <radialGradient id="brj_iris" cx="38%" cy="34%" r="70%">
      <stop offset="0%" stop-color="#ff6a2a"/><stop offset="45%" stop-color="#c11500"/>
      <stop offset="100%" stop-color="#3a0000"/>
    </radialGradient>
    <linearGradient id="brj_cav" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a0007"/><stop offset="55%" stop-color="#3a000d"/>
      <stop offset="100%" stop-color="#63091b"/>
    </linearGradient>
    <linearGradient id="brj_th" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffbe9"/><stop offset="100%" stop-color="#cbbc90"/>
    </linearGradient>
    <linearGradient id="brj_th2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#efe0a4"/><stop offset="100%" stop-color="#a8934c"/>
    </linearGradient>
  </defs>
  <!-- shadow -->
  <ellipse cx="100" cy="228" rx="40" ry="7.5" fill="#00000055"/>
  <!-- robe -->
  <path d="M60,198 Q52,236 100,236 Q148,236 140,198 Z" fill="${dark}"/>
  <path d="M64,118 Q56,178 60,199 L140,199 Q144,178 136,118 Z" fill="url(#brj_body)"/>
  <path d="M78,124 Q74,164 76,198" stroke="${vdark}" stroke-width="2.2" fill="none" opacity="0.55"/>
  <path d="M100,126 Q99,166 100,199" stroke="${vdark}" stroke-width="1.8" fill="none" opacity="0.4"/>
  <path d="M122,124 Q126,164 124,198" stroke="${vdark}" stroke-width="2.2" fill="none" opacity="0.55"/>
  <path d="M60,199 Q80,206 100,203 Q120,206 140,199" stroke="${gold}" stroke-width="1.6" fill="none" opacity="0.45"/>
  <!-- belt -->
  <rect x="70" y="152" width="60" height="11" rx="3" fill="${gold}" opacity="0.85"/>
  <rect x="70" y="152" width="60" height="4" rx="2" fill="#f6dc86" opacity="0.5"/>
  <circle cx="100" cy="157.5" r="6.5" fill="#8a6a10"/>
  <circle cx="100" cy="157.5" r="5" fill="${gold}"/>
  <circle cx="100" cy="156" r="2" fill="#ffeaa0" opacity="0.8"/>
  <!-- sleeves -->
  <path d="M66,124 Q40,140 29,164" stroke="${dark}" stroke-width="17" stroke-linecap="round" fill="none"/>
  <path d="M66,124 Q42,139 32,161" stroke="${c}" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.45"/>
  <path d="M134,124 Q160,139 156,154" stroke="${dark}" stroke-width="17" stroke-linecap="round" fill="none"/>
  <path d="M134,124 Q158,138 154,152" stroke="${c}" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.45"/>
  <!-- left hand (open, bony) -->
  <path d="M24,160 Q26,172 33,173 Q40,172 38,161 Q33,156 24,160 Z" fill="${skin}"/>
  <path d="M23,160 L17,153 M27,157 L23,149 M32,156 L30,148 M37,158 L37,150" stroke="${skin}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
  <path d="M23,160 L17,153 M27,157 L23,149 M32,156 L30,148 M37,158 L37,150" stroke="${skinD}" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.6"/>
  <!-- hair (behind head, over robe) -->
  <path d="M70,70 Q44,92 40,124 Q36,156 45,180" stroke="${hair}" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.92"/>
  <path d="M74,70 Q52,94 50,126 Q47,156 56,178" stroke="${hair2}" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.85"/>
  <path d="M66,70 Q40,92 36,126 Q32,160 41,184" stroke="${hair}" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.7"/>
  <path d="M130,70 Q156,92 160,124 Q164,156 155,180" stroke="${hair}" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.92"/>
  <path d="M126,70 Q148,94 150,126 Q153,156 144,178" stroke="${hair2}" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.85"/>
  <path d="M134,70 Q160,92 164,126 Q168,160 159,184" stroke="${hair}" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.7"/>
  <!-- staff: DELANTE del pelo, si no la vara queda tapada y el orbe parece flotar.
       Pivota en la empuñadura (clase m-staff), por eso la mano puede quedarse quieta. -->
  <g class="m-staff">
    <path d="M158,168 L174,52" stroke="#150a04" stroke-width="7.5" stroke-linecap="round" fill="none" opacity="0.55"/>
    <path d="M158,168 L174,52" stroke="url(#brj_wood)" stroke-width="5.6" stroke-linecap="round" fill="none"/>
    <path d="M159.4,160 L172.6,64" stroke="#a6743c" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.5"/>
    <path d="M161,142 Q164,138 163.5,132" stroke="#2a1608" stroke-width="1" fill="none" opacity="0.6"/>
    <path d="M166,104 Q169,100 168.5,94" stroke="#2a1608" stroke-width="1" fill="none" opacity="0.6"/>
    <path d="M165.5,118 Q171,116 174,120 Q169,124 165,121 Z" fill="#7a4d24"/>
    <path d="M165.5,118 Q171,116 174,120" stroke="#a6743c" stroke-width="1" fill="none" opacity="0.6"/>
    <rect x="157.6" y="146" width="7.4" height="18" rx="2.4" transform="rotate(7.9 161.3 155)" fill="#4a2a12"/>
    <path d="M157.4,150 L165.2,148.9 M157.9,154.5 L165.7,153.4 M158.4,159 L166.2,157.9" stroke="#8a5c2c" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.8"/>
    <ellipse cx="173.4" cy="58" rx="5" ry="3.4" fill="#8a6a10"/>
    <ellipse cx="173.4" cy="57" rx="5" ry="3.4" fill="${gold}"/>
    <circle cx="171.5" cy="47" r="15" fill="url(#brj_halo)"/>
    <circle cx="171.5" cy="47" r="11.5" fill="none" stroke="#8a6a10" stroke-width="3.4"/>
    <circle cx="171.5" cy="47" r="11.5" fill="none" stroke="${gold}" stroke-width="2.2"/>
    <circle cx="171.5" cy="47" r="8" fill="url(#brj_orb)"/>
    <circle cx="168.8" cy="44.2" r="2.4" fill="#fff" opacity="0.92"/>
    <path d="M166,50.5 Q171.5,54 177,50.5" stroke="#fff6d0" stroke-width="1" fill="none" opacity="0.45"/>
    <!-- Eje propio: la regla global de .m-orbit fija el origen en 100px,120px,
         pensado para orbes en el centro del cuerpo. Este va en la punta del
         báculo, así que cada anillo tiene que girar sobre sí mismo o describe
         una órbita gigante lejos del orbe. -->
    <g class="m-orbit" style="transform-origin:center center"><ellipse cx="171.5" cy="47" rx="20" ry="7.2" fill="none" stroke="${lite}" stroke-width="1.7" opacity="0.8"/></g>
    <g class="m-orbit-rev" style="transform-origin:center center"><ellipse cx="171.5" cy="47" rx="14.5" ry="19.5" fill="none" stroke="${lite}" stroke-width="1.2" opacity="0.55"/></g>
    <circle cx="186" cy="36" r="2.6" fill="${gold}" class="m-star"/>
    <circle cx="158" cy="34" r="2" fill="${lite}" class="m-star"/>
  </g>
  <!-- right hand gripping the shaft (drawn after it so the fingers wrap around) -->
  <path d="M149,150 Q150,163 157,165 Q165,164 164,152 Q158,146 149,150 Z" fill="${skin}"/>
  <path d="M149,150 Q150,163 157,165 Q165,164 164,152" stroke="${skinD}" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M150.5,151.5 Q157,148.5 163,151" stroke="${skinL}" stroke-width="1.4" fill="none" opacity="0.45"/>
  <path d="M152.5,148.6 Q158,145.5 163.5,149.5 Q164.5,152.5 163,154 Q157.5,150.5 152,153 Z" fill="${skinM}"/>
  <path d="M152.5,153.4 Q158,150.5 163.6,154.2 Q164.4,157 163,158.4 Q157.5,155 152,157.4 Z" fill="${skin}"/>
  <path d="M153,158 Q158,155.4 163,158.6 Q163.6,161.2 162.2,162.4 Q157.6,159.4 152.6,161.6 Z" fill="#b78d5c"/>
  <path d="M152.5,148.6 Q158,145.5 163.5,149.5 M152.5,153.4 Q158,150.5 163.6,154.2 M153,158 Q158,155.4 163,158.6" stroke="${skinD}" stroke-width="0.8" fill="none" opacity="0.55"/>
  <path d="M149.6,150.4 Q145.4,145 143.6,141.6" stroke="${skin}" stroke-width="3.4" stroke-linecap="round" fill="none"/>
  <path d="M149.6,150.4 Q145.4,145 143.6,141.6" stroke="${skinD}" stroke-width="1" stroke-linecap="round" fill="none" opacity="0.45"/>
  <!-- floating sparks -->
  <circle cx="40" cy="146" r="3.2" fill="${gold}" class="m-star"/>
  <circle cx="24" cy="160" r="2.2" fill="${lite}" class="m-star"/>
  <!-- neck -->
  <path d="M88,112 Q88,128 84,136 Q100,142 116,136 Q112,128 112,112 Z" fill="#a8814f"/>
  <path d="M88,116 Q100,124 112,116" stroke="#6d4520" stroke-width="1.6" fill="none" opacity="0.6"/>
  <path d="M91,124 Q100,130 109,124" stroke="#6d4520" stroke-width="1.2" fill="none" opacity="0.45"/>
  <!-- head -->
  <path d="M70,90 Q69,60 100,56 Q131,60 130,90 Q131,109 124,121 Q118,135 110,147 Q104,157 100,160 Q96,157 90,147 Q82,135 76,121 Q69,109 70,90 Z" fill="url(#brj_skin)"/>
  <path d="M70,90 Q69,60 100,56 Q112,58 120,66" stroke="${skinL}" stroke-width="1.8" fill="none" opacity="0.35"/>
  <path d="M128,96 Q126,116 118,130" stroke="#6d4520" stroke-width="2" fill="none" opacity="0.3"/>
  <!-- forehead wrinkles -->
  <path d="M80,74 Q100,70 120,74" stroke="${skinD}" stroke-width="1.4" fill="none" opacity="0.5"/>
  <path d="M83,68 Q100,64 117,68" stroke="${skinD}" stroke-width="1.1" fill="none" opacity="0.4"/>
  <path d="M86,62 Q100,59 114,62" stroke="${skinD}" stroke-width="0.9" fill="none" opacity="0.28"/>
  <!-- brows -->
  <path d="M76,84 Q86,77 98,82" stroke="#1c0a00" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M102,82 Q114,77 124,84" stroke="#1c0a00" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M78,80 Q86,75 94,78" stroke="#4a2c0c" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.6"/>
  <path d="M106,78 Q114,75 122,80" stroke="#4a2c0c" stroke-width="1.4" stroke-linecap="round" fill="none" opacity="0.6"/>
  <!-- eye sockets -->
  <ellipse cx="86" cy="93" rx="13" ry="12.5" fill="${skinD}" opacity="0.5"/>
  <ellipse cx="114" cy="93" rx="13" ry="12.5" fill="${skinD}" opacity="0.5"/>
  <path d="M74,90 Q80,84 88,85" stroke="#6d4520" stroke-width="1.4" fill="none" opacity="0.45"/>
  <path d="M126,90 Q120,84 112,85" stroke="#6d4520" stroke-width="1.4" fill="none" opacity="0.45"/>
  <!-- eyes (compact groups: m-blink escala sobre el bbox propio) -->
  <g class="m-eye">
    <ellipse cx="86" cy="93" rx="9.5" ry="9" fill="#f0e2c8"/>
    <ellipse cx="86" cy="93" rx="9.5" ry="9" fill="none" stroke="#5a3a18" stroke-width="1"/>
    <circle cx="86.5" cy="93" r="6" fill="url(#brj_iris)"/>
    <circle cx="86.5" cy="93" r="2.6" fill="#100000"/>
    <circle cx="84.3" cy="90.6" r="1.6" fill="#fff" opacity="0.75"/>
    <path d="M77,89 Q86,83 95,89" fill="${skin}"/>
    <path d="M77.5,90 Q86,84.5 94.5,90" stroke="#6d4520" stroke-width="1.1" fill="none" opacity="0.7"/>
  </g>
  <g class="m-eye-r">
    <ellipse cx="114" cy="93" rx="9.5" ry="9" fill="#f0e2c8"/>
    <ellipse cx="114" cy="93" rx="9.5" ry="9" fill="none" stroke="#5a3a18" stroke-width="1"/>
    <circle cx="113.5" cy="93" r="6" fill="url(#brj_iris)"/>
    <circle cx="113.5" cy="93" r="2.6" fill="#100000"/>
    <circle cx="111.3" cy="90.6" r="1.6" fill="#fff" opacity="0.75"/>
    <path d="M105,89 Q114,83 123,89" fill="${skin}"/>
    <path d="M105.5,90 Q114,84.5 122.5,90" stroke="#6d4520" stroke-width="1.1" fill="none" opacity="0.7"/>
  </g>
  <path d="M74,99 Q78,103 82,104" stroke="#6d4520" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M126,99 Q122,103 118,104" stroke="#6d4520" stroke-width="1" fill="none" opacity="0.5"/>
  <!-- cheek hollows -->
  <path d="M79,104 Q83,118 80,132" stroke="${skinD}" stroke-width="1.5" fill="none" opacity="0.4"/>
  <path d="M121,104 Q117,118 120,132" stroke="${skinD}" stroke-width="1.5" fill="none" opacity="0.4"/>
  <!-- MOUTH: cavidad, encías y lengua. Los dientes nacen sobre la curva del
       labio (Bézier), por eso ninguno queda flotando fuera de la boca. -->
  <path d="M79,126 Q100,145 121,126 Q100,174 79,126 Z" fill="url(#brj_cav)"/>
  <path d="M88,150 Q100,161 112,150 Q100,168 88,150 Z" fill="#8c1f33" opacity="0.92"/>
  <path d="M94,153 Q100,157 106,153" stroke="#5e0f20" stroke-width="1.1" fill="none" opacity="0.7"/>
  <path d="M79,126 Q100,145 121,126 Q100,152 79,126 Z" fill="#7d3c46" opacity="0.9"/>
  <path d="M121,126 Q100,174 79,126 Q100,160 121,126 Z" fill="#6e3038" opacity="0.82"/>
  <!-- upper teeth (hang from the gum) -->
  <path d="M82.9,134.1 L86.9,134.1 L86.2,138.1 L83.8,138.1 Z" fill="url(#brj_th)"/>
  <polygon points="88,137 92.6,137 90.6,146.5" fill="url(#brj_th)"/>
  <path d="M99,139 L103.6,139 L103.3,141.5 L99.4,141.5 Z" fill="#33291a"/>
  <path d="M104.2,138 L109.2,138 L108.6,142.5 L104.9,142.5 Z" fill="url(#brj_th2)"/>
  <path d="M110,135.8 L114.4,135.8 L113.8,139.3 L110.6,139.3 Z" fill="url(#brj_th)"/>
  <polygon points="115.1,132.9 118.5,132.9 117.3,136.4" fill="url(#brj_th2)"/>
  <!-- lower teeth (rise from the gum; the long one fills the missing upper slot) -->
  <path d="M81.3,133 L84.7,133 L84.3,130 L81.8,130 Z" fill="url(#brj_th2)"/>
  <polygon points="92.7,145.1 97.3,145.1 95.2,136.1" fill="url(#brj_th)"/>
  <path d="M101.8,146 L105.2,146 L104.8,143.4 L102.3,143.4 Z" fill="url(#brj_th2)"/>
  <path d="M90.6,138.6 L91.3,144.4" stroke="#fffdf2" stroke-width="0.7" fill="none" opacity="0.5"/>
  <!-- lips: cinta fina que sigue el arco. Una banda recta y ancha aquí se lee
       como bigote y además taparía las aletas de la nariz. -->
  <path d="M79,123 Q100,142 121,123 L121,126 Q100,145 79,126 Z" fill="#c08a68"/>
  <path d="M79,123 Q100,142 121,123" stroke="#8a5c38" stroke-width="1" fill="none" opacity="0.65"/>
  <path d="M92,131.6 Q96,134.4 100,134.9 Q104,134.4 108,131.6" stroke="#e0aa8a" stroke-width="1" fill="none" opacity="0.4"/>
  <path d="M79,126 Q100,174 121,126 Q100,163 79,126 Z" fill="#bd8a70"/>
  <path d="M79,126 Q100,174 121,126" stroke="#84512f" stroke-width="1.2" fill="none" opacity="0.55"/>
  <path d="M89,155 Q100,160 111,155" stroke="#e0aa8a" stroke-width="1.3" fill="none" opacity="0.42"/>
  <path d="M95,153 L95.5,157.5 M100,154.5 L100,159 M105,153 L104.5,157.5" stroke="#84512f" stroke-width="0.7" fill="none" opacity="0.4"/>
  <path d="M79,126 Q81.5,129.5 82.5,133" stroke="#6d4520" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6"/>
  <path d="M121,126 Q118.5,129.5 117.5,133" stroke="#6d4520" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6"/>
  <!-- NOSE: se dibuja después de la boca porque sobresale por delante del labio -->
  <path d="M102.5,83 Q104.5,98 106,108 Q107.5,115 107,119.5 Q106,123.5 102.5,124.5 L100,124.8 L100,83 Z" fill="#a8783f" opacity="0.5"/>
  <path d="M97.5,83 Q95.5,96 94,106 Q92.2,113 92.4,117.8 Q92.8,122.4 96,124.2 Q98,125.2 100,125.1 Q102.6,125.1 104.8,123.6 Q107.4,121.6 107.4,117.6 Q107.2,112.6 105.6,106 Q104,96 102.5,83 Z" fill="${skinM}"/>
  <path d="M98.6,86 Q96.8,98 95.4,107 Q94,113 94.2,117.4" stroke="#f0d6ad" stroke-width="1.7" stroke-linecap="round" fill="none" opacity="0.5"/>
  <ellipse cx="98.2" cy="119.4" rx="4.6" ry="3.4" fill="#dcb182" opacity="0.5"/>
  <path d="M92.6,116.6 Q94.6,121.6 98,122.6" stroke="#8a5e2c" stroke-width="1.2" fill="none" opacity="0.6"/>
  <path d="M107,116.6 Q105.4,121.4 102.4,122.6" stroke="#8a5e2c" stroke-width="1.2" fill="none" opacity="0.6"/>
  <ellipse cx="95.4" cy="121.6" rx="2.4" ry="1.5" fill="#3d2408" opacity="0.85" transform="rotate(-16 95.4 121.6)"/>
  <ellipse cx="104.3" cy="121.4" rx="2.3" ry="1.4" fill="#3d2408" opacity="0.85" transform="rotate(15 104.3 121.4)"/>
  <path d="M98.6,122.6 Q100,123.8 101.4,122.6" stroke="#a8783f" stroke-width="1" fill="none" opacity="0.7"/>
  <ellipse cx="100" cy="126" rx="6.5" ry="1.6" fill="#8a5e2c" opacity="0.22"/>
  <circle cx="91.4" cy="113.6" r="3.2" fill="#9c6f3a"/>
  <circle cx="90.5" cy="112.5" r="1.2" fill="#c8a070" opacity="0.8"/>
  <path d="M98.4,126.4 L98.7,129.6 M101.6,126.4 L101.3,129.6" stroke="#a8783f" stroke-width="0.8" fill="none" opacity="0.45"/>
  <!-- chin wart -->
  <circle cx="105" cy="152" r="2.8" fill="#9c6f3a"/>
  <circle cx="104.2" cy="151.2" r="1.1" fill="#c8a070" opacity="0.7"/>
  <!-- hat -->
  <ellipse cx="100" cy="68" rx="45" ry="10" fill="${vdark}"/>
  <ellipse cx="100" cy="66.5" rx="45" ry="9.5" fill="url(#brj_hat)"/>
  <ellipse cx="100" cy="65" rx="38" ry="6.5" fill="${dark}" opacity="0.7"/>
  <path d="M55,67 Q78,73 100,73 Q122,73 145,67" stroke="${vdark}" stroke-width="1.6" fill="none" opacity="0.7"/>
  <!-- Copa: misma base (64..136 en y=70) que la versión redondeada, pero las
       paredes suben cóncavas y cierran en punta en (100,5). El perfil cóncavo es
       lo que da la silueta de bruja; subir recto daría un cucurucho. -->
  <path d="M64,70 Q78,42 97,11 Q99,7 100,5 Q101,7 103,11 Q122,42 136,70 Q118,74 100,74 Q82,74 64,70 Z" fill="url(#brj_hat)"/>
  <path d="M100,5 Q101,7 103,11 Q122,42 136,70 Q118,74 100,74 Z" fill="${vdark}" opacity="0.3"/>
  <path d="M89,70 Q93,42 99,13" stroke="${vdark}" stroke-width="1.4" fill="none" opacity="0.4"/>
  <path d="M112,70 Q107,42 101,13" stroke="${vdark}" stroke-width="1.4" fill="none" opacity="0.35"/>
  <path d="M124,66 Q114,44 104,20" stroke="${vdark}" stroke-width="1.2" fill="none" opacity="0.28"/>
  <path d="M78,66 Q86,40 98,14" stroke="${lite}" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="0.4"/>
  <path d="M72,62 Q80,42 92,22" stroke="${lite}" stroke-width="1" fill="none" opacity="0.22"/>
  <path d="M67,58 Q100,64 133,58 L134,68 Q100,74 66,68 Z" fill="${vdark}" opacity="0.85"/>
  <rect x="90" y="57" width="20" height="11" rx="2" fill="#8a6a10"/>
  <rect x="90.8" y="57.8" width="18.4" height="9.4" rx="1.6" fill="${gold}"/>
  <rect x="94.5" y="60.5" width="11" height="4" rx="1" fill="${dark}"/>
  <rect x="90.8" y="57.8" width="18.4" height="3" rx="1.5" fill="#f6dc86" opacity="0.45"/>
  <circle cx="112" cy="30" r="2.2" fill="${gold}" class="m-star"/>
  <circle cx="88" cy="24" r="1.7" fill="${lite}" class="m-star"/>
  <!-- hair wisps under the brim -->
  <path d="M69,70 Q56,82 60,98" stroke="${hair}" stroke-width="5.5" stroke-linecap="round" fill="none"/>
  <path d="M74,72 Q64,82 66,94" stroke="${hair2}" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.8"/>
  <path d="M131,70 Q144,82 140,98" stroke="${hair}" stroke-width="5.5" stroke-linecap="round" fill="none"/>
  <path d="M126,72 Q136,82 134,94" stroke="${hair2}" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.8"/>
  <!-- enrage overlay -->
  <ellipse cx="100" cy="130" rx="68" ry="88" fill="#FF000022" class="m-enrage-overlay"/>`;
}

// ── PHASE 3 ──────────────────────────────────────────────────────────────────

function _svgTiburon(color) {
  const c = _hexToCSS(color), dark = _shiftColor(c, -0.35), lite = _shiftColor(c, 0.3),
        belly = '#E8EEF2', vdark = _shiftColor(c, -0.55);
  return `<defs>
    <radialGradient id="tib_body" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${lite}"/>
      <stop offset="100%" stop-color="${vdark}"/>
    </radialGradient>
  </defs>
  <!-- shadow -->
  <ellipse cx="100" cy="228" rx="50" ry="8" fill="#00000044"/>
  <!-- tail fin -->
  <g class="m-tail">
    <path d="M60,185 Q30,160 20,140 Q40,155 55,155 Z" fill="${dark}"/>
    <path d="M60,185 Q30,200 18,220 Q42,200 56,190 Z" fill="${dark}"/>
  </g>
  <!-- body -->
  <ellipse cx="100" cy="155" rx="62" ry="55" fill="url(#tib_body)"/>
  <!-- belly -->
  <ellipse cx="108" cy="163" rx="38" ry="38" fill="${belly}" opacity="0.45"/>
  <!-- pectoral fins -->
  <g class="m-wing-l">
    <path d="M58,155 Q32,170 28,195 Q48,175 65,172 Z" fill="${dark}"/>
  </g>
  <g class="m-wing-r">
    <path d="M142,155 Q168,170 172,195 Q152,175 135,172 Z" fill="${dark}"/>
  </g>
  <!-- dorsal fin -->
  <g class="m-tentacle">
    <path d="M88,102 Q94,60 100,45 Q106,60 112,102 Z" fill="${dark}"/>
  </g>
  <!-- gills (prominent slits) -->
  <path d="M70,138 Q66,151 68,164 Q72,167 74,164 Q72,150 76,138 Z" fill="${vdark}" opacity="0.65"/>
  <path d="M78,135 Q74,149 76,162 Q80,165 82,162 Q80,149 84,135 Z" fill="${vdark}" opacity="0.45"/>
  <path d="M86,133 Q83,147 85,158" stroke="${vdark}" stroke-width="2" fill="none" opacity="0.35"/>
  <!-- HEAD: realistic shark (faces right) -->
  <!-- upper jaw profile -->
  <path d="M108,134 Q148,122 192,148 L192,156 Q168,148 148,150 Q128,152 108,156 Z" fill="${dark}"/>
  <!-- snout nostril -->
  <ellipse cx="184" cy="144" rx="4" ry="3" fill="${vdark}" opacity="0.7"/>
  <!-- lower jaw (open wide, drooping) -->
  <path d="M108,168 Q136,184 178,175 Q187,170 192,162 L192,156 Q186,160 166,164 Q140,168 108,164 Z" fill="${dark}"/>
  <!-- belly of lower jaw -->
  <ellipse cx="150" cy="176" rx="38" ry="9" fill="${belly}" opacity="0.28"/>
  <!-- mouth interior (abyss) -->
  <path d="M108,156 Q148,166 192,156 L192,162 Q178,174 148,172 Q128,172 108,164 Z" fill="#040008"/>
  <!-- TEETH upper jaw row 1 (primary, long) -->
  <polygon points="116,156 118,169 120,156" fill="white"/>
  <polygon points="123,155 126,169 129,155" fill="white"/>
  <polygon points="131,154 134,168 137,154" fill="white"/>
  <polygon points="139,153 142,167 145,153" fill="white"/>
  <polygon points="148,152 151,166 154,152" fill="white"/>
  <polygon points="157,152 160,165 163,152" fill="white"/>
  <polygon points="165,153 168,164 171,153" fill="white"/>
  <!-- TEETH upper jaw row 2 (shorter, behind) -->
  <polygon points="120,156 122,165 124,156" fill="#d0d0d0" opacity="0.85"/>
  <polygon points="132,154 134,163 136,154" fill="#d0d0d0" opacity="0.85"/>
  <polygon points="143,153 145,162 147,153" fill="#d0d0d0" opacity="0.85"/>
  <polygon points="154,152 156,161 158,152" fill="#d0d0d0" opacity="0.85"/>
  <polygon points="164,153 166,161 168,153" fill="#d0d0d0" opacity="0.85"/>
  <!-- TEETH upper jaw row 3 (smallest, deepest) -->
  <polygon points="133,155 135,162 137,155" fill="#b8b8b8" opacity="0.7"/>
  <polygon points="146,153 148,160 150,153" fill="#b8b8b8" opacity="0.7"/>
  <polygon points="158,153 160,159 162,153" fill="#b8b8b8" opacity="0.7"/>
  <!-- TEETH lower jaw row 1 (pointing up) -->
  <polygon points="118,164 120,153 122,164" fill="white"/>
  <polygon points="127,165 130,153 133,165" fill="white"/>
  <polygon points="138,166 141,153 144,166" fill="white"/>
  <polygon points="150,165 153,153 156,165" fill="white"/>
  <polygon points="161,163 164,154 167,163" fill="white"/>
  <!-- TEETH lower jaw row 2 (shorter) -->
  <polygon points="123,164 125,157 127,164" fill="#d0d0d0" opacity="0.85"/>
  <polygon points="143,165 145,158 147,165" fill="#d0d0d0" opacity="0.85"/>
  <polygon points="156,164 158,158 160,164" fill="#d0d0d0" opacity="0.85"/>
  <!-- eye (large dead shark eye) -->
  <g class="m-eye">
    <circle cx="158" cy="132" r="13" fill="${vdark}"/>
    <circle cx="158" cy="132" r="9"  fill="#080808"/>
    <circle cx="158" cy="132" r="4"  fill="#0e0e0e" opacity="0.6"/>
    <circle cx="153" cy="128" r="3"  fill="white" opacity="0.65"/>
    <circle cx="155" cy="130" r="1.5" fill="white" opacity="0.9"/>
  </g>
  <!-- water sparkles -->
  <circle cx="50"  cy="120" r="3"   fill="${lite}"  class="m-star" opacity="0.7"/>
  <circle cx="168" cy="108" r="2.5" fill="white"    class="m-star" opacity="0.6"/>
  <circle cx="40"  cy="145" r="2"   fill="${lite}"  class="m-star" opacity="0.5"/>
  <circle cx="180" cy="118" r="2"   fill="white"    class="m-star" opacity="0.5"/>
  <!-- enrage overlay -->
  <ellipse cx="100" cy="155" rx="70" ry="60" fill="#FF000022" class="m-enrage-overlay"/>`;
}

function _svgDragon(color) {
  const c = _hexToCSS(color), dark = _shiftColor(c, -0.35), lite = _shiftColor(c, 0.25),
        vdark = _shiftColor(c, -0.55), gold = '#D4AF37', fire1 = '#FF8C00', fire2 = '#FFD700';
  return `<defs>
    <radialGradient id="drg_body" cx="40%" cy="30%" r="65%">
      <stop offset="0%" stop-color="${lite}"/>
      <stop offset="100%" stop-color="${vdark}"/>
    </radialGradient>
    <radialGradient id="drg_fire" cx="50%" cy="90%" r="55%">
      <stop offset="0%" stop-color="${fire2}"/>
      <stop offset="60%" stop-color="${fire1}"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="drg_flame" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="${fire2}" stop-opacity="1"/>
      <stop offset="50%"  stop-color="${fire1}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#ff2200"  stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- shadow -->
  <ellipse cx="100" cy="228" rx="45" ry="8" fill="#00000044"/>
  <!-- tail -->
  <g class="m-tail">
    <path d="M72,195 Q30,200 12,185 Q28,195 40,185 Q20,180 25,165 Q50,190 72,190 Z" fill="${dark}"/>
  </g>
  <!-- legs -->
  <path d="M72,185 L60,225" stroke="${dark}" stroke-width="14" stroke-linecap="round" fill="none"/>
  <path d="M128,185 L140,225" stroke="${dark}" stroke-width="14" stroke-linecap="round" fill="none"/>
  <!-- claws -->
  <path d="M52,222 L48,230 M57,224 L54,232 M63,224 L62,232" stroke="${vdark}" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M132,224 L129,232 M138,224 L138,232 M144,222 L147,230" stroke="${vdark}" stroke-width="3" stroke-linecap="round" fill="none"/>
  <!-- body -->
  <ellipse cx="100" cy="168" rx="52" ry="42" fill="url(#drg_body)"/>
  <!-- belly scales -->
  <ellipse cx="100" cy="175" rx="30" ry="25" fill="${lite}" opacity="0.25"/>
  <!-- wings -->
  <g class="m-wing-l">
    <path d="M65,145 Q18,90 10,45 Q30,80 48,88 Q28,65 40,42 Q55,75 62,100 Q38,72 52,58 Q66,88 65,130 Z"
          fill="${dark}" opacity="0.88"/>
    <path d="M65,145 L48,88" stroke="${vdark}" stroke-width="2" fill="none"/>
    <path d="M65,145 L40,42" stroke="${vdark}" stroke-width="1.5" fill="none"/>
    <path d="M65,145 L52,58" stroke="${vdark}" stroke-width="1" fill="none"/>
  </g>
  <g class="m-wing-r">
    <path d="M135,145 Q182,90 190,45 Q170,80 152,88 Q172,65 160,42 Q145,75 138,100 Q162,72 148,58 Q134,88 135,130 Z"
          fill="${dark}" opacity="0.88"/>
    <path d="M135,145 L152,88" stroke="${vdark}" stroke-width="2" fill="none"/>
    <path d="M135,145 L160,42" stroke="${vdark}" stroke-width="1.5" fill="none"/>
    <path d="M135,145 L148,58" stroke="${vdark}" stroke-width="1" fill="none"/>
  </g>
  <!-- neck -->
  <path d="M82,130 Q80,105 88,90" stroke="${c}" stroke-width="22" stroke-linecap="round" fill="none"/>
  <path d="M118,130 Q120,105 112,90" stroke="${c}" stroke-width="22" stroke-linecap="round" fill="none"/>
  <!-- neck spines -->
  <path d="M88,90 Q78,72 82,55" stroke="${dark}" stroke-width="6" stroke-linecap="round" fill="none"/>
  <path d="M92,82 Q82,68 85,52" stroke="${dark}" stroke-width="5" stroke-linecap="round" fill="none"/>
  <path d="M112,90 Q122,72 118,55" stroke="${dark}" stroke-width="6" stroke-linecap="round" fill="none"/>
  <!-- head -->
  <ellipse cx="100" cy="78" rx="32" ry="26" fill="url(#drg_body)"/>
  <!-- horns -->
  <path d="M84,58 Q78,32 82,18" stroke="${dark}" stroke-width="7" stroke-linecap="round" fill="none"/>
  <path d="M116,58 Q122,32 118,18" stroke="${dark}" stroke-width="7" stroke-linecap="round" fill="none"/>
  <path d="M84,58 Q74,38 80,28" stroke="${gold}" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.5"/>
  <path d="M116,58 Q126,38 120,28" stroke="${gold}" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.5"/>
  <!-- eyes -->
  <g class="m-eye">
    <ellipse cx="86" cy="73" rx="9" ry="10" fill="${vdark}"/>
    <ellipse cx="86" cy="73" rx="5" ry="7" fill="${fire1}"/>
    <ellipse cx="86" cy="73" rx="2" ry="4" fill="${vdark}"/>
    <circle cx="84" cy="70" r="1.8" fill="white" opacity="0.7"/>
  </g>
  <g class="m-eye-r">
    <ellipse cx="114" cy="73" rx="9" ry="10" fill="${vdark}"/>
    <ellipse cx="114" cy="73" rx="5" ry="7" fill="${fire1}"/>
    <ellipse cx="114" cy="73" rx="2" ry="4" fill="${vdark}"/>
    <circle cx="112" cy="70" r="1.8" fill="white" opacity="0.7"/>
  </g>
  <!-- nostrils -->
  <ellipse cx="92" cy="88" rx="4" ry="2.5" fill="${vdark}" opacity="0.7"/>
  <ellipse cx="108" cy="88" rx="4" ry="2.5" fill="${vdark}" opacity="0.7"/>
  <!-- smoke wisps from nostrils (visible when not breathing fire) -->
  <circle class="m-smoke" cx="92" cy="84" r="4.5" fill="#777" opacity="0.45"/>
  <circle class="m-smoke" cx="108" cy="84" r="4"   fill="#888" opacity="0.4"/>
  <circle class="m-smoke" cx="87"  cy="80" r="3"   fill="#666" opacity="0.32"/>
  <circle class="m-smoke" cx="113" cy="80" r="3.5" fill="#777" opacity="0.35"/>
  <!-- jaw (open, dark interior) -->
  <path d="M78,91 Q100,103 122,91 Q110,108 100,106 Q90,108 78,91 Z" fill="${vdark}"/>
  <!-- upper teeth (fangs, row 1) -->
  <polygon points="84,92 86,104 88,92" fill="white"/>
  <polygon points="92,93 94,106 96,93" fill="white"/>
  <polygon points="100,94 102,107 104,94" fill="white"/>
  <polygon points="108,93 110,106 112,93" fill="white"/>
  <polygon points="116,92 118,104 120,92" fill="white"/>
  <!-- lower teeth (pointing up) -->
  <polygon points="88,103 90,93 92,103" fill="#ddd" opacity="0.9"/>
  <polygon points="98,105 100,94 102,105" fill="#ddd" opacity="0.9"/>
  <polygon points="108,103 110,93 112,103" fill="#ddd" opacity="0.9"/>
  <!-- fire breath (periodic, shoots downward from mouth) -->
  <g class="m-firebreath">
    <path d="M88,102 Q80,132 76,168" stroke="${fire1}" stroke-width="14" stroke-linecap="round" fill="none" opacity="0.88"/>
    <path d="M95,104 Q90,136 88,172"  stroke="${fire2}" stroke-width="10" stroke-linecap="round" fill="none"/>
    <path d="M100,105 Q100,140 100,176" stroke="${fire2}" stroke-width="13" stroke-linecap="round" fill="none"/>
    <path d="M105,104 Q110,136 112,172" stroke="${fire2}" stroke-width="10" stroke-linecap="round" fill="none"/>
    <path d="M112,102 Q120,132 124,168" stroke="${fire1}" stroke-width="14" stroke-linecap="round" fill="none" opacity="0.88"/>
    <ellipse cx="100" cy="112" rx="22" ry="13" fill="${fire2}" opacity="0.65"/>
    <ellipse cx="100" cy="125" rx="16" ry="10" fill="${fire1}" opacity="0.5"/>
  </g>
  <!-- body scales pattern -->
  <g opacity="0.35">
    <path d="M88,158 Q100,150 112,158 Q100,165 88,158 Z" fill="${lite}"/>
    <path d="M80,170 Q92,162 104,170 Q92,177 80,170 Z" fill="${lite}"/>
    <path d="M96,170 Q108,162 120,170 Q108,177 96,170 Z" fill="${lite}"/>
    <path d="M88,182 Q100,174 112,182 Q100,189 88,182 Z" fill="${lite}"/>
  </g>
  <!-- enrage overlay -->
  <ellipse cx="100" cy="140" rx="72" ry="80" fill="#FF000022" class="m-enrage-overlay"/>`;
}

// ── PHASE 4 ──────────────────────────────────────────────────────────────────

function _svgEspiritu(color) {
  const c = _hexToCSS(color), dark = _shiftColor(c, -0.35), lite = _shiftColor(c, 0.35),
        vdark = _shiftColor(c, -0.55), pale = _shiftColor(c, 0.55);
  return `<defs>
    <radialGradient id="esp2_body" cx="45%" cy="35%" r="60%">
      <stop offset="0%" stop-color="${pale}" stop-opacity="0.95"/>
      <stop offset="70%" stop-color="${c}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${vdark}" stop-opacity="0.6"/>
    </radialGradient>
  </defs>
  <!-- glow aura -->
  <ellipse cx="100" cy="130" rx="72" ry="80" fill="${c}" opacity="0.08"/>
  <!-- body blob (translucent spirit) -->
  <path d="M100,48 Q148,52 155,100 Q162,148 150,185 Q138,210 118,218 Q108,228 100,222
           Q92,228 82,218 Q62,210 50,185 Q38,148 45,100 Q52,52 100,48 Z"
        fill="url(#esp2_body)" opacity="0.88"/>
  <!-- inner glow core -->
  <ellipse cx="100" cy="130" rx="38" ry="48" fill="${pale}" opacity="0.18"/>
  <!-- lambda rune (chest) -->
  <g class="m-rune">
    <path d="M85,122 L100,148 L115,122" stroke="${pale}" stroke-width="2.5" fill="none" opacity="0.9"/>
    <path d="M90,122 L100,136" stroke="${pale}" stroke-width="1.5" fill="none" opacity="0.7"/>
  </g>
  <!-- orbit rings -->
  <g class="m-orbit">
    <ellipse cx="100" cy="130" rx="68" ry="26" fill="none" stroke="${lite}" stroke-width="2" opacity="0.55"/>
  </g>
  <g class="m-orbit-rev">
    <ellipse cx="100" cy="130" rx="26" ry="68" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.4"/>
  </g>
  <!-- tentacle wisps -->
  <g class="m-tentacle">
    <path d="M70,195 Q50,210 45,228" stroke="${c}" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.6"/>
  </g>
  <g class="m-tentacle" style="animation-delay:-0.4s">
    <path d="M100,215 Q100,225 100,235" stroke="${c}" stroke-width="9" stroke-linecap="round" fill="none" opacity="0.55"/>
  </g>
  <g class="m-tentacle" style="animation-delay:-0.8s">
    <path d="M130,195 Q150,210 155,228" stroke="${c}" stroke-width="8" stroke-linecap="round" fill="none" opacity="0.6"/>
  </g>
  <!-- eyes -->
  <g class="m-eye">
    <ellipse cx="84" cy="108" rx="14" ry="16" fill="${vdark}" opacity="0.7"/>
    <ellipse cx="84" cy="108" rx="9" ry="11" fill="${pale}"/>
    <ellipse cx="84" cy="108" rx="4" ry="5" fill="${vdark}"/>
    <circle cx="81" cy="105" r="2.5" fill="white" opacity="0.9"/>
  </g>
  <g class="m-eye-r">
    <ellipse cx="116" cy="108" rx="14" ry="16" fill="${vdark}" opacity="0.7"/>
    <ellipse cx="116" cy="108" rx="9" ry="11" fill="${pale}"/>
    <ellipse cx="116" cy="108" rx="4" ry="5" fill="${vdark}"/>
    <circle cx="113" cy="105" r="2.5" fill="white" opacity="0.9"/>
  </g>
  <!-- smile -->
  <path d="M83,125 Q100,135 117,125" stroke="${pale}" stroke-width="2.5" fill="none" opacity="0.8"/>
  <!-- floating particles -->
  <circle cx="55" cy="90" r="4" fill="${lite}" class="m-star" opacity="0.7"/>
  <circle cx="148" cy="82" r="3" fill="${pale}" class="m-star" opacity="0.6"/>
  <circle cx="42" cy="135" r="3.5" fill="${c}" class="m-star" opacity="0.5"/>
  <circle cx="160" cy="148" r="3" fill="${lite}" class="m-star" opacity="0.6"/>
  <!-- enrage overlay -->
  <ellipse cx="100" cy="130" rx="62" ry="80" fill="#FF000022" class="m-enrage-overlay"/>`;
}

function _svgTitan(color) {
  const c = _hexToCSS(color), dark = _shiftColor(c, -0.35), lite = _shiftColor(c, 0.25),
        vdark = _shiftColor(c, -0.55), metal = '#C0C8D0', gold = '#D4AF37';
  return `<defs>
    <radialGradient id="tit_body" cx="38%" cy="28%" r="68%">
      <stop offset="0%" stop-color="${lite}"/>
      <stop offset="100%" stop-color="${vdark}"/>
    </radialGradient>
    <radialGradient id="tit_armor" cx="40%" cy="30%" r="60%">
      <stop offset="0%" stop-color="${metal}"/>
      <stop offset="100%" stop-color="#5A6A78"/>
    </radialGradient>
  </defs>
  <!-- shadow (huge) -->
  <ellipse cx="100" cy="228" rx="58" ry="10" fill="#00000055"/>
  <!-- legs (massive) -->
  <rect x="58" y="175" width="30" height="55" rx="8" fill="${dark}"/>
  <rect x="112" y="175" width="30" height="55" rx="8" fill="${dark}"/>
  <!-- greaves (armor) -->
  <rect x="55" y="190" width="36" height="30" rx="6" fill="url(#tit_armor)"/>
  <rect x="109" y="190" width="36" height="30" rx="6" fill="url(#tit_armor)"/>
  <!-- feet -->
  <rect x="50" y="220" width="42" height="16" rx="6" fill="${vdark}"/>
  <rect x="108" y="220" width="42" height="16" rx="6" fill="${vdark}"/>
  <!-- torso (wide) -->
  <rect x="46" y="105" width="108" height="82" rx="14" fill="url(#tit_body)"/>
  <!-- chest armor plate -->
  <rect x="55" y="112" width="90" height="62" rx="10" fill="url(#tit_armor)" opacity="0.7"/>
  <!-- bell curve on chest -->
  <g class="m-rune">
    <rect x="64" y="122" width="72" height="38" rx="5" fill="${vdark}" opacity="0.6"/>
    <path d="M68,155 Q100,118 132,155" stroke="${gold}" stroke-width="2.5" fill="none"/>
    <line x1="68" y1="155" x2="132" y2="155" stroke="${gold}" stroke-width="2"/>
    <line x1="100" y1="122" x2="100" y2="155" stroke="${gold}" stroke-width="1.5" stroke-dasharray="3,2"/>
    <text x="72" y="154" font-size="7" fill="${gold}" opacity="0.6">μ</text>
    <text x="95" y="121" font-size="7" fill="${gold}" opacity="0.6">σ</text>
  </g>
  <!-- arms (massive) -->
  <rect x="4" y="105" width="44" height="28" rx="10" fill="${dark}"/>
  <rect x="152" y="105" width="44" height="28" rx="10" fill="${dark}"/>
  <!-- forearms -->
  <rect x="2" y="128" width="38" height="26" rx="8" fill="${c}"/>
  <rect x="160" y="128" width="38" height="26" rx="8" fill="${c}"/>
  <!-- gauntlets -->
  <rect x="0" y="148" width="34" height="22" rx="6" fill="url(#tit_armor)"/>
  <rect x="166" y="148" width="34" height="22" rx="6" fill="url(#tit_armor)"/>
  <!-- shoulder armor -->
  <ellipse cx="46" cy="110" rx="18" ry="14" fill="url(#tit_armor)"/>
  <ellipse cx="154" cy="110" rx="18" ry="14" fill="url(#tit_armor)"/>
  <circle cx="46" cy="110" r="6" fill="${gold}"/><circle cx="46" cy="110" r="3" fill="${vdark}"/>
  <circle cx="154" cy="110" r="6" fill="${gold}"/><circle cx="154" cy="110" r="3" fill="${vdark}"/>
  <!-- neck -->
  <rect x="84" y="88" width="32" height="22" rx="6" fill="${dark}"/>
  <!-- head (large) -->
  <rect x="60" y="48" width="80" height="65" rx="14" fill="url(#tit_body)"/>
  <!-- helmet visor -->
  <rect x="62" y="50" width="76" height="38" rx="10" fill="url(#tit_armor)" opacity="0.8"/>
  <rect x="68" y="58" width="64" height="24" rx="6" fill="${vdark}" opacity="0.7"/>
  <!-- eyes (glowing behind visor) -->
  <g class="m-eye">
    <rect x="72" y="63" width="22" height="14" rx="5" fill="${vdark}"/>
    <rect x="74" y="65" width="18" height="10" rx="4" fill="${c}"/>
    <circle cx="83" cy="70" r="3.5" fill="${lite}"/>
    <circle cx="83" cy="70" r="1.8" fill="white"/>
  </g>
  <g class="m-eye-r">
    <rect x="106" y="63" width="22" height="14" rx="5" fill="${vdark}"/>
    <rect x="108" y="65" width="18" height="10" rx="4" fill="${c}"/>
    <circle cx="117" cy="70" r="3.5" fill="${lite}"/>
    <circle cx="117" cy="70" r="1.8" fill="white"/>
  </g>
  <!-- helmet crest -->
  <rect x="88" y="44" width="24" height="10" rx="4" fill="${gold}"/>
  <path d="M88,44 Q100,28 112,44" fill="${gold}"/>
  <!-- chin guard -->
  <rect x="72" y="95" width="56" height="18" rx="6" fill="url(#tit_armor)" opacity="0.8"/>
  <!-- enrage overlay -->
  <ellipse cx="100" cy="130" rx="80" ry="85" fill="#FF000022" class="m-enrage-overlay"/>`;
}

// ── PHASE 5 ──────────────────────────────────────────────────────────────────

function _svgEsfinge(color) {
  const c = _hexToCSS(color), dark = _shiftColor(c, -0.35), lite = _shiftColor(c, 0.28),
        vdark = _shiftColor(c, -0.55), sand = '#E8C87A', gold = '#D4AF37';
  return `<defs>
    <radialGradient id="esf_body" cx="42%" cy="32%" r="62%">
      <stop offset="0%" stop-color="${lite}"/>
      <stop offset="100%" stop-color="${vdark}"/>
    </radialGradient>
    <radialGradient id="esf_eye" cx="38%" cy="35%" r="55%">
      <stop offset="0%" stop-color="${lite}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </radialGradient>
  </defs>
  <!-- shadow -->
  <ellipse cx="100" cy="228" rx="55" ry="9" fill="#00000044"/>
  <!-- lion body -->
  <ellipse cx="100" cy="185" rx="58" ry="42" fill="url(#esf_body)"/>
  <!-- front paws -->
  <ellipse cx="66" cy="220" rx="20" ry="12" fill="${c}"/>
  <ellipse cx="134" cy="220" rx="20" ry="12" fill="${c}"/>
  <!-- claws -->
  <path d="M52,222 L50,230 M58,224 L57,232 M65,225 L65,232" stroke="${vdark}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M148,222 L150,230 M142,224 L143,232 M135,225 L135,232" stroke="${vdark}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <!-- tail with curl -->
  <g class="m-tail">
    <path d="M155,195 Q178,185 182,168 Q186,150 172,148 Q160,146 158,160" stroke="${dark}" stroke-width="8" stroke-linecap="round" fill="none"/>
    <path d="M158,160 Q152,175 162,178" stroke="${dark}" stroke-width="7" stroke-linecap="round" fill="none"/>
  </g>
  <!-- wing (sphinx has wings) -->
  <g class="m-wing-l">
    <path d="M55,168 Q20,140 15,108 Q32,130 46,128 Q24,110 38,88 Q52,115 56,140 Q36,118 48,105 Q60,132 58,160 Z"
          fill="${dark}" opacity="0.85"/>
  </g>
  <g class="m-wing-r">
    <path d="M145,168 Q180,140 185,108 Q168,130 154,128 Q176,110 162,88 Q148,115 144,140 Q164,118 152,105 Q140,132 142,160 Z"
          fill="${dark}" opacity="0.85"/>
  </g>
  <!-- mane -->
  <g class="m-tentacle">
    <ellipse cx="100" cy="115" rx="46" ry="44" fill="${dark}" opacity="0.7"/>
    <ellipse cx="100" cy="115" rx="38" ry="36" fill="${c}" opacity="0.3"/>
  </g>
  <!-- mane wisps -->
  <path d="M58,100 Q48,82 52,65" stroke="${dark}" stroke-width="8" stroke-linecap="round" fill="none"/>
  <path d="M65,88 Q55,72 60,55" stroke="${dark}" stroke-width="6" stroke-linecap="round" fill="none"/>
  <path d="M142,100 Q152,82 148,65" stroke="${dark}" stroke-width="8" stroke-linecap="round" fill="none"/>
  <path d="M135,88 Q145,72 140,55" stroke="${dark}" stroke-width="6" stroke-linecap="round" fill="none"/>
  <!-- head (human-ish) -->
  <ellipse cx="100" cy="88" rx="30" ry="35" fill="url(#esf_body)"/>
  <!-- nemes headdress -->
  <path d="M70,72 L66,120 Q70,125 76,120 L78,80 Z" fill="${sand}" opacity="0.85"/>
  <path d="M130,72 L134,120 Q130,125 124,120 L122,80 Z" fill="${sand}" opacity="0.85"/>
  <path d="M70,72 Q100,58 130,72 L128,76 Q100,63 72,76 Z" fill="${gold}"/>
  <!-- headdress stripes -->
  <line x1="68" y1="85" x2="77" y2="85" stroke="${gold}" stroke-width="2" opacity="0.6"/>
  <line x1="67" y1="95" x2="77" y2="96" stroke="${gold}" stroke-width="2" opacity="0.6"/>
  <line x1="67" y1="105" x2="76" y2="107" stroke="${gold}" stroke-width="2" opacity="0.6"/>
  <line x1="133" y1="85" x2="123" y2="85" stroke="${gold}" stroke-width="2" opacity="0.6"/>
  <line x1="133" y1="95" x2="123" y2="96" stroke="${gold}" stroke-width="2" opacity="0.6"/>
  <line x1="133" y1="105" x2="124" y2="107" stroke="${gold}" stroke-width="2" opacity="0.6"/>
  <!-- uraeus (cobra on forehead) -->
  <path d="M98,65 Q100,57 102,65 Q104,70 100,72 Q96,70 98,65 Z" fill="${gold}"/>
  <!-- eyes (cat-like) -->
  <g class="m-eye">
    <ellipse cx="87" cy="85" rx="11" ry="12" fill="${vdark}"/>
    <ellipse cx="87" cy="85" rx="7" ry="8" fill="url(#esf_eye)"/>
    <ellipse cx="87" cy="85" rx="2.5" ry="6" fill="${vdark}"/>
    <circle cx="84" cy="82" r="2" fill="white" opacity="0.7"/>
  </g>
  <g class="m-eye-r">
    <ellipse cx="113" cy="85" rx="11" ry="12" fill="${vdark}"/>
    <ellipse cx="113" cy="85" rx="7" ry="8" fill="url(#esf_eye)"/>
    <ellipse cx="113" cy="85" rx="2.5" ry="6" fill="${vdark}"/>
    <circle cx="110" cy="82" r="2" fill="white" opacity="0.7"/>
  </g>
  <!-- angry eyebrows (inner high, outer dropped) -->
  <path d="M78,76 Q87,71 96,74" stroke="${vdark}" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M104,74 Q113,71 122,76" stroke="${vdark}" stroke-width="4" stroke-linecap="round" fill="none"/>
  <!-- brow shadow / furrow -->
  <ellipse cx="87"  cy="79" rx="10" ry="3.5" fill="${vdark}" opacity="0.38"/>
  <ellipse cx="113" cy="79" rx="10" ry="3.5" fill="${vdark}" opacity="0.38"/>
  <path d="M97,74 L103,74" stroke="${vdark}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.55"/>
  <!-- nose (feline, predatory) -->
  <path d="M94,96 Q97,102 100,100 Q103,102 106,96" stroke="${vdark}" stroke-width="2" fill="none"/>
  <ellipse cx="95"  cy="100" rx="3.5" ry="2.5" fill="${vdark}" opacity="0.6"/>
  <ellipse cx="105" cy="100" rx="3.5" ry="2.5" fill="${vdark}" opacity="0.6"/>
  <!-- snarling mouth with visible fangs -->
  <path d="M82,111 Q100,124 118,111 Q110,130 100,127 Q90,130 82,111 Z" fill="${vdark}"/>
  <!-- fangs + teeth -->
  <polygon points="87,111 89,122 91,111" fill="white" opacity="0.95"/>
  <rect x="92"  y="111" width="4"   height="7" rx="0.5" fill="white" opacity="0.9"/>
  <rect x="98"  y="111" width="4.5" height="9" rx="0.5" fill="white" opacity="0.9"/>
  <rect x="104" y="111" width="4"   height="7" rx="0.5" fill="white" opacity="0.9"/>
  <polygon points="109,111 111,122 113,111" fill="white" opacity="0.95"/>
  <!-- chi-squared rune on body -->
  <g class="m-rune">
    <rect x="82" y="168" width="36" height="24" rx="4" fill="${vdark}" opacity="0.65"/>
    <path d="M86,172 L100,190 M114,172 L100,190" stroke="${gold}" stroke-width="2" fill="none"/>
    <path d="M86,190 L94,180 M114,190 L106,180" stroke="${gold}" stroke-width="2" fill="none"/>
    <path d="M100,176 L100,186" stroke="${gold}" stroke-width="1.5" stroke-dasharray="2,2" fill="none"/>
  </g>
  <!-- sparkles -->
  <circle cx="40" cy="130" r="3" fill="${gold}" class="m-star"/>
  <circle cx="162" cy="125" r="3" fill="${gold}" class="m-star"/>
  <circle cx="30" cy="155" r="2.5" fill="${lite}" class="m-star" opacity="0.7"/>
  <!-- enrage overlay -->
  <ellipse cx="100" cy="150" rx="72" ry="80" fill="#FF000022" class="m-enrage-overlay"/>`;
}

function _svgDemiurgo(color) {
  const c = _hexToCSS(color), dark = _shiftColor(c, -0.35), lite = _shiftColor(c, 0.22),
        vdark = _shiftColor(c, -0.6), gold = '#D4AF37', eye3 = '#9B59B6', crack = '#FF8080';
  return `<defs>
    <radialGradient id="dem_body" cx="40%" cy="28%" r="65%">
      <stop offset="0%" stop-color="${lite}"/>
      <stop offset="100%" stop-color="${vdark}"/>
    </radialGradient>
    <radialGradient id="dem_eye3" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#FF4444"/>
      <stop offset="100%" stop-color="#6a0000"/>
    </radialGradient>
    <radialGradient id="dem_glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${c}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- outer dark aura -->
  <ellipse cx="100" cy="120" rx="88" ry="95" fill="url(#dem_glow)"/>
  <!-- shadow -->
  <ellipse cx="100" cy="228" rx="50" ry="9" fill="#00000055"/>
  <!-- legs -->
  <rect x="66" y="182" width="24" height="48" rx="7" fill="${dark}"/>
  <rect x="110" y="182" width="24" height="48" rx="7" fill="${dark}"/>
  <!-- boots -->
  <rect x="60" y="215" width="36" height="18" rx="6" fill="${vdark}"/>
  <rect x="104" y="215" width="36" height="18" rx="6" fill="${vdark}"/>
  <!-- boot spikes -->
  <path d="M62,215 L58,205 M70,214 L67,204 M78,214 L76,204" stroke="${c}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M138,215 L142,205 M130,214 L133,204 M122,214 L124,204" stroke="${c}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <!-- robe/body -->
  <path d="M52,115 Q44,165 52,195 L148,195 Q156,165 148,115 Z" fill="url(#dem_body)"/>
  <!-- robe cracks overlay -->
  <path d="M80,120 L76,145 L84,150 L78,175" stroke="${crack}" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M120,125 L124,142 L118,148 L122,165" stroke="${crack}" stroke-width="1" fill="none" opacity="0.4"/>
  <!-- chaos rune on chest -->
  <g class="m-rune">
    <rect x="72" y="128" width="56" height="44" rx="5" fill="${vdark}" opacity="0.7"/>
    <!-- simplified chaos star: 8-pointed star -->
    <path d="M100,132 L103,142 L113,138 L106,146 L113,154 L103,150 L100,160 L97,150 L87,154 L94,146 L87,138 L97,142 Z"
          fill="${gold}" opacity="0.85"/>
    <circle cx="100" cy="146" r="4" fill="${vdark}"/>
  </g>
  <!-- arms -->
  <rect x="16" y="112" width="38" height="24" rx="9" fill="${dark}"/>
  <rect x="146" y="112" width="38" height="24" rx="9" fill="${dark}"/>
  <!-- gauntlets -->
  <rect x="12" y="130" width="32" height="26" rx="7" fill="${c}"/>
  <rect x="156" y="130" width="32" height="26" rx="7" fill="${c}"/>
  <!-- spiked gauntlets -->
  <path d="M14,130 L10,120 M20,128 L17,118 M26,127 L24,117" stroke="${gold}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M186,130 L190,120 M180,128 L183,118 M174,127 L176,117" stroke="${gold}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <!-- orbit rings (x3, powerful) -->
  <g class="m-orbit">
    <ellipse cx="100" cy="130" rx="76" ry="28" fill="none" stroke="${c}" stroke-width="2.5" opacity="0.6"/>
  </g>
  <g class="m-orbit-rev">
    <ellipse cx="100" cy="130" rx="28" ry="76" fill="none" stroke="${lite}" stroke-width="2" opacity="0.5"/>
  </g>
  <g class="m-orbit" style="animation-delay:-0.6s">
    <ellipse cx="100" cy="130" rx="58" ry="58" fill="none" stroke="${gold}" stroke-width="1.5" opacity="0.35"/>
  </g>
  <!-- neck -->
  <rect x="84" y="90" width="32" height="26" rx="6" fill="${dark}"/>
  <!-- head -->
  <ellipse cx="100" cy="75" rx="34" ry="32" fill="url(#dem_body)"/>
  <!-- crown -->
  <path d="M66,62 L66,45 L78,58 L88,38 L100,55 L112,38 L122,58 L134,45 L134,62 Z" fill="${gold}"/>
  <circle cx="100" cy="55" r="5" fill="${c}"/>
  <circle cx="78" cy="58" r="3.5" fill="${lite}"/>
  <circle cx="122" cy="58" r="3.5" fill="${lite}"/>
  <!-- main eyes -->
  <g class="m-eye">
    <ellipse cx="86" cy="73" rx="10" ry="11" fill="${vdark}"/>
    <ellipse cx="86" cy="73" rx="6.5" ry="7.5" fill="${c}"/>
    <ellipse cx="86" cy="73" rx="2.8" ry="3.5" fill="${vdark}"/>
    <circle cx="83" cy="70" r="2" fill="white" opacity="0.8"/>
  </g>
  <g class="m-eye-r">
    <ellipse cx="114" cy="73" rx="10" ry="11" fill="${vdark}"/>
    <ellipse cx="114" cy="73" rx="6.5" ry="7.5" fill="${c}"/>
    <ellipse cx="114" cy="73" rx="2.8" ry="3.5" fill="${vdark}"/>
    <circle cx="111" cy="70" r="2" fill="white" opacity="0.8"/>
  </g>
  <!-- third eye (forehead) -->
  <g class="m-star">
    <ellipse cx="100" cy="60" rx="9" ry="7" fill="${vdark}"/>
    <ellipse cx="100" cy="60" rx="6" ry="4.5" fill="url(#dem_eye3)"/>
    <ellipse cx="100" cy="60" rx="2.5" ry="2" fill="${vdark}"/>
    <circle cx="98" cy="58" r="1.5" fill="white" opacity="0.8"/>
  </g>
  <!-- sinister eyebrows (inner raised sharply) -->
  <path d="M78,65 Q85,59 95,63" stroke="${vdark}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <path d="M105,63 Q115,59 122,65" stroke="${vdark}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <!-- brow shadow -->
  <ellipse cx="86"  cy="66" rx="10" ry="3.5" fill="${vdark}" opacity="0.38"/>
  <ellipse cx="114" cy="66" rx="10" ry="3.5" fill="${vdark}" opacity="0.38"/>
  <!-- facial cracks (doom aura) -->
  <path d="M82,63 L78,73 L83,79" stroke="${crack}" stroke-width="2" fill="none" opacity="0.6"/>
  <path d="M118,63 L122,73 L117,79" stroke="${crack}" stroke-width="2" fill="none" opacity="0.6"/>
  <!-- snarling frown with jagged teeth -->
  <path d="M82,88 Q100,80 118,88 Q110,101 100,99 Q90,101 82,88 Z" fill="${vdark}"/>
  <!-- teeth (jagged fangs) -->
  <polygon points="85,88 87,99 89,88" fill="white"/>
  <rect x="90"  y="88" width="4"   height="7" rx="0.5" fill="white"/>
  <polygon points="95,88 97,101 99,88" fill="white"/>
  <rect x="100" y="88" width="4"   height="7" rx="0.5" fill="white"/>
  <polygon points="105,88 107,99 109,88" fill="white"/>
  <rect x="110" y="88" width="4"   height="5" rx="0.5" fill="#b0b0b0"/>
  <!-- dimensional crack overlay (final boss) -->
  <path d="M30,50 L45,80 L35,95 L55,120 L42,145 L60,170" stroke="${crack}" stroke-width="2" fill="none" opacity="0.35"/>
  <path d="M170,55 L155,85 L165,100 L145,125 L158,150 L140,175" stroke="${crack}" stroke-width="2" fill="none" opacity="0.35"/>
  <!-- enrage overlay (extra intense for final boss) -->
  <ellipse cx="100" cy="130" rx="80" ry="90" fill="#FF000033" class="m-enrage-overlay"/>`;
}

const _SVG_BUILDERS = {
  espectro: _svgEspectro,
  hidra:    _svgHidra,
  golem:    _svgGolem,
  bruja:    _svgBruja,
  tiburon:  _svgTiburon,
  dragon:   _svgDragon,
  espiritu: _svgEspiritu,
  titan:    _svgTitan,
  esfinge:  _svgEsfinge,
  demiurgo: _svgDemiurgo,
};

// ─────────────────────────────────────────────
// createMonsterDOM(scene, forma, color, cx, cy, scale)
//
// Returns { domObj, setState(state) }
//   domObj  — Phaser DOM object (use setDepth, setVisible, etc.)
//   setState — call with 'idle'|'attack'|'hurt'|'enraged'|'dead'
//              'attack'/'hurt' auto-revert to 'idle' after anim
// ─────────────────────────────────────────────
function createMonsterDOM(scene, forma, color, cx, cy, scale=1){
  _injectMonsterCSS();

  const builder = _SVG_BUILDERS[forma] || _svgPlaceholder;
  const inner   = builder(color);
  const w = 200, h = 240;

  const svgStr = `<svg class="monster-svg state-idle" id="msvg_${forma}_${Date.now()}"
    viewBox="0 0 ${w} ${h}" width="${Math.round(w*scale)}" height="${Math.round(h*scale)}"
    xmlns="http://www.w3.org/2000/svg">
    ${inner}
  </svg>`;

  const domObj = scene.add.dom(cx, cy).createFromHTML(svgStr);
  domObj.setOrigin(0.5, 0.5);

  const svgEl = domObj.node.querySelector('svg') || domObj.node;

  let _currentBase = 'idle';   // 'idle' or 'enraged'
  let _revertTimer = null;

  function setState(state){
    if(_revertTimer){ clearTimeout(_revertTimer); _revertTimer = null; }

    // Remove transient states, keep persistent ones
    svgEl.classList.remove('state-idle','state-attack','state-hurt','state-dead');

    switch(state){
      case 'idle':
        svgEl.classList.add('state-idle');
        _currentBase = 'idle';
        break;

      case 'enraged':
        svgEl.classList.add('state-idle','state-enraged');
        _currentBase = 'enraged';
        break;

      case 'attack':
        svgEl.classList.add('state-attack');
        _revertTimer = setTimeout(()=>{
          svgEl.classList.remove('state-attack');
          svgEl.classList.add(_currentBase === 'enraged' ? 'state-idle' : 'state-idle');
          if(_currentBase === 'enraged') svgEl.classList.add('state-enraged');
        }, 580);
        break;

      case 'hurt':
        svgEl.classList.add('state-hurt');
        _revertTimer = setTimeout(()=>{
          svgEl.classList.remove('state-hurt');
          svgEl.classList.add('state-idle');
          if(_currentBase === 'enraged') svgEl.classList.add('state-enraged');
        }, 520);
        break;

      case 'dead':
        svgEl.classList.remove('state-enraged');
        svgEl.classList.add('state-dead');
        break;
    }
  }

  return { domObj, setState };
}
