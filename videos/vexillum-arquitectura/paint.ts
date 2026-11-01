// Everything p5.brush paints for this video, once, at init (see src/kit/brush.ts): the diagram's ink-and-wash
// sprites (world units, painted at 2 px per unit so close-ups stay sharp) and the backdrops (screen px).
// Sprites are painted on white and composited with 'multiply', like ink on paper.
import { paintLayer } from '@kit/brush';
import { mulberry32 } from '@engine/util';
import { C } from './brand';
import type { SectionId } from './score';
import {
  CAMPS, CAMP_H, CAMP_W, COMMANDER, GATE, GENERAL, LEFT_BRANCH, MAIN_X, MAIN_Y, RIGHT_BRANCH, SENTINEL, STATIONS, STATION_W,
  WAKE_PATH, campBottom, campTop,
} from './layout';

/** A painted image placed in world units. */
export interface Sprite { x: number; y: number; w: number; h: number; img: HTMLCanvasElement }

const SS = 2; // sprite px per world unit
type Brush = Parameters<Parameters<typeof paintLayer>[3]>[1];
type Pt = [number, number];

/** Paint a sprite covering the world box (x, y, w, h); fn draws in world units through `at`. */
async function sprite(seed: number, x: number, y: number, w: number, h: number, fn: (b: Brush, at: (px: number, py: number) => Pt, rnd: () => number) => void): Promise<Sprite> {
  const img = await paintLayer(Math.ceil(w * SS), Math.ceil(h * SS), seed, (p, b) => {
    fn(b, (px, py) => [(px - x) * SS, (py - y) * SS], () => p.random());
  }, { scale: 2 });
  return { x, y, w, h, img };
}
const bbox = (pts: Pt[], m: number): [number, number, number, number] => {
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const x0 = Math.min(...xs) - m, y0 = Math.min(...ys) - m;
  return [x0, y0, Math.max(...xs) + m - x0, Math.max(...ys) + m - y0];
};

function arrowLine(b: Brush, at: (x: number, y: number) => Pt, pts: Pt[], curve = 0.5) {
  b.spline(pts.map(([x, y]) => at(x, y)), curve);
  const [x1, y1] = pts[pts.length - 1]!, [x0, y0] = pts[pts.length - 2]!;
  const a = Math.atan2(y1 - y0, x1 - x0), L = 16;
  for (const s of [-1, 1]) b.line(...at(x1, y1), ...at(x1 - Math.cos(a + s * 0.45) * L, y1 - Math.sin(a + s * 0.45) * L));
}

function washRect(b: Brush, at: (x: number, y: number) => Pt, x: number, y: number, w: number, h: number, wash: string, opacity: number, ink = C.ink) {
  b.noStroke();
  b.fillBleed(0.12);
  b.fillTexture(0.55, 0.45);
  b.fill(wash, opacity);
  b.rect(...at(x, y), w * SS, h * SS);
  b.noFill();
  b.set('rotring', ink, 1);
  b.rect(...at(x, y), w * SS, h * SS);
}

export interface WorldSprites {
  general: Sprite; talk: Sprite; halo: Sprite; dispatch: Sprite[]; camps: Sprite[];
  main: Sprite; branchL: Sprite; branchR: Sprite; sentinel: Sprite; wake: Sprite;
  gatePosts: Sprite; gateBar: Sprite; stations: Sprite[]; report: Sprite; host: Sprite;
}

let world: Promise<WorldSprites> | null = null;
/** The diagram's sprites (painted once per page, shared by every plate). */
export function worldSprites(): Promise<WorldSprites> {
  world ??= (async () => {
    const general = await sprite(101, GENERAL.x - 70, GENERAL.y - 70, 140, 150, (b, at) => {
      b.noStroke(); b.fillTexture(0.4, 0.5); b.fill(C.ochreWash, 120);
      b.circle(...at(GENERAL.x, GENERAL.y - 28), 24 * SS, 0.2);
      b.noFill();
      b.set('rotring', C.ink, 1.1);
      b.circle(...at(GENERAL.x, GENERAL.y - 28), 24 * SS, 0.2);
      b.spline([[-38, 48], [-26, 14], [0, 6], [26, 14], [38, 48]].map(([dx, dy]) => at(GENERAL.x + dx!, GENERAL.y + dy!)), 0.7);
    });
    const talkPts: Pt[] = [[GENERAL.x, GENERAL.y + 58], [GENERAL.x, COMMANDER.y - COMMANDER.r - 12]];
    const talk = await sprite(102, ...bbox(talkPts, 24), (b, at) => { b.set('pen', C.ink, 1.1); arrowLine(b, at, talkPts, 0); });
    const R = COMMANDER.r;
    const halo = await sprite(103, COMMANDER.x - R - 30, COMMANDER.y - R - 30, 2 * R + 60, 2 * R + 60, (b, at) => {
      b.noStroke(); b.fillBleed(0.2); b.fillTexture(0.6, 0.6); b.fill(C.lapisWash, 85);
      b.circle(...at(COMMANDER.x, COMMANDER.y), R * SS, 0.25);
      b.noFill();
      b.set('rotring', C.ink, 1.2);
      b.circle(...at(COMMANDER.x, COMMANDER.y), (R - 6) * SS, 0.15);
    });
    const dispatch = await Promise.all(CAMPS.map((cp, i) => {
      const pts: Pt[] = [[COMMANDER.x + (cp.x - COMMANDER.x) * 0.25, COMMANDER.y + R + 6], [(COMMANDER.x + cp.x) / 2, (COMMANDER.y + R + campTop) / 2 + 8], [cp.x, campTop - 10]];
      return sprite(110 + i, ...bbox(pts, 30), (b, at) => { b.set('pen', C.ink, 1.2); arrowLine(b, at, pts, 0.6); });
    }));
    const camps = await Promise.all(CAMPS.map((cp, i) => {
      const x = cp.x - CAMP_W / 2, y = campTop, d = 14;
      return sprite(120 + i, x - 20, y - 20, CAMP_W + 40 + d, CAMP_H + 40 + d, (b, at) => {
        // hatched drop shadow on the right and bottom: a sheet lifted off the paper
        b.noStroke();
        b.hatch(7 * SS, Math.PI / 4, { rand: 0.15 });
        b.hatchStyle('rotring', C.ink, 0.5);
        b.polygon(([[x + CAMP_W, y + d], [x + CAMP_W + d, y + d], [x + CAMP_W + d, y + CAMP_H + d], [x + d, y + CAMP_H + d], [x + d, y + CAMP_H], [x + CAMP_W, y + CAMP_H]] as Pt[]).map(([px, py]) => at(px, py)));
        b.noHatch();
        washRect(b, at, x, y, CAMP_W, CAMP_H, cp.wash, 70);
        // the pane's title bar
        b.set('pen', C.ink, 0.7);
        b.line(...at(x + 10, y + 40), ...at(x + CAMP_W - 10, y + 40));
      });
    }));
    const main = await sprite(130, MAIN_X[0] - 30, MAIN_Y - 30, MAIN_X[1] - MAIN_X[0] + 60, 60, (b, at) => {
      b.set('rotring', C.ink, 3.2);
      b.line(...at(MAIN_X[0], MAIN_Y), ...at(MAIN_X[1], MAIN_Y));
    });
    const branch = (seed: number, path: { x: number; y: number }[]) => {
      const pts = path.map((q) => [q.x, q.y] as Pt);
      return sprite(seed, ...bbox(pts, 24), (b, at) => { b.set('rotring', C.ink, 1.8); b.spline(pts.map(([x, y]) => at(x, y)), 0); });
    };
    const branchL = await branch(131, LEFT_BRANCH), branchR = await branch(132, RIGHT_BRANCH);
    const S = SENTINEL;
    const sentinel = await sprite(140, S.x - S.r - 30, S.y - S.r - 30, 2 * S.r + 60, 2 * S.r + 60, (b, at) => {
      b.noStroke(); b.fillBleed(0.15); b.fillTexture(0.5, 0.6); b.fill(C.vermWash, 70);
      b.circle(...at(S.x, S.y), S.r * SS, 0.2);
      b.noFill();
      b.hatch(9 * SS, -0.6, { rand: 0.1 });
      b.hatchStyle('rotring', C.vermilion, 0.4);
      b.circle(...at(S.x, S.y), (S.r - 4) * SS, 0.1);
      b.noHatch();
      b.set('rotring', C.vermilion, 1.2);
      b.circle(...at(S.x, S.y), (S.r - 2) * SS, 0.15);
    });
    const wake = await sprite(141, ...bbox(WAKE_PATH, 30), (b, at) => { b.set('HB', C.vermilion, 1.4); arrowLine(b, at, WAKE_PATH, 0.7); });
    // the gate: a post above the branch and a striped bar hanging across it (it swings up to open)
    const g = GATE, top = g.y - g.h / 2;
    const gatePosts = await sprite(150, g.x - 30, top - 40, 60, 60, (b, at) => {
      b.noStroke(); b.fillTexture(0.3, 0.5); b.fill(C.ink, 200);
      b.circle(...at(g.x, top - 8), 9 * SS, 0.2);
      b.set('marker', C.ink, 1.2);
      b.line(...at(g.x - 22, top - 8), ...at(g.x + 22, top - 8));
    });
    const gateBar = await sprite(151, g.x - 16, top - 10, 32, g.h + 20, (b, at) => {
      washRect(b, at, g.x - 8, top, 16, g.h, C.ochre, 200);
      b.noStroke(); b.hatch(10 * SS, Math.PI / 4); b.hatchStyle('marker', C.ink, 0.5);
      b.rect(...at(g.x - 8, top), 16 * SS, g.h * SS);
      b.noHatch();
    });
    const stations = await Promise.all(STATIONS.map((s, i) => {
      const x = CAMPS[2]!.x - STATION_W / 2, y = s.y - s.h / 2;
      const wash = s.label === 'review' ? C.vermWash : s.label === 'PR' ? C.mossWash : C.lapisWash;
      return sprite(160 + i, x - 20, y - 20, STATION_W + 40, s.h + 40, (b, at) => washRect(b, at, x, y, STATION_W, s.h, wash, s.label === 'review' ? 60 : 45));
    }));
    const rx = CAMPS[1]!.x - 80, ry = campBottom + 62;
    const report = await sprite(170, rx - 50, ry - 56, 100, 112, (b, at) => {
      b.noStroke(); b.fillTexture(0.3, 0.3); b.fill(C.ochreWash, 90);
      b.polygon(([[rx - 28, ry - 36], [rx + 16, ry - 36], [rx + 28, ry - 24], [rx + 28, ry + 36], [rx - 28, ry + 36]] as Pt[]).map(([px, py]) => at(px, py)));
      b.noFill();
      b.set('pen', C.ink, 0.9);
      b.polygon(([[rx - 28, ry - 36], [rx + 16, ry - 36], [rx + 28, ry - 24], [rx + 28, ry + 36], [rx - 28, ry + 36]] as Pt[]).map(([px, py]) => at(px, py)));
      b.set('HB', C.ink, 0.8);
      for (let k = 0; k < 4; k++) b.line(...at(rx - 18, ry - 14 + k * 13), ...at(rx + (k === 3 ? 4 : 18), ry - 14 + k * 13));
    });
    const hx = 92, hy = campTop - 118;
    const host = await sprite(171, hx - 60, hy - 50, 120, 100, (b, at) => {
      b.noStroke(); b.fillTexture(0.3, 0.3); b.fill(C.vermWash, 90);
      const folder: Pt[] = [[hx - 40, hy - 26], [hx - 12, hy - 26], [hx - 4, hy - 16], [hx + 40, hy - 16], [hx + 40, hy + 28], [hx - 40, hy + 28]];
      b.polygon(folder.map(([px, py]) => at(px, py)));
      b.noFill();
      b.set('pen', C.vermilion, 1);
      b.polygon(folder.map(([px, py]) => at(px, py)));
    });
    return { general, talk, halo, dispatch, camps, main, branchL, branchR, sentinel, wake, gatePosts, gateBar, stations, report, host };
  })();
  return world;
}

// ------------------------------------------------------------------ screen-space layers

let paper: Promise<HTMLCanvasElement> | null = null;
/** The opaque paper every frame starts from: a few very light watercolour blooms. */
export function paperLayer(W: number, H: number) {
  paper ??= paintLayer(W, H, 7, (p, b) => {
    b.noStroke(); b.fillBleed(0.35); b.fillTexture(0.7, 0.25);
    const blooms: [number, number, number, string][] = [[0.15, 0.12, 0.38, C.graphite], [0.9, 0.42, 0.33, C.lapisWash], [0.2, 0.78, 0.42, C.ochreWash], [0.85, 0.95, 0.3, C.graphite]];
    for (const [x, y, r, col] of blooms) { b.fill(col, 22); b.circle(x * W, y * H, r * Math.min(W, H), 0.9); }
  }, { bg: C.paper, scale: 2 });
  return paper;
}

// One vector field per section: the backdrop's pencil strokes follow it.
const FIELD: Record<SectionId, string> = {
  hook: 'spiral', commander: 'curved', soldiers: 'zigzag', camps: 'columns', sentinel: 'waves', land: 'seabed', ship: 'columns', outro: 'hand',
};
const TINT: Record<SectionId, string> = {
  hook: C.lapisWash, commander: C.lapisWash, soldiers: C.lapisWash, camps: C.ochreWash, sentinel: C.vermWash, land: C.ochreWash, ship: C.mossWash, outro: C.lapisWash,
};
export const BOIL = 3;
const sectionMemo = new Map<SectionId, Promise<HTMLCanvasElement[]>>();
/**
 * A section's backdrop, BOIL variants of one composition: same strokes, same field, different brush grain
 * (only the random seed changes). The plate cycles them on the eighth notes, so the paper "boils" in tempo.
 */
export function sectionLayers(id: SectionId, W: number, H: number) {
  let m = sectionMemo.get(id);
  if (!m) {
    const k = Object.keys(FIELD).indexOf(id);
    m = Promise.all(Array.from({ length: BOIL }, (_, v) => paintLayer(W, H, { random: 1000 + k * 10 + v, noise: 500 + k }, (p, b) => {
      const r = mulberry32(77 + k); // the composition: identical in every variant
      b.noStroke(); b.fillBleed(0.3); b.fillTexture(0.65, 0.35);
      b.fill(TINT[id], 48);
      b.circle((r() < 0.5 ? 0.12 : 0.88) * W, (0.15 + r() * 0.7) * H, (0.22 + r() * 0.12) * W * 1.4, 0.8);
      b.field(FIELD[id]);
      for (let i = 0; i < 64; i++) {
        const x = (r() * 1.2 - 0.1) * W, y = (r() * 1.1 - 0.05) * H, len = (0.25 + r() * 0.55) * W;
        b.set(i % 3 === 0 ? '2B' : 'HB', C.graphite, 0.8 + r() * 0.8);
        b.flowLine(x, y, len, r() < 0.5 ? 0 : Math.PI);
      }
      b.noField();
    }, { scale: 2 })));
    sectionMemo.set(id, m);
  }
  return m;
}

let card: Promise<HTMLCanvasElement> | null = null;
/** The caption card's hand-drawn border and wash (multiply over a flat card fill). */
export function cardLayer(w: number, h: number) {
  card ??= paintLayer(w, h, 9, (p, b) => {
    b.noStroke(); b.fillTexture(0.4, 0.6); b.fillBleed(0.05); b.fill(C.ochreWash, 26);
    b.rect(10, 10, w - 20, h - 20);
    b.noFill();
    b.set('rotring', C.ink, 0.9);
    b.rect(12, 12, w - 24, h - 24);
  }, { scale: 2 });
  return card;
}

let marker: Promise<HTMLCanvasElement> | null = null;
/** A watercolour highlighter swipe, stretched under emphasised words. */
export function markerLayer() {
  marker ??= paintLayer(640, 120, 13, (p, b) => {
    b.noStroke(); b.fillBleed(0.08, 'out', 0); b.fillTexture(0.5, 0.7);
    b.fill(C.ochreWash, 170);
    b.polygon([[18, 30], [622, 22], [628, 96], [10, 100]]);
  }, { scale: 2 });
  return marker;
}
