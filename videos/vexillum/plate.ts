import type { Frame } from '@engine/scene';
import { ease, prog } from '@engine/util';
import { makePlate, W, H } from '@kit/plate';
import { C, loadBrandFonts } from './brand';

export { W, H };
const Base = makePlate({ bg: C.bg, loadFonts: loadBrandFonts, fade: 0.25 });

/**
 * Base for every plate of this video. Adds the "dynamic" layer: each plate plays faster (params.speed scales the
 * plate-local clock), enters with a short slide and keeps a slow push-in until it ends. Plates implement body().
 */
export abstract class Plate extends Base {
  abstract body(c: CanvasRenderingContext2D, f: Frame): void;

  draw(c: CanvasRenderingContext2D, f: Frame) {
    const speed = (this.ctx.params.speed as number | undefined) ?? 1;
    const dur = this.ctx.end - this.ctx.start;
    const slide = this.ctx.params.fadeIn === false ? 0 : 1 - prog(f.lt, 0, 0.55, ease.outCubic);
    const zoom = 1 + 0.035 * (f.lt / dur) + 0.02 * slide;
    c.save();
    c.translate(W / 2 + 70 * slide, H / 2);
    c.scale(zoom, zoom);
    c.translate(-W / 2, -H / 2);
    this.body(c, { ...f, lt: f.lt * speed });
    c.restore();
  }
}
