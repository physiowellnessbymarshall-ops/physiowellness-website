# CLAUDE.md

Punto de entrada para Claude Code (y cualquier agente compatible) al
trabajar en el repositorio de **Physio Wellness by Marshall**.

Este archivo no duplica documentación existente: indica dónde está y
cuándo consultarla.

## Antes de tareas con impacto relevante

Si una tarea afecta a arquitectura, diseño, UI, UX o animaciones,
consulta primero, en este orden:

1. [`docs/PROJECT-CONTEXT.md`](docs/PROJECT-CONTEXT.md) — qué es
   Physio Wellness, qué áreas y páginas existen realmente, qué es
   placeholder.
2. [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) — sistema visual
   real (color, tipografía, layout, componentes) y sus
   inconsistencias ya señaladas.
3. [`docs/MOTION-SYSTEM.md`](docs/MOTION-SYSTEM.md) — sistema de
   animación real y sus principios de dirección de movimiento.
4. [`docs/DEVELOPMENT-RULES.md`](docs/DEVELOPMENT-RULES.md) — reglas
   de trabajo compartidas (Git, código, UI/UX, testing, trabajo con
   agentes) y trampas ya verificadas en este repositorio concreto.

No asumas que una función, archivo o convención existe porque se
menciona en un documento: comprueba siempre contra el archivo real
antes de apoyarte en algo concreto.

## Resumen del proyecto

Sitio de Physio Wellness (fisioterapia, bienestar, fuerza, Pilates
Reformer y stretching en Sitges): HTML/CSS/JS plano, sin framework ni
build. Detalle completo en `docs/PROJECT-CONTEXT.md`.

## Reglas fundamentales (resumen — ver `docs/DEVELOPMENT-RULES.md`)

- No modificar partes del código no relacionadas con la tarea en
  curso.
- No rehacer implementaciones funcionales sin necesidad.
- Mantener responsive, accesibilidad, SEO y funcionalidad existentes.
- Sin `package.json`/`node_modules`/lint/build: la verificación se
  hace inspeccionando el resultado renderizado (preview del
  navegador), no con comandos de CLI.
- No hacer merge ni push automáticos; no descartar cambios locales del
  usuario sin confirmación explícita.

## Trabajo con Google Antigravity IDE

Este repositorio se trabaja en paralelo desde un worktree
independiente para Google Antigravity IDE (rama `antigravity/dev`).
Las reglas específicas para ese entorno están en
[`.agents/rules/physio-wellness.md`](.agents/rules/physio-wellness.md).
