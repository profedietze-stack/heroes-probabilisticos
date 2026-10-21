/* ══════════════════════════════════════════════════════════════
   LibreScene.js — Modo Libre: elige minijuego y dificultad
   Muestra estadísticas por minijuego/dificultad
══════════════════════════════════════════════════════════════ */

/* Estado libre (dificultad seleccionada persiste en sesión) */
if (typeof LIBRE === 'undefined') {
  var LIBRE = { dificultad:'normal' };
}

class LibreScene extends Phaser.Scene {
  constructor(){ super('LibreScene'); }

  init(data){
    /* Si volvemos de un minijuego, mostramos toast con resultado */
    this._lastResult = (data && data.correcto !== undefined) ? data.correcto : null;
    this._lastPuz    = (data && data.puzName) ? data.puzName : null;
  }

  create(){
    Music.play('menu');
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const w = this.scale.width, h = this.scale.height;
    // Teléfono apaisado (lienzo = pantalla real): letras de 13 px o más y botones/tarjetas de 44 px o más.
    const C = this._compacto = h < 500;

    /* Fondo */
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x080C18, 0x080C18, 0x040810, 0x040810, 1);
    bg.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) {
      const s = this.add.circle(Math.random()*w, Math.random()*h,
        Math.random()*1.0+0.2, Math.random()>0.6 ? 0xD4AF37 : 0xB0B8C0,
        Math.random()*0.15+0.03);
      this.tweens.add({targets:s, alpha:{from:0.03, to:s.alpha},
        duration:2000+Math.random()*3000, yoyo:true, repeat:-1, delay:Math.random()*2000});
    }

    /* Encabezado */
    this.add.text(w/2, C ? 22 : 38, 'MODO LIBRE', {
      fontFamily:'Cinzel', fontSize: C ? '22px' : '26px', fontStyle:'700',
      color:'#4080d0', stroke:'#050408', strokeThickness:2,
      shadow:{offsetX:0, offsetY:0, color:'#4080d0', blur:16, fill:true}
    }).setOrigin(0.5);

    /* Selector de dificultad compacto */
    this._buildDifSelector(w, C ? 78 : 82);

    /* Grilla de minijuegos */
    this._buildGrid(w, h);

    /* Toast resultado previo */
    if (this._lastResult !== null) {
      const msg = this._lastResult
        ? `✓ ¡Correcto! ${this._lastPuz||''}`
        : `✗ Incorrecto. ${this._lastPuz||''}  ¡Inténtalo de nuevo!`;
      this.time.delayedCall(200, () => showToast(msg, 2800));
    }

    /* Botón volver */
    const _lbg = this.add.graphics();
    const LBW = C ? 190 : 156, LBH = C ? 44 : 30, LBY = C ? h - 50 : h - 42;
    const _drawLB = (hov) => {
      _lbg.clear();
      _lbg.fillStyle(0x0a1828, hov ? 0.92 : 0.75);
      _lbg.fillRoundedRect(w/2 - LBW/2, LBY, LBW, LBH, 6);
      _lbg.lineStyle(1.5, hov ? 0x6090c8 : 0x2a5070, hov ? 0.9 : 0.6);
      _lbg.strokeRoundedRect(w/2 - LBW/2, LBY, LBW, LBH, 6);
    };
    _drawLB(false);
    const back = this.add.text(w/2, LBY + LBH/2, '← Volver al Hub', {
      fontFamily:'Poppins', fontSize: C ? '14px' : '12px', color: C ? '#9cc4e0' : '#7aabcc', fontStyle:'600',
      padding: C ? {x:24, y:14} : {x:0, y:0}
    }).setOrigin(0.5).setInteractive({useHandCursor:true});
    back.on('pointerover', () => { _drawLB(true); back.setColor('#aaddf8'); });
    back.on('pointerout',  () => { _drawLB(false); back.setColor('#7aabcc'); });
    back.on('pointerup',   () => this._fadeGo('ArcadeHubScene'));
  }

  /* ── Selector dificultad ─────────────────────────────────── */
  _buildDifSelector(w, cy){
    const difs = [
      { key:'facil',      label:'Fácil',      color:'#40c060', sel:0x207020 },
      { key:'normal',     label:'Normal',     color:'#4080d0', sel:0x1a3a6a },
      { key:'heroe',      label:'Héroe',      color:'#c05030', sel:0x6a2010 },
      { key:'legendario', label:'Legendario', color:'#9030a0', sel:0x3a0a3a },
    ];
    const C = this._compacto;
    const gap = C ? 8 : 14;
    const btnW = C ? Math.floor((w - 24 - 3*gap) / 4) : 160, BTH = C ? 44 : 32;
    const totalW = difs.length * btnW + (difs.length-1) * gap;
    const startX = w/2 - totalW/2;

    difs.forEach((d, i) => {
      const bx = startX + i * (btnW + gap);
      const sel = LIBRE.dificultad === d.key;
      const bg2 = this.add.graphics();
      const draw = (hov) => {
        bg2.clear();
        bg2.fillStyle(sel ? d.sel : 0x0c1020, hov ? 0.9 : sel ? 0.7 : 0.5);
        bg2.fillRoundedRect(bx, cy-BTH/2, btnW, BTH, 5);
        bg2.lineStyle(1.5,
          Phaser.Display.Color.HexStringToColor(d.color).color,
          hov || sel ? 0.9 : (C ? 0.5 : 0.25));
        bg2.strokeRoundedRect(bx, cy-BTH/2, btnW, BTH, 5);
      };
      draw(false);
      const txt = this.add.text(bx + btnW/2, cy, d.label, {
        fontFamily:'Poppins', fontSize: C ? '15px' : '12px', color: sel ? d.color : (C ? '#8aa0b8' : '#3a4a58'), fontStyle: sel ? '700' : '400'
      }).setOrigin(0.5).setDepth(2);
      const hit = this.add.rectangle(bx + btnW/2, cy, btnW, BTH, 0, 0)
        .setInteractive({useHandCursor:true}).setDepth(3);
      hit.on('pointerover', () => { draw(true); snd_item&&snd_item(); });
      hit.on('pointerout',  () => draw(false));
      hit.on('pointerup',   () => {
        LIBRE.dificultad = d.key;
        snd_buff&&snd_buff();
        this.cameras.main.fadeOut(180, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('LibreScene'));
      });
    });
  }

  /* ── Grilla de minijuegos ─────────────────────────────────── */
  _buildGrid(w, h){
    const C = this._compacto;
    const cols = 4, rows = 2;
    const gapX = C ? 8 : 18, gapY = C ? 8 : 16;
    const cardW = C ? Math.floor((w - 24 - 3*gapX) / 4) : 210;
    const cardH = C ? Math.floor((h - 50 - 8 - 106 - gapY) / 2) : 168;
    const gridW = cols * cardW + (cols-1) * gapX;
    const startX = w/2 - gridW/2;
    const startY = C ? 106 : 128;

    /* 7 cards (última fila tiene 3, centradas) */
    ARCADE_PUZZLES.forEach((puz, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;

      let cx, cy;
      if (row === 1) {
        /* Centrar 3 cards en la segunda fila */
        const rem = ARCADE_PUZZLES.length - cols;
        const rowW = rem * cardW + (rem-1) * gapX;
        cx = w/2 - rowW/2 + col * (cardW + gapX) + cardW/2;
      } else {
        cx = startX + col * (cardW + gapX) + cardW/2;
      }
      cy = startY + row * (cardH + gapY) + cardH/2;

      this._buildCard(cx, cy, cardW, cardH, puz, i);
    });
  }

  _buildCard(cx, cy, bw, bh, puz, idx){
    const C = this._compacto;
    const bx = cx - bw/2, by = cy - bh/2;
    const isOraculo = puz.npc === 'oraculo';
    const accent = isOraculo ? 0x2870a0 : 0x8a5010;
    const accentHex = isOraculo ? '#4090c0' : '#c87818';

    const st = arcadeGetLibre(puz.key, LIBRE.dificultad);
    const mastered = st.played >= 3 && st.correct / st.played >= 0.7;

    const bg2 = this.add.graphics();
    const draw = (hov) => {
      bg2.clear();
      bg2.fillStyle(isOraculo ? 0x0a1420 : 0x140e04, hov ? 0.97 : 0.88);
      bg2.fillRoundedRect(bx, by, bw, bh, 8);
      bg2.lineStyle(1.5, accent, hov ? 0.85 : mastered ? 0.6 : 0.3);
      bg2.strokeRoundedRect(bx, by, bw, bh, 8);
    };
    draw(false);

    if (C) {
      // Teléfono: toda la tarjeta es el botón (≥ 44 px); icono + NPC arriba, nombre al medio y resultados abajo.
      this.add.text(cx, by + 15, `${isOraculo ? '🔮' : '📜'} ${isOraculo ? 'Oráculo' : 'Mercader'}`, {
        fontFamily:'Poppins', fontSize:'13px', color:'#8aa0b8'
      }).setOrigin(0.5);
      this.add.text(cx, by + 47, puz.name, {
        fontFamily:'Cinzel', fontSize:'14px', color: accentHex, fontStyle:'700',
        wordWrap:{width: bw - 16}, align:'center'
      }).setOrigin(0.5);
      this.add.text(cx, by + bh - 17, st.played > 0 ? `${st.played} jugadas · ${Math.round(st.correct / st.played * 100)}%` : 'Sin jugar', {
        fontFamily:'Poppins', fontSize:'13px', color: st.played > 0 ? '#c0cedc' : '#7890a8'
      }).setOrigin(0.5);
    } else {
    /* Icono NPC */
    this.add.text(cx, by + 26, isOraculo ? '🔮' : '📜', {
      fontFamily:'Poppins', fontSize:'22px'
    }).setOrigin(0.5);

    /* Nombre */
    this.add.text(cx, by + 60, puz.name, {
      fontFamily:'Cinzel', fontSize:'11.5px', color: accentHex, fontStyle:'600',
      wordWrap:{width: bw - 20}, align:'center'
    }).setOrigin(0.5);

    /* NPC label */
    this.add.text(cx, by + 82, isOraculo ? 'Oráculo' : 'Mercader', {
      fontFamily:'Poppins', fontSize:'9px', color:'#2a3848', letterSpacing:1
    }).setOrigin(0.5);

    /* Stats */
    const sep = this.add.graphics();
    sep.lineStyle(1, accent, 0.15);
    sep.lineBetween(bx+14, by+96, bx+bw-14, by+96);
    }

    if (!C && st.played > 0) {
      const pct = Math.round(st.correct / st.played * 100);
      this.add.text(cx - 30, by + 112, `${st.played}`, {
        fontFamily:'Cinzel', fontSize:'16px', color:'#9ab0c8', fontStyle:'700'
      }).setOrigin(0.5);
      this.add.text(cx - 30, by + 128, 'jugadas', {
        fontFamily:'Poppins', fontSize:'8px', color:'#3a4a58'
      }).setOrigin(0.5);
      this.add.text(cx + 30, by + 112, `${pct}%`, {
        fontFamily:'Cinzel', fontSize:'16px',
        color: pct >= 70 ? '#40c060' : pct >= 40 ? '#D4AF37' : '#c05030', fontStyle:'700'
      }).setOrigin(0.5);
      this.add.text(cx + 30, by + 128, 'aciertos', {
        fontFamily:'Poppins', fontSize:'8px', color:'#3a4a58'
      }).setOrigin(0.5);
    } else if (!C) {
      this.add.text(cx, by + 118, 'Sin jugar', {
        fontFamily:'Poppins', fontSize:'10px', color:'#2a3040'
      }).setOrigin(0.5);
    }

    /* Corona + glow pulsante si dominado */
    if (mastered) {
      /* Glow exterior animado */
      const glow = this.add.graphics().setAlpha(0.18);
      glow.lineStyle(3, 0xD4AF37, 1);
      glow.strokeRoundedRect(bx - 2, by - 2, bw + 4, bh + 4, 10);
      this.tweens.add({
        targets: glow, alpha: { from:0.08, to:0.38 },
        duration: 900, yoyo: true, repeat: -1, ease:'Sine.easeInOut',
        delay: Math.random() * 400
      });
      /* Corona */
      const crown = this.add.text(bx + bw - 12, by + 10, '👑', {
        fontFamily:'Poppins', fontSize:'13px'
      }).setOrigin(0.5);
      this.tweens.add({
        targets: crown, y: { from: by + 10, to: by + 6 },
        duration: 800, yoyo: true, repeat: -1, ease:'Sine.easeInOut'
      });
    }

    /* Botón Jugar */
    const btnY = by + bh - 18;
    const btnBg = this.add.graphics();
    const drawBtn = (hov) => {
      btnBg.clear();
      if (C) { btnBg.fillStyle(accent, hov ? 0.22 : 0); btnBg.fillRoundedRect(bx+2, by+2, bw-4, bh-4, 7); return; }
      btnBg.fillStyle(accent, hov ? 0.3 : 0.12);
      btnBg.fillRoundedRect(bx+10, btnY-12, bw-20, 24, 4);
    };
    drawBtn(false);
    if (!C) this.add.text(cx, btnY, 'JUGAR →', {
      fontFamily:'Cinzel', fontSize:'10px', color: accentHex, fontStyle:'700', letterSpacing:1
    }).setOrigin(0.5).setDepth(2);

    const hit = this.add.rectangle(cx, cy, bw, bh, 0, 0)
      .setInteractive({useHandCursor:true}).setDepth(3);
    hit.on('pointerover', () => { draw(true); drawBtn(true); snd_item&&snd_item(); });
    hit.on('pointerout',  () => { draw(false); drawBtn(false); });
    hit.on('pointerup',   () => {
      snd_buff&&snd_buff();
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(puz.key, {
          dificultad: LIBRE.dificultad,
          modoArcade: 'libre',
          npc: puz.npc,
          puzKey: puz.key,
          puzName: puz.name,
        });
      });
    });
  }

  _fadeGo(scene, data={}){
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene, data));
  }
}

LibreScene.DISENO_MOVIL = true;
