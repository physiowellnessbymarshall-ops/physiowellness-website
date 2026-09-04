# Development Rules — Physio Wellness

Reglas de trabajo compartidas para cualquier agente (Claude Code, Google
Antigravity IDE, o futuros colaboradores) que trabaje sobre este
repositorio. No son aspiracionales: varias incorporan trampas ya
verificadas en este proyecto concreto, no advertencias genéricas.

## Git

- No realizar cambios sustanciales directamente en `main`. `main` es la
  base estable de la que parten los worktrees/ramas nuevas, no un lugar
  de trabajo activo.
- Utilizar ramas dedicadas para cualquier trabajo con nombre descriptivo
  del alcance (no ramas genéricas tipo `dev` o `wip`).
- Claude Code trabaja preferentemente en `feature/*`, `fix/*`,
  `integracion/*` (patrón ya usado en el historial del repo).
- Google Antigravity IDE trabaja preferentemente en `antigravity/*`
  (rama base ya creada: `antigravity/dev`, en su propio worktree).
- No hacer merge automático entre ramas ni hacia `main` sin que el
  usuario lo pida explícitamente.
- No hacer push automático salvo solicitud explícita — un commit local
  no implica autorización para publicarlo.
- No sobrescribir cambios no relacionados con la tarea en curso: si un
  archivo tiene cambios sin commitear de otro trabajo, no tocarlo salvo
  que la tarea lo requiera de verdad.
- Nunca descartar cambios locales del usuario (`reset --hard`, `checkout
  -- .`, `clean -f`, etc.) sin confirmación explícita.
- Mantener commits pequeños, comprensibles y delimitados a una sola
  intención — no mezclar una corrección de bug con una función nueva en
  el mismo commit.

## Código

- No modificar partes del código no relacionadas con la tarea. Un cambio
  visual en Tarifas no debe tocar Home "de paso", ni un ajuste de
  Fisioterapia debe arrastrar cambios en Stretching.
- No rehacer una implementación funcional sin necesidad. Si algo ya
  funciona (aunque no sea la solución más elegante), no se reescribe solo
  por preferencia estilística.
- Analizar antes de sustituir: leer el código existente y su razón de ser
  (muchos bloques de este proyecto tienen comentarios explicando
  decisiones concretas) antes de proponer una alternativa.
- Mantener responsive en cualquier cambio con impacto visual (ver
  breakpoints reales en `DESIGN-SYSTEM.md`, no solo los documentados en
  el README).
- Mantener accesibilidad: no retirar `aria-*`, skip-links, foco visible,
  ni relaciones semánticas existentes al tocar un componente.
- Mantener SEO: no retirar meta tags, `hreflang`, datos estructurados ni
  jerarquía de encabezados existente sin que la tarea lo pida.
- Mantener funcionalidades existentes: cualquier cambio debe conservar
  el comportamiento actual salvo que la tarea sea precisamente cambiarlo.
- Evitar duplicar CSS o JavaScript. Antes de escribir una regla o función
  nueva, comprobar si ya existe un patrón equivalente reutilizable
  (tokens en `:root`, utilidades como `[data-reveal]`, componentes de
  botón/card ya documentados en `DESIGN-SYSTEM.md`).
- Reutilizar patrones existentes en vez de inventar uno paralelo para el
  mismo problema (p. ej. el patrón `[data-reveal]` para entradas al
  hacer scroll ya cubre la mayoría de casos; no crear una segunda
  utilidad de fade-in distinta salvo necesidad real).
- No introducir dependencias sin necesidad. El proyecto es
  deliberadamente HTML/CSS/JS plano, sin framework ni build (ver
  `README.md`); añadir una librería (incluido cualquier motion library)
  es un cambio de arquitectura que requiere confirmación explícita del
  usuario, no una decisión unilateral del agente.
- No crear soluciones paralelas cuando ya existe un sistema reutilizable
  (p. ej. no crear un segundo sistema de scroll-pin si el patrón de
  `servicesPinScroll`/`umbralSequence` ya resuelve el caso, aunque esté
  documentado como parcialmente duplicado entre sí — ver
  `MOTION-SYSTEM.md`).

**Trampas conocidas de este repositorio** (verificadas, no genéricas):

1. **`src/assets/css/styles.css` y `src/assets/js/main.js` están
   obsoletos y no se cargan en ninguna página.** El CSS y JS reales y
   vigentes son siempre `src/css/styles.css` y `src/js/main.js`. Editar
   los de `src/assets/` no produce ningún efecto visible ni error —
   parece que el cambio "no se aplica".
2. **El header y el footer no se inyectan por ningún mecanismo.**
   `src/components/header.html` y `footer.html` son plantillas de
   referencia; el markup real está copiado a mano en cada página (sin
   fetch, include ni build step, documentado en
   `src/components/README.md`). Al crear una página nueva, copiar el
   header/footer desde una página ya existente en el mismo nivel de
   carpeta (p. ej. `src/pages/servicios.html` para algo en
   `src/pages/`), no desde `src/components/`, porque las rutas relativas
   del componente de referencia no coinciden con todos los niveles.
3. **`overflow` distinto de `visible` en cualquier ancestro de un
   elemento con `position:sticky` rompe el sticky de forma silenciosa**
   (sin error en consola: el elemento se comporta como estático). Ya
   ocurrió una vez en `.services` (ancestro del escenario fijado de
   Servicios) y se corrigió quitando el `overflow:hidden` sobrante; hoy
   `.services` no lo lleva. Antes de añadir `overflow:hidden/auto/scroll`
   a cualquier sección que contenga (o vaya a contener) un elemento
   sticky o fijado por scroll, comprobar que no lo rompe.

## UI / UX

- Mantener el sistema visual documentado en `DESIGN-SYSTEM.md`: paleta,
  tipografía, escala de espaciado, sistema dual de radio de esquina
  (`--radius` clínico vs `--radius-tile` editorial), y el criterio ya
  resuelto de contraste del acento (`--pw-accent` no se usa para texto
  pequeño; se usa `--pw-primary` sobre fondo claro y `#8fd9c9` sobre
  fondo oscuro en su lugar).
- Mantener el sistema de movimiento documentado en `MOTION-SYSTEM.md`:
  easings y duraciones de marca (nunca `ease`/`linear` por defecto),
  patrón ticking + `requestAnimationFrame` para listeners de scroll, y
  respeto de `prefers-reduced-motion` en cualquier animación nueva.
- Evitar estética de plantilla médica genérica: el proyecto busca
  activamente diferenciarse de "web de clínica" (paleta reducida,
  tratamiento fotográfico editorial, tipografía con carácter) — cualquier
  adición debe sostener esa dirección, no una plantilla neutra.
- Las nuevas secciones deben sentirse parte de Physio Wellness: reutilizar
  el lenguaje visual ya existente (eyebrows, cifras editoriales,
  tarjetas con foto tratada) en vez de introducir un lenguaje nuevo
  aislado.
- No priorizar espectacularidad por encima de usabilidad: cualquier
  efecto nuevo debe aportar narrativa o jerarquía (mismo criterio que
  `MOTION-SYSTEM.md`), nunca añadirse solo porque es vistoso.

## Testing

Antes de considerar terminado cualquier cambio con impacto visual:

- revisar desktop;
- revisar mobile;
- comprobar tablet si el cambio lo requiere;
- revisar overflow (especialmente horizontal, fácil de introducir sin
  darse cuenta en layouts con `grid`/`flex` y anchos fluidos);
- revisar superposiciones (header fijo tapando contenido, `z-index`
  entre capas decorativas y contenido real);
- revisar saltos de layout (cambios de tamaño al cargar fuentes o
  imágenes sin `width`/`height` reservados);
- revisar consola (sin errores ni warnings nuevos);
- revisar navegación (enlaces internos, anclas, estado activo);
- revisar animaciones (que no se disparen dos veces, que no se queden a
  medias, que respeten el patrón de "un solo disparo" donde aplica);
- revisar scroll (que ninguna sección lo bloquee o lo intercepte de
  forma no intencionada, ver principios en `MOTION-SYSTEM.md`);
- revisar `prefers-reduced-motion` cuando corresponda (cualquier
  animación continua o ligada a scroll debe tener su variante reducida,
  no solo "más rápida").

**Realidad de las herramientas de este proyecto**: no existe
`package.json`, ni `node_modules`, ni ninguna configuración de
lint/prettier/stylelint/build. No hay comandos de formato, lint, tests ni
build que ejecutar — si algo pide "corre el lint" o "corre los tests", la
respuesta correcta es que no existen en este proyecto, no inventar un
comando. La verificación de un cambio se hace inspeccionando el
resultado renderizado (preview del navegador, sondas sobre el DOM/CSSOM),
no con herramientas de CLI.

## Trabajo con agentes

Cuando un agente reciba una tarea importante sobre este proyecto debe
consultar primero, en este orden:

1. [`docs/PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) — qué es Physio
   Wellness, qué áreas y páginas existen realmente, qué es placeholder.
2. [`docs/DESIGN-SYSTEM.md`](DESIGN-SYSTEM.md) — el sistema visual real
   (color, tipografía, layout, componentes), con sus inconsistencias ya
   señaladas.
3. [`docs/MOTION-SYSTEM.md`](MOTION-SYSTEM.md) — el sistema de animación
   real y sus principios de dirección de movimiento.
4. Este documento (`docs/DEVELOPMENT-RULES.md`) — cómo trabajar sin
   romper nada ya resuelto.

No asumir que una función, archivo o convención existe porque se
menciona en un documento: estos documentos reflejan el estado del
repositorio en el momento en que se escribieron. Antes de apoyarse en
algo concreto (un selector, una variable CSS, una línea de código),
comprobarlo en el archivo real.
