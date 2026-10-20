/* ══════════════════════════════════════
   PuzzleDados — El Falsificador de Dados
   Concepto: dado trucado, probabilidades no uniformes
══════════════════════════════════════ */

class PuzzleDados extends Phaser.Scene {
  constructor() { super('PuzzleDados'); }

  init(d) {
    this._data = d;
    this._prob = this._gen(d.dificultad || 'normal');
  }

  _gen(dif) {
    const nLoaded = ({ facil:1, normal:1, heroe:2, legendario:3 })[dif] || 1;
    const cfgPools = {
      facil:      [{ extra:4, face:6 }],
      normal:     [{ extra:5, face:6 }, { extra:5, face:5 }],
      heroe:      [{ extra:5, face:6 }, { extra:4, face:5 }],
      legendario: [{ extra:5, face:6 }, { extra:4, face:5 }, { extra:4, face:4 }],
    };
    const pool = cfgPools[dif] || cfgPools.normal;
    const positions = _shuffle([0,1,2,3,4,5]).slice(0, nLoaded);

    const dice = Array.from({ length:6 }, (_, i) => {
      const li = positions.indexOf(i);
      if (li >= 0) {
        const c = pool[li % pool.length];
        return { loaded:true, face:c.face, extra:c.extra, total:5+c.extra };
      }
      return { loaded:false, face:null, extra:1, total:6 };
    });

    const prim = dice[positions[0]];
    const corr = _frac(prim.extra, prim.total);
    // Errores típicos: ignorar el peso extra (1/6), olvidar que el total sube
    // (extra/6) o contar sólo la cara cargada contra el total (1/total). Con
    // sólo esos tres la correcta era la tercera más chica el 100 % de las
    // veces, en las cuatro dificultades; _opcionesFrac sortea el rango y
    // completa con fracciones posibles del problema.
    const opts = _opcionesFrac(
      corr,
      [_frac(1, 6), _frac(prim.extra, 6), _frac(1, prim.total)],
      _fraccionesDe(prim.total, 6),
    );

    return {
      dice, positions, nLoaded, prim, corr, opts,
      explain:
        `La cara ${prim.face} tiene peso ${prim.extra}, las demas peso 1.\n` +
        `Peso total = 5x1 + ${prim.extra} = ${prim.total}\n` +
        `P(cara ${prim.face}) = ${prim.extra}/${prim.total} = ${corr}`,
    };
  }

  _roll(die) {
    if (!die.loaded) return Math.floor(Math.random() * 6) + 1;
    const r = Math.random() * die.total;
    if (r < die.extra) return die.face;
    const others = [1,2,3,4,5,6].filter(f => f !== die.face);
    return others[Math.floor(Math.random() * others.length)];
  }

  _buildInfo(w, h) {
    /* Botón ? arriba a la derecha */
    const bx = w - 38, by = 40;
    const btn = this.add.graphics().setDepth(40);
    const drawBtn = (hov) => {
      btn.clear();
      btn.fillStyle(0x0e2030, hov ? 0.95 : 0.8);
      btn.fillCircle(bx, by, 15);
      btn.lineStyle(1.5, hov ? 0x90d8f0 : 0x4a7a98, hov ? 1 : 0.7);
      btn.strokeCircle(bx, by, 15);
    };
    drawBtn(false);
    const btnTxt = this.add.text(bx, by, '?', {
      fontFamily:'Cinzel', fontSize:'17px', color:'#90d8f0', fontStyle:'700'
    }).setOrigin(0.5).setDepth(41);

    /* Overlay (oculto) */
    const ov = this.add.container(0, 0).setDepth(50).setAlpha(0).setVisible(false);
    const dim = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.72)
      .setInteractive();
    const pw = 600, ph = 388, px = w/2 - pw/2, py = h/2 - ph/2;
    const panel = this.add.graphics();
    panel.fillStyle(0x0c1622, 0.98);
    panel.fillRoundedRect(px, py, pw, ph, 14);
    panel.lineStyle(2, 0x4a7a98, 0.8);
    panel.strokeRoundedRect(px, py, pw, ph, 14);
    panel.lineStyle(1, 0x70c8e0, 0.2);
    panel.strokeRoundedRect(px+5, py+5, pw-10, ph-10, 10);

    const title = this.add.text(w/2, py + 30, 'Los histogramas', {
      fontFamily:'Cinzel', fontSize:'19px', color:'#70c8e0', fontStyle:'700'
    }).setOrigin(0.5);

    const body = this.add.text(px + 36, py + 62, [
      '◆ ¿Qué son en general?',
      'Un histograma es un gráfico de barras que muestra cuántas',
      'veces apareció cada resultado. Barra más alta = resultado',
      'más frecuente.',
      '',
      '◆ ¿Para qué sirven aquí?',
      'Cada dado tiene su propio histograma con las 6 caras (1 a 6).',
      'Un dado justo reparte parejo las 6 barras. Un dado trucado',
      'hace que UNA cara salga mucho más → su barra sobresale.',
      '',
      '◆ ¿Cómo se leen?',
      'La línea gris marca lo esperado en un dado JUSTO (1 de cada 6).',
      'En un dado justo las 6 barras quedan cerca de esa línea.',
      'El trucado tiene una barra que la supera claro (se pinta dorada).',
      'Cuantas más tiradas, más estable el patrón: tirá 30+ veces.',
    ].join('\n'), {
      fontFamily:'Poppins', fontSize:'12px', color:'#b8c8d8',
      lineSpacing:4, wordWrap:{ width:pw - 72 }
    });

    const closeTxt = this.add.text(w/2, py + ph - 26, 'Cerrar', {
      fontFamily:'Cinzel', fontSize:'13px', color:'#90d8f0', fontStyle:'700'
    }).setOrigin(0.5).setInteractive({ useHandCursor:true });

    ov.add([dim, panel, title, body, closeTxt]);

    const show = (v) => {
      ov.setVisible(true);
      this.tweens.add({ targets:ov, alpha: v ? 1 : 0, duration:220,
        onComplete:() => { if (!v) ov.setVisible(false); } });
    };

    const hit = this.add.circle(bx, by, 16, 0, 0).setDepth(42)
      .setInteractive({ useHandCursor:true });
    hit.on('pointerover', () => drawBtn(true));
    hit.on('pointerout',  () => drawBtn(false));
    hit.on('pointerup',   () => { snd_item && snd_item(); show(true); });
    dim.on('pointerup',      () => show(false));
    closeTxt.on('pointerup', () => show(false));
  }

  create() {
    const { w, h } = pzBg(this, 'oraculo');
    pzHeader(this, 'El Falsificador de Dados', 'oraculo', w);
    const p = this._prob;
    const pl = p.nLoaded > 1;

    const faces = [...new Set(p.dice.filter(d => d.loaded).map(d => d.face))]
      .sort((a,b) => a-b);
    const facesStr = faces.length === 1
      ? `el número ${faces[0]}`
      : `los números ${faces.slice(0,-1).join(', ')} o ${faces[faces.length-1]}`;
    pzPopIn(this, this.add.text(w/2, 96,
      `El Falsificador ha adulterado ${p.nLoaded} de estos 6 dados para que salga casi siempre ${facesStr}.`, {
      fontFamily:'Poppins', fontSize:'13px', color:'#8a9ab0', align:'center',
      wordWrap:{ width:w*0.8 }
    }).setOrigin(0.5), 80);
    pzPopIn(this, this.add.text(w/2, 118,
      `Lanzalos varias veces y descubri ${pl ? 'cuales estan' : 'cual esta'} trucado${pl?'s':''}.`, {
      fontFamily:'Cinzel', fontSize:'13px', color:'#70c8e0', fontStyle:'600', align:'center'
    }).setOrigin(0.5), 160);

    /* ── Botón info + overlay ── */
    this._buildInfo(w, h);

    /* ── Puntaje doble en este desafío ── */
    this._ptsMult = 2;
    pzPopIn(this, this.add.text(70, 40, '★ Puntaje ×2', {
      fontFamily:'Cinzel', fontSize:'12px', color:'#D4AF37', fontStyle:'700'
    }).setOrigin(0.5), 200);

    /* Contexto de puntaje */
    const _md      = this._data && this._data.modoArcade;
    const modeKey  = _md === 'libre' ? 'libre' : (_md ? 'arcade' : 'aventura');
    const _dif     = (this._data && this._data.dificultad) || 'normal';
    const unit     = Math.abs(ptsCalc(true, _dif, modeKey));
    const discPts  = Math.max(1, Math.round(unit * 0.5));
    let wrongPicks = 0;

    /* ── Layout ── */
    const CY     = 232;
    const SIZE   = 52;
    const SP     = 76;
    const X0     = w/2 - 2.5 * SP;
    const HIST_Y = CY + SIZE/2 + 4;
    const HIST_H = 32;
    const FACE_LBL_Y = HIST_Y + HIST_H + 7;
    const LBL_Y  = HIST_Y + HIST_H + 20;
    const STAT_Y = LBL_Y + 18;
    const ROLL_Y = STAT_Y + 36;
    const AUX_Y  = ROLL_Y + 36;
    const Q_Y    = AUX_Y + 44;
    const OPTS_Y = Q_Y + 66;

    const PIPS = {
      1:[[0,0]], 2:[[-1,-1],[1,1]], 3:[[-1,-1],[0,0],[1,1]],
      4:[[-1,-1],[1,-1],[-1,1],[1,1]],
      5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],
      6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]],
    };

    /* ── State ── */
    const history = p.dice.map(() => []);
    const sel     = new Set();
    let rollCount = 0;
    let busy      = false;
    let locked    = false;

    /* ── Draw functions ── */
    const drawDie = (g, face, hiSel) => {
      g.clear();
      if (hiSel) {
        g.fillStyle(0xff7040, 0.3);
        g.fillRoundedRect(-SIZE/2-6, -SIZE/2-6, SIZE+12, SIZE+12, 12);
      }
      g.fillStyle(0x000000, 0.35);
      g.fillRoundedRect(-SIZE/2+2, -SIZE/2+3, SIZE, SIZE, 9);
      g.fillGradientStyle(0x141c2c, 0x141c2c, 0x0c1018, 0x0c1018, 1);
      g.fillRoundedRect(-SIZE/2, -SIZE/2, SIZE, SIZE, 9);
      g.fillStyle(0xffffff, 0.06);
      g.fillRoundedRect(-SIZE/2+3, -SIZE/2+3, SIZE-6, SIZE*0.28, 6);
      g.lineStyle(hiSel ? 2.5 : 1.5, hiSel ? 0xff8860 : 0x2a3850, hiSel ? 0.9 : 0.45);
      g.strokeRoundedRect(-SIZE/2, -SIZE/2, SIZE, SIZE, 9);
      g.fillStyle(0x7090b0, 0.8);
      (PIPS[face] || PIPS[1]).forEach(([px,py]) => g.fillCircle(px*11, py*11, 4.5));
    };

    const drawHist = (hg, i) => {
      hg.clear();
      const hist = history[i];
      if (!hist.length) return;
      const counts = [0,0,0,0,0,0];
      hist.forEach(v => counts[v-1]++);
      const n = hist.length;
      /* Escala ABSOLUTA por proporción (comparable entre dados).
         prob 0.5 = barra al tope; así un dado justo queda ~1/6 y el trucado sobresale. */
      const SCALE = 2;
      const fairProp = 1 / 6;
      for (let f = 0; f < 6; f++) {
        const prop = counts[f] / n;
        const bh = Math.min(HIST_H, Math.round(prop * HIST_H * SCALE));
        const bx = f * 8 - 20;
        hg.fillStyle(0x141c28, 1);
        hg.fillRect(bx, 0, 7, HIST_H);
        if (counts[f]) {
          /* Barra notoriamente sobre lo esperado = dorada (pista visual) */
          const hot = prop > fairProp * 1.8;
          hg.fillStyle(hot ? 0xD4AF37 : 0x3a5070, hot ? 0.95 : 0.9);
          hg.fillRect(bx, HIST_H - bh, 7, bh);
        }
      }
      /* Línea de referencia: frecuencia esperada de un dado JUSTO (1/6) */
      const fairY = HIST_H - Math.round(fairProp * HIST_H * SCALE);
      hg.lineStyle(1, 0x7a8a98, 0.5);
      hg.beginPath(); hg.moveTo(-22, fairY); hg.lineTo(28, fairY); hg.strokePath();
    };

    /* ── Build 6 dice ── */
    const conts   = [];
    const dieGs   = [];
    const histGs  = [];
    const selHits = [];

    p.dice.forEach((_, i) => {
      const dx   = X0 + i * SP;
      const cont = this.add.container(dx, CY);
      const dg   = this.add.graphics();
      cont.add(dg);
      conts.push(cont);
      dieGs.push(dg);
      drawDie(dg, 1, false);

      const hg = this.add.graphics().setPosition(dx, HIST_Y);
      histGs.push(hg);

      /* Etiqueta de cara (1-6) bajo cada barra */
      for (let f = 0; f < 6; f++) {
        const lblX = dx + (f * 8 - 16.5);
        pzPopIn(this, this.add.text(lblX, FACE_LBL_Y, `${f+1}`, {
          fontFamily:'Poppins', fontSize:'7px', color:'#4a5a6a'
        }).setOrigin(0.5), 950 + i*60);
      }

      pzPopIn(this, this.add.text(dx, LBL_Y, `Dado ${i+1}`, {
        fontFamily:'Poppins', fontSize:'8px', color:'#3a4a5a'
      }).setOrigin(0.5), 900 + i*60);

      /* Selección: dado clickeable en cualquier momento */
      const selHit = this.add.rectangle(dx, CY, SIZE+8, SIZE+8, 0, 0)
        .setDepth(4).setInteractive({ useHandCursor:true });
      selHits.push(selHit);
      selHit.on('pointerup', () => {
        if (locked) return;
        if (sel.has(i)) sel.delete(i);
        else if (sel.size < p.nLoaded) sel.add(i);
        const lastF = history[i].length ? history[i][history[i].length-1] : 1;
        drawDie(dieGs[i], lastF, sel.has(i));
      });

      cont.setAlpha(0); cont.y = CY - 110; cont.angle = -150;
      this.tweens.add({
        targets:cont, alpha:1, y:CY, angle:0,
        duration:570, delay:280 + i*80, ease:'Bounce.easeOut'
      });
    });

    /* ── Status text ── */
    const statTxt = this.add.text(w/2, STAT_Y,
      'Lanza las veces que quieras y toca el/los dado(s) que creas trucado(s).', {
      fontFamily:'Poppins', fontSize:'11px', color:'#5a6878', align:'center'
    }).setOrigin(0.5);

    /* Premio/castigo inmediato (fase descubrimiento) */
    const awardImmediate = (delta) => {
      if (typeof ptsAdd === 'function') ptsAdd(delta, modeKey);
      const ft = this.add.text(w/2 + 150, STAT_Y, `${delta>=0?'+':'-'}${Math.abs(delta)} pts`, {
        fontFamily:'Cinzel', fontSize:'15px', fontStyle:'700',
        color: delta>=0 ? '#50e890' : '#e06060'
      }).setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets:ft, y:ft.y-26, alpha:0, duration:1200,
        ease:'Quad.easeOut', onComplete:()=>ft.destroy() });
    };

    /* ── showQuestion (phase 2) ── */
    const showQuestion = () => {
      const qTxt = this.add.text(w/2, Q_Y,
        `?Cual es la probabilidad de obtener la cara ${p.prim.face} con el dado trucado?`, {
        fontFamily:'Cinzel', fontSize:'13px', color:'#70c8e0', fontStyle:'600',
        align:'center', wordWrap:{ width:590 }
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets:qTxt, alpha:1, duration:420 });
      this.time.delayedCall(350, () => {
        pzButtons(this, p.opts, OPTS_Y, (a) => {
          pzResult(this, a.ok, p.explain, PUZZLE_CATALOG[4].recompensa.hp, 4);
        });
      });
    };

    /* ── checkAnswer ── */
    const checkAnswer = () => {
      if (locked) return;
      if (sel.size !== p.nLoaded) {
        statTxt.setText(`Selecciona ${p.nLoaded} dado${pl?'s':''} antes de certificar.`);
        statTxt.setColor('#D4AF37');
        return;
      }
      const ok = p.positions.every(pos => sel.has(pos)) && sel.size === p.nLoaded;
      if (ok) {
        locked = true;
        selHits.forEach(hit => hit.removeInteractive());
        showConf(false);
        awardImmediate(discPts);
        pzBurst(this, w/2, CY, [0x70c8e0, 0xD4AF37, 0xffffff], 26, 10, 6);
        statTxt.setText('Correcto! Dado trucado descubierto. Ahora responde la probabilidad.');
        statTxt.setColor('#50e890');
        this.time.delayedCall(600, showQuestion);
      } else {
        wrongPicks++;
        awardImmediate(-discPts);
        statTxt.setText('Incorrecto. Pierdes puntos. Sigue lanzando: el patron se revelara.');
        statTxt.setColor('#e06060');
        sel.clear();
        p.dice.forEach((_, i) => {
          const lastF = history[i].length ? history[i][history[i].length-1] : 1;
          drawDie(dieGs[i], lastF, false);
        });
        this.time.delayedCall(1800, () => {
          if (locked) return;
          statTxt.setText('Lanza las veces que quieras y toca el/los dado(s) trucado(s).');
          statTxt.setColor('#5a6878');
        });
      }
    };

    /* ── Confirm button ── */
    const confG   = this.add.graphics().setAlpha(0).setDepth(5);
    const confTxt = this.add.text(w/2, AUX_Y, 'Certificar dado', {
      fontFamily:'Cinzel', fontSize:'13px', color:'#D4AF37', fontStyle:'700'
    }).setOrigin(0.5).setAlpha(0).setDepth(5);
    const confHit = this.add.rectangle(w/2, AUX_Y, 220, 34, 0, 0).setDepth(6);

    const drawConfBtn = (hov) => {
      confG.clear();
      confG.fillStyle(0x1a2810, hov ? 0.95 : 0.7);
      confG.fillRoundedRect(w/2-110, AUX_Y-17, 220, 34, 8);
      confG.lineStyle(2, 0xD4AF37, hov ? 1 : 0.6);
      confG.strokeRoundedRect(w/2-110, AUX_Y-17, 220, 34, 8);
    };
    const showConf = (show) => {
      if (show) {
        drawConfBtn(false);
        confG.setAlpha(1); confTxt.setAlpha(1);
        confHit.setInteractive({ useHandCursor:true });
      } else {
        confG.setAlpha(0); confTxt.setAlpha(0);
        confHit.removeInteractive();
      }
    };
    confHit.on('pointerover', () => drawConfBtn(true));
    confHit.on('pointerout',  () => drawConfBtn(false));
    confHit.on('pointerup',   checkAnswer);
    showConf(true);   // botón siempre presente: jugador puede certificar cuando quiera

    /* ── Roll button ── */
    pzActionBtn(this, w/2, ROLL_Y, 'Lanzar todos', 0x70c8e0, () => {
      if (locked || busy) return;
      busy = true;
      rollCount++;
      snd_diceRoll && snd_diceRoll();
      this.cameras.main.shake(70, 0.004);

      p.dice.forEach((die, i) => {
        const res = this._roll(die);
        history[i].push(res);
        this.tweens.add({
          targets:conts[i], scaleX:1.1, scaleY:1.1,
          duration:60, yoyo:true, delay:i*18
        });
        let t = 0;
        this.time.addEvent({ delay:44, repeat:12, callback:() => {
          t++;
          drawDie(dieGs[i], t < 12 ? (Math.floor(Math.random()*6)+1) : res, sel.has(i));
          if (t >= 12) {
            drawHist(histGs[i], i);
            if (i === 5) busy = false;
          }
        }});
      });

      if (rollCount === 3) {
        this.time.delayedCall(650, () => {
          if (locked || sel.size > 0) return;
          statTxt.setText(
            `Ya notas algo? Toca ${pl ? `los ${p.nLoaded} dados` : 'el dado'} que crees trucado${pl?'s':''}.`
          );
          statTxt.setColor('#D4AF37');
        });
      }
    });
  }
}
