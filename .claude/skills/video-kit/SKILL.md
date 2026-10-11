---
name: video-kit
description: Hacer un video de motion graphics como código (sin audio) en este repo, de punta a punta: brief, dirección de arte desde la marca, plates, revisión con stills, render 16:9 y 9:16. Usar cuando Lucas pida un video, una animación, un promo, o una versión vertical.
---

# video-kit: proceso para hacer un video

Trabajá siempre dentro de este repo. Un video = una carpeta `videos/<nombre>/`. Leé `CLAUDE.md` y `docs/engine-notes.md`
si no los conocés. Ejemplo completo y probado: `videos/nutrione/` (4 plates, 16:9 y 9:16).

## 1. Brief (preguntá solo lo que falte, una o dos preguntas)

- **Qué** hay que comunicar y para quién. Una idea central, no una lista de features.
- **Formato**: 16:9, 9:16, o ambos. **Duración** (lo normal 20 a 40 s).
- **Marca/fuente visual**: si hay un repo o producto, investigalo antes de diseñar (ver paso 2). Si Lucas te deja la
  dirección creativa, decidila vos y explicá la idea en pocas líneas.
- Sin audio ni voiceover salvo que lo pida. El audio no está resuelto en este kit (ver "Límites").

## 2. Dirección de arte desde la marca

Leé del producto, no inventes: tema/CSS (`globals.css`, tailwind), tokens de color, tipografías (`layout.tsx`), logo SVG,
y el copy real (landing, README). De ahí salen `brand.ts` (colores, `FONT`, carga de fuentes) y los textos.
- Fuentes: `npm i -D @fontsource/<familia>` y cargar los woff2 por `FontFace` en `brand.ts` (patrón en `_template`).
  Prefijar los nombres de familia (`"VK Inter"`) para no pisar las del motor.
- Logo: pegar los `d` del SVG en un `_logo.ts` y dibujarlo con `Path2D` (ver `videos/nutrione/scenes/_brand.ts`).
- Datos de ejemplo (nombres, cifras): ficticios, y decilo al entregar.
- Elegí una idea narrativa con arco (por ejemplo desorden a orden), no una colección de pantallas sueltas.

## 3. Crear el video

```
npm run vk -- new <nombre> --duration <seg>
```

Después: `brand.ts`, `scenes/*.ts`, `timeline.ts` (qué plate va cuándo). La duración total vive en `data/audio.json`.
Look claro y plano (lo habitual): dejar el `POST` del template (film off) y el inverso del shoulder de `src/kit/plate.ts`.
Look oscuro/cinematográfico: quitar el `POST` override y el inverso del shoulder, y aprovechar bloom/halation/grano.

## 4. Escribir plates

- `class X extends Plate`; `draw(c, f)` dibuja todo con Canvas2D. Es una función pura de `f` (usar `f.lt`, `f.t`, `prog`, `ease`).
- Nada de `Math.random()`, `Date.now()` ni estado acumulado. Variación: `hash(k, n)`, `noise1`.
- Layout siempre desde `W` y `H`. Para 9:16 con composición distinta, crear `scenes/v-<nombre>.ts`; el timeline lo usa
  solo en vertical (si no existe, usa el mismo plate).
- Animación: aparición escalonada con `prog(f.lt, a, b, ease.outCubic)`, cortes con fade (lo hace la base: `fadeIn/fadeOut: false`
  en `params` para el primero y el último). Dejá aire: cada elemento nuevo entra de a uno, con 0.2 a 0.3 s entre ellos.
- Texto: `ctx.font` completo, medir con `c.measureText` si hay que centrar bloques mixtos. Revisar que nada se corte ni se pise.

## 5. Revisar con stills (obligatorio antes del render completo)

```
npm run vk -- stills <video> --t 1,3.5,9,15 [--vertical]
```

Abrí las imágenes (Read) y revisá con ojo exigente: texto cortado o superpuesto, contraste, alineaciones, estados
intermedios de las transiciones (no solo el estado final), y los bordes de cada plate (fundidos). Corregí y repetí.
Pixel perfection: si algo se ve mal aunque no sea lo pedido, arreglalo.

## 6. Render y verificación

```
npm run vk -- render <video> [--vertical]
```

Salida en `out/<video>/`. Verificá con `node_modules/ffmpeg-static/ffmpeg -hide_banner -i <mp4>` (duración, tamaño, 60 fps) y
sacá una hoja de contactos con `-vf "fps=0.4,scale=640:-1,tile=4x3"` para revisar el conjunto. Reportá qué verificaste y qué no:
mirar stills y una hoja no es haber visto el video reproducido.

## 7. 9:16

No es un reescalado: rediseñá el layout. Zona segura de redes: dejá libre ~210 px arriba y ~400 px abajo para texto
importante (la UI de Reels/TikTok los tapa). En una agenda semanal, por ejemplo, pasar a vista de día. Comprobá los dos formatos.

## Errores ya pagados

- macOS: `sed -i ''` (con las comillas vacías).
- Paletas claras: sin el inverso del shoulder los blancos salen grises y las tarjetas blancas desaparecen contra el fondo.
- `ease.inOutSine` no existe; los easings están en `@engine/util` (`inOutQuad`, `outCubic`, `outBack`...).
- Las fuentes del motor (`public/fonts`) son las de pdoom (Archivo, Plex, Cormorant). Las de marca van aparte por fontsource.
- Un `Layer2D` crea un canvas por plate; está bien. No crear canvas nuevos dentro de `draw()`.
- El PDF/sheet/modal que entra al final de un plate necesita tiempo de lectura: dejá 1.2 s o más antes del fade de salida.
- Si el preview o `stills` reusan un servidor viejo en :5173 con otro `VIDEO`/tamaño, matalo (`vk` levanta uno propio al renderizar).

## Límites actuales

- Solo plates 2D en Canvas2D. El motor soporta three.js y shaders (`FSPass`), pero no hay plantillas hechas.
- Sin audio ni sincronización con voz. Para eso hay que producir `data/lyrics.json` con tiempos por palabra (alineación
  forzada), como en la guía "Motion as Code". No está implementado acá.
- Render de ~1 min por 30 s a 1080p60 en esta máquina. 4K (`--scale 2`) es bastante más lento.
- Windows no validado.
