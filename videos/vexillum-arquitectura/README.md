# vexillum-arquitectura

Demo de la serie System Design: cómo funciona vexillum por dentro. 9:16, 60 s, con beat. Guion en `script.md`.

```
npm install
npm run vk -- stills vexillum-arquitectura --vertical --t 2,14,30,45,59   # revisar
npm run vk -- render vexillum-arquitectura --vertical                     # beat + imagen + mezcla
# -> out/vexillum-arquitectura/vexillum-arquitectura-vertical.mp4
```

- `score.ts`: grilla musical y cues (todo en compases). `audio/beat.ts`: el beat. `brand.ts`: paleta y fuentes
  provisorias (un solo archivo). `layout.ts`: el diagrama y la cámara. `paint.ts`: lo que pinta p5.brush.
  `world.ts`: el diagrama animado. `overlay.ts`: textos. `scenes/`: un plate por sección.
- Detalles técnicos: `docs/p5-brush-orbs.md` y `docs/audio.md`. Solo se diseñó la versión vertical.
