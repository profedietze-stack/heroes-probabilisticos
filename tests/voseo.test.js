// Voseo en todo el texto que lee el alumno. El juego es rioplatense (Tenés, Elegí, Jugá) y había tuteo mezclado
// («Elige tu dificultad», «Tú eres un outlier»). Este test recorre TODOS los literales de js/ y main.js, y el HTML
// visible de index.html, y falla si aparece una forma de tuteo. Un archivo nuevo entra solo.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');

const RAIZ = join(__dirname, '..');

function archivos(dir, acc = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (!/^(dev|vendor|node_modules)$/.test(f)) archivos(p, acc); }
    else if (/\.js$/.test(f)) acc.push(p);
  }
  return acc;
}

/* Formas de segunda persona del tuteo que NO existen en el voseo rioplatense escrito. */
const INDICATIVO = /(?<![A-Za-zÁÉÍÓÚáéíóúñ_])(tienes|puedes|debes|quieres|eres|sabes|necesitas|deseas|crees|piensas|haces|sientes|obtienes|encuentras|ignoras|aguantas|curas|pierdes)(?![A-Za-zÁÉÍÓÚáéíóúñ_])/i;
const PRONOMBRES = /(?<![A-Za-zÁÉÍÓÚáéíóúñ_])(Tú|tú|contigo|vosotros|para ti|a ti)(?![A-Za-zÁÉÍÓÚáéíóúñ_])/;
/* Imperativos con tilde o pronombre pegado, propios del tuteo (el voseo lleva el acento en la última sílaba). */
const IMPERATIVO = /(?<![A-Za-zÁÉÍÓÚáéíóúñ_])(Elige|Escoge|Selecciona|Intenta|Inténtalo|Recuerda|Sigue|Vuelve|Responde|Piensa|Prepárate|Apréndelo|Piénsalo|Ven|Toca|Espera|Usa|Lanza|Calcula|Compara|Investiga|Discute|Temblad|Confía|Observa|Mira|Prueba)(?![A-Za-zÁÉÍÓÚáéíóúñ_])/;

/* Descripciones en 3.ª persona que empiezan igual que un imperativo («Domina todas las formas…»): no se miran. */
const TERCERA_PERSONA = [
  /Nivel \d — /,            // rúbrica del docente en la guía didáctica: «Calcula correctamente…» describe al estudiante
  /^\s*Formativa:/,         // idem: «¿Elige por intuición o calcula?» pregunta por el estudiante, en 3.ª persona
];

function textos() {
  const salida = [];
  const lit = /(['"`])((?:\\.|(?!\1)[^\\\n])*?)\1/g;
  const fuentes = archivos(join(RAIZ, 'js')).concat([join(RAIZ, 'main.js')]);
  for (const f of fuentes) {
    const rel = relative(RAIZ, f).replace(/\\/g, '/');
    const lineas = readFileSync(f, 'utf8').split(/\r?\n/);
    lineas.forEach((ln, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(ln)) return;
      for (const m of ln.matchAll(lit)) {
        const t = m[2].replace(/<[^>]+>/g, ' ');
        if (/\s/.test(t) && /[a-záéíóú]{3}/i.test(t)) salida.push({ donde: `${rel}:${i + 1}`, t });
      }
    });
  }
  const html = readFileSync(join(RAIZ, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ');
  html.split(/\r?\n/).forEach((ln, i) => { const t = ln.replace(/<[^>]+>/g, ' '); if (/[a-záéíóú]{3}/i.test(t)) salida.push({ donde: `index.html:${i + 1}`, t }); });
  return salida;
}

test('no queda tuteo en los textos del juego (indicativo y pronombres)', () => {
  const malos = [];
  for (const { donde, t } of textos()) {
    const m = t.match(INDICATIVO) || t.match(PRONOMBRES);
    if (m) malos.push(`${donde}: «${m[1]}» en «${t.slice(0, 70)}»`);
  }
  assert.deepEqual(malos, [], 'tuteo:\n' + malos.join('\n'));
});

test('no quedan imperativos de tuteo («Elige», «Usa», «Toca»…) dirigidos al alumno', () => {
  const malos = [];
  for (const { donde, t } of textos()) {
    if (TERCERA_PERSONA.some((r) => r.test(t))) continue;
    const m = t.match(IMPERATIVO);
    if (m) malos.push(`${donde}: «${m[1]}» en «${t.slice(0, 70)}»`);
  }
  assert.deepEqual(malos, [], 'imperativos de tuteo:\n' + malos.join('\n'));
});

test('el detector reconoce el tuteo (para que el test no pase por estar roto)', () => {
  assert.match('Elige tu dificultad', IMPERATIVO);
  assert.match('Tú eres un outlier', PRONOMBRES);
  assert.match('¿Puedes calcular?', INDICATIVO);
  assert.doesNotMatch('Elegí tu dificultad', IMPERATIVO);
  assert.doesNotMatch('Vos sos un outlier', PRONOMBRES);
  assert.doesNotMatch('¿Podés calcular?', INDICATIVO);
});
