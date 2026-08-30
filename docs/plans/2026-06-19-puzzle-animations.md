# Puzzle Animations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir animaciones profesionales e interactividad a los 7 minijuegos de Héroes Probabilísticos para que se vean pulidos y atractivos visualmente.

**Architecture:** Cada puzzle es una `Phaser.Scene` independiente en `js/scenes/Puzzle*.js`. Las utilidades compartidas viven en `js/scenes/PuzzleBase.js` (globals disponibles en todas las escenas). No hay módulos ES ni build step — edición directa de archivos `.js`. Canvas fijo 1024×700, Phaser 3.60.0.

**Tech Stack:** Phaser 3.60.0, Vanilla JS (sin módulos), tweens Phaser, `this.add.graphics()`, `this.add.container()`, `pzBurst` / `pzFloatY` / `pzPopIn` de PuzzleBase.js.

**Constraint crítico:** NUNCA usar PowerShell `Set-Content` ni `Out-File` en archivos con emojis/non-ASCII. Usar SIEMPRE el tool `Edit` o `Write` del agente (escriben UTF-8 correctamente). Aplica a TODOS los archivos `.js`, `.html`, `.css`.

---

## Resumen de archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `js/scenes/PuzzleBase.js` | + `pzCountUp()`, `pzActionBtn()`, `pzScanBeam()` |
| `js/scenes/PuzzleMoneda.js` | + botón Lanzar, flip secuencial mejorado, contador resultado |
| `js/scenes/PuzzleDados.js` | + pip cycling en tap, shake al aterrizar, thud partículas |
| `js/scenes/PuzzleRuleta.js` | + pointer bounce, popup "cayó en X", sparkle sector objetivo |
| `js/scenes/PuzzleUrna.js` | + botón Sacar bola, arco de trayectoria, label color |
| `js/scenes/PuzzleApuesta.js` | + EVometro animado bajo pergamino |
| `js/scenes/PuzzleMentiras.js` | + scanner beam, reveal escalonado de insignias, spotlight sospechoso |
| `js/scenes/PuzzleTesoro.js` | + brújula animada, marcas X sobre cofres objetivo, hover rise |

---

## Task 1: PuzzleBase.js — Utilidades compartidas

**File:** `js/scenes/PuzzleBase.js`

Agregar 3 funciones nuevas al final del archivo (después de `pzSparkles`, antes de `pzBg`).

- [ ] **Step 1: Agregar `pzCountUp` — contador animado de texto**

Abre `js/scenes/PuzzleBase.js`. Después de la función `pzSparkles` (línea ~108), insertar ANTES de `/* ════ FONDO ════ */`:

```js
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
  var BW = 176, BH = 34;
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
    fontFamily: 'Cinzel', fontSize: '12px', color: '#cdd8ee', fontStyle: '600'
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
```

- [ ] **Step 2: Verificar**

Abrir `index.html` en el browser. Navegar a cualquier puzzle. La consola no debe mostrar errores. Las funciones `pzCountUp`, `pzBounceScale`, `pzActionBtn`, `pzScanBeam` deben existir en `window`.

---

## Task 2: PuzzleMoneda — Lanzar todas + contador

**File:** `js/scenes/PuzzleMoneda.js`

Mejorar `create()` y reemplazar `_drawCoins()`. Agregar `_launchAllCoins()` nuevo.

- [ ] **Step 1: Reemplazar el método `create()`**

Reemplazar el bloque `create() { ... }` completo con:

```js
  create() {
    const {w,h} = pzBg(this, 'mercader');
    pzHeader(this, 'Cara o Ceca', 'mercader', w);
    const p = this._prob;

    pzPopIn(this, this.add.text(w/2, 96,
      `Lanzas una moneda justa ${p.n} veces.`, {
      fontFamily:'Poppins', fontSize:'13px', color:'#8a9ab0', align:'center'
    }).setOrigin(0.5), 80);
    pzPopIn(this, this.add.text(w/2, 120,
      `¿Cuál es la probabilidad de obtener exactamente ${p.k} cara${p.k!==1?'s':''} (C)?`, {
      fontFamily:'Cinzel', fontSize:'13px', color:'#D4AF37', fontStyle:'600',
      align:'center', wordWrap:{width:w*0.85}
    }).setOrigin(0.5), 160);

    /* ── Botón lanzar ── */
    pzActionBtn(this, w/2, 168, '⟳  ¡Lanzar las monedas!', 0xD4AF37, () => {
      this._launchAllCoins(p.n, p.k);
    });

    /* ── Monedas visuales ── */
    this._resultTxt = this._drawCoins(w/2, 268, p.n, p.k);

    /* ── Respuestas ── */
    pzButtons(this, p.opts, 448, (a)=>{
      pzResult(this, a.ok, p.explain, PUZZLE_CATALOG[1].recompensa.hp, 1);
    });
  }
```

- [ ] **Step 2: Reemplazar el método `_drawCoins()`**

Reemplazar `_drawCoins(cx, cy, n, k) { ... }` completo con:

```js
  _drawCoins(cx, cy, n, k) {
    const total = n;
    const spacing = Math.min(72, 580 / (total + 1));
    const startX  = cx - (total - 1) * spacing / 2;
    this._coinData   = [];
    this._launching  = false;

    const resultTxt = this.add.text(cx, cy + 52, '', {
      fontFamily:'Cinzel', fontSize:'14px', color:'#D4AF37', fontStyle:'700', align:'center'
    }).setOrigin(0.5).setAlpha(0).setDepth(4);

    for (let i = 0; i < total; i++) {
      const isHeads = i < k;
      const bx      = startX + i * spacing;
      const coin    = this.add.container(bx, cy).setDepth(3);
      const g       = this.add.graphics();
      const letter  = this.add.text(0, 1, isHeads ? 'C' : 'X', {
        fontFamily:'Cinzel', fontSize:'20px',
        color: isHeads ? '#6a4010' : '#2a3040', fontStyle:'800'
      }).setOrigin(0.5);

      const drawFace = (heads) => {
        g.clear();
        g.fillStyle(0x000000, 0.30);
        g.fillEllipse(3, 5, 54, 54);
        g.fillStyle(heads ? 0xD4AF37 : 0xA0A8B0, 1);
        g.fillCircle(0, 0, 27);
        g.fillStyle(heads ? 0xe8c860 : 0xc0c8d0, 1);
        g.fillCircle(0, 0, 22);
        /* rim interior */
        g.lineStyle(1, heads ? 0xC0A040 : 0x909098, 0.45);
        g.strokeCircle(0, 0, 19);
        /* brillo */
        g.fillStyle(heads ? 0xfff4b0 : 0xdce8f0, 0.55);
        g.fillEllipse(-7, -8, 18, 12);
        /* borde */
        g.lineStyle(2.5, heads ? 0x9a7810 : 0x606870, 0.85);
        g.strokeCircle(0, 0, 27);
        letter.setText(heads ? 'C' : 'X');
        letter.setColor(heads ? '#5a3608' : '#2a3040');
      };
      drawFace(isHeads);
      coin.add([g, letter]);
      this._coinData.push({ coin, drawFace, finalHeads: isHeads, bx, by: cy });

      /* Entrada: caída + spin */
      coin.setAlpha(0).y = cy - 110;
      this.tweens.add({ targets: coin, alpha: 1, y: cy, duration: 480,
        delay: 420 + i * 110, ease: 'Bounce.easeOut' });
      this.time.delayedCall(420 + i * 110, () => {
        let t = 0;
        this.time.addEvent({ delay: 55, repeat: 6, callback: () => {
          t++;
          coin.scaleX = Math.abs(Math.sin(t * 0.9));
          drawFace(t % 2 === 0 ? isHeads : !isHeads);
          if (t >= 6) { coin.scaleX = 1; drawFace(isHeads); }
        }});
      });

      /* Hover glow */
      coin.setSize(56, 56).setInteractive({ useHandCursor: true });
      coin.on('pointerover', () => {
        this.tweens.add({ targets: coin, scaleX: 1.12, scaleY: 1.12, duration: 120, ease: 'Back.easeOut' });
      });
      coin.on('pointerout', () => {
        this.tweens.add({ targets: coin, scaleX: 1, scaleY: 1, duration: 120 });
      });
      /* Tap individual */
      coin.on('pointerup', () => {
        if (coin.getData('spinning') || this._launching) return;
        coin.setData('spinning', true);
        snd_item && snd_item();
        let t2 = 0;
        this.time.addEvent({ delay: 50, repeat: 8, callback: () => {
          t2++;
          coin.scaleX = Math.abs(Math.cos(t2 * 0.7));
          drawFace(t2 % 2 === 0 ? isHeads : !isHeads);
          if (t2 >= 8) { coin.scaleX = 1; drawFace(isHeads); coin.setData('spinning', false); }
        }});
      });
    }

    /* Leyenda */
    pzPopIn(this, this.add.text(cx, cy + 74, `C(${n},${k}) = ${_binomial(n,k)} combinaciones con ${k} cara${k!==1?'s':''}`, {
      fontFamily:'Poppins', fontSize:'11px', color:'#5a7080', align:'center'
    }).setOrigin(0.5), 1200);

    return resultTxt;
  }
```

- [ ] **Step 3: Agregar método `_launchAllCoins()` al final de la clase, antes del cierre `}`**

```js
  _launchAllCoins(n, k) {
    if (this._launching) return;
    this._launching = true;
    snd_diceRoll && snd_diceRoll();
    this.cameras.main.shake(130, 0.005);

    this._coinData.forEach(({ coin, drawFace, finalHeads, bx, by }, i) => {
      this.time.delayedCall(i * 75, () => {
        let t = 0;
        this.time.addEvent({ delay: 42, repeat: 11, callback: () => {
          t++;
          coin.scaleX = Math.abs(Math.sin(t * 1.1));
          drawFace(t % 2 === 0 ? finalHeads : !finalHeads);
          if (t >= 11) {
            coin.scaleX = 1;
            drawFace(finalHeads);
            this.tweens.add({ targets: coin, scaleX: 1.18, scaleY: 1.18, duration: 90, yoyo: true });
            if (finalHeads) {
              pzBurst(this, bx, by, [0xD4AF37, 0xf0e080, 0xffffff], 14, 8, 4.5);
            }
          }
        }});
      });
    });

    const finishMs = (n - 1) * 75 + 42 * 12 + 240;
    this.time.delayedCall(finishMs, () => {
      this._resultTxt.setAlpha(0);
      pzCountUp(this, this._resultTxt, k, 680, '', ` cara${k!==1?'s':''}`);
      this.tweens.add({ targets: this._resultTxt, alpha: 1, duration: 300 });
      this.time.delayedCall(720, () => pzBounceScale(this, this._resultTxt, 1.3, 240));
      this._launching = false;
    });
  }
```

- [ ] **Step 4: Verificar**

Abrir puzzle "Cara o Ceca" (modo Libre o campaña). Verificar:
- Botón "⟳ ¡Lanzar las monedas!" aparece con animación a los ~900ms
- Al clickearlo, todas las monedas giran secuencialmente con efecto flip
- Las monedas doradas (C) explotan con partículas doradas al aterrizar
- El contador "X caras" aparece y sube animado
- Tocar una moneda individual sigue funcionando

---

## Task 3: PuzzleDados — Pip cycling en tap + shake + burst

**File:** `js/scenes/PuzzleDados.js`

Mejorar `_drawDie()`: reemplazar el `pointerup` shake por un pip cycling con cámara shake.

- [ ] **Step 1: Reemplazar el método `_drawDie()` completo**

Reemplazar `_drawDie(cx, cy, modFace, extra, total) { ... }` con:

```js
  _drawDie(cx, cy, modFace, extra, total) {
    const SIZE  = 58;
    const FACES = [1,2,3,4,5,6];
    const PIPS  = {
      1:[[0,0]], 2:[[-1,-1],[1,1]], 3:[[-1,-1],[0,0],[1,1]],
      4:[[-1,-1],[1,-1],[-1,1],[1,1]],
      5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],
      6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]],
    };
    const cols  = FACES.length;
    const startX = cx - (cols / 2 - 0.5) * 74;

    FACES.forEach((f, i) => {
      const dx    = startX + i * 74;
      const isMod = f === modFace;
      const die   = this.add.container(dx, cy);
      const g     = this.add.graphics();
      const glowG = this.add.graphics();

      const draw = (glow, showFace) => {
        const face = showFace || f;
        g.clear(); glowG.clear();
        if (isMod) {
          glowG.fillStyle(0x70c8e0, 0.32 * glow);
          glowG.fillRoundedRect(-SIZE/2 - 6, -SIZE/2 - 6, SIZE + 12, SIZE + 12, 11);
        }
        g.fillStyle(0x000000, 0.38);
        g.fillRoundedRect(-SIZE/2 + 2, -SIZE/2 + 3, SIZE, SIZE, 9);
        g.fillGradientStyle(
          isMod ? 0x1e3450 : 0x121a28, isMod ? 0x1e3450 : 0x121a28,
          isMod ? 0x102036 : 0x0a0e16, isMod ? 0x102036 : 0x0a0e16, 1);
        g.fillRoundedRect(-SIZE/2, -SIZE/2, SIZE, SIZE, 9);
        /* brillo superior */
        g.fillStyle(0xffffff, 0.07);
        g.fillRoundedRect(-SIZE/2 + 3, -SIZE/2 + 3, SIZE - 6, SIZE * 0.32, 6);
        g.lineStyle(isMod ? 2.5 : 1.5, isMod ? 0x70c8e0 : 0x304060, isMod ? 0.95 : 0.55);
        g.strokeRoundedRect(-SIZE/2, -SIZE/2, SIZE, SIZE, 9);
        const pipCol = isMod ? 0x90d8f0 : 0x8090a8;
        g.fillStyle(pipCol, isMod ? 1 : 0.65);
        (PIPS[face] || []).forEach(([px, py]) => g.fillCircle(px * 12, py * 12, 5));
      };
      glowG.setDepth(-1);
      die.add([glowG, g]);
      draw(0);

      /* Etiqueta peso */
      const wlabel = this.add.text(dx, cy + SIZE/2 + 16, `peso ${isMod ? extra : 1}/${total}`, {
        fontFamily:'Poppins', fontSize:'9.5px',
        color: isMod ? '#70c8e0' : '#46566a', fontStyle: isMod ? '700' : '400'
      }).setOrigin(0.5);
      pzPopIn(this, wlabel, 700 + i * 70, 10);

      /* Entrada: caen rodando */
      die.setAlpha(0); die.y = cy - 130; die.angle = -200;
      this.tweens.add({ targets: die, alpha: 1, y: cy, angle: 0,
        duration: 600, delay: 300 + i * 90, ease: 'Bounce.easeOut',
        onComplete: () => {
          if (isMod) return; /* thud sutil en los dados normales */
          this.cameras.main.shake(60, 0.003 - i * 0.0002);
        }
      });

      /* Pulso glow cara trucada */
      if (isMod) {
        const gs = { v: 0.3 };
        this.tweens.add({ targets: gs, v: 1, duration: 900, yoyo: true, repeat: -1,
          delay: 1100, ease: 'Sine.easeInOut', onUpdate: () => draw(gs.v) });
      }

      /* Tap → pip cycling */
      die.setSize(SIZE, SIZE).setInteractive({ useHandCursor: true });
      die.on('pointerover', () => {
        if (!die.getData('rolling'))
          this.tweens.add({ targets: die, scaleX: 1.1, scaleY: 1.1, duration: 110 });
      });
      die.on('pointerout', () => {
        this.tweens.add({ targets: die, scaleX: 1, scaleY: 1, duration: 110 });
      });
      die.on('pointerup', () => {
        if (die.getData('rolling')) return;
        die.setData('rolling', true);
        snd_diceRoll && snd_diceRoll();
        this.cameras.main.shake(90, 0.007);
        this.tweens.add({ targets: die, scaleX: 1.14, scaleY: 1.14, duration: 80, yoyo: true });
        let t = 0;
        const gs2 = { v: isMod ? 0.8 : 0 };
        this.time.addEvent({ delay: 48, repeat: 13, callback: () => {
          t++;
          const showFace = t < 13 ? (Math.floor(Math.random() * 6) + 1) : f;
          draw(isMod ? gs2.v : 0, showFace);
          if (t >= 13) {
            draw(isMod ? gs2.v : 0, f);
            /* burst al aterrizar */
            pzBurst(this, dx, cy,
              isMod ? [0x70c8e0, 0xaaeeff, 0xffffff] : [0x4060a0, 0x6080c0],
              isMod ? 18 : 8, 6, isMod ? 5 : 3);
            die.setData('rolling', false);
          }
        }});
      });
    });

    /* Flecha ×extra (sin cambios del original) */
    const arrowX = startX + (modFace - 1) * 74;
    const arrowG = this.add.graphics().setAlpha(0);
    arrowG.fillStyle(0x70c8e0, 0.95);
    arrowG.fillTriangle(arrowX - 9, cy - SIZE/2 - 26, arrowX + 9, cy - SIZE/2 - 26, arrowX, cy - SIZE/2 - 12);
    const xLbl = this.add.text(arrowX, cy - SIZE/2 - 42, `×${extra}`, {
      fontFamily:'Cinzel', fontSize:'14px', color:'#70c8e0', fontStyle:'700',
      stroke:'#0a1420', strokeThickness:3
    }).setOrigin(0.5).setAlpha(0);
    this.time.delayedCall(1100, () => {
      this.tweens.add({ targets: [arrowG, xLbl], alpha: 1, duration: 420 });
      pzFloatY(this, arrowG, 5, 860);
      pzFloatY(this, xLbl, 5, 860);
    });

    /* Hint "toca los dados" */
    pzPopIn(this, this.add.text(cx, cy + SIZE/2 + 36, 'Toca los dados para lanzarlos', {
      fontFamily:'Poppins', fontSize:'10px', color:'#5a6a78'
    }).setOrigin(0.5), 1300);
  }
```

- [ ] **Step 2: Verificar**

Abrir puzzle "El Ladrón de Dados". Verificar:
- Al tocar cualquier dado: los pips ciclan rápidamente (1-2-3-4-5...) y se detienen en la cara correcta
- Hay shake de cámara breve al tocar
- El dado trucado explota con partículas azul cian al aterrizar
- Los dados normales explotan con partículas azules más pequeñas

---

## Task 4: PuzzleRuleta — Pointer bounce + popup sector + sparkle objetivo

**File:** `js/scenes/PuzzleRuleta.js`

Mejorar `_drawWheel()`: pointer animado al desacelerar, popup "cayó en X", sparkles sobre sector objetivo.

- [ ] **Step 1: Reemplazar el método `_drawWheel()` completo**

Reemplazar `_drawWheel(cx, cy, r, sects, total, ask) { ... }` con:

```js
  _drawWheel(cx, cy, r, sects, total, ask) {
    const TAU = Math.PI * 2;

    /* ── Marco exterior ── */
    const frame = this.add.graphics();
    frame.fillStyle(0x000000, 0.4);
    frame.fillCircle(cx + 4, cy + 6, r + 13);
    frame.fillStyle(0x3a2810, 1);
    frame.fillCircle(cx, cy, r + 12);
    frame.lineStyle(4, 0xD4AF37, 0.85);
    frame.strokeCircle(cx, cy, r + 12);
    frame.lineStyle(1.5, 0x8a6828, 0.55);
    frame.strokeCircle(cx, cy, r + 7);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      frame.fillStyle(0xD4AF37, 0.75);
      frame.fillCircle(cx + Math.cos(a) * (r + 9), cy + Math.sin(a) * (r + 9), 2.2);
    }

    /* ── Disco giratorio ── */
    const wheel = this.add.container(cx, cy);
    const g     = this.add.graphics();
    let angle   = -Math.PI / 2;
    sects.forEach(s => {
      const sweep = (s.parts / total) * TAU;
      /* Sector con borde más brillante en el sector pedido */
      g.fillStyle(s.col, s.n === ask.n ? 1 : 0.9);
      g.slice(0, 0, r, angle, angle + sweep, false);
      g.fillPath();
      g.lineStyle(s.n === ask.n ? 3 : 1.5, s.n === ask.n ? 0xffffff : 0x1a1208,
        s.n === ask.n ? 0.5 : 0.55);
      g.beginPath && g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, r, angle, angle + sweep, false);
      g.closePath && g.closePath();
      g.strokePath && g.strokePath();
      angle += sweep;
    });
    wheel.add(g);
    /* Etiquetas */
    angle = -Math.PI / 2;
    sects.forEach(s => {
      const sweep  = (s.parts / total) * TAU;
      const midA   = angle + sweep / 2;
      const lx     = Math.cos(midA) * (r * 0.62);
      const ly     = Math.sin(midA) * (r * 0.62);
      const isAsk  = s.n === ask.n;
      const lbl    = this.add.text(lx, ly, `${s.n}\n${s.parts}`, {
        fontFamily:'Poppins', fontSize: isAsk ? '11px' : '10px',
        color: isAsk ? '#ffffff' : '#e8e0d8', fontStyle: isAsk ? '800' : '700',
        align:'center', stroke:'#000000', strokeThickness: isAsk ? 4 : 3
      }).setOrigin(0.5);
      wheel.add(lbl);
      angle += sweep;
    });

    /* ── Centro (hub) ── */
    const hub = this.add.graphics();
    hub.fillStyle(0x2a1808, 1);
    hub.fillCircle(cx, cy, 18);
    hub.lineStyle(2.5, 0xD4AF37, 0.9);
    hub.strokeCircle(cx, cy, 18);
    hub.fillStyle(0xD4AF37, 0.85);
    hub.fillCircle(cx, cy, 6);

    /* ── Pointer (ahora como container para animar) ── */
    const ptrCont = this.add.container(cx, cy - r - 4).setDepth(6);
    const ptrG    = this.add.graphics();
    ptrG.fillStyle(0x1a1208, 1);
    ptrG.fillTriangle(-13, -18, 13, -18, 0, 2);
    ptrG.fillStyle(0xD4AF37, 1);
    ptrG.fillTriangle(-10, -17, 10, -17, 0, 0);
    ptrCont.add(ptrG);

    /* ── Popup "cayó en X" ── */
    const popupTxt = this.add.text(cx, cy + r + 30, '', {
      fontFamily:'Cinzel', fontSize:'12px', color:'#D4AF37', fontStyle:'700'
    }).setOrigin(0.5).setAlpha(0).setDepth(6);

    /* ── Función detectar sector ── */
    const detectSector = (wheelAngleDeg) => {
      const effectiveDeg = ((-90 - wheelAngleDeg) % 360 + 360) % 360;
      let cum = 0;
      for (const s of sects) {
        const sweep = (s.parts / total) * 360;
        if (effectiveDeg >= cum && effectiveDeg < cum + sweep) return s;
        cum += sweep;
      }
      return sects[sects.length - 1];
    };

    /* ── Función de spin ── */
    const doSpin = (extraDeg, dur) => {
      snd_diceRoll && snd_diceRoll();
      /* Pointer vibra durante el giro */
      const vibeT = this.tweens.add({
        targets: ptrCont, y: cy - r - 4 + 4, duration: 80,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
      this.tweens.add({
        targets: wheel, angle: wheel.angle + extraDeg, duration: dur,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          vibeT.stop();
          ptrCont.y = cy - r - 4;
          /* Bounce del pointer al detenerse */
          this.tweens.add({ targets: ptrCont, y: cy - r - 4 - 8, duration: 90,
            yoyo: true, ease: 'Bounce.easeOut', repeat: 1 });
          /* Detectar sector y mostrar popup */
          const landed = detectSector(wheel.angle);
          const isAsk  = landed.n === ask.n;
          popupTxt.setText(`▼ ${landed.n}`);
          popupTxt.setColor(isAsk ? '#50e890' : '#D4AF37');
          this.tweens.add({ targets: popupTxt, alpha: 1, duration: 280 });
          this.time.delayedCall(1400, () => {
            this.tweens.add({ targets: popupTxt, alpha: 0, duration: 280 });
          });
          /* Burst si cayó en el sector preguntado */
          if (isAsk) {
            pzBurst(this, cx, cy - r - 4, [0x50e890, 0xD4AF37, 0xffffff], 20, 7, 6);
          }
          this._spinning = false;
        }
      });
    };

    /* Giro de entrada */
    wheel.angle = 0;
    this.time.delayedCall(300, () => doSpin(360 * 3 + Math.random() * 360, 2600));

    /* Tap para re-girar */
    const hit = this.add.circle(cx, cy, r + 12, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerup', () => {
      if (this._spinning) return;
      this._spinning = true;
      doSpin(360 * 2 + Math.random() * 360, 2100);
    });

    /* Hint */
    const hint = this.add.text(cx, cy + r + 52, '↻ Toca para girar', {
      fontFamily:'Poppins', fontSize:'10px', color:'#8a6a40', fontStyle:'600'
    }).setOrigin(0.5).setAlpha(0);
    this.time.delayedCall(2900, () => this.tweens.add({ targets: hint, alpha: 1, duration: 400 }));

    /* Brillo idle marco */
    this.tweens.add({ targets: frame, alpha: { from: 1, to: 0.82 }, duration: 1800,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    /* Sparkles ascendentes sobre sector objetivo (posición aproximada) */
    this.time.delayedCall(3200, () => {
      /* Calcular posición del label del sector ask en el disco */
      let cumA = -Math.PI / 2;
      for (const s of sects) {
        const sw = (s.parts / total) * TAU;
        if (s.n === ask.n) {
          const midA = cumA + sw / 2;
          const spX  = cx + Math.cos(midA) * (r * 0.62);
          const spY  = cy + Math.sin(midA) * (r * 0.62);
          this.time.addEvent({ delay: 800, loop: true, callback: () => {
            const sp = this.add.text(
              spX + (Math.random() - 0.5) * 20,
              spY + (Math.random() - 0.5) * 20,
              '✦', { fontSize: `${7 + Math.random() * 5}px`, color:'#ffffff' }
            ).setOrigin(0.5).setDepth(5).setAlpha(0.8);
            this.tweens.add({ targets: sp, y: sp.y - 28, alpha: 0, duration: 1100,
              ease: 'Quad.easeOut', onComplete: () => sp.destroy() });
          }});
          break;
        }
        cumA += sw;
      }
    });
  }
```

- [ ] **Step 2: Verificar**

Abrir puzzle "Ruleta del Reino". Verificar:
- Ruleta gira en entrada con pointer vibrando
- Al detenerse: pointer hace bounce y popup "▼ [nombre sector]" aparece
- Si cayó en el sector preguntado: explosión de partículas verdes/doradas
- Tap re-gira con el mismo comportamiento
- Sparkles blancos ascienden sobre el sector objetivo

---

## Task 5: PuzzleUrna — Botón "Sacar bola" + arco de trayectoria

**File:** `js/scenes/PuzzleUrna.js`

Agregar botón que extrae una bola con animación de arco. Máx 3 extracciones.

- [ ] **Step 1: Reemplazar el método `create()` completo**

```js
  create() {
    const {w,h} = pzBg(this, 'mercader');
    pzHeader(this, 'La Urna Misteriosa', 'mercader', w);

    const p = this._prob;
    pzPopIn(this, this.add.text(w/2, 96,
      `La urna contiene ${p.total} bolas de distintos colores.`, {
      fontFamily:'Poppins', fontSize:'13px', color:'#8a9ab0', align:'center'
    }).setOrigin(0.5), 80);
    pzPopIn(this, this.add.text(w/2, 120,
      `¿Cuál es la probabilidad de sacar una bola ${p.colorName}?`, {
      fontFamily:'Cinzel', fontSize:'14px', color:'#D4AF37', fontStyle:'600', align:'center'
    }).setOrigin(0.5), 160);

    /* ── Botón sacar bola ── */
    this._drawCount  = 0;
    this._maxDraws   = 3;
    this._extractedX = w/2 + 120;
    this._extractedY = 310;
    const BALL_COLORS = {r:0xcc3030, b:0x2860c0, g:0x30a040, y:0xc0a020};
    const colors = Object.entries(p.cfg).filter(([,v]) => v > 0).map(([k,v]) => ({ key:k, col:BALL_COLORS[k], n:v }));

    const drawBtn = pzActionBtn(this, w/2 - 140, 166, '🎲 Sacar bola', 0xD4AF37, () => {
      if (this._drawCount >= this._maxDraws) return;
      this._drawCount++;

      /* Selección aleatoria ponderada */
      const pool = [];
      colors.forEach(c => { for (let i = 0; i < c.n; i++) pool.push(c); });
      const picked = pool[Math.floor(Math.random() * pool.length)];

      /* Bola que vuela */
      const bStartX = w/2 + (Math.random() - 0.5) * 40;
      const bStartY = 252;
      const bEndX   = this._extractedX + (this._drawCount - 1) * 34;
      const bEndY   = this._extractedY;
      const midY    = bStartY - 90;

      const ball = this.add.graphics().setDepth(7);
      const drawBall = (col) => {
        ball.clear();
        ball.fillStyle(0x000000, 0.3);
        ball.fillCircle(2, 3, 14);
        ball.fillStyle(col, 1);
        ball.fillCircle(0, 0, 13);
        ball.fillStyle(0xffffff, 0.45);
        ball.fillCircle(-4, -4, 4.5);
        ball.lineStyle(1.5, 0xffffff, 0.2);
        ball.strokeCircle(0, 0, 13);
      };
      drawBall(picked.col);
      ball.setPosition(bStartX, bStartY);
      snd_item && snd_item();

      /* Arco en 2 segmentos usando timeline manual */
      this.tweens.add({
        targets: ball, x: bEndX, y: midY, duration: 340, ease: 'Quad.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: ball, x: bEndX, y: bEndY, duration: 260, ease: 'Bounce.easeOut',
            onComplete: () => {
              pzBurst(this, bEndX, bEndY, [picked.col, 0xffffff], 14, 8, 4);
              this.tweens.add({ targets: ball, scaleX: 1.2, scaleY: 1.2, duration: 80, yoyo: true });
              /* Label color de la bola */
              const NAMES = {r:'Roja',b:'Azul',g:'Verde',y:'Amarilla'};
              const isTarget = picked.key === p.pick.key;
              const lbl = this.add.text(bEndX, bEndY + 18, NAMES[picked.key], {
                fontFamily:'Poppins', fontSize:'9px',
                color: isTarget ? '#40e870' : '#9ab0c0', fontStyle: isTarget ? '700' : '400'
              }).setOrigin(0.5).setAlpha(0).setDepth(7);
              this.tweens.add({ targets: lbl, alpha: 1, y: bEndY + 20, duration: 280, delay: 100 });
            }
          });
        }
      });
    });

    /* ── Visual de la urna ── */
    this._drawUrn(w/2, 285, p.cfg, p.pick.key);

    /* ── Respuestas ── */
    pzButtons(this, p.opts, 458, (a)=>{
      pzResult(this, a.ok, p.explain, PUZZLE_CATALOG[0].recompensa.hp, 0);
    });
  }
```

- [ ] **Step 2: Verificar**

Abrir "La Urna Misteriosa". Verificar:
- Botón "🎲 Sacar bola" aparece a la izquierda
- Al clickear: una bola vuela en arco fuera de la urna con trayectoria parabólica
- Aterriza con bounce + burst de partículas del color de la bola
- Label con nombre del color aparece debajo
- Máx 3 bolas extraídas (después el botón no hace nada)

---

## Task 6: PuzzleApuesta — EVometro animado

**File:** `js/scenes/PuzzleApuesta.js`

Agregar bajo el pergamino un EVometro (barra horizontal con marcador deslizante) que revela el valor esperado visualmente.

- [ ] **Step 1: Reemplazar el método `create()` completo**

```js
  create() {
    const {w,h} = pzBg(this, 'mercader');
    pzHeader(this, 'Apuesta del Mercader', 'mercader', w);
    const p = this._prob;

    /* ── Pergamino ── */
    this._drawScroll(w/2, 270, p, w);

    /* ── EVometro (aparece 1.4s después del pergamino) ── */
    this.time.delayedCall(1400, () => this._drawEVMeter(w/2, 374, p));

    /* ── Pregunta ── */
    pzPopIn(this, this.add.text(w/2, 408,
      '¿Esta apuesta es favorable, desfavorable o neutra?', {
      fontFamily:'Cinzel', fontSize:'13px', color:'#D4AF37',
      fontStyle:'600', align:'center', wordWrap:{width:w*0.8}
    }).setOrigin(0.5), 1800);

    /* ── Respuestas ── */
    pzButtons(this, p.opts, 446, (a)=>{
      pzResult(this, a.ok, p.explain, PUZZLE_CATALOG[2].recompensa.hp, 2);
    });
  }
```

- [ ] **Step 2: Agregar método `_drawEVMeter()` al final de la clase, antes del cierre `}`**

```js
  _drawEVMeter(cx, cy, p) {
    const barW = 320, barH = 10;
    const cont  = this.add.container(cx, cy).setAlpha(0).setDepth(3);

    /* Barra fondo */
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a14, 0.85);
    bg.fillRoundedRect(-barW/2, -barH/2, barW, barH, 4);
    bg.lineStyle(1, 0x303050, 0.6);
    bg.strokeRoundedRect(-barW/2, -barH/2, barW, barH, 4);
    /* Mitad roja (negativo) */
    bg.fillStyle(0x8b2020, 0.6);
    bg.fillRoundedRect(-barW/2 + 1, -barH/2 + 1, barW/2 - 2, barH - 2, 3);
    /* Mitad verde (positivo) */
    bg.fillStyle(0x207840, 0.6);
    bg.fillRoundedRect(1, -barH/2 + 1, barW/2 - 2, barH - 2, 3);
    /* Línea central */
    bg.lineStyle(2, 0x505060, 0.9);
    bg.lineBetween(0, -barH/2 - 5, 0, barH/2 + 5);
    cont.add(bg);

    /* Etiquetas EV−/EV+ */
    const negL = this.add.text(-barW/2 - 6, 0, '−', {
      fontFamily:'Cinzel', fontSize:'11px', color:'#c05050', fontStyle:'700'
    }).setOrigin(1, 0.5);
    const posL = this.add.text(barW/2 + 6, 0, '+', {
      fontFamily:'Cinzel', fontSize:'11px', color:'#40a860', fontStyle:'700'
    }).setOrigin(0, 0.5);
    cont.add([negL, posL]);

    /* Marcador (diamante dorado) */
    const marker = this.add.graphics();
    marker.fillStyle(0xD4AF37, 1);
    marker.fillTriangle(0, -8, 7, 0, -7, 0);
    marker.fillTriangle(0, 8, 7, 0, -7, 0);
    marker.setPosition(0, 0); /* empieza en centro (EV=0) */
    cont.add(marker);

    /* Texto EV */
    const evTxt = this.add.text(0, 24, 'E(X) = ?', {
      fontFamily:'Cinzel', fontSize:'13px', color:'#9ab0c0', fontStyle:'600'
    }).setOrigin(0.5);
    cont.add(evTxt);

    /* Fade in del container */
    this.tweens.add({ targets: cont, alpha: 1, duration: 400 });

    /* Después de 700ms, deslizar marcador y revelar EV */
    this.time.delayedCall(700, () => {
      const maxGain   = p.gan;
      const clamped   = Math.max(-1, Math.min(1, p.ev / maxGain));
      const targetX   = clamped * (barW / 2 - 8);
      const finalCol  = p.ev > 0 ? '#40d870' : p.ev < 0 ? '#d05050' : '#D4AF37';
      const finalHex  = p.ev > 0 ? 0x40d870  : p.ev < 0 ? 0xd05050  : 0xD4AF37;

      this.tweens.add({
        targets: marker, x: targetX, duration: 1300, ease: 'Elastic.easeOut',
        onUpdate: () => {
          const cur = +((marker.x / (barW/2 - 8)) * maxGain).toFixed(1);
          evTxt.setText(`E(X) = ${cur >= 0 ? (cur === 0 ? '' : '+') : ''}${cur}`);
          evTxt.setColor('#9ab0c0');
        },
        onComplete: () => {
          evTxt.setText(`E(X) = ${p.evStr}`);
          evTxt.setColor(finalCol);
          marker.clear();
          marker.fillStyle(finalHex, 1);
          marker.fillTriangle(0, -9, 8, 0, -8, 0);
          marker.fillTriangle(0, 9, 8, 0, -8, 0);
          pzBounceScale(this, evTxt, 1.3, 240);
          if (p.ev !== 0)
            pzBurst(this, cx + targetX, cy, [finalHex, 0xffffff], 14, 6, 4);
        }
      });
    });
  }
```

- [ ] **Step 3: Verificar**

Abrir "Apuesta del Mercader". Verificar:
- Pergamino se despliega normalmente
- A los ~1.4s aparece la barra EV con fade in
- El marcador dorado desliza (con efecto elástico) hacia la posición correcta según el EV
- El texto "E(X) = ?" se actualiza en tiempo real durante el slide
- Al final: marcador y texto cambian de color (verde=favorable, rojo=desfavorable, dorado=neutro)
- Si EV ≠ 0: burst de partículas del color correspondiente

---

## Task 7: PuzzleMentiras — Scanner beam + reveal escalonado + spotlight

**File:** `js/scenes/PuzzleMentiras.js`

Reemplazar `_drawCrowd()` con versión que incluye scanner beam y reveal escalonado de insignias.

- [ ] **Step 1: Reemplazar el método `_drawCrowd()` completo**

```js
  _drawCrowd(cx, cy, p) {
    const visTotal = Math.min(p.total, 10);
    const visCulp  = Math.min(p.culp, 5);
    const visFP    = Math.min(p.fp, 3);
    const visInoc  = Math.max(0, visTotal - visCulp - visFP);

    const ICON_W = 44, GAP = 9;
    const rowLen = Math.min(visTotal, 8);
    const startX = cx - (rowLen * (ICON_W + GAP) - GAP) / 2;

    let icons = [];
    for (let i = 0; i < visCulp; i++)  icons.push('culp');
    for (let i = 0; i < visFP;   i++)  icons.push('fp');
    for (let i = 0; i < visInoc; i++)  icons.push('inoc');
    icons = _shuffle(icons).slice(0, rowLen);

    /* Dibujar personas (sin insignias inicialmente) */
    const personData = [];
    icons.forEach((type, i) => {
      const x = startX + i * (ICON_W + GAP) + ICON_W / 2;
      const y = cy;

      const col0 = type === 'culp' ? 0x6b1212 : type === 'fp' ? 0x1a4070 : 0x1a3a1a;
      const col1 = type === 'culp' ? 0xc04040 : type === 'fp' ? 0x3878c0 : 0x3a6a3a;

      const person = this.add.container(x, y);
      const g = this.add.graphics();
      /* Sombra */
      g.fillStyle(0x000000, 0.28); g.fillEllipse(0, 44, 26, 8);
      /* Cuerpo */
      g.fillStyle(col0, 0.95); g.fillRoundedRect(-14, 10, 28, 32, 5);
      /* Cabeza */
      g.fillStyle(col1, 0.95); g.fillCircle(0, 0, 13);
      /* Brillo */
      g.fillStyle(0xffffff, 0.16); g.fillCircle(-4, -4, 4.5);
      person.add(g);

      /* Badge (oculto hasta que el scanner pase) */
      const badge  = this.add.graphics();
      const hasBadge = type !== 'inoc';
      if (hasBadge) {
        const bcol = type === 'culp' ? 0xe04040 : 0xe09020;
        badge.fillStyle(0x000000, 0.4); badge.fillCircle(14, -10, 9);
        badge.fillStyle(bcol, 1);       badge.fillCircle(13, -11, 8);
        badge.fillStyle(0xffffff, 0.9);
        if (type === 'culp') {
          badge.fillTriangle(10, -8, 16, -8, 13, -15); /* exclamación */
          badge.fillRect(12, -7, 2, 2);
        } else {
          badge.fillRect(10, -12, 6, 2);   /* signo ? */
          badge.fillRect(12, -9, 2, 4);
          badge.fillRect(12, -4, 2, 2);
        }
        badge.setAlpha(0);
      }
      person.add(badge);
      personData.push({ person, type, hasBadge, badge, x, y });

      /* Entrada pop */
      person.setScale(0).setAlpha(0);
      this.tweens.add({ targets: person, scaleX: 1, scaleY: 1, alpha: 1,
        duration: 360, delay: 380 + i * 75, ease: 'Back.easeOut' });

      /* Bob idle */
      pzFloatY(this, person, 4, 2000 + (i % 4) * 160, 750 + i * 75);
    });

    /* ── Scanner beam (lanza 1.5s después del pop-in) ── */
    const beamDelay = 380 + rowLen * 75 + 500;
    this.time.delayedCall(beamDelay, () => {
      const beamX1 = startX - 30;
      const beamX2 = startX + rowLen * (ICON_W + GAP) + 30;

      /* Hint "escaneando..." */
      const scanHint = this.add.text(cx, cy - 56, 'Ojo Oracular escaneando…', {
        fontFamily:'Cinzel', fontSize:'11px', color:'#70c8e0', fontStyle:'600'
      }).setOrigin(0.5).setAlpha(0).setDepth(7);
      this.tweens.add({ targets: scanHint, alpha: 1, duration: 280 });

      pzScanBeam(this, beamX1, cy, beamX2, 110, 2000,
        /* onStep */ (prog, bx) => {
          /* Reveal badge de personas que el beam ya pasó */
          personData.forEach(pd => {
            if (pd.hasBadge && pd.x < bx && pd.badge.alpha === 0) {
              pd.badge.setAlpha(0);
              this.tweens.add({ targets: pd.badge, alpha: 1, duration: 220 });
              /* Flash de color al revelar */
              const flashCol = pd.type === 'culp' ? 0xff4444 : 0xff9922;
              const flash    = this.add.rectangle(pd.x, pd.y, ICON_W + 8, 60, flashCol, 0.5)
                .setDepth(7);
              this.tweens.add({ targets: flash, alpha: 0, duration: 350,
                onComplete: () => flash.destroy() });
            }
          });
        },
        /* onComplete */ () => {
          this.tweens.add({ targets: scanHint, alpha: 0, duration: 300 });
          /* Pulso en badges */
          personData.forEach(pd => {
            if (pd.hasBadge) {
              this.tweens.add({ targets: pd.badge, alpha: { from: 1, to: 0.4 },
                duration: 650, yoyo: true, repeat: -1, delay: 200, ease: 'Sine.easeInOut' });
            }
          });
          /* Spotlight sobre uno de los señalados */
          const senalados = personData.filter(pd => pd.hasBadge);
          if (senalados.length > 0) {
            const target = senalados[Math.floor(Math.random() * senalados.length)];
            const spot   = this.add.graphics().setDepth(6);
            const spState = { r: 0.3 };
            this.tweens.add({ targets: spState, r: 1, duration: 1200, yoyo: true, repeat: -1,
              ease: 'Sine.easeInOut',
              onUpdate: () => {
                spot.clear();
                spot.lineStyle(2.5, 0x70c8e0, 0.55 * spState.r);
                spot.strokeCircle(target.x, target.y + 8, 30 * spState.r + 10);
                spot.fillStyle(0x70c8e0, 0.06 * spState.r);
                spot.fillCircle(target.x, target.y + 8, 30 * spState.r + 10);
              }
            });
            const spotLbl = this.add.text(target.x, target.y - 44, '¿Culpable?', {
              fontFamily:'Cinzel', fontSize:'9.5px', color:'#70c8e0', fontStyle:'600'
            }).setOrigin(0.5).setAlpha(0).setDepth(7);
            this.tweens.add({ targets: spotLbl, alpha: 1, duration: 300, delay: 400 });
            pzFloatY(this, spotLbl, 4, 1200, 500);
          }
        }
      );
    });

    /* Leyenda */
    const ly = cy + 66;
    [[0xc04040,'Culpable'],[0xe09020,'Falso positivo'],[0x3a6a3a,'Inocente']]
      .forEach(([c, label], i) => {
        const lx   = cx - 200 + i * 144;
        const item = this.add.container(lx, ly);
        const lg   = this.add.graphics();
        lg.fillStyle(c, 0.95);
        lg.fillRoundedRect(-6, -7, 13, 13, 3);
        const lt = this.add.text(12, 0, label, {
          fontFamily:'Poppins', fontSize:'10px', color:'#8a9aaa'
        }).setOrigin(0, 0.5);
        item.add([lg, lt]);
        pzPopIn(this, item, 1100 + i * 100, 12);
      });
  }
```

- [ ] **Step 2: Verificar**

Abrir "Contador de Mentiras". Verificar:
- Personitas hacen pop-in escalonado
- ~1.5s después: texto "Ojo Oracular escaneando…" + rayo de luz azul barre la multitud
- Al pasar por cada culpable/falso positivo: flash de color rojo/naranja + badge aparece
- Al terminar el scan: badges pulsan, spotlight aparece sobre un sospechoso aleatorio con "¿Culpable?"
- Leyenda con colores aparece debajo

---

## Task 8: PuzzleTesoro — Brújula + marcas X + hover rise

**File:** `js/scenes/PuzzleTesoro.js`

Agregar brújula decorativa animada y mejorar las tarjetas de zonas (X sobre cofres objetivo, hover rise).

- [ ] **Step 1: Reemplazar el método `create()` completo**

```js
  create() {
    const {w,h} = pzBg(this, 'oraculo');
    pzHeader(this, 'Mapa del Tesoro', 'oraculo', w);
    const p = this._prob;

    pzPopIn(this, this.add.text(w/2, 94, [
      `El tesoro está escondido en uno de los ${p.total} cofres del mapa.`,
      `Cada cofre es igualmente probable de contenerlo.`,
    ], {fontFamily:'Poppins', fontSize:'12px', color:'#8a9ab0',
      align:'center', lineSpacing:4}).setOrigin(0.5), 80);

    pzPopIn(this, this.add.text(w/2, 136,
      `¿Cuál es la P(el tesoro esté en la zona ${p.askZ.n})?`, {
      fontFamily:'Cinzel', fontSize:'14px', color:'#70c8e0',
      fontStyle:'600', align:'center'
    }).setOrigin(0.5), 160);

    /* ── Brújula decorativa (esquina superior derecha) ── */
    this._drawCompass(w - 70, 110, p.zones, p.ask);

    /* ── Mapa visual ── */
    this._drawMap(w/2, 298, p);

    /* ── Respuestas ── */
    pzButtons(this, p.opts, 452, (a)=>{
      pzResult(this, a.ok, p.explain, PUZZLE_CATALOG[6].recompensa.hp, 6);
    });
  }
```

- [ ] **Step 2: Agregar método `_drawCompass()` al final de la clase, antes del cierre `}`**

```js
  _drawCompass(cx, cy, zones, askIdx) {
    const r   = 32;
    const g   = this.add.graphics().setDepth(3).setAlpha(0);
    /* Círculo fondo */
    g.fillStyle(0x0a0e1c, 0.85);
    g.fillCircle(cx, cy, r + 4);
    g.lineStyle(2, 0x70c8e0, 0.6);
    g.strokeCircle(cx, cy, r + 4);
    /* Marcas N/S/E/O */
    [['N',-1,0],['S',1,0],['E',0,1],['O',0,-1]].forEach(([lbl, dy, dx]) => {
      g.fillStyle(0x304060, 0.7);
      g.fillCircle(cx + dx * r * 0.78, cy + dy * r * 0.78, 4);
    });
    const northTxt = this.add.text(cx, cy - r * 0.68, 'N', {
      fontFamily:'Cinzel', fontSize:'9px', color:'#70c8e0', fontStyle:'700'
    }).setOrigin(0.5).setAlpha(0).setDepth(3);

    /* Agujas */
    const needle = this.add.graphics().setDepth(4).setAlpha(0);
    const drawNeedle = (angleDeg) => {
      needle.clear();
      const rad = angleDeg * Math.PI / 180;
      const nx  = cx + Math.sin(rad)  * r * 0.7;
      const ny  = cy - Math.cos(rad)  * r * 0.7;
      const sx  = cx - Math.sin(rad)  * r * 0.45;
      const sy  = cy + Math.cos(rad)  * r * 0.45;
      /* Aguja norte (cian) */
      needle.fillStyle(0x70c8e0, 0.95);
      needle.fillTriangle(cx, cy - 4, nx, ny, cx + 4, cy);
      needle.fillTriangle(cx, cy - 4, nx, ny, cx - 4, cy);
      /* Aguja sur (gris) */
      needle.fillStyle(0x506070, 0.7);
      needle.fillTriangle(cx, cy + 4, sx, sy, cx + 3, cy);
      needle.fillTriangle(cx, cy + 4, sx, sy, cx - 3, cy);
      /* Centro */
      needle.fillStyle(0xD4AF37, 1);
      needle.fillCircle(cx, cy, 4);
    };

    /* Fade in */
    this.time.delayedCall(400, () => {
      this.tweens.add({ targets: [g, northTxt, needle], alpha: 1, duration: 400 });
      drawNeedle(0);
    });

    /* Giro de entrada → apunta hacia zona preguntada */
    const targetAngle = (askIdx / zones.length) * 360;
    this.time.delayedCall(900, () => {
      const spinState = { a: 0 };
      this.tweens.add({
        targets: spinState, a: 360 * 2 + targetAngle, duration: 2000,
        ease: 'Cubic.easeOut',
        onUpdate: () => drawNeedle(spinState.a),
        onComplete: () => {
          /* Pulsación sutil de la aguja */
          const pulseState = { a: targetAngle };
          this.tweens.add({ targets: pulseState, a: targetAngle + 6, duration: 800,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            onUpdate: () => drawNeedle(pulseState.a) });
        }
      });
    });
  }
```

- [ ] **Step 3: Reemplazar el método `_drawMap()` completo**

```js
  _drawMap(cx, cy, p) {
    const zones  = p.zones;
    const n      = zones.length;
    const CARD_W = n <= 3 ? 148 : 120;
    const CARD_H = 110;
    const GAP    = 16;
    const startX = cx - (n * (CARD_W + GAP) - GAP) / 2;

    /* Fondo mapa */
    const padX = 18, padY = 12;
    const mapBg = this.add.graphics();
    mapBg.fillStyle(0x0e1428, 0.7);
    mapBg.fillRoundedRect(startX - padX, cy - CARD_H/2 - padY,
      n*(CARD_W+GAP) - GAP + padX*2, CARD_H + padY*2, 12);
    mapBg.lineStyle(1.5, 0x2a4060, 0.5);
    mapBg.strokeRoundedRect(startX - padX, cy - CARD_H/2 - padY,
      n*(CARD_W+GAP) - GAP + padX*2, CARD_H + padY*2, 12);
    /* Líneas de cuadrícula decorativas */
    mapBg.lineStyle(0.5, 0x2a4060, 0.2);
    for (let gx = startX - padX + 20; gx < startX - padX + n*(CARD_W+GAP) + padX; gx += 22)
      mapBg.lineBetween(gx, cy - CARD_H/2 - padY, gx, cy + CARD_H/2 + padY);
    pzPopIn(this, mapBg, 240, 0);

    zones.forEach((z, i) => {
      const bx    = startX + i * (CARD_W + GAP) + CARD_W / 2;
      const isAsk = i === p.ask;
      const card  = this.add.container(bx, cy);
      const glowG = this.add.graphics();
      const g     = this.add.graphics();
      const L     = -CARD_W/2, T = -CARD_H/2;

      g.fillStyle(z.col, isAsk ? 1 : 0.65);
      g.fillRoundedRect(L, T, CARD_W, CARD_H, 8);
      g.fillStyle(0xffffff, 0.06);
      g.fillRoundedRect(L + 2, T + 2, CARD_W - 4, CARD_H * 0.3, 6);
      g.lineStyle(isAsk ? 2.5 : 1, isAsk ? 0x70c8e0 : 0x304060, isAsk ? 1 : 0.5);
      g.strokeRoundedRect(L, T, CARD_W, CARD_H, 8);
      card.add([glowG, g]);

      const name = this.add.text(0, T + 16, z.n, {
        fontFamily:'Cinzel', fontSize: n <= 3 ? '11px' : '10px',
        color: isAsk ? '#aae4f4' : '#8a9ab0', fontStyle:'600'
      }).setOrigin(0.5);
      card.add(name);

      /* Cofres con animación de aparición */
      const maxShow  = Math.min(z.c, 8);
      const cols2    = Math.min(maxShow, 4);
      const rows2    = Math.ceil(maxShow / cols2);
      const icoW     = 15, icoGap = 5;
      const icoStartX = -(cols2 * (icoW + icoGap) - icoGap) / 2 + icoW / 2;
      const icoStartY = T + 36;
      let drawn = 0;
      const chests = [];

      for (let r = 0; r < rows2 && drawn < maxShow; r++) {
        for (let c = 0; c < cols2 && drawn < maxShow; c++) {
          const ix = icoStartX + c * (icoW + icoGap);
          const iy = icoStartY + r * (icoW + icoGap);
          const cg = this.add.graphics();
          cg.fillStyle(isAsk ? 0xD4AF37 : 0x506070, 1);
          cg.fillRoundedRect(ix - icoW/2, iy - icoW/2, icoW, icoW, 3);
          cg.lineStyle(1, isAsk ? 0xf0d060 : 0x304050, 0.8);
          cg.strokeRoundedRect(ix - icoW/2, iy - icoW/2, icoW, icoW, 3);
          cg.fillStyle(isAsk ? 0xfff4c0 : 0x8090a0, 0.9);
          cg.fillCircle(ix, iy, 2.2);
          card.add(cg);
          cg.setScale(0).setAlpha(0);
          chests.push({ cg, delay: i * 100 + drawn * 40 });
          drawn++;
        }
      }
      chests.forEach(ch => this.tweens.add({
        targets: ch.cg, scaleX: 1, scaleY: 1, alpha: 1,
        duration: 240, delay: 520 + ch.delay, ease: 'Back.easeOut'
      }));

      /* X animada sobre cofres del objetivo */
      if (isAsk) {
        const xg = this.add.graphics().setAlpha(0);
        const xLen = 10;
        /* Calcular centro aproximado de los cofres */
        const xCenterX = bx;
        const xCenterY = cy + T + 36 + ((rows2 - 1) * (icoW + icoGap) / 2);
        const xProg = { v: 0 };
        this.time.delayedCall(520 + maxShow * 40 + 400, () => {
          this.tweens.add({ targets: xg, alpha: 1, duration: 200 });
          this.tweens.add({ targets: xProg, v: 1, duration: 600, ease: 'Cubic.easeOut',
            onUpdate: () => {
              xg.clear();
              const hw = xLen * xProg.v;
              xg.lineStyle(2.5, 0xD4AF37, 0.85);
              xg.lineBetween(xCenterX - hw, xCenterY - hw, xCenterX + hw, xCenterY + hw);
              xg.lineBetween(xCenterX + hw, xCenterY - hw, xCenterX - hw, xCenterY + hw);
            }
          });
        });
        card.add(xg);
      }

      if (z.c > maxShow) {
        card.add(this.add.text(0, CARD_H/2 - 20, `+${z.c - maxShow} más`, {
          fontFamily:'Poppins', fontSize:'8px', color:'#607080'
        }).setOrigin(0.5));
      }

      const counter = this.add.text(0, CARD_H/2 - 10, `${z.c} cofres`, {
        fontFamily:'Poppins', fontSize:'10px',
        color: isAsk ? '#70c8e0' : '#607080', fontStyle:'600'
      }).setOrigin(0.5);
      card.add(counter);

      if (isAsk) {
        const qbg = this.add.graphics();
        qbg.fillStyle(0x70c8e0, 1); qbg.fillCircle(CARD_W/2 - 12, T + 12, 9);
        const q = this.add.text(CARD_W/2 - 12, T + 12, '?', {
          fontFamily:'Cinzel', fontSize:'12px', color:'#0a1420', fontStyle:'700'
        }).setOrigin(0.5);
        card.add([qbg, q]);
        this.tweens.add({ targets: q, scaleX: 1.22, scaleY: 1.22, duration: 750,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }

      /* Entrada */
      card.setAlpha(0); card.y = cy - 40; card.setScale(0.9);
      this.tweens.add({ targets: card, alpha: 1, y: cy, scaleX: 1, scaleY: 1,
        duration: 520, delay: 300 + i * 120, ease: 'Back.easeOut' });

      /* Hover: sube la tarjeta */
      card.setSize(CARD_W, CARD_H).setInteractive({ useHandCursor: false });
      card.on('pointerover', () => {
        this.tweens.add({ targets: card, y: cy - 8, duration: 160, ease: 'Quad.easeOut' });
        if (isAsk) pzBurst(this, bx, cy - CARD_H/2, [0xD4AF37, 0x70c8e0], 8, 5, 3);
      });
      card.on('pointerout', () => {
        this.tweens.add({ targets: card, y: cy, duration: 200, ease: 'Quad.easeIn' });
      });

      /* Zona objetivo: glow pulsante + chispas */
      if (isAsk) {
        const gs = { v: 0.2 };
        this.tweens.add({ targets: gs, v: 1, duration: 1000, yoyo: true, repeat: -1,
          delay: 1000, ease: 'Sine.easeInOut', onUpdate: () => {
            glowG.clear();
            glowG.fillStyle(0x70c8e0, 0.3 * gs.v);
            glowG.fillRoundedRect(L - 5, T - 5, CARD_W + 10, CARD_H + 10, 11);
          }});
        pzFloatY(this, card, 5, 2400, 1000);
        this.time.delayedCall(1200, () => {
          this.time.addEvent({ delay: 700, loop: true, callback: () => {
            const sp = this.add.text(
              bx + (Math.random() - 0.5) * CARD_W * 0.65,
              cy + CARD_H / 2,
              '✦', { fontSize: `${8 + Math.random() * 6}px`, color:'#D4AF37' }
            ).setOrigin(0.5).setDepth(4).setAlpha(0.9);
            this.tweens.add({ targets: sp, y: cy - CARD_H/2 - 8, alpha: 0,
              duration: 1500, ease: 'Quad.easeOut', onComplete: () => sp.destroy() });
          }});
        });
      }
    });
  }
```

- [ ] **Step 4: Verificar**

Abrir "Mapa del Tesoro". Verificar:
- Brújula aparece en esquina superior derecha, gira y apunta hacia la zona preguntada
- Tarjetas de zonas hacen pop-in con cofres apareciendo uno a uno (bounce)
- Sobre los cofres de la zona objetivo: X dorada se dibuja animada
- Pasar el mouse sobre una tarjeta la sube 8px (hover rise)
- Hover sobre zona objetivo: burst de partículas doradas
- Chispas doradas ascienden continuamente sobre la zona objetivo

---

## Self-Review

**Spec coverage:**
- ✅ Task 1: PuzzleBase — utilidades compartidas
- ✅ Task 2: PuzzleMoneda — botón lanzar + flip mejorado + contador
- ✅ Task 3: PuzzleDados — pip cycling + shake + burst
- ✅ Task 4: PuzzleRuleta — pointer bounce + popup sector + sparkle
- ✅ Task 5: PuzzleUrna — botón sacar + arco trayectoria + label
- ✅ Task 6: PuzzleApuesta — EVometro animado
- ✅ Task 7: PuzzleMentiras — scanner beam + reveal + spotlight
- ✅ Task 8: PuzzleTesoro — brújula + X marks + hover rise

**Placeholder scan:** Ninguno. Todo el código es completo y ejecutable.

**Type/API consistency:**
- `pzCountUp`, `pzBounceScale`, `pzActionBtn`, `pzScanBeam` — definidos en Task 1, usados en Tasks 2, 5, 6, 7
- `pzBurst`, `pzFloatY`, `pzPopIn` — existentes en PuzzleBase.js original, sin cambios
- `snd_item`, `snd_diceRoll` — globales existentes, llamados con guard `&& fn()`
- `PUZZLE_CATALOG[N].recompensa.hp` — sin cambios respecto al original
- `_frac`, `_binomial`, `_shuffle` — sin cambios

**Notas de implementación:**
- Task 2 agrega `_coinData`, `_launching`, `_resultTxt` como propiedades de instancia — sin conflicto con código existente
- Task 5 agrega `_drawCount`, `_maxDraws`, `_extractedX`, `_extractedY` — sin conflicto
- Task 7: `_drawCrowd` referencia `pzScanBeam` (Task 1) — implementar Task 1 antes que Task 7
- La constante `BALL_COLORS` en PuzzleUrna Task 5 es local al scope de `create()` — no necesita estar en `_drawUrna` 
- PuzzleTesoro `_drawCompass`: `askIdx` es el índice numérico `p.ask`, no el objeto zona
