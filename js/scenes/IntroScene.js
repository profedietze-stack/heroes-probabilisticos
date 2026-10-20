class IntroScene extends Phaser.Scene {
  constructor(){ super('IntroScene'); }
  create(){
    const w=this.scale.width, h=this.scale.height;
    // Teléfono apaisado (lienzo = pantalla real): letras de 13-24 px y botones de 44 px o más.
    const C = this._compacto = h < 500;
    // Defensa dura: IntroScene debe quedar SOLA. Frena cualquier otra escena que
    // siga viva/renderizando (race del modal, doble input, etc.) → evita que la
    // intro se "mezcle" con boss/minijuegos/mapa.
    this.scene.manager.getScenes(false).forEach(s=>{
      const k=s.scene.key;
      if(k!=='IntroScene'){ try{ this.scene.stop(k); }catch(e){} }
    });
    // Limpiar inputs DOM huérfanos de una corrida previa antes de crear el nuevo
    try{ document.querySelectorAll('#heroName').forEach(el=>el.remove()); }catch(e){}
    this._introEls = [];
    const _track = (obj) => { this._introEls.push(obj); return obj; };

    _track(this.add.rectangle(0,0,w,h,0x0D0D14).setOrigin(0));
    // Sombra animada
    for(let i=0;i<30;i++){
      const p = _track(this.add.circle(Math.random()*w, Math.random()*h, Math.random()*2+0.5, 0xD4AF37, 0.4));
      this.tweens.add({targets:p, alpha:0, y:p.y-50, duration:3000+Math.random()*2000, repeat:-1, onRepeat:()=>{p.alpha=0.4; p.y=Math.random()*h+h*0.1;}});
    }
    const title = _track(this.add.text(w/2, C ? 26 : 60, '⚔ El Reino de Arithmos ⚔', {fontFamily:'Cinzel', fontSize: C ? '24px' : '38px', color:'#D4AF37', fontStyle:'700', stroke:'#0A0A10', strokeThickness:3}).setOrigin(0.5));
    title.alpha = 0;
    this.tweens.add({targets:title, alpha:1, duration:1500});

    const storyBox = _track(this.add.graphics());
    const SBX = C ? 24 : 60, SBY = C ? 50 : 110, SBH = C ? 150 : 280;
    storyBox.fillStyle(0x111520, 0.92); storyBox.fillRoundedRect(SBX, SBY, w-2*SBX, SBH, 12);
    storyBox.lineStyle(2, 0xD4AF37, 0.6); storyBox.strokeRoundedRect(SBX, SBY, w-2*SBX, SBH, 12);
    // Línea interna highlight
    storyBox.lineStyle(1, 0xD4AF37, 0.15); storyBox.strokeRoundedRect(SBX+3, SBY+3, w-2*SBX-6, SBH-6, 10);

    const story = 'En el Reino de Arithmos, el Demiurgo del Determinismo Absoluto ha corrompido el equilibrio de la Probabilidad de Laplace.\n\nTú, héroe elegido por el azar, debes restaurar la armonía enfrentando a 10 Monstruos Matemáticos.\n\n¿Estás preparado(a) para dominar el azar?';
    const storyTxt = _track(this.add.text(w/2, C ? 60 : 130, '', {fontFamily:'Poppins', fontSize: C ? '15px' : '24px', color:'#f5e9c9', wordWrap:{width: C ? w-80 : w-180}, align:'center', lineSpacing: C ? 3 : 8}).setOrigin(0.5, 0));
    // Scroll de texto
    let idx = 0;
    this.time.addEvent({delay:30, repeat:story.length-1, callback:()=>{ storyTxt.text = story.substring(0, ++idx); }});

    // Nombre
    _track(this.add.text(w/2, C ? 222 : 420, '⟶ ¿Cuál es tu nombre, héroe? ⟵', {fontFamily:'Cinzel', fontSize: C ? '17px' : '24px', color:'#D4AF37'}).setOrigin(0.5));

    // Campo input HTML superpuesto (en el teléfono, al lado del botón; 18 px para que el navegador no haga zoom)
    const inputHtml = `<input id="heroName" maxlength="15" placeholder="Tu nombre..." style="background:#0D0D14;color:#D4AF37;border:2px solid rgba(212,175,55,0.5);border-radius:6px;padding:${C ? '10px 12px' : '10px 16px'};font-size:${C ? '18px' : '20px'};font-family:Cinzel,serif;text-align:center;outline:none;width:${C ? '250px' : '280px'};letter-spacing:1px;box-sizing:border-box;${C ? 'height:46px;' : ''}" onfocus="this.style.borderColor='rgba(212,175,55,0.9)'" onblur="this.style.borderColor='rgba(212,175,55,0.5)'">`;
    const input = this.add.dom(C ? w/2 - 150 : w/2, C ? 270 : 470).createFromHTML(inputHtml);
    input.setOrigin(0.5);
    // Al cerrar la escena, destruir el input DOM para que no flote en escenas siguientes
    this.events.once('shutdown', ()=>{
      try{ input.destroy(); }catch(e){}
      try{ document.querySelectorAll('#heroName').forEach(el=>el.remove()); }catch(e){}
    });

    // Botón aceptar — dark-gold style (mismo que MenuScene)
    const bw = C ? 270 : 280, bh = C ? 46 : 54, bx = C ? w/2 + 150 : w/2, by = C ? 270 : 545;
    const btnContainer = this.add.container(bx, by);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.55);
    shadow.fillRect(-bw/2+3, -bh/2+5, bw, bh);
    const btnBg = this.add.graphics();
    btnBg.fillGradientStyle(0x2A2010, 0x2A2010, 0x1A1408, 0x1A1408, 1);
    btnBg.fillRect(-bw/2, -bh/2, bw, bh);
    const border = this.add.graphics();
    border.lineStyle(1, 0xD4AF37, 0.7);
    border.strokeRect(-bw/2, -bh/2, bw, bh);
    const topline = this.add.graphics();
    topline.lineStyle(1, 0xD4AF37, 0.25);
    topline.lineBetween(-bw/2+2, -bh/2+1, bw/2-2, -bh/2+1);
    const btnTxt = this.add.text(0, 0, '⚔ Aceptar el Destino', {fontFamily:'Cinzel, serif', fontSize:'20px', color:'#D4AF37', fontStyle:'600', letterSpacing:2}).setOrigin(0.5);
    btnContainer.add([shadow, btnBg, border, topline, btnTxt]);
    // Pulso de respiración continuo
    this.tweens.add({targets:btnContainer, scale:{from:1, to:1.04}, duration:1400, yoyo:true, repeat:-1, ease:'Sine.easeInOut'});
    const hit = this.add.rectangle(bx, by, bw, bh, 0, 0).setInteractive({useHandCursor:true});
    hit.on('pointerover', ()=>{ this.tweens.killTweensOf(btnContainer); this.tweens.add({targets:btnContainer, scale:1.04, duration:150, ease:'Sine.easeOut'}); btnTxt.setColor('#F5D97A'); snd_item(); });
    hit.on('pointerout', ()=>{ this.tweens.add({targets:btnContainer, scale:1, duration:150, onComplete:()=>{ this.tweens.add({targets:btnContainer, scale:{from:1, to:1.04}, duration:1400, yoyo:true, repeat:-1, ease:'Sine.easeInOut'}); }}); btnTxt.setColor('#D4AF37'); });
    hit.on('pointerdown', ()=>{ this.tweens.add({targets:btnContainer, scale:0.95, duration:80, yoyo:true}); });
    hit.on('pointerup', ()=>{
      const el = document.getElementById('heroName');
      const name = (el && el.value.trim()) || '';
      if (name.length < 4) {
        showToast('El nombre debe tener al menos 4 caracteres.');
        if (el) { el.style.borderColor = 'rgba(192,80,48,0.9)'; el.focus(); }
        return;
      }
      STATE.nombre = name.substring(0,15);
      snd_buff();
      input.setVisible(false);
      hit.setVisible(false);
      btnContainer.setVisible(false);
      this._mostrarSelectorDificultad();
    });

    // Tutorial inicial
    const tut = _track(this.add.text(w/2, C ? h-34 : h-50, TUTORIALES[0], {fontFamily:'Poppins', fontStyle:'italic', fontSize: C ? '14px' : '17px', color:'#9eb5c8', wordWrap:{width:w-100}, align:'center'}).setOrigin(0.5));
    this.tweens.add({targets:tut, alpha:{from:0.5, to:1}, duration:1500, yoyo:true, repeat:-1});
  }

  _mostrarSelectorDificultad(){
    const w=this.scale.width, h=this.scale.height;
    const keys = ['facil','normal','heroe','legendario'];
    const colores = {facil:0x27ae60, normal:0x2980b9, heroe:0xc0392b, legendario:0x6c0000};

    // Ocultar todos los elementos de intro antes de mostrar selector
    (this._introEls || []).forEach(el => el.setVisible && el.setVisible(false));
    this.tweens.killAll();

    // Fondo limpio
    this.add.rectangle(0, 0, w, h, 0x0D0D14).setOrigin(0).setDepth(20);

    const C = this._compacto;
    // Título
    const titulo = this.add.text(w/2, C ? 24 : 55, `¡Bienvenido, ${STATE.nombre}!`, {
      fontFamily:'Cinzel', fontSize: C ? '22px' : '30px', color:'#D4AF37', fontStyle:'700',
      stroke:'#0A0A10', strokeThickness:3
    }).setOrigin(0.5).setDepth(21).setAlpha(0);
    this.tweens.add({targets:titulo, alpha:1, duration:500});

    this.add.text(w/2, C ? 54 : 95, 'Elige tu dificultad', {
      fontFamily:'Poppins', fontSize: C ? '16px' : '20px', color:'#C0C8D0', fontStyle:'italic'
    }).setOrigin(0.5).setDepth(21);

    // 4 botones de dificultad (en el teléfono, 2×2)
    const startY = C ? 80 : 155, bh = C ? 128 : 105, gap = C ? 12 : 10;
    const bw = C ? Math.floor((w - 3*16) / 2) : w - 100;

    keys.forEach((key, i)=>{
      const d = DIFICULTADES[key];
      const col = colores[key];
      const by = C ? startY + Math.floor(i/2)*(bh+gap) : startY + i*(bh+gap);
      const cx = C ? 16 + bw/2 + (i%2)*(bw+16) : w/2;

      const container = this.add.container(cx, by + bh/2).setDepth(22).setAlpha(0);
      this.tweens.add({targets:container, alpha:1, duration:300, delay:100+i*80});

      const bg = this.add.graphics();
      bg.fillStyle(0x0D0D14, 0.92); bg.fillRoundedRect(-bw/2, -bh/2, bw, bh, 8);
      bg.lineStyle(2, col, 0.7); bg.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 8);

      const label = this.add.text(0, C ? -34 : -22, d.label, {
        fontFamily:'Cinzel', fontSize: C ? '20px' : '22px', color: C ? '#'+(col | 0x303030).toString(16).padStart(6,'0') : '#'+col.toString(16).padStart(6,'0'), fontStyle:'700'
      }).setOrigin(0.5);

      const desc = this.add.text(0, C ? 12 : 16, d.desc, {
        fontFamily:'Poppins', fontSize: C ? '15px' : '14px', color:'#C0C8D0', wordWrap:{width:bw-40}, align:'center'
      }).setOrigin(0.5);

      container.add([bg, label, desc]);

      // Hit area
      const hit = this.add.rectangle(cx, by + bh/2, bw, bh, 0, 0).setDepth(23).setInteractive({useHandCursor:true});
      hit.on('pointerover', ()=>{
        bg.clear();
        bg.fillStyle(col, 0.18); bg.fillRoundedRect(-bw/2, -bh/2, bw, bh, 8);
        bg.lineStyle(3, col, 1); bg.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 8);
        this.tweens.add({targets:container, scale:1.02, duration:100});
      });
      hit.on('pointerout', ()=>{
        bg.clear();
        bg.fillStyle(0x0D0D14, 0.92); bg.fillRoundedRect(-bw/2, -bh/2, bw, bh, 8);
        bg.lineStyle(2, col, 0.7); bg.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 8);
        this.tweens.add({targets:container, scale:1, duration:100});
      });
      hit.on('pointerdown', ()=>this.tweens.add({targets:container, scale:0.97, duration:80, yoyo:true}));
      hit.on('pointerup', ()=>{
        STATE.dificultad = key;
        const diff = DIFICULTADES[key];
        STATE.hp     = diff.hpHero;
        STATE.hpMax  = diff.hpHero;
        STATE.ataque = diff.atkBase;
        STATE.defensa= diff.defBase;
        STATE.ataqueBase  = diff.atkBase;
        STATE.defensaBase = diff.defBase;
        STATE.resiliencia = diff.resBonus;
        STATE.oro = ({facil:40, normal:25, heroe:10, legendario:0})[key] || 0;
        showToast(`${diff.label} seleccionado`);
        snd_buff();
        saveGame();
        this.time.delayedCall(700, ()=>this._mostrarSelectorClase());
      });
    });
  }

  _mostrarSelectorClase(){
    const w=this.scale.width, h=this.scale.height;
    // Matar tweens/timers ANTES de destruir: si un tween sigue apuntando a un
    // objeto ya destruido, Phaser revienta al intentar leer su frame (.cut).
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.children.list.slice().forEach(c=>{ try{ c.destroy(); }catch(e){} });

    this.add.rectangle(0, 0, w, h, 0x0D0D14).setOrigin(0).setDepth(30);

    const C = this._compacto;
    this.add.text(w/2, C ? 20 : 36, 'Elige tu clase de héroe', {
      fontFamily:'Cinzel', fontSize: C ? '21px' : '28px', color:'#D4AF37', fontStyle:'700',
      stroke:'#0A0A10', strokeThickness:3
    }).setOrigin(0.5).setDepth(31);

    this.add.text(w/2, C ? 44 : 74, 'Cada clase juega distinto: mirá lo que ganás y lo que pagás', {
      fontFamily:'Poppins', fontSize: C ? '13px' : '14px', color: C ? '#9aa8ba' : '#7a8898', fontStyle:'italic'
    }).setOrigin(0.5).setDepth(31);

    /* Los datos de cada clase (ventajas, costos, números) viven en js/core/clases.js:
       lo que esta pantalla promete es lo que el motor hace. */
    const clases = CLASES_ORDEN.map(k => CLASES[k]);

    // Teléfono: 2×2 (cada tarjeta de ~150 px de alto); escritorio: una columna como siempre.
    const bw = C ? Math.floor((w - 3*12) / 2) : w - 60;
    const startY = C ? 60 : 98, bh = C ? Math.floor((h - 60 - 8 - 8) / 2) : 134, gap = C ? 8 : 4;

    clases.forEach((c, i)=>{
      const col = c.color;
      const hex = '#'+col.toString(16).padStart(6,'0');
      const by = C ? startY + Math.floor(i/2)*(bh+gap) : startY + i*(bh+gap);
      const cx = C ? 12 + bw/2 + (i%2)*(bw+12) : w/2;

      const container = this.add.container(cx, by + bh/2).setDepth(32).setAlpha(0);
      this.tweens.add({targets:container, alpha:1, duration:300, delay:100+i*80});

      const bg = this.add.graphics();
      bg.fillStyle(0x0D0D14, 0.92); bg.fillRoundedRect(-bw/2, -bh/2, bw, bh, 8);
      bg.lineStyle(2, col, 0.7); bg.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 8);

      const L = -bw/2 + (C ? 12 : 22);
      const label = this.add.text(L, -bh/2 + (C ? 6 : 10), `${c.emoji} ${c.nombre}`, {
        fontFamily:'Cinzel', fontSize: C ? '17px' : '20px', color:hex, fontStyle:'700'
      }).setOrigin(0, 0);

            const idea = this.add.text(L, -bh/2 + (C ? 28 : 38), c.idea, {
        fontFamily:'Poppins', fontSize: C ? '13px' : '11.5px', color: C ? '#9aa8ba' : '#8a98aa', fontStyle:'italic', wordWrap:{width:bw-(C ? 24 : 44)}
      }).setOrigin(0, 0);

      // Ventajas en verde con ＋ y costos en rojo con －: la diferencia no depende sólo del color.
      const pY = C ? -bh/2 + 28 + idea.height + 4 : -bh/2 + 58;
      const pros = this.add.text(L, pY, c.ventajas.map(v=>'＋ '+v).join('\n'), {
        fontFamily:'Poppins', fontSize: C ? '13px' : '12.5px', color:'#7fe3a0', lineSpacing:2, wordWrap:{width:bw-(C ? 24 : 44)}
      }).setOrigin(0, 0);
      const contras = this.add.text(L, pY + pros.height + 3, c.costos.map(v=>'－ '+v).join('\n'), {
        fontFamily:'Poppins', fontSize: C ? '13px' : '12.5px', color:'#f29a9a', lineSpacing:2, wordWrap:{width:bw-(C ? 24 : 44)}
      }).setOrigin(0, 0);

      container.add([bg, label, idea, pros, contras]);

      const hit = this.add.rectangle(cx, by + bh/2, bw, bh, 0, 0).setDepth(33).setInteractive({useHandCursor:true});
      hit.on('pointerover', ()=>{
        bg.clear();
        bg.fillStyle(col, 0.18); bg.fillRoundedRect(-bw/2, -bh/2, bw, bh, 8);
        bg.lineStyle(3, col, 1); bg.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 8);
        this.tweens.add({targets:container, scale:1.02, duration:100});
      });
      hit.on('pointerout', ()=>{
        bg.clear();
        bg.fillStyle(0x0D0D14, 0.92); bg.fillRoundedRect(-bw/2, -bh/2, bw, bh, 8);
        bg.lineStyle(2, col, 0.7); bg.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 8);
        this.tweens.add({targets:container, scale:1, duration:100});
      });
      hit.on('pointerdown', ()=>this.tweens.add({targets:container, scale:0.97, duration:80, yoyo:true}));
      hit.on('pointerup', ()=>{
        aplicarClaseInicial(STATE, c.key);   // hornea HP, MP, ataque y defensa base de la clase
        showToast(`${c.emoji} ${c.nombre} elegido — ¡que comience la aventura!`);
        snd_buff();
        saveGame();
        this.time.delayedCall(700, ()=>{
          this.cameras.main.fadeOut(400, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', ()=>this.scene.start('MapScene'));
        });
      });
    });
  }
}

IntroScene.DISENO_MOVIL = true;
