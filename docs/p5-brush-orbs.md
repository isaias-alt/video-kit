# p5.js + p5.brush y thinking-orbs en el motor

Cómo entran las dos librerías al kit sin romper la regla de oro: cada frame es una función pura del tiempo.
No se tocó `src/engine/`: todo vive en `src/kit/` y en los plates.

## p5.js + p5.brush: pintor offline, no por frame (`src/kit/brush.ts`)

Enfoque elegido: **p5 pinta capas una sola vez, en `init()` del plate, y el plate las compone cada frame.**

```ts
const capa = await paintLayer(W, H, 7, (p, brush) => {
  brush.field('seabed');
  brush.set('HB', '#8A857A', 1);
  brush.flowLine(100, 200, 600, 0);
}, { bg: '#EFE8DA', scale: 2 });
// en draw(c, f): c.drawImage(capa, 0, 0)   (o con 'multiply', tinta sobre papel)
```

Por qué así y no pintar en cada frame:

- `render()` del motor es síncrono y el ciclo de dibujo de p5 2.x es asíncrono (`redraw()` devuelve una
  promesa, y p5.brush vuelca sus trazos en el hook `postdraw`). Pintar dentro de `render()` obligaría a
  bloquear o a mostrar el resultado de un frame anterior: estado entre frames.
- Una pasada de p5.brush cuesta decenas o cientos de ms; compuesta desde un canvas cuesta casi nada. El
  render de 60 s a 1080x1920 tarda ~3 min.
- El resultado es una imagen fija por capa: determinista por construcción, igual en el preview, en los stills
  y en cada worker del render.

Determinismo, en detalle:

- Un solo sketch de p5 en modo instancia (canvas WEBGL de 2048x2048, fuera de pantalla) para todo el video.
  Las pinturas se encolan: nunca corren dos a la vez.
- Antes de cada capa: `randomSeed(seed)` y `noiseSeed(seed)` (p5.brush engancha sus propios generadores a
  esas dos funciones; el `Math.random()` que usa la librería solo es el seed por defecto, que siempre pisamos).
- El estado del pincel (trazo, relleno, hatch, campo) se guarda y se restaura con `push()/pop()` alrededor de
  cada capa, así una capa no depende de la anterior.
- `scaleBrushes()` es la única excepción: multiplica el registro de pinceles en el lugar y sobrevive a
  `pop()`. Por eso no se llama nunca a mano: se pide con `{ scale }` y tiene que ser potencia de dos (los
  cambios de escala entre capas son exactos y no acumulan error de coma flotante, que según el orden de carga
  de los plates daría píxeles distintos entre workers).
- Verificado: el mismo instante renderizado en sesiones distintas de Chrome y después de saltar a otros
  tiempos da el mismo PNG byte a byte.

Cómo se anima algo pintado: con lo que el plate hace por frame, siempre en función de `f.t` / `f.beat`:

- Revelado: clip creciente (barrido o radial) sobre el sprite, con easing desde su cue.
- "Boil" del fondo: cada toma pinta 3 variantes de la misma composición (mismo campo y mismas posiciones,
  `noise` fijo; solo cambia el `random` del grano del pincel) y el plate las alterna en cada corchea
  (`floor(f.beat * 2) % 3`): el papel "hierve" al tempo.
- Reacción al beat: la opacidad de la capa de la toma sigue `f.a.kick` (onsets del bombo en
  `data/audio.json`), y la cámara empuja un 1% en cada golpe.

Costo: memoria. Cada capa de pantalla completa son ~8 MB (1080x1920x4). Este video pinta 1 papel + 3 variantes
por toma (6 tomas) + ~25 sprites del diagrama: ~200 MB por página, sin problema para Chrome.

Detalles prácticos:

- Pinceles disponibles en p5.brush 3: `pen, rotring, 2B, HB, 2H, cpencil, pastel, crayon, charcoal, spray,
  marker`. Para líneas limpias de diagrama: `rotring`/`pen`; los lápices dan grano punteado; `marker` es
  translúcido (casi no se ve en líneas finas).
- Ángulos en radianes (el `angleMode` por defecto de p5).
- Capas para componer con `'multiply'` se pintan sobre blanco (`bg` por defecto): el blanco no tiñe el papel.
- Tipos: `src/kit/p5-brush.d.ts` declara la parte de la API que se usa (el paquete no trae tipos).

## thinking-orbs: el engine sin React (`src/kit/orb.ts`)

El componente `<ThinkingOrb>` de la librería corre su propio reloj (`performance.now()` en un
`requestAnimationFrame`): no sirve para video. Pero el paquete exporta `thinking-orbs/engine`, sin React:
`MODE_FRAMES[modo](size, t, opts)` es geometría pura (devuelve los puntos de un instante) y `paintFrame` los
pinta en un contexto 2D. `drawOrb` hace lo mismo que el componente, con el tiempo de la canción:

```ts
drawOrb(c, 'listening', x, y, f.t, { d: 140, color: C.vermilion });
```

- Se usa el preset de 64 px (`resolvePreset(state, 64)`, el diseño principal de la librería) y se escala con
  `ctx.scale` al diámetro pedido. La velocidad del preset se aplica igual que en el componente
  (`t * preset.speed * speed`).
- `dark: false` (por defecto): tinta oscura para fondos claros, como el tema `light` del componente. `color`
  es el tinte (`color` del componente).
- Estados usados en este video: commander `breathing` (en espera) / `connecting` (coordinando), missions
  `working` y `weaving`, scout `searching`, sentinel `listening`. Los panes de terminal del hook usan
  la variante oscura (`dark: true`).
- React queda instalado como peer dependency del paquete, pero el bundle no lo importa.

## Licencias

p5.js (LGPL-2.1), p5.brush (MIT), thinking-orbs (MIT). Se usan como dependencias npm sin modificar.
