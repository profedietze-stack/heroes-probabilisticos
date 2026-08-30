# Sistema de Dificultades — Diseño

**Fecha:** 2026-06-10  
**Proyecto:** Héroes Probabilísticos

## Objetivo

Agregar 4 niveles de dificultad (Fácil, Normal, Héroe, Legendario) que afecten stats de combate y mecánicas de inicio de partida. La selección ocurre en IntroScene después de ingresar el nombre del héroe.

## Datos de Dificultad

Nuevo objeto `DIFICULTADES` en `config.js`:

```js
const DIFICULTADES = {
  facil:     { label:'⭐ Fácil',      hpHero:200, atkBase:10, defBase:6, monsterHpMult:0.75, monsterAtkMult:0.75, itemsIniciales:3, resBonus:1 },
  normal:    { label:'⚔ Normal',     hpHero:150, atkBase:8,  defBase:5, monsterHpMult:1.0,  monsterAtkMult:1.0,  itemsIniciales:2, resBonus:0 },
  heroe:     { label:'🗡 Héroe',      hpHero:120, atkBase:7,  defBase:4, monsterHpMult:1.25, monsterAtkMult:1.25, itemsIniciales:1, resBonus:0 },
  legendario:{ label:'💀 Legendario', hpHero:90,  atkBase:6,  defBase:3, monsterHpMult:1.5,  monsterAtkMult:1.5,  itemsIniciales:0, resBonus:0 },
};
```

`STATE.dificultad` (string key) persiste durante toda la partida. El reset en MenuScene lo devuelve a `'normal'`.

## Flujo UI

IntroScene actual: input nombre → confirmar → fade BattleScene.

Nuevo flujo: input nombre → confirmar → **selector dificultad (4 botones)** → confirmar dificultad → fade BattleScene.

El selector muestra para cada nivel: label + descripción de stats (HP héroe, multiplicador monstruos, items iniciales). La dificultad seleccionada se resalta. Al confirmar: guarda `STATE.dificultad`, aplica `resBonus` a `STATE.resiliencia`, luego transiciona.

## Badge en BattleScene

Badge pequeño en esquina superior izquierda (igual al panel Resiliencia existente) mostrando la dificultad activa. Solo visible si no es `'normal'` (o siempre visible — implementador decide según espacio).

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `js/core/config.js` | Agregar objeto `DIFICULTADES` |
| `js/core/state.js` | Agregar `dificultad:'normal'` al STATE inicial |
| `js/scenes/IntroScene.js` | Paso selector dificultad post-confirmación de nombre |
| `js/scenes/BattleScene.js` | Escalar stats monstruo con mults; ajustar items iniciales; badge dificultad en HUD |
| `js/scenes/MenuScene.js` | Incluir `dificultad:'normal'` en el Object.assign del reset de STATE |

## Lógica de Escalado (BattleScene)

```js
const diff = DIFICULTADES[STATE.dificultad];
STATE.jefeHp    = Math.round(m.hpMax    * diff.monsterHpMult);
STATE.jefeHpMax = STATE.jefeHp;
this.monster.ataque  = Math.round(m.ataque  * diff.monsterAtkMult);
this.monster.defensa = Math.round(m.defensa * diff.monsterAtkMult);
```

Items iniciales (primera batalla, inventario vacío):
```js
const n = DIFICULTADES[STATE.dificultad].itemsIniciales;
if(n > 0) { const items = darItemsAleatorios(n); ... }
```

## Constraints

- No tocar `monsters.js`, `save.js`, `MapScene.js`
- No archivos nuevos
- `STATE.dificultad` debe incluirse en `saveGame()`/`loadGame()` — verificar que `save.js` serializa STATE completo (si usa `JSON.stringify(STATE)`, ya funciona)
