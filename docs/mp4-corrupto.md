# MP4 corrupto: dos renders escribiendo el mismo archivo

## Síntoma

El MP4 de `npm run vk -- render <video> --vertical` se ve todo negro en el reproductor. `ffprobe` da
`profile=unknown` y `pix_fmt=unknown` en la pista de video, y `ffmpeg -v error -i <mp4> -f null -` imprime miles de
líneas `Invalid NAL unit size (0 > N)`, `missing picture in access unit`, `Error splitting the input into NAL units`.
El brillo medio de los cuadros sale constante (~40) aunque el fondo sea claro: es basura decodificada.

## Causa raíz

Dos renders del mismo video corrieron a la vez (uno en el checkout principal y otro lanzado después, mientras el
primero seguía vivo) y los dos ffmpeg abrieron el mismo `out/<video>/<video>-vertical.video.mp4` con `-y`. Con
`-movflags +faststart` ffmpeg escribe el `mdat`, y al terminar reescribe el archivo para mover el `moov` al
principio. Dos procesos haciendo eso sobre el mismo path se pisan:

- el archivo quedó con dos `moov` (`ftyp, moov, moov, free, mdat`) y **141 MB de basura después del `mdat`**
  (227 MB cuando el render completo pesa 85 MB);
- el `avcC` (SPS/PPS) quedó inválido, de ahí `profile=unknown` / `pix_fmt=unknown`;
- el paso de mezcla (`-c:v copy` + soundtrack) copió esa pista rota: el `.mp4` final tenía solo 36 s de 61 s de video.

No es el encoder, ni x264, ni las escenas: un render solo sale limpio (3660 cuadros, High yuv420p, 0 líneas de error).
Se reprodujo corriendo dos `bun scripts/render.ts video --to 6 --out X.mp4` a la vez sobre el mismo `X.mp4`: mismo
`Invalid NAL unit size`, 1246 líneas de error, y los dos procesos terminaron con exit 0.

Además, el render no fallaba fuerte: `openPage` solo imprimía `SCENE ERRORS` cuando una escena no cargaba
(`Failed to fetch dynamically imported module .../scenes/toma-03.ts`, por ejemplo por faltar `p5.brush` en
`node_modules`) y seguía renderizando.

## Arreglo

- `scripts/vk.mjs render` toma un lock por video (`out/<video>/.render.lock`, con el pid): si otro render del mismo
  video sigue vivo, falla con exit 1. Cubre también horizontal + vertical a la vez, que comparten `soundtrack.wav`.
- `scripts/render.ts video` y la mezcla de `vk.mjs` escriben a `*.partial-<pid>.mp4` y solo publican con un
  `rename` si el archivo pasó la verificación. Un render fallido, matado o concurrente nunca deja un MP4 a medio
  escribir en el path final.
- `scripts/verify-mp4.mjs` verifica al final de cada render (exit != 0 si falla):
  1. perfil H.264 conocido y `pix_fmt` `yuv420p`, tamaño esperado, pista AAC si lleva soundtrack;
  2. decodificación completa de todas las pistas sin una sola línea de error, y cantidad de cuadros igual a la esperada;
  3. luma media (`signalstats` YAVG) de 8 cuadros muestreados en el medio de 8 tramos iguales: ni negra, ni blanca,
     ni constante.
- Una escena que no carga aborta el render (exit 1) en vez de dejar un agujero en el video.
- `npm run vk -- verify <video> [--vertical]` corre la misma verificación sobre los MP4 ya renderizados en `out/`.
