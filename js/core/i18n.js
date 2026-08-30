/* ══════════════════════════════════════
   i18n.js — Andamiaje ligero de internacionalización.
   Hoy solo existe 'es'. Los textos del juego siguen escritos
   directo en cada escena; este módulo cubre las cadenas de UI
   comunes (botones, menús) para que agregar un idioma nuevo
   sea cuestión de sumar un diccionario, no de tocar escenas.
══════════════════════════════════════ */

const I18N_LANG_KEY = 'heroesProb_lang';

const I18N_DICT = {
  es: {
    'ui.volver':          'Volver',
    'ui.cerrar':          'Cerrar',
    'ui.continuar':       'Continuar',
    'ui.aceptar':         'Aceptar',
    'ui.cancelar':        'Cancelar',
    'ui.jugar':           'Jugar',
    'ui.nuevaAventura':   'Nueva Aventura',
    'ui.cargando':        'Cargando...',
    'ui.guardar':         'Guardar',
    'ui.siguiente':       'Siguiente',
    'ui.anterior':        'Anterior',
  }
};

let _i18nLang = (function(){
  try { return localStorage.getItem(I18N_LANG_KEY) || 'es'; } catch(e) { return 'es'; }
})();

/* Traduce una clave; si no existe, devuelve la clave misma (nunca rompe la UI). */
function t(key){
  const dict = I18N_DICT[_i18nLang] || I18N_DICT.es;
  return dict[key] || key;
}

function i18nSetLang(lang){
  if (!I18N_DICT[lang]) return false;
  _i18nLang = lang;
  try { localStorage.setItem(I18N_LANG_KEY, lang); } catch(e) {}
  return true;
}

function i18nGetLang(){ return _i18nLang; }

window.t = t;
window.i18nSetLang = i18nSetLang;
window.i18nGetLang = i18nGetLang;
