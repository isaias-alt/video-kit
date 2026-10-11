# video-kit

Taller para hacer videos de motion graphics como código (sin audio por ahora). Cada vez que haya que hacer un
video, se trabaja acá. El proceso completo está en la skill `video-kit` (`.claude/skills/video-kit/SKILL.md`):
cargala antes de empezar un video.

## Layout

- `src/engine/`: motor pdoom-video de mexicat (MIT, `LICENSE.pdoom-engine`). **No se edita.** Salvo `gl.ts`
  (tamaño de frame por `VITE_VIDEO_W/H`) y los parches ya hechos, todo es copia fiel del original.
- `src/kit/`: base compartida para videos (`plate.ts`, `draw.ts`).
- `src/main.ts`, `scripts/render.ts`, `vite.config.ts`: preview y render (parcheados para multi-video y 9:16).
- `videos/<nombre>/`: un video. `timeline.ts`, `brand.ts`, `plate.ts`, `scenes/`, `data/`.
- `videos/_template/`: lo que copia `vk new`. `videos/nutrione/`: ejemplo completo (16:9 y 9:16).
- `out/`: renders y stills, ignorado por git.

## Comandos (todo pasa por `scripts/vk.mjs`)

```
npm run vk -- list
npm run vk -- new <nombre> [--duration 30]
npm run vk -- dev <video> [--vertical]
npm run vk -- stills <video> --t 1,2.5 [--vertical] [--only id]
npm run vk -- render <video> [--vertical] [--samples 4] [--scale 2]
npm run typecheck
```

## Reglas

- Todo local: bun, vite y ffmpeg salen de `node_modules` (`bun`, `ffmpeg-static`). No instalar nada global.
- Cada frame es función pura del tiempo. Nada de `Math.random()` ni estado entre frames (usar `hash`/`noise` de `@engine/util`).
- Los layouts se calculan desde `W` y `H`, nunca con 1920/1080 fijos.
- Antes de renderizar completo, mirar stills. Después de renderizar, verificar duración y tamaño con `ffmpeg -i`.
- No afirmar que se vio un video si solo se vieron stills.
