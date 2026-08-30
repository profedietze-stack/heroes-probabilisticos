let AC = null;
function initAudio(){ if(!AC){ try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } }
function beep(freq,duration,type='sine',vol=0.15){
  if(!AC) return;
  const o=AC.createOscillator(), g=AC.createGain();
  o.type=type; o.frequency.value=freq;
  o.connect(g); g.connect(AC.destination);
  g.gain.setValueAtTime(vol,AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+duration);
  o.start(); o.stop(AC.currentTime+duration);
}
const snd_diceRoll = ()=>{ for(let i=0;i<4;i++) setTimeout(()=>beep(440+i*50,0.08,'square',0.1), i*100); };
const snd_impact = ()=>{
  if(!AC) return;
  const t = AC.currentTime;
  // Sub thump: sine 130→40 Hz, ataque instantáneo, decay corto
  const sub = AC.createOscillator(), subG = AC.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(130, t);
  sub.frequency.exponentialRampToValueAtTime(40, t+0.14);
  sub.connect(subG); subG.connect(AC.destination);
  subG.gain.setValueAtTime(0.75, t);
  subG.gain.exponentialRampToValueAtTime(0.0001, t+0.18);
  sub.start(t); sub.stop(t+0.18);
  // Noise burst: ruido blanco → bandpass 900 Hz → punch de ataque
  const bufLen = AC.sampleRate * 0.14;
  const buf = AC.createBuffer(1, bufLen, AC.sampleRate);
  const d = buf.getChannelData(0);
  for(let i=0;i<bufLen;i++) d[i] = Math.random()*2-1;
  const ns = AC.createBufferSource(); ns.buffer = buf;
  const bp = AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=900; bp.Q.value=0.9;
  const nsG = AC.createGain();
  ns.connect(bp); bp.connect(nsG); nsG.connect(AC.destination);
  nsG.gain.setValueAtTime(0.45, t);
  nsG.gain.exponentialRampToValueAtTime(0.0001, t+0.11);
  ns.start(t); ns.stop(t+0.14);
};
const snd_fail    = ()=>beep(80,0.4,'sawtooth',0.2);
const snd_curse   = ()=>{ if(!AC) return; for(let i=0;i<6;i++) setTimeout(()=>beep(1000+Math.random()*1000,0.08,'sawtooth',0.18),i*60); };
const snd_victory = ()=>{ const n=[523.25,659.25,783.99,1046.5]; n.forEach((f,i)=>setTimeout(()=>beep(f,0.25,'triangle',0.15),i*180)); };
const snd_defeat  = ()=>{ const n=[329.63,293.66,261.63,196]; n.forEach((f,i)=>setTimeout(()=>beep(f,0.35,'sine',0.18),i*280)); };
const snd_item    = ()=>beep(800,0.12,'sine',0.12);
const snd_buff    = ()=>{ beep(523.25,0.25,'triangle',0.15); setTimeout(()=>beep(783.99,0.25,'triangle',0.15),120); };

// Golpe del monstruo al jugador: thud grave y pesado
const snd_monsterHit = ()=>{
  if(!AC) return;
  const t = AC.currentTime;
  // Sub grave: sine 80→22 Hz, lento y pesado
  const sub = AC.createOscillator(), subG = AC.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(80, t);
  sub.frequency.exponentialRampToValueAtTime(22, t+0.28);
  sub.connect(subG); subG.connect(AC.destination);
  subG.gain.setValueAtTime(0.85, t);
  subG.gain.exponentialRampToValueAtTime(0.0001, t+0.32);
  sub.start(t); sub.stop(t+0.32);
  // Noise lowpass: ruido filtrado grave → "cuerpo" del golpe
  const bufLen = AC.sampleRate * 0.28;
  const buf = AC.createBuffer(1, bufLen, AC.sampleRate);
  const d = buf.getChannelData(0);
  for(let i=0;i<bufLen;i++) d[i] = Math.random()*2-1;
  const ns = AC.createBufferSource(); ns.buffer = buf;
  const lp = AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=350;
  const nsG = AC.createGain();
  ns.connect(lp); lp.connect(nsG); nsG.connect(AC.destination);
  nsG.gain.setValueAtTime(0.55, t);
  nsG.gain.exponentialRampToValueAtTime(0.0001, t+0.25);
  ns.start(t); ns.stop(t+0.28);
  // Rumble sawtooth muy grave: sensación de impacto pesado
  const rum = AC.createOscillator(), rumG = AC.createGain();
  rum.type = 'sawtooth';
  rum.frequency.setValueAtTime(52, t);
  rum.frequency.exponentialRampToValueAtTime(28, t+0.38);
  rum.connect(rumG); rumG.connect(AC.destination);
  rumG.gain.setValueAtTime(0.22, t);
  rumG.gain.exponentialRampToValueAtTime(0.0001, t+0.38);
  rum.start(t); rum.stop(t+0.38);
};

// Lanzar poder: barrido mágico ascendente
const snd_power = ()=>{
  if(!AC) return;
  [180,320,560,900].forEach((f,i)=>setTimeout(()=>beep(f,0.18,'sine',0.13),i*65));
  setTimeout(()=>beep(720,0.28,'triangle',0.12),260);
};

// Curación: arpegio suave ascendente
const snd_heal = ()=>{
  [523.25,659.25,880,1046.5,1318.5].forEach((f,i)=>setTimeout(()=>beep(f,0.18,'sine',0.09),i*70));
};

// Golpe crítico (corona / llave / gema): slam dramático
const snd_critical = ()=>{
  if(!AC) return;
  beep(90,0.12,'sawtooth',0.28);
  setTimeout(()=>{
    const o=AC.createOscillator(), g=AC.createGain();
    o.type='sawtooth'; o.frequency.setValueAtTime(900,AC.currentTime);
    o.frequency.exponentialRampToValueAtTime(180,AC.currentTime+0.55);
    o.connect(g); g.connect(AC.destination);
    g.gain.setValueAtTime(0.28,AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+0.55);
    o.start(); o.stop(AC.currentTime+0.55);
  },70);
  setTimeout(()=>beep(1400,0.12,'triangle',0.1),180);
};

// Congelación / efectos de hielo: notas cristalinas descendentes
const snd_freeze = ()=>{
  [1400,1100,880,660,440].forEach((f,i)=>setTimeout(()=>beep(f,0.14,'triangle',0.1),i*60));
};

// XP / oro ganado: chime corto
const snd_xp = ()=>{ beep(880,0.1,'sine',0.1); setTimeout(()=>beep(1108,0.12,'sine',0.1),95); setTimeout(()=>beep(1318,0.15,'sine',0.1),190); };

// ── Sonidos de golpe por clase de héroe ──────────────────────────────────────

// Guerrero: tajo metálico — ruido agudo en bandpass alto + "shink" descendente
const snd_hit_guerrero = ()=>{
  if(!AC) return;
  const t = AC.currentTime;
  const bufLen = AC.sampleRate * 0.1;
  const buf = AC.createBuffer(1, bufLen, AC.sampleRate);
  const d = buf.getChannelData(0);
  for(let i=0;i<bufLen;i++) d[i] = Math.random()*2-1;
  const ns = AC.createBufferSource(); ns.buffer = buf;
  const bp = AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=3200; bp.Q.value=1.4;
  const nsG = AC.createGain();
  ns.connect(bp); bp.connect(nsG); nsG.connect(AC.destination);
  nsG.gain.setValueAtTime(0.32, t);
  nsG.gain.exponentialRampToValueAtTime(0.0001, t+0.09);
  ns.start(t); ns.stop(t+0.1);
  const o=AC.createOscillator(), g=AC.createGain();
  o.type='triangle'; o.frequency.setValueAtTime(2600, t);
  o.frequency.exponentialRampToValueAtTime(600, t+0.16);
  o.connect(g); g.connect(AC.destination);
  g.gain.setValueAtTime(0.16, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t+0.16);
  o.start(t); o.stop(t+0.16);
};

// Hechicero: chispas arcanas — arpegio rápido agudo con shimmer
const snd_hit_hechicero = ()=>{
  if(!AC) return;
  const base = [1200,1500,1900,2400];
  base.forEach((f,i)=>setTimeout(()=>beep(f + Math.random()*80,0.09,'sine',0.11), i*35));
  setTimeout(()=>beep(200,0.22,'triangle',0.14), 10);
};

// Arquero: silbido de flecha (noise sweep) + "thock" seco de impacto
const snd_hit_arquero = ()=>{
  if(!AC) return;
  const t = AC.currentTime;
  const bufLen = AC.sampleRate * 0.16;
  const buf = AC.createBuffer(1, bufLen, AC.sampleRate);
  const d = buf.getChannelData(0);
  for(let i=0;i<bufLen;i++) d[i] = Math.random()*2-1;
  const ns = AC.createBufferSource(); ns.buffer = buf;
  const bp = AC.createBiquadFilter(); bp.type='bandpass';
  bp.frequency.setValueAtTime(2400, t);
  bp.frequency.exponentialRampToValueAtTime(500, t+0.14);
  bp.Q.value = 0.7;
  const nsG = AC.createGain();
  ns.connect(bp); bp.connect(nsG); nsG.connect(AC.destination);
  nsG.gain.setValueAtTime(0.22, t);
  nsG.gain.exponentialRampToValueAtTime(0.0001, t+0.14);
  ns.start(t); ns.stop(t+0.16);
  setTimeout(()=>beep(150,0.08,'square',0.22), 130);
};

// Alquimista: burbuja/splash de poción — noise lowpass corto + "glug" grave
const snd_hit_alquimista = ()=>{
  if(!AC) return;
  const t = AC.currentTime;
  const bufLen = AC.sampleRate * 0.18;
  const buf = AC.createBuffer(1, bufLen, AC.sampleRate);
  const d = buf.getChannelData(0);
  for(let i=0;i<bufLen;i++) d[i] = Math.random()*2-1;
  const ns = AC.createBufferSource(); ns.buffer = buf;
  const lp = AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1200;
  const nsG = AC.createGain();
  ns.connect(lp); lp.connect(nsG); nsG.connect(AC.destination);
  nsG.gain.setValueAtTime(0.28, t);
  nsG.gain.exponentialRampToValueAtTime(0.0001, t+0.16);
  ns.start(t); ns.stop(t+0.18);
  [280,190,240].forEach((f,i)=>setTimeout(()=>beep(f,0.09,'sine',0.13), i*55));
};

const CLASS_HIT_SOUNDS = {
  guerrero: snd_hit_guerrero,
  hechicero: snd_hit_hechicero,
  arquero: snd_hit_arquero,
  alquimista: snd_hit_alquimista
};
function snd_hitClase(clase){
  const fn = CLASS_HIT_SOUNDS[clase];
  if(fn) fn();
}

/* ══════════════════════════════════════
   Ambience — sonido ambiente procedural por escena
   'drip' (mapa: gotas en el calabozo) · 'fire' (hub: fuego crepitando)
   Volumen muy bajo. Music.mute() también lo silencia.
══════════════════════════════════════ */
const Ambience = (()=>{
  let gain = null, current = null, timers = [], noiseSrc = null;

  function ensureGain(){
    if(!AC || gain) return;
    gain = AC.createGain();
    gain.gain.value = 0.5;
    gain.connect(AC.destination);
  }
  function clearTimers(){ timers.forEach(t=>clearTimeout(t)); timers = []; }

  function drip(){
    if(!AC || !gain || current !== 'drip') return;
    // Gota: sine con pitch bend descendente rápido
    const o = AC.createOscillator(), g = AC.createGain();
    const f0 = 900 + Math.random()*1400;
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, AC.currentTime);
    o.frequency.exponentialRampToValueAtTime(f0*0.4, AC.currentTime+0.09);
    o.connect(g); g.connect(gain);
    g.gain.setValueAtTime(0.05 + Math.random()*0.05, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime+0.35);
    o.start(); o.stop(AC.currentTime+0.35);
    // Eco tenue
    if(Math.random() < 0.4){
      const t2 = setTimeout(()=>{
        if(current !== 'drip') return;
        const o2 = AC.createOscillator(), g2 = AC.createGain();
        o2.type='sine'; o2.frequency.value = f0*0.5;
        o2.connect(g2); g2.connect(gain);
        g2.gain.setValueAtTime(0.02, AC.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime+0.5);
        o2.start(); o2.stop(AC.currentTime+0.5);
      }, 180);
      timers.push(t2);
    }
    timers.push(setTimeout(drip, 1200 + Math.random()*3200));
  }

  function fire(){
    if(!AC || !gain || current !== 'fire') return;
    // Lecho de ruido lowpass continuo (crepitar de fondo)
    const bufLen = AC.sampleRate * 2;
    const buf = AC.createBuffer(1, bufLen, AC.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<bufLen;i++) d[i] = (Math.random()*2-1) * (0.4 + 0.6*Math.random());
    noiseSrc = AC.createBufferSource();
    noiseSrc.buffer = buf; noiseSrc.loop = true;
    const lp = AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 420;
    const g = AC.createGain(); g.gain.value = 0.055;
    noiseSrc.connect(lp); lp.connect(g); g.connect(gain);
    noiseSrc.start();
    // Chasquidos aleatorios
    const pop = ()=>{
      if(current !== 'fire') return;
      const o = AC.createOscillator(), pg = AC.createGain();
      o.type='square'; o.frequency.value = 90 + Math.random()*260;
      o.connect(pg); pg.connect(gain);
      pg.gain.setValueAtTime(0.03 + Math.random()*0.04, AC.currentTime);
      pg.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime+0.05);
      o.start(); o.stop(AC.currentTime+0.05);
      timers.push(setTimeout(pop, 150 + Math.random()*700));
    };
    pop();
  }

  return {
    play(name){
      if(!AC) return;
      if(current === name) return;
      this.stop();
      ensureGain();
      current = name;
      if(name === 'drip') drip();
      else if(name === 'fire') fire();
    },
    stop(){
      current = null;
      clearTimers();
      if(noiseSrc){ try{ noiseSrc.stop(); }catch(e){} noiseSrc = null; }
    },
    setVol(v){ if(gain && AC) gain.gain.setTargetAtTime(v, AC.currentTime, 0.1); }
  };
})();

const Music = (()=>{
  let masterGain = null;
  let currentTheme = null;
  let loopTimeout = null;
  let playing = false;
  let _muted = false;
  const VOL = CFG.MUSIC_VOL;

  const N = (midi) => 440 * Math.pow(2, (midi-69)/12);
  const C4=N(60),D4=N(62),E4=N(64),F4=N(65),G4=N(67),A4=N(69),B4=N(71);
  const C5=N(72),D5=N(74),E5=N(76),F5=N(77),G5=N(79),A5=N(81),B5=N(83);
  const C3=N(48),D3=N(50),E3=N(52),G3=N(55),A3=N(57);
  const Fs4=N(66),Bb4=N(70),Ab4=N(68),Eb4=N(63);

  function ensureMaster(){
    if(!AC || masterGain) return;
    masterGain = AC.createGain();
    masterGain.gain.value = VOL;
    masterGain.connect(AC.destination);
  }

  function nota(freq, t, dur, type='square', vol=1){
    if(!AC || !masterGain) return;
    const o = AC.createOscillator();
    const g = AC.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g); g.connect(masterGain);
    const now = AC.currentTime;
    const att = 0.01, rel = Math.min(0.08, dur*0.3);
    g.gain.setValueAtTime(0, now+t);
    g.gain.linearRampToValueAtTime(vol, now+t+att);
    g.gain.setValueAtTime(vol, now+t+dur-rel);
    g.gain.linearRampToValueAtTime(0, now+t+dur);
    o.start(now+t);
    o.stop(now+t+dur+0.01);
  }

  function bajo(freq, t, dur){ nota(freq, t, dur, 'triangle', 0.6); }

  function playMenu(){
    // "Caja de Musica Olvidada" - La menor armonico, lento, misterioso.
    // Celesta sine espaciada + arpegio triangle tenue + bajo suave.
    if(!AC || !masterGain) return;
    const B = 0.7;
    const Gs4 = Ab4;        // Sol# = sensible, color misterioso
    const Gs5 = Ab4*2;
    // Melodia principal (celesta), notas largas y con silencios
    const mel = [
      [A4, 0*B, 2*B],   [C5, 2*B, 1*B],  [B4, 3*B, 1*B],
      [A4, 4*B, 1.5*B], [E4, 5.5*B, 0.5*B], [Gs4, 6*B, 2*B],
      [A4, 8*B, 1*B],   [B4, 9*B, 1*B],  [C5, 10*B, 2*B],
      [E5, 12*B, 1.5*B],[D5, 13.5*B, 0.5*B], [C5, 14*B, 1*B], [B4, 15*B, 1*B],
      [A4, 16*B, 1*B],  [Gs4, 17*B, 1*B], [A4, 18*B, 1*B], [E4, 19*B, 1*B],
      [A4, 20*B, 4*B],
    ];
    mel.forEach(([f,t,d])=>nota(f,t,d,'sine',0.85));
    // Arpegio de fondo, suave (Am - E - Am ...)
    const arp = [
      [A3,0,B*0.45],[E4,B*0.5,B*0.45],[A4,B,B*0.45],[C5,B*1.5,B*0.45],
      [A3,2*B,B*0.45],[E4,2*B+B*0.5,B*0.45],[A4,3*B,B*0.45],[C5,3*B+B*0.5,B*0.45],
      [E3,4*B,B*0.45],[E4,4*B+B*0.5,B*0.45],[Gs4,5*B,B*0.45],[B4,5*B+B*0.5,B*0.45],
      [E3,6*B,B*0.45],[E4,6*B+B*0.5,B*0.45],[Gs4,7*B,B*0.45],[B4,7*B+B*0.5,B*0.45],
      [A3,8*B,B*0.45],[E4,8*B+B*0.5,B*0.45],[A4,9*B,B*0.45],[C5,9*B+B*0.5,B*0.45],
      [A3,10*B,B*0.45],[E4,10*B+B*0.5,B*0.45],[A4,11*B,B*0.45],[C5,11*B+B*0.5,B*0.45],
      [D3*2,12*B,B*0.45],[F4,12*B+B*0.5,B*0.45],[A4,13*B,B*0.45],[D5,13*B+B*0.5,B*0.45],
      [E3,14*B,B*0.45],[E4,14*B+B*0.5,B*0.45],[Gs4,15*B,B*0.45],[B4,15*B+B*0.5,B*0.45],
      [A3,16*B,B*0.45],[E4,16*B+B*0.5,B*0.45],[A4,17*B,B*0.45],[C5,17*B+B*0.5,B*0.45],
      [E3,18*B,B*0.45],[E4,18*B+B*0.5,B*0.45],[Gs4,19*B,B*0.45],[B4,19*B+B*0.5,B*0.45],
      [A3,20*B,B*0.45],[E4,20*B+B*0.5,B*0.45],[A4,21*B,B*0.45],[E4,21*B+B*0.5,B*0.45],
    ];
    arp.forEach(([f,t,d])=>nota(f,t,d,'triangle',0.22));
    // Bajo grave, sostenido y tenue
    [[A3*0.5,0,B*3.5],[A3*0.5,4*B,B*3.5],[E3,4*B,B*3.5],
     [A3*0.5,8*B,B*3.5],[D3,12*B,B*1.8],[E3,14*B,B*1.8],
     [A3*0.5,16*B,B*3.5],[E3,18*B,B*1.8],[A3*0.5,20*B,B*3.8]
    ].forEach(([f,t,d])=>bajo(f,t,d));
    return 24*B;
  }

  function playBattle(){
    if(!AC || !masterGain) return;
    const B = 0.28;
    const mel = [
      [A4,0,B*0.8],[A4,B,B*0.8],[C5,2*B,B*1.5],[B4,3.5*B,B*0.4],[Bb4,4*B,B*1.8],
      [A4,6*B,B*0.8],[A4,7*B,B*0.8],[E5,8*B,B*1.5],[D5,9.5*B,B*0.4],[C5,10*B,B*1.8],
      [A4,12*B,B*0.5],[B4,12.5*B,B*0.5],[C5,13*B,B*0.5],[D5,13.5*B,B*0.5],
      [E5,14*B,B*1.5],[D5,15.5*B,B*0.4],[C5,16*B,B*1.8],
      [A4,18*B,B*0.8],[G4,18.8*B,B*0.4],[A4,19.2*B,B*0.6],[E4,20*B,B*3.8],
    ];
    mel.forEach(([f,t,d])=>nota(f,t,d,'square',1));
    const ctp = [
      [E4,0,B*0.6],[E4,B,B*0.6],[G4,2*B,B],[Fs4,3*B,B],[F4,4*B,B*1.5],
      [E4,6*B,B*0.6],[E4,7*B,B*0.6],[B4,8*B,B],[A4,9*B,B],[G4,10*B,B*1.5],
      [E4,12*B,B*0.4],[F4,12.4*B,B*0.4],[G4,12.8*B,B*0.4],[A4,13.2*B,B*0.4],
      [B4,14*B,B],[A4,15*B,B],[G4,16*B,B*1.5],
      [A4,18*B,B*0.6],[G4,19*B,B*0.4],[A4,19.4*B,B*0.4],[E4,20*B,B*3.5],
    ];
    ctp.forEach(([f,t,d])=>nota(f,t,d,'triangle',0.5));
    for(let i=0;i<24;i++){
      nota(A3*0.5, i*B, B*0.15, 'sawtooth', 0.5);
      if(i%2===1) nota(A3*0.35, i*B+B*0.5, B*0.1, 'sawtooth', 0.3);
    }
    [[A3,0,B*1.8],[A3,2*B,B*1.8],[A3,6*B,B*1.8],[A3,8*B,B*1.8],
     [A3,12*B,B*0.8],[G3,13*B,B*0.8],[A3,14*B,B*1.5],[E3,18*B,B*1.8],[A3,20*B,B*3.5]
    ].forEach(([f,t,d])=>bajo(f,t,d));
    return 24*B;
  }

  function playBoss(){
    if(!AC || !masterGain) return;
    const B = 0.25;
    const mel = [
      [D5,0,B*0.7],[C5,B,B*0.7],[B4,2*B,B*0.7],[Bb4,3*B,B*0.7],
      [A4,4*B,B*1.5],[Ab4,5.5*B,B*0.4],[G4,6*B,B*1.8],
      [D5,8*B,B*0.6],[E5,8.6*B,B*0.6],[F5,9.2*B,B*0.6],[E5,10*B,B*0.6],
      [D5,11*B,B*2.8],
      [A4,14*B,B*0.4],[B4,14.4*B,B*0.4],[C5,14.8*B,B*0.4],[D5,15.2*B,B*0.4],
      [Eb4*2,16*B,B*1.2],[D5,17.2*B,B*0.6],[C5,18*B,B*0.5],[B4,18.5*B,B*0.5],
      [A4,19*B,B*4.5],
    ];
    mel.forEach(([f,t,d])=>nota(f,t,d,'sawtooth',0.9));
    const coro = [
      [D4,0,B*3.5],[G3,0,B*3.5],
      [A3,4*B,B*3.5],[E3,4*B,B*3.5],
      [G3,8*B,B*2.8],[B4*0.5,8*B,B*2.8],
      [D4,11*B,B*2.8],[A3,11*B,B*2.8],
      [D4,14*B,B*4.5],[Bb4*0.5,14*B,B*4.5],
    ];
    coro.forEach(([f,t,d])=>nota(f,t,d,'triangle',0.35));
    const drums = [0,2,4,6,8,10,12,14,16,18,20,22];
    drums.forEach(i=>nota(D3*0.3, i*B, B*0.12, 'sawtooth', 0.7));
    [1,3,5,7,9,11,13,15,17,19,21,23].forEach(i=>nota(D3*0.2, i*B+B*0.5, B*0.08, 'sawtooth', 0.4));
    [[D3,0,B*3.5],[A3*0.5,4*B,B*3.5],[G3*0.5,8*B,B*2.8],
     [D3,11*B,B*2.8],[D3,14*B,B*4.5],[D3,19*B,B*4.5]
    ].forEach(([f,t,d])=>bajo(f*0.5,t,d));
    return 24*B;
  }

  function playMapa(){
    // "Pasos en el Calabozo" — Re menor, lento, exploratorio.
    // Arpegio grave espaciado + melodía sine escasa con silencios largos.
    if(!AC || !masterGain) return;
    const B = 0.62;
    const Dm4=N(62), F4b=N(65), A4b=N(69), C5b=N(72), E4b=N(64), Bb3=N(58), G4b=N(67);
    // Melodía esparcida, contemplativa
    const mel = [
      [Dm4, 0*B, 1.5*B], [F4b, 2*B, 1*B],  [E4b, 3*B, 2*B],
      [A4b, 6*B, 1.5*B], [G4b, 8*B, 1*B],  [F4b, 9*B, 2*B],
      [Dm4, 12*B, 1*B],  [E4b, 13*B, 1*B], [F4b, 14*B, 1.5*B], [C5b, 16*B, 2*B],
      [A4b, 19*B, 1*B],  [F4b, 20*B, 1.5*B], [Dm4, 22*B, 2*B],
    ];
    mel.forEach(([f,t,d])=>nota(f,t,d,'sine',0.55));
    // Arpegio de fondo Dm — Bb — F — A, muy tenue
    const arp = [];
    const prog = [[N(50),F4b*0.5,A4b*0.5],[Bb3*0.5,Dm4*0.5,F4b*0.5],[N(53),A4b*0.5,C5b*0.5],[N(45),E4b*0.5,A4b*0.5]];
    prog.forEach((chord,ci)=>{
      for(let rep=0;rep<2;rep++){
        chord.forEach((f,ni)=>{
          arp.push([f, (ci*6+rep*3+ni)*B, B*0.8]);
        });
      }
    });
    arp.forEach(([f,t,d])=>nota(f,t,d,'triangle',0.18));
    // Bajo profundo sostenido
    [[N(38),0,B*5.5],[Bb3*0.25,6*B,B*5.5],[N(41),12*B,B*5.5],[N(33),18*B,B*5.5]]
      .forEach(([f,t,d])=>bajo(f,t,d));
    return 24*B;
  }

  function playPuzzle(){
    // "El Acertijo del Mercader" — Sol mayor, curioso y ligero.
    // Pizzicato triangle saltarín + campanitas sine.
    if(!AC || !masterGain) return;
    const B = 0.34;
    const G4g=N(67), A4g=N(69), B4g=N(71), C5g=N(72), D5g=N(74), E5g=N(76), G5g=N(79), Fs5=N(78), D4g=N(62), E4g=N(64);
    const mel = [
      [G4g,0,B*0.8],[B4g,B,B*0.8],[D5g,2*B,B*0.8],[B4g,3*B,B*0.8],
      [C5g,4*B,B*1.5],[A4g,5.5*B,B*0.5],[B4g,6*B,B*1.8],
      [G4g,8*B,B*0.8],[B4g,9*B,B*0.8],[E5g,10*B,B*0.8],[D5g,11*B,B*0.8],
      [C5g,12*B,B*0.8],[E5g,13*B,B*0.8],[D5g,14*B,B*1.8],
      [G5g,16*B,B*0.8],[Fs5,17*B,B*0.8],[E5g,18*B,B*0.8],[D5g,19*B,B*0.8],
      [C5g,20*B,B*0.8],[B4g,21*B,B*0.8],[A4g,22*B,B*0.8],[G4g,23*B,B*0.9],
    ];
    mel.forEach(([f,t,d])=>nota(f,t,d,'triangle',0.55));
    // Campanitas eco en contratiempo
    [[D5g,1.5*B,B*0.4],[G5g,5*B,B*0.4],[B4g*2,9.5*B,B*0.4],[E5g,13.5*B,B*0.4],[D5g*2,17.5*B,B*0.4],[G5g,21.5*B,B*0.4]]
      .forEach(([f,t,d])=>nota(f,t,d,'sine',0.14));
    // Bajo pizzicato alternante G–D
    for(let i=0;i<12;i++){
      nota(i%4<2 ? N(43) : D4g*0.5, i*2*B, B*0.5, 'triangle', 0.35);
      nota(i%4<2 ? D4g*0.5 : N(45), (i*2+1)*B, B*0.35, 'triangle', 0.22);
    }
    return 24*B;
  }

  const themes = { menu: playMenu, battle: playBattle, boss: playBoss, mapa: playMapa, puzzle: playPuzzle };

  function loopTheme(name){
    if(!playing || currentTheme !== name) return;
    const fn = themes[name];
    if(!fn) return;
    if(masterGain) masterGain.gain.setValueAtTime(masterGain.gain.value, AC.currentTime);
    const duration = fn();
    loopTimeout = setTimeout(()=>loopTheme(name), (duration + 0.05)*1000);
  }

  return {
    play(name){
      if(!AC) return;
      if(currentTheme === name && playing) return;
      this.stop();
      ensureMaster();
      currentTheme = name;
      playing = true;
      if(masterGain){
        masterGain.gain.setValueAtTime(0, AC.currentTime);
        if(!_muted) masterGain.gain.linearRampToValueAtTime(VOL, AC.currentTime+1.5);
      }
      loopTheme(name);
    },
    mute(){ _muted = true; this.setVol(0); if(typeof Ambience!=='undefined') Ambience.setVol(0); },
    unmute(){ _muted = false; this.setVol(VOL); if(typeof Ambience!=='undefined') Ambience.setVol(0.5); },
    isMuted(){ return _muted; },
    stop(){
      playing = false;
      currentTheme = null;
      if(loopTimeout){ clearTimeout(loopTimeout); loopTimeout=null; }
      if(masterGain && AC){
        masterGain.gain.setValueAtTime(masterGain.gain.value, AC.currentTime);
        masterGain.gain.linearRampToValueAtTime(0, AC.currentTime+0.8);
        setTimeout(()=>{
          if(!playing && masterGain){ masterGain.disconnect(); masterGain=null; }
        }, 900);
      }
    },
    setVol(v){
      if(masterGain && AC){
        masterGain.gain.cancelScheduledValues(AC.currentTime);
        masterGain.gain.setValueAtTime(masterGain.gain.value, AC.currentTime);
        masterGain.gain.setTargetAtTime(v, AC.currentTime, 0.1);
      }
    }
  };
})();
