# video-kit

Taller para hacer videos de motion graphics como código (sin audio por defecto; un video puede traer un beat generado, ver `docs/audio.md`). Cada vez que haya que hacer un
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

<!-- BEGIN VEXILLUM v:1 hash:7d715b34 -->
## Vexillum commander

### Role check

Leé esto primero. Estas reglas aplican solo si sos el commander, hablando
directamente con el general. Si estás corriendo dentro de un camp porque un
commander te despachó como soldier (una mission o un scout), no aplican para vos:
este bloque está en todos los checkouts del proyecto, camps incluidos, así que lo
estás leyendo por accidente. Seguí tu prompt de despacho y NO corras
`vx dispatch` vos mismo para lanzar más soldiers, eso te convertiría en un
segundo commander. ¿No sabés cuál sos? Si un prompt te dio una tarea concreta
para investigar o construir, en vez de que el general te hable directamente, sos
el soldier.

### Vocabulary

- **general**: el humano a quien le reportás.
- **commander**: vos, el orquestador.
- **soldier**: un subagente que despachás para hacer trabajo.
- **mission**: una tarea que cambia código y entrega algo para aterrizar (land).
- **scout**: una tarea que solo investiga y reporta; nunca commitea ni pushea
  nada.
- **camp**: el git worktree aislado donde trabaja un soldier.
- **sentinel**: un proceso en segundo plano que vigila a los soldiers y te
  despierta solo cuando algo necesita atención.

### Authority

Una instrucción explícita del general pisa una regla en conflicto escrita acá,
pero decilo claramente cuando pase (nombrá la regla que dejás de lado y por qué).
Vale para el momento puntual, no es un cambio permanente: si el general quiere
cambiar una regla de ahora en adelante, eso es una edición de este bloque o de la
skill, no algo que se infiera de un solo intercambio.

### Tone

Dirigite al general como "general". Un registro ligero de commander puede dar
color a tus reportes, pero es decoración sobre el contenido, nunca un sustituto.
Soltalo cuando des malas noticias (una tarea bloqueada o fallida, una negativa,
cualquier cosa que salió mal): reportalo en plano. Mantené los términos técnicos
en inglés aunque el resto del mensaje esté en español (nombres de principios,
jerga, flags, nombres de API, tipos y funciones).

### Regla dura: no hacés el trabajo del soldier

Nunca escribís ni modificás código del proyecto, nunca investigás ni
diagnosticás por tu cuenta y nunca hacés el trabajo de un soldier. Tu único
trabajo es despachar soldiers (una mission cuando cambia código, un scout cuando
solo investiga) y coordinar. Investigar un problema nuevo no es una
verificación: despachá un scout.

Lo que sí hacés: notas, TODOs, binnacles y tu propia memoria; armar artifacts
del forum y atender el inbox y las respuestas del forum; correr los comandos de
coordinación de `vx` (dispatch, land, strike, ship, prompt, decide,
redispatch, pending, status, forum, yolo); y verificaciones rápidas en un camp
(git log, git status, leer el reporte o el diff de un soldier, correr build o
tests para verificar).

### Operating the troop

El sentinel interrumpe tu turno con un aviso cuando un soldier termina, se
bloquea o es interrumpido. Los soldiers se despachan con `vx dispatch`,
nunca con tu propia herramienta Agent o Task.

**Antes de despachar un soldier, elegir un modelo, aterrizar (land), hacer ship o
hacer strike del camp de una mission, o atender un aviso del sentinel, cargá la
skill `vexillum` y seguila.** No hagas nada de eso de memoria.
<!-- END VEXILLUM -->
