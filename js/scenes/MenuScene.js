class MenuScene extends Phaser.Scene {
  constructor(){ super('MenuScene'); }
  preload(){
    if(typeof bgLoad === 'function') bgLoad(this, 'menu');
  }
  create(){
    initAudio();
    Music.play('menu');
    // Reset de guards: Phaser reusa la instancia de escena; sin esto, el flag
    // _starting queda en true y la 2da vez "Nueva Aventura" no hace nada.
    this._starting = false;
    this.input.enabled = true;
    if(window.game) window.game.input.enabled = true;
    this.cameras.main.fadeIn(400, 0, 0, 0);
    const w = this.scale.width, h = this.scale.height;
    // Teléfono apaisado: el lienzo mide la pantalla real (~812×375), así que el diseño
    // pasa a dos columnas con letras de 14-16 px y botones de 48 px (≥ 44 px táctiles).
    const compacto = h < 500;
    // Retrato (teléfono vertical, solo si el alumno descartó el aviso de girar): una columna.
    const columna = !compacto && w < 700;

    // Fondo gradiente (fallback debajo de la imagen)
    const bg = this.add.graphics().setDepth(-12);
    bg.fillGradientStyle(0x111520, 0x111520, 0x0D0D14, 0x0D0D14, 1);
    bg.fillRect(0,0,w,h);

    // Imagen de fondo (entrada del calabozo) + efectos dinámicos
    if(typeof bgMount === 'function') bgMount(this, 'menu', { depth:-11, fxDepth:-8 });
    // Oscurecedor para legibilidad del texto del menú
    const bgDark = this.add.graphics().setDepth(-9);
    bgDark.fillStyle(0x0A0A12, 0.42); bgDark.fillRect(0,0,w,h);

    // Viñeta perimetral
    const vignette = this.add.graphics();
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0.7, 0, 0);
    vignette.fillRect(0,0,w,h*0.25);
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.7, 0.7);
    vignette.fillRect(0,h*0.75,w,h*0.25);

    // Estrellas (doradas muy tenues)
    for(let i=0;i<60;i++){
      const x=Math.random()*w, y=Math.random()*h;
      const r = Math.random()*1.2+0.3;
      const col = Math.random()>0.7 ? 0xD4AF37 : 0xC0C8D0;
      const star = this.add.circle(x, y, r, col, Math.random()*0.35+0.05);
      this.tweens.add({targets:star, alpha:{from:0.05, to:star.alpha}, duration:1500+Math.random()*2500, yoyo:true, repeat:-1, delay:Math.random()*2000});
    }

    // Dados decorativos girando
    if(!compacto && !columna){
      const diceLeft = this.add.graphics();
      diceLeft.x = w*0.15; diceLeft.y = h*0.45;
      this.drawDie(diceLeft, 0xD4AF37, 0x0D0D14);
      this.tweens.add({targets:diceLeft, angle:360, duration:6000, repeat:-1});

      const diceRight = this.add.graphics();
      diceRight.x = w*0.85; diceRight.y = h*0.45;
      this.drawDie(diceRight, 0xD4AF37, 0x0D0D14);
      this.tweens.add({targets:diceRight, angle:-360, duration:7000, repeat:-1});

      // Línea decorativa superior
      const topRule = this.add.graphics();
      topRule.lineStyle(1, 0xD4AF37, 0.25);
      topRule.lineBetween(w*0.1, h*0.11, w*0.9, h*0.11);
    }

    // Título
    const colIzq = compacto ? w*0.27 : w/2;   // columna del título
    const titulo2 = compacto || columna;      // título en dos renglones
    const title = titulo2
      ? this.add.text(colIzq, compacto ? h*0.30 : h*0.15, 'Héroes\nProbabilísticos', {
          fontFamily:'Cinzel, serif', fontSize: columna ? '36px' : '34px', fontStyle:'800', align:'center', lineSpacing:2,
          color:'#D4AF37', stroke:'#0A0A10', strokeThickness:3,
          shadow:{offsetX:0, offsetY:0, color:'#D4AF37', blur:12, fill:true}
        }).setOrigin(0.5)
      : this.add.text(w/2, h*0.18, 'Héroes Probabilísticos', {
          fontFamily:'Cinzel, serif', fontSize:'62px', fontStyle:'800',
          color:'#D4AF37',
          stroke:'#0A0A10', strokeThickness:4,
          shadow:{offsetX:0, offsetY:0, color:'#D4AF37', blur:30, fill:true}
        }).setOrigin(0.5);
    this.tweens.add({targets:title, alpha:{from:0.85, to:1}, duration:2000, yoyo:true, repeat:-1});

    // Separador decorativo
    const sepY = compacto ? h*0.53 : (columna ? h*0.25 : h*0.265);
    const sepR = compacto ? 90 : 180;
    const sep = this.add.graphics();
    sep.lineStyle(1, 0xD4AF37, 0.2);
    sep.lineBetween(colIzq-sepR, sepY, colIzq-24, sepY);
    sep.lineBetween(colIzq+24,  sepY, colIzq+sepR, sepY);
    this.add.text(colIzq, sepY, '◆', {fontFamily:'Cinzel', fontSize:'14px', color:'#8a7228'}).setOrigin(0.5);

    // Subtítulo
    this.add.text(colIzq, compacto ? h*0.62 : (columna ? h*0.29 : h*0.29), 'RPG Educativo de Probabilidad', {
      fontFamily:'Cinzel, serif', fontSize: (compacto || columna) ? '16px' : '20px', color:'#C0C8D0', fontStyle:'italic'
    }).setOrigin(0.5);

    this.add.text(colIzq, compacto ? h*0.71 : (columna ? h*0.33 : h*0.34), 'Creado por ProfeD.', {
      fontFamily:'Cinzel, serif', fontSize: (compacto || columna) ? '14px' : '15px', color:'#7d8ea6'
    }).setOrigin(0.5);

    // Botones
    const bBw = compacto ? Math.min(340, w*0.46) : (columna ? Math.min(360, w*0.88) : 360);
    const bBh = compacto ? 48 : (columna ? 52 : 54);
    const bFs = (compacto || columna) ? '16px' : '19px';
    const bX  = compacto ? w*0.72 : w/2;
    const bGap = compacto ? 8 : (columna ? 14 : h*0.08 - bBh);
    const yBtn = (i)=> compacto
      ? h/2 - (5*bBh+4*bGap)/2 + bBh/2 + i*(bBh+bGap) - 8   // columna derecha, centrada
      : (columna ? h*0.42 + i*(bBh+bGap) : h*(0.49 + 0.08*i));
    const btns = [
      {label:'▶  Iniciar Aventura', y:yBtn(0), primary:true, action:()=>{
        const start = ()=>{
          // Bloquear input del menú de inmediato: evita que un segundo click
          // (o click-through del modal DOM) dispare otro botón durante el fade
          // y arranque una 2da escena → pantallas mezcladas.
          if(this._starting) return;
          this._starting = true;
          this.input.enabled = false;
          clearSave();
          // Reset desde fuente unica (state-schema.js). Fallback inline por si no cargó.
          if(typeof freshRunState==='function') Object.assign(STATE, freshRunState());
          else Object.assign(STATE,{nombre:"Héroe",jefeActual:0,dificultad:'normal',hp:150,hpMax:150,ataque:8,defensa:5,ataqueBase:8,defensaBase:5,resiliencia:0,inventario:[],buffs:[],loreVisto:[],tiradaGlobal:0,diosaContador:0,nodeActual:0,enigmasCompletados:{},xp:0,xpTotal:0,oro:0,mpMax:4,hpUpgrades:0,skills:{},_hpMaxBase:null,stats:{tiradas:[],derrotas:0,objetosUsados:{},tiempoInicio:Date.now(),dañoTotalFinal:0,objetosUsadosFinal:0,turnosEpicos:[]}});
          // Frenar TODAS las escenas (excepto el menú) sin importar su estado.
          // stop() es seguro aunque la escena ya esté parada; el guard anterior
          // dejaba vivas escenas en estado 'paused' → se encimaban en la 2da partida.
          this.scene.manager.getScenes(false).forEach(s=>{
            const k = s.scene.key;
            if(k!=='MenuScene'){ try{ this.scene.stop(k); }catch(e){} }
          });
          // Limpiar inputs DOM huérfanos (IntroScene usa add.dom #heroName)
          try{ document.querySelectorAll('#heroName').forEach(el=>el.remove()); }catch(e){}
          this.goFullscreen();
          this.fadeGo('IntroScene');
        };
        if(hasSave()){ showConfirm('Ya tenés una aventura en curso. Si comenzás una nueva, se perderá todo el progreso guardado.', start.bind(this), {title:'¿Comenzar nueva aventura?', okLabel:'Nueva aventura'}); }
        else { start(); }
      }},
      {label:'◈  Cargar Partida',   y:yBtn(1), action:()=>{ if(loadGame()){ showToast(`¡Bienvenido de nuevo, ${STATE.nombre}!`); this.fadeGo('MapScene'); } else { showToast(hasSave() ? 'La partida guardada está dañada y no se pudo cargar.' : 'No hay partida guardada.', 5000); } }},
      {label:'🎲  Modo Minijuegos',  y:yBtn(2), action:()=>{ this.goFullscreen(); this.fadeGo('ArcadeHubScene'); }},
      {label:'🏅  Logros y Stats',    y:yBtn(3), action:()=>openLogrosModal()},
      {label:'📚  Info Didáctica',   y:yBtn(4), action:()=>openInfoDidactica()}
    ];
    btns.forEach(b=>this.createButton(bX, b.y, b.label, b.action, b.primary||false, bBw, bBh, bFs));

    // Footer (en el diseño compacto no hay lugar: queda solo "Borrar")
    if(!compacto && !columna){
      this.add.text(w/2, h-28, 'Domina el azar  ·  Restaura la Probabilidad  ·  Salva Arithmos', {
        fontFamily:'Cinzel', fontSize:'13px', color:'#6f8099'
      }).setOrigin(0.5);
    }

    // Botón discreto — borrar progreso (zona táctil de 44 px de alto en el diseño compacto)
    const borrarTxt = this.add.text(compacto ? colIzq : w/2, compacto ? h-26 : (columna ? h-30 : h-52), '🗑  Borrar todo el progreso', {
      fontFamily:'Poppins', fontSize: (compacto || columna) ? '14px' : '12px', color:'#b07070',
      padding: (compacto || columna) ? {x:12, y:18} : {x:0, y:0}
    }).setOrigin(0.5).setInteractive({useHandCursor:true});
    borrarTxt.on('pointerover', ()=> borrarTxt.setStyle({color:'#c0392b'}));
    borrarTxt.on('pointerout',  ()=> borrarTxt.setStyle({color:'#b07070'}));
    borrarTxt.on('pointerup',   ()=>{
      showConfirm(
        'Se borrarán la partida guardada y todas las estadísticas del Modo Libre. Esta acción no se puede deshacer.',
        ()=>{ clearSave(); try{ localStorage.removeItem('heroesProb_arcadeStats'); }catch(e){} showToast('Progreso borrado.'); },
        { title:'¿Borrar todo el progreso?', okLabel:'Borrar todo' }
      );
    });
  }
  drawDie(g, color, face){
    g.lineStyle(1.5, color, 0.5);
    g.strokeRect(-30,-30,60,60);
    g.fillStyle(face, 0.7); g.fillRect(-29,-29,58,58);
    g.fillStyle(color, 0.7);
    g.fillCircle(-13,-13,3.5); g.fillCircle(13,-13,3.5);
    g.fillCircle(0,0,3.5);
    g.fillCircle(-13,13,3.5); g.fillCircle(13,13,3.5);
  }
  createButton(x, y, label, action, primary=false, bw=360, bh=54, fs='19px'){
    const container = this.add.container(x, y);

    // Sombra
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.55);
    shadow.fillRect(-bw/2+3, -bh/2+5, bw, bh);

    // Fill principal
    const fill = this.add.graphics();
    if(primary){
      fill.fillGradientStyle(0x2A2010, 0x2A2010, 0x1A1408, 0x1A1408, 0.55);
    } else {
      fill.fillGradientStyle(0x1E2836, 0x1E2836, 0x121A28, 0x121A28, 0.55);
    }
    fill.fillRect(-bw/2, -bh/2, bw, bh);

    // Borde exterior
    const border = this.add.graphics();
    border.lineStyle(1, primary ? 0xD4AF37 : 0x2a3848, primary ? 0.7 : 1);
    border.strokeRect(-bw/2, -bh/2, bw, bh);

    // Línea superior interna (highlight)
    const topline = this.add.graphics();
    topline.lineStyle(1, primary ? 0xD4AF37 : 0x3a4858, primary ? 0.25 : 0.12);
    topline.lineBetween(-bw/2+2, -bh/2+1, bw/2-2, -bh/2+1);

    // Texto
    const defaultColor = primary ? '#D4AF37' : '#8aa0bd';
    const hoverColor   = '#D4AF37';
    const txt = this.add.text(0, 0, label, {
      fontFamily:'Cinzel, serif', fontSize:fs, fontStyle:'600',
      color:defaultColor, letterSpacing:(parseInt(fs,10)<18 ? 1 : 2)
    }).setOrigin(0.5);

    container.add([shadow, fill, border, topline, txt]);

    // Glow rect (hover)
    const glow = this.add.graphics();
    glow.lineStyle(1, 0xD4AF37, 0.5);
    glow.strokeRect(x-bw/2-2, y-bh/2-2, bw+4, bh+4);
    glow.setAlpha(0);

    const hit = this.add.rectangle(x, y, bw, bh, 0xffffff, 0).setInteractive({useHandCursor:true});
    hit.on('pointerover', ()=>{
      this.tweens.add({targets:container, scale:1.03, duration:160, ease:'Sine.easeOut'});
      this.tweens.add({targets:glow, alpha:1, duration:180});
      txt.setColor(hoverColor);
      snd_item();
    });
    hit.on('pointerout', ()=>{
      this.tweens.add({targets:container, scale:1, duration:160, ease:'Sine.easeOut'});
      this.tweens.add({targets:glow, alpha:0, duration:160});
      txt.setColor(defaultColor);
    });
    hit.on('pointerdown', ()=>{
      this.tweens.add({targets:container, scale:0.97, duration:60, yoyo:true});
      snd_buff();
    });
    hit.on('pointerup', action);
  }
  fadeGo(targetScene, duration=350){
    if(typeof sceneWipe === 'function'){ sceneWipe(this, targetScene); return; }
    this.cameras.main.fadeOut(duration, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', ()=>this.scene.start(targetScene));
  }
  goFullscreen(){
    try{
      const el = document.documentElement;
      if(el.requestFullscreen) el.requestFullscreen().catch(()=>{});
    }catch(e){}
  }
}

// Escena migrada al lienzo del teléfono (ver js/core/movil.js).
MenuScene.DISENO_MOVIL = true;
