/* ══════════════════════════════════════
   map-events.js — Eventos aleatorios del mapa
   Al llegar a un nodo nuevo hay EVENT_CHANCE de que aparezca un evento
   con probabilidad EXPLÍCITA: el jugador ve las chances antes de decidir
   si arriesga o sigue de largo. Refuerza la noción de riesgo/recompensa.
   Se dispara una sola vez por nodo (STATE.eventoNodo persiste en el save).
══════════════════════════════════════ */

const EVENT_CHANCE = 0.40;

const MAP_EVENTS = [
  {
    id:'cofre', emoji:'🎁', titulo:'Cofre del Azar',
    desc:'Encontrás un cofre polvoriento entre los escombros. Podría contener oro… o una trampa de dardos.',
    pExito:0.60,
    exitoTxt:()=>{ const oro=20+Math.floor(Math.random()*21); STATE.oro=(STATE.oro||0)+oro; return `¡El cofre contenía <b>${oro} de oro</b>!`; },
    falloTxt:()=>{ const d=Math.min(10, Math.max(0,STATE.hp-1)); STATE.hp-=d; return `¡Trampa! Los dardos te quitan <b>${d} HP</b>.`; },
    exitoLabel:'ganar 20–40 de oro', falloLabel:'trampa: perdés 10 HP'
  },
  {
    id:'fuente', emoji:'⛲', titulo:'Fuente Misteriosa',
    desc:'Una fuente de aguas brillantes murmura en la penumbra. Beber podría sanarte… o enfermarte.',
    pExito:0.70,
    exitoTxt:()=>{ const c=Math.min(15, STATE.hpMax-STATE.hp); STATE.hp+=c; return `El agua es pura: recuperás <b>${c} HP</b>.`; },
    falloTxt:()=>{ const d=Math.min(5, Math.max(0,STATE.hp-1)); STATE.hp-=d; return `El agua estaba corrupta: perdés <b>${d} HP</b>.`; },
    exitoLabel:'curás 15 HP', falloLabel:'perdés 5 HP'
  },
  {
    id:'apostador', emoji:'🎩', titulo:'El Viajero Apostador',
    desc:'"Doblá o nada", sonríe el viajero agitando una moneda. Apostás 15 de oro: si sale cara, te devuelve el doble.',
    pExito:0.50,
    requiere:()=> (STATE.oro||0) >= 15,
    exitoTxt:()=>{ STATE.oro=(STATE.oro||0)+15; return `¡Cara! El viajero te paga: <b>+15 de oro</b>.`; },
    falloTxt:()=>{ STATE.oro=Math.max(0,(STATE.oro||0)-15); return `Ceca. El viajero se guarda tus <b>15 de oro</b> riendo.`; },
    exitoLabel:'ganás 15 de oro', falloLabel:'perdés 15 de oro'
  },
  {
    id:'pergamino', emoji:'📜', titulo:'Pergamino Antiguo',
    desc:'Un pergamino cubierto de fórmulas ilegibles. Descifrarlo lleva tiempo y podría no valer nada.',
    pExito:0.40,
    exitoTxt:()=>{ STATE.xp=(STATE.xp||0)+15; STATE.xpTotal=(STATE.xpTotal||0)+15; return `¡Era un teorema perdido de Laplace! Ganás <b>15 XP</b>.`; },
    falloTxt:()=>`Era la lista de compras de un golem. No ganás nada.`,
    exitoLabel:'ganás 15 XP', falloLabel:'no pasa nada'
  },
];

/* ── Preguntas de sabiduría: quiz conceptual con recompensa ── */
const QUIZ_SABIDURIA = [
  { q:'Con dos dados de 12 caras, ¿qué suma es más probable?',
    ops:['13','2','24'], ok:0,
    exp:'La suma 13 tiene 12 combinaciones de 144. Las sumas extremas (2 y 24) tienen solo 1 cada una.' },
  { q:'Tiraste 5 veces y salió suma baja. ¿Qué pasa en la próxima tirada?',
    ops:['Es más probable que salga alta, "ya me toca"','La probabilidad es la misma de siempre','Es más probable que salga baja, "estoy frío"'], ok:1,
    exp:'Los dados no tienen memoria: cada tirada es independiente. Creer que "ya toca" es la famosa falacia del apostador.' },
  { q:'¿Qué significa que P(éxito) = 25%?',
    ops:['Cada 4 intentos, exactamente 1 sale bien','De muchos intentos, aproximadamente 1 de cada 4 sale bien','Después de 3 fallos, el 4to sale seguro'], ok:1,
    exp:'La probabilidad describe la frecuencia a largo plazo, no garantiza patrones exactos en pocos intentos.' },
  { q:'La media del 2d12 es 13. ¿Eso significa que…?',
    ops:['13 sale casi siempre','El promedio de muchas tiradas se acerca a 13','Nunca sale menos de 13'], ok:1,
    exp:'La esperanza es el promedio a largo plazo. 13 es la suma MÁS probable, pero sale solo el 8.3% de las veces.' },
  { q:'¿Cuántas combinaciones posibles hay al tirar 2d12?',
    ops:['24','144','12'], ok:1,
    exp:'12 caras × 12 caras = 144 combinaciones, todas igualmente probables. Base de la Probabilidad de Laplace.' },
  { q:'¿Qué es más probable: sacar suma 2, o sacar suma 24?',
    ops:['Suma 2','Suma 24','Son igual de probables'], ok:2,
    exp:'Ambas tienen exactamente 1 combinación (1+1 y 12+12): 1/144 cada una. La distribución del 2d12 es simétrica.' },
  { q:'Si repetís un experimento miles de veces, tus frecuencias…',
    ops:['Se acercan a las probabilidades teóricas','Se vuelven impredecibles','Siempre dan exactamente la teoría'], ok:0,
    exp:'Ley de los Grandes Números: a más repeticiones, más se parece lo observado a lo teórico (sin ser nunca exacto).' },
  { q:'Un evento con probabilidad 1/144 (como la Maldición del Doble 1)…',
    ops:['No puede pasarte dos veces seguidas','Puede pasar en cualquier tirada, incluso dos seguidas','Solo pasa una vez por partida'], ok:1,
    exp:'Raro no significa imposible: cada tirada tiene la misma probabilidad 1/144, sin importar el pasado.' },
  { q:'¿Qué mide la varianza?',
    ops:['El valor más frecuente','Cuánto se dispersan los resultados alrededor de la media','El valor máximo posible'], ok:1,
    exp:'Varianza alta = resultados muy dispersos e impredecibles; varianza baja = resultados concentrados cerca de la media.' },
  { q:'P(suma ≥ 13) ≈ 54%. En 100 tiradas, ¿cuántas esperás que lleguen a 13?',
    ops:['Exactamente 54','Alrededor de 54, con variación normal','Al menos 54 garantizadas'], ok:1,
    exp:'La probabilidad da el valor esperado, no una garantía: podés obtener 48 o 60 sin que nada raro pase.' },
];
const QUIZ_CADA_NODOS = 3; // un quiz garantizado cada 3 nodos

/* Llama al llegar al mapa. Devuelve true si mostró un evento. */
function maybeMapEvent(){
  if (typeof STATE === 'undefined' || typeof openItemModal !== 'function') return false;
  const nodo = STATE.nodeActual || 0;
  if (nodo === 0) return false;                    // sin eventos antes del primer desafío
  if (STATE.eventoNodo === nodo) return false;     // ya se tiró el evento en este nodo
  STATE.eventoNodo = nodo;
  if (typeof saveGame === 'function') saveGame();

  // Cada QUIZ_CADA_NODOS nodos: pregunta de sabiduría garantizada
  if (nodo % QUIZ_CADA_NODOS === 0) {
    const hechas = STATE.quizHechas || [];
    const pendientes = QUIZ_SABIDURIA.map((_,i)=>i).filter(i => !hechas.includes(i));
    const pool = pendientes.length ? pendientes : QUIZ_SABIDURIA.map((_,i)=>i);
    const qi = pool[Math.floor(Math.random()*pool.length)];
    STATE.quizHechas = pendientes.length ? [...hechas, qi] : [qi];
    _showQuiz(QUIZ_SABIDURIA[qi]);
    return true;
  }

  if (Math.random() >= EVENT_CHANCE) return false;

  const candidatos = MAP_EVENTS.filter(ev => !ev.requiere || ev.requiere());
  if (!candidatos.length) return false;
  const ev = candidatos[Math.floor(Math.random() * candidatos.length)];
  _showMapEvent(ev);
  return true;
}

function _showQuiz(quiz){
  // Barajar opciones manteniendo cuál es la correcta
  const orden = quiz.ops.map((_,i)=>i).sort(()=>Math.random()-0.5);

  window.__quizResp = (elegida) => {
    const acerto = elegida === quiz.ok;
    if (acerto) {
      STATE.xp      = (STATE.xp||0) + 12;
      STATE.xpTotal = (STATE.xpTotal||0) + 12;
      STATE.oro     = (STATE.oro||0) + 8;
      if (typeof snd_victory === 'function') snd_victory();
      if (typeof logrosEvent === 'function') logrosEvent('quizCorrecta', { qi: QUIZ_SABIDURIA.indexOf(quiz) });
    } else if (typeof snd_fail === 'function') snd_fail();
    if (typeof saveGame === 'function') saveGame();

    openItemModal(`
      <div style="padding:14px;text-align:center;max-width:460px;margin:0 auto">
        <div style="font-size:38px;margin-bottom:6px">${acerto ? '🏆' : '📖'}</div>
        <h3 style="color:${acerto ? '#5fcf88' : '#e0a050'};font-family:'Cinzel',serif;font-size:16px;letter-spacing:1px;margin-bottom:10px">
          ${acerto ? '¡Correcto! +12 XP · +8 oro' : 'No exactamente…'}
        </h3>
        <p style="color:#c8d0dc;font-family:'Lora',serif;font-size:13px;line-height:1.55;margin-bottom:8px">
          La respuesta era: <b style="color:#D4AF37">${quiz.ops[quiz.ok]}</b>
        </p>
        <div style="background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.25);border-radius:6px;padding:10px 12px;margin-bottom:14px">
          <p style="margin:0;color:#9ab0c0;font-family:'Poppins',sans-serif;font-size:11.5px;line-height:1.55">${quiz.exp}</p>
        </div>
        <button class="btn-action" onclick="closeItemModal()">Continuar</button>
      </div>`);
  };

  const botones = orden.map(i => `
    <button onclick="window.__quizResp(${i})" class="btn-action btn-secondary"
      style="display:block;width:100%;margin-bottom:8px;text-align:left;font-size:12.5px;padding:10px 14px">
      ${quiz.ops[i]}
    </button>`).join('');

  openItemModal(`
    <div style="padding:14px;text-align:center;max-width:460px;margin:0 auto">
      <div style="font-size:36px;margin-bottom:4px">🦉</div>
      <h3 style="color:#D4AF37;font-family:'Cinzel',serif;font-size:15px;letter-spacing:1px;margin-bottom:6px">El Búho de la Sabiduría</h3>
      <p style="color:#8a9ab0;font-family:'Poppins',sans-serif;font-size:10px;margin-bottom:12px">Respondé bien y ganás 12 XP + 8 oro. Equivocarte no cuesta nada.</p>
      <p style="color:#e8e0d0;font-family:'Lora',serif;font-size:14px;line-height:1.5;margin-bottom:14px"><b>${quiz.q}</b></p>
      ${botones}
    </div>`);
}

function _showMapEvent(ev){
  const pPct  = Math.round(ev.pExito * 100);
  const qPct  = 100 - pPct;

  window.__evAceptar = () => {
    const r  = Math.random();
    const ok = r < ev.pExito;
    const resultado = ok ? ev.exitoTxt() : ev.falloTxt();
    if (typeof saveGame === 'function') saveGame();
    if (typeof snd_diceRoll === 'function') snd_diceRoll();

    openItemModal(`
      <div style="padding:14px;text-align:center;max-width:440px;margin:0 auto">
        <div style="font-size:40px;margin-bottom:6px">${ok ? '✨' : '💥'}</div>
        <h3 style="color:${ok ? '#5fcf88' : '#e07050'};font-family:'Cinzel',serif;font-size:16px;letter-spacing:1px;margin-bottom:10px">
          ${ok ? '¡Éxito!' : 'Mala suerte…'}
        </h3>
        <p style="color:#d0d8e0;font-family:'Lora',serif;font-size:14px;line-height:1.5;margin-bottom:12px">${resultado}</p>
        <div style="background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.25);border-radius:6px;padding:9px 12px;margin-bottom:14px">
          <p style="margin:0;color:#9ab0c0;font-family:'Poppins',sans-serif;font-size:11px;line-height:1.5">
            🎲 El azar sacó <b style="color:#D4AF37">${r.toFixed(2)}</b> — como
            ${r.toFixed(2)} ${ok ? '&lt;' : '≥'} ${ev.pExito.toFixed(2)}, ${ok ? 'ganaste' : 'perdiste'}.
            Con P(éxito) = ${pPct}%, de cada 100 héroes ${ok ? `unos ${pPct} tienen tu suerte` : `${qPct} corren tu misma suerte`}.
          </p>
        </div>
        <button class="btn-action" onclick="closeItemModal()">Continuar</button>
      </div>`);
  };

  openItemModal(`
    <div style="padding:14px;text-align:center;max-width:440px;margin:0 auto">
      <div style="font-size:40px;margin-bottom:6px">${ev.emoji}</div>
      <h3 style="color:#D4AF37;font-family:'Cinzel',serif;font-size:16px;letter-spacing:1px;margin-bottom:10px">${ev.titulo}</h3>
      <p style="color:#d0d8e0;font-family:'Lora',serif;font-size:14px;line-height:1.5;margin-bottom:12px">${ev.desc}</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
        <div style="background:rgba(95,207,136,.1);border:1px solid rgba(95,207,136,.3);border-radius:6px;padding:8px">
          <div style="color:#5fcf88;font-family:'Cinzel',serif;font-size:18px;font-weight:700">${pPct}%</div>
          <div style="color:#9ab0c0;font-family:'Poppins',sans-serif;font-size:10px">${ev.exitoLabel}</div>
        </div>
        <div style="background:rgba(224,112,80,.1);border:1px solid rgba(224,112,80,.3);border-radius:6px;padding:8px">
          <div style="color:#e07050;font-family:'Cinzel',serif;font-size:18px;font-weight:700">${qPct}%</div>
          <div style="color:#9ab0c0;font-family:'Poppins',sans-serif;font-size:10px">${ev.falloLabel}</div>
        </div>
      </div>

      <div style="height:10px;border-radius:5px;overflow:hidden;display:flex;margin-bottom:14px;border:1px solid rgba(255,255,255,.12)">
        <div style="width:${pPct}%;background:linear-gradient(90deg,#3f9f68,#5fcf88)"></div>
        <div style="width:${qPct}%;background:linear-gradient(90deg,#e07050,#a04030)"></div>
      </div>

      <div class="btn-row" style="display:flex;gap:10px;justify-content:center">
        <button class="btn-action btn-secondary" onclick="closeItemModal()">Seguir de largo</button>
        <button class="btn-action" onclick="window.__evAceptar()">🎲 Probar suerte</button>
      </div>
    </div>`);
}
