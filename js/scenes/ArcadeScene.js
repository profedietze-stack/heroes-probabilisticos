/* ══════════════════════════════════════════════════════════════
   ArcadeScene.js — Modo Arcade: 7 rondas de minijuegos sin combate
   Flujo: selector dificultad → 7 rondas → pantalla resultado
══════════════════════════════════════════════════════════════ */

const ARCADE_PUZZLES = [
  { key:'PuzzleUrna',     name:'La Urna Misteriosa',      npc:'mercader', pid:0 },
  { key:'PuzzleMoneda',   name:'Cara o Ceca',npc:'mercader', pid:1 },
  { key:'PuzzleApuesta',  name:'Apuesta del Mercader',      npc:'mercader', pid:2 },
  { key:'PuzzleRuleta',   name:'Ruleta del Reino',   npc:'mercader', pid:3 },
  { key:'PuzzleDados',    name:'El Falsificador de Dados',   npc:'oraculo',  pid:4 },
  { key:'PuzzlePuertas',  name:'Las Puertas del Oráculo', npc:'oraculo',  pid:5 },
  { key:'PuzzleTesoro',   name:'Mapa del Tesoro',      npc:'oraculo',  pid:6 },
];

/* Estado arcade global (no persiste entre sesiones, separado de STATE historia) */
if (typeof ARCADE === 'undefined') {
  var ARCADE = { dificultad:'normal', ronda:0, aciertos:0, activo:false };
}

class ArcadeScene extends Phaser.Scene {
  constructor(){ super('ArcadeScene'); }

  init(data){
    /* data.mode: 'select' (mostrar selector) | 'result' (pantalla final) */
    this._mode = data && data.mode ? data.mode : 'select';
    /* Si volvemos de un minijuego, data.correcto indica resultado */
    if (data && data.correcto !== undefined) {
      if (data.correcto) ARCADE.aciertos++;
      ARCADE.ronda++;
    }
  }

  create(){
    Music.play('menu');
    this.cameras.main.fadeIn(350, 0, 0, 0);
    const w = this.scale.width, h = this.scale.height;
    // Teléfono apaisado (lienzo = pantalla real): dificultades 2×2, letras de 13-22 px y botones de 44 px o más.
    this._compacto = h < 500;

    /* Fondo */
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x080C18, 0x080C18, 0x040810, 0x040810, 1);
    bg.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      const s = this.add.circle(Math.random()*w, Math.random()*h,
        Math.random()*1.1+0.2, Math.random()>0.6 ? 0xD4AF37 : 0xB0B8C0,
        Math.random()*0.2+0.04);
      this.tweens.add({targets:s, alpha:{from:0.04, to:s.alpha},
        duration:1800+Math.random()*2500, yoyo:true, repeat:-1, delay:Math.random()*2000});
    }

    if (this._mode === 'select') {
      this._buildSelector(w, h);
    } else if (this._mode === 'playing') {
      this._launchNextRound(w, h);
    } else if (this._mode === 'result') {
      this._buildResult(w, h);
    }
  }

  /* ── SELECTOR DE DIFICULTAD ─────────────────────────────── */
  _buildSelector(w, h){
    ARCADE.ronda = 0;
    ARCADE.aciertos = 0;
    ARCADE.activo = true;

    const C = this._compacto;
    this.add.text(w/2, C ? 24 : 60, 'MODO ARCADE', {
      fontFamily:'Cinzel', fontSize: C ? '24px' : '34px', fontStyle:'700',
      color:'#D4AF37', stroke:'#050408', strokeThickness:3,
      shadow:{offsetX:0, offsetY:0, color:'#D4AF37', blur: C ? 12 : 20, fill:true}
    }).setOrigin(0.5);

    this.add.text(w/2, C ? 52 : 105, '7 rondas · sin combate · solo probabilidad', {
      fontFamily:'Poppins', fontSize: C ? '14px' : '13px', color: C ? '#8aa4c0' : '#4a6080', letterSpacing: C ? 1 : 2
    }).setOrigin(0.5);

    this.add.text(w/2, C ? 80 : h*0.28, 'Elegí tu dificultad:', {
      fontFamily:'Cinzel', fontSize: C ? '16px' : '20px', color:'#9ab0c8'
    }).setOrigin(0.5);

    const difs = [
      { key:'facil',      label:'⚡  Fácil',       desc:'Conceptos claros, fracciones simples',   color:0x207020, tcolor:'#40c060' },
      { key:'normal',     label:'⚔  Normal',       desc:'Desafío estándar, recomendado',           color:0x1a3a6a, tcolor:'#4080d0' },
      { key:'heroe',      label:'🔥  Héroe',        desc:'Valores difíciles, alta precisión',       color:0x6a2010, tcolor:'#c05030' },
      { key:'legendario', label:'☠  Legendario',   desc:'Solo para expertos en probabilidad',      color:0x3a0a3a, tcolor:'#9030a0' },
    ];

    const startY = C ? 132 : h * 0.37, gap = C ? 72 : 90;
    difs.forEach((d, i) => {
      const y = C ? startY + Math.floor(i/2) * gap : startY + i * gap;
      const cx = C ? w/2 + (i%2 === 0 ? -(Math.floor((w-48)/2)/2 + 8) : (Math.floor((w-48)/2)/2 + 8)) : w/2;
      const isSelected = ARCADE.dificultad === d.key;
      this._difBtn(cx, y, d, isSelected);
    });

    /* Botón Iniciar */
    this._bigBtn(C ? w/2 - 110 : w/2, C ? h - 36 : h - 90, '▶  Iniciar Arcade', '#D4AF37', 0x2A2010, 0xD4AF37, () => {
      ARCADE.ronda = 0;
      ARCADE.aciertos = 0;
      this._fadeGo('ArcadeScene', { mode:'playing' });
    }, C ? 280 : 200);

    /* Botón Volver (en el teléfono: 46 px de alto, al lado de "Iniciar") */
    const _abg = this.add.graphics();
    const ABW = C ? 190 : 168, ABH = C ? 46 : 32, ABX = C ? w/2 + 160 : w/2, ABY = C ? h - 36 - ABH/2 : h - 56;
    const _drawAB = (hov) => {
      _abg.clear();
      _abg.fillStyle(0x0a1828, hov ? 0.92 : 0.75);
      _abg.fillRoundedRect(ABX - ABW/2, ABY, ABW, ABH, 6);
      _abg.lineStyle(1.5, hov ? 0x6090c8 : 0x2a5070, hov ? 0.9 : 0.6);
      _abg.strokeRoundedRect(ABX - ABW/2, ABY, ABW, ABH, 6);
    };
    _drawAB(false);
    const _aback = this.add.text(ABX, ABY + ABH/2, '← Volver al Menú', {
      fontFamily:'Poppins', fontSize: C ? '14px' : '12px', color: C ? '#9cc4e0' : '#7aabcc', fontStyle:'600',
      padding: C ? {x:20, y:15} : {x:0, y:0}
    }).setOrigin(0.5).setInteractive({useHandCursor:true});
    _aback.on('pointerover', () => { _drawAB(true); _aback.setColor('#aaddf8'); });
    _aback.on('pointerout',  () => { _drawAB(false); _aback.setColor('#7aabcc'); });
    _aback.on('pointerup',   () => this._fadeGo('MenuScene'));
  }

  _difBtn(cx, cy, d, selected){
    const C = this._compacto;
    const bw = C ? Math.floor((this.scale.width - 48) / 2) : 460, bh = C ? 64 : 70;
    const bg = this.add.graphics();
    const drawBg = (hov) => {
      bg.clear();
      bg.fillStyle(d.color, hov ? 0.7 : selected ? 0.55 : 0.35);
      bg.fillRoundedRect(cx - bw/2, cy - bh/2, bw, bh, 8);
      bg.lineStyle(2, Phaser.Display.Color.IntegerToColor(d.color).lighten(30).color,
        hov || selected ? 0.9 : 0.4);
      bg.strokeRoundedRect(cx - bw/2, cy - bh/2, bw, bh, 8);
    };
    drawBg(false);
    this.add.text(cx - bw/2 + 22, cy - (C ? 12 : 10), d.label, {
      fontFamily:'Cinzel', fontSize: C ? '18px' : '17px', color: d.tcolor, fontStyle:'700'
    }).setOrigin(0, 0.5);
    this.add.text(cx - bw/2 + 22, cy + (C ? 14 : 14), d.desc, {
      fontFamily:'Poppins', fontSize: C ? '13px' : '11px', color: C ? '#9ab2c8' : '#6a8098',
      wordWrap: C ? { width: bw - 60 } : undefined
    }).setOrigin(0, 0.5);
    if (selected) {
      this.add.text(cx + bw/2 - 16, cy, '✓', {
        fontFamily:'Cinzel', fontSize:'18px', color: d.tcolor
      }).setOrigin(1, 0.5);
    }
    const hit = this.add.rectangle(cx, cy, bw, bh, 0, 0)
      .setInteractive({useHandCursor:true});
    hit.on('pointerover', () => { drawBg(true); snd_item&&snd_item(); });
    hit.on('pointerout',  () => drawBg(false));
    hit.on('pointerup',   () => {
      ARCADE.dificultad = d.key;
      snd_buff&&snd_buff();
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('ArcadeScene', { mode:'select' }));
    });
  }

  /* ── LANZAR RONDA ─────────────────────────────────────────── */
  _launchNextRound(w, h){
    if (ARCADE.ronda >= ARCADE_PUZZLES.length) {
      this._buildResult(w, h);
      return;
    }

    const puz = ARCADE_PUZZLES[ARCADE.ronda];

    /* Pantalla de transición "Ronda X" */
    const C = this._compacto;
    this.add.text(w/2, h*0.3, `RONDA  ${ARCADE.ronda + 1} / 7`, {
      fontFamily:'Cinzel', fontSize: C ? '30px' : '38px', fontStyle:'700',
      color:'#D4AF37', stroke:'#050408', strokeThickness:3
    }).setOrigin(0.5);

    this.add.text(w/2, h*0.44, puz.name, {
      fontFamily:'Poppins', fontSize: C ? '19px' : '22px', color:'#9ab0c8'
    }).setOrigin(0.5);

    const npcLabel = puz.npc === 'oraculo' ? 'Oráculo de Laplace' : 'Mercader del Azar';
    this.add.text(w/2, h*0.54, npcLabel, {
      fontFamily:'Poppins', fontSize: C ? '14px' : '13px', color: C ? '#8aa0b8' : '#3a4a58', letterSpacing:2
    }).setOrigin(0.5);

    /* Barra de progreso de rondas */
    this._drawRoundBar(w, h);

    /* Lanzar minijuego tras breve pausa */
    this.time.delayedCall(1600, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(puz.key, {
          dificultad: ARCADE.dificultad,
          modoArcade: true,
          npc: puz.npc,
        });
      });
    });
  }

  _drawRoundBar(w, h){
    const barW = 420, barH = 10, bx = w/2 - barW/2, by = h * 0.65;

    /* Track */
    const track = this.add.graphics();
    track.fillStyle(0x1a2030, 1);
    track.fillRoundedRect(bx, by, barW, barH, 5);

    /* Fill animado — rectangle con scaleX 0→target */
    const filledTarget = (ARCADE.ronda / 7) * barW;
    if (filledTarget > 0) {
      const fill = this.add.rectangle(bx, by + barH/2, filledTarget, barH, 0xD4AF37, 0.85)
        .setOrigin(0, 0.5).setScale(0, 1);
      this.tweens.add({ targets:fill, scaleX:1, duration:500, ease:'Sine.easeOut' });
    }

    /* Dots con pop-in escalonado */
    for (let i = 0; i < 7; i++) {
      const nx = bx + (i / 6) * barW;
      const done = i < ARCADE.ronda;
      const curr = i === ARCADE.ronda;
      const r = curr ? 7 : 5;
      const col = done ? 0xD4AF37 : curr ? 0xFFFFFF : 0x2a3848;
      const dot = this.add.circle(nx, by + barH/2, r, col, done||curr ? 1 : 0.5)
        .setScale(0);
      this.tweens.add({
        targets: dot, scale: 1,
        duration: 280, ease: 'Back.easeOut',
        delay: i * 55 + 120
      });
      /* Punto actual: pulso continuo */
      if (curr) {
        this.time.delayedCall(i * 55 + 400, () => {
          this.tweens.add({
            targets: dot, scale: { from:1, to:1.35 },
            duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
          });
        });
      }
    }

    const label = this.add.text(w/2, by + 30, `${ARCADE.ronda} / 7 completadas`, {
      fontFamily:'Poppins', fontSize: this._compacto ? '14px' : '11px', color: this._compacto ? '#8aa4c0' : '#3a5070'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets:label, alpha:1, duration:400, delay:500 });
  }

  /* ── PANTALLA RESULTADO FINAL ─────────────────────────────── */
  _buildResult(w, h){
    ARCADE.activo = false;
    const score = ARCADE.aciertos;
    if (typeof arcadeSaveRun === 'function') arcadeSaveRun(ARCADE.dificultad, score, 7);
    const total = 7;
    const pct   = score / total;
    const rank  = pct >= 6/7 ? 'ORO' : pct >= 4/7 ? 'PLATA' : pct >= 2/7 ? 'BRONCE' : 'INTENTO';
    const rColors = { ORO:'#D4AF37', PLATA:'#C0C8D0', BRONCE:'#c87818', INTENTO:'#5a6070' };
    const rGlow   = { ORO:0xD4AF37,  PLATA:0xC0C0C0,  BRONCE:0xc87818,  INTENTO:0x404858 };

    /* Panel — aparece con fade + scale */
    const C = this._compacto;
    const pw = 520, ph = C ? Math.min(h - 20, 340) : 380, px = w/2 - pw/2, py = h/2 - ph/2;
    const panelCont = this.add.container(w/2, h/2).setScale(0.82).setAlpha(0);
    const panel = this.add.graphics();
    panel.fillStyle(0x080C18, 0.97);
    panel.fillRoundedRect(px - w/2, py - h/2, pw, ph, 14);
    panel.lineStyle(2, rGlow[rank], 0.8);
    panel.strokeRoundedRect(px - w/2, py - h/2, pw, ph, 14);
    panelCont.add(panel);
    this.tweens.add({ targets:panelCont, scale:1, alpha:1, duration:380, ease:'Back.easeOut' });

    /* Rango — scale bounce después de que aparece el panel */
    const rankTxt = this.add.text(w/2, py + (C ? 42 : 50), rank, {
      fontFamily:'Cinzel', fontSize: C ? '42px' : '52px', fontStyle:'700',
      color: rColors[rank], stroke:'#050408', strokeThickness:4,
      shadow:{offsetX:0, offsetY:0, color:rColors[rank], blur:30, fill:true}
    }).setOrigin(0.5).setScale(0).setAlpha(0);
    this.tweens.add({
      targets: rankTxt, scale:1, alpha:1,
      duration:500, ease:'Back.easeOut', delay:320
    });
    /* Pulso de glow continuo en el rango */
    this.time.delayedCall(820, () => {
      this.tweens.add({
        targets: rankTxt,
        scaleX: { from:1, to:1.06 }, scaleY: { from:1, to:1.06 },
        duration:900, yoyo:true, repeat:-1, ease:'Sine.easeInOut'
      });
    });

    /* Puntaje — contador animado */
    const scoreTxt = this.add.text(w/2, py + (C ? 92 : 110), `0 / ${total} correctas`, {
      fontFamily:'Cinzel', fontSize: C ? '19px' : '22px', color:'#9ab0c8'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets:scoreTxt, alpha:1, duration:300, delay:600 });
    this.time.delayedCall(700, () => {
      let counter = 0;
      this.time.addEvent({
        delay: 90, repeat: score,
        callback: () => { scoreTxt.setText(`${counter++} / ${total} correctas`); }
      });
    });

    /* Estrellas individuales con stagger */
    const starY = py + (C ? 130 : 155), starStartX = w/2 - (total-1)*20;
    for (let i = 0; i < total; i++) {
      const filled = i < score;
      const star = this.add.text(starStartX + i*40, starY,
        filled ? '★' : '☆', {
          fontFamily:'Cinzel', fontSize:'24px',
          color: filled ? '#D4AF37' : '#2a3040'
        }
      ).setOrigin(0.5).setScale(0).setAlpha(0);
      this.tweens.add({
        targets: star, scale:1, alpha:1,
        duration:260, ease:'Back.easeOut',
        delay: 850 + i * 100
      });
      if (filled) {
        this.time.delayedCall(850 + i*100 + 260, () => {
          this.tweens.add({
            targets:star, y: starY - 4,
            duration:400, yoyo:true, repeat:-1, ease:'Sine.easeInOut'
          });
        });
      }
    }

    /* Partículas doradas para ORO/PLATA */
    if (rank === 'ORO' || rank === 'PLATA') {
      const partColor = rank === 'ORO' ? 0xD4AF37 : 0xC0C0C0;
      const count = rank === 'ORO' ? 22 : 12;
      this.time.delayedCall(900, () => {
        for (let p = 0; p < count; p++) {
          const px2 = w/2 + (Math.random()-0.5)*460;
          const py2 = h/2 + (Math.random()-0.5)*300;
          const particle = this.add.circle(px2, py2, Math.random()*3+1.5, partColor, 0.9);
          this.tweens.add({
            targets: particle,
            y: py2 - 60 - Math.random()*80,
            alpha: 0,
            scale: 0,
            duration: 900 + Math.random()*600,
            delay: Math.random()*400,
            ease:'Sine.easeOut',
            onComplete: () => particle.destroy()
          });
        }
      });
    }

    /* Mensaje + dificultad — fade in tardío */
    const msgs = {
      ORO:'¡Dominas la probabilidad!',
      PLATA:'¡Muy bien! Seguí practicando.',
      BRONCE:'Buen intento. ¡Intentalo de nuevo!',
      INTENTO:'La probabilidad te espera. ¡No te rindas!'
    };
    const msgDelay = 850 + total * 100 + 200;
    const msg = this.add.text(w/2, py + (C ? 172 : 205), msgs[rank], {
      fontFamily:'Poppins', fontSize: C ? '15px' : '14px', color: C ? '#9ab2c8' : '#6a8098', fontStyle:'italic'
    }).setOrigin(0.5).setAlpha(0);
    const difTxt = this.add.text(w/2, py + (C ? 198 : 232), `Dificultad: ${ARCADE.dificultad.toUpperCase()}`, {
      fontFamily:'Poppins', fontSize: C ? '13px' : '12px', color: C ? '#8aa0b8' : '#3a4a58', letterSpacing:2
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets:[msg, difTxt], alpha:1, duration:400, delay:msgDelay });

    /* Botones — aparecen al final */
    const btnDelay = msgDelay + 200;
    this.time.delayedCall(btnDelay, () => {
      this._bigBtn(w/2 - 120, py + ph - (C ? 38 : 55), '↺  Repetir', '#9ab0c8', 0x0c1a28, 0x2a4a68, () => {
        this._fadeGo('ArcadeScene', { mode:'select' });
      });
      this._bigBtn(w/2 + 120, py + ph - (C ? 38 : 55), '⌂  Hub', '#D4AF37', 0x1A1408, 0xD4AF37, () => {
        this._fadeGo('ArcadeHubScene');
      });
    });
  }

  /* ── HELPERS ──────────────────────────────────────────────── */
  _bigBtn(cx, cy, label, textColor, fillColor, borderColor, action, bwArg){
    const bw = bwArg || 200, bh = 46;
    const bg = this.add.graphics();
    const draw = (hov) => {
      bg.clear();
      bg.fillStyle(fillColor, hov ? 0.95 : 0.8);
      bg.fillRoundedRect(cx - bw/2, cy - bh/2, bw, bh, 7);
      bg.lineStyle(1.5, borderColor, hov ? 0.9 : 0.5);
      bg.strokeRoundedRect(cx - bw/2, cy - bh/2, bw, bh, 7);
    };
    draw(false);
    const txt = this.add.text(cx, cy, label, {
      fontFamily:'Cinzel', fontSize: this._compacto ? '16px' : '15px', color:textColor, fontStyle:'600'
    }).setOrigin(0.5).setDepth(2);
    const hit = this.add.rectangle(cx, cy, bw, bh, 0, 0)
      .setInteractive({useHandCursor:true}).setDepth(3);
    hit.on('pointerover', () => { draw(true); snd_item&&snd_item(); });
    hit.on('pointerout',  () => draw(false));
    hit.on('pointerup',   () => { snd_buff&&snd_buff(); action(); });
  }

  _smallBtn(cx, cy, label, action){
    const txt = this.add.text(cx, cy, label, {
      fontFamily:'Poppins', fontSize:'12px', color:'#2a3848'
    }).setOrigin(0.5).setInteractive({useHandCursor:true});
    txt.on('pointerover', () => txt.setColor('#5a7090'));
    txt.on('pointerout',  () => txt.setColor('#2a3848'));
    txt.on('pointerup',   () => action());
  }

  _fadeGo(scene, data={}){
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene, data));
  }
}

ArcadeScene.DISENO_MOVIL = true;
