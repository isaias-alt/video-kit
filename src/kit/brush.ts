// Painterly layers with p5.js + p5.brush, deterministic. p5 is used as an offline painter, never per frame:
// a plate asks for a layer in init() (async), p5 paints it once with a fixed seed into its WEBGL canvas, and the
// pixels are copied to a plain 2D canvas the plate then composites every frame as a pure function of time.
// Why not paint per frame: p5's draw cycle is async (render() is sync) and a full brush pass costs 100+ ms.
// See docs/p5-brush-orbs.md.
import p5 from 'p5';

type Brush = typeof import('p5.brush');
export type PaintFn = (p: p5, brush: Brush) => void;

/** Side of the shared (square) p5 canvas: big enough for a full portrait or landscape frame. */
const SIDE = 2048;

let boot: Promise<{ p: p5; brush: Brush }> | null = null;
/** scaleBrushes() multiplies the brush registry in place (global state that outlives push/pop): track it. */
let scaleNow = 1;
let queue: Promise<unknown> = Promise.resolve();

function start() {
  boot ??= (async () => {
    // p5.brush registers its p5 addon (seeding, flush after draw) against the global p5 at import time.
    (globalThis as any).p5 = p5;
    const brush = await import('p5.brush');
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-99999px;top:0;pointer-events:none';
    document.body.appendChild(host);
    let p!: p5;
    await new Promise<void>((ready) => {
      p = new p5((s: p5) => {
        brush.instance(s);
        s.setup = () => {
          s.pixelDensity(1);
          s.createCanvas(SIDE, SIDE, s.WEBGL);
          s.noLoop();
          ready();
        };
        s.draw = () => {};
      }, host);
    });
    return { p, brush };
  })();
  return boot;
}

export interface LayerOptions {
  /** Painted first. Default white: layers meant for 'multiply' compositing (ink on paper). */
  bg?: string;
  /**
   * Size of the built-in brushes (brush.scaleBrushes), absolute: never call scaleBrushes inside fn. Default 1.
   * A power of two, so switching between layers multiplies the registry exactly and never drifts.
   */
  scale?: number;
}

/**
 * Paint a w x h layer (top-left origin, px) with p5.brush and return it as a 2D canvas.
 * `seed` fixes p5's and p5.brush's random and noise generators (pass { random, noise } to vary the strokes of
 * one composition while its vector fields stay put: a hand-drawn "boil"). The brush state (stroke, fill, hatch,
 * field) is pushed/popped around fn, so the same call always gives the same pixels whatever ran before it.
 */
export function paintLayer(w: number, h: number, seed: number | { random: number; noise: number }, fn: PaintFn, o: LayerOptions = {}): Promise<HTMLCanvasElement> {
  const rs = typeof seed === 'number' ? seed : seed.random, ns = typeof seed === 'number' ? seed : seed.noise;
  const job = queue.then(async () => {
    const { p, brush } = await start();
    if (w > SIDE || h > SIDE) throw new Error(`paintLayer: ${w}x${h} exceeds ${SIDE}`);
    const scale = o.scale ?? 1;
    if (!Number.isInteger(Math.log2(scale))) throw new Error(`paintLayer: scale ${scale} is not a power of two`);
    if (scale !== scaleNow) { brush.scaleBrushes(scale / scaleNow); scaleNow = scale; }
    (p as any).draw = () => {
      p.clear();
      p.background(o.bg ?? '#ffffff');
      p.randomSeed(rs);
      p.noiseSeed(ns);
      p.push();
      p.translate(-SIDE / 2, -SIDE / 2); // WEBGL origin is the centre
      fn(p, brush);
      p.pop();
    };
    await p.redraw();
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    out.getContext('2d')!.drawImage((p as any).canvas as HTMLCanvasElement, 0, 0, w, h, 0, 0, w, h);
    return out;
  });
  queue = job.catch(() => {});
  return job;
}
