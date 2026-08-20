# Tarifas y condiciones — fuente única

Este archivo es la **fuente de verdad** de los precios, las duraciones y las
condiciones de desplazamiento de Physio Wellness by Marshall.

Si un importe cambia, se cambia **primero aquí** y después se replica en
`src/pages/tarifas.html`. Es el mismo criterio que ya sigue el proyecto con
`src/components/header.html` y `footer.html`: el archivo de referencia manda y
las páginas lo reflejan (proceso manual, sin herramientas ni build).

Vigencia: precios confirmados para 2026.

---

## Sesiones presenciales

Sección `01 — En la clínica` de la página.

| Sesión           | Duración   | Precio |
| ---------------- | ---------- | ------ |
| Primera sesión   | 60 minutos | 100 €  |
| Seguimiento      | 30 minutos | 50 €   |
| Seguimiento      | 50 minutos | 80 €   |

La primera sesión de 60 minutos es la puerta de entrada: incluye conocer el
caso, la valoración inicial y la definición de cómo continuar.

Los dos seguimientos son **dos duraciones de una misma modalidad**, no dos
servicios distintos.

## Sesiones a domicilio

Sección `02 — A domicilio` de la página.

| Sesión                      | Duración   | Precio |
| --------------------------- | ---------- | ------ |
| Primera sesión a domicilio  | 60 minutos | 100 €  |
| Seguimiento a domicilio     | 50 minutos | 95 €   |

El domicilio es una **modalidad independiente**. No es una quinta área junto a
Physiotherapy, Wellness, Strength y Pilates.

## Condiciones del desplazamiento

Son las **únicas** condiciones publicadas. No hay zonas adicionales,
descuentos, bonos, impuestos, política de cancelación ni promociones.

- El desplazamiento en Sitges y hasta 10 km está incluido.
- A partir de esa distancia se añade un suplemento de 10 € por cada tramo
  adicional de 10 km de ida, calculado según Google Maps.

Literales que aparecen destacados en la página, y que deben mantenerse
palabra por palabra:

- `Sitges + 10 km incluidos`
- `+10 € por cada 10 km adicionales de ida`

---

## URL de conversión

Ambas están **operativas** y son las que ya usa todo el proyecto desde antes de
esta página. No hay ninguna URL pendiente ni inventada.

| Canal        | URL                                                          | Uso                  |
| ------------ | ------------------------------------------------------------ | -------------------- |
| DocFav       | `https://www.docfav.com/portal/physio-wellness-by-marshall`   | Todos los CTA de reserva |
| WhatsApp     | `https://wa.me/34644678344`                                   | Ayuda secundaria     |

La reserva se completa siempre en DocFav. No existe ni debe crearse una
página intermedia ni un formulario de reserva propio.

WhatsApp es siempre el canal secundario: nunca sustituye al CTA de reserva.

---

## Dónde se refleja cada dato en `src/pages/tarifas.html`

Localiza los bloques por su clase CSS, no por número de línea.

| Dato                          | Bloque                                    |
| ----------------------------- | ----------------------------------------- |
| Primera sesión presencial     | `.entry` (`.entry__num`, `.entry__price`) |
| Seguimientos presenciales     | `.follow__list` → `.step`                 |
| Tarifas a domicilio           | `.split` → `.split__panel`                |
| Condiciones de desplazamiento | `.travel__text`, `.travel__highlights`    |
| Duraciones del hero           | `.hero-nums` (decorativo, `aria-hidden`)  |

Al editar, ten en cuenta:

- Las cifras de `.hero-nums` son **decorativas** y están ocultas a los lectores
  de pantalla. Si cambia una duración real, actualiza también esta cifra por
  coherencia visual, pero nunca la uses como dato.
- No añadas ni quites elementos `.step` o `.split__panel` sin revisar el
  responsive: la escalera de `.step` y el desfase de `.split__panel--offset`
  están calculados para dos elementos.
- Los precios no viven en JavaScript y no deben moverse allí: `src/js/main.js`
  solo gestiona menú, animaciones y scroll.
