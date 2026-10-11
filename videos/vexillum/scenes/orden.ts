// 01 / COMMANDER: the general talks to one agent, which runs `vx dispatch`.
import type { Frame } from '@engine/scene';
import { ease, prog } from '@engine/util';
import { Plate, W } from '../plate';
import { C, FONT, rr, text } from '../brand';
import { M, appear, cursor, header, typed, typedDone, wrap, win } from './_ui';

const ROLES = [
  { tag: 'GENERAL', name: 'You', desc: 'You only ever talk to the commander.', on: [0.5, 2.3] },
  { tag: 'COMMANDER', name: 'Claude Code', desc: 'Picks model and effort, then dispatches with vx.', on: [2.3, 4.8] },
  { tag: 'SOLDIER', name: 'Claude Code', desc: 'A “subagent” working in its own camp (“git worktree”).', on: [4.8, 99] },
];

export default class Orden extends Plate {
  body(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt;
    header(c, lt, '01', 'COMMANDER', 'You talk to one agent');

    const wx = M, wy = 300, ww = 1260, wh = 558;
    const rx = wx + ww + 60, rw = W - M - rx;
    appear(c, prog(lt, 0.4, 1.0, ease.outCubic), 24, () => {
      const y0 = win(c, wx, wy, ww, wh, 'claude code · commander', 0);
      const L = (n: number) => y0 + 62 + n * 46;
      const x0 = wx + 44, mono = FONT.mono(24);
      const line1 = 'dispatch a soldier to fix the flaky login test';
      const b1 = '● Bash(vx dispatch "fix the flaky login test"';
      const b2 = '    --kind mission --model sonnet --effort medium)';

      text(c, '>', x0, L(0), FONT.mono(24, 700), C.accent);
      const t1 = typed(line1, lt, 0.5, 34);
      text(c, t1, x0 + 34, L(0), mono, C.text);
      if (!typedDone(line1, lt, 0.5, 34) || lt < 2.2) cursor(c, x0 + 34 + (c.measureText(t1).width || 0), L(0), f.t);

      appear(c, prog(lt, 2.3, 2.6), 6, () => text(c, '● Reading AGENTS.md and .vexillum/models.json', x0, L(2), mono, C.muted));
      if (lt > 2.9) {
        text(c, typed(b1, lt, 2.9, 52), x0, L(3), mono, C.text);
        text(c, typed(b2, lt, 2.9 + b1.length / 52, 52), x0, L(4), mono, C.text);
      }
      const out = [
        ['⎿  camp 1 acquired', 'vexillum/a3f9'],
        ['⎿  soldier started', 'herdr pane · claude --model sonnet'],
        ['⎿  sentinel', 'watching'],
      ];
      out.forEach(([k, v], i) => appear(c, prog(lt, 4.8 + i * 0.35, 5.1 + i * 0.35), 6, () => {
        text(c, k, x0, L(6 + i), mono, C.text2);
        text(c, v, x0 + 360, L(6 + i), mono, i === 0 ? C.accent : C.success);
      }));
    });

    ROLES.forEach((r, i) => {
      const ry = 300 + i * 194, rh = 170;
      appear(c, prog(lt, 0.5 + i * 0.12, 1.1 + i * 0.12, ease.outCubic), 24, () => {
        const act = prog(lt, r.on[0], r.on[0] + 0.3) * (1 - prog(lt, r.on[1], r.on[1] + 0.3));
        c.save();
        rr(c, rx, ry, rw, rh, 16);
        c.fillStyle = C.surface; c.fill();
        c.lineWidth = 1.5; c.strokeStyle = C.border; c.stroke();
        c.globalAlpha *= act;
        rr(c, rx, ry, rw, rh, 16);
        c.lineWidth = 2; c.strokeStyle = C.accent; c.stroke();
        c.restore();
        c.save();
        c.globalAlpha *= 0.55 + 0.45 * act;
        text(c, r.tag, rx + 28, ry + 42, FONT.mono(16, 500), C.bronze, 'left', 3);
        text(c, r.name, rx + 28, ry + 88, FONT.serif(40), C.text);
        wrap(c, r.desc, rw - 56, FONT.mono(17)).forEach((s, k) => text(c, s, rx + 28, ry + 124 + k * 24, FONT.mono(17), C.text2));
        c.restore();
      });
    });
  }
}
