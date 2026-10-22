/* ══════════════════════════════════════
   MapScene — El Calabozo de Arithmos (29 nodos)
   10 nodos jefe  +  18 nodos enigma  +  1 jefe final
══════════════════════════════════════ */

/* ── Node definitions ── */
const NODE_DEFS = [
  {t:'P', npc:'mercader', pids:[0,1]},
  {t:'P', npc:'oraculo',  pids:[4,5]},
  {t:'B'},
  {t:'P', npc:'mercader', pids:[0,2]},
  {t:'P', npc:'oraculo',  pids:[5,6]},
  {t:'B'},
  {t:'P', npc:'mercader', pids:[1,3]},
  {t:'P', npc:'oraculo',  pids:[4,6]},
  {t:'B'},
  {t:'P', npc:'mercader', pids:[0,3]},
  {t:'P', npc:'oraculo',  pids:[4,5,6]},
  {t:'B'},
  {t:'P', npc:'mercader', pids:[1,2]},
  {t:'P', npc:'oraculo',  pids:[5,6]},
  {t:'B'},
  {t:'P', npc:'mercader', pids:[0,1,2]},
  {t:'P', npc:'oraculo',  pids:[4,5]},
  {t:'B'},
  {t:'P', npc:'mercader', pids:[2,3]},
  {t:'P', npc:'oraculo',  pids:[4,6]},
  {t:'P', npc:'mercader', pids:[0,1,3]},
  {t:'B'},
  {t:'P', npc:'oraculo',  pids:[4,5,6]},
  {t:'P', npc:'mercader', pids:[1,2,3]},
  {t:'B'},
  {t:'P', npc:'oraculo',  pids:[4,5]},
  {t:'B'},
  {t:'P', npc:'mercader', pids:[0,2,3]},
  {t:'B'},
];

const _NX = [70, 217, 364, 511, 658, 805, 952];
const _NY = [155, 275, 395, 515];
const _NF = {x:511, y:625};

function _nodePos(idx){
  if(idx===28) return {..._NF};
  const row = Math.floor(idx/7);
  const col  = idx%7;
  const actualCol = row%2===0 ? col : 6-col;
  return {x:_NX[actualCol], y:_NY[row]};
}

const _COL_BOSS  = 0xcc2020;
const _COL_MERCA = 0xc87818;
const _COL_ORAC  = 0x2870a0;
const _COL_FINAL = 0x9b1010;

const _DW = 58;
const _DH = 70;

class MapScene extends Phaser.Scene {
  constructor(){ super('MapScene'); }

  /* Medidas del mapa. El mundo siempre mide 1024×700; lo que cambia es la ventana (cámara) y el HUD.
     Teléfono apaisado (alto < 500, lienzo = pantalla real): HUD de una fila con botones de 44 px,
     letras de 14 px y zoom propio. Escritorio/tablet: las de siempre. */
  _layout(w, h){
    if(h >= 500){
      return { compacto:false, hudH:100, zoomMin:1.0, zoomNode:1.8, dragMin:1.05, bounds:[-20, 40, w+40, h-20], panDy:40 };
    }
    return { compacto:true, hudH:54, zoomMin:0.5, zoomNode:1.35, dragMin:0.55, bounds:[-30, -30, 1084, 760], panDy:0 };
  }

  create(){
    const w = this.scale.width, h = this.scale.height;
    const L = this.L = this._layout(w, h);
    const WW = 1024, WH = 700;   // medidas del mundo (el fondo y las antorchas se dibujan sobre él)
    if(typeof Music !== 'undefined') Music.play('mapa');
    if(typeof Ambience !== 'undefined') Ambience.play('drip');
    this.events.once('shutdown', ()=>{ if(typeof Ambience !== 'undefined') Ambience.stop(); });
    // Defensa: eliminar cualquier input DOM huérfano de IntroScene que haya
    // sobrevivido (flotaría sobre el mapa). El canvas de Phaser no lo limpia.
    try{ document.querySelectorAll('#heroName').forEach(el=>el.remove()); }catch(e){}
    // Arrancar en vista general (todo el mapa) y luego zoom al nodo actual
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setZoom(L.zoomMin);
    this.cameras.main.fadeIn(600, 0, 0, 0);
    this._cur = Math.min(STATE.nodeActual||0, 28);

    // Bounds: min scrollY=40 → nodos top (y=155) quedan en screen y=115 (bajo HUD 100px)
    this.cameras.main.setBounds(L.bounds[0], L.bounds[1], L.bounds[2], L.bounds[3]);
    if(L.compacto) this.cameras.main.centerOn(WW/2, WH/2);   // vista general del mundo entero
    this._setupZoom();

    /* ── World space ── */
    this._drawBrickBg(WW, WH);
    this._drawCorridors();
    this._drawTorches(WW, WH);
    this._drawAtmosphere(w, h);
    this._drawNodes();
    this._drawZoneLabels();
    this._drawCobwebs(WW, WH);   // DESPUÉS de atmósfera → queda encima de la vigneta

    /* ── HUD bar (fijo a camara) ── */
    const hdr = this.add.graphics().setScrollFactor(0).setDepth(15);
    hdr.fillStyle(0x080604, 0.93);
    hdr.fillRect(0, 0, w, L.hudH);
    hdr.lineStyle(1, 0x6a4020, 0.55);
    hdr.lineBetween(0, L.hudH, w, L.hudH);

    if(!L.compacto){
      this.add.text(w/2, 28, '⚔  El Calabozo de Arithmos  ⚔', {
        fontFamily:'Cinzel', fontSize:'22px', color:'#D4AF37', fontStyle:'700',
        stroke:'#0A0A10', strokeThickness:3,
        shadow:{offsetX:0,offsetY:0,color:'#D4AF37',blur:18,fill:true}
      }).setOrigin(0.5).setScrollFactor(0).setDepth(16);

      this.add.text(w/2, 60,
        `Héroe: ${STATE.nombre}   •   Cámara ${Math.min(this._cur+1,29)} de 29`, {
        fontFamily:'Cinzel', fontSize:'11px', color:'#4a5060'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(16);
    }

    /* HP / Oro / XP */
    // Teléfono: a la derecha del botón de sonido (que flota en la esquina) y en dos renglones de 14 px.
    const hx = L.compacto ? 80 : 16, hy = L.compacto ? 7 : 16, fz = L.compacto ? '14px' : '13px';
    this._hpTxt = this.add.text(hx, hy,
      `❤ ${Math.max(0,STATE.hp)}/${STATE.hpMax}`, {
      fontFamily:'Cinzel', fontSize:fz, color:'#D4AF37', fontStyle:'700',
      stroke:'#0A0A10', strokeThickness:3
    }).setOrigin(0,0).setDepth(20).setScrollFactor(0);

    const coinX = L.compacto ? hx + 128 : 190;
    const coinGr = this.add.graphics().setDepth(20).setScrollFactor(0);
    drawCoinIcon(coinGr, coinX, hy + 8, 7);
    this._oroTxt = this.add.text(coinX+12, hy, `${STATE.oro||0}`, {
      fontFamily:'Cinzel', fontSize:fz, color:'#D4AF37', fontStyle:'700',
      stroke:'#0A0A10', strokeThickness:3
    }).setOrigin(0,0).setDepth(20).setScrollFactor(0);

    this.add.text(hx, L.compacto ? 30 : 44, `✨ XP: ${STATE.xp||0}`, {
      fontFamily:'Cinzel', fontSize:fz, color:'#9fc2ff', fontStyle:'700',
      stroke:'#0A0A10', strokeThickness:3
    }).setOrigin(0,0).setDepth(20).setScrollFactor(0);
    // Pantalla angosta: "Cám. 1/29" para no quedar debajo del botón Bolsa.
    if(L.compacto) this.add.text(coinX - 7, 30, w < 760 ? `Cám. ${Math.min(this._cur+1,29)}/29` : `Cámara ${Math.min(this._cur+1,29)} de 29`, {
      fontFamily:'Cinzel', fontSize:'14px', color:'#9aa6b4'
    }).setOrigin(0,0).setDepth(20).setScrollFactor(0);

    if(L.compacto){
      // Una fila de botones de 44 px, de derecha a izquierda; se deja libre el botón de pantalla completa.
      const corto = w < 760;
      let rx = w - 56;
      [['⮐ Salir', ()=>this._confirmSalir()],
       ['📖 Grimorio', ()=>openGrimorio()],
       [corto ? '📦 Bolsa' : '📦 Inventario', ()=>this._abrirInventario()]].forEach(([lbl, fn])=>{
        const b = this._mkTopBtn(rx, 5, lbl, fn, true);
        rx -= b.displayWidth + 8;
      });
    } else {
      this._mkTopBtn(w-16, 10, '📦 Inventario', ()=>this._abrirInventario());
      this._mkTopBtn(w-16, 38, '📖 Grimorio',   ()=>openGrimorio());
      this._mkTopBtn(w-16, 66, '⮐ Salir',       ()=>this._confirmSalir());
    }

    if(!L.compacto) this._buildDossier(w, h);   // en el teléfono el dossier es un modal con scroll

    // Cámara secundaria para HUD: zoom fijo en 1, nunca scrollea
    // La cámara principal solo renderiza world objects (scrollFactor=1)
    // La HUD cam solo renderiza los elementos con scrollFactor=0
    this._hudCam = this.cameras.add(0, 0, w, h).setName('hud').setZoom(1).setScroll(0, 0);
    const allObjs = this.children.list.slice();
    const hudObjs   = allObjs.filter(o => (o.scrollFactorX === 0 || o.scrollFactorY === 0));
    const worldObjs = allObjs.filter(o => (o.scrollFactorX !== 0 && o.scrollFactorY !== 0));
    this.cameras.main.ignore(hudObjs);
    this._hudCam.ignore(worldObjs);

    // Vista general → zoom automático al nodo actual
    this.time.delayedCall(1500, () => this._zoomToNode(this._cur));

    // Evento aleatorio al llegar a un nodo nuevo (tras el zoom)
    this.time.delayedCall(2700, () => {
      if (typeof maybeMapEvent === 'function') maybeMapEvent();
    });
  }

  /* ── Zoom automático al nodo idx ── */
  _zoomToNode(idx){
    const cam = this.cameras.main;
    const pos = _nodePos(idx);
    // Compensar el HUD: el nodo queda en el centro del área libre debajo de él
    const L = this.L;
    const dy = L.compacto ? -(L.hudH/2) / L.zoomNode : L.panDy;
    cam.pan(pos.x, pos.y + dy, 1000, 'Sine.easeInOut');
    cam.zoomTo(L.zoomNode, 1000, 'Sine.easeInOut');
  }

  /* ── Zoom + pan manual ── */
  _setupZoom(){
    const cam = this.cameras.main;
    this.input.on('wheel', (_p, _go, _dx, deltaY) => {
      cam.setZoom(Phaser.Math.Clamp(cam.zoom - deltaY*0.0008, this.L.zoomMin, 2.2));
    });
    this.input.addPointer(1);
    let _pd = 0;
    this.input.on('pointermove', (ptr) => {
      const p2 = this.input.pointer2;
      if(p2 && p2.isDown && ptr.isDown){
        const d = Phaser.Math.Distance.Between(ptr.x,ptr.y,p2.x,p2.y);
        if(_pd>0) cam.setZoom(Phaser.Math.Clamp(cam.zoom+(d-_pd)*0.005, this.L.zoomMin, 2.2));
        _pd = d;
        return;
      }
      _pd = 0;
      if(ptr.isDown && cam.zoom > this.L.dragMin){
        cam.scrollX -= (ptr.x - ptr.prevPosition.x) / cam.zoom;
        cam.scrollY -= (ptr.y - ptr.prevPosition.y) / cam.zoom;
      }
    });
  }

  /* ── Fondo de ladrillo de piedra ── */
  _drawBrickBg(w, h){
    const g = this.add.graphics();
    g.fillStyle(0x060404, 1);
    g.fillRect(-300, -200, w+600, h+400);

    const bW=52, bH=22;
    const cols=[0x181310, 0x1b1612, 0x140f0c, 0x191410, 0x110d0a, 0x150f0d];
    const rMax = Math.ceil((h+400)/bH)+2;
    const cMax = Math.ceil((w+600)/bW)+3;
    for(let row=0; row<rMax; row++){
      const off = row%2===0 ? 0 : bW/2;
      for(let col=-1; col<cMax; col++){
        const bx = col*bW + off - 300;
        const by = row*bH - 200;
        const ci = ((row*7 + col*3 + 13) % cols.length + cols.length) % cols.length;
        g.fillStyle(cols[ci], 1);
        g.fillRect(bx+1, by+1, bW-2, bH-2);
      }
    }

    /* Manchas de humedad/musgo */
    const mg = this.add.graphics();
    mg.fillStyle(0x182510, 0.14);
    for(let i=0; i<10; i++){
      mg.fillEllipse(
        (i%5)*210 - 40 + (i*31)%80,
        h*0.52 + (i*19)%110,
        80+(i*11)%55, 30+(i*7)%22
      );
    }
  }

  /* ── Telaranas en esquinas (fijas a cámara, sobre vigneta) ── */
  _drawCobwebs(w, h){
    // scroll-fixed + depth 14.5: siempre visibles en pantalla, encima de vigneta (14)
    const g = this.add.graphics().setScrollFactor(0).setDepth(14.5);
    g.lineStyle(1.5, 0xb0a878, 0.65);

    const web = (ox, oy, size, fx, fy) => {
      const sx=fx?-1:1, sy=fy?-1:1;
      for(let i=0; i<=6; i++){
        const a=(i/6)*Math.PI/2;
        g.lineBetween(ox, oy, ox+sx*Math.cos(a)*size, oy+sy*Math.sin(a)*size);
      }
      for(let r=0.3; r<=1.0; r+=0.3){
        for(let i=0; i<6; i++){
          const a1=(i/6)*Math.PI/2, a2=((i+1)/6)*Math.PI/2;
          g.lineBetween(
            ox+sx*Math.cos(a1)*size*r, oy+sy*Math.sin(a1)*size*r,
            ox+sx*Math.cos(a2)*size*r, oy+sy*Math.sin(a2)*size*r
          );
        }
      }
    };

    // Esquinas por debajo del HUD (top: y=100, no y=0)
    web(0, 100, 85, false, false);  // superior izquierda
    web(w, 100, 85, true,  false);  // superior derecha
    web(0, h,   75, false, true);   // inferior izquierda
    web(w, h,   75, true,  true);   // inferior derecha
  }

  /* ── Pasillos de piedra ── */
  _drawCorridors(){
    const g = this.add.graphics();
    const oy = _DH/2;
    for(let i=0; i<28; i++){
      const a=_nodePos(i), b=_nodePos(i+1);
      const done = i<this._cur;
      if(i===27){
        // Tramo final en L: horizontal al eje de la puerta, luego vertical hacia ella
        const elbow = { x:b.x, y:a.y+oy };
        this._stoneCorridor(g, a.x, a.y+oy, elbow.x, elbow.y, done);
        this._stoneCorridor(g, elbow.x, elbow.y, b.x, b.y+oy, done);
      } else {
        this._stoneCorridor(g, a.x, a.y+oy, b.x, b.y+oy, done);
      }
    }
  }

  _stoneCorridor(g, x1,y1, x2,y2, done){
    const dx=x2-x1, dy=y2-y1;
    const len=Math.sqrt(dx*dx+dy*dy);
    if(len<1) return;
    const W=34, nx=-dy/len*W/2, ny=dx/len*W/2;

    // Sombra/borde exterior — separa el corredor de la pared
    const W2=W+6, ox=-dy/len*W2/2, oy2=dx/len*W2/2;
    g.fillStyle(0x070504, 0.9);
    g.fillTriangle(x1+ox,y1+oy2, x1-ox,y1-oy2, x2+ox,y2+oy2);
    g.fillTriangle(x2+ox,y2+oy2, x1-ox,y1-oy2, x2-ox,y2-oy2);

    // Piso de piedra — más claro que la pared para que se lea
    g.fillStyle(0x4a3d2a, 1);
    g.fillTriangle(x1+nx,y1+ny, x1-nx,y1-ny, x2+nx,y2+ny);
    g.fillTriangle(x2+nx,y2+ny, x1-nx,y1-ny, x2-nx,y2-ny);

    // Losas — junta oscura transversal
    const slabs=Math.max(1,Math.floor(len/26));
    g.lineStyle(1, 0x231a10, 0.7);
    for(let s=1; s<=slabs; s++){
      const t=s/(slabs+1);
      const mx=x1+dx*t, my=y1+dy*t;
      g.lineBetween(mx+nx,my+ny, mx-nx,my-ny);
    }

    // Línea central tenue (junta longitudinal)
    g.lineStyle(0.8, 0x2a2014, 0.5);
    g.lineBetween(x1,y1, x2,y2);

    // Highlight de un borde — relieve de losa
    g.lineStyle(1.5, 0x6a5838, 0.45);
    g.lineBetween(x1+nx,y1+ny, x2+nx,y2+ny);
    g.lineStyle(2.5, 0x0a0704, 1);
    g.lineBetween(x1-nx,y1-ny, x2-nx,y2-ny);

    // Camino recorrido — brillo dorado
    if(done){
      g.lineStyle(2, 0xD4AF37, 0.28);
      g.lineBetween(x1,y1, x2,y2);
    }
  }

  /* ── Texturas de luz generadas en runtime (sin assets externos) ── */
  _ensureLightTextures(){
    // Glow radial suave — naranja cálido al centro, transparente al borde
    if(!this.textures.exists('torchGlow')){
      const S = 128, r = S/2;
      const cv = this.textures.createCanvas('torchGlow', S, S);
      const ctx = cv.getContext();
      const grd = ctx.createRadialGradient(r, r, 0, r, r, r);
      grd.addColorStop(0.00, 'rgba(255,225,150,0.95)');
      grd.addColorStop(0.18, 'rgba(255,160,70,0.55)');
      grd.addColorStop(0.45, 'rgba(200,90,30,0.22)');
      grd.addColorStop(1.00, 'rgba(120,50,15,0.0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, S, S);
      cv.refresh();
    }
    // Brasa — punto suave para el emisor de partículas
    if(!this.textures.exists('ember')){
      const S = 16, r = S/2;
      const cv = this.textures.createCanvas('ember', S, S);
      const ctx = cv.getContext();
      const grd = ctx.createRadialGradient(r, r, 0, r, r, r);
      grd.addColorStop(0.0, 'rgba(255,230,160,1)');
      grd.addColorStop(0.5, 'rgba(255,140,40,0.8)');
      grd.addColorStop(1.0, 'rgba(255,80,20,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, S, S);
      cv.refresh();
    }
  }

  /* ── Antorchas ── */
  _drawTorches(w, h){
    this._ensureLightTextures();
    for(let i=1; i<28; i+=3){
      const a=_nodePos(i), b=_nodePos(i+1);
      this._torch((a.x+b.x)/2 + (i*17%20-10), (a.y+b.y)/2 + (i*13%12-6));
    }
    this._torch(22, 200);
    this._torch(22, 440);
    this._torch(w-22, 230);
    this._torch(w-22, 465);
  }

  _torch(x, y){
    const dur   = 150 + ((x+y)|0)%180;
    const delay = ((x*y)|0)%350;

    // Glow — sprite radial con blend aditivo, flicker irregular
    const glow = this.add.image(x, y+4, 'torchGlow')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(8)
      .setScale(1.05)
      .setAlpha(0.8);
    // Pulso base suave
    this.tweens.add({
      targets:glow, alpha:{from:0.62, to:0.92}, scale:{from:1.0, to:1.12},
      duration:dur, yoyo:true, repeat:-1, ease:'Sine.easeInOut', delay
    });
    // Flicker irregular — jitter ocasional encima del pulso
    this.time.addEvent({
      delay: 90 + (delay%70), loop:true,
      callback: ()=>{ glow.alpha = Phaser.Math.Clamp(glow.alpha + Phaser.Math.FloatBetween(-0.12, 0.12), 0.5, 1.0); }
    });

    // Emisor de brasas — partículas que suben desde la llama
    const embers = this.add.particles(x, y-2, 'ember', {
      speedY: { min:-42, max:-72 },
      speedX: { min:-10, max:10 },
      lifespan: { min:500, max:1000 },
      scale: { start:0.5, end:0 },
      alpha: { start:0.9, end:0 },
      frequency: 120,
      quantity: 1,
      blendMode: 'ADD',
      tint: [0xffcc55, 0xff8822, 0xff6611]
    }).setDepth(10);

    // Palo/soporte — estático
    const stick = this.add.graphics().setPosition(x, y).setDepth(9);
    stick.fillStyle(0x2a1c0a, 1);
    stick.fillRect(-4, 6, 8, 10);
    stick.lineStyle(1.5, 0x4a3010, 1);
    stick.lineBetween(0, 4, 0, 16);

    // Llama — núcleo brillante sobre el glow
    const flame = this.add.graphics().setPosition(x, y).setDepth(11);
    flame.fillStyle(0xff6600, 0.9); flame.fillCircle(0, 0, 6);
    flame.fillStyle(0xffaa00, 0.8); flame.fillCircle(0, 1, 4);
    flame.fillStyle(0xffee99, 0.6); flame.fillCircle(0, 2, 2);
    this.tweens.add({
      targets:flame, alpha:{from:0.55, to:1},
      scaleX:{from:0.8, to:1.2}, scaleY:{from:0.85, to:1.15},
      duration:dur, yoyo:true, repeat:-1, ease:'Sine.easeInOut', delay
    });
  }

  _drawAtmosphere(w, h){
    // Viñeta perimetral — fija a cámara, profundidad 14 (debajo del HUD en 15)
    const vig = this.add.graphics().setScrollFactor(0).setDepth(14);
    vig.fillGradientStyle(0x000000,0x000000,0x000000,0x000000, 0.90,0.90,0,0);
    vig.fillRect(0, 0, w, h*0.32);
    vig.fillGradientStyle(0x000000,0x000000,0x000000,0x000000, 0,0,0.85,0.85);
    vig.fillRect(0, h*0.68, w, h*0.32);
    vig.fillGradientStyle(0x000000,0x000000,0x000000,0x000000, 0.80,0,0.80,0);
    vig.fillRect(0, 0, w*0.22, h);
    vig.fillGradientStyle(0x000000,0x000000,0x000000,0x000000, 0,0.80,0,0.80);
    vig.fillRect(w*0.78, 0, w*0.22, h);

    // Tinte frío global (azul oscuro muy sutil) — refuerza atmósfera de mazmorra
    const cold = this.add.graphics();
    cold.fillStyle(0x05080f, 0.30);
    cold.fillRect(-300, -200, w+600, h+400);
  }

  /* ── Nodos (puertas) ── */
  _drawNodes(){
    let bossCount=0;
    NODE_DEFS.forEach((nd, idx)=>{
      const pos  = _nodePos(idx);
      const done = idx < this._cur;
      const curr = idx === this._cur;
      const col  = nd.t==='B'
        ? (idx===28 ? _COL_FINAL : _COL_BOSS)
        : nd.npc==='mercader' ? _COL_MERCA : _COL_ORAC;
      const thisBoss = nd.t==='B' ? bossCount++ : -1;

      if(done){
        this._doorDone(pos);
        let lbl='';
        if(nd.t==='B'){ const m=MONSTERS[thisBoss]; if(m) lbl=m.nombre.replace(/^(El |La |Los |Las )/i,''); }
        else { lbl=nd.npc==='mercader'?'Mercader':'Oráculo'; }
        if(lbl) this.add.text(pos.x, pos.y+_DH/2+8, lbl, {
          fontFamily:'Poppins', fontSize:'9px', color:'#5a6870'
        }).setOrigin(0.5,0);

      } else if(curr){
        this._doorCurrent(pos, col, nd, idx, thisBoss);
      } else {
        this._doorLocked(pos);
      }
    });
  }

  _doorDone(pos){
    const x=pos.x-_DW/2, y=pos.y-_DH/2;
    const pw=_DW/2-2, ph=_DH-4;
    const g = this.add.graphics();

    g.fillStyle(0x1e1810, 1);
    g.fillRect(x-5, y-5, _DW+10, _DH+10);
    g.fillStyle(0x2a2018, 0.8);
    g.fillRect(x-2, y-2, _DW+4, _DH+4);

    g.fillStyle(0x221508, 1);
    g.fillRect(x, y+2, pw, ph);
    g.fillRect(x+pw+2, y+2, pw, ph);

    g.lineStyle(0.5, 0x150e04, 0.45);
    for(let gy=y+10; gy<y+_DH-4; gy+=10){
      g.lineBetween(x+2, gy, x+pw-2, gy);
      g.lineBetween(x+pw+4, gy, x+_DW-2, gy);
    }

    g.fillStyle(0x080604, 1);
    g.fillRect(pos.x-1, y+2, 2, ph);

    const sg = this.add.graphics();
    sg.fillStyle(0x0e2010, 1);
    sg.fillCircle(pos.x, pos.y, 15);
    sg.lineStyle(1.5, 0x3a8048, 0.8);
    sg.strokeCircle(pos.x, pos.y, 15);
    this.add.text(pos.x, pos.y, '✓', {
      fontFamily:'Arial', fontSize:'17px', color:'#4aae60'
    }).setOrigin(0.5).setAlpha(0.85);
  }

  _doorCurrent(pos, col, nd, idx, thisBoss){
    const x=pos.x-_DW/2, y=pos.y-_DH/2;
    const pw=_DW/2-2, ph=_DH-4;

    const glow = this.add.graphics();
    glow.fillStyle(0xD4AF37, 0.07);
    glow.fillCircle(pos.x, pos.y, 62);
    glow.fillStyle(col, 0.14);
    glow.fillCircle(pos.x, pos.y, 46);
    this.tweens.add({targets:glow, alpha:{from:0.35,to:1},
      duration:850, yoyo:true, repeat:-1, ease:'Sine.easeInOut'});

    const g = this.add.graphics();
    g.fillStyle(0x1e1810, 1);
    g.fillRect(x-5, y-5, _DW+10, _DH+10);
    g.lineStyle(2, 0xD4AF37, 0.85);
    g.strokeRect(x-4, y-4, _DW+8, _DH+8);
    g.fillStyle(0x3a2410, 1);
    g.fillRect(x-2, y-2, _DW+4, _DH+4);

    g.fillStyle(0x6B3A1F, 1);
    g.fillRect(x, y+2, pw, ph);
    g.fillRect(x+pw+2, y+2, pw, ph);

    g.lineStyle(0.8, 0x4a2610, 0.55);
    for(let gy=y+10; gy<y+_DH-4; gy+=10){
      g.lineBetween(x+2, gy, x+pw-2, gy);
      g.lineBetween(x+pw+4, gy, x+_DW-2, gy);
    }

    g.fillStyle(0xB08030, 1);
    g.fillCircle(x+pw-5, pos.y, 4);
    g.fillCircle(x+pw+7, pos.y, 4);

    g.fillStyle(0x080604, 1);
    g.fillRect(pos.x-1, y+2, 2, ph);

    g.fillStyle(0xffaa44, 0.1);
    g.fillRect(x, y+ph-2, _DW, 6);

    const hint = this.add.text(pos.x, pos.y+_DH/2+14, '▼ Tocá', {
      fontFamily:'Cinzel', fontSize: this.L.compacto ? '14px' : '11px', color:'#D4AF37'
    }).setOrigin(0.5);
    this.tweens.add({targets:hint, alpha:{from:0.3,to:1}, duration:680, yoyo:true, repeat:-1});

    const hit = this.add.rectangle(pos.x, pos.y, _DW+14, _DH+14, 0xffffff, 0)
      .setInteractive({useHandCursor:true});
    hit.on('pointerover', ()=>{ g.setAlpha(0.85); snd_item&&snd_item(); });
    hit.on('pointerout',  ()=>g.setAlpha(1));
    hit.on('pointerdown', ()=>this.tweens.add({targets:g,scaleX:0.93,scaleY:0.93,duration:80,yoyo:true}));

    if(nd.t==='B'){
      hit.on('pointerup', ()=>this.showDossier(STATE.jefeActual));
    } else {
      hit.on('pointerup', ()=>this._openDoorAndEnter(g, glow, hint, hit, pos, nd, idx));
    }
  }

  _doorLocked(pos){
    const x=pos.x-_DW/2, y=pos.y-_DH/2;
    const pw=_DW/2-2, ph=_DH-4;
    const g = this.add.graphics();
    // Frame
    g.fillStyle(0x1a1208, 1);
    g.fillRect(x-5, y-5, _DW+10, _DH+10);
    // Dark wood panels — same style as current door but unlit
    g.fillStyle(0x3a1f0c, 1);
    g.fillRect(x, y+2, pw, ph);
    g.fillRect(x+pw+2, y+2, pw, ph);
    // Wood grain
    g.lineStyle(0.6, 0x210b03, 0.5);
    for(let gy=y+10; gy<y+_DH-4; gy+=10){
      g.lineBetween(x+2, gy, x+pw-2, gy);
      g.lineBetween(x+pw+4, gy, x+_DW-2, gy);
    }
    // Center seam
    g.fillStyle(0x080604, 1);
    g.fillRect(pos.x-1, y+2, 2, ph);
    // Lock bar across seam
    g.fillStyle(0x120a06, 1);
    g.fillRect(pos.x-9, pos.y-3, 18, 6);
    // Handles
    g.fillStyle(0x1e1610, 1);
    g.fillCircle(x+pw-5, pos.y, 3);
    g.fillCircle(x+pw+7, pos.y, 3);
  }

  _openDoorAndEnter(doorG, glowG, hint, hit, pos, nd, idx){
    hit.disableInteractive();
    snd_item && snd_item();
    glowG.setVisible(false);
    hint.setVisible(false);
    doorG.setVisible(false);

    const pw=_DW/2-2, ph=_DH-4;

    // Left panel: pivot at seam, extends left in local space
    const leftG = this.add.graphics().setPosition(pos.x-1, pos.y);
    leftG.fillStyle(0x6B3A1F, 1);
    leftG.fillRect(-pw, -ph/2, pw, ph);
    leftG.lineStyle(0.7, 0x3a1e0a, 0.5);
    for(let gy=-ph/2+8; gy<ph/2-4; gy+=8) leftG.lineBetween(-pw+2, gy, -3, gy);
    leftG.fillStyle(0xB08030, 1);
    leftG.fillCircle(-6, 0, 4);

    // Right panel: pivot at seam, extends right in local space
    const rightG = this.add.graphics().setPosition(pos.x+1, pos.y);
    rightG.fillStyle(0x6B3A1F, 1);
    rightG.fillRect(0, -ph/2, pw, ph);
    rightG.lineStyle(0.7, 0x3a1e0a, 0.5);
    for(let gy=-ph/2+8; gy<ph/2-4; gy+=8) rightG.lineBetween(3, gy, pw-2, gy);
    rightG.fillStyle(0xB08030, 1);
    rightG.fillCircle(6, 0, 4);

    // Warm flash from inside
    const flash = this.add.graphics().setPosition(pos.x, pos.y);
    flash.fillStyle(0xffcc44, 1);
    flash.fillRect(-_DW/2, -_DH/2, _DW, _DH);
    flash.setAlpha(0);

    this.tweens.add({ targets:flash, alpha:0.4, duration:70, yoyo:true, onComplete:()=>flash.destroy() });

    // Paneles se deslizan hacia afuera y se desvanecen en el marco
    this.tweens.add({ targets:leftG,  x:leftG.x  - pw, alpha:0, duration:280, ease:'Sine.easeIn' });
    this.tweens.add({
      targets:rightG, x:rightG.x + pw, alpha:0, duration:280, ease:'Sine.easeIn',
      onComplete:()=>{ leftG.destroy(); rightG.destroy(); this._enterPuzzle(nd, idx); }
    });
  }

  /* ── Nombres de zonas ── */
  _drawZoneLabels(){
    const ZONES=[
      {label:'La Cripta del Azar',       x:390, y:110},
      {label:'Corredor de las Sombras',  x:700, y:228},
      {label:'Cámara de Bernoulli',      x:200, y:348},
      {label:'Galería de Laplace',  x:690, y:458},
      {label:'El Abismo Final',          x:511, y:585},
    ];
    const tel = this.scale.height < 500;   // teléfono: el rótulo oscuro sobre piedra oscura no se leía
    ZONES.forEach(z=>{
      this.add.text(z.x, z.y, z.label, {
        fontFamily:'Cinzel', fontSize: tel ? '11px' : '9px', color: tel ? '#7a6244' : '#2e2218', fontStyle:'italic'
      }).setOrigin(0.5);
    });
  }

  /* ── Leyenda (fija a camara) ── */
  _drawLegend(w){
    const entries=[
      {col:_COL_BOSS,  label:'Jefe'},
      {col:_COL_MERCA, label:'Mercader'},
      {col:_COL_ORAC,  label:'Oráculo'},
    ];
    const g = this.add.graphics().setScrollFactor(0).setDepth(16);
    entries.forEach((e,i)=>{
      const x = w - (entries.length-i)*100 + 46;
      g.fillStyle(e.col, 0.8);
      g.fillCircle(x, 82, 6);
      this.add.text(x+11, 82, e.label, {
        fontFamily:'Poppins', fontSize:'9px', color:'#3a4050'
      }).setOrigin(0,0.5).setScrollFactor(0).setDepth(16);
    });
  }

  /* ── Botones superiores ── */
  _mkTopBtn(rx, y, label, onUp, grande=false){
    const t = this.add.text(rx, y, label, {
      fontFamily:'Cinzel', fontSize: grande ? '14px' : '12px', color:'#D4AF37', fontStyle:'700',
      backgroundColor:'#1a1408', padding: grande ? {x:12, y:13} : {x:10, y:5}
    }).setOrigin(1,0).setDepth(21).setScrollFactor(0);
    if(grande) t.setFixedSize(0, 44);   // zona táctil de 44 px de alto
    t.setInteractive({useHandCursor:true});
    t.on('pointerover', ()=>{ t.setColor('#F5D97A'); snd_item&&snd_item(); });
    t.on('pointerout',  ()=>t.setColor('#D4AF37'));
    t.on('pointerup',   onUp);
    return t;
  }

  /* ── Inventario ── */
  _abrirInventario(){
    snd_item && snd_item();
    const oro = STATE.oro || 0;
    const inv = STATE.inventario || [];
    const max = (CFG && CFG.MAX_INVENTORY_SLOTS) || 6;
    let html = '<div style="padding:8px;">';
    html += `<h3 style="color:#D4AF37;text-align:center;margin-bottom:4px;font-family:'Cinzel',serif;font-size:15px;letter-spacing:2px;text-transform:uppercase">Tu Bolsa — ${inv.length}/${max}</h3>`;
    html += `<p style="text-align:center;color:#F5D97A;font-family:'Cinzel',serif;font-size:15px;margin-bottom:12px">${coinSpan(16)} Oro total: ${oro}</p>`;
    if(inv.length === 0){
      html += '<p style="text-align:center;color:#8a9ab0;padding:18px;font-family:\'Lora\',serif">Tu bolsa está vacía. Derrotá jefes y resolvé enigmas para conseguir artefactos.</p>';
    } else {
      html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">';
      inv.forEach(slot=>{
        const it = ITEMS[slot.id-1];
        if(!it) return;
        html += `<div class="card" style="text-align:center;padding:12px">
          <div style="font-size:34px;filter:drop-shadow(0 0 8px rgba(212,175,55,0.5))">${it.emoji}</div>
          <div style="color:#D4AF37;font-family:'Cinzel',serif;font-size:12px;letter-spacing:1px;margin-top:6px">${it.nombre}</div>
          <div style="color:#5fcf88;font-size:11px;margin-top:4px;font-family:'Lora',serif">${it.efecto}</div>
          ${slot.cantidad>1?`<div style="color:#e07050;font-weight:700;font-size:11px;margin-top:4px">x${slot.cantidad}</div>`:''}
        </div>`;
      });
      html += '</div>';
      html += '<p style="text-align:center;color:#5a7080;font-size:10px;margin-top:10px;font-family:\'Lora\',serif">Los artefactos se usan durante las batallas.</p>';
    }
    html += '<div class="btn-row" style="margin-top:14px"><button class="btn-action btn-secondary" onclick="closeItemModal()">&#9665; Cerrar</button></div>';
    html += '</div>';
    openItemModal(html);
  }

  /* ── Confirmar salida ── */
  _confirmSalir(){
    snd_item && snd_item();
    window.__salirAlMenu = ()=>{
      closeItemModal();
      if(typeof saveGame === 'function') saveGame();
      this.cameras.main.fadeOut(350,0,0,0);
      this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('MenuScene'));
    };
    const html =
      '<div style="padding:12px;text-align:center;max-width:420px;margin:0 auto">' +
      '<div style="font-size:38px;margin-bottom:6px">⮐</div>' +
      '<h3 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:16px;letter-spacing:1px;margin-bottom:10px">Salir al menú</h3>' +
      '<p style="color:#b0bcd0;font-family:\'Lora\',serif;font-size:13px;line-height:1.5;margin-bottom:14px">' +
      'Tu progreso queda <b style="color:#F5D97A">guardado automáticamente</b>. Podrás continuar la aventura desde el menú principal.</p>' +
      '<div class="btn-row" style="display:flex;gap:10px;justify-content:center">' +
      '<button class="btn-action btn-secondary" onclick="closeItemModal()">Seguir jugando</button>' +
      '<button class="btn-action" onclick="window.__salirAlMenu()">⮐ Salir al menú</button>' +
      '</div></div>';
    openItemModal(html);
  }

  /* ── Navegar a puzzle ── */
  _enterPuzzle(nd, idx){
    snd_item && snd_item();
    const data = {
      npc:   nd.npc,
      puzzles: nd.pids,
      nodeIdx: idx,
      dificultad: STATE.dificultad||'normal'
    };
    if(typeof sceneWipe === 'function'){ sceneWipe(this, 'PuzzleScene', data); return; }
    this.cameras.main.fadeOut(300,0,0,0);
    this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('PuzzleScene', data));
  }

  /* ─────────────────────────────── DOSSIER ─────────────────────────────── */
  _buildDossier(w,h){
    const PW=530, PH=490;
    const PX=Math.round((w-PW)/2);
    const PY=Math.round((h-PH)/2);

    this._dimRect=this.add.rectangle(0,0,w,h,0x000000,0.72)
      .setOrigin(0).setDepth(10).setScrollFactor(0).setInteractive().setVisible(false);
    this._dimRect.on('pointerup',()=>this.hideDossier());

    this._panelG=this.add.graphics().setDepth(11).setScrollFactor(0).setVisible(false);
    this._panelG.fillStyle(0x111520,0.98);
    this._panelG.fillRoundedRect(PX,PY,PW,PH,14);
    this._panelG.lineStyle(2,0xD4AF37,0.65);
    this._panelG.strokeRoundedRect(PX,PY,PW,PH,14);
    this._panelG.lineStyle(1,0xD4AF37,0.14);
    this._panelG.strokeRoundedRect(PX+3,PY+3,PW-6,PH-6,12);
    this._panelG.lineStyle(1,0x2a3848,0.8);
    this._panelG.lineBetween(PX+220,PY+18,PX+220,PY+PH-18);

    this._portraitG=this.add.graphics().setDepth(12).setScrollFactor(0).setVisible(false);

    this._dName=this.add.text(PX+PW/2+5,PY+18,'',{
      fontFamily:'Cinzel',fontSize:'15px',color:'#D4AF37',fontStyle:'700',
      wordWrap:{width:290},align:'center'
    }).setOrigin(0.5,0).setDepth(12).setScrollFactor(0).setVisible(false);

    this._dStats=this.add.text(PX+228,PY+82,'',{
      fontFamily:'Poppins',fontSize:'12px',color:'#C0C8D0',lineSpacing:5
    }).setOrigin(0,0).setDepth(12).setScrollFactor(0).setVisible(false);

    this._dSepG=this.add.graphics().setDepth(12).setScrollFactor(0).setVisible(false);
    this._dSepG.lineStyle(1,0xD4AF37,0.2);
    this._dSepG.lineBetween(PX+228,PY+130,PX+PW-16,PY+130);

    this._dLore=this.add.text(PX+228,PY+140,'',{
      fontFamily:'Poppins',fontSize:'11px',color:'#7a8a9e',
      wordWrap:{width:286},lineSpacing:3
    }).setOrigin(0,0).setDepth(12).setScrollFactor(0).setVisible(false);

    this._dDato=this.add.text(PX+228,PY+295,'',{
      fontFamily:'Poppins',fontSize:'10.5px',color:'#9ab0c0',fontStyle:'italic',
      wordWrap:{width:286},lineSpacing:3
    }).setOrigin(0,0).setDepth(12).setScrollFactor(0).setVisible(false);

    this._dConsejo=this.add.text(PX+228,PY+390,'',{
      fontFamily:'Poppins',fontSize:'10px',color:'#5a7090',
      wordWrap:{width:286},lineSpacing:2
    }).setOrigin(0,0).setDepth(12).setScrollFactor(0).setVisible(false);

    const BW=170,BH=44,BX=PX+115,BY=PY+PH-38;
    this._btnCont=this.add.container(BX,BY).setDepth(13).setScrollFactor(0).setVisible(false);
    const bShad=this.add.graphics();
    bShad.fillStyle(0x000000,0.55);
    bShad.fillRect(-BW/2+3,-BH/2+5,BW,BH);
    const bBg=this.add.graphics();
    bBg.fillGradientStyle(0x2A2010,0x2A2010,0x1A1408,0x1A1408,1);
    bBg.fillRect(-BW/2,-BH/2,BW,BH);
    const bBorder=this.add.graphics();
    bBorder.lineStyle(1,0xD4AF37,0.7);
    bBorder.strokeRect(-BW/2,-BH/2,BW,BH);
    const bTop=this.add.graphics();
    bTop.lineStyle(1,0xD4AF37,0.25);
    bTop.lineBetween(-BW/2+2,-BH/2+1,BW/2-2,-BH/2+1);
    this._btnTxt=this.add.text(0,0,'⚔  ¡Enfrentar!',{
      fontFamily:'Cinzel',fontSize:'15px',color:'#D4AF37',fontStyle:'600',letterSpacing:1
    }).setOrigin(0.5);
    this._btnCont.add([bShad,bBg,bBorder,bTop,this._btnTxt]);

    this._btnHit=this.add.rectangle(BX,BY,BW,BH,0,0)
      .setDepth(14).setScrollFactor(0).setVisible(false).setInteractive({useHandCursor:true});
    this._btnHit.on('pointerover',()=>{
      this._btnTxt.setColor('#F5D97A');
      this.tweens.add({targets:this._btnCont,scale:1.04,duration:120});
      snd_item&&snd_item();
    });
    this._btnHit.on('pointerout', ()=>{
      this._btnTxt.setColor('#D4AF37');
      this.tweens.add({targets:this._btnCont,scale:1,duration:120});
    });
    this._btnHit.on('pointerdown',()=>this.tweens.add({targets:this._btnCont,scale:0.95,duration:70,yoyo:true}));
    this._btnHit.on('pointerup',()=>{
      snd_buff&&snd_buff();
      if(typeof sceneWipe === 'function') sceneWipe(this, 'BattleScene');
      else {
        this.cameras.main.fadeOut(350,0,0,0);
        this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('BattleScene'));
      }
    });

    this._closeBtn=this.add.text(PX+PW-22,PY+18,'✕',{
      fontFamily:'Cinzel',fontSize:'17px',color:'#3a4a5a'
    }).setOrigin(0.5).setDepth(14).setScrollFactor(0).setVisible(false).setInteractive({useHandCursor:true});
    this._closeBtn.on('pointerover',()=>this._closeBtn.setColor('#D4AF37'));
    this._closeBtn.on('pointerout', ()=>this._closeBtn.setColor('#3a4a5a'));
    this._closeBtn.on('pointerup',  ()=>this.hideDossier());

    this._dossierObjs=[
      this._dimRect,this._panelG,this._portraitG,
      this._dName,this._dStats,this._dSepG,
      this._dLore,this._dDato,this._dConsejo,
      this._btnCont,this._btnHit,this._closeBtn
    ];
  }

  /* Teléfono: el dossier del jefe es un modal con scroll (letra de 14 px, botones de 44 px). */
  _showDossierMovil(mIdx){
    const m = MONSTERS[mIdx], lore = MONSTER_LORE[mIdx];
    if(!m || !lore) return;
    const _st = statsDeMonstruo(m, STATE.dificultad);   // los mismos números con los que va a pelear
    window.__enfrentarJefe = ()=>{
      closeItemModal();
      snd_buff && snd_buff();
      if(typeof sceneWipe === 'function') sceneWipe(this, 'BattleScene');
      else {
        this.cameras.main.fadeOut(350,0,0,0);
        this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('BattleScene'));
      }
    };
    const html =
      '<div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">' +
        '<div style="flex:0 0 160px;text-align:center;margin:0 auto">' + monsterSvgHTML(m.forma, m.color, 0.6) +
          '<button class="btn-action" style="margin-top:8px;min-height:44px;width:160px;padding:8px 6px;font-size:14px" onclick="window.__enfrentarJefe()">⚔ ¡Enfrentar!</button></div>' +
        '<div style="flex:1 1 260px;min-width:0;font-family:Poppins,sans-serif;font-size:14px;line-height:1.5">' +
          `<h3 style="color:#D4AF37;font-family:Cinzel,serif;font-size:16px;margin:0 0 6px">${m.nombre}</h3>` +
          `<p style="color:#C0C8D0;margin:0 0 8px">HP: ${_st.hp} &nbsp; ⚔ ATK: ${_st.ataque} &nbsp; 🛡 DEF: ${_st.defensa}<br>Umbral de victoria: ${m.umbral}+</p>` +
          `<p style="color:#a9b7c8;margin:0 0 8px">${lore.historia}</p>` +
          `<p style="color:#b8c8d6;font-style:italic;margin:0 0 8px">${lore.dato}</p>` +
          `<p style="color:#9fb4d0;margin:0">💡 ${lore.consejo}</p>` +
        '</div>' +
      '</div>';
    openItemModal(html, `Guardián ${mIdx + 1}`);
    const caja = document.querySelector('#itemModal .modal');
    if(caja) caja.style.maxWidth = '640px';   // retrato y texto lado a lado
  }

  showDossier(mIdx){
    if(this.L.compacto){ this._showDossierMovil(mIdx); return; }
    const m    = MONSTERS[mIdx];
    const lore = MONSTER_LORE[mIdx];
    if(!m||!lore) return;

    const PW=530,PH=490;
    const PX=Math.round((this.scale.width-PW)/2);
    const PY=Math.round((this.scale.height-PH)/2);

    this._portraitG.clear();
    if(this._portraitDom){ this._portraitDom.destroy(); this._portraitDom=null; }
    if(this._portraitHitZone){ this._portraitHitZone.destroy(); this._portraitHitZone=null; }
    const mk = createMonsterDOM(this, m.forma, m.color, PX+112, PY+PH/2-8, 1.0);
    this._portraitDom = mk.domObj;
    this._portraitDom.setDepth(12).setScrollFactor(0);
    this._portraitMonsterState = mk.setState;

    // Hit zone sobre el retrato: tap → animación enojado
    const phz = this.add.zone(PX+112, PY+PH/2-8, 190, 260)
      .setDepth(14).setScrollFactor(0).setInteractive({useHandCursor:true});
    phz.on('pointerdown', ()=>{
      if(this._portraitMonsterState) this._portraitMonsterState('hurt');
      snd_impact && snd_impact();
    });
    this._portraitHitZone = phz;
    // La cámara principal la ignora (igual que el resto del HUD)
    if(this._hudCam) this.cameras.main.ignore(phz);

    this._dName.setText(m.nombre);
    const _st = statsDeMonstruo(m, STATE.dificultad);   // los mismos números con los que va a pelear
    this._dStats.setText(
      `HP: ${_st.hp}   ⚔ ATK: ${_st.ataque}   🛡 DEF: ${_st.defensa}\n` +
      `Umbral de victoria: ${m.umbral}+`
    );
    const loreShort = lore.historia.length>260
      ? lore.historia.substring(0,257)+'…'
      : lore.historia;
    this._dLore.setText(loreShort);
    this._dDato.setText(lore.dato);
    this._dConsejo.setText('💡 '+lore.consejo);

    this._dossierObjs.forEach(o=>{o.setVisible(true);o.setAlpha(0);});
    this._portraitDom.setVisible(true).setAlpha(0);
    this.tweens.add({targets:[...this._dossierObjs,this._portraitDom],alpha:1,duration:220});
  }

  hideDossier(){
    if(!this._dossierObjs) return;
    const dom = this._portraitDom;
    const phz = this._portraitHitZone;
    if(phz){ phz.destroy(); this._portraitHitZone=null; }
    this.tweens.add({
      targets:[...this._dossierObjs, ...(dom?[dom]:[])],alpha:0,duration:180,
      onComplete:()=>{
        this._dossierObjs.forEach(o=>o.setVisible(false));
        if(dom){ dom.destroy(); if(this._portraitDom===dom) this._portraitDom=null; }
      }
    });
  }

  update(){
    if(this._oroTxt && this._oroTxt.scene) this._oroTxt.setText(`${STATE.oro||0}`);
    if(this._hpTxt  && this._hpTxt.scene)  this._hpTxt.setText(`❤ ${Math.max(0,STATE.hp)}/${STATE.hpMax}`);
  }
}

MapScene.DISENO_MOVIL = true;
