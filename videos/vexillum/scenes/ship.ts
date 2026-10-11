// 04 / LAND O SHIP: a finished mission leaves its camp only by explicit approval - a local fast-forward, or the tribunal and a real PR.
import type { Frame } from '@engine/scene';
import { ease, prog } from '@engine/util';
import { Plate, W } from '../plate';
import { C, FONT, rr, text } from '../brand';
import { M, appear, chip, header } from './_ui';

const STEPS = [
  { name: 'lint', sub: 'go vet', at: 3.6 },
  { name: 'tests', sub: 'go test', at: 4.3 },
  { name: 'review', sub: 'fresh session, adversarial', at: 5.3 },
  { name: 'docs', sub: 'doc comments', at: 6.0 },
];

export default class Ship extends Plate {
  body(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt;
    header(c, lt, '04', 'LAND OR SHIP', 'Nothing reaches your history without your approval');

    const rowA = 410, rowB = 700;
    // ---- mission card
    const mx = M, my = 440, mw = 380, mh = 270;
    appear(c, prog(lt, 0.4, 1.0, ease.outCubic), 24, () => {
      rr(c, mx, my, mw, mh, 18);
      c.fillStyle = C.surface; c.fill();
      c.lineWidth = 1.5; c.strokeStyle = C.border; c.stroke();
      text(c, 'a3f9', mx + 28, my + 62, FONT.mono(36, 700), C.text);
      chip(c, mx + mw - 28, my + 28, 'done', 'success', { h: 36, px: 16, right: true });
      text(c, 'fix the flaky login test', mx + 28, my + 112, FONT.mono(18), C.text2);
      [0, 1, 2].forEach((i) => {
        c.beginPath(); c.arc(mx + 44 + i * 44, my + 166, 9, 0, Math.PI * 2); c.fillStyle = C.accent; c.fill();
        if (i) { c.beginPath(); c.moveTo(mx + 44 + (i - 1) * 44 + 9, my + 166); c.lineTo(mx + 44 + i * 44 - 9, my + 166); c.strokeStyle = C.accent; c.lineWidth = 3; c.stroke(); }
      });
      text(c, '3 commits ahead of main', mx + 28, my + 228, FONT.mono(18), C.muted);
    });

    // ---- connectors (elbows) from the card to both rows
    const sx = mx + mw, sy = my + mh / 2, ex = 640;
    const cp = prog(lt, 1.0, 1.6, ease.inOutCubic);
    if (cp > 0) {
      c.save();
      c.lineWidth = 3; c.strokeStyle = C.borderStrong; c.lineJoin = 'round'; c.lineCap = 'round';
      const bx = sx + 70;
      for (const ty of [rowA - 18, rowB - 74]) {
        const len = (bx - sx) + Math.abs(ty - sy) + (ex - 20 - bx), d = len * cp;
        const pts: [number, number][] = [[sx, sy], [bx, sy], [bx, ty], [ex - 20, ty]];
        c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
        let left = d;
        for (let i = 1; i < pts.length && left > 0; i++) {
          const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], l = Math.abs(dx) + Math.abs(dy), u = Math.min(1, left / l);
          c.lineTo(pts[i - 1][0] + dx * u, pts[i - 1][1] + dy * u);
          left -= l;
        }
        c.stroke();
      }
      c.restore();
    }

    // ---- row A: land
    appear(c, prog(lt, 1.6, 2.2, ease.outCubic), 16, () => {
      text(c, 'vx land', ex, rowA - 6, FONT.mono(34, 700), C.accent);
      text(c, 'local fast-forward. Never forces.', ex, rowA + 32, FONT.mono(18), C.muted);
    });
    const gx0 = 1080, gy = rowA - 10, gstep = 100;
    if (lt > 1.8) {
      const lp = prog(lt, 1.8, 2.4, ease.outCubic);
      c.save();
      c.globalAlpha *= lp;
      c.lineWidth = 4; c.lineCap = 'round'; c.strokeStyle = C.borderStrong;
      c.beginPath(); c.moveTo(gx0, gy); c.lineTo(gx0 + gstep * 5 * Math.max(0.4, prog(lt, 1.8, 3.2, ease.inOutCubic)), gy); c.stroke();
      [0, 1].forEach((i) => { c.beginPath(); c.arc(gx0 + i * gstep, gy, 9, 0, Math.PI * 2); c.fillStyle = C.borderStrong; c.fill(); });
      c.restore();
      [0, 1, 2].forEach((i) => {
        const p = prog(lt, 2.4 + i * 0.3, 2.8 + i * 0.3, ease.outBack);
        if (p <= 0) return;
        c.beginPath(); c.arc(gx0 + (2 + i) * gstep, gy, 9 * p, 0, Math.PI * 2); c.fillStyle = C.accent; c.fill();
      });
      const tp = prog(lt, 3.2, 3.8, ease.inOutCubic), tx = gx0 + gstep * (1 + 3 * tp);
      c.save();
      c.globalAlpha *= lp;
      rr(c, tx - 38, gy - 66, 76, 34, 17);
      c.fillStyle = C.accentSoft; c.fill();
      text(c, 'main', tx, gy - 42, FONT.mono(18, 700), C.accent, 'center');
      c.restore();
    }

    // ---- row B: ship through the tribunal
    appear(c, prog(lt, 2.4, 3.0, ease.outCubic), 16, () => {
      text(c, 'vx ship', ex, rowB - 62, FONT.mono(34, 700), C.accent);
      text(c, 'the tribunal, then a real pull request.', ex, rowB - 24, FONT.mono(18), C.muted);
    });
    const bw = 200, bh = 120, bgap = 26, by = rowB + 10;
    STEPS.forEach((s, i) => {
      const x = ex + i * (bw + bgap), a = prog(lt, 2.8 + i * 0.15, 3.3 + i * 0.15, ease.outCubic);
      const done = prog(lt, s.at + 0.1, s.at + 0.5, ease.outBack);
      const active = i === 0 ? lt > 3.2 : lt > STEPS[i - 1].at + 0.3;
      appear(c, a, 14, () => {
        rr(c, x, by, bw, bh, 14);
        c.fillStyle = C.surface; c.fill();
        c.lineWidth = 1.5; c.strokeStyle = done >= 1 ? C.success : active && lt < s.at + 0.4 ? C.accent : C.border; c.stroke();
        text(c, s.name, x + 22, by + 50, FONT.mono(26, 700), C.text);
        const sub = i === 2 ? ['fresh session,', 'adversarial'] : [s.sub];
        sub.forEach((t, k) => text(c, t, x + 22, by + 82 + k * 22, FONT.mono(16), C.muted));
        if (done > 0) {
          c.save();
          c.translate(x + bw - 36, by + 36);
          c.scale(done, done);
          c.beginPath(); c.arc(0, 0, 15, 0, Math.PI * 2); c.fillStyle = C.successSoft; c.fill();
          c.beginPath(); c.moveTo(-6, 0); c.lineTo(-2, 5); c.lineTo(7, -5);
          c.strokeStyle = C.success; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
          c.restore();
        }
      });
      if (i < 3) {
        const ap = prog(lt, 2.9 + i * 0.15, 3.4 + i * 0.15);
        c.save(); c.globalAlpha *= ap; c.strokeStyle = C.borderStrong; c.lineWidth = 2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x + bw + 6, by + bh / 2); c.lineTo(x + bw + bgap - 6, by + bh / 2); c.stroke(); c.restore();
      }
    });
    // pull request card
    const px = ex + 4 * (bw + bgap), pw = W - M - px;
    appear(c, prog(lt, 6.3, 6.9, ease.outBack), 16, () => {
      rr(c, px, by, pw, bh, 14);
      c.fillStyle = C.surface; c.fill();
      c.lineWidth = 2; c.strokeStyle = C.accent; c.stroke();
      text(c, 'PULL REQUEST', px + 22, by + 34, FONT.mono(14, 500), C.bronze, 'left', 3);
      text(c, 'fix: flaky login test', px + 22, by + 68, FONT.mono(16, 500), C.text);
      chip(c, px + 22, by + 78, '#42 · open', 'success', { h: 30, px: 12 });
    });

    // ---- strike
    appear(c, prog(lt, 7.3, 7.9, ease.outCubic), 10, () => {
      text(c, '$ vx strike a3f9', W / 2 - 24, 944, FONT.mono(26, 500), C.text, 'right');
      text(c, '   the camp returns to the pool', W / 2 - 24, 944, FONT.mono(22), C.muted, 'left');
    });
  }
}
