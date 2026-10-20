// Privacidad y entrada no confiable. Los jugadores son menores: el juego no le
// pide nada a terceros (un CDN se entera de qué chico abrió qué juego) y no
// interpreta como HTML lo que escribe el alumno.
//
// Los barridos recorren TODO el proyecto con un recorrido de carpetas, no una
// lista de archivos anotada a mano: un archivo nuevo entra solo.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join, relative, extname } = require('node:path');
const vm = require('node:vm');

const RAIZ = join(__dirname, '..');
// Código propio del juego: se excluyen los vendor (Phaser trae sus URLs de
// documentación), las pruebas, la documentación y las copias de respaldo.
const EXCLUIDAS = new Set(['node_modules', '.git', 'vendor', 'tests', 'docs', '_backup', '.superpowers', 'assets']);

function archivos(dir, exts, salida = []) {
  for (const nombre of readdirSync(dir)) {
    if (EXCLUIDAS.has(nombre)) continue;
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) archivos(ruta, exts, salida);
    else if (exts.includes(extname(nombre))) salida.push(ruta);
  }
  return salida;
}

const CODIGO = archivos(RAIZ, ['.js', '.html', '.css', '.json', '.webmanifest']);

test('el barrido encuentra el código del juego', () => {
  const rel = CODIGO.map((f) => relative(RAIZ, f).replace(/\\/g, '/'));
  for (const esperado of ['index.html', 'sw.js', 'main.js', 'js/scenes/BattleScene.js', 'css/variables.css']) {
    assert.ok(rel.includes(esperado), `el barrido no vio ${esperado}`);
  }
  assert.ok(!rel.some((f) => f.startsWith('vendor/')), 'los vendor no se barren');
});

test('el juego no pide nada a servidores de terceros', () => {
  // Permitidos: espacios de nombres XML (no son pedidos) y enlaces de texto que
  // el alumno tiene que tocar a propósito (créditos).
  const PERMITIDOS = [/^https?:\/\/www\.w3\.org\//, /^https?:\/\/localhost/, /^https?:\/\/127\.0\.0\.1/];
  const hallazgos = [];
  for (const f of CODIGO) {
    const texto = readFileSync(f, 'utf8');
    for (const m of texto.matchAll(/https?:\/\/[^\s'"`)<>\\]+/g)) {
      if (!PERMITIDOS.some((re) => re.test(m[0]))) hallazgos.push(`${relative(RAIZ, f)}: ${m[0]}`);
    }
    // @import o url() hacia afuera en CSS, y //cdn... sin protocolo
    for (const m of texto.matchAll(/(?:src|href)\s*=\s*["']\/\/[^"']+["']/g)) hallazgos.push(`${relative(RAIZ, f)}: ${m[0]}`);
  }
  assert.deepEqual(hallazgos, [], 'recursos o enlaces a terceros:\n  ' + hallazgos.join('\n  '));
});

test('escapeHtml neutraliza HTML y comillas', () => {
  const ctx = vm.createContext({});
  // utils.js trae código que necesita el navegador: se corta sólo la función.
  const fuente = readFileSync(join(RAIZ, 'js/core/utils.js'), 'utf8');
  const desde = fuente.indexOf('function escapeHtml');
  assert.ok(desde >= 0, 'utils.js ya no define escapeHtml');
  vm.runInContext(fuente.slice(desde, fuente.indexOf('\nfunction ', desde + 10)) + '\n;this.escapeHtml = escapeHtml;', ctx);
  const esc = ctx.escapeHtml;
  assert.equal(esc('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(esc('a"b\'c&d'), 'a&quot;b&#39;c&amp;d');
  assert.equal(esc(42), '42');
  assert.equal(esc('Ana'), 'Ana');
});

test('el nombre del héroe nunca entra sin escapar a un HTML', () => {
  // `STATE.nombre` lo escribe el alumno (o sale de un guardado editado). En
  // un texto de Phaser es inofensivo; dentro de una plantilla con etiquetas HTML
  // (certificado, resumen) se interpretaría.
  const malos = [];
  for (const f of CODIGO.filter((x) => x.endsWith('.js'))) {
    readFileSync(f, 'utf8').split(/\r?\n/).forEach((linea, i) => {
      if (!/STATE\.nombre/.test(linea) || !/</.test(linea)) return;
      const sinEscapar = linea.replace(/escapeHtml\(\s*STATE\.nombre\s*\)/g, '');
      if (/STATE\.nombre/.test(sinEscapar)) malos.push(`${relative(RAIZ, f)}:${i + 1}: ${linea.trim().slice(0, 110)}`);
    });
  }
  assert.deepEqual(malos, [], 'STATE.nombre sin escapar dentro de HTML:\n  ' + malos.join('\n  '));
});
