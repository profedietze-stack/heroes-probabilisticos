/* ══════════════════════════════════════
   Teléfono: tamaño del lienzo por escena
   El juego se diseñó para 1024×700. En un teléfono apaisado (812×375) eso se
   achica a la mitad y el texto queda ilegible. Las escenas migradas declaran
   `static DISENO_MOVIL = true` y, en un teléfono, el lienzo pasa a medir la
   pantalla real (1 unidad = 1 px CSS). Las demás siguen en 1024×700.
   En PC y tablet nada cambia.
══════════════════════════════════════ */
const LIENZO_BASE = { w: 1024, h: 700 };

/** ¿Teléfono? Táctil y de lado corto ≤ 700 px. `?movil=1` lo fuerza (pruebas en PC). */
function esMovil(){
  try{
    if(/[?&]movil=1/.test(location.search)) return true;
    return window.matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 700;
  }catch(e){ return false; }
}
const MOVIL = esMovil();
try{ if(MOVIL) document.documentElement.classList.add('movil'); }catch(e){}

/** Tamaño de lienzo que corresponde a una escena. */
function tamanoLienzo(migrada, movil, vw, vh){
  if(movil && migrada) return { w: Math.max(320, Math.round(vw)), h: Math.max(240, Math.round(vh)) };
  return { w: LIENZO_BASE.w, h: LIENZO_BASE.h };
}

function ajustarLienzo(game, migrada){
  const t = tamanoLienzo(migrada, MOVIL, window.innerWidth, window.innerHeight);
  const gs = game.scale.gameSize;
  if(gs.width !== t.w || gs.height !== t.h) game.scale.setGameSize(t.w, t.h);
}

/* Plugin de escena: al empezar cada escena fija el tamaño del lienzo (antes de create). */
class LienzoMovilPlugin extends Phaser.Plugins.ScenePlugin {
  boot(){
    this.systems.events.on('start', ()=>{
      try{ ajustarLienzo(this.systems.game, !!(this.scene.constructor && this.scene.constructor.DISENO_MOVIL)); }catch(e){}
    });
  }
}

/* ¿El cambio de pantalla justifica rehacer la escena? Sólo girar o un cambio grande de ancho. Esconder la barra de
   direcciones, abrir el teclado o la pantalla completa mueven el alto unos píxeles: reiniciar ahí le cambia la
   pregunta al alumno en pleno enigma. Esos cambios los absorbe el modo FIT del lienzo. */
function cambioJustificaReinicio(actual, nuevo){
  const giro = (actual.width > actual.height) !== (nuevo.w > nuevo.h);
  const ancho = Math.abs(nuevo.w - actual.width) / actual.width > 0.25;
  return giro || ancho;
}

/* Girar el teléfono o cambiar el tamaño: una escena migrada se rehace con las medidas nuevas. */
function vigilarGiro(game){
  if(!MOVIL) return;
  let t = null;
  const alCambiar = ()=>{
    clearTimeout(t);
    t = setTimeout(()=>{
      game.scene.getScenes(true).forEach(s=>{
        if(s.constructor && s.constructor.DISENO_MOVIL){
          const k = tamanoLienzo(true, MOVIL, window.innerWidth, window.innerHeight);
          const gs = game.scale.gameSize;
          if(cambioJustificaReinicio(gs, k)){
            // Un aviso o la tienda abiertos quedarían apuntando a la escena vieja.
            try{ closeItemModal(); }catch(e){}
            s.scene.restart();
          }
        }
      });
    }, 250);
  };
  window.addEventListener('resize', alCambiar);
  window.addEventListener('orientationchange', alCambiar);
}

const _apiMovil = { LIENZO_BASE, tamanoLienzo };
if(typeof module !== 'undefined' && module.exports) module.exports = _apiMovil;
