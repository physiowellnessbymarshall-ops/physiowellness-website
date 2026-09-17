# Procedencia de imágenes

Registro de las imágenes usadas en `/es/tarifas/`. Sigue el mismo criterio que
pide el resto del repositorio: nada se usa sin poder explicar de dónde sale.

## Tarjetas de área (`#areas`, FASE 4 · optimizado en FASE 7 · stock en FASE 7B · fotografía propia en FASE 7C)

Hasta la FASE 7 las cuatro tarjetas reutilizaban fotografía de instalaciones
(propia del centro). La FASE 7B las sustituyó por cuatro fotos de stock con
licencia verificada (Pexels/Unsplash), una escena humana por área.

La FASE 7C **descarta esas cuatro fotos de stock** y las sustituye por
fotografía **aportada directamente por el cliente** (Marshall), adjuntada en
la conversación de esta fase — no son fotos propias del centro tomadas en
sus instalaciones (no hay indicios de que sea la clínica real de Physio
Wellness ni su equipo), sino fotografía de referencia que el propio cliente
ha elegido para cada disciplina. No procede de ningún banco de stock, así
que no hay URL de licencia que documentar: el cliente es quien decide y
aporta el archivo.

| Área         | Archivo servido | Origen | Descripción de la escena |
| ------------ | ---------------- | ------ | -------------------------- |
| Fisioterapia | `src/assets/img/stock/area-physio-720.webp` / `-1440.webp` | Aportada por el cliente (FASE 7C) | Fisioterapeuta explorando/tratando el hombro-brazo de un paciente mayor sentado, en sala de tratamiento. |
| Bienestar    | `src/assets/img/stock/area-wellness-720.webp` / `-1440.webp` | Aportada por el cliente (FASE 7C) | Mujer recibiendo terapia de luz roja (panel LED), sentada en un banco. |
| Fuerza       | `src/assets/img/stock/area-strength-720.webp` / `-1440.webp` | Aportada por el cliente (FASE 7C) | Mujer haciendo un ejercicio de fuerza con kettlebell, apoyando el pie sobre un cajón. |
| Pilates      | `src/assets/img/stock/area-pilates-720.webp` / `-1440.webp` | Aportada por el cliente (FASE 7C) | Sesión de reformer: un usuario tumbado en la máquina, guiado por la instructora de pie. |

Fecha de incorporación: 2026-08-21. Los nombres de archivo (`area-physio`,
`area-wellness`, `area-strength`, `area-pilates`) se mantienen de la FASE 7B
por continuidad interna del repositorio; ya no describen fotos de stock,
solo identifican a qué tarjeta pertenece cada archivo.

### Transformaciones aplicadas (las cuatro)

Ninguna gradación de color: son fotos ya coherentes entre sí (misma sesión,
misma paleta cálida/terracota), aportadas para usarse **tal cual**, sin
inventar ni "arreglar" nada por encima. Único proceso Pillow aplicado:

1. **Redimensionado** a los dos anchos responsivos del sitio (720w y, dado
   que el archivo original mide 1448×1086, el ancho grande se limita a
   1440w reales en vez de forzar un upscale) — exportado a WebP calidad 82,
   `method=6`.
2. **Encuadre** (`object-position` en `styles.css`): como el contenedor de
   cada tarjeta es más estrecho que la foto (recorta los laterales, no
   arriba/abajo), cada imagen tiene su propio valor horizontal de
   `object-position` para que se vea el sujeto principal, en vez de un
   recorte centrado igual para las cuatro. Ver `.area-tile[data-area="…"]
   .area-tile__media img` en `styles.css`.

El tratamiento visual en CSS que ya describía este archivo (scrim en
`linear-gradient`, grano `feTurbulence` en `::after`, `object-fit:cover`)
sigue aplicado sin cambios sobre las cuatro imágenes nuevas.

### Imágenes de fases anteriores

Las fotos de stock de la FASE 7B (Karolina Grabowska/Pexels 4506071, Yan
Krukau/Pexels 5793895, Vitaly Gariev/Unsplash Qh0JrqT9hqU, Flexity/Pexels
31509827) han quedado sustituidas por los archivos de esta tabla — mismos
nombres de archivo, contenido nuevo, así que no queda ningún fichero
huérfano que borrar de esa fase.

`src/assets/img/hero-clinic.webp`, `src/assets/img/local/local-lounge-*.webp`,
`local-gym-*.webp` y `local-pilates-*.webp` (fotografía propia del centro,
anterior a la FASE 7) **no se han borrado**: siguen usándose en `index.html`
(hero y galería) y no se toca ninguna otra página en esta fase.

### Stretching (integración como servicio principal — fotografía real, FASE 7)

Al añadir Stretching como quinto servicio principal (a la par de
Fisioterapia, Bienestar, Fuerza y Pilates) en Home, `servicios.html`,
`tarifas.html` y `servicios/stretching.html`, la FASE 6 usó temporalmente
como placeholder el mismo archivo de la fila "Fuerza" de la tabla anterior
(`area-strength-720.webp` / `-1440.webp`) en las cuatro tarjetas/paneles de
Stretching. La FASE 7 sustituye ese placeholder por una fotografía real de
Stretching, aportada directamente por el cliente (Marshall) y guardada por
él mismo en disco (no ha sido posible extraer archivos adjuntados
directamente en la conversación), procesada localmente con el mismo
criterio que el resto de fotografía de cliente (sin gradación de color
añadida, solo redimensionado y exportación a WebP).

| Campo | Detalle |
| ----- | ------- |
| Archivo servido | `src/assets/img/stock/stretching-720.webp` (720×900) / `-1440.webp` (1440×1799) |
| Origen | Aportada por el cliente (FASE 7); no procede de ningún banco de stock, así que no hay URL de licencia que documentar |
| Descripción de la escena | Profesional ayudando a una paciente, tumbada en camilla, a estirar la pierna elevada sujetándola por el tobillo y la pantorrilla, en una sala cálida con plantas y mobiliario de madera clara |
| Transformaciones aplicadas | Redimensionado **por ancho** (no por alto, para que el descriptor `w` de cada `srcset` coincida con el ancho real del archivo) desde el original de 1122×1402 a 720w/1440w, exportado a WebP calidad 84 con Pillow (`method=6`); sin gradación de color adicional |
| Integración | Mismo archivo reutilizado en las cinco ubicaciones: `.service-panel__img--stretching` (Home), `.area-carousel__img--stretching` (`servicios.html`), `.area-tile[data-area="Stretching"]` (`tarifas.html`) y dos veces en `servicios/stretching.html` (hero `.page-hero__photo` y bloque `.service-photo` de "Qué es el Stretching") |
| Recorte (`object-position`) | Ajustado de forma independiente por componente y por breakpoint en `styles.css` (bloques "FASE 7"), porque esta foto es de encuadre vertical (ratio ≈0.8) a diferencia de las demás fotos de área, que son de paisaje. Prioriza el gesto de stretching asistido, la pierna elevada, las manos de la profesional y el pie con calcetín completo, evitando cortes incómodos en las variantes 4/3 (paisaje) de Home y móvil |

Fecha de incorporación: 2026-09-03.

## Hero de página (`#hero`, FASE 7B — nueva)

Hasta la FASE 7B el hero de Tarifas reutilizaba `hero-clinic.webp`, la misma
foto que la Home y que la antigua tarjeta "Physiotherapy". La FASE 7B pide
una imagen **exclusiva** de esta página, así que se ha buscado y verificado
una nueva.

| Campo | Detalle |
| ----- | ------- |
| Archivo servido | `src/assets/img/stock/hero-tarifas-1600.webp` (1600×1066) y `-2400.webp` (2400×1600) |
| Plataforma | Pexels |
| Autor | Yan Krukau (usuario `yankrukov`) |
| URL de la foto | `https://www.pexels.com/photo/5793700/` (título: "Woman in White Long Sleeve Shirt Stretching Woman's Arm" — sesión de valoración/movilidad guiada de hombro y brazo) |
| Licencia | Pexels License, libre uso comercial, sin atribución obligatoria |
| Fecha de verificación y descarga | 2026-08-21 |
| Motivo de la elección | Valoración/tratamiento guiado con luz natural cálida, coherente con "Todo claro antes de reservar" y con el resto de fotos nuevas de esta fase; no coincide con ninguna otra imagen de la página. |
| Transformaciones aplicadas | Misma gradación de color que el resto de FASE 7B (ver arriba). Exportado a 1600w/2400w (más ancho que las tarjetas de área por ser banner a sangre completa) a WebP calidad 82. |
| Integración en la página | `.page-hero__media img`, con `srcset`/`sizes`, `width`/`height` reservados y `loading="eager"` + `fetchpriority="high"` (LCP del hero). Se retiran las cifras decorativas "60/50/30 min" (`.hero-nums`) que antes compartían composición con el titular: la duración real sigue viva en las tarjetas de `#areas` y en las tarifas, así que no se pierde ningún dato. El hueco que dejan permite que la foto ocupe más composición (`min-height` de 74vh a 82vh, scrim superior aclarado). |

## "A domicilio" (`#a-domicilio`, FASE 7 · stock en FASE 7B · fotografía propia en FASE 7C)

Hasta la FASE 6 esta sección no llevaba fotografía. La FASE 7 y la FASE 7B
usaron fotos de stock con licencia verificada (persona mayor haciendo
ejercicio asistido, y después una escena de recepción en la puerta).

La FASE 7C **descarta esa foto de stock** y la sustituye por una fotografía
aportada directamente por el cliente: un hombre llevando un maletín/camilla
de tratamiento plegable a la puerta de una vivienda — la escena literal de
"nos desplazamos hasta ti".

| Campo | Detalle |
| ----- | ------- |
| Archivo servido | `src/assets/img/stock/domicilio-visita-720.webp` (720×900) y `-1122.webp` (1122×1402) |
| Origen | Aportada por el cliente (FASE 7C), adjuntada en la conversación de esta fase |
| Fecha de incorporación | 2026-08-21 |
| Transformaciones aplicadas | Ninguna gradación de color ni recorte: se usa tal cual la aportó el cliente. Único proceso: redimensionado a 720w/1122w (el ancho grande se limita al ancho real del archivo, 1122 px, en vez de forzar un upscale a 1440) y exportación a WebP calidad 82, `method=6`. `aspect-ratio` de `.rates__portrait` en `styles.css` se ha actualizado a la proporción real del archivo (1122/1402), igual que la del propio archivo, así que la foto se muestra completa, sin recortar al hombre ni la camilla por ningún lado. |
| Integración en la página | `#a-domicilio .rates__head`, `<figure class="rates__portrait" aria-hidden="true">` con `srcset`/`sizes`, `width`/`height` reservados y `loading="lazy"`. Puramente ambiental, sin degradado ni grano. |

Los ficheros de la foto de stock de la FASE 7B (Pexels 6647028, RDNE Stock
project) han quedado sustituidos por el archivo de esta tabla —mismo nombre
base, contenido y proporción nuevos—, así que no queda ningún fichero
huérfano que borrar de esa fase.

## Hero de Fisioterapia (`.page-physio .page-hero--split`, FASE 8 — nueva)

Hasta la FASE 8 el hero de `src/pages/servicios/physiotherapy.html` era el
mismo bloque editorial sin foto que usa Servicios (`.page-hero` base), a la
espera de una fotografía exclusiva. La FASE 8 introduce una composición a
dos columnas (contenido izquierda / foto derecha en escritorio) y, con
ella, la primera fotografía propia de esta página.

| Campo | Detalle |
| ----- | ------- |
| Archivo servido | `src/assets/img/stock/hero-fisio-720.webp` (720×480) y `-1440.webp` (1440×960) |
| Plataforma | Pexels |
| Autor | Yan Krukau (usuario `yankrukov`) |
| URL de la foto | `https://www.pexels.com/photo/5794011/` (título: "A Massage Therapist Holding a Woman's Leg Up" — valoración/estiramiento guiado de pierna sobre camilla, junto a una ventana grande) |
| Licencia | Pexels License, libre uso comercial, sin atribución obligatoria |
| Fecha de verificación y descarga | 2026-08-26 |
| Motivo de la elección | Luz natural cálida (ventanal grande), paleta cálida/desaturada (paredes rosa pálido, madera, camilla crema), escena realista de valoración/movilidad (no posada ni de estética hospitalaria), rostro de la fisioterapeuta de perfil y sin mirar a cámara —no protagonista de la composición—, y encuadre horizontal con el sujeto desplazado hacia la derecha, adecuado para recortar en columna vertical junto al texto. Se descartaron otros candidatos de Pexels por fondo clínico frío (salas con dispensadores/lavabo), rostro de la profesional demasiado protagonista o encuadres ya usados en la foto del hero de Tarifas. |
| Transformaciones aplicadas | Ninguna gradación de color: se usa el encuadre original completo (proporción 3:2), redimensionado a 720w/1440w y exportado a WebP calidad 82, `method=6`. El recorte final a las proporciones del hero (4:3 en móvil, 3:4 en escritorio) lo resuelve `object-fit:cover` + `object-position` en `styles.css`, igual que el resto de fotos editoriales del sitio (`.service-photo`), sin recortar el archivo servido. |
| Integración en la página | `.page-hero__photo` dentro de `.page-hero__grid`, con `srcset`/`sizes`, `width`/`height` reservados, `loading="eager"` y `fetchpriority="high"` (foto above the fold, sin lazy-loading). Mismo filtro (`saturate(1.05) contrast(1.04) brightness(.97)`) y radio de esquina (`--radius-tile`) que `.service-photo`, para no introducir un lenguaje visual nuevo. |

## Bloque de ayuda (`#ayuda`, FASE 6 con foto → FASE 7B sin foto → FASE 7C con fotografía propia)

La FASE 6 añadió una foto de stock (`local-lounge.jpg`, zona de espera) a
este bloque, que la FASE 7B retiró por repetirse con la tarjeta de Wellness
de esa misma fase, sustituyéndola por un grafismo tipográfico (el "?" del
titular) sin fotografía.

La FASE 7C vuelve a llevar fotografía: el cliente ha aportado una foto
específica para sustituir ese grafismo (mujer sentada mirando el móvil),
pensada para "¿No sabes qué sesión elegir?" — consultar desde el móvil antes
de reservar. Al ser una foto nueva y propia, ya no coincide con ninguna otra
imagen de la página.

| Campo | Detalle |
| ----- | ------- |
| Archivo servido | `src/assets/img/stock/ayuda-decide-720.webp` (720×960) y `-1086.webp` (1086×1448) |
| Origen | Aportada por el cliente (FASE 7C), adjuntada en la conversación de esta fase |
| Fecha de incorporación | 2026-08-21 |
| Transformaciones aplicadas | Ninguna gradación de color: se usa tal cual. Redimensionado a 720w/1086w (ancho grande limitado al ancho real del archivo) y exportación a WebP calidad 82, `method=6`. |
| Integración en la página | `<figure class="help__media" aria-hidden="true">` con `srcset`/`sizes`, `width`/`height` reservados y `loading="lazy"`. `object-position` con sesgo hacia la parte superior de la foto (`center 20%` en escritorio, `center 15%` en móvil) para mantener visibles la cara y el móvil incluso cuando el contenedor recorta la imagen. |

## Testimonios editoriales de la Home (`#resenas`, FASE 5.1 — SCROLL VERTICAL CONTINUO)

Rediseño estructural de `#resenas` en `index.html` basado estrictamente en el scroll vertical del usuario (pista sticky donde las fotografías contextuales ascienden y se superponen como capas físicas en sincronía con el avance de las reseñas reales).

### 1. Eliminación de retratos IA ficticios

Se han eliminado por completo los retratos generados previamente para evitar cualquier asociación engañosa entre rostros artificiales y las reseñas reales de los pacientes. Ningún testimonio se asocia visualmente a una cara ficticia. Las firmas se presentan con atribución neutra ("Paciente de Physio Wellness · Reseña en Google").

### 2. Fotografías contextuales del universo Physio Wellness

Las imágenes funcionan como universo visual de la experiencia real del centro (tratamiento, clínica, luz natural, materiales) y NO como retrato de los autores:

| Capa | Archivos servidos | Origen / Licencia | Descripción de la escena | Rol en la secuencia |
| :--- | :--- | :--- | :--- | :--- |
| Capa 1 (Base) | `seat-news-appointment-new-design-director-diez.jpg.avif` | Aportada para testimonio de Jorge Díaz | Retrato de Jorge Díaz. | Escena inicial para la Historia 1 (Jorge Díaz). |
| Capa 2 (Asciende) | `src/assets/img/reviews/david-johnson-720.webp` / `-1200.webp` | Aportada por el paciente / cliente (David Johnson / David Johnson1), actualizada 2026-09-10 | Retrato real de David Johnson sonriente con camisa color salmón/coral y gafas de sol sobre la cabeza. | Asciende desde abajo al hacer scroll hacia la Historia 2 (David Johnson). |
| Capa 3 (Asciende) | `src/assets/img/local/local-lounge-720.webp` / `-1440.webp` | Fotografía real propia del centro (Sitges) | Zona de bienvenida y espera con luz natural, sillones verde oliva de terciopelo, mesa dorada, mármol y plantas. | Asciende desde abajo al hacer scroll hacia la Historia 3 (atención, calma y cuidado global). |

- **Integración**: `.testimonials__photo-layer` dentro del marco sticky `.testimonials__stage` (`aspect-ratio: 4/5`), con capas absolutas controladas por `translateY()` según el progreso del scroll pasivo de la página.

## Fisioterapia: dirección artística, segunda pasada (FASE 9)

Segunda pasada sobre `src/pages/servicios/physiotherapy.html`: no cambia la
fotografía del hero (`hero-fisio`, FASE 8, sin tocar) ni la de "Cuándo
empezar" (`area-physio`, ya documentada más arriba), pero añade fotografía
propia del proceso clínico en el resto de la página y reutiliza fotografía
real del centro ya documentada en otras secciones de este archivo.

### Fotografía propia del proceso de Fisioterapia

Cuatro fotos aportadas por el cliente (mismo shooting: mismo fisioterapeuta
con polo verde, misma sala cálida con estantería de madera y plantas),
incorporadas al repositorio en `src/assets/img/disciplines/fisio/` con
nombre de archivo = UUID de origen, en dos anchos (`-720.webp` y
`-1440.webp`, este último a 1122×1402px reales, sin upscale).

| Archivo (`-720`/`-1440`) | Escena | Uso en la página |
| ----- | ------ | ----------------- |
| `0df88b9f-0f58-4dbf-b5cc-001eb67eb239` | Movilización lumbar/cadera, paciente mayor tumbada de lado. | `.photo-break` (franja panorámica a sangre completa, entre el ticker de problemas y "Ámbitos"). |
| `3618ab1e-11e0-412a-9ad7-bea6708c17f4` | Detalle de manos, tratamiento de muñeca/mano. | `.service-context__detail` (foto flotante superpuesta junto a "Cuándo empezar") y una de las fotos en rotación de `.service-process__visual` ("Cinco pasos"). |
| `5af02bda-9e2c-442f-af09-c3c4f8285313` | Valoración de hombro/brazo. | Foto inicial de `.specialty-list__visual` (columna sticky de "Ámbitos"). |
| `ae26bb46-82b0-4914-8159-5d01e68f3f81` | Tratamiento de tobillo/pie. | Rotación de `.specialty-list__visual` / `.service-process__visual` vía `data-crossfade-src` en cada `[data-sp-step]`. |

| Campo | Detalle |
| ----- | ------- |
| Origen | Aportadas por el cliente (mismo shooting que otras fotos propias del centro) |
| Licencia | No aplica (fotografía propia, sin licencia de stock que anotar) |
| Fecha de incorporación | 2026-09-08 |
| Transformaciones aplicadas | Ninguna gradación de color: redimensionado a 720w/1122w (ancho real del archivo, sin upscale) y exportación a WebP calidad ~82-84, `method=6` — mismo criterio que el resto de fotografía propia del sitio (`domicilio-visita`, `stretching`). |

**Nota ética/de representación**: estas cuatro fotos no se asocian 1:1 con
un ámbito clínico concreto (por ejemplo, no se reserva la foto de la
paciente mayor para "neurológica" ni la de detalle de mano para "suelo
pélvico"): se usan como universo visual ambiental del proceso de
fisioterapia en general, para no sugerir que una persona fotografiada
tiene un diagnóstico concreto. Mismo criterio ya aplicado a las fotos
contextuales de los testimonios de la Home (ver sección anterior).

### Reutilización de fotografía real del centro ya documentada

Tres momentos nuevos de la página (`.testimonial-feature`, el puente al
Método Marshall y el CTA final) reutilizan fotografía real del centro que
ya tiene ficha en este archivo, en vez de encargar o procesar fotos nuevas:

| Sección nueva | Archivo | Ya documentado en |
| ------------- | ------- | ------------------ |
| `.testimonial-feature__photo` (fondo ambiental junto a la reseña de "A.") | `src/assets/img/local/local-lounge-720.webp` / `-1440.webp` | Sección "Testimonios editoriales de la Home" (Capa 3), arriba. |
| `.discipline-bridge` (puente a Método Marshall) | `src/assets/img/hero-clinic.webp` | Sección "Testimonios editoriales de la Home" (Capa 2) y hero de Tarifas. |
| `.cta-final--photo` (CTA final de la página) | `src/assets/img/local/local-gym-720.webp` / `-1440.webp` | Ficha general de fotografía propia del centro, línea 62-63. |

La foto de `local-lounge` en `.testimonial-feature` es, igual que en la
Home, ambiente del centro y no un retrato de la autora de la reseña
("A."): mismo criterio ético de no asociar una cara o escena real a una
persona concreta que no ha sido fotografiada.

## Instalaciones / Espacio de la Home (`#instalaciones`, 2026-09-10)

Renovación editorial de la galería de instalaciones del centro en `index.html`. Se sustituye la fotografía secundaria de bicicletas/cardio (`local-strength.jpg`) y se incorpora la fotografía propia del espacio de fisioterapia con protagonismo absoluto, desplegando un Bento editorial de 5 piezas:

| Posición | Archivo servido | Origen / Licencia | Descripción de la escena |
| :--- | :--- | :--- | :--- |
| **Hero 2x2** | `src/assets/img/local/local-fisio-720.webp` / `-1440.webp` | Fotografía profesional propia (sesión Sandra, #07) | Cabina principal de fisioterapia con camilla hidràulica articulada, espaldera de madera blanca, gran espejo retroiluminado LED, PowerPlate, columna anatómica y suelo de roble. |
| **1x1** | `src/assets/img/local/local-pilates-720.webp` / `-1440.webp` | Fotografía profesional propia (sesión Sandra, Local 2 #05) | Estudio de Pilates Reformer con torre Pilatu de madera noble y espejo de arco. |
| **1x1** | `src/assets/img/local/local-gym-720.webp` / `-1440.webp` | Fotografía profesional propia (sesión Sandra, Local 2 #03) | Sala de fuerza y readaptación con rack multipower Force USA, banco regulable y pesas Titanium Strength. |
| **1x1** | `src/assets/img/local/local-fisio-natural-720.webp` / `-1440.webp` | Fotografía profesional propia (sesión Sandra, #26) | Consulta de fisioterapia con gran ventanal a la calle ("Here Begins Your Wellness"), luz natural exterior, camilla y taburete ergonómico. |
| **1x1** | `src/assets/img/local/local-lounge-720.webp` / `-1440.webp` | Fotografía profesional propia (sesión Sandra, Local 2 #09) | Zona de bienvenida y espera con sillones de terciopelo verde oliva, mesa cónica dorada y pared de mármol. |

## El centro — Dos espacios. Un mismo proceso. (`src/pages/conocenos/el-centro.html`, 2026-09-16)

Documentación de los activos visuales utilizados en la nueva página "El centro". Siguiendo las directrices del proyecto, se ha priorizado el uso exclusivo de **fotografía real del centro** (sesión Sandra, Sitges) y **fotografía real de sesiones aportada por el cliente** (`disciplines/`), sin recurrir a bancos de stock genéricos ni caras ficticias.

| Sección | Archivo servido | Origen / Licencia | Descripción de la escena |
| :--- | :--- | :--- | :--- |
| **Hero Split (Fisioterapia)** | `src/assets/img/local/local-fisio-720.webp` / `-1440.webp` | Fotografía profesional propia (sesión Sandra, #07) | Cabina principal con camilla hidráulica articulada e iluminación cálida. |
| **Hero Split (Strength & Pilates)** | `src/assets/img/local/local-pilates-720.webp` / `-1440.webp` | Fotografía profesional propia (sesión Sandra, Local 2 #05) | Estudio de Pilates Reformer con torre de madera noble y espejo de arco. |
| **Explorador: Fisio Principal** | `src/assets/img/local/local-fisio-1440.webp` | Fotografía profesional propia (sesión Sandra, #07) | Cabina principal de tratamiento clínico. |
| **Explorador: Fisio Detalle 1** | `src/assets/img/local/local-fisio-natural-720.webp` / `-1440.webp` | Fotografía profesional propia (sesión Sandra, #26) | Consulta con ventanal a la calle y luz natural exterior. |
| **Explorador: Fisio Detalle 2** | `src/assets/img/disciplines/fisio/3618ab1e-11e0-412a-9ad7-bea6708c17f4-720.webp` | Fotografía aportada por el cliente | Detalle de manos en terapia manual y movilización articular. |
| **Explorador: S&P Principal** | `src/assets/img/local/local-pilates-1440.webp` | Fotografía profesional propia (sesión Sandra, Local 2 #05) | Estudio de Pilates Reformer. |
| **Explorador: S&P Detalle 1** | `src/assets/img/local/local-gym-720.webp` / `-1440.webp` | Fotografía profesional propia (sesión Sandra, Local 2 #03) | Sala de fuerza y readaptación con rack multipower Force USA. |
| **Explorador: S&P Detalle 2** | `src/assets/img/local/local-lounge-720.webp` / `-1440.webp` | Fotografía profesional propia (sesión Sandra, Local 2 #09) | Zona de bienvenida y descanso con sillones de terciopelo verde oliva. |
| **En Movimiento (Fisio)** | `src/assets/img/disciplines/fisio/5af02bda-9e2c-442f-af09-c3c4f8285313-1440.webp` | Fotografía aportada por el cliente | Valoración de movilidad articular hombro-brazo con fisioterapeuta. |
| **En Movimiento (Fuerza)** | `src/assets/img/disciplines/strength/b6f0d767-34ad-4aeb-be9f-7b617316246e-1440.webp` | Fotografía aportada por el cliente | Ejercicio de fuerza y estabilidad supervisado con mancuernas. |
| **En Movimiento (Pilates)** | `src/assets/img/disciplines/pilates/230151d6-6497-438c-b67b-863393bb572f-1440.webp` | Fotografía aportada por el cliente | Sesión de Pilates Reformer con instructora acompañando el movimiento. |
| **Detalle 01 (Tratamiento)** | `src/assets/img/local/local-fisio-720.webp` | Fotografía profesional propia (sesión Sandra, #07) | Cabina privada y camilla articulada. |
| **Detalle 02 (Zona activa)** | `src/assets/img/local/local-gym-720.webp` | Fotografía profesional propia (sesión Sandra, Local 2 #03) | Sala de fuerza y multipower. |
| **Detalle 03 (Reformer)** | `src/assets/img/local/local-pilates-720.webp` | Fotografía profesional propia (sesión Sandra, Local 2 #05) | Estudio de Reformer de madera noble. |
| **Detalle 04 (Bienvenida)** | `src/assets/img/local/local-lounge-720.webp` | Fotografía profesional propia (sesión Sandra, Local 2 #09) | Zona de recepción y espera serena. |

## Equipo — Personas que acompañan procesos (`src/pages/conocenos/equipo.html`, 2026-09-16)

Documentación de los activos visuales utilizados en la página "Equipo". Siguiendo las directrices del proyecto y del cliente, se han utilizado **fotografías reales ya presentes en el proyecto** para los perfiles principales de los miembros del equipo (`src/assets/img/team/`), y se han incorporado **fotografías de stock temporales en alta resolución** en `src/assets/img/stock/team/` como solución provisional para el Hero, el bloque intermedio de acompañamiento y como variante alternativa para los perfiles, preparadas para su sustitución futura directa cuando se realice el reportaje fotográfico definitivo del equipo.

| Sección | Archivo servido | Tipo / Origen | Descripción de la escena |
| :--- | :--- | :--- | :--- |
| **Hero de Equipo** | `src/assets/img/stock/team/hero-equipo.webp` / `-720.webp` | Stock provisional generado para Physio Wellness | Conversación cercana entre profesionales de salud en sala diáfana y luminosa con vistas al entorno mediterráneo de Sitges, madera y plantas. |
| **Perfil 01: Marçal (Real)** | `src/assets/img/team/marcal-ramirez.jpg` | Fotografía real del centro (Home) | Retrato real de Marçal Ramirez Roig con camiseta corporativa de Physio Wellness. |
| **Perfil 01: Marçal (Stock alternativo)** | `src/assets/img/stock/team/stock-marcal.webp` / `-720.webp` | Stock provisional alternativo | Retrato editorial cálido de fisioterapeuta masculino en entorno clínico con madera y vegetación. |
| **Perfil 02: Abril (Real)** | `src/assets/img/team/abril-rodriguez.jpg` | Fotografía real del centro (Home) | Retrato real de Abril Rodríguez, recepción y coordinación en Physio Wellness. |
| **Perfil 02: Abril (Stock alternativo)** | `src/assets/img/stock/team/stock-abril.webp` / `-720.webp` | Stock provisional alternativo | Retrato editorial cálido y acogedor de coordinadora/recepcionista en espacio de bienvenida sereno. |
| **Bloque Intermedio Humano** | `src/assets/img/stock/team/intermedio-equipo.webp` / `-720.webp` | Stock provisional generado para Physio Wellness | Valoración y acompañamiento de movimiento guiado con fisioterapeuta y paciente, luz cálida y materiales nobles. |
| **Puerta: El centro** | `src/assets/img/local/local-fisio-natural-720.webp` | Fotografía profesional propia (sesión Sandra, #26) | Cabina de fisioterapia con luz natural exterior. |
| **Puerta: Primera visita** | `src/assets/img/local/local-lounge-720.webp` | Fotografía profesional propia (sesión Sandra, Local 2 #09) | Zona de bienvenida y lounge de recepción del centro. |

## Primera visita — Convertir la incertidumbre en claridad (`src/pages/conocenos/primera-visita.html`, 2026-09-16)

Documentación de los activos visuales utilizados en la nueva página "Primera visita / Primera sesión". Siguiendo las directrices del proyecto y las instrucciones del usuario, se ha priorizado el uso exclusivo de **fotografía real del centro** (sesión Sandra, Sitges) y **fotografía real de sesiones aportada por el cliente** (`disciplines/`), sin recurrir a bancos de stock genéricos ni caras ficticias. Cada imagen ha sido seleccionada para reforzar la empatía, la escucha activa y la reducción de la incertidumbre:

| Sección | Archivo servido | Tipo / Origen | Descripción de la escena |
| :--- | :--- | :--- | :--- |
| **Hero de Primera Visita** | `src/assets/img/disciplines/fisio/3618ab1e-11e0-412a-9ad7-bea6708c17f4-1440.webp` / `-720.webp` | Fotografía real de disciplina aportada por el cliente | Conversación clínica cercana y escucha activa sentados en consulta luminosa. Transmite "Primero me van a escuchar". |
| **Recorrido: Fase 01 (Nos conocemos)** | `src/assets/img/disciplines/fisio/3618ab1e-11e0-412a-9ad7-bea6708c17f4-1440.webp` / `-720.webp` | Fotografía real de disciplina aportada por el cliente | Escucha activa, anamnesis y diálogo clínico sin prisas. |
| **Recorrido: Fase 02 (Valoración física)** | `src/assets/img/disciplines/fisio/ae26bb46-82b0-4914-8159-5d01e68f3f81-1440.webp` / `-720.webp` | Fotografía real de disciplina aportada por el cliente | Exploración biomecánica articular y test ortopédicos precisos. |
| **Recorrido: Fase 03 (Movimiento activo)** | `src/assets/img/disciplines/fisio/5af02bda-9e2c-442f-af09-c3c4f8285313-1440.webp` / `-720.webp` | Fotografía real de disciplina aportada por el cliente | Observación de patrones funcionales, control motor y compensaciones en movimiento. |
| **Recorrido: Fase 04 (Primera intervención)** | `src/assets/img/local/local-fisio-1440.webp` / `-720.webp` | Fotografía profesional propia del centro (sesión Sandra, #07) | Cabina de fisioterapia con camilla articulada y luz natural para terapia manual. |
| **Recorrido: Fase 05 (Punto de partida)** | `src/assets/img/local/local-lounge-1440.webp` / `-720.webp` | Fotografía profesional propia del centro (sesión Sandra, Local 2 #09) | Espacio sereno de recepción para explicar el plan y pautas con tranquilidad. |
| **En la práctica (Qué pasa realmente)** | `src/assets/img/disciplines/fisio/0df88b9f-0f58-4dbf-b5cc-001eb67eb239-1440.webp` / `-720.webp` | Fotografía real de disciplina aportada por el cliente | Movilización suave y terapia manual adaptada a la sensibilidad del paciente. |
| **Puerta Conócenos: Equipo** | `src/assets/img/stock/team/hero-equipo-720.webp` | Fotografía de equipo (stock provisional del universo Conócenos) | Conexión con la página de Equipo (`equipo.html`). |
| **Puerta Conócenos: El centro** | `src/assets/img/local/local-fisio-natural-720.webp` | Fotografía profesional propia del centro (sesión Sandra, #26) | Conexión con la página de El centro (`el-centro.html`). |






