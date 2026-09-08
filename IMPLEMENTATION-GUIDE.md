# Implementation Guide: Mejoras de Fisioterapia Page

**Documento de Referencia para Claude Code**
Última actualización: 2026-09-08

---

## CONTEXTO

Audit completado de `src/pages/servicios/physiotherapy.html`. Las mejoras básicas (vertical rhythm) ya están aplicadas (commit 88ea563). Este documento especifica mejoras adicionales prioritarias.

---

## FASE 1: ACCESIBILIDAD (ALTA PRIORIDAD)

### 1.1 Contraste de Color - Eyebrows

**Problema**: `--pw-accent: #269888` no pasa WCAG AA en texto pequeño sobre fondo claro

**Archivos a Modificar**: `src/css/styles.css`

**Cambios**:

```css
/* Línea ~800 (buscar .eyebrow, .section-eyebrow) */

/* ANTES */
.eyebrow {
  color: var(--pw-accent);
  text-transform: uppercase;
  /* ... */
}

/* DESPUÉS */
.eyebrow {
  color: var(--pw-primary); /* #237369 - pasa AA */
  text-transform: uppercase;
  /* ... */
}

/* Excepción: eyebrows sobre fondo oscuro pueden usar accent */
.eyebrow--on-dark {
  color: var(--pw-accent);
}

/* NUEVO: Token para accent accesible */
:root {
  --pw-accent-accessible: #8fd9c9; /* Para textos pequeños */
}
```

**Ubicaciones donde aplicar en styles.css**:
- `.eyebrow` (general)
- `.section-eyebrow` (en secciones)
- `.service-feature__eyebrow`
- Verificar en: problem-ticker, specialty-list, google-reviews sections

**Testing**:
```bash
# Después de cambiar, verificar contraste en preview
# Expected: WCAG AA (4.5:1 para texto pequeño)
```

---

### 1.2 Focus States Visibles

**Problema**: Botones y enlaces sin outline visible en focus (keyboard navigation)

**Archivos**: `src/css/styles.css`

**Cambios** (agregar al final de styles.css antes de media queries):

```css
/* ========== FOCUS STATES (Accesibilidad) ========== */

/* Botones primarios */
.btn:focus-visible {
  outline: 2px solid var(--pw-accent);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Enlaces (.service-feature__link, .area-relation__cta) */
a:not(.booking-panel__help):focus-visible,
.service-feature__link:focus-visible,
.area-relation__cta:focus-visible {
  outline: 2px solid var(--pw-accent);
  outline-offset: 2px;
}

/* Nav items */
.nav-item__btn:focus-visible,
.mobile-nav__link:focus-visible {
  outline: 2px dashed var(--pw-accent);
  outline-offset: 4px;
}

/* Aumentar touch target en móvil */
@media (max-width: 768px) {
  .btn {
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  a[class*="link"] {
    min-height: 44px;
  }
}
```

**Testing**: Tab through page, todos los botones/links deben mostrar outline claro

---

## FASE 2: MARQUEE ENHANCEMENTS (MEDIA PRIORIDAD)

### 2.1 Pause on Hover

**Archivos**: `src/css/styles.css`

**Cambios** (buscar secciones de `.problem-ticker` y `.google-reviews`):

```css
/* ========== PROBLEM TICKER IMPROVEMENTS ========== */

.problem-ticker__viewport {
  position: relative;
}

/* Pausar animación al hover */
.problem-ticker__rail {
  animation-play-state: running;
  transition: animation-play-state 0.2s;
}

.problem-ticker__viewport:hover .problem-ticker__rail {
  animation-play-state: paused;
}

/* Gradient fade (visual cue) */
.problem-ticker__viewport::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 60px;
  background: linear-gradient(to right, var(--pw-primary), transparent);
  pointer-events: none;
  z-index: 10;
}

.problem-ticker__viewport::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 60px;
  background: linear-gradient(to left, var(--pw-primary), transparent);
  pointer-events: none;
  z-index: 10;
}

/* ========== GOOGLE REVIEWS IMPROVEMENTS ========== */

.google-reviews__viewport {
  position: relative;
}

.google-reviews__rail {
  animation-play-state: running;
  transition: animation-play-state 0.2s;
}

.google-reviews__viewport:hover .google-reviews__rail {
  animation-play-state: paused;
}

/* Mismo gradient fade */
.google-reviews__viewport::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 60px;
  background: linear-gradient(to right, var(--pw-mist), transparent);
  pointer-events: none;
  z-index: 10;
}

.google-reviews__viewport::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 60px;
  background: linear-gradient(to left, var(--pw-mist), transparent);
  pointer-events: none;
  z-index: 10;
}
```

**Testing**:
- Hover sobre marquees → animación pausa
- Gradient fade visible en extremos
- Sin scroll issues

---

### 2.2 Mobile "Scroll Hint" (Opcional)

**Archivos**: `src/css/styles.css` + `src/pages/servicios/physiotherapy.html`

**HTML Change** (en problem-ticker):

```html
<!-- Agregar después de .problem-ticker__viewport -->
<div class="problem-ticker__hint" aria-hidden="true">
  Desliza para ver más
</div>
```

**CSS Change**:

```css
.problem-ticker__hint {
  display: none;
  text-align: center;
  margin-top: var(--sp-4);
  font-size: 0.875rem;
  color: var(--pw-accent);
  opacity: 0.7;
}

@media (max-width: 640px) {
  .problem-ticker__hint {
    display: block;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
```

---

## FASE 3: SEO & STRUCTURED DATA (MEDIA PRIORIDAD)

### 3.1 Schema.org LocalBusiness

**Archivos**: `src/pages/servicios/physiotherapy.html`

**Cambios** (agregar antes de `</head>`):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Physio Wellness by Marshall - Fisioterapia",
  "url": "https://physiowellness.es/es/servicios/fisioterapia/",
  "description": "Fisioterapia en Sitges: valoración, tratamiento y recuperación funcional con Physio Wellness by Marshall.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Avinguda Camí dels Capellans, 79, local 3",
    "addressLocality": "Sitges",
    "postalCode": "08870",
    "addressCountry": "ES"
  },
  "telephone": "+34644678344",
  "email": "hola@physiowellness.es",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "5",
    "reviewCount": "6"
  },
  "areaServed": {
    "@type": "City",
    "name": "Sitges"
  },
  "medicalSpecialty": "Fisioterapia"
}
</script>
```

### 3.2 Open Graph Meta Tags

**Archivos**: `src/pages/servicios/physiotherapy.html`

**Cambios** (agregar en `<head>` después de existentes):

```html
<meta property="og:type" content="website">
<meta property="og:url" content="https://physiowellness.es/es/servicios/fisioterapia/">
<meta property="og:title" content="Fisioterapia en Sitges | Physio Wellness">
<meta property="og:description" content="Valoración, tratamiento y recuperación funcional. Seis ámbitos de fisioterapia en clínica o a domicilio.">
<meta property="og:image" content="https://physiowellness.es/assets/img/stock/hero-fisio-1440.webp">
<meta property="og:image:width" content="1440">
<meta property="og:image:height" content="960">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Fisioterapia en Sitges | Physio Wellness">
<meta name="twitter:description" content="Valoración, tratamiento y recuperación funcional">
<meta name="twitter:image" content="https://physiowellness.es/assets/img/stock/hero-fisio-1440.webp">
```

---

## FASE 4: INTERACTIVE ENHANCEMENTS (BAJA PRIORIDAD)

### 4.1 Process Timeline Expandible (Mobile)

**Archivos**: 
- `src/pages/servicios/physiotherapy.html`
- `src/css/styles.css`
- `src/js/main.js`

**HTML Change** (en .service-process__steps, cada <li>):

```html
<!-- ANTES -->
<li class="service-process__step" data-sp-step>
  <span class="service-process__marker"><span class="service-process__dot"></span></span>
  <div class="service-process__body">
    <span class="service-process__number" aria-hidden="true">01</span>
    <p class="service-process__text">Escuchamos qué te preocupa y tu situación actual.</p>
  </div>
</li>

<!-- DESPUÉS -->
<li class="service-process__step" data-sp-step>
  <button class="service-process__toggle" type="button" aria-expanded="false">
    <span class="service-process__marker"><span class="service-process__dot"></span></span>
    <div class="service-process__body">
      <span class="service-process__number" aria-hidden="true">01</span>
      <p class="service-process__text">Escuchamos qué te preocupa y tu situación actual.</p>
    </div>
  </button>
  <div class="service-process__detail" hidden>
    <p>Nos interesa conocer tu situación completa: qué dolor o limitación funcional tienes, cómo te afecta en el día a día, y qué esperas conseguir con el tratamiento.</p>
  </div>
</li>
```

**CSS Change**:

```css
/* Mobile: timeline clickable */
@media (max-width: 860px) {
  .service-process__toggle {
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    width: 100%;
    padding: 0;
  }

  .service-process__step.is-open .service-process__detail {
    display: block;
    margin-top: var(--sp-4);
    padding-top: var(--sp-4);
    border-top: 1px solid var(--pw-line);
    animation: slideDown 0.3s ease-out;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**JavaScript Change** (en `src/js/main.js`, buscar serviceProcessTimeline o agregar nuevo):

```javascript
// Process Timeline Toggle (Mobile)
function initProcessToggle() {
  const buttons = document.querySelectorAll('.service-process__toggle');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', function() {
      const isOpen = this.getAttribute('aria-expanded') === 'true';
      const detail = this.parentElement.querySelector('.service-process__detail');
      const step = this.closest('.service-process__step');
      
      this.setAttribute('aria-expanded', !isOpen);
      detail.hidden = isOpen;
      step.classList.toggle('is-open');
    });
  });
}

// Call on page load
document.addEventListener('DOMContentLoaded', initProcessToggle);
```

---

## FASE 5: RESPONSIVE TABLET (BAJA PRIORIDAD)

### 5.1 Specialty List - 2 Columnas en Tablet

**Archivos**: `src/css/styles.css`

**Cambios** (buscar .specialty-list__items):

```css
/* ANTES: probablemente grid sin responsive */
.specialty-list__items {
  display: grid;
  gap: var(--sp-6);
  /* ... */
}

/* DESPUÉS: responsive por breakpoint */
.specialty-list__items {
  display: grid;
  gap: var(--sp-6);
  grid-template-columns: 1fr; /* Mobile: 1 columna */
}

@media (min-width: 768px) {
  .specialty-list__items {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columnas */
  }
}

@media (min-width: 1024px) {
  .specialty-list__items {
    grid-template-columns: repeat(3, 1fr); /* Desktop: 3 columnas */
  }
}
```

---

## IMPLEMENTACIÓN: CHECKLIST

### ✅ Antes de Empezar

- [ ] Repositorio sincronizado (git pull)
- [ ] Branch actual: main o crear feature branch
- [ ] Preview server corriendo: `preview_start physiowellness-web`
- [ ] Commit 88ea563 verificado (CSS improvements ya aplicadas)

### 🔴 FASE 1 (REQUIRED)

- [ ] **1.1 Contraste eyebrows**: Cambiar --pw-accent a --pw-primary
  - Archivos: `src/css/styles.css`
  - Líneas aprox: 800 (buscar `.eyebrow`)
  - Testing: Verificar WCAG AA contrast en preview

- [ ] **1.2 Focus states**: Agregar outlines a botones/links
  - Archivos: `src/css/styles.css` (final)
  - Testing: Tab through page, verificar outlines

### 🟠 FASE 2 (RECOMMENDED)

- [ ] **2.1 Marquee pause**: Agregar pause-on-hover y gradients
  - Archivos: `src/css/styles.css`
  - Testing: Hover sobre marquees

- [ ] **2.2 Scroll hint (opcional)**: Agregar hint móvil
  - Archivos: `src/css/styles.css` + `physiotherapy.html`

### 🟠 FASE 3 (SEO)

- [ ] **3.1 Schema.org**: Agregar structured data
  - Archivos: `src/pages/servicios/physiotherapy.html` (<head>)
  - Testing: Validar en schema.org/validate

- [ ] **3.2 Open Graph**: Agregar meta tags sociales
  - Archivos: `src/pages/servicios/physiotherapy.html` (<head>)

### 🟡 FASE 4 (NICE-TO-HAVE)

- [ ] **4.1 Process timeline expandible**: Agregar toggle móvil
  - Archivos: `physiotherapy.html` + `styles.css` + `main.js`
  - Testing: Click en mobile, expand/collapse

### 🟡 FASE 5 (RESPONSIVE)

- [ ] **5.1 Tablet specialties**: 2-col layout
  - Archivos: `src/css/styles.css`
  - Testing: Resize a 768px, verificar 2 columnas

### 📝 FINALIZACIÓN

- [ ] Preview: Verificar todas las mejoras
- [ ] No hay regressions en desktop/tablet/mobile
- [ ] Git: Commit con mensaje claro
- [ ] Testing: Accesibilidad (Wave, Lighthouse)

---

## NOTA DE IMPLEMENTACIÓN

**Orden recomendado**:
1. FASE 1 (Accesibilidad - CRÍTICA)
2. FASE 2 (UX refinement)
3. FASE 3 (SEO)
4. FASE 4-5 (Nice-to-have, opcional)

**Branches sugeridos**:
```
git checkout -b feature/accessibility-improvements
git checkout -b feature/ux-marquee-enhancements
git checkout -b feature/seo-structured-data
```

**Testing final**:
```bash
# Lighthouse
preview_eval "window.open('about:blank')"

# Wave Accessibility
# Lighthouse Accessibility score debe ser ≥90

# WCAG AA Contrast
# Usar: https://webaim.org/resources/contrastchecker/
```

---

**Documento Referencia**: Este archivo está en `/IMPLEMENTATION-GUIDE.md`
Para preguntas específicas durante implementación: Referencia la sección correspondiente
