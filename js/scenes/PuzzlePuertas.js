/* ══════════════════════════════════════
   PuzzlePuertas — Las Puertas del Oráculo
   Concepto: probabilidad condicional (problema de Monty Hall)
   El Oráculo abre todas las puertas vacías menos una. ¿Cambiar o quedarse?
   Cambiar gana (N-1)/N de las veces. Se juega en varias rondas y la
   estadística emerge sola — sin elegir fracciones.

   Recompensa:
     · arcade / libre  → puntos
     · aventura        → alterna estricto: 1ª oro, 2ª HP, 3ª oro, …
══════════════════════════════════════ */

class PuzzlePuertas extends Phaser.Scene {
  constructor() { super('PuzzlePuertas'); }

  init(d) {
    this._data = d || {};
    this._cfg  = this._gen(this._data.dificultad || 'normal');
  }

  _gen(dif) {
    const table = {
      facil:      { doors:3, rounds:4 },
      normal:     { doors:4, rounds:5 },
      heroe:      { doors:5, rounds:6 },
      legendario: { doors:7, rounds:7 },
    };
    const c = table[dif] || table.normal;
    c.opens = c.doors - 2;            // abre todas las vacías menos una
    c.winChance = (c.doors - 1) / c.doors;
    return c;
  }

  create() {
    const { w, h } = pzBg(this, 'oraculo');
    this._w = w; this._h = h;
    pzHeader(this, 'Las Puertas del Oráculo', 'oraculo', w);

    const N = this._cfg.doors;
    const pct = Math.round(this._cfg.winChance * 100);
    pzInfoButton(this, 'oraculo', 'Las Puertas del Oráculo', [
      '◆ El tema: probabilidad condicional',
      'La información nueva cambia las probabilidades. Lo que el Oráculo',
      'te revela NO deja todo en 50-50: hay que recalcular.',
      '',
      '◆ El minijuego (problema de Monty Hall)',
      `Hay ${N} puertas, una esconde el tesoro. Elegís una. El Oráculo abre`,
      'todas las vacías menos una y te deja con tu puerta y una alternativa.',
      'Decidís: ¿te quedás o cambiás?',
      '',
      '◆ Qué se espera de vos',
      'Jugá varias rondas y mirá el marcador: vas a ver que CAMBIAR gana',
      'mucho más seguido que quedarte. No elegís fracciones: solo decidís.',
      '',
      '◆ Consejos',
      `• Tu puerta nació con 1/${N} de chance; eso no cambia al abrir otras.`,
      `• Toda la probabilidad restante se junta en la otra puerta: cambiar gana ~${pct}%.`,
      '• Una sola ronda es suerte; la ventaja se ve recién tras varias.',
    ]);

    /* Estado de partida */
    this._round  = 0;
    this._sw = { win:0, tot:0 };   // cambiando
    this._st = { win:0, tot:0 };   // quedándose
    this._doors = [];

    /* Texto de instrucción */
    this._prompt = this.add.text(w/2, 92, '', {
      fontFamily:'Cinzel', fontSize:'15px', color:'#70c8e0', fontStyle:'600',
      align:'center', wordWrap:{ width:w*0.8 }
    }).setOrigin(0.5);

    /* Contador de rondas */
    this._roundTxt = this.add.text(w/2, 120, '', {
      fontFamily:'Poppins', fontSize:'11px', color:'#5a6a78'
    }).setOrigin(0.5);

    /* Marcadores (cambiando / quedándose) */
    this._buildScoreboard(w, 470);

    /* Zona de botones de acción */
    this._actionY = 556;

    this._buildDoors(w, 318);
    this._startRound();
  }

  /* ══ Marcador en vivo ══ */
  _buildScoreboard(w, y) {
    const mk = (cx, label, col) => {
      const cont = this.add.container(cx, y).setDepth(3);
      const g = this.add.graphics();
      g.fillStyle(0x07101e, 0.82);
      g.fillRoundedRect(-110, -26, 220, 52, 8);
      g.lineStyle(1.2, col, 0.4);
      g.strokeRoundedRect(-110, -26, 220, 52, 8);
      const lt = this.add.text(0, -13, label, {
        fontFamily:'Poppins', fontSize:'10px', color:'#7a8a98'
      }).setOrigin(0.5);
      const vt = this.add.text(0, 7, '0 / 0', {
        fontFamily:'Cinzel', fontSize:'15px', fontStyle:'700',
        color:'#' + col.toString(16).padStart(6,'0')
      }).setOrigin(0.5);
      cont.add([g, lt, vt]);
      pzPopIn(this, cont, 600, 16);
      return vt;
    };
    this._swTxt = mk(w/2 - 124, 'Cambiando ganaste', 0x40c8a0);
    this._stTxt = mk(w/2 + 124, 'Quedándote ganaste', 0xc89040);
  }

  _updateScoreboard() {
    const pct = (o) => o.tot ? ` (${Math.round(100*o.win/o.tot)}%)` : '';
    this._swTxt.setText(`${this._sw.win} / ${this._sw.tot}${pct(this._sw)}`);
    this._stTxt.setText(`${this._st.win} / ${this._st.tot}${pct(this._st)}`);
  }

  /* ══ Construcción de puertas ══ */
  _buildDoors(w, cy) {
    const N = this._cfg.doors;
    const maxRowW = w - 120;
    const gap = N >= 6 ? 12 : 18;
    let dw = Math.min(120, Math.floor((maxRowW - gap*(N-1)) / N));
    dw = Math.max(74, dw);
    const dh = Math.round(dw * 1.5);
    this._dw = dw; this._dh = dh;
    const totalW = N*dw + (N-1)*gap;
    const startX = w/2 - totalW/2 + dw/2;

    for (let i = 0; i < N; i++) {
      const x = startX + i*(dw + gap);
      const cont = this.add.container(x, cy).setDepth(4);
      const g = this.add.graphics();
      const lbl = this.add.text(0, dh/2 + 16, `Puerta ${i+1}`, {
        fontFamily:'Poppins', fontSize:'10px', color:'#6a7a88'
      }).setOrigin(0.5);
      cont.add([g, lbl]);

      const d = { cont, g, lbl, idx:i, state:'closed' };
      this._drawDoor(d);
      cont.setSize(dw, dh).setInteractive({ useHandCursor:true });
      cont.on('pointerover', () => { if (this._phase==='pick') this._hoverDoor(d, true); });
      cont.on('pointerout',  () => { if (this._phase==='pick') this._hoverDoor(d, false); });
      cont.on('pointerup',   () => this._onPick(d));

      cont.setAlpha(0); cont.y = cy + 24; cont.setScale(0.85);
      this.tweens.add({ targets:cont, alpha:1, y:cy, scaleX:1, scaleY:1,
        duration:420, delay:200 + i*70, ease:'Back.easeOut' });

      this._doors.push(d);
    }
  }

  _hoverDoor(d, on) {
    this.tweens.add({ targets:d.cont, scaleX:on?1.05:1, scaleY:on?1.05:1, duration:140, ease:'Back.easeOut' });
    if (d.state === 'closed' || d.state === 'hover') { d.state = on ? 'hover' : 'closed'; this._drawDoor(d); }
  }

  _drawDoor(d) {
    const g = d.g, dw = this._dw, dh = this._dh;
    const x = -dw/2, y = -dh/2;
    g.clear();

    const open = (d.state === 'open' || d.state === 'empty' || d.state === 'prize');
    if (open) {
      /* Marco / hueco oscuro */
      g.fillStyle(0x05080e, 1);
      g.fillRoundedRect(x, y, dw, dh, 6);
      g.lineStyle(2, 0x2a2018, 0.9);
      g.strokeRoundedRect(x, y, dw, dh, 6);
      if (d.state === 'prize') {
        /* Resplandor + tesoro */
        g.fillStyle(0xD4AF37, 0.14);
        g.fillRoundedRect(x+4, y+4, dw-8, dh-8, 5);
        const cd = dw*0.28;
        g.fillStyle(0xF5D97A, 1);
        g.fillTriangle(0, -cd, cd*0.8, -cd*0.15, -cd*0.8, -cd*0.15);
        g.fillStyle(0xD4AF37, 1);
        g.fillTriangle(0, cd, cd*0.8, -cd*0.15, -cd*0.8, -cd*0.15);
        g.fillStyle(0xffffff, 0.5);
        g.fillTriangle(0, -cd, cd*0.22, -cd*0.5, -cd*0.22, -cd*0.5);
      } else {
        /* Vacía: cruz tenue */
        g.lineStyle(3, 0x3a4450, 0.7);
        const r = dw*0.18;
        g.lineBetween(-r, -r, r, r);
        g.lineBetween(r, -r, -r, r);
      }
      return;
    }

    /* Puerta cerrada (madera) */
    const hover = d.state === 'hover';
    const sel   = d.state === 'sel';
    const top = sel ? 0x2a4a64 : hover ? 0x5a4420 : 0x4a3414;
    const bot = sel ? 0x16304a : hover ? 0x3a2c14 : 0x2e2010;
    g.fillGradientStyle(top, top, bot, bot, 1);
    g.fillRoundedRect(x, y, dw, dh, 6);
    /* Paneles tallados */
    g.lineStyle(1.5, sel ? 0x70c8e0 : 0x6a4818, sel ? 0.9 : 0.55);
    g.strokeRoundedRect(x+6, y+8, dw-12, dh*0.42, 4);
    g.strokeRoundedRect(x+6, y+dh*0.5, dw-12, dh*0.42, 4);
    /* Borde exterior */
    g.lineStyle(2, sel ? 0x9ad8f0 : hover ? 0xc88820 : 0x8a6828, sel||hover ? 1 : 0.7);
    g.strokeRoundedRect(x, y, dw, dh, 6);
    /* Pomo */
    g.fillStyle(0xF5D97A, sel||hover ? 1 : 0.8);
    g.fillCircle(dw/2 - 12, 0, 4.5);
  }

  /* ══ Flujo de ronda ══ */
  _startRound() {
    this._phase = 'pick';
    this._picked = null;
    this._prize  = Math.floor(Math.random() * this._cfg.doors);
    this._doors.forEach(d => { d.state = 'closed'; this._drawDoor(d); d.cont.setAlpha(1); });
    this._clearActions();
    this._roundTxt.setText(`Ronda ${this._round + 1} de ${this._cfg.rounds}`);
    this._prompt.setColor('#70c8e0');
    this._prompt.setText('Elegí una puerta. El tesoro está detrás de una.');
  }

  _onPick(d) {
    if (this._phase !== 'pick') return;
    snd_item && snd_item();
    this._picked = d.idx;
    this._phase  = 'opening';
    this._doors.forEach(x => { x.state = (x.idx===d.idx)?'sel':'closed'; this._drawDoor(x); });

    /* Determinar la alternativa que queda cerrada */
    if (this._picked === this._prize) {
      const others = this._doors.map(x=>x.idx).filter(i => i !== this._picked);
      this._alt = others[Math.floor(Math.random()*others.length)];
    } else {
      this._alt = this._prize;
    }
    /* Puertas a abrir = todas menos la elegida y la alternativa */
    const toOpen = this._doors.map(x=>x.idx).filter(i => i !== this._picked && i !== this._alt);

    this._prompt.setText('El Oráculo abre las puertas vacías…');
    toOpen.forEach((idx, k) => {
      this.time.delayedCall(360 + k*260, () => {
        const dr = this._doors[idx];
        dr.state = 'empty';
        this.tweens.add({ targets:dr.cont, scaleX:0.86, duration:120, yoyo:true,
          onStart:()=>this._drawDoor(dr) });
        snd_item && snd_item();
      });
    });

    this.time.delayedCall(360 + toOpen.length*260 + 200, () => this._offerDecision());
  }

  _offerDecision() {
    this._phase = 'decide';
    this._prompt.setText(
      `Quedan tu Puerta ${this._picked+1} y la Puerta ${this._alt+1}. ¿Qué hacés?`
    );
    this._mkActionBtns([
      { label:'Quedarme',  col:0xc89040, on:()=>this._resolve(false) },
      { label:`Cambiar a Puerta ${this._alt+1}`, col:0x40c8a0, on:()=>this._resolve(true) },
    ]);
  }

  _resolve(switchIt) {
    if (this._phase !== 'decide') return;
    this._phase = 'reveal';
    this._clearActions();
    const finalPick = switchIt ? this._alt : this._picked;

    /* Revelar las dos cerradas */
    [this._picked, this._alt].forEach(idx => {
      const dr = this._doors[idx];
      dr.state = (idx === this._prize) ? 'prize' : 'empty';
      this.tweens.add({ targets:dr.cont, scaleX:1.08, scaleY:1.08, duration:200, yoyo:true,
        onStart:()=>this._drawDoor(dr) });
    });

    const win = (finalPick === this._prize);
    const rec = switchIt ? this._sw : this._st;
    rec.tot++; if (win) rec.win++;
    this._updateScoreboard();

    if (win) {
      snd_buff && snd_buff();
      const dr = this._doors[finalPick];
      pzBurst(this, dr.cont.x, dr.cont.y, [0xD4AF37,0x70e090,0xffffff], 26, 12);
      this._prompt.setText(`¡Tesoro! Ganaste ${switchIt?'cambiando':'quedándote'}.`);
      this._prompt.setColor('#50e080');
    } else {
      snd_fail && snd_fail();
      this.cameras.main.shake(180, 0.006);
      this._prompt.setText(`Vacía. El tesoro estaba en la Puerta ${this._prize+1}.`);
      this._prompt.setColor('#e06060');
    }

    this._round++;
    this.time.delayedCall(900, () => {
      this._prompt.setColor('#70c8e0');
      if (this._round >= this._cfg.rounds) this._showSummary();
      else this._mkActionBtns([{ label:'Siguiente ronda →', col:0x70c8e0, on:()=>this._startRound() }]);
    });
  }

  /* ══ Botones de acción genéricos ══ */
  _clearActions() {
    if (this._actBtns) this._actBtns.forEach(b => b.destroy());
    this._actBtns = [];
  }

  _mkActionBtns(defs) {
    this._clearActions();
    const w = this._w, y = this._actionY;
    const BW = 230, BH = 46, GAP = 20;
    const totalW = defs.length*BW + (defs.length-1)*GAP;
    let sx = w/2 - totalW/2 + BW/2;

    defs.forEach((def, i) => {
      const cx = sx + i*(BW + GAP);
      const cont = this.add.container(cx, y).setDepth(6);
      const g = this.add.graphics();
      const draw = (hov) => {
        g.clear();
        g.fillStyle(0x0a1622, hov ? 0.96 : 0.82);
        g.fillRoundedRect(-BW/2, -BH/2, BW, BH, 9);
        g.lineStyle(2, def.col, hov ? 1 : 0.7);
        g.strokeRoundedRect(-BW/2, -BH/2, BW, BH, 9);
      };
      draw(false);
      const txt = this.add.text(0, 0, def.label, {
        fontFamily:'Cinzel', fontSize:'14px', fontStyle:'700',
        color:'#' + def.col.toString(16).padStart(6,'0')
      }).setOrigin(0.5);
      cont.add([g, txt]);
      cont.setSize(BW, BH).setInteractive({ useHandCursor:true });
      cont.on('pointerover', () => { draw(true); this.tweens.add({targets:cont,scaleX:1.05,scaleY:1.05,duration:120}); snd_item&&snd_item(); });
      cont.on('pointerout',  () => { draw(false); this.tweens.add({targets:cont,scaleX:1,scaleY:1,duration:120}); });
      cont.on('pointerup',   () => { this.tweens.add({targets:cont,scaleX:0.95,scaleY:0.95,duration:60,yoyo:true}); def.on(); });

      cont.setAlpha(0); cont.y = y + 18;
      this.tweens.add({ targets:cont, alpha:1, y, duration:320, delay:80 + i*80, ease:'Back.easeOut' });
      this._actBtns.push(cont);
    });
  }

  /* ══ Resumen final + recompensa ══ */
  _showSummary() {
    this._clearActions();
    const w = this._w, h = this._h;
    const aciertos = this._sw.win + this._st.win;
    const rounds   = this._cfg.rounds;
    const correct  = aciertos > rounds/2;
    const swPct = this._sw.tot ? Math.round(100*this._sw.win/this._sw.tot) : null;
    const stPct = this._st.tot ? Math.round(100*this._st.win/this._st.tot) : null;

    /* Recompensa + bookkeeping según modo */
    const reward = this._applyReward(correct, aciertos, rounds);

    const dim = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0).setDepth(20);
    this.tweens.add({ targets:dim, fillAlpha:0.66, duration:320 });

    const bw = 560, bh = 360;
    const cont = this.add.container(w/2, h/2).setDepth(21);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a2028, 0x0a2028, 0x05151a, 0x05151a, 1);
    bg.fillRoundedRect(-bw/2, -bh/2, bw, bh, 14);
    bg.lineStyle(2.5, 0x70c8e0, 0.8);
    bg.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 14);
    cont.add(bg);

    const title = this.add.text(0, -bh/2+34, 'El Veredicto del Oráculo', {
      fontFamily:'Cinzel', fontSize:'20px', color:'#9ad8f0', fontStyle:'700'
    }).setOrigin(0.5);
    cont.add(title);

    /* Moraleja: comparar cambiar vs quedarse */
    let moraleja;
    const optPct = Math.round(this._cfg.winChance*100);
    if (swPct !== null && stPct !== null) {
      moraleja = swPct > stPct
        ? `Cambiando ganaste ${swPct}% · quedándote ${stPct}%.\nCAMBIAR conviene: la otra puerta hereda toda la probabilidad.`
        : `Esta vez quedarte salió parejo (${stPct}% vs ${swPct}%),\npero a la larga CAMBIAR gana ${optPct}% de las veces.`;
    } else if (swPct !== null) {
      moraleja = `Siempre cambiaste y ganaste ${swPct}%.\nEsa es la jugada óptima: cambiar gana ${optPct}%.`;
    } else {
      moraleja = `Siempre te quedaste (${stPct}%).\nProbá cambiar: la otra puerta gana ${optPct}% de las veces.`;
    }

    const stats = this.add.text(0, -bh/2+76, [
      `Ganaste ${aciertos} de ${rounds} rondas.`,
      '',
      moraleja,
    ].join('\n'), {
      fontFamily:'Poppins', fontSize:'12.5px', color:'#b8d0dc',
      align:'center', lineSpacing:5, wordWrap:{ width:bw-70 }
    }).setOrigin(0.5, 0);
    cont.add(stats);

    /* Recompensa */
    const rewTxt = this.add.text(0, bh/2-92, reward.label, {
      fontFamily:'Cinzel', fontSize:'17px', color:reward.color, fontStyle:'700',
      align:'center'
    }).setOrigin(0.5);
    cont.add(rewTxt);
    pzBounceScale(this, rewTxt, 1.18, 320);

    /* Botón continuar */
    const btnG = this.add.graphics();
    const drawB = (hov) => {
      btnG.clear();
      btnG.fillStyle(0x0e2a3a, hov?0.96:0.8);
      btnG.fillRoundedRect(-100, bh/2-54, 200, 38, 9);
      btnG.lineStyle(2, 0x70c8e0, hov?1:0.7);
      btnG.strokeRoundedRect(-100, bh/2-54, 200, 38, 9);
    };
    drawB(false);
    const btnT = this.add.text(0, bh/2-35, 'Continuar →', {
      fontFamily:'Cinzel', fontSize:'14px', color:'#9ad8f0', fontStyle:'700'
    }).setOrigin(0.5);
    cont.add([btnG, btnT]);

    cont.setScale(0.5).setAlpha(0);
    this.tweens.add({ targets:cont, scaleX:1, scaleY:1, alpha:1, duration:460, ease:'Back.easeOut' });

    this.time.delayedCall(700, () => {
      const hit = this.add.rectangle(w/2, h/2 + bh/2 - 35, 200, 38, 0, 0)
        .setDepth(30).setInteractive({ useHandCursor:true });
      hit.on('pointerover', () => { drawB(true); btnT.setColor('#cdeefb'); snd_item&&snd_item(); });
      hit.on('pointerout',  () => { drawB(false); btnT.setColor('#9ad8f0'); });
      hit.on('pointerup',   () => { hit.destroy(); this._exit(correct); });
    });
  }

  /* Aplica puntos/HP/oro y bookkeeping. Devuelve {label,color} para el modal. */
  _applyReward(correct, aciertos, rounds) {
    const arcade = this._data.modoArcade;
    const dif    = this._data.dificultad || 'normal';
    const winRate = rounds ? aciertos/rounds : 0;

    if (arcade) {
      const modeKey = arcade === 'libre' ? 'libre' : 'arcade';
      const unit = (typeof ptsCalc==='function') ? ptsCalc(true, dif, modeKey) : 100;
      const pts  = Math.max(5, Math.round(unit * winRate));
      if (typeof ptsAdd === 'function') ptsAdd(pts, modeKey);
      if (arcade === 'libre' && typeof arcadeSaveLibre === 'function') {
        arcadeSaveLibre(this._data.puzKey, dif, correct === true);
      }
      return { label:`+${pts} puntos`, color:'#D4AF37' };
    }

    /* Aventura: alterna estricto oro ↔ HP por jugada */
    const pid   = 5;
    const plays = (STATE.enigmasCompletados && STATE.enigmasCompletados[pid]) || 0;
    const giveOro = (plays % 2 === 0);   // 1ª(0)=oro, 2ª(1)=HP, 3ª(2)=oro…

    let label, color;
    if (giveOro) {
      const per = { facil:2, normal:3, heroe:4, legendario:6 }[dif] || 3;
      const oro = Math.max(per, aciertos * per);
      STATE.oro = (STATE.oro || 0) + oro;
      label = `+${oro} 💰 oro`;
      color = '#F5D97A';
    } else {
      const baseHp = (typeof PUZZLE_CATALOG!=='undefined' && PUZZLE_CATALOG[pid])
        ? PUZZLE_CATALOG[pid].recompensa.hp : 22;
      const hp = correct ? baseHp : Math.floor(baseHp/3);
      STATE.hp = Math.min((STATE.hp||0) + hp, STATE.hpMax || 150);
      label = `+${hp} HP`;
      color = '#50e080';
    }

    /* Bookkeeping de aventura (igual que pzComplete) */
    if (!STATE.enigmasCompletados) STATE.enigmasCompletados = {};
    STATE.enigmasCompletados[pid] = plays + 1;
    STATE.nodeActual = (STATE.nodeActual || 0) + 1;
    const _puXp = xpForOraculo(dif);
    STATE.xp      = (STATE.xp      || 0) + _puXp;
    STATE.xpTotal = (STATE.xpTotal || 0) + _puXp;
    if (typeof ptsAdd === 'function') ptsAdd(Math.round(ptsCalc(correct, dif, 'aventura')), 'aventura');
    if (typeof saveGameLegend === 'function') saveGameLegend();
    else if (typeof saveGame === 'function') saveGame();

    return { label, color };
  }

  _exit(correct) {
    const arcade = this._data.modoArcade;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (arcade === 'libre') {
        this.scene.start('LibreScene', { correcto: correct === true, puzName: this._data.puzName });
      } else if (arcade) {
        this.scene.start('ArcadeScene', { mode:'playing', correcto: correct === true });
      } else {
        this.scene.start('MapScene');
      }
    });
  }
}
