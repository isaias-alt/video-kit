// The architecture diagram as one world, in world units (1080 wide, ~1700 tall: it fits a 9:16 frame at zoom
// ~0.58). The camera travels it; every section is a framing of the same drawing, so cuts never lose the map.
import type { OrbState } from '@kit/orb';
import { ease, lerp, noise1, polylineLengths, type V2 } from '@engine/util';
import { C } from './brand';
import { CUE } from './score';

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
/** `vx ship` stations on the right mission's branch. */
export const STATIONS = [
  { label: 'lint', y: 1055, h: 70 },
  { label: 'tests', y: 1145, h: 70 },
  { label: 'review', y: 1262, h: 120 },
  { label: 'PR', y: 1392, h: 84 },
];
export const STATION_W = 180;
/** Where the wake travels: out of the sentinel, up between camps 2 and 3, into the commander. */
export const WAKE_PATH: [number, number][] = [[600, 1170], [715, 1040], [715, 640], [640, 500]];

// ------------------------------------------------------------------ camera
export interface Cam { x: number; y: number; z: number }
/**
 * Camera keys in bars: [bar, x, y, zoom]. Between keys the camera eases (inOutCubic); two keys on the same bar
 * are a cut. The world point (x, y) sits at the centre of the diagram band of the frame (see view()).
 */
const KEYS: [number, number, number, number][] = [
  [0, 540, 420, 2.5], [1, 540, 420, 2.85], // hook: tight on the commander...
  [1, 540, 900, 0.6], [2, 540, 880, 0.64], // ...cut wide: the whole system already running
  [2, 540, 250, 1.55], [3.5, 540, 300, 1.45], [5.5, 540, 360, 1.3],
  [6, 540, 600, 1.1], [8, 540, 720, 1.05], [11, 540, 760, 1.0],
  [11, 190, 820, 1.85], [12.75, 260, 840, 1.6], [13.25, 540, 1150, 0.86], [16, 520, 1120, 0.84], [16.01, 300, 770, 1.25], [18, 330, 780, 1.15],
  [18, 540, 1150, 0.95], [21, 470, 1150, 1.0], [22.25, 540, 1050, 0.92], [23.9, 560, 520, 1.25], [24.2, 540, 900, 0.78], [26, 540, 1000, 0.8],
  [26, 300, 1390, 1.35], [29.5, 330, 1420, 1.35], [30.75, 260, 1250, 1.2], [32, 300, 1100, 0.95],
  [32, 820, 1040, 1.35], [34.25, 820, 1180, 1.35], [36, 800, 1320, 1.25], [37, 780, 1340, 1.15],
  [37, 540, 1000, 0.85], [40, 540, 930, 0.58],
];

export function camAt(bar: number, t: number, kick: number): Cam {
  let i = 0;
  while (i < KEYS.length - 1 && KEYS[i + 1]![0] <= bar) i++;
  const a = KEYS[i]!, b = KEYS[Math.min(i + 1, KEYS.length - 1)]!;
  const k = b[0] > a[0] ? ease.inOutCubic(Math.min(1, Math.max(0, (bar - a[0]) / (b[0] - a[0])))) : 0;
  // handheld drift and a small push on every kick
  const drift = 6;
  return {
    x: lerp(a[1], b[1], k) + noise1(t * 0.35, 11) * drift,
    y: lerp(a[2], b[2], k) + noise1(t * 0.3, 12) * drift,
    z: lerp(a[3], b[3], k) * (1 + 0.012 * kick),
  };
}

export { CUE };
