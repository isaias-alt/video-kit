import type { Frame } from '@engine/scene';
import { ease, prog } from '@engine/util';
import { Plate, W } from '../plate';
import { C, FONT, rr, text } from '../brand';
import { appear, mark } from './_ui';

export default class Outro extends Plate {
  body(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt, cx = W / 2;
    mark(c, cx, 347, 120, C.accent, prog(lt, 0.3, 1.1, ease.inOutCubic));
    appear(c, prog(lt, 0.7, 1.3, ease.outCubic), 16, () => text(c, 'vexillum', cx, 527, FONT.serif(110), C.text, 'center', 2));
    appear(c, prog(lt, 1.1, 1.7, ease.outCubic), 14, () => text(c, 'Talk to one. They all work.', cx, 603, FONT.italic(48), C.text2, 'center'));
    appear(c, prog(lt, 1.5, 2.1, ease.outCubic), 12, () => {
      const s = 'brew install isaias-alt/tap/vexillum', pw = 800;
      rr(c, cx - pw / 2, 652, pw, 66, 33);
      c.fillStyle = C.surface; c.fill();
      c.lineWidth = 1.5; c.strokeStyle = C.border; c.stroke();
      text(c, '$', cx - pw / 2 + 40, 695, FONT.mono(26, 700), C.accent);
      text(c, s, cx - pw / 2 + 80, 695, FONT.mono(26, 500), C.text);
    });
    appear(c, prog(lt, 1.9, 2.5), 8, () => text(c, 'vx.lucasco.dev/docs', cx, 774, FONT.mono(22, 500), C.bronze, 'center', 1));
  }
}
