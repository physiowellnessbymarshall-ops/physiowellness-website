# Motion System — Physio Wellness

Este documento describe el comportamiento **real** de animación e
interacción del sitio, verificado directamente en `src/js/main.js`
(~1630 líneas) y `src/css/styles.css`. No hay ninguna librería externa de
animación: **vanilla JS + CSS**, sin GSAP, ScrollTrigger, Lenis ni
similares (verificado por búsqueda en todo el repo). Cada bloque de JS
está envuelto en su propio `try/catch` de forma deliberada — un efecto
roto no debe tumbar el resto del script (comentario literal al inicio del
archivo).

## Principios de dirección de movimiento

Estos principios no son aspiracionales: se corresponden con patrones que
se repiten de forma consistente en el código real.

- **Movimiento suave e intencional**: todos los easings son personalizados
  (`--ease-out: cubic-bezier(.22,.61,.36,1)`, `--ease-emphatic:
  cubic-bezier(.16,1,.3,1)`), nunca `ease`/`linear` por defecto.
- **Sensación editorial y premium**: entradas con desfase (`transition-delay`
  escalonado), tipografía que se revela línea a línea, cifras que se
  disuelven por proximidad en vez de "contar" de golpe.
- **Nada de animación gratuita**: no hay ni un solo `@keyframes` decorativo
  sin propósito narrativo — cada efecto está atado a scroll, estado real
  o intención del usuario (hover, foco, arrastre).
- **El scroll nunca se bloquea**: las dos secciones "fijadas" (`#areas` y
  `#metodo`) están comentadas explícitamente en el código como "nunca se
  intercepta la rueda, el trackpad ni el touch": son una función pura de
  la posición de scroll vertical ya existente, nunca `preventDefault()`
  sobre el scroll ni un sustituto (tipo scroll-jacking clásico).
- **Rendimiento**: todo listener de `scroll` usa un patrón
  ticking + `requestAnimationFrame` (nunca se recalcula más de una vez por
  frame), listeners de scroll/resize son `{passive:true}` donde aplica, y
  las animaciones fijadas escriben solo `transform` y custom properties
  CSS (nunca `top`/`left`/`width` en cada frame).
- **`prefers-reduced-motion` respetado en dos capas**: (1) un bloque CSS
  global (`styles.css:53-56`) reduce `animation-duration`,
  `transition-duration` y `scroll-behavior` a ~0 para **todo** el sitio
  vía `!important`; (2) además, cada bloque de JS con animación continua
  comprueba `prefersReducedMotion` (calculado una vez al cargar,
  `main.js:9`) y se desactiva por completo (no solo "más rápido") cuando
  aplica — es decir, hay doble red de seguridad, no solo una regla CSS
  genérica.
- **Narrativa y jerarquía, no decoración**: el ejemplo más claro es "El
  umbral" (Marshall Method), donde cada variable de movimiento representa
  un estado emocional/clínico real (frío→cálido, cerrado→abierto), no un
  efecto visual sin significado.

## Comportamiento del header durante scroll

`main.js:19-84` (`headerState`), componente global (todas las páginas).

- `position:fixed`. Se oculta (`.is-hidden`, `translateY(-100%)`) al bajar
  y reaparece al subir, con una **zona muerta de 8px** (`MIN_DELTA`) para
  no reaccionar a temblores mínimos de scroll.
- Fondo sólido (`.is-solid`) a partir de 24px de scroll.
- **Siempre forzado visible** (nunca se oculta) en estos casos: cerca del
  principio de la página (`scrollY <= 96px`), con el menú móvil abierto,
  con el panel de reserva abierto, o mientras el foco de teclado esté
  dentro del header — para no esconder nunca un elemento con foco activo.
- Implementado con ticking + rAF sobre `scroll` pasivo; sin listener de
  scroll duplicado.

## Hero (Home)

`main.js:281-322` + CSS `.hero__title .reveal-line`, `.hero__lead`,
`.hero__actions`.

- **Entrada** (`heroReady`): dos `requestAnimationFrame` anidados añaden
  `.is-ready` al hero (truco para garantizar que la transición CSS se
  aprecie, evitando que el navegador colapse el cambio de estado inicial).
  Con esa clase: el título se revela línea a línea (`overflow:hidden` +
  `translateY(130%→0)`, con `transition-delay` escalonado por variable CSS
  `--i`), seguido del lead (`delay:.55s`) y los botones (`delay:.72s`) —
  una coreografía de entrada en cascada, no simultánea.
- **Salida ligada a scroll** (`heroExitTransition`): la imagen del hero
  escala progresivamente de 1.06 a 1.12 y el bloque de contenido se
  desplaza 40px hacia abajo mientras funde su opacidad hasta ~0.1, en
  función de `scrollY / innerHeight` (0 a 1 en el primer viewport de
  scroll). Se desactiva completamente con `prefers-reduced-motion`.
- El mismo patrón de zoom en scroll se reutiliza en `pageHeroMedia`
  (`main.js:329-351`) para los heroes con imagen de páginas internas
  (Tarifas y futuras), con su propio guardado explícito en el comentario
  de "no arriesgar ninguna regresión" en el hero de Home.

## Servicios — escenario fijado con recorrido horizontal (`#areas`)

`main.js:519-772` (`servicesPinScroll`), la sección con las cinco tarjetas
de área (Fisioterapia, Bienestar, Fuerza, Pilates, Stretching).

- **Solo en escritorio amplio** (`min-width:1100px`), sin `prefers-reduced-motion`,
  y solo si hay desbordamiento horizontal real medido dinámicamente.
- El scroll vertical dentro de `.services__pin-wrap` mueve el riel de
  paneles con `transform: translate3d(-Xpx,0,0)`; `.services__pin-inner`
  queda fijo por `position:sticky` (CSS). El wrap tiene la altura extra
  exacta (medida, no hardcodeada) necesaria para cubrir el recorrido
  horizontal completo.
- Cinco paradas (una por servicio) + un panel de transición final; flechas
  de teclado (←/→ con foco en la sección), botones prev/next y el
  indicador "01/0N" comparten la misma fuente de verdad
  (`stopTargets`/`currentIndex`).
- **Fallback explícito** por debajo de 1100px, con motion reducido, o sin
  desbordamiento suficiente: la sección se queda como riel de scroll
  horizontal nativo (`overflow-x`), con el mismo indicador/flechas
  sincronizados por `scrollLeft` en vez de por `transform`.
- Recalcula todo (`measure()`) en resize, cambio de orientación, carga de
  fuentes (`document.fonts.ready`) y `ResizeObserver` sobre el viewport y
  el riel — nunca asume una resolución fija.

## The Marshall Method — "El umbral" (`#metodo`)

`main.js:774-1028` (`umbralSequence`), la escena de mayor complejidad del
sitio: cinco fases — **Escuchar, Valorar, Tratar, Acompañar,
Evolucionar** — narradas mediante una sola escena visual continua.

- **Se activa en cualquier ancho, móvil incluido**, a diferencia de la
  sección de Servicios — la única condición para no activarse es
  `prefers-reduced-motion` o una ventana con menos de 480px de alto. Lo
  único que cambia por breakpoint es **cuánto scroll dura** cada
  transición de fase (`getStepFraction`: 0.32 en <640px, 0.44 en <960px,
  0.58 en escritorio), nunca la lógica de la escena.
- **Arquitectura JS→CSS limpia**: JS nunca decide color ni forma. Cada
  frame de scroll interpola linealmente (`lerp`) entre dos entradas de un
  array `KEYFRAMES` (una por fase, con 13 propiedades numéricas cada una:
  posición/opacidad de dos "veladuras", blur, posición/escala/intensidad
  del núcleo de luz, temperatura de color, cierre del encuadre, oscuridad
  de fondo) y escribe el resultado como **custom properties CSS
  numéricas** en `.umbral__stage` (`--u-veil-a-gap`, `--u-core-x`,
  `--u-core-warm`, etc. — documentadas también en `styles.css`, sección
  §11). El HTML/CSS resuelve toda la forma real a partir de esos números.
- Las cinco cifras del numeral de fase (`01`–`05`) funden su propia
  opacidad según su distancia a la posición continua actual (envolvente
  triangular), por lo que la cifra activa nunca "salta": se disuelve.
- Fase activa, progreso e indicadores de segmento se actualizan solo
  cuando el índice de fase redondeado cambia (no en cada frame), evitando
  trabajo de DOM innecesario.
- **Fallback accesible real, no solo "desactivado"**: sin JS, con motion
  reducido, o en ventana muy baja, las capas decorativas quedan en
  `display:none` (CSS) y las cinco fases se leen como **lista vertical
  normal** vía el mismo `[data-reveal]` genérico que usa el resto del
  sitio — es explícitamente "la versión estática accesible que pide la
  dirección" (comentario literal en el código), no un simple corte de
  animación.

## Primera visita — timeline ligado a scroll (Home)

`main.js:1030-1095` (`firstVisitTimeline`).

- Deliberadamente mucho más ligero que "El umbral": **sin pinning, sin
  listener de scroll, sin cálculo continuo de posición**. Solo un
  `IntersectionObserver` con una banda fina cerca del centro del viewport
  (`rootMargin:'-42% 0px -50% 0px'`); el paso cuyo borde cruza esa banda
  pasa a ser el activo, en cualquier dirección de scroll.
- El desplazamiento del bloque izquierdo (`.first-visit__intro`) es
  **CSS puro** (`position:sticky`); JS solo mide la altura real del header
  una vez (y en resize) para fijar el offset del sticky sin tapar el
  título.
- Mejora progresiva limpia: sin `IntersectionObserver` o con motion
  reducido, la función no hace nada — los 5 pasos quedan en su estado base
  definido en CSS, sin depender de JS.

## Reseñas y testimonios

Dos sistemas distintos y no compartidos, verificados por separado:

**Testimonios de Home (`quoteToggles`, `main.js:1097-1162`)**: el texto
íntegro siempre está en el HTML. Se mide `scrollHeight` vs `clientHeight`
tras `document.fonts.ready` (la tipografía cambia el número de líneas
reales); el botón "Leer completo" solo aparece si el contenido realmente
desborda 5 líneas (`-webkit-line-clamp:5`, activado por
`[data-clamped]`). Se re-evalúa en resize (un fragmento puede dejar de
necesitar recorte al ensanchar).

**Cinta de reseñas de Google (`googleReviewsMarquee`, `main.js:1390-1630`,
página de Fisioterapia)**: bucle infinito por `transform`, sin
`<marquee>` ni librería nueva.
- Solo existen 6 reseñas reales en el DOM (`[data-reviews-track]`); el
  nodo duplicado que cierra el bucle se clona en runtime y se marca
  `aria-hidden="true"` + `inert`, así lectores de pantalla y teclado nunca
  lo alcanzan.
- Velocidad constante de **32px/s** ("lento y constante, no un carrusel de
  diapositivas", cita literal), animado por rAF con delta-time real
  (`dt`), no por `setInterval` de paso fijo.
- **Se pausa** por: hover, foco por teclado, arrastre manual, pestaña no
  visible (`visibilitychange`) o sección fuera de viewport
  (`IntersectionObserver`, cancela el rAF por completo, no solo lo salta
  en vacío). Al reanudar continúa desde el offset exacto donde se quedó,
  nunca "encaja" en una tarjeta.
- **Por debajo de 768px no hay bucle automático en absoluto**: con una
  sola tarjeta casi a pantalla completa, decidieron que leer mientras la
  cinta se mueve sola es incómodo — en móvil queda en scroll horizontal
  nativo, mismo estado que sin JS o con motion reducido. El breakpoint se
  reevalúa en cada resize/orientationchange, no solo al cargar.
- Arrastre manual (Pointer Events) disponible cuando el marquee está
  activo, reutilizando el mismo `offset` del bucle automático.

## Carrusel de áreas (Servicios, `.area-carousel`)

`main.js:1204-1388` (`areaCarousel`).

- El DOM mantiene siempre el mismo orden fijo de 5 tarjetas; avanzar,
  retroceder o saltar es solo reescribir `data-position` (-2..2) en cada
  tarjeta — toda la composición visual (tamaño, desplazamiento, opacidad,
  orden) la resuelve el CSS a partir de ese atributo, JS no anima nada
  directamente salvo durante el arrastre.
- **Autoplay** cada 2.8s, solo mientras la sección está visible
  (`IntersectionObserver`, umbral 40%) y no está en pausa; se desactiva
  por completo con `prefers-reduced-motion`.
- Se pausa por hover, foco, pestaña oculta o arrastre activo, con
  reanudación retrasada 900ms tras soltar/perder el foco.
- Clic en tarjeta lateral centra esa tarjeta en vez de navegar a su
  enlace; la tarjeta activa conserva su enlace normal.
- Arrastre con Pointer Events unificado ratón/táctil; el viewport usa
  `touch-action:pan-y` en CSS para no secuestrar el scroll vertical — el
  gesto horizontal se resuelve en JS, el vertical lo gestiona el
  navegador nativamente (mismo principio que la cinta de reseñas).

## Reveal genérico (`[data-reveal]`)

`main.js:416-444` (`revealOnScroll`) + CSS `[data-reveal]` (`styles.css:505-513`).

- Utilidad compartida por prácticamente toda la Home (franja de
  confianza, pasos, bloques de texto) y varias páginas internas: fade +
  `translateY` de entrada, disparado por `IntersectionObserver`
  (`threshold:.2`, `rootMargin:'0px 0px -8% 0px'`) una sola vez
  (`io.unobserve` tras mostrar).
- **Red de seguridad**: si por lo que sea el observer no dispara, un
  `setTimeout` a los 2.5s fuerza mostrar todos los elementos igualmente —
  nunca deja contenido invisible de forma permanente.
- Con `prefers-reduced-motion`, el `transition-delay` se anula
  (`!important`) vía CSS, no se desactiva la utilidad entera.

## Franja de confianza — conteo de cifras

`main.js:446-517` (`trustCounters`). Anima solo los valores numéricos
(p. ej. "10+", "1.500+") de 0 al valor final en 900ms con easing
`easeOutCubic`, disparado una única vez al entrar en viewport
(`IntersectionObserver`, `threshold:.4`, desconectado tras animar). Con
`prefers-reduced-motion` salta directo al valor final sin animar
cifra a cifra — no es una versión "más rápida", es una versión sin conteo.

## Hover y transiciones generales

- 45 reglas `:hover` y 52 declaraciones `transition:` distintas en
  `styles.css`, todas usando los easings/duraciones de marca
  (`--dur-fast/--dur-med/--dur-slow`, `--ease-out/--ease-emphatic`) en vez
  de valores sueltos.
- Patrón repetido: botón primario eleva (`translateY(-2px)`) y añade
  sombra al pasar el ratón; botón outline cambia borde a `--pw-accent` y
  añade un fondo translúcido; enlaces de texto cambian de `--pw-primary` a
  `--pw-accent`.

## Observaciones / deuda actual

No corregidas, solo documentadas:

1. **Dos sistemas de "fijado" (pin) con lógica casi duplicada.**
   `servicesPinScroll` y `umbralSequence` comparten el mismo patrón
   (ticking + rAF, medición dinámica de altura, `ResizeObserver`,
   `document.fonts.ready`, ajuste de altura de wrapper) pero están
   implementados como dos funciones completamente independientes de
   ~250 y ~255 líneas respectivamente, sin ninguna utilidad compartida.
   Cualquier bug o mejora en el patrón de "pin genérico" hay que
   replicarlo a mano en los dos sitios.
2. **Umbral de "móvil" para la cinta de reseñas de Google no coincide con
   el breakpoint documentado del proyecto.** El código usa
   `max-width:767px` (`MOBILE_MAX`) para desactivar el marquee, comentado
   como "igual que el breakpoint de tablet en CSS", pero el README y el
   resto del sistema responsive documentan 640/860/960/1100 como los
   breakpoints base — 768px no aparece en esa lista (mismo hallazgo ya
   señalado en `docs/DESIGN-SYSTEM.md` sobre breakpoints no documentados).
3. **`getStepFraction()` en `umbralSequence` usa umbrales de ancho propios
   (640/960)** que coinciden con dos de los breakpoints base del proyecto,
   pero están hardcodeados como número mágico en JS en vez de derivarse de
   una fuente compartida con el CSS — si el breakpoint base cambiara algún
   día, este valor no se actualizaría solo.
4. **`heroExitTransition` y `pageHeroMedia` son casi duplicados** (mismo
   cálculo de `progress`, mismo tipo de `scale`), separados a propósito
   "para no arriesgar ninguna regresión" en el hero de Home (comentario
   explícito del propio autor del código) — es una duplicación consciente,
   no accidental, pero sigue siendo dos lugares a mantener si cambia el
   lenguaje de movimiento del hero.
5. **Comentario que referencia un "botón de pausa" inexistente.** El
   comentario de `googleReviewsMarquee` (`main.js:1414-1415`) dice
   textualmente "botón de pausa oculto (nada que pausar)" al describir el
   modo móvil, pero se ha buscado en todo el repo (HTML/CSS/JS) y **no
   existe ningún elemento de pausa** para la cinta de reseñas — la única
   pausa es implícita (hover, foco, arrastre, visibilidad). O el
   comentario describe un control que se planeó y nunca se construyó, o
   es un residuo de una versión anterior del componente. En cualquier
   caso, hoy la cinta de reseñas de Google no ofrece ningún control
   manual de pausa accesible por teclado/lector de pantalla más allá del
   foco accidental — relevante para una revisión de accesibilidad futura.
