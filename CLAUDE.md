# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

```powershell
# Serve locally (port 8765)
python -m http.server 8765 --directory "C:\Users\nicod\Documents\JuegosEducativos\HeroesProbabilisticos"
```

Configured in `.claude/launch.json` as `"heroes-prob"` — use `preview_start` with that name.

After the server starts, open `http://localhost:8765`, wait for the loading bar, click **Continuar**.

There is no build step, no bundler and no package manager. Tests: `node tests/run-all.js` (plain node, no dependencies; `npm test` does the same). After touching anything the service worker precaches, bump `GAME_VERSION` (index.html **and** sw.js) and `CACHE_VERSION` (sw.js), then run `node tests/sellar-cache.js` — `tests/cache-version.test.js` fails otherwise.

## Architecture

### Runtime Environment

- **Phaser 3.60.0** self-hosted in `vendor/phaser.min.js` (no third-party requests: privacy rule for minors, and the game must boot offline)
- **Canvas**: fixed logical size 1024×700, `Scale.FIT` centers it in the viewport
- **No modules**: every JS file is a plain `<script>` appended in load order; everything lives in `window` scope
- **No transpilation**: ES6+ runs directly in the browser

### Script Load Order (critical)

`index.html` appends scripts sequentially via the splash loader. The order matters because later scripts depend on earlier globals:

1. `vendor/phaser.min.js`
2. `js/data/` — `monsters.js`, `items.js`, `npcs.js`, `puzzles.js`
3. `js/core/` — `state.js` → `config.js` → `audio.js` → `save.js` → `utils.js`
4. `js/render/` — `monsters.js`, `monster-svg.js`, `npc-render.js`
5. `js/ui/DiosaOverlay.js`
6. `js/scenes/` — all scenes including `PuzzleBase.js` before the 7 puzzle scenes
7. `main.js` — called **after** the user clicks Continuar so Phaser reads the correct container size

### Global Singletons

| Name | File | Purpose |
|------|------|---------|
| `STATE` | `js/core/state.js` | All mutable game state (HP, inventory, current boss, etc.) |
| `CFG` | `js/core/config.js` | Frozen game constants |
| `DIFICULTADES` | `js/core/config.js` | Difficulty multipliers keyed by `'facil'|'normal'|'heroe'|'legendario'` |
| `CLASES` | `js/core/clases.js` | The 4 classes (pure data + functions). Each has one advantage and one cost; HP/MP/ATK/DEF are baked when the class is chosen (IntroScene), the rest is applied per battle. Balance is measured with `node tools/simular.js`; `tests/equilibrio.test.js` guards it |
| `PUZZLE_CATALOG` | `js/data/puzzles.js` | Array of 7 puzzle definitions (id, sceneKey, recompensa) |
| `Music` | `js/core/audio.js` | IIFE with `play(theme)`, `stop()`, `setVol(v)`; themes: `'menu'`, `'battle'`, `'boss'` |
| `AC` | `js/core/audio.js` | `AudioContext` — must call `initAudio()` on first user gesture |

### Scene Graph

```
MenuScene
  └─▶ IntroScene (character setup)
        └─▶ BattleScene ◀──────────────────────┐
              ├─▶ VictoryScene ──▶ MapScene ──┤
              └─▶ FinalScene (after boss 10)   │
MapScene                                        │
  ├─▶ BattleScene (boss node) ─────────────────┘
  └─▶ PuzzleScene (NPC node)
        └─▶ PuzzleUrna / PuzzleMoneda / PuzzleApuesta /
            PuzzleRuleta / PuzzleDados / PuzzlePuertas / PuzzleTesoro
                  └─▶ MapScene (via pzComplete)

ArcadeHubScene ─▶ ArcadeScene ─▶ [same 7 puzzle scenes]
               └─▶ LibreScene  ─▶ [same 7 puzzle scenes]
```

Scene transitions always use `this.cameras.main.fadeOut → scene.start(...)`.

### Minigame Shared System (`PuzzleBase.js`)

All 7 puzzle scenes call these shared helpers — never modify their signatures without updating all consumers:

- `pzBg(scene, npcKey)` — animated background, returns `{w, h}`
- `pzHeader(scene, title, npcKey, w)` — animated title + decorative line
- `pzButtons(scene, opts, y, onSelect)` — 4-option answer buttons with entrance animation, hover, burst on correct
- `pzResult(scene, isCorrect, explain, hpReward, puzId)` — result modal with HP counter animation; calls `pzComplete` after delay
- `pzComplete(scene)` — awards HP, saves, transitions to MapScene (or ArcadeScene)
- `pzPopIn(scene, obj, delay, fromY)` — pop-in entrance tween
- `pzFloatY(scene, obj, amp, dur, delay)` — infinite vertical float
- `pzBurst(scene, x, y, color, count)` — particle burst (manual, no Phaser particles)

### DOM vs Canvas Layering (critical pitfall)

Phaser's `this.add.dom()` elements (NPC character, monster) are **real HTML elements** in a container div that always renders above the Phaser canvas, regardless of `setDepth()`. Workaround pattern used in the codebase:

```js
// Hide DOM element before showing canvas-based modal
if (this.monsterDom) this.monsterDom.setVisible(false);
// Restore after modal closes
if (this.monsterDom) this.monsterDom.setVisible(true);
// Fade during dice animation (can't hide completely or layout shifts)
if (this.monsterDom?.node) this.monsterDom.node.style.opacity = '0.25';
```

### Puzzle Scene Guard

Each puzzle scene's `init()` must reset `this._selecting = false`. If omitted, buttons stop working on scene restart (the flag persists across Phaser scene reuse).

### Data Shapes

**PUZZLE_CATALOG entry:**
```js
{ id, npc:'mercader'|'oraculo', nombre, desc, sceneKey, recompensa:{ hp, item?, desc } }
```

**STATE.inventario entry:**
```js
{ id: Number, cantidad: Number }  // id matches ITEMS array index + 1
```

**Save format** (`localStorage` key `heroesProb_save`): see `js/core/save.js`. Safari private mode throws `QuotaExceededError` on `setItem` — always use `saveGame()` (handles it) instead of calling `localStorage` directly.

### Audio Pattern

```js
// Always gate on AC existence before making sound
snd_item && snd_item();   // used throughout scenes
// Music themes: 'menu', 'battle', 'boss'
Music.play('battle');
```

`initAudio()` must be called inside a user gesture handler. It is called on splash "Continuar" click and also on `click`/`touchstart`/`keydown` in `main.js` as a fallback for iOS Safari.

### CSS Architecture

| File | Scope |
|------|-------|
| `css/variables.css` | CSS custom properties, `html/body/canvas` resets, iOS viewport fixes |
| `css/modals.css` | All HTML overlay modals + responsive breakpoints (≤580px, ≤380px) |
| `css/buttons.css` | `.btn-action` and variants (primary, secondary, danger, magic) |
| `css/npc-animations.css` | CSS keyframes for NPC idle/talking states driven by `.npc-container[class]` |
| `css/ui.css` | Toast, item modal, stats tables, bar chart |

### Dev / Testing Mode

Activar con `?dev` en la URL. **Zero impact on production** — all code is in `js/dev/debug.js` and only loads when the param is present.

**Useful URL combos:**

| URL | Effect |
|-----|--------|
| `?dev` | Green overlay + global error catcher |
| `?dev&go` | Auto-launch without clicking "Continuar" |
| `?dev&go&boss=5` | Jump directly to boss 5 |
| `?dev&go&puzzle=PuzzleUrna` | Open specific puzzle |
| `?dev&go&scene=MapScene` | Any Phaser scene |
| `?dev&go&diff=legendario&hp=999` | Difficulty + HP combo |
| `?dev&go&boss=3&allpuzzles` | Boss 3 with all puzzles already done |

**Console API (`window.DEV`):**

```js
DEV.dump()            // compact STATE printout
DEV.validateState()   // checks STATE invariants, returns error array
DEV.heal()            // restore HP to max
DEV.addItem()         // add random item to inventory
DEV.nextBoss()        // advance to next boss
DEV.winBattle()       // win current battle (jumps to VictoryScene)
DEV.goto('MapScene')  // jump to any Phaser scene
DEV.activeScene()     // returns current active scene instance
```

**Overlay:** backtick `` ` `` to collapse/expand. Shows current scene, boss, HP, items, global roll count — refreshes every 500ms.

**Errors:** `window.onerror` and `unhandledrejection` show toast on screen + `console.error` with exact location (`file:line:col`).

### Encoding Rule

**Never use PowerShell `Set-Content` or `Out-File` on files containing emojis or non-ASCII.**  
Use the Claude Code `Write` or `Edit` tool instead (they write UTF-8 safely). This applies to all JS/CSS/HTML files in this project.
