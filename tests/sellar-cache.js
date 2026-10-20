// Re-sella la huella de lo que precachea el service worker.
// Uso:  node tests/sellar-cache.js
// Hacerlo DESPUÉS de subir CACHE_VERSION (y GAME_VERSION) en sw.js / index.html.
const { writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { montar, RAIZ } = require('./helpers/sw-harness');
const { huella } = require('./helpers/precache-hash');

const sw = montar();
const sello = { cacheName: sw.CACHE_VERSION, gameVersion: sw.GAME_VERSION, huella: huella() };
writeFileSync(join(RAIZ, 'sw-precache.json'), JSON.stringify(sello, null, 2) + '\n');
console.log('sellado:', sello.cacheName, sello.huella.slice(0, 12) + '…');
