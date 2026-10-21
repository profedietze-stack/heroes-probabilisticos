/* ══════════════════════════════════════
   PuzzleApuesta — Apuesta del Mercader
   Concepto: valor esperado E(X) = P*ganancia - (1-P)*pérdida
══════════════════════════════════════ */

class PuzzleApuesta extends Phaser.Scene {
  constructor() { super('PuzzleApuesta'); }

  init(d) {
    this._data = d;
    this._evRevelado = false;   // Phaser reutiliza la instancia: la bandera se reinicia acá, no en create()
    this._prob = this._gen(d.dificultad || 'normal');
  }

  _gen(dif) {
    /* El tipo se DERIVA del E(X) real (ver abajo), no se escribe a mano. */
    const bets = {
      facil: [
        {pN:1,pD:2,pago:3,gan:8,   desc:'una moneda justa (cara)'},          // EV=+2.5 favorable
        {pN:1,pD:2,pago:6,gan:6,   desc:'una moneda justa (cara)'},          // EV= 0   neutro
        {pN:1,pD:3,pago:6,gan:6,   desc:'sacar 1 en dado de 3 caras'},       // EV=-2   desfavorable
      ],
      normal: [
        {pN:2,pD:6,pago:3,gan:10,  desc:'sacar 1 o 2 en dado de 6'},         // EV=+1.33 favorable
        {pN:3,pD:6,pago:6,gan:6,   desc:'número par en dado de 6'},          // EV= 0    neutro
        {pN:1,pD:6,pago:4,gan:8,   desc:'sacar un 6 en dado de 6'},          // EV=-2    desfavorable
        {pN:1,pD:4,pago:3,gan:12,  desc:'extraer la bola dorada (1 de 4)'},  // EV=+0.75 favorable
      ],
      heroe: [
        {pN:3,pD:8, pago:5,gan:12, desc:'sacar rojo en ruleta de 8 (3/8)'},  // EV=+1.375 favorable
        {pN:1,pD:3, pago:6,gan:9,  desc:'sacar la runa marcada (1 de 3)'},    // EV=-1     desfavorable
        {pN:2,pD:9, pago:6,gan:12, desc:'dos azules de 9 bolas (2/9)'},      // EV=-2     desfavorable
        {pN:1,pD:2, pago:5,gan:11, desc:'cara o cruz (1/2)'},                // EV=+3     favorable
        {pN:2,pD:5, pago:6,gan:9,  desc:'dos rojas de 5 bolas (2/5)'},       // EV= 0     neutro
      ],
      legendario: [
        {pN:5,pD:18,pago:8,gan:16, desc:'sacar rojo de 18 (5/18)'},          // EV=-1.33 desfavorable
        {pN:7,pD:16,pago:6,gan:16, desc:'dado de 16 cae ≤ 7 (7/16)'},        // EV=+3.63  favorable
        {pN:9,pD:18,pago:6,gan:6,  desc:'mitad de 18 (9/18)'},               // EV= 0    neutro
      ],
    };
    const pool = bets[dif] || bets.normal;
    /* Tipo coherente con E(X): >0 favorable, <0 desfavorable, ≈0 neutro */
    const _tipoDe = (x) => {
      const p = x.pN / x.pD;
      const e = +(p * x.gan - (1 - p) * x.pago).toFixed(2);
      return e > 0.02 ? 'favorable' : e < -0.02 ? 'desfavorable' : 'neutro';
    };
    /* Se sortea PRIMERO el tipo y después una apuesta de ese tipo. Sortear la
       apuesta dejaba la respuesta en "Favorable" el 50 % de las veces
       (normal: 2 de 4 apuestas; héroe: 2 de 4 y ninguna neutra), así que
       contestar siempre lo mismo acertaba medio banco. */
    const tipos = [...new Set(pool.map(_tipoDe))];
    const tipoSorteado = tipos[Math.floor(Math.random()*tipos.length)];
    const delTipo = pool.filter(x => _tipoDe(x) === tipoSorteado);
    const b    = { ...delTipo[Math.floor(Math.random()*delTipo.length)] };
    const prob = b.pN / b.pD;
    const ev   = +(prob * b.gan - (1 - prob) * b.pago).toFixed(2);
    b.tipo = _tipoDe(b);
    const evStr = ev > 0 ? `+${ev}` : `${ev}`;
    const explain =
      `E(X) = (${b.pN}/${b.pD}) × ${b.gan} − (${b.pD-b.pN}/${b.pD}) × ${b.pago} = ${evStr} monedas\n` +
      (b.tipo==='favorable'   ? 'EV > 0 → ¡La apuesta es favorable!' :
       b.tipo==='desfavorable'? 'EV < 0 → La apuesta no conviene.' :
                                'EV = 0 → Apuesta justa (neutra).');
    const opts = _shuffle([
      {label:'Favorable',           ok: b.tipo==='favorable'},
      {label:'Desfavorable',        ok: b.tipo==='desfavorable'},
      {label:'Neutro',              ok: b.tipo==='neutro'},
      {label:'No se puede calcular',ok: false},
    ]);
    return { ...b, ev, evStr, explain, opts };
  }

  create() {
    // Teléfono: contrato y simulación a la izquierda (ventana de ilustración); medidor, pregunta y respuestas a la derecha.
    const _Z = pzCompacto(this) ? pzZonas(this, false) : null;
    const pz = _Z && pzCompactoInit(this, { x:_Z.ill.x, y:_Z.ill.y, w:_Z.ill.w, h:_Z.ill.h });
    const {w,h} = pzBg(this, 'mercader');
    pzHeader(this, 'Apuesta del Mercader', 'mercader', w);
    const p = this._prob;

    this._simTotal  = 0;
    this._rollsDone = 0;
    this._maxRolls  = 3;
    this._rolling   = false;
    this._slotW = 164; this._slotH = 20; this._dieS = 40;
    if (pz) {
      this._buildInfo(w, h);
      this._createMovil(p, w, h);
      pzCompactoFin(this);
      return;
    }

    /* Botón info + overlay */
    this._buildInfo(w, h);

    /* Explicación breve sobre el contrato */
    pzPopIn(this, this.add.text(w/2, 92,
      'El Mercader te ofrece un contrato. Probá el dado, calculá su valor esperado y decidí si firmar.', {
      fontFamily:'Poppins', fontSize:'11px', color:'#8a9ab0', align:'center', wordWrap:{ width:w*0.7 }
    }).setOrigin(0.5), 60);

    this._drawContract(w/2, 158, p, w);

    /* Divisor vertical sutil entre columnas */
    const divG = this.add.graphics().setAlpha(0);
    divG.lineStyle(1, 0x1a2838, 0.45);
    divG.lineBetween(502, 208, 502, 524);
    this.tweens.add({ targets: divG, alpha: 1, duration: 600, delay: 900 });

    this._buildSimLeft(258, p);
    this._buildInfoRight(738, p);
    this._buildBottom(w, p);
  }

  /* ══ Teléfono: contrato + simulación a la izquierda; valor esperado, pregunta y respuestas a la derecha ══ */
  _createMovil(p, w, h) {
    const Z = this._pz.Z, L = Z.ill, U = Z.ui;
    const cxL = L.x + L.w/2, xR = U.x + U.w/2;

    /* ── Izquierda: contrato ── */
    this._drawContractMovil(cxL, L.y + 54, p, Math.min(372, L.w - 8));   // el contrato entra en la columna (667×375: ~310 px)

    /* Barra de probabilidad */
    this._drawProbBar(cxL, L.y + 120, p, 300, 20, '13px');

    /* Dado (a la izquierda) y 3 resultados (a la derecha) */
    const dieX = L.x + 66, dieY = L.y + 184;
    this._dieS = 28;
    this._dieCont = this.add.container(dieX, dieY).setDepth(5);
    this._dieG    = this.add.graphics();
    this._dieCont.add(this._dieG);
    this._dieFace = 6;
    this._dieHl   = 'idle';
    this._redrawDie();
    this.tweens.add({ targets: this._dieCont, angle: { from:-3, to:3 },
      duration: 2000, yoyo:true, repeat:-1, ease:'Sine.easeInOut', delay:1200 });
    this._dieLbl = this.add.text(dieX, dieY + 50, 'Probá el dado', {
      fontFamily:'Poppins', fontSize:'13px', color:'#9aaabb', align:'center'
    }).setOrigin(0.5).setDepth(4).setAlpha(0);
    this.tweens.add({ targets: this._dieLbl, alpha: 1, duration: 400, delay: 1100 });

    this._slotW = 220; this._slotH = 26;
    const sx = L.x + L.w - 124;
    this._slots = [];
    for (let i = 0; i < 3; i++) {
      const ry = L.y + 156 + i * 30;
      const sc = this.add.container(sx, ry).setDepth(4).setAlpha(0);
      const sg = this.add.graphics();
      sg.fillStyle(0x0a1020, 0.5);
      sg.fillRoundedRect(-110, -13, 220, 26, 5);
      sg.lineStyle(1, 0x3a4a5a, 0.55);
      sg.strokeRoundedRect(-110, -13, 220, 26, 5);
      const st = this.add.text(0, 0, `Tirada ${i+1}: —`, {
        fontFamily:'Poppins', fontSize:'14px', color:'#8a9aab'
      }).setOrigin(0.5);
      sc.add([sg, st]);
      this._slots.push({ cont: sc, g: sg, t: st });
    }
    this._totalBg = this.add.graphics().setDepth(3).setAlpha(0);
    this._totalBg.fillStyle(0x080e1a, 0.82);
    this._totalBg.fillRoundedRect(sx-110, L.y + 246, 220, 28, 7);
    this._totalBg.lineStyle(1.5, 0x3a4e62, 0.7);
    this._totalBg.strokeRoundedRect(sx-110, L.y + 246, 220, 28, 7);
    this._totalTxt = this.add.text(sx, L.y + 260, 'Total: 0 💰', {
      fontFamily:'Cinzel', fontSize:'14px', color:'#7a98b0', fontStyle:'700'
    }).setOrigin(0.5).setDepth(4).setAlpha(0);

    /* Botón lanzar (46 px) */
    this._rollBtn = pzActionBtn(this, cxL, L.y + 298, '🎲  Lanzar dado', 0xD4AF37, () => this._doRoll(p));

    /* ── Derecha: valor esperado, pregunta y respuestas (interfaz fija) ── */
    pzFijo(this, () => {
      pzPopIn(this, this.add.text(xR, U.y + 8, 'E(X) = P(ganar)×ganancia − P(perder)×pérdida', {
        fontFamily:'Poppins', fontSize:'13px', color:'#9fb4c8', align:'center', wordWrap:{ width: U.w - 8 }
      }).setOrigin(0.5, 0), 700);
      this._drawEVMeter(xR, U.y + 60, p);
      pzPreguntaMovil(this, [
        { txt:'¿Esta apuesta es favorable, desfavorable o neutra?', fam:'Cinzel', color:'#D4AF37', estilo:'600', size:'15px' },
      ], U.y + 132);
      pzButtons(this, p.opts, 0, (a) => { this._signDecision(p, a.ok); });
    });
  }

  /* Contrato del teléfono: 4 renglones de 13 px */
  _drawContractMovil(cx, cy, p, ancho) {
    const sw = ancho || 372, sh = 94, sx = -sw/2, sy = -sh/2;
    const cont = this.add.container(cx, cy);
    const g = this.add.graphics();
    g.fillGradientStyle(0x352607, 0x352607, 0x231803, 0x231803, 0.97);
    g.fillRoundedRect(sx, sy, sw, sh, 8);
    g.lineStyle(1.5, 0x8a6828, 0.85);
    g.strokeRoundedRect(sx, sy, sw, sh, 8);
    g.lineStyle(1, 0xD4AF37, 0.18);
    g.strokeRoundedRect(sx+4, sy+4, sw-8, sh-8, 6);
    cont.add(g);
    const mk = (x, y, txt, col, fam, extra) => this.add.text(x, y, txt, Object.assign({
      fontFamily: fam || 'Poppins', fontSize:'13px', color: col, align:'center', wordWrap:{ width: sw - 30 }
    }, extra || {})).setOrigin(0.5);
    const t1 = mk(0, sy+14, '⚔  Contrato de Apuesta  ⚔', '#F5D97A', 'Cinzel', { fontStyle:'600', letterSpacing:1 });
    const t2 = mk(0, sy+36, `Condición: ${p.desc}`, '#e6c888');
    const t3 = mk(-sw*0.31, sy+62, `P(ganar): ${p.pN}/${p.pD}`, '#9cc2dc');
    const t4 = mk(0, sy+62, `💰 Ganás: +${p.gan}`, '#58e868');
    const t5 = mk(sw*0.31, sy+62, `💸 Perdés: −${p.pago}`, '#f07878');
    const t6 = mk(0, sy+82, `E(X) = (${p.pN}/${p.pD})×${p.gan} − (${p.pD-p.pN}/${p.pD})×${p.pago}`, '#8aa0b0');
    const texts = [t1,t2,t3,t4,t5,t6];
    texts.forEach(t => { t.setAlpha(0); cont.add(t); });
    cont.scaleY = 0.04; cont.setAlpha(0);
    this.tweens.add({ targets: cont, scaleY: 1, alpha: 1, duration: 520, ease: 'Back.easeOut',
      onComplete: () => texts.forEach((t,i) => this.tweens.add({ targets: t, alpha: 1, duration: 270, delay: i*55 })) });
  }

  /* ══ Contrato compacto (tira superior, ancho completo) ══ */
  _drawContract(cx, cy, p, w) {
    const sw = Math.min(690, w * 0.88), sh = 86;
    const sx = -sw/2, sy = -sh/2;
    const cont = this.add.container(cx, cy);

    const g = this.add.graphics();
    g.fillGradientStyle(0x352607, 0x352607, 0x231803, 0x231803, 0.97);
    g.fillRoundedRect(sx, sy, sw, sh, 8);
    g.lineStyle(1.5, 0x8a6828, 0.85);
    g.strokeRoundedRect(sx, sy, sw, sh, 8);
    g.lineStyle(1, 0xD4AF37, 0.18);
    g.strokeRoundedRect(sx+4, sy+4, sw-8, sh-8, 6);

    /* Rolos laterales */
    const rg = this.add.graphics();
    rg.fillStyle(0x4a3210, 1);
    rg.fillRoundedRect(sx-11, sy-6, 19, sh+12, 7);
    rg.fillRoundedRect(sx+sw-8, sy-6, 19, sh+12, 7);
    rg.fillStyle(0x6a4818, 1);
    rg.fillRoundedRect(sx-8, sy-3, 13, sh+6, 4);
    rg.fillRoundedRect(sx+sw-5, sy-3, 13, sh+6, 4);
    rg.lineStyle(1, 0xD4AF37, 0.28);
    rg.strokeRoundedRect(sx-11, sy-6, 19, sh+12, 7);
    rg.strokeRoundedRect(sx+sw-8, sy-6, 19, sh+12, 7);
    cont.add([g, rg]);

    const t1 = this.add.text(0, sy+13, '⚔  Contrato de Apuesta  ⚔', {
      fontFamily:'Cinzel', fontSize:'11px', color:'#F5D97A', fontStyle:'600', letterSpacing:2
    }).setOrigin(0.5);
    const t2 = this.add.text(0, sy+32, `Condición: ${p.desc}`, {
      fontFamily:'Poppins', fontSize:'11px', color:'#d8b870', align:'center', wordWrap:{width:sw-90}
    }).setOrigin(0.5);
    const t3 = this.add.text(-sw*0.28, sy+57, `P(ganar): ${p.pN}/${p.pD}`, {
      fontFamily:'Poppins', fontSize:'11px', color:'#88b0cc'
    }).setOrigin(0.5);
    const t4 = this.add.text(0, sy+57, `💰 Ganás: +${p.gan}`, {
      fontFamily:'Poppins', fontSize:'11px', color:'#58e868'
    }).setOrigin(0.5);
    const t5 = this.add.text(sw*0.28, sy+57, `💸 Perdés: −${p.pago}`, {
      fontFamily:'Poppins', fontSize:'11px', color:'#e86868'
    }).setOrigin(0.5);
    const t6 = this.add.text(0, sy+75, `E(X) = (${p.pN}/${p.pD})×${p.gan} − (${p.pD-p.pN}/${p.pD})×${p.pago}`, {
      fontFamily:'Poppins', fontSize:'9.5px', color:'#4a5e6e', letterSpacing:0.5
    }).setOrigin(0.5);

    const texts = [t1,t2,t3,t4,t5,t6];
    texts.forEach(t => { t.setAlpha(0); cont.add(t); });
    cont.scaleY = 0.04; cont.setAlpha(0);
    this.tweens.add({ targets: cont, scaleY: 1, alpha: 1, duration: 520, ease: 'Back.easeOut',
      onComplete: () => texts.forEach((t,i) =>
        this.tweens.add({ targets: t, alpha: 1, duration: 270, delay: i*55 }))
    });
    pzFloatY(this, cont, 4, 3400, 750);
  }

  /* ══ Columna izquierda: dado + resultados de simulación ══ */
  _buildSimLeft(cx, p) {
    /* Título */
    pzPopIn(this, this.add.text(cx, 213, '🎲  Simulación', {
      fontFamily:'Cinzel', fontSize:'12px', color:'#D4AF37', fontStyle:'600', letterSpacing:1
    }).setOrigin(0.5), 700);

    /* Barra de probabilidad */
    this._drawProbBar(cx, 238, p);

    /* Dado (container para bounce desde centro) */
    this._dieCont = this.add.container(cx, 320).setDepth(5);
    this._dieG    = this.add.graphics();
    this._dieCont.add(this._dieG);
    this._dieFace = 6;
    this._dieHl   = 'idle';
    this._redrawDie();
    /* Animación idle: ligera oscilación */
    this.tweens.add({ targets: this._dieCont, angle: { from:-3, to:3 },
      duration: 2000, yoyo:true, repeat:-1, ease:'Sine.easeInOut', delay:1200 });

    /* Etiqueta debajo del dado */
    this._dieLbl = this.add.text(cx, 370, 'Presioná "Lanzar dado"', {
      fontFamily:'Poppins', fontSize:'9px', color:'#2a3848'
    }).setOrigin(0.5).setDepth(4).setAlpha(0);
    this.tweens.add({ targets: this._dieLbl, alpha: 1, duration: 400, delay: 1100 });

    /* Botón lanzar */
    this._rollBtn = pzActionBtn(this, cx, 398, '🎲  Lanzar dado', 0xD4AF37, () => this._doRoll(p));

    /* 3 slots de resultado */
    this._slots = [];
    for (let i = 0; i < 3; i++) {
      const ry = 426 + i * 22;
      const sc = this.add.container(cx, ry).setDepth(4).setAlpha(0);
      const sg = this.add.graphics();
      sg.fillStyle(0x0a1020, 0.5);
      sg.fillRoundedRect(-82, -10, 164, 20, 4);
      sg.lineStyle(1, 0x1a2838, 0.45);
      sg.strokeRoundedRect(-82, -10, 164, 20, 4);
      const st = this.add.text(0, 0, `Tirada ${i+1}: —`, {
        fontFamily:'Poppins', fontSize:'9.5px', color:'#243040'
      }).setOrigin(0.5);
      sc.add([sg, st]);
      this._slots.push({ cont: sc, g: sg, t: st });
    }

    /* Total acumulado */
    this._totalBg = this.add.graphics().setDepth(3).setAlpha(0);
    this._totalBg.fillStyle(0x080e1a, 0.82);
    this._totalBg.fillRoundedRect(cx-84, 484, 168, 26, 7);
    this._totalBg.lineStyle(1.5, 0x1e2e40, 0.6);
    this._totalBg.strokeRoundedRect(cx-84, 484, 168, 26, 7);
    this._totalTxt = this.add.text(cx, 497, 'Total: 0 💰', {
      fontFamily:'Cinzel', fontSize:'11px', color:'#3a5068', fontStyle:'700'
    }).setOrigin(0.5).setDepth(4).setAlpha(0);
  }

  _drawProbBar(cx, cy, p, bwArg, bhArg, fsArg) {
    const bw = bwArg || 172, bh = bhArg || 14;
    const cont = this.add.container(cx, cy).setAlpha(0).setDepth(2);
    const g = this.add.graphics();
    const winW = Math.max(6, (p.pN / p.pD) * bw);
    g.fillStyle(0x080e18, 0.8);
    g.fillRoundedRect(-bw/2, -bh/2, bw, bh, 5);
    g.fillStyle(0x186830, 0.9);
    g.fillRoundedRect(-bw/2+1, -bh/2+1, winW-2, bh-2, 4);
    g.fillStyle(0x681818, 0.7);
    g.fillRoundedRect(-bw/2+winW, -bh/2+1, bw-winW-1, bh-2, 4);
    g.lineStyle(1, 0x3a5060, 0.5);
    g.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 5);
    cont.add(g);
    const wl = this.add.text(-bw/2 + winW/2, 0, `${p.pN}/${p.pD} ganar`, {
      fontFamily:'Poppins', fontSize: fsArg || '7.5px', color:'#50d870', fontStyle:'700'
    }).setOrigin(0.5);
    const ll = this.add.text(-bw/2 + winW + (bw-winW)/2, 0, 'perder', {
      fontFamily:'Poppins', fontSize: fsArg || '7.5px', color:'#d05050'
    }).setOrigin(0.5);
    cont.add([wl, ll]);
    this.tweens.add({ targets: cont, alpha: 1, duration: 380, delay: 1000 });
  }

  _redrawDie() {
    const g = this._dieG;
    const s = this._dieS || 40, K = s / 40, face = this._dieFace, hl = this._dieHl;
    g.clear();
    /* Sombra */
    g.fillStyle(0x000000, 0.38);
    g.fillRoundedRect(-s+4, -s+5, s*2, s*2, 13);
    /* Cuerpo */
    const fillCol = hl==='win' ? 0x0b3618 : hl==='lose' ? 0x36100b : 0x0d1826;
    g.fillStyle(fillCol, 1);
    g.fillRoundedRect(-s, -s, s*2, s*2, 13);
    /* Brillo superior izquierdo */
    g.fillStyle(0xffffff, 0.07);
    g.fillRoundedRect(-s+3, -s+3, s*2-6, s*0.55, 10);
    /* Borde principal */
    const borderCol = hl==='win' ? 0x40e070 : hl==='lose' ? 0xe04040 : 0x4a6aaa;
    const borderA   = hl!=='idle' ? 1.0 : 0.6;
    g.lineStyle(2.5, borderCol, borderA);
    g.strokeRoundedRect(-s, -s, s*2, s*2, 13);
    /* Borde interior sutil */
    g.lineStyle(1, borderCol, borderA*0.28);
    g.strokeRoundedRect(-s+4, -s+4, s*2-8, s*2-8, 10);
    /* Glow exterior si resultado */
    if (hl !== 'idle') {
      g.lineStyle(6, borderCol, 0.18);
      g.strokeRoundedRect(-s-3, -s-3, s*2+6, s*2+6, 15);
    }
    /* Puntos (pips) */
    const pipCol = hl==='win' ? 0x80ffaa : hl==='lose' ? 0xff8080 : 0xa8c4de;
    g.fillStyle(pipCol, 0.96);
    const r = 5.5 * K;
    const pips = {
      1: [[0,0]],
      2: [[-14,-14],[14,14]],
      3: [[-14,-14],[0,0],[14,14]],
      4: [[-14,-14],[14,-14],[-14,14],[14,14]],
      5: [[-14,-14],[14,-14],[0,0],[-14,14],[14,14]],
      6: [[-14,-13],[14,-13],[-14,0],[14,0],[-14,13],[14,13]],
    };
    (pips[face] || pips[1]).forEach(([dx,dy]) => g.fillCircle(dx * K, dy * K, r));
  }

  _doRoll(p) {
    if (this._rolling || this._rollsDone >= this._maxRolls) return;
    this._rolling = true;
    snd_diceRoll && snd_diceRoll();
    this.cameras.main.shake(100, 0.0045);
    /* Detener oscilación idle durante spin */
    this.tweens.killTweensOf(this._dieCont);
    this._dieCont.angle = 0;
    this._dieHl = 'idle';

    let t = 0;
    this.time.addEvent({ delay: 52, repeat: 11, callback: () => {
      t++;
      this._dieFace = Math.floor(Math.random()*6)+1;
      /* Squish lateral durante spin */
      this._dieCont.scaleX = 0.85 + 0.15*Math.abs(Math.sin(t*0.9));
      this._redrawDie();

      if (t >= 12) {
        const won = Math.random() < p.pN / p.pD;
        this._dieFace = Math.floor(Math.random()*6)+1;
        this._dieHl   = won ? 'win' : 'lose';
        this._dieCont.scaleX = 1;
        this._redrawDie();

        /* Bounce de aterrizaje */
        this.tweens.add({
          targets: this._dieCont, scaleX: 1.22, scaleY: 1.22, duration: 110,
          yoyo: true, ease: 'Quad.easeOut',
          onComplete: () => {
            /* Retomar oscilación idle */
            this.tweens.add({ targets: this._dieCont, angle: { from:-3, to:3 },
              duration: 2000, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });
          }
        });

        /* Sonido resultado */
        if (won) { snd_buff && snd_buff(); }
        else     { snd_fail && snd_fail(); }

        /* Etiqueta del dado */
        this._dieLbl.setText(won ? '✓ ¡GANASTE!' : '✗ Perdiste');
        this._dieLbl.setColor(won ? '#50e880' : '#e85050');

        /* Slot de resultado */
        const idx   = this._rollsDone;
        const delta = won ? p.gan : -p.pago;
        this._simTotal += delta;
        this._rollsDone++;

        const slot  = this._slots[idx];
        const wCol  = won ? '#50e880' : '#e85050';
        const bgCol = won ? 0x0e3a18 : 0x3a0e0e;
        const brCol = won ? 0x40e070 : 0xd04040;
        slot.g.clear();
        slot.g.fillStyle(bgCol, 0.72);
        slot.g.fillRoundedRect(-this._slotW/2, -this._slotH/2, this._slotW, this._slotH, 4);
        slot.g.lineStyle(1.5, brCol, 0.72);
        slot.g.strokeRoundedRect(-this._slotW/2, -this._slotH/2, this._slotW, this._slotH, 4);
        slot.t.setText(`${won?'✓':'✗'} Tirada ${idx+1}: ${won?'+':'-'}${won?p.gan:p.pago} 💰`);
        slot.t.setColor(wCol);
        slot.cont.setAlpha(0);
        this.tweens.add({ targets: slot.cont, alpha: 1, duration: 330, ease: 'Back.easeOut' });

        /* Burst en posición del dado */
        pzBurst(this, this._dieCont.x, this._dieCont.y,
          [won ? 0x40e070 : 0xe04040, 0xffffff, won ? 0xD4AF37 : 0xff8040], 20, 9, 5);

        /* Total acumulado */
        const sign = this._simTotal >= 0 ? '+' : '';
        const tCol = this._simTotal > 0 ? '#50e880' : this._simTotal < 0 ? '#e85050' : '#D4AF37';
        this._totalTxt.setText(`Total: ${sign}${this._simTotal} 💰`);
        this._totalTxt.setColor(tCol);
        this.tweens.add({ targets: [this._totalTxt, this._totalBg], alpha: 1, duration: 300 });
        pzBounceScale(this, this._totalTxt, 1.28, 200);

        /* Deshabilitar botón si se agotaron las tiradas */
        if (this._rollsDone >= this._maxRolls) {
          this.tweens.add({ targets: this._rollBtn, alpha: 0.28, duration: 380 });
          this._rollBtn.removeInteractive();
          this._dieLbl.setText('3/3 tiradas jugadas');
          this._dieLbl.setColor('#3a5068');
        }
        this._rolling = false;
      }
    }});
  }

  /* ══ Columna derecha: tooltips de EV + EVómetro ══ */
  _buildInfoRight(cx, p) {
    pzPopIn(this, this.add.text(cx, 213, '📐  Valor Esperado', {
      fontFamily:'Cinzel', fontSize:'12px', color:'#4090c0', fontStyle:'600', letterSpacing:1
    }).setOrigin(0.5), 700);

    const cards = [
      { y:242, icon:'📐', label:'Fórmula EV',
        desc:'E(X) = P(ganar)×ganancia − P(perder)×pérdida',
        col:0x3a70b8 },
      { y:290, icon:'✅', label:'EV > 0 → Favorable',
        desc:'Ganás dinero en promedio a largo plazo',
        col:0x288048 },
      { y:338, icon:'❌', label:'EV < 0 → Desfavorable',
        desc:'Perdés dinero en promedio a largo plazo',
        col:0x904028 },
    ];
    cards.forEach(({y, icon, label, desc, col}, i) => {
      const card = this.add.container(cx, y).setAlpha(0).setDepth(2);
      const cg = this.add.graphics();
      cg.fillStyle(0x07101e, 0.82);
      cg.fillRoundedRect(-140, -22, 280, 44, 7);
      cg.lineStyle(1.2, col, 0.38);
      cg.strokeRoundedRect(-140, -22, 280, 44, 7);
      const it = this.add.text(-122, 0, icon, { fontSize:'14px' }).setOrigin(0, 0.5);
      const lt = this.add.text(-97, -10, label, {
        fontFamily:'Cinzel', fontSize:'9.5px', fontStyle:'700',
        color:'#' + col.toString(16).padStart(6,'0')
      });
      const dt = this.add.text(-97, 3, desc, {
        fontFamily:'Poppins', fontSize:'8.5px', color:'#3a5468', wordWrap:{width:218}
      });
      card.add([cg, it, lt, dt]);
      this.tweens.add({ targets: card, alpha: 1, duration: 360, delay: 820 + i*110 });
    });

    this._drawEVMeter(cx, 408, p);
  }

  _drawEVMeter(cx, cy, p) {
    const pzm = this._pz;
    const barW = pzm ? 300 : 278, barH = pzm ? 14 : 12;
    const cont = this.add.container(cx, cy).setAlpha(0).setDepth(3);

    const bg = this.add.graphics();
    bg.fillStyle(0x070b14, 0.92);
    bg.fillRoundedRect(-barW/2, -barH/2, barW, barH, 5);
    bg.fillStyle(0x6a1616, 0.62);
    bg.fillRoundedRect(-barW/2+1, -barH/2+1, barW/2-2, barH-2, 4);
    bg.fillStyle(0x166838, 0.62);
    bg.fillRoundedRect(1, -barH/2+1, barW/2-2, barH-2, 4);
    bg.lineStyle(1, 0x2a3048, 0.7);
    bg.strokeRoundedRect(-barW/2, -barH/2, barW, barH, 5);
    bg.lineStyle(2, 0x484858, 0.9);
    bg.lineBetween(0, -barH/2-7, 0, barH/2+7);
    cont.add(bg);

    const negL = this.add.text(-barW/2-9, 0, '−', {fontFamily:'Cinzel',fontSize: pzm ? '16px' : '13px',color:'#b84040',fontStyle:'700'}).setOrigin(1,0.5);
    const posL = this.add.text( barW/2+9, 0, '+', {fontFamily:'Cinzel',fontSize: pzm ? '16px' : '13px',color:'#38a856',fontStyle:'700'}).setOrigin(0,0.5);
    const ll   = this.add.text(-barW/2, barH/2+7, 'DESFAVORABLE', {fontFamily:'Poppins',fontSize: pzm ? '11px' : '7px',color: pzm ? '#d07070' : '#7a2828',letterSpacing:0.8}).setOrigin(0,0);
    const rl   = this.add.text( barW/2, barH/2+7, 'FAVORABLE',    {fontFamily:'Poppins',fontSize: pzm ? '11px' : '7px',color: pzm ? '#58c888' : '#287848',letterSpacing:0.8}).setOrigin(1,0);
    cont.add([negL,posL,ll,rl]);

    /* Marcador diamante */
    const mk = this.add.graphics();
    mk.fillStyle(0xD4AF37, 1);
    mk.fillTriangle(0,-9, 9,0, -9,0);
    mk.fillTriangle(0, 9, 9,0, -9,0);
    cont.add(mk);

    const evTxt = this.add.text(0, barH/2 + (pzm ? 32 : 28), 'E(X) = ?', {
      fontFamily:'Cinzel', fontSize: pzm ? '17px' : '14px', color: pzm ? '#8aa8b8' : '#5a7888', fontStyle:'700'
    }).setOrigin(0.5);
    const evForm = this.add.text(0, barH/2 + (pzm ? 54 : 48), '', {
      fontFamily:'Poppins', fontSize: pzm ? '13px' : '9.5px', color:'#304858', align:'center'
    }).setOrigin(0.5);
    cont.add([evTxt, evForm]);

    this.tweens.add({ targets: cont, alpha: 1, duration: 420, delay: 750 });

    /* El medidor NO se mueve solo: marcarlo antes de que el alumno conteste «¿favorable, desfavorable o neutra?»
       le regalaba la respuesta. Queda en «E(X) = ?» y recién se anima cuando ya decidió (_signDecision). */
    this._evTxt = evTxt;
    this._revelarEV = () => {
      if (this._evRevelado) return;
      this._evRevelado = true;
      const clamped = Math.max(-1, Math.min(1, p.ev / p.gan));
      const targetX = clamped * (barW/2 - 10);
      const fCol = p.ev > 0 ? '#40d870' : p.ev < 0 ? '#d05050' : '#D4AF37';
      const fHex = p.ev > 0 ? 0x40d870  : p.ev < 0 ? 0xd05050  : 0xD4AF37;

      this.tweens.add({
        targets: mk, x: targetX, duration: 1450, ease: 'Elastic.easeOut',
        onUpdate: () => {
          const cur = +((mk.x / (barW/2-10)) * p.gan).toFixed(1);
          evTxt.setText(`E(X) = ${cur>=0?(cur===0?'':'+'):''}${cur}`);
        },
        onComplete: () => {
          evTxt.setText(`E(X) = ${p.evStr}`);
          evTxt.setColor(fCol);
          evForm.setText(`(${p.pN}/${p.pD})×${p.gan} − (${p.pD-p.pN}/${p.pD})×${p.pago} = ${p.evStr}`);
          evForm.setColor(fCol);
          mk.clear();
          mk.fillStyle(fHex, 1);
          mk.fillTriangle(0,-10, 10,0, -10,0);
          mk.fillTriangle(0, 10, 10,0, -10,0);
          pzBounceScale(this, evTxt, 1.3, 240);
          if (p.ev !== 0) pzBurst(this, cx+targetX, cy, [fHex, 0xffffff], 20, 6, 5, !!pzm);
        }
      });
    };
  }

  /* ══ Pregunta + botones (zona inferior) ══ */
  _buildBottom(w, p) {
    /* Línea separadora */
    const sepG = this.add.graphics().setAlpha(0);
    sepG.lineStyle(1, 0xD4AF37, 0.1);
    sepG.lineBetween(80, 514, w-80, 514);
    this.tweens.add({ targets: sepG, alpha: 1, duration: 500, delay: 1100 });

    pzPopIn(this, this.add.text(w/2, 528,
      '¿Esta apuesta es favorable, desfavorable o neutra?', {
      fontFamily:'Cinzel', fontSize:'13px', color:'#D4AF37',
      fontStyle:'600', align:'center', wordWrap:{width:w*0.75}
    }).setOrigin(0.5), 1900);

    pzButtons(this, p.opts, 566, (a) => {
      this._signDecision(p, a.ok);
    });
  }

  /* ══ Decisión: firmar o rechazar el contrato (Opción A) ══ */
  _signDecision(p, classOk) {
    if (this._revelarEV) this._revelarEV();   // ya contestó: ahora sí el medidor muestra el valor esperado
    // Teléfono: el contrato firmado es interfaz (cubre toda la pantalla, sin la ilustración).
    if (this._pz && !this._pzEnFijo) {
      this._pzEnFijo = true;
      try { return pzFijo(this, () => this._signDecision(p, classOk)); } finally { this._pzEnFijo = false; }
    }
    const pzs = this._pz;
    const w = this.scale.width, h = this.scale.height;
    if (pzs && pzs.cams) pzs.cams.ill.setVisible(false);

    /* Contexto de puntaje */
    const _md     = this._data && this._data.modoArcade;
    const modeKey = _md === 'libre' ? 'libre' : (_md ? 'arcade' : 'aventura');
    const dif     = (this._data && this._data.dificultad) || 'normal';
    const difMult = (typeof _PTS_DIF !== 'undefined' && _PTS_DIF[dif]) || 1;

    const simTotal = this._simTotal;

    /* Overlay */
    const dim = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0).setDepth(pzs ? 55 : 40);
    this.tweens.add({ targets: dim, fillAlpha: 0.7, duration: 300 });
    snd_item && snd_item();

    const pw = pzs ? Math.min(w - 24, 640) : 560, ph = pzs ? Math.min(h - 24, 310) : 320, px = w/2 - pw/2, py = h/2 - ph/2;
    const cont = this.add.container(w/2, h/2).setDepth(pzs ? 56 : 41);
    const panel = this.add.graphics();
    panel.fillGradientStyle(0x241803, 0x241803, 0x140d02, 0x140d02, 1);
    panel.fillRoundedRect(-pw/2, -ph/2, pw, ph, 14);
    panel.lineStyle(2.5, 0xD4AF37, 0.8);
    panel.strokeRoundedRect(-pw/2, -ph/2, pw, ph, 14);
    panel.lineStyle(1, 0xD4AF37, 0.2);
    panel.strokeRoundedRect(-pw/2+5, -ph/2+5, pw-10, ph-10, 10);
    cont.add(panel);

    const title = this.add.text(0, -ph/2 + (pzs ? 28 : 34), '✍  El Contrato del Mercader', {
      fontFamily:'Cinzel', fontSize: pzs ? '17px' : '18px', color:'#F5D97A', fontStyle:'700'
    }).setOrigin(0.5);
    cont.add(title);

    const simCol = simTotal > 0 ? '#50e880' : simTotal < 0 ? '#e85050' : '#D4AF37';
    const simSign = simTotal >= 0 ? '+' : '';
    const l1 = this.add.text(0, -ph/2 + (pzs ? 66 : 74),
      `Probaste el contrato ${this._rollsDone} ${this._rollsDone===1?'vez':'veces'}: resultado ${simSign}${simTotal} monedas.`, {
      fontFamily:'Poppins', fontSize: pzs ? '14px' : '12px', color: simCol, align:'center', wordWrap:{ width:pw-(pzs ? 48 : 60) }
    }).setOrigin(0.5);
    const l2 = this.add.text(0, -ph/2 + (pzs ? 100 : 104),
      `Tu análisis: E(X) = ${p.evStr} monedas por jugada.`, {
      fontFamily:'Poppins', fontSize: pzs ? '14px' : '12px', color:'#c3d2e2', align:'center'
    }).setOrigin(0.5);
    const l3 = this.add.text(0, -ph/2 + (pzs ? 134 : 134),
      'Si firmás, esas jugadas cuentan de verdad. ¿Qué decidís?', {
      fontFamily:'Poppins', fontSize: pzs ? '14px' : '11px', color: pzs ? '#a9b8c8' : '#8a9ab0', align:'center', wordWrap:{ width:pw-(pzs ? 48 : 60) }
    }).setOrigin(0.5);
    cont.add([l1, l2, l3]);

    /* Botones Firmar / Rechazar */
    const mkBtn = (label, dx, accent, onClick) => {
      const bw = pzs ? 200 : 180, bh = pzs ? 46 : 48, by = pzs ? ph/2 - 40 : ph/2 - 50;
      const g = this.add.graphics();
      const draw = (hov) => {
        g.clear();
        g.fillStyle(accent, hov ? 0.3 : 0.15);
        g.fillRoundedRect(dx-bw/2, by-bh/2, bw, bh, 9);
        g.lineStyle(2, accent, hov ? 1 : 0.55);
        g.strokeRoundedRect(dx-bw/2, by-bh/2, bw, bh, 9);
      };
      draw(false);
      const ah = '#' + accent.toString(16).padStart(6,'0');
      const t = this.add.text(dx, by, label, {
        fontFamily:'Cinzel', fontSize: pzs ? '16px' : '15px', color: ah, fontStyle:'700'
      }).setOrigin(0.5);
      cont.add([g, t]);
      const hit = this.add.rectangle(w/2 + dx, h/2 + by, bw, bh, 0, 0)
        .setDepth(pzs ? 58 : 43).setInteractive({ useHandCursor:true });
      hit.on('pointerover', () => { draw(true); snd_item && snd_item(); });
      hit.on('pointerout',  () => draw(false));
      hit.on('pointerup',   () => { hit.destroy(); onClick(); });
      return hit;
    };

    const finalize = (signed) => {
      /* Pago del dado si firmó */
      const diceBonus = signed ? Math.round(simTotal * 3 * difMult) : 0;
      /* Decisión correcta: firmar favorable/neutro, rechazar desfavorable/neutro */
      const decisionOk = p.tipo === 'neutro' ? true
                       : signed ? (p.tipo === 'favorable')
                                : (p.tipo === 'desfavorable');
      const judg  = Math.round(40 * difMult) * (decisionOk ? 1 : -1);
      const extra = diceBonus + judg;
      if (extra !== 0 && typeof ptsAdd === 'function') ptsAdd(extra, modeKey);

      /* Explicación combinada */
      const decTxt = decisionOk ? '✓ Buena decisión' : '✗ Mala decisión';
      const contratoTxt = signed
        ? `Firmaste: el contrato pagó ${diceBonus>=0?'+':''}${diceBonus} pts.`
        : 'Rechazaste el contrato (sin pago del dado).';
      const explainFull =
        p.explain + '\n' +
        `${decTxt} (juicio: ${judg>=0?'+':''}${judg} pts). ${contratoTxt}`;

      this.tweens.add({ targets: [cont, dim], alpha: 0, duration: 260,
        onComplete: () => {
          cont.destroy(); dim.destroy();
          pzResult(this, classOk, explainFull, PUZZLE_CATALOG[2].recompensa.hp, 2);
        }});
    };

    mkBtn('✍ Firmar', pzs ? -115 : -110, 0x40c060, () => finalize(true));
    mkBtn('✗ Rechazar', pzs ? 115 : 110, 0xc05040, () => finalize(false));

    if (!pzs) {
      const hint = this.add.text(0, ph/2 - 16,
        'Firmá si conviene (E(X) > 0), rechazá si no (E(X) < 0).', {
        fontFamily:'Poppins', fontSize:'9.5px', color:'#6a5a30', fontStyle:'italic'
      }).setOrigin(0.5);
      cont.add(hint);
    }

    cont.setScale(0.5); cont.setAlpha(0);
    this.tweens.add({ targets: cont, scaleX:1, scaleY:1, alpha:1, duration:420, ease:'Back.easeOut' });
  }

  /* ══ Botón ? + overlay explicativo ══ */
  _buildInfo(w, h) {
    if (this._pz) {
      _pzInfoMovil(this, 'mercader', 'Valor esperado y el contrato', [
        '◆ ¿Qué es el valor esperado E(X)?',
        'Es cuánto ganás o perdés en PROMEDIO por jugada, a la larga:',
        'E(X) = P(ganar) × ganancia − P(perder) × pérdida',
        'EV > 0 conviene (favorable) · EV < 0 no conviene (desfavorable) · EV = 0 es justa (neutra).',
        '',
        '◆ El contrato y el dado',
        'El contrato es la apuesta del Mercader. Podés probarlo tirando el dado 3 veces: cada tirada simula jugar el contrato una vez. Esas tiradas resuelven el contrato de verdad si lo firmás.',
        '',
        '◆ Tu objetivo',
        '1) Clasificá la apuesta: favorable, desfavorable o neutra.',
        '2) Decidí: firmá las que convienen, rechazá las que no. Firmar una buena apuesta suma puntos; firmar una mala los resta.',
      ]);
      return;
    }
    const bx = w - 40, by = 30;
    const btn = this.add.graphics().setDepth(50);
    const drawBtn = (hov) => {
      btn.clear();
      btn.fillStyle(0x2a1c04, hov ? 0.95 : 0.8);
      btn.fillCircle(bx, by, 15);
      btn.lineStyle(1.5, hov ? 0xF5D97A : 0x8a6828, hov ? 1 : 0.7);
      btn.strokeCircle(bx, by, 15);
    };
    drawBtn(false);
    this.add.text(bx, by, '?', {
      fontFamily:'Cinzel', fontSize:'17px', color:'#F5D97A', fontStyle:'700'
    }).setOrigin(0.5).setDepth(51);

    const ov = this.add.container(0, 0).setDepth(60).setAlpha(0).setVisible(false);
    const dim = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.74).setInteractive();
    const pw = 620, ph = 384, px = w/2 - pw/2, py = h/2 - ph/2;
    const panel = this.add.graphics();
    panel.fillStyle(0x140d02, 0.98);
    panel.fillRoundedRect(px, py, pw, ph, 14);
    panel.lineStyle(2, 0x8a6828, 0.85);
    panel.strokeRoundedRect(px, py, pw, ph, 14);
    panel.lineStyle(1, 0xD4AF37, 0.2);
    panel.strokeRoundedRect(px+5, py+5, pw-10, ph-10, 10);

    const title = this.add.text(w/2, py + 30, 'Valor esperado y el contrato', {
      fontFamily:'Cinzel', fontSize:'19px', color:'#F5D97A', fontStyle:'700'
    }).setOrigin(0.5);

    const body = this.add.text(px + 36, py + 60, [
      '◆ ¿Qué es el valor esperado E(X)?',
      'Es cuánto ganás o perdés en PROMEDIO por jugada, a la larga:',
      '   E(X) = P(ganar) × ganancia − P(perder) × pérdida',
      'EV > 0 conviene · EV < 0 no conviene · EV = 0 es justa (neutra).',
      '',
      '◆ El contrato y el dado',
      'El contrato es la apuesta del Mercader. Podés probarlo tirando',
      'el dado 3 veces: cada tirada simula jugar el contrato una vez.',
      'Esas tiradas resuelven el contrato de verdad si lo firmás.',
      '',
      '◆ Tu objetivo',
      '1) Clasificá la apuesta: favorable, desfavorable o neutra.',
      '2) Decidí: firmá las que convienen, rechazá las que no.',
      'Firmar una buena apuesta suma puntos; firmar una mala los resta.',
    ].join('\n'), {
      fontFamily:'Poppins', fontSize:'11.5px', color:'#c8d4e0',
      lineSpacing:4, wordWrap:{ width:pw - 72 }
    });

    const closeTxt = this.add.text(w/2, py + ph - 24, 'Cerrar', {
      fontFamily:'Cinzel', fontSize:'13px', color:'#F5D97A', fontStyle:'700'
    }).setOrigin(0.5).setInteractive({ useHandCursor:true });

    ov.add([dim, panel, title, body, closeTxt]);

    const show = (v) => {
      ov.setVisible(true);
      this.tweens.add({ targets:ov, alpha: v ? 1 : 0, duration:220,
        onComplete:() => { if (!v) ov.setVisible(false); } });
    };

    const hit = this.add.circle(bx, by, 16, 0, 0).setDepth(52)
      .setInteractive({ useHandCursor:true });
    hit.on('pointerover', () => drawBtn(true));
    hit.on('pointerout',  () => drawBtn(false));
    hit.on('pointerup',   () => { snd_item && snd_item(); show(true); });
    dim.on('pointerup',      () => show(false));
    closeTxt.on('pointerup', () => show(false));
  }
}

PuzzleApuesta.DISENO_MOVIL = true;
