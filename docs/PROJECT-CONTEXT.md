# Physio Wellness

Sitio web de **Physio Wellness by Marshall**: un centro en Sitges de
fisioterapia, bienestar, entrenamiento de fuerza, Pilates Reformer y
stretching. El objetivo del proyecto es un sitio a medida (HTML/CSS/JS
plano, sin framework ni build) que explique con claridad qué servicios
ofrece el centro, oriente a cada visitante hacia el área que necesita y
facilite la reserva de cita, con una dirección visual editorial —no de
clínica genérica— y un sistema de precios documentado como fuente única de
verdad (`src/content/tarifas.md`).

Este documento es la referencia de contexto para cualquier agente (Claude
Code, Google Antigravity IDE o futuros colaboradores) que empiece a
trabajar en el repositorio. Describe únicamente lo que existe hoy,
verificado directamente en el código — no el plan a futuro.

## Áreas principales

Physio Wellness trabaja, o está pensado para trabajar, con cinco áreas:
Fisioterapia, Bienestar, Fuerza, Pilates Reformer y Stretching. Estado real
por área, comprobado en el repositorio:

| Área | Presente en Home (`#areas`) | Página propia en `src/pages/servicios/` | Tarifa propia |
| --- | --- | --- | --- |
| Fisioterapia | Sí (`#physiotherapy`) | Sí — `physiotherapy.html` | Sí, tarifa transversal en clínica |
| Bienestar | Sí (`#wellness`) | No — el enlace del nav a `wellness.html` es un placeholder (el archivo no existe) | Sí, misma tarifa transversal |
| Fuerza | Sí (`#strength`) | No — el enlace del nav a `strength.html` es un placeholder | Sí, misma tarifa transversal |
| Pilates Reformer | Sí (`#pilates`) | No — el enlace del nav a `pilates.html` es un placeholder | Sí, misma tarifa transversal |
| Stretching | Sí (`#stretching`) | Sí — `stretching.html` (añadida como quinto servicio principal en el trabajo más reciente) | Sí, misma tarifa transversal |

Las cuatro áreas originales (Fisioterapia, Bienestar, Fuerza, Pilates)
comparten una **tarifa única en clínica** (no hay precio distinto por
área); Stretching se ha sumado a esa misma estructura. La sesión "a
domicilio" es una modalidad aparte (fisioterapia a domicilio), con su
propia tarifa y su propio enlace de nav (`fisioterapia-a-domicilio.html`),
que tampoco existe todavía como página propia.

**Nota sobre Stretching**: usa temporalmente la misma fotografía que Fuerza
como placeholder (`area-strength-720/1440.webp`), documentado en
`ASSET_SOURCES.md`, a la espera de una foto real del cliente.

## Idiomas

La versión base actual es **exclusivamente castellano**: `index.html`
declara `<html lang="es">` y todo el contenido del repositorio está en
castellano.

A nivel técnico, la arquitectura ya **prepara** el soporte multi-idioma
pero no lo implementa todavía:

- `index.html` incluye `<link rel="alternate" hreflang="es|ca|en" ...>`
  apuntando a `https://physiowellness.es/es|ca|en/`.
- El selector de idioma del header (`.lang-switch`, presente en escritorio
  y en el menú móvil) enlaza a `ca/index.html` y `en/index.html`.
- **Ninguna de esas rutas existe en el repositorio.** No hay carpetas `ca/`
  ni `en/`, ni contenido traducido en ningún punto. El selector es, hoy,
  un placeholder visual y funcional a medias (los enlaces no resuelven).

## Dirección creativa

La web busca deliberadamente **no parecer una web médica genérica**. Debe
transmitir calidad, confianza, calma, movimiento, cuidado, sofisticación y
diseño contemporáneo. Esto se refleja en decisiones ya presentes en el
código, no solo en intención:

- Paleta reducida y cálida (`--pw-primary` #237369, `--pw-accent` #269888,
  `--pw-mist` como neutro de apoyo) en vez de blancos/azules clínicos.
- Tipografía editorial única (Jost) con escalas fluidas (`clamp()`).
- Un sistema de scroll/motion propio (sección `#metodo` / clase `.umbral`,
  ver más abajo) para transmitir movimiento y ritmo, no solo contenido
  estático.
- Fotografía tratada de forma consistente (gradación, grano sutil,
  `object-position` cuidado por composición) en vez de banco de imágenes
  sin editar — con trazabilidad completa de cada imagen en
  `ASSET_SOURCES.md`.

**Revo Studios** ha sido una referencia de ritmo, interacción y dirección
visual para este proyecto, pero Physio Wellness debe conservar una
identidad propia — no se trata de replicar esa referencia, sino de
inspirarse en su nivel de cuidado y ejecución.

## Arquitectura actual

**Páginas existentes** (verificado en disco):

- `index.html` — Home.
- `src/pages/servicios.html` — listado/orientación de servicios.
- `src/pages/servicios/physiotherapy.html` — página propia de Fisioterapia.
- `src/pages/servicios/stretching.html` — página propia de Stretching.
- `src/pages/tarifas.html` — tarifas y condiciones.

**Páginas enlazadas desde el nav pero que aún no existen** (placeholders,
no rotos por error sino pendientes de construir): `wellness.html`,
`strength.html`, `pilates.html`, `fisioterapia-a-domicilio.html`,
`src/pages/metodo.html`, `src/pages/contacto.html`,
`src/pages/conocenos/equipo.html`, `src/pages/conocenos/el-centro.html`,
`src/pages/conocenos/primera-visita.html`, `ca/index.html`, `en/index.html`.

**Secciones principales de la Home** (`index.html`, en orden):

1. `#hero`
2. `#presentacion` (`.trust`) — datos del centro.
3. `#orientacion` (`.orient`)
4. `#areas` (`.services`) — cinco `service-panel` (Fisioterapia, Bienestar,
   Fuerza, Pilates, Stretching).
5. `#metodo` (`.umbral`) — bloque de scroll/motion, ver más abajo.
6. `#primera-visita` (`.first-visit`)
7. `#equipo` (`.team`)
8. `#instalaciones` (`.facility`)
9. `#resenas` (`.testimonials`) — reseñas reales de pacientes (contenido
   textual real, no lorem ipsum).
10. `#contacto` (`.contact`)
11. `.cta-final`

**Navegación** (`src/components/header.html`, escritorio y móvil): dropdown
"Servicios" (los cinco enlaces de área + fisioterapia a domicilio),
"El método", dropdown "Conócenos" (equipo, el centro, primera visita),
"Tarifas", "Contacto", selector de idioma y botón de reserva (enlaza a
`docfav.com`, sistema externo de reservas). La mayoría de destinos de este
nav todavía no tienen página propia (ver lista de placeholders arriba).

**Estructura de archivos**:

```
physiowellness-web/
├── index.html                          Home
├── README.md
├── ASSET_SOURCES.md                    Procedencia de cada imagen
├── src/
│   ├── pages/                          Páginas internas
│   │   ├── servicios.html
│   │   ├── servicios/                  Páginas propias por área (parcial)
│   │   └── tarifas.html
│   ├── components/                     header.html / footer.html (copiar y pegar manual)
│   ├── content/tarifas.md              Fuente única de precios
│   ├── css/styles.css                  Único CSS real del proyecto (~3000 líneas)
│   ├── js/main.js                      Único JS real del proyecto (~1600 líneas)
│   └── assets/                         css/ y js/ obsoletos (versiones antiguas, duplicadas, sin usar) + img/
```

**Relación entre páginas**: Home enlaza a las páginas de área (aunque no
todas existan aún), a `servicios.html` y a `tarifas.html`. `servicios.html`
actúa como hub de orientación entre las áreas. Las páginas propias de área
(`physiotherapy.html`, `stretching.html`) se referencian entre sí en un
bloque de "relación entre áreas" (`.area-relation`) y enlazan de vuelta a
tarifas. `tarifas.html` es el destino final de conversión para las cinco
áreas.

**Componentes/patrones reutilizados**:

- `header.html` y `footer.html` se copian y pegan manualmente en cada
  página nueva (sin SSI ni generador estático); documentado en
  `src/components/README.md`.
- Patrón de tarjeta/panel de servicio (`.service-panel`, `.area-tile`,
  `.area-carousel__*`) repetido entre Home, `servicios.html` y
  `tarifas.html` para representar las mismas cinco áreas.
- Sistema de tokens CSS en `:root` de `styles.css` (color, tipografía,
  espaciado, easing/duración, contenedor, radio) reutilizado en todo el
  sitio.
- Sistema de motion "Umbral" (`#metodo`): variables CSS (`--u-core-x`,
  `--u-core-y`, `--u-core-scale`, `--u-core-warm`, `--u-blur-max`,
  `--u-veil-travel`, `--u-frame-max`, `--u-core-size`) actualizadas desde
  `main.js` en scroll para animar un "núcleo de luz" con grano y halo,
  documentado con comentarios extensos in situ en `styles.css`.

## Estado actual

**Consolidado** (con historial de fases documentado en commits y en
`ASSET_SOURCES.md`): Home completa, `tarifas.html`, la página propia de
Fisioterapia con reseñas de Google, header con ocultación en scroll,
sistema de tokens de diseño, trazabilidad de imágenes.

**En evolución activa**: Stretching se acaba de incorporar como quinto
servicio principal (Home, `servicios.html`, `tarifas.html`,
`physiotherapy.html` y página propia nueva) y todavía usa fotografía
placeholder pendiente de sustitución.

**Pendiente / no iniciado**, deducible directamente de enlaces sin
destino: páginas propias de Bienestar, Fuerza y Pilates Reformer; página
de fisioterapia a domicilio; "El método", "Contacto" y el bloque
"Conócenos" (equipo, el centro, primera visita) como páginas dedicadas;
cualquier contenido en catalán o inglés.

## Principios

- Preservar coherencia con el sistema de diseño y de motion ya existente.
- No rediseñar partes existentes sin motivo.
- Mantener responsive (mobile-first, breakpoints ya establecidos en
  `styles.css`).
- Mantener accesibilidad (el proyecto ya usa `aria-label`, `aria-current`,
  skip-links y estructura semántica; no se debe regredir esto).
- Evitar soluciones genéricas: cualquier adición debe encajar con la
  dirección creativa editorial del sitio, no con un patrón de plantilla
  estándar.
- Priorizar experiencia de usuario y calidad visual sobre velocidad de
  entrega.
