class BattleScene extends Phaser.Scene {
  constructor(){ super('BattleScene'); }

  preload(){
    const m = MONSTERS[STATE.jefeActual];
    if(m && typeof bgLoad === 'function') bgLoad(this, m.forma);
  }

  create(){
    const w=this.scale.width, h=this.scale.height;
    this.w=w; this.h=h;
    const L = this.L = this._layout(w, h);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Validar jefe
    if(STATE.jefeActual >= MONSTERS.length){ this.scene.start('FinalScene'); return; }
    const m = MONSTERS[STATE.jefeActual];
    this.monster = JSON.parse(JSON.stringify(m));
    const _st = statsDeMonstruo(m, STATE.dificultad);
    STATE.jefeHp    = _st.hp;
    STATE.jefeHpMax = STATE.jefeHp;

    // Registro de tiradas de esta batalla, para el resumen didáctico post-victoria.
    this._battleLog = { jugador: [], monstruo: [] };
    this.monster.ataque  = _st.ataque;
    this.monster.defensa = _st.defensa;
    STATE.turnoActual = 0;
    this._proximoDialogo = 1 + Math.floor(Math.random()*2);
    STATE.buffs = [];
    STATE.ataque = STATE.ataqueBase + bonusAtaqueCampaña(STATE.jefeActual, STATE.dificultad);
    STATE.defensa = STATE.defensaBase;
    STATE.reduccionDaño = 0;
    this._bonoBatalla = bonoPermanente(STATE.clase, STATE.resiliencia);   // para el análisis tras una derrota
    this._racha = 0;                 // Guerrero: impactos seguidos
    this._primerPoderUsado = false;  // Hechicero: el primer poder de la batalla cuesta menos
    // La escena se reutiliza entre batallas: una maldición pendiente de la
    // anterior (derrota con el Doble 1 sin revertir) no puede heredarse, porque
    // el primer impacto de ESTA batalla la "revertiría" sumando ataque y
    // defensa que nunca se restaron acá.
    this._curseAtkReduc = this._curseDefReduc = 0;
    STATE.mp = STATE.mpMax || 4;
    // Música: jefe final tiene tema propio
    Music.play(m.esFinal ? 'boss' : 'battle');
    STATE.flagCrown=STATE.flagGem=STATE.flagStar=STATE.flagKey=false;
    this._battleObjUsed       = 0;
    this._battleReceivedDamage= false;
    this._battleRollStart     = (STATE.stats && STATE.stats.tiradas) ? STATE.stats.tiradas.length : 0;

    /* Modificador de batalla aleatorio: niebla (umbral oculto 1er turno) o
       bendición (media desplazada +1). Ninguno en el tutorial (primer jefe). */
    this._modBatalla = null;
    this._nieblaRevelada = false;
    if(STATE.jefeActual > 0){
      const _rMod = Math.random();
      if(_rMod < 0.20) this._modBatalla = 'niebla';
      else if(_rMod < 0.40) this._modBatalla = 'bendicion';
    }
    if (STATE.hp > STATE.hpMax) STATE.hp = STATE.hpMax;

    // Dar objetos iniciales según dificultad (primera batalla, inventario vacío)
    if(STATE.jefeActual === 0 && STATE.inventario.length === 0){
      const _diffItems = DIFICULTADES[STATE.dificultad] || DIFICULTADES.normal;
      const n = itemsIniciales(STATE.clase, _diffItems.itemsIniciales);
      if(n > 0){
        const items = darItemsAleatorios(n);
        const nombres = items.map(r=>ITEMS[r.id-1].emoji+' '+ITEMS[r.id-1].nombre).join(', ');
        this.time.delayedCall(1200, ()=>{
          showToast(`🎒 Comienzas con: ${nombres}`);
        });
      } else {
        this.time.delayedCall(1200, ()=>showToast('💀 Modo Legendario: sin objetos iniciales. ¡Buena suerte!'));
      }
    }

    // Tutorial guiado en la primera batalla (una sola vez por dispositivo).
    // setTimeout nativo: el clock de la escena puede arrancar con timeScale
    // alterado (hitStop) y demorar el delayedCall.
    if(STATE.jefeActual === 0 && typeof startBattleTutorial === 'function'){
      setTimeout(()=>{ try{ if(this.scene.isActive()) startBattleTutorial(); }catch(e){} }, 900);
    }

    // Toast de Resiliencia tras derrota
    if(STATE._resilNotify){
      STATE._resilNotify = false;
      this.time.delayedCall(1800, ()=>{
        showToast(`✨ Resiliencia +1 — ahora +${STATE.resiliencia} a tus tiradas`);
      });
    }

    // Fondo (fallback debajo de la imagen)
    const bg = this.add.graphics().setDepth(-12);
    bg.fillGradientStyle(0x111520, 0x111520, 0x0D0D14, 0x0D0D14, 1);
    bg.fillRect(0,0,w,h);

    // Imagen de fondo del calabozo según el monstruo + efectos dinámicos
    const _hayBg = (typeof bgMount === 'function') && bgMount(this, m.forma, { depth:-11, fxDepth:-8 });
    if(_hayBg){
      // Oscurecedor: legibilidad de HUD/barras sobre la imagen
      const bgDark = this.add.graphics().setDepth(-9);
      bgDark.fillStyle(0x07070E, 0.40); bgDark.fillRect(0,0,w,h);
    } else {
      // Sin imagen: estrellas sutiles como antes
      for(let i=0;i<50;i++){
        this.add.circle(Math.random()*w, Math.random()*h*0.5, Math.random()*1.2+0.3, 0xC0C8D0, Math.random()*0.25);
      }
    }

    // --- ENCABEZADO: NOMBRE DEL MONSTRUO ---
    this.add.text(w/2, L.nombreY, m.nombre, {fontFamily:'Cinzel', fontSize:L.nombreFs, color:'#D4AF37', fontStyle:'700', stroke:'#0A0A10', strokeThickness:L.compacto?3:4, shadow:{offsetX:0,offsetY:0,color:'#D4AF37',blur:L.compacto?8:16,fill:true}}).setOrigin(0.5);

    const jefeNum = this.add.text(w/2, L.guardY, `Guardián ${STATE.jefeActual+1} de 10`, {fontFamily:'Poppins', fontSize:L.guardFs, color:'#9eb5c8'}).setOrigin(0.5);

    // --- IMAGEN DEL MONSTRUO (SVG+CSS) ---
    // Escala/posición por monstruo: con los nuevos fondos los monstruos lucen
    // mejor más grandes. El Espectro conserva su tamaño; el resto se agranda y
    // baja para que los pies queden detrás del panel del jugador.
    // Valores calculados para altura visible uniforme (cabeza ~235, pies tras el
    // panel del jugador) a partir del bbox real de cada SVG. El Espectro conserva
    // su tamaño menor (s:1.68) por pedido de diseño.
    // Monstruo ubicado entre la barra de HP (≈142) y el panel del jugador (536),
    // SIN invadir el panel: el monstruo es DOM (encima del canvas) y el HUD debe
    // verse al frente. Valores derivados del bbox real (cabeza ~165, pies ~525).
    const MON_VIEW = {
      espectro:{ s:1.68, cy:279 },
      hidra:   { s:1.61, cy:336 },
      golem:   { s:1.99, cy:294 },
      bruja:   { s:1.66, cy:334 },
      tiburon: { s:1.88, cy:306 },
      dragon:  { s:1.65, cy:333 },
      espiritu:{ s:1.93, cy:304 },
      titan:   { s:1.78, cy:315 },
      esfinge: { s:1.96, cy:296 },
      demiurgo:{ s:1.70, cy:327 },
    };
    const _mv = MON_VIEW[m.forma] || { s:1.80, cy:315 };
    // En el teléfono el monstruo se achica (monK) y se sube para quedar entre la barra y el panel.
    const _monS  = _mv.s * L.monK;
    const _monCY = L.monBase + L.monK * (_mv.cy - 165);
    this._monScale = _monS;
    this.monsterCX = L.monX; this.monsterCY = _monCY;
    const monSvg = createMonsterDOM(this, m.forma, m.color, this.monsterCX, this.monsterCY, _monS);
    this.monsterDom   = monSvg.domObj;
    this.monsterState = monSvg.setState;
    this.monsterDom.setDepth(0);   // lo más al fondo posible (detrás de dados/globo)
    // Legacy graphics kept for backwards compat (hidden)
    this.monsterGraphics = this.add.graphics().setVisible(false);
    this.monsterTick = 0;

    // Frase épica removida — se muestra como globo de diálogo del monstruo

    // --- HP MONSTRUO (arriba, bajo el nombre — libera el centro para el monstruo) ---
    this._enemyBarY = L.barY;
    this.enemyBarBg = this.add.graphics();
    // Track visible (no se mezcla con el fondo oscuro) + borde
    this.enemyBarBg.fillStyle(0x232c3e, 0.96); this.enemyBarBg.fillRoundedRect(L.barX, L.barY, L.barW, L.barH, 4);
    this.enemyBarBg.lineStyle(1, 0x4a5a72, 0.85); this.enemyBarBg.strokeRoundedRect(L.barX, L.barY, L.barW, L.barH, 4);
    this.enemyBar = this.add.graphics();
    this.enemyHpTxt = this.add.text(w/2, L.barY+L.barH/2, '', {fontFamily:'Courier New', fontSize:L.barFs, color:'#fff', fontStyle:'bold'}).setOrigin(0.5);
    this.drawEnemyBar();

    // --- PROBABILIDAD DE IMPACTO ---
    this.probText = this.add.text(w/2, L.probY, this._probTexto(), {fontFamily:'Poppins', fontSize:L.probFs, color:'#C0C8D0', backgroundColor:'#0A0A10', padding:{x:9,y:4}, fontStyle:'600'}).setOrigin(0.5).setDepth(5);

    // Anuncio del modificador de batalla (si aplica)
    if(this._modBatalla === 'niebla'){
      this.time.delayedCall(700, ()=>this.mostrarMensaje('🌫️ Niebla mística: el umbral está oculto hasta tu 2da tirada', '#8aa0b8', 3200, 'A'));
    } else if(this._modBatalla === 'bendicion'){
      this.time.delayedCall(700, ()=>this.mostrarMensaje('✨ Bendición: tus tiradas tienen +1 esta batalla', '#f5d76e', 3200, 'A'));
    }

    // --- PANEL DEL JUGADOR (más angosto: empieza más abajo, deja más aire al monstruo) ---
    const PY = L.PY;
    this.PY = PY;
    this._hpBarY = L.hp.y;
    this._mpBarY = L.mp.y;

    // Fondo panel jugador — diferenciado visualmente de la zona del monstruo
    const playerPanel = this.add.graphics();
    playerPanel.fillStyle(0x050d18, L.compacto ? 0.82 : 0.6);
    playerPanel.fillRoundedRect(L.panel.x, L.panel.y, L.panel.w, L.panel.h, 10);
    playerPanel.lineStyle(1.5, 0xD4AF37, 0.5);
    playerPanel.strokeRoundedRect(L.panel.x, L.panel.y, L.panel.w, L.panel.h, 10);
    playerPanel.lineStyle(1, 0xD4AF37, 0.12);
    playerPanel.lineBetween(20, PY+1, w-20, PY+1);
    // Esquinas decorativas
    if(!L.compacto) [[16, PY+7], [w-16, PY+7]].forEach(([ex, ey]) => {
      playerPanel.fillStyle(0xD4AF37, 0.5);
      playerPanel.fillCircle(ex, ey, 3.5);
    });
    // Separadores verticales: 3 columnas (stats | dados | botones)
    const colSep = this.add.graphics();
    colSep.lineStyle(1, 0xD4AF37, 0.15);
    L.seps.forEach(sx => colSep.lineBetween(sx, PY+8, sx, h-14));

    // --- ÁREA DE DADOS (DOM, mismo sistema que dados del monstruo) ---
    this.dice1Pos = L.dice1;
    this.dice2Pos = L.dice2;
    this._injectPlayerDiceCSS();
    this.pDie1Dom = this._makePlayerDie(this.dice1Pos.x, this.dice1Pos.y);
    this.pDie2Dom = this._makePlayerDie(this.dice2Pos.x, this.dice2Pos.y);
    this.pDie1Dom.setDepth(1);
    this.pDie2Dom.setDepth(1);
    this.drawDice(1, 1);

    // --- DADOS DEL MONSTRUO como DOM (capa HTML encima del SVG del monstruo) ---
    // El monstruo es un elemento DOM; la capa HTML siempre se renderiza sobre el
    // canvas de Phaser. Por eso los dados también son DOM (con z-index alto) para
    // que aparezcan DELANTE del monstruo, sin tener que volverlo transparente.
    this._mDiceColor = m.color;
    const mDiceColor = `#${(m.color >> 16 & 0xff).toString(16).padStart(2,'0')}${(m.color >> 8 & 0xff).toString(16).padStart(2,'0')}${(m.color & 0xff).toString(16).padStart(2,'0')}`;
    const mDiceLightness = ((m.color >> 16 & 0xff)*0.299 + (m.color >> 8 & 0xff)*0.587 + (m.color & 0xff)*0.114);
    const mTxtColor = mDiceLightness > 140 ? '#0A0A10' : '#F5E9C9';
    this._mDiceTxtHex = mTxtColor;
    this._mDiceTheme = this._buildDiceTheme(m.forma);
    this._injectDiceCSS();

    this.mDie1Dom = this._makeMonsterDie(w/2-L.mDiceDX, L.mDiceY);
    this.mDie2Dom = this._makeMonsterDie(w/2+L.mDiceDX, L.mDiceY);
    // depth > monsterDom (1) para que el wrapper Phaser tenga z-index mayor
    this.mDie1Dom.setDepth(2);
    this.mDie2Dom.setDepth(2);

    // Label "ataca" encima (también DOM para quedar delante del monstruo)
    this.mDiceLabel = this.add.dom(w/2, L.mLabelY).createFromHTML(
      `<div style="font-family:Cinzel,serif;font-weight:700;font-size:${L.mLabelFs};letter-spacing:2px;` +
      `color:${mDiceColor};white-space:nowrap;text-shadow:0 0 6px rgba(0,0,0,.9)">⚔ ATAQUE DEL GUARDIÁN</div>`
    ).setOrigin(0.5).setDepth(2);
    this.mDiceLabel.node.style.zIndex = '50';
    this.mDiceLabel.node.style.pointerEvents = 'none';
    this.mDiceLabel.setAlpha(0);

    // Un solo arreglo para fade in/out
    this._mDiceObjects = [this.mDie1Dom, this.mDie2Dom, this.mDiceLabel];

    // Dado clickeables — tocar cualquier dado lanza los dados
    const diceHitArea = this.add.rectangle(L.hit.x, L.hit.y, L.hit.w, L.hit.h, 0, 0).setInteractive({useHandCursor:true});
    diceHitArea.on('pointerover', ()=>{
      this.tweens.add({targets:[this.pDie1Dom, this.pDie2Dom], alpha:0.78, duration:120});
    });
    diceHitArea.on('pointerout', ()=>{
      this.tweens.add({targets:[this.pDie1Dom, this.pDie2Dom], alpha:1, duration:120});
    });
    diceHitArea.on('pointerdown', ()=>{
      this.tweens.add({targets:[this.pDie1Dom, this.pDie2Dom], scale:{from:0.9, to:1}, duration:80, ease:'Back.easeOut'});
    });
    diceHitArea.on('pointerup', ()=>this.tirarDados());
    this._diceHitArea = diceHitArea;

    if(L.compacto){
      // El monstruo es DOM y tapa al texto del canvas: el resultado también va en DOM, con fondo.
      const dom = this.add.dom(L.resultX, L.resultY).createFromHTML(
        `<div style="font-family:Cinzel,serif;font-weight:700;font-size:${L.resultFs};color:#D4AF37;white-space:nowrap;` +
        `background:rgba(10,10,16,.78);padding:2px 12px;border-radius:6px;text-shadow:0 1px 3px #000"></div>`
      ).setOrigin(0.5).setDepth(6);
      dom.node.style.zIndex = '48';
      dom.node.style.pointerEvents = 'none';
      dom.setText = (t)=>{ dom.node.firstChild.textContent = t; return dom; };
      this.diceResultTxt = dom;
    } else {
      this.diceResultTxt = this.add.text(L.resultX, L.resultY, '', {fontFamily:'Cinzel', fontSize:L.resultFs, color:'#D4AF37', fontStyle:'700'}).setOrigin(0.5);
    }

    // ── Predicción pre-tirada (opcional): mini-ejercicio de estimación ──
    // P(≥13) = 78/144 ≈ 54.2% · P(≤12) = 66/144 ≈ 45.8%
    this._prediccionJugador = null;
    this._predRacha = 0;
    const predY = L.compacto ? 0 : L.predTitulo.y;
    if(!L.compacto) this.add.text(w/2, predY, '🔮 ¿Cómo saldrá tu tirada?', {
      fontFamily:'Poppins', fontSize:L.predTitulo.fs, color:'#5a7090'
    }).setOrigin(0.5);
    const PRED_OFF = L.compacto ? '#8aa0bd' : '#5a7090';
    this._predOff = PRED_OFF;
    const mkPredBtn = (x, label, key) => {
      const t = this.add.text(x, L.chips.y, label, {
        fontFamily:'Cinzel', fontSize:L.chips.fs, color:PRED_OFF, fontStyle:'700', align:'center',
        backgroundColor:'#141a26', padding:{x:L.chips.padX, y:L.chips.padY}
      }).setOrigin(0.5);
      if(L.chips.w) t.setFixedSize(L.chips.w, L.chips.h);
      t.setInteractive({useHandCursor:true});
      t.on('pointerup', ()=>{
        if(this.dadoEnCurso) return;
        this._prediccionJugador = (this._prediccionJugador === key) ? null : key;
        this._predBtns.forEach(b => b.setColor(b._predKey === this._prediccionJugador ? '#D4AF37' : PRED_OFF)
                                      .setBackgroundColor(b._predKey === this._prediccionJugador ? '#2A2010' : '#141a26'));
        snd_item && snd_item();
      });
      t._predKey = key;
      return t;
    };
    this._predBtns = [
      mkPredBtn(L.dice1.x/2 + L.dice2.x/2 - L.chips.dx, L.chips.a, 'alto'),
      mkPredBtn(L.dice1.x/2 + L.dice2.x/2 + L.chips.dx, L.chips.b, 'bajo'),
    ];

    // --- ESTADO DEL JUGADOR (HUD — columna izquierda) ---
    if(L.showName) this.add.text(L.nameX, L.nameY, `⚔ ${STATE.nombre}`, {fontFamily:'Cinzel', fontSize:L.nameFs, color:'#D4AF37', letterSpacing:1}).setOrigin(0.5);

    // HP del jugador
    this.playerBarBg = this.add.graphics();
    this.playerBarBg.fillStyle(0x1a2535, 0.9); this.playerBarBg.fillRoundedRect(L.hp.x, L.hp.y, L.hp.w, L.hp.h, 4);
    this.playerBarBg.lineStyle(1, 0x3a4d66, 0.8); this.playerBarBg.strokeRoundedRect(L.hp.x, L.hp.y, L.hp.w, L.hp.h, 4);
    this.playerBar = this.add.graphics();
    this.playerHpTxt = this.add.text(L.hpCx, L.hp.y + L.hp.h/2, '', {fontFamily:'Courier New', fontSize:L.hpFs, color:'#fff', fontStyle:'bold'}).setOrigin(0.5);
    this.drawPlayerBar();
    this.drawMpBar();

    // Stats del jugador (columna izquierda, debajo de MP)
    this.statsText = this.add.text(L.statsX, L.statsY, '', {fontFamily:'Poppins', fontSize:L.statsFs, color:'#C0C8D0', align:'center',
      wordWrap: L.statsW ? {width:L.statsW} : undefined}).setOrigin(0.5, L.statsOrigin);
    this.updateStatsText();
    // Etiqueta columna central
    if(L.tituloDados) this.add.text(w/2, L.tituloDados.y, 'TIRAR DADOS', {fontFamily:'Cinzel', fontSize:'10px', color:'#D4AF37', letterSpacing:3}).setOrigin(0.5).setAlpha(0.4);

    // --- BOTÓN INVENTARIO (discreto, en el panel del jugador) ---
    // "Tirar dados" no necesita botón: se tira tocando los propios dados.
    // "Opciones" pasa a un engranaje DOM arriba-izq (ver _initGearButton).
    this.btnInv = this.makeButton(L.btnX, L.btnInvY, L.btnW, L.btnH, '📦 Inventario', 0x8E44AD, 0xE8D0F0, ()=>this.abrirInventario(), L.btnFs);

    // Engranaje de opciones: botón DOM fijo arriba-izq, junto al control de sonido.
    this._initGearButton();

    // Badge de dificultad (izquierda, encima de resiliencia si aplica)
    const _diffBadge = DIFICULTADES[STATE.dificultad] || DIFICULTADES.normal;
    const _diffColors = {facil:0x27ae60, normal:0x2980b9, heroe:0xc0392b, legendario:0x6c0000};
    const _diffCol = _diffColors[STATE.dificultad] || 0x2980b9;
    {
      const B = L.badge;
      const dbg = this.add.graphics();
      dbg.fillStyle(_diffCol, 0.18); dbg.fillRoundedRect(B.x, B.y, B.w, B.h, 6);
      dbg.lineStyle(2, _diffCol, 0.8); dbg.strokeRoundedRect(B.x, B.y, B.w, B.h, 6);
      this.add.text(B.tx, B.ty, _diffBadge.label, {fontFamily:'Poppins', fontSize:B.fs, color:L.compacto ? '#e8eef5' : '#'+_diffCol.toString(16).padStart(6,'0'), fontStyle:'700'});
    }

    // Panel Resiliencia (izquierda)
    if(STATE.resiliencia > 0){
      const B = L.badge;
      const resBg = this.add.graphics();
      resBg.fillStyle(0xD4AF37, 0.12); resBg.fillRoundedRect(B.x, B.resY, B.w, B.h, 6);
      resBg.lineStyle(2, 0xD4AF37, 0.55); resBg.strokeRoundedRect(B.x, B.resY, B.w, B.h, 6);
      this.add.text(B.tx, B.resY + (B.ty - B.y), L.compacto ? `✨ Resil. +${STATE.resiliencia}` : `✨ Resiliencia +${STATE.resiliencia}`, {fontFamily:'Poppins', fontSize:B.fs, color:'#D4AF37', fontStyle:'600'});
      // Aura dorada alrededor del jugador (texto)
      this.auraPlayer = this.add.text(L.auraX, L.auraY, '✨ ✨ ✨', {fontSize:L.compacto ? '14px' : '13px', color:'#D4AF37', alpha:0.6}).setOrigin(0.5);
      this.tweens.add({targets:this.auraPlayer, alpha:{from:0.3, to:1}, duration:1000, yoyo:true, repeat:-1});
    }

    // Mensaje de combate — DOM (delante del monstruo, que es DOM en depth 0).
    if(!document.getElementById('__combatMsgCSS')){
      const st = document.createElement('style'); st.id = '__combatMsgCSS';
      st.textContent = `
        .combat-msg{display:block;width:600px;max-width:calc(100vw - 24px);box-sizing:border-box;margin:0 auto;
          padding:8px 18px;background:rgba(10,10,16,.88);border-radius:8px;
          font-family:Poppins,sans-serif;font-weight:700;font-size:19px;color:#2ecc71;
          text-align:center;line-height:1.3;text-shadow:0 2px 4px #000,0 0 2px #000;
          pointer-events:none;}
      `;
      document.head.appendChild(st);
    }
    this.combatMsg = this.add.dom(w/2, L.msgY).createFromHTML('<div class="combat-msg"></div>')
      .setDepth(7).setVisible(false);
    this.combatMsg.node.style.zIndex = '45';
    this._combatMsgEl = this.combatMsg.node.querySelector('.combat-msg');
    // El ancho y la letra dependen de la pantalla (teléfono: 16 px y sin pasarse del lienzo).
    this._combatMsgEl.style.width = L.msgW + 'px';
    this._combatMsgEl.style.fontSize = L.msgFs;

    // Tutorial al iniciar
    if(STATE.jefeActual === 0){
      this.mostrarMensaje(TUTORIALES[1 + Math.floor(Math.random()*9)], '#9b59b6', 6000);
    } else if(Math.random() < 0.4) {
      this.mostrarMensaje(MSG_CONCEPTO[Math.floor(Math.random()*MSG_CONCEPTO.length)], '#3498db', 5500);
    }

    // Flotación manejada por CSS animation en el SVG
    this.monsterBaseY = this.monsterCY;

    // Globo de diálogo del monstruo (se muestra cada 3 tiradas).
    // DOM (no canvas) para quedar SIEMPRE delante del monstruo, que es DOM en
    // depth 0. Posición fija en el hueco bajo la barra de HP del enemigo.
    if(!document.getElementById('__monBalloonCSS')){
      const st = document.createElement('style'); st.id = '__monBalloonCSS';
      st.textContent = `
        .mon-balloon{position:relative;width:300px;box-sizing:border-box;
          padding:9px 16px;background:rgba(6,6,12,.9);border:2px solid #ff6600;
          border-radius:11px;font-family:Poppins,sans-serif;font-weight:600;
          font-size:13px;color:#ffcc88;text-align:center;line-height:1.25;
          text-shadow:0 1px 3px #000;box-shadow:0 4px 18px rgba(0,0,0,.6);
          pointer-events:none;}
        .mon-balloon::after{content:'';position:absolute;left:50%;bottom:-11px;
          transform:translateX(-50%);border-left:9px solid transparent;
          border-right:9px solid transparent;border-top:11px solid #ff6600;}
        .mon-balloon::before{content:'';position:absolute;left:50%;bottom:-7px;
          transform:translateX(-50%);border-left:7px solid transparent;
          border-right:7px solid transparent;border-top:8px solid rgba(6,6,12,.95);z-index:1;}
      `;
      document.head.appendChild(st);
    }
    this.dialogueBalloon = this.add.dom(L.balloonX, L.balloonY)
      .createFromHTML('<div class="mon-balloon"></div>')
      .setDepth(6).setVisible(false);
    this.dialogueBalloon.node.style.zIndex = '40';
    this.dialogueTxt = this.dialogueBalloon.node.querySelector('.mon-balloon');
    this.dialogueTxt.style.width = L.balloonW + 'px';
    this.dialogueTxt.style.fontSize = L.balloonFs;

    // Dado Sagrado HUD (esquina inferior izquierda, encima de los botones)
    this._dadoSagradoCooldown = 0;
    this._dadoSagradoG  = this.add.graphics();
    this._dadoSagradoT  = this.add.text(0, 0, '', { fontFamily:'Cinzel', fontSize:'22px', color:'#fff', fontStyle:'800', stroke:'#1a5c2a', strokeThickness:2 }).setOrigin(0.5);
    this._dadoSagradoLbl = this.add.text(0, 0, '', { fontFamily:'Poppins', fontSize:L.compacto ? '14px' : '10px', color:'#a0ffc0', fontStyle:'600' }).setOrigin(0.5);
    this._dadoSagradoHit = this.add.zone(L.dsX, L.dsY, 56, L.compacto ? 60 : 56).setOrigin(0.5);
    this._drawDadoSagrado();

    this._segAlientoUsado = false;
    this.turnoJugador = true;
    this.dadoEnCurso = false;

    // Flags de poderes activos (Task 10)
    this._freezeMonstruo  = false;
    this._maldicionDado   = null;
    this._truncarSuma     = null;
    this._espejoActivo    = 0;
    this._reflejoArmado   = 0;
    this._sanguijuelaArmada = 0;
    this._cargaArmada     = 0;
    this._prediccionApuesta = null;   // una apuesta sin cobrar (ganaste antes del ataque rival) pasaba a la batalla siguiente

    saveGame();

    // Limpieza al salir de la escena (victoria, derrota, "volver al menú"):
    // sin esto, tweens/timers en vuelo pueden disparar contra objetos ya
    // destruidos, y el panel del Grimorio (agregado directo a document.body,
    // fuera del display list de Phaser) sobrevive indefinidamente si la
    // escena se cierra con el panel abierto.
    this.events.once('shutdown', () => {
      this.tweens.killAll();
      this.time.removeAllEvents();
      if (this._poderesOpen) this._closePoderes();
    });

    this.buildPowerButtons();

    // Lore se muestra en el dossier del mapa — ir directo al turno
    this.time.delayedCall(1200, ()=>{ if(this.scene.isActive()) this._mostrarGloboDial(); });
  }

  /* Medidas de la pantalla de batalla.
     Escritorio/tablet (lienzo 1024×700): las de siempre.
     Teléfono apaisado (lienzo = pantalla real, alto < 500): letras ≥ 14 px y botones ≥ 44 px. */
  _layout(w, h){
    if(h >= 500){
      const PY = 536;
      return {
        compacto:false, PY,
        nombreY:35, nombreFs:'32px', guardY:70, guardFs:'17px',
        barX:w/2-180, barY:98, barW:360, barH:26, barFs:'17px', probY:142, probFs:'15px',
        monK:1, monBase:165, monX:w/2,
        mDieSize:64, mDieFs:'30px', mDiceDX:55, mDiceY:280, mLabelY:238, mLabelFs:'13px', mResY:332, mResFs:'15px',
        balloonX:w/2, balloonY:176, balloonW:300, balloonFs:'13px',
        msgY:PY-34, msgW:600, msgFs:'19px',
        panel:{x:8, y:PY, w:w-16, h:h-PY-6}, seps:[354, 670],
        hp:{x:18, y:PY+28, w:310, h:15}, hpFs:'12px', hpCx:173,
        mp:{x:18, y:PY+50, w:200, h:8}, mpFs:'11px', mpInside:false,
        nameY:PY+12, nameFs:'13px', nameX:176, showName:true,
        statsX:176, statsY:PY+68, statsFs:'11px', statsW:0, statsOrigin:0.5,
        pDieSize:72, pDieFs:'32px', dice1:{x:w/2-55, y:PY+62}, dice2:{x:w/2+55, y:PY+62},
        hit:{x:w/2, y:PY+62, w:210, h:80},
        resultX:w/2, resultY:PY+111, resultFs:'20px', resultStroke:false,
        tituloDados:{y:PY+14}, predTitulo:{y:PY+131, fs:'10px'},
        chips:{y:PY+146, dx:52, fs:'12px', w:0, h:0, padY:4, padX:9, a:'≥ 13  (54%)', b:'≤ 12  (46%)'},
        btnX:844, btnW:200, btnH:32, btnFs:'14px', btnInvY:PY+113, btnPoderY:PY+57,
        dsX:42, dsY:PY+128, auraX:176, auraY:PY+2,
        badge:{x:15, y:15, w:170, h:36, tx:25, ty:22, fs:'17px', resY:15},
        floatY:28, dmgFloatY:24, dmgFloatDX:100,
      };
    }
    const PY = h - 100;
    const colA = Math.min(240, Math.round(w*0.29)), colC = Math.min(256, Math.round(w*0.31));
    const xC0 = w - colC - 4, colB = xC0 - colA - 8, cxB = Math.round((colA + xC0)/2);
    const btnW = colC - 62;
    const chipW = Math.floor((colB - 20)/2);
    return {
      compacto:true, PY,
      nombreY:17, nombreFs:'20px', guardY:38, guardFs:'14px',
      barX:w/2-150, barY:52, barW:300, barH:22, barFs:'14px', probY:90, probFs:'14px',
      monK:0.45, monBase:112, monX:w/2,
      mDieSize:48, mDieFs:'22px', mDiceDX:40, mDiceY:166, mLabelY:126, mLabelFs:'14px', mResY:206, mResFs:'16px',
      balloonX:Math.round(w/2 + 150 + Math.min(240, w*0.3)/2), balloonY:150, balloonW:Math.min(240, Math.round(w*0.3)), balloonFs:'14px',
      msgY:PY-50, msgW:Math.min(600, w-24), msgFs:'14px',   // el aviso de 2 líneas no pasa detrás del panel del jugador
      panel:{x:4, y:PY, w:w-8, h:h-PY-4}, seps:[colA+2, xC0-2],
      hp:{x:8, y:PY+6, w:colA-16, h:18}, hpFs:'14px', hpCx:8+(colA-16)/2,
      mp:{x:8, y:PY+28, w:colA-16, h:16}, mpFs:'14px', mpInside:true,
      nameY:PY+4, nameFs:'14px', nameX:colA/2, showName:false,
      statsX:colA/2, statsY:PY+50, statsFs:'14px', statsW:colA-12, statsOrigin:0,
      pDieSize:44, pDieFs:'22px', dice1:{x:cxB-28, y:PY+27}, dice2:{x:cxB+28, y:PY+27},
      hit:{x:cxB, y:PY+27, w:colB-16, h:52},
      resultX:cxB, resultY:PY-14, resultFs:'16px', resultStroke:true,
      tituloDados:null, predTitulo:null,
      chips:{y:PY+74, dx:chipW/2+4, fs:'14px', w:chipW, h:44, padY:13, padX:0, a:'🔮 ≥ 13 · 54%', b:'🔮 ≤ 12 · 46%'},
      btnX:xC0 + 56 + btnW/2, btnW, btnH:44, btnFs:'15px', btnInvY:PY+27, btnPoderY:PY+72,
      dsX:xC0+26, dsY:PY+48, auraX:colA/2, auraY:PY+1,
      badge:{x:6, y:108, w:128, h:26, tx:14, ty:110, fs:'14px', resY:138},
      floatY:28, dmgFloatY:24, dmgFloatDX:100,
    };
  }

  _mostrarLore(m){
    const lore = MONSTER_LORE[STATE.jefeActual];
    const w=this.w, h=this.h;
    const col = m.color;
    const r=(col>>16)&0xff, g=(col>>8)&0xff, b=col&0xff;

    // Ocultar DOM del monstruo y dados del jugador (capas HTML siempre encima del canvas)
    if(this.monsterDom) this.monsterDom.setVisible(false);
    if(this.pDie1Dom) this.pDie1Dom.setVisible(false);
    if(this.pDie2Dom) this.pDie2Dom.setVisible(false);

    // ── Capa de bloqueo total de input (impide clicks en botones traseros) ──
    const inputBlock = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0)
      .setDepth(59).setInteractive(); // absorbe todos los clicks

    // ── Oscurecimiento ──
    const dim = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0).setDepth(60);
    this.tweens.add({targets:dim, fillAlpha:0.72, duration:500});

    // ── Partículas de aparición ──
    const particles = this.add.graphics().setDepth(61);
    const sparks=[];
    for(let i=0;i<20;i++){
      const a=Math.random()*Math.PI*2, d=80+Math.random()*100;
      sparks.push({x:w/2+Math.cos(a)*d, y:h/2+Math.sin(a)*d, alpha:0.9,
        vy:-1-Math.random()*2, vx:(Math.random()-.5)*2});
    }
    const sparkTimer=this.time.addEvent({delay:40,repeat:18,callback:()=>{
      particles.clear();
      sparks.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.alpha-=0.05;
        if(p.alpha>0){particles.fillStyle(col,p.alpha);particles.fillCircle(p.x,p.y,3);}
      });
    }});

    // ── Dimensiones del pergamino ──
    const scrollW=560, scrollH=420, sx=w/2-scrollW/2, sy=h/2-scrollH/2;
    const scroll = this.add.graphics().setDepth(62);
    const rollH=18;
    const btnY = sy+scrollH-58;

    // Función de dibujo del pergamino con fracción de altura
    const drawScroll = (frac)=>{
      const curH = Math.max(rollH*2+4, scrollH*frac);
      const curY = h/2 - curH/2;
      scroll.clear();
      // Sombra
      scroll.fillStyle(0x000000,0.5);
      scroll.fillRoundedRect(sx+6,curY+6,scrollW,curH,8);
      // Cuerpo pergamino
      scroll.fillGradientStyle(0xf5e6c8,0xf5e6c8,0xd4b483,0xd4b483,1);
      scroll.fillRoundedRect(sx,curY,scrollW,curH,8);
      // Borde exterior
      scroll.lineStyle(3,0x8b6b2a,1);
      scroll.strokeRoundedRect(sx,curY,scrollW,curH,8);
      // Borde interior dorado
      scroll.lineStyle(1,0xffd700,0.5);
      scroll.strokeRoundedRect(sx+5,curY+5,scrollW-10,curH-10,5);
      // Borde temático del monstruo
      scroll.lineStyle(2,col,0.35);
      scroll.strokeRoundedRect(sx+10,curY+10,scrollW-20,curH-20,4);
      // Rodillo superior
      scroll.fillStyle(0x6b4010,1);
      scroll.fillRoundedRect(sx-8,curY,scrollW+16,rollH,6);
      scroll.fillStyle(0x9b6a2a,1);
      scroll.fillRoundedRect(sx-6,curY+2,scrollW+12,rollH-4,4);
      for(const ex of [sx-8,sx+scrollW]){
        scroll.fillStyle(0x5a3000,1); scroll.fillCircle(ex+4,curY+rollH/2,rollH/2+3);
        scroll.fillStyle(0x9b6a2a,1); scroll.fillCircle(ex+4,curY+rollH/2,rollH/2);
        scroll.fillStyle(0xffd700,0.4); scroll.fillCircle(ex+4,curY+rollH/2,rollH/4);
      }
      // Rodillo inferior (solo visible al estar casi desplegado)
      if(frac>0.85){
        const bot=curY+curH;
        scroll.fillStyle(0x6b4010,1);
        scroll.fillRoundedRect(sx-8,bot-rollH,scrollW+16,rollH,6);
        scroll.fillStyle(0x9b6a2a,1);
        scroll.fillRoundedRect(sx-6,bot-rollH+2,scrollW+12,rollH-4,4);
        for(const ex of [sx-8,sx+scrollW]){
          scroll.fillStyle(0x5a3000,1); scroll.fillCircle(ex+4,bot-rollH/2,rollH/2+3);
          scroll.fillStyle(0x9b6a2a,1); scroll.fillCircle(ex+4,bot-rollH/2,rollH/2);
          scroll.fillStyle(0xffd700,0.4); scroll.fillCircle(ex+4,bot-rollH/2,rollH/4);
        }
      }
      // Manchas de envejecimiento
      if(frac>0.4){
        scroll.fillStyle(0x8b6b2a,0.1);
        scroll.fillCircle(sx+75,curY+curH*0.55,28);
        scroll.fillCircle(sx+scrollW-85,curY+curH*0.38,18);
      }
    };

    drawScroll(0.02);

    // ── Textos (todos alpha=0, revelan en cascada) ──
    const D=63;
    const titleIcon = this.add.text(w/2,sy+30,'⚔',{fontSize:'22px'}).setOrigin(0.5).setDepth(D).setAlpha(0);
    const titleTxt  = this.add.text(w/2,sy+58,lore.titulo,{
      fontFamily:'Cinzel',fontSize:'18px',color:'#3a1a00',fontStyle:'800',
      stroke:'#8b6b2a',strokeThickness:1,wordWrap:{width:510},align:'center'
    }).setOrigin(0.5).setDepth(D).setAlpha(0);
    const guardTxt  = this.add.text(w/2,sy+84,`— Guardián ${STATE.jefeActual+1} de 10 —`,{
      fontFamily:'Poppins',fontSize:'13px',color:'#8b6b2a',fontStyle:'italic'
    }).setOrigin(0.5).setDepth(D).setAlpha(0);
    const divG = this.add.graphics().setDepth(D).setAlpha(0);
    divG.lineStyle(2,col,0.65); divG.lineBetween(sx+30,sy+98,sx+scrollW-30,sy+98);
    const histTxt = this.add.text(w/2,sy+112,lore.historia,{
      fontFamily:'Poppins',fontSize:'12px',color:'#2a1200',
      wordWrap:{width:510},lineSpacing:3,align:'justify'
    }).setOrigin(0.5,0).setDepth(D).setAlpha(0);
    const datoTxt = this.add.text(w/2,sy+218,lore.dato,{
      fontFamily:'Poppins',fontSize:'12px',color:'#1a3a52',
      wordWrap:{width:490},lineSpacing:2,align:'center',
      backgroundColor:'rgba(26,58,82,0.08)',padding:{x:8,y:5}
    }).setOrigin(0.5,0).setDepth(D).setAlpha(0);
    const consejoTxt = this.add.text(w/2,sy+292,`⚔ ${lore.consejo}`,{
      fontFamily:'Poppins',fontSize:'12px',color:'#1a5c2a',
      wordWrap:{width:490},lineSpacing:2,align:'center',fontStyle:'600'
    }).setOrigin(0.5,0).setDepth(D).setAlpha(0);

    // ── Botón "Comenzar enfrentamiento" ──
    const btnG = this.add.graphics().setDepth(D).setAlpha(0);
    const drawBtn = (hover=false)=>{
      btnG.clear();
      btnG.fillStyle(hover ? 0xffe44a : col, 1);
      btnG.fillRoundedRect(w/2-130,btnY,260,44,9);
      btnG.fillStyle(0xffffff,0.18);
      btnG.fillRoundedRect(w/2-128,btnY+2,256,18,7);
      btnG.lineStyle(2.5,0xffd700,0.9);
      btnG.strokeRoundedRect(w/2-130,btnY,260,44,9);
    };
    drawBtn();
    const btnTxt = this.add.text(w/2,btnY+22,'⚔ ¡Comenzar Enfrentamiento!',{
      fontFamily:'Cinzel',fontSize:'13px',color:'#fff',fontStyle:'800',
      stroke:'#000',strokeThickness:2
    }).setOrigin(0.5).setDepth(D+1).setAlpha(0);

    // Lista de todos los objetos para destruir al cerrar
    const allObjs=[inputBlock,dim,particles,scroll,
      titleIcon,titleTxt,guardTxt,divG,histTxt,datoTxt,consejoTxt,btnG,btnTxt];

    // ── Función cerrar: enrolla y destruye todo ──
    let cerrando=false;
    const cerrar=()=>{
      if(cerrando) return;
      cerrando=true;
      // Ocultar botón inmediatamente
      hitZone.disableInteractive();
      btnG.setAlpha(0); btnTxt.setAlpha(0);
      // Ocultar textos
      [titleIcon,titleTxt,guardTxt,divG,histTxt,datoTxt,consejoTxt].forEach(o=>{
        if(o&&o.active) this.tweens.add({targets:o,alpha:0,duration:180});
      });
      this.tweens.add({targets:dim,fillAlpha:0,duration:500,delay:100});
      // Enrollar pergamino
      let f2=1;
      const rollUp=this.time.addEvent({delay:14,repeat:35,callback:()=>{
        f2=Math.max(0,f2-0.03); drawScroll(f2);
      }});
      // Destruir todo tras la animación
      this.time.delayedCall(550,()=>{
        allObjs.forEach(o=>{ try{if(o&&o.active)o.destroy();}catch(e){} });
        if(hitZone&&hitZone.active) hitZone.destroy();
        if(this.monsterDom) this.monsterDom.setVisible(true);
        if(this.pDie1Dom) this.pDie1Dom.setVisible(true);
        if(this.pDie2Dom) this.pDie2Dom.setVisible(true);
        STATE.loreVisto.push(STATE.jefeActual);
        this.turnoJugador=true;
        this.time.delayedCall(800, ()=>{ if(this.scene.isActive()) this._mostrarGloboDial(); });
      });
    };

    // ── Zona de hit del botón ──
    // Usar hitArea explícita para garantizar interactividad sin importar el alpha visual
    const hitZone = this.add.zone(w/2, btnY+22, 260, 44)
      .setDepth(D+2)
      .setInteractive({useHandCursor:true});

    let hitPresionado = false;
    hitZone.on('pointerover',  ()=>{ drawBtn(true);  btnTxt.setScale(1.04); });
    hitZone.on('pointerout',   ()=>{ drawBtn(false); btnTxt.setScale(1); });
    hitZone.on('pointerdown',  ()=>{ btnTxt.setScale(0.95); hitPresionado=true; });
    hitZone.on('pointerup',    ()=>{ if(hitPresionado){ hitPresionado=false; cerrar(); } });
    hitZone.on('pointerupoutside', ()=>{ if(hitPresionado){ hitPresionado=false; cerrar(); } });

    // ── Animación de despliegue ──
    let frac=0.02, revealed=false;
    const unfurl=this.time.addEvent({delay:16,loop:true,callback:()=>{
      frac=Math.min(1,frac+0.045);
      drawScroll(frac);
      if(frac>=1 && !revealed){
        revealed=true;
        unfurl.remove();
        // Revelar textos en cascada
        this.time.delayedCall(60,  ()=>{ if(!cerrando) this.tweens.add({targets:[titleIcon,titleTxt,guardTxt,divG],alpha:1,duration:320}); });
        this.time.delayedCall(250, ()=>{ if(!cerrando) this.tweens.add({targets:histTxt,alpha:1,duration:400}); });
        this.time.delayedCall(450, ()=>{ if(!cerrando) this.tweens.add({targets:datoTxt,alpha:1,duration:300}); });
        this.time.delayedCall(620, ()=>{ if(!cerrando) this.tweens.add({targets:consejoTxt,alpha:1,duration:300}); });
        this.time.delayedCall(820, ()=>{ if(!cerrando) this.tweens.add({targets:[btnG,btnTxt],alpha:1,duration:300}); });
      }
    }});
  }

  // ── Task 10: Power Buttons — menú desplegable ──────────────────────────────

  buildPowerButtons(){
    this._poderesOpen   = false;
    this._poderesPanel  = null;
    const adquiridos = SKILL_TREE.filter(p =>
      skillRank(STATE.skills, p.id) > 0 && p.tipo !== 'pasivo');

    const L = this.L;
    const btnX = L.btnX, btnY = L.btnPoderY;

    if(adquiridos.length === 0){
      // Sin poderes: mostrar bloqueado (siempre visible)
      this._toggleBtn = this.makeButton(btnX, btnY, L.btnW, L.btnH, '📖 Grimorio', 0x2a2a2a, L.compacto ? 0x9aa3ad : 0x666666, ()=>{}, L.btnFs);
      if(this._toggleBtn && this._toggleBtn.hit) this._toggleBtn.hit.disableInteractive();
      return;
    }

    // Botón toggle columna derecha
    this._toggleBtn = this.makeButton(
      btnX, btnY, L.btnW, L.btnH,
      `📖 Grimorio (${adquiridos.length}) ▲`,
      0x1a5fa0, 0x7ec8ff,
      () => this._togglePoderes(),
      L.btnFs
    );
    this._poderesAdquiridos = adquiridos;
    this.refreshPowerButtons();
  }

  refreshPowerButtons(){
    if(!this._poderesPanel) return;
    const rows = this._poderesPanel.querySelectorAll('.poder-row');
    rows.forEach(row => {
      const id   = row.dataset.id;
      const p    = getPower(id);
      const rank = skillRank(STATE.skills, id);
      const ok   = (STATE.mp || 0) >= this._costoPoder(id) && this.turnoJugador;
      row.style.opacity = ok ? '1' : '0.35';
      row.querySelector('.poder-btn').style.cursor = ok ? 'pointer' : 'default';
    });
  }

  _togglePoderes(){
    if(this._poderesOpen){ this._closePoderes(); }
    else                  { this._openPoderes();  }
  }

  _openPoderes(){
    if(this._poderesPanel) return;
    this._poderesOpen = true;
    if(this._toggleBtn && this._toggleBtn.t)
      this._toggleBtn.t.setText(`📖 Grimorio (${this._poderesAdquiridos.length}) ▼`);

    const L = this.L;
    const by = L.btnPoderY;
    const panelH = L.compacto ? Math.min(this._poderesAdquiridos.length * 84 + 16, by - L.btnH/2 - 12)
                              : Math.min(this._poderesAdquiridos.length * 72 + 16, 320);
    const panelY = L.compacto ? Math.max(4, by - L.btnH/2 - 6 - panelH) : by - panelH - 10;
    const fzBtn = L.compacto ? 13 : 11, fzCost = L.compacto ? 12 : 9, fzDesc = L.compacto ? 13 : 9.5, fzTit = L.compacto ? 12 : 11;
    const anchoPanel = L.compacto ? Math.min(380, this.w - 16) : 310;

    const html = `
      <div id="poderes-panel" style="
        position:fixed; right:8px; top:${panelY}px;
        width:${anchoPanel}px; max-height:${panelH}px; overflow-y:auto;
        background:rgba(5,13,24,0.97);
        border:1.5px solid #D4AF37;
        border-radius:10px;
        padding:8px 6px;
        box-shadow:0 0 18px rgba(0,0,0,0.9);
        z-index:9000;
        font-family:'Cinzel',serif;
      ">
        <div style="color:#D4AF37;font-size:${fzTit}px;text-align:center;letter-spacing:2px;margin-bottom:6px;opacity:0.85">— PODERES ACTIVOS —</div>
        ${this._poderesAdquiridos.map(p => {
          const rank = skillRank(STATE.skills, p.id);
          const cost = this._costoPoder(p.id);
          const ok   = (STATE.mp || 0) >= cost && this.turnoJugador;
          return `
            <div class="poder-row" data-id="${p.id}" style="
              opacity:${ok ? 1 : 0.35};
              border-bottom:1px solid rgba(212,175,55,0.15);
              padding:6px 4px; margin-bottom:4px;
            ">
              <div style="display:flex;align-items:center;gap:8px;">
                <button class="poder-btn" data-id="${p.id}" style="
                  background:linear-gradient(135deg,#1a5fa0,#0d3a6e);
                  border:1px solid #7ec8ff;
                  color:#ddeeff; font-family:'Cinzel',serif;
                  font-size:${fzBtn}px; font-weight:700;
                  padding:${L.compacto ? '10px 12px' : '5px 10px'}; border-radius:6px; min-height:${L.compacto ? 44 : 0}px;
                  cursor:${ok ? 'pointer' : 'default'};
                  white-space:nowrap; flex-shrink:0;
                ">${p.nombre}<br><span style="color:#aad4ff;font-size:${fzCost}px">${cost} MP</span></button>
                <span style="color:${L.compacto ? '#b5c2d3' : '#8a9ab0'};font-size:${fzDesc}px;font-family:'Poppins',sans-serif;line-height:1.4">${p.desc}</span>
              </div>
            </div>`;
        }).join('')}
      </div>`;

    const domEl = document.createElement('div');
    domEl.innerHTML = html;
    document.body.appendChild(domEl);
    this._poderesPanel = domEl.querySelector('#poderes-panel');

    // Event listeners en los botones
    this._poderesPanel.querySelectorAll('.poder-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const p    = getPower(id);
        const rank = skillRank(STATE.skills, id);
        if((STATE.mp || 0) < this._costoPoder(id) || !this.turnoJugador) return;
        this._closePoderes();
        this.usarPoder(id);
      });
    });

    // Cerrar al hacer click fuera del panel
    this._poderOutside = (e) => {
      if(this._poderesPanel && !this._poderesPanel.contains(e.target)){
        this._closePoderes();
      }
    };
    setTimeout(() => document.addEventListener('pointerdown', this._poderOutside), 50);
  }

  _closePoderes(){
    this._poderesOpen = false;
    if(this._toggleBtn && this._toggleBtn.t && this._toggleBtn.t.active)
      this._toggleBtn.t.setText(`📖 Grimorio (${(this._poderesAdquiridos||[]).length}) ▲`);
    if(this._poderesPanel){
      try{ this._poderesPanel.parentElement && this._poderesPanel.parentElement.remove(); }catch(e){}
      this._poderesPanel = null;
    }
    if(this._poderOutside) document.removeEventListener('pointerdown', this._poderOutside);
  }

  /* Costo de MP de un poder con el descuento de clase del primero de la batalla. */
  _costoPoder(id){
    const p = getPower(id);
    return costoPoder(STATE.clase, p.mp[skillRank(STATE.skills, id) - 1], !this._primerPoderUsado);
  }

  usarPoder(id){
    const p    = getPower(id);
    const rank = skillRank(STATE.skills, id);
    const cost = this._costoPoder(id);
    if ((STATE.mp || 0) < cost || !this.turnoJugador) return;
    STATE.mp -= cost;
    this._primerPoderUsado = true;
    snd_power();
    const rk = p.ranks[rank - 1];
    switch (id) {
      case 'escarcha':
        this._freezeMonstruo = true;
        snd_freeze();
        this.mostrarMensaje('❄️ Congelado', '#9fc2ff', 2200, 'A');
        break;
      case 'maldicionDado':
        this._maldicionDado = { dados: rk.dados, caras: rk.caras };
        this.mostrarMensaje('Monstruo: 1 dado', '#9fc2ff', 2200, 'A');
        break;
      case 'truncar':
        this._truncarSuma = truncarValor(rank);
        this.mostrarMensaje(`Tirada fijada: ${this._truncarSuma}`, '#9fc2ff', 2200, 'A');
        break;
      case 'egida':
        // Integra con STATE.reduccionDaño; registra buff tipo 'egida' procesado
        // igual que 'cheb' en el filtro de turnoMonstruo (turnosRestantes--)
        STATE.reduccionDaño = Math.max(STATE.reduccionDaño || 0, rk.red);
        STATE.buffs.push({ tipo:'egida', valor:rk.red, turnosRestantes:rk.turnos, emoji:'[E]' });
        this.mostrarMensaje(`Escudo ${Math.round(rk.red*100)}% (${rk.turnos}t)`, '#2ecc71', 2200, 'A');
        break;
      case 'regeneracion':
        STATE.buffs.push({ tipo:'regen', valor:rk.heal, turnosRestantes:rk.turnos, emoji:'[R]' });
        this.mostrarMensaje(`+${rk.heal} HP × ${rk.turnos}t`, '#2ecc71', 2200, 'A');
        break;
      case 'espejoVar':
        this._espejoActivo = rank;
        this.mostrarMensaje('🪞 Espejo armado', '#9fc2ff', 2200, 'A');
        break;
      case 'reflejo':
        this._reflejoArmado = rank;
        this.mostrarMensaje('↩ Reflejo armado', '#9fc2ff', 2200, 'A');
        break;
      case 'sanguijuela':
        this._sanguijuelaArmada = rank;
        this.mostrarMensaje('🩸 Sanguijuela armada', '#9fc2ff', 2200, 'A');
        break;
      case 'cargaProb':
        this._cargaArmada = rank;
        this.mostrarMensaje('⚡ Carga lista', '#9fc2ff', 2200, 'A');
        break;
      case 'prediccion':
        if (this.pedirPrediccion) this.pedirPrediccion(rank);
        break;
    }
    this.drawMpBar();
    this.refreshPowerButtons();
  }

  pedirPrediccion(rank){
    const p = getPower('prediccion');
    const bins = p.ranks[rank - 1].bins;
    const opciones = bins === 2 ? ['bajo', 'alto'] : ['bajo', 'medio', 'alto'];
    const probTxt = { 2: { bajo: '46%', alto: '54%' }, 3: { bajo: '25%', medio: '50%', alto: '25%' } }[bins];
    this._predBtns = [];
    let bx = this.w / 2 - (opciones.length * 118) / 2 + 55, by = 360;
    for (const op of opciones) {
      // El pago acompaña a la probabilidad: lo improbable paga más.
      const b = this.makeButton(bx, by, 110, 34, `${op} ${probTxt[op]} +${p.ranks[rank - 1].pago[op]}`, 0x8e44ad, 0xffffff, () => {
        this._prediccionApuesta = { apuesta: op, rank };
        for (const btn of this._predBtns) {
          if (btn && btn.g) btn.g.destroy();
          if (btn && btn.hit) btn.hit.destroy();
          if (btn && btn.glow) btn.glow.destroy();
        }
        this._predBtns = [];
        this.mostrarMensaje(`Apostaste: ${op}.`, '#9fc2ff');
      });
      this._predBtns.push(b);
      bx += 118;
    }
  }

  // ── End Task 10 ─────────────────────────────────────────────────────────────

  getUmbralEfectivo(){
    let u = this.monster.umbral;
    if(STATE.flagStar) u -= 2; // Estrella de Varianza reduce umbral
    return Math.max(2, u);
  }

  /* Texto de la barra de probabilidad, respetando la niebla mientras no fue revelada. */
  _probTexto(){
    if(this._modBatalla === 'niebla' && !this._nieblaRevelada){
      return '🌫️ Niebla mística: umbral oculto hasta tu 2da tirada';
    }
    const umbralEf = this.getUmbralEfectivo();
    /* Los bonos permanentes (Resiliencia, bonus del Arquero) se SUMAN a la tirada, así
       que bajan el número que tienen que mostrar los dados. La barra decía el 54 % de
       siempre aunque el héroe tuviera +3 de Resiliencia: la probabilidad "exacta" que
       mostraba no era la real. */
    const bono = bonoPermanente(STATE.clase, STATE.resiliencia);
    const umbralDados = Math.max(2, umbralEf - bono);
    const casosFav = casosFavorables(umbralDados);
    const pct = (casosFav/CFG.DICE_COMBOS*100).toFixed(2);
    const conBonos = bono > 0 ? ` (−${bono} por tus bonos: ${umbralDados}+ en los dados)` : '';
    return `🎯 Probabilidad de Impacto: Necesitas ${umbralEf}+${conBonos} | ${casosFav} casos / ${CFG.DICE_COMBOS} (${pct}%)`;
  }

  makeButton(x, y, w, h, label, accentColor, txtColor, action, fs='14px'){
    const container = this.add.container(x, y);

    // Fondo dark panel
    const bg = this.add.graphics();
    bg.fillStyle(0x0D0D14, 1);
    bg.fillRect(-w/2, -h/2, w, h);

    // Relleno interior muy sutil del color acento
    const tint = this.add.graphics();
    const tr = (accentColor >> 16) & 0xff, tg = (accentColor >> 8) & 0xff, tb = accentColor & 0xff;
    tint.fillStyle(accentColor, 0.10);
    tint.fillRect(-w/2+1, -h/2+1, w-2, h-2);

    // Borde del color acento
    const border = this.add.graphics();
    border.lineStyle(1, accentColor, 0.75);
    border.strokeRect(-w/2, -h/2, w, h);

    // Línea highlight superior
    const hi = this.add.graphics();
    hi.lineStyle(1, accentColor, 0.22);
    hi.lineBetween(-w/2+2, -h/2+1, w/2-2, -h/2+1);

    // Sombra externa
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.45);
    shadow.fillRect(-w/2+3, -h/2+5, w, h);

    // Texto
    const txtHex = `#${txtColor.toString(16).padStart(6,'0')}`;
    const t = this.add.text(0, 0, label, {
      fontFamily:'Cinzel, serif', fontSize:fs, letterSpacing:1,
      color: txtHex, fontStyle:'600'
    }).setOrigin(0.5);

    container.add([shadow, bg, tint, border, hi, t]);

    // Glow externo en hover
    const glow = this.add.graphics();
    glow.lineStyle(1, accentColor, 0.6);
    glow.strokeRect(x-w/2-2, y-h/2-2, w+4, h+4);
    glow.setAlpha(0);

    const hit = this.add.rectangle(x, y, w, h, 0, 0).setInteractive({useHandCursor:true});
    hit.on('pointerover', ()=>{
      this.tweens.add({targets:container, scale:1.04, duration:140, ease:'Sine.easeOut'});
      this.tweens.add({targets:glow, alpha:1, duration:160});
      t.setColor('#F5D97A');
      snd_item();
    });
    hit.on('pointerout', ()=>{
      this.tweens.add({targets:container, scale:1, duration:140});
      this.tweens.add({targets:glow, alpha:0, duration:140});
      t.setColor(txtHex);
    });
    hit.on('pointerdown', ()=>{ this.tweens.add({targets:container, scale:0.96, duration:60, yoyo:true}); });
    hit.on('pointerup', action);
    return {g:container, t, hit, glow};
  }

  drawEnemyBar(){
    this.enemyBar.clear();
    const pct = Math.max(0, STATE.jefeHp / STATE.jefeHpMax);
    const L = this.L;
    const w = (L.barW - 4) * pct;
    const col = pct > 0.5 ? 0xe74c3c : pct > 0.25 ? 0xe67e22 : 0x8b0000;
    this.enemyBar.fillStyle(col, 1);
    this.enemyBar.fillRoundedRect(L.barX+2, L.barY+2, Math.max(2,w), L.barH-4, 3);
    this.enemyHpTxt.text = `HP: ${Math.max(0,STATE.jefeHp)} / ${STATE.jefeHpMax}`;
  }

  drawPlayerBar(){
    this.playerBar.clear();
    const pct = Math.max(0, STATE.hp / STATE.hpMax);
    const L = this.L;
    const fw = (L.hp.w - 4) * pct;
    const col = pct > 0.5 ? 0x2ecc71 : pct > 0.25 ? 0xf1c40f : 0xe74c3c;
    this.playerBar.fillStyle(col, 1);
    this.playerBar.fillRoundedRect(L.hp.x+2, L.hp.y+2, Math.max(2,fw), L.hp.h-4, 3);
    this.playerHpTxt.text = `HP: ${Math.max(0,STATE.hp)} / ${STATE.hpMax}`;
  }

  drawMpBar(){
    // La escena se reutiliza entre batallas; al reiniciar Phaser destruye los
    // objetos (la referencia sobrevive pero queda destruida → .scene === null).
    // Recrear si falta o quedó destruido, si no la barra de MP no reaparece.
    if (!this._mpBarG || !this._mpBarG.scene) { this._mpBarG = this.add.graphics().setDepth(40); }
    const g = this._mpBarG; g.clear(); g.setVisible(true);
    const L = this.L;
    const x = L.mp.x, y = L.mp.y, bw = L.mp.w, bh = L.mp.h;
    const frac = STATE.mpMax ? (STATE.mp || 0) / STATE.mpMax : 0;
    g.fillStyle(0x0c1020, 0.85); g.fillRoundedRect(x, y, bw, bh, 4);
    g.fillStyle(0x3a7bd5, 1);    g.fillRoundedRect(x, y, bw * frac, bh, 4);
    g.lineStyle(1, 0x6fa8ff, 0.6); g.strokeRoundedRect(x, y, bw, bh, 4);
    if (!this._mpTxt || !this._mpTxt.scene) {
      this._mpTxt = this.add.text(L.mpInside ? x + bw/2 : x + bw + 8, L.mpInside ? y + bh/2 : y - 1, '', {
        fontFamily:'Cinzel', fontSize:L.mpFs, color:L.mpInside ? '#ffffff' : '#9fc2ff', fontStyle:L.mpInside ? '700' : 'normal'
      }).setOrigin(L.mpInside ? 0.5 : 0, L.mpInside ? 0.5 : 0).setDepth(41);
    }
    this._mpTxt.setVisible(true);
    this._mpTxt.setText(`MP ${STATE.mp||0}/${STATE.mpMax||0}`);
    if (this.refreshPowerButtons) this.refreshPowerButtons();
  }

  updateStatsText(){
    let buffStr = '';
    if(STATE.buffs.length>0){
      buffStr = '  · Buffs: ' + STATE.buffs.map(b=>b.emoji).join(' ');
    }
    const rachaStr = bonusRacha(STATE.clase, this._racha) > 0 ? `  🔥 Racha +${bonusRacha(STATE.clase, this._racha)}` : '';
    this.statsText.text = this.L.compacto
      ? `Atk ${STATE.ataque} · Def ${STATE.defensa} · Res +${STATE.resiliencia} · Oro ${STATE.oro||0}${rachaStr}${buffStr}`
      : `⚔ Atk: ${STATE.ataque}  🛡 Def: ${STATE.defensa}  ✨ Res: +${STATE.resiliencia}  Oro: ${STATE.oro||0}${rachaStr}${buffStr}`;
  }

  drawDice(v1, v2){
    const f1 = this.pDie1Dom && this.pDie1Dom.node.querySelector('.pdie-face');
    if(f1) f1.textContent = String(v1);
    const f2 = this.pDie2Dom && this.pDie2Dom.node.querySelector('.pdie-face');
    if(f2) f2.textContent = v2 === 0 ? '' : String(v2);
  }

  _buildDiceTheme(forma){
    const T = {
      espectro: { radius:'50%', clip:'',
        bg:'radial-gradient(circle at 38% 35%, rgba(200,150,255,.96), #6b1eb2)',
        border:'2px dashed rgba(190,130,255,.75)', shadow:'0 0 14px rgba(155,89,182,.6),0 4px 12px rgba(0,0,0,.5)',
        anim:'mdie-pulse 2.2s ease-in-out infinite',
        animCSS:'@keyframes mdie-pulse{0%,100%{opacity:.82}50%{opacity:1}}' },

      hidra: { radius:'8px 2px 8px 2px/2px 8px 2px 8px', clip:'',
        bg:'linear-gradient(135deg,#2ecc71 0%,#1a7042 70%)',
        border:'3px solid #0a4a1e', shadow:'0 0 8px rgba(39,174,96,.4),0 5px 14px rgba(0,0,0,.6)',
        anim:'', animCSS:'' },

      golem: { radius:'2px', clip:'',
        bg:'linear-gradient(150deg,#b2bac4 0%,#7c8490 45%,#5c6268 100%)',
        border:'4px double #3a4048', shadow:'0 6px 0 rgba(0,0,0,.55),0 8px 18px rgba(0,0,0,.75)',
        anim:'', animCSS:'' },

      bruja: { radius:'0', clip:'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
        bg:'radial-gradient(ellipse at 45% 40%,#c060e8,#580e8a)',
        border:'none', shadow:'none',
        anim:'mdie-bruja 2.8s ease-in-out infinite',
        animCSS:'@keyframes mdie-bruja{0%,100%{filter:drop-shadow(0 0 8px rgba(150,60,200,.7))}50%{filter:drop-shadow(0 0 18px rgba(200,80,255,1))}}' },

      tiburon: { radius:'4px 4px 28px 28px', clip:'',
        bg:'linear-gradient(178deg,#5dade2 0%,#1f618d 55%,#103450 100%)',
        border:'3px solid #0c2d45', shadow:'0 6px 16px rgba(41,128,185,.4),0 8px 22px rgba(0,0,0,.65)',
        anim:'mdie-tiburon 2.4s ease-in-out infinite',
        animCSS:'@keyframes mdie-tiburon{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}' },

      dragon: { radius:'12px 2px 12px 2px', clip:'',
        bg:'linear-gradient(135deg,#e74c3c 0%,#7a0a0a 65%)',
        border:'3px solid #500000', shadow:'0 0 12px rgba(255,50,0,.6),0 5px 16px rgba(0,0,0,.65)',
        anim:'mdie-dragon 1.5s ease-in-out infinite',
        animCSS:'@keyframes mdie-dragon{0%,100%{box-shadow:0 0 8px rgba(255,50,0,.5),0 5px 16px rgba(0,0,0,.65)}50%{box-shadow:0 0 22px rgba(255,130,0,.95),0 5px 16px rgba(0,0,0,.65)}}' },

      espiritu: { radius:'40% 60% 62% 38%/44% 40% 60% 56%', clip:'',
        bg:'radial-gradient(ellipse at 45% 40%,rgba(26,188,156,.92),rgba(8,68,56,1))',
        border:'2px dashed rgba(70,220,170,.5)', shadow:'0 0 10px rgba(26,188,156,.5),0 4px 12px rgba(0,0,0,.5)',
        anim:'mdie-espiritu 3s ease-in-out infinite',
        animCSS:'@keyframes mdie-espiritu{0%,100%{opacity:.92}50%{opacity:.65}}' },

      titan: { radius:'4px', clip:'',
        bg:'linear-gradient(148deg,#ec8c30 0%,#9c4a00 60%)',
        border:'5px double #4a2000', shadow:'0 8px 0 rgba(0,0,0,.6),0 10px 24px rgba(0,0,0,.82)',
        anim:'', animCSS:'' },

      esfinge: { radius:'0', clip:'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)',
        bg:'linear-gradient(138deg,#f4d040 0%,#9a6800 55%,#c89000 100%)',
        border:'none', shadow:'none',
        anim:'mdie-esfinge 3.5s ease-in-out infinite',
        animCSS:'@keyframes mdie-esfinge{0%,100%{filter:drop-shadow(0 0 8px rgba(212,160,23,.65))}50%{filter:drop-shadow(0 0 18px rgba(255,210,30,1))}}' },

      demiurgo: { radius:'5px', clip:'',
        bg:'linear-gradient(135deg,#ff4848 0%,#660000 55%)',
        border:'3px solid #ff1010', shadow:'0 0 20px rgba(255,0,0,.85),0 5px 18px rgba(0,0,0,.7)',
        anim:'mdie-demiurgo .5s steps(2) infinite',
        animCSS:'@keyframes mdie-demiurgo{0%{box-shadow:0 0 18px rgba(255,0,0,.85),0 5px 18px rgba(0,0,0,.7)}50%{box-shadow:0 0 28px rgba(255,80,0,1),0 5px 18px rgba(0,0,0,.7);filter:brightness(1.15)}}' },
    };
    return T[forma] || T.espectro;
  }

  _injectDiceCSS(){
    const id = 'mdie-anim-css';
    let el = document.getElementById(id);
    if(!el){ el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
    el.textContent = this._mDiceTheme.animCSS || '';
  }

  _injectPlayerDiceCSS(){
    const id = 'pdie-css';
    let el = document.getElementById(id);
    if(!el){ el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
    el.textContent =
      '.pdie-shine{position:absolute;top:7px;left:9px;right:9px;height:14px;border-radius:5px;background:rgba(255,255,200,.42);pointer-events:none}' +
      '.pdie-face{position:relative;z-index:1;line-height:1;user-select:none}';
  }

  _makePlayerDie(x, y){
    const html =
      `<div style="width:${this.L.pDieSize}px;height:${this.L.pDieSize}px;border-radius:12px;` +
      `background:linear-gradient(145deg,#fae77d 0%,#e8b832 52%,#bf7e10 100%);` +
      `border:2.5px solid #966800;` +
      `box-shadow:0 5px 0 #7a5500,0 7px 18px rgba(0,0,0,.55),inset 0 2px 5px rgba(255,248,180,.4);` +
      `display:flex;align-items:center;justify-content:center;` +
      `font-family:Cinzel,serif;font-size:${this.L.pDieFs};font-weight:800;color:#2a1200;` +
      `text-shadow:0 1px 0 rgba(255,220,100,.7),0 -1px 1px rgba(80,40,0,.3);` +
      `position:relative;overflow:hidden">` +
      `<div class="pdie-shine"></div>` +
      `<span class="pdie-face">1</span>` +
      `</div>`;
    const dom = this.add.dom(x, y).createFromHTML(html);
    dom.setOrigin(0.5);
    dom.node.style.zIndex = '10';
    dom.node.style.pointerEvents = 'none';
    return dom;
  }

  _makeMonsterDie(x, y){
    const th = this._mDiceTheme;
    const clipSt = th.clip ? `clip-path:${th.clip};` : '';
    const animSt = th.anim ? `animation:${th.anim};`  : '';
    const html =
      `<div class="mdie-face" style="width:${this.L.mDieSize}px;height:${this.L.mDieSize}px;` +
      `border-radius:${th.radius};${clipSt}` +
      `background:${th.bg};` +
      `border:${th.border};box-shadow:${th.shadow};${animSt}` +
      `display:flex;align-items:center;justify-content:center;` +
      `font-family:Cinzel,serif;font-weight:800;font-size:${this.L.mDieFs};color:${this._mDiceTxtHex};` +
      `text-shadow:0 1px 2px rgba(0,0,0,.4)">?</div>`;
    const dom = this.add.dom(x, y).createFromHTML(html);
    dom.setOrigin(0.5);
    dom.node.style.zIndex = '50';
    dom.node.style.pointerEvents = 'none';
    dom.setAlpha(0);
    return dom;
  }

  drawMonsterDice(v1, v2){
    if(this.mDie1Dom){
      const f1 = this.mDie1Dom.node.querySelector('.mdie-face');
      if(f1) f1.textContent = String(v1);
    }
    if(this.mDie2Dom){
      const f2 = this.mDie2Dom.node.querySelector('.mdie-face');
      // v2===0 ocurre con Maldición de un dado → ocultar el segundo dado
      if(f2){ f2.textContent = String(v2); }
      this.mDie2Dom.node.style.visibility = (v2 === 0) ? 'hidden' : 'visible';
    }
  }


  mostrarMensaje(txt, color='#2ecc71', duration=4500, style='default'){
    if(style === 'B'){
      // DOM overlay: siempre encima del monstruo (DOM supera canvas de Phaser)
      // Inyectar keyframes una sola vez
      if(!document.__heroesBStyle){
        const st = document.createElement('style');
        st.textContent = `
          @keyframes _hbSlam{
            0%  {opacity:1;transform:translateX(-50%) scale(1.65);}
            18% {opacity:1;transform:translateX(-50%) scale(0.78);}
            26% {opacity:1;transform:translateX(-50%) scale(0.84);}
            75% {opacity:1;transform:translateX(-50%) scale(0.84);}
            100%{opacity:0;transform:translateX(-50%) scale(0.84) translateY(-32px);}
          }
          ._hbMsg{
            position:fixed;left:50%;
            font-family:'Cinzel',Georgia,serif;font-weight:800;
            text-align:center;letter-spacing:3px;line-height:1.2;
            text-transform:uppercase;pointer-events:none;z-index:9999;
            -webkit-text-stroke:2.5px #000;
            width:88%;max-width:900px;
          }`;
        document.head.appendChild(st);
        document.__heroesBStyle = true;
      }
      // Mapear color → glow
      const glowMap = {
        '#2ecc71':['#2ecc71','#D4AF37'], '#ffd700':['#ffd700','#ff9500'],
        '#e74c3c':['#ff5533','#990000'], '#9b59b6':['#c77dff','#6a1fa8'],
        '#ff0000':['#ff3300','#880000'],
      };
      const [gc, gc2] = glowMap[color] || [color, color];
      const dur = duration / 1000;
      // Posicionar en el tercio superior (zona del monstruo)
      const canvasRect = this.game.canvas.getBoundingClientRect();
      const topPct = Math.round((canvasRect.top + canvasRect.height * 0.30)) + 'px';
      const div = document.createElement('div');
      div.className = '_hbMsg';
      div.textContent = txt;
      div.style.cssText = [
        `color:${color}`,
        `font-size:clamp(24px,4.8vw,54px)`,
        `top:${topPct}`,
        `text-shadow:0 0 10px ${gc},0 0 35px ${gc},0 0 70px ${gc2}`,
        `animation:_hbSlam ${dur}s cubic-bezier(.22,.61,.36,1) forwards`,
      ].join(';');
      document.body.appendChild(div);
      setTimeout(()=>div.parentNode&&div.remove(), duration + 300);
      return;
    }

    if(style === 'A'){
      // Bounce in: escala 0→1.15→1, luego fade-out normal
      this._combatMsgEl.textContent = txt; this._combatMsgEl.style.color = color;
      this.combatMsg.setVisible(true); this.combatMsg.setAlpha(1); this.combatMsg.setScale(0);
      this.tweens.add({
        targets:this.combatMsg, scaleX:1.15, scaleY:1.15, duration:180, ease:'Sine.easeOut',
        onComplete:()=>{
          this.tweens.add({targets:this.combatMsg, scaleX:1, scaleY:1, duration:120, ease:'Sine.easeIn',
            onComplete:()=>{
              this.time.delayedCall(Math.max(duration - 900, 600), ()=>{
                this.tweens.add({targets:this.combatMsg, alpha:0, duration:800, ease:'Sine.easeIn',
                  onComplete:()=>{ this.combatMsg.setVisible(false); this.combatMsg.setScale(1); }});
              });
            }
          });
        }
      });
      return;
    }

    // default: fade-in / fade-out
    this._combatMsgEl.textContent = txt; this._combatMsgEl.style.color = color; this.combatMsg.setVisible(true);
    this.combatMsg.alpha = 0; this.combatMsg.setScale(1);
    this.tweens.add({targets:this.combatMsg, alpha:1, duration:600, ease:'Sine.easeOut'});
    this.time.delayedCall(duration, ()=>{
      this.tweens.add({
        targets:this.combatMsg, alpha:0, duration:900, ease:'Sine.easeIn',
        onComplete:()=>this.combatMsg.setVisible(false)
      });
    });
  }

  drawMiniInventory(){
    // Panel persistente arriba-derecha eliminado: el inventario se ve via modal (abrirInventario).
    if(true) return;
    this.inventoryPanel.removeAll(true);
    const pw = 230, ph = 110;
    // Sombra
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.55);
    shadow.fillRoundedRect(-pw+4, 4, pw, ph, 10);
    this.inventoryPanel.add(shadow);
    // Base oscura (cuero)
    const base = this.add.graphics();
    base.fillStyle(0x2a1810, 1);
    base.fillRoundedRect(-pw, 0, pw, ph, 10);
    this.inventoryPanel.add(base);
    // Gradiente interior (efecto pergamino oscuro)
    const interior = this.add.graphics();
    interior.fillGradientStyle(0x3d2817, 0x3d2817, 0x1f1008, 0x1f1008, 0.95);
    interior.fillRoundedRect(-pw+4, 4, pw-8, ph-8, 8);
    this.inventoryPanel.add(interior);
    // Borde dorado doble
    const border = this.add.graphics();
    border.lineStyle(3, 0xffd700, 0.9);
    border.strokeRoundedRect(-pw, 0, pw, ph, 10);
    border.lineStyle(1, 0x8a6b00, 0.7);
    border.strokeRoundedRect(-pw+5, 5, pw-10, ph-10, 7);
    this.inventoryPanel.add(border);
    // Remaches decorativos en esquinas
    [[-pw+10,10],[-10,10],[-pw+10,ph-10],[-10,ph-10]].forEach(([x,y])=>{
      const rivet = this.add.graphics();
      rivet.fillStyle(0xffd700, 1); rivet.fillCircle(x, y, 3);
      rivet.fillStyle(0x8a6b00, 1); rivet.fillCircle(x, y, 1.5);
      this.inventoryPanel.add(rivet);
    });
    // Título con fondo
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x1a0a04, 0.8);
    titleBg.fillRoundedRect(-pw+25, 8, pw-50, 18, 4);
    this.inventoryPanel.add(titleBg);
    const title = this.add.text(-pw/2, 17, `📦 BOLSA ${STATE.inventario.length}/6`, {
      fontFamily:'Cinzel', fontSize:'15px', color:'#ffd700', fontStyle:'700', stroke:'#000', strokeThickness:2
    }).setOrigin(0.5);
    this.inventoryPanel.add(title);
    // 6 slots en 3x2, más grandes
    const slotW = 62, slotH = 32, gap = 6;
    const startX = -pw + 10;
    const startY = 34;
    for(let i=0;i<6;i++){
      const row = Math.floor(i/3), col = i%3;
      const sx = startX + col*(slotW+gap);
      const sy = startY + row*(slotH+gap);
      const hasItem = !!STATE.inventario[i];
      // Sombra interna del slot
      const slotShadow = this.add.graphics();
      slotShadow.fillStyle(0x000000, 0.6);
      slotShadow.fillRoundedRect(sx, sy, slotW, slotH, 5);
      this.inventoryPanel.add(slotShadow);
      // Gradiente del slot (más claro si tiene item)
      const slot = this.add.graphics();
      if(hasItem){
        slot.fillGradientStyle(0x4a3828, 0x4a3828, 0x2a1810, 0x2a1810, 1);
      } else {
        slot.fillGradientStyle(0x1a0a04, 0x1a0a04, 0x0d0503, 0x0d0503, 1);
      }
      slot.fillRoundedRect(sx+2, sy+2, slotW-4, slotH-4, 4);
      this.inventoryPanel.add(slot);
      // Borde del slot
      const slotBorder = this.add.graphics();
      slotBorder.lineStyle(1.5, hasItem ? 0xffd700 : 0x5a4020, hasItem ? 0.9 : 0.5);
      slotBorder.strokeRoundedRect(sx+2, sy+2, slotW-4, slotH-4, 4);
      this.inventoryPanel.add(slotBorder);
      if(hasItem){
        const it = ITEMS[STATE.inventario[i].id-1];
        // Glow tenue para items
        const glow = this.add.graphics();
        glow.fillStyle(0xffd700, 0.2);
        glow.fillCircle(sx+slotW/2, sy+slotH/2, 14);
        this.inventoryPanel.add(glow);
        // Emoji más grande
        const emoji = this.add.text(sx+slotW/2, sy+slotH/2, it.emoji, {fontSize:'24px'}).setOrigin(0.5);
        this.inventoryPanel.add(emoji);
        // Cantidad con fondo
        if(STATE.inventario[i].cantidad>1){
          const qbg = this.add.graphics();
          qbg.fillStyle(0xe74c3c, 0.95);
          qbg.fillCircle(sx+slotW-7, sy+slotH-7, 8);
          qbg.lineStyle(1, 0xffffff, 0.8);
          qbg.strokeCircle(sx+slotW-7, sy+slotH-7, 8);
          this.inventoryPanel.add(qbg);
          const c = this.add.text(sx+slotW-7, sy+slotH-7, STATE.inventario[i].cantidad, {
            fontSize:'14px', color:'#ffffff', fontStyle:'800'
          }).setOrigin(0.5);
          this.inventoryPanel.add(c);
        }
      } else {
        // Slot vacío: punto tenue en el centro
        const empty = this.add.text(sx+slotW/2, sy+slotH/2, '·', {fontSize:'19px', color:'#5a4020'}).setOrigin(0.5);
        this.inventoryPanel.add(empty);
      }
    }
  }

  tirarDados(){
    if(this.dadoEnCurso || !this.turnoJugador) return;
    // Ocultar globo de diálogo cuando el jugador tira
    if(this.dialogueBalloon) this.dialogueBalloon.setVisible(false);
    STATE.mp = Math.min(STATE.mpMax, (STATE.mp||0) + 1);
    if (this.drawMpBar) this.drawMpBar();
    this.dadoEnCurso = true;
    snd_diceRoll();

    // Sacudida DOM — texto y cuerpo del dado se mueven juntos
    this.tweens.add({targets:[this.pDie1Dom, this.pDie2Dom], scale:{from:0.86, to:1.08}, duration:80, yoyo:true, repeat:4, ease:'Sine.easeInOut'});
    this.tweens.add({targets:this.pDie1Dom, angle:{from:-8, to:8}, duration:90, yoyo:true, repeat:4, ease:'Sine.easeInOut'});
    this.tweens.add({targets:this.pDie2Dom, angle:{from:8, to:-8}, duration:90, yoyo:true, repeat:4, ease:'Sine.easeInOut', delay:45});

    // Animación de 0.5s por dado
    // Usa RNG nativo (no seeded) para frames visuales — no drena la secuencia de juego
    const _animRnd = (window.RNG && window.RNG.seeded) ? window.RNG._origRandom : Math.random;
    const animTime = 500;
    const t0 = Date.now();
    const animTick = this.time.addEvent({delay:50, loop:true, callback:()=>{
      const v1 = 1 + Math.floor(_animRnd()*12);
      const v2 = 1 + Math.floor(_animRnd()*12);
      this.drawDice(v1, v2);
      if(Date.now()-t0 > animTime){
        animTick.remove();
        this.resolverTirada();
      }
    }});
  }

  resolverTirada(){
    const d1 = 1 + Math.floor(Math.random()*12);
    const d2 = 1 + Math.floor(Math.random()*12);
    let suma = d1 + d2;
    this.drawDice(d1, d2);

    STATE.turnoActual++;
    STATE.tiradaGlobal++;
    // Tick cooldown Dado Sagrado
    if(this._dadoSagradoCooldown > 0){
      this._dadoSagradoCooldown--;
      this._drawDadoSagrado();
    }

    // Maldición Doble 1
    const esDoble1 = (d1===1 && d2===1);
    // Bonificación Doble 12
    const esDoble12 = (d1===12 && d2===12);

    // Bonificaciones de resiliencia
    const bonResil = STATE.resiliencia + bonusTirada(STATE.clase);   // resiliencia + bonus de clase (Arquero)
    let bonificacion = 0;
    const buffRoll = STATE.buffs.find(b=>b.tipo==='buff_roll');
    if(buffRoll){ bonificacion += buffRoll.valor; buffRoll.turnosRestantes--; }
    if(this._modBatalla === 'bendicion') bonificacion += 1;
    let sumaFinal = suma + bonResil + bonificacion;

    if(this._modBatalla === 'niebla' && !this._nieblaRevelada && STATE.turnoActual >= 2){
      this._nieblaRevelada = true;
      this.probText.setText(this._probTexto());
      this.mostrarMensaje('🌫️ ¡La niebla se disipa! Umbral revelado', '#8aa0b8', 2400, 'A');
    }

    if(typeof logrosEvent==='function') logrosEvent('tirada',{d1,d2,suma});
    // Guardar estadística
    STATE.stats.tiradas.push({ valor:suma, d1,d2, jefe:this.monster.nombre, turno:STATE.turnoActual });

    // ── Resolver predicción pre-tirada (opcional) ──
    if(this._prediccionJugador){
      const acerto = (this._prediccionJugador === 'alto') ? suma >= 13 : suma <= 12;
      const pReal  = (this._prediccionJugador === 'alto') ? '54.2%' : '45.8%';
      if(acerto){
        this._predRacha++;
        const premio = 2 + Math.min(this._predRacha, 5);
        STATE.oro = (STATE.oro||0) + premio;
        this.mostrarMensaje(`🔮 ¡Predicción correcta! +${premio} oro (racha ${this._predRacha}) — P era ${pReal}`, '#5fcf88', 3200, 'A');
      } else {
        this._predRacha = 0;
        this.mostrarMensaje(`🔮 Predicción fallida — la probabilidad era ${pReal}`, '#8a9ab0', 2600, 'A');
      }
      this._prediccionJugador = null;
      this._predBtns.forEach(b => b.setColor(this._predOff || '#5a7090').setBackgroundColor('#141a26'));
    }
    if(suma===2 || suma===24) STATE.stats.turnosEpicos.push({turno:STATE.turnoActual, jefe:this.monster.nombre, valor:suma});

    this.diceResultTxt.setText(`Resultado: ${suma}${bonResil>0||bonificacion>0?` (+${bonResil+bonificacion}) = ${sumaFinal}`:''}`);

    // Globo de diálogo al azar cada 2-4 tiradas
    if(STATE.turnoActual >= this._proximoDialogo){
      this._proximoDialogo = STATE.turnoActual + 1 + Math.floor(Math.random()*2);
      this._mostrarGloboDial();
    }

    if(esDoble1){
      this.ejecutarMaldicion(()=>this.fase2(sumaFinal, suma, d1, d2));
      return;
    }

    // Doble 12: objeto al azar como recompensa
    if(esDoble12){
      this.time.delayedCall(300, ()=>this._premioDoble12());
    }

    this.fase2(sumaFinal, suma, d1, d2);
  }

  _mostrarGloboDial(){
    const dialogues = MONSTER_DIALOGUES[STATE.jefeActual] || MONSTER_DIALOGUES[0];
    // Elegir frase según situación
    let frase;
    if(STATE.jefeHp < STATE.jefeHpMax * 0.3){
      frase = dialogues[dialogues.length-1]; // última frase = situación crítica
    } else {
      frase = dialogues[Math.floor(Math.random() * (dialogues.length-1))];
    }
    if(!this.dialogueTxt || !this.dialogueBalloon) return;
    this.dialogueTxt.textContent = frase;
    this.dialogueBalloon.setVisible(true);
    this.dialogueBalloon.setAlpha(0);
    // Posición fija en el hueco bajo la barra de HP (sobre la cabeza del monstruo)
    this.dialogueBalloon.setPosition(this.L.balloonX, this.L.balloonY);
    this.tweens.add({targets:this.dialogueBalloon, alpha:1, duration:400, ease:'Back.easeOut'});
    // Globo permanece hasta que el jugador tira dados (oculto en tirarDados)
  }

  _drawDadoSagrado(){
    const rank = skillRank(STATE.skills, 'dadoSagrado');
    const cx = this.L.dsX, cy = this.L.dsY;
    this._dadoSagradoG.clear();
    this._dadoSagradoT.setPosition(cx, this.L.compacto ? cy-9 : cy-4);
    this._dadoSagradoLbl.setPosition(cx, this.L.compacto ? cy+14 : cy+20);

    if(rank === 0){
      // Sin skill: invisible
      this._dadoSagradoG.setVisible(false);
      this._dadoSagradoT.setVisible(false);
      this._dadoSagradoLbl.setVisible(false);
      this._dadoSagradoHit.disableInteractive();
      return;
    }

    this._dadoSagradoG.setVisible(true);
    this._dadoSagradoT.setVisible(true);
    this._dadoSagradoLbl.setVisible(true);

    const listo = this._dadoSagradoCooldown <= 0;
    const col   = listo ? 0x27ae60 : 0x1a5c2a;
    const borde = listo ? 0x2ecc71 : 0x2d7a44;
    const alpha = listo ? 1 : 0.6;

    // Sombra
    this._dadoSagradoG.fillStyle(0x000000, 0.35);
    this._dadoSagradoG.fillRoundedRect(cx-25, cy-27, 52, 52, 10);
    // Cara
    this._dadoSagradoG.fillStyle(col, alpha);
    this._dadoSagradoG.fillRoundedRect(cx-27, cy-29, 52, 52, 10);
    // Brillo top
    this._dadoSagradoG.fillStyle(0xffffff, listo ? 0.22 : 0.08);
    this._dadoSagradoG.fillRoundedRect(cx-24, cy-27, 46, 18, 6);
    // Borde
    this._dadoSagradoG.lineStyle(2.5, borde, 1);
    this._dadoSagradoG.strokeRoundedRect(cx-27, cy-29, 52, 52, 10);

    if(listo){
      this._dadoSagradoT.setText('🎲').setStyle({fontSize:'22px', color:'#fff'});
      this._dadoSagradoLbl.setText('¡Usar!').setStyle({color:'#a0ffc0'});
      this._dadoSagradoHit.setInteractive({useHandCursor:true});
      // Pulso si acaba de quedar listo
      if(!this._dadoPulsoActivo){
        this._dadoPulsoActivo = true;
        this.tweens.add({targets:this._dadoSagradoG, alpha:{from:0.7,to:1}, duration:500, yoyo:true, repeat:-1});
      }
    } else {
      this._dadoSagradoT.setText(String(this._dadoSagradoCooldown)).setStyle({fontSize:'18px', color:'#a0ffc0'});
      this._dadoSagradoLbl.setText('tiradas').setStyle({color:'#6aaf80'});
      this._dadoSagradoHit.disableInteractive();
      if(this._dadoPulsoActivo){
        this._dadoPulsoActivo = false;
        this.tweens.killTweensOf(this._dadoSagradoG);
        this._dadoSagradoG.setAlpha(1);
      }
    }

    // Registrar handler de click (una sola vez)
    if(!this._dadoSagradoHitRegistered){
      this._dadoSagradoHitRegistered = true;
      this._dadoSagradoHit.on('pointerup', ()=> this._usarDadoSagrado());
    }
  }

  _usarDadoSagrado(){
    if(!this.turnoJugador) return;
    const rank = skillRank(STATE.skills, 'dadoSagrado');
    const cfg  = dadoSagradoCfg(rank);
    if(!cfg || this._dadoSagradoCooldown > 0) return;

    this.turnoJugador = false;
    this._dadoPulsoActivo = false;
    this.tweens.killTweensOf(this._dadoSagradoG);

    // Animación de tirada
    let frames = 0;
    const anim = this.time.addEvent({ delay:55, loop:true, callback:()=>{
      frames++;
      const v = 1 + Math.floor(Math.random()*6);
      this._dadoSagradoT.setText(String(v)).setStyle({fontSize:'18px', color:'#fff'});
      if(frames >= 14){
        anim.remove();
        // Calcular curación
        let total = 0;
        for(let i=0; i<cfg.dados; i++) total += 1 + Math.floor(Math.random()*6);
        total += cfg.bonus;
        const curado = Math.min(total, STATE.hpMax - STATE.hp);
        STATE.hp = Math.min(STATE.hpMax, STATE.hp + total);
        this.drawPlayerBar();
        this.showFloat('+'+curado+' 💚', this.w/2, (this._hpBarY||468)+28, '#2ecc71');
        this.mostrarMensaje(`💚 Dado Sagrado: +${curado} HP restaurados`, '#2ecc71', 3000);
        snd_heal();
        if(typeof logrosEvent==='function') logrosEvent('dadoSagrado',{});
        // Resetear cooldown
        this._dadoSagradoCooldown = cfg.cooldown;
        this._drawDadoSagrado();
        this.turnoJugador = true;
      }
    }});
  }

  // Premio por Doble 12
  _premioDoble12(){
    const itemId = getRandomItemId();
    const it = ITEMS[itemId-1];
    const pudo = addItemToInventory(itemId);
    if(pudo){
      showToast(`🎲🎲 ¡DOBLE 12! Ganaste: ${it.emoji} ${it.nombre}`);
      this.drawMiniInventory();
    } else {
      // Bolsa llena: ofrecer usar o descartar
      const html = `<div style="padding:14px;text-align:center">
        <h3 style="color:#ffd700;font-family:Cinzel;margin-bottom:12px">🎲🎲 ¡DOBLE 12! Premio especial</h3>
        <div style="font-size:56px;margin:10px 0">${it.emoji}</div>
        <p style="font-size:18px;color:#ffd700;font-weight:700">${it.nombre}</p>
        <p style="color:#ccc;margin:8px 0">${it.desc}</p>
        <p style="color:#2ecc71;font-weight:600">${it.efecto}</p>
        <p style="color:#e74c3c;margin-top:10px">Tu bolsa está llena. ¿Usás este objeto ahora o lo descartás?</p>
        <div class="btn-row" style="margin-top:14px">
          <button class="btn-action" onclick="window.__usarDoble12(${itemId})">⚡ Usar Ahora</button>
          <button class="btn-action btn-secondary" onclick="window.__cerrarDoble12()">🗑 Descartar</button>
        </div>
      </div>`;
      openItemModal(html);
      this.turnoJugador = false;
      window.__usarDoble12 = (id)=>{
        closeItemModal();
        this._aplicarItemDirecto(id);
        this.turnoJugador = true;
      };
      window.__cerrarDoble12 = ()=>{
        closeItemModal();
        this.turnoJugador = true;
        showToast(`Descartaste ${it.emoji} ${it.nombre}`);
      };
    }
  }

  ejecutarMaldicion(cb){
    snd_curse();
    const w=this.w, h=this.h;
    // Pantalla tiembla
    this.cameras.main.shake(500, 0.015);
    // Rayo rojo cruzando
    const ray = this.add.graphics();
    ray.lineStyle(6, 0xff0000, 1);
    ray.lineBetween(0, 0, w, h);
    ray.lineBetween(w, 0, 0, h);
    this.tweens.add({targets:ray, alpha:{from:1, to:0}, duration:500, onComplete:()=>ray.destroy()});
    // X roja central
    const x = this.add.text(w/2, h/2, '✖', {fontSize:'180px', color:'#ff0000', fontStyle:'bold'}).setOrigin(0.5);
    x.alpha = 0;
    this.tweens.add({targets:x, alpha:{from:0, to:0.8}, scale:{from:0.5, to:1.3}, duration:300, yoyo:true, onComplete:()=>x.destroy()});

    this.mostrarMensaje('💀 ¡DOBLE 1! Poder reducido', '#ff0000', 2800, 'B');

    // Reducir ataque y defensa a la mitad (temporalmente).
    // Si ya había una maldición sin revertir, se deshace primero: si no, la
    // segunda mitad se calculaba sobre el valor ya reducido y el ataque quedaba
    // a la mitad para toda la batalla.
    this.revertirMaldicion();
    this._curseAtkReduc = Math.floor(STATE.ataque/2);
    this._curseDefReduc = Math.floor(STATE.defensa/2);
    STATE.ataque -= this._curseAtkReduc;
    STATE.defensa -= this._curseDefReduc;
    this.updateStatsText();

    this.time.delayedCall(1200, cb);
  }

  fase2(sumaFinal, sumaOriginal, d1, d2){
    const umbralEf = this.getUmbralEfectivo();
    const impacto = sumaFinal >= umbralEf;
    /* La Estrella de Varianza vale para UNA tirada ("próxima tirada"). El motor no
       apagaba la bandera: el -2 duraba toda la batalla y solo desaparecía el ícono. */
    if(STATE.flagStar){
      STATE.flagStar = false;
      STATE.buffs = STATE.buffs.filter(b => b.tipo !== 'star');
    }
    const _logEntry = { d1, d2, suma: sumaOriginal, sumaFinal, umbral: umbralEf, impacto, dmg: 0 };
    this._battleLog.jugador.push(_logEntry);

    if(impacto){
      // Calcular daño
      let dmg = STATE.ataque + Math.floor((sumaFinal - umbralEf) * 1.5) + bonusRacha(STATE.clase, this._racha);
      this._racha = (this._racha || 0) + 1;
      this.updateStatsText();
      let _hasCrit = false;
      // Gema de Desviación Estándar
      if(STATE.flagGem && sumaOriginal >= 11 && sumaOriginal <= 15){
        dmg = Math.floor(dmg * 1.5); _hasCrit = true;
        this.mostrarMensaje(MSG_COMBATE[8], '#ffd700', 2800, 'B');
        STATE.flagGem = false;
      }
      // Corona de la Probabilidad
      if(STATE.flagCrown && sumaOriginal >= 13){
        dmg *= 2; _hasCrit = true;
        this.mostrarMensaje('👑 ¡CORONA! ×2 daño', '#ffd700', 2800, 'B');
        STATE.flagCrown = false;
      }
      // Llave
      if(STATE.flagKey){
        dmg += 15 + Math.floor(Math.random()*10); _hasCrit = true;
        this.mostrarMensaje('🔑 ¡LLAVE! Ataque especial', '#9b59b6', 2800, 'B');
        STATE.flagKey = false;
      }

      // Restar defensa del monstruo (mitigada si la tirada es baja)
      dmg = Math.max(3, dmg - Math.floor(this.monster.defensa * 0.4));
      _logEntry.dmg = dmg;

      STATE.jefeHp -= dmg;
      STATE.stats.dañoTotalFinal += dmg;
      this.drawEnemyBar();

      if(_hasCrit) snd_critical(); else snd_impact();
      this.flashMonster(dmg);
      this.showDmgNumber(dmg, this.monsterCX, this.monsterCY - 40, {crit:_hasCrit});
      this.hitStop(_hasCrit ? 130 : 70);
      this.cameras.main.shake(_hasCrit ? 200 : 110, _hasCrit ? 0.010 : 0.005);
      if(typeof playClassFx === 'function') playClassFx(this, STATE.clase, this.monsterCX, this.monsterCY);

      // Mensaje impacto
      // MSG_COMBATE[8] dice "CRÍTICO ... Daño × 1.5": sólo es verdad con la Gema.
      // Una tirada alta sin Gema pega más por el margen sobre el umbral, no ×1.5.
      const msg = sumaFinal >= 22 ? MSG_COMBATE[12] : MSG_COMBATE[0];
      if(sumaOriginal === 13) this.mostrarMensaje(MSG_COMBATE[10], '#ffd700', 2800, 'B');
      else this.mostrarMensaje(`${msg} — ${dmg}`, '#2ecc71', 2800, 'B');

      // Restaurar si había maldición
      this.revertirMaldicion();

      // Carga de probabilidad: daño extra según rareza de la suma propia.
      // NO es re-roll: recompensa la suma que ya salió.
      if (this._cargaArmada) {
        const extra = cargaDamage(sumaOriginal, this._cargaArmada);
        STATE.jefeHp = Math.max(0, STATE.jefeHp - extra);
        this.drawEnemyBar && this.drawEnemyBar();
        this.mostrarMensaje(`⚡ Carga: +${extra} daño`, '#ffd700', 2800, 'B');
        this._cargaArmada = null;
      }

      // ¿Monstruo derrotado?
      if(STATE.jefeHp <= 0){
        this.victoria();
        return;
      }
    } else {
      snd_fail();
      this.mostrarMensaje(`Fallaste. Umbral: ${umbralEf}+`, '#e74c3c', 2800, 'B');
      if(this._racha){ this._racha = 0; this.updateStatsText(); }
    }

    // Tras una pausa, el monstruo contraataca
    this.time.delayedCall(1600, ()=>this.turnoMonstruo(impacto));
  }

  revertirMaldicion(){
    if(this._curseAtkReduc){
      STATE.ataque += this._curseAtkReduc;
      STATE.defensa += this._curseDefReduc;
      this._curseAtkReduc = this._curseDefReduc = 0;
      this.updateStatsText();
    }
  }

  turnoMonstruo(despuesDeImpacto){
    // Regeneración de Luna de la Media
    // NO decrementar turnosRestantes aquí — el filtro de buffs lo hace una sola vez
    const regen = STATE.buffs.find(b=>b.tipo==='regen');
    if(regen){
      const heal = regen.valor;
      STATE.hp = Math.min(STATE.hpMax, STATE.hp + heal);
      this.drawPlayerBar();
      this.showFloat('+'+heal, this.w/2, (this._hpBarY||468)+28, '#2ecc71');
    }

    // Decrementar turnos de buffs y limpiar
    STATE.buffs = STATE.buffs.filter(b=>{
      if(b.tipo==='buff_atk' || b.tipo==='sword'){
        b.turnosRestantes--;
        if(b.turnosRestantes<=0){ STATE.ataque -= b.valor; return false; }
      } else if(b.tipo==='buff_def'){
        b.turnosRestantes--;
        if(b.turnosRestantes<=0){ STATE.defensa -= b.valor; return false; }
      } else if(b.tipo==='cheb' || b.tipo==='egida'){
        b.turnosRestantes--;
        if(b.turnosRestantes<=0){ STATE.reduccionDaño = 0; return false; }
      } else {
        b.turnosRestantes = (b.turnosRestantes||1) - 1;
        if(b.turnosRestantes<=0) return false;
      }
      return true;
    });
    this.updateStatsText();

    // --- ANIMACIÓN DADOS DEL MONSTRUO ---
    snd_diceRoll();
    // Reducir opacidad del DOM del monstruo para que los dados canvas sean visibles
    // Los dados DOM van delante del monstruo (z-index): ya no hace falta atenuarlo.
    // Fade in dados del monstruo
    this._mDiceObjects.forEach(o => { o.setAlpha(0); o.setVisible(true); });
    this.tweens.add({targets: this._mDiceObjects, alpha:1, duration:200});

    // Bounce + rotation en los dados DOM (transforman desde el centro)
    this.tweens.add({targets:this.mDie1Dom, scale:{from:0.85, to:1.08}, duration:110, yoyo:true, repeat:4, ease:'Sine.easeInOut'});
    this.tweens.add({targets:this.mDie2Dom, scale:{from:1.08, to:0.85}, duration:110, yoyo:true, repeat:4, ease:'Sine.easeInOut', delay:55});
    this.tweens.add({targets:this.mDie1Dom, angle:{from:-8, to:8}, duration:120, yoyo:true, repeat:4, ease:'Sine.easeInOut'});
    this.tweens.add({targets:this.mDie2Dom, angle:{from:8, to:-8}, duration:120, yoyo:true, repeat:4, ease:'Sine.easeInOut', delay:60});

    // Rapid redraw durante la animación — usa RNG nativo para no drenar secuencia seeded
    const _animRndM = (window.RNG && window.RNG.seeded) ? window.RNG._origRandom : Math.random;
    const animTime = 600;
    const t0 = Date.now();
    const animTick = this.time.addEvent({delay:50, loop:true, callback:()=>{
      const rv1 = 1 + Math.floor(_animRndM()*12);
      const rv2 = 1 + Math.floor(_animRndM()*12);
      this.drawMonsterDice(rv1, rv2);
      if(Date.now()-t0 > animTime){ animTick.remove(); this._ejecutarAtaqueMonstruo(despuesDeImpacto); }
    }});
  }

  _ejecutarAtaqueMonstruo(despuesDeImpacto){
    // ── Task 10: Escarcha — monstruo congelado, salta su ataque ──────────────
    if (this._freezeMonstruo) {
      this._freezeMonstruo = false;
      this.mostrarMensaje('❄️ Congelado, no ataca', '#9fc2ff', 2200, 'A');
      // Ocultar dados del monstruo y restaurar su imagen
      if (this.monsterDom && this.monsterDom.node) this.monsterDom.node.style.opacity = '';
      this.tweens.add({ targets: this._mDiceObjects, alpha: 0, duration: 700,
        onComplete: () => { this._mDiceObjects.forEach(o => o.setVisible(false)); }
      });
      // Cerrar turno del monstruo igual que el path normal
      this.time.delayedCall(900, () => {
        this.dadoEnCurso = false;
        this.turnoJugador = true;
        saveGame();
      });
      return;
    }

    // Tirada real 2d12 del monstruo
    let md1 = 1 + Math.floor(Math.random()*12);
    let md2 = 1 + Math.floor(Math.random()*12);

    // ── Task 10: Maldición de un dado — fuerza tirada de un solo dado ─────────
    if (this._maldicionDado) {
      const mal = this._maldicionDado;
      this._maldicionDado = null;
      md1 = 1 + Math.floor(Math.random() * mal.caras);
      md2 = 0;
    }

    let mSuma = md1 + md2;

    // ── Task 10: Truncar — fija la suma del monstruo a valor fijo ────────────
    if (this._truncarSuma != null) {
      mSuma = this._truncarSuma;
      this._truncarSuma = null;
    }

    this.drawMonsterDice(md1, md2);

    // Calcular daño con los dados (reemplaza Math.random()*4 por escala de tirada)
    // mSuma 2–24, avg 13. Bonus: floor((mSuma-10)/3), range -2..+4
    const bonusDados = Math.floor((mSuma - 10) / 3);
    let dañoMonstruo = this.monster.ataque + bonusDados;
    // Escalado para monstruos específicos
    if(this.monster.forma === 'tiburon') dañoMonstruo += Math.floor(STATE.turnoActual/2);
    if(this.monster.forma === 'titan' && STATE.turnoActual>=6 && STATE.turnoActual<=8) dañoMonstruo += 4;
    if(this.monster.forma === 'demiurgo' && STATE.jefeHp < STATE.jefeHpMax*0.5){ dañoMonstruo += 5; }

    // Mitigar por defensa del jugador
    dañoMonstruo = Math.max(2, dañoMonstruo - Math.floor(STATE.defensa * 0.5));
    if(STATE.reduccionDaño > 0) dañoMonstruo = Math.max(1, Math.floor(dañoMonstruo * (1-STATE.reduccionDaño)));
    if(!despuesDeImpacto) dañoMonstruo = Math.floor(dañoMonstruo * 1.15);
    this._battleLog.monstruo.push({ d1: md1, d2: md2, suma: mSuma, dmg: dañoMonstruo });

    // Mostrar resultado de la tirada del monstruo sobre los dados
    const mRollHex = `#${(this._mDiceColor >> 16 & 0xff).toString(16).padStart(2,'0')}${(this._mDiceColor >> 8 & 0xff).toString(16).padStart(2,'0')}${(this._mDiceColor & 0xff).toString(16).padStart(2,'0')}`;
    const mResultTxt = (md2 === 0) ? `🎲 ${md1} = ${mSuma}  →  -${dañoMonstruo} HP`
                                   : `🎲 ${md1} + ${md2} = ${mSuma}  →  -${dañoMonstruo} HP`;
    const mResultLabel = this.add.dom(this.w/2, this.L.mResY).createFromHTML(
      `<div style="font-family:Cinzel,serif;font-weight:700;font-size:${this.L.mResFs};white-space:nowrap;` +
      `color:${mRollHex};text-shadow:0 0 4px #0A0A10, 0 1px 3px rgba(0,0,0,.9)">${mResultTxt}</div>`
    ).setOrigin(0.5).setAlpha(0);
    mResultLabel.node.style.zIndex = '50';
    mResultLabel.node.style.pointerEvents = 'none';
    this.tweens.add({targets:mResultLabel, alpha:1, duration:200});

    this.time.delayedCall(1800, ()=>{
      // Fade out dados y label; restaurar opacidad del monstruo
      if(this.monsterDom && this.monsterDom.node) this.monsterDom.node.style.opacity = '';
      this.tweens.add({targets:[...this._mDiceObjects, mResultLabel], alpha:0, duration:700,
        onComplete:()=>{ this._mDiceObjects.forEach(o=>o.setVisible(false)); mResultLabel.destroy(); }
      });

      // ── Task 11: Resolver reactivos (reflejo / sanguijuela / espejo / predicción) ──
      if (this._reflejoArmado) {
        const frac = getPower('reflejo').ranks[this._reflejoArmado - 1];
        const refl = Math.round(dañoMonstruo * frac);
        STATE.jefeHp = Math.max(0, STATE.jefeHp - refl);
        this.drawEnemyBar();
        snd_impact();
        this.mostrarMensaje(`↩ Reflejo: ${refl} daño`, '#e67e22', 2200, 'A');
        this._reflejoArmado = null;
        if (STATE.jefeHp <= 0) { this.victoria(); return; }
      }
      let _roboHp = 0;
      if (this._sanguijuelaArmada) {
        const frac = getPower('sanguijuela').ranks[this._sanguijuelaArmada - 1];
        _roboHp = Math.round(dañoMonstruo * frac);
        this._sanguijuelaArmada = null;
      }
      if (this._espejoActivo) {
        const refl = espejoReflect(mSuma, this._espejoActivo);
        if (refl > 0) {
          STATE.jefeHp = Math.max(0, STATE.jefeHp - refl);
          this.drawEnemyBar();
          snd_impact();
          this.mostrarMensaje(`🪞 Espejo: ${refl} daño`, '#e67e22', 2200, 'A');
          if (STATE.jefeHp <= 0) { this._espejoActivo = null; this.victoria(); return; }
        }
        this._espejoActivo = null;
      }
      if (this._prediccionApuesta) {
        const bonus = prediccionBonus(this._prediccionApuesta.apuesta, mSuma, this._prediccionApuesta.rank);
        if (bonus > 0) {
          STATE.jefeHp = Math.max(0, STATE.jefeHp - bonus);
          this.drawEnemyBar();
          this.mostrarMensaje(`✓ Predicción: +${bonus}`, '#ffd700', 2200, 'A');
          if (STATE.jefeHp <= 0) { this._prediccionApuesta = null; this.victoria(); return; }
        } else {
          this.mostrarMensaje('✗ Predicción fallida', '#8a9ab0', 2200, 'A');
        }
        this._prediccionApuesta = null;
      }
      // ── Fin Task 11 reactivos ────────────────────────────────────────────────

      this._battleReceivedDamage = true;
      // Pose de ataque justo en el momento del golpe real (no antes de tirar los dados)
      if(this.monsterState) this.monsterState('attack');
      snd_monsterHit();
      STATE.hp -= dañoMonstruo;
      this.drawPlayerBar();
      this.showDmgNumber(`-${dañoMonstruo}`, this.w/2+100, (this._hpBarY||468)+24, {color:'#ff4444'});
      this.cameras.main.flash(150, 220, 30, 30, false);
      this.hitStop(60);
      this._shakeOnHit();   // temblor de pantalla escalado con la rabia del monstruo

      // ── Task 11: Sanguijuela — robo de HP tras recibir daño ──────────────────
      if (_roboHp > 0) {
        STATE.hp = Math.min(STATE.hpMax, STATE.hp + _roboHp);
        this.drawPlayerBar();
        snd_heal();
        this.mostrarMensaje(`🩸 +${_roboHp} HP`, '#2ecc71', 2200, 'A');
      }
      // ────────────────────────────────────────────────────────────────────────

      const _saRank = skillRank(STATE.skills, 'segundoAliento');
      if (_saRank > 0 && !this._segAlientoUsado && STATE.hp > 0 && STATE.hp < STATE.hpMax * 0.2) {
        const _heal = segundoAlientoHeal(_saRank);
        STATE.hp = Math.min(STATE.hpMax, STATE.hp + _heal);
        this._segAlientoUsado = true;
        snd_heal();
        this.mostrarMensaje(`🌬️ Segundo aliento: +${_heal} HP`, '#2ecc71', 4000);
      }

      if(STATE.hp <= 0){ this.derrota(); return; }

      if(STATE.hp < STATE.hpMax*0.2) this.mostrarMensaje(MSG_COMBATE[6], '#ff4444', 5000);
      else if(Math.random()<0.25) this.mostrarMensaje(MSG_COMBATE[3 + Math.floor(Math.random()*12)], '#9b59b6', 4500);

      this.probText.setText(this._probTexto());

      this.dadoEnCurso = false;
      this.turnoJugador = true;
      saveGame();
    });
  }

  showFloat(text, x, y, color){
    const t = this.add.text(x, y, text, {fontFamily:'Cinzel', fontSize:'28px', color, fontStyle:'800', stroke:'#000', strokeThickness:3}).setOrigin(0.5);
    this.tweens.add({targets:t, y:y-50, alpha:0, duration:1200, onComplete:()=>t.destroy()});
  }

  /* Número de daño con física: pop de escala + arco parabólico con gravedad */
  showDmgNumber(dmg, x, y, opts={}){
    const crit  = !!opts.crit;
    const color = opts.color || (crit ? '#ffd700' : '#ff6644');
    const size  = crit ? 46 : 34;
    const t = this.add.text(x + (Math.random()-0.5)*30, y, `${dmg}`, {
      fontFamily:'Cinzel', fontSize:`${size}px`, color, fontStyle:'900',
      stroke:'#000', strokeThickness:5,
      shadow:{offsetX:0, offsetY:2, color:'#000', blur:6, fill:true}
    }).setOrigin(0.5).setDepth(30).setScale(0.2);

    // Pop de entrada
    this.tweens.add({targets:t, scale:crit?1.35:1, duration:120, ease:'Back.easeOut'});
    if(crit) this.tweens.add({targets:t, angle:{from:-8, to:8}, duration:90, yoyo:true, repeat:2});

    // Física manual: impulso hacia arriba + gravedad
    let vx = (Math.random()-0.5)*2.2, vy = -(3.4 + Math.random()*1.4);
    const ev = this.time.addEvent({ delay:16, loop:true, callback:()=>{
      vy += 0.22;
      t.x += vx; t.y += vy;
      if(vy > 1.5) t.alpha -= 0.045;
      if(t.alpha <= 0){ ev.remove(); t.destroy(); }
    }});
  }

  /* Hit-stop: congela tweens/timers del combate un instante. Real setTimeout
     porque this.time también queda congelado por timeScale. */
  hitStop(ms=70){
    if(this._hitStopActive) return;
    this._hitStopActive = true;
    this.tweens.timeScale = 0.05;
    this.time.timeScale   = 0.05;
    setTimeout(()=>{
      this.tweens.timeScale = 1;
      this.time.timeScale   = 1;
      this._hitStopActive = false;
    }, ms);
  }

  flashMonster(dmg){
    const cx = this.monsterCX, cy = this.monsterCY;
    const w = this.w;
    // SVG hurt state (handles shake + red flash via CSS)
    if(this.monsterState) this.monsterState('hurt');
    // Check enraged threshold after hurt resolves
    this.time.delayedCall(560, ()=>{
      if(this.monsterState && STATE.jefeHp <= STATE.jefeHpMax * 0.5 && STATE.jefeHp > 0){
        this.monsterState('enraged');
      }
    });

    // 3. Destello de color en pantalla
    this.cameras.main.flash(120, 255, 80, 80, false);

    // 4. Partículas de chispas/impacto
    const particles = this.add.graphics().setDepth(20);
    const colors = [0xff4444, 0xff8800, 0xffff00, 0xff2200];
    const sparks = [];
    for(let i=0;i<18;i++){
      const angle = (Math.random()*Math.PI*2);
      const speed = 3 + Math.random()*5;
      sparks.push({
        x: cx + (Math.random()-0.5)*40,
        y: cy + (Math.random()-0.5)*30,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed - 2,
        life: 1,
        col: colors[Math.floor(Math.random()*colors.length)],
        size: 3+Math.random()*5
      });
    }
    let frame=0;
    const sparkTimer = this.time.addEvent({delay:30, repeat:15, callback:()=>{
      particles.clear();
      frame++;
      sparks.forEach(p=>{
        p.x += p.vx; p.y += p.vy; p.vy += 0.4;
        p.life -= 0.065;
        if(p.life > 0){
          particles.fillStyle(p.col, p.life);
          particles.fillCircle(p.x, p.y, p.size*p.life);
        }
      });
      if(frame>=16){ particles.destroy(); }
    }});

    // 5. Número de daño dramático y grande
    const dmgTxt = this.add.text(cx, cy-20, `-${dmg}`, {
      fontFamily:'Cinzel', fontSize:'52px', color:'#ff2200',
      fontStyle:'800', stroke:'#000', strokeThickness:5
    }).setOrigin(0.5).setDepth(25).setAlpha(0);
    this.tweens.add({
      targets:dmgTxt,
      y: cy-90,
      alpha:{from:0,to:1},
      scale:{from:0.4,to:1.2},
      duration:350,
      ease:'Back.easeOut',
      onComplete:()=>{
        this.tweens.add({targets:dmgTxt, alpha:0, y:cy-130, duration:500, delay:400, onComplete:()=>dmgTxt.destroy()});
      }
    });

    // 6. Crack visual: líneas de fractura emanando del punto de impacto
    const crack = this.add.graphics().setDepth(19);
    crack.lineStyle(2, 0xff4400, 0.9);
    for(let i=0;i<8;i++){
      const a = i*Math.PI/4 + Math.random()*0.3;
      const len = (30+Math.random()*50);
      crack.lineBetween(cx, cy, cx+Math.cos(a)*len, cy+Math.sin(a)*len);
    }
    crack.alpha = 0.9;
    this.tweens.add({targets:crack, alpha:0, duration:350, onComplete:()=>crack.destroy()});
  }

  abrirInventario(){
    if(!this.turnoJugador || this.dadoEnCurso) return;
    this.turnoJugador = false;
    // Siempre (re)definir __battleResumed antes de abrir el modal
    window.__battleResumed = ()=>{ this.turnoJugador = true; };
    window.__useItem = (idx)=>this.usarItem(idx);

    let html = '<div style="padding:8px;">';
    html += `<h3 style="color:#ffd700;text-align:center;margin-bottom:12px;font-family:Cinzel">Tu Bolsa — ${STATE.inventario.length}/6 slots</h3>`;
    if(STATE.inventario.length===0){
      html += '<p style="text-align:center;color:#999;padding:20px">Tu bolsa está vacía. Derrota monstruos para obtener artefactos.</p>';
    } else {
      html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">';
      STATE.inventario.forEach((slot,idx)=>{
        const it = ITEMS[slot.id-1];
        html += `<div class="card" style="cursor:pointer;text-align:center;padding:12px;transition:transform .15s" onmouseenter="this.style.transform='scale(1.04)'" onmouseleave="this.style.transform=''" onclick="window.__useItem(${idx})">
          <div style="font-size:38px;filter:drop-shadow(0 0 8px gold)">${it.emoji}</div>
          <div style="color:#ffd700;font-weight:600;font-size:16px;margin-top:6px">${it.nombre}</div>
          <div style="color:#2ecc71;font-size:14px;margin-top:4px">${it.efecto}</div>
          ${slot.cantidad>1?`<div style="color:#e74c3c;font-weight:700;margin-top:4px">x${slot.cantidad}</div>`:''}
        </div>`;
      });
      html += '</div>';
    }
    html += '<div class="btn-row"><button class="btn-action btn-secondary" onclick="closeItemModal();window.__battleResumed()">◁ Volver a la batalla</button></div>';
    html += '</div>';
    openItemModal(html);
  }

  usarItem(idx){
    const slot = STATE.inventario[idx];
    if(!slot) return;
    const it = ITEMS[slot.id-1];
    this._battleObjUsed++;
    snd_item();

    // Ejecutar efecto
    let efectoMsg = '';
    const vp = potenciaItem(STATE.clase, it.valor);   // Alquimista: pociones y buffs ×1,5
    switch(it.tipo){
      case 'heal':
        const curado = Math.min(vp, STATE.hpMax - STATE.hp);
        STATE.hp = Math.min(STATE.hpMax, STATE.hp + vp);
        efectoMsg = `+${curado} HP restaurados.`;
        this.drawPlayerBar();
        this.showFloat('+'+curado, this.w/2, (this._hpBarY||468)+28, '#2ecc71');
        break;
      case 'buff_atk':
        STATE.ataque += vp;
        STATE.buffs.push({tipo:'buff_atk', valor:vp, turnosRestantes:it.turnos, emoji:it.emoji});
        efectoMsg = `+${vp} Ataque durante ${it.turnos} turnos.`;
        snd_buff();
        break;
      case 'buff_def':
        STATE.defensa += vp;
        STATE.buffs.push({tipo:'buff_def', valor:vp, turnosRestantes:it.turnos, emoji:it.emoji});
        efectoMsg = `+${vp} Defensa durante ${it.turnos} turnos.`;
        snd_buff();
        break;
      case 'buff_roll':
        STATE.buffs.push({tipo:'buff_roll', valor:it.valor, turnosRestantes:1, emoji:it.emoji});
        efectoMsg = `+${it.valor} a la próxima tirada.`;
        snd_buff();
        break;
      case 'crown':
        STATE.flagCrown = true;
        STATE.buffs.push({tipo:'crown', valor:2, turnosRestantes:1, emoji:it.emoji});
        efectoMsg = '👑 Daño duplicado si tu tirada es ≥ 13.';
        snd_buff();
        break;
      case 'info':
        // Mostrar tabla de frecuencias teóricas
        let info = '<h4 style="color:#ffd700">📊 Distribución Teórica 2d12</h4><table class="stats-table"><thead><tr><th>Suma</th><th>Combinaciones</th><th>Probabilidad</th></tr></thead><tbody>';
        for(let k=2;k<=24;k++){
          const c = combosExact(k);
          info += `<tr><td>${k}</td><td>${c}</td><td>${(c/CFG.DICE_COMBOS*100).toFixed(2)}%</td></tr>`;
        }
        info += '</tbody></table>';
        openItemModal(info + '<div class="btn-row"><button class="btn-action" onclick="closeItemModal();window.__battleResumed()">Cerrar</button></div>');
        efectoMsg = 'Consulta revelada.';
        break;
      case 'perm_atk':
        STATE.ataqueBase += it.valor;
        STATE.ataque += it.valor;
        efectoMsg = `+${it.valor} Ataque PERMANENTE.`;
        snd_buff();
        break;
      case 'perm_def':
        STATE.defensaBase += it.valor;
        STATE.defensa += it.valor;
        efectoMsg = `+${it.valor} Defensa PERMANENTE.`;
        snd_buff();
        break;
      case 'gem':
        STATE.flagGem = true;
        STATE.buffs.push({tipo:'gem', valor:1.5, turnosRestantes:1, emoji:it.emoji});
        efectoMsg = '💎 Crítico ×1.5 si tu tirada ∈ [11,15].';
        snd_buff();
        break;
      case 'regen':
        STATE.buffs.push({tipo:'regen', valor:vp, turnosRestantes:it.turnos, emoji:it.emoji});
        efectoMsg = `+${vp} HP cada turno durante ${it.turnos} turnos.`;
        snd_buff();
        break;
      case 'star':
        STATE.flagStar = true;
        STATE.buffs.push({tipo:'star', valor:2, turnosRestantes:1, emoji:it.emoji});
        // Actualizar probabilidad
        this.probText.setText(this._probTexto());
        efectoMsg = '🌟 Umbral reducido en 2 para la próxima tirada.';
        snd_buff();
        break;
      case 'sword':
        STATE.ataque += vp;
        STATE.buffs.push({tipo:'sword', valor:vp, turnosRestantes:it.turnos, emoji:it.emoji});
        efectoMsg = `+${vp} Ataque durante ${it.turnos} turnos.`;
        snd_buff();
        break;
      case 'cheb':
        STATE.reduccionDaño = it.valor;
        STATE.buffs.push({tipo:'cheb', valor:it.valor, turnosRestantes:it.turnos, emoji:it.emoji});
        efectoMsg = `Reduce daño enemigo 30% durante ${it.turnos} turnos.`;
        snd_buff();
        break;
      case 'key':
        STATE.flagKey = true;
        STATE.buffs.push({tipo:'key', valor:it.valor, turnosRestantes:1, emoji:it.emoji});
        efectoMsg = '🔑 Próximo ataque: bonificación mágica.';
        snd_buff();
        break;
    }

    // Consumir item del inventario (excepto 'info' que es solo consulta)
    if(it.tipo !== 'info'){
      slot.cantidad--;
      if(slot.cantidad<=0) STATE.inventario.splice(idx,1);
    }

    STATE.stats.objetosUsados[it.id] = (STATE.stats.objetosUsados[it.id]||0) + 1;
    this.drawMiniInventory();
    this.updateStatsText();

    // Para 'info': el modal ya está abierto con su propio botón Cerrar — no cerrar aquí
    if(it.tipo === 'info') return;

    closeItemModal();
    this.turnoJugador = true;
    this.mostrarMensaje(`${it.emoji} ${it.nombre}: ${efectoMsg}`, '#ffd700', 5000);
    saveGame();
  }

  _shakeOnHit(){
    // Rabia del monstruo: 0 con HP lleno, ~1 cuando está por morir.
    const frac = STATE.jefeHpMax ? Math.max(0, STATE.jefeHp / STATE.jefeHpMax) : 1;
    const rage = 1 - frac;
    // Camera.shake mueve TODO el canvas (dados, barras, stats del jugador) y los
    // devuelve a su lugar solo. Medio de base → fuerte cerca de morir.
    const intensity = 0.006 + rage * 0.013;   // 0.006 (medio) .. 0.019 (fuerte)
    const dur       = 280 + Math.round(rage * 220); // 280ms .. 500ms
    this.cameras.main.shake(dur, intensity);
  }

  _initGearButton(){
    const g = document.getElementById('battleGear');
    if(!g) return;
    g.style.display = '';
    g.onclick = ()=>this.abrirOpciones();
    const hide = ()=>{ g.style.display='none'; g.onclick=null; this._closePoderes(); };
    this.events.once('shutdown', hide);
    this.events.once('destroy',  hide);
  }

  abrirOpciones(){
    if(!this.turnoJugador || this.dadoEnCurso) return;
    this.turnoJugador = false;
    // Definir todos los handlers ANTES de abrir el modal
    window.__battleResumed = ()=>{ this.turnoJugador = true; };
    window.__save = ()=>{ saveGame(); showToast('Partida guardada'); };
    window.__menuEdu = ()=>{ closeItemModal(); openEduModal(); };
    window.__volverMenuConfirm = ()=>{
      // swap content to confirmation view
      document.getElementById('itemContent').innerHTML = `
        <div style="padding:24px;text-align:center">
          <div style="font-size:36px;margin-bottom:16px;color:rgba(212,175,55,0.5)">&#9888;</div>
          <h3 style="color:#D4AF37;font-family:'Cinzel',serif;font-size:15px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px">Abandonar batalla</h3>
          <p style="color:#8a9ab0;font-family:'Lora',Georgia,serif;font-size:14px;margin-bottom:24px;line-height:1.7">
            La partida se guardara en el estado actual.<br>El combate en curso no contara como victoria.
          </p>
          <div class="btn-row" style="justify-content:center;gap:14px">
            <button class="btn-action btn-danger" style="width:150px" onclick="window.__volverMenuGo()">Salir</button>
            <button class="btn-action btn-secondary" style="width:150px" onclick="window.__volverMenuCancel()">Cancelar</button>
          </div>
        </div>`;
    };
    window.__volverMenuGo = ()=>{
      saveGame();
      closeItemModal();
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', ()=>this.scene.start('MenuScene'));
    };
    window.__volverMenuCancel = ()=>{
      // restore main options view
      window.__abrirOpcionesHTML && window.__abrirOpcionesHTML();
    };
    const opcionesHTML = ()=>{
      document.getElementById('itemContent').innerHTML = `
        <div style="padding:10px">
          <h3 style="color:#D4AF37;font-family:'Cinzel',serif;font-size:15px;letter-spacing:2px;text-transform:uppercase;text-align:center;margin-bottom:18px">Opciones</h3>
          <div class="btn-row" style="flex-direction:column;align-items:center;gap:10px">
            <button class="btn-action btn-secondary" style="width:240px" onclick="window.__save()">Guardar partida</button>
            <button class="btn-action btn-secondary" style="width:240px" onclick="window.__volverMenuConfirm()">Volver al Menu Principal</button>
            <button class="btn-action btn-secondary" style="width:240px" onclick="closeItemModal();window.__battleResumed()">&#9665; Cerrar</button>
          </div>
          <p style="margin-top:16px;font-size:13px;color:#2a3848;font-family:'Cinzel',serif;letter-spacing:1px;text-align:center;text-transform:uppercase">La partida se guarda automaticamente</p>
        </div>`;
    };
    window.__abrirOpcionesHTML = opcionesHTML;
    // render initial state directly into itemContent then open modal
    document.getElementById('itemContent').innerHTML = '';
    document.getElementById('itemModal').classList.add('active');
    opcionesHTML();
  }

  victoria(){
    this.turnoJugador = false;
    snd_victory();
    if(this.monsterState) this.monsterState('dead');
    if(this.monsterDom) this.tweens.add({targets:this.monsterDom, alpha:0, duration:900, delay:600});
    this.tweens.add({targets:this.monsterGraphics, alpha:0, scale:0.3, duration:1500});
    this.cameras.main.flash(400, 255, 215, 0);

    // Oro de batalla (escala con jefe y dificultad)
    const _oroMult = ({facil:0.8, normal:1, heroe:1.2, legendario:1.5})[STATE.dificultad] || 1;
    const dropOro = Math.round((this.monster.esFinal ? 150 : (25 + 5*STATE.jefeActual)) * _oroMult);
    STATE.oro = (STATE.oro||0) + dropOro;

    if(!this.monster.esFinal){
      // Los monstruos sólo entregan oro — los objetos se compran al Mercader
      this.mostrarMensaje(`+${dropOro} oro. Gastalo en la tienda del Mercader.`, '#ffd700', 6000);
    } else {
      addItemToInventory(15);
      this.mostrarMensaje(`🏆 ¡Obtuviste el Artefacto de la Victoria!  |  +${dropOro} oro`, '#ffd700', 6000);
    }

    const _xpBase   = xpForBattle(STATE.jefeActual, STATE.dificultad);
    const _xpMult   = (typeof erudicionMult === 'function') ? erudicionMult(STATE.skills) : 1;
    const _xpGanada = Math.round(_xpBase * _xpMult);
    STATE.xp      = (STATE.xp      || 0) + _xpGanada;
    STATE.xpTotal = (STATE.xpTotal || 0) + _xpGanada;
    snd_xp();
    const _xpLabel = _xpMult > 1 ? `+${_xpGanada} XP (×${_xpMult.toFixed(2)} Erudición)` : `+${_xpGanada} XP`;
    this.mostrarMensaje(_xpLabel, '#9fc2ff', 4000);
    if(typeof logrosEvent==='function') logrosEvent('victoria',{
      jefe: STATE.jefeActual, esFinal: !!this.monster.esFinal,
      sinObjetos: this._battleObjUsed===0, sinDaño: !this._battleReceivedDamage,
      hpFinal: STATE.hp
    });
    const _prevTitulo = (typeof getTituloActual === 'function') ? getTituloActual() : null;
    STATE.jefeActual++;
    STATE.nodeActual = (STATE.nodeActual||0) + 1;
    if (_prevTitulo && typeof getTituloActual === 'function') {
      const _newTitulo = getTituloActual();
      if (_newTitulo !== _prevTitulo && typeof showToast === 'function') {
        setTimeout(() => showToast(`${_newTitulo.emoji} ¡Nuevo título: ${_newTitulo.titulo}!`), 2000);
      }
    }
    saveGameWithFeedback();

    const next = this.monster.esFinal ? 'FinalScene' : 'VictoryScene';
    window.__irAVictoria = () => {
      closeItemModal();
      if(typeof sceneWipe === 'function'){ sceneWipe(this, next); return; }
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', ()=>this.scene.start(next));
    };
    // Esperar a que el monstruo termine de desvanecerse (delay 600 + 900ms)
    // antes de mostrar el resumen didáctico dentro de la propia escena de batalla.
    this.time.delayedCall(1700, ()=>this._mostrarResumenProbabilistico(dropOro, _xpGanada, _xpBase, _xpMult));
  }

  _mostrarResumenProbabilistico(dropOro, xpGanada, xpBase, xpMult){
    const log = this._battleLog;
    const nJ = log.jugador.length;
    const impactosJ = log.jugador.filter(r => r.impacto).length;
    const pctRealJ = nJ ? (impactosJ / nJ * 100) : 0;
    const pctTeoJ = nJ ? (log.jugador.reduce((s, r) => s + casosFavorables(r.umbral) / CFG.DICE_COMBOS * 100, 0) / nJ) : 0;
    const avgSumaJ = nJ ? (log.jugador.reduce((s, r) => s + r.sumaFinal, 0) / nJ) : 0;
    const dmgTotalJ = log.jugador.reduce((s, r) => s + r.dmg, 0);

    const nM = log.monstruo.length;
    const avgSumaM = nM ? (log.monstruo.reduce((s, r) => s + r.suma, 0) / nM) : 0;
    const dmgTotalM = log.monstruo.reduce((s, r) => s + r.dmg, 0);

    const comparacion = nJ ? (pctRealJ >= pctTeoJ
      ? `Tuviste más suerte que la probabilidad esperada: acertaste el ${pctRealJ.toFixed(0)}% de tus tiradas, cuando la teoría predecía ${pctTeoJ.toFixed(1)}%.`
      : `Tuviste algo menos de suerte que la probabilidad esperada: acertaste el ${pctRealJ.toFixed(0)}% de tus tiradas, cuando la teoría predecía ${pctTeoJ.toFixed(1)}%.`)
      : 'No se registraron tiradas propias en esta batalla.';

    const html = `
      <h4 style="color:#ffd700">📊 Resumen probabilístico de la batalla</h4>
      <p style="color:#C0C8D0;font-size:12.5px;line-height:1.5">
        Cada tirada es la suma de <b>2d12</b> (rango 2–24, promedio teórico 13).
        Compará lo que pasó de verdad contra lo que predice la teoría.
      </p>
      <table class="stats-table">
        <thead><tr><th></th><th>Vos</th><th>${this.monster.nombre}</th></tr></thead>
        <tbody>
          <tr><td>Tiradas</td><td>${nJ}</td><td>${nM}</td></tr>
          <tr><td>Suma promedio</td><td>${avgSumaJ.toFixed(1)}</td><td>${avgSumaM.toFixed(1)}</td></tr>
          <tr><td>Impactos</td><td>${impactosJ}/${nJ} (${pctRealJ.toFixed(0)}%)</td><td>—</td></tr>
          <tr><td>Prob. teórica de impacto (prom.)</td><td>${pctTeoJ.toFixed(1)}%</td><td>—</td></tr>
          <tr><td>Daño total infligido</td><td>${dmgTotalJ}</td><td>${dmgTotalM}</td></tr>
        </tbody>
      </table>
      <p style="color:#8a9ab0;font-size:11.5px;margin-top:8px">${comparacion}</p>
      <h4 style="color:#9fc2ff;margin-top:10px">🏅 Recompensa</h4>
      <p style="color:#C0C8D0;font-size:12.5px">
        +${dropOro} oro · +${xpGanada} XP${xpMult > 1 ? ` (base ${xpBase} × ${xpMult.toFixed(2)} Erudición)` : ''}
      </p>
      <div class="btn-row"><button class="btn-action" onclick="window.__irAVictoria()">Continuar ▷</button></div>
    `;
    openItemModal(html);
  }

  // Ofrece al jugador usar un ítem perdido por bolsa llena
  _ofrecerItemPerdido(ids, idx){
    if(idx >= ids.length){
      const _prevT2 = (typeof getTituloActual === 'function') ? getTituloActual() : null;
      STATE.jefeActual++;
      STATE.nodeActual = (STATE.nodeActual||0) + 1;
      if (_prevT2 && typeof getTituloActual === 'function') {
        const _newT2 = getTituloActual();
        if (_newT2 !== _prevT2 && typeof showToast === 'function') {
          setTimeout(() => showToast(`${_newT2.emoji} ¡Nuevo título: ${_newT2.titulo}!`), 600);
        }
      }
      saveGameWithFeedback();
      this.time.delayedCall(800, ()=>{
        const next = this.monster.esFinal ? 'FinalScene' : 'VictoryScene';
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', ()=>this.scene.start(next));
      });
      return;
    }
    const itemId = ids[idx];
    const it = ITEMS[itemId-1];
    const html = `<div style="padding:14px;text-align:center">
      <h3 style="color:#ffd700;font-family:Cinzel;margin-bottom:12px">📦 ¡Bolsa Llena!</h3>
      <div style="font-size:60px;margin:10px 0">${it.emoji}</div>
      <p style="font-size:18px;color:#ffd700;font-weight:700">${it.nombre}</p>
      <p style="color:#ccc;margin:8px 0">${it.desc}</p>
      <p style="color:#2ecc71;font-weight:600">${it.efecto}</p>
      <p style="color:#aaa;margin-top:12px">Tu bolsa está llena. ¿Querés usar este objeto ahora o descartarlo?</p>
      <div class="btn-row" style="margin-top:14px">
        <button class="btn-action" onclick="window.__usarItemPerdido(${itemId})">⚡ Usar Ahora</button>
        <button class="btn-action btn-secondary" onclick="window.__descartarItem()">🗑 Descartar</button>
      </div>
    </div>`;
    openItemModal(html);
    window.__usarItemPerdido = (id)=>{
      closeItemModal();
      this._aplicarItemDirecto(id);
      this._ofrecerItemPerdido(ids, idx+1);
    };
    window.__descartarItem = ()=>{
      closeItemModal();
      this._ofrecerItemPerdido(ids, idx+1);
    };
  }

  // Aplica efecto de item sin consumir inventario (item "perdido" usado al vuelo)
  _aplicarItemDirecto(itemId){
    const it = ITEMS[itemId-1];
    snd_item();
    switch(it.tipo){
      case 'heal': STATE.hp = Math.min(STATE.hpMax, STATE.hp+it.valor); this.drawPlayerBar(); break;
      case 'buff_atk': STATE.ataque+=it.valor; STATE.buffs.push({tipo:'buff_atk',valor:it.valor,turnosRestantes:it.turnos,emoji:it.emoji}); break;
      case 'buff_def': STATE.defensa+=it.valor; STATE.buffs.push({tipo:'buff_def',valor:it.valor,turnosRestantes:it.turnos,emoji:it.emoji}); break;
      case 'buff_roll': STATE.buffs.push({tipo:'buff_roll',valor:it.valor,turnosRestantes:1,emoji:it.emoji}); break;
      case 'perm_atk': STATE.ataqueBase+=it.valor; STATE.ataque+=it.valor; break;
      case 'perm_def': STATE.defensaBase+=it.valor; STATE.defensa+=it.valor; break;
      case 'regen': STATE.buffs.push({tipo:'regen',valor:it.valor,turnosRestantes:it.turnos,emoji:it.emoji}); break;
      case 'cheb': STATE.reduccionDaño=it.valor; STATE.buffs.push({tipo:'cheb',valor:it.valor,turnosRestantes:it.turnos,emoji:it.emoji}); break;
      case 'crown': STATE.flagCrown=true; STATE.buffs.push({tipo:'crown',valor:2,turnosRestantes:1,emoji:it.emoji}); break;
      case 'gem': STATE.flagGem=true; break;
      case 'star': STATE.flagStar=true; break;
      case 'key': STATE.flagKey=true; break;
      case 'sword': STATE.ataque+=it.valor; STATE.buffs.push({tipo:'sword',valor:it.valor,turnosRestantes:it.turnos,emoji:it.emoji}); break;
    }
    STATE.stats.objetosUsados[itemId]=(STATE.stats.objetosUsados[itemId]||0)+1;
    this.mostrarMensaje(`${it.emoji} ${it.nombre} usado. ${it.efecto}`, '#ffd700', 4000);
    this.drawMiniInventory();
    this.updateStatsText();
  }

  derrota(){
    this.turnoJugador = false;
    snd_defeat();
    this.cameras.main.flash(400, 200, 0, 0);

    STATE.stats.derrotas++;
    if(typeof logrosEvent==='function') logrosEvent('derrota',{});
    if(STATE.resiliencia < 3) STATE.resiliencia++;
    STATE._resilNotify = true; // flag para toast al reiniciar

    // Revivir con HP parcial (30%) — fuerza a comprar/usar curación, no rellena gratis
    STATE.hp = Math.max(1, Math.round(STATE.hpMax * REVIVIR_FRAC));
    STATE.buffs = [];
    STATE.ataque = STATE.ataqueBase + bonusAtaqueCampaña(STATE.jefeActual, STATE.dificultad);
    STATE.defensa = STATE.defensaBase;
    this._dadoSagradoCooldown = 0;

    // Ocultar globo de diálogo si estaba visible
    if(this.dialogueBalloon && this.dialogueBalloon.active){
      this.dialogueBalloon.setVisible(false);
    }

    this.mostrarMensaje(`💀 Has sido derrotado. Resiliencia: +${STATE.resiliencia}. ${MSG_COMBATE[4]}`, '#e74c3c', 6000);
    saveGame();
    this.time.delayedCall(2200, ()=>this._postMortem());
  }

  /* Post-mortem de derrota: la derrota como aprendizaje.
     Analiza las tiradas de ESTA batalla vs la esperanza teórica (13). */
  _postMortem(){
    const rolls = (STATE.stats.tiradas || []).slice(this._battleRollStart || 0);
    const restart = () => { try{ closeItemModal(); }catch(e){} this.scene.restart(); };
    if(rolls.length === 0){ restart(); return; }

    const media = rolls.reduce((s,t)=>s+t.valor,0) / rolls.length;
    const umbral = this.getUmbralEfectivo ? this.getUmbralEfectivo() : this.monster.umbral;
    // Los bonos permanentes se suman a la tirada: el análisis tiene que contarlos
    const bono = this._bonoBatalla || 0;
    const casosFav = casosFavorables(Math.max(2, umbral - bono));
    const pImpacto = (casosFav/144*100).toFixed(1);
    const aciertos = rolls.filter(t => t.valor + bono >= umbral).length;
    const pctReal  = (aciertos/rolls.length*100).toFixed(0);

    let veredicto, color;
    if(media < 11.5){
      veredicto = `Tu media fue <b>${media.toFixed(1)}</b>, bien por debajo de la esperanza teórica (13). <b>Mala suerte real</b>: el azar no te acompañó esta vez. La Ley de los Grandes Números dice que no puede durar.`;
      color = '#5fcf88';
    } else if(media > 14.5){
      veredicto = `Tu media fue <b>${media.toFixed(1)}</b> — ¡mejor que la esperanza teórica (13)! El azar estuvo de tu lado: la derrota vino por otro lado. Revisá <b>objetos, poderes y momento de usarlos</b>.`;
      color = '#e0a050';
    } else {
      veredicto = `Tu media fue <b>${media.toFixed(1)}</b>, muy cerca de la esperanza teórica (13). El azar estuvo normal: la diferencia la hacen los <b>objetos, los poderes del Grimorio y las mejoras de HP</b>.`;
      color = '#9fc2ff';
    }

    window.__pmRetry = restart;
    openItemModal(`
      <div style="padding:14px;text-align:center;max-width:460px;margin:0 auto">
        <div style="font-size:36px;margin-bottom:4px">📋</div>
        <h3 style="color:#D4AF37;font-family:'Cinzel',serif;font-size:16px;letter-spacing:1px;margin-bottom:12px">Análisis de la batalla</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.25);border-radius:6px;padding:8px 4px">
            <div style="color:#D4AF37;font-family:'Cinzel',serif;font-size:17px;font-weight:700">${rolls.length}</div>
            <div style="color:#8a9ab0;font-size:9px;font-family:'Poppins',sans-serif">tiradas</div>
          </div>
          <div style="background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.25);border-radius:6px;padding:8px 4px">
            <div style="color:#D4AF37;font-family:'Cinzel',serif;font-size:17px;font-weight:700">${media.toFixed(1)}</div>
            <div style="color:#8a9ab0;font-size:9px;font-family:'Poppins',sans-serif">tu media (teórica: 13)</div>
          </div>
          <div style="background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.25);border-radius:6px;padding:8px 4px">
            <div style="color:#D4AF37;font-family:'Cinzel',serif;font-size:17px;font-weight:700">${pctReal}%</div>
            <div style="color:#8a9ab0;font-size:9px;font-family:'Poppins',sans-serif">impactos (esperado: ${pImpacto}%)</div>
          </div>
        </div>
        <p style="color:${color};font-family:'Lora',serif;font-size:13px;line-height:1.55;margin-bottom:14px">${veredicto}</p>
        <p style="color:#5a7080;font-family:'Poppins',sans-serif;font-size:10px;margin-bottom:12px">
          Revivís con ${Math.round(REVIVIR_FRAC*100)}% de HP y +1 de Resiliencia (bonus permanente a tus tiradas).
        </p>
        <button class="btn-action" onclick="window.__pmRetry()">⚔ Reintentar</button>
      </div>`);
  }
}

BattleScene.DISENO_MOVIL = true;
