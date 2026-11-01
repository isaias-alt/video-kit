// The score: the six voice takes of the official script set the edit; everything else hangs from them.
// - A take lasts as long as its WAV (voz/toma-0N.wav) once recorded; until then, the middle of the script's range.
//   audio/beat.ts measures them and writes them into data/audio.json "sections"; timeline.ts feeds them back here
//   with setTakes(), so the picture and the beat always use the same numbers.
// - Inside a take, things happen on words: word(take, 'sentinel') estimates when that word is said, from its
//   position in the text (with longer weights for the pauses the script asks for at '.', ',' and ':').
// - The beat (160 BPM, half-time feel) restarts its bar at every take, so each cut lands on a downbeat.
export const BPM = 160;
export const BEAT = 60 / BPM; // 0.375 s
export const BAR = 4 * BEAT; // 1.5 s
/** Silence the script asks for at the start and end of every take (it stays in: it is the breath between cuts). */
export const PAD = 0.4;

export interface Take { id: string; text: string; range: [number, number] }
// Texts are verbatim from ~/Desktop/Ideaverse/00-Inbox/guion-video-vexillum-arquitectura.md.
export const TAKES: Take[] = [
  { id: 'toma-01', range: [7, 9], text: 'Varios agentes programando a la vez. Ninguno mergea solo. Esto es vexillum. Cuatro piezas: commander, soldiers, camps y sentinel.' },
  { id: 'toma-02', range: [10, 13], text: 'El commander no escribe código. Solo reparte. Cada tarea va a un soldier: otra sesión de agente, en su propio panel de terminal. Supervisor-worker: quien coordina, no ejecuta.' },
  { id: 'toma-03', range: [9, 12], text: 'Cada soldier trabaja en un camp: un git worktree con su propia rama. Así no se pisan archivos. Pero ojo: aísla el historial, no el proceso.' },
  { id: 'toma-04', range: [11, 14], text: 'Despachar no bloquea. El sentinel sondea a cada soldier en segundo plano. Si uno termina o se bloquea, despierta al commander. Por dentro es polling. Para el commander, es un evento.' },
  { id: 'toma-05', range: [10, 13], text: 'Por defecto, nada llega a la rama base sin aprobación humana. Y el land es solo fast-forward: si la rama divergió, se niega. No fuerza, no hace rebase.' },
  { id: 'toma-06', range: [6, 8], text: 'Supervisor-worker, aislamiento por worktree, watcher por eventos y gate humano. Patrones clásicos, aplicados a agentes de IA.' },
];
/** Placeholder length of a take with no recording yet: the middle of the script's range. */
export const estimate = (t: Take) => (t.range[0] + t.range[1]) / 2;

let durs = TAKES.map(estimate);
let starts = [0];
let version = 0;
function layout() {
  starts = [0];
  for (let i = 0; i < durs.length - 1; i++) starts.push(starts[i]! + durs[i]!);
  version++;
}
layout();
/** Set the real take lengths (seconds). Called once at boot (timeline.ts) and by the beat generator. */
export function setTakes(d: number[]) {
  if (d.length !== TAKES.length) throw new Error(`expected ${TAKES.length} takes, got ${d.length}`);
  durs = d.slice();
  layout();
}
export const takeVersion = () => version;
export const duration = () => starts[starts.length - 1]! + durs[durs.length - 1]!;
export const take = (i: number) => ({ start: starts[i]!, end: starts[i]! + durs[i]!, dur: durs[i]! });

const PAUSE: Record<string, number> = { '.': 9, ',': 4, ':': 11 };
/**
 * When word `w` starts in take i (seconds, absolute): its share of the spoken part of the take, by characters
 * plus pauses. An estimate, good to a few tenths with a steady read; replace with forced alignment if needed.
 */
export function word(i: number, w: string, nth = 1): number {
  const text = TAKES[i]!.text;
  let at = -1;
  for (let k = 0; k < nth; k++) {
    const re = new RegExp(`(^|[\\s¿¡])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}-])`, 'gu');
    re.lastIndex = at + 1;
    const m = re.exec(text);
    if (!m) throw new Error(`word "${w}" (#${nth}) not in ${TAKES[i]!.id}`);
    at = m.index + m[1]!.length;
  }
  const weight = (s: string) => [...s].reduce((a, ch) => a + 1 + (PAUSE[ch] ?? 0), 0);
  const { start, dur } = take(i);
  return start + PAD + ((dur - 2 * PAD) * weight(text.slice(0, at))) / weight(text);
}

/** The beat's bar restarts at each take: the bar index inside take i at absolute time t. */
export const barIn = (i: number, t: number) => (t - take(i).start) / BAR;
/** Which take plays at t. */
export function takeAt(t: number) {
  for (let i = TAKES.length - 1; i >= 0; i--) if (t >= starts[i]!) return i;
  return 0;
}

function computeCues() {
  const s = (i: number) => take(i).start, e = (i: number) => take(i).end;
  const c = {
    hookEnd: word(0, 'Esto'),
    noneMerges: word(0, 'Ninguno'),
    pieces: [word(0, 'commander'), word(0, 'soldiers'), word(0, 'camps'), word(0, 'sentinel')] as const,
    reparte: word(1, 'reparte'),
    soldier: word(1, 'soldier'),
    panel: word(1, 'panel'),
    supervisor: word(1, 'Supervisor-worker'),
    worktree: word(2, 'worktree'),
    branch: word(2, 'rama'),
    noStep: word(2, 'pisan'),
    ojo: word(2, 'ojo'),
    historial: word(2, 'historial'),
    sondea: word(3, 'sondea'),
    done: word(3, 'termina'),
    blocked: word(3, 'bloquea', 2),
    awake: word(3, 'despierta'),
    polling: word(3, 'polling'),
    evento: word(3, 'evento'),
    gate: s(4) + 0.2,
    ask: word(4, 'aprobación'),
    approve: word(4, 'aprobación') + 0.7,
    ff: word(4, 'fast-forward'),
    refuses: word(4, 'si'),
    noForce: word(4, 'No'),
    stamps: [word(5, 'Supervisor-worker'), word(5, 'aislamiento'), word(5, 'watcher'), word(5, 'gate')] as const,
    title: Math.max(word(5, 'Patrones'), e(5) - 2.6),
    start: TAKES.map((_, i) => s(i)),
    end: TAKES.map((_, i) => e(i)),
  };
  return c;
}
let cueMemo: { v: number; c: ReturnType<typeof computeCues> } | null = null;
/** Cues in absolute seconds, derived from the takes (memoised per setTakes). */
export function cues() {
  if (!cueMemo || cueMemo.v !== version) cueMemo = { v: version, c: computeCues() };
  return cueMemo.c;
}
export type Cues = ReturnType<typeof cues>;

/** Seconds where the beat lands an impact: every cut, plus the turns of the story. */
export function hits() {
  const c = cues();
  return [...c.start, c.hookEnd, c.awake, c.approve, c.ff, c.title];
}
/** Seconds with a short bright accent: things appearing as they are named. */
export function ticks() {
  const c = cues();
  return [c.noneMerges, ...c.pieces, c.reparte, c.soldier, c.worktree, c.branch, c.ojo, c.done, c.blocked, c.ask, ...c.stamps];
}
