function drawMonster(graphics, forma, color, cx, cy, scale=1, tick=0){
  graphics.clear();
  const s = scale;
  // Pulso siniestro global para ojos (0.7 a 1.0)
  const evilPulse = 0.7 + 0.3*Math.abs(Math.sin(tick*0.08));
  // Sombra oscura debajo de todos los monstruos (aura maligna)
  graphics.fillStyle(0x000000, 0.35);
  graphics.fillEllipse(cx, cy+85*s, 160*s, 28*s);
  switch(forma){
    case 'espectro': {
      // Círculo fantasmal con alas triangulares oscilantes
      const fluct = Math.sin(tick*0.05)*8;
      // Niebla oscura expandida
      graphics.fillStyle(0x1a0033, 0.4);
      graphics.fillCircle(cx, cy, 90*s);
      graphics.fillStyle(color, 0.35);
      graphics.fillCircle(cx, cy, 70*s);
      graphics.fillStyle(color, 0.6);
      graphics.fillCircle(cx, cy, 55*s);
      graphics.fillStyle(color, 0.95);
      graphics.fillCircle(cx, cy, 40*s);
      // Alas desgarradas (jagged)
      graphics.fillStyle(color, 0.7);
      graphics.fillTriangle(cx-55*s, cy-10*s, cx-90*s, cy-30*s+fluct, cx-95*s, cy+25*s+fluct);
      graphics.fillTriangle(cx-70*s, cy+15*s, cx-110*s, cy+5*s+fluct, cx-80*s, cy+40*s+fluct);
      graphics.fillTriangle(cx+55*s, cy-10*s, cx+90*s, cy-30*s-fluct, cx+95*s, cy+25*s-fluct);
      graphics.fillTriangle(cx+70*s, cy+15*s, cx+110*s, cy+5*s-fluct, cx+80*s, cy+40*s-fluct);
      // Garras espectrales saliendo de abajo
      graphics.lineStyle(3*s, 0x2a0a40, 0.9);
      for(let i=-2;i<=2;i++){
        graphics.lineBetween(cx+i*12*s, cy+35*s, cx+i*12*s-2, cy+60*s);
        graphics.lineBetween(cx+i*12*s-2, cy+60*s, cx+i*12*s-6, cy+55*s);
      }
      // Ojos rojos brillantes (con pulso)
      graphics.fillStyle(0xff0000, evilPulse);
      graphics.fillCircle(cx-14*s, cy-5*s, 7*s);
      graphics.fillCircle(cx+14*s, cy-5*s, 7*s);
      graphics.fillStyle(0xffff00, 1);
      graphics.fillCircle(cx-14*s, cy-5*s, 3*s);
      graphics.fillCircle(cx+14*s, cy-5*s, 3*s);
      graphics.fillStyle(0x000000, 1);
      graphics.fillCircle(cx-14*s, cy-5*s, 1.5*s);
      graphics.fillCircle(cx+14*s, cy-5*s, 1.5*s);
      // Boca abierta con colmillos
      graphics.fillStyle(0x000000, 0.9);
      graphics.fillEllipse(cx, cy+15*s, 28*s, 14*s);
      graphics.fillStyle(0xffffff, 1);
      graphics.fillTriangle(cx-10*s, cy+9*s, cx-7*s, cy+20*s, cx-4*s, cy+9*s);
      graphics.fillTriangle(cx+4*s, cy+9*s, cx+7*s, cy+20*s, cx+10*s, cy+9*s);
      break;
    }
    case 'hidra': {
      // Hexágono central + 7 cabezas circulares con colmillos
      // Aura venenosa
      graphics.fillStyle(0x004400, 0.3);
      graphics.fillCircle(cx, cy, 110*s);
      graphics.fillStyle(color, 0.9);
      const hx=cx, hy=cy, r=38*s;
      graphics.beginPath();
      for(let i=0;i<6;i++){ const a=i*Math.PI/3; const x=hx+r*Math.cos(a), y=hy+r*Math.sin(a); if(i===0)graphics.moveTo(x,y); else graphics.lineTo(x,y); }
      graphics.closePath(); graphics.fillPath();
      // 7 cabezas con cuello y colmillos
      for(let i=0;i<7;i++){
        const a=i*2*Math.PI/7 + tick*0.01;
        const dist=70*s + Math.sin(tick*0.03+i)*5;
        const x=hx+dist*Math.cos(a), y=hy+dist*Math.sin(a);
        // Cuello
        graphics.lineStyle(6*s, color, 0.8);
        graphics.lineBetween(hx, hy, x, y);
        // Cabeza
        graphics.fillStyle(color,1);
        graphics.fillCircle(x,y,20*s);
        // Cuernos en cada cabeza
        graphics.fillStyle(0x1a0a00, 1);
        graphics.fillTriangle(x-10*s, y-14*s, x-6*s, y-26*s, x-2*s, y-14*s);
        graphics.fillTriangle(x+2*s, y-14*s, x+6*s, y-26*s, x+10*s, y-14*s);
        // Ojo rojo pulsante
        graphics.fillStyle(0xff0000, evilPulse);
        graphics.fillCircle(x, y-3*s, 5*s);
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(x, y-3*s, 2*s);
        // Colmillos
        graphics.fillStyle(0xffffff,1);
        graphics.fillTriangle(x-6*s, y+5*s, x-4*s, y+14*s, x-2*s, y+5*s);
        graphics.fillTriangle(x+2*s, y+5*s, x+4*s, y+14*s, x+6*s, y+5*s);
      }
      // Ojo central gigante
      graphics.fillStyle(0xff0000, evilPulse);
      graphics.fillCircle(hx, hy, 10*s);
      graphics.fillStyle(0x000000, 1);
      graphics.fillEllipse(hx, hy, 4*s, 10*s);
      break;
    }
    case 'golem': {
      // Cuadrado masivo + cuernos + garras ANIMADOS
      const rockFloat = Math.sin(tick*0.07)*6;
      const eyePulseG = 0.6 + 0.4*Math.abs(Math.sin(tick*0.12));
      const armSwing = Math.sin(tick*0.09)*12;
      // Aura de tierra vibrante
      graphics.fillStyle(0x4a3000, 0.3);
      graphics.fillCircle(cx, cy+10*s, 110*s);
      // Partículas de roca flotantes (animadas)
      for(let i=0;i<5;i++){
        const angle = (i/5)*Math.PI*2 + tick*0.015;
        const dist = (75+i*8)*s;
        const rx = cx + dist*Math.cos(angle);
        const ry = cy + dist*Math.sin(angle) + Math.sin(tick*0.08+i)*8;
        graphics.fillStyle(0x7a7a7a, 0.7);
        graphics.fillRect(rx-4*s, ry-4*s, 8*s, 8*s);
      }
      // Cuerpo principal
      graphics.fillStyle(color,1);
      graphics.fillRect(cx-60*s, cy-40*s, 120*s, 95*s);
      // Grietas oscuras animadas (pulso)
      const crackAlpha = 0.5 + 0.3*Math.sin(tick*0.06);
      graphics.lineStyle(2, 0x1a1a1a, crackAlpha);
      graphics.lineBetween(cx-50*s, cy-30*s, cx-30*s, cy+10*s);
      graphics.lineBetween(cx-30*s, cy+10*s, cx-45*s, cy+40*s);
      graphics.lineBetween(cx+20*s, cy-35*s, cx+40*s, cy-5*s);
      graphics.lineBetween(cx+40*s, cy-5*s, cx+25*s, cy+45*s);
      // Zona interior
      graphics.fillStyle(0x3a3a3a,1);
      graphics.fillRect(cx-48*s, cy-28*s, 96*s, 70*s);
      // Runas en el cuerpo (brillan con tick)
      graphics.lineStyle(2, 0xffd700, 0.3+0.4*Math.abs(Math.sin(tick*0.1)));
      graphics.strokeRect(cx-38*s, cy-18*s, 20*s, 20*s);
      graphics.strokeRect(cx+18*s, cy-18*s, 20*s, 20*s);
      graphics.lineBetween(cx-5*s, cy-15*s, cx+5*s, cy+5*s);
      graphics.lineBetween(cx+5*s, cy-15*s, cx-5*s, cy+5*s);
      // Cuernos enormes
      graphics.fillStyle(0x1a1a1a, 1);
      graphics.fillTriangle(cx-50*s, cy-40*s, cx-70*s, cy-85*s, cx-35*s, cy-40*s);
      graphics.fillTriangle(cx+50*s, cy-40*s, cx+70*s, cy-85*s, cx+35*s, cy-40*s);
      // Detalles cuernos
      graphics.lineStyle(1.5*s, 0x444444, 1);
      graphics.lineBetween(cx-55*s, cy-50*s, cx-65*s, cy-75*s);
      graphics.lineBetween(cx+55*s, cy-50*s, cx+65*s, cy-75*s);
      // Corona roja
      graphics.fillStyle(0x8b0000,1);
      graphics.fillTriangle(cx-25*s, cy-40*s, cx-10*s, cy-65*s, cx, cy-40*s);
      graphics.fillTriangle(cx, cy-40*s, cx+10*s, cy-65*s, cx+25*s, cy-40*s);
      // Ojos rojos pulsantes grandes
      graphics.fillStyle(0x440000, 1);
      graphics.fillRect(cx-30*s, cy-22*s, 22*s, 14*s);
      graphics.fillRect(cx+8*s, cy-22*s, 22*s, 14*s);
      graphics.fillStyle(0xff0000, eyePulseG);
      graphics.fillRect(cx-28*s, cy-20*s, 18*s, 10*s);
      graphics.fillRect(cx+10*s, cy-20*s, 18*s, 10*s);
      graphics.fillStyle(0xffff00, eyePulseG);
      graphics.fillRect(cx-24*s, cy-17*s, 10*s, 4*s);
      graphics.fillRect(cx+14*s, cy-17*s, 10*s, 4*s);
      // Boca con colmillos rotos
      graphics.fillStyle(0x000000,1);
      graphics.fillRect(cx-25*s, cy+15*s, 50*s, 18*s);
      graphics.fillStyle(0xbbbbbb,1);
      for(let i=0;i<5;i++){
        graphics.fillTriangle(cx-22*s+i*10*s, cy+15*s, cx-19*s+i*10*s, cy+28*s, cx-16*s+i*10*s, cy+15*s);
        graphics.fillTriangle(cx-18*s+i*10*s, cy+33*s, cx-15*s+i*10*s, cy+22*s, cx-12*s+i*10*s, cy+33*s);
      }
      // Brazos oscilantes con garras
      graphics.fillStyle(color, 1);
      graphics.fillRect(cx-85*s, cy-10*s+armSwing, 28*s, 38*s);
      graphics.fillRect(cx+57*s, cy-10*s-armSwing, 28*s, 38*s);
      // Garras
      graphics.fillStyle(0x1a1a1a, 1);
      for(let i=0;i<4;i++){
        graphics.fillTriangle(cx-85*s+i*7*s, cy+28*s+armSwing, cx-82*s+i*7*s, cy+48*s+armSwing, cx-79*s+i*7*s, cy+28*s+armSwing);
        graphics.fillTriangle(cx+58*s+i*7*s, cy+28*s-armSwing, cx+61*s+i*7*s, cy+48*s-armSwing, cx+64*s+i*7*s, cy+28*s-armSwing);
      }
      // Roca flotante principal (la más grande, sobre la cabeza)
      const mainRockY = cy - 75*s + rockFloat;
      graphics.fillStyle(0x8a8a8a, 0.9);
      graphics.fillRect(cx-15*s, mainRockY-12*s, 30*s, 24*s);
      graphics.lineStyle(2, 0xffd700, 0.6);
      graphics.strokeRect(cx-15*s, mainRockY-12*s, 30*s, 24*s);
      break;
    }
    case 'bruja': {
      const capeWave = Math.sin(tick*0.06)*8;
      const handFloat = Math.sin(tick*0.08)*10;
      const robeSwirl = Math.sin(tick*0.04)*5;
      // Aura de magia oscura pulsante
      graphics.fillStyle(0x4a0080, 0.15+0.1*Math.abs(Math.sin(tick*0.05)));
      graphics.fillCircle(cx, cy, 110*s);
      graphics.fillStyle(0x4a0080, 0.25);
      graphics.fillCircle(cx, cy, 90*s);
      // Cuerpo (capa) con ondeo
      graphics.fillStyle(color,1);
      graphics.fillTriangle(cx-55*s+capeWave, cy-10*s, cx+55*s-capeWave, cy-10*s, cx, cy+75*s+robeSwirl);
      graphics.fillTriangle(cx-60*s, cy+20*s, cx-55*s+capeWave, cy-10*s, cx-20*s, cy+75*s);
      graphics.fillTriangle(cx+60*s, cy+20*s, cx+55*s-capeWave, cy-10*s, cx+20*s, cy+75*s);
      // Cara
      graphics.fillStyle(0xa0c898,1);
      graphics.fillCircle(cx, cy-30*s, 28*s);
      // Sombrero con movimiento sutil
      const hatTilt = Math.sin(tick*0.03)*3;
      graphics.fillStyle(0x000000,1);
      graphics.fillTriangle(cx-40*s+hatTilt, cy-50*s, cx+40*s+hatTilt, cy-50*s, cx+8*s+hatTilt, cy-110*s);
      graphics.fillEllipse(cx+hatTilt*0.5, cy-48*s, 90*s, 10*s);
      graphics.fillStyle(0xffd700,1);
      graphics.fillRect(cx-30*s+hatTilt*0.5, cy-58*s, 60*s, 4*s);
      // Cuernos
      graphics.fillStyle(0x1a0033, 1);
      graphics.fillTriangle(cx-20*s, cy-85*s, cx-25*s, cy-110*s, cx-15*s, cy-90*s);
      graphics.fillTriangle(cx+15*s, cy-85*s, cx+25*s, cy-110*s, cx+20*s, cy-90*s);
      // Ojos rojos pulsantes
      graphics.fillStyle(0xff0000, evilPulse);
      graphics.fillCircle(cx-12*s, cy-32*s, 5*s);
      graphics.fillCircle(cx+12*s, cy-32*s, 5*s);
      graphics.fillStyle(0xffff00, 1);
      graphics.fillCircle(cx-12*s, cy-32*s, 2*s);
      graphics.fillCircle(cx+12*s, cy-32*s, 2*s);
      // Colmillos
      graphics.fillStyle(0x000000, 1);
      graphics.fillEllipse(cx, cy-15*s, 16*s, 6*s);
      graphics.fillStyle(0xffffff, 1);
      graphics.fillTriangle(cx-5*s, cy-17*s, cx-3*s, cy-8*s, cx-1*s, cy-17*s);
      graphics.fillTriangle(cx+1*s, cy-17*s, cx+3*s, cy-8*s, cx+5*s, cy-17*s);
      // Nariz bruja
      graphics.fillStyle(0x7a9870,1);
      graphics.fillTriangle(cx-2*s, cy-28*s, cx+8*s, cy-22*s, cx-2*s, cy-18*s);
      // Manos flotantes independientes
      const lhx = cx-55*s + Math.sin(tick*0.07)*15, lhy = cy+10*s + handFloat;
      const rhx = cx+55*s + Math.sin(tick*0.07+1)*15, rhy = cy+10*s - handFloat;
      graphics.fillStyle(0xa0c898,1);
      graphics.fillCircle(lhx, lhy, 10*s);
      graphics.fillCircle(rhx, rhy, 10*s);
      graphics.lineStyle(2*s, 0x1a1a1a, 1);
      for(let i=-2;i<=2;i++){
        graphics.lineBetween(lhx+i*3*s, lhy+8*s, lhx+i*3*s-2, lhy+22*s);
        graphics.lineBetween(rhx+i*3*s, rhy+8*s, rhx+i*3*s+2, rhy+22*s);
      }
      // Haz de luz mágico entre manos
      graphics.lineStyle(2, 0xff00ff, 0.4+0.3*Math.sin(tick*0.1));
      graphics.lineBetween(lhx, lhy, rhx, rhy);
      // Estrellas orbitales con estelas
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3 + tick*0.025;
        const dist=85*s + Math.sin(tick*0.05+i)*8;
        const sx=cx+dist*Math.cos(a), sy=cy+dist*Math.sin(a);
        // Estela
        for(let t=1;t<=3;t++){
          const pa=a - t*0.12;
          const px=cx+dist*Math.cos(pa), py=cy+dist*Math.sin(pa);
          graphics.fillStyle(0xff00ff, 0.3-t*0.08);
          graphics.fillCircle(px, py, (4-t)*s);
        }
        graphics.fillStyle(i%2===0?0xff00ff:0xffd700, 0.95);
        graphics.fillCircle(sx,sy,5*s);
      }
      break;
    }
    case 'tiburon': {
      const swimX = Math.sin(tick*0.05)*12;
      const swimY = Math.sin(tick*0.08)*6;
      const tailWag = Math.sin(tick*0.12)*18;
      const jawOpen = Math.abs(Math.sin(tick*0.07))*14;
      const bx=cx+swimX, by=cy+swimY;
      // Agua turbia pulsante
      graphics.fillStyle(0x002244, 0.2+0.08*Math.sin(tick*0.04));
      graphics.fillEllipse(bx, by+10*s, 240*s, 110*s);
      // Estelas de agua
      for(let i=1;i<=3;i++){
        graphics.fillStyle(0x1560a0, 0.08);
        graphics.fillEllipse(bx+i*20*s, by, 80*s, 30*s);
      }
      // Cuerpo principal
      graphics.fillStyle(color,1);
      graphics.fillTriangle(bx-90*s, by, bx+85*s, by-25*s, bx+85*s, by+25*s);
      graphics.fillStyle(0x1560a0,1);
      graphics.fillTriangle(bx-65*s, by-3*s, bx+60*s, by-17*s, bx+60*s, by+17*s);
      // Vientre
      graphics.fillStyle(0xcfd8dc, 0.7);
      graphics.fillEllipse(bx+20*s, by+15*s, 80*s, 15*s);
      // Aleta dorsal ondulante
      graphics.fillStyle(color,1);
      graphics.fillTriangle(bx-15*s, by-22*s, bx+12*s+swimX*0.3, by-65*s, bx+28*s, by-22*s);
      graphics.fillStyle(0x1a1a1a, 1);
      graphics.fillTriangle(bx+8*s, by-58*s, bx+10*s, by-75*s, bx+14*s, by-58*s);
      // Cola con movimiento
      graphics.fillStyle(color,1);
      graphics.fillTriangle(bx+80*s, by-22*s, bx+120*s, by-42*s+tailWag, bx+95*s, by);
      graphics.fillTriangle(bx+80*s, by+22*s, bx+120*s, by+42*s+tailWag, bx+95*s, by);
      // Ojo maligno
      graphics.fillStyle(0xffffff,1);
      graphics.fillCircle(bx-55*s, by-7*s, 7*s);
      graphics.fillStyle(0xff0000, evilPulse);
      graphics.fillCircle(bx-55*s, by-7*s, 5*s);
      graphics.fillStyle(0x000000,1);
      graphics.fillCircle(bx-55*s, by-7*s, 2*s);
      // Cicatriz
      graphics.lineStyle(2*s, 0x8b0000, 1);
      graphics.lineBetween(bx-70*s, by-15*s, bx-45*s, by-20*s);
      // Mandíbula animada (se abre y cierra)
      graphics.fillStyle(0x000000, 1);
      graphics.fillEllipse(bx-60*s, by+8*s+jawOpen*0.3, 50*s, 16*s+jawOpen);
      // Dientes
      graphics.fillStyle(0xffffff,1);
      for(let i=0;i<8;i++){
        graphics.fillTriangle(bx-80*s+i*6*s, by-jawOpen*0.2, bx-77*s+i*6*s, by+10*s, bx-74*s+i*6*s, by-jawOpen*0.2);
      }
      for(let i=0;i<7;i++){
        graphics.fillTriangle(bx-78*s+i*6*s, by+14*s+jawOpen*0.4, bx-75*s+i*6*s, by+4*s, bx-72*s+i*6*s, by+14*s+jawOpen*0.4);
      }
      // Aleta pectoral
      graphics.fillStyle(color,1);
      graphics.fillTriangle(bx-20*s, by+22*s, bx-45*s, by+50*s, bx+5*s, by+28*s);
      // Burbujas animadas
      for(let i=0;i<5;i++){
        const bPhase=(tick*0.06+i*1.3)%(Math.PI*2);
        const bx2=bx-70*s+i*12*s, by2=by+20*s-Math.sin(bPhase)*40*s;
        graphics.fillStyle(0x7ec8e3, 0.5);
        graphics.fillCircle(bx2, by2, 3*s);
        graphics.lineStyle(1, 0xaaddff, 0.4);
        graphics.strokeCircle(bx2, by2, 3*s);
      }
      break;
    }
    case 'dragon': {
      const wingF = Math.sin(tick*0.1)*14;
      const breathPhase = (tick*0.08)%(Math.PI*2);
      const fireLen = 30 + Math.abs(Math.sin(breathPhase))*60;
      const spineWave = Math.sin(tick*0.06)*4;
      // Aura de fuego pulsante
      graphics.fillStyle(0xff4400, 0.1+0.1*Math.abs(Math.sin(tick*0.07)));
      graphics.fillCircle(cx, cy, 140*s);
      // Cuerpo
      graphics.fillStyle(color,1);
      graphics.fillEllipse(cx, cy+10*s, 115*s, 62*s);
      graphics.fillStyle(0x7c1818,1);
      graphics.fillEllipse(cx, cy+10*s, 82*s, 40*s);
      // Escamas animadas (ondulantes)
      for(let i=-3;i<=3;i++){
        graphics.fillStyle(0x550000, 0.5+0.3*Math.sin(tick*0.05+i*0.5));
        graphics.fillCircle(cx+i*15*s, cy+5*s, 4*s);
      }
      // Alas grandes con batida
      graphics.fillStyle(color,0.85);
      graphics.fillTriangle(cx-30*s, cy-10*s, cx-105*s, cy-75*s-wingF, cx-68*s, cy+12*s);
      graphics.fillTriangle(cx-62*s, cy-5*s, cx-118*s, cy-44*s-wingF, cx-75*s, cy+22*s);
      graphics.fillTriangle(cx+30*s, cy-10*s, cx+105*s, cy-75*s+wingF, cx+68*s, cy+12*s);
      graphics.fillTriangle(cx+62*s, cy-5*s, cx+118*s, cy-44*s+wingF, cx+75*s, cy+22*s);
      // Membrana de las alas (más transparente)
      graphics.fillStyle(0x7c1818, 0.4);
      graphics.fillTriangle(cx-30*s, cy, cx-105*s, cy-60*s-wingF, cx-62*s, cy+10*s);
      graphics.fillStyle(0x7c1818, 0.4);
      graphics.fillTriangle(cx+30*s, cy, cx+105*s, cy-60*s+wingF, cx+62*s, cy+10*s);
      // Cabeza
      graphics.fillStyle(color,1);
      graphics.fillCircle(cx-68*s, cy-20*s, 27*s);
      // Hocico
      graphics.fillStyle(color,1);
      graphics.fillTriangle(cx-92*s, cy-22*s, cx-108*s, cy-18*s, cx-92*s, cy-10*s);
      // Cuernos
      graphics.fillStyle(0x1a1a1a,1);
      graphics.fillTriangle(cx-78*s, cy-36*s, cx-83*s, cy-68*s, cx-73*s, cy-36*s);
      graphics.fillTriangle(cx-62*s, cy-36*s, cx-57*s, cy-72*s, cx-52*s, cy-36*s);
      graphics.fillTriangle(cx-46*s, cy-31*s, cx-41*s, cy-57*s, cx-36*s, cy-31*s);
      // Espinas dorsal ondulante
      for(let i=0;i<7;i++){
        const spineH = (20+i*3)*s + spineWave*(i%2===0?1:-1);
        graphics.fillStyle(0x1a1a1a,1);
        graphics.fillTriangle(cx-22*s+i*13*s, cy-20*s, cx-16*s+i*13*s, cy-20*s-spineH, cx-10*s+i*13*s, cy-20*s);
      }
      // Ojo maligno
      graphics.fillStyle(0xffff00, evilPulse);
      graphics.fillCircle(cx-70*s, cy-18*s, 7*s);
      graphics.fillStyle(0x000000,1);
      graphics.fillEllipse(cx-70*s, cy-18*s, 2*s, 8*s);
      // Colmillos
      graphics.fillStyle(0xffffff, 1);
      graphics.fillTriangle(cx-100*s, cy-11*s, cx-98*s, cy+3*s, cx-94*s, cy-11*s);
      graphics.fillTriangle(cx-90*s, cy-11*s, cx-88*s, cy+5*s, cx-84*s, cy-11*s);
      // Fuego animado (varía largo y color)
      const fireAlpha=0.7+0.3*Math.sin(breathPhase);
      graphics.fillStyle(0xff2200, fireAlpha);
      graphics.fillTriangle(cx-108*s, cy-14*s, cx-108*s-fireLen*s, cy-20*s, cx-108*s, cy-8*s);
      graphics.fillStyle(0xff6600, fireAlpha*0.9);
      graphics.fillTriangle(cx-108*s, cy-13*s, cx-108*s-fireLen*0.75*s, cy-17*s, cx-108*s, cy-9*s);
      graphics.fillStyle(0xffdd00, fireAlpha*0.8);
      graphics.fillTriangle(cx-108*s, cy-12*s, cx-108*s-fireLen*0.5*s, cy-14*s, cx-108*s, cy-10*s);
      // Partículas de fuego
      for(let i=0;i<5;i++){
        const fp=(tick*0.1+i*0.6)%(Math.PI*2);
        const fx=cx-108*s-Math.random()*fireLen*s, fy=cy-13*s+(Math.sin(fp)-0.5)*12*s;
        graphics.fillStyle(0xff8800, 0.6);
        graphics.fillCircle(fx, fy, 3*s);
      }
      // Garras
      graphics.fillStyle(color,1);
      graphics.fillRect(cx-26*s, cy+32*s, 14*s, 25*s);
      graphics.fillRect(cx+12*s, cy+32*s, 14*s, 25*s);
      graphics.fillStyle(0x1a1a1a,1);
      for(let i=0;i<4;i++){
        graphics.fillTriangle(cx-26*s+i*5*s, cy+56*s, cx-24*s+i*5*s, cy+72*s, cx-22*s+i*5*s, cy+56*s);
        graphics.fillTriangle(cx+12*s+i*5*s, cy+56*s, cx+14*s+i*5*s, cy+72*s, cx+16*s+i*5*s, cy+56*s);
      }
      break;
    }
    case 'espiritu': {
      // Espíritu con vórtice rotante y almas orbitando
      const vortexAngle = tick*0.04;
      // Niebla expansiva pulsante
      graphics.fillStyle(color, 0.1+0.08*Math.sin(tick*0.05));
      graphics.fillCircle(cx, cy, 105*s);
      graphics.fillStyle(0x1a0033, 0.3);
      graphics.fillCircle(cx, cy, 85*s);
      graphics.fillStyle(color, 0.35);
      graphics.fillCircle(cx, cy, 62*s);
      graphics.fillStyle(color, 0.65);
      graphics.fillCircle(cx, cy, 42*s);
      // Vórtice de rayos rotantes con distancias variables
      for(let i=0;i<14;i++){
        const a = i*Math.PI/7 + vortexAngle;
        const r1=45*s, r2=(70+Math.sin(tick*0.08+i)*18)*s;
        const alpha=0.4+0.4*Math.abs(Math.sin(tick*0.06+i*0.4));
        graphics.lineStyle(2+Math.sin(tick*0.05+i)*1, color, alpha);
        graphics.lineBetween(cx+r1*Math.cos(a), cy+r1*Math.sin(a), cx+r2*Math.cos(a), cy+r2*Math.sin(a));
      }
      // Núcleo brillante pulsante
      const coreSize = (20+Math.sin(tick*0.1)*4)*s;
      graphics.fillStyle(0xffffff, 0.9);
      graphics.fillCircle(cx, cy, coreSize);
      graphics.fillStyle(color, 0.5);
      graphics.fillCircle(cx, cy, coreSize*0.6);
      // Ojos en el núcleo
      graphics.fillStyle(0x000000, 1);
      graphics.fillCircle(cx-8*s, cy-3*s, 6*s);
      graphics.fillCircle(cx+8*s, cy-3*s, 6*s);
      graphics.fillStyle(0xff0000, evilPulse);
      graphics.fillCircle(cx-8*s, cy-3*s, 4*s);
      graphics.fillCircle(cx+8*s, cy-3*s, 4*s);
      // Boca espectral
      graphics.fillStyle(0x000000, 0.95);
      graphics.fillEllipse(cx, cy+10*s, 16*s, 8*s);
      graphics.fillStyle(0xffffff,1);
      graphics.fillTriangle(cx-5*s, cy+6*s, cx-3*s, cy+14*s, cx-1*s, cy+6*s);
      graphics.fillTriangle(cx+1*s, cy+6*s, cx+3*s, cy+14*s, cx+5*s, cy+6*s);
      // Almas con estelas (5 almas en órbita elíptica)
      for(let i=0;i<5;i++){
        const a=i*2*Math.PI/5 + vortexAngle*1.5;
        const rx=78*s, ry=45*s;
        const sx=cx+rx*Math.cos(a), sy=cy+ry*Math.sin(a);
        // Estela de cada alma
        for(let t=1;t<=5;t++){
          const pa=a-t*0.18;
          const px=cx+rx*Math.cos(pa), py=cy+ry*Math.sin(pa);
          graphics.fillStyle(0xe0d0b0, (0.6-t*0.1));
          graphics.fillCircle(px, py, (5-t)*s);
        }
        // Alma (calavera pequeña)
        graphics.fillStyle(0xe0d0b0, 0.9);
        graphics.fillCircle(sx, sy, 6*s);
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(sx-2*s, sy-1*s, 1.5*s);
        graphics.fillCircle(sx+2*s, sy-1*s, 1.5*s);
        graphics.fillRect(sx-2*s, sy+2*s, 4*s, 1.5*s);
      }
      // Rayos de energía que tocan el suelo
      graphics.lineStyle(2, color, 0.3);
      for(let i=0;i<3;i++){
        const a=vortexAngle*2+i*2.1;
        graphics.lineBetween(cx, cy, cx+Math.cos(a)*95*s, cy+Math.sin(a)*55*s);
      }
      break;
    }
    case 'titan': {
      const breathe = Math.sin(tick*0.04)*5;
      const tremble = Math.sin(tick*0.15)*2;
      const eyeScan = Math.sin(tick*0.03)*8;
      // Aura temblante con capas
      for(let i=3;i>0;i--){
        graphics.fillStyle(color, 0.08*i);
        graphics.fillCircle(cx+tremble*i*0.3, cy, (110+breathe*i)*s);
      }
      graphics.fillStyle(0x4a2a00, 0.35);
      graphics.fillCircle(cx, cy, (90+breathe)*s);
      // Grietas del suelo debajo
      graphics.lineStyle(2, 0x4a2a00, 0.6);
      for(let i=0;i<5;i++){
        const angle=(i/5)*Math.PI + tremble*0.05;
        const len=(50+i*15)*s;
        graphics.lineBetween(cx, cy+85*s, cx+Math.cos(angle)*len, cy+85*s+Math.sin(angle)*len*0.3);
      }
      // Cuerpo pentagonal (con escala de respiración)
      graphics.fillStyle(color, 1);
      const rb=(75+breathe*0.5)*s;
      graphics.beginPath();
      for(let i=0;i<5;i++){
        const a=-Math.PI/2+i*2*Math.PI/5;
        const x=cx+tremble+rb*Math.cos(a), y=cy+rb*Math.sin(a);
        if(i===0) graphics.moveTo(x,y); else graphics.lineTo(x,y);
      }
      graphics.closePath(); graphics.fillPath();
      // Armadura interior
      graphics.fillStyle(0x8b4513, 1);
      graphics.beginPath();
      for(let i=0;i<5;i++){
        const a=-Math.PI/2+i*2*Math.PI/5;
        const x=cx+45*s*Math.cos(a), y=cy+45*s*Math.sin(a);
        if(i===0) graphics.moveTo(x,y); else graphics.lineTo(x,y);
      }
      graphics.closePath(); graphics.fillPath();
      // Remaches de armadura
      for(let i=0;i<5;i++){
        const a=-Math.PI/2+i*2*Math.PI/5;
        graphics.fillStyle(0xffd700, 1);
        graphics.fillCircle(cx+60*s*Math.cos(a), cy+60*s*Math.sin(a), 4*s);
      }
      // Cuernos colosales con pulsación
      graphics.fillStyle(0x1a1a1a, 1);
      graphics.fillTriangle(cx-55*s, cy-52*s, cx-82*s, cy-105*s, cx-40*s, cy-57*s);
      graphics.fillTriangle(cx+55*s, cy-52*s, cx+82*s, cy-105*s, cx+40*s, cy-57*s);
      // Líneas de energía en los cuernos
      graphics.lineStyle(2, 0xff4400, 0.3+0.4*Math.abs(Math.sin(tick*0.1)));
      graphics.lineBetween(cx-60*s, cy-62*s, cx-72*s, cy-88*s);
      graphics.lineBetween(cx+60*s, cy-62*s, cx+72*s, cy-88*s);
      // Ojo central ciclópeo con movimiento
      graphics.fillStyle(0x330000, 1);
      graphics.fillCircle(cx+eyeScan*0.3, cy-5*s, 18*s);
      graphics.fillStyle(0xff0000, evilPulse);
      graphics.fillCircle(cx+eyeScan*0.3, cy-5*s, 14*s);
      graphics.fillStyle(0xffff00, 1);
      graphics.fillCircle(cx+eyeScan*0.3, cy-5*s, 9*s);
      // Pupila que se mueve (sigue el movimiento del ojo)
      graphics.fillStyle(0x000000, 1);
      graphics.fillEllipse(cx+eyeScan*0.3+eyeScan*0.2, cy-5*s, 5*s, 15*s);
      // Colmillos
      graphics.fillStyle(0xffffff, 1);
      graphics.fillTriangle(cx-16*s, cy+30*s, cx-13*s, cy+52*s, cx-10*s, cy+30*s);
      graphics.fillTriangle(cx+10*s, cy+30*s, cx+13*s, cy+52*s, cx+16*s, cy+30*s);
      // Garras laterales animadas
      const clawSwing = Math.sin(tick*0.06)*8;
      graphics.fillStyle(0x1a1a1a, 1);
      for(let i=0;i<5;i++){
        graphics.fillTriangle(cx-82*s, cy+15*s+i*12*s+clawSwing, cx-105*s, cy+10*s+i*12*s+clawSwing, cx-82*s, cy+27*s+i*12*s+clawSwing);
        graphics.fillTriangle(cx+82*s, cy+15*s+i*12*s-clawSwing, cx+105*s, cy+10*s+i*12*s-clawSwing, cx+82*s, cy+27*s+i*12*s-clawSwing);
      }
      break;
    }
    case 'esfinge': {
      const glyphPulse = 0.4+0.4*Math.abs(Math.sin(tick*0.07));
      const tailFlick = Math.sin(tick*0.09)*15;
      const eyeBlink = tick%120 < 5 ? 0.1 : 1; // parpadeo cada ~6s
      const headTilt = Math.sin(tick*0.025)*3;
      // Aura dorada pulsante
      graphics.fillStyle(0x8b6b00, 0.15+0.08*Math.sin(tick*0.05));
      graphics.fillCircle(cx, cy+20*s, 120*s);
      // Cola animada (sobresale atrás)
      graphics.fillStyle(color, 1);
      graphics.fillTriangle(cx+62*s, cy+45*s, cx+110*s, cy+30*s+tailFlick, cx+90*s, cy+65*s);
      graphics.fillTriangle(cx+90*s, cy+55*s, cx+115*s, cy+55*s+tailFlick, cx+100*s, cy+70*s);
      // Pedestal con textura animada
      graphics.fillStyle(0x6b4b00, 1);
      graphics.fillRect(cx-70*s, cy+15*s, 140*s, 65*s);
      graphics.fillStyle(0xb8860b, 1);
      graphics.fillRect(cx-62*s, cy+18*s, 124*s, 58*s);
      // Grietas del pedestal con pulso
      graphics.lineStyle(1.5, 0x4a3000, 0.5+0.3*Math.sin(tick*0.06));
      graphics.lineBetween(cx-40*s, cy+18*s, cx-35*s, cy+76*s);
      graphics.lineBetween(cx+30*s, cy+25*s, cx+40*s, cy+70*s);
      // Cuerpo de animal (cuerpo de león detrás)
      graphics.fillStyle(color, 0.85);
      graphics.fillEllipse(cx+30*s, cy+38*s, 80*s, 40*s);
      // Patas delanteras
      graphics.fillStyle(color, 1);
      graphics.fillRect(cx-60*s, cy+55*s, 22*s, 25*s);
      graphics.fillRect(cx-25*s, cy+55*s, 22*s, 25*s);
      // Garras de pata (animadas)
      graphics.fillStyle(0x1a1a1a, 1);
      for(let i=0;i<3;i++){
        graphics.fillTriangle(cx-60*s+i*7*s, cy+78*s, cx-58*s+i*7*s, cy+92*s+Math.sin(tick*0.08)*3, cx-56*s+i*7*s, cy+78*s);
        graphics.fillTriangle(cx-25*s+i*7*s, cy+78*s, cx-23*s+i*7*s, cy+92*s+Math.sin(tick*0.08+1)*3, cx-21*s+i*7*s, cy+78*s);
      }
      // Rostro (con leve movimiento de cabeza)
      graphics.fillStyle(color, 1);
      graphics.fillCircle(cx+headTilt, cy-10*s, 50*s);
      graphics.fillStyle(0x8b6b0c, 1);
      graphics.fillRect(cx-50*s+headTilt, cy-10*s, 100*s, 25*s);
      // Nemes (tocado egipcio)
      graphics.fillStyle(0x1a4080, 1);
      graphics.fillTriangle(cx-55*s+headTilt, cy-5*s, cx-62*s+headTilt, cy+22*s, cx-35*s+headTilt, cy+5*s);
      graphics.fillTriangle(cx+55*s+headTilt, cy-5*s, cx+62*s+headTilt, cy+22*s, cx+35*s+headTilt, cy+5*s);
      graphics.lineStyle(2, 0xffd700, 1);
      graphics.lineBetween(cx-52*s+headTilt, cy-5*s, cx-59*s+headTilt, cy+18*s);
      graphics.lineBetween(cx+52*s+headTilt, cy-5*s, cx+59*s+headTilt, cy+18*s);
      // Cuernos de carnero
      graphics.fillStyle(0x3a2800, 1);
      graphics.fillCircle(cx-45*s+headTilt, cy-35*s, 10*s);
      graphics.fillCircle(cx-35*s+headTilt, cy-45*s, 8*s);
      graphics.fillCircle(cx+45*s+headTilt, cy-35*s, 10*s);
      graphics.fillCircle(cx+35*s+headTilt, cy-45*s, 8*s);
      // Ojos con parpadeo y pulso maligno
      graphics.fillStyle(0xff0000, evilPulse*eyeBlink);
      graphics.fillEllipse(cx-17*s+headTilt, cy-15*s, 14*s, 7*s*eyeBlink);
      graphics.fillEllipse(cx+17*s+headTilt, cy-15*s, 14*s, 7*s*eyeBlink);
      graphics.fillStyle(0x000000, 1);
      graphics.fillCircle(cx-17*s+headTilt, cy-15*s, 3*s);
      graphics.fillCircle(cx+17*s+headTilt, cy-15*s, 3*s);
      // Kohl animado
      graphics.lineStyle(2, 0x000000);
      graphics.lineBetween(cx-24*s+headTilt, cy-18*s, cx-36*s+headTilt, cy-23*s);
      graphics.lineBetween(cx+24*s+headTilt, cy-18*s, cx+36*s+headTilt, cy-23*s);
      // Boca con colmillos
      graphics.fillStyle(0x000000, 1);
      graphics.fillEllipse(cx+headTilt, cy+3*s, 22*s, 8*s);
      graphics.fillStyle(0xffffff, 1);
      graphics.fillTriangle(cx-8*s+headTilt, cy, cx-6*s+headTilt, cy+10*s, cx-4*s+headTilt, cy);
      graphics.fillTriangle(cx+4*s+headTilt, cy, cx+6*s+headTilt, cy+10*s, cx+8*s+headTilt, cy);
      // Símbolos del pedestal pulsantes
      graphics.lineStyle(3, 0xffd700, glyphPulse);
      graphics.lineBetween(cx-45*s, cy+30*s, cx-28*s, cy+58*s);
      graphics.lineBetween(cx-45*s, cy+58*s, cx-28*s, cy+30*s);
      graphics.lineBetween(cx-5*s, cy+30*s, cx+18*s, cy+30*s);
      graphics.lineBetween(cx-5*s, cy+30*s, cx+6*s, cy+44*s);
      graphics.lineBetween(cx+6*s, cy+44*s, cx-5*s, cy+58*s);
      graphics.lineBetween(cx-5*s, cy+58*s, cx+18*s, cy+58*s);
      graphics.lineBetween(cx+32*s, cy+30*s, cx+32*s, cy+62*s);
      graphics.lineBetween(cx+32*s, cy+58*s, cx+48*s, cy+58*s);
      graphics.lineBetween(cx+48*s, cy+30*s, cx+48*s, cy+58*s);
      // Partículas de arena alrededor del pedestal
      for(let i=0;i<6;i++){
        const sandPhase=(tick*0.04+i*1.05)%(Math.PI*2);
        const sandX=cx-70*s+i*28*s+Math.sin(sandPhase)*5;
        const sandY=cy+78*s-Math.abs(Math.sin(sandPhase))*12;
        graphics.fillStyle(0xffd700, 0.4);
        graphics.fillCircle(sandX, sandY, 2*s);
      }
      break;
    }
    case 'demiurgo': {
      const rot1 = tick*0.02, rot2 = -tick*0.015, rot3 = tick*0.035;
      const nova = Math.abs(Math.sin(tick*0.04));
      const eyeDilate = 0.5+0.5*Math.abs(Math.sin(tick*0.06));
      // Aura cósmica multicapa pulsante
      for(let i=0;i<5;i++){
        graphics.fillStyle(0xff0000, (0.22-i*0.04)*nova);
        graphics.fillCircle(cx, cy, (135-i*22)*s);
      }
      // Nebulosa de fondo
      graphics.fillStyle(0x220044, 0.3);
      graphics.fillEllipse(cx, cy, 250*s, 200*s);
      // Órbitas con rotación real
      graphics.lineStyle(1.5, 0xffd700, 0.5+0.2*Math.sin(tick*0.06));
      graphics.strokeEllipse(cx, cy, 200*s, 70*s);
      graphics.lineStyle(1.5, 0xff4400, 0.4);
      graphics.strokeEllipse(cx, cy, 180*s, 160*s);
      // 4 planetas orbitando (estela)
      for(let i=0;i<4;i++){
        const a=rot1+i*Math.PI/2;
        const px=cx+95*s*Math.cos(a), py=cy+32*s*Math.sin(a);
        // Estela del planeta
        for(let t=1;t<=4;t++){
          const pa=a-t*0.18;
          const ppx=cx+95*s*Math.cos(pa), ppy=cy+32*s*Math.sin(pa);
          graphics.fillStyle([0x3498db,0xe67e22,0x27ae60,0x9b59b6][i], 0.25-t*0.05);
          graphics.fillCircle(ppx, ppy, (9-t)*s);
        }
        graphics.fillStyle([0x3498db,0xe67e22,0x27ae60,0x9b59b6][i], 1);
        graphics.fillCircle(px, py, 10*s);
        graphics.fillStyle(0x000000, 0.4);
        graphics.fillCircle(px-2*s, py-2*s, 3*s);
      }
      // Estrella de 10 puntas exterior (gira)
      graphics.fillStyle(0xff2e2e, 1);
      const r=62*s;
      graphics.beginPath();
      for(let i=0;i<10;i++){
        const ang=rot3+i*Math.PI/5;
        const rad=(i%2===0)?r:r*0.48;
        const x=cx+rad*Math.cos(ang), y=cy+rad*Math.sin(ang);
        if(i===0) graphics.moveTo(x,y); else graphics.lineTo(x,y);
      }
      graphics.closePath(); graphics.fillPath();
      // Estrella interior contra-rotante
      graphics.fillStyle(0x4a0000, 1);
      const r2=43*s;
      graphics.beginPath();
      for(let i=0;i<10;i++){
        const ang=rot2+i*Math.PI/5+Math.PI/10;
        const rad=(i%2===0)?r2:r2*0.5;
        const x=cx+rad*Math.cos(ang), y=cy+rad*Math.sin(ang);
        if(i===0) graphics.moveTo(x,y); else graphics.lineTo(x,y);
      }
      graphics.closePath(); graphics.fillPath();
      // Cuernos demoníacos
      graphics.fillStyle(0x1a0000, 1);
      graphics.fillTriangle(cx-36*s, cy-52*s, cx-58*s, cy-98*s, cx-21*s, cy-54*s);
      graphics.fillTriangle(cx+36*s, cy-52*s, cx+58*s, cy-98*s, cx+21*s, cy-54*s);
      // Energía en los cuernos
      graphics.lineStyle(2, 0xff4400, 0.4+0.4*Math.abs(Math.sin(tick*0.08)));
      graphics.lineBetween(cx-42*s, cy-62*s, cx-52*s, cy-88*s);
      graphics.lineBetween(cx+42*s, cy-62*s, cx+52*s, cy-88*s);
      // Corazón
      graphics.fillStyle(0xffd700, 1);
      graphics.fillCircle(cx, cy, 24*s);
      graphics.fillStyle(0xff2e2e, 1);
      graphics.fillCircle(cx, cy, 14*s);
      // Ojo central con dilatación
      graphics.fillStyle(0x000000, 1);
      graphics.fillCircle(cx, cy, 7*s);
      graphics.fillStyle(0xffffff, eyeDilate);
      graphics.fillCircle(cx, cy, 3*s);
      // Colmillos
      graphics.fillStyle(0xffffff, 1);
      graphics.fillTriangle(cx-11*s, cy+20*s, cx-8*s, cy+40*s, cx-5*s, cy+20*s);
      graphics.fillTriangle(cx+5*s, cy+20*s, cx+8*s, cy+40*s, cx+11*s, cy+20*s);
      // Tentáculos cósmicos giratorios
      for(let i=0;i<8;i++){
        const a=rot1*2+i*Math.PI/4;
        const r1t=65*s, r3t=(115+Math.sin(tick*0.04+i*0.7)*12)*s;
        const x1=cx+r1t*Math.cos(a), y1=cy+r1t*Math.sin(a);
        const x3=cx+r3t*Math.cos(a), y3=cy+r3t*Math.sin(a);
        const alpha=0.5+0.4*Math.sin(tick*0.06+i);
        graphics.lineStyle(3+Math.sin(tick*0.05+i)*1.5, i%2===0?0x9b59b6:0xff4400, alpha);
        graphics.lineBetween(x1, y1, x3, y3);
        // Punta de tentáculo
        graphics.fillStyle(i%2===0?0x9b59b6:0xff4400, alpha);
        graphics.fillCircle(x3, y3, 5*s);
      }
      // Flash de nova cada cierto tiempo
      if(tick%80<8){
        graphics.fillStyle(0xffffff, 0.05*(8-(tick%80)));
        graphics.fillCircle(cx, cy, 140*s);
      }
      break;
    }
  }
}
