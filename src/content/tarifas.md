# Tarifas y condiciones — fuente única

Este archivo es la **fuente de verdad** de los precios, los bonos, los
suplementos y las condiciones de Physio Wellness by Marshall.

Fuente original: PDF **"PRECIOS 2026"**
(`/Physio Wellness by Marshall/Preus/2026 nous/Precios Physio Wellness.pdf`
en el Desktop del usuario). Cualquier PDF de precios en `Downloads/` o de
fases anteriores del proyecto está desactualizado; ignóralo.

Si un importe cambia, se cambia **primero aquí** y después se replica en
`src/pages/tarifas.html`. Es el mismo criterio que ya sigue el proyecto con
`src/components/header.html` y `footer.html`: el archivo de referencia manda y
las páginas lo reflejan (proceso manual, sin herramientas ni build).

Vigencia: precios confirmados para 2026.

---

## Tarifa en clínica — Physiotherapy · Wellness · Strength · Pilates

Sección `01 — En la clínica` (`#en-la-clinica`). Es una **tarifa única y
transversal**: no hay un precio distinto por área. Las cuatro tarjetas de
`#areas` enlazan a este mismo panel; los precios no se repiten en el HTML.

| Sesión                          | Precio / sesión | Bonos                                                    |
| -------------------------------- | ---------------- | --------------------------------------------------------- |
| Valoración y sesión inicial 60'  | 100 €            | No aplica (obligatoria, se factura aparte, sin bono)      |
| Sesión individual 50'            | 80 €             | 4 ses. 76 €/ses. (304 €) · 8 ses. 72 €/ses. (576 €) · 12 ses. 70 €/ses. (840 €) |
| Sesión individual 30'            | 50 €             | 4 ses. 47,50 €/ses. (190 €) · 8 ses. 45 €/ses. (360 €) · 12 ses. 43,75 €/ses. (525 €) |

**Valoración inicial:** obligatoria para todos los usuarios, con
independencia del área. No se realizan sesiones sin valoración previa. Se
factura como acto independiente y no se descuenta de los bonos. Un informe
médico o una derivación no la sustituye.

**Bonos:** combinables entre **Fisioterapia, Strength y Pilates**. Válidos
únicamente en clínica, con validez de 2 meses desde la compra. Se abonan
íntegros en el momento de la compra, son personales e intransferibles y no
admiten devolución una vez iniciados (se entiende iniciado al consumir la
primera sesión).

> ⚠️ **Pendiente de confirmar:** el PDF titula la tarifa "PHYSIO · WELLNESS ·
> STRENGTH · PILATES", pero el párrafo de combinabilidad de bonos solo cita
> **Fisioterapia, Strength y Pilates** — no menciona Wellness explícitamente.
> La página **no afirma** que Wellness esté incluido en esa combinabilidad,
> para no inventar una condición. Si Marshall confirma que Wellness sí
> aplica, añádelo en esta lista y en el accordion "Bonos: condiciones" de
> `#en-la-clinica`.

**Suplementos** (clínica): recargo nocturno (sesiones desde las 20 h) +20 €;
recargo de fin de semana y festivos +20 €. Acumulables entre sí y también
sobre sesiones consumidas con bono, abonándose aparte.

**Reservas y cancelaciones:** antelación mínima 24 h entre semana (lunes a
viernes, excepto festivos) o 48 h en fin de semana y festivos. Fuera de
plazo, o sin aviso, la sesión se considera realizada salvo causa médica o de
fuerza mayor acreditada.

## Tarifa a domicilio — Physiotherapy · Wellness · Strength (sin Pilates)

Sección `02 — A domicilio` (`#a-domicilio`) + `Condiciones del
desplazamiento` (`#desplazamiento`). Es una **modalidad independiente**, no
una quinta área junto a Physiotherapy, Wellness, Strength y Pilates.

**El servicio a domicilio no incluye Pilates.** El PDF titula esta tarifa
"PHYSIO · WELLNESS · STRENGTH" (sin Pilates) y el texto de valoración inicial
lo confirma: "con independencia de la disciplina (Fisioterapia, Strength y
Wellness)".

| Sesión                             | Precio |
| ------------------------------------ | ------ |
| Primera sesión a domicilio (60')     | 100 €  |
| Seguimiento a domicilio (50')        | 95 €   |

Ambos precios **incluyen el desplazamiento en un radio de 10 km** desde
Avinguda Camí dels Capellans, 79 (local 3), Sitges. Los bonos de la tarifa de
clínica **no son válidos** a domicilio; las sesiones se contratan y abonan
una a una, antes de cada sesión.

**Suplementos** (domicilio): recargo nocturno +20 €; recargo de fin de semana
y festivos +20 €; recargo por cada 10 km adicionales de desplazamiento +10 €
(sobre la distancia de ida, según Google Maps en el momento de la reserva).
Acumulables entre sí.

**Reservas y cancelaciones:** misma antelación mínima que en clínica (24 h /
48 h).

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

El CTA `Ver todos los servicios` del bloque de ayuda enlaza a
`servicios.html` porque esa página **ya existe** en el repositorio. Si algún
día se elimina o se traslada, ese enlace debe revisarse aquí primero.

---

## Dónde se refleja cada dato en `src/pages/tarifas.html`

Localiza los bloques por su clase CSS, no por número de línea.

| Dato                                   | Bloque                                                    |
| ---------------------------------------- | ------------------------------------------------------------ |
| Tarjetas de área (Physio/Wellness/Strength/Pilates) | `#areas` → `.area-card`                          |
| Valoración y sesión inicial (clínica)    | `.entry` (`.entry__num`, `.entry__price`, `.entry__note`)    |
| Sesiones individuales + bonos (clínica)  | `.follow__list` → `.step` (`<details>`) → `.step__bonos`     |
| Condiciones de la tarifa en clínica      | `#en-la-clinica .conditions` → `.cond__item` (`name="cond-clinica"`) |
| Tarifas a domicilio                      | `.split` → `.split__panel`                                   |
| Aviso "sin Pilates a domicilio"          | `#a-domicilio .rates__note`                                  |
| Condiciones de desplazamiento (resumen)  | `.travel__text`, `.travel__highlights`                        |
| Condiciones a domicilio (detalle)        | `#desplazamiento .conditions--travel` → `.cond__item` (`name="cond-domicilio"`) |
| Duraciones del hero                      | `.hero-nums` (decorativo, `aria-hidden`)                      |

Al editar, ten en cuenta:

- Las cifras de `.hero-nums` son **decorativas** y están ocultas a los lectores
  de pantalla. Si cambia una duración real, actualiza también esta cifra por
  coherencia visual, pero nunca la uses como dato.
- No añadas ni quites elementos `.step`, `.split__panel` o tarjetas `.area-card`
  sin revisar el responsive: la escalera de `.step`, el desfase de
  `.split__panel--offset` y la rejilla de `.areas__grid` están calculadas
  para un número fijo de elementos (2, 2 y 4 respectivamente).
- Cada `.step` es un `<details>`: el precio va siempre en el `<summary>`
  (visible sin abrir); los bonos van dentro, en `.step__bonos`.
- Los precios no viven en JavaScript y no deben moverse allí: `src/js/main.js`
  solo gestiona menú, animaciones y scroll. No se ha añadido JavaScript nuevo
  para esta página: las tarjetas de área son enlaces (`<a>`) normales y los
  acordeones usan `<details>`/`<summary>` nativos.
- Las imágenes de `#areas` son fotografía propia ya existente en
  `src/assets/img/`, documentada en `ASSET_SOURCES.md`. No hay foto propia
  para "A domicilio"; esa tarjeta es intencionadamente gráfica, sin imagen.
