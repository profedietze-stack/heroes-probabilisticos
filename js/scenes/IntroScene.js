class IntroScene extends Phaser.Scene {
  constructor(){ super('IntroScene'); }
  create(){
    const w=this.scale.width, h=this.scale.height;
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
    const title = _track(this.add.text(w/2, 60, '⚔ El Reino de Arithmos ⚔', {fontFamily:'Cinzel', fontSize:'38px', color:'#D4AF37', fontStyle:'700', stroke:'#0A0A10', strokeThickness:3}).setOrigin(0.5));
    title.alpha = 0;
    this.tweens.add({targets:title, alpha:1, duration:1500});

    const storyBox = _track(this.add.graphics());
    storyBox.fillStyle(0x111520, 0.92); storyBox.fillRoundedRect(60, 110, w-120, 280, 12);
    storyBox.lineStyle(2, 0xD4AF37, 0.6); storyBox.strokeRoundedRect(60, 110, w-120, 280, 12);
    // Línea interna highlight
    storyBox.lineStyle(1, 0xD4AF37, 0.15); storyBox.strokeRoundedRect(63, 113, w-126, 274, 10);

    const story = 'En el Reino de Arithmos, el Demiurgo del Determinismo Absoluto ha corrompido el equilibrio de la Probabilidad de Laplace.\n\nTú, héroe elegido por el azar, debes restaurar la armonía enfrentando a 10 Monstruos Matemáticos.\n\n¿Estás preparado(a) para dominar el azar?';
    const storyTxt = _track(this.add.text(w/2, 130, '', {fontFamily:'Poppins', fontSize:'24px', color:'#f5e9c9', wordWrap:{width:w-180}, align:'center', lineSpacing:8}).setOrigin(0.5, 0));
    // Scroll de texto
    let idx = 0;
    this.time.addEvent({delay:30, repeat:story.length-1, callback:()=>{ storyTxt.text = story.substring(0, ++idx); }});

    // Nombre
    _track(this.add.text(w/2, 420, '⟶ ¿Cuál es tu nombre, héroe? ⟵', {fontFamily:'Cinzel', fontSize:'24px', color:'#D4AF37'}).setOrigin(0.5));

    // Campo input HTML superpuesto
    const inputHtml = `<input id="heroName" maxlength="15" placeholder="Tu nombre..." style="background:#0D0D14;color:#D4AF37;border:2px solid rgba(212,175,55,0.5);border-radius:6px;padding:10px 16px;font-size:20px;font-family:Cinzel,serif;text-align:center;outline:none;width:280px;letter-spacing:1px;" onfocus="this.style.borderColor='rgba(212,175,55,0.9)'" onblur="this.style.borderColor='rgba(212,175,55,0.5)'">`;
    const input = this.add.dom(w/2, 470).createFromHTML(inputHtml);
    input.setOrigin(0.5);
    // Al cerrar la escena, destruir el input DOM para que no flote en escenas siguientes
    this.events.once('shutdown', ()=>{
      try{ input.destroy(); }catch(e){}
      try{ document.querySelectorAll('#heroName').forEach(el=>el.remove()); }catch(e){}
    });

    // Botón aceptar — dark-gold style (mismo que MenuScene)
    const bw = 280, bh = 54, bx = w/2, by = 545;
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
    const tut = _track(this.add.text(w/2, h-50, TUTORIALES[0], {fontFamily:'Poppins', fontStyle:'italic', fontSize:'17px', color:'#9eb5c8', wordWrap:{width:w-100}, align:'center'}).setOrigin(0.5));
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

    // Título
    const titulo = this.add.text(w/2, 55, `¡Bienvenido, ${STATE.nombre}!`, {
      fontFamily:'Cinzel', fontSize:'30px', color:'#D4AF37', fontStyle:'700',
      stroke:'#0A0A10', strokeThickness:3
    }).setOrigin(0.5).setDepth(21).setAlpha(0);
    this.tweens.add({targets:titulo, alpha:1, duration:500});

    this.add.text(w/2, 95, 'Elige tu dificultad', {
      fontFamily:'Poppins', fontSize:'20px', color:'#C0C8D0', fontStyle:'italic'
    }).setOrigin(0.5).setDepth(21);

    // 4 botones de dificultad
    const startY = 155, bh = 105, gap = 10;
    const bw = w - 100;

    keys.forEach((key, i)=>{
      const d = DIFICULTADES[key];
      const col = colores[key];
      const by = startY + i*(bh+gap);
      const cx = w/2;

      const container = this.add.container(cx, by + bh/2).setDepth(22).setAlpha(0);
      this.tweens.add({targets:container, alpha:1, duration:300, delay:100+i*80});

      const bg = this.add.graphics();
      bg.fillStyle(0x0D0D14, 0.92); bg.fillRoundedRect(-bw/2, -bh/2, bw, bh, 8);
      bg.lineStyle(2, col, 0.7); bg.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 8);

      const label = this.add.text(0, -22, d.label, {
        fontFamily:'Cinzel', fontSize:'22px', color:'#'+col.toString(16).padStart(6,'0'), fontStyle:'700'
      }).setOrigin(0.5);

      const desc = this.add.text(0, 16, d.desc, {
        fontFamily:'Poppins', fontSize:'14px', color:'#C0C8D0', wordWrap:{width:bw-40}, align:'center'
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

    this.add.text(w/2, 45, 'Elige tu clase de héroe', {
      fontFamily:'Cinzel', fontSize:'30px', color:'#D4AF37', fontStyle:'700',
      stroke:'#0A0A10', strokeThickness:3
    }).setOrigin(0.5).setDepth(31);

    this.add.text(w/2, 82, 'Cada clase enfrenta el azar a su manera', {
      fontFamily:'Poppins', fontSize:'14px', color:'#7a8898', fontStyle:'italic'
    }).setOrigin(0.5).setDepth(31);

    const clases = [
      { key:'guerrero', label:'⚔ Guerrero', col:0xc0392b,
        desc:'Cada golpe es un ensayo de Bernoulli: acierto o fallo, sin términos medios. Confía en la frecuencia, no en la suerte de un solo tiro.' },
      { key:'hechicero', label:'🔮 Hechicero', col:0x8e44ad,
        desc:'La magia arcana es una distribución de probabilidad hecha visible: el mismo hechizo nunca golpea igual dos veces.' },
      { key:'arquero', label:'🏹 Arquero', col:0x27ae60,
        desc:'Cada flecha es una variable aleatoria independiente: ni el ángulo ni el punto de impacto se repiten, pero la probabilidad de acierto es la misma siempre.' },
      { key:'alquimista', label:'⚗ Alquimista', col:0xf39c12,
        desc:'Cada poción es un experimento: mismo procedimiento, resultado distinto. La varianza es el ingrediente secreto.' }
    ];

    const startY = 120, bh = 100, gap = 10;
    const bw = w - 100;

    clases.forEach((c, i)=>{
      const col = c.col;
      const by = startY + i*(bh+gap);
      const cx = w/2;

      const container = this.add.container(cx, by + bh/2).setDepth(32).setAlpha(0);
      this.tweens.add({targets:container, alpha:1, duration:300, delay:100+i*80});

      const bg = this.add.graphics();
      bg.fillStyle(0x0D0D14, 0.92); bg.fillRoundedRect(-bw/2, -bh/2, bw, bh, 8);
      bg.lineStyle(2, col, 0.7); bg.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 8);

      const label = this.add.text(0, -30, c.label, {
        fontFamily:'Cinzel', fontSize:'20px', color:'#'+col.toString(16).padStart(6,'0'), fontStyle:'700'
      }).setOrigin(0.5);

      const desc = this.add.text(0, 8, c.desc, {
        fontFamily:'Poppins', fontSize:'12.5px', color:'#C0C8D0', wordWrap:{width:bw-50}, align:'center', lineSpacing:3
      }).setOrigin(0.5);

      container.add([bg, label, desc]);

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
        STATE.clase = c.key;
        showToast(`${c.label} elegido — ¡que comience la aventura!`);
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
