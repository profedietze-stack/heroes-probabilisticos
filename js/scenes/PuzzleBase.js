/* ══════════════════════════════════════
   PuzzleBase.js — Utilidades compartidas para todos los minijuegos
   Variables globales: _gcd, _frac, _shuffle, _binomial,
     pzBg, pzHeader, pzButtons, pzResult, pzComplete,
     pzPopIn, pzFloatY, pzBurst, pzSparkles
══════════════════════════════════════ */

function _gcd(a, b) { return b ? _gcd(b, a % b) : a; }
function _frac(n, d) { const g = _gcd(Math.abs(n), Math.abs(d)); return (n/g) + '/' + (d/g); }
function _shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function _binomial(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < Math.min(k, n-k); i++) {
    r = r * (n - i) / (i + 1);
  }
  return Math.round(r);
}

/* Valor numérico de una etiqueta "n/d" (o "n"). */
function _valorFrac(etiqueta) {
  const [n, d] = String(etiqueta).split('/').map(Number);
  return d ? n / d : n;
}

/* Arma las cuatro opciones de un enigma de fracciones.
   Los distractores se eligen para que el RANGO de la correcta entre las
   opciones ordenadas por valor sea parejo (la 1ª, 2ª, 3ª o 4ª más chica), no
   sólo su posición en pantalla. Con listas fijas de errores la correcta caía
   siempre en el mismo rango (en Dados: la 3ª más chica el 100 % de las veces)
   y un alumno que lo nota acierta sin hacer la cuenta.
   - plausibles: errores típicos del tema (complemento, otro sector, ±1...).
   - relleno:    fracciones válidas del problema, sólo se usan si hacen falta
                 para cubrir el rango sorteado.
   Todo lo que valga lo mismo que la correcta, esté repetido o no sea una
   probabilidad (0 < p < 1) se descarta. */
function _opcionesFrac(corr, plausibles, relleno) {
  const vc = _valorFrac(corr);
  const vistos = new Set([corr]);
  const limpio = (lista) => _shuffle(lista.filter((l) => {
    const v = _valorFrac(l);
    if (vistos.has(l) || !(v > 0 && v < 1) || Math.abs(v - vc) < 1e-12) return false;
    vistos.add(l);
    return true;
  }));
  const pl = limpio(plausibles);
  const re = limpio(relleno);
  // Último recurso para problemas con pocas fracciones posibles (2 monedas:
  // sólo 1/4, 1/2 y 3/4): denominadores comunes de aula.
  const re2 = limpio(_fraccionesDe(2, 3, 4, 5, 6, 8, 10, 12));
  const lado = (abajo, n) => {
    const salen = (l) => (_valorFrac(l) < vc) === abajo;
    const a = pl.filter(salen).slice(0, n);
    const b = a.concat(re.filter(salen).slice(0, n - a.length));
    return b.concat(re2.filter(salen).slice(0, n - b.length));
  };
  const abajoMax = lado(true, 3).length, arribaMax = lado(false, 3).length;
  const rangos = [0, 1, 2, 3].filter((r) => abajoMax >= r && arribaMax >= 3 - r);
  let distractores;
  if (rangos.length) {
    const r = rangos[Math.floor(Math.random() * rangos.length)];
    distractores = [...lado(true, r), ...lado(false, 3 - r)];
  } else {
    distractores = pl.concat(re, re2).slice(0, 3);
  }
  return _shuffle([
    { label: corr, ok: true },
    ...distractores.map((l) => ({ label: l, ok: false })),
  ]);
}

/* Todas las fracciones propias n/d (0 < n/d < 1) para los denominadores dados. */
function _fraccionesDe(...denominadores) {
  const out = [];
  denominadores.forEach((d) => { for (let n = 1; n < d; n++) out.push(_frac(n, d)); });
  return out;
}


/* ════════════════════════════════════════
   TELÉFONO APAISADO (lienzo = pantalla real, alto < 500)
   La pantalla del enigma se reparte entre dos cámaras:
   · principal (pantalla completa): fondo, pregunta, respuestas y botones: objetos con scrollFactor 0;
   · "ilustración": una ventana a la izquierda que muestra la parte del mundo donde dibuja el enigma
     (urna, ruleta, dados…), con el zoom que haga falta para que entre.
   En escritorio y tablet no se crea nada y todo sigue igual (scene._pz es null).
════════════════════════════════════════ */
function pzCompacto(scene){ return scene.scale.height < 500; }

/* Zonas de la pantalla: cabecera arriba, ilustración a la izquierda, pregunta y respuestas a la derecha.
   Con `ancho` la ilustración usa todo el ancho (enigmas sin cuadrícula de respuestas). */
function pzZonas(scene, ancho){
  const w = scene.scale.width, h = scene.scale.height;
  const top = 44, pad = 8, bot = 14;   // la interfaz (respuestas) deja más aire abajo: esquinas redondeadas y barra de gestos
  const rightW = ancho ? 0 : Math.min(400, Math.round(w * 0.5));
  const illW = ancho ? w - 2*pad : w - rightW - 3*pad;
  return { w, h, top, pad,
    ill: { x: pad, y: top, w: illW, h: h - top - pad },   // la ilustración conserva su alto: sus botones de acción están dibujados contra ese borde
    ui:  { x: pad + illW + pad, y: top, w: rightW, h: h - top - bot } };
}

/* Se llama al empezar create(), antes de dibujar nada.
   rect = zona del mundo (coordenadas del enigma) que contiene la ilustración. Devuelve null en escritorio. */
function pzCompactoInit(scene, rect, opts){
  scene._pz = null;
  if(!pzCompacto(scene)) return null;
  const Z = pzZonas(scene, opts && opts.ancho);
  const zoom = Math.min((opts && opts.zoomMax) || 1, Z.ill.w / rect.w, Z.ill.h / rect.h);
  const pz = { Z, rect, zoom, cams: null, fixed: false };
  // Lo que se crea dentro de pzFijo() queda fijo a la pantalla (interfaz).
  pz.onAdd = (go) => { if(pz.fixed) go.setScrollFactor(0); };
  // Antes de cada dibujo se reparte la cámara de cada objeto según su scrollFactor ACTUAL
  // (así vale también para lo que se crea tarde o se fija después de crearlo).
  pz.sync = () => {
    if(!pz.cams) return;
    const m = pz.cams.main.id, il = pz.cams.ill.id;
    const marcar = (go, fijo) => {
      const f = fijo || go.scrollFactorX === 0;
      go.cameraFilter = f ? ((go.cameraFilter | il) & ~m) : ((go.cameraFilter | m) & ~il);
      if(go.list) go.list.forEach(c => marcar(c, f));
    };
    scene.children.list.forEach(go => marcar(go, false));
  };
  scene.sys.events.on('addedtoscene', pz.onAdd);
  scene.events.on('postupdate', pz.sync);
  scene.events.once('shutdown', () => {
    scene.sys.events.off('addedtoscene', pz.onAdd);
    scene.events.off('postupdate', pz.sync);
  });
  scene._pz = pz;
  return pz;
}

/* Ejecuta fn() haciendo que todo lo que cree quede fijo a la pantalla (interfaz). */
function pzFijo(scene, fn){
  if(!scene._pz) return fn();
  const prev = scene._pz.fixed; scene._pz.fixed = true;
  try { return fn(); } finally { scene._pz.fixed = prev; }
}

/* Se llama al terminar create(): crea la cámara de la ilustración y reparte los objetos. */
function pzCompactoFin(scene){
  const pz = scene._pz;
  if(!pz) return;
  const main = scene.cameras.main;
  const ill = scene.cameras.add(pz.Z.ill.x, pz.Z.ill.y, pz.Z.ill.w, pz.Z.ill.h).setName('ilustracion');
  ill.setZoom(pz.zoom);
  ill.centerOn(pz.rect.x + pz.rect.w/2, pz.rect.y + pz.rect.h/2);
  pz.cams = { main, ill };
  pz.sync();
  ill.fadeIn(400, 0, 0, 0);
}

/* Pregunta del enigma en el teléfono: textos apilados arriba de la zona derecha. Devuelve el y libre. */
function pzPreguntaMovil(scene, items, y0){
  const U = scene._pz.Z.ui;
  let y = (y0 === undefined) ? U.y + 2 : y0;
  items.forEach((it, i) => {
    const t = scene.add.text(U.x + U.w/2, y, it.txt, {
      fontFamily: it.fam || 'Poppins', fontSize: it.size || '14px', color: it.color || '#c0cad8',
      fontStyle: it.estilo || 'normal', align:'center', wordWrap:{ width: U.w - 8 }, lineSpacing: 3
    }).setOrigin(0.5, 0).setScrollFactor(0);
    pzPopIn(scene, t, 80 + i*80);
    y += t.height + 8;
  });
  return y;
}

/* ════════════════════════════════════════
   HELPERS DE ANIMACIÓN (reusables por escenas)
════════════════════════════════════════ */

/* Aparición con rebote desde abajo. delay opcional, escalonado. */
function pzPopIn(scene, obj, delay = 0, fromY = 24) {
  if (!obj) return obj;
  const finalY = obj.y;
  const finalScale = obj.scaleX || 1;
  obj.setAlpha(0);
  obj.y = finalY + fromY;
  obj.setScale(finalScale * 0.85);
  scene.tweens.add({
    targets: obj, alpha: 1, y: finalY, scaleX: finalScale, scaleY: finalScale,
    duration: 460, delay, ease: 'Back.easeOut'
  });
  return obj;
}

/* Flotación vertical infinita (idle suave). */
function pzFloatY(scene, obj, amp = 8, dur = 2600, delay = 0) {
  if (!obj) return obj;
  scene.tweens.add({
    targets: obj, y: obj.y - amp, duration: dur, delay,
    yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
  });
  return obj;
}

/* Estallido de partículas radiales en (x,y). */
function pzBurst(scene, x, y, color = 0xD4AF37, count = 26, depth = 30, spread = 6, fijo = false) {
  const g = scene.add.graphics().setDepth(depth);
  if (fijo) g.setScrollFactor(0);
  const parts = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1.5 + Math.random() * spread;
    parts.push({
      x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 1.5,
      life: 1, size: 2 + Math.random()*4,
      col: Array.isArray(color) ? color[Math.floor(Math.random()*color.length)] : color
    });
  }
  scene.time.addEvent({ delay: 22, repeat: 26, callback: () => {
    g.clear();
    let alive = false;
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.life -= 0.035;
      if (p.life > 0) {
        alive = true;
        g.fillStyle(p.col, p.life);
        g.fillCircle(p.x, p.y, p.size * p.life);
      }
    });
    if (!alive) g.destroy();
  }});
  return g;
}

/* Chispas ambientales que suben lentamente desde la base. */
function pzSparkles(scene, accentCol) {
  const w = scene.scale.width, h = scene.scale.height;
  const g = scene.add.graphics().setDepth(0);
  const motes = [];
  for (let i = 0; i < 16; i++) {
    motes.push({
      x: Math.random()*w, y: Math.random()*h,
      vy: -(0.2 + Math.random()*0.5), r: Math.random()*1.6 + 0.5,
      a: Math.random()*0.4 + 0.1, da: (Math.random()*0.012),
      col: Math.random() > 0.6 ? accentCol : 0xD4AF37
    });
  }
  scene.time.addEvent({ delay: 50, loop: true, callback: () => {
    g.clear();
    motes.forEach(m => {
      m.y += m.vy; m.a += m.da;
      if (m.a > 0.5 || m.a < 0.08) m.da *= -1;
      if (m.y < -5) { m.y = h + 5; m.x = Math.random()*w; }
      g.fillStyle(m.col, m.a);
      g.fillCircle(m.x, m.y, m.r);
    });
  }});
  return g;
}

/* Anima un texto de 0 → targetVal con ease. prefix/suffix son strings. */
function pzCountUp(scene, textObj, targetVal, duration, prefix, suffix) {
  prefix = prefix || '';
  suffix = suffix || '';
  var c = { v: 0 };
  scene.tweens.add({
    targets: c, v: targetVal, duration: duration, ease: 'Cubic.easeOut',
    onUpdate: function () { textObj.setText(prefix + Math.round(c.v) + suffix); },
    onComplete: function () { textObj.setText(prefix + targetVal + suffix); }
  });
}

/* Bounce de escala rápido sobre un objeto. */
function pzBounceScale(scene, obj, scale, dur) {
  scale = scale || 1.2; dur = dur || 220;
  scene.tweens.add({
    targets: obj, scaleX: scale, scaleY: scale, duration: dur / 2,
    yoyo: true, ease: 'Quad.easeOut'
  });
}

/* Botón de acción secundaria (lanzar, sacar, etc). Retorna el container. */
function pzActionBtn(scene, cx, cy, label, accentNum, onClick) {
  var BW = 176, BH = 34, FS = '12px';
  if (scene._pz) {   // teléfono: 46 px de alto reales (el zoom de la ilustración los achica)
    var K = 1 / scene._pz.zoom;
    // El ancho crece con la etiqueta (Cinzel en mayúsculas: ~0,68 em por letra) para que el texto no toque los bordes.
    BW = Math.max(Math.ceil(190 * K), Math.ceil((String(label).length * 14 * 0.68 + 36) * K)); BH = Math.ceil(46 * K); FS = Math.ceil(14 * K) + 'px';
  }
  var cont = scene.add.container(cx, cy).setDepth(4);
  var g    = scene.add.graphics();

  function draw(hover) {
    g.clear();
    g.fillGradientStyle(
      hover ? 0x223050 : 0x141e38, hover ? 0x223050 : 0x141e38,
      hover ? 0x0e1e30 : 0x080e1c, hover ? 0x0e1e30 : 0x080e1c, 1);
    g.fillRoundedRect(-BW/2, -BH/2, BW, BH, 9);
    g.fillStyle(0xffffff, hover ? 0.09 : 0.05);
    g.fillRoundedRect(-BW/2+2, -BH/2+2, BW-4, BH*0.4, 7);
    g.lineStyle(1.5, accentNum, hover ? 0.95 : 0.55);
    g.strokeRoundedRect(-BW/2, -BH/2, BW, BH, 9);
  }
  draw(false);

  var txt = scene.add.text(0, 0, label, {
    fontFamily: 'Cinzel', fontSize: FS, color: '#cdd8ee', fontStyle: '600'
  }).setOrigin(0.5);
  cont.add([g, txt]);
  cont.setSize(BW, BH).setInteractive({ useHandCursor: true });

  cont.on('pointerover', function () {
    draw(true); txt.setColor('#F5D97A');
    scene.tweens.add({ targets: cont, scaleX: 1.06, scaleY: 1.06, duration: 130, ease: 'Back.easeOut' });
  });
  cont.on('pointerout', function () {
    draw(false); txt.setColor('#cdd8ee');
    scene.tweens.add({ targets: cont, scaleX: 1, scaleY: 1, duration: 130 });
  });
  cont.on('pointerup', function () {
    scene.tweens.add({ targets: cont, scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true });
    snd_item && snd_item();
    onClick();
  });

  cont.setScale(0).setAlpha(0);
  scene.tweens.add({ targets: cont, scaleX: 1, scaleY: 1, alpha: 1,
    duration: 420, delay: 900, ease: 'Back.easeOut' });
  return cont;
}

/* Rayo de escáner horizontal que cruza de x1 a x2 en `duration` ms.
   onStep(progress 0-1) se llama cada frame. onComplete al finalizar. */
function pzScanBeam(scene, x1, y, x2, height, duration, onStep, onComplete) {
  height = height || 200;
  var beam = scene.add.graphics().setDepth(8);
  var prog = { v: 0 };
  scene.tweens.add({
    targets: prog, v: 1, duration: duration, ease: 'Quad.easeInOut',
    onUpdate: function () {
      beam.clear();
      var bx = x1 + prog.v * (x2 - x1);
      beam.fillStyle(0x70c8e0, 0.18);
      beam.fillRect(bx - 18, y - height / 2, 36, height);
      beam.lineStyle(2, 0x70c8e0, 0.7);
      beam.lineBetween(bx, y - height / 2, bx, y + height / 2);
      beam.fillStyle(0xffffff, 0.5);
      beam.fillCircle(bx, y - height / 2, 4);
      beam.fillCircle(bx, y + height / 2, 4);
      if (onStep) onStep(prog.v, bx);
    },
    onComplete: function () {
      scene.tweens.add({ targets: beam, alpha: 0, duration: 300,
        onComplete: function () { beam.destroy(); } });
      if (onComplete) onComplete();
    }
  });
  return beam;
}

/* ════════════════════════════════════════
   BOTÓN DE AYUDA "?" + overlay explicativo (compartido)
   lines: array de strings. Líneas que empiezan con '◆' = subtítulo.
════════════════════════════════════════ */
function pzInfoButton(scene, npcKey, titulo, lines) {
  if (scene._pz) return _pzInfoMovil(scene, npcKey, titulo, lines);
  const w = scene.scale.width, h = scene.scale.height;
  const accentNum = npcKey === 'oraculo' ? 0x4aa0d8 : 0x8a6828;
  const accentBri = npcKey === 'oraculo' ? 0x70c8e0 : 0xD4AF37;
  const accentHex = npcKey === 'oraculo' ? '#70c8e0' : '#F5D97A';
  const panelBg   = npcKey === 'oraculo' ? 0x040d18 : 0x140d02;
  const bx = w - 40, by = 30;

  const btn = scene.add.graphics().setDepth(50);
  const drawBtn = (hov) => {
    btn.clear();
    btn.fillStyle(npcKey === 'oraculo' ? 0x041a2a : 0x2a1c04, hov ? 0.95 : 0.8);
    btn.fillCircle(bx, by, 15);
    btn.lineStyle(1.5, hov ? accentBri : accentNum, hov ? 1 : 0.7);
    btn.strokeCircle(bx, by, 15);
  };
  drawBtn(false);
  scene.add.text(bx, by, '?', {
    fontFamily:'Cinzel', fontSize:'17px', color:accentHex, fontStyle:'700'
  }).setOrigin(0.5).setDepth(51);

  const ov  = scene.add.container(0, 0).setDepth(60).setAlpha(0).setVisible(false);
  const dim = scene.add.rectangle(w/2, h/2, w, h, 0x000000, 0.74).setInteractive();

  /* Alto dinámico según número de líneas */
  const pw = 640;
  const ph = Math.min(h - 24, 120 + lines.length * 19);
  const px = w/2 - pw/2, py = h/2 - ph/2;

  const panel = scene.add.graphics();
  panel.fillStyle(panelBg, 0.98);
  panel.fillRoundedRect(px, py, pw, ph, 14);
  panel.lineStyle(2, accentNum, 0.85);
  panel.strokeRoundedRect(px, py, pw, ph, 14);
  panel.lineStyle(1, accentBri, 0.2);
  panel.strokeRoundedRect(px+5, py+5, pw-10, ph-10, 10);

  const title = scene.add.text(w/2, py + 30, titulo, {
    fontFamily:'Cinzel', fontSize:'18px', color:accentHex, fontStyle:'700'
  }).setOrigin(0.5);

  const body = scene.add.text(px + 36, py + 58, lines.join('\n'), {
    fontFamily:'Poppins', fontSize:'11.5px', color:'#c8d4e0',
    lineSpacing:4, wordWrap:{ width: pw - 72 }
  });

  const closeTxt = scene.add.text(w/2, py + ph - 22, 'Cerrar', {
    fontFamily:'Cinzel', fontSize:'13px', color:accentHex, fontStyle:'700'
  }).setOrigin(0.5).setInteractive({ useHandCursor:true });

  ov.add([dim, panel, title, body, closeTxt]);

  const show = (v) => {
    ov.setVisible(true);
    scene.tweens.add({ targets:ov, alpha: v ? 1 : 0, duration:220,
      onComplete:() => { if (!v) ov.setVisible(false); } });
  };

  const hit = scene.add.circle(bx, by, 16, 0, 0).setDepth(52)
    .setInteractive({ useHandCursor:true });
  hit.on('pointerover', () => drawBtn(true));
  hit.on('pointerout',  () => drawBtn(false));
  hit.on('pointerup',   () => { snd_item && snd_item(); show(true); });
  dim.on('pointerup',      () => show(false));
  closeTxt.on('pointerup', () => show(false));
  return { show };
}

/* Teléfono: la ayuda es un modal con scroll (letra de 14 px) y el "?" mide 44 px. */
function _pzInfoMovil(scene, npcKey, titulo, lines) {
  const w = scene.scale.width;
  const accentNum = npcKey === 'oraculo' ? 0x4aa0d8 : 0x8a6828;
  const accentBri = npcKey === 'oraculo' ? 0x70c8e0 : 0xD4AF37;
  const accentHex = npcKey === 'oraculo' ? '#70c8e0' : '#F5D97A';
  const bx = w - 76, by = 24;
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const html = '<div style="font-family:Poppins,sans-serif;font-size:14px;line-height:1.55;color:#c8d4e0">' +
    lines.map(l => {
      if (!l) return '<div style="height:6px"></div>';
      if (l.charAt(0) === '◆') return `<div style="color:${accentHex};font-family:Cinzel,serif;font-weight:700;margin-top:6px">${esc(l.slice(1).trim())}</div>`;
      return `<div>${esc(l)}</div>`;
    }).join('') + '</div>';
  const show = (v) => { if (v) openItemModal(html, titulo); else closeItemModal(); };
  // Salir de la escena con la ayuda abierta no la deja tapando la escena siguiente.
  scene.events.once('shutdown', () => closeItemModal());

  const btn = scene.add.graphics().setDepth(50).setScrollFactor(0);
  btn.fillStyle(npcKey === 'oraculo' ? 0x041a2a : 0x2a1c04, 0.85); btn.fillCircle(bx, by, 20);
  btn.lineStyle(1.5, accentNum, 0.9); btn.strokeCircle(bx, by, 20);
  scene.add.text(bx, by, '?', { fontFamily:'Cinzel', fontSize:'20px', color:accentHex, fontStyle:'700' })
    .setOrigin(0.5).setDepth(51).setScrollFactor(0);
  const hit = scene.add.circle(bx, by, 22, 0, 0).setDepth(52).setScrollFactor(0).setInteractive({ useHandCursor:true });
  hit.on('pointerup', () => { snd_item && snd_item(); show(true); });
  return { show };
}

/* ════════════════════════════════════════
   BUSTO NPC — esquina inferior izquierda (solo Modo Minijuegos)
════════════════════════════════════════ */
function pzNPCBust(scene, npcKey, w, h) {
  if (scene._pz) return;   // en el teléfono no hay lugar para el busto
  if (typeof createNPCElement !== 'function' || typeof NPC_DATA === 'undefined') return;
  const data = NPC_DATA[npcKey];
  if (!data) return;

  const SIZE = 150;
  const el = createNPCElement(npcKey, SIZE, SIZE);
  if (!el) return;
  setNPCState(el, 'idle');

  const domX = SIZE / 2 + 8;
  const domY = h - SIZE / 2 - 8;
  const domObj = scene.add.dom(domX, domY, el).setDepth(8).setAlpha(0);

  const frases = data.dialogos.intro || [];
  const frase  = frases[Math.floor(Math.random() * frases.length)] || '';
  const accentHex = npcKey === 'oraculo' ? '#70c8e0' : '#D4AF37';
  const panelCol  = npcKey === 'oraculo' ? 0x040d18 : 0x140d02;
  const borderCol = npcKey === 'oraculo' ? 0x4aa0d8 : 0x8a6828;

  const BW = 210, BH = 60;
  const bx = domX + SIZE / 2 + 6;
  const by = domY - 10;
  const bubbleG = scene.add.graphics().setDepth(8).setAlpha(0);
  bubbleG.fillStyle(panelCol, 0.93);
  bubbleG.fillRoundedRect(bx, by - BH / 2, BW, BH, 8);
  bubbleG.lineStyle(1, borderCol, 0.85);
  bubbleG.strokeRoundedRect(bx, by - BH / 2, BW, BH, 8);

  const bubbleTxt = scene.add.text(bx + BW / 2, by, frase ? `"${frase}"` : '', {
    fontFamily:'Poppins', fontSize:'10px', color: accentHex, fontStyle:'italic',
    align:'center', wordWrap:{ width: BW - 18 }, lineSpacing:2
  }).setOrigin(0.5).setDepth(9).setAlpha(0);

  scene.tweens.add({ targets:[domObj, bubbleG, bubbleTxt], alpha:1, duration:600, delay:600 });

  const hide = () => {
    scene.tweens.add({ targets:[domObj, bubbleG, bubbleTxt], alpha:0, duration:500,
      onComplete:() => { domObj.destroy(); bubbleG.destroy(); bubbleTxt.destroy(); } });
  };
  scene.time.delayedCall(5500, hide);

  const hitZ = scene.add.rectangle(domX, domY, SIZE + 16, SIZE + 16, 0, 0)
    .setDepth(10).setInteractive({ useHandCursor:true });
  hitZ.on('pointerup', () => { hitZ.destroy(); hide(); });
}

/* ════════════════════════════════════════
   FONDO temático animado
════════════════════════════════════════ */
function pzBg(scene, npcKey) {
  return pzFijo(scene, () => _pzBg(scene, npcKey));
}
function _pzBg(scene, npcKey) {
  const w = scene.scale.width, h = scene.scale.height;
  const bandH = scene._pz ? 40 : 66;
  const accent     = npcKey === 'oraculo' ? 0x306090 : 0x6a4010;
  const accentBright= npcKey === 'oraculo' ? 0x4aa0d8 : 0xc88820;
  const accentHex  = npcKey === 'oraculo' ? '#4aa0d8' : '#c88820';

  // Gradiente base
  const g = scene.add.graphics();
  g.fillGradientStyle(0x0a0a14, 0x0a0a14, 0x040408, 0x040408, 1);
  g.fillRect(0, 0, w, h);

  // Resplandor radial temático detrás del contenido (pulsante)
  const glow = scene.add.graphics().setDepth(0);
  const glowState = { r: 0.9 };
  const drawGlow = () => {
    glow.clear();
    const cx = w/2, cy = h*0.42;
    for (let i = 6; i >= 1; i--) {
      glow.fillStyle(accent, 0.04 * glowState.r);
      glow.fillCircle(cx, cy, i * 52 * glowState.r);
    }
  };
  drawGlow();
  scene.tweens.add({ targets: glowState, r: 1.12, duration: 3200,
    yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onUpdate: drawGlow });

  // Estrellas con parpadeo
  for (let i = 0; i < 34; i++) {
    const s = scene.add.circle(Math.random()*w, Math.random()*h,
      Math.random()*1.2+0.2, Math.random()>0.7 ? 0xD4AF37 : 0xB0B8C0,
      Math.random()*0.16+0.04);
    scene.tweens.add({targets:s, alpha:{from:0.03, to:s.alpha},
      duration:1800+Math.random()*3200, yoyo:true, repeat:-1, delay:Math.random()*2000});
  }

  // Estrellas fugaces ocasionales
  const shootStar = () => {
    const sy = Math.random()*h*0.5;
    const star = scene.add.graphics().setDepth(1);
    star.lineStyle(2, 0xffffff, 0.8);
    star.lineBetween(0, 0, 28, 8);
    star.setPosition(-30, sy);
    scene.tweens.add({ targets: star, x: w+40, y: sy + h*0.25,
      alpha: { from: 0.9, to: 0 }, duration: 900, ease: 'Quad.easeIn',
      onComplete: () => star.destroy() });
    scene.time.delayedCall(2600 + Math.random()*4200, shootStar);
  };
  scene.time.delayedCall(1500 + Math.random()*2000, shootStar);

  // Motas ascendentes
  pzSparkles(scene, accentBright);

  // Banda superior con barrido de brillo
  const band = scene.add.graphics().setDepth(0);
  band.fillStyle(accent, 0.16);
  band.fillRect(0, 0, w, bandH);
  band.lineStyle(1, accentBright, 0.4);
  band.lineBetween(0, bandH, w, bandH);
  const sweep = scene.add.rectangle(-120, bandH/2, 120, bandH, accentBright, 0.18).setDepth(0);
  const doSweep = () => {
    sweep.x = -120;
    scene.tweens.add({ targets: sweep, x: w+120, duration: 2200,
      ease: 'Sine.easeInOut', onComplete: () => scene.time.delayedCall(2600, doSweep) });
  };
  doSweep();

  // Viñeta sutil
  const vig = scene.add.graphics().setDepth(0);
  vig.fillStyle(0x000000, 0.0);
  vig.lineStyle(60, 0x000000, 0.18);
  vig.strokeRect(-30, -30, w+60, h+60);

  return {w, h, accent, accentBright, accentHex};
}

/* ════════════════════════════════════════
   CABECERA con entrada animada
════════════════════════════════════════ */
function pzHeader(scene, puzName, npcKey, w) {
  /* Guardado al INICIO del minijuego — sólo en aventura (no clobbear save en arcade/libre) */
  if (!(scene._data && scene._data.modoArcade) && typeof saveGameLegend === 'function') {
    saveGameLegend();
  }
  if (scene._pz) { pzFijo(scene, () => _pzHeaderMovil(scene, puzName, npcKey, w)); return; }
  const accentCol = npcKey === 'oraculo' ? '#70c8e0' : '#D4AF37';
  const accentNum = npcKey === 'oraculo' ? 0x70c8e0 : 0xD4AF37;
  const npcLabel  = npcKey === 'oraculo' ? 'Oráculo de Laplace' : 'Mercader del Azar';

  const title = scene.add.text(w/2, 20, puzName.toUpperCase(), {
    fontFamily:'Cinzel', fontSize:'15px', color:accentCol, fontStyle:'700', letterSpacing:3,
    stroke:'#050408', strokeThickness:3,
    shadow:{offsetX:0,offsetY:0,color:accentCol,blur:14,fill:true}
  }).setOrigin(0.5);
  title.setAlpha(0).setScale(0.7);
  scene.tweens.add({ targets: title, alpha: 1, scaleX: 1, scaleY: 1,
    duration: 540, ease: 'Back.easeOut' });
  // Latido de brillo continuo
  scene.tweens.add({ targets: title, scaleX: 1.03, scaleY: 1.03,
    duration: 1800, yoyo: true, repeat: -1, delay: 600, ease: 'Sine.easeInOut' });

  const sub = scene.add.text(w/2, 47, npcLabel, {
    fontFamily:'Poppins', fontSize:'10px', color:'#5a6a78', letterSpacing:2
  }).setOrigin(0.5).setAlpha(0);
  scene.tweens.add({ targets: sub, alpha: 1, duration: 600, delay: 240 });

  // Línea decorativa que se "dibuja"
  const lineW = { v: 0 };
  const lg = scene.add.graphics();
  scene.tweens.add({ targets: lineW, v: 1, duration: 600, delay: 300, ease: 'Cubic.easeOut',
    onUpdate: () => {
      lg.clear();
      const half = 120 * lineW.v;
      lg.lineStyle(1.5, accentNum, 0.5);
      lg.lineBetween(w/2 - half, 60, w/2 + half, 60);
      lg.fillStyle(accentNum, 0.9);
      lg.fillCircle(w/2 - half, 60, 2);
      lg.fillCircle(w/2 + half, 60, 2);
    }});

  /* Busto NPC — solo en modos minijuegos, no en aventura (donde aparece completo) */
  const modoArcade = scene._data && scene._data.modoArcade;
  if (modoArcade) {
    const _h = scene.scale.height;
    scene.time.delayedCall(400, () => pzNPCBust(scene, npcKey, w, _h));
  }

  /* Botón Volver — solo en modos libre/arcade, no en aventura */
  if (modoArcade) {
    const _bbg = scene.add.graphics().setDepth(5).setAlpha(0);
    const _drawBB = (hov) => {
      _bbg.clear();
      _bbg.fillStyle(0x0a1828, hov ? 0.92 : 0.75);
      _bbg.fillRoundedRect(10, 6, 96, 26, 5);
      _bbg.lineStyle(1.5, hov ? 0x6090c8 : 0x2a5070, hov ? 0.9 : 0.6);
      _bbg.strokeRoundedRect(10, 6, 96, 26, 5);
    };
    _drawBB(false);
    const backBtn = scene.add.text(58, 19, '← Volver', {
      fontFamily:'Poppins', fontSize:'12px', color:'#7aabcc', fontStyle:'600'
    }).setOrigin(0.5, 0.5).setDepth(6).setAlpha(0).setInteractive({useHandCursor:true});
    backBtn.setSize(96, 26);
    scene.tweens.add({ targets: [backBtn, _bbg], alpha: 1, duration: 400, delay: 600 });
    backBtn.on('pointerover', () => { _drawBB(true); backBtn.setColor('#aaddf8'); });
    backBtn.on('pointerout',  () => { _drawBB(false); backBtn.setColor('#7aabcc'); });
    backBtn.on('pointerup',   () => {
      snd_item && snd_item();
      scene.cameras.main.fadeOut(280, 0, 0, 0);
      scene.cameras.main.once('camerafadeoutcomplete', () => {
        if (modoArcade === 'libre') {
          scene.scene.start('LibreScene');
        } else {
          scene.scene.start('ArcadeScene', { mode:'select' });
        }
      });
    });
  }
}

/* Teléfono: título de 16 px y, en Modo Minijuegos, "← Volver" de 44 px (a la derecha del botón de sonido). */
function _pzHeaderMovil(scene, puzName, npcKey, w) {
  const accentCol = npcKey === 'oraculo' ? '#70c8e0' : '#D4AF37';
  const title = scene.add.text(w/2, 22, puzName.toUpperCase(), {
    fontFamily:'Cinzel', fontSize:'16px', color:accentCol, fontStyle:'700', letterSpacing:2,
    stroke:'#050408', strokeThickness:3
  }).setOrigin(0.5);
  title.setAlpha(0);
  scene.tweens.add({ targets: title, alpha: 1, duration: 500 });
  const modoArcade = scene._data && scene._data.modoArcade;
  if (modoArcade) {
    const back = scene.add.text(80, 22, '← Volver', {
      fontFamily:'Poppins', fontSize:'14px', color:'#9cc4e0', fontStyle:'600',
      backgroundColor:'#0a1828', padding:{ x:12, y:13 }
    }).setOrigin(0, 0.5).setDepth(6).setFixedSize(0, 44).setInteractive({ useHandCursor:true });
    back.on('pointerup', () => {
      snd_item && snd_item();
      scene.cameras.main.fadeOut(280, 0, 0, 0);
      scene.cameras.main.once('camerafadeoutcomplete', () => {
        if (modoArcade === 'libre') scene.scene.start('LibreScene');
        else scene.scene.start('ArcadeScene', { mode:'select' });
      });
    });
  }
}

/* ════════════════════════════════════════
   BOTONES de respuesta (cuadrícula 2×2) animados
════════════════════════════════════════ */
function pzButtons(scene, answers, cy, onPick) {
  const pz = scene._pz;
  const w = scene.scale.width;
  let BW = 210, BH = 56, GAP = 14, cx = w/2;
  let FS = '16px';
  if (pz) {   // teléfono: 2×2 al pie de la zona derecha, de 48 px de alto
    const U = pz.Z.ui;
    GAP = 8; BH = 48; BW = Math.floor((U.w - GAP) / 2); cx = U.x + U.w/2;
    cy = U.y + U.h - (2*BH + GAP);
    FS = '15px';
    if (pz.respFila) {   // en fila: todas las respuestas lado a lado, a lo ancho de la pantalla
      const n = answers.length;
      BH = 46; BW = Math.floor((pz.Z.w - 2*pz.Z.pad - (n-1)*GAP) / n);
      cy = pz.respFila.y;
    }
  }
  const pulse = { v: 0 };
  const buttons = [];
  let locked = false;

  answers.forEach((a, i) => {
    const fila = !!(pz && pz.respFila);
    const bx = fila ? pz.Z.pad + i*(BW+GAP) + BW/2 : cx + (i%2===0 ? -(BW+GAP/2) : GAP/2) + BW/2;
    const by = fila ? cy + BH/2 : cy + Math.floor(i/2) * (BH+GAP) + BH/2;

    const cont = scene.add.container(bx, by).setDepth(3);
    if (pz) cont.setScrollFactor(0);
    const bgG = scene.add.graphics();
    const glowG = scene.add.graphics();
    const txt = scene.add.text(0, 0, a.label, {
      fontFamily:'Cinzel', fontSize:FS, color:'#cdd8ee', fontStyle:'600',
      align:'center', wordWrap: pz ? { width: BW - 14 } : undefined
    }).setOrigin(0.5);
    cont.add([glowG, bgG, txt]);

    const state = { hover: false, picked: false, result: null };
    const draw = () => {
      const p = 0.5 + 0.5*pulse.v;
      bgG.clear(); glowG.clear();
      // Color según resultado
      let fillTop = 0x14203a, fillBot = 0x0a1020, border = 0x2a3a58, bAlpha = 0.6;
      if (state.result === 'ok')   { fillTop = 0x0e3a1c; fillBot = 0x06200e; border = 0x40d070; bAlpha = 1; }
      else if (state.result === 'no'){ fillTop = 0x3a0e12; fillBot = 0x20060a; border = 0xd04050; bAlpha = 1; }
      else if (state.hover)        { fillTop = 0x1e2e52; fillBot = 0x101a34; border = 0xD4AF37; bAlpha = 0.85; }
      // Glow exterior (hover o pulso idle)
      const glowA = state.hover ? 0.5 : (state.result ? 0.6 : 0.14*p);
      const glowCol = state.result === 'ok' ? 0x40d070 : state.result === 'no' ? 0xd04050
                     : state.hover ? 0xD4AF37 : 0x4a6090;
      glowG.fillStyle(glowCol, glowA);
      glowG.fillRoundedRect(-BW/2-3, -BH/2-3, BW+6, BH+6, 9);
      // Fondo
      bgG.fillGradientStyle(fillTop, fillTop, fillBot, fillBot, 1);
      bgG.fillRoundedRect(-BW/2, -BH/2, BW, BH, 8);
      // Brillo superior
      bgG.fillStyle(0xffffff, 0.06);
      bgG.fillRoundedRect(-BW/2+2, -BH/2+2, BW-4, BH*0.4, 6);
      // Borde
      bgG.lineStyle(1.5, border, state.hover || state.result ? bAlpha : 0.55 + 0.25*p);
      bgG.strokeRoundedRect(-BW/2, -BH/2, BW, BH, 8);
    };
    draw();

    cont.setSize(BW, BH).setInteractive({ useHandCursor: true });
    cont.on('pointerover', () => {
      if (locked) return;
      state.hover = true; txt.setColor('#F5D97A');
      scene.tweens.add({ targets: cont, scaleX: 1.06, scaleY: 1.06, duration: 150, ease: 'Back.easeOut' });
      snd_item && snd_item();
    });
    cont.on('pointerout', () => {
      if (locked) return;
      state.hover = false; txt.setColor('#cdd8ee');
      scene.tweens.add({ targets: cont, scaleX: 1, scaleY: 1, duration: 150 });
    });
    cont.on('pointerdown', () => {
      if (locked) return;
      scene.tweens.add({ targets: cont, scaleX: 0.97, scaleY: 0.97, duration: 70, yoyo: true });
    });
    cont.on('pointerup', () => {
      if (locked) return;
      locked = true;
      state.result = a.ok ? 'ok' : 'no';
      // Marcar el botón correcto si el usuario falló
      if (!a.ok) {
        const correct = buttons.find(b => b.answer.ok);
        if (correct) { correct.state.result = 'ok'; correct.draw(); }
      }
      draw();
      // Feedback físico
      if (a.ok) {
        scene.tweens.add({ targets: cont, scaleX: 1.12, scaleY: 1.12, duration: 180,
          yoyo: true, ease: 'Quad.easeOut' });
        pzBurst(scene, bx, by, [0x40d070, 0x70e090, 0xD4AF37], 24, 12, 6, !!pz);
      } else {
        scene.tweens.add({ targets: cont, x: { from: bx-6, to: bx }, duration: 60,
          repeat: 4, yoyo: true });
      }
      // Atenuar los demás
      buttons.forEach(b => { if (b.cont !== cont && !b.state.result) {
        scene.tweens.add({ targets: b.cont, alpha: 0.35, duration: 300 });
      }});
      scene.time.delayedCall(360, () => onPick(a, i));
    });

    // Entrada escalonada
    cont.setAlpha(0); cont.y = by + 26; cont.setScale(0.8);
    scene.tweens.add({ targets: cont, alpha: 1, y: by, scaleX: 1, scaleY: 1,
      duration: 480, delay: 200 + i*90, ease: 'Back.easeOut' });

    buttons.push({ cont, draw, state, answer: a, bx, by });
  });

  // Pulso idle compartido (redibuja bordes)
  scene.tweens.add({ targets: pulse, v: 1, duration: 1500, yoyo: true, repeat: -1,
    ease: 'Sine.easeInOut', onUpdate: () => buttons.forEach(b => {
      if (!b.state.hover && !b.state.result) b.draw();
    })});
}

/* ════════════════════════════════════════
   RESULTADO — modal dramático animado
════════════════════════════════════════ */
function pzResult(scene, correct, explain, hp, puzId) {
  if (scene._pz) { pzFijo(scene, () => _pzResultMovil(scene, correct, explain, hp, puzId)); return; }
  const w = scene.scale.width, h = scene.scale.height;

  // Oscurecimiento
  const dim = scene.add.rectangle(w/2, h/2, w, h, 0x000000, 0).setDepth(10);
  scene.tweens.add({ targets: dim, fillAlpha: 0.62, duration: 320 });

  if (correct) { snd_buff && snd_buff(); }
  else { snd_fail && snd_fail(); scene.cameras.main.shake(320, 0.008); }

  const bw = 540, bh = 290;
  const cont = scene.add.container(w/2, h/2).setDepth(11);

  // Borde glow animado
  const glowG = scene.add.graphics();
  const borderG = scene.add.graphics();
  const bg2 = scene.add.graphics();
  const accent = correct ? 0x38c060 : 0xc04040;
  const accentBright = correct ? 0x70ff9a : 0xff6a6a;
  bg2.fillGradientStyle(
    correct ? 0x0a2410 : 0x240a0a, correct ? 0x0a2410 : 0x240a0a,
    correct ? 0x051a0a : 0x1a0505, correct ? 0x051a0a : 0x1a0505, 1);
  bg2.fillRoundedRect(-bw/2, -bh/2, bw, bh, 14);
  const glowState = { v: 0 };
  const drawBorder = () => {
    glowG.clear(); borderG.clear();
    glowG.fillStyle(accent, 0.12 + 0.1*glowState.v);
    glowG.fillRoundedRect(-bw/2-6, -bh/2-6, bw+12, bh+12, 16);
    borderG.lineStyle(2.5, accentBright, 0.7 + 0.3*glowState.v);
    borderG.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 14);
    borderG.lineStyle(1, accent, 0.4);
    borderG.strokeRoundedRect(-bw/2+5, -bh/2+5, bw-10, bh-10, 11);
  };
  drawBorder();
  scene.tweens.add({ targets: glowState, v: 1, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onUpdate: drawBorder });
  cont.add([glowG, bg2, borderG]);

  // Icono grande con rebote
  const icon = scene.add.text(0, -bh/2+44, correct ? '✓' : '✗', {
    fontFamily:'Cinzel', fontSize:'46px', color: correct ? '#50e080' : '#e85050', fontStyle:'700',
    stroke:'#000', strokeThickness:4
  }).setOrigin(0.5);
  cont.add(icon);
  icon.setScale(0);
  scene.tweens.add({ targets: icon, scaleX: 1, scaleY: 1, duration: 520, delay: 120, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: icon, angle: { from: -6, to: 6 }, duration: 1400,
    yoyo: true, repeat: -1, delay: 640, ease: 'Sine.easeInOut' });

  const titleTxt = scene.add.text(0, -bh/2+86, correct ? '¡CORRECTO!' : 'RESPUESTA INCORRECTA', {
    fontFamily:'Cinzel', fontSize:'19px', color: correct ? '#40c870' : '#c84040', fontStyle:'700', letterSpacing:1
  }).setOrigin(0.5);
  cont.add(titleTxt);

  // Recompensa: HP en aventura, puntos en arcade/libre
  const _arcade = scene._data && scene._data.modoArcade;
  const gain    = correct ? hp : Math.floor(hp/3);
  if (!_arcade) {
    // Aventura: mostrar HP
    if (gain > 0) {
      const hpTxt = scene.add.text(0, -bh/2+118, `+0 HP`, {
        fontFamily:'Cinzel', fontSize:'17px', color:'#D4AF37', fontStyle:'700'
      }).setOrigin(0.5);
      cont.add(hpTxt);
      const cnt = { v: 0 };
      scene.tweens.add({ targets: cnt, v: gain, duration: 700, delay: 400, ease: 'Cubic.easeOut',
        onUpdate: () => hpTxt.setText(`+${Math.round(cnt.v)} HP`),
        onComplete: () => scene.tweens.add({ targets: hpTxt, scaleX: 1.25, scaleY: 1.25, duration: 160, yoyo: true }) });
    }
  } else {
    // Arcade / Libre: mostrar puntos
    const dif     = (scene._data && scene._data.dificultad) || 'normal';
    const modeKey = _arcade === 'libre' ? 'libre' : 'arcade';
    const delta   = Math.round(ptsCalc(correct, dif, modeKey) * (scene._ptsMult || 1));
    const sign    = delta >= 0 ? '+' : '-';
    const ptsColor = delta >= 0 ? '#D4AF37' : '#e05050';
    const ptsTxt = scene.add.text(0, -bh/2+118, `${sign}0 pts`, {
      fontFamily:'Cinzel', fontSize:'17px', color: ptsColor, fontStyle:'700'
    }).setOrigin(0.5);
    cont.add(ptsTxt);
    const cnt2 = { v: 0 };
    scene.tweens.add({ targets: cnt2, v: Math.abs(delta), duration: 700, delay: 400, ease: 'Cubic.easeOut',
      onUpdate: () => ptsTxt.setText(`${sign}${Math.round(cnt2.v)} pts`),
      onComplete: () => scene.tweens.add({ targets: ptsTxt, scaleX: 1.25, scaleY: 1.25, duration: 160, yoyo: true }) });
  }

  const expTxt = scene.add.text(0, -bh/2+148, explain, {
    fontFamily:'Poppins', fontSize:'11.5px', color:'#aac0d8',
    wordWrap:{width:bw-56}, lineSpacing:3, align:'center'
  }).setOrigin(0.5, 0);
  cont.add(expTxt);
  expTxt.setAlpha(0);
  scene.tweens.add({ targets: expTxt, alpha: 1, duration: 400, delay: 500 });

  // Entrada del modal
  cont.setScale(0.4); cont.setAlpha(0);
  scene.tweens.add({ targets: cont, scaleX: 1, scaleY: 1, alpha: 1, duration: 480, ease: 'Back.easeOut' });

  // Estallido de celebración
  if (correct) {
    scene.time.delayedCall(280, () => {
      pzBurst(scene, w/2, h/2 - 60, [0xD4AF37, 0x40d070, 0xffffff, 0x70e090], 40, 12, 9);
    });
  }

  // Botón Continuar
  const _gain = (!_arcade) ? gain : 0;
  const btnY = bh/2 - 28;
  const contBtnG = scene.add.graphics();
  const drawContBtn = (hov) => {
    contBtnG.clear();
    contBtnG.fillStyle(correct ? 0x0e3a1c : 0x3a0e12, hov ? 0.95 : 0.75);
    contBtnG.fillRoundedRect(-100, btnY - 18, 200, 36, 8);
    contBtnG.lineStyle(2, correct ? 0x40d070 : 0xd04050, hov ? 1.0 : 0.6);
    contBtnG.strokeRoundedRect(-100, btnY - 18, 200, 36, 8);
  };
  drawContBtn(false);
  const contBtnTxt = scene.add.text(0, btnY, 'Continuar →', {
    fontFamily:'Cinzel', fontSize:'14px', color: correct ? '#50e080' : '#e06060', fontStyle:'700'
  }).setOrigin(0.5);
  cont.add([contBtnG, contBtnTxt]);
  contBtnG.setAlpha(0); contBtnTxt.setAlpha(0);
  scene.time.delayedCall(1000, () => {
    scene.tweens.add({ targets: [contBtnG, contBtnTxt], alpha: 1, duration: 350, ease: 'Cubic.easeOut' });
    const hit = scene.add.rectangle(w/2, h/2 + btnY, 200, 36, 0, 0)
      .setDepth(20).setInteractive({useHandCursor:true});
    hit.on('pointerover', () => { drawContBtn(true); contBtnTxt.setColor(correct ? '#90ffb0' : '#ffaaaa'); snd_item && snd_item(); });
    hit.on('pointerout',  () => { drawContBtn(false); contBtnTxt.setColor(correct ? '#50e080' : '#e06060'); });
    hit.on('pointerup',   () => {
      hit.destroy();
      pzComplete(scene, _gain, puzId, correct);
    });
  });
}

/* Teléfono: el resultado ocupa casi toda la pantalla (la ilustración se oculta), letra de 14 px y botón de 44 px. */
function _pzResultMovil(scene, correct, explain, hp, puzId) {
  const w = scene.scale.width, h = scene.scale.height;
  if (scene._pz.cams) scene._pz.cams.ill.setVisible(false);
  const dim = scene.add.rectangle(w/2, h/2, w, h, 0x000000, 0).setDepth(55).setInteractive();
  scene.tweens.add({ targets: dim, fillAlpha: 0.72, duration: 300 });
  if (correct) { snd_buff && snd_buff(); }
  else { snd_fail && snd_fail(); scene.cameras.main.shake(320, 0.008); }

  const bw = Math.min(w - 24, 620), bh = Math.min(h - 24, 310);
  const cont = scene.add.container(w/2, h/2).setDepth(56);
  const accent = correct ? 0x38c060 : 0xc04040;
  const accentBright = correct ? 0x70ff9a : 0xff6a6a;
  const bg2 = scene.add.graphics();
  bg2.fillGradientStyle(correct ? 0x0a2410 : 0x240a0a, correct ? 0x0a2410 : 0x240a0a,
    correct ? 0x051a0a : 0x1a0505, correct ? 0x051a0a : 0x1a0505, 1);
  bg2.fillRoundedRect(-bw/2, -bh/2, bw, bh, 14);
  bg2.lineStyle(2.5, accentBright, 0.9); bg2.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 14);
  bg2.lineStyle(1, accent, 0.4); bg2.strokeRoundedRect(-bw/2+5, -bh/2+5, bw-10, bh-10, 11);
  cont.add(bg2);

  const icon = scene.add.text(0, -bh/2 + 32, correct ? '✓' : '✗', {
    fontFamily:'Cinzel', fontSize:'38px', color: correct ? '#50e080' : '#e85050', fontStyle:'700', stroke:'#000', strokeThickness:4
  }).setOrigin(0.5);
  const titleTxt = scene.add.text(0, -bh/2 + 68, correct ? '¡CORRECTO!' : 'RESPUESTA INCORRECTA', {
    fontFamily:'Cinzel', fontSize:'17px', color: correct ? '#40c870' : '#e06868', fontStyle:'700', letterSpacing:1
  }).setOrigin(0.5);
  cont.add([icon, titleTxt]);

  const _arcade = scene._data && scene._data.modoArcade;
  const gain = correct ? hp : Math.floor(hp/3);
  let premio = '';
  if (!_arcade) {
    if (gain > 0) premio = `+${gain} HP`;
  } else {
    const dif = (scene._data && scene._data.dificultad) || 'normal';
    const delta = Math.round(ptsCalc(correct, dif, _arcade === 'libre' ? 'libre' : 'arcade') * (scene._ptsMult || 1));
    premio = `${delta >= 0 ? '+' : '-'}${Math.abs(delta)} pts`;
  }
  let y = -bh/2 + 92;
  if (premio) {
    cont.add(scene.add.text(0, y, premio, { fontFamily:'Cinzel', fontSize:'16px', color:'#D4AF37', fontStyle:'700' }).setOrigin(0.5, 0));
    y += 26;
  }
  cont.add(scene.add.text(0, y + 2, explain, {
    fontFamily:'Poppins', fontSize:'14px', color:'#c3d2e2', wordWrap:{ width: bw - 48 }, lineSpacing:3, align:'center'
  }).setOrigin(0.5, 0));

  cont.setScale(0.6); cont.setAlpha(0);
  scene.tweens.add({ targets: cont, scaleX: 1, scaleY: 1, alpha: 1, duration: 380, ease: 'Back.easeOut' });
  if (correct) scene.time.delayedCall(260, () => pzBurst(scene, w/2, h/2 - 70, [0xD4AF37, 0x40d070, 0xffffff], 36, 12, 8, true));

  const _gain = (!_arcade) ? gain : 0;
  const btnG = scene.add.graphics().setDepth(57).setAlpha(0);
  const bx = w/2, by = h/2 + bh/2 - 32;
  btnG.fillStyle(correct ? 0x0e3a1c : 0x3a0e12, 0.95); btnG.fillRoundedRect(bx - 110, by - 22, 220, 44, 8);
  btnG.lineStyle(2, correct ? 0x40d070 : 0xd04050, 1); btnG.strokeRoundedRect(bx - 110, by - 22, 220, 44, 8);
  const btnTxt = scene.add.text(bx, by, 'Continuar →', {
    fontFamily:'Cinzel', fontSize:'16px', color: correct ? '#50e080' : '#e06060', fontStyle:'700'
  }).setOrigin(0.5).setDepth(58).setAlpha(0);
  scene.time.delayedCall(900, () => {
    scene.tweens.add({ targets: [btnG, btnTxt], alpha: 1, duration: 300 });
    const hit = scene.add.rectangle(bx, by, 220, 44, 0, 0).setDepth(60).setScrollFactor(0).setInteractive({ useHandCursor:true });
    hit.on('pointerup', () => { hit.destroy(); pzComplete(scene, _gain, puzId, correct); });
  });
}

function pzComplete(scene, hp, puzId, correct) {
  const arcade = scene._data && scene._data.modoArcade;
  const dif    = (scene._data && scene._data.dificultad) || 'normal';
  const _m     = scene._ptsMult || 1;
  if (!arcade) {
    if (hp > 0) STATE.hp = Math.min((STATE.hp||0) + hp, STATE.hpMax || 150);
    if (!STATE.enigmasCompletados) STATE.enigmasCompletados = {};
    STATE.enigmasCompletados[puzId] = (STATE.enigmasCompletados[puzId]||0) + 1;
    STATE.nodeActual = (STATE.nodeActual||0) + 1;
    const _oroMult = ({facil:1, normal:1.2, heroe:1.5, legendario:2})[dif] || 1.2;
    STATE.oro = (STATE.oro||0) + Math.round((correct ? 8 : 3) * _oroMult);
    // La XP completa es para quien acierta; quien falla se lleva un tercio (igual que el HP).
    // Antes fallar daba los mismos 40 XP: se llegaba a casi toda la XP de la partida adivinando.
    const _puzXp = correct ? xpForPuzzle(dif) : Math.round(xpForPuzzle(dif) / 3);
    STATE.xp      = (STATE.xp      || 0) + _puzXp;
    STATE.xpTotal = (STATE.xpTotal || 0) + _puzXp;
    if (typeof saveGameLegend === 'function') saveGameLegend();
    else if (typeof saveGame === 'function') saveGame();
    if (typeof ptsAdd === 'function') ptsAdd(Math.round(ptsCalc(correct, dif, 'aventura') * _m), 'aventura');
  } else if (arcade === 'libre') {
    const puzKey = scene._data && scene._data.puzKey;
    if (puzKey && typeof arcadeSaveLibre === 'function') arcadeSaveLibre(puzKey, dif, correct === true);
    if (typeof ptsAdd === 'function') ptsAdd(Math.round(ptsCalc(correct, dif, 'libre') * _m), 'libre');
  } else {
    if (typeof ptsAdd === 'function') ptsAdd(Math.round(ptsCalc(correct, dif, 'arcade') * _m), 'arcade');
  }
  if (scene._pz && scene._pz.cams) scene._pz.cams.ill.fadeOut(350, 0, 0, 0);
  scene.cameras.main.fadeOut(350, 0, 0, 0);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    if (arcade === 'libre') {
      scene.scene.start('LibreScene', { correcto: correct === true, puzName: scene._data && scene._data.puzName });
    } else if (arcade) {
      scene.scene.start('ArcadeScene', { mode:'playing', correcto: correct === true });
    } else {
      scene.scene.start('MapScene');
    }
  });
}
