/* ══════════════════════════════════════════════════════════════
   class-fx.js — Efectos de impacto cosméticos según STATE.clase.
   Guerrero: tajos de espada en ángulo aleatorio.
   Hechicero: partículas arcanas (radial o espiral, aleatorio).
   Arquero: flecha desde un lado aleatorio, ángulo real de trayectoria,
            impacta en un punto aleatorio del monstruo.
   Alquimista: explosión de poción de color aleatorio + goteo.
   Todos: flash de pantalla + "kick" del sprite del monstruo.
   Enganchado desde BattleScene.fase2() en el momento del impacto.

   IMPORTANTE: el monstruo se dibuja con scene.add.dom() (SVG real).
   Un DOMElement de Phaser es un <div> con position:absolute, y en CSS
   los elementos posicionados pintan SIEMPRE encima de los elementos
   estáticos del mismo contexto de apilamiento — incluido el <canvas>
   del juego, sin importar la "depth" de Phaser (esa depth solo ordena
   objetos dentro del canvas). Por eso estos efectos también se
   construyen con scene.add.dom(): así comparten la misma capa que el
   monstruo y sí se ven por encima de su cuerpo.
══════════════════════════════════════════════════════════════ */

function _rand(a, b) { return a + Math.random() * (b - a); }

function _fxFlash(scene, colorHex, peakAlpha, dur) {
  const w = scene.scale.width, h = scene.scale.height;
  const rect = scene.add.rectangle(w / 2, h / 2, w, h, colorHex, peakAlpha).setDepth(999);
  scene.tweens.add({ targets: rect, alpha: 0, duration: dur, onComplete: () => rect.destroy() });
}

function _fxMonsterKick(scene) {
  if (!scene.monsterDom) return;
  // Guard: varios tajos/impactos disparan kick en cadena (80ms de diferencia).
  // Interrumpir un tween Back.easeOut a mitad de camino con otro nuevo acumula
  // overshoot en cada golpe → el monstruo termina gigante y nunca se asienta.
  if (scene._fxKicking) return;
  scene._fxKicking = true;
  const dom = scene.monsterDom;
  // scene._monScale es el factor ya horneado en el tamaño del SVG (width/height
  // del propio markup) — NO la escala de este DOMElement, que arranca en 1.
  dom.setScale(0.92);
  scene.tweens.add({
    targets: dom, scaleX: 1, scaleY: 1,
    duration: 260, ease: 'Back.easeOut',
    onComplete: () => {
      dom.setScale(1); // reset exacto: elimina cualquier deriva del overshoot
      scene._fxKicking = false;
    }
  });
}

/* Ráfaga de puntos DOM que explotan desde (cx,cy) y se desvanecen.
   colorsRgb: array de strings "r,g,b". */
function _domBurst(scene, cx, cy, colorsRgb, count, spread, life) {
  const deltas = [];
  let spans = '';
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const dist = _rand(spread * 0.4, spread);
    deltas.push([Math.cos(a) * dist, Math.sin(a) * dist]);
    const col = colorsRgb[Math.floor(Math.random() * colorsRgb.length)];
    const size = _rand(4, 9);
    spans += `<span style="position:absolute;left:${-size/2}px;top:${-size/2}px;width:${size}px;height:${size}px;` +
      `border-radius:50%;background:rgb(${col});box-shadow:0 0 6px 1px rgba(${col},0.8);opacity:1;` +
      `transition:transform ${life}ms ease-out, opacity ${life}ms ease-out;transform:translate(0,0)"></span>`;
  }
  const dom = scene.add.dom(cx, cy).createFromHTML(
    `<div style="position:relative;width:0;height:0">${spans}</div>`
  ).setOrigin(0.5, 0.5).setDepth(6);
  requestAnimationFrame(() => {
    const kids = dom.node.firstElementChild.children;
    for (let i = 0; i < kids.length; i++) {
      const [dx, dy] = deltas[i];
      kids[i].style.transform = `translate(${dx}px, ${dy}px)`;
      kids[i].style.opacity = '0';
    }
  });
  scene.time.delayedCall(life + 60, () => { try { dom.destroy(); } catch (e) {} });
}

/* ── Guerrero: tajos random ─────────────────────────────────────── */
function _fxGuerrero(scene, cx, cy) {
  const n = Math.random() < 0.5 ? 2 : 3;
  for (let i = 0; i < n; i++) {
    scene.time.delayedCall(i * 80, () => {
      const ang = _rand(-70, 70);
      const len = _rand(120, 170);
      const HOLD = 260, FADE = 340;
      const html = `<div style="width:${len}px;height:9px;border-radius:4px;` +
        `background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,1) 15%,rgba(255,80,80,.9) 50%,rgba(255,255,255,1) 85%,rgba(255,255,255,0) 100%);` +
        `box-shadow:0 0 16px 4px rgba(255,255,255,.85);opacity:1;` +
        `transition:opacity ${FADE}ms ease-in, transform ${HOLD + FADE}ms ease-out;` +
        `transform:rotate(${ang}deg) scaleX(1)"></div>`;
      const dom = scene.add.dom(cx, cy).createFromHTML(html).setOrigin(0.5, 0.5).setDepth(6);
      requestAnimationFrame(() => {
        const el = dom.node.firstElementChild;
        el.style.transform = `rotate(${ang}deg) scaleX(1.3)`;
      });
      // Mantener visible un rato (HOLD) antes de recién empezar a desvanecer.
      scene.time.delayedCall(HOLD, () => {
        const el = dom.node && dom.node.firstElementChild;
        if (el) el.style.opacity = '0';
      });
      scene.time.delayedCall(HOLD + FADE + 60, () => { try { dom.destroy(); } catch (e) {} });
      _fxFlash(scene, 0xffffff, 0.35, 180);
      _fxMonsterKick(scene);
      if (typeof snd_hitClase === 'function') snd_hitClase('guerrero');
    });
  }
}

/* ── Hechicero: partículas arcanas ──────────────────────────────── */
function _fxHechicero(scene, cx, cy) {
  _domBurst(scene, cx, cy, ['170,120,255', '110,180,255'], 26, 95, 520);
  _fxFlash(scene, 0x8a5cf5, 0.4, 300);
  _fxMonsterKick(scene);
  if (typeof snd_hitClase === 'function') snd_hitClase('hechicero');
}

/* ── Arquero: flecha con ángulo real + impacto en punto random ──── */
function _fxArquero(scene, cx, cy) {
  const w = scene.scale.width;
  const fromLeft = Math.random() < 0.5;
  const targetX = cx + _rand(-25, 25);
  const targetY = cy + _rand(-55, 60);
  const startX = fromLeft ? -40 : w + 40;
  const startY = targetY + _rand(-70, 70);
  const ang = Math.atan2(targetY - startY, targetX - startX) * 180 / Math.PI;
  const shaftLen = 64; // largo total (doble del original)

  const html = `<div style="position:relative;width:${shaftLen}px;height:14px;transform:rotate(${ang}deg)">` +
    `<div style="position:absolute;left:0;top:5px;width:${shaftLen - 12}px;height:3.5px;background:#caa46a"></div>` +
    `<div style="position:absolute;left:${shaftLen - 14}px;top:0;width:0;height:0;` +
    `border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:14px solid #f0e8d0"></div></div>`;

  const dom = scene.add.dom(startX, startY).createFromHTML(html).setOrigin(0.5, 0.5).setDepth(6);

  scene.tweens.add({
    targets: dom, x: targetX, y: targetY,
    duration: 190, ease: 'Cubic.easeIn',
    onComplete: () => {
      try { dom.destroy(); } catch (e) {}
      _domBurst(scene, targetX, targetY, ['220,200,160'], 16, 45, 300);
      _fxFlash(scene, 0xffffff, 0.3, 200);
      _fxMonsterKick(scene);
      if (typeof snd_hitClase === 'function') snd_hitClase('arquero');
    }
  });
}

/* ── Alquimista: splash de poción de color random + goteo ───────── */
function _fxAlquimista(scene, cx, cy) {
  const colors = ['220,60,60', '40,200,90', '60,120,230', '240,180,30'];
  const hexColors = [0xdc3c3c, 0x28c85a, 0x3c78e6, 0xf0b41e];
  const idx = Math.floor(Math.random() * colors.length);

  _domBurst(scene, cx, cy, [colors[idx]], 30, 105, 480);
  _domBurst(scene, cx, cy - 10, [colors[idx]], 8, 30, 700);

  _fxFlash(scene, hexColors[idx], 0.35, 320);
  _fxMonsterKick(scene);
  if (typeof snd_hitClase === 'function') snd_hitClase('alquimista');
}

/* ── API pública ─────────────────────────────────────────────────
   playClassFx(scene, clase, cx, cy) — llamar en el momento del impacto. */
function playClassFx(scene, clase, cx, cy) {
  switch (clase) {
    case 'hechicero': _fxHechicero(scene, cx, cy); break;
    case 'arquero': _fxArquero(scene, cx, cy); break;
    case 'alquimista': _fxAlquimista(scene, cx, cy); break;
    case 'guerrero':
    default: _fxGuerrero(scene, cx, cy); break;
  }
}
window.playClassFx = playClassFx;
