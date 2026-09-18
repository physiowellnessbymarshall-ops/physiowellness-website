# Design System — Physio Wellness

Este documento describe el sistema visual **tal como existe hoy** en
`src/css/styles.css` (única hoja de estilos real del proyecto, ~3080
líneas). No es una propuesta ni un rediseño: cada valor listado aquí se ha
verificado directamente en el código. Cuando el código contradice una
referencia externa conocida, se anota como observación al final, no se
"corrige" silenciosamente.

## Color

Todos los tokens de color viven en `:root` (`src/css/styles.css:12-24`),
comentados como "confirmados por el Inventario Maestro (14/08/2026)".

**Principales**
- `--pw-primary: #237369` — verde corporativo confirmado. Uso: fondos de
  botón primario, texto de énfasis sobre fondo claro, iconografía.
- `--pw-primary-600: #1c5c54` — derivado, hover/estado activo del botón
  primario.
- `--pw-primary-900: #123c37` — derivado, fondo profundo (header sólido,
  secciones oscuras como `#areas`/`.services`, `.area-carousel`,
  `.site-footer`).
- `--pw-accent: #269888` — acento de marca. Uso: elementos decorativos,
  hover de outline, resplandores (`radial-gradient` calculado a partir de
  `rgba(38,152,136,…)`), estado activo del selector de idioma.

**Secundarios / apoyo**
- `#8fd9c9` — variante clara del acento, **sin token dedicado** (hardcoded
  en ~24 puntos del CSS). Se usa específicamente sobre fondos oscuros
  (`--pw-primary-900`) para eyebrows, números de paso, bordes de acento y
  texto pequeño, en sustitución directa de `--pw-accent` cuando ese
  contexto requiere más contraste (ver "Estados de contraste" abajo).
- `--pw-mist: #f3f6f5` — neutro claro de apoyo, explícitamente comentado
  como "no es un color de marca". Fondo alterno de secciones (`.facility`,
  `.contact`) para romper el blanco puro sin introducir un color nuevo.

**Fondos**
- `--pw-white: #ffffff` — fondo base de body y de la mayoría de secciones.
- `--pw-mist` — fondo alterno (seguido de `border-block` con `--pw-line`).
- `--pw-primary-900` — fondo oscuro para secciones de alto contraste
  (`#areas`, `.area-carousel`, footer).

**Texto**
- `--pw-ink: #12201d` — texto principal, "casi negro con matiz verde".
- `--pw-ink-70: rgba(18,32,29,.7)` y `--pw-ink-50: rgba(18,32,29,.5)` —
  variantes de opacidad para texto secundario/terciario sobre fondo claro.
- Sobre fondo oscuro, el texto secundario usa `rgba(255,255,255,.72)` /
  `rgba(255,255,255,.82)` / `rgba(255,255,255,.85)` según el contexto
  (no hay un único token equivalente a `--pw-ink-70` para fondo oscuro).

**Líneas / bordes**
- `--pw-line: rgba(18,32,29,.12)` — separadores sobre fondo claro.
- `--pw-line-on-dark: rgba(255,255,255,.22)` — separadores sobre fondo
  oscuro (footer).

**Estados de contraste (documentado en el propio CSS)**
En `styles.css:1905-1913` y `:1938-1941` hay comentarios explícitos: *"
--pw-accent no llega a 4.5:1 sobre fondos claros para texto pequeño"*. La
solución adoptada en el código es usar `--pw-primary` en vez de
`--pw-accent` para texto pequeño sobre fondo claro (`.page-servicios`,
`.page-home`, con selectores `:not(.eyebrow--on-dark)` explícitos para no
tocar la variante oscura), y `#8fd9c9` en vez de `--pw-accent` para texto
pequeño sobre fondo oscuro (contraste declarado: 5.6:1 claro-con-primary /
7.5:1 oscuro-con-`#8fd9c9`). Es una regla ya resuelta en el código, no un
problema pendiente.

## Tipografía

- **Familia única**: `--font-base: 'Jost', ui-sans-serif, system-ui,
  -apple-system, sans-serif`. Cargada desde Google Fonts
  (`index.html:15`) con pesos **400, 500, 600** únicamente.
- **Pesos realmente usados en el CSS**: 400 (cuerpo de texto, base),
  500 (la mayoría de headings, títulos de tarjeta, botones, cifras), 600
  (eyebrows, labels en mayúsculas, énfasis, estado activo). Hay **un único
  uso de `font-weight:700`** (`styles.css:2207`, badge "Seleccionada" en
  Tarifas) — ver observaciones.
- **Jerarquía de tamaño** (tokens fluidos con `clamp()`, `:root`):
  - `--fs-display: clamp(2.75rem,6vw,5.75rem)` — titular hero.
  - `--fs-h2: clamp(2rem,4vw,3.25rem)` — títulos de sección
    (`.section-heading`).
  - `--fs-h3: clamp(1.375rem,2vw,1.75rem)` — subtítulos.
  - `--fs-lead: clamp(1.05rem,1.4vw,1.25rem)` — párrafo de entrada/lead.
  - `--fs-body: 1rem` — cuerpo de texto estándar.
  - `--fs-small: .875rem` — texto secundario.
  - `--fs-label: .75rem` — labels, eyebrows, texto uppercase.
- **Elementos editoriales recurrentes**: eyebrows en mayúsculas con
  `letter-spacing` amplio (~.08–.16em) precedidos de un pequeño trazo/línea
  (`::before`), numeración de pasos (`counter-reset`), y cifras grandes
  con `letter-spacing` negativo (`-.02em` a `-.03em`) y `line-height` muy
  ajustado (`.8`–`1`) para bloques de precio en Tarifas — tratamiento tipo
  "cifra editorial", no tabla numérica estándar.

## Layout

- **Container**: clase `.container` (`styles.css:81-86`) —
  `max-width: var(--container)` = **1240px**, centrado (`margin-inline:
  auto`), padding horizontal fluido `clamp(1.5rem,4vw,2.75rem)`.
- **Escala de espaciado** (base 8, `:root`): `--sp-1` (.25rem) hasta
  `--sp-32` (8rem), pasos: 1,2,3,4,5,6,8,10,12,16,24,32.
- **Ritmo vertical de secciones**: predominan `padding-block: var(--sp-24)`
  (6rem) o `var(--sp-32)` (8rem) por sección; algunas variantes con
  `clamp()` propio (hero: `clamp(7rem,14vh,10rem)`). Las secciones alternan
  fondo blanco / `--pw-mist` con `border-block:1px solid var(--pw-line)`
  como separador visual entre bloques, en vez de sombras o tarjetas
  contenedoras.
- **Grids**: mayoritariamente `display:grid` de una sola columna en móvil
  que pasa a `grid-template-columns` explícito en `min-width:860px` o
  `960px` (equipo, contacto, footer, bloques de texto+imagen). Gaps usan
  la escala `--sp-*` (comúnmente `--sp-10` o `--sp-12` entre columnas).
  Patrón particular: `.testimonials__grid` usa `gap:1px` sobre
  `background:var(--pw-line)` para crear líneas divisorias finas entre
  tarjetas sin bordes individuales (efecto "costura").
- **Radio de esquina — sistema dual deliberado** (comentado explícitamente
  en `styles.css:2050-2054`): `--radius: 2px` es el radio global
  ("precisión clínica: bordes casi rectos, nada juguetón"), usado en
  botones y controles. `--radius-tile: 20px` es una **excepción local**
  definida solo dentro de bloques de tarjetas fotográficas editoriales
  (áreas, tarifas), explícitamente no promovida a token global para no
  "ablandar" el resto de la interfaz.
- **Comportamiento de secciones especiales**: varias secciones usan
  `position:sticky` (panel de contexto en Tarifas, intro de "Primera
  visita", cabecera de servicios en tarifas) y una usa scroll-pin real vía
  JS (`servicesPinScroll` en `main.js`, sección `#areas`) combinado con
  `position:sticky` en el escenario.

## Componentes

- **Botones** (`.btn`, `styles.css:133-169`): base compartida (uppercase,
  `letter-spacing:.08em`, `font-size:.8rem`, `padding:.95rem 2rem`,
  `border-radius:var(--radius)`), dos variantes de color:
  - `.btn--primary`: fondo `--pw-primary`, hover a `--pw-primary-600` +
    `translateY(-2px)` + sombra.
  - `.btn--outline`: borde `rgba(255,255,255,.5)`, texto blanco, pensado
    para fondo oscuro; hover cambia borde a `--pw-accent` y añade fondo
    `rgba(38,152,136,.14)`.
  - Modificadores: `.btn--sm` (compacto), `.btn--wrap` (permite salto de
    línea en pantallas estrechas).
- **Header** (`.site-header`): `position:fixed`, con clase `.is-hidden`
  (oculta por `translateY(-100%)` en scroll hacia abajo) y `.is-solid`
  (fondo sólido al hacer scroll). Altura fija en todos los anchos, por lo
  que `:where([id]){scroll-margin-top:6rem}` se aplica globalmente para
  que los saltos de ancla no queden tapados por el header.
- **Cards / tarjetas**: dos familias distintas, no unificadas en una sola
  clase de "card" genérica:
  - Tarjetas editoriales de foto grande + `--radius-tile:20px` (áreas en
    Home y Tarifas) — inspiradas explícitamente en "ritmo de tarjeta
    grande + imagen tratada de Revo Studios, sin copiar su paleta"
    (comentario literal en `styles.css:2047`).
  - Tarjetas de texto plano sin imagen (testimonios, equipo) con
    `--radius:2px` o sin radio, separadas por líneas finas en vez de
    sombra/elevación.
- **Carrusel** (`.area-carousel`, sección "¿Qué necesitas ahora?"):
  fondo `--pw-primary-900`, resplandor radial centrado calculado en rgba
  a partir de `--pw-accent`, arrastre táctil (`touch-action:pan-y`,
  `cursor:grab/grabbing`) gestionado desde `main.js`, con soporte para
  ciclar, avanzar/retroceder o saltar a una tarjeta.
- **Navegación**: dropdowns de escritorio (`.nav-dropdown`, ocultos con
  `hidden` hasta interacción), menú móvil de panel completo
  (`.mobile-menu`, `position:fixed;inset:0`) con acordeones
  (`.m-acc__panel`), y selector de idioma (`.lang-switch`) presente en
  ambas variantes.
- **Bloques editoriales**: eyebrow + título + lead es el patrón repetido
  para introducir casi cualquier sección (`.section-heading` comparte
  `--fs-h2`); numeración de pasos con `counter-reset` (Primera visita,
  proceso de Fisioterapia); bloques de "cifra grande" para precios
  (Tarifas) sin tabla.
- **Testimonios**: `.testimonials__grid` (grid con costura de 1px), texto
  recortado a 5 líneas solo si hay JS (`.js .testimonial-card__quote[data-clamped]`,
  con `-webkit-line-clamp:5`), comillas tipográficas vía `::before`/`::after`
  coloreadas con `--pw-primary`. Reseñas de Google en páginas de servicio
  usan un componente aparte (`.google-review-card`), visualmente distinto
  (no reutiliza `.testimonial-card`).
- **CTAs**: bloque `.cta-final` repetido al final de Home, Servicios y
  Tarifas, consistente en estructura (título + botón), variando solo
  contenido.

## Responsive

**Breakpoints reales detectados** (conteo de usos en `styles.css`):
`min-width: 640px` (7), `min-width: 720px` (4), `min-width: 768px` (1),
`min-width: 860px` (17, el más usado), `min-width: 960px` (14),
`min-width: 1024px` (2), `min-width: 1100px` (6), más variantes
`max-width` puntuales (639px, 640px, 719px, 959px, 1099px) para revertir
reglas en vez de reestructurar. El README documenta 640/860/960/1100 como
"los" breakpoints; en la práctica hay dos adicionales (720px, 768px,
1024px) usados de forma puntual — ver observaciones.

**Enfoque**: mobile-first consistente (reglas base para móvil, se añaden
con `min-width` hacia arriba), sin un único "mobile breakpoint" universal:
cada componente activa su cambio de layout en el ancho que le corresponde
según su propio contenido, no según una tabla fija de tres tamaños.

**Transformaciones típicas desktop → mobile**:
- Grids de N columnas colapsan a 1 columna por debajo de su breakpoint
  (equipo, contacto, testimonios, bloques de texto+imagen).
- El header pasa de nav horizontal + dropdowns a `.mobile-menu` de panel
  completo con acordeones, por debajo de 860px (aprox., a confirmar con
  el breakpoint exacto del JS de header/menú).
- Layouts de dos columnas con panel `sticky` (Tarifas `#areas`, `#en-la-clinica`)
  se apilan verticalmente en móvil, perdiendo el `position:sticky` (mismo
  contenido, sin comportamiento especial).
- El carrusel de áreas (`.area-carousel`) aplica sus reglas de posición
  "en todos los anchos" a propósito (comentario explícito en el código),
  y solo usa el media query de 1024px para ampliar tamaños y revelar
  descripción/CTA de la tarjeta activa — no para reestructurar el patrón
  de interacción.

## Dirección visual

Principios detectados de forma consistente en comentarios y decisiones de
código, no solo inferidos del resultado visual:

- **Editorial, no clínico**: paleta reducida (verdes + neutro mist),
  ausencia deliberada de blanco/azul "hospital"; comentario explícito en
  el propio CSS sobre evitar estética "de parque de atracciones" en el
  movimiento (`styles.css:6-8`).
- **Precisión + calidez conviviendo**: el sistema de radio dual
  (`--radius:2px` "clínico" vs. `--radius-tile:20px` editorial) es la
  prueba más clara de que el proyecto combina intencionadamente precisión
  (bordes casi rectos, tipografía uppercase con tracking amplio, cifras
  grandes) con calidez (fotografía tratada, curvas suaves solo donde hay
  imagen, grano sutil `feTurbulence`).
- **Cálido y natural**: tratamiento fotográfico consistente sin
  sobre-procesar (ver `ASSET_SOURCES.md`: "ninguna gradación de color" en
  varias fases recientes, se prioriza usar la foto aportada tal cual).
- **Referencia declarada, no copiada**: Revo Studios se cita explícitamente
  en el código como inspiración de ritmo/interacción/tarjeta editorial,
  con la aclaración explícita de "sin copiar su paleta ni su estética
  tech" — coherente en varios puntos del CSS, no solo en un comentario
  aislado.
- **Contemporáneo**: uso de `clamp()` para tipografía y espaciado fluido
  en vez de breakpoints rígidos de tamaño de fuente, motion con
  `cubic-bezier` propios (`--ease-out`, `--ease-emphatic`) en vez de
  easings por defecto del navegador.

---

## Observaciones (inconsistencias detectadas, sin corregir)

1. **Color secundario de referencia no coincide con el código.** Se me
   indicó como referencia "Secondary green: #24746A", pero ese valor
   **no existe en ningún archivo del repositorio** (verificado con
   búsqueda exacta). El color que sí cumple ese rol en el código es
   `--pw-accent: #269888`. Antes de usar `#24746A` en cualquier trabajo
   futuro, habría que confirmar con el cliente/dirección de arte si es un
   valor nuevo a introducir o un error de referencia.
2. **`font-weight:700` usado una vez sin estar cargado.** Google Fonts
   solo carga los pesos 400/500/600 de Jost (`index.html:15`), pero
   `styles.css:2207` (badge "Seleccionada" en Tarifas) usa
   `font-weight:700`. El navegador probablemente sintetiza un bold falso
   o cae a 600, según el motor de render — comportamiento no garantizado
   entre navegadores.
3. **`#8fd9c9` no tiene token dedicado.** Es un color de marca funcional
   (variante de contraste de `--pw-accent` sobre fondo oscuro), usado en
   ~24 sitios distintos del CSS, pero siempre como valor hardcodeado en
   vez de como custom property. Cualquier cambio futuro de ese tono
   requeriría una búsqueda y reemplazo manual, no editar una variable.
4. **Breakpoints no documentados en el README.** El README cita
   640/860/960/1100 como "los" breakpoints, pero el CSS también usa
   720px, 768px y 1024px de forma puntual. No es necesariamente un error
   (pueden ser ajustes finos intencionados), pero el README da una imagen
   incompleta del sistema responsive real.
5. **Dos familias de "card" sin nomenclatura compartida.** Las tarjetas
   editoriales con foto (`--radius-tile`) y las tarjetas de texto plano
   (testimonios, equipo) no comparten una clase base ni convención de
   nombre común (`.area-tile` vs `.testimonial-card` vs `.team-card`),
   lo que dificulta identificar "todas las cards del sitio" por selector.
