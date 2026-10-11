import type { Frame } from '@engine/scene';
import { ease, prog } from '@engine/util';
import { Plate, W, H } from '../plate';
import { C, FONT, text } from '../brand';
import { appear, mark } from './_ui';

export default class Intro extends Plate {
  body(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt, cx = W / 2, cy = H / 2 - 110;
    mark(c, cx, cy, 220, C.accent, prog(lt, 0.3, 1.7, ease.inOutCubic));
    appear(c, prog(lt, 1.3, 2.0, ease.outCubic), 20, () => text(c, 'vexillum', cx, cy + 260, FONT.serif(150), C.text, 'center', 2));
    appear(c, prog(lt, 2.0, 2.7, ease.outCubic), 16, () => text(c, 'One commander. Many soldiers (“subagents”).', cx, cy + 340, FONT.italic(54), C.text2, 'center'));
    appear(c, prog(lt, 2.6, 3.2, ease.outCubic), 10, () => text(c, 'ORCHESTRATOR FOR CODING AGENTS', cx, cy + 400, FONT.mono(20, 500), C.bronze, 'center', 5));
  }
}
