const ITEMS = [
  {id:1,emoji:"🧪",nombre:"Poción de Vida Menor",desc:"Elaborada con agua de manantial. Restaura fe en la supervivencia.",efecto:"Restaura 15 HP",tipo:"heal",valor:15,precio:12,minJefe:0},
  {id:2,emoji:"🧴",nombre:"Poción de Vida Mayor",desc:"Destilada durante eclipse lunar. Recupera vitalidad casi milagrosa.",efecto:"Restaura 40 HP",tipo:"heal",valor:40,precio:30,minJefe:2},
  {id:3,emoji:"📖",nombre:"Grimorio de Laplace",desc:"Contiene secretos de probabilidades ancestrales. La verdadera magia reside en los números.",efecto:"+2 Ataque durante 3 turnos",tipo:"buff_atk",valor:2,turnos:3,precio:25,minJefe:1},
  {id:4,emoji:"🛡️",nombre:"Amuleto de Gauss",desc:"Protección matemática. El universo se alinea a tu favor.",efecto:"+2 Defensa durante 3 turnos",tipo:"buff_def",valor:2,turnos:3,precio:25,minJefe:1},
  {id:5,emoji:"🎲",nombre:"Dado de la Suerte",desc:"Tallado en hueso de dragón. Susurra números afortunados.",efecto:"+3 a la próxima tirada",tipo:"buff_roll",valor:3,turnos:1,precio:14,minJefe:0},
  {id:6,emoji:"👑",nombre:"Corona de la Probabilidad",desc:"Símbolo de quienes dominan el azar. Reina sobre el destino.",efecto:"Duplica daño si tirada ≥ 13",tipo:"crown",valor:2,turnos:1,precio:60,minJefe:5},
  {id:7,emoji:"📊",nombre:"Tabla de Frecuencias",desc:"Espejo de la realidad estadística. Revela patrones ocultos.",efecto:"Consulta la distribución teórica",tipo:"info",valor:0,precio:8,minJefe:0},
  {id:8,emoji:"⚡",nombre:"Vara del Rayo Gaussiano",desc:"Canaliza energía de la distribución normal. Golpes cada vez más poderosos.",efecto:"+1 Ataque PERMANENTE",tipo:"perm_atk",valor:1,precio:80,minJefe:6},
  {id:9,emoji:"🔮",nombre:"Esfera de Cristal Bayesiana",desc:"Predice el futuro con actualización probabilística. La defensa perfecta.",efecto:"+1 Defensa PERMANENTE",tipo:"perm_def",valor:1,precio:80,minJefe:7},
  {id:10,emoji:"💎",nombre:"Gema de Desviación Estándar",desc:"Brilla cuando golpea con precisión estadística. El análisis llevado a la batalla.",efecto:"Crítico ×1.5 si tirada ∈ [11,15]",tipo:"gem",valor:1.5,turnos:1,precio:45,minJefe:4},
  {id:11,emoji:"🌙",nombre:"Luna de la Media",desc:"Ciclo lunar de regeneración. La media aritmética de la curación.",efecto:"Restaura 3 HP cada turno (3 turnos)",tipo:"regen",valor:3,turnos:3,precio:35,minJefe:3},
  {id:12,emoji:"🌟",nombre:"Estrella de Varianza",desc:"Destello celestial que amplía posibilidades. Cuando las probabilidades se expanden.",efecto:"Solo la próxima tirada: el umbral baja 2 (más casos favorables)",tipo:"star",valor:2,turnos:1,precio:30,minJefe:5},
  {id:13,emoji:"🗡️",nombre:"Espada del Intervalo de Confianza",desc:"Golpe devastador dentro del rango de confianza del 95%. Precisión letal.",efecto:"+3 Ataque durante 2 turnos",tipo:"sword",valor:3,turnos:2,precio:40,minJefe:3},
  {id:14,emoji:"🧿",nombre:"Amuleto de Chebyshev",desc:"Protección estadística universal. Desigualdad de defensa.",efecto:"Reduce daño enemigo 30% (3 turnos)",tipo:"cheb",valor:0.3,turnos:3,precio:45,minJefe:4},
  {id:15,emoji:"🔑",nombre:"Llave de la Distribución Normal",desc:"Abre el poder verdadero. La llave de la normalidad es extraordinaria.",efecto:"Ataque Especial: 2d12 + bonificación mágica",tipo:"key",valor:5,turnos:1}
];

const TUTORIALES = [
  "En el Reino de Arithmos, el azar no es el enemigo. Aprendelo, usalo, dominalo.",
  "La Probabilidad de Laplace dice: P(evento) = Casos Favorables / Casos Totales. Aquí: Casos Totales = 144.",
  "Cada tirada de 2d12 tiene 144 combinaciones posibles. Calcular probabilidades es tu arma más poderosa.",
  "Cuanto menor es la probabilidad, mayor es el riesgo. ¿Aceptarás el desafío?",
  "Los bonificadores aumentan tus probabilidades. ¡Usá tus objetos sabiamente!",
  "La Resiliencia es tu aliada. Cada derrota te acerca a la victoria final.",
  "El Doble 1 es la maldición del destino. Probabilidad: 1/144. ¡Esperá lo inesperado!",
  "Tu inventario tiene 15 artefactos. Cada uno guarda el poder de una distribución matemática.",
  "Al final, analizaremos tus datos. ¿Coincidieron con las probabilidades teóricas?",
  "Recordá: en matemáticas, como en la vida, la incertidumbre es la única certeza."
];

const MSG_COMBATE = [
  "¡IMPACTO! Tu tirada fue perfecta. El monstruo retrocede, herido.",
  "¡FALLO! El destino no estuvo de tu lado esta vez.",
  "¡DOBLE 1! ¡La maldición del Determinismo te golpea! Tu poder se reduce a la mitad.",
  "El monstruo contraataca con ferocidad. ¡Preparate para el siguiente turno!",
  "La Resiliencia te fortalece. Sentís el azar fluir a tu favor.",
  "El monstruo está débil. ¡Este podría ser el turno decisivo!",
  "Tu HP es crítico. ¡Usá una poción o serás derrotado!",
  "La batalla se vuelve épica. Ambos luchan en el filo de la victoria.",
  "¡CRÍTICO! Tu ataque fue devastador. Daño × 1.5.",
  "La probabilidad te abandonó. Reducción de defensa durante este turno.",
  "Tu tirada fue la mediana (13). ¡Eficacia pura!",
  "El monstruo se retuerce. Puede sentir el final acercarse...",
  "¡Golpe contundente! La distribución se inclina a tu favor.",
  "Tu poder interior despierta. Siente el flujo del azar.",
  "El enemigo tiembla ante tu dominio probabilístico."
];

const MSG_CONCEPTO = [
  "Espacio muestral: 144 resultados posibles. Ω = {2, 3, ..., 24}.",
  "Distribución: El 13 tiene la mayor probabilidad (12/144 ≈ 8.33%).",
  "Eventos independientes: Cada tirada no afecta la siguiente. El azar es nuevo cada turno.",
  "Probabilidad condicional: Tus bonificadores cambian el espacio muestral efectivo.",
  "Valor esperado: E(2d12) = 13. La esperanza es tu brújula.",
  "Desviación estándar: σ ≈ 4.9. Las tiradas extremas (2, 24) son rarísimas y valiosas.",
  "Convergencia: Cuantos más turnos, más tu distribución observada se acerca a la teórica."
];
