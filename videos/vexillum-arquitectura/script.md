# Guion: "vexillum por dentro" (demo de la serie System Design)

Formato: vertical 9:16, 60 s, 160 BPM (se siente a medio tiempo, 80). 1 compás = 1,5 s; la tabla de tiempos sale
de `score.ts` (compases) y es la misma para imagen, cortes y beat. No hay voz en esta demo: la narración queda
escrita para una locución futura; en pantalla va el texto de cada beat.

Idea central: un sistema de agentes que funciona porque cada pieza tiene un solo trabajo. Cuatro patrones,
cada uno visible en el mismo diagrama que la cámara recorre: supervisor/worker, aislamiento por worktree,
watcher + cola durable, gate humano (y maker-checker para el PR).

## Beats

| # | Tiempo | Compases | Patrón en pantalla |
|---|---|---|---|
| 0 | 0 - 3 s | 0 - 2 | (hook) |
| 1 | 3 - 9 s | 2 - 6 | supervisor / worker |
| 2 | 9 - 16,5 s | 6 - 11 | supervisor / worker |
| 3 | 16,5 - 27 s | 11 - 18 | aislamiento por worktree |
| 4 | 27 - 39 s | 18 - 26 | watcher + cola durable |
| 5 | 39 - 48 s | 26 - 32 | gate de aprobación humana |
| 6 | 48 - 55,5 s | 32 - 37 | maker-checker |
| 7 | 55,5 - 60 s | 37 - 40 | (cierre) |

### 0. Hook (0 - 3 s)

- Narración: "Le hablás a un agente. Trabajan varios, sin pisarse."
- Texto: "Le hablás a **un** agente." / "Trabajan **varios**, en paralelo, sin pisarse."
- Se ve: plano cerrado del orbe del commander (constelación que se conecta). Golpe en 1,5 s: corte a plano
  general con todo el sistema ya andando (camps con soldiers, sentinel barriendo con su radar). Es un adelanto:
  después el video lo arma desde cero.

### 1. Commander (3 - 9 s)

- Narración: "Esto es vexillum. Hablás con un solo agente, el commander. Su regla: no escribe código; despacha."
- Texto: "Vexillum: hablás con **un solo agente**, el commander." / "No escribe código. **Despacha**."
  + comando tipeado `vx dispatch "<tarea>"`.
- Se ve: aparece "vos, el general", la línea hacia el commander (un punto baja con cada compás: los pedidos);
  el orbe del commander pasa de "respirando" a "conectando" cuando se tipea el dispatch.

### 2. Soldiers (9 - 16,5 s)

- Narración: "Cada tarea es un soldier: mission si cambia código, scout si solo investiga. El modelo sale de una
  tabla de perfiles."
- Texto: "Cada tarea es un **soldier**." + "mission: cambia código y termina en un commit. scout: investiga y
  entrega un reporte." / "El modelo sale de una **tabla de perfiles**." + `vx models`.
- Se ve: tres trazos de tinta salen del commander; tres orbes bajan y aterrizan uno por golpe (MISSION, SCOUT,
  MISSION) con su perfil: `sonnet · high`, `haiku · low`, `sonnet · medium` (los perfiles por defecto de
  `vx models`).

### 3. Camps (16,5 - 27 s)

- Narración: "Cada soldier trabaja en su camp: un worktree con rama propia, en un pane de herdr. Ojo: no es un
  sandbox; aísla commits, no lecturas."
- Texto: "Cada soldier trabaja en su **camp**." + "un git worktree con rama propia y una sesión real en un
  pane de herdr" / "Ramas separadas: nadie **pisa** el trabajo de otro." / "Ojo: un camp **no es un sandbox**."
  + "aísla dónde caen los commits, no lo que el proceso puede leer".
- Se ve: cámara cerca del camp 1; las cajas se pintan con acuarela alrededor de cada orbe (título de pane
  "herdr"). La cámara se abre: aparece `main` y las dos ramas `vexillum/<id>` que salen de su punta (el scout
  no tiene rama). Al final, una línea punteada roja sale del camp 1 hacia una carpeta `~/.ssh`: "puede leer".

### 4. Sentinel (27 - 39 s)

- Narración: "El commander no se queda mirando. Un sentinel, uno por máquina, consulta cada pane. Si un soldier
  termina o se traba, deja un wake durable en la cola, y un Stop hook despierta al commander."
- Texto: "El commander **no se queda mirando**." / "Un **sentinel**, uno por máquina, consulta cada pane." /
  "Si un soldier termina o se traba, deja un **wake** en la cola." / "Un Stop hook **despierta** al
  commander." + `vx sentinel await`.
- Se ve: el commander queda "en espera" (orbe tenue). El sentinel (orbe que escucha) barre con un radar por
  compás (suena un ping en cada barrido) y manda sondas a cada pane. El camp 1 termina: aparecen dos commits en
  su rama y un check; el scout entrega `reporte.md`. Un punto rojo "wake: camp 1 done" sube por su camino hasta
  el commander; golpe y anillo: el commander despierta. Se muestran los estados posibles: done, blocked,
  interrupted, unconfirmed.

### 5. Land (39 - 48 s)

- Narración: "Una mission está lista cuando hay un commit en su rama. El commander te pide aprobación, y
  vx land hace solo fast-forward: nunca fuerza ni rebasea."
- Texto: "Una mission está lista cuando hay un **commit** en su rama." / "Por defecto, el commander te pide
  **aprobación**." / "vx land: **solo fast-forward**." + "si la rama divergió o el checkout está sucio, se
  niega. Nunca fuerza."
- Se ve: una barrera ocre ("aprobación") cruza la rama. Burbujas: "commander: ¿aterrizo camp 1?" / "vos: sí".
  La barrera se levanta (golpe) y `main` avanza por la rama hasta el último commit, entintándola: un
  fast-forward, sin merge commit. El camp 1 se desarma: "strike: el camp vuelve al pool".

### 6. Ship (48 - 55,5 s)

- Narración: "¿PR real? vx ship: lint, tests y una revisión adversarial de una sesión nueva, sin el contexto
  del autor. Si pasa todo, abre el PR."
- Texto: "¿Querés un PR real?" + `vx ship <tarea>` / "Lint, tests y una **revisión adversarial**." + "la hace
  una sesión nueva, sin el contexto del autor" / "Si todo pasa, **abre el PR**."
- Se ve: la cámara baja por la rama de la otra mission: estaciones lint, tests, review (con su propio orbe
  resolviendo) y "PR abierto"; un punto avanza estación por estación y cada una se tilda en el golpe.

### 7. Cierre (55,5 - 60 s)

- Narración: "Supervisor, worktrees, eventos durables y un humano en el gate. Eso es vexillum."
- Texto: "Cuatro patrones, **un sistema**." / "**vexillum**" + "vx: un orquestador de agentes de IA".
- Se ve: la cámara se aleja hasta ver el mapa completo; caen cuatro sellos sobre él, uno por patrón:
  "supervisor / worker", "worktrees", "watcher + cola", "gate humano".

## Qué es seguro y qué está simplificado

Fuentes: `vx --help`, `vx dispatch --help`, `vx models`, `vx land --help`, `vx sentinel --help`,
`vx forum --help`, `vx ship --help`, `vx strike --help`, y la skill `vexillum` (SKILL.md, sentinel.md,
landing.md, shipping.md) más `.claude/rules/vexillum.md` del proyecto Ideaverse.

Seguro (dicho tal cual en la documentación):

- El commander no escribe código ni investiga: despacha soldiers con `vx dispatch` (mission o scout).
- Modelo y esfuerzo salen de una tabla de perfiles (`vx models`, `.vexillum/models.json`); los valores que se
  muestran son los perfiles por defecto.
- Cada soldier corre en un camp: un git worktree con rama `vexillum/<task-id>`, con una sesión real del harness
  (Claude Code por defecto) en un pane de herdr. No hay sandbox: el worktree limita dónde caen los commits,
  no lo que el proceso puede leer.
- Un solo sentinel por máquina (lock del kernel) consulta el estado en vivo de herdr de cada tarea en curso;
  cuando una se asienta (done, blocked, unconfirmed, interrupted) deja un wake durable en la cola del commander
  que la despachó; el Stop hook corre `vx sentinel await` y lo entrega. Cada wake se entrega una vez.
- Una mission se da por terminada solo si hay un commit en su rama; un scout entrega un reporte y no tiene
  nada que aterrizar.
- `vx land`: solo fast-forward; se niega si el checkout está sucio o la rama divergió; nunca fuerza ni
  rebasea; por defecto se pide aprobación al general (salvo modo yolo). Después del land, el camp se desarma
  (strike) y vuelve al pool.
- `vx ship`: lint, tests, revisión adversarial por una sesión nueva sin el contexto del autor y chequeo de
  docs; si algo falla no se pushea nada; si pasa, pushea y abre el PR con `gh`.

Simplificado a propósito:

- Tres camps son un ejemplo; los ids de tarea (`3f9a…`, `b71c…`) son inventados.
- La estación "docs" de `vx ship` no se dibuja (solo corre en proyectos Go). Lint y tests corren en proyectos
  Go o Node.
- El radar del sentinel es una metáfora del sondeo periódico; vexillum no usa un mecanismo de radar.
- `vx forum` (revisión visual de artifacts) existe pero queda fuera de este video.
