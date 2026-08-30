/* ══════════════════════════════════════
   PuzzleTesoro — Mapa del Tesoro (Árbol de Rutas)
   Concepto: combinatoria / conteo de casos favorables.
     · Rutas totales = producto de las ramas de cada nivel (regla del producto).
     · El jugador revela cada cofre-hoja (vacío / tesoro) → cuenta casos.
     · Arma la fracción favorables/total con +/-  (sin elegir entre opciones).
══════════════════════════════════════ */

class PuzzleTesoro extends Phaser.Scene {
  constructor() { super('PuzzleTesoro'); }

  init(d) {
    this._data = d || {};
    this._cfg  = this._gen(this._data.dificultad || 'normal');
  }

  _gen(dif) {
    const table = {
      facil:      { levels:[2,2],   tes:1 },
      normal:     { levels:[2,3],   tes:2 },
      heroe:      { levels:[2,2,2], tes:3 },
      legendario: { levels:[3,3],   tes:3 },
    };
    const c = table[dif] || table.normal;
    const total = c.levels.reduce((a,b) => a*b, 1);
    /* elegir hojas con tesoro (distintas) */
    const idx = _shuffle([...Array(total).keys()]).slice(0, Math.min(c.tes, total));
    return { levels:c.levels, total, tes:c.tes, treasureLeaves:new Set(idx) };
  }

  create() {
    const { w, h } = pzBg(this, 'oraculo');
    this._w = w; this._h = h;
    pzHeader(this, 'Mapa del Tesoro', 'oraculo', w);

    const c = this._cfg;
    pzInfoButton(this, 'oraculo', 'Mapa del Tesoro', [
      '◆ El tema: combinatoria y conteo de casos',
      'Para hallar una probabilidad hay que contar bien: cuántos resultados',
      'favorables hay y cuántos resultados posibles hay en total.',
      '',
      '◆ El minijuego',
      'Un árbol de rutas baja desde la entrada hasta los cofres. Cada nivel',
      'se ramifica. Revisás cada cofre del final y contás cuántos tienen tesoro.',
      '',
      '◆ Qué se espera de vos',
      'Tocá TODOS los cofres para revelarlos. Después armá la fracción:',
      'cofres con tesoro (arriba) sobre rutas totales (abajo).',
      '',
      '◆ Consejos',
      `• Rutas totales = ramas multiplicadas: ${c.levels.join(' × ')} = ${c.total} (regla del producto).`,
      '• El total NO se suma: se multiplica por cada bifurcación del camino.',
      '• Favorables = cuántos cofres tienen tesoro; total = cuántas rutas hay.',
    ]);

    this._prompt = this.add.text(w/2, 96,
      'Tocá cada cofre al final de las rutas para revisarlo.', {
      fontFamily:'Cinzel', fontSize:'14px', color:'#70c8e0',
      fontStyle:'600', align:'center', wordWrap:{ width:w*0.85 }
    }).setOrigin(0.5);

    /* Contadores en vivo */
    this._revealed = 0;
    this._foundTes = 0;
    this._cntTxt = this.add.text(w/2, 122, '', {
      fontFamily:'Poppins', fontSize:'12px', color:'#9ab0c0'
    }).setOrigin(0.5);
    this._updateCounters();

    /* Árbol */
    this._buildTree();
  }

  _updateCounters() {
    this._cntTxt.setText(
      `Cofres revisados: ${this._revealed} / ${this._cfg.total}     ·     Con tesoro: ${this._foundTes}`
    );
  }

  /* ══ Construcción de datos del árbol ══ */
  _treeData(levels) {
    const D = levels.length;
    const byLevel = [[{ children:[], level:0 }]];
    for (let l = 0; l < D; l++) {
      const next = [];
      byLevel[l].forEach(p => {
        for (let k = 0; k < levels[l]; k++) {
          const c = { children:[], level:l+1, parent:p };
          p.children.push(c); next.push(c);
        }
      });
      byLevel.push(next);
    }
    const leaves = byLevel[D];
    const xL = 110, xR = this._w - 110;
    leaves.forEach((lf, i) => {
      lf.x = leaves.length === 1 ? this._w/2 : xL + (xR - xL) * i / (leaves.length - 1);
      lf.leafIndex = i;
    });
    const yTop = 168, yBot = 392;
    for (let l = 0; l <= D; l++) {
      const y = D === 0 ? yTop : yTop + (yBot - yTop) * l / D;
      byLevel[l].forEach(n => n.y = y);
    }
    for (let l = D - 1; l >= 0; l--) {
      byLevel[l].forEach(n => {
        n.x = n.children.reduce((s, ch) => s + ch.x, 0) / n.children.length;
      });
    }
    return { byLevel, leaves, D };
  }

  _buildTree() {
    const { byLevel, leaves, D } = this._treeData(this._cfg.levels);
    this._leafObjs = [];

    /* Aristas (detrás) */
    const edges = this.add.graphics().setDepth(1).setAlpha(0);
    const drawEdges = (prog) => {
      edges.clear();
      edges.lineStyle(2, 0x2a5070, 0.55);
      byLevel.forEach(level => level.forEach(n => {
        if (!n.parent) return;
        const px = n.parent.x, py = n.parent.y;
        const ex = px + (n.x - px) * prog, ey = py + (n.y - py) * prog;
        edges.lineBetween(px, py, ex, ey);
      }));
    };
    const ep = { v: 0 };
    this.tweens.add({ targets:edges, alpha:1, duration:300 });
    this.tweens.add({ targets:ep, v:1, duration:700, delay:200, ease:'Cubic.easeOut',
      onUpdate:() => drawEdges(ep.v) });

    /* Raíz */
    const root = byLevel[0][0];
    const rootG = this.add.container(root.x, root.y).setDepth(3);
    const rg = this.add.graphics();
    rg.fillStyle(0x0e2a3a, 0.95); rg.fillCircle(0, 0, 16);
    rg.lineStyle(2, 0x70c8e0, 0.8); rg.strokeCircle(0, 0, 16);
    const rTxt = this.add.text(0, 0, '🚩', { fontSize:'16px' }).setOrigin(0.5);
    rootG.add([rg, rTxt]);
    pzPopIn(this, rootG, 200, 14);
    const rLbl = this.add.text(root.x, root.y - 26, 'Entrada', {
      fontFamily:'Poppins', fontSize:'10px', color:'#7a8a98'
    }).setOrigin(0.5);
    pzPopIn(this, rLbl, 260, 8);

    /* Nodos internos (bifurcaciones) */
    for (let l = 1; l < D; l++) {
      byLevel[l].forEach((n, i) => {
        const dot = this.add.graphics().setDepth(2);
        dot.fillStyle(0x1a3048, 0.95); dot.fillCircle(n.x, n.y, 6);
        dot.lineStyle(1.5, 0x3a6088, 0.7); dot.strokeCircle(n.x, n.y, 6);
        dot.setAlpha(0);
        this.tweens.add({ targets:dot, alpha:1, duration:300, delay:500 + l*120 + i*40 });
      });
    }

    /* Hojas = cofres interactivos */
    leaves.forEach((lf, i) => {
      const isTes = this._cfg.treasureLeaves.has(lf.leafIndex);
      const cont  = this.add.container(lf.x, lf.y).setDepth(4);
      const g     = this.add.graphics();
      cont.add(g);
      const obj = { cont, g, isTes, revealed:false };
      this._drawChest(obj, 'closed');
      cont.add(this.add.text(0, 26, `R${i+1}`, {
        fontFamily:'Poppins', fontSize:'8px', color:'#5a6a78'
      }).setOrigin(0.5));

      cont.setInteractive(new Phaser.Geom.Rectangle(-20, -22, 40, 44), Phaser.Geom.Rectangle.Contains, { useHandCursor:true });
      cont.input.cursor = 'pointer';
      cont.on('pointerover', () => { if (!obj.revealed) this.tweens.add({ targets:cont, scaleX:1.12, scaleY:1.12, duration:120 }); });
      cont.on('pointerout',  () => { if (!obj.revealed) this.tweens.add({ targets:cont, scaleX:1, scaleY:1, duration:120 }); });
      cont.on('pointerup',   () => this._revealChest(obj, lf.x, lf.y));

      cont.setAlpha(0); cont.y = lf.y + 20; cont.setScale(0.8);
      this.tweens.add({ targets:cont, alpha:1, y:lf.y, scaleX:1, scaleY:1,
        duration:420, delay:700 + i*70, ease:'Back.easeOut' });

      this._leafObjs.push(obj);
    });
  }

  _drawChest(obj, state) {
    const g = obj.g; g.clear();
    if (state === 'closed') {
      /* Cofre cerrado (madera) */
      g.fillStyle(0x000000, 0.3); g.fillEllipse(0, 16, 34, 8);
      g.fillStyle(0x5a3a1a, 1); g.fillRoundedRect(-16, -4, 32, 18, 3);
      g.fillStyle(0x4a2e14, 1); g.fillRoundedRect(-16, -13, 32, 11, 4);
      g.lineStyle(1.5, 0x8a6838, 0.9); g.strokeRoundedRect(-16, -13, 32, 27, 4);
      g.fillStyle(0xD4AF37, 0.9); g.fillRect(-3, -2, 6, 7);   // cerradura
      g.fillStyle(0x2a1a0a, 1); g.fillCircle(0, 1, 1.4);
      return;
    }
    /* Abierto */
    g.fillStyle(0x000000, 0.3); g.fillEllipse(0, 16, 34, 8);
    g.fillStyle(0x3a2410, 1); g.fillRoundedRect(-16, -2, 32, 16, 3);
    g.lineStyle(1.5, 0x6a4824, 0.9); g.strokeRoundedRect(-16, -2, 32, 16, 3);
    /* Tapa abierta hacia atrás */
    g.fillStyle(0x4a2e14, 1); g.fillRoundedRect(-16, -20, 32, 9, 3);
    if (obj.isTes) {
      g.fillStyle(0xD4AF37, 0.25); g.fillCircle(0, 4, 18);
      g.fillStyle(0xF5D97A, 1);
      g.fillCircle(-6, 6, 3.5); g.fillCircle(2, 7, 3.5); g.fillCircle(7, 4, 3); g.fillCircle(-1, 3, 3);
      g.fillStyle(0xffffff, 0.6); g.fillCircle(-6, 5, 1.2);
    } else {
      g.lineStyle(2, 0x3a4450, 0.7);
      g.lineBetween(-6, 1, 6, 9); g.lineBetween(6, 1, -6, 9);
    }
  }

  _revealChest(obj, x, y) {
    if (obj.revealed || this._answering) return;
    obj.revealed = true;
    snd_item && snd_item();
    /* flip */
    this.tweens.add({ targets:obj.cont, scaleX:0, duration:130, ease:'Quad.easeIn',
      onComplete:() => {
        this._drawChest(obj, 'open');
        this.tweens.add({ targets:obj.cont, scaleX:1, duration:160, ease:'Back.easeOut' });
      }});

    this._revealed++;
    if (obj.isTes) {
      this._foundTes++;
      snd_buff && snd_buff();
      pzBurst(this, x, y - 4, [0xD4AF37, 0xF5D97A, 0xffffff], 18, 10, 4);
      const t = this.add.text(x, y - 22, '💎', { fontSize:'16px' }).setOrigin(0.5).setDepth(6).setAlpha(0);
      this.tweens.add({ targets:t, alpha:1, y:y - 34, duration:500, yoyo:true, hold:300,
        onComplete:() => t.destroy() });
    }
    this._updateCounters();

    if (this._revealed >= this._cfg.total) {
      this.time.delayedCall(450, () => this._openAnswer());
    }
  }

  /* ══ Fase de respuesta: armar la fracción ══ */
  _openAnswer() {
    this._answering = true;
    const w = this._w;
    this._prompt.setText('Armá la fracción: cofres con tesoro sobre rutas totales.');

    this._num = 0;
    this._den = 0;
    const cy = 470;

    /* Línea de fracción central */
    const fx = w/2;
    const line = this.add.graphics().setDepth(5);
    line.lineStyle(3, 0x70c8e0, 0.9);
    line.lineBetween(fx - 46, cy, fx + 46, cy);

    this._numTxt = this.add.text(fx, cy - 30, '0', {
      fontFamily:'Cinzel', fontSize:'30px', color:'#F5D97A', fontStyle:'700'
    }).setOrigin(0.5).setDepth(5);
    this._denTxt = this.add.text(fx, cy + 30, '0', {
      fontFamily:'Cinzel', fontSize:'30px', color:'#aae4f4', fontStyle:'700'
    }).setOrigin(0.5).setDepth(5);

    /* Etiquetas */
    this.add.text(fx + 70, cy - 30, 'tesoros', {
      fontFamily:'Poppins', fontSize:'11px', color:'#8a9ab0'
    }).setOrigin(0, 0.5).setDepth(5);
    this.add.text(fx + 70, cy + 30, 'rutas totales', {
      fontFamily:'Poppins', fontSize:'11px', color:'#8a9ab0'
    }).setOrigin(0, 0.5).setDepth(5);

    /* Steppers +/- a la izquierda */
    this._stepper(fx - 120, cy - 30, () => this._num,
      v => { this._num = Phaser.Math.Clamp(v, 0, this._cfg.total); this._numTxt.setText('' + this._num); });
    this._stepper(fx - 120, cy + 30, () => this._den,
      v => { this._den = Phaser.Math.Clamp(v, 0, this._cfg.total); this._denTxt.setText('' + this._den); });

    /* Botón confirmar */
    const by = 560;
    const bg = this.add.graphics().setDepth(5);
    const drawB = (hov) => {
      bg.clear();
      bg.fillStyle(0x0e2a3a, hov ? 0.96 : 0.82);
      bg.fillRoundedRect(w/2 - 110, by - 22, 220, 44, 10);
      bg.lineStyle(2, 0x70c8e0, hov ? 1 : 0.7);
      bg.strokeRoundedRect(w/2 - 110, by - 22, 220, 44, 10);
    };
    drawB(false);
    const bt = this.add.text(w/2, by, '✓ Confirmar respuesta', {
      fontFamily:'Cinzel', fontSize:'15px', color:'#9ad8f0', fontStyle:'700'
    }).setOrigin(0.5).setDepth(6);
    const hit = this.add.rectangle(w/2, by, 220, 44, 0, 0).setDepth(7).setInteractive({ useHandCursor:true });
    hit.on('pointerover', () => { drawB(true); bt.setColor('#cdeefb'); snd_item && snd_item(); });
    hit.on('pointerout',  () => { drawB(false); bt.setColor('#9ad8f0'); });
    hit.on('pointerup',   () => this._confirm());

    /* Entrada animada del bloque respuesta */
    [line, this._numTxt, this._denTxt, bg, bt].forEach(o => {
      o.setAlpha(0);
      this.tweens.add({ targets:o, alpha:1, duration:400, delay:120 });
    });
  }

  _stepper(cx, cy, get, set) {
    const mk = (dx, label, delta) => {
      const g = this.add.graphics().setDepth(5);
      const draw = (hov) => {
        g.clear();
        g.fillStyle(0x122436, hov ? 0.96 : 0.8);
        g.fillCircle(cx + dx, cy, 15);
        g.lineStyle(1.5, 0x70c8e0, hov ? 1 : 0.6);
        g.strokeCircle(cx + dx, cy, 15);
      };
      draw(false);
      const t = this.add.text(cx + dx, cy - 1, label, {
        fontFamily:'Cinzel', fontSize:'20px', color:'#9ad8f0', fontStyle:'700'
      }).setOrigin(0.5).setDepth(6);
      const hit = this.add.circle(cx + dx, cy, 17, 0, 0).setDepth(7).setInteractive({ useHandCursor:true });
      hit.on('pointerover', () => draw(true));
      hit.on('pointerout',  () => draw(false));
      hit.on('pointerup',   () => {
        snd_item && snd_item();
        set(get() + delta);
        this.tweens.add({ targets:t, scaleX:1.3, scaleY:1.3, duration:90, yoyo:true });
      });
      [g, t].forEach(o => { o.setAlpha(0); this.tweens.add({ targets:o, alpha:1, duration:400, delay:120 }); });
    };
    mk(-34, '−', -1);
    mk(34,  '+', +1);
  }

  _confirm() {
    if (!this._answering || this._done) return;
    this._done = true;
    const total = this._cfg.total;
    const tes   = this._cfg.tes;
    const correct = (this._num === tes && this._den === total);

    const explain =
      `Rutas totales = ${this._cfg.levels.join(' × ')} = ${total} (regla del producto).\n` +
      `Cofres con tesoro = ${tes}.\n` +
      `P(tesoro por una ruta al azar) = ${tes}/${total} = ${_frac(tes, total)}`;

    const hp = (typeof PUZZLE_CATALOG !== 'undefined' && PUZZLE_CATALOG[6])
      ? PUZZLE_CATALOG[6].recompensa.hp : 20;
    pzResult(this, correct, explain, hp, 6);
  }
}
