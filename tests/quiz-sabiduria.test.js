// El quiz de sabiduría del mapa: contenido y barajado.
//
// Son diez preguntas de probabilidad escritas a mano. Dos cosas pueden salir
// mal sin que se vea: que la opción marcada correcta no exista, y que las
// opciones se pinten siempre en el mismo orden — la correcta está en la
// segunda posición en siete de las diez, así que el patrón se aprende rápido.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const fuente = readFileSync(join(__dirname, '..', 'js', 'ui', 'map-events.js'), 'utf8');

// El archivo entero depende del DOM y del resto del juego; sólo se extrae la
// constante con las preguntas, que es un literal.
function leerQuizzes() {
  const inicio = fuente.indexOf('QUIZ_SABIDURIA');
  assert.ok(inicio >= 0, 'no se encontró QUIZ_SABIDURIA: cambió de nombre');
  const desde = fuente.indexOf('[', inicio);
  let nivel = 0, fin = desde;
  for (let i = desde; i < fuente.length; i++) {
    if (fuente[i] === '[') nivel++;
    else if (fuente[i] === ']') { nivel--; if (nivel === 0) { fin = i; break; } }
  }
  return vm.runInNewContext(fuente.slice(desde, fin + 1));
}

const QUIZZES = leerQuizzes();

test('hay preguntas que revisar', () => {
  assert.ok(QUIZZES.length >= 5, `sólo ${QUIZZES.length} preguntas`);
});

test('la opción marcada correcta existe', () => {
  for (const q of QUIZZES) {
    assert.ok(Array.isArray(q.ops) && q.ops.length >= 2, `"${q.q}" con menos de dos opciones`);
    assert.ok(Number.isInteger(q.ok), `"${q.q}" sin índice de respuesta`);
    assert.ok(q.ok >= 0 && q.ok < q.ops.length, `"${q.q}" apunta a la opción ${q.ok}, fuera de la lista`);
  }
});

test('ninguna pregunta repite una opción', () => {
  for (const q of QUIZZES) {
    const textos = q.ops.map((o) => String(o).trim());
    assert.equal(new Set(textos).size, textos.length, `"${q.q}" repite una opción`);
  }
});

test('toda pregunta tiene enunciado y explicación', () => {
  for (const q of QUIZZES) {
    assert.ok(String(q.q || '').trim().length > 10, 'pregunta sin enunciado');
    const explica = q.exp || q.explicacion || q.why || '';
    assert.ok(String(explica).trim().length > 10, `"${q.q}" sin explicación`);
  }
});

test('el barajado de las opciones reparte parejo', () => {
  // Es el mismo Fisher-Yates que quedó en `_showQuiz`. Con el comparador
  // anterior la primera opción se quedaba quieta más seguido de lo que
  // corresponde, y la correcta está escrita casi siempre en la segunda.
  const barajar = (n) => {
    const orden = Array.from({ length: n }, (_, i) => i);
    for (let i = orden.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [orden[i], orden[j]] = [orden[j], orden[i]];
    }
    return orden;
  };
  const N = 20000;
  const veces = [0, 0, 0, 0];
  for (let i = 0; i < N; i++) veces[barajar(4).indexOf(1)]++;
  for (const [pos, n] of veces.entries()) {
    const p = n / N;
    assert.ok(p > 0.22 && p < 0.28, `la segunda opción cae en la posición ${pos} el ${(p * 100).toFixed(1)}%`);
  }
});

test('el código del quiz ya no usa el comparador tramposo', () => {
  // Vale la pena fijarlo: es un patrón que vuelve cada vez que alguien
  // necesita barajar algo con prisa.
  const desde = fuente.indexOf('function _showQuiz');
  // Sin las líneas de comentario: el comentario que explica por qué NO se usa
  // nombra el patrón, y si no se filtra el test se marca a sí mismo.
  const codigo = fuente.slice(desde, desde + 1500)
    .split(/\r?\n/)
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
  assert.ok(
    !/sort\(\s*\(\s*\)\s*=>\s*Math\.random\(\)\s*-\s*0?\.5\s*\)/.test(codigo),
    '_showQuiz volvió a barajar con el comparador que reparte mal',
  );
});

test('la opción correcta no se delata por su largo', () => {
  // Las respuestas correctas de un cuestionario tienden a ser las más largas y
  // las más matizadas ("aproximadamente", "alrededor de") mientras las falsas
  // son cortas y absolutas ("siempre", "nunca", "exactamente"). Era la más
  // larga en 7 de las 8 preguntas de texto: se acierta sin saber probabilidad.
  const detalle = [];
  let masLarga = 0, masCorta = 0, total = 0;
  QUIZZES.forEach((q, i) => {
    if (q.ops.every((o) => /^\d+$/.test(o))) return;          // opciones numéricas: no hay largo que medir
    total++;
    const largos = q.ops.map((o) => o.length);
    const c = largos[q.ok];
    if (largos.every((l, j) => j === q.ok || l < c)) masLarga++;
    if (largos.every((l, j) => j === q.ok || l > c)) masCorta++;
    detalle.push(`${i + 1}: ${largos.join('/')} (correcta ${c})`);
  });
  assert.ok(masLarga / total <= 0.5, `la correcta es la más larga en ${masLarga} de ${total}: ${detalle.join(' | ')}`);
  assert.ok(masCorta / total <= 0.6, `la correcta es la más corta en ${masCorta} de ${total}: ${detalle.join(' | ')}`);
});
