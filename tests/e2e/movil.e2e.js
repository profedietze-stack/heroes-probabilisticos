// Prueba e2e del diseño para teléfono apaisado (812×375). Abre el juego en un Chromium real y:
//   1) recorre TODAS las escenas y exige: botones/zonas táctiles ≥ 44 px, letras ≥ 11 px, sin errores de consola;
//   2) hace el recorrido completo con clics reales: mapa → Mercader → aviso → enigma → respuesta → resultado → mapa.
// Uso:  node tests/e2e/movil.e2e.js        (variables: PLAYWRIGHT=ruta al módulo, ANCHO, ALTO)
const { cargarPlaywright, servir, abrir, partidaNueva, esperar, irA, medir } = require('./lib');

const MIN_TACTIL = 43;   // 44 px con 1 de redondeo
const MIN_LETRA = 11;
const ANCHO = +process.env.ANCHO || 812, ALTO = +process.env.ALTO || 375;

const ESCENAS = [
  ['MapScene', null],
  ['BattleScene', ['BattleScene', {}, 'STATE.jefeActual=0']],
  ['PuzzleScene (Mercader)', ['PuzzleScene', { npc: 'mercader', puzzles: [0, 1], nodeIdx: 0, dificultad: 'normal' }, 'STATE.oro=120']],
  ['PuzzleScene (Oráculo)', ['PuzzleScene', { npc: 'oraculo', puzzles: [4, 5, 6], nodeIdx: 0, dificultad: 'normal' }]],
  ...['Urna', 'Moneda', 'Apuesta', 'Ruleta', 'Dados', 'Puertas', 'Tesoro'].map((n) => [`Puzzle${n}`, [`Puzzle${n}`, { dificultad: 'heroe', modo: 'libre' }]]),
  ['VictoryScene', ['VictoryScene', {}, 'STATE.jefeActual=3;STATE.inventario=[{id:1,cantidad:2},{id:2,cantidad:1}]']],
  ['FinalScene', ['FinalScene', {}, 'STATE.jefeActual=10;STATE.stats.derrotas=3;STATE.resiliencia=3;STATE.stats.objetosUsados={1:12};STATE.stats.tiradas=Array.from({length:30},()=>({valor:13,d1:6,d2:7}))']],
  ['ArcadeHubScene', ['ArcadeHubScene', {}]],
  ['ArcadeScene (selector)', ['ArcadeScene', { mode: 'select' }]],
  ['ArcadeScene (resultado)', ['ArcadeScene', { mode: 'result' }, "ARCADE.dificultad='normal';ARCADE.aciertos=5"]],
  ['LibreScene', ['LibreScene', {}]],
];

// El mapa se acerca al nodo actual con un zoom animado que, en un navegador sin GPU, tarda varios segundos.
const mapaListo = (p) => p.waitForFunction(() => window.game.scene.getScene('MapScene').cameras.main.zoom > 1.3, { timeout: 30000 }).then(() => p.waitForTimeout(500));

(async () => {
  const pw = cargarPlaywright();
  const srv = await servir();
  const fallas = [];
  let sesion;
  try {
    sesion = await abrir(pw, srv.url, { ancho: ANCHO, alto: ALTO });
    const { p, log } = sesion;

    // ── 1. Medición de cada escena ──
    const menu = await medir(p);
    verificar('MenuScene', menu);
    await partidaNueva(p);
    await mapaListo(p);
    for (const [nombre, destino] of ESCENAS) {
      if (destino) await irA(p, ...destino);
      const tam = await p.evaluate(() => [window.game.scale.gameSize.width, window.game.scale.gameSize.height]);
      if (tam[0] !== ANCHO || tam[1] !== ALTO) fallas.push(`${nombre}: el lienzo mide ${tam.join('×')} y no ${ANCHO}×${ALTO} (¿escena sin migrar?)`);
      verificar(nombre, await medir(p));
    }

    // ── 2. Recorrido con clics reales ──
    await partidaNueva(p);
    await mapaListo(p);
    const puerta = await p.evaluate(() => {
      const s = window.game.scene.getScene('MapScene'), c = s.cameras.main, pos = _nodePos(s._cur);
      return { x: (pos.x - c.midPoint.x) * c.zoom + c.width / 2 + c.x, y: (pos.y - c.midPoint.y) * c.zoom + c.height / 2 + c.y };
    });
    await p.mouse.click(puerta.x, puerta.y);
    await esperar(p, 'PuzzleScene');                          // el nodo 0 es el Mercader
    await p.mouse.click(550, 60); await p.waitForTimeout(1200);      // saltar el diálogo
    await p.mouse.click(550, 165); await p.waitForTimeout(1200);     // "Probar mi suerte"
    await p.mouse.click(550, 168); await p.waitForTimeout(1000);     // primer enigma
    const aviso = await p.evaluate(() => document.querySelector('#itemModal').classList.contains('active'));
    if (!aviso) fallas.push('recorrido: no apareció el aviso "Antes de continuar"');
    const btn = await p.evaluate(() => { const b = document.querySelector('#itemModal button.btn-action:not(.btn-secondary)'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    if (btn) {
      await p.mouse.click(btn.x, btn.y);                               // clic REAL de mouse sobre el modal (bug de 2026-10-20)
      await p.waitForFunction(() => !window.game.scene.getScenes(true).some((s) => s.scene.key === 'PuzzleScene'), { timeout: 25000 }).catch(() => {});
      await p.waitForTimeout(3500);
      const enigma = await p.evaluate(() => window.game.scene.getScenes(true).map((s) => s.scene.key).join());
      if (!/^Puzzle(Urna|Moneda)$/.test(enigma)) fallas.push(`recorrido: tras "Continuar" se esperaba un enigma y está ${enigma}`);
      const U = await p.evaluate(() => { const s = window.game.scene.getScenes(true)[0]; return s._pz ? s._pz.Z.ui : null; });
      if (U) {
        await p.mouse.click(U.x + U.w / 4, U.y + U.h - 30); await p.waitForTimeout(2800);   // primera respuesta
        // "Continuar" del resultado: su posición depende del tamaño de pantalla, se busca el botón (el tapiz que cubre todo no cuenta).
        const cont = await p.evaluate(() => { const o = window.game.scene.getScenes(true)[0].input._list.filter((q) => q.input && q.input.enabled && q.visible !== false && q.depth >= 60 && q.input.hitArea.width < 400).pop(); return o ? { x: o.x, y: o.y } : null; });
        if (cont) await p.mouse.click(cont.x, cont.y); else fallas.push('recorrido: no apareció el botón "Continuar" del resultado');
        await p.waitForTimeout(4000);
      } else fallas.push('recorrido: el enigma no tiene zona de respuestas');
    }
    const final = await p.evaluate(() => window.game.scene.getScenes(true).map((s) => s.scene.key).join());
    if (final !== 'MapScene') fallas.push(`recorrido: se esperaba volver al mapa y está ${final}`);

    // ── 3. Apuesta: el medidor de E(X) no marca la respuesta antes de contestar ──
    // Se espera a las condiciones (botones de respuesta ya interactivos, medidor revelado), no a tiempos fijos: con la máquina cargada
    // las animaciones tardan más y un clic temprano se pierde.
    // Al volver al mapa puede salir un evento al azar («Pergamino Antiguo», «Cofre del Azar») con su modal: se cierra, el salto de escena no lo hace.
    await p.evaluate(() => closeItemModal());
    await p.waitForTimeout(300);
    await irA(p, 'PuzzleApuesta', { dificultad: 'normal', modo: 'libre' });
    await p.waitForFunction(() => { const s = window.game.scene.getScenes(true)[0]; return s && s._evTxt && s.input._list.filter((o) => o.input && o.input.enabled && o.scrollFactorX === 0 && o.type === 'Container').length >= 4; }, { timeout: 30000 });
    await p.waitForTimeout(3500);   // pasado el tiempo en que antes se animaba solo (1,2 s + 1,45 s)
    const antes = await p.evaluate(() => window.game.scene.getScenes(true)[0]._evTxt.text);
    if (antes !== 'E(X) = ?') fallas.push('apuesta: el medidor mostró «' + antes + '» antes de contestar (regala la respuesta)');
    const UA = await p.evaluate(() => window.game.scene.getScenes(true)[0]._pz.Z.ui);
    await p.mouse.click(UA.x + UA.w / 4, UA.y + UA.h - 30);
    const revelo = await p.waitForFunction(() => window.game.scene.getScenes(true)[0]._evRevelado === true, { timeout: 8000 }).then(() => true, () => false);
    if (!revelo) {
      const x = UA.x + UA.w / 4, y = UA.y + UA.h - 30;
      const diag = await p.evaluate(([cx, cy]) => { const e = document.elementFromPoint(cx, cy); const s = window.game.scene.getScenes(true)[0]; return { elemento: e ? e.tagName + '#' + e.id + '.' + e.className : null, inputJuego: window.game.input.enabled, inputEscena: s.input.enabled, modal: document.getElementById('itemModal').className, contenido: document.getElementById('itemContent').innerText.slice(0, 120), titulo: (document.querySelector('#itemModal .modal-header h2') || {}).textContent, toast: document.getElementById('toast').className, locked: s._pzLocked }; }, [x, y]);
      fallas.push('apuesta: el medidor no se reveló después de contestar ' + JSON.stringify(diag));
    }

    for (const l of log) fallas.push('consola: ' + l);

    function verificar(nombre, r) {
      const chicos = r.tocables.filter((t) => Math.min(t.w, t.h) < MIN_TACTIL);
      const letra = r.textos.length ? Math.min(...r.textos.map((t) => t.px)) : 99;
      const estado = chicos.length === 0 && letra >= MIN_LETRA ? 'ok ' : 'FALLA';
      console.log(`${estado} ${nombre.padEnd(26)} tocables ${String(r.tocables.length).padStart(2)} (bajo ${MIN_TACTIL + 1}: ${chicos.length})  letra mínima ${letra}px`);
      chicos.forEach((t) => fallas.push(`${nombre}: zona táctil de ${t.w}×${t.h} px (${t.tipo} "${t.txt}")`));
      if (letra < MIN_LETRA) fallas.push(`${nombre}: letra de ${letra}px (mínimo ${MIN_LETRA})`);
    }
  } finally {
    if (sesion) await sesion.b.close();
    srv.cerrar();
  }
  if (fallas.length) { console.error('\nFALLAS:\n - ' + fallas.join('\n - ')); process.exit(1); }
  console.log('\nTodo bien: ' + ESCENAS.length + ' escenas medidas y recorrido completo sin errores.');
})().catch((e) => { console.error(e); process.exit(1); });
