# ⚔️ Héroes Probabilísticos

> **Juego educativo de rol por turnos donde la probabilidad es tu arma.**  
> Domina las matemáticas del azar para derrotar a 10 jefes del Reino de Arithmos.

---

## ¿De qué se trata?

**Héroes Probabilísticos** es un RPG educativo diseñado para estudiantes de nivel secundario que están aprendiendo probabilidad y estadística. En lugar de memorizar fórmulas, los jugadores las *usan* en combate real:

- Cada turno se lanza **2d12** (144 combinaciones posibles).
- El umbral de victoria varía por monstruo. Calcular la probabilidad de superarlo es la clave táctica.
- **7 enigmas de probabilidad** distribuidos en el mapa recompensan con HP y objetos al resolverlos correctamente.
- Al terminar la partida, el juego muestra un **análisis estadístico completo** de tus tiradas reales vs. la distribución teórica.

---

## Capturas de pantalla

> *(agregar imágenes de MenuScene, BattleScene, MapScene y un enigma)*

---

## Mecánicas principales

### Combate con 2d12

| Concepto matemático | Implementación en juego |
|---|---|
| Espacio muestral | 144 combinaciones posibles (12×12) |
| Distribución de probabilidad | El 13 es el resultado más probable (8.33%) |
| Valor esperado | E(2d12) = 13 — la tirada "media" |
| Desviación estándar | σ ≈ 3.45 — las tiradas extremas son raras |
| Probabilidad condicional | Los bonificadores desplazan el umbral efectivo |

Si la suma de dados **≥ umbral del monstruo**, el ataque conecta. De lo contrario, el monstruo contraataca. El umbral sube con cada jefe, por lo que la probabilidad de éxito disminuye progresivamente — y el jugador lo experimenta en carne propia.

**Evento especial — Doble 1:** probabilidad 1/144 ≈ 0.69%. El ataque falla y el daño se reduce a la mitad. Una lección vivida sobre eventos de baja probabilidad.

### Los 10 jefes (escalera de dificultad)

Cada monstruo es la personificación de un concepto estadístico, con su lore explicado en el juego:

| # | Monstruo | Concepto | Umbral |
|---|---|---|---|
| 1 | El Espectro de la Varianza | Varianza y dispersión | 9 |
| 2 | La Hidra de las Variables | Variables aleatorias | 10 |
| 3 | El Golem Gaussiano | Distribución normal | 11 |
| 4 | La Bruja de la Distribución | Distribuciones en general | 12 |
| 5 | El Tiburón de la Desviación | Desviación estándar | 13 |
| 6 | El Dragón Bernoulli | Distribución de Bernoulli | 14 |
| 7 | El Espíritu Poisson | Distribución de Poisson | 14 |
| 8 | El Titán Normal | Curva normal (avanzado) | 15 |
| 9 | La Esfinge Chi-Cuadrada | Bondad de ajuste | 15 |
| 10 | El Demiurgo del Determinismo | Jefe final — caos vs. orden | 16 |

### 7 Enigmas de probabilidad

Resolvibles en el mapa hablando con el **Mercader** o el **Oráculo**:

| Enigma | Concepto trabajado | Recompensa |
|---|---|---|
| La Urna Misteriosa | Probabilidad clásica de Laplace | +15 HP |
| Cara o Ceca | Frecuencia relativa en lanzamientos | +10 HP + objeto |
| Apuesta del Mercader | Valor esperado y apuestas justas | +20 HP |
| Ruleta del Reino | Probabilidad geométrica | +12 HP + objeto |
| El Falsificador de Dados | Detección de sesgos | +18 HP |
| Contador de Mentiras | Probabilidad condicional | +22 HP |
| Mapa del Tesoro | Probabilidad de rutas | +15 HP + objeto |

### 15 objetos matemáticos

El inventario tiene hasta 6 slots. Los objetos tienen nombres y efectos inspirados en estadística:

- **Grimorio de Laplace** — +2 Ataque (3 turnos)
- **Amuleto de Gauss** — +2 Defensa (3 turnos)
- **Gema de Desviación Estándar** — Crítico ×1.5 si la tirada cae en [11,15]
- **Esfera Bayesiana** — +1 Defensa permanente
- **Amuleto de Chebyshev** — Reduce daño enemigo 30% (3 turnos)
- **Llave de la Distribución Normal** — Ataque especial: 2d12 + bonificación mágica
- *(y 9 más)*

### Modos de juego

| Modo | Descripción |
|---|---|
| **Historia** | Campaña completa de 10 jefes + mapa + enigmas + narrativa |
| **Arcade** | Todos los enigmas cronometrados, tabla de puntajes local |
| **Libre** | Practica cualquier enigma sin presión ni tiempo |

### Dificultades

| Dificultad | HP héroe | Monstruos | Objetos iniciales |
|---|---|---|---|
| ⭐ Fácil | 200 | ×0.75 | 3 |
| ⚔ Normal | 150 | ×1.0 | 2 |
| 🗡 Héroe | 120 | ×1.25 | 1 |
| 💀 Legendario | 90 | ×1.5 | 0 |

**Resiliencia:** en Fácil, cada derrota otorga +1 a las tiradas futuras. El jugador aprende del fracaso sin ser castigado permanentemente.

---

## Características técnicas

- **Sin instalación.** Abre `index.html` con cualquier servidor local.
- **Sin dependencias de Node/npm.** Todo es HTML + CSS + JS vanilla.
- **Phaser 3.60.0** cargado desde CDN para el canvas del juego.
- **Audio 100% sintético** via Web Audio API — no hay archivos de sonido.
- **Guardado automático** en `localStorage` entre sesiones.
- **Responsive** — funciona en PC, Android, iOS y Safari. Canvas 1024×700 con `Scale.FIT`.
- **Sin registro.** No recopila datos, no requiere cuenta, funciona offline.

---

## Cómo ejecutar

```bash
# Python (viene preinstalado en macOS/Linux/Windows 10+)
python -m http.server 8765

# Luego abrir en el navegador:
# http://localhost:8765
```

También funciona con cualquier servidor estático: Live Server de VS Code, `npx serve`, etc.

**No hay build step, transpilador ni package manager.**

---

## Estructura del proyecto

```
HeroesProbabilisticos/
├── index.html              # Punto de entrada — carga todo vía splash
├── main.js                 # Inicia Phaser después del clic en "Continuar"
├── css/
│   ├── variables.css       # Variables CSS, resets, fix iOS Safari viewport
│   ├── modals.css          # Modales con tabs, responsive ≤580px
│   ├── buttons.css         # .btn-action y variantes
│   ├── npc-animations.css  # Animaciones CSS del mercader/oráculo
│   └── ui.css              # Toasts, tabla de stats, gráfico de barras
└── js/
    ├── data/               # Datos estáticos (monstruos, objetos, NPCs, enigmas)
    ├── core/               # State, config, audio, save, utils
    ├── render/             # SVG de monstruos y renders de NPC
    ├── ui/                 # DiosaOverlay (overlay de la Diosa de la Probabilidad)
    └── scenes/             # Todas las escenas Phaser
        ├── PuzzleBase.js   # Helpers compartidos por los 7 minijuegos
        ├── BattleScene.js
        ├── MapScene.js
        └── Puzzle*.js      # 7 escenas de enigmas
```

---

## Contenido curricular

Diseñado para trabajar los siguientes temas de matemática de nivel secundario:

- **Probabilidad clásica** (Laplace): P(A) = casos favorables / casos totales
- **Espacio muestral y eventos** compuestos e independientes
- **Frecuencia relativa** y convergencia con la probabilidad teórica
- **Distribuciones de probabilidad**: normal, Bernoulli, Poisson, binomial
- **Valor esperado** y análisis de apuestas
- **Probabilidad condicional** básica
- **Estadística descriptiva**: media, varianza, desviación estándar
- **Análisis de datos reales** al finalizar la partida (¿cuánto coincidió con la teoría?)

---

## Créditos

Desarrollado como herramienta educativa para el aula.  
Motor de juego: [Phaser 3.60.0](https://phaser.io/).  
Tipografías: Cinzel + Lora (Google Fonts).  
Audio sintético: Web Audio API.  

---

## Licencia

Uso educativo libre. Podés adaptar, modificar y redistribuir para fines no comerciales.
