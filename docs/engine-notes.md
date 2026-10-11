# Notas del motor

Resumen de lo que importa de `src/engine/` (copia de pdoom-video). No hace falta leerlo entero.

## Scene y Frame (`engine/scene.ts`)

Un plate es una `Scene` con `render(f, out)`, llamada una vez por frame. `out` es un render target HDR lineal que
hay que sobrescribir completo. Campos de `f`: `t` (tiempo global), `lt` (desde que empezó la entrada), `p` (progreso
0..1 de la entrada), `dt`, `seeked` (hubo salto de tiempo), `a` (features de audio, 0 si no hay), `beat/bar`,
`under/tin/tout` (transiciones entre entradas que se solapan).
`ctx` trae `W, H`, `renderer` (three.js), `audio`, `lyrics`, `id`, `params` (de la entrada del timeline), `start`, `end`.
Escenas con estado: `stateful = true` y `reset()`; el motor re-simula tras un salto. Evitarlas salvo necesidad.

## Timeline (`TimelineEntry`)

`{ id, load, start, end, params?, post?, maxSamples?, caption? }`. Las entradas pueden solaparse (transición).
`post` pisa `DEFAULT_POST` para esa entrada (`engine/post.ts`: `exposure, bloom, halation, ca, grain, vignette, fade,
flash, shake, zoom, invert`). Para un look plano: `bloom 0, halation 0, ca 0, vignette 0, hud 0`.

## Dibujo

- `Layer2D` (`engine/gl.ts`): canvas 2D de W x H con textura; dibujar en px lógicos, `upload()` al final. Base de `src/kit/plate.ts`.
- `FSPass`: pasada de fragment shader a pantalla completa (GLSL ES 3.0, `vUv`, `fragColor`, helpers de `GLSL_COMMON`).
- `Compositor.draw(renderer, tex, target, { mode, opacity, tint, scale, offset })`: componer texturas con blend.
- `engine/type.ts`, `stroke.ts`, `lines.ts`: tipografía con contornos (opentype) y trazos; usan las fuentes del motor en `public/fonts`.
  Las fuentes de marca se cargan por `FontFace` desde `@fontsource/*` (ver `videos/_template/brand.ts`).
- Texto de Canvas2D: `ctx.letterSpacing` y `ctx.font` funcionan. Pasar `font` completo (`"600 96px Familia"`).

## Util (`engine/util.ts`)

`ease.*` (inOutCubic, outBack, outExpo...), `prog(x, a, b, fn)` (progreso acotado), `lerp`, `clamp`, `hash(...)`,
`noise1/2/3`, `fbm`, `keys` (keyframes), `pulse`, `springStep`, `mulberry32`. Todo determinista.

## Audio y letras (no usados hoy)

`data/audio.json` define `duration`, `bpm`, `beats`, `downbeats`, `sections`, `features` (envolventes) y `onsets`.
Sin audio, solo importa `duration`. `data/lyrics.json` con `{ lines: [] }` basta. Para sincronizar con una voz, la guía
original "Motion as Code" usa alineación forzada (wav2vec2/ONNX) para producir `lyrics.json` con tiempos por palabra.

## Tone shoulder

El post final comprime los valores lineales altos (> 0.72). Con paletas claras los blancos quedan grises. `src/kit/plate.ts`
pre-aplica la inversa para que la transferencia neta sea identidad. Con looks oscuros y de película, se puede quitar.

## Render (`scripts/render.ts`)

Chrome headless dibuja cada frame, los manda por WebSocket a ffmpeg (libx264, BT.709). Motion blur adaptativo por
sub-frames (`--samples N` fija el número; `--samples 4` es borrador). `--scale 2` da 4K. Un 30 s a 1080p60 tarda ~1 min.
