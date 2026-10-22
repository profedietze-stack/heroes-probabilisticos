/* ══════════════════════════════════════
   npcs.js — Datos de NPCs: Mercader del Azar & Oráculo de Laplace
   Z-ORDER SVG: coat→arms→beard(antes tabla)→tabla→objetos→manos→cabeza→boca-fija→nariz→ojos→sombrero→jaw-group→párpados
══════════════════════════════════════ */

const NPC_DATA = {

  /* ─────────────────────────────────────────────────────────
     MERCADER DEL AZAR
  ───────────────────────────────────────────────────────── */
  mercader: {
    id: 'mercader',
    nombre: 'Mercader del Azar',
    color: '#D4AF37',
    colorSecundario: '#2a1840',
    dialogos: {
      intro: [
        '¡Eh, viajero! Te he estado esperando.',
        '¿Sabés que el azar siempre favorece a quien lo comprende?',
        'Tengo un trato para vos... un juego de probabilidades.',
      ],
      correcto: [
        '¡Excelente cálculo! Las probabilidades te sonríen.',
        'Bien jugado. La razón de Laplace está de tu lado.',
        '¡Impresionante! Podrías ser mi socio.',
      ],
      incorrecto: [
        'Mmm... el azar es cruel con quienes no lo comprenden.',
        'No importa, la probabilidad siempre da otra oportunidad.',
        'El espacio muestral no miente. Intentá de nuevo.',
      ],
      despedida: [
        'Hasta la próxima apuesta, viajero.',
        '¡Que los dados te sean favorables!',
        'El azar nos encontrará de nuevo.',
      ],
    },
    svgMarkup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="90 66 500 500" style="width:100%;height:100%;overflow:hidden" overflow="hidden">
<defs>
  <radialGradient id="mg-skin" cx="45%" cy="38%" r="65%">
    <stop offset="0%" stop-color="#d9a878"/>
    <stop offset="100%" stop-color="#a86840"/>
  </radialGradient>
  <linearGradient id="mg-coat" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#2a1840"/>
    <stop offset="100%" stop-color="#110a1e"/>
  </linearGradient>
  <linearGradient id="mg-hat" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#3a302a"/>
    <stop offset="55%" stop-color="#241c16"/>
    <stop offset="100%" stop-color="#140e0a"/>
  </linearGradient>
  <linearGradient id="mg-table" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#3d2a16"/>
    <stop offset="100%" stop-color="#1e1208"/>
  </linearGradient>
  <radialGradient id="mg-iris" cx="35%" cy="35%" r="65%">
    <stop offset="0%" stop-color="#5a3820"/>
    <stop offset="100%" stop-color="#1a0a04"/>
  </radialGradient>
</defs>
<!-- Z=1: ABRIGO (fondo) -->
<path d="M195 680 L195 415 Q195 345 240 326 L296 313 L296 346 Q340 359 384 346 L384 313 L440 326 Q485 345 485 415 L485 680 Z" fill="url(#mg-coat)" stroke="#2a1848" stroke-width="1.5"/>
<path d="M296 313 Q298 376 318 402 L340 414 L362 402 Q382 376 384 313" fill="none" stroke="#D4AF37" stroke-width="1.5" opacity="0.55"/>
<path d="M296 313 L314 293 L340 303 L366 293 L384 313" fill="#1e1030" stroke="#D4AF37" stroke-width="1" opacity="0.7"/>
<circle cx="340" cy="360" r="4.5" fill="#D4AF37" opacity="0.75"/>
<circle cx="340" cy="384" r="4.5" fill="#D4AF37" opacity="0.75"/>
<circle cx="340" cy="408" r="4.5" fill="#D4AF37" opacity="0.75"/>
<path d="M242 326 L228 380 L218 560" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.22"/>
<path d="M438 326 L452 380 L462 560" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.22"/>
<!-- Z=2: MANGAS (hombro → mesa) -->
<path d="M195 415 Q168 426 162 456 Q162 461 168 461 L236 461 Q241 446 232 430 Q220 416 195 415 Z" fill="url(#mg-coat)" stroke="#2a1848" stroke-width="1"/>
<path d="M485 415 Q512 426 518 456 Q518 461 512 461 L444 461 Q439 446 448 430 Q460 416 485 415 Z" fill="url(#mg-coat)" stroke="#2a1848" stroke-width="1"/>
<path d="M178 434 Q184 449 197 455" fill="none" stroke="#1a1030" stroke-width="1.3" opacity="0.55"/>
<path d="M502 434 Q496 449 483 455" fill="none" stroke="#1a1030" stroke-width="1.3" opacity="0.55"/>
<!-- Z=3: BARBA (antes de la mesa!) -->
<path d="M255 285 Q249 344 255 424 Q259 506 271 564 Q291 612 340 632 Q389 612 409 564 Q421 506 425 424 Q431 344 425 285 Q408 270 388 272 Q362 265 340 264 Q318 265 292 272 Q272 270 255 285 Z" fill="#e0d8cc" stroke="#c8c0b0" stroke-width="1"/>
<path d="M308 308 Q304 382 307 456 Q311 514 322 563" fill="none" stroke="#b8b0a0" stroke-width="0.8" opacity="0.55"/>
<path d="M340 313 Q338 390 340 464 Q342 524 346 572" fill="none" stroke="#b8b0a0" stroke-width="0.8" opacity="0.55"/>
<path d="M372 308 Q376 382 373 456 Q369 514 358 563" fill="none" stroke="#b8b0a0" stroke-width="0.8" opacity="0.55"/>
<path d="M320 301 Q316 365 318 438" fill="none" stroke="#f0ece4" stroke-width="1" opacity="0.35"/>
<path d="M358 301 Q362 365 360 438" fill="none" stroke="#f0ece4" stroke-width="1" opacity="0.35"/>
<!-- Z=4: MESA -->
<rect x="88" y="445" width="504" height="13" rx="3" fill="#4a3018"/>
<rect x="74" y="458" width="532" height="118" rx="3" fill="url(#mg-table)"/>
<line x1="88" y1="445" x2="592" y2="445" stroke="#6a4020" stroke-width="1.5"/>
<line x1="148" y1="476" x2="238" y2="476" stroke="#2a1808" stroke-width="0.8" opacity="0.45"/>
<line x1="442" y1="476" x2="532" y2="476" stroke="#2a1808" stroke-width="0.8" opacity="0.45"/>
<!-- Z=5: OBJETOS SOBRE LA MESA -->
<g transform="rotate(-10 228 445)"><rect x="214" y="408" width="28" height="40" rx="3" fill="#f5f0ea" stroke="#c8a060" stroke-width="1"/><text x="228" y="432" font-size="15" fill="#cc0020" text-anchor="middle" font-family="serif">&#9829;</text></g>
<g transform="rotate(-2 242 443)"><rect x="228" y="406" width="28" height="40" rx="3" fill="#f5f0ea" stroke="#c8a060" stroke-width="1"/><text x="242" y="430" font-size="15" fill="#0a0818" text-anchor="middle" font-family="serif">&#9824;</text></g>
<g transform="rotate(6 254 444)"><rect x="240" y="406" width="28" height="40" rx="3" fill="#f5f0ea" stroke="#c8a060" stroke-width="1"/><text x="254" y="430" font-size="15" fill="#cc0020" text-anchor="middle" font-family="serif">&#9830;</text></g>
<ellipse cx="456" cy="453" rx="24" ry="8" fill="#B8902A" opacity="0.9"/>
<rect x="432" y="437" width="48" height="16" fill="#C09830"/>
<ellipse cx="456" cy="437" rx="24" ry="8" fill="#D4AF37"/>
<ellipse cx="456" cy="437" rx="18" ry="5" fill="#E8C840" opacity="0.6"/>
<ellipse cx="390" cy="455" rx="14" ry="11" fill="#181010" stroke="#302020" stroke-width="1"/>
<ellipse cx="390" cy="444" rx="14" ry="5" fill="#100808"/>
<path d="M390 443 Q406 412 416 390 Q418 384 416 380 Q410 393 404 413 Q398 434 390 443 Z" fill="#f0ead8" stroke="#c8a860" stroke-width="0.5"/>
<!-- Z=6: MANOS (apoyadas en el borde de la mesa) -->
<!-- mano izquierda -->
<ellipse cx="202" cy="455" rx="40" ry="9" fill="#000000" opacity="0.28"/>
<path d="M176 448 Q174 430 196 427 Q220 426 230 438 Q234 444 232 450 Q208 446 176 448 Z" fill="#c8916a" stroke="#a8744a" stroke-width="1.1"/>
<path d="M180 446 L179 465 Q183 469 188 465 L189 447 Z" fill="#c8916a" stroke="#a8744a" stroke-width="0.8"/>
<path d="M193 447 L192 467 Q196 471 201 467 L202 448 Z" fill="#c8916a" stroke="#a8744a" stroke-width="0.8"/>
<path d="M206 447 L206 466 Q210 470 215 466 L215 447 Z" fill="#c8916a" stroke="#a8744a" stroke-width="0.8"/>
<path d="M219 445 L220 461 Q224 465 228 461 L227 445 Z" fill="#c8916a" stroke="#a8744a" stroke-width="0.8"/>
<path d="M230 439 Q242 438 243 447 Q241 454 231 450" fill="#c8916a" stroke="#a8744a" stroke-width="0.8"/>
<path d="M180 433 Q202 425 228 433" fill="none" stroke="#D4AF37" stroke-width="1.6" opacity="0.5"/>
<path d="M188 437 Q202 433 218 437" fill="none" stroke="#a8744a" stroke-width="0.7" opacity="0.4"/>
<!-- mano derecha -->
<ellipse cx="478" cy="455" rx="40" ry="9" fill="#000000" opacity="0.28"/>
<path d="M504 448 Q506 430 484 427 Q460 426 450 438 Q446 444 448 450 Q472 446 504 448 Z" fill="#c8916a" stroke="#a8744a" stroke-width="1.1"/>
<path d="M500 446 L501 465 Q497 469 492 465 L491 447 Z" fill="#c8916a" stroke="#a8744a" stroke-width="0.8"/>
<path d="M487 447 L488 467 Q484 471 479 467 L478 448 Z" fill="#c8916a" stroke="#a8744a" stroke-width="0.8"/>
<path d="M474 447 L474 466 Q470 470 465 466 L465 447 Z" fill="#c8916a" stroke="#a8744a" stroke-width="0.8"/>
<path d="M461 445 L460 461 Q456 465 452 461 L453 445 Z" fill="#c8916a" stroke="#a8744a" stroke-width="0.8"/>
<path d="M450 439 Q438 438 437 447 Q439 454 449 450" fill="#c8916a" stroke="#a8744a" stroke-width="0.8"/>
<path d="M500 433 Q478 425 452 433" fill="none" stroke="#D4AF37" stroke-width="1.6" opacity="0.5"/>
<path d="M492 437 Q478 433 462 437" fill="none" stroke="#a8744a" stroke-width="0.7" opacity="0.4"/>
<!-- Z=7: CUELLO + OREJAS + CABEZA -->
<rect x="322" y="318" width="36" height="30" rx="6" fill="#c8916a" stroke="#b07848" stroke-width="0.8"/>
<ellipse cx="264" cy="265" rx="15" ry="19" fill="#c8916a" stroke="#b07848" stroke-width="0.8"/>
<path d="M267 251 Q273 265 267 279" fill="none" stroke="#8a5830" stroke-width="1.5" opacity="0.4"/>
<ellipse cx="416" cy="265" rx="15" ry="19" fill="#c8916a" stroke="#b07848" stroke-width="0.8"/>
<path d="M413 251 Q407 265 413 279" fill="none" stroke="#8a5830" stroke-width="1.5" opacity="0.4"/>
<ellipse cx="340" cy="266" rx="76" ry="82" fill="url(#mg-skin)" stroke="#b07848" stroke-width="0.5"/>
<path d="M310 231 Q340 223 370 231" fill="none" stroke="#8a6040" stroke-width="1" opacity="0.3"/>
<!-- Z=8: BIGOTE (handlebar conectado bajo la nariz) -->
<path d="M340 292 Q314 285 296 287 Q279 289 273 300 Q270 311 279 311 Q285 311 285 304 Q287 297 301 297 Q322 298 340 303 Q358 298 379 297 Q393 297 395 304 Q395 311 401 311 Q410 311 407 300 Q401 289 384 287 Q366 285 340 292 Z" fill="#5a4630" stroke="#3e3020" stroke-width="0.8"/>
<path d="M340 294 Q318 289 300 291" fill="none" stroke="#7a6448" stroke-width="0.9" opacity="0.6"/>
<path d="M340 294 Q362 289 380 291" fill="none" stroke="#7a6448" stroke-width="0.9" opacity="0.6"/>
<path d="M279 309 Q283 305 285 301" fill="none" stroke="#3e3020" stroke-width="0.7" opacity="0.7"/>
<path d="M401 309 Q397 305 395 301" fill="none" stroke="#3e3020" stroke-width="0.7" opacity="0.7"/>
<!-- Z=9: BOCA FIJA (cavidad + encía sup + dientes sup + labio sup) -->
<path d="M302 302 Q340 312 378 302 Q382 322 340 332 Q298 322 302 302 Z" fill="#1c0a0a"/>
<path d="M304 303 Q340 311 376 303 Q376 308 340 311 Q304 308 304 303 Z" fill="#8a2424"/>
<path d="M306 303 Q340 309 374 303 Q375 309 374 314 Q340 317 306 314 Q305 309 306 303 Z" fill="#f4f0e6"/>
<path d="M307 304 Q340 309 373 304" fill="none" stroke="#fffefb" stroke-width="1" opacity="0.7"/>
<line x1="319" y1="305" x2="319" y2="314" stroke="#cfc8b6" stroke-width="0.8"/>
<line x1="330" y1="305" x2="330" y2="315" stroke="#cfc8b6" stroke-width="0.8"/>
<line x1="340" y1="305" x2="340" y2="315" stroke="#cfc8b6" stroke-width="0.9"/>
<line x1="350" y1="305" x2="350" y2="315" stroke="#cfc8b6" stroke-width="0.8"/>
<line x1="361" y1="305" x2="361" y2="314" stroke="#cfc8b6" stroke-width="0.8"/>
<path d="M300 301 Q320 295 340 296 Q360 295 380 301" fill="none" stroke="#3a1410" stroke-width="2.2" stroke-linecap="round"/>
<!-- Z=10: NARIZ -->
<path d="M334 257 Q328 269 330 281 Q335 289 340 290 Q345 289 350 281 Q352 269 346 257 Q343 251 340 251 Q337 251 334 257 Z" fill="#ba7848" stroke="#a06838" stroke-width="0.5"/>
<path d="M331 283 Q328 289 333 290" fill="none" stroke="#8a4830" stroke-width="1.2"/>
<path d="M349 283 Q352 289 347 290" fill="none" stroke="#8a4830" stroke-width="1.2"/>
<!-- Z=11: OJOS + MONÓCULO -->
<ellipse cx="307" cy="249" rx="23" ry="16" fill="#f0ece6"/>
<ellipse cx="373" cy="249" rx="23" ry="16" fill="#f0ece6"/>
<ellipse cx="307" cy="251" rx="13" ry="12" fill="url(#mg-iris)"/>
<ellipse cx="373" cy="251" rx="13" ry="12" fill="url(#mg-iris)"/>
<circle cx="307" cy="252" r="7" fill="#08060a"/>
<circle cx="373" cy="252" r="7" fill="#08060a"/>
<circle cx="311" cy="246" r="3.5" fill="white" opacity="0.65"/>
<circle cx="377" cy="246" r="3.5" fill="white" opacity="0.65"/>
<path d="M283 229 Q307 221 331 229" fill="none" stroke="#5a4430" stroke-width="3" stroke-linecap="round"/>
<path d="M349 229 Q373 221 397 229" fill="none" stroke="#5a4430" stroke-width="3" stroke-linecap="round"/>
<circle cx="373" cy="249" r="25" fill="none" stroke="#D4AF37" stroke-width="2.2"/>
<path d="M398 249 Q408 251 416 256" fill="none" stroke="#D4AF37" stroke-width="1.5"/>
<path d="M284 239 Q307 231 330 239" fill="none" stroke="#b07848" stroke-width="0.8" opacity="0.4"/>
<path d="M350 239 Q373 231 396 239" fill="none" stroke="#b07848" stroke-width="0.8" opacity="0.4"/>
<!-- Z=12: SOMBRERO DE COPA -->
<!-- ala -->
<ellipse cx="340" cy="199" rx="126" ry="27" fill="#100c0a" stroke="#2a221a" stroke-width="1.5"/>
<ellipse cx="340" cy="195" rx="119" ry="22" fill="#1e1812"/>
<path d="M228 195 Q340 187 452 195" fill="none" stroke="#3a2e24" stroke-width="1.5" opacity="0.7"/>
<!-- copa -->
<path d="M280 200 L280 100 Q280 78 340 78 Q400 78 400 100 L400 200 Q340 210 280 200 Z" fill="url(#mg-hat)" stroke="#2a221a" stroke-width="1.5"/>
<!-- borde de luz izquierdo (separa del fondo) -->
<path d="M286 196 L286 102 Q286 86 300 81" fill="none" stroke="#5a4e40" stroke-width="2.5" opacity="0.55" stroke-linecap="round"/>
<!-- banda dorada -->
<rect x="278" y="174" width="124" height="20" rx="2" fill="#D4AF37" opacity="0.9"/>
<rect x="283" y="177" width="114" height="13" rx="1" fill="none" stroke="#8a6020" stroke-width="0.8" opacity="0.6"/>
<rect x="330" y="176" width="20" height="16" rx="2" fill="none" stroke="#8a6020" stroke-width="2"/>
<!-- brillo superior -->
<ellipse cx="338" cy="87" rx="52" ry="9" fill="#4a3e32" opacity="0.5"/>
<!-- Z=13: MANDÍBULA (animación de habla — dientes inf + labio inf) -->
<g class="npc-jaw">
  <path d="M306 314 Q340 322 374 314 Q374 319 340 322 Q306 319 306 314 Z" fill="#6a1414"/>
  <path d="M310 313 Q340 318 370 313 Q371 318 370 322 Q340 325 310 322 Q309 318 310 313 Z" fill="#ece6da"/>
  <line x1="322" y1="314" x2="322" y2="322" stroke="#c6bea8" stroke-width="0.8"/>
  <line x1="333" y1="314" x2="333" y2="322" stroke="#c6bea8" stroke-width="0.8"/>
  <line x1="347" y1="314" x2="347" y2="322" stroke="#c6bea8" stroke-width="0.8"/>
  <line x1="358" y1="314" x2="358" y2="322" stroke="#c6bea8" stroke-width="0.8"/>
  <path d="M300 320 Q320 332 340 333 Q360 332 380 320" fill="none" stroke="#3a1410" stroke-width="2.2" stroke-linecap="round"/>
</g>
<!-- Z=14: PÁRPADOS (animación de pestañeo) -->
<rect class="npc-lid" x="282" y="231" width="50" height="34" rx="4" fill="#c8916a"/>
<rect class="npc-lid" x="348" y="231" width="50" height="34" rx="4" fill="#c8916a"/>
</svg>`
  },

  /* ─────────────────────────────────────────────────────────
     ORÁCULO DE LAPLACE
  ───────────────────────────────────────────────────────── */
  oraculo: {
    id: 'oraculo',
    nombre: 'Oráculo de Laplace',
    color: '#70c8e0',
    colorSecundario: '#141028',
    dialogos: {
      intro: [
        'El universo no deja nada al azar... o quizás sí.',
        'He calculado todas las probabilidades de este momento.',
        'Vení, el Oráculo tiene una prueba para tu mente.',
      ],
      correcto: [
        'Como estaba escrito en las distribuciones del destino.',
        'Tu comprensión de la probabilidad te hace poderoso.',
        'Laplace mismo te aplaudiría.',
      ],
      incorrecto: [
        'El universo determinista te da otra oportunidad.',
        'Incluso los errores tienen probabilidad positiva.',
        'Recalculando... el camino del conocimiento es largo.',
      ],
      despedida: [
        'P(victoria) = P(conocimiento).',
        'El conocimiento probabilístico ilumina tu camino.',
        'Volvé cuando el azar te traiga de nuevo aquí.',
      ],
    },
    svgMarkup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="90 -6 500 500" style="width:100%;height:100%;overflow:hidden" overflow="hidden">
<defs>
  <linearGradient id="og-robe" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#141028"/>
    <stop offset="100%" stop-color="#060410"/>
  </linearGradient>
  <linearGradient id="og-table" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#3d2a16"/>
    <stop offset="100%" stop-color="#1e1208"/>
  </linearGradient>
  <radialGradient id="og-iris" cx="38%" cy="35%" r="60%">
    <stop offset="0%" stop-color="#b0ff90"/>
    <stop offset="35%" stop-color="#40a840"/>
    <stop offset="75%" stop-color="#0a2010"/>
    <stop offset="100%" stop-color="#040808"/>
  </radialGradient>
  <radialGradient id="og-ball" cx="32%" cy="28%" r="75%">
    <stop offset="0%" stop-color="#dff5f8"/>
    <stop offset="40%" stop-color="#70c8e0"/>
    <stop offset="80%" stop-color="#0d5080"/>
    <stop offset="100%" stop-color="#061828"/>
  </radialGradient>
  <radialGradient id="og-glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#40b8d0" stop-opacity="0.45"/>
    <stop offset="100%" stop-color="#081828" stop-opacity="0"/>
  </radialGradient>
</defs>
<!-- Z=1: TÚNICA (fondo) -->
<path d="M170 680 L170 420 Q170 340 218 318 L290 305 L290 342 Q340 357 390 342 L390 305 L462 318 Q510 340 510 420 L510 680 Z" fill="url(#og-robe)" stroke="#1e1830" stroke-width="1.5"/>
<path d="M290 342 Q284 370 296 422 L310 462" fill="none" stroke="#1e1830" stroke-width="1" opacity="0.65"/>
<path d="M390 342 Q396 370 384 422 L370 462" fill="none" stroke="#1e1830" stroke-width="1" opacity="0.65"/>
<path d="M338 358 L340 348 L342 358 L352 358 L344 364 L347 374 L340 368 L333 374 L336 364 L328 358 Z" fill="#6040a0" opacity="0.45"/>
<!-- Z=2: DETALLES TÚNICA -->
<path d="M290 342 Q340 357 390 342" fill="none" stroke="#6040a0" stroke-width="1" opacity="0.5"/>
<circle cx="340" cy="388" r="4" fill="none" stroke="#6040a0" stroke-width="1" opacity="0.5"/>
<!-- Z=3: MANGAS (hombro → mesa, drapeadas) -->
<path d="M170 420 Q140 432 134 462 Q134 467 140 467 L216 467 Q221 448 210 430 Q196 418 170 420 Z" fill="url(#og-robe)" stroke="#1e1830" stroke-width="1.2"/>
<path d="M510 420 Q540 432 546 462 Q546 467 540 467 L464 467 Q459 448 470 430 Q484 418 510 420 Z" fill="url(#og-robe)" stroke="#1e1830" stroke-width="1.2"/>
<path d="M150 438 Q158 453 172 459" fill="none" stroke="#0c0820" stroke-width="1.3" opacity="0.7"/>
<path d="M530 438 Q522 453 508 459" fill="none" stroke="#0c0820" stroke-width="1.3" opacity="0.7"/>
<path d="M150 436 Q160 430 196 428" fill="none" stroke="#403070" stroke-width="1.5" opacity="0.35"/>
<path d="M530 436 Q520 430 484 428" fill="none" stroke="#403070" stroke-width="1.5" opacity="0.35"/>
<!-- Z=4: CAPUCHA EXTERIOR (rellena, antes de barba) -->
<path d="M206 342 Q178 278 183 196 Q188 98 222 50 Q262 10 340 8 Q418 10 458 50 Q492 98 497 196 Q502 278 474 342 Q442 364 400 372 L340 378 L280 372 Q238 364 206 342 Z" fill="#0a0a14" stroke="#1c1830" stroke-width="1.5"/>
<!-- borde de luz (separa del fondo) -->
<path d="M207 338 Q180 276 185 196 Q190 100 223 52 Q262 14 338 11" fill="none" stroke="#4a4078" stroke-width="2" opacity="0.5" stroke-linecap="round"/>
<path d="M473 338 Q500 276 495 196 Q490 100 457 52 Q418 14 342 11" fill="none" stroke="#2e2858" stroke-width="1.6" opacity="0.4" stroke-linecap="round"/>
<ellipse cx="340" cy="262" rx="82" ry="92" fill="#060410"/>
<!-- Z=5: OSCURIDAD FACIAL + OJOS -->
<ellipse cx="340" cy="270" rx="70" ry="78" fill="#0c0a16"/>
<!-- Escleras ojos (ligeramente teñidas, efecto inyectado) -->
<ellipse cx="308" cy="249" rx="26" ry="18" fill="#c0c8cc"/>
<ellipse cx="372" cy="249" rx="26" ry="18" fill="#c0c8cc"/>
<!-- Venas rojas ojo izquierdo -->
<path d="M284 248 Q294 245 302 248" fill="none" stroke="#cc1818" stroke-width="0.9" opacity="0.75"/>
<path d="M284 254 Q296 251 302 252" fill="none" stroke="#cc1818" stroke-width="0.9" opacity="0.65"/>
<path d="M288 242 Q296 241 302 244" fill="none" stroke="#cc1818" stroke-width="0.8" opacity="0.6"/>
<path d="M286 259 Q298 258 304 256" fill="none" stroke="#cc1818" stroke-width="0.7" opacity="0.5"/>
<!-- Venas rojas ojo derecho -->
<path d="M346 248 Q356 245 366 248" fill="none" stroke="#cc1818" stroke-width="0.9" opacity="0.75"/>
<path d="M346 254 Q358 251 366 252" fill="none" stroke="#cc1818" stroke-width="0.9" opacity="0.65"/>
<path d="M350 242 Q360 241 366 244" fill="none" stroke="#cc1818" stroke-width="0.8" opacity="0.6"/>
<path d="M346 259 Q360 258 368 256" fill="none" stroke="#cc1818" stroke-width="0.7" opacity="0.5"/>
<!-- Iris luminosos -->
<ellipse cx="308" cy="251" rx="14" ry="13" fill="url(#og-iris)"/>
<ellipse cx="372" cy="251" rx="14" ry="13" fill="url(#og-iris)"/>
<circle cx="308" cy="252" r="7" fill="#030506"/>
<circle cx="372" cy="252" r="7" fill="#030506"/>
<circle cx="312" cy="246" r="3.5" fill="#d0ffb0" opacity="0.6"/>
<circle cx="376" cy="246" r="3.5" fill="#d0ffb0" opacity="0.6"/>
<!-- Cejas (delgadas, arqueadas) -->
<path d="M283 222 Q308 213 333 222" fill="none" stroke="#3a3050" stroke-width="2.5" stroke-linecap="round"/>
<path d="M347 222 Q372 213 397 222" fill="none" stroke="#3a3050" stroke-width="2.5" stroke-linecap="round"/>
<!-- Nariz (sutil, en sombra) -->
<path d="M335 260 Q330 270 332 278 Q337 283 340 283 Q343 283 348 278 Q350 270 345 260" fill="#0e0c14" stroke="#181220" stroke-width="0.5" opacity="0.55"/>
<!-- Z=6: BARBA (más ancha a la derecha — antes de la mesa!) -->
<path d="M255 286 Q249 344 255 424 Q259 506 271 562 Q291 612 340 640 Q393 612 430 562 Q440 506 446 424 Q452 344 445 286 Q425 270 400 272 Q368 265 340 264 Q312 265 280 272 Q265 270 255 286 Z" fill="#d8d4c8" stroke="#c0bcb0" stroke-width="1"/>
<path d="M306 308 Q300 382 304 458 Q308 518 320 564" fill="none" stroke="#a8a49c" stroke-width="0.9" opacity="0.55"/>
<path d="M340 314 Q337 392 340 468 Q342 530 348 576" fill="none" stroke="#a8a49c" stroke-width="0.9" opacity="0.55"/>
<path d="M376 306 Q382 380 378 454 Q373 516 360 562" fill="none" stroke="#a8a49c" stroke-width="0.9" opacity="0.55"/>
<path d="M322 300 Q318 368 320 444" fill="none" stroke="#ece8e0" stroke-width="1" opacity="0.4"/>
<path d="M362 298 Q366 366 364 440" fill="none" stroke="#ece8e0" stroke-width="1" opacity="0.4"/>
<!-- Z=7: MESA -->
<rect x="88" y="445" width="504" height="13" rx="3" fill="#4a3018"/>
<rect x="74" y="458" width="532" height="118" rx="3" fill="url(#og-table)"/>
<line x1="88" y1="445" x2="592" y2="445" stroke="#6a4020" stroke-width="1.5"/>
<line x1="148" y1="476" x2="238" y2="476" stroke="#2a1808" stroke-width="0.8" opacity="0.45"/>
<line x1="442" y1="476" x2="532" y2="476" stroke="#2a1808" stroke-width="0.8" opacity="0.45"/>
<!-- Z=8: OBJETOS -->
<!-- Reloj de arena -->
<g transform="translate(200 420)">
  <path d="M-18 0 L18 0 L5 -26 L-5 -26 Z" fill="#c8b080" stroke="#a89060" stroke-width="1"/>
  <path d="M-18 0 L18 0 L5 25 L-5 25 Z" fill="#c8b080" stroke="#a89060" stroke-width="1"/>
  <ellipse cx="0" cy="-26" rx="18" ry="5" fill="#c8b080" stroke="#a89060" stroke-width="0.5"/>
  <ellipse cx="0" cy="25" rx="18" ry="5" fill="#c8b080" stroke="#a89060" stroke-width="0.5"/>
  <ellipse cx="0" cy="0" rx="5" ry="3.5" fill="#d4a050" opacity="0.8"/>
  <line x1="0" y1="3" x2="0" y2="22" stroke="#d4a050" stroke-width="1" opacity="0.8"/>
</g>
<!-- Pergamino -->
<g transform="translate(464 448)">
  <rect x="-30" y="-14" width="60" height="28" rx="5" fill="#e8dfc0" stroke="#c8a870" stroke-width="1"/>
  <line x1="-22" y1="-6" x2="22" y2="-6" stroke="#8a7040" stroke-width="0.8" opacity="0.7"/>
  <line x1="-22" y1="0" x2="22" y2="0" stroke="#8a7040" stroke-width="0.8" opacity="0.7"/>
  <line x1="-22" y1="6" x2="22" y2="6" stroke="#8a7040" stroke-width="0.8" opacity="0.7"/>
</g>
<!-- Z=9: BOLA DE CRISTAL (centro de la mesa) -->
<ellipse cx="340" cy="450" rx="46" ry="14" fill="#1a3040" opacity="0.65"/>
<circle cx="340" cy="405" r="42" fill="url(#og-ball)" stroke="#4090b8" stroke-width="1.5"/>
<circle cx="340" cy="405" r="42" fill="url(#og-glow)"/>
<ellipse cx="326" cy="392" rx="12" ry="7" fill="white" opacity="0.18"/>
<circle cx="320" cy="389" r="4" fill="white" opacity="0.28"/>
<path d="M308 418 Q340 410 370 422" fill="none" stroke="#70c8e0" stroke-width="1" opacity="0.45"/>
<!-- Base de la bola -->
<path d="M304 444 Q340 450 376 444 L372 454 Q340 460 308 454 Z" fill="#2a2838" stroke="#403850" stroke-width="1"/>
<!-- Z=10: MANOS (huesudas, envueltas en túnica, apoyadas en la mesa) -->
<!-- mano izquierda -->
<ellipse cx="200" cy="456" rx="40" ry="9" fill="#000000" opacity="0.4"/>
<path d="M174 448 Q172 429 194 426 Q218 425 228 438 Q232 444 230 450 Q206 446 174 448 Z" fill="#100e1e" stroke="#2a2640" stroke-width="1.1"/>
<path d="M178 447 L176 471 Q180 476 185 471 L187 448 Z" fill="#100e1e" stroke="#2a2640" stroke-width="0.8"/>
<path d="M191 448 L190 473 Q194 478 199 473 L200 449 Z" fill="#100e1e" stroke="#2a2640" stroke-width="0.8"/>
<path d="M204 448 L204 472 Q208 477 213 472 L213 448 Z" fill="#100e1e" stroke="#2a2640" stroke-width="0.8"/>
<path d="M217 446 L218 467 Q222 472 226 467 L225 446 Z" fill="#100e1e" stroke="#2a2640" stroke-width="0.8"/>
<path d="M228 439 Q241 438 242 448 Q240 456 229 451" fill="#100e1e" stroke="#2a2640" stroke-width="0.8"/>
<path d="M178 432 Q200 424 226 432" fill="none" stroke="#4aa0c0" stroke-width="1.3" opacity="0.4"/>
<!-- mano derecha -->
<ellipse cx="480" cy="456" rx="40" ry="9" fill="#000000" opacity="0.4"/>
<path d="M506 448 Q508 429 486 426 Q462 425 452 438 Q448 444 450 450 Q474 446 506 448 Z" fill="#100e1e" stroke="#2a2640" stroke-width="1.1"/>
<path d="M502 447 L504 471 Q500 476 495 471 L493 448 Z" fill="#100e1e" stroke="#2a2640" stroke-width="0.8"/>
<path d="M489 448 L490 473 Q486 478 481 473 L480 449 Z" fill="#100e1e" stroke="#2a2640" stroke-width="0.8"/>
<path d="M476 448 L476 472 Q472 477 467 472 L467 448 Z" fill="#100e1e" stroke="#2a2640" stroke-width="0.8"/>
<path d="M463 446 L462 467 Q458 472 454 467 L455 446 Z" fill="#100e1e" stroke="#2a2640" stroke-width="0.8"/>
<path d="M452 439 Q439 438 438 448 Q440 456 451 451" fill="#100e1e" stroke="#2a2640" stroke-width="0.8"/>
<path d="M502 432 Q480 424 454 432" fill="none" stroke="#4aa0c0" stroke-width="1.3" opacity="0.4"/>
<!-- Z=11: BOCA FIJA (cavidad + encía + dientes sup envejecidos + labio sup) -->
<path d="M300 304 Q340 315 380 304 Q384 326 340 336 Q296 326 300 304 Z" fill="#000000"/>
<path d="M302 305 Q340 313 378 305 Q378 310 340 313 Q302 310 302 305 Z" fill="#3a0808"/>
<!-- Dientes superiores (6 envejecidos, irregulares) -->
<rect x="304" y="306" width="11" height="9" rx="1" fill="#c8c2ac"/>
<rect x="316" y="305" width="12" height="10" rx="1" fill="#d2ccb6"/>
<rect x="329" y="305" width="12" height="10" rx="1" fill="#cec8b2"/>
<rect x="342" y="305" width="12" height="10" rx="1" fill="#d2ccb6"/>
<rect x="355" y="305" width="11" height="10" rx="1" fill="#cac4ae"/>
<rect x="367" y="306" width="11" height="9" rx="1" fill="#c2bca6"/>
<!-- Labio superior -->
<path d="M298 303 Q318 297 340 298 Q362 297 382 303" fill="none" stroke="#1a0a14" stroke-width="2.2" stroke-linecap="round"/>
<!-- Z=12: BORDE CAPUCHA (solo trazo, encima del rostro) -->
<path d="M208 342 Q200 306 202 260 Q206 158 244 96 Q274 44 340 38 Q406 44 436 96 Q474 158 478 260 Q480 306 472 342" fill="none" stroke="#5040a0" stroke-width="2" opacity="0.6"/>
<path d="M218 340 Q215 296 220 246 Q228 146 264 90 Q294 42 340 38 Q386 42 416 90 Q452 146 460 246 Q465 296 462 340" fill="none" stroke="#2a2060" stroke-width="1" opacity="0.45"/>
<!-- Z=13: MANDÍBULA (animación de habla — dientes inf + labio inf) -->
<g class="npc-jaw">
  <path d="M304 316 Q340 324 376 316 Q376 321 340 324 Q304 321 304 316 Z" fill="#2a0606"/>
  <!-- Dientes inferiores: 5 + hueco central (carácter siniestro) -->
  <rect x="308" y="315" width="11" height="9" rx="1" fill="#bcb6a0"/>
  <rect x="320" y="315" width="11" height="9" rx="1" fill="#c4bea8"/>
  <!-- HUECO (diente faltante) a x=332 -->
  <rect x="344" y="315" width="11" height="9" rx="1" fill="#c4bea8"/>
  <rect x="356" y="315" width="11" height="9" rx="1" fill="#bcb6a0"/>
  <rect x="368" y="316" width="10" height="8" rx="1" fill="#b4ae98"/>
  <!-- Labio inferior -->
  <path d="M298 322 Q318 334 340 335 Q362 334 382 322" fill="none" stroke="#1a0a14" stroke-width="2.2" stroke-linecap="round"/>
</g>
<!-- Z=14: PÁRPADOS (animación de pestañeo) -->
<rect class="npc-lid" x="280" y="229" width="56" height="40" rx="4" fill="#0c0a16"/>
<rect class="npc-lid" x="344" y="229" width="56" height="40" rx="4" fill="#0c0a16"/>
</svg>`
  }
};
