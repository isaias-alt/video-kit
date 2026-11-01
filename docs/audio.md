# Beat de fondo (videos con audio/beat.ts)

El kit sigue siendo mudo por defecto. Un video puede traer `audio/beat.ts`: un sintetizador en código (bun)
que lee el mismo `score.ts` que la imagen y escribe `out/<video>/beat.wav` y `data/audio.json`.

- Fuente: sintetizado desde cero (bombo, caja, hats, bajo polyBLEP, pad, arpegio, pings, impactos, risers).
  Sin samples ni audio de terceros: no hay nada que licenciar. Ruido con PRNG con seed: mismo WAV byte a byte.
- vexillum-arquitectura: 160 BPM en 4/4 a medio tiempo (bombo en 1, caja en 3), Re menor (Dm, Bb, Gm, A),
  compás = 1,5 s, 40 compases = 60 s. Break sin bombo durante el sentinel (ticks + ping por barrido de radar)
  que vuelve con un impacto cuando el commander despierta.
- Sincronía: todo se ubica en compases (`score.ts`). `CUE` mueve la imagen; `HITS`/`TICKS` ponen impactos y
  pings en esos mismos compases; los cortes del timeline caen en downbeats. `data/audio.json` lleva la grilla
  (`beats`, `downbeats`) y los onsets de bombo/caja/hats, que el motor expone como `f.beat`, `f.a.kick`...
- `npm run vk -- audio <video>` regenera solo el audio. `vk render` lo regenera, renderiza la imagen
  (`<video>[-vertical].video.mp4`) y mezcla: copia el video, normaliza a -14 LUFS (`loudnorm`) y codifica AAC.
- El preview (`vk dev`) es mudo: para escuchar, renderizar.
