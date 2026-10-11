// 25-30s: the brand lands. Isotipo, wordmark, the landing's tagline, the three pillars.
import type { Frame } from '@engine/scene';
import { Plate, W } from './_plate';
import { C, FONT, TONES, logo, logoWidth, rr, text, type ToneKey } from './_brand';
import { ease, prog } from '@engine/util';

export default class Marca extends Plate {
  draw(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt, cx = W / 2;
    // logo + wordmark as one centred group
    const LH = 250, gap = 44;
    c.font = FONT.display(190, 700);
    const ww = c.measureText('NutriOne').width, gw = logoWidth(LH) + gap + ww, gx = cx - gw / 2;
    logo(c, gx, 250, LH, C.logo, prog(lt, 0.2, 1.3, ease.inOutCubic));
    const wA = prog(lt, 0.7, 1.4, ease.outCubic);
    c.save(); c.globalAlpha = wA; c.translate(0, (1 - wA) * 30);
    text(c, 'NutriOne', gx + logoWidth(LH) + gap, 250 + LH - 22, FONT.display(190, 700), C.ink);
    c.restore();

    // tagline
    const tA = prog(lt, 1.5, 2.2, ease.outCubic);
    c.save(); c.globalAlpha = tA; c.translate(0, (1 - tA) * 28);
    c.font = FONT.display(84, 600);
    const a = 'Tu consultorio, ', b = 'organizado.';
    const tw = c.measureText(a + b).width, tx = cx - tw / 2;
    text(c, a, tx, 650, FONT.display(84, 600), C.ink);
    text(c, b, tx + c.measureText(a).width, 650, FONT.display(84, 600), C.brand);
    c.restore();

    // pillars
    const chips: [string, ToneKey][] = [['Agenda', 'green'], ['Fichas', 'blue'], ['Planes', 'yellow']];
    const cw = 220, cg = 28, total = chips.length * cw + (chips.length - 1) * cg;
    chips.forEach(([label, k], i) => {
      const p = prog(lt, 2.4 + i * 0.18, 3.0 + i * 0.18, ease.outBack), tn = TONES[k];
      c.save(); c.translate(cx - total / 2 + i * (cw + cg) + cw / 2, 790); c.scale(p, p);
      rr(c, -cw / 2, -34, cw, 68, 34); c.fillStyle = tn.bg; c.fill();
      c.lineWidth = 2; c.strokeStyle = tn.border; c.stroke();
      text(c, label, 0, 10, FONT.sans(28, 600), tn.text, 'center');
      c.restore();
    });

    const fA = prog(lt, 3.5, 4.2);
    c.save(); c.globalAlpha = fA;
    text(c, 'nutrione.app', cx, 940, FONT.mono(26, 500), C.muted, 'center', 2);
    c.restore();
  }
}
