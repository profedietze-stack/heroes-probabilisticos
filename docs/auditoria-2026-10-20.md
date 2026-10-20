# Auditoría de Héroes Probabilísticos — 20/10/2026

Auditoría con doble perfil (diseño de juego + ingeniería) sobre el código de
`C:\Users\nicod\Documents\JuegosEducativos\HeroesProbabilisticos`, versión publicada
`GAME_VERSION 4 / heroesprob-v6` (idéntica a la local al empezar).

- **Línea base:** `node tests/run-all.js` → 13 suites verdes (el enunciado decía 7/7).
- **Al cerrar:** 20 suites, ~150 casos, todas verdes. Sin push, sin commits, sin tocar
  otros juegos ni la visibilidad del repo. Todo está en el árbol de trabajo.
- **Versiones:** `GAME_VERSION 5` (index.html y sw.js) y `CACHE_VERSION heroesprob-v7`,
  subidas juntas, con `sw-precache.json` re-sellado.

---

## a) Veredicto de publicación por plataforma

| Plataforma | Veredicto | Qué lo sostiene |
|---|---|---|
| **PC** | **LISTO CON RESERVAS** | Camino de entrada jugado con mouse real desde guardado limpio, **las 4 clases**: menú → nombre → dificultad → clase → mapa → Mercader (Urna) → Oráculo → Guardián 1 derrotado → Victoria → mapa, con **0 errores de consola** y sin banner. Offline probado en Chromium real. Reservas: la economía/dificultad (§c, decisiones D1–D4) y el canvas ampliado 1,54× en pantallas Full HD. |
| **Android (Chrome)** | **LISTO CON RESERVAS** | Mismo motor que PC y sin errores. Reservas: objetivos táctiles de 9–31 px en un móvil horizontal de 844×390 (el mínimo recomendado es 44 px; ver H-M7). **No se probó en un dispositivo ni WebView viejo real**; Chromium de escritorio con viewport emulado. |
| **iOS Safari** | **NO VERIFICADO** | No hay WebKit en este equipo. Lo único comprobado es lectura de código: `dvh`/`-webkit-fill-available`, `env(safe-area-*)`, desbloqueo de audio en `touchstart`/`click`, aviso de rotación en vertical. Agregué `touch-action: manipulation` (evita el zoom por doble toque en los modales) **sin poder probarlo en iOS**. Antes de mandarlo a un aula con iPads: abrirlo en uno real, instalarlo como PWA y probar audio + rotación. |

Lo que más pesa: **1 bug bloqueante** de la economía (la tienda del Mercader solo
abría en el primer Mercader de cada carga de página) y **1 bug alto** de robustez
(un campo dañado del guardado borraba la partida entera) están corregidos y
verificados. Quedan 4 decisiones de diseño tuyas que cambian cuánto "juego" hay
(§c): la principal es que **Escarcha rango 2 vuelve al héroe invulnerable**.

---

## b) Hallazgos por severidad

Leyenda: ✅ arreglado y verificado · 🔶 decisión tuya (propuesta abajo) · 📝 nota.

### BLOQUEANTE

**B1 ✅ La tienda del Mercader solo abría en el primer Mercader de cada carga de la página.**
- *Qué pasa:* `PuzzleScene` es una escena reutilizada por Phaser y su `init()` no
  reiniciaba `_choiceShown`. Desde la 2.ª visita a un Mercader, `_nextDialogue` se salteaba
  el menú "Probar mi suerte / Ver tienda" y mostraba directo la lista de enigmas.
  También se heredaban `_confirmedAdvance` (se salteaba el aviso de punto de no retorno)
  y `_choiceHits` (acumulaba botones destruidos).
- *Reproducir:* abrir un Mercader, volver al mapa, abrir otro: no hay "Ver tienda".
  Medido en el motor real: visita 1 → tienda sí; visitas 2 y 3 → tienda **no**; tras el
  arreglo, las tres → sí.
- *Dónde:* `js/scenes/PuzzleScene.js` `init()` (≈ líneas 9-28) y `_nextDialogue()` (≈ 249).
- *Impacto:* las pociones (la principal fuente de curación) solo se podían comprar una vez
  por sesión, con 25 de oro y casi nada desbloqueado. Explica en buena parte por qué el
  juego se sentía imposible a partir del jefe 4.
- *Arreglo:* `init()` reinicia todo el estado de la visita; test `tests/puzzle-escena.test.js`.

### ALTO

**A1 ✅ Un solo campo dañado del guardado borraba TODA la partida.**
- `loadGame` copiaba con `d.campo || default` y, si fallaba una invariante, hacía
  `clearSave()` y avisaba "No hay partida guardada".
- Matriz real en el navegador (40 variantes de guardado roto/editado/de otra versión):
  **antes, 22 de 40 borraban la partida**; **después, 1 de 37** (JSON ilegible, que no
  tiene nada que rescatar). Sin errores de consola en ninguno de los dos.
- *Arreglo:* `sanitizeSave()` en `js/core/save.js`: valida tipo, rango y existencia por
  campo y cae al default solo en el campo roto; el resto del progreso se conserva. Un
  guardado que igual falle las invariantes ya no se borra. `MenuScene.js:114` distingue
  "dañada" de "no hay". Test: `tests/save-corrupto.test.js` (39 casos; 28 en rojo con el
  código viejo).

**A2 ✅ Sin conexión la primera vez: el juego no arrancaba.**
- `sw.js` precacheaba 5 archivos. Probado en Chromium real: tras UNA visita, la caché tenía
  **5 entradas**; al bajar el servidor y recargar la página **no llegaba a cargar** (se
  colgó 30 s). Lo demás recién entraba a la caché en la segunda visita.
- *Arreglo:* precacheo de todo el código (66 archivos, ≈ 0,75 MB comprimido) + los 14
  fondos (4,3 MB) aparte y tolerantes; HTML con red primero (tope 3 s) para que las
  versiones nuevas lleguen solas; sello de caché (`sw-precache.json` + test) para que no se
  pueda publicar un cambio sin subir la versión.
- *Verificado:* tras UNA visita, 69-80 entradas; servidor caído; recarga → arranca, llega al
  menú, 0 errores de consola.

**A3 ✅ Sesgo de RANGO en los enigmas de fracciones (lo que ninguna medida de posición ve).**
- La posición en pantalla ya salía 25/25/25/25, pero **la correcta era siempre la misma
  por valor**: en *El Falsificador de Dados*, **la 3.ª más chica el 100 %** de las veces en
  las cuatro dificultades; en *Cara o Ceca* legendario, la 3.ª el 100 %, y en fácil la más
  chica el 80 %; en *La Urna* héroe/legendario **nunca la más grande**. Un alumno que lo
  nota acierta sin hacer la cuenta.
- *Arreglo:* `_opcionesFrac()` en `PuzzleBase.js` sortea el rango de la correcta y completa
  con fracciones válidas. Después: 22-29 % en cada rango (salvo casos donde físicamente no
  hay lugar). 11 tests en rojo antes → verdes (`tests/puzzle-posicion.test.js`).

**A4 ✅ Los consejos de los monstruos describían mecánicas que no existen.**
- 6 de los 10 "💡 consejo" del dossier mentían: Hidra "ataques escalonados", Golem "débil en
  las colas 2/24" (el 2 nunca impacta), Bruja "maldiciones", Dragón "alterna daño alto y
  bajo", Esfinge "menos daño si tirás cerca de 13", Espectro "defensas variables". El
  **Titán** decía "defensa máxima en los turnos 6-8" y el motor le suma **ataque** (+4).
  Además el Tiburón citaba "σ ≈ 3.45" para 2d12 (es el de **un** d12; el de la suma es
  4,88, y el glosario del propio juego dice 4,9).
- *Arreglo:* consejos reescritos con la probabilidad real de cada umbral (89/144, 66/144,
  55/144…) y las reglas que sí existen. `tests/lore-motor.test.js` compara la ficha con
  el motor (umbrales, σ, +4 del Titán, fase 2 del Demiurgo) y prohíbe las frases inventadas.

**A5 ✅ Primera carga: 47 scripts pedidos de uno en uno.**
- Medido con gzip y throttling (ver §d): el botón "Continuar" tardaba **6,4 s con wifi buena,
  12,6 s con 3G rápido y 24 s con una conexión lenta**, casi todo viajes de ida y vuelta en fila.
- *Arreglo:* `index.html` los pide todos a la vez con `async = false` (se ejecutan en
  orden): **2,4 s / 4,9 s / 8,6 s**. **No hizo falta bundlear**: un solo archivo da lo mismo
  (§d). Además, si un archivo no baja, ahora se avisa ("La conexión falló…") y el botón pasa a
  **Reintentar**; y si a los 30 s todavía faltan archivos, el splash lo dice y ofrece recargar.
  Antes quedaba un juego a medias con errores incomprensibles o un splash mudo.

**A6 🔶 Escarcha rango 2 vuelve invulnerable al héroe** (ver decisión D1).

**A7 🔶 Sin poderes, el héroe base no pasa del jefe 4** (ver decisión D2).

**A8 🔶 La Estrella de Varianza dura toda la batalla, no "la próxima tirada"** (ver D3).

### MEDIO

| # | Estado | Qué pasa | Dónde | Notas |
|---|---|---|---|---|
| M1 | ✅ | La ficha del monstruo en el mapa mostraba HP/ATK/DEF **base** aunque en Héroe/Legendario pelea con ×1,25 / ×1,5 | `MapScene.js:863`, `BattleScene.js:18` | Nueva `statsDeMonstruo()` en `config.js`, usada por ambos. `tests/stats-monstruo.test.js` |
| M2 | ✅ | Quiz de sabiduría: la correcta era la **más larga en 7 de 8** preguntas de texto y las falsas traían "exactamente/siempre/nunca" | `js/ui/map-events.js` | Ahora 2 de 8; test de largo en `quiz-sabiduria.test.js` |
| M3 | ✅ | Apuesta del Mercader: "Favorable" era la respuesta el **49 %** de las veces; en Héroe no había ninguna neutra | `PuzzleApuesta.js` `_gen` | Se sortea primero el tipo (≈ 1/3 cada uno) |
| M4 | ✅ | Maldición del Doble 1: `_curseAtkReduc` no se reiniciaba entre batallas (derrota con la maldición puesta → el primer impacto siguiente **regala** ATK/DEF) y dos maldiciones seguidas dejaban el ataque a la mitad toda la batalla | `BattleScene.js:35,1560` | `tests/batalla-maldicion.test.js` (en rojo antes) |
| M5 | ✅ | Una tirada ≥ 22 mostraba "¡CRÍTICO! Daño × 1.5" sin ningún multiplicador (solo la Gema lo da) | `BattleScene.js:1613` | Mensaje cambiado |
| M6 | ✅ | Cada nodo de NPC obligaba a esperar **≈ 10 s** (3 líneas que se escriben solas); el "▼" prometía un toque que no hacía nada | `PuzzleScene.js` | Tocar la caja salta la presentación. Verificado en el motor, incluido que no se pinte la lista encima del menú |
| M7 | 🔶 | Objetivos táctiles < 44 px (ver tabla en §d) | varias escenas | Es diseño de la interfaz, no un arreglo puntual |
| M8 | 🔶/✅ | Contraste: **32 %** de los usos de color de texto de Phaser da < 4,5:1 sobre el fondo (21 % < 3:1). El peor: "← Volver al mapa", la única salida de la pantalla, a **1,7:1** y con área táctil de 100×14 px | `contraste` medido sobre todo `js/` | Arreglé solo esa salida (7,3:1, área táctil mayor). El resto es paleta: decisión tuya |
| M9 | 🔶 | `main.js` dice "sin upscale" pero `scale.max` no se respeta: en 1920×1080 el canvas mide **1580×1080 (×1,54)** → texto blando | `main.js:13-19` | Ver D5 |
| M10 | 🔶 | Poder *Predicción*: con 3 rangos, "medio" acierta el 50 % y paga igual que "bajo"/"alto" (25 %); con 2 rangos "≥13" (54,2 %) domina a "≤12" | `skills.js:132` | Ver D6 |
| M11 | 🔶 | El XP de un enigma es el mismo si fallás (40) y se llega a casi toda la XP de la partida adivinando | `PuzzleBase.js:800` | Ver D7 |
| M12 | 🔶 | "← Volver al mapa" avanza el nodo sin jugar el enigma: saltar es gratis | `PuzzleScene.js:439` | Ver D7 |
| M13 | 🔶 | No hay `prefers-reduced-motion` en ningún lado (flashes de cámara, vibraciones, partículas) | `css/`, `BattleScene.js` | Hay un destello dorado de 400 ms al ganar y vibración por golpe; no hay parpadeo > 3 Hz |

### BAJO

- ✅ `La Urna`: "Hay 4 bolas **roja**" → concordancia en plural; `Cara o Ceca`: "= 3/8 = 3/8" repetido.
- ✅ `STATE.nombre` iba sin escapar a un `innerHTML` (certificado y resumen final de `FinalScene.js:104,260`). Es self-XSS (15 caracteres, solo en el equipo del alumno), pero rompe la regla del proyecto. `escapeHtml()` en `utils.js`; `tests/privacidad.test.js` barre **todo** `js/` buscando el patrón.
- ✅ Código muerto: `js/render/monsters.js` (35 KB, `drawMonster` jamás se llama; el monstruo se dibuja con `monster-svg.js`). Quitado del cargador y del precache. Quedan 5 funciones sueltas sin uso (`ptsGet`, `ptsReset`, `closeEduModal`, `playNPCTalk`, `pzScanBeam`).
- ✅ Docs viejas: `README.md` y `CLAUDE.md` del proyecto decían "Phaser desde CDN", "tipografías de Google Fonts" y "sin tests" (todo falso desde el commit de privacidad); el README decía que la Resiliencia solo existe en Fácil (el motor la da en todas).
- ✅ `touch-action: manipulation` en `html` (zoom por doble toque en iOS). No probado en iOS.
- 🔶 `_backup/Heroes_Probabilisticos_VFinal.html` (180 KB) y `.superpowers/brainstorm/.../audit-palette.html` están **versionados** en el repo público. Sugerencia: `git rm -r --cached _backup .superpowers` y agregarlos al `.gitignore`. No lo hice porque toca el repo público.
- 📝 Las clases (Guerrero/Hechicero/Arquero/Alquimista) son **solo cosméticas** (`class-fx.js`, `IntroScene.js:199`): mismos stats, mismos poderes. Las descripciones no prometen otra cosa ("cada golpe es un ensayo de Bernoulli…"), pero no hay valor mecánico que medir. Decisión de diseño, no bug.
- 📝 `js/dev/dev-plugin.js` se carga siempre y `?dev` carga `debug.js` con `DEV.heal()`, `DEV.winBattle()`…: cualquier alumno puede agregar `?dev` a la URL. Es un juego de un jugador, pero conviene saberlo en una evaluación.
- 📝 `tests/skills-persist.test.js` y `tests/dice-math.test.js` **espejan** el código en vez de cargarlo (copian las funciones al test): comprueban su copia, no el juego. Los tests nuevos cargan el código real con `vm`.
- 📝 El Falsificador dice que el dado cargado sale "casi siempre" el 6 cuando la probabilidad es 4/9 a 1/2.
- 📝 La Estrella de Varianza dice "+50 % rango favorable"; con umbral −2 la mejora real va de +15 % (umbral 9) a +117 % (umbral 15).
- 📝 Los textos largos del dossier se cortan a 257 caracteres a mitad de palabra ("…dispersando todo a s…").

---

## c) Lo que arreglé vs. lo que dejo como decisión tuya

### Arreglé (bugs claros y de bajo riesgo; cada uno con su rojo → verde)

| Cambio | Rojo antes | Verde después |
|---|---|---|
| Tienda del Mercader accesible siempre (init de `PuzzleScene`) | visita 2 y 3 sin tienda (motor real) · 4 tests | tienda en las 3 visitas · 4 tests |
| Guardado leído campo por campo | 22 de 40 guardados dañados borrados · 28 de 39 tests en rojo | 1 de 37 · 39 verdes |
| Service worker: precache completo, tolerante, HTML con red primero, sello | 5 entradas, recarga sin red colgada · 6 tests en rojo | 69-80 entradas, arranca sin red · 15 verdes |
| Rango de la correcta en Moneda/Dados/Ruleta/Urna | 11 tests en rojo | 23 verdes |
| Apuesta del Mercader balanceada por tipo | "Favorable" 49 % | ≈ 33 % cada tipo |
| Fichas de los monstruos y σ | 3 tests en rojo | 5 verdes |
| Quiz de sabiduría sin pista por el largo | 7 de 8 la más larga | 2 de 8 |
| Maldición del Doble 1 | 2 tests en rojo | 3 verdes |
| Ficha del mapa con stats de la dificultad | 4 en rojo | 4 verdes |
| Saltar la presentación del NPC | 10 s fijos | un toque |
| Carga paralela + aviso de archivos que no bajan | ver §d | ver §d |
| `escapeHtml` del nombre + barrido de HTML y de terceros | 2 en rojo | 4 verdes |
| Mensaje de crítico falso, gramática, docs, código muerto, contraste del botón de salida | — | — |

### Decisiones tuyas

**D1 · Escarcha (rango 2 en adelante cuesta 1 MP) — recomiendo arreglarla ya.**
`skills.js:24`: `mp:[2,1,1]`. El MP se recarga +1 por tirada (`BattleScene.js:1286`) y usar un
poder no gasta el turno, así que con costo 1 se puede congelar al monstruo **todos los
turnos** gratis. Confirmado en el motor real: *Tiburón (jefe 5, 165 HP), Normal, 20 turnos*:
20 lanzamientos, **0 ataques del monstruo, HP 150 → 150**, vida del jefe 165 → 48; el MP
queda en 3 turno tras turno. Simulación (héroe base 8/5/150 HP, sin ítems, 20 000 peleas por
celda), % de victorias / HP perdido:

| | J1 | J2 | J3 | J4 | J5 | J6 | J7 | J8 | J9 | J10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Sin Escarcha | 100 | 100 | 100 | 52 | 0 | 0 | 0 | 0 | 0 | 0 |
| Escarcha R1 (2 MP) | 100 | 100 | 100 | 100 | 6 | 2 | 40 | 0 | 0 | 0 |
| **Escarcha R2/R3 (1 MP)** | **100 (−0 HP)** | **100 (−0)** | **100 (−0)** | **100 (−0)** | **100 (−0)** | **100 (−0)** | **100 (−0)** | **100 (−0)** | **100 (−0)** | **100 (−0)** |

Cuesta 30 + 50 XP (la XP de un jefe más dos enigmas) y está disponible antes del jefe 2.
*Propuesta:* `mp:[2,2,2]` (el rango 3 ya agrega "quita un buff"). Así el ritmo sostenible
es un congelamiento cada 2 turnos (≈ el R1 de la tabla) y deja de haber una estrategia
que gana todo. **Ojo:** eso, solo, deja a los jefes 5-10 aún más duros (D2).
La misma lógica aplica a *Maldición de un dado* (`[2,1,1]`): no invulnerabiliza, pero baja
mucho el daño cada turno por 1 MP.

**D2 · Hay un muro de dificultad en el jefe 4-5 sin poderes.**
Mismas fórmulas del motor. Héroe base (ataque 8, defensa 5, 150 HP), duelo pelado, Normal:
jefes 1-3 al 100 %, jefe 4 al 52 %, **jefe 5 en adelante 0 %**. Hacen falta en promedio
**≈ 31 turnos** para matar al Tiburón (jefe 5) y en ese tiempo recibiría **≈ 570 de daño**
(su ataque sube con cada turno) contra 150 HP; el Demiurgo pide ≈ 143 turnos y ≈ 2 800 de
daño. Incluso con Resiliencia +3 (el máximo, tras 3 derrotas) el jefe 5 queda en 2 %.
Corrida completa simulada con tienda antes de cada jefe, pociones, buffs, XP convertida en HP
(+20 de HP máximo por mejora) y reintentos tras morir (500 corridas por dificultad):
**Normal se traba en el jefe 5 (90 %) o 6 (10 %); Fácil llega al jefe 10 y no lo pasa;
Héroe se traba en el 4-5; Legendario en el 2-4**. La simulación **no incluye los poderes del
árbol** (por eso es un piso, no el juego real), pero muestra que la única forma de avanzar
es el árbol de poderes, y que el árbol tiene una opción (Escarcha) que trivializa todo lo
demás. Además, tras morir se revive con el 30 % de HP y **no hay forma de volver a la
tienda** (los nodos del Mercader ya quedaron atrás): con 0 de oro, sin ítems y sin XP, la
partida **no tiene salida** (softlock real aunque raro). Y cada turno completo dura **4,8 s**
sin forma de acelerarlo: la pelea contra el jefe 5 son ≈ 2,5 min y, con Escarcha, la del
Demiurgo ≈ 143 turnos ≈ 11 min.
*Propuesta (para decidir juntos):* ataque base que crezca con los jefes (p. ej. +1 cada 2
jefes) o subir el daño base; que el revivir cure más (50 %) o ofrezca volver a la tienda; y
acelerar la animación del turno del monstruo. Hay que medirlo con el árbol de poderes
dentro antes de tocar números.

**D3 · Estrella de Varianza (50 de oro, desde el jefe 6).** Item: "próxima tirada, umbral −2".
El motor activa `STATE.flagStar` y no lo apaga nunca dentro de la batalla (solo el ícono
del buff desaparece tras 1 turno): el −2 dura **toda la pelea**. Verificado en el motor
real (umbral 13 → 11 y sigue en 11 tres tiradas después). Con umbral 15 pasa de 38 % a 54 %
de impacto en cada tirada. *Opciones:* (a) hacerlo cierto a su descripción (se apaga tras la
primera tirada; es un nerf grande); (b) dejarlo y reescribir la descripción ("durante toda
la batalla") y subirle el precio. No lo toqué porque cualquiera de las dos cambia el balance.

**D4 · Clases solo cosméticas.** Si querés que elegir clase signifique algo, es trabajo de
diseño nuevo. Si no, está bien como está (las descripciones no prometen nada mecánico).

**D5 · Escala del canvas.** En 1920×1080 el canvas se estira a 1580×1080 (×1,54). Opciones:
dejarlo (se ve grande pero más blando), o limitar el contenedor con CSS a 1024×700 (nítido,
con bordes). `resolution` y la relación de aspecto quedaron descartadas, como pediste.

**D6 · Predicción.** Pagar según probabilidad (p. ej. bonus ∝ 1/p) o quitar la opción "medio".

**D7 · Enigmas sin riesgo.** La XP es igual acertando o no y salir sin jugar solo cuesta la
recompensa. Si querés que el enigma importe: XP completa solo al acertar (p. ej. 1/3 al
fallar, como ya hace el HP) y que "Volver al mapa" pida confirmación.

**D8 · Táctil y contraste.** Un modo "móvil" con botones más grandes, y revisar la paleta de
grises (lista completa de colores bajo 4,5:1 disponible). Lo tocaría junto con M13.

**D9 · Repositorio.** `git rm -r --cached _backup .superpowers` + `.gitignore`.

**D10 · Commit.** No hice commit ni push. Los cambios están en el árbol de trabajo (hay un
`git rm` de `monsters.js` ya en el índice). Cuando quieras, los commiteo por temas.

---

## d) Métricas antes / después

| Métrica | Antes | Después |
|---|---|---|
| Suites de test | 13 | **20** (≈ 150 casos) |
| Partidas borradas por guardado dañado (40 variantes, navegador real) | **22** | **1** (JSON ilegible) |
| Entradas en la caché tras UNA visita | **5** | **69-80** |
| Recarga sin servidor tras una visita | **se cuelga (30 s)** | **arranca, menú, 0 errores** |
| Botón "Continuar" listo, wifi (60 ms, 700 KB/s), gzip | **6,4 s** | **2,4 s** |
| Botón "Continuar" listo, 3G rápido (150 ms, 200 KB/s), gzip | **12,6 s** | **4,9 s** |
| Botón "Continuar" listo, conexión lenta (300 ms, 100 KB/s), gzip | **24,0 s** | **8,6 s** |
| Variante de control con **un solo archivo** (bundle de 45 scripts, mismas medidas) | — | wifi 2,4 s · 3G rápido 4,9 s (igual que la carga en paralelo) |
| Transferencia de la primera carga (gzip, sin service worker) | ≈ 641 KB / 57 pedidos | ≈ 638 KB / 56 pedidos |
| Sesgo de rango de la correcta (Dados, cualquier dificultad) | 100 % en una sola posición | 24-26 % en cada una |
| Respuesta "Favorable" en Apuesta | 49 % | ≈ 33 % |
| Correcta = la más larga (quiz del mapa) | 7 de 8 | 2 de 8 |
| Consejos de monstruos que describen mecánicas inexistentes | 6 de 10 | 0 |

**Decisión sobre bundlear (con datos):** la causa del tiempo de carga eran los 47 viajes en
fila, no el peso. Cargarlos en paralelo con `async=false` da **exactamente lo mismo que
un bundle de un solo archivo** (wifi 2,4 s y 3G rápido 4,9 s en los dos casos), sin agregar
un paso de build ni perder los nombres de archivo en los mensajes de error. **No bundlear**:
el número no lo justifica. Minificar bajaría ≈ 100-150 KB comprimidos; tampoco lo justifica.
Además hay un vigía: si a los 30 s faltan archivos, el splash lo dice y ofrece **Reintentar**
(probado reteniendo un script 36 s: a los 33 s aparece el aviso y a los 41 s, al completarse
la descarga, vuelve el botón Continuar y el juego arranca).

**Memoria / DOM tras 50 ciclos entrar-salir** (heap tras GC forzado): Mapa↔Enigma (Oráculo)
12,9 → 14,3 MB, DOM 418 → 418; Mapa↔Batalla 13,4 → 14,5 MB, DOM 418 → 423 (se estabiliza en
10 ciclos); Hub↔Menú 13,3 → 13,3 MB; Mapa↔Dados 13,3 → 14,2 MB. Objetos de Phaser, tweens y
timers **constantes**. **Sin fugas** (los números oscilan, no suben).

**Costo de JS por segundo de reloj** (hilo principal, CPU sin límite): Menú 14 ms · Mapa 33 ·
Hub 22 · Enigma 18 · Dados 82 · Batalla 22-28. Un dispositivo 6× más lento: ≤ 13 %-49 % de un
núcleo. El JS no es el cuello de botella; DOM de batalla ≈ 500 nodos y 8-13 animaciones CSS.

**Objetivos táctiles < 44 px** (de todos los interactivos de cada pantalla):

| Viewport | Menú | Mapa | Enigma (Urna) | Dados | Cofres (Tesoro) | Batalla |
|---|---|---|---|---|---|---|
| móvil horizontal 844×390 (×0,56) | 6 de 6 | 4 de 4 | 7 de 8 | 10 de 11 | 8 de 9 | 3 de 4 |
| tablet 1024×768 (×1) | 1 de 6 | 3 de 4 | 3 de 8 | 4 de 11 | 8 de 9 | 3 de 4 |
| PC 1920×1080 (×1,54) | 1 de 6 | 3 de 4 | 1 de 8 | 1 de 11 | 1 de 9 | 2 de 4 |

Peor caso en móvil: los botones Inventario/Grimorio/Salir del mapa miden **38-64 × 14 px**.

**Duración de un turno completo** (tirada + resultado + turno del monstruo): **4,8 s** (4,6-4,9),
sin saltar. Un Guardián 1 dura ≈ 25-30 s; uno como el jefe 5, ≈ 2,5 min.

---

## e) Lo que NO pude verificar y por qué

- **FPS reales en dispositivo lento:** el Chromium de este equipo dibuja por software
  (SwiftShader). A CPU ×1 da 10-14 fps y al limitar la CPU ×4/×6 apenas baja a 7-10: el
  límite es el rasterizador, no la CPU, así que esos números no representan una tablet.
  Lo que sí medí es el costo de JS (arriba).
- **iOS Safari y WebView viejo de Android:** no hay WebKit ni dispositivos. Audio tras gesto,
  barras dinámicas, notch, rotación y PWA instalada **solo se leyeron**, no se probaron.
- **Filtros/gradientes SVG animados:** no se pueden medir sin GPU real.
- **Los 7 enigmas completos con mouse real:** jugué la Urna de punta a punta. El resto lo
  cubren los tests de contenido y la apertura de cada escena (50 ciclos sin errores), pero no
  los resolví uno por uno con clics.
- **Partida completa hasta el jefe 10:** jugué con mouse real el camino de entrada hasta el
  Guardián 1 en las 4 clases. Lo que hay más allá (jefe 5 con Escarcha, estados de guardado,
  escenas sueltas) lo ejercité con el motor real pero armando el estado a mano. Las clases son
  cosméticas, así que el resto de la corrida sería idéntico entre ellas. La corrida completa
  de balance es **simulada, sin los poderes del árbol**.
- **GitHub Pages:** comparé `GAME_VERSION`/`CACHE_VERSION` publicados (4 / v6) con los locales
  al empezar: coinciden. Tras mis cambios la versión publicada sigue siendo la vieja: falta
  publicar.
- **Un cuelgue de carga, no reproducido:** durante la medición final, 1 de ~35 cargas con el
  cargador en paralelo no mostró el botón en 150 s, mientras yo corría tests y operaciones de
  git sobre la misma carpeta que el servidor de prueba. Después hice 14 cargas seguidas en wifi
  emulada (14 OK, ≈ 2,1 s) y 3 más en cada perfil sin problema. No logré reproducirlo; por las
  dudas agregué el vigía de 30 s (el peor caso ahora es un aviso con botón Reintentar, no un
  splash mudo). Conviene mirarlo en un aula real.
- **Los últimos 3 casos de la matriz de guardados** (`42`, `null`, `[1,2,3]` como JSON) no
  terminaron en el navegador (el servidor de prueba dejó de contestar); están cubiertos por el
  test de node.

---

## f) Falsos positivos descartados

- *"`points.js` tiene el encabezado roto (`═══�`)"*: era el `cut -c` de mi terminal partiendo un
  carácter UTF-8; el archivo está bien y `ptsCalc` funciona (comprobado).
- *"`PuzzleTesoro` solo tiene 1 configuración"*: es así a propósito (un árbol fijo); no es un
  sesgo, es contenido.
- *"Las Puertas del Oráculo usan la probabilidad equivocada"*: `(N-1)/N` con el presentador
  abriendo `N-2` puertas es correcto (4 puertas → 3/4).
- *"La Apuesta clasifica mal"*: el tipo se deriva del E(X) real y el test existente lo
  comprueba contra el comentario de cada apuesta.
- *"Los avisos de AudioContext"* del juego con `?go`: artefactos, como aclaraste. Los de
  "GPU stall due to ReadPixels" y "CONTEXT_LOST" salen del rasterizador por software del
  Chromium de prueba.
- *"La suma ≥ 22 es crítico ×1,5"*: era el mensaje, no la regla (ver M5).
- *"Doble 1 solo se revierte si pegás"*: es el comportamiento diseñado (dura hasta tu próximo
  impacto); lo que estaba mal eran los dos casos de M4.

---

## g) Cómo reproducir

- Tests: `node tests/run-all.js`. Si tocás algo que el service worker precachea:
  subí `GAME_VERSION` (index.html **y** sw.js) y `CACHE_VERSION`, y corré
  `node tests/sellar-cache.js`.
- Las pruebas en navegador (camino de entrada, guardados dañados, memoria, objetivos
  táctiles, offline, carga con throttling, simulación de balance) fueron scripts de
  Playwright y de node que **no quedaron en el repo** (usan el Playwright de otro juego de
  la carpeta). Puedo agregarlos a `tests/e2e/` si querés que queden.

---

## Addendum (decisiones resueltas después de la auditoría)

- **D1 y D2:** Escarcha y Maldición de un dado cuestan 2 MP; el héroe gana ataque por jefe y revive con la mitad del HP. Ver `js/core/config.js` y `tools/simular.js`.
- **D4:** las clases dejaron de ser cosméticas (`js/core/clases.js`), con logros y títulos por clase.
- **D3:** la Estrella de Varianza vale **una** tirada (se apaga tras `fase2`), cuesta 30 de oro y su texto lo dice. Verificado en el motor: umbral 13 → 11 → 13 tras la primera tirada. Con la Estrella ya no cierta como "permanente", el ataque por jefe de Normal subió de 2 a 2,5 (Héroe 3,5; Legendario 5,5) para conservar la dificultad de Normal: control 1,9-3,2 muertes y daño 4,2-6,3 por corrida.
- **D7:** fallar un enigma da un tercio de la XP (antes la misma) y "← Volver al mapa" pide confirmación ("¿Salir sin jugar?"). Verificado en el motor: al cancelar no avanza el nodo; al confirmar, sí.
- Héroe y Legendario quedan notablemente más duros que Normal (con la build simple de la simulación: Héroe termina entre 30 % y 83 % según la clase; Legendario, "solo para maestros"). Son modos opcionales; si se quieren más suaves, es un número en `config.js`.

## Addendum 2 — D6 y D8 resueltos (versión 8 / `heroesprob-v10`)

- **D6 / M10 · Predicción:** el pago ahora sigue a la probabilidad (≈ 1/p). Con 3 rangos, "bajo" y "alto" (25 %) pagan el doble que "medio" (50 %): R2 12/6/12 y R3 24/12/24, o sea el mismo pago esperado en las tres. Con 2 rangos, "bajo" (45,8 %) paga 8 y "alto" (54,2 %) paga 7. Los botones muestran probabilidad y pago. Guarda: `tests/prediccion-justa.test.js` (ninguna apuesta rinde más del 15 % que otra).
- **D8 / M13 · Accesibilidad:** `prefers-reduced-motion` apaga las animaciones CSS y las sacudidas/destellos de cámara (`main.js`). En pantallas táctiles (`pointer: coarse`) el cierre y las pestañas de los modales miden 44 px. Las pestañas y el cierre pasaron de ~2,2:1 a ≥ 4,5:1. Guarda: `tests/accesibilidad.test.js`.
- **Sigue abierto:** los botones dibujados dentro del canvas (Phaser) siguen midiendo ~34 px de alto en juego; en un teléfono vertical quedan bajo 44 px CSS. Agrandar su zona táctil pisaría botones vecinos (separados menos de 48 px), así que requiere rediseñar esas filas. Mientras tanto, apaisado rinde bien. Tampoco se repasó el resto de la paleta de grises dentro del canvas.

## Addendum 3 — D5 y D9 resueltos (versión 9 / `heroesprob-v11`)

- **D5:** medido en Chromium a 1920×1080, el canvas salía 1580×1080 (×1,54): Phaser 3.60 ignora `scale.max`. Ahora `#phaserGame` tiene `max-width:1024px; max-height:700px` en `css/variables.css`: a 1920×1080 el canvas mide 1024×700 centrado, escala 1:1; en un teléfono (375 de ancho) sigue ajustando al ancho. Guarda: `tests/accesibilidad.test.js`.
- **D9:** `_backup/` y `.superpowers/` salieron del índice y quedaron ignorados (siguen en disco).

## Addendum 4 — Teléfono, etapa 2 (prueba con el menú; versión 11 / `heroesprob-v13`)

Medido en Chromium móvil apaisado (812×375): con el lienzo fijo de 1024×700 el factor era 0,536, el texto llegaba a 5,4 px y casi todos los botones medían menos de 44 px (menú: 6 de 6; batalla 3 de 4; enigmas 7 de 8 y 10 de 11).

- **Mecanismo (`js/core/movil.js`):** en teléfono (táctil y lado corto ≤ 700 px; `?movil=1` lo fuerza en PC) cada escena que declare `X.DISENO_MOVIL = true` recibe un lienzo del tamaño de la pantalla (1 unidad = 1 px CSS); las demás siguen en 1024×700. Un plugin ajusta el tamaño al empezar cada escena y, al girar el teléfono, una escena migrada se rehace. En PC y tablet no cambia nada (comprobado con el flujo menú → mapa → menú → cargar).
- **Menú migrado:** apaisado, dos columnas (título a la izquierda, 5 botones de 48 px a la derecha); retrato, una columna. Medido en 812×375, 667×375, 932×430 y 375×812: factor 1, 0 botones bajo 44 px, texto mínimo 14 px. También subió el contraste de los grises del menú.
- **Guardas:** `tests/movil.test.js` (reglas del lienzo, cableado, medidas del menú).
- **Pendiente:** migrar mapa, batalla, enigmas, tienda, intro, final y arcade, una a una, con el mismo método de medición.

## Addendum 5 — Teléfono, etapa 2: batalla y mapa (versión 13 / `heroesprob-v15`)

Medido en Chromium móvil con `?movil=1` (812×375, 667×375 y 932×430; factor 1):

| Pantalla | Botones bajo 44 px | Texto mínimo |
|---|---|---|
| Batalla (antes: 3 de 4 bajo 44 px, texto desde 5,4 px) | 0 | 14 px |
| Mapa (antes: 3 de 4 bajo 44 px, texto desde 8,7 px) | 0 | 12,2 px (rótulos decorativos del mundo) |

- **Batalla (`BattleScene._layout`):** HUD (HP, MP, Atk/Def/Res/Oro) a la izquierda, dados y chips de predicción al centro, Inventario y Grimorio a la derecha, monstruo achicado entre la barra y el panel. El resultado de la tirada es DOM (el monstruo es DOM y tapaba al texto del canvas). El panel de poderes se abre hacia arriba con letra de 13 px y botones de 58 px. Los modales en pantallas bajas tienen cabecera compacta.
- **Hallazgo previo, corregido:** los chips de *Predicción* caían en y=724 sobre un lienzo de 700 px: no se veían en PC ni tablet. Ahora entran.
- **Mapa (`MapScene._layout`):** HUD de una fila (54 px) con botones de 44 px, zoom 0,5–2,2 (el mundo sigue siendo 1024×700), zoom al nodo en 1,35 y el dossier del jefe como modal DOM con scroll y botón ¡Enfrentar! de 44 px.
- **PC y tablet:** sin cambios (mismos números, comprobados por test y en pantalla).
- **Guardas:** `tests/batalla-movil.test.js`, `tests/mapa-movil.test.js`.
- **Pendiente de migrar:** enigmas (7) y tienda, intro (nombre, dificultad, clase), victoria, final, arcade y modo libre. Siguen en 1024×700 con factor 0,54.
