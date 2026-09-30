# Physio Wellness by Marshall — Web

Sitio web de **Physio Wellness by Marshall**: fisioterapia clínica, fuerza, Pilates Reformer, bienestar y stretching en Sitges (Barcelona).

---

## Estructura del proyecto

```
/
├── index.html                  Pasarela de idioma (root gateway, HTTP 200, x-default)
├── es/                         Versión española (18 URLs indexables)
│   ├── index.html              Página de inicio ES
│   ├── fisioterapia/           Servicio: Fisioterapia
│   ├── fuerza/                 Servicio: Fuerza
│   ├── pilates/                Servicio: Pilates Reformer
│   ├── bienestar/              Servicio: Bienestar
│   ├── stretching/             Servicio: Stretching
│   ├── fisioterapia-a-domicilio/
│   ├── snow-performance/
│   ├── servicios/              Resumen de servicios
│   ├── metodo/                 El Método Marshall
│   ├── conocenos/              Equipo · El Centro · Primera Visita
│   ├── tarifas/
│   ├── contacto/
│   ├── aviso-legal/
│   ├── privacidad/
│   └── cookies/
├── ca/                         Versió catalana (18 URLs indexables)
│   └── (estructura paralela a es/)
├── en/                         English version (18 indexable URLs)
│   └── (structure mirrors es/)
├── src/
│   ├── css/styles.css          Sistema de diseño completo (único archivo CSS)
│   ├── js/main.js              JavaScript vanilla (único archivo JS)
│   ├── assets/img/             Imágenes optimizadas (WebP, AVIF)
│   ├── components/             Plantillas de referencia de header/footer (no son SSI)
│   └── content/                Datos editables de referencia
├── scratch/                    Utilidades de desarrollo (ignoradas en .gitignore)
│   └── fix_catalan_hyphens.py  Herramienta de mantenimiento tipográfico catalan
├── docs/                       Documentación de diseño y arquitectura
├── sitemap.xml                 Sitemap XML multilingual (55 URLs canónicas)
├── robots.txt
└── .nojekyll                   Deshabilita Jekyll en GitHub Pages
```

---

## Arquitectura multilingüe

| Idioma | Prefijo | Ejemplo |
|--------|---------|---------|
| Español | `/es/` | `/es/fisioterapia/` |
| Català | `/ca/` | `/ca/fisioterapia/` |
| English | `/en/` | `/en/physiotherapy/` |

- La raíz `/` es una **pasarela estática de idioma** (HTTP 200, sin redirección automática)
- `x-default` apunta a `/` en todos los idiomas
- Implementación hreflang recíproca completa (es / ca / en / x-default)
- 55 URLs canónicas/indexables en total (1 pasarela + 18 × 3 idiomas)

---

## Tecnología

- **HTML5 + CSS3 + JavaScript vanilla** (sin frameworks)
- **Sin dependencias de npm** en producción
- Imágenes WebP/AVIF optimizadas
- Fuente: Jost (Google Fonts, carga diferida)
- Datos estructurados JSON-LD: MedicalBusiness, WebSite, WebPage, Person, Place

---

## Entorno de desarrollo

```bash
# Servidor local (sin instalación)
python3 -m http.server 8000
# → Abrir http://localhost:8000/
```

> El sitio no requiere compilación. Los cambios se sirven directamente.

---

## Estado de despliegue

| Entorno | Estado | URL |
|---------|--------|-----|
| **Desarrollo** | GitHub Pages (preview) | `https://physiowellnessbymarshall-ops.github.io/physiowellness-website/` |
| **Producción** | Hostinger (pendiente) | `https://physiowellness.es/` |

### Pendiente para producción (Hostinger)

1. **Formulario de contacto**: preparar `contact.php` con PHPMailer + SMTP de Hostinger → `hola@physiowellness.es`
2. **Cabeceras de seguridad HTTP**: CSP, X-Content-Type-Options, Referrer-Policy, HSTS (configurar en Hostinger)
3. **Certificado SSL**: activar en panel de Hostinger
4. **Consent de cookies**: implementar CMP completo (soporte ES/CA/EN) cuando se añadan scripts de terceros no esenciales
5. **Google Search Console**: verificar dominio y enviar sitemap.xml
6. **Google Business Profile**: configurar `physiowellness.es` como URL principal

---

## Utilidades de mantenimiento

- `scratch/fix_catalan_hyphens.py`: herramienta para auditar y corregir construcciones tipográficas con guión en catalán (p.ej. `cuidar-te`, `ajudar-te`) después de cambios editoriales.
- Todos los scripts en `scratch/` son utilidades de desarrollo local y están excluidos del despliegue mediante `.gitignore`.

---

## Rama activa

Trabajar sobre `antigravity/services-marshall-pacing` o crear una rama feature desde ella.
No modificar directamente `main` — esta rama refleja el último estado de GitHub Pages.

---

*Última actualización: septiembre 2026*
