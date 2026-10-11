// Small shared UI pieces for the plates.
import { C, FONT, TONES, text, type ToneKey } from './_brand';
import { ease, prog } from '@engine/util';

export interface Heading { from: number; to: number; eyebrow: string; tone: ToneKey; lines: string[]; accent?: number }

/**
 * Top-left heading: a mono eyebrow and a Fraunces title. Each phase slides in line by line at `from`
 * and out at `to`. `accent` is the index of the line drawn in the tone colour.
 */
export function heading(c: CanvasRenderingContext2D, lt: number, phases: Heading[], x = 140, y = 150, size = 76) {
  for (const h of phases) {
    const inn = (i: number) => prog(lt, h.from + i * 0.12, h.from + 0.6 + i * 0.12, ease.outCubic);
    const out = prog(lt, h.to - 0.35, h.to, ease.inCubic);
    if (lt < h.from || lt > h.to) continue;
    const tone = TONES[h.tone];
    c.save();
    c.globalAlpha = inn(0) * (1 - out);
    text(c, h.eyebrow, x, y, FONT.mono(22, 500), tone.text, 'left', 4);
    c.restore();
    h.lines.forEach((s, i) => {
      c.save();
      c.globalAlpha = inn(i + 1) * (1 - out);
      const dy = (1 - inn(i + 1)) * 36 - out * 24;
      text(c, s, x, y + 78 + i * (size * 1.08) + dy, FONT.display(size, 600), i === (h.accent ?? -1) ? tone.text : C.ink);
      c.restore();
    });
  }
}

/** Number tween formatted with a fixed number of decimals and a comma (es). */
export const num = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
