const MONSTERS = [
  {id:1,nombre:"El Espectro de la Varianza",frase:"Sus alas dispersan los resultados aleatoriamente. Nadie puede predecir su siguiente movimiento.",hpMax:60,ataque:4,defensa:4,umbral:9,color:0x9b59b6,forma:"espectro"},
  {id:2,nombre:"La Hidra de las Variables",frase:"Siete cabezas representan los grados de libertad. Cada una muerde con probabilidades distintas.",hpMax:85,ataque:6,defensa:5,umbral:10,color:0x27ae60,forma:"hidra"},
  {id:3,nombre:"El Golem Gaussiano",frase:"Forjado en la campana de distribución normal. Su poder se concentra en el centro, débil en los extremos.",hpMax:110,ataque:7,defensa:7,umbral:11,color:0x95a5a6,forma:"golem"},
  {id:4,nombre:"La Bruja de la Distribución",frase:"Domina todas las formas que toma la probabilidad. Su hechicería transforma tiradas en desastres.",hpMax:140,ataque:9,defensa:7,umbral:12,color:0x8e44ad,forma:"bruja"},
  {id:5,nombre:"El Tiburón de la Desviación",frase:"Nada en aguas de incertidumbre. Su mordida desgarra la confianza en tus cálculos.",hpMax:165,ataque:11,defensa:8,umbral:13,color:0x2980b9,forma:"tiburon"},
  {id:6,nombre:"El Dragón Bernoulli",frase:"Bifurca el destino en cada respiración: éxito o fracaso, sin término medio.",hpMax:190,ataque:13,defensa:9,umbral:14,color:0xc0392b,forma:"dragon"},
  {id:7,nombre:"El Espíritu Poisson",frase:"Aparece cuando menos lo esperás. Sus ataques siguen una distribución impredecible.",hpMax:155,ataque:12,defensa:6,umbral:14,color:0x1abc9c,forma:"espiritu"},
  {id:8,nombre:"El Titán Normal",frase:"Representa la perfección de la curva. Casi invencible cuando la batalla llega a su punto medio.",hpMax:230,ataque:14,defensa:11,umbral:15,color:0xe67e22,forma:"titan"},
  {id:9,nombre:"La Esfinge Chi-Cuadrada",frase:"Plantea acertijos de bondad de ajuste. Solo quien entienda sus patrones puede vencerla.",hpMax:215,ataque:15,defensa:12,umbral:15,color:0xd4a017,forma:"esfinge"},
  {id:10,nombre:"El Demiurgo del Determinismo",frase:"Creador del caos ordenado. Cree que el azar no existe. Demuéstrale que se equivoca.",hpMax:300,ataque:17,defensa:13,umbral:16,color:0xff2e2e,forma:"demiurgo",esFinal:true}
];

const MONSTER_LORE = [
  {
    titulo:"El Espectro de la Varianza",
    historia:"Nacido del caos de mil experimentos fallidos, el Espectro habita entre los resultados posibles sin pertenecer a ninguno. Los matemáticos del Reino lo invocaron sin querer al intentar calcular la desviación estándar perfecta. Ahora vaga, dispersando todo a su alrededor.",
    dato:"📊 La Varianza mide qué tan dispersos están los datos respecto a la media. ¡Este espectro ES esa dispersión hecha criatura!",
    consejo:"Umbral 9: impactás en 116 de las 144 combinaciones (80,6 %). Es el monstruo más fácil de acertar: aprovechá para probar tus objetos."
  },
  {
    titulo:"La Hidra de las Variables",
    historia:"Cada cabeza representa una variable aleatoria independiente. Cuando los estadísticos del reino quisieron modelar 7 eventos simultáneos, las variables cobraron vida propia y formaron esta bestia de múltiples voluntades.",
    dato:"🎲 Con 7 variables independientes, la distribución conjunta tiene 12⁷ = 35.831.808 resultados posibles. ¡La Hidra los conoce a todos!",
    consejo:"Umbral 10: impactás en 108 de 144 (75 %). Pega más fuerte que el Espectro, así que no dejes bajar tu HP sin curarte."
  },
  {
    titulo:"El Golem Gaussiano",
    historia:"Forjado piedra por piedra siguiendo la sagrada Campana de Gauss, este Golem es la encarnación de la distribución normal. Su corazón late al ritmo de la media, y sus puños golpean con la fuerza de la desviación estándar.",
    dato:"🔔 La distribución normal es simétrica: el 68% de los datos cae dentro de 1σ, el 95% dentro de 2σ. ¡El Golem es más fuerte en el centro!",
    consejo:"Umbral 11: impactás en 99 de 144 (68,8 %). Cada punto que tu tirada pasa del umbral suma 1,5 de daño: una tirada alta pega mucho más que una justa."
  },
  {
    titulo:"La Bruja de la Distribución",
    historia:"Maestra de todas las distribuciones conocidas, la Bruja puede transformar cualquier variable aleatoria a su antojo. Estudió durante siglos los textos prohibidos de la Estadística Bayesiana y ahora usa ese conocimiento para corromper el reino.",
    dato:"🧙 La distribución binomial, Poisson, exponencial... la Bruja las domina todas. Su maldición favorita: convertir eventos independientes en dependientes.",
    consejo:"Umbral 12: impactás en 89 de 144 (61,8 %). Cuando fallás, ella golpea un 15 % más fuerte: llevá pociones."
  },
  {
    titulo:"El Tiburón de la Desviación",
    historia:"Nació en las profundidades del Mar de la Incertidumbre, donde los intervalos de confianza se rompen y las estimaciones fallan. Cada vez que un estadístico calculó mal la desviación estándar, el Tiburón creció un centímetro más.",
    dato:"🦈 La desviación estándar de la suma de 2d12 es σ ≈ 4,9 (un solo d12 tiene σ ≈ 3,45). ¡Este Tiburón nada en ese rango de incertidumbre!",
    consejo:"Su ataque aumenta con cada turno. ¡Derrotalo rápido antes de que sea demasiado tarde!"
  },
  {
    titulo:"El Dragón Bernoulli",
    historia:"Jakob Bernoulli lo conjuró accidentalmente al demostrar que todo experimento tiene exactamente dos resultados: éxito o fracaso. El Dragón tomó eso literalmente: en cada turno, o te destruye completamente, o casi no te toca. No hay término medio.",
    dato:"🐉 La distribución de Bernoulli: P(éxito)=p, P(fracaso)=1-p. Tu tirada contra su umbral es un ensayo de Bernoulli: con umbral 14, p = 66/144 ≈ 45,8 %. ¡Cara o ceca con tu vida!",
    consejo:"Umbral 14: impactás en 66 de 144 (45,8 %), menos de la mitad de las veces. Un objeto que suba tu tirada o baje el umbral cambia mucho la pelea."
  },
  {
    titulo:"El Espíritu Poisson",
    historia:"Siméon-Denis Poisson nunca imaginó que su distribución cobraría vida. El Espíritu aparece donde menos se lo espera, en promedio λ veces por unidad de tiempo. Los guerreros que lo enfrentan nunca saben cuándo ni cuánto va a atacar.",
    dato:"👻 La distribución de Poisson modela eventos raros pero recurrentes. P(k eventos) = (λᵏ · e⁻λ) / k! ¡El Espíritu ES esa impredecibilidad!",
    consejo:"Umbral 14 como el Dragón (45,8 %), pero con menos vida (155) y menos defensa (6): cada impacto le saca más que a él."
  },
  {
    titulo:"El Titán Normal",
    historia:"Cuando la Ley de los Grandes Números alcanzó su forma perfecta, nació el Titán. Es la convergencia absoluta, el límite central llevado a su máxima expresión. En los turnos 6, 7 y 8 alcanza su poder máximo, igual que la curva normal en su media.",
    dato:"⛰️ El Teorema Central del Límite dice que la suma de muchas variables aleatorias converge a una distribución normal. El Titán ES ese teorema hecho carne.",
    consejo:"En los turnos 6, 7 y 8 su golpe es 4 puntos más fuerte. Terminá la pelea antes, o llegá a ese tramo con la vida llena."
  },
  {
    titulo:"La Esfinge Chi-Cuadrada",
    historia:"Monstruo de los acertijos estadísticos, la Esfinge devora a quienes no pueden distinguir entre frecuencias observadas y esperadas. Cada batalla es una prueba de bondad de ajuste: ¿tus tiradas se ajustan a lo que ella espera?",
    dato:"χ² La prueba Chi-Cuadrada mide si los datos observados difieren significativamente de los esperados. ¡La Esfinge mide exactamente eso en cada ataque!",
    consejo:"Umbral 15: sólo 55 de 144 tiradas impactan (38,2 %). Sumá bonos a la tirada (Dado de la Suerte, Resiliencia) o bajá el umbral."
  },
  {
    titulo:"El Demiurgo del Determinismo",
    historia:"El enemigo final. Existe desde antes de que el azar fuera inventado, y cree que todo resultado puede calcularse de antemano. Cada combinación de 2d12 la tiene memorizada. Para él, tirar dados es solo una ilusión que les da a los mortales falsa esperanza. Demuéstrale que el azar es real y que la Probabilidad de Laplace tiene poder verdadero.",
    dato:"⚡ P=Casos Favorables/144. Esta es el Arma Suprema. El Demiurgo dice que el azar no existe... pero vos sabés que sí, y eso es lo que lo derrota.",
    consejo:"¡FASE 2 al 50% de vida! Usá todos tus objetos. No guardes nada. Este es el momento."
  }
];

const MONSTER_DIALOGUES = [
  ["¿Podés calcular dónde estaré en el próximo turno? ¡Yo tampoco lo sé!", "Tu varianza es enorme... y eso me alimenta.", "Dispersión caótica: mi naturaleza, tu pesadilla.", "El azar fluye a través de mí... y te aplastará."],
  ["Siete cabezas, siete probabilidades. ¿Cuál te morderá?", "¡Cada variable que ignorás es una cabeza que crece!", "Mis variables son independientes... tu miedo, no.", "Grados de libertad: yo tengo 7. Vos, ninguno."],
  ["Soy la curva perfecta. Vos sos un outlier.", "68% de probabilidad de que no sobrevivas.", "La media es 13. ¡Y yo soy la fuerza de esa media!", "Mis puños siguen una distribución normal... de dolor."],
  ["¡Transformo tu esperanza en desesperación bayesiana!", "Mis hechizos siguen la distribución de tu peor pesadilla.", "¿Condicional o marginal? Da igual, ¡ambas te destruyen!", "Actualizo mis probabilidades... todas apuntan a tu derrota."],
  ["Cada turno que pasa, mi hambre crece σ unidades.", "Nado en tus probabilidades fallidas... ¡y me engordan!", "La desviación de tus cálculos es mi arma.", "Tick... tick... mi ataque escala. ¿Cuánto aguantás?"],
  ["¡Éxito o fracaso! Bernoulli no miente... pero yo sí.", "p=0.5 de que este aliento te elimine. ¡Apostemos!", "¡Cara: sobrevivís. Ceca: no existe el mañana!", "Mi fuego sigue distribución binomial... ¡con n=∞!"],
  ["λ ataques por turno... ¿cuántos serán este?", "Aparezco donde no me esperás. Siempre.", "La Poisson no miente: llegaré cuando menos lo imagines.", "e⁻λ es la probabilidad de que escapes. Es muy pequeña."],
  ["El Teorema Central del Límite dice que caerás.", "En el turno 6... 7... 8... soy invencible. ¡Temblá!", "Soy la convergencia. Vos sos el ruido.", "Infinitas sumas de variables... todas apuntan a tu fin."],
  ["¿Tus tiradas son significativas? χ²=∞ dice que no.", "Observado vs esperado: ¡observo tu derrota!", "p-valor de tu victoria: 0.0001. Rechazado.", "La hipótesis nula sos vos. ¡Y la rechazo!"],
  ["Conozco cada una de las 144 combinaciones. ¡Soy el determinismo!", "El azar no existe. Todo lo que creés aleatorio... ¡lo controlo yo!", "Laplace pensó que podía dominarme. ¡Está muerto y yo sigo aquí!", "FASE 2 ACTIVADA. ¡Ahora conocerás el verdadero determinismo!", "¿Doble 1? ¡Lo sabía! ¡Todo está calculado!", "Tu resistencia es admirable... pero estadísticamente imposible."]
];
