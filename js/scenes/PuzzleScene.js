/* ══════════════════════════════════════
   PuzzleScene — Encuentro con NPC + selección de enigma
   Recibe: { npc:'mercader'|'oraculo', puzzles:[ids], nodeIdx:n }
   Requiere: NPC_DATA, PUZZLE_CATALOG, createNPCElement, setNPCState
══════════════════════════════════════ */

class PuzzleScene extends Phaser.Scene {
  constructor() { super('PuzzleScene'); }

  init(data) {
    this._npcKey    = (data && data.npc)     || 'mercader';
    this._nodeIdx   = (data && data.nodeIdx) || 0;
    this._puzzleIds = (data && data.puzzles) || [0, 1];
    this._npcEl     = null;
    this._npcDOM    = null;
    this._puzzleShown = false;
    this._selecting   = false;
    /* Phaser reutiliza la instancia de la escena: lo que no se reinicia acá se
       hereda de la visita anterior. `_choiceShown` quedaba en true tras el primer
       Mercader, así que desde el segundo en adelante _nextDialogue saltaba el
       menú "Probar mi suerte / Ver tienda" y mostraba directo la lista de
       enigmas: la tienda sólo se podía abrir en el primer Mercader de cada
       carga de la página. `_confirmedAdvance` heredado también salteaba el
       aviso de punto de no retorno, y `_choiceHits` acumulaba botones ya
       destruidos de las visitas anteriores. */
    this._choiceShown      = false;
    this._choiceObjs       = [];
    this._choiceHits       = [];
    this._confirmedAdvance = false;
    this._typeEv           = null;
    this._dlgTimer         = null;
  }

  preload() {
    if (typeof bgLoad === 'function') bgLoad(this, this._npcKey);
  }

  create() {
    const w = this.scale.width, h = this.scale.height;
    if(typeof Music !== 'undefined') Music.play('puzzle');
    this.cameras.main.fadeIn(600, 0, 0, 0);

    const npcData = NPC_DATA[this._npcKey];

    /* ── Fondo ── */
    const bgBase = this.add.graphics().setDepth(-12);
    bgBase.fillGradientStyle(0x0a0810, 0x0a0810, 0x060408, 0x060408, 1);
    bgBase.fillRect(0, 0, w, h);
    const _hayBg = (typeof bgMount === 'function') && bgMount(this, this._npcKey, { depth:-11, fxDepth:-8 });
    if (_hayBg) {
      const bgDark = this.add.graphics().setDepth(-9);
      bgDark.fillStyle(0x07070E, 0.38);
      bgDark.fillRect(0, 0, w, h);
    } else {
      for (let i = 0; i < 28; i++) {
        const sx = Math.random()*w, sy = Math.random()*h;
        const col = Math.random()>0.7 ? 0xD4AF37 : 0xC0C8D0;
        const star = this.add.circle(sx, sy, Math.random()*1.2+0.2, col, Math.random()*0.18+0.03);
        this.tweens.add({targets:star, alpha:{from:0.03, to:star.alpha},
          duration:1800+Math.random()*3000, yoyo:true, repeat:-1, delay:Math.random()*2000});
      }
    }

    /* ── NPC DOM (mitad izquierda) ── */
    const NPC_W = 400, NPC_H = 400;
    this._npcEl  = createNPCElement(this._npcKey, NPC_W, NPC_H);
    this._npcDOM = this.add.dom(220, 375, this._npcEl);
    this._npcDOM.setDepth(5);
    setNPCState(this._npcEl, 'idle');

    // Prolongar la mesa del NPC como mostrador hasta el borde inferior de la
    // pantalla. El SVG del NPC recorta su propia mesa al borde del contenedor
    // (y=375+200=575); sin esto queda flotando con un vacío debajo.
    //
    // El degradado NO puede reiniciarse en el empalme: la mesa del SVG llega al
    // borde ya oscurecida, y arrancar de nuevo en el tono claro deja una línea
    // horizontal marcada. Por eso se calcula en qué punto del degradado quedó
    // cortada la mesa y se continúa desde ese color exacto.
    const cX0 = 220 - NPC_W/2, cX1 = 220 + NPC_W/2, cY0 = 375 + NPC_H/2;
    const TBL_TOP = 458, TBL_BOT = 576;          // rect de la mesa dentro del viewBox
    const VB_Y0 = (this._npcKey === 'oraculo') ? -6 : 66;  // origen y del viewBox por NPC
    const tCorte = Math.min(1, Math.max(0, ((VB_Y0 + 500) - TBL_TOP) / (TBL_BOT - TBL_TOP)));
    const lerp = (a, b) => Math.round(a + (b - a) * tCorte);
    const cTop = (lerp(0x3d, 0x1e) << 16) | (lerp(0x2a, 0x12) << 8) | lerp(0x16, 0x08);
    const cBot = 0x150c05;                        // sombra suave hacia el borde inferior

    const counterG = this.add.graphics().setDepth(4);
    counterG.fillGradientStyle(cTop, cTop, cBot, cBot, 1);
    counterG.fillRect(cX0, cY0, cX1 - cX0, h - cY0);

    // Nombre del NPC bajo el personaje
    this.add.text(220, 82, npcData.nombre.toUpperCase(), {
      fontFamily:'Cinzel', fontSize:'12px', color:'#D4AF37', fontStyle:'700',
      letterSpacing:3, stroke:'#050408', strokeThickness:3,
      shadow:{offsetX:0,offsetY:0,color:'#D4AF37',blur:12,fill:true}
    }).setOrigin(0.5);

    /* ── Separador vertical ── */
    const dvG = this.add.graphics();
    dvG.lineStyle(1, 0xD4AF37, 0.1);
    dvG.lineBetween(444, 35, 444, h-35);

    /* ── Panel de contenido (mitad derecha) ──
       Alto dinámico según contenido real: con los fondos de imagen, dejar el
       panel a pantalla completa deja un bloque vacío debajo de los botones. */
    const PX = 455, PY = 55, PW = w - PX - 18;
    const DIALOG_H = 148;
    const contentH = this._npcKey === 'mercader'
      ? 160   // 2 botones de elección (34..90 y 104..160, relativo al inicio del panel)
      : 22 + this._puzzleIds.length * 78; // header + N botones de enigma
    const PH = Math.min(h - PY - 18, 50 + DIALOG_H + 14 + contentH + 46);
    const panG = this.add.graphics();
    panG.fillStyle(0x0c0e1a, 0.88);
    panG.fillRoundedRect(PX, PY, PW, PH, 10);
    panG.lineStyle(1, 0xD4AF37, 0.18);
    panG.strokeRoundedRect(PX, PY, PW, PH, 10);
    panG.lineStyle(1, 0xD4AF37, 0.06);
    panG.strokeRoundedRect(PX+3, PY+3, PW-6, PH-6, 8);

    // Título del NPC en cabecera
    this.add.text(PX + PW/2, PY+24, npcData.nombre.toUpperCase(), {
      fontFamily:'Cinzel', fontSize:'12px', color:'#D4AF37', fontStyle:'700', letterSpacing:3
    }).setOrigin(0.5);
    const hdG = this.add.graphics();
    hdG.lineStyle(1, 0xD4AF37, 0.22);
    hdG.lineBetween(PX+18, PY+42, PX+PW-18, PY+42);

    /* ── Caja de diálogo ── */
    const DY = PY + 50, DH = 148;
    const dlgG = this.add.graphics();
    dlgG.fillStyle(0x08090f, 0.92);
    dlgG.fillRoundedRect(PX+12, DY, PW-24, DH, 6);
    dlgG.lineStyle(1, 0x303850, 0.7);
    dlgG.strokeRoundedRect(PX+12, DY, PW-24, DH, 6);

    // Icono "diálogo"
    this.add.text(PX+24, DY+10, '✦', {
      fontFamily:'Cinzel', fontSize:'11px', color:'#D4AF37', alpha:0.5
    });

    this._dialogueTxt = this.add.text(PX+42, DY+10, '', {
      fontFamily:'Poppins', fontSize:'12.5px', color:'#b0bcd0',
      wordWrap:{width:PW-72}, lineSpacing:4
    }).setDepth(2);

    this._contHint = this.add.text(PX+PW-22, DY+DH-10, '▼', {
      fontFamily:'Arial', fontSize:'11px', color:'#D4AF37'
    }).setOrigin(1,1).setAlpha(0).setDepth(2);
    this.tweens.add({targets:this._contHint,
      alpha:{from:0.3, to:1}, duration:600, yoyo:true, repeat:-1});

    /* Tocar la caja salta la presentación del NPC. Sin esto había que esperar
       ~10 s (tres líneas que se escriben solas) en CADA nodo de enigma, y el
       "▼" prometía un toque que no hacía nada. */
    this.add.rectangle(PX + PW/2, DY + DH/2, PW - 24, DH, 0, 0)
      .setDepth(5).setInteractive({useHandCursor:true})
      .on('pointerup', ()=>this._skipDialogue());

    /* ── Panel de puzzles ── */
    const PUZZ_Y = DY + DH + 14;
    this._buildPuzzlePanel(PX, PUZZ_Y, PW, h);

    /* ── Mercader: menú de elección (Jugar / Tienda) ── */
    if (this._npcKey === 'mercader') {
      this._buildMerchantChoice(PX, PUZZ_Y, PW);
    }

    /* ── Botón volver ── */
    const backBtn = this.add.text(PX + PW/2, PY + PH - 24, '← Volver al mapa', {
      // Era #2a3a4a (contraste 1,7:1 sobre el fondo) con un área táctil de ~100×14 px:
      // la única salida de la pantalla casi no se veía ni se podía tocar bien.
      fontFamily:'Cinzel', fontSize:'12px', color:'#8fa6bd', padding:{x:16, y:14}
    }).setOrigin(0.5).setInteractive({useHandCursor:true}).setDepth(2);
    backBtn.on('pointerover', ()=>backBtn.setColor('#D4AF37'));
    backBtn.on('pointerout',  ()=>backBtn.setColor('#8fa6bd'));
    backBtn.on('pointerup',   ()=>this._confirmarSalida());

    /* ── Iniciar diálogo ── */
    this._dlgQueue = npcData.dialogos.intro.slice();
    this._dlgIdx   = 0;
    this._typing   = false;
    this._dlgTimer = this.time.delayedCall(800, ()=>this._nextDialogue());
  }

  /* ─── PANELES DE ENIGMAS ─── */
  _buildPuzzlePanel(PX, startY, PW, canvasH) {
    this._panelObjs = [];
    this._btnData   = [];

    const hdr = this.add.text(PX + PW/2, startY + 8, '— Elige tu enigma —', {
      fontFamily:'Cinzel', fontSize:'11px', color:'#4a6070', letterSpacing:2
    }).setOrigin(0.5).setAlpha(0).setDepth(2);
    this._panelObjs.push(hdr);

    const BH = 70, BW = PW - 26, BY0 = startY + 30;

    this._puzzleIds.forEach((pId, i) => {
      const pz = PUZZLE_CATALOG[pId];
      if (!pz) return;
      const bx = PX + 13, by = BY0 + i*(BH+8);

      // Fondo botón
      const bgBtn = this.add.graphics().setAlpha(0).setDepth(2);
      const _drawBtn = (hover)=>{
        bgBtn.clear();
        bgBtn.fillStyle(hover ? 0x14203a : 0x0c1020, hover ? 0.96 : 0.9);
        bgBtn.fillRoundedRect(bx, by, BW, BH, 6);
        bgBtn.lineStyle(1, hover ? 0xD4AF37 : 0x2a3858, hover ? 0.6 : 0.75);
        bgBtn.strokeRoundedRect(bx, by, BW, BH, 6);
      };
      _drawBtn(false);

      const titleTxt = this.add.text(bx+14, by+10, pz.nombre, {
        fontFamily:'Cinzel', fontSize:'13px', color:'#D4AF37', fontStyle:'600'
      }).setAlpha(0).setDepth(3);

      const descTxt = this.add.text(bx+14, by+30, pz.desc, {
        fontFamily:'Poppins', fontSize:'10.5px', color:'#5a7888',
        wordWrap:{width:BW-28}, lineSpacing:2
      }).setAlpha(0).setDepth(3);

      const rewTxt = this.add.text(bx+BW-12, by+BH-10, pz.recompensa.desc, {
        fontFamily:'Cinzel', fontSize:'9px', color:'#8a6a20'
      }).setOrigin(1,1).setAlpha(0).setDepth(3);

      const hit = this.add.rectangle(bx+BW/2, by+BH/2, BW, BH, 0, 0)
        .setDepth(4).setInteractive({useHandCursor:true});
      hit.disableInteractive();   // inactivo hasta que el panel se muestre

      hit.on('pointerover', ()=>{
        if (!this._puzzleShown) return;
        _drawBtn(true); titleTxt.setColor('#F5D97A');
        snd_item && snd_item();
      });
      hit.on('pointerout', ()=>{
        _drawBtn(false); titleTxt.setColor('#D4AF37');
      });
      hit.on('pointerup', ()=>{
        if (!this._puzzleShown) return;
        this._selectPuzzle(pId);
      });

      this._panelObjs.push(bgBtn, titleTxt, descTxt, rewTxt);
      this._btnData.push({bgBtn, titleTxt, descTxt, rewTxt, hit});
    });
  }

  /* ─── DIÁLOGO ─── */
  _nextDialogue() {
    /* Una llamada tardía (el temporizador de arranque o el de espera que quedó
       vivo tras saltar la presentación) no puede abrir los enigmas encima del
       menú del Mercader. */
    if (this._puzzleShown || this._choiceShown) return;
    if (this._dlgIdx >= this._dlgQueue.length) {
      setNPCState(this._npcEl, 'idle');
      if (!this._puzzleShown) {
        if (this._npcKey === 'mercader' && !this._choiceShown) this._showMerchantChoice();
        else this._showPuzzlePanel();
      }
      return;
    }
    const line = this._dlgQueue[this._dlgIdx++];
    setNPCState(this._npcEl, 'talking');
    this._typeText(line, ()=>{
      this._contHint.setAlpha(1);
      setNPCState(this._npcEl, 'idle');
      this._dlgTimer = this.time.delayedCall(1800, ()=>{
        this._contHint.setAlpha(0);
        this._nextDialogue();
      });
    });
  }

  /* Salta lo que falte de la presentación y muestra el menú. Cancela el
     tipeo y la espera pendientes: si quedara el temporizador de 1800 ms vivo,
     volvería a llamar a _nextDialogue y el Mercader abriría la lista de
     enigmas encima de su menú de elección. */
  _skipDialogue() {
    if (this._puzzleShown || this._choiceShown) return;
    if (this._typeEv)   this._typeEv.remove(false);
    if (this._dlgTimer) this._dlgTimer.remove(false);
    this._typing = false;
    const q = this._dlgQueue || [];
    if (q.length) this._dialogueTxt.setText(q[q.length - 1]);
    this._dlgIdx = q.length;
    this._contHint.setAlpha(0);
    snd_item && snd_item();
    this._nextDialogue();
  }

  _typeText(str, onDone) {
    this._dialogueTxt.setText('');
    this._typing = true;
    let i = 0;
    this._typeEv = this.time.addEvent({
      delay: 26,
      repeat: str.length - 1,
      callback: ()=>{
        this._dialogueTxt.setText(str.substring(0, ++i));
        if (i >= str.length) {
          this._typing = false;
          if (onDone) onDone();
        }
      }
    });
  }

  /* ─── MOSTRAR/SELECCIONAR ENIGMA ─── */
  _showPuzzlePanel() {
    this._puzzleShown = true;
    (this._btnData || []).forEach(b => b.hit.setInteractive({useHandCursor:true}));
    this._panelObjs.forEach((o, i) => {
      this.tweens.add({targets:o, alpha:1, duration:220, delay:i*45});
    });
  }

  /* ─── MENÚ DE ELECCIÓN DEL MERCADER ─── */
  _buildMerchantChoice(PX, startY, PW) {
    this._choiceObjs = [];

    const lbl = this.add.text(PX + PW/2, startY + 8,
      '¿Qué deseas hacer, héroe?', {
      fontFamily:'Cinzel', fontSize:'11px', color:'#4a6070', letterSpacing:2
    }).setOrigin(0.5).setAlpha(0).setDepth(3);
    this._choiceObjs.push(lbl);

    const mkBtn = (cy, label, sub, onUp) => {
      const BW = PW - 60, BX = PX + 30, BH = 56;
      const bg = this.add.graphics().setAlpha(0).setDepth(2);
      const draw = (hov) => {
        bg.clear();
        bg.fillStyle(hov ? 0x14203a : 0x0c1020, hov ? 0.96 : 0.9);
        bg.fillRoundedRect(BX, cy, BW, BH, 8);
        bg.lineStyle(1.5, hov ? 0xD4AF37 : 0x2a3858, hov ? 0.8 : 0.75);
        bg.strokeRoundedRect(BX, cy, BW, BH, 8);
      };
      draw(false);
      const t1 = this.add.text(PX + PW/2, cy + 18, label, {
        fontFamily:'Cinzel', fontSize:'15px', color:'#D4AF37', fontStyle:'700', letterSpacing:1
      }).setOrigin(0.5).setAlpha(0).setDepth(3);
      const t2 = this.add.text(PX + PW/2, cy + 39, sub, {
        fontFamily:'Poppins', fontSize:'10px', color:'#5a7888'
      }).setOrigin(0.5).setAlpha(0).setDepth(3);
      const hit = this.add.rectangle(PX + PW/2, cy + BH/2, BW, BH, 0, 0)
        .setDepth(4).setInteractive({useHandCursor:true});
      hit.disableInteractive();   // inactivo hasta que el menú se muestre
      hit.on('pointerover', ()=>{ draw(true); t1.setColor('#F5D97A'); snd_item && snd_item(); });
      hit.on('pointerout',  ()=>{ draw(false); t1.setColor('#D4AF37'); });
      hit.on('pointerup',   onUp);
      (this._choiceHits || (this._choiceHits = [])).push(hit);
      this._choiceObjs.push(bg, t1, t2, hit);
    };

    mkBtn(startY + 34, '🎲  Probar mi suerte',
      'Enfrentá los juegos de probabilidad', ()=>this._onChooseMinijuegos());
    mkBtn(startY + 104, '💰  Ver tienda',
      'Revisá la mercancía antes de avanzar', ()=>this._abrirTienda());
  }

  _showMerchantChoice() {
    this._choiceShown = true;
    (this._choiceHits || []).forEach(h => h.setInteractive({useHandCursor:true}));
    (this._choiceObjs || []).forEach((o, i) => {
      this.tweens.add({targets:o, alpha:1, duration:220, delay:i*40});
    });
  }

  _hideMerchantChoice() {
    (this._choiceObjs || []).forEach(o => {
      if (o.disableInteractive) o.disableInteractive();
      this.tweens.add({targets:o, alpha:0, duration:160});
    });
  }

  _onChooseMinijuegos() {
    snd_item && snd_item();
    this._hideMerchantChoice();
    this.time.delayedCall(180, ()=>this._showPuzzlePanel());
  }

  /* Aviso de punto de no retorno antes de entrar al minijuego (solo Mercader) */
  _confirmAdvance(pId) {
    snd_item && snd_item();
    window.__confirmAdvance = ()=>{ closeItemModal(); this._confirmedAdvance = true; this._selectPuzzle(pId); };
    window.__cancelAdvance  = ()=>{ closeItemModal(); this._abrirTienda(); };
    const html =
      '<div style="padding:12px;text-align:center;max-width:440px;margin:0 auto">' +
      '<div style="font-size:40px;margin-bottom:6px;filter:drop-shadow(0 0 8px rgba(212,175,55,0.5))">⚠️</div>' +
      '<h3 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:16px;letter-spacing:1px;margin-bottom:10px">Antes de continuar</h3>' +
      '<p style="color:#b0bcd0;font-family:\'Lora\',serif;font-size:13px;line-height:1.5;margin-bottom:6px">' +
      'Si entrás al minijuego y lo resolvés, <b style="color:#F5D97A">avanzarás a la siguiente zona</b> del mapa y ' +
      '<b style="color:#E0A0A0">no podrás volver a esta tienda</b>.</p>' +
      '<p style="color:#8a9ab0;font-family:\'Lora\',serif;font-size:12px;margin-bottom:14px">¿Seguro que no deseas comprar nada y avanzar?</p>' +
      '<div class="btn-row" style="display:flex;gap:10px;justify-content:center">' +
      '<button class="btn-action btn-secondary" onclick="window.__cancelAdvance()">' + coinSpan(13) + ' Volver a la tienda</button>' +
      '<button class="btn-action" onclick="window.__confirmAdvance()">⚔ Continuar</button>' +
      '</div></div>';
    openItemModal(html);
  }

  _selectPuzzle(pId) {
    if (this._selecting) return;
    /* Mercader: confirmar punto de no retorno antes de entrar */
    if (this._npcKey === 'mercader' && !this._confirmedAdvance) {
      this._confirmAdvance(pId);
      return;
    }
    this._selecting = true;
    const pz = PUZZLE_CATALOG[pId];
    if (!pz) return;

    // NPC reacciona
    const lines = NPC_DATA[this._npcKey].dialogos.correcto;
    const line  = lines[Math.floor(Math.random()*lines.length)];
    setNPCState(this._npcEl, 'talking');
    this._typeText(line, ()=>{
      this.time.delayedCall(700, ()=>{
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', ()=>{
          // Verificar si la escena del minijuego existe
          if (this.scene.get(pz.sceneKey)) {
            this.scene.start(pz.sceneKey, {
              puzId: pId, nodeIdx: this._nodeIdx,
              npc: this._npcKey, dificultad: STATE.dificultad || 'normal'
            });
          } else {
            // Minijuego aún no implementado — recompensar y volver al mapa
            this._completePuzzleAndReturn(pz);
          }
        });
      });
    });
  }

  _completePuzzleAndReturn(pz) {
    STATE.hp = Math.min(STATE.hp + (pz.recompensa.hp || 10), STATE.hpMax || 150);
    STATE.nodeActual = (STATE.nodeActual || 0) + 1;
    if (typeof saveGameLegend === 'function') saveGameLegend();
    else if (typeof saveGame === 'function') saveGame();
    this.scene.start('MapScene');
  }

  /* Salir sin jugar avanza el nodo y pierde la recompensa: se pide confirmación para que
     no sea un toque accidental sobre el botón (que además es chico en el celular). */
  _confirmarSalida() {
    snd_item && snd_item();
    showConfirm(
      'Si salís sin resolver el enigma avanzás de zona sin su recompensa (HP, oro y XP) y no podés volver.',
      () => this._exitToMap(),
      { title:'¿Salir sin jugar?', okLabel:'Salir igual' }
    );
  }

  _exitToMap() {
    snd_item && snd_item();
    STATE.nodeActual = (STATE.nodeActual || 0) + 1;
    if (typeof saveGameLegend === 'function') saveGameLegend();
    else if (typeof saveGame === 'function') saveGame();
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', ()=>this.scene.start('MapScene'));
  }

  /* ─── TIENDA DEL MERCADER ─── */
  _abrirTienda() {
    snd_item && snd_item();
    window.__buyShop = (id)=>this._comprar(id);

    const render = ()=>{
      const oro = STATE.oro || 0;
      const jefe = STATE.jefeActual || 0;
      const lleno = STATE.inventario.length >= (CFG.MAX_INVENTORY_SLOTS || 6);
      /* Catálogo por niveles: vendible si tiene precio y está desbloqueado */
      const VENTA = ITEMS.filter(it => it.precio && (it.minJefe||0) <= jefe).map(it => it.id);
      let html = '<div style="padding:8px;">';
      html += `<h3 style="color:#D4AF37;text-align:center;margin-bottom:4px;font-family:'Cinzel',serif;font-size:15px;letter-spacing:2px;text-transform:uppercase">Mercancía del Mercader</h3>`;
      html += `<p style="text-align:center;color:#F5D97A;font-family:'Cinzel',serif;font-size:14px;margin-bottom:12px">${coinSpan(15)} Tu oro: ${oro}</p>`;
      if (lleno) html += '<p style="text-align:center;color:#E05548;font-size:12px;margin-bottom:8px;font-family:\'Lora\',serif">⚠ Bolsa llena (6/6): usá o liberá espacio para comprar.</p>';
      html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">';
      VENTA.forEach(id=>{
        const it = ITEMS[id-1];
        const puede = oro >= precioItem(STATE.clase, it.precio) && !lleno;
        html += `<div class="card" style="text-align:center;padding:12px">
          <div style="font-size:34px;filter:drop-shadow(0 0 8px rgba(212,175,55,0.5))">${it.emoji}</div>
          <div style="color:#D4AF37;font-family:'Cinzel',serif;font-size:12px;letter-spacing:1px;margin-top:6px">${it.nombre}</div>
          <div style="color:#5fcf88;font-size:11px;margin-top:4px;font-family:'Lora',serif">${it.efecto}</div>
          <button class="btn-action ${puede?'':'btn-secondary'}" style="margin-top:8px;width:100%;${puede?'':'opacity:.5;cursor:not-allowed'}" ${puede?`onclick="window.__buyShop(${id})"`:''}>${coinSpan(13)} ${precioItem(STATE.clase, it.precio)}</button>
        </div>`;
      });
      html += '</div>';
      html += '<div class="btn-row" style="margin-top:16px"><button class="btn-action btn-secondary" onclick="closeItemModal()">&#9665; Cerrar</button></div>';
      html += '</div>';
      openItemModal(html);
    };
    window.__renderShop = render;
    render();
  }

  _comprar(id) {
    const it = ITEMS[id-1];
    if (!it) return;
    const oro = STATE.oro || 0;
    if (oro < precioItem(STATE.clase, it.precio)) { showToast('💰 Oro insuficiente'); return; }
    if (STATE.inventario.length >= (CFG.MAX_INVENTORY_SLOTS || 6) &&
        !STATE.inventario.find(s=>s.id===id)) {
      showToast('⚠ Bolsa llena'); return;
    }
    if (!addItemToInventory(id)) { showToast('⚠ Bolsa llena'); return; }
    STATE.oro = oro - precioItem(STATE.clase, it.precio);
    snd_buff && snd_buff();
    if (typeof saveGame === 'function') saveGame();
    showToast(`${it.emoji} ${it.nombre} comprado · −${precioItem(STATE.clase, it.precio)} 💰`);
    if (window.__renderShop) window.__renderShop();
  }

  shutdown() {
    if (this._npcDOM) { this._npcDOM.destroy(); this._npcDOM = null; }
    if (this._npcEl  && this._npcEl.parentNode) {
      this._npcEl.parentNode.removeChild(this._npcEl);
    }
  }
}
