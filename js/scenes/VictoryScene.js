class VictoryScene extends Phaser.Scene {
  constructor(){ super('VictoryScene'); }
  create(){
    Music.play('menu'); // Victoria intercedia — vuelve al tema del menú
    const w=this.scale.width, h=this.scale.height;
    this.add.rectangle(0,0,w,h,0x0D0D14).setOrigin(0);

    // Rayos de luz
    const rays = this.add.graphics();
    rays.fillStyle(0xD4AF37, 0.07);
    for(let i=0;i<12;i++){
      const a = i*Math.PI/6;
      rays.fillTriangle(w/2, h/2, w/2+Math.cos(a-0.05)*w, h/2+Math.sin(a-0.05)*w, w/2+Math.cos(a+0.05)*w, h/2+Math.sin(a+0.05)*w);
    }
    this.tweens.add({targets:rays, angle:360, duration:10000, repeat:-1});
    rays.setPosition(0,0);

    // Partículas doradas
    for(let i=0;i<40;i++){
      const p = this.add.circle(Math.random()*w, Math.random()*h, Math.random()*3+1, 0xD4AF37, 0.7);
      this.tweens.add({targets:p, y:p.y-100, alpha:0, duration:2000+Math.random()*2000, repeat:-1, onRepeat:()=>{p.y=h+20; p.alpha=0.8;}});
    }

    this.add.text(w/2, 80, '⚔ ¡VICTORIA! ⚔', {fontFamily:'Cinzel', fontSize:'54px', color:'#D4AF37', fontStyle:'800', stroke:'#0A0A10', strokeThickness:5, shadow:{offsetX:0,offsetY:0,color:'#D4AF37',blur:20,fill:true}}).setOrigin(0.5);

    const jefeAnt = MONSTERS[STATE.jefeActual - 1] || MONSTERS[STATE.jefeActual] || {nombre:'el Guardián'};
    this.add.text(w/2, 140, `Has derrotado a ${jefeAnt.nombre}`, {fontFamily:'Cinzel', fontSize:'24px', color:'#fff', fontStyle:'italic'}).setOrigin(0.5);

    // Mostrar inventario
    this.add.text(w/2, 195, '🎁 Recompensas y Estado', {fontFamily:'Cinzel', fontSize:'22px', color:'#D4AF37', letterSpacing:2}).setOrigin(0.5);

    const invY = 240;
    const invBg = this.add.graphics();
    invBg.fillStyle(0x111520, 0.9); invBg.fillRoundedRect(w/2-300, invY, 600, 140, 10);
    invBg.lineStyle(2, 0xD4AF37, 0.55); invBg.strokeRoundedRect(w/2-300, invY, 600, 140, 10);
    this.add.text(w/2, invY+20, '📦 Tu Bolsa', {fontFamily:'Cinzel', fontSize:'17px', color:'#D4AF37', letterSpacing:1}).setOrigin(0.5);

    if(STATE.inventario.length===0){
      this.add.text(w/2, invY+80, 'Bolsa vacía', {fontFamily:'Poppins', fontSize:'17px', color:'#999'}).setOrigin(0.5);
    } else {
      STATE.inventario.forEach((slot,i)=>{
        const it = ITEMS[slot.id-1];
        const cx = w/2 - 240 + i*100;
        const slotBg = this.add.graphics();
        slotBg.fillStyle(0x0A0A10, 1); slotBg.fillRoundedRect(cx-40, invY+45, 80, 70, 8);
        slotBg.lineStyle(2, 0xD4AF37, 0.45); slotBg.strokeRoundedRect(cx-40, invY+45, 80, 70, 8);
        this.add.text(cx, invY+75, it.emoji, {fontSize:'36px'}).setOrigin(0.5);
        this.add.text(cx, invY+105, `x${slot.cantidad}`, {fontSize:'17px', color:'#D4AF37', fontStyle:'700'}).setOrigin(0.5);
      });
    }

    // Stats
    const statsY = 410;
    this.add.text(w/2, statsY, `⚔ Atk: ${STATE.ataque}   🛡 Def: ${STATE.defensa}   ❤ HP: ${STATE.hp}/${STATE.hpMax}   ✨ Resil: +${STATE.resiliencia}   💰 Oro: ${STATE.oro||0}`, {fontFamily:'Poppins', fontSize:'19px', color:'#C0C8D0'}).setOrigin(0.5);

    // Mensaje pedagógico
    this.add.text(w/2, statsY+40, `💡 ${MSG_CONCEPTO[Math.floor(Math.random()*MSG_CONCEPTO.length)]}`, {fontFamily:'Poppins', fontStyle:'italic', fontSize:'17px', color:'#8a9ab0', wordWrap:{width:w-100}, align:'center'}).setOrigin(0.5);

    // Próximo jefe
    const next = MONSTERS[STATE.jefeActual];
    if(next){
      this.add.text(w/2, statsY+100, `⚔ El próximo Guardián: ${next.nombre}`, {fontFamily:'Cinzel', fontSize:'24px', color:'#ff6666'}).setOrigin(0.5);
      this.add.text(w/2, statsY+125, `"${next.frase}"`, {fontFamily:'Poppins', fontStyle:'italic', fontSize:'15px', color:'#bbb', wordWrap:{width:w-100}, align:'center'}).setOrigin(0.5);
    }

    // Botones — fila 1: Continuar centrado; fila 2: Inventario + Menú lado a lado
    this.makeBtn(w/2,      statsY+185, '⚔ Continuar',  0xD4AF37, 0x0A0A10, ()=>{ snd_buff(); this.cameras.main.fadeOut(350,0,0,0); this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('MapScene')); });
    this.makeBtn(w/2-105,  statsY+248, '📦 Inventario', 0x8E44AD, 0xE8D0F0, ()=>{ snd_item(); this.abrirInventario(); });
    this.makeBtn(w/2+105,  statsY+248, '🏠 Menú',       0x2a3848, 0xC0C8D0, ()=>{ snd_item(); saveGame(); this.cameras.main.fadeOut(350,0,0,0); this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('MenuScene')); });
  }

  abrirInventario(){
    window.__useItemVictory = (idx)=>this.usarItemVictory(idx);

    const renderInv = ()=>{
      let html = '<div style="padding:8px;">';
      html += `<h3 style="color:#D4AF37;text-align:center;margin-bottom:12px;font-family:'Cinzel',serif;font-size:14px;letter-spacing:2px;text-transform:uppercase">Bolsa — ${STATE.inventario.length}/6 slots</h3>`;
      if(STATE.inventario.length===0){
        html += '<p style="text-align:center;color:#8a9ab0;padding:20px;font-family:\'Lora\',serif">Tu bolsa está vacía.</p>';
      } else {
        html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">';
        STATE.inventario.forEach((slot,idx)=>{
          const it = ITEMS[slot.id-1];
          html += `<div class="card" style="cursor:pointer;text-align:center;padding:12px;transition:transform .15s" onmouseenter="this.style.transform='scale(1.04)'" onmouseleave="this.style.transform=''" onclick="window.__useItemVictory(${idx})">
            <div style="font-size:36px;filter:drop-shadow(0 0 8px rgba(212,175,55,0.5))">${it.emoji}</div>
            <div style="color:#D4AF37;font-family:'Cinzel',serif;font-size:13px;letter-spacing:1px;margin-top:6px">${it.nombre}</div>
            <div style="color:#5fcf88;font-size:12px;margin-top:4px;font-family:'Lora',serif">${it.efecto}</div>
            ${slot.cantidad>1?`<div style="color:#E05548;font-weight:700;margin-top:4px;font-family:'Cinzel',serif">x${slot.cantidad}</div>`:''}
          </div>`;
        });
        html += '</div>';
      }
      html += '<div class="btn-row" style="margin-top:16px"><button class="btn-action btn-secondary" onclick="closeItemModal()">&#9665; Cerrar</button></div>';
      html += '</div>';
      openItemModal(html);
    };
    window.__renderInvVictory = renderInv;
    renderInv();
  }

  usarItemVictory(idx){
    const slot = STATE.inventario[idx];
    if(!slot) return;
    const it = ITEMS[slot.id-1];
    snd_item();

    let efectoMsg = '';
    switch(it.tipo){
      case 'heal':
        const curado = Math.min(it.valor, STATE.hpMax - STATE.hp);
        STATE.hp = Math.min(STATE.hpMax, STATE.hp + it.valor);
        efectoMsg = `+${curado} HP restaurados. HP: ${STATE.hp}/${STATE.hpMax}`;
        break;
      case 'buff_atk':
        STATE.ataque += it.valor;
        STATE.buffs.push({tipo:'buff_atk', valor:it.valor, turnosRestantes:it.turnos, emoji:it.emoji});
        efectoMsg = `+${it.valor} Ataque durante ${it.turnos} turnos.`;
        snd_buff(); break;
      case 'buff_def':
        STATE.defensa += it.valor;
        STATE.buffs.push({tipo:'buff_def', valor:it.valor, turnosRestantes:it.turnos, emoji:it.emoji});
        efectoMsg = `+${it.valor} Defensa durante ${it.turnos} turnos.`;
        snd_buff(); break;
      case 'buff_roll':
        STATE.buffs.push({tipo:'buff_roll', valor:it.valor, turnosRestantes:1, emoji:it.emoji});
        efectoMsg = `+${it.valor} a la próxima tirada.`;
        snd_buff(); break;
      case 'crown':
        STATE.flagCrown = true;
        STATE.buffs.push({tipo:'crown', valor:2, turnosRestantes:1, emoji:it.emoji});
        efectoMsg = 'Daño duplicado si tirada >= 13.';
        snd_buff(); break;
      case 'info':
        let info = '<h4 style="color:#D4AF37;font-family:\'Cinzel\',serif">Distribucion Teorica 2d12</h4><table class="stats-table"><thead><tr><th>Suma</th><th>Comb.</th><th>Prob.</th></tr></thead><tbody>';
        for(let k=2;k<=24;k++){
          const c=combosExact(k);
          info+=`<tr><td>${k}</td><td>${c}</td><td>${(c/CFG.DICE_COMBOS*100).toFixed(2)}%</td></tr>`;
        }
        info+='</tbody></table><div class="btn-row"><button class="btn-action btn-secondary" onclick="window.__renderInvVictory && window.__renderInvVictory()">&#9665; Volver</button></div>';
        openItemModal(info);
        return; // no consume
      case 'perm_atk':
        STATE.ataqueBase += it.valor; STATE.ataque += it.valor;
        efectoMsg = `+${it.valor} Ataque PERMANENTE.`;
        snd_buff(); break;
      case 'perm_def':
        STATE.defensaBase += it.valor; STATE.defensa += it.valor;
        efectoMsg = `+${it.valor} Defensa PERMANENTE.`;
        snd_buff(); break;
      case 'gem':
        STATE.flagGem = true;
        STATE.buffs.push({tipo:'gem', valor:1.5, turnosRestantes:1, emoji:it.emoji});
        efectoMsg = 'Critico x1.5 si tirada entre 11-15.';
        snd_buff(); break;
      case 'regen':
        STATE.buffs.push({tipo:'regen', valor:it.valor, turnosRestantes:it.turnos, emoji:it.emoji});
        efectoMsg = `+${it.valor} HP/turno durante ${it.turnos} turnos.`;
        snd_buff(); break;
      case 'star':
        STATE.flagStar = true;
        STATE.buffs.push({tipo:'star', valor:2, turnosRestantes:1, emoji:it.emoji});
        efectoMsg = 'Umbral reducido en 2 para la proxima tirada.';
        snd_buff(); break;
      case 'sword':
        STATE.ataque += it.valor;
        STATE.buffs.push({tipo:'sword', valor:it.valor, turnosRestantes:it.turnos, emoji:it.emoji});
        efectoMsg = `+${it.valor} Ataque durante ${it.turnos} turnos.`;
        snd_buff(); break;
      case 'cheb':
        STATE.reduccionDaño = it.valor;
        STATE.buffs.push({tipo:'cheb', valor:it.valor, turnosRestantes:it.turnos, emoji:it.emoji});
        efectoMsg = `Reduce daño enemigo 30% durante ${it.turnos} turnos.`;
        snd_buff(); break;
      case 'key':
        STATE.flagKey = true;
        STATE.buffs.push({tipo:'key', valor:it.valor, turnosRestantes:1, emoji:it.emoji});
        efectoMsg = 'Proximo ataque con bonificacion magica.';
        snd_buff(); break;
      default:
        efectoMsg = 'Efecto aplicado.';
    }

    // Consumir
    slot.cantidad--;
    if(slot.cantidad<=0) STATE.inventario.splice(idx,1);
    STATE.stats.objetosUsados[it.id] = (STATE.stats.objetosUsados[it.id]||0)+1;
    saveGame();

    // Mostrar confirmacion y re-render inventario
    showToast(`${it.emoji} ${it.nombre}: ${efectoMsg}`);
    setTimeout(()=>{ window.__renderInvVictory && window.__renderInvVictory(); }, 800);
  }
  makeBtn(x,y,label,color,txtColor,action){
    const bw = 180, bh = 52;
    const container = this.add.container(x, y);
    const r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff;
    const darkCol = Phaser.Display.Color.GetColor(Math.max(0,r-80), Math.max(0,g-80), Math.max(0,b-80));
    const lightCol = Phaser.Display.Color.GetColor(Math.min(255,r+40), Math.min(255,g+40), Math.min(255,b+40));
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(-bw/2+2, -bh/2+5, bw, bh, 10);
    const base = this.add.graphics();
    base.fillStyle(darkCol, 1);
    base.fillRoundedRect(-bw/2, -bh/2+4, bw, bh, 10);
    const fg = this.add.graphics();
    fg.fillGradientStyle(lightCol, lightCol, color, color, 1);
    fg.fillRoundedRect(-bw/2, -bh/2, bw, bh, 10);
    const shine = this.add.graphics();
    shine.fillStyle(0xffffff, 0.3);
    shine.fillRoundedRect(-bw/2+3, -bh/2+2, bw-6, bh/2-3, 7);
    const border = this.add.graphics();
    border.lineStyle(2, 0xfff5d0, 0.9);
    border.strokeRoundedRect(-bw/2, -bh/2, bw, bh, 10);
    const t = this.add.text(0, 0, label, {
      fontFamily:'Poppins', fontSize:'19px',
      color:`#${txtColor.toString(16).padStart(6,'0')}`,
      fontStyle:'800', stroke:'#000', strokeThickness:txtColor === 0xffffff ? 1 : 0
    }).setOrigin(0.5);
    container.add([shadow, base, fg, shine, border, t]);
    const glow = this.add.graphics();
    glow.fillStyle(color, 0.5);
    glow.fillRoundedRect(x-bw/2-7, y-bh/2-7, bw+14, bh+14, 14);
    glow.setVisible(false);
    const hit = this.add.rectangle(x, y, bw, bh, 0, 0).setInteractive({useHandCursor:true});
    hit.on('pointerover', ()=>{
      this.tweens.add({targets:container, scale:1.06, duration:150, ease:'Back.easeOut'});
      glow.setVisible(true);
      this.tweens.add({targets:glow, alpha:{from:0, to:0.7}, duration:180});
      snd_item();
    });
    hit.on('pointerout', ()=>{
      this.tweens.add({targets:container, scale:1, duration:150});
      this.tweens.add({targets:glow, alpha:0, duration:150, onComplete:()=>glow.setVisible(false)});
    });
    hit.on('pointerdown', ()=>{ this.tweens.add({targets:container, scale:0.94, duration:70, yoyo:true}); });
    hit.on('pointerup', action);
  }
}
