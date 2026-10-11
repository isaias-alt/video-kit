// 17-25s: write a plan once, assign it to every patient with a click, export it as PDF.
import type { Frame } from '@engine/scene';
import { Plate, W, H } from './_plate';
import { C, FONT, TONES, card, rr, text, logo, logoWidth } from './_brand';
import { heading } from './_ui';
import { ease, prog, lerp } from '@engine/util';

const MEALS: [string, string, string][] = [
  ['Desayuno', 'Café con leche, tostada, palta', '380'],
  ['Colación', 'Yogur natural y frutos secos', '190'],
  ['Almuerzo', 'Pollo, arroz integral, ensalada', '520'],
  ['Merienda', 'Fruta de estación y queso', '210'],
  ['Cena', 'Tortilla de verduras y ensalada', '300'],
];
const PATIENTS: [string, string][] = [['Valentina R.', 'VR'], ['Carlos M.', 'CM'], ['Lucía F.', 'LF']];
const RX = 960, RW = 820, RH = 130, RY = (i: number) => 340 + i * 150;
const T = { x: 140, y: 340, w: 560, h: 640 };
const ARRIVE = [2.7, 3.4, 4.1]; // when each copy lands

function drawPlan(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rowsShown: number, lt: number, big: boolean) {
  const yl = TONES.yellow;
  card(c, x, y, w, h, { r: 28, lift: big ? 1 : 0.9 });
  rr(c, x + 40, y + 36, 150, 36, 18); c.fillStyle = yl.bg; c.fill();
  text(c, 'PLANTILLA', x + 115, y + 61, FONT.mono(16, 500), yl.text, 'center', 3);
  text(c, 'Plan 1.600 kcal', x + 40, y + 132, FONT.display(46, 600), C.ink);
  MEALS.forEach(([n, d, k], i) => {
    const a = prog(lt, 0.7 + i * 0.22, 1.2 + i * 0.22, ease.outCubic);
    const ry = y + 196 + i * 78;
    c.save(); c.globalAlpha = a; c.translate((1 - a) * -18, 0);
    c.strokeStyle = C.line; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 40, ry - 24); c.lineTo(x + w - 40, ry - 24); c.stroke();
    text(c, n, x + 40, ry + 8, FONT.sans(22, 600), C.ink);
    text(c, d, x + 40, ry + 36, FONT.sans(18, 400), C.muted);
    text(c, `${k} kcal`, x + w - 40, ry + 8, FONT.mono(20, 500), yl.text, 'right');
    c.restore();
  });
  void rowsShown;
}

export default class Planes extends Plate {
  draw(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt, gr = TONES.green;
    const tIn = prog(lt, 0.1, 0.8, ease.outCubic);
    c.save(); c.globalAlpha = tIn; c.translate(0, (1 - tIn) * 24);
    drawPlan(c, T.x, T.y, T.w, T.h, 5, lt, false);
    c.restore();

    // patient rows
    PATIENTS.forEach(([name, ini], i) => {
      const a = prog(lt, 0.9 + i * 0.2, 1.6 + i * 0.2, ease.outCubic);
      const y = RY(i), got = prog(lt, ARRIVE[i]!, ARRIVE[i]! + 0.4, ease.outBack);
      c.save(); c.globalAlpha = a; c.translate((1 - a) * 40, 0);
      card(c, RX, y, RW, RH, { r: 24, lift: 0.8, border: got > 0.5 ? gr.border : C.line });
      c.beginPath(); c.arc(RX + 70, y + RH / 2, 34, 0, 6.283); c.fillStyle = got > 0.5 ? gr.bg : '#F1F5F9'; c.fill();
      text(c, ini, RX + 70, y + RH / 2 + 11, FONT.sans(28, 600), got > 0.5 ? gr.text : C.muted, 'center');
      text(c, name, RX + 130, y + 56, FONT.sans(30, 600), C.ink);
      text(c, got > 0.5 ? 'Plan 1.600 kcal' : 'Sin plan asignado', RX + 130, y + 92, FONT.sans(21, 400), C.muted);
      // status chip
      const label = got > 0.5 ? 'Asignado' : 'Pendiente', w = 200;
      c.save(); c.translate(RX + RW - 40 - w / 2, y + RH / 2); const s = got > 0 ? 1 + 0.08 * Math.sin(Math.min(1, got) * Math.PI) : 1; c.scale(s, s);
      rr(c, -w / 2, -24, w, 48, 24); c.fillStyle = got > 0.5 ? gr.bg : '#F1F5F9'; c.fill();
      text(c, (got > 0.5 ? '✓  ' : '') + label, 0, 8, FONT.sans(21, 600), got > 0.5 ? gr.text : C.muted, 'center');
      c.restore();
      c.restore();
    });

    // flying copies: template -> row i
    PATIENTS.forEach((_, i) => {
      const t0 = ARRIVE[i]! - 0.9, p = prog(lt, t0, ARRIVE[i]!, ease.inOutCubic);
      if (p <= 0 || p >= 1) return;
      const sx = T.x + T.w - 90, sy = T.y + 300, ex = RX + RW - 140, ey = RY(i) + RH / 2;
      const x = lerp(sx, ex, p), y = lerp(sy, ey, p) - Math.sin(p * Math.PI) * 90;
      c.save(); c.translate(x, y); c.rotate((1 - p) * -0.08 + p * 0.0); c.scale(lerp(1, 0.4, p), lerp(1, 0.4, p));
      c.globalAlpha = 1 - ease.inCubic(Math.max(0, (p - 0.8) / 0.2));
      card(c, -150, -86, 300, 172, { r: 20, lift: 1.1, border: TONES.yellow.border });
      rr(c, -150, -86, 300, 14, 7); c.fillStyle = TONES.yellow.text; c.fill();
      text(c, 'Plan 1.600 kcal', -118, -22, FONT.display(30, 600), C.ink);
      [0.8, 0.6, 0.7].forEach((w, k) => { rr(c, -118, 8 + k * 26, 236 * w, 12, 6); c.fillStyle = C.line; c.fill(); });
      c.restore();
    });

    // export button
    const bA = prog(lt, 4.9, 5.5, ease.outCubic), press = prog(lt, 5.5, 5.65) * (1 - prog(lt, 5.65, 5.85));
    if (bA > 0) {
      c.save(); c.globalAlpha = bA; c.translate(RX + RW / 2, 855 + (1 - bA) * 20); c.scale(1 - 0.03 * press, 1 - 0.03 * press);
      const hot = prog(lt, 5.5, 5.65);
      rr(c, -RW / 2, -55, RW, 110, 28); c.fillStyle = hot > 0.5 ? C.brand : C.bright; c.fill();
      text(c, 'Exportar PDF', 0, 14, FONT.sans(36, 600), C.white, 'center');
      c.restore();
    }

    // the PDF sheet
    const sA = prog(lt, 5.8, 6.6, ease.outCubic);
    if (sA > 0) {
      c.save(); c.globalAlpha = 0.86 * sA; c.fillStyle = C.bg; c.fillRect(0, 0, W, H); c.restore();
      const sx = 960 - 270, sy = 150 + (1 - sA) * 80;
      c.save(); c.globalAlpha = sA; c.translate(sx + 270, sy + 400); c.rotate(-0.025 * (1 - sA) * 6); c.translate(-(sx + 270), -(sy + 400));
      card(c, sx, sy, 540, 780, { r: 12, lift: 1.5 });
      logo(c, sx + 44, sy + 44, 64);
      text(c, 'NutriOne', sx + 44 + logoWidth(64) + 16, sy + 90, FONT.display(34, 700), C.ink);
      rr(c, sx + 540 - 44 - 92, sy + 50, 92, 40, 10); c.fillStyle = TONES.red.bg; c.fill();
      text(c, 'PDF', sx + 540 - 44 - 46, sy + 78, FONT.mono(20, 500), TONES.red.text, 'center', 3);
      text(c, 'Plan nutricional', sx + 44, sy + 190, FONT.display(44, 600), C.ink);
      text(c, 'Valentina R.  ·  1.600 kcal', sx + 44, sy + 232, FONT.sans(21, 400), C.muted);
      MEALS.forEach(([n, d, k], i) => {
        const ry = sy + 300 + i * 88;
        c.strokeStyle = C.line; c.lineWidth = 1.5; c.beginPath(); c.moveTo(sx + 44, ry - 26); c.lineTo(sx + 496, ry - 26); c.stroke();
        text(c, n, sx + 44, ry + 6, FONT.sans(21, 600), C.ink);
        text(c, d, sx + 44, ry + 34, FONT.sans(17, 400), C.muted);
        text(c, k, sx + 496, ry + 6, FONT.mono(19, 500), TONES.yellow.text, 'right');
      });
      c.restore();
    }

    heading(c, lt, [{ from: 0.2, to: 5.8, eyebrow: 'PLANES', tone: 'yellow', lines: ['Armá una vez,', 'usá siempre.'], accent: 1 }]);
  }
}
