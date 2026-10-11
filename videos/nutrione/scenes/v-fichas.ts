// Vertical 11-17s: profile on top, weight curve below.
import type { Frame } from '@engine/scene';
import { Plate } from './_plate';
import { C, FONT, TONES, card, rr, text } from './_brand';
import { heading, num } from './_ui';
import { ease, prog, lerp } from '@engine/util';

const WEIGHT = [82.4, 81.0, 79.9, 79.2, 78.0, 76.8];
const PX = 170, PW = 780, PY = 1070, PH = 330;
const VMIN = 74, VMAX = 83;
const px = (i: number) => PX + (PW * i) / (WEIGHT.length - 1);
const py = (v: number) => PY + PH * (1 - (v - VMIN) / (VMAX - VMIN));

export default class VFichas extends Plate {
  draw(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt, g = TONES.green;
    const u = prog(lt, 1.0, 4.2, ease.inOutCubic);
    const s = u * (WEIGHT.length - 1), idx = Math.min(WEIGHT.length - 2, Math.floor(s)), fr = s - idx;
    const cur = lerp(WEIGHT[idx]!, WEIGHT[idx + 1]!, fr);

    // ---- profile card (top)
    const pIn = prog(lt, 0.1, 0.8, ease.outCubic);
    c.save(); c.globalAlpha = pIn; c.translate(0, (1 - pIn) * 24);
    card(c, 60, 470, 960, 330, { r: 28, lift: 0.9 });
    c.beginPath(); c.arc(160, 560, 48, 0, 6.283); c.fillStyle = g.bg; c.fill();
    text(c, 'VR', 160, 574, FONT.display(38, 700), g.text, 'center');
    text(c, 'Valentina R.', 234, 558, FONT.sans(36, 600), C.ink);
    text(c, '34 años · 6 consultas', 234, 596, FONT.sans(23, 400), C.muted);
    c.strokeStyle = C.line; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(100, 640); c.lineTo(980, 640); c.stroke();
    const rows: [string, number, number, string, number][] = [['PESO', 82.4, 76.8, 'kg', 1], ['IMC', 30.1, 28.1, '', 1], ['CINTURA', 94, 88, 'cm', 0]];
    rows.forEach(([label, a, b, unit, d], i) => {
      const x = 100 + i * 300;
      text(c, label, x, 694, FONT.mono(18, 500), C.muted, 'left', 3);
      text(c, `${num(lerp(a, b, u), d)}${unit ? ' ' + unit : ''}`, x, 760, FONT.sans(44, 600), C.ink);
    });
    c.restore();

    // ---- chart card
    const cIn = prog(lt, 0.3, 1.0, ease.outCubic);
    c.save(); c.globalAlpha = cIn; c.translate(0, (1 - cIn) * 24);
    card(c, 60, 830, 960, 650, { r: 28, lift: 0.9 });
    text(c, 'Peso', 100, 910, FONT.sans(30, 600), C.ink);
    text(c, 'kg · últimas 6 consultas', 100, 946, FONT.sans(21, 400), C.muted);
    text(c, num(cur, 1), 980, 930, FONT.display(88, 700), C.ink, 'right');
    c.lineWidth = 1.5;
    for (const v of [76, 78, 80, 82]) {
      c.strokeStyle = C.line; c.beginPath(); c.moveTo(PX, py(v)); c.lineTo(PX + PW, py(v)); c.stroke();
      text(c, String(v), PX - 18, py(v) + 6, FONT.mono(18, 400), C.muted, 'right');
    }
    WEIGHT.forEach((_, i) => text(c, `C${i + 1}`, px(i), 1440, FONT.mono(18, 500), C.muted, 'center'));
    const goalA = prog(lt, 0.9, 1.5);
    c.save(); c.globalAlpha *= goalA; c.setLineDash([10, 10]); c.strokeStyle = g.border; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(PX, py(75)); c.lineTo(PX + PW, py(75)); c.stroke(); c.restore();
    c.save(); c.globalAlpha *= goalA; text(c, 'OBJETIVO 75 kg', PX + PW, py(75) - 12, FONT.mono(16, 500), g.text, 'right', 2); c.restore();
    const pts: [number, number][] = [];
    for (let i = 0; i <= idx; i++) pts.push([px(i), py(WEIGHT[i]!)]);
    pts.push([lerp(px(idx), px(idx + 1), fr), py(cur)]);
    if (u > 0) {
      const grad = c.createLinearGradient(0, PY, 0, PY + PH);
      grad.addColorStop(0, 'rgba(22,163,74,0.20)'); grad.addColorStop(1, 'rgba(22,163,74,0)');
      c.beginPath(); c.moveTo(pts[0]![0], PY + PH); pts.forEach(([x, y]) => c.lineTo(x, y));
      c.lineTo(pts[pts.length - 1]![0], PY + PH); c.closePath(); c.fillStyle = grad; c.fill();
      c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.strokeStyle = C.bright; c.lineWidth = 6; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
    }
    WEIGHT.forEach((v, i) => {
      const a = prog(u * (WEIGHT.length - 1), i - 0.05, i + 0.25, ease.outBack);
      if (a <= 0) return;
      const last = i === WEIGHT.length - 1;
      c.save(); c.translate(px(i), py(v)); c.scale(a, a);
      if (last) { c.beginPath(); c.arc(0, 0, 14 + 14 * ease.outCubic(prog(lt, 4.2, 5.2)), 0, 6.283); c.fillStyle = `rgba(22,163,74,${0.22 * (1 - prog(lt, 4.2, 5.2))})`; c.fill(); }
      c.beginPath(); c.arc(0, 0, last ? 12 : 9, 0, 6.283); c.fillStyle = last ? C.bright : C.white; c.fill();
      c.lineWidth = 4; c.strokeStyle = C.bright; c.stroke();
      c.restore();
    });
    const dA = prog(lt, 4.3, 4.9, ease.outBack);
    if (dA > 0) {
      c.save(); c.translate(980, 984); c.scale(dA, dA);
      rr(c, -200, -22, 200, 44, 22); c.fillStyle = g.bg; c.fill();
      text(c, '▼ 5,6 kg desde C1', -100, 7, FONT.sans(20, 600), g.text, 'center');
      c.restore();
    }
    c.restore();

    heading(c, lt, [{ from: 0.2, to: 6, eyebrow: 'SEGUIMIENTO', tone: 'blue', lines: ['Cada paciente,', 'con su historia.'], accent: 1 }], 80, 210, 84);
  }
}
