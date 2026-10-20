// Utilidades de las pruebas e2e en navegador real (Playwright). No las corre `npm test`.
// Playwright no es una dependencia del repo: se toma de PLAYWRIGHT (ruta o nombre del módulo) o de `playwright`.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..', '..');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.ico': 'image/x-icon' };

function cargarPlaywright() {
  const candidatos = [process.env.PLAYWRIGHT, 'playwright'].filter(Boolean);
  for (const c of candidatos) { try { return require(c); } catch (e) { /* sigue */ } }
  console.error('No se encontró Playwright. Instalalo (npm i -D playwright && npx playwright install chromium) o\n' +
    'apuntá la variable PLAYWRIGHT a su carpeta (p. ej. PLAYWRIGHT=/ruta/a/node_modules/playwright).');
  process.exit(2);
}

/** Servidor estático del repo en un puerto libre. Devuelve { url, cerrar }. */
function servir() {
  const srv = http.createServer((req, res) => {
    let ruta = decodeURIComponent(req.url.split('?')[0]);
    if (ruta.endsWith('/')) ruta += 'index.html';
    const f = path.join(RAIZ, ruta);
    if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('no'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${srv.address().port}`, cerrar: () => srv.close() })));
}

/** Abre el juego, pasa la pantalla de inicio y silencia el audio. `movil` fuerza el lienzo de teléfono. */
async function abrir(pw, base, { ancho = 812, alto = 375, movil = true } = {}) {
  const b = await pw.chromium.launch({ args: ['--mute-audio'] });
  const ctx = await b.newContext({ viewport: { width: ancho, height: alto }, ...(movil ? { hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : {}) });
  const p = await ctx.newPage();
  const log = [];
  p.on('console', (m) => { if (m.type() === 'error') log.push('error: ' + m.text()); });
  p.on('pageerror', (e) => log.push('PAGEERROR ' + e.message));
  await p.addInitScript(() => { try { localStorage.setItem('heroesProb_tutorialVisto', '1'); sessionStorage.setItem('hpSinAvisoGirar', '1'); } catch (e) { /* sin storage */ } });
  // El navegador de prueba a veces deja colgada la carga: se reintenta.
  for (let i = 0; i < 3; i++) {
    try { await p.goto(`${base}/${movil ? '?movil=1&' : '?'}v=${Date.now()}`, { timeout: 20000 }); break; } catch (e) { if (i === 2) throw e; }
  }
  await p.waitForSelector('#splashContinue:not([disabled])', { timeout: 20000 });
  await p.click('#splashContinue');
  await p.waitForFunction(() => window.game && window.game.scene.getScenes(true).length > 0, { timeout: 20000 });
  await p.evaluate(() => { try { Music.mute(); } catch (e) { /* sin música */ } });
  return { b, p, log };
}

/** Arma una partida nueva directo en el estado (sin clics) y va al mapa. */
async function partidaNueva(p, { clase = 'guerrero', dificultad = 'normal' } = {}) {
  await p.evaluate(([c, d]) => {
    Object.assign(STATE, freshRunState());
    const diff = DIFICULTADES[d];
    Object.assign(STATE, { nombre: 'Tester', dificultad: d, hp: diff.hpHero, hpMax: diff.hpHero, ataque: diff.atkBase, defensa: diff.defBase,
      ataqueBase: diff.atkBase, defensaBase: diff.defBase, resiliencia: diff.resBonus, oro: 25 });
    aplicarClaseInicial(STATE, c);
    window.game.scene.getScenes(true).forEach((s) => s.scene.start('MapScene'));
  }, [clase, dificultad]);
  await esperar(p, 'MapScene');
}

async function esperar(p, clave, ms = 15000) {
  await p.waitForFunction((k) => window.game.scene.getScenes(true).some((s) => s.scene.key === k), clave, { timeout: ms });
  await p.waitForTimeout(1800);
}

async function irA(p, clave, datos = {}, antes = '') {
  await p.evaluate(([k, d, x]) => { if (x) (0, eval)(x); window.game.scene.getScenes(true).forEach((s) => s.scene.start(k, d)); }, [clave, datos, antes]);
  await esperar(p, clave);
}

/** Objetos tocables y textos de la escena activa, en píxeles CSS. */
function medir(p) {
  return p.evaluate(() => {
    const g = window.game, cv = g.canvas.getBoundingClientRect(), k = cv.width / g.scale.width;
    const r = { k: +k.toFixed(3), tocables: [], textos: [] };
    g.scene.getScenes(true).forEach((s) => {
      const cam = s.cameras.main;
      (s.input._list || []).forEach((o) => {
        if (!o.input || !o.input.enabled || o.visible === false) return;
        const h = o.input.hitArea; let w = h.width, hh = h.height; if (h.radius) { w = hh = h.radius * 2; }
        // Interfaz fija (scrollFactor 0) = escala 1; lo del mundo, el zoom de su cámara.
        const z = o.scrollFactorX === 0 ? 1 : ((s._pz && s._pz.cams) ? s._pz.zoom : cam.zoom);
        r.tocables.push({ txt: (o.text || '').toString().slice(0, 24), tipo: o.type, w: Math.round(w * Math.abs(o.scaleX || 1) * k * z), h: Math.round(hh * Math.abs(o.scaleY || 1) * k * z) });
      });
      const rec = (l) => l.forEach((o) => {
        if (o.visible === false) return; if (o.list) rec(o.list);
        if (o.type === 'Text' && o.text && o.alpha > 0 && o.width > 0) r.textos.push({ txt: o.text.slice(0, 20), px: +((parseFloat(o.style.fontSize) || 0) * k * cam.zoom).toFixed(1) });
      });
      rec(s.children.list);
    });
    return r;
  });
}

module.exports = { RAIZ, cargarPlaywright, servir, abrir, partidaNueva, esperar, irA, medir };
