/* ══════════════════════════════════════════════════════════════
   ArcadeHubScene.js — Hub del Modo Minijuegos
   Dos modos: Arcade (7 rondas) | Libre (elige minijuego)
══════════════════════════════════════════════════════════════ */

/* Color numérico → «#rrggbb» mezclado con blanco (f = 0…1): para texto legible sobre fondos oscuros. */
function _aclarar(num, f){
  const c = [16, 8, 0].map(s => { const v = (num >> s) & 255; return Math.round(v + (255 - v) * f); });
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

class ArcadeHubScene extends Phaser.Scene {
  constructor(){ super('ArcadeHubScene'); }

  preload(){
    if (typeof bgLoad === 'function') bgLoad(this, 'hub');
  }

  create(){
    Music.play('menu');
    if(typeof Ambience !== 'undefined') Ambience.play('fire');
    this.events.once('shutdown', ()=>{ if(typeof Ambience !== 'undefined') Ambience.stop(); });
    this.cameras.main.fadeIn(350, 0, 0, 0);
    const w = this.scale.width, h = this.scale.height;
    // Teléfono apaisado (lienzo = pantalla real): tarjetas lado a lado, letras de 12-17 px y botones de 44 px.
    const C = this._compacto = h < 500;

    /* Fondo */
    const bgBase = this.add.graphics().setDepth(-12);
    bgBase.fillGradientStyle(0x080C18, 0x080C18, 0x040810, 0x040810, 1);
    bgBase.fillRect(0, 0, w, h);
    const _hayBg = (typeof bgMount === 'function') && bgMount(this, 'hub', { depth:-11, fxDepth:-8 });
    if (_hayBg) {
      const bgDark = this.add.graphics().setDepth(-9);
      bgDark.fillStyle(0x07070E, 0.38);
      bgDark.fillRect(0, 0, w, h);
    } else {
      for (let i = 0; i < 40; i++) {
        const s = this.add.circle(Math.random()*w, Math.random()*h,
          Math.random()*1.1+0.2, Math.random()>0.6 ? 0xD4AF37 : 0xB0B8C0,
          Math.random()*0.2+0.04);
        this.tweens.add({targets:s, alpha:{from:0.04, to:s.alpha},
          duration:1800+Math.random()*2500, yoyo:true, repeat:-1, delay:Math.random()*2000});
      }
    }

    /* Título */
    this.add.text(w/2, C ? 24 : 60, 'MODO MINIJUEGOS', {
      fontFamily:'Cinzel', fontSize: C ? '24px' : '34px', fontStyle:'700',
      color:'#D4AF37', stroke:'#050408', strokeThickness:3,
      shadow:{offsetX:0, offsetY:0, color:'#D4AF37', blur: C ? 12 : 20, fill:true}
    }).setOrigin(0.5);
    if (!C) this.add.text(w/2, 105, 'Practicá probabilidad sin restricciones', {
      fontFamily:'Poppins', fontSize:'13px', color:'#3a4a58', letterSpacing:2
    }).setOrigin(0.5);

    /* Separador */
    if (!C) {
      const sep = this.add.graphics();
      sep.lineStyle(1, 0xD4AF37, 0.15);
      sep.lineBetween(w/2-220, 125, w/2+220, 125);
    }

    /* Tarjetas: en el teléfono, dos de (w-48)/2 de ancho entre el título y el botón "Volver" */
    const CBW = C ? Math.floor((w - 48) / 2) : 380, CBH = C ? h - 50 - 62 : 324, CCY = C ? 50 + CBH/2 : h/2 + 30;
    const CDX = C ? CBW/2 + 8 : 220;

    /* Tarjeta Arcade */
    this._buildCard(
      w/2 - CDX, CCY, CBW, CBH,
      '🏆  MODO ARCADE',
      'arcade',
      '7 rondas · 1 minijuego por ronda\nPuntaje final con ranking',
      0x1a2010, 0xD4AF37,
      () => this._fadeGo('ArcadeScene', { mode:'select' }),
      'mercader'
    );

    /* Tarjeta Libre */
    this._buildCard(
      w/2 + CDX, CCY, CBW, CBH,
      '🎯  MODO LIBRE',
      'libre',
      'Elige el minijuego y dificultad\nSin presión, con estadísticas',
      0x101828, 0x4080d0,
      () => this._fadeGo('LibreScene'),
      'oraculo'
    );

    /* Cleanup DOM NPCs al salir de la escena */
    this.events.once('shutdown', () => {
      if (this._hubNPCDoms) this._hubNPCDoms.forEach(d => { try { d.destroy(); } catch(e){} });
      if (this._hubTimers)  this._hubTimers.forEach(t  => { try { t.remove(false); } catch(e){} });
    });

    /* Botón volver (en el teléfono: 44 px de alto y letra de 14 px) */
    const _hbg = this.add.graphics();
    const HBW = C ? 200 : 168, HBH = C ? 44 : 32, HBY = C ? h - 54 : h - 56;
    const _drawHB = (hov) => {
      _hbg.clear();
      _hbg.fillStyle(0x0a1828, hov ? 0.92 : 0.75);
      _hbg.fillRoundedRect(w/2 - HBW/2, HBY, HBW, HBH, 6);
      _hbg.lineStyle(1.5, hov ? 0x6090c8 : 0x2a5070, hov ? 0.9 : 0.6);
      _hbg.strokeRoundedRect(w/2 - HBW/2, HBY, HBW, HBH, 6);
    };
    _drawHB(false);
    const back = this.add.text(w/2, HBY + HBH/2, '← Volver al Menú', {
      fontFamily:'Poppins', fontSize: C ? '14px' : '12px', color: C ? '#9cc4e0' : '#7aabcc', fontStyle:'600',
      padding: C ? {x:30, y:14} : {x:0, y:0}
    }).setOrigin(0.5).setInteractive({useHandCursor:true});
    back.on('pointerover', () => { _drawHB(true); back.setColor('#aaddf8'); });
    back.on('pointerout',  () => { _drawHB(false); back.setColor('#7aabcc'); });
    back.on('pointerup',   () => this._fadeGo('MenuScene'));
  }

  _buildCard(cx, cy, bw, bh, title, mode, desc, fillColor, accentColor, action, npcKey){
    const C = this._compacto;
    const NPC_OFFSET = (npcKey && !C) ? 64 : 0;
    const bx = cx - bw/2, by = cy - bh/2;
    const bg = this.add.graphics();

    const draw = (hov) => {
      bg.clear();
      bg.fillStyle(fillColor, hov ? 0.95 : 0.8);
      bg.fillRoundedRect(bx, by, bw, bh, 12);
      bg.lineStyle(2, accentColor, hov ? 0.9 : 0.4);
      bg.strokeRoundedRect(bx, by, bw, bh, 12);
      if (hov) {
        bg.lineStyle(1, accentColor, 0.15);
        bg.strokeRoundedRect(bx+4, by+4, bw-8, bh-8, 9);
      }
    };
    draw(false);

    /* NPC dentro de la tarjeta */
    if (npcKey && typeof createNPCElement === 'function') {
      const npcEl = createNPCElement(npcKey, C ? 84 : 80, C ? 84 : 80);
      if (npcEl) {
        setNPCState(npcEl, 'idle');
        const domObj = this.add.dom(C ? bx + 56 : cx, C ? by + 62 : by + 40, npcEl).setDepth(2);
        if (!this._hubNPCDoms) this._hubNPCDoms = [];
        this._hubNPCDoms.push(domObj);

        /* Frase rotativa bajo el NPC */
        const frases = (NPC_DATA[npcKey] && NPC_DATA[npcKey].dialogos.intro) || [];
        const accentHex2 = npcKey === 'oraculo' ? '#70c8e0' : '#D4AF37';
        let idx = 0;
        const dlgTxt = this.add.text(cx, by + 86, (frases.length && !C) ? `"${frases[0]}"` : '', {
          fontFamily:'Poppins', fontSize:'9.5px', color: accentHex2, fontStyle:'italic',
          align:'center', wordWrap:{ width: bw - 40 }, lineSpacing:2
        }).setOrigin(0.5).setDepth(2);

        if (frases.length > 1 && !C) {
          if (!this._hubTimers) this._hubTimers = [];
          const t = this.time.addEvent({ delay: 3800, loop: true, callback: () => {
            idx = (idx + 1) % frases.length;
            this.tweens.add({ targets: dlgTxt, alpha: 0, duration: 280, onComplete: () => {
              dlgTxt.setText(`"${frases[idx]}"`);
              this.tweens.add({ targets: dlgTxt, alpha: 1, duration: 280 });
            }});
          }});
          this._hubTimers.push(t);
        }
      }
    }

    /* Título tarjeta */
    const accentHex = '#' + accentColor.toString(16).padStart(6,'0');
    // Teléfono: el NPC va a la izquierda y el título y la descripción, a su derecha (alineados a la izquierda).
    this.add.text(C ? bx + 108 : cx, C ? by + 24 : by + 46 + NPC_OFFSET, title, {
      fontFamily:'Cinzel', fontSize: C ? '17px' : '20px', fontStyle:'700',
      color: accentHex, stroke:'#050408', strokeThickness:2
    }).setOrigin(C ? 0 : 0.5, 0.5);

    /* Separador interno */
    const g2 = this.add.graphics();
    g2.lineStyle(1, accentColor, 0.2);
    g2.lineBetween(bx+24, C ? by+112 : by+70+NPC_OFFSET, bx+bw-24, C ? by+112 : by+70+NPC_OFFSET);

    /* Descripción */
    this.add.text(C ? bx + 108 : cx, C ? by + 46 : by + 110 + NPC_OFFSET, desc, {
      fontFamily:'Poppins', fontSize: C ? '14px' : '13px', color: C ? '#9ab2c8' : '#6a8098',
      align: C ? 'left' : 'center', lineSpacing: C ? 4 : 6, wordWrap: C ? { width: bw - 124 } : undefined
    }).setOrigin(C ? 0 : 0.5, C ? 0 : 0.5);

    /* Stats arcade */
    if (mode === 'arcade') {
      const difs = ['facil','normal','heroe','legendario'];
      // Teléfono: tonos más claros (el violeta y el rojo oscuros se perdían sobre el fondo de piedra).
      const dColors = C ? { facil:'#5fd47e', normal:'#6aa6f0', heroe:'#ee8466', legendario:'#cf94e8' }
                        : { facil:'#40c060', normal:'#4080d0', heroe:'#c05030', legendario:'#9030a0' };
      difs.forEach((dif, i) => {
        const st = arcadeGetBest(dif);
        const sx = C ? bx + 24 + i * Math.floor((bw - 48) / 4) : bx + 30 + i * 82;
        const sy = C ? by + 122 : by + 158 + NPC_OFFSET;
        this.add.text(sx, sy, dif.slice(0,3).toUpperCase(), {
          fontFamily:'Poppins', fontSize: C ? '12px' : '9px', color: dColors[dif], letterSpacing:1
        });
        this.add.text(sx, sy + (C ? 16 : 14), st ? `${st.best}/7` : '—', {
          fontFamily:'Cinzel', fontSize: C ? '16px' : '13px', color: st && st.best >= 6 ? '#D4AF37' : (C ? '#8aa4c0' : '#5a7090')
        });
        this.add.text(sx, sy + (C ? 38 : 30), st ? `×${st.played}` : '', {
          fontFamily:'Poppins', fontSize: C ? '12px' : '9px', color: C ? '#7890a8' : '#2a3848'
        });
      });
      this.add.text(cx, C ? by + 190 : by + 197 + NPC_OFFSET, 'Mejor puntuación por dificultad', {
        fontFamily:'Poppins', fontSize: C ? '12px' : '10px', color: C ? '#7890a8' : '#2a3848'
      }).setOrigin(0.5);
    }

    /* Stats libre */
    if (mode === 'libre') {
      const total = ARCADE_PUZZLES.reduce((acc, p) => {
        const st = arcadeGetLibre(p.key, 'normal');
        return { played: acc.played + st.played, correct: acc.correct + st.correct };
      }, { played:0, correct:0 });
      const pct = total.played > 0 ? Math.round(total.correct / total.played * 100) : null;
      this.add.text(cx, C ? by + 132 : by + 165 + NPC_OFFSET, total.played > 0 ? `${total.played} partidas jugadas` : 'Sin partidas aún', {
        fontFamily:'Poppins', fontSize: C ? '14px' : '12px', color: C ? '#8aa4c0' : '#3a5070'
      }).setOrigin(0.5);
      this.add.text(cx, C ? by + 156 : by + 187 + NPC_OFFSET, pct !== null ? `${pct}% de aciertos (normal)` : '', {
        fontFamily:'Poppins', fontSize: C ? '14px' : '11px', color: pct >= 70 ? '#40c060' : (C ? '#8a94a4' : '#5a6070')
      }).setOrigin(0.5);
      this.add.text(cx, C ? by + 190 : by + 197 + NPC_OFFSET, '7 minijuegos disponibles', {
        fontFamily:'Poppins', fontSize: C ? '12px' : '10px', color: C ? '#7890a8' : '#2a3848'
      }).setOrigin(0.5);
    }

    /* Botón acción */
    const BTH = C ? 46 : 36;
    const btnY = C ? by + bh - 32 : by + bh - 32;
    const btnW = bw - 48;
    const btnBg = this.add.graphics();
    const drawBtn = (hov) => {
      btnBg.clear();
      btnBg.fillStyle(accentColor, hov ? 0.25 : 0.12);
      btnBg.fillRoundedRect(bx+24, btnY - BTH/2, btnW, BTH, 6);
      btnBg.lineStyle(1, accentColor, hov ? 0.8 : 0.3);
      btnBg.strokeRoundedRect(bx+24, btnY - BTH/2, btnW, BTH, 6);
    };
    drawBtn(false);
    const btnTxt = this.add.text(cx, btnY, mode === 'arcade' ? 'Jugar Arcade →' : 'Elegir Minijuego →', {
      fontFamily:'Cinzel', fontSize: C ? '15px' : '13px', color: C ? _aclarar(accentColor, 0.4) : accentHex, fontStyle:'600'
    }).setOrigin(0.5).setDepth(2);

    const hit = this.add.rectangle(cx, cy, bw, bh, 0, 0)
      .setInteractive({useHandCursor:true}).setDepth(3);
    hit.on('pointerover', () => { draw(true); drawBtn(true); snd_item&&snd_item(); });
    hit.on('pointerout',  () => { draw(false); drawBtn(false); });
    hit.on('pointerup',   () => { snd_buff&&snd_buff(); action(); });
  }

  _fadeGo(scene, data={}){
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene, data));
  }
}

ArcadeHubScene.DISENO_MOVIL = true;
