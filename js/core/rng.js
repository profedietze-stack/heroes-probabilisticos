/* ══════════════════════════════════════
   rng.js — RNG sembrable (determinismo para testing)
   Si ?seed=N en la URL → reemplaza Math.random global por un PRNG
   sembrado. Cero cambios en los call-sites existentes.
   Sin ?seed → Math.random intacto (comportamiento de produccion).
══════════════════════════════════════ */
(function () {
  var p = new URLSearchParams(location.search);

  /* mulberry32: PRNG rapido, determinista, 32-bit seed */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var _orig = Math.random.bind(Math);

  var RNG = {
    seeded: false,
    seed: 0,
    _fn: null,
    _origRandom: _orig,

    /* Fija la semilla y reinicia la secuencia */
    setSeed: function (s) {
      this.seed = s >>> 0;
      this._fn = mulberry32(this.seed);
      this.seeded = true;
      return this.seed;
    },
    /* Reinicia la secuencia a la semilla actual (repetir misma corrida) */
    reset: function () {
      if (this.seeded) this._fn = mulberry32(this.seed);
    },
    /* float [0,1) — sembrado si hay seed, si no Math.random nativo */
    random: function () {
      return this._fn ? this._fn() : _orig();
    },
    /* entero en [min,max] inclusive */
    int: function (min, max) {
      return min + Math.floor(this.random() * (max - min + 1));
    }
  };

  window.RNG = RNG;

  if (p.has('seed')) {
    var s = parseInt(p.get('seed'), 10);
    if (!isNaN(s)) {
      RNG.setSeed(s);
      Math.random = function () { return RNG.random(); };
      try { console.log('[RNG] Seed activo:', s, '(Math.random sembrado — determinista)'); } catch (e) {}
    }
  }
})();
