/* ══════════════════════════════════════
   PuzzleRuleta — Ruleta del Reino
   Concepto: P(sector) = arco_sector / arco_total
══════════════════════════════════════ */

class PuzzleRuleta extends Phaser.Scene {
  constructor() { super('PuzzleRuleta'); }

  init(d) {
    this._data = d;
    this._prob = this._gen(d.dificultad || 'normal');
  }

  _gen(dif) {
    // Sectores como fracciones del total
    const wheels = {
      facil: [
        {sects:[{n:'Rojo',parts:3,col:0xcc3030},{n:'Azul',parts:3,col:0x2860c0}], total:6},
        {sects:[{n:'Oro',parts:2,col:0xD4AF37},{n:'Plata',parts:4,col:0x9090a0}], total:6},
      ],
      normal: [
        {sects:[{n:'Rojo',parts:3,col:0xcc3030},{n:'Azul',parts:5,col:0x2860c0},{n:'Verde',parts:4,col:0x30a040}], total:12},
        {sects:[{n:'Oro',parts:4,col:0xD4AF37},{n:'Rojo',parts:3,col:0xcc3030},{n:'Negro',parts:5,col:0x404060}], total:12},
      ],
      heroe: [
        {sects:[{n:'Rojo',parts:3,col:0xcc3030},{n:'Azul',parts:5,col:0x2860c0},{n:'Verde',parts:4,col:0x30a040},{n:'Oro',parts:4,col:0xD4AF37}], total:16},
        {sects:[{n:'Oro',parts:5,col:0xD4AF37},{n:'Plata',parts:7,col:0x9090a0},{n:'Rojo',parts:6,col:0xcc3030}], total:18},
      ],
      legendario: [
        {sects:[{n:'Rojo',parts:5,col:0xcc3030},{n:'Azul',parts:7,col:0x2860c0},{n:'Verde',parts:4,col:0x30a040},{n:'Oro',parts:2,col:0xD4AF37}], total:18},
      ],
    };

    const pool  = wheels[dif] || wheels.normal;
    const wheel = pool[Math.floor(Math.random()*pool.length)];
    const ask   = wheel.sects[Math.floor(Math.random()*wheel.sects.length)];
    const corr  = _frac(ask.parts, wheel.total);

    const wrong = wheel.sects
      .filter(s=>s.n!==ask.n)
      .map(s=>_frac(s.parts, wheel.total));
    const w3 = _frac(wheel.total-ask.parts, wheel.total);
    // Con las ruedas faciles hay pocos sectores, asi que los distractores
    // "naturales" (los otros sectores y el complemento) no llegan a tres y hay
    // que completar. El relleno de antes empujaba siempre la MISMA fraccion,
    // y con la rueda de dos sectores iguales salian tres opciones identicas:
    // "1/2, 2/3, 2/3, 2/3". Ahora se recorren las fracciones posibles de la
    // rueda hasta juntar tres distintas.
    const distractores = [...new Set([...wrong, w3])].filter(l => l !== corr).slice(0, 3);
    for (let partes = 1; partes < wheel.total && distractores.length < 3; partes++) {
      const etiqueta = _frac(partes, wheel.total);
      if (etiqueta === corr || distractores.includes(etiqueta)) continue;
      distractores.push(etiqueta);
    }
    const all = _shuffle([{label:corr,ok:true},
      ...distractores.map(l=>({label:l,ok:false}))]);

    const explain = `El sector ${ask.n} ocupa ${ask.parts} de ${wheel.total} partes iguales.\nP(${ask.n}) = ${ask.parts}/${wheel.total} = ${corr}`;
    return { wheel, ask, corr, opts:all, explain };
  }

  create() {
    const {w,h} = pzBg(this, 'mercader');
    pzHeader(this, 'Ruleta del Reino', 'mercader', w);
    pzInfoButton(this, 'mercader', 'Ruleta del Reino', [
      '◆ El tema: probabilidad geométrica',
      'Cuando los casos no se cuentan de a uno sino por tamaño (área del',
      'sector), la probabilidad = porción que ocupa ÷ total de la ruleta.',
      '',
      '◆ El minijuego',
      'La ruleta está dividida en colores, y cada color en porciones iguales.',
      'El Mercader te pide la probabilidad de caer en cierto color.',
      '',
      '◆ Qué se espera de vos',
      'Mirá cuántas porciones tiene ese color sobre el total de porciones',
      'y elegí la fracción correcta.',
      '',
      '◆ Consejos',
      '• Probabilidad = porciones del color ÷ porciones totales de la ruleta.',
      '• Las líneas internas (como una pizza) marcan las porciones: contalas.',
      '• Un color más grande no siempre gana: lo que importa es la proporción.',
    ]);
    const p = this._prob;

    /* ── Pregunta ── */
    pzPopIn(this, this.add.text(w/2, 94,
      `La ruleta tiene ${p.wheel.total} sectores del mismo tamaño.`, {
      fontFamily:'Poppins', fontSize:'13px', color:'#8a9ab0', align:'center'
    }).setOrigin(0.5), 80);
    pzPopIn(this, this.add.text(w/2, 116,
      `¿Cuál es la probabilidad de caer en el sector ${p.ask.n}?`, {
      fontFamily:'Cinzel', fontSize:'14px', color:'#D4AF37', fontStyle:'600', align:'center'
    }).setOrigin(0.5), 160);

    /* ── Ruleta visual ── */
    this._drawWheel(w/2, 258, 112, p.wheel.sects, p.wheel.total, p.ask);

    /* ── Respuestas ── */
    pzButtons(this, p.opts, 480, (a)=>{
      pzResult(this, a.ok, p.explain, PUZZLE_CATALOG[3].recompensa.hp, 3);
    });
  }

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
      /* Sector fill */
      g.fillStyle(s.col, s.n === ask.n ? 1 : 0.9);
      g.slice(0, 0, r, angle, angle + sweep, false);
      g.fillPath();
      /* Sector border */
      g.lineStyle(s.n === ask.n ? 3 : 1.5, s.n === ask.n ? 0xffffff : 0x1a1208,
        s.n === ask.n ? 0.5 : 0.55);
      g.beginPath && g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, r, angle, angle + sweep, false);
      g.closePath && g.closePath();
      g.strokePath && g.strokePath();
      /* Sub-division lines: parts-1 lines inside sector */
      if (s.parts > 1) {
        const subSweep = sweep / s.parts;
        g.lineStyle(1, 0x000000, 0.35);
        for (let k = 1; k < s.parts; k++) {
          const a = angle + k * subSweep;
          g.beginPath && g.beginPath();
          g.moveTo(0, 0);
          g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          g.strokePath && g.strokePath();
        }
      }
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
      const effectiveDeg = ((-wheelAngleDeg) % 360 + 360) % 360;
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
          popupTxt.setText(`Cayó en: ${landed.n}`);
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
}
