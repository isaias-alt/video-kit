// Vertical 25-30s: the brand lands, stacked and centred.
import type { Frame } from '@engine/scene';
import { Plate, W } from './_plate';
import { C, FONT, TONES, logo, logoWidth, rr, text, type ToneKey } from './_brand';
import { ease, prog } from '@engine/util';

export default class VMarca extends Plate {
  draw(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt, cx = W / 2;
    const LH = 340;
    logo(c, cx - logoWidth(LH) / 2, 380, LH, C.logo, prog(lt, 0.2, 1.3, ease.inOutCubic));
    const wA = prog(lt, 0.7, 1.4, ease.outCubic);
    c.save(); c.globalAlpha = wA; c.translate(0, (1 - wA) * 30);
    text(c, 'NutriOne', cx, 880, FONT.display(150, 700), C.ink, 'center');
    c.restore();

    const tA = prog(lt, 1.5, 2.2, ease.outCubic);
    c.save(); c.globalAlpha = tA; c.translate(0, (1 - tA) * 28);
    text(c, 'Tu consultorio,', cx, 1090, FONT.display(88, 600), C.ink, 'center');
    text(c, 'organizado.', cx, 1196, FONT.display(88, 600), C.brand, 'center');
    c.restore();

    const chips: [string, ToneKey][] = [['Agenda', 'green'], ['Fichas', 'blue'], ['Planes', 'yellow']];
    const cw = 250, cg = 24, total = chips.length * cw + (chips.length - 1) * cg;
    chips.forEach(([label, k], i) => {
      const p = prog(lt, 2.4 + i * 0.18, 3.0 + i * 0.18, ease.outBack), tn = TONES[k];
      c.save(); c.translate(cx - total / 2 + i * (cw + cg) + cw / 2, 1340); c.scale(p, p);
      rr(c, -cw / 2, -36, cw, 72, 36); c.fillStyle = tn.bg; c.fill();
      c.lineWidth = 2; c.strokeStyle = tn.border; c.stroke();
      text(c, label, 0, 11, FONT.sans(30, 600), tn.text, 'center');
      c.restore();
    });

    c.save(); c.globalAlpha = prog(lt, 3.5, 4.2);
    text(c, 'nutrione.app', cx, 1480, FONT.mono(28, 500), C.muted, 'center', 2);
    c.restore();
  }
}
