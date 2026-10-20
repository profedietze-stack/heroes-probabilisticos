// PuzzleScene (el encuentro con el Mercader / el Oráculo): ciclo de vida de la
// escena y salto de la presentación. Se carga el código real con un Phaser de
// mentira.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const contexto = vm.createContext({
  Phaser: { Scene: class { constructor() {} } },
  console, Math, Object, Array, Set, Number, String, JSON,
  snd_item() {},
});
vm.runInContext(readFileSync(join(__dirname, '..', 'js', 'scenes', 'PuzzleScene.js'), 'utf8'), contexto,
  { filename: 'PuzzleScene.js' });

const nueva = () => vm.runInContext('Object.create(PuzzleScene.prototype)', contexto);

test('init() reinicia lo que la visita anterior dejó en la escena', () => {
  // Phaser reutiliza la instancia. `_choiceShown` quedaba en true tras el primer
  // Mercader y desde el segundo no aparecía el menú con "Ver tienda": la tienda
  // sólo se podía abrir una vez por carga de la página.
  const e = nueva();
  Object.assign(e, { _choiceShown: true, _choiceHits: [{}, {}], _choiceObjs: [{}],
                     _confirmedAdvance: true, _puzzleShown: true, _selecting: true });
  e.init({ npc: 'mercader', puzzles: [0, 1], nodeIdx: 3 });
  assert.equal(e._choiceShown, false, 'el menú del Mercader tiene que volver a mostrarse');
  assert.equal(e._choiceHits.length, 0, 'los botones destruidos de la visita anterior no se arrastran');
  assert.equal(e._confirmedAdvance, false, 'el aviso de punto de no retorno vuelve a salir');
  assert.equal(e._puzzleShown, false);
  assert.equal(e._selecting, false);
});

function conPresentacion() {
  const e = nueva();
  e.init({ npc: 'mercader', puzzles: [0, 1] });
  const quitados = [];
  e._typeEv = { remove: () => quitados.push('tipeo') };
  e._dlgTimer = { remove: () => quitados.push('espera') };
  e._dialogueTxt = { texto: '', setText(t) { this.texto = t; } };
  e._contHint = { setAlpha() {} };
  e._dlgQueue = ['uno', 'dos', 'tres'];
  e._dlgIdx = 1;
  e._typing = true;
  e.llamadas = 0;
  e._nextDialogue = () => { e.llamadas++; };
  return { e, quitados };
}

test('tocar la caja salta la presentación y cancela los temporizadores pendientes', () => {
  const { e, quitados } = conPresentacion();
  e._skipDialogue();
  assert.equal([...quitados].sort().join(), 'espera,tipeo',
    'si queda vivo el temporizador de espera, vuelve a llamar a _nextDialogue y el Mercader abre los enigmas encima de su menú');
  assert.equal(e._dialogueTxt.texto, 'tres', 'queda visible la última línea completa');
  assert.equal(e._dlgIdx, 3);
  assert.equal(e._typing, false);
  assert.equal(e.llamadas, 1);
});

test('si el menú o los enigmas ya están a la vista, tocar la caja no hace nada', () => {
  for (const campo of ['_choiceShown', '_puzzleShown']) {
    const { e, quitados } = conPresentacion();
    e[campo] = true;
    e._skipDialogue();
    assert.equal(e.llamadas, 0, campo);
    assert.equal(quitados.length, 0, campo);
  }
});

test('una llamada tardía a _nextDialogue no abre los enigmas encima del menú del Mercader', () => {
  // Al saltar la presentación quedaba vivo el temporizador de arranque (800 ms):
  // al dispararse volvía a llamar a _nextDialogue y, con el menú ya a la vista,
  // caía en la rama que muestra la lista de enigmas. Se vio en el navegador: el
  // menú "Probar mi suerte / Ver tienda" aparecía y 2 s después la lista de
  // enigmas se pintaba encima.
  const e = nueva();
  e.init({ npc: 'mercader', puzzles: [0, 1] });
  e._dlgQueue = ['uno'];
  e._dlgIdx = 1;
  e._choiceShown = true;                       // el menú ya está a la vista
  let abrioEnigmas = false;
  e._showPuzzlePanel = () => { abrioEnigmas = true; };
  e._showMerchantChoice = () => {};
  vm.runInContext('globalThis.setNPCState = () => {}', contexto);
  e._nextDialogue();
  assert.equal(abrioEnigmas, false);
});
