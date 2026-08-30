// Nitidez: el lienzo lógico es 1024×700 y Phaser 3 NO reescala el framebuffer
// (la antigua opción `resolution` fue removida — probado: ni top-level ni
// dentro de `scale` tienen efecto real en 3.60, la propiedad quedó vestigial
// en el Scale Manager). Si dejamos que Scale.FIT estire el canvas por CSS a
// pantallas grandes (>1024) hace UPSCALE → blur.
// Solución: cap de display = 1024×700. Nunca hace upscale → nítido como el DOM.
// En pantallas más chicas hace downscale (también nítido).
const config = {
  type: Phaser.AUTO,
  parent: 'phaserGame',
  width: 1024, height: 700,
  backgroundColor: '#0D0D14',
  roundPixels:  true,   // snap texto/gráficos a píxel entero → evita blur sub-pixel
  antialias:    true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    max: { width: 1024, height: 700 },   // no superar el tamaño nativo → sin upscale
  },
  input: { activePointers: 2 },   // habilita 2 puntos de contacto táctil
  dom: { createContainer: true },
  plugins: { scene: [
    { key: 'FsButtonPlugin', plugin: FsButtonPlugin, mapping: 'fsBtn', start: true },
    // Plugin de testing (guard multi-escena + ?fast). Solo si se cargó dev-plugin.js.
    ...(window.DevScenePlugin ? [{ key: 'DevScenePlugin', plugin: window.DevScenePlugin, mapping: 'devPlugin', start: true }] : [])
  ] },
  scene: [MenuScene, IntroScene, BattleScene, VictoryScene, MapScene, PuzzleScene,
          PuzzleUrna, PuzzleMoneda, PuzzleApuesta, PuzzleRuleta,
          PuzzleDados, PuzzlePuertas, PuzzleTesoro,
          ArcadeScene, ArcadeHubScene, LibreScene, FinalScene]
};

/* Guard anti-doble-instancia: si ya existe un game (main.js cargado dos veces),
   no crear otro — dos Phaser.Game = dos canvas renderizando = pantallas mezcladas. */
if (!window.game) {
  window.game = new Phaser.Game(config);
}

// Desbloquear AudioContext en iOS/Safari: requiere gesto del usuario en 'touchstart' o 'click'
const _audioUnlock = ()=>{ initAudio(); if(AC && AC.state==='suspended') AC.resume(); };
document.addEventListener('click',      _audioUnlock, {once:false});
document.addEventListener('keydown',    _audioUnlock, {once:false});
document.addEventListener('touchstart', _audioUnlock, {once:false, passive:true}); // iOS Safari
