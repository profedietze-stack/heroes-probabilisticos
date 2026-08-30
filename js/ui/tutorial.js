/* ══════════════════════════════════════
   tutorial.js — Tutorial guiado de la primera batalla
   Secuencia de tooltips DOM sobre el canvas. Aparece una sola vez
   (flag en localStorage). El jugador avanza con "Siguiente".
══════════════════════════════════════ */

const TUTORIAL_KEY = 'heroesProb_tutorialVisto';

function tutorialVisto(){
  try{ return !!localStorage.getItem(TUTORIAL_KEY); }catch(e){ return true; }
}

/* Pasos: pos = posición del cartel en % del contenedor del juego */
const _TUT_STEPS = [
  {
    emoji:'👹', titulo:'Tu enemigo',
    texto:'Este es el monstruo. Arriba ves su <b>HP</b> y su <b>UMBRAL</b>: el número que tu tirada debe alcanzar para golpearlo.',
    pos:{ top:'18%', left:'50%' }
  },
  {
    emoji:'🎯', titulo:'Tu probabilidad real',
    texto:'Esta línea muestra tu <b>probabilidad de impacto exacta</b>: casos favorables sobre 144 combinaciones posibles de los dos dados. ¡Es la Probabilidad de Laplace en acción!',
    pos:{ top:'44%', left:'50%' }
  },
  {
    emoji:'🎲', titulo:'Tirá los dados',
    texto:'Tocá los dados para tirar <b>2d12</b>. Si tu suma (más tu ataque) alcanza el umbral, golpeás. Después el monstruo tira los suyos.',
    pos:{ top:'62%', left:'50%' }
  },
  {
    emoji:'🔮', titulo:'Predecí y aprendé',
    texto:'Antes de tirar podés <b>predecir</b> si tu suma será ≥13 o ≤12. Acertar da oro extra. Pista: ≥13 pasa el 54% de las veces.',
    pos:{ top:'70%', left:'50%' }
  },
  {
    emoji:'📖', titulo:'Todo lo demás',
    texto:'Objetos, poderes y mejoras viven en tu <b>bolsa</b> y tu <b>Grimorio</b> (en el mapa). ¡Que el azar te acompañe!',
    pos:{ top:'40%', left:'50%' }
  },
];

function startBattleTutorial(){
  if (tutorialVisto()) return;

  const host = document.getElementById('phaserGame') || document.body;
  let idx = 0;

  const overlay = document.createElement('div');
  overlay.id = '__tutOverlay';
  overlay.style.cssText = 'position:absolute;inset:0;z-index:9000;background:rgba(4,4,8,.55);pointer-events:auto;';
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.appendChild(overlay);

  const card = document.createElement('div');
  card.style.cssText = [
    'position:absolute', 'transform:translate(-50%,-50%)',
    'max-width:400px', 'width:86%',
    'max-height:92%', 'overflow-y:auto',
    'background:linear-gradient(165deg,#171320,#0e0b14)',
    'border:1px solid rgba(212,175,55,.55)', 'border-radius:10px',
    'padding:16px 18px 14px', 'text-align:center',
    'box-shadow:0 8px 40px rgba(0,0,0,.8), 0 0 24px rgba(212,175,55,.12)',
    'font-family:Poppins,sans-serif',
  ].join(';');
  overlay.appendChild(card);

  /* Los pasos posicionan la tarjeta en porcentajes pensados para pantalla alta.
     En landscape de celular (~360-430px de alto) el 18% menos media tarjeta cae
     fuera de la pantalla y el primer paso aparece cortado arriba. Se reajusta
     el centro para que la tarjeta entre entera, con un margen mínimo. */
  function encuadrar(){
    const H = overlay.clientHeight;
    const h = card.offsetHeight;
    const margen = 8;
    let centro = (parseFloat(card.style.top) / 100) * H;
    const min = margen + h / 2, max = H - margen - h / 2;
    centro = (min > max) ? H / 2 : Math.min(Math.max(centro, min), max);
    card.style.top = Math.round(centro) + 'px';
  }

  function render(){
    const s = _TUT_STEPS[idx];
    card.style.top  = s.pos.top;
    card.style.left = s.pos.left;
    card.innerHTML = `
      <div style="font-size:30px;margin-bottom:4px">${s.emoji}</div>
      <div style="font-family:Cinzel,serif;color:#D4AF37;font-size:15px;font-weight:700;letter-spacing:1px;margin-bottom:8px">${s.titulo}</div>
      <p style="color:#c8d0dc;font-size:12.5px;line-height:1.55;margin:0 0 14px">${s.texto}</p>
      <div style="display:flex;justify-content:center;gap:10px;align-items:center">
        <span style="color:#4a5568;font-size:10px;font-family:Cinzel,serif;letter-spacing:2px">${idx+1} / ${_TUT_STEPS.length}</span>
        <button id="__tutNext" style="background:linear-gradient(135deg,#2A2010,#1A1408);color:#D4AF37;border:1px solid rgba(212,175,55,.5);
                border-radius:5px;padding:6px 18px;font-family:Cinzel,serif;font-size:12px;font-weight:700;cursor:pointer">
          ${idx < _TUT_STEPS.length-1 ? 'Siguiente ▷' : '⚔ ¡A pelear!'}
        </button>
        ${idx < _TUT_STEPS.length-1
          ? '<button id="__tutSkip" style="background:none;border:none;color:#4a5568;font-size:10px;cursor:pointer;font-family:Poppins,sans-serif">saltar</button>'
          : ''}
      </div>`;
    encuadrar();
    card.querySelector('#__tutNext').onclick = () => {
      if (typeof snd_item === 'function') snd_item();
      idx++;
      if (idx >= _TUT_STEPS.length) finish(); else render();
    };
    const skip = card.querySelector('#__tutSkip');
    if (skip) skip.onclick = finish;
  }

  function finish(){
    try{ localStorage.setItem(TUTORIAL_KEY, '1'); }catch(e){}
    window.removeEventListener('resize', encuadrar);
    overlay.remove();
  }

  window.addEventListener('resize', encuadrar);
  render();
}
