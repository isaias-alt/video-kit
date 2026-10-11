// Example plate. Rules: draw() is a pure function of f (time) and nothing else; lay out from W and H so
// the same plate works in 1920x1080 and 1080x1920 (or write a v-<name>.ts plate for portrait, see timeline.ts).
import type { Frame } from '@engine/scene';
import { ease, prog } from '@engine/util';
import { Plate, W, H } from '../plate';
import { C, FONT, card, text } from '../brand';

export default class Hello extends Plate {
  draw(c: CanvasRenderingContext2D, f: Frame) {
    const p = prog(f.lt, 0.2, 1.0, ease.outCubic);
    const w = Math.min(W - 160, 900), h = 360;
    c.save();
    c.globalAlpha = p;
    c.translate(0, (1 - p) * 40);
    card(c, (W - w) / 2, (H - h) / 2, w, h, { r: 32 });
    text(c, 'Hello, video-kit', W / 2, H / 2 + 14, FONT.sans(Math.min(96, w / 9), 700), C.ink, 'center');
    text(c, `t = ${f.t.toFixed(2)} s`, W / 2, H / 2 + 90, FONT.sans(32), C.muted, 'center');
    c.restore();
  }
}
