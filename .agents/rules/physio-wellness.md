# Physio Wellness — Reglas rápidas para agentes

Versión concisa de las reglas del proyecto. Antes de cualquier tarea
relevante, consulta primero:

- [`docs/PROJECT-CONTEXT.md`](../../docs/PROJECT-CONTEXT.md)
- [`docs/DESIGN-SYSTEM.md`](../../docs/DESIGN-SYSTEM.md)
- [`docs/MOTION-SYSTEM.md`](../../docs/MOTION-SYSTEM.md)
- [`docs/DEVELOPMENT-RULES.md`](../../docs/DEVELOPMENT-RULES.md)

Este archivo es un resumen operativo, no sustituye a esos documentos.

## Scope

- Trabaja únicamente sobre lo solicitado.
- No modifiques secciones no relacionadas.
- No reestructures el proyecto sin necesidad.

## Diseño

- Preserva la identidad visual de Physio Wellness.
- No conviertas la web en una plantilla médica genérica.
- Respeta el Design System.
- Respeta el Motion System.

## Git

- Estás trabajando desde un worktree independiente.
- Utiliza ramas `antigravity/*` cuando corresponda.
- Nunca hagas merge automático a `main`.
- Nunca hagas push a `main` automáticamente.
- Nunca descartes cambios del usuario.

## UI verification

Cuando una tarea afecte a la interfaz:

- ejecuta la web;
- utiliza el navegador cuando sea útil;
- revisa visualmente el resultado;
- comprueba desktop;
- comprueba mobile;
- comprueba scroll;
- comprueba animaciones;
- comprueba consola.

No debes asumir que una implementación es correcta simplemente porque
compila.

## Código

- Reutiliza sistemas existentes.
- Evita duplicaciones.
- Mantén accesibilidad.
- Mantén responsive.
- Mantén rendimiento.
