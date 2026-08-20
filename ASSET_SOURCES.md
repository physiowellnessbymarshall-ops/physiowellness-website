# Procedencia de imágenes

Registro de las imágenes usadas en `/es/tarifas/` (sección `#areas`, FASE 4).
Sigue el mismo criterio que pide el resto del repositorio: nada se usa sin
poder explicar de dónde sale.

## Tarjetas de área (`#areas`)

Las cuatro tarjetas reutilizan fotografía **propia** de la clínica, ya
presente en el repositorio desde antes de esta página. No se ha descargado,
buscado ni incorporado ninguna imagen nueva: no hacía falta, porque el
material existente ya encajaba con cada área.

| Área          | Archivo                                    | Autor / origen                          | Licencia                        | Modificación aplicada |
| ------------- | ------------------------------------------- | ---------------------------------------- | -------------------------------- | ---------------------- |
| Physiotherapy | `src/assets/img/hero-clinic.webp`           | Physio Wellness by Marshall (fotografía propia del centro, ya usada como hero de `index.html`) | Propiedad de Physio Wellness; sin restricción de uso interno | Ninguna al archivo. Tratamiento visual aplicado en CSS (ver abajo). |
| Wellness      | `src/assets/img/local/local-lounge.jpg`     | Physio Wellness by Marshall (zona de espera del centro, ya usada en la galería de `index.html`) | Propiedad de Physio Wellness | CSS únicamente |
| Strength      | `src/assets/img/local/local-gym.jpg`        | Physio Wellness by Marshall (sala de entrenamiento de fuerza, ya usada en `index.html`) | Propiedad de Physio Wellness | CSS únicamente |
| Pilates       | `src/assets/img/local/local-pilates.jpg`    | Physio Wellness by Marshall (sala de pilates con reformer, ya usada en `index.html`) | Propiedad de Physio Wellness | CSS únicamente |

Como son fotografías propias del negocio, no aplica ninguna licencia de
terceros ni atribución: Physio Wellness ya es titular del material.

### Tratamiento visual (CSS, no destructivo)

No se ha usado ninguna herramienta de edición de imagen (no se ha añadido
ninguna dependencia para eso, según se pidió). El "look" propio de la
colección se logra en `src/css/styles.css`, sección 27, sobre el `<img>`
original, sin generar copias nuevas del archivo:

- `filter: saturate() contrast() brightness()` — ligera unificación de color
  y contraste entre las cuatro fotos, tomadas en momentos distintos.
- Superposición mediante `linear-gradient` (oscurecimiento inferior en
  `--pw-primary-900` con transparencia) para que el título y el texto de la
  tarjeta mantengan contraste AA sobre cualquier foto.
- Grano sutil vía un `::after` con una textura `feTurbulence` en SVG inline
  (`data:image/svg+xml`), en `mix-blend-mode:overlay` y opacidad muy baja.
  No es un archivo nuevo: es una textura generada por CSS, sin petición de
  red ni hotlink.
- Reencuadre mediante `object-fit:cover` + `object-position`, sin recortar el
  archivo original.

Esta vía se eligió en vez de editar los `.jpg`/`.webp` directamente porque el
proyecto no tiene ninguna herramienta de edición de imagen instalada y no se
quería añadir una dependencia solo para esto. El resultado es reversible y
no genera assets duplicados.

## "A domicilio"

No lleva imagen. El brief permitía **como máximo** una foto para esta
sección, no la exigía. No existe en el repositorio ninguna fotografía propia
que represente "ir a casa del paciente", y no se ha buscado ni descargado
material de stock para no arriesgar una licencia no verificable en esta
sesión de trabajo. La sección se resuelve de forma gráfica (paneles de
color y tipografía a gran escala), coherente con el resto de la página.

**Pendiente:** si se quiere una fotografía dedicada para "A domicilio", debe
aportarla el cliente (fotografía propia) o encargarse expresamente una
búsqueda de banco de imágenes con licencia verificable, y documentarse aquí
con archivo, autor, URL original, licencia y modificaciones antes de usarse.
