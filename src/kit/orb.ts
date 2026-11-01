// thinking-orbs (Jakub Antalik, MIT) drawn as a pure function of time. The package's React component runs its
// own clock (performance.now); its framework-free `thinking-orbs/engine` exposes the same geometry
// (MODE_FRAMES: (size, t, opts) -> dots) and painter (paintFrame), which is all a video needs.
import { MODE_FRAMES, paintFrame, resolvePreset, type OrbState } from 'thinking-orbs/engine';

export type { OrbState };

export interface OrbOptions {
  /** Diameter on screen, px. The orb is drawn with the 64 px preset and scaled. */
  d: number;
  /** Ink colour (#rrggbb). Omit for the stock grayscale ink. */
  color?: string;
  /** Light ink for dark backgrounds. Default false (dark ink, for paper). */
  dark?: boolean;
  /** Multiplier on the preset's own speed (the component's `speed` prop). */
  speed?: number;
  alpha?: number;
}

const presets = new Map<OrbState, ReturnType<typeof resolvePreset>>();
const tints = new Map<string, { r: number; g: number; b: number }>();

function tint(hex?: string) {
  if (!hex) return undefined;
  let v = tints.get(hex);
  if (!v) {
    const n = parseInt(hex.slice(1), 16);
    v = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    tints.set(hex, v);
  }
  return v;
}

/** Draw a thinking orb centred at (x, y) at song time t (seconds). Deterministic: same t, same dots. */
export function drawOrb(c: CanvasRenderingContext2D, state: OrbState, x: number, y: number, t: number, o: OrbOptions) {
  let pr = presets.get(state);
  if (!pr) { pr = resolvePreset(state, 64); presets.set(state, pr); }
  const k = o.d / 64;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.translate(x - o.d / 2, y - o.d / 2);
  c.scale(k, k);
  paintFrame(c, MODE_FRAMES[pr.mode](64, t * pr.speed * (o.speed ?? 1), pr.opts), o.dark ?? false, tint(o.color));
  c.restore();
}
