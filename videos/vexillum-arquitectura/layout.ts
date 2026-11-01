// The architecture diagram as one world, in world units (1080 wide, ~1700 tall: it fits a 9:16 frame at zoom
// ~0.58). The camera travels it; every section is a framing of the same drawing, so cuts never lose the map.
import type { OrbState } from '@kit/orb';
import { ease, lerp, noise1, polylineLengths, type V2 } from '@engine/util';
import { C } from './brand';
import type { Cues } from './score';

export const GENERAL = { x: 540, y: 150 };
export const COMMANDER = { x: 540, y: 410, r: 135 };
export const CAMP_W = 250, CAMP_H = 280, CAMP_Y = 830;
export const SENTINEL = { x: 540, y: 1255, r: 105 };
export const MAIN_Y = 1610;
/** main runs left to right and ends at its tip, where both mission branches fork (so a land is a fast-forward). */
export const MAIN_X: [number, number] = [70, 540];
export const MAIN_COMMITS = [130, 250, 370, 540];

export interface Camp {
  x: number; kind: 'mission' | 'scout'; orb: OrbState; model: string; branch: string;
  color: string; wash: string;
}
// Profiles are the real defaults of `vx models` (mission-big = sonnet/high, scout-facts = haiku/low, default =
// sonnet/medium). Branch names are vexillum/<task-id>, shortened; the ids themselves are made up.
export const CAMPS: Camp[] = [
  { x: 190, kind: 'mission', orb: 'working', model: 'sonnet · high', branch: 'vexillum/3f9a…', color: C.lapis, wash: C.lapisWash },
  { x: 540, kind: 'scout', orb: 'searching', model: 'haiku · low', branch: 'sin rama', color: C.ochre, wash: C.ochreWash },
  { x: 890, kind: 'mission', orb: 'weaving', model: 'sonnet · medium', branch: 'vexillum/b71c…', color: C.lapis, wash: C.lapisWash },
];
export const campTop = CAMP_Y - CAMP_H / 2, campBottom = CAMP_Y + CAMP_H / 2;

/** Catmull-Rom through the control points: one dense polyline shared by the brush (painted) and Canvas2D. */
export function smooth(ctrl: [number, number][], n = 14): V2[] {
  const P = (i: number) => ctrl[Math.max(0, Math.min(ctrl.length - 1, i))]!;
  const out: V2[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0[0], p1[0], p2[0], p3[0]), y: f(p0[1], p1[1], p2[1], p3[1]) });
    }
  }
  const last = ctrl[ctrl.length - 1]!;
  out.push({ x: last[0], y: last[1] });
  return out;
}
const fork = MAIN_X[1];
/** Mission branches, from the fork on main up to their camp. */
export const LEFT_BRANCH = smooth([[fork, MAIN_Y], [536, 1545], [490, 1494], [330, 1482], [214, 1446], [192, 1380], [190, 1300], [190, campBottom]]);
export const RIGHT_BRANCH = smooth([[fork, MAIN_Y], [544, 1545], [590, 1494], [750, 1482], [866, 1446], [888, 1380], [890, 1300], [890, campBottom]]);
export const LEFT_LEN = polylineLengths(LEFT_BRANCH);
/** Commits the left mission made on its branch, bottom-up (they appear when it settles as done). */
export const LEFT_COMMITS = [1300, 1180];
/** The approval gate: a bar across the left branch, near the fork. */
export const GATE = { x: 380, y: 1484, h: 92 };
/** The commander's queue of wakes (avisos): the sentinel drops them here, the Stop hook delivers them. */
export const QUEUE = { x: 855, y: 430, w: 170, h: 84 };
/** Where a wake travels: out of the sentinel, up between camps 2 and 3, into the queue. */
export const WAKE_PATH: [number, number][] = [[600, 1170], [715, 1040], [715, 640], [800, QUEUE.y + QUEUE.h / 2 + 14]];

// ------------------------------------------------------------------ camera
export interface Cam { x: number; y: number; z: number }
/**
 * Camera keys in seconds: [t, x, y, zoom], placed on the cues (so they follow the recorded takes). Between keys
 * the camera eases (inOutCubic); two keys at the same time are a cut. The world point (x, y) sits at the centre of
 * the diagram band of the frame (stage.ts).
 */
function camKeys(c: Cues): [number, number, number, number][] {
  const k: [number, number, number, number][] = [
    [0, 540, 760, 0.8], [c.end[0], 540, 800, 0.86],
    [c.start[1], 540, 420, 1.35], [c.reparte, 540, 470, 1.25], [c.soldier, 540, 640, 1.0], [c.end[1], 540, 700, 0.98],
    [c.start[2], 190, 830, 1.7], [c.branch - 0.2, 260, 850, 1.5], [c.branch + 0.9, 540, 1150, 0.86], [c.ojo - 0.15, 520, 1120, 0.84],
    [c.ojo - 0.15, 300, 770, 1.25], [c.end[2], 330, 780, 1.15],
    [c.start[3], 540, 1050, 0.9], [c.done, 560, 1000, 0.9], [c.done + 1.0, 620, 780, 0.8], [c.end[3], 620, 760, 0.82],
    [c.start[4], 330, 1390, 1.3], [c.ff, 330, 1420, 1.3], [c.ff + 1.2, 260, 1250, 1.15], [c.end[4], 300, 1150, 1.0],
    [c.start[5], 540, 1000, 0.85], [c.end[5], 540, 960, 0.6],
  ];
  // a very fast read could put a word cue before the previous key: never let time run backwards
  for (let i = 1; i < k.length; i++) k[i]![0] = Math.max(k[i]![0], k[i - 1]![0]);
  return k;
}

export function camAt(c: Cues, t: number, kick: number): Cam {
  const KEYS = camKeys(c);
  let i = 0;
  while (i < KEYS.length - 1 && KEYS[i + 1]![0] <= t) i++;
  const a = KEYS[i]!, b = KEYS[Math.min(i + 1, KEYS.length - 1)]!;
  const k = b[0] > a[0] ? ease.inOutCubic(Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0])))) : 0;
  // handheld drift and a small push on every kick
  const drift = 6;
  return {
    x: lerp(a[1], b[1], k) + noise1(t * 0.35, 11) * drift,
    y: lerp(a[2], b[2], k) + noise1(t * 0.3, 12) * drift,
    z: lerp(a[3], b[3], k) * (1 + 0.012 * kick),
  };
}
