# video-kit

Motion graphics como código: cada frame es una función pura del tiempo, así que el preview del navegador y el
MP4 exportado son idénticos. 1080p o 9:16, 60 fps, motion blur, sin audio.

Motor: [pdoom-video](https://github.com/mexicat/pdoom-video) de mexicat (MIT).

```
npm install
npm run vk -- list
npm run vk -- new mi-video --duration 20
npm run vk -- dev mi-video            # preview en :5173 (espacio = play, , . = frame a frame, [ ] = plate)
npm run vk -- stills mi-video --t 2,8
npm run vk -- render mi-video         # out/mi-video/mi-video.mp4
npm run vk -- render mi-video --vertical
```

Requisitos del sistema: Node y Google Chrome (el render lo maneja headless). Todo lo demás (bun, vite, ffmpeg con
libx264) se instala en `node_modules`.

Para dirigir un video con Claude Code: abrir Claude en esta carpeta y pedirlo. La skill `video-kit` lleva el proceso.
Detalles del motor en `docs/engine-notes.md`.
