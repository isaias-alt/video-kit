# vexillum-arquitectura

Demo de la serie System Design: cómo funciona vexillum por dentro. 9:16, ~60 s, voz del general sobre un beat.

Guion oficial: `~/Desktop/Ideaverse/00-Inbox/guion-video-vexillum-arquitectura.md` (6 tomas). Los textos de cada
toma están copiados tal cual en `score.ts` (`TAKES`); si el guion cambia, cambiarlos ahí.

```
npm install
npm run vk -- stills vexillum-arquitectura --vertical --t 2,14,30,45,59   # revisar
npm run vk -- render vexillum-arquitectura --vertical                     # banda sonora + imagen + mezcla
# -> out/vexillum-arquitectura/vexillum-arquitectura-vertical.mp4
```

## Cuando llegue la voz

1. Copiar `toma-01.wav` ... `toma-06.wav` en `videos/vexillum-arquitectura/voz/` (cualquier WAV: se pasa a mono
   48 kHz). Dejar los 0,4 s de silencio al principio y al final de cada toma: son el aire entre cortes.
2. `npm run vk -- audio vexillum-arquitectura`: mide cada toma, rehace el beat sobre esas duraciones y escribe
   `data/audio.json` (las tomas son sus `sections`). La consola lista la duración de cada toma.
3. Revisar stills (los tiempos cambian con la voz) y `npm run vk -- render vexillum-arquitectura --vertical`.

Una toma sin WAV usa el medio del rango del guion y queda muda: se puede soltar la voz de a una.

Cada toma es un plate y dura lo que dura su WAV. Dentro de la toma, cada cosa aparece en la palabra que la nombra,
con un tiempo **estimado** desde el texto (`word()` en `score.ts`, ver `docs/audio.md`). Con una lectura pareja
erra por unas décimas; si alguna aparición queda corrida, ajustar el peso de las pausas o pasar a alineación
forzada.

## Afirmaciones verificadas

Contra `vx 0.2.1` (`vx land --help`, `vx sentinel --help`) y la skill `~/Desktop/Ideaverse/.claude/skills/vexillum/`
(`sentinel.md`, "What a wake is"):

| Texto del guion | Veredicto | En pantalla |
|---|---|---|
| Toma 05: `vx land` se niega con "sin commits" | Cierto: "refuses when the mission's branch has no commit ahead of the base branch" | Sin cambios |
| Toma 04: "Un sentinel por máquina" | Cierto: "one sentinel process per machine" | Sin cambios |
| Toma 04: "El aviso se borra solo cuando se entrega" | Incompleto: se consume al entregarse, pero el sentinel también lo descarta antes si ya no es noticia (la tarea cambió de estado, se hizo strike del camp o se aterrizó la mission) | "El aviso se borra al entregarse, o si ya no es noticia." |

## Qué es ilustración

- Hook (toma 01): el guion pide una grabación real de herdr. Hasta que exista, `panes.ts` dibuja seis panes de
  terminal con orbes y un log inventado. Para usar la grabación real habría que sumar video como capa (el kit hoy
  no lo hace).
- Ids de tarea (`3f9a…`, `b71c…`), nombres de rama y logs son de ejemplo. Tres camps son un ejemplo.
- El radar del sentinel es una metáfora del sondeo; vexillum no tiene radar.

## Archivos

`score.ts`: tomas, cues por palabra, grilla del beat. `audio/beat.ts`: la banda sonora. `timeline.ts`: un plate por
toma. `stage.ts`: el plate común. `scenes/toma-0N.ts`: patrón y textos de cada toma. `layout.ts`: diagrama y cámara.
`world.ts`: el diagrama animado. `paint.ts`: lo que pinta p5.brush. `overlay.ts`: textos. `panes.ts`: el hook.
Detalles técnicos: `docs/p5-brush-orbs.md` y `docs/audio.md`. Solo se diseñó la versión vertical.
