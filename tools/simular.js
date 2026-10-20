#!/usr/bin/env node
// tools/simular.js — Simulación de corridas completas con las fórmulas del motor.
//
//   node tools/simular.js                  tabla de equilibrio entre clases
//   node tools/simular.js --corridas 4000  más corridas (por defecto 2000)
//   node tools/simular.js --dif heroe      otra dificultad
//
// Qué modela: 10 jefes con 2 enigmas acertados antes de cada uno (HP, oro, XP), tienda
// con pociones y buffs, mejoras de XP según una "build" de poderes, reintentos tras
// morir (resiliencia +1 hasta +3, se revive con REVIVIR_FRAC del HP). Las reglas de
// combate son las de BattleScene.fase2/_ejecutarAtaqueMonstruo; los números de las
// clases salen de js/core/clases.js y los de poderes de js/core/skills.js (módulos reales).
// Qué NO modela: eventos del mapa, Dado Sagrado, Segundo Aliento, Predicción, Espejo,
// Truncar, Maldición de un dado ni los ítems de un solo uso raros. Es una vara para
// comparar clases y versiones del balance, no una predicción del aula.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const RAIZ = path.join(__dirname, '..');
const leer = (f) => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const ctx = vm.createContext({ console });
vm.runInContext(['js/core/config.js', 'js/data/monsters.js', 'js/data/items.js']
  .map((f) => leer(f).replace(/^const /gm, 'var ')).join('\n'), ctx);
const { DIFICULTADES, MONSTERS, ITEMS } = ctx;
const S = require(path.join(RAIZ, 'js/core/skills.js'));
const C = require(path.join(RAIZ, 'js/core/clases.js'));
// ATK=… y REVIVE=… sobreescriben los valores de config.js para probar variantes sin editar el juego.
const reviveFrac = process.env.REVIVE !== undefined ? +process.env.REVIVE : vm.runInContext('typeof REVIVIR_FRAC === "number" ? REVIVIR_FRAC : 0.3', ctx);
const bonusCampaña = (j, dif) => process.env.ATK !== undefined ? Math.floor(j * +process.env.ATK) : vm.runInContext(`bonusAtaqueCampaña(${j}, ${JSON.stringify(dif)})`, ctx);

// Generador con semilla (mulberry32): las corridas son reproducibles y el test de equilibrio
// (tests/equilibrio.test.js) no es intermitente. Sin semilla usa Math.random.
let _rnd = Math.random;
function semilla(n) { let a = n >>> 0; _rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const r12 = () => 1 + Math.floor(_rnd() * 12);

// Builds: orden de compra con XP. Cada entrada = [poder, rango objetivo].
const BUILDS = {
  control: [['escarcha', 1], ['regeneracion', 1], ['escarcha', 2], ['egida', 1], ['regeneracion', 2], ['egida', 2], ['escarcha', 3]],
  dano:    [['cargaProb', 1], ['reflejo', 1], ['sanguijuela', 1], ['cargaProb', 2], ['reflejo', 2], ['sanguijuela', 2], ['cargaProb', 3]],
};
const FORMA = MONSTERS.map((m) => m.forma);

function crearHeroe(claveClase, dif) {
  const d = DIFICULTADES[dif];
  const e = { hpMax: d.hpHero, ataqueBase: d.atkBase, defensaBase: d.defBase, mpMax: 4 };
  C.aplicarClaseInicial(e, claveClase);
  return { ...e, res: d.resBonus, oro: ({ facil: 40, normal: 25, heroe: 10, legendario: 0 })[dif], xp: 0,
           up: 0, skills: {}, inv: {}, claseKey: claveClase, dif, muertes: 0 };
}

const PRECIOS = { pot1: 12, pot2: 30, atk3: 25, def4: 25, suerte: 14, regen: 35, sword: 40, cheb: 45, gem: 45, star: 50, crown: 60, pa: 80, pd: 80 };
const MINJEFE = { pot1: 0, pot2: 2, atk3: 1, def4: 1, suerte: 0, regen: 3, sword: 3, cheb: 4, gem: 4, star: 5, crown: 5, pa: 6, pd: 7 };

function bonusPoder(h, id) { return S.skillRank(h.skills, id); }
function comprarXP(h, build, o) {
  for (;;) {
    let comprado = false;
    for (const [id, rk] of BUILDS[build]) {
      const cur = bonusPoder(h, id);
      if (cur >= rk) continue;
      const costo = S.nextRankCost(h.skills, id);
      if (costo !== null && h.xp >= costo) { h.xp -= costo; h.skills[id] = cur + 1; comprado = true; }
      break;                                   // respeta el orden de la build
    }
    if (!comprado) break;
  }
  // Lo que sobra, a HP máximo (como haría un jugador sin más poderes que comprar)
  if (BUILDS[build].every(([id, rk]) => bonusPoder(h, id) >= rk)) {
    for (;;) {
      const c = Math.round(25 * Math.pow(1.25, h.up));
      if (h.xp < c) break;
      h.xp -= c; h.up++; h.hpMax += 20; h.hp = Math.min(h.hpMax, h.hp + 20);
    }
  }
}

function tienda(h, j, o) {
  const dineroPrecio = (k) => C.precioItem(h.claseKey, PRECIOS[k]);
  const comprar = (k) => { if (MINJEFE[k] <= j && h.oro >= dineroPrecio(k)) { h.oro -= dineroPrecio(k); h.inv[k] = (h.inv[k] || 0) + 1; return true; } return false; };
  for (let g = 0; g < 40; g++) {
    if (j >= 5 && !h.inv.star && comprar('star')) continue;
    if (j >= 6 && comprar('pa')) continue;
    if (j >= 7 && comprar('pd')) continue;
    if (j >= 2 && (h.inv.pot2 || 0) < 3 && comprar('pot2')) continue;
    if ((h.inv.pot1 || 0) < 3 && comprar('pot1')) continue;
    if (j >= 3 && !h.inv.sword && comprar('sword')) continue;
    if (j >= 4 && !h.inv.cheb && comprar('cheb')) continue;
    if (j >= 1 && !h.inv.atk3 && comprar('atk3')) continue;
    break;
  }
}

function batalla(h, j, build, o) {
  const dif = DIFICULTADES[h.dif];
  const m = MONSTERS[j];
  const st = { hp: Math.round(m.hpMax * dif.monsterHpMult), at: Math.round(m.ataque * dif.monsterAtkMult), de: Math.round(m.defensa * dif.monsterAtkMult) };
  let mhp = st.hp; const mhpMax = mhp;
  let atk = h.ataqueBase + bonusCampaña(j, h.dif), def = h.defensaBase;
  let mp = h.mpMax, t = 0, racha = 0, primero = true;
  let regen = 0, regenT = 0, egT = 0, egV = 0, chebT = 0;
  let starActiva = false;
  const buffs = [];
  const pot = (v) => C.potenciaItem(h.claseKey, v);
  const usa = (k) => { if ((h.inv[k] || 0) > 0) { h.inv[k]--; return true; } return false; };
  if (j >= 1 && usa('atk3')) { const v = pot(2); atk += v; buffs.push({ k: 'a', v, t: 3 }); }
  if (j >= 1 && usa('def4')) { const v = pot(2); def += v; buffs.push({ k: 'd', v, t: 3 }); }
  if (j >= 3 && usa('sword')) { const v = pot(3); atk += v; buffs.push({ k: 'a', v, t: 2 }); }
  if (j >= 4 && usa('cheb')) chebT = 3;
  if (j >= 5 && usa('star')) starActiva = true;                   // el motor actual la deja toda la batalla
  const costo = (id) => { const r = bonusPoder(h, id); if (!r) return null; return C.costoPoder(h.claseKey, S.getPower(id).mp[r - 1], primero); };
  const lanzar = (id) => { const c = costo(id); if (c === null || mp < c) return false; mp -= c; primero = false; return true; };

  for (;;) {
    t++;
    // Curación gratis (no gasta turno)
    while (h.hp < h.hpMax * 0.45) {
      if (h.hp <= h.hpMax - 40 && usa('pot2')) h.hp = Math.min(h.hpMax, h.hp + pot(40));
      else if (usa('pot1')) h.hp = Math.min(h.hpMax, h.hp + pot(15));
      else if (usa('pot2')) h.hp = Math.min(h.hpMax, h.hp + pot(40));
      else break;
    }
    let congelar = false, reflejo = 0, sangui = 0, carga = 0;
    if (build === 'control') {
      if (egT <= 0 && h.hp < h.hpMax * 0.8 && lanzar('egida')) { const r = bonusPoder(h, 'egida'); egV = S.getPower('egida').ranks[r - 1].red; egT = S.getPower('egida').ranks[r - 1].turnos; }
      if (regenT <= 0 && h.hp < h.hpMax * 0.7 && lanzar('regeneracion')) { const r = bonusPoder(h, 'regeneracion'); regen = S.getPower('regeneracion').ranks[r - 1].heal; regenT = S.getPower('regeneracion').ranks[r - 1].turnos; }
      if (lanzar('escarcha')) congelar = true;
    } else {
      if (lanzar('reflejo')) reflejo = S.getPower('reflejo').ranks[bonusPoder(h, 'reflejo') - 1];
      if (h.hp < h.hpMax * 0.8 && lanzar('sanguijuela')) sangui = S.getPower('sanguijuela').ranks[bonusPoder(h, 'sanguijuela') - 1];
      if (mp >= (costo('cargaProb') || 99)) carga = bonusPoder(h, 'cargaProb');     // se paga si pega
    }
    mp = Math.min(h.mpMax, mp + 1);
    const d1 = r12(), d2 = r12(), s = d1 + d2;
    const sf = s + C.bonoPermanente(h.claseKey, h.res);
    const u = Math.max(2, m.umbral - (starActiva ? 2 : 0));
    const hit = sf >= u;
    if (hit) {
      let dmg = atk + Math.floor((sf - u) * 1.5) + C.bonusRacha(h.claseKey, racha);
      dmg = Math.max(3, dmg - Math.floor(st.de * 0.4));
      if (carga && lanzar('cargaProb')) dmg += S.cargaDamage(s, carga);
      mhp -= dmg; racha++;
      if (mhp <= 0) return { win: true, t };
    } else racha = 0;
    if (!congelar) {
      const ms = r12() + r12();
      let dm = st.at + Math.floor((ms - 10) / 3);
      if (FORMA[j] === 'tiburon') dm += Math.floor(t / 2);
      if (FORMA[j] === 'titan' && t >= 6 && t <= 8) dm += 4;
      if (FORMA[j] === 'demiurgo' && mhp < mhpMax * 0.5) dm += 5;
      dm = Math.max(2, dm - Math.floor(def * 0.5));
      let red = 0; if (egT > 0) red = Math.max(red, egV); if (chebT > 0) red = Math.max(red, 0.3);
      if (red) dm = Math.max(1, Math.floor(dm * (1 - red)));
      if (!hit) dm = Math.floor(dm * 1.15);
      if (reflejo) { mhp -= Math.round(dm * reflejo); if (mhp <= 0) return { win: true, t }; }
      h.hp -= dm;
      if (sangui) h.hp = Math.min(h.hpMax, h.hp + Math.round(dm * sangui));
    }
    if (regenT > 0) { h.hp = Math.min(h.hpMax, h.hp + regen); regenT--; }
    if (egT > 0) egT--; if (chebT > 0) chebT--;
    for (let i = buffs.length - 1; i >= 0; i--) { buffs[i].t--; if (buffs[i].t <= 0) { if (buffs[i].k === 'a') atk -= buffs[i].v; else def -= buffs[i].v; buffs.splice(i, 1); } }
    if (h.hp <= 0) return { win: false, t };
    if (t > 600) return { win: false, t };
  }
}

function corrida(claveClase, dif, build, o) {
  const h = crearHeroe(claveClase, dif);
  const xm = ({ facil: 1.3, normal: 1, heroe: 0.85, legendario: 0.7 })[dif];
  const pzOro = ({ facil: 1, normal: 1.2, heroe: 1.5, legendario: 2 })[dif];
  const oroJ = ({ facil: 0.8, normal: 1, heroe: 1.2, legendario: 1.5 })[dif];
  for (let i = 0; i < Math.round(DIFICULTADES[dif].itemsIniciales + C.itemsIniciales(claveClase, 0)); i++) {
    const k = i % 2 ? 'atk3' : 'pot1'; h.inv[k] = (h.inv[k] || 0) + 1;
  }
  const muertesJefe = [];
  for (let j = 0; j < 10; j++) {
    for (let p = 0; p < 2; p++) { h.hp = Math.min(h.hpMax, h.hp + 16); h.oro += Math.round(8 * pzOro); h.xp += Math.round(40 * xm); }
    comprarXP(h, build, o); tienda(h, j, o);
    let intentos = 0;
    for (;;) {
      intentos++;
      const r = batalla(h, j, build, o);
      if (r.win) { h.oro += Math.round((j === 9 ? 150 : 25 + 5 * j) * oroJ); h.xp += Math.round((33 + 12 * j) * xm); comprarXP(h, build, o); break; }
      h.muertes++; h.res = Math.min(3, h.res + 1); h.hp = Math.max(1, Math.round(h.hpMax * reviveFrac)); comprarXP(h, build, o);
      if (intentos >= 25) return { fin: false, jefe: j, muertes: h.muertes, muertesJefe };
    }
    muertesJefe.push(intentos - 1);
  }
  return { fin: true, jefe: 10, muertes: h.muertes, muertesJefe };
}

function medir(claveClase, dif, build, N) {
  let fin = 0, muertes = 0, sinMorir = 0; const porJefe = Array(10).fill(0); const trabado = {};
  for (let i = 0; i < N; i++) {
    const r = corrida(claveClase, dif, build, {});
    muertes += r.muertes; if (r.fin) fin++; if (!r.muertes) sinMorir++;
    r.muertesJefe.forEach((x, j) => { porJefe[j] += x; });
    if (!r.fin) trabado[r.jefe + 1] = (trabado[r.jefe + 1] || 0) + 1;
  }
  return { fin: fin / N, muertes: muertes / N, sinMorir: sinMorir / N, porJefe: porJefe.map((x) => x / N), trabado };
}

module.exports = { medir, corrida, BUILDS, semilla };

if (require.main === module) {
  const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
  const N = +arg('corridas', 2000), dif = arg('dif', 'normal');
  console.log(`Simulación: ${N} corridas por celda, dificultad ${dif}. Revivir al ${(reviveFrac * 100) | 0} % de HP.`);
  console.log('terminan = % de corridas que derrotan a los 10 jefes (hasta 25 intentos por jefe) · muertes = media por corrida\n');
  const filas = [];
  for (const build of Object.keys(BUILDS)) {
    console.log(`Build "${build}"`);
    for (const k of C.CLASES_ORDEN) {
      const r = medir(k, dif, build, N);
      filas.push({ build, k, ...r });
      console.log(`  ${k.padEnd(11)} terminan ${(r.fin * 100).toFixed(0).padStart(3)} %  muertes ${r.muertes.toFixed(1).padStart(5)}  sin morir ${(r.sinMorir * 100).toFixed(0).padStart(2)} %  muertes por jefe: ${r.porJefe.map((x) => x.toFixed(1)).join(' ')}` +
        (Object.keys(r.trabado).length ? `  | trabadas en jefe: ${JSON.stringify(r.trabado)}` : ''));
    }
  }
  const media = (b) => { const f = filas.filter((x) => x.build === b); return f.reduce((a, x) => a + x.muertes, 0) / f.length; };
  console.log('\nDispersión entre clases (muertes medias): ' + Object.keys(BUILDS).map((b) => {
    const f = filas.filter((x) => x.build === b).map((x) => x.muertes); return `${b}: ${Math.min(...f).toFixed(1)}–${Math.max(...f).toFixed(1)} (media ${media(b).toFixed(1)})`;
  }).join(' · '));
}
