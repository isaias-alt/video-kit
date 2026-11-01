# Banda sonora (videos con audio/beat.ts)

El kit sigue siendo mudo por defecto. Un video puede traer `audio/beat.ts`: un script de bun que arma la banda
sonora desde código, lee el mismo `score.ts` que la imagen y escribe `out/<video>/soundtrack.wav` y
`data/audio.json`.

- Beat: sintetizado desde cero (bombo, caja, hats, bajo polyBLEP, pad, arpegio, pings, impactos, risers). Sin
  samples ni audio de terceros: no hay nada que licenciar. Ruido con PRNG con seed: mismo WAV byte a byte.
- Voz (opcional): tomas grabadas en `videos/<video>/voz/<toma>.wav`. Cualquier WAV PCM (8/16/24/32 bits) o
  float, cualquier frecuencia y cantidad de canales: se pasa a mono y se remuestrea a 48 kHz. La música baja
  (ducking) cuando hay voz.
- `npm run vk -- audio <video>` regenera solo el audio. `vk render` lo regenera, renderiza la imagen
  (`<video>[-vertical].video.mp4`) y mezcla: copia el video, normaliza a -14 LUFS (`loudnorm`) y codifica AAC.
- El preview (`vk dev`) es mudo: para escuchar, renderizar.

## La voz manda el corte (vexillum-arquitectura)

- Cada toma dura lo que dura su WAV. Sin WAV, la toma usa el medio del rango del guion y queda muda.
  `beat.ts` mide las tomas, llama a `setTakes()` y escribe las tomas como `sections` de `data/audio.json`;
  `timeline.ts` lee esas mismas `sections` y hace un plate por toma. Imagen y audio usan los mismos números.
- Dentro de una toma, las cosas pasan en palabras: `word(toma, 'sentinel')` estima cuándo se dice esa palabra
  por su posición en el texto (caracteres más un peso extra en '.', ',' y ':', descontando los 0,4 s de
  silencio al principio y al final de cada toma). Es una estimación: con una lectura pareja erra por unas
  décimas. Si hace falta precisión, reemplazar `word()` por alineación forzada.
- El beat (160 BPM, medio tiempo) reinicia el compás en cada toma, así cada corte cae en un downbeat con un
  impacto. El beat se adapta a las tomas, no al revés.
- `data/audio.json` lleva la grilla (`beats`, `downbeats`) y los onsets de bombo/caja/hats, que el motor expone
  como `f.beat`, `f.a.kick`...
