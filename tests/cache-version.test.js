// Que no se pueda publicar un cambio sin subir la versión de la caché.
//
// El service worker contesta "primero la copia": una tablet con el juego
// instalado sigue sirviendo los archivos viejos hasta que CACHE_VERSION cambia.
// `sw-precache.json` guarda el nombre de la caché y la huella del contenido
// con que se publicó; este test falla si el contenido cambió y el nombre no.
//
// Flujo:  editar → subir CACHE_VERSION (sw.js) y GAME_VERSION (sw.js + index.html)
//         → node tests/sellar-cache.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { montar, RAIZ } = require('./helpers/sw-harness');
const { huella } = require('./helpers/precache-hash');

const sello = JSON.parse(readFileSync(join(RAIZ, 'sw-precache.json'), 'utf8'));
const sw = montar();

test('si cambió algo precacheado, cambió también el nombre de la caché', () => {
  if (huella() !== sello.huella) {
    assert.notEqual(
      sw.CACHE_VERSION, sello.cacheName,
      'Cambió el contenido que el service worker precachea pero CACHE_VERSION sigue siendo ' +
      `"${sello.cacheName}": las tablets con el juego instalado no van a ver el cambio. ` +
      'Subí CACHE_VERSION y GAME_VERSION y corré: node tests/sellar-cache.js',
    );
  }
});

test('la huella guardada es la del contenido actual (falta re-sellar)', () => {
  assert.equal(
    huella(), sello.huella,
    'El contenido precacheado cambió respecto de sw-precache.json. Si ya subiste CACHE_VERSION, ' +
    'corré: node tests/sellar-cache.js',
  );
  assert.equal(sw.CACHE_VERSION, sello.cacheName, 'sw-precache.json tiene otro nombre de caché: re-sellá');
  assert.equal(sw.GAME_VERSION, sello.gameVersion, 'sw-precache.json tiene otra GAME_VERSION: re-sellá');
});
