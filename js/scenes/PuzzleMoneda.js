/* ══════════════════════════════════════
   PuzzleMoneda — Cara o Ceca
   Concepto: probabilidad binomial P(X=k) = C(n,k)/2^n
══════════════════════════════════════ */

class PuzzleMoneda extends Phaser.Scene {
  constructor() { super('PuzzleMoneda'); }

  init(d) {
    this._data = d;
    this._prob = this._gen(d.dificultad || 'normal');
  }

  _gen(dif) {
    // {n flips, k heads to ask about}
    const combos = {
      facil:      [{n:2,k:0},{n:2,k:1},{n:2,k:2},{n:3,k:0},{n:3,k:3}],
      normal:     [{n:3,k:1},{n:3,k:2},{n:4,k:1},{n:4,k:3}],
      heroe:      [{n:4,k:2},{n:4,k:0},{n:5,k:1},{n:5,k:4}],
      legendario: [{n:5,k:2},{n:5,k:3},{n:6,k:2}],
    };
    const opts = combos[dif] || combos.normal;
    const {n,k} = opts[Math.floor(Math.random()*opts.length)];
    const C = _binomial(n, k);
    const denom = Math.pow(2, n);
    const corr  = _frac(C, denom);

    // Distractores.
    //
    // El Set existia pero no se usaba para nada: los tres distractores se
    // metian tal cual, y varios combos daban una opcion identica a la
    // respuesta correcta pero marcada como incorrecta. Con {n:2,k:0} el
    // "C-1" cae a 0, el max(1,...) lo sube a 1 y queda 1/4, que es la
    // respuesta. Con {n:5,k:3} el C(5,2) vale lo mismo que el C(5,3) por
    // simetria del triangulo de Pascal. Pasaba en las cuatro dificultades, y
    // en facil en cuatro de los cinco combos: el alumno elegia una fraccion
    // correcta y el juego se la marcaba mal.
    //
    // Ahora se juntan candidatos, se sacan los que valen lo mismo que la
    // respuesta y se completan hasta tres con vecinos que todavia no esten.
    const candidatos = [
      _frac(C + 1, denom),
      _frac(Math.max(1, C - 1), denom),
      _frac(_binomial(n, k > 0 ? k - 1 : k + 1), denom),
      _frac(_binomial(n, k < n ? k + 1 : k - 1), denom),
      _frac(C + 2, denom),
      _frac(Math.max(1, C - 2), denom),
      _frac(1, denom),
      _frac(denom - C, denom),
    ];
    const distractores = [];
    const sumar = (etiqueta) => {
      if (distractores.length === 3) return;
      if (etiqueta === corr || distractores.includes(etiqueta)) return;
      distractores.push(etiqueta);
    };
    candidatos.forEach(sumar);
    // Los combos chicos ({n:2}) tienen tan pocas fracciones distintas que los
    // candidatos de arriba no siempre llegan a tres. Se completa recorriendo
    // todas las cantidades posibles de casos favorables, que es lo mismo que
    // el alumno podria contar.
    for (let casos = 1; casos <= denom && distractores.length < 3; casos++) {
      sumar(_frac(casos, denom));
    }
    const all4 = _shuffle([
      {label:corr,ok:true},
      ...distractores.map((l) => ({ label:l, ok:false })),
    ]);

    const explain = `C(${n},${k}) = ${C}  |  2^${n} = ${denom}\nP(exactamente ${k} cara${k!==1?'s':''} en ${n} lanzamientos) = ${C}/${denom} = ${corr}`;
    return {n, k, corr, opts:all4, explain};
  }

  create() {
    const {w,h} = pzBg(this, 'mercader');
    pzHeader(this, 'Cara o Ceca', 'mercader', w);
    pzInfoButton(this, 'mercader', 'Cara o Ceca', [
      '◆ El tema: frecuencia relativa',
      'Al lanzar muchas veces, la proporción de caras se acerca a la',
      'probabilidad teórica (1/2 en una moneda justa). Ley de los grandes números.',
      '',
      '◆ El minijuego',
      'Se lanza una moneda muchas veces. Tenés que predecir cuántas',
      'caras (o cecas) saldrán aproximadamente en ese número de tiradas.',
      '',
      '◆ Qué se espera de vos',
      'Estimá el resultado esperado = probabilidad × número de lanzamientos',
      'y elegí la opción más cercana.',
      '',
      '◆ Consejos',
      '• Esperado = N × P. Con 100 tiros y P=1/2 → ~50 caras.',
      '• El resultado real varía un poco alrededor del esperado, no es exacto.',
      '• Más lanzamientos → la proporción se pega más a la teórica.',
    ]);
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

  _launchAllCoins(n, k) {
    if (this._launching) return;
    this._launching = true;
    snd_diceRoll && snd_diceRoll();
    this.cameras.main.shake(130, 0.005);

    /* Generar resultado aleatorio real para esta tirada */
    const newResults = Array.from({length: n}, () => Math.random() < 0.5);
    const headsCount = newResults.filter(Boolean).length;
    this._coinData.forEach((cd, idx) => { cd.finalHeads = newResults[idx]; });

    this._coinData.forEach(({ coin, drawFace, bx, by }, i) => {
      const finalHeads = newResults[i];
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
      pzCountUp(this, this._resultTxt, headsCount, 680, '', ` cara${headsCount!==1?'s':''}`);
      this.tweens.add({ targets: this._resultTxt, alpha: 1, duration: 300 });
      this.time.delayedCall(720, () => pzBounceScale(this, this._resultTxt, 1.3, 240));
      this._launching = false;
    });
  }
}
