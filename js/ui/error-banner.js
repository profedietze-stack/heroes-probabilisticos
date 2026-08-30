/* ══════════════════════════════════════
   error-banner.js — Capturador global de errores
   Muestra banner rojo fijo cuando hay excepcion no capturada o promesa
   rechazada. Sin esto, un throw silencioso deja la UI congelada sin pista.
   El banner muestra: mensaje + archivo:linea + tope del stack.
   Toca el banner para copiar; boton X para cerrar.
   Activo en produccion Y en modo dev.
══════════════════════════════════════ */

/* Persistencia: guarda los ultimos 10 errores con timestamp en localStorage.
   Diagnostico post-hoc: un alumno dice "ayer se rompio" → getErrorLog() lo muestra. */
var _ERRLOG_KEY = 'heroesProb_errorLog';

function _logError(title, detail) {
  try {
    var log = JSON.parse(localStorage.getItem(_ERRLOG_KEY) || '[]');
    log.push({ t: new Date().toISOString(), title: String(title).slice(0, 200), detail: String(detail).slice(0, 500) });
    if (log.length > 10) log = log.slice(-10);
    localStorage.setItem(_ERRLOG_KEY, JSON.stringify(log));
  } catch (e) {}
}

/* API de consulta (consola o panel dev): getErrorLog() / clearErrorLog() */
function getErrorLog() {
  try { return JSON.parse(localStorage.getItem(_ERRLOG_KEY) || '[]'); } catch (e) { return []; }
}
function clearErrorLog() { try { localStorage.removeItem(_ERRLOG_KEY); } catch (e) {} }

function initErrorBanner() {
  function _show(title, detail) {
    _logError(title, detail);
    var box = document.getElementById('__err_banner');
    if (!box) {
      box = document.createElement('div');
      box.id = '__err_banner';
      box.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0',
        'z-index:2147483647',
        'background:#b00020', 'color:#fff',
        'font:12px/1.4 monospace', 'padding:10px 44px 10px 12px',
        'white-space:pre-wrap', 'word-break:break-word',
        'max-height:50vh', 'overflow:auto',
        'box-shadow:0 2px 12px rgba(0,0,0,.6)',
        'cursor:pointer'
      ].join(';');
      document.body.appendChild(box);

      var close = document.createElement('button');
      close.textContent = '✕';
      close.setAttribute('aria-label', 'Cerrar error');
      close.style.cssText = 'position:fixed;top:6px;right:8px;z-index:2147483647;background:#fff;color:#b00020;border:0;width:30px;height:30px;font:bold 15px monospace;border-radius:6px;cursor:pointer;line-height:1;';
      close.onclick = function () { box.remove(); close.remove(); };
      document.body.appendChild(close);

      /* Tocar el banner copia su contenido (debug rapido en movil sin DevTools) */
      box.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(box.textContent).catch(function () {});
        }
      });
    }
    box.textContent = '⚠️ ERROR: ' + title + '\n' + detail;
  }

  window.addEventListener('error', function (e) {
    var where = e.filename
      ? e.filename.split('/').pop() + ':' + e.lineno + ':' + e.colno
      : '(sin ubicacion)';
    var stack = e.error && e.error.stack
      ? '\n' + e.error.stack.split('\n').slice(0, 4).join('\n')
      : '';
    _show(e.message || 'error desconocido', where + stack);
  });

  window.addEventListener('unhandledrejection', function (e) {
    var reason = e.reason;
    var msg    = (reason && reason.message) ? reason.message : String(reason);
    var stack  = (reason && reason.stack)
      ? '\n' + reason.stack.split('\n').slice(0, 4).join('\n')
      : '';
    _show('Promesa rechazada: ' + msg, stack);
  });

  console.info('[error-banner] activo');
}
