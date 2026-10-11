// 32-36 s. Close: the landing hero ("Tu consultorio, ordenado.") with its floating patient cards, the CTA and the
// trust line. Ends with a click on Comenzar and a soft fade out under the track's tail.
import type { Frame } from '@engine/scene';
import { Plate, W, H, portrait } from '../plate';
import { C, FONT, TONES, card, rr, text, logoH, logoHW, type ToneKey } from '../brand';
import { hero, accent, slideUp, pop, rise, cursor, clickRing, path, scaled } from '../ui';
import { ease, prog, lerp } from '@engine/util';

const FLOAT: { name: string; time: string; tone: ToneKey; nx: number; ny: number; rot: number; t: number }[] = [
  { name: 'Valentina Lopez', time: '08:30 - 09:30', tone: 'green', nx: 0.085, ny: 0.3, rot: -4, t: 1.5 },
  { name: 'Martin Acosta', time: '11:00 - 12:00', tone: 'blue', nx: 0.9, ny: 0.2, rot: 4, t: 1.75 },
  { name: 'Diego Fernandez', time: '09:45 - 10:45', tone: 'red', nx: 0.085, ny: 0.58, rot: -4, t: 2.0 },
  { name: 'Ana Rodriguez', time: '14:00 - 15:00', tone: 'yellow', nx: 0.915, ny: 0.55, rot: 3, t: 2.25 },
];
const PORTRAIT_POS = [{ x: 0.27, y: 0.225 }, { x: 0.74, y: 0.255 }, { x: 0.27, y: 0.745 }, { x: 0.74, y: 0.715 }];
const TRUST = ['Sin tarjeta requerida', 'Activo en minutos', 'Soporte humano'];

function tick(c: CanvasRenderingContext2D, x: number, y: number, col: string, s = 1) {
  c.save(); c.strokeStyle = col; c.lineWidth = 3 * s; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6 * s, y + 6 * s); c.lineTo(x + 16 * s, y - 6 * s); c.stroke(); c.restore();
}
function arrow(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  c.save(); c.strokeStyle = col; c.lineWidth = 3 * s; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + 20 * s, y); c.moveTo(x + 12 * s, y - 8 * s); c.lineTo(x + 20 * s, y); c.lineTo(x + 12 * s, y + 8 * s); c.stroke(); c.restore();
}

export default class Cierre extends Plate {
  draw(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt, cx = W / 2, k = portrait ? 0.78 : 1;
    const wash = (x: number, y: number, r: number, col: string, a: number) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.globalAlpha = 1; };
    wash(W * 0.5, H * 0.4, W * 0.55, '#DCFCE7', 0.9); wash(W * 0.92, H * 0.2, W * 0.4, '#DBEAFE', 0.7); wash(W * 0.85, H * 0.85, W * 0.4, '#FEF3C7', 0.7);

    // floating patient cards (landing hero)
    FLOAT.forEach((p, i) => {
      const a = pop(lt, p.t, 0.4);
      if (a <= 0) return;
      const tn = TONES[p.tone], pp = portrait ? PORTRAIT_POS[i]! : { x: p.nx, y: p.ny }, x = pp.x * W, y = pp.y * H + Math.sin(lt * 1.3 + i * 1.7) * 7;
      c.save(); c.translate(x, y); c.rotate((p.rot * Math.PI) / 180 * (0.4 + 0.6 * a)); c.scale((0.7 + 0.3 * a) * k, (0.7 + 0.3 * a) * k); c.globalAlpha = Math.min(1, a * 1.5);
      card(c, -120, -36, 240, 72, { r: 14, fill: tn.bg, border: tn.border, lift: 0.8 });
      text(c, p.name, 0, -4, FONT.sans(22, 600), tn.text, 'center');
      text(c, p.time, 0, 22, FONT.mono(15, 400), tn.text, 'center');
      c.restore();
    });

    // logo + eyebrow pill
    const lh = portrait ? 96 : 100, ly = portrait ? 250 : 80;
    const rev = ease.outCubic(prog(lt, 0.0, 0.55));
    logoH(c, cx - logoHW(lh) / 2, ly, lh, C.logo, rev);
    const rp = prog(lt, 0.45, 1.0, ease.outCubic);
    if (rp > 0 && rp < 1) { c.save(); c.globalAlpha = 0.5 * (1 - rp); c.lineWidth = 3; c.strokeStyle = C.logo; rr(c, cx - logoHW(lh) / 2 - 20 * rp, ly - 20 * rp, logoHW(lh) + 40 * rp, lh + 40 * rp, 30 + 20 * rp); c.stroke(); c.restore(); }

    const sz = portrait ? 126 : 188, y1 = portrait ? 640 : 440, y2 = y1 + sz * 0.98;
    slideUp(c, 0, y1, W, sz * 1.06, ease.outExpo(prog(lt, 0.5, 1.0)), (y) => hero(c, 'Tu consultorio,', cx, y, sz, C.ink, 'center'));
    const s2 = 1 + 0.12 * (1 - ease.outExpo(prog(lt, 1.0, 1.35)));
    c.save(); c.translate(cx, y2 - sz * 0.3); c.scale(s2, s2); c.translate(-cx, -(y2 - sz * 0.3)); c.globalAlpha = prog(lt, 1.0, 1.08);
    slideUp(c, 0, y2, W, sz * 1.06, ease.outExpo(prog(lt, 1.0, 1.45)), (y) => accent(c, 'ordenado.', cx, y, sz, 'center'));
    c.restore();

    // sub line, CTAs, trust
    const sy = y2 + (portrait ? 80 : 78);
    c.save(); c.globalAlpha = rise(lt, 1.9, 0.4); c.translate(0, (1 - rise(lt, 1.9, 0.4)) * 16);
    text(c, 'Probalo esta semana.', cx, sy, FONT.sans(portrait ? 40 : 40, 500), C.slate700, 'center');
    c.restore();
    const bh = portrait ? 92 : 76, by = sy + (portrait ? 56 : 52), bw1 = portrait ? 440 : 290, bw2 = portrait ? 440 : 340;
    const b1x = portrait ? cx - bw1 / 2 : cx - (bw1 + bw2 + 20) / 2, b1y = by;
    const b2x = portrait ? cx - bw2 / 2 : b1x + bw1 + 20, b2y = portrait ? by + bh + 22 : by;
    const press = prog(lt, 3.5, 3.56) * (1 - prog(lt, 3.56, 3.68));
    const s1 = pop(lt, 2.0, 0.4);
    scaled(c, b1x + bw1 / 2, b1y + bh / 2, (0.85 + 0.15 * s1) * (1 - 0.04 * press), rise(lt, 2.0, 0.2), () => {
      rr(c, b1x, b1y, bw1, bh, 12); c.save(); c.shadowColor = 'rgba(21,128,61,0.35)'; c.shadowBlur = 26; c.shadowOffsetY = 10; c.fillStyle = C.logo; c.fill(); c.restore();
      const fs = portrait ? 36 : 32, as = portrait ? 1.2 : 1.1;
      c.font = FONT.sans(fs, 600); const tw = c.measureText('Comenzar').width, gw = tw + 16 + 20 * as, gx = b1x + (bw1 - gw) / 2;
      text(c, 'Comenzar', gx, b1y + bh / 2 + 11, FONT.sans(fs, 600), C.white);
      arrow(c, gx + tw + 16, b1y + bh / 2, as, C.white);
    });
    const s2b = pop(lt, 2.25, 0.4);
    scaled(c, b2x + bw2 / 2, b2y + bh / 2, 0.85 + 0.15 * s2b, rise(lt, 2.25, 0.2), () => {
      rr(c, b2x, b2y, bw2, bh, 12); c.fillStyle = C.white; c.fill(); c.lineWidth = 2; c.strokeStyle = C.ink; c.stroke();
      text(c, 'Agendar una demo', b2x + bw2 / 2, b2y + bh / 2 + 11, FONT.sans(portrait ? 32 : 30, 600), C.ink, 'center');
    });
    // trust
    const ty = (portrait ? b2y + bh : by + bh) + (portrait ? 70 : 72);
    c.font = FONT.sans(portrait ? 26 : 24, 500);
    const ws = TRUST.map((t) => c.measureText(t).width + 30), gap = 44, total = ws.reduce((a, b) => a + b, 0) + gap * 2;
    let tx = cx - total / 2;
    TRUST.forEach((t, i) => {
      const a = rise(lt, 2.5 + i * 0.25, 0.35), px = portrait ? cx - ws[i]! / 2 : tx, py = portrait ? ty + i * 50 : ty;
      c.save(); c.globalAlpha = a; c.translate(0, (1 - a) * 12);
      tick(c, px, py - 8, C.logo, 1.0); text(c, t, px + 30, py, FONT.sans(portrait ? 26 : 24, 500), C.muted);
      c.restore();
      tx += ws[i]! + gap;
    });

    // cursor clicks Comenzar
    const tgt = { x: b1x + bw1 * 0.84, y: b1y + bh * 0.72 };
    if (lt > 2.9) {
      const cp = path(lt, [[2.9, W * 0.78, H * 0.9], [3.45, tgt.x, tgt.y]]);
      clickRing(c, tgt.x, tgt.y, lt, 3.5, 46, C.white);
      cursor(c, cp.x, cp.y, press, portrait ? 1.7 : 1.5);
    }
  }
}
