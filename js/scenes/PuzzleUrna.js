/* ══════════════════════════════════════
   PuzzleUrna — La Urna Misteriosa
   Concepto: P(A) = casos favorables / casos totales
══════════════════════════════════════ */

class PuzzleUrna extends Phaser.Scene {
  constructor() { super('PuzzleUrna'); }

  init(d) {
    this._data = d;
    this._prob = this._gen(d.dificultad || 'normal');
  }

  _gen(dif) {
    const cfgs = {
      facil:      [{r:3,b:3},{r:2,b:4},{r:1,b:4}],
      normal:     [{r:3,b:5,g:4},{r:4,b:6},{r:2,b:6,g:4}],
      heroe:      [{r:3,b:5,g:4,y:2},{r:5,b:7,g:6},{r:4,b:8,g:6}],
      legendario: [{r:3,b:7,g:5,y:3},{r:5,b:9,g:4,y:2}],
    };
    const opts  = cfgs[dif] || cfgs.normal;
    const cfg   = opts[Math.floor(Math.random()*opts.length)];
    const total = (cfg.r||0)+(cfg.b||0)+(cfg.g||0)+(cfg.y||0);
    const colors = Object.entries(cfg)
      .filter(([,v])=>v>0)
      .map(([k,v])=>({key:k, count:v}));
    const pick = colors[Math.floor(Math.random()*colors.length)];
    const names = {r:'roja',b:'azul',g:'verde',y:'amarilla'};
    const plural = {r:'rojas',b:'azules',g:'verdes',y:'amarillas'};
    const corr  = _frac(pick.count, total);
    // Distractores plausibles: complemento, un caso de más, la cantidad de otra
    // bola. Si hace falta, cualquier fracción posible de la urna (_opcionesFrac
    // sortea el rango de la correcta entre las opciones ordenadas; antes, en
    // "héroe" y "legendario" la correcta nunca era la más grande).
    const plausibles = [
      _frac(total-pick.count, total),                    // complemento
      _frac(pick.count+1, total),                        // +1 arriba
    ];
    const alt = colors.find(c=>c.key!==pick.key);
    plausibles.push(alt ? _frac(alt.count, total) : _frac(pick.count, total+2));
    const opts4 = _opcionesFrac(corr, plausibles, _fraccionesDe(total));
    return { cfg, total, pick, colorName:names[pick.key], corr, opts: opts4,
             explain:`Hay ${pick.count} ${pick.count===1?'bola '+names[pick.key]:'bolas '+plural[pick.key]} de un total de ${total}.\nP = ${pick.count}/${total} = ${corr}` };
  }

  create() {
    // Teléfono: la urna y su leyenda se ven en una ventana a la izquierda; la pregunta y las respuestas, a la derecha.
    const _w = this.scale.width;
    const pz = pzCompactoInit(this, { x:_w/2 - 200, y:148, w:400, h:296 });
    const {w,h} = pzBg(this, 'mercader');
    pzHeader(this, 'La Urna Misteriosa', 'mercader', w);
    pzInfoButton(this, 'mercader', 'La Urna Misteriosa', [
      '◆ El tema: probabilidad clásica (Laplace)',
      'La probabilidad de un caso = casos favorables ÷ casos totales.',
      'Es la base de todo el azar: contar bien qué puede pasar.',
      '',
      '◆ El minijuego',
      'Hay una urna con bolas de varios colores. El Mercader te pide',
      'la probabilidad de sacar una bola de cierto color en una extracción.',
      '',
      '◆ Qué se espera de vos',
      'Contá las bolas del color pedido, contá el total y elegí la fracción',
      'correcta (simplificada) entre las opciones.',
      '',
      '◆ Consejos',
      '• Sumá TODAS las bolas para el denominador, no solo las del color buscado.',
      '• Simplificá la fracción: 4/8 es lo mismo que 1/2.',
      '• Si un color no está, su probabilidad es 0; si son todas, es 1.',
    ]);

    const p = this._prob;
    if (pz) {
      pzPreguntaMovil(this, [
        { txt:`La urna contiene ${p.total} bolas de distintos colores.`, color:'#a9b8c8' },
        { txt:`¿Cuál es la probabilidad de sacar una bola ${p.colorName}?`, fam:'Cinzel', color:'#D4AF37', estilo:'600', size:'15px' },
      ]);
    } else {
    pzPopIn(this, this.add.text(w/2, 96,
      `La urna contiene ${p.total} bolas de distintos colores.`, {
      fontFamily:'Poppins', fontSize:'13px', color:'#8a9ab0', align:'center'
    }).setOrigin(0.5), 80);
    pzPopIn(this, this.add.text(w/2, 120,
      `¿Cuál es la probabilidad de sacar una bola ${p.colorName}?`, {
      fontFamily:'Cinzel', fontSize:'14px', color:'#D4AF37', fontStyle:'600', align:'center'
    }).setOrigin(0.5), 160);
    }

    /* ── Urna primero (queda al fondo) ── */
    const urnCY = 286;
    this._drawUrn(w/2, urnCY, p.cfg, p.pick.key);

    /* ── Bandeja de bolas extraídas (centrada, bajo el botón) ── */
    this._drawCount  = 0;
    this._maxDraws   = 3;
    const trayY      = 396;
    this._extractedX = w/2 - 34;
    this._extractedY = trayY;
    const BALL_COLORS = {r:0xcc3030, b:0x2860c0, g:0x30a040, y:0xc0a020};
    const colors = Object.entries(p.cfg).filter(([,v]) => v > 0).map(([k,v]) => ({ key:k, col:BALL_COLORS[k], n:v }));

    pzPopIn(this, this.add.text(w/2, trayY - 30, 'Bolas extraídas', {
      fontFamily:'Poppins', fontSize: pz ? '13px' : '10px', color: pz ? '#9aaabb' : '#6a7c8c', fontStyle:'600'
    }).setOrigin(0.5), 1300);

    /* ── Botón sacar bola (justo debajo de los indicadores) ── */
    pzActionBtn(this, w/2, 372, '🎲 Sacar bola', 0xD4AF37, () => {
      if (this._drawCount >= this._maxDraws) return;
      this._drawCount++;

      /* Selección aleatoria ponderada */
      const pool = [];
      colors.forEach(c => { for (let i = 0; i < c.n; i++) pool.push(c); });
      const picked = pool[Math.floor(Math.random() * pool.length)];

      /* Bola que vuela */
      const bStartX = w/2 + (Math.random() - 0.5) * 40;
      const bStartY = urnCY - 96;
      const bEndX   = this._extractedX + (this._drawCount - 1) * 34;
      const bEndY   = this._extractedY;
      const midY    = bStartY - 40;

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
                fontFamily:'Poppins', fontSize: pz ? '12px' : '9px',
                color: isTarget ? '#40e870' : '#9ab0c0', fontStyle: isTarget ? '700' : '400'
              }).setOrigin(0.5).setAlpha(0).setDepth(7);
              this.tweens.add({ targets: lbl, alpha: 1, y: bEndY + 20, duration: 280, delay: 100 });
            }
          });
        }
      });
    });

    /* ── Respuestas ── */
    pzButtons(this, p.opts, 458, (a)=>{
      pzResult(this, a.ok, p.explain, PUZZLE_CATALOG[0].recompensa.hp, 0);
    });
    pzCompactoFin(this);
  }

  _drawUrn(cx, cy, cfg, targetKey) {
    const BALL_COLORS = {r:0xcc3030, b:0x2860c0, g:0x30a040, y:0xc0a020};
    const BALL_NAMES  = {r:'roja', b:'azul', g:'verde', y:'amarilla'};

    // Contenedor flotante de la urna
    const urn = this.add.container(cx, cy);
    const g = this.add.graphics();
    // Base
    g.fillStyle(0x2a1808, 1);
    g.fillEllipse(0, 12, 150, 22);
    // Cuerpo urna
    g.fillStyle(0x3a2818, 1);
    g.fillRoundedRect(-70, -108, 140, 120, 12);
    g.lineStyle(2, 0x8a5828, 0.9);
    g.strokeRoundedRect(-70, -108, 140, 120, 12);
    // Brillo de vidrio (reflejo lateral)
    g.fillStyle(0xffffff, 0.06);
    g.fillRoundedRect(-58, -98, 26, 96, 8);
    // Cuello
    g.fillStyle(0x4a3020, 1);
    g.fillRect(-32, -126, 64, 22);
    g.lineStyle(2, 0x8a5828, 0.9);
    g.strokeRect(-32, -126, 64, 22);
    // Borde superior
    g.fillStyle(0x5a3828, 1);
    g.fillEllipse(0, -126, 80, 18);
    urn.add(g);
    pzFloatY(this, urn, 6, 3000);

    // Bolas: se apilan desde el fondo de la urna, fila centrada
    const balls = [];
    Object.entries(cfg).forEach(([k,v])=>{
      for (let i=0; i<Math.min(v,4); i++) balls.push({key:k, col:BALL_COLORS[k]});
    });
    _shuffle(balls);
    const COLS = 5, SPX = 24, SPY = 21;
    const nRows = Math.ceil(balls.length / COLS);
    const bottomRowY = 0; // fondo interior, apenas sobre la base
    balls.forEach((b, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const ballsInRow = Math.min(COLS, balls.length - row * COLS);
      const rowStartX  = -((ballsInRow - 1) * SPX) / 2;
      const bx  = rowStartX + col * SPX;
      const byF = bottomRowY - (nRows - 1 - row) * SPY;
      const isTarget = b.key === targetKey;
      const ball = this.add.graphics();
      const drawBall = (glow) => {
        ball.clear();
        if (isTarget && glow > 0) {
          ball.fillStyle(0xffffff, 0.4*glow);
          ball.fillCircle(0, 0, 13);
        }
        ball.fillStyle(b.col, 0.95);
        ball.fillCircle(0, 0, 9);
        ball.fillStyle(0xffffff, 0.35);
        ball.fillCircle(-3, -3, 3);
        ball.lineStyle(1, 0xffffff, 0.2);
        ball.strokeCircle(0, 0, 9);
      };
      drawBall(0);
      ball.setPosition(bx, byF - 160).setAlpha(0);
      urn.add(ball);
      this.tweens.add({ targets: ball, y: byF, alpha: 1, duration: 520,
        delay: 400 + i*70, ease: 'Bounce.easeOut' });
      // Pulso glow en bolas objetivo
      if (isTarget) {
        const gs = { v: 0 };
        this.tweens.add({ targets: gs, v: 1, duration: 1100, yoyo: true, repeat: -1,
          delay: 900 + i*70, ease: 'Sine.easeInOut', onUpdate: () => drawBall(gs.v) });
      }
    });

    // Leyenda (indicadores) centrada respecto a la urna
    const BALL_PLURAL = {r:'rojas', b:'azules', g:'verdes', y:'amarillas'};
    const entries = Object.entries(cfg).filter(([,v]) => v > 0);
    const ITEM_SP = this._pz ? 92 : 86;
    const startX  = cx - (entries.length - 1) * ITEM_SP / 2 - 28;
    const legendY = cy + 46;
    entries.forEach(([k,v], li) => {
      const isT  = k === targetKey;
      const item = this.add.container(startX + li * ITEM_SP, legendY);
      const lg   = this.add.graphics();
      lg.fillStyle(BALL_COLORS[k], 0.95);
      lg.fillCircle(0, 0, 7);
      if (isT) { lg.lineStyle(2, 0xD4AF37, 0.9); lg.strokeCircle(0, 0, 9); }
      const lt = this.add.text(12, -7, `${v} ${v > 1 ? BALL_PLURAL[k] : BALL_NAMES[k]}`, {
        fontFamily:'Poppins', fontSize: this._pz ? '13px' : '10px', color: isT ? '#D4AF37' : '#9ab0c0',
        fontStyle: isT ? '700' : '400'
      });
      item.add([lg, lt]);
      pzPopIn(this, item, 1000 + li * 90, 14);
    });
  }
}

PuzzleUrna.DISENO_MOVIL = true;
