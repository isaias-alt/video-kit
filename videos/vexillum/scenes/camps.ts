// 02 / CAMPS: every soldier forks off main into its own git worktree and runs a Claude Code session there.
import type { Frame } from '@engine/scene';
import { ease, prog } from '@engine/util';
import { Plate, W } from '../plate';
import { C, FONT, rr, text } from '../brand';
import { M, appear, chip, header, typed } from './_ui';

const CARDS = [
  { id: 'a3f9', kind: 'mission', prompt: 'fix the flaky login test', slot: 1,
    lines: ['● Read(tests/login.spec.ts)', '● Edit(src/auth/session.ts)', '● Bash(npm test)', '  ✓ 48 passed'] },
  { id: '7c21', kind: 'mission', prompt: 'migrate docs to the v2 API', slot: 2,
    lines: ['● Read(docs/api.md)', '● Edit(docs/api.md)', '● Bash(npm run lint)', '  ✓ no problems'] },
  { id: 'e508', kind: 'scout', prompt: 'map the auth flows', slot: 3,
    lines: ['● Grep(refresh_token)', '● Read(src/auth/token.ts)', '● Read(src/auth/oauth.ts)', '● Write(report.md)'] },
];

export default class Camps extends Plate {
  body(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt;
    header(c, lt, '02', 'CAMPS', 'Each soldier gets its own camp (“git worktree”)');

    const cw = 520, gap = (W - 2 * M - 3 * cw) / 2, my = 330, cy0 = 450, ch = 480;

    // main branch
    const mainP = prog(lt, 0.5, 1.3, ease.outCubic);
    c.save();
    c.lineCap = 'round';
    c.strokeStyle = C.borderStrong; c.lineWidth = 4;
    c.beginPath(); c.moveTo(M + 110, my); c.lineTo(M + 110 + (W - 2 * M - 110) * mainP, my); c.stroke();
    c.restore();
    appear(c, mainP, 8, () => text(c, 'main', M, my + 8, FONT.mono(26, 700), C.accent));

    CARDS.forEach((k, i) => {
      const x = M + i * (cw + gap), cx = x + cw / 2, t0 = 1.0 + i * 0.7;
      // fork line + dot on main
      const fp = prog(lt, t0, t0 + 0.5, ease.inOutCubic);
      if (fp > 0) {
        c.save();
        c.lineCap = 'round'; c.lineWidth = 4; c.strokeStyle = C.accent;
        c.beginPath(); c.moveTo(cx, my); c.lineTo(cx, my + (cy0 - my) * fp); c.stroke();
        c.beginPath(); c.arc(cx, my, 11, 0, Math.PI * 2); c.fillStyle = C.accent; c.fill();
        c.beginPath(); c.arc(cx, my, 5, 0, Math.PI * 2); c.fillStyle = C.bg; c.fill();
        c.restore();
      }
      const cp = prog(lt, t0 + 0.4, t0 + 1.0, ease.outCubic);
      appear(c, cp, 26, () => {
        rr(c, x, cy0, cw, ch, 18);
        c.fillStyle = C.surface; c.fill();
        c.lineWidth = 1.5; c.strokeStyle = C.border; c.stroke();
        const pulse = 0.5 + 0.5 * Math.sin(f.t * 5 + i);
        chip(c, x + 28, cy0 + 28, k.kind, k.kind === 'scout' ? 'bronze' : 'muted', { h: 36, px: 16 });
        chip(c, x + cw - 28, cy0 + 28, 'running', 'accent', { h: 36, px: 16, dot: pulse, right: true });
        text(c, `vexillum/${k.id}`, x + 28, cy0 + 112, FONT.mono(30, 700), C.accent);
        text(c, `~/.vexillum/projects/app-9d2e/camps/${k.slot}/app`, x + 28, cy0 + 146, FONT.mono(14), C.muted);

        const by = cy0 + 176, bh = ch - 176 - 28;
        rr(c, x + 28, by, cw - 56, bh, 12);
        c.fillStyle = C.sunken; c.fill();
        const tt = t0 + 1.2;
        text(c, '>', x + 52, by + 50, FONT.mono(20, 700), C.accent);
        text(c, typed(k.prompt, lt, tt, 30), x + 80, by + 50, FONT.mono(20), C.text);
        k.lines.forEach((s, n) => {
          const a = prog(lt, tt + 1.0 + n * 0.55, tt + 1.25 + n * 0.55);
          appear(c, a, 5, () => text(c, s, x + 52, by + 106 + n * 40, FONT.mono(20), s.includes('✓') ? C.success : C.text2));
        });
      });
    });

    appear(c, prog(lt, 5.4, 6.1, ease.outCubic), 10, () =>
      text(c, 'Isolated from yours: separate commits, separate working tree.', W / 2, 1010, FONT.mono(22), C.text2, 'center'));
  }
}
