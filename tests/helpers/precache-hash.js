// Huella del contenido que el service worker precachea.
//
// Si cambia el contenido de un archivo precacheado y no cambia CACHE_VERSION,
// las tablets que ya tienen el juego instalado siguen sirviendo la versión
// vieja (la caché es "primero la copia"). Ya se olvidó dos veces en otros
// juegos de la carpeta; acá un test lo cuida.
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const { createHash } = require('node:crypto');
const { montar, RAIZ } = require('./sw-harness');

function archivosPrecacheados() {
  const { PRECACHE } = montar();
  const rutas = Array.from(PRECACHE)
    .map((r) => r.replace(/\?.*$/, '').replace(/^\.\//, ''))
    .map((r) => (r === '' || r === './' ? 'index.html' : r));
  return [...new Set(rutas)].sort();
}

/** SHA-256 de ruta + contenido (fin de línea normalizado: git puede convertirlo). */
function huella() {
  const h = createHash('sha256');
  for (const ruta of archivosPrecacheados()) {
    const p = join(RAIZ, ruta);
    h.update(ruta + '\0');
    h.update(existsSync(p) ? readFileSync(p).toString('latin1').replace(/\r\n/g, '\n') : '<<falta>>');
    h.update('\0');
  }
  return h.digest('hex');
}

module.exports = { huella, archivosPrecacheados, RAIZ };
