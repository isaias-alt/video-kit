// 03 / SENTINEL: polls every soldier, records changes, and wakes the commander only when one settles or blocks.
import type { Frame } from '@engine/scene';
import { ease, prog } from '@engine/util';
import { Plate, W } from '../plate';
import { C, FONT, rr, text } from '../brand';
import { M, appear, chip, cursor, header, typed, typedDone, win, type Tone } from './_ui';

type St = 'running' | 'done' | 'blocked';
const STATE_TONE: Record<St, Tone> = { running: 'accent', done: 'success', blocked: 'bronze' };

const ROWS: { id: string; kind: string; desc: string; changes: [number, St][] }[] = [
  { id: 'a3f9', kind: 'mission', desc: 'fix the flaky login test', changes: [[0, 'running'], [2.9, 'done']] },
  { id: '7c21', kind: 'mission', desc: 'migrate docs to the v2 API', changes: [[0, 'running'], [4.9, 'blocked'], [7.9, 'running']] },
  { id: 'e508', kind: 'scout', desc: 'map the auth flows', changes: [[0, 'running']] },
];

const stateAt = (lt: number, ch: [number, St][]) => {
  let cur = ch[0];
  for (const e of ch) if (lt >= e[0]) cur = e;
  return { st: cur[1], since: cur[0] };
};

export default class Sentinel extends Plate {
  body(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt;
    header(c, lt, '03', 'SENTINEL', 'It watches, and wakes the commander when needed');

    const lx = M, ly = 300, lw = 860, lh = 620;
    const wx = lx + lw + 110, ww = W - M - wx;

    // ---- troop panel
    appear(c, prog(lt, 0.4, 1.0, ease.outCubic), 24, () => {
      rr(c, lx, ly, lw, lh, 18);
      c.fillStyle = C.surface; c.fill();
      c.lineWidth = 1.5; c.strokeStyle = C.border; c.stroke();

      // sentinel orb: a ring leaves it at every poll
      const ox = lx + 72, oy = ly + 66;
      for (let k = 0; k < 4; k++) {
        const u = (lt - (0.8 + k * 2)) / 1.4;
        if (u > 0 && u < 1) {
          c.save();
          c.beginPath(); c.arc(ox, oy, 14 + 46 * ease.outCubic(u), 0, Math.PI * 2);
          c.strokeStyle = C.accent; c.lineWidth = 2; c.globalAlpha *= 1 - u; c.stroke();
          c.restore();
        }
      }
      c.beginPath(); c.arc(ox, oy, 13, 0, Math.PI * 2); c.fillStyle = C.accent; c.fill();
      c.beginPath(); c.arc(ox, oy, 5, 0, Math.PI * 2); c.fillStyle = C.surface; c.fill();
      text(c, 'sentinel', lx + 140, oy - 2, FONT.serif(40), C.text);
      text(c, 'polling herdr · one process per machine', lx + 140, oy + 28, FONT.mono(16), C.muted);
      c.beginPath(); c.moveTo(lx, ly + 132); c.lineTo(lx + lw, ly + 132); c.lineWidth = 1; c.strokeStyle = C.border; c.stroke();

      ROWS.forEach((r, i) => {
        const ry = ly + 132 + i * 162;
        if (i) { c.beginPath(); c.moveTo(lx + 28, ry); c.lineTo(lx + lw - 28, ry); c.strokeStyle = C.border; c.stroke(); }
        const { st, since } = stateAt(lt, r.changes);
        const pop = since > 0 ? prog(lt, since, since + 0.4, ease.outBack) : 1;
        text(c, r.id, lx + 36, ry + 58, FONT.mono(32, 700), C.text);
        chip(c, lx + 170, ry + 26, r.kind, r.kind === 'scout' ? 'bronze' : 'muted', { h: 34, px: 14 });
        chip(c, lx + lw - 36, ry + 24, st, STATE_TONE[st], {
          h: 38, px: 18, right: true, scale: 0.85 + 0.15 * pop,
          dot: st === 'running' ? 0.5 + 0.5 * Math.sin(f.t * 5 + i) : undefined,
        });
        if (st === 'blocked') {
          text(c, 'needs-decision: reuse the helper or write a new one?', lx + 36, ry + 108, FONT.mono(19), C.bronze);
        } else {
          text(c, r.desc, lx + 36, ry + 108, FONT.mono(19), C.text2);
        }
      });
    });

    // ---- commander window
    const glowA = (t0: number) => 1 - prog(lt, t0, t0 + 0.8);
    const glow = Math.max(prog(lt, 3.4, 3.6) * glowA(3.6), prog(lt, 5.5, 5.7) * glowA(5.7));
    appear(c, prog(lt, 0.5, 1.1, ease.outCubic), 24, () => {
      const y0 = win(c, wx, ly, ww, lh, 'claude code · commander', glow);
      const x0 = wx + 32, m = FONT.mono(20);
      const L = (n: number) => y0 + 58 + n * 38;
      const show = (t0: number, n: number, s: string, col: string, dx = 0) =>
        appear(c, prog(lt, t0, t0 + 0.25), 5, () => text(c, s, x0 + dx, L(n), m, col));

      show(3.7, 0, '⏺ Stop hook · vx sentinel await', C.muted);
      show(4.1, 1, '- mission a3f9: running -> done', C.success);
      show(4.6, 2.3, '● Done, general. a3f9 finished:', C.text);
      show(4.6, 3.1, '   3 commits ahead of main.', C.text);

      show(5.7, 4.4, '- mission 7c21: running -> blocked', C.bronze);
      show(6.1, 5.4, '● 7c21 asks: reuse the helper', C.text);
      show(6.1, 6.1, '   or write a new one?', C.text);

      const reply = 'reuse the helper';
      if (lt > 6.7) {
        text(c, '>', x0, L(7.3), FONT.mono(20, 700), C.accent);
        const t = typed(reply, lt, 6.7, 28);
        text(c, t, x0 + 28, L(7.3), m, C.text);
        if (!typedDone(reply, lt, 6.7, 28) || lt < 7.5) cursor(c, x0 + 28 + c.measureText(t).width, L(7.3), f.t, 20);
      }
      show(7.5, 8.3, '● Bash(vx decide 7c21 "Use the existing helper")', C.text);
      show(7.9, 9.1, '⎿  answer delivered · running', C.success);
    });

    // ---- wake: a dot travels from the row to the commander window
    const wake = (t0: number, row: number) => {
      const u = prog(lt, t0, t0 + 0.7, ease.inOutCubic);
      if (u <= 0 || u >= 1) return;
      const x = lx + lw + (wx - lx - lw) * u, y = ly + 132 + row * 162 + 81 + (ly + 170 - (ly + 132 + row * 162 + 81)) * u;
      c.save();
      c.globalAlpha *= Math.min(1, u * 6) * Math.min(1, (1 - u) * 6);
      c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fillStyle = C.accent; c.fill();
      c.beginPath(); c.arc(x, y, 18, 0, Math.PI * 2); c.strokeStyle = C.accent; c.lineWidth = 2; c.globalAlpha *= 0.4; c.stroke();
      c.restore();
    };
    wake(3.0, 0);
    wake(5.0, 1);
  }
}
