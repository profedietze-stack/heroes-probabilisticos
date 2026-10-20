# Pruebas e2e (navegador real)

Complementan a `node tests/run-all.js` (que no abre navegador). **No se corren con `npm test`**: necesitan Playwright, que no es
una dependencia del repo.

## Qué hace `movil.e2e.js`

Abre el juego en un Chromium emulando un teléfono apaisado (812×375, `?movil=1`) y:

1. Recorre las **17 escenas** y exige, en cada una: zonas táctiles de **44 px o más**, letras de **11 px o más** y que el lienzo mida
   la pantalla (si una escena no está migrada, mide 1024×700 y falla).
2. Hace el **recorrido con clics reales**: mapa → Mercader → aviso "Antes de continuar" → enigma → respuesta → resultado → mapa.
   Incluye el clic de mouse sobre el modal DOM que una vez se perdía (Phaser reabría el aviso).
3. Falla si hay errores en la consola.

Sale con código 0 si todo está bien y 1 si algo falla (con la lista de fallas).

## Cómo correrlo

```bash
npm i -D playwright && npx playwright install chromium     # una sola vez
node tests/e2e/movil.e2e.js
```

Si ya tenés Playwright en otra carpeta: `PLAYWRIGHT=/ruta/a/node_modules/playwright node tests/e2e/movil.e2e.js`.
Otros tamaños: `ANCHO=667 ALTO=375 node tests/e2e/movil.e2e.js` (probar 667×375, 932×430 y 375×812 con el aviso de girar descartado).

El script levanta su propio servidor estático (no hace falta `python -m http.server`) y silencia el audio. En un navegador sin GPU el
mapa tarda varios segundos en acercarse al nodo: el script lo espera, no es un error.

## Qué no cubre

Un teléfono real (barras del navegador, notch, girar la pantalla en plena partida), iOS/Safari y el rendimiento en gama baja.
