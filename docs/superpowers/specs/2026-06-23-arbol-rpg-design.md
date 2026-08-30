# Árbol RPG de Habilidades — Diseño

**Fecha:** 2026-06-23
**Juego:** Héroes Probabilísticos (Phaser 3.60, vanilla JS, ProfeD.)
**Objetivo:** Convertir el juego en un RPG completo con XP, árbol de mejoras de 3 ramas y una barra de MP usada en batalla, **sin dañar la enseñanza de probabilidad**.

---

## 1. Principio rector (guardrail didáctico)

El combate ya enseña la **distribución de la suma de 2d12** (media = 13, extremos raros). Toda mejora debe respetar dos líneas rojas:

1. **Ningún poder re-lanza los dados PROPIOS del jugador para esquivar la varianza.** Re-roll de resultado propio = grind determinista = mata la lección. Prohibido.
2. **Los poderes reactivos se comprometen ANTES del reveal de la tirada del monstruo.** Así cada uso es una apuesta de valor esperado (decisión probabilística), no un "undo" garantizado.

Corolario: el poder es **conocimiento**, no suerte ni músculo. Subir de nivel = razonar mejor la distribución.

Modo arcade y modo libre **no** otorgan ni gastan XP: se mantienen como práctica limpia de probabilidad. El árbol vive solo en **modo aventura**.

---

## 2. Modelo de datos

```js
// state.js
STATE.xp     = 0;            // XP acumulada en el run
STATE.skills = {};           // { [powerId]: rank }  rank 1..3 (ausente = no adquirido)

// solo durante batalla (no se persiste)
STATE.mpMax  = 4;
STATE.mp     = 4;
```

Persistencia (save.js): añadir `xp` y `skills` al objeto guardado y restaurarlos al cargar. `mp`/`mpMax` NO se guardan (se inicializan por batalla).

---

## 3. Economía de XP

- Un run de aventura = **10 batallas** (jefes id 1..10, Demiurgo final) + puzzles + encuentros de Oráculo/Mercader.
- Fuentes de XP:
  - **Monstruos**: XP escala con el índice del jefe (jefe 10 rinde mucho más que jefe 1). El Mercader entrega monedas (sin XP); el Oráculo entrega HP + XP.
  - **Oráculo**: premio fijo de HP + XP por encuentro.
  - **Puzzle resuelto**: XP bonus (refuerza "resolver = progresar").
- **Multiplicador de XP por dificultad** (fácil = más generoso):
  - `facil ×1.3 · normal ×1.0 · heroe ×0.85 · legendario ×0.7`
- **Calibración objetivo:** un run en `normal` debe rendir XP para comprar ~20-24 ranks de un total de ~36 → alcanza para una rama casi completa + picotear otra. Esto fuerza la tensión "mejorar un poder existente vs adquirir uno nuevo" y da rejugabilidad.

> Nota de balance: la curva exacta de XP por jefe se ajustará en implementación contra el costo total del árbol. Costo total de referencia = suma de costos de los 36 ranks (ver §5).

---

## 4. Las tres ramas

Estructura: **3 ramas temáticas**, cada una con **4 poderes**, cada poder con **3 ranks**. Vitalidad y Sabotaje son ramas de entrada barata; Sabiduría es la rama profunda y cara (núcleo didáctico).

### 🛡 Vitalidad — supervivencia

| Poder | Tipo | R1 | R2 | R3 |
|---|---|---|---|---|
| **Vigor** (+HP máx) | pasivo | +20 | +45 | +75 |
| **Regeneración** | activo MP | cura 4/turno · 2 turnos | 6/turno · 3 turnos | 8/turno · 4 turnos |
| **Égida** (mitigación) | activo MP | −20% daño · 2 turnos | −30% · 2 turnos | −35% · 3 turnos |
| **Segundo aliento** (1×/batalla, al bajar de 20% HP) | pasivo trigger | +15 HP | +25 HP | +40 HP |

### 🗡 Sabotaje — manipular los dados del MONSTRUO (nunca los propios)

| Poder | Tipo | R1 | R2 | R3 |
|---|---|---|---|---|
| **Escarcha** (congelar) | activo MP | el monstruo no tira este turno | cuesta menos MP | además le quita un buff activo |
| **Reflejo** (invertir) — *commit antes del reveal* | activo MP | 30% de su tirada le pega a él | 60% | 100% |
| **Sanguijuela** (robo de vida) | activo MP | 30% de su daño → HP tuyo | 50% | 70% |
| **Maldición de un dado** | activo MP | el monstruo tira 1 solo dado este turno | cuesta menos MP | ese dado es un d6 (no d12) |

### 🔮 Sabiduría — los "dorados" (rama profunda, premian leer la distribución)

| Poder | Tipo | R1 | R2 | R3 | Concepto que enseña |
|---|---|---|---|---|---|
| **Carga de probabilidad** — usar tras tu tirada | activo MP | daño ∝ rareza de tu suma (×k) | ×k mayor | colas extremas "explotan" (bonus fuerte) | las colas raras son valiosas |
| **Espejo de varianza** | activo MP | refleja daño ∝ \|suma_enemigo − 13\| × 0.5 | × 0.8 | × 1.2 | desviación respecto a la media |
| **Predicción de rango** — *commit antes del reveal* | activo MP | apostás 2 bins (alto/bajo); acierto = bonus | 3 bins (alto/medio/bajo) | acierto en cola rara = daño masivo | probabilidad de rangos |
| **Truncar tirada enemiga** | activo MP | su suma cuenta como 13 este turno | como 11 | como 9 (más favorable al jugador) | la media de 2d12 es 13 |

**Definición de rank:** escalado numérico del mismo efecto + un giro en R3. NO son tres mecánicas distintas por poder (eso triplicaría diseño y test). Cada poder se implementa una vez y lee su `rank` para elegir los números.

---

## 5. Barra de MP (Magia)

- `mpMax` base **4**, regenera **+1 por turno** del jugador. Recargable con ítems (nuevo tipo de ítem o efecto en ítem existente).
- Al agotarse, no se pueden activar poderes hasta regenerar MP.
- **Costos de MP:**
  - Pasivos (Vigor, Segundo aliento): 0 (siempre activos).
  - Tácticos (Vitalidad activos, Sabotaje): 1–2 MP.
  - Dorados (Sabiduría): 2–3 MP.
- Los costos exactos se afinan en implementación; los ranks pueden abaratar costo (ej. Escarcha R2, Maldición R2).

---

## 6. Integración en batalla

- **HUD de batalla:** barra de MP junto a la de HP. Fila de botones por cada poder **activo adquirido** (los pasivos no necesitan botón).
- **Reactivos (Reflejo, Predicción):** el jugador los activa **antes** de que el monstruo revele su tirada. La UI debe dejar claro el momento de compromiso (ej. ventana "tu turno de reacción" antes del `turnoMonstruo`).
- **Carga de probabilidad:** se activa **después** de la propia tirada del jugador (necesita conocer la suma propia para calcular rareza) pero **antes** de aplicar el daño. No es re-roll: recompensa la suma que ya salió.
- La tirada 2d12 de ambos lados permanece intacta. Los poderes modifican daño/HP/efectos, nunca obligan a re-tirar los dados del jugador.

---

## 7. Acceso al árbol

- Botón **"Grimorio"** en el mapa (modo aventura), junto a los botones existentes Inventario/Salir.
- Al ganar una batalla, si hay XP suficiente para un nuevo rank/poder → aviso "Nuevo poder disponible".
- **Barra de XP** en el HUD del mapa.
- La pantalla del Grimorio muestra las 3 ramas, ranks comprados/disponibles, costo en XP, y permite gastar XP. Vista coherente con el estilo DOM/Phaser actual del juego.

---

## 8. Alcance explícito (YAGNI)

Incluido en v1:
- 12 poderes × 3 ranks, 3 ramas, economía XP con multiplicador de dificultad, barra MP en batalla, Grimorio en mapa, persistencia de xp/skills.

Fuera de v1 (posible fase 2):
- MP compartida con puzzles, poderes que añaden mecánicas nuevas por rank, prestigio/reset de árbol, builds guardadas.

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Poder que trivializa el combate y tapa la dificultad | Costos de MP altos para dorados; commit antes del reveal; balance de XP medio (no maxea todo). |
| El jugador sobrenivela y atropella puzzles | El árbol solo afecta **batalla**; los puzzles no se ven afectados por skills. |
| Economía de XP descalibrada (todo o nada) | Objetivo ~⅔ del árbol por run; ajuste de XP por jefe contra costo total. |
| Re-roll encubierto que rompe la lección | Línea roja §1: ningún poder re-lanza dados propios; revisión en code review. |
| MP infinita por regen | `mpMax` bajo (4) + costos ≥1; regen +1/turno hace que los poderes sean decisiones, no spam. |
