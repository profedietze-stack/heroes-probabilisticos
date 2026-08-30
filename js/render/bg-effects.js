/* ══════════════════════════════════════════════════════════════
   bg-effects.js — Fondos de imagen + capa de efectos dinámicos
   ─────────────────────────────────────────────────────────────
   Detalle que diferencia el juego: sobre cada fondo pintado se montan
   luces parpadeantes (PointLight), emisores de partículas (fuego, humo,
   niebla, polvo, brasas), glows pulsantes y eventos (rayos).

   Uso:
     // en preload():
     bgLoad(this, 'menu');                  // o bgLoad(this,'demiurgo')
     // en create():
     bgMount(this, 'menu', { depth:-10 });  // monta imagen + efectos

   Todo data-driven: BG_FX[key] define coords normalizadas (0..1) sobre
   el fondo desplegado. Ajustar un efecto = editar números, sin tocar lógica.
══════════════════════════════════════════════════════════════ */

/* ── Rutas de los assets por clave ─────────────────────────── */
const BG_PATHS = {
  // UI
  menu:    'assets/backgrounds/ui/bg-menu.jpg',
  hub:     'assets/backgrounds/ui/bg-hub.jpg',
  // NPCs
  mercader:'assets/backgrounds/npcs/bg-mercader.jpg',
  oraculo: 'assets/backgrounds/npcs/bg-oraculo.jpg',
  // Monstruos (clave = monster.forma)
  espectro:'assets/backgrounds/monsters/bg-espectro.jpg',
  hidra:   'assets/backgrounds/monsters/bg-hidra.jpg',
  golem:   'assets/backgrounds/monsters/bg-golem.jpg',
  bruja:   'assets/backgrounds/monsters/bg-bruja.jpg',
  tiburon: 'assets/backgrounds/monsters/bg-tiburon.jpg',
  dragon:  'assets/backgrounds/monsters/bg-dragon.jpg',
  espiritu:'assets/backgrounds/monsters/bg-espiritu.jpg',
  titan:   'assets/backgrounds/monsters/bg-titan.jpg',
  esfinge: 'assets/backgrounds/monsters/bg-esfinge.jpg',
  demiurgo:'assets/backgrounds/monsters/bg-demiurgo.jpg',
};

/* ── Configuración de efectos por clave ────────────────────────
   Tipos:
     lights:   [{x,y,color,radius,intensity,flicker}]  → PointLight con parpadeo
     fire:     [{x,y,color,scale,rate,band}]           → llama ascendente
     smoke:    [{x,y,color,rate}]                       → humo que sube y se disuelve
     fog:      [{band:[y0,y1],color,alpha,rate,drift}]  → niebla horizontal
     dust:     [{band:[y0,y1],color,rate}]              → motas/polvo cayendo
     embers:   [{band:[y0,y1],color,rate}]              → brasas que suben
     glow:     [{x,y,color,r,period}]                   → halo pulsante (respiración)
     lightning:[{x0,y0,x1,y1,color,everyMin,everyMax}]  → rayos aleatorios + flash
   ── menu + demiurgo: vertical slice de calidad. Resto: imagen sola por ahora.
─────────────────────────────────────────────────────────────── */
const BG_FX = {
  menu: {
    lights: [
      { x:0.283, y:0.487, color:0xff7a1a, radius:95, intensity:0.32, flicker:true },
      { x:0.719, y:0.487, color:0xff7a1a, radius:95, intensity:0.32, flicker:true },
    ],
    fire: [
      { x:0.283, y:0.481, color:0xffb347, scale:0.5, rate:34 },
      { x:0.719, y:0.481, color:0xffb347, scale:0.5, rate:34 },
    ],
    fog: [
      { band:[0.80, 0.99], color:0xc8d4e0, alpha:0.10, rate:14, drift:18 },
    ],
    glow: [
      { x:0.5, y:0.12, color:0x6a5cff, r:70, period:2400 },   // runas del arco
    ],
  },

  demiurgo: {
    lights: [
      { x:0.436, y:0.399, color:0xff2a1a, radius:46, intensity:0.55, flicker:true }, // ojo izq
      { x:0.564, y:0.399, color:0xff2a1a, radius:46, intensity:0.55, flicker:true }, // ojo der
      { x:0.5,   y:0.33,  color:0x7a1010, radius:230, intensity:0.18, flicker:true }, // halo engranaje
    ],
    embers: [
      { band:[0.30, 0.95], color:0xff5a2a, rate:26 },
    ],
    glow: [
      { x:0.5, y:0.85, color:0xff2020, r:150, period:1800 },  // pentagrama respira
    ],
    lightning: [
      { x0:0.50, y0:0.20, x1:0.30, y1:0.45, color:0xff3a3a, everyMin:1400, everyMax:2800 },
      { x0:0.50, y0:0.20, x1:0.70, y1:0.45, color:0xff5a4a, everyMin:1800, everyMax:3400 },
    ],
    shakeOnBolt: true,
  },

  /* ── Espectro de la Varianza — niebla morada, antorchas violetas ── */
  espectro: {
    lights: [
      { x:0.161, y:0.327, color:0xb44cff, radius:80, intensity:0.30, flicker:true },
      { x:0.286, y:0.401, color:0xb44cff, radius:80, intensity:0.30, flicker:true },
      { x:0.714, y:0.401, color:0xb44cff, radius:80, intensity:0.30, flicker:true },
      { x:0.839, y:0.327, color:0xb44cff, radius:80, intensity:0.30, flicker:true },
    ],
    fire: [
      { x:0.161, y:0.321, color:0xc77bff, scale:0.4, rate:26 },
      { x:0.286, y:0.395, color:0xc77bff, scale:0.4, rate:26 },
      { x:0.714, y:0.395, color:0xc77bff, scale:0.4, rate:26 },
      { x:0.839, y:0.321, color:0xc77bff, scale:0.4, rate:26 },
    ],
    fog: [
      { band:[0.62, 0.95], color:0xb44cff, alpha:0.12, rate:16, drift:20 },
    ],
    glow: [
      { x:0.45, y:0.86, color:0xff2a4a, r:90, period:2600 },  // pentagrama
    ],
  },

  /* ── Hidra de las Variables — antorchas verdes, niebla sobre agua ── */
  hidra: {
    lights: [
      { x:0.163, y:0.328, color:0x2ecc40, radius:78, intensity:0.30, flicker:true },
      { x:0.286, y:0.402, color:0x2ecc40, radius:70, intensity:0.26, flicker:true },
      { x:0.714, y:0.403, color:0x2ecc40, radius:70, intensity:0.26, flicker:true },
      { x:0.839, y:0.328, color:0x2ecc40, radius:78, intensity:0.30, flicker:true },
    ],
    fire: [
      { x:0.163, y:0.322, color:0x6effb0, scale:0.4, rate:26 },
      { x:0.286, y:0.396, color:0x6effb0, scale:0.35, rate:22 },
      { x:0.714, y:0.397, color:0x6effb0, scale:0.35, rate:22 },
      { x:0.839, y:0.322, color:0x6effb0, scale:0.4, rate:26 },
    ],
    fog: [
      { band:[0.58, 0.78], color:0x2ecc40, alpha:0.11, rate:18, drift:24 },
    ],
  },

  /* ── Golem Gaussiano — antorchas ámbar, campana que late, polvo de roca ── */
  golem: {
    lights: [
      { x:0.162, y:0.333, color:0xff9a3a, radius:80, intensity:0.30, flicker:true },
      { x:0.287, y:0.405, color:0xff9a3a, radius:72, intensity:0.26, flicker:true },
      { x:0.715, y:0.404, color:0xff9a3a, radius:72, intensity:0.26, flicker:true },
      { x:0.84,  y:0.333, color:0xff9a3a, radius:80, intensity:0.30, flicker:true },
    ],
    fire: [
      { x:0.162, y:0.327, color:0xffb347, scale:0.4, rate:26 },
      { x:0.287, y:0.399, color:0xffb347, scale:0.35, rate:22 },
      { x:0.715, y:0.398, color:0xffb347, scale:0.35, rate:22 },
      { x:0.84,  y:0.327, color:0xffb347, scale:0.4, rate:26 },
    ],
    dust: [
      { band:[0.05, 0.95], color:0xd8c89a, rate:9 },
    ],
    glow: [
      { x:0.499, y:0.398, color:0xffcc44, r:130, period:2800 },  // campana gaussiana late
    ],
  },

  /* ── Bruja de la Distribución — humo de calderos morado/verde ── */
  bruja: {
    lights: [
      { x:0.25, y:0.53, color:0xb44cff, radius:110, intensity:0.24, flicker:true },
      { x:0.62, y:0.57, color:0x2ecc40, radius:110, intensity:0.24, flicker:true },
    ],
    smoke: [
      { x:0.25, y:0.53, color:0xc77bff, rate:24 },
      { x:0.62, y:0.57, color:0x6effb0, rate:24 },
    ],
    glow: [
      { x:0.5, y:0.50, color:0x9b59b6, r:70, period:2200 },   // grimorio flotante
    ],
  },

  /* ── Tiburón de la Desviación — luz submarina, burbujas ── */
  tiburon: {
    lights: [
      { x:0.5, y:0.15, color:0x4fd0ff, radius:200, intensity:0.20, flicker:true },
    ],
    embers: [   // reutilizado como burbujas que suben
      { band:[0.55, 0.95], color:0x8fe0ff, rate:18 },
    ],
    fog: [
      { band:[0.40, 0.70], color:0x2a6e8c, alpha:0.10, rate:14, drift:12 },
    ],
  },

  /* ── Dragón Bernoulli — split hielo/fuego ── */
  dragon: {
    lights: [
      { x:0.182, y:0.327, color:0x4fd0ff, radius:90, intensity:0.30, flicker:true },
      { x:0.296, y:0.448, color:0x4fd0ff, radius:78, intensity:0.26, flicker:true },
      { x:0.71,  y:0.45,  color:0xff3a1a, radius:78, intensity:0.30, flicker:true },
      { x:0.876, y:0.475, color:0xff3a1a, radius:90, intensity:0.34, flicker:true },
    ],
    fire: [
      { x:0.71,  y:0.44,  color:0xff7a3a, scale:0.4, rate:26 },
      { x:0.876, y:0.468, color:0xff7a3a, scale:0.45, rate:30 },
    ],
    dust: [   // copos de hielo cayendo lado izq
      { band:[0.05, 0.95], color:0xbfe8ff, rate:10 },
    ],
    embers: [ // brasas subiendo lado der
      { band:[0.50, 0.95], color:0xff5a2a, rate:14 },
    ],
  },

  /* ── Espíritu Poisson — fuegos fatuos verdes aleatorios ── */
  espiritu: {
    lights: [
      { x:0.168, y:0.347, color:0x39ff88, radius:60, intensity:0.26, flicker:true },
      { x:0.302, y:0.392, color:0x39ff88, radius:52, intensity:0.22, flicker:true },
      { x:0.354, y:0.464, color:0x39ff88, radius:50, intensity:0.22, flicker:true },
      { x:0.706, y:0.457, color:0x39ff88, radius:52, intensity:0.24, flicker:true },
      { x:0.764, y:0.561, color:0x39ff88, radius:50, intensity:0.22, flicker:true },
      { x:0.832, y:0.333, color:0x39ff88, radius:60, intensity:0.26, flicker:true },
    ],
    fire: [
      { x:0.168, y:0.341, color:0x6effa0, scale:0.35, rate:18 },
      { x:0.354, y:0.458, color:0x6effa0, scale:0.30, rate:14 },
      { x:0.706, y:0.451, color:0x6effa0, scale:0.30, rate:14 },
      { x:0.832, y:0.327, color:0x6effa0, scale:0.35, rate:18 },
    ],
    fog: [
      { band:[0.62, 0.92], color:0x1e5e3a, alpha:0.10, rate:14, drift:10 },
    ],
  },

  /* ── Titán Normal — antorchas ámbar, curva gaussiana del piso late ── */
  titan: {
    lights: [
      { x:0.152, y:0.339, color:0xff9a3a, radius:78, intensity:0.28, flicker:true },
      { x:0.277, y:0.409, color:0xff9a3a, radius:70, intensity:0.24, flicker:true },
      { x:0.725, y:0.411, color:0xff9a3a, radius:72, intensity:0.26, flicker:true },
    ],
    fire: [
      { x:0.152, y:0.333, color:0xffb347, scale:0.4, rate:24 },
      { x:0.277, y:0.403, color:0xffb347, scale:0.35, rate:20 },
      { x:0.725, y:0.405, color:0xffb347, scale:0.35, rate:22 },
    ],
    dust: [
      { band:[0.05, 0.80], color:0xd8c89a, rate:8 },
    ],
    glow: [
      { x:0.5, y:0.80, color:0xffd24a, r:120, period:2400 },  // curva gaussiana piso
    ],
  },

  /* ── Hub Minijuegos — braseros de piedra, polvo de arena ── */
  hub: {
    lights: [
      { x:0.136, y:0.462, color:0xff8c2a, radius:100, intensity:0.28, flicker:true },
      { x:0.216, y:0.559, color:0xff8c2a, radius:88,  intensity:0.24, flicker:true },
      { x:0.364, y:0.456, color:0xff8c2a, radius:80,  intensity:0.22, flicker:true },
      { x:0.637, y:0.458, color:0xff8c2a, radius:80,  intensity:0.22, flicker:true },
      { x:0.783, y:0.559, color:0xff8c2a, radius:88,  intensity:0.24, flicker:true },
      { x:0.864, y:0.462, color:0xff8c2a, radius:100, intensity:0.28, flicker:true },
    ],
    fire: [
      { x:0.136, y:0.454, color:0xffb347, scale:0.45, rate:28 },
      { x:0.216, y:0.551, color:0xffb347, scale:0.40, rate:24 },
      { x:0.364, y:0.448, color:0xffb347, scale:0.38, rate:22 },
      { x:0.637, y:0.450, color:0xffb347, scale:0.38, rate:22 },
      { x:0.783, y:0.551, color:0xffb347, scale:0.40, rate:24 },
      { x:0.864, y:0.454, color:0xffb347, scale:0.45, rate:28 },
    ],
    fog: [
      { band:[0.75, 0.98], color:0xb0a090, alpha:0.10, rate:12, drift:16 },
    ],
    dust: [
      { band:[0.05, 0.95], color:0xc8b890, rate:7 },
    ],
  },

  /* ── Mercader — velas doradas, humo suave, brillo de monedas ── */
  mercader: {
    lights: [
      { x:0.174, y:0.327, color:0xffcc44, radius:72,  intensity:0.28, flicker:true },
      { x:0.841, y:0.320, color:0xffcc44, radius:72,  intensity:0.28, flicker:true },
      { x:0.5,   y:0.45,  color:0xffaa22, radius:160, intensity:0.16, flicker:true },
    ],
    fire: [
      { x:0.174, y:0.320, color:0xffd766, scale:0.36, rate:22 },
      { x:0.841, y:0.313, color:0xffd766, scale:0.36, rate:22 },
    ],
    smoke: [
      { x:0.174, y:0.310, color:0xa09070, rate:10 },
      { x:0.841, y:0.303, color:0xa09070, rate:10 },
    ],
    glow: [
      { x:0.5, y:0.55, color:0xffcc44, r:110, period:3200 },  // mercancías brillan
    ],
    fog: [
      { band:[0.80, 0.99], color:0xc0a870, alpha:0.08, rate:10, drift:14 },
    ],
  },

  /* ── Oráculo — velas violetas, cráneo que pulsa, niebla mística ── */
  oraculo: {
    lights: [
      { x:0.174, y:0.327, color:0xc070ff, radius:70,  intensity:0.28, flicker:true },
      { x:0.841, y:0.320, color:0xc070ff, radius:70,  intensity:0.28, flicker:true },
      { x:0.499, y:0.434, color:0x9040e0, radius:140, intensity:0.22, flicker:true },
    ],
    fire: [
      { x:0.174, y:0.320, color:0xd099ff, scale:0.36, rate:20 },
      { x:0.841, y:0.313, color:0xd099ff, scale:0.36, rate:20 },
    ],
    smoke: [
      { x:0.174, y:0.310, color:0x9050c0, rate:12 },
      { x:0.841, y:0.303, color:0x9050c0, rate:12 },
    ],
    glow: [
      { x:0.499, y:0.434, color:0xb44cff, r:90,  period:2200 },  // cráneo místico
      { x:0.5,   y:0.15,  color:0x6a3cff, r:60,  period:3000 },  // aura superior
    ],
    fog: [
      { band:[0.60, 0.90], color:0x6020a0, alpha:0.12, rate:14, drift:18 },
    ],
  },

  /* ── Esfinge Chi-Cuadrada — antorchas doradas, arena, símbolos χ ── */
  esfinge: {
    lights: [
      { x:0.263, y:0.452, color:0xffcc44, radius:80, intensity:0.30, flicker:true },
      { x:0.731, y:0.462, color:0xffcc44, radius:80, intensity:0.30, flicker:true },
    ],
    fire: [
      { x:0.263, y:0.444, color:0xffd766, scale:0.42, rate:26 },
      { x:0.731, y:0.454, color:0xffd766, scale:0.42, rate:26 },
    ],
    dust: [   // arena suspendida
      { band:[0.05, 0.90], color:0xe0c890, rate:11 },
    ],
    glow: [
      { x:0.5, y:0.40, color:0xffcc44, r:70, period:3000 },   // ojos esfinge
    ],
  },
};

/* ══════════════════════════════════════════════════════════════
   API pública
══════════════════════════════════════════════════════════════ */

/** Carga la imagen de fondo en el loader de la escena (llamar en preload). */
function bgLoad(scene, key){
  const path = BG_PATHS[key];
  if(!path) return;
  const cacheKey = 'bg_' + key;
  if(scene.textures.exists(cacheKey)) return;
  scene.load.image(cacheKey, path);
}

/**
 * Monta el fondo (cover-fit) y aplica sus efectos.
 * @param {Phaser.Scene} scene
 * @param {string} key
 * @param {object} [opts] { depth=-10, fxDepth=depth+1 }
 * @returns {Phaser.GameObjects.Image|null}
 */
function bgMount(scene, key, opts){
  opts = opts || {};
  const cacheKey = 'bg_' + key;
  if(!scene.textures.exists(cacheKey)) return null;

  const w = scene.scale.width, h = scene.scale.height;
  const depth   = (opts.depth   != null) ? opts.depth   : -10;
  const fxDepth = (opts.fxDepth != null) ? opts.fxDepth : depth + 1;

  // Cover-fit: cubre todo el canvas, recorta el sobrante
  const img = scene.add.image(w/2, h/2, cacheKey).setOrigin(0.5).setDepth(depth);
  const src = scene.textures.get(cacheKey).getSourceImage();
  const sc  = Math.max(w / src.width, h / src.height);
  img.setScale(sc);

  // Bounds del fondo desplegado, para mapear coords normalizadas
  const bgW = src.width * sc, bgH = src.height * sc;
  const region = { x: w/2 - bgW/2, y: h/2 - bgH/2, w: bgW, h: bgH };
  const PX = (fx) => region.x + fx * region.w;
  const PY = (fy) => region.y + fy * region.h;

  const cfg = BG_FX[key];
  if(cfg){
    _ensureDot(scene);
    _applyFx(scene, cfg, PX, PY, fxDepth);
    if(window.BG_DEBUG) _debugMarkers(scene, cfg, PX, PY);
  }
  return img;
}

/* Marcadores de calibración: crosshair + etiqueta en cada coord configurada.
   Activar con window.BG_DEBUG=true antes de montar la escena. */
function _debugMarkers(scene, cfg, PX, PY){
  const g = scene.add.graphics().setDepth(9999);
  const mark = (x, y, color, label) => {
    g.lineStyle(2, color, 1);
    g.strokeCircle(x, y, 10);
    g.lineBetween(x-16, y, x+16, y);
    g.lineBetween(x, y-16, x, y+16);
    scene.add.text(x+12, y-6, label, { fontFamily:'monospace', fontSize:'11px',
      color:'#fff', backgroundColor:'#000a' }).setDepth(9999);
  };
  (cfg.lights||[]).forEach((c,i)=> mark(PX(c.x), PY(c.y), 0x00ffff, 'L'+i));
  (cfg.fire  ||[]).forEach((c,i)=> mark(PX(c.x), PY(c.y), 0xff8800, 'F'+i));
  (cfg.smoke ||[]).forEach((c,i)=> mark(PX(c.x), PY(c.y), 0xff00ff, 'S'+i));
  (cfg.glow  ||[]).forEach((c,i)=> mark(PX(c.x), PY(c.y), 0xffff00, 'G'+i));
  (cfg.lightning||[]).forEach((c,i)=>{ mark(PX(c.x0),PY(c.y0),0xff4444,'z'+i+'a'); mark(PX(c.x1),PY(c.y1),0xff4444,'z'+i+'b'); });
}

/* ══════════════════════════════════════════════════════════════
   Internos
══════════════════════════════════════════════════════════════ */

/** Genera (una vez por escena) una textura de punto suave para partículas. */
function _ensureDot(scene){
  if(scene.textures.exists('__fxDot')) return;
  const s = 32, g = scene.make.graphics({ x:0, y:0, add:false });
  // disco con borde difuminado por capas concéntricas
  for(let i=8;i>=1;i--){
    g.fillStyle(0xffffff, i/8 * 0.18);
    g.fillCircle(s/2, s/2, (s/2) * (i/8));
  }
  g.fillStyle(0xffffff, 1);
  g.fillCircle(s/2, s/2, 3);
  g.generateTexture('__fxDot', s, s);
  g.destroy();
}

function _applyFx(scene, cfg, PX, PY, depth){
  (cfg.lights   || []).forEach(c => _light(scene, PX(c.x), PY(c.y), c, depth));
  (cfg.fire     || []).forEach(c => _fire(scene, PX(c.x), PY(c.y), c, depth));
  (cfg.smoke    || []).forEach(c => _smoke(scene, PX(c.x), PY(c.y), c, depth));
  (cfg.fog      || []).forEach(c => _fog(scene, c, PX, PY, depth));
  (cfg.dust     || []).forEach(c => _dust(scene, c, PX, PY, depth));
  (cfg.embers   || []).forEach(c => _embers(scene, c, PX, PY, depth));
  (cfg.glow     || []).forEach(c => _glow(scene, PX(c.x), PY(c.y), c, depth));
  (cfg.lightning|| []).forEach(c => _lightning(scene, c, PX, PY, depth, cfg.shakeOnBolt));
}

/* PointLight con parpadeo (flicker tipo antorcha) */
function _light(scene, x, y, c, depth){
  let pl;
  try { pl = scene.add.pointlight(x, y, c.color, c.radius, c.intensity || 2); }
  catch(e){ return; }            // si el pipeline no soporta pointlight, omitir
  pl.setDepth(depth);
  if(c.flicker !== false){
    const baseR = c.radius, baseI = c.intensity || 2;
    scene.tweens.add({
      targets: pl,
      radius:    { from: baseR * 0.88, to: baseR },
      intensity: { from: baseI * 0.62, to: baseI },
      duration:  90 + Math.random()*110,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      delay: Math.random()*200,
    });
  }
}

/* Llama ascendente */
function _fire(scene, x, y, c, depth){
  const em = scene.add.particles(x, y, '__fxDot', {
    speedY: { min:-60, max:-30 }, speedX: { min:-10, max:10 },
    scale:  { start:(c.scale||0.5), end:0 },
    alpha:  { start:0.85, end:0 },
    tint:   c.color || 0xffb347,
    lifespan:{ min:500, max:900 },
    frequency: 1000/(c.rate||30),
    blendMode:'ADD',
  });
  em.setDepth(depth);
}

/* Humo que sube girando y se disuelve */
function _smoke(scene, x, y, c, depth){
  const em = scene.add.particles(x, y, '__fxDot', {
    speedY: { min:-40, max:-18 }, speedX: { min:-14, max:14 },
    scale:  { start:0.3, end:1.4 },
    alpha:  { start:0.35, end:0 },
    tint:   c.color || 0x88aa88,
    lifespan:{ min:1400, max:2400 },
    frequency: 1000/(c.rate||16),
    rotate: { min:-40, max:40 },
  });
  em.setDepth(depth);
}

/* Niebla horizontal en una banda */
function _fog(scene, c, PX, PY, depth){
  const y0 = PY(c.band[0]), y1 = PY(c.band[1]);
  const em = scene.add.particles(0, 0, '__fxDot', {
    x: { min: PX(-0.05), max: PX(1.05) },
    y: { min: y0, max: y1 },
    speedX: { min: -(c.drift||14), max: (c.drift||14) },
    speedY: { min:-4, max:4 },
    scale:  { min:2.2, max:4.5 },
    alpha:  { start:(c.alpha||0.08), end:0 },
    tint:   c.color || 0xc8d4e0,
    lifespan:{ min:3000, max:5200 },
    frequency: 1000/(c.rate||12),
    blendMode:'SCREEN',
  });
  em.setDepth(depth);
}

/* Polvo / motas cayendo lento dentro de una banda */
function _dust(scene, c, PX, PY, depth){
  const em = scene.add.particles(0, 0, '__fxDot', {
    x: { min: PX(0.1), max: PX(0.9) },
    y: { min: PY(c.band[0]), max: PY(c.band[0]) + 4 },
    speedY: { min: 8, max: 26 }, speedX: { min:-8, max:8 },
    scale:  { min:0.05, max:0.2 },
    alpha:  { start:0.5, end:0 },
    tint:   c.color || 0xd8c89a,
    lifespan:{ min:2600, max:4200 },
    frequency: 1000/(c.rate||10),
    blendMode:'SCREEN',
  });
  em.setDepth(depth);
}

/* Brasas que suben (boss) */
function _embers(scene, c, PX, PY, depth){
  const em = scene.add.particles(0, 0, '__fxDot', {
    x: { min: PX(0.15), max: PX(0.85) },
    y: { min: PY(c.band[1]), max: PY(c.band[1]) + 6 },
    speedY: { min:-50, max:-20 }, speedX: { min:-14, max:14 },
    scale:  { min:0.05, max:0.22 },
    alpha:  { start:0.9, end:0 },
    tint:   c.color || 0xff5a2a,
    lifespan:{ min:1600, max:3000 },
    frequency: 1000/(c.rate||20),
    blendMode:'ADD',
  });
  em.setDepth(depth);
}

/* Halo pulsante (respiración de runas / curvas / pentagramas) */
function _glow(scene, x, y, c, depth){
  let pl;
  try { pl = scene.add.pointlight(x, y, c.color, c.r || 90, 0.3); }
  catch(e){ return; }
  pl.setDepth(depth);
  scene.tweens.add({
    targets: pl,
    intensity: { from: 0.12, to: 0.38 },
    radius:    { from: (c.r||90)*0.8, to: (c.r||90) },
    duration:  c.period || 2200,
    yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
  });
}

/* Rayos aleatorios entre dos puntos + destello + (opcional) shake */
function _lightning(scene, c, PX, PY, depth, shake){
  const g = scene.add.graphics().setDepth(depth + 1);
  const x0 = PX(c.x0), y0 = PY(c.y0), x1 = PX(c.x1), y1 = PY(c.y1);

  const strike = () => {
    g.clear();
    // trazo quebrado en segmentos con jitter perpendicular
    const segs = 7;
    const dx = (x1 - x0), dy = (y1 - y0);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;   // normal
    g.lineStyle(2.5, c.color, 1);
    g.beginPath();
    g.moveTo(x0, y0);
    for(let i=1;i<segs;i++){
      const t = i / segs;
      const j = (Math.random() - 0.5) * 26;
      g.lineTo(x0 + dx*t + nx*j, y0 + dy*t + ny*j);
    }
    g.lineTo(x1, y1);
    g.strokePath();
    // halo blanco breve
    g.lineStyle(5, 0xffffff, 0.5);
    g.strokePath();
    g.setAlpha(1);
    if(shake) scene.cameras.main.shake(120, 0.004);
    scene.tweens.add({ targets:g, alpha:0, duration:160, ease:'Quad.easeOut' });
    schedule();
  };
  const schedule = () => {
    const d = c.everyMin + Math.random() * (c.everyMax - c.everyMin);
    scene.time.delayedCall(d, strike);
  };
  g.setAlpha(0);
  schedule();
}
