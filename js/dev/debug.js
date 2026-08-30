/* ══════════════════════════════════════
   debug.js — Herramientas dev para testing
   SOLO activo con ?dev en la URL.
   Cero impacto en produccion.
══════════════════════════════════════ */
(function () {
  var p = new URLSearchParams(location.search);
  if (!p.has('dev')) return;

  /* ── Captura de errores globales ── */
  var _errLog = [];                 /* historial de errores para smoke test */
  window.__DEV_ERRORS = _errLog;
  var _origError = window.onerror;
  window.onerror = function (msg, src, line, col, err) {
    var short = String(msg).substring(0, 80);
    _errLog.push({ t: Date.now(), msg: short, src: src, line: line });
    console.error('[DEV ERROR] ' + short + '\n  ' + src + ':' + line + ':' + col, err);
    if (typeof showToast === 'function') showToast('[DEV] ' + short, 6000);
    return _origError ? _origError.apply(this, arguments) : false;
  };
  window.addEventListener('unhandledrejection', function (e) {
    _errLog.push({ t: Date.now(), msg: 'REJECTION: ' + e.reason });
    console.error('[DEV REJECTION]', e.reason);
    if (typeof showToast === 'function') showToast('[DEV] Promise rejected: ' + e.reason, 5000);
  });

  /* ── DEV global ── */
  window.DEV = {
    /* true = splashLaunch() se llama sola al terminar de cargar scripts */
    autoLaunch: p.has('go'),

    /* Inyecta parametros URL en STATE justo antes de que Phaser arranque */
    injectState: function () {
      if (typeof STATE === 'undefined') {
        console.warn('[DEV] injectState: STATE no definido todavia');
        return;
      }
      /* nombre del heroe */
      if (p.has('nombre')) {
        STATE.nombre = p.get('nombre');
      } else if (!STATE.nombre || STATE.nombre === 'Heroe' || STATE.nombre === 'Héroe') {
        STATE.nombre = 'Dev';
      }

      /* dificultad */
      if (p.has('diff') && typeof DIFICULTADES !== 'undefined' && DIFICULTADES[p.get('diff')]) {
        STATE.dificultad = p.get('diff');
        var d = DIFICULTADES[STATE.dificultad];
        STATE.hp     = d.hpHero;
        STATE.hpMax  = d.hpHero;
        STATE.ataqueBase  = d.atkBase;
        STATE.defensaBase = d.defBase;
        STATE.ataque  = d.atkBase;
        STATE.defensa = d.defBase;
        STATE.resiliencia = d.resBonus || 0;
      }

      /* HP personalizado (aplicar despues de diff para overridear) */
      if (p.has('hp')) {
        var h = parseInt(p.get('hp'), 10);
        if (!isNaN(h) && h > 0) { STATE.hp = h; STATE.hpMax = Math.max(STATE.hpMax, h); }
      }

      /* boss (1-10) */
      if (p.has('boss')) {
        var n = parseInt(p.get('boss'), 10) - 1;
        if (!isNaN(n)) STATE.jefeActual = Math.max(0, Math.min(9, n));
      }

      /* enigmas completados — marcar todos como hechos para no bloquear el mapa */
      if (p.has('allpuzzles')) {
        for (var i = 0; i < 7; i++) STATE.enigmasCompletados[i] = true;
      }

      console.log('[DEV] STATE inyectado:', {
        nombre: STATE.nombre,
        dificultad: STATE.dificultad,
        hp: STATE.hp + '/' + STATE.hpMax,
        boss: STATE.jefeActual + 1
      });
    },

    /* Llamado despues de que Phaser arranca para saltar a escena/puzzle */
    postPhaserInit: function () {
      var target = p.get('scene') || p.get('puzzle') || (p.has('boss') ? 'BattleScene' : null);
      if (!target) return;
      /* Esperar a que Phaser registre las escenas */
      var tries = 0;
      var iv = setInterval(function () {
        tries++;
        if (tries > 40) { clearInterval(iv); console.warn('[DEV] Timeout esperando Phaser'); return; }
        if (!window.game) return;
        var scenes = game.scene.scenes;
        if (!scenes || scenes.length === 0) return;
        clearInterval(iv);
        /* Pequeño delay para que MenuScene termine su create() */
        setTimeout(function () {
          try {
            var active = scenes.find(function (s) { return s.scene && s.scene.isActive && s.scene.isActive(); });
            if (active) {
              active.scene.start(target);
              console.log('[DEV] Salto a escena:', target);
            }
          } catch (e) {
            console.error('[DEV] postPhaserInit error:', e);
          }
        }, 350);
      }, 100);
    },

    /* ── Helpers en runtime ── */

    /* Escena Phaser activa actualmente */
    activeScene: function () {
      try {
        if (typeof game === 'undefined' || !game) return null;
        return game.scene.scenes.find(function (s) { return s.scene && s.scene.isActive && s.scene.isActive(); }) || null;
      } catch(e) { return null; }
    },

    /* Salta a cualquier escena Phaser */
    goto: function (sceneKey) {
      var s = this.activeScene();
      if (s) s.scene.start(sceneKey);
      else console.warn('[DEV] No hay escena activa');
    },

    /* Restaura HP al maximo */
    heal: function () {
      if (typeof STATE === 'undefined') return;
      STATE.hp = STATE.hpMax;
      if (typeof showToast === 'function') showToast('[DEV] HP restaurado al maximo');
    },

    /* Agrega un item aleatorio al inventario */
    addItem: function () {
      if (typeof darItemsAleatorios === 'undefined') { console.warn('[DEV] darItemsAleatorios no disponible'); return; }
      if (typeof CFG !== 'undefined' && STATE.inventario.length >= CFG.MAX_INVENTORY_SLOTS) {
        console.warn('[DEV] Inventario lleno'); return;
      }
      var items = darItemsAleatorios(1);
      if (items.length && typeof ITEMS !== 'undefined') {
        var it = ITEMS[items[0].id - 1];
        if (typeof showToast === 'function' && it) showToast('[DEV] +' + it.emoji + ' ' + it.nombre);
      }
    },

    /* Sube XP a 500 (o al valor pasado) y guarda */
    addXP: function (n) {
      if (typeof STATE === 'undefined') return;
      STATE.xp = (typeof n === 'number') ? n : 500;
      if (typeof saveGame === 'function') saveGame();
      console.log('[DEV] XP ->', STATE.xp);
      if (typeof showToast === 'function') showToast('[DEV] XP = ' + STATE.xp);
    },

    /* Avanza al siguiente boss */
    nextBoss: function () {
      if (typeof STATE === 'undefined') return;
      STATE.jefeActual = Math.min(9, STATE.jefeActual + 1);
      console.log('[DEV] Boss ->', STATE.jefeActual + 1);
      this.goto('BattleScene');
    },

    /* Gana la batalla actual: llama victoria() de BattleScene para mantener STATE consistente
       (jefeActual++, nodeActual++, XP, oro, saveGame) */
    winBattle: function () {
      if (typeof STATE === 'undefined') return;
      var s = this.activeScene();
      if (s && s.scene.key === 'BattleScene') {
        STATE.jefeHp = 0;
        if (typeof s.victoria === 'function') {
          s.victoria();
        } else {
          console.warn('[DEV] winBattle: BattleScene.victoria no disponible — salto directo (STATE puede quedar inconsistente)');
          s.scene.start('VictoryScene');
        }
      } else {
        console.warn('[DEV] winBattle: no estas en BattleScene');
      }
    },

    /* Valida invariantes de STATE — delega a checkStateInvariants (state-schema.js) */
    validateState: function () {
      var errs = (typeof checkStateInvariants === 'function')
        ? checkStateInvariants()
        : ['checkStateInvariants no disponible'];
      if (errs.length) {
        console.warn('[DEV] Errores de STATE:', errs);
        if (typeof showToast === 'function') showToast('[DEV] ' + errs.length + ' error(es) en STATE — ver consola');
      } else {
        console.log('[DEV] STATE valido OK');
        if (typeof showToast === 'function') showToast('[DEV] STATE valido OK');
      }
      return errs;
    },

    /* Imprime STATE compacto en consola */
    dump: function () {
      if (typeof STATE === 'undefined') { console.log('[DEV] STATE no definido'); return; }
      console.group('[DEV] STATE dump');
      console.table({
        nombre:       STATE.nombre,
        dificultad:   STATE.dificultad,
        boss:         STATE.jefeActual + 1 + '/10',
        hp:           STATE.hp + '/' + STATE.hpMax,
        ataque:       STATE.ataque + ' (base ' + STATE.ataqueBase + ')',
        defensa:      STATE.defensa + ' (base ' + STATE.defensaBase + ')',
        resiliencia:  STATE.resiliencia,
        items:        STATE.inventario.length,
        tiradaGlobal: STATE.tiradaGlobal,
        enigmas:      Object.keys(STATE.enigmasCompletados).length + '/7',
        scene:        (this.activeScene() || { scene: { key: '?' } }).scene.key
      });
      if (STATE.inventario.length && typeof ITEMS !== 'undefined') {
        var inv = STATE.inventario.map(function (slot) {
          var it = ITEMS[slot.id - 1];
          return (it ? it.emoji + it.nombre : 'id:' + slot.id) + ' x' + slot.cantidad;
        });
        console.log('Inventario:', inv);
      }
      if (STATE.buffs && STATE.buffs.length) console.log('Buffs activos:', STATE.buffs);
      console.groupEnd();
    },

    /* ── #1: Smoke test — recorre todas las escenas y cuenta errores ──
       Uso: DEV.smoke()  (ideal combinar con ?dev&fast&seed=1)
       Visita cada escena standalone, espera, y reporta errores de consola. */
    smoke: function (done) {
      var self = this;
      var dwell = (window.FAST ? 200 : 700);   /* ms por escena */
      /* Escenas que arrancan sin parametros externos */
      var keys = [
        'MenuScene', 'IntroScene', 'MapScene', 'BattleScene', 'VictoryScene',
        'ArcadeHubScene', 'LibreScene', 'ArcadeScene', 'FinalScene',
        'PuzzleUrna', 'PuzzleMoneda', 'PuzzleApuesta', 'PuzzleRuleta',
        'PuzzleDados', 'PuzzlePuertas', 'PuzzleTesoro'
      ];
      var errBefore = (window.__DEV_ERRORS || []).length;
      var perScene = [];
      console.log('%c[SMOKE] Iniciando recorrido de ' + keys.length + ' escenas...', 'color:#0ff');

      /* preparar STATE minimo para que las escenas no se traben */
      if (typeof STATE !== 'undefined') {
        STATE.jefeActual = Math.min(9, STATE.jefeActual || 0);
        for (var i = 0; i < 7; i++) STATE.enigmasCompletados[i] = true;
        if (STATE.hp <= 0) STATE.hp = STATE.hpMax;
      }

      var idx = 0;
      function step() {
        if (idx >= keys.length) {
          var errAfter = (window.__DEV_ERRORS || []).length;
          var newErrs = (window.__DEV_ERRORS || []).slice(errBefore);
          var ok = newErrs.length === 0;
          console.log('%c[SMOKE] ' + (ok ? 'PASS ✓' : 'FAIL ✗') +
            ' — ' + keys.length + ' escenas, ' + newErrs.length + ' error(es)',
            'color:' + (ok ? '#0f0' : '#f44') + ';font-weight:bold');
          if (newErrs.length) console.table(newErrs);
          if (typeof showToast === 'function')
            showToast('[SMOKE] ' + (ok ? 'PASS' : 'FAIL (' + newErrs.length + ' err)'), 6000);
          /* volver al menu limpio */
          self.goto('MenuScene');
          var totalStateErrs = perScene.reduce(function(s,p){return s+(p.stateErrs||0);},0);
          if (!ok || totalStateErrs) console.warn('[SMOKE] STATE invariant errors total:', totalStateErrs);
          if (typeof done === 'function') done({ ok: ok && totalStateErrs===0, errors: newErrs, stateErrors: totalStateErrs, scenes: perScene });
          return;
        }
        var k = keys[idx];
        var eb = (window.__DEV_ERRORS || []).length;
        try {
          var s = self.activeScene();
          if (s) s.scene.start(k);
        } catch (e) {
          console.error('[SMOKE] excepcion al iniciar ' + k, e);
        }
        setTimeout(function () {
          var ea = (window.__DEV_ERRORS || []).length;
          var d = ea - eb;
          var stErrs = (typeof checkStateInvariants === 'function') ? checkStateInvariants() : [];
          perScene.push({ scene: k, errors: d, stateErrs: stErrs.length });
          var stNote = stErrs.length ? '  ⚠ STATE(' + stErrs.length + ')' : '';
          console.log('[SMOKE] ' + k + (d ? '  ✗ ' + d + ' err' : '  ✓') + stNote);
          if (stErrs.length) console.warn('[SMOKE] STATE en ' + k + ':', stErrs);
          idx++;
          step();
        }, dwell);
      }
      step();
    },

    /* Reinicia la secuencia RNG a la semilla (repetir misma corrida) */
    reseed: function () {
      if (window.RNG && window.RNG.seeded) { window.RNG.reset(); console.log('[DEV] RNG reseteado a seed', window.RNG.seed); }
      else console.warn('[DEV] No hay seed activo (usa ?seed=N)');
    }
  };

  /* ══════════════════════════════════════
     #4 + #7: window.__TEST — API de verificacion de probabilidad (headless)
     Funciones puras, sin animacion ni canvas. Para validar la matematica.
  ══════════════════════════════════════ */
  window.__TEST = {
    /* Lanza n veces un sampler y devuelve {valor: frecuencia} */
    sample: function (sampler, n) {
      n = n || 100000;
      var freq = {};
      for (var i = 0; i < n; i++) {
        var v = sampler();
        freq[v] = (freq[v] || 0) + 1;
      }
      for (var k in freq) freq[k] /= n;
      return freq;
    },

    /* Tirada de un dado de c caras (default 12) */
    rollDie: function (c) { c = c || 12; return 1 + Math.floor(Math.random() * c); },

    /* Suma de 2d12 */
    roll2d12: function () { return this.rollDie(12) + this.rollDie(12); },

    /* Probabilidad teorica de la suma k con 2d12 */
    theory2d12: function (k) {
      if (k < 2 || k > 24) return 0;
      var c = (k <= 13) ? (k - 1) : (25 - k);
      return c / 144;
    },

    /* Aserto: |observado - esperado| <= tol. Loguea PASS/FAIL. */
    assert: function (label, observed, expected, tol) {
      tol = tol || 0.01;
      var diff = Math.abs(observed - expected);
      var ok = diff <= tol;
      console.log('%c[TEST] ' + (ok ? 'PASS' : 'FAIL') + ' — ' + label +
        '  obs=' + observed.toFixed(4) + ' exp=' + expected.toFixed(4) + ' Δ=' + diff.toFixed(4),
        'color:' + (ok ? '#0f0' : '#f44'));
      return ok;
    },

    /* Suite completa de probabilidad. Devuelve {pass, fail}. */
    runAll: function (n) {
      n = n || 200000;
      /* Resetear seed antes de correr para que los resultados sean reproducibles
         independientemente de cuántos Math.random() se hayan consumido antes */
      if (window.RNG && window.RNG.seeded) {
        window.RNG.reset();
        console.log('[TEST] RNG reseteado a seed', window.RNG.seed, '(resultados reproducibles)');
      }
      var self = this;
      var pass = 0, fail = 0;
      function chk(ok) { if (ok) pass++; else fail++; }
      console.group('%c[TEST] Suite de probabilidad (n=' + n + ')', 'color:#0ff;font-weight:bold');

      /* 1. d12 uniforme: cada cara ≈ 1/12 */
      var fd = self.sample(function () { return self.rollDie(12); }, n);
      for (var c = 1; c <= 12; c++) chk(self.assert('d12 cara ' + c, fd[c] || 0, 1 / 12, 0.01));

      /* 2. Suma 2d12 vs teoria triangular */
      var fs = self.sample(function () { return self.roll2d12(); }, n);
      for (var k = 2; k <= 24; k++) chk(self.assert('2d12 suma ' + k, fs[k] || 0, self.theory2d12(k), 0.008));

      /* 3. Doble 1 = 1/144 */
      var fdd = self.sample(function () { return (self.rollDie(12) === 1 && self.rollDie(12) === 1) ? 'si' : 'no'; }, n);
      chk(self.assert('doble-1 = 1/144', fdd['si'] || 0, 1 / 144, 0.003));

      /* 4. Media de la suma ≈ 13 */
      var sum = 0; for (var i = 0; i < n; i++) sum += self.roll2d12();
      chk(self.assert('media 2d12 ≈ 13', sum / n, 13, 0.05));

      console.log('%c[TEST] TOTAL: ' + pass + ' PASS / ' + fail + ' FAIL',
        'color:' + (fail === 0 ? '#0f0' : '#f44') + ';font-weight:bold');
      console.groupEnd();
      if (typeof showToast === 'function') showToast('[TEST] ' + pass + ' PASS / ' + fail + ' FAIL', 6000);
      return { pass: pass, fail: fail };
    }
  };

  /* ── Overlay visual ── */
  function buildOverlay() {
    var el = document.createElement('div');
    el.id = '__devOverlay';
    el.style.cssText = [
      'position:fixed', 'bottom:12px', 'right:12px', 'z-index:2147483647',
      'background:rgba(0,8,0,0.94)', 'color:#0f0',
      'border:1px solid rgba(0,200,0,0.5)',
      'font:11px/1.55 "Courier New",monospace',
      'padding:8px 10px', 'border-radius:3px',
      'min-width:210px', 'max-width:280px',
      'box-shadow:0 0 16px rgba(0,255,0,0.1)',
      'user-select:none'
    ].join(';');

    var btnStyle = 'background:#001800;color:#0f0;border:1px solid rgba(0,200,0,0.4);border-radius:2px;cursor:pointer;padding:2px 7px;font:10px monospace;margin:2px';
    var dangerStyle = 'background:#180000;color:#f88;border:1px solid rgba(200,0,0,0.4);border-radius:2px;cursor:pointer;padding:2px 7px;font:10px monospace;margin:2px';

    el.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">' +
        '<span style="color:#0f0;letter-spacing:1px;font-weight:bold">DEV</span>' +
        '<button id="__devToggle" style="' + btnStyle + '">[-]</button>' +
      '</div>' +
      '<div id="__devBody">' +
        '<div id="__devInfo" style="color:#7f7;margin-bottom:6px;line-height:1.6"></div>' +
        '<div>' +
          '<button onclick="DEV.heal()" style="' + btnStyle + '">+HP</button>' +
          '<button onclick="DEV.addItem()" style="' + btnStyle + '">+Item</button>' +
          '<button onclick="DEV.addXP(500)" style="' + btnStyle + '">+XP 500</button>' +
          '<button onclick="DEV.nextBoss()" style="' + btnStyle + '">&rarr;Boss</button>' +
          '<button onclick="DEV.winBattle()" style="' + dangerStyle + '">Win</button>' +
        '</div>' +
        '<div>' +
          '<button onclick="DEV.validateState()" style="' + btnStyle + '">Validate</button>' +
          '<button onclick="DEV.dump()" style="' + btnStyle + '">Dump</button>' +
          '<button onclick="DEV.goto(prompt(\'Escena:\',\'BattleScene\'))" style="' + btnStyle + '">Goto</button>' +
        '</div>' +
        '<div>' +
          '<button onclick="DEV.smoke()" style="' + btnStyle + '">Smoke</button>' +
          '<button onclick="__TEST.runAll()" style="' + btnStyle + '">Test Prob</button>' +
          '<button onclick="DEV.reseed()" style="' + btnStyle + '">Reseed</button>' +
        '</div>' +
        '<div style="margin-top:4px;color:#050;font-size:9px">' + (location.search || '(sin params)') + '</div>' +
      '</div>';

    document.body.appendChild(el);

    /* Toggle boton y tecla backtick */
    var body = el.querySelector('#__devBody');
    var toggleBtn = el.querySelector('#__devToggle');
    var collapsed = false;
    function toggle() {
      collapsed = !collapsed;
      body.style.display = collapsed ? 'none' : '';
      toggleBtn.textContent = collapsed ? '[+]' : '[-]';
    }
    toggleBtn.addEventListener('click', toggle);
    document.addEventListener('keydown', function (e) {
      if (e.key === '`') toggle();
    });

    /* Refresco de info cada 500ms */
    var infoEl = el.querySelector('#__devInfo');
    setInterval(function () {
      if (collapsed || !infoEl) return;
      try {
        var sceneKey = '?';
        if (window.game && game.scene) {
          var act = game.scene.scenes.find(function (s) { return s.scene && s.scene.isActive && s.scene.isActive(); });
          if (act) sceneKey = act.scene.key;
        }
        var st = typeof STATE !== 'undefined' ? STATE : null;
        var maxSlots = typeof CFG !== 'undefined' ? CFG.MAX_INVENTORY_SLOTS : 6;
        infoEl.innerHTML = (st ? [
          'Scene: <b>' + sceneKey + '</b>',
          'Boss:  <b>' + (st.jefeActual + 1) + '/10</b>',
          'HP:    <b>' + st.hp + '/' + st.hpMax + '</b>',
          'XP:    <b>' + (st.xp || 0) + '</b>',
          'Items: <b>' + st.inventario.length + '/' + maxSlots + '</b>',
          'Tirada: <b>#' + st.tiradaGlobal + '</b>'
        ] : ['Esperando STATE...']).join('<br>');
      } catch (e) { /* ignore */ }
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildOverlay);
  } else {
    buildOverlay();
  }

  console.log('[DEV] Modo debug activo. Parametros:', Object.fromEntries(p));
  console.log('[DEV] Comandos: DEV.dump() | DEV.validateState() | DEV.heal() | DEV.addItem() | DEV.addXP(500) | DEV.nextBoss() | DEV.winBattle() | DEV.goto(scene)');
  console.log('[DEV] Testing: DEV.smoke() | __TEST.runAll() | DEV.reseed()  ·  Flags URL: ?seed=N ?fast ?dev&go');
})();
