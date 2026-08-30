/* ══════════════════════════════════════
   dev-plugin.js — Plugin de escena de testing
   - Guard multi-escena (#2): si >1 escena activa a la vez → warn.
   - ?fast (#6): acelera tweens + reloj + fades de camara para testeo veloz.
   Siempre cargado; solo actua si ?dev / ?fast estan en la URL.
   Carga DESPUES de phaser y ANTES de main.js.
══════════════════════════════════════ */
(function () {
  if (typeof Phaser === 'undefined') return;

  var p = new URLSearchParams(location.search);
  var DEVMODE = p.has('dev');
  var FAST = p.has('fast');
  window.FAST = FAST;
  /* factor de aceleracion (8x por defecto, configurable con ?fast=N) */
  var SPEED = FAST ? (parseFloat(p.get('fast')) > 0 ? parseFloat(p.get('fast')) : 8) : 1;
  window.FAST_SPEED = SPEED;

  /* ── #6: patch de duraciones de camara (no respetan time.timeScale) ── */
  if (FAST) {
    var C = Phaser.Cameras.Scene2D.Camera.prototype;
    function _wrapDur(name, durIdx) {
      var orig = C[name];
      if (typeof orig !== 'function') return;
      C[name] = function () {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[durIdx] === 'number') args[durIdx] = Math.max(1, args[durIdx] / SPEED);
        return orig.apply(this, args);
      };
    }
    _wrapDur('fadeIn', 0);
    _wrapDur('fadeOut', 0);
    _wrapDur('fade', 0);
    _wrapDur('flash', 0);
    _wrapDur('shake', 0);
    _wrapDur('pan', 2);     // pan(x, y, duration, ...)
    _wrapDur('zoomTo', 1);  // zoomTo(zoom, duration, ...)
  }

  /* ── Plugin por-escena: corre en cada create() ── */
  class DevScenePlugin extends Phaser.Plugins.ScenePlugin {
    boot() {
      this.scene.events.on('create', function () {
        try {
          var scene = this.scene;

          /* #6: acelerar tweens + reloj de esta escena */
          if (FAST) {
            scene.tweens.timeScale = SPEED;
            scene.time.timeScale = SPEED;
          }

          /* #2: guard multi-escena (solo en ?dev para no molestar en prod) */
          if (DEVMODE && scene.game && scene.game.scene) {
            var active = scene.game.scene.scenes.filter(function (s) {
              return s.scene && s.scene.isActive && s.scene.isActive();
            });
            if (active.length > 1) {
              var keys = active.map(function (s) { return s.scene.key; });
              console.error('[DEV GUARD] ' + active.length + ' escenas activas a la vez:', keys);
              if (typeof showToast === 'function') {
                showToast('[GUARD] Multi-escena: ' + keys.join(', '), 6000);
              }
            }
          }
        } catch (e) { /* nunca romper el juego por el guard */ }
      }, this);
    }
  }

  window.DevScenePlugin = DevScenePlugin;
})();
