# Componentes reutilizables

Este directorio contiene fragmentos HTML que se reutilizan en múltiples páginas del sitio. Son archivos pequeños que puedes copiar y pegar en cualquier página.

## Componentes disponibles

### `header.html`
**Uso:** Encabezado del sitio con navegación y menú móvil.

**Qué contiene:**
- Skip-link de accesibilidad
- Header principal con logo y navegación
- Selector de idioma (ES/CA/EN)
- Botón de reserva
- Menú móvil con overlays

**Cómo usarlo:**
1. Abre `header.html`
2. Copia TODO el contenido
3. En cualquier página, pégalo **después de `<body>` y antes de `<main>`**
4. El header se estiliza automáticamente desde `src/css/styles.css`
5. La interactividad del menú viene desde `src/js/main.js`

**Ejemplo:**
```html
<body>

  [PEGA AQUÍ EL CONTENIDO DE header.html]

  <main id="main">
    <!-- Contenido de tu página -->
  </main>

  [PEGA AQUÍ EL CONTENIDO DE footer.html]

</body>
```

### `footer.html`
**Uso:** Pie de página del sitio con enlaces y contacto.

**Qué contiene:**
- Logo del sitio
- Descripción breve
- Navegación por secciones
- Datos de contacto
- Enlaces legales (privacidad, cookies, etc.)

**Cómo usarlo:**
1. Abre `footer.html`
2. Copia TODO el contenido
3. En cualquier página, pégalo **después de `</main>` y antes de `</body>`
4. El footer se estiliza desde `src/css/styles.css`

### `announcement-banner.html`
**Uso:** Banner discreto de novedad en la parte superior del Hero de la Home, integrado bajo la barra de navegación.

**Qué contiene:**
- Estructura accesible (`<aside class="hero__announcement">`)
- Enlace completo clicable (`.announcement-banner`)
- Etiqueta / badge temporal (`.announcement-banner__badge` y `.announcement-banner__title`)
- Descripción comprimible en mobile para evitar desbordamientos o saltos de línea
- Indicador CTA con flecha animada al hover
- Control de visibilidad (`active`: true/false o `data-announcement-active`)
- Centralizado en `ANNOUNCEMENT_CONFIG` dentro de `src/js/main.js`

**Cómo usarlo:**
1. Pégalo dentro de `<section class="hero" id="hero">`, **después de `.hero__scrim` y antes de `.hero__content`**.
2. Cambia los textos o el enlace según la campaña o edítalo de forma centralizada en `ANNOUNCEMENT_CONFIG` (`src/js/main.js`).

---

## Por qué es importante esto

En lugar de copiar el header y footer en cada página (lo que causa problemas: si cambias el logo, tienes que actualizar 5 páginas), **guardas los componentes aquí una sola vez**.

Cuando crees nuevas páginas (Servicios, Tarifas, Contacto):
1. Crea el archivo de la página (ej: `src/pages/servicios.html`)
2. Copia el header en la parte superior
3. Agrega tu contenido en medio
4. Copia el footer al final
5. **Si luego actualizas el header**, copias el nuevo contenido aquí y pegas en todas las páginas (proceso manual, pero simple)

---

## Próximas mejoras

Más adelante podríamos automatizar esto con:
- **SSI (Server Side Includes):** Servidor web que importa componentes automáticamente
- **Un generador estático (11ty, Hugo):** Herramienta que unifica header/footer en todas las páginas
- **WordPress:** Los temas ya lo hacen automáticamente

Pero por ahora, este enfoque de copiar y pegar es simple, seguro y no requiere herramientas especiales.
