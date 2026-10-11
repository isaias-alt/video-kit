// 0-14 s. Intro + build of the track (the video starts at song second 2). The mess from the landing (WhatsApp, iPhone calendar, sticky notes, xlsx,
// pdf, docx) piles up beat by beat with the three pains, then everything is pulled into the NutriOne isotipo,
// a word per bar (Agenda, Pacientes, Planes, Todo: the real sidebar), ending in a white flash on the drop at 14.0.
import type { Frame } from '@engine/scene';
import { Plate, W, H, portrait } from '../plate';
import { C, FONT, TONES, card, rr, text, isotipo, isoW, type ToneKey } from '../brand';
import { icon } from '../icons';
import { hero, eyebrow, slideUp, pop, B } from '../ui';
import { ease, prog, lerp, hash, noise1, pulse } from '@engine/util';

type Kind = 'wa' | 'ios' | 'sticky' | 'over' | 'xlsx' | 'pdf' | 'note' | 'q' | 'docx' | 'again' | 'lost';
const KINDS: Kind[] = ['wa', 'ios', 'sticky', 'over', 'xlsx', 'pdf', 'note', 'q', 'docx', 'again', 'lost'];

interface Frag { kind: Kind; t: number; nx: number; ny: number; rot: number; s: number }
// the three groups (one per bar) at the positions that leave the headline free, then a burst of 16 clones
const BASE: Frag[] = [
  { kind: 'wa', t: 0.0, nx: 0.76, ny: 0.2, rot: -3, s: 1 }, { kind: 'ios', t: 0.5, nx: 0.83, ny: 0.45, rot: 4, s: 1 },
  { kind: 'sticky', t: 1.0, nx: 0.6, ny: 0.74, rot: -7, s: 1 }, { kind: 'over', t: 1.5, nx: 0.9, ny: 0.72, rot: -2, s: 1 },
  { kind: 'xlsx', t: 2.0, nx: 0.7, ny: 0.62, rot: -6, s: 1 }, { kind: 'pdf', t: 2.5, nx: 0.9, ny: 0.28, rot: 8, s: 1 },
  { kind: 'note', t: 3.0, nx: 0.46, ny: 0.84, rot: -4, s: 1 }, { kind: 'q', t: 3.5, nx: 0.68, ny: 0.4, rot: 6, s: 1 },
  { kind: 'docx', t: 4.0, nx: 0.84, ny: 0.62, rot: 3, s: 1 }, { kind: 'again', t: 4.5, nx: 0.8, ny: 0.44, rot: -3, s: 1 },
  { kind: 'lost', t: 5.0, nx: 0.32, ny: 0.88, rot: 0, s: 1 },
];
const BURST: Frag[] = Array.from({ length: 18 }, (_, i) => ({
  kind: KINDS[Math.floor(hash(i, 11) * KINDS.length)]!, t: 4.4 + i * 0.09,
  nx: 0.08 + hash(i, 12) * 0.84, ny: 0.1 + hash(i, 13) * 0.8, rot: (hash(i, 14) - 0.5) * 22, s: 0.85 + hash(i, 15) * 0.4,
}));
const FRAGS = [...BASE, ...BURST];

const PHASES: { from: number; to: number; tag: string; tone: ToneKey; l1: string; l2: string }[] = [
  { from: 0, to: 2, tag: 'Agenda', tone: 'green', l1: 'Turnos repartidos', l2: 'en mil lugares.' },
  { from: 2, to: 4, tag: 'Seguimiento', tone: 'blue', l1: 'Fichas que nunca', l2: 'están donde buscás.' },
  { from: 4, to: 6, tag: 'Planes', tone: 'yellow', l1: 'Empezar cada plan', l2: 'desde cero.' },
];
const WORDS: [number, string][] = [[6, 'Agenda'], [8, 'Pacientes'], [10, 'Planes'], [12, 'Todo']];

/** Draw one fragment centred at the origin (design px, ~landing mocks at 2.4x). */
function frag(c: CanvasRenderingContext2D, k: Kind, lt: number) {
  const mono = (s: string, x: number, y: number, col: string, px = 13, al: CanvasTextAlign = 'left') => text(c, s, x, y, FONT.mono(px, 500), col, al, px * 0.14);
  switch (k) {
    case 'wa': {
      c.save(); rr(c, -170, -52, 340, 104, 22); c.shadowColor = 'rgba(15,23,42,.18)'; c.shadowBlur = 24; c.shadowOffsetY = 8; c.fillStyle = '#DCFCE7'; c.fill(); c.restore();
      text(c, 'Lucia (paciente)', -146, -14, FONT.sans(17, 700), '#15803D');
      text(c, 'Hola! ¿Podemos cambiar el', -146, 14, FONT.sans(20, 400), '#334155');
      text(c, 'del jueves a las 10?', -146, 38, FONT.sans(20, 400), '#334155');
      break;
    }
    case 'ios': {
      card(c, -150, -42, 300, 84, { r: 14, lift: 0.7 });
      mono('CALENDARIO IPHONE', -128, -10, '#94A3B8', 12);
      text(c, 'Recordatorio: Martin 11h', -128, 22, FONT.sans(21, 600), C.ink);
      break;
    }
    case 'sticky': {
      card(c, -110, -74, 220, 148, { r: 6, fill: '#FEF3C7', border: '#FDE68A', lift: 0.8 });
      text(c, 'Sofia: confirmar', -90, -22, FONT.light(26), '#1E293B'); text(c, 'martes', -90, 8, FONT.light(26), '#1E293B');
      text(c, 'Diego: trae análisis', -90, 48, FONT.light(21), '#475569');
      break;
    }
    case 'over': {
      text(c, '!', -118, 22, FONT.sans(62, 800), '#B91C1C');
      mono('SE SUPERPONE', -92, 12, '#B91C1C', 17);
      break;
    }
    case 'xlsx': {
      card(c, -100, -110, 200, 220, { r: 10, lift: 0.8 });
      rr(c, -80, -92, 26, 26, 5); c.fillStyle = '#15803D'; c.fill(); text(c, 'X', -67, -72, FONT.sans(17, 800), C.white, 'center');
      text(c, 'pacientes_2025.xlsx', -46, -73, FONT.sans(13, 500), '#334155');
      for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) { c.fillStyle = '#F1F5F9'; c.fillRect(-80 + q * 54, -44 + r * 36, 52, 34); c.strokeStyle = '#E2E8F0'; c.lineWidth = 1; c.strokeRect(-80 + q * 54, -44 + r * 36, 52, 34); }
      break;
    }
    case 'pdf': {
      card(c, -84, -108, 168, 216, { r: 10, lift: 0.8 });
      rr(c, -66, -90, 26, 26, 5); c.fillStyle = '#B91C1C'; c.fill(); text(c, 'P', -53, -70, FONT.sans(17, 800), C.white, 'center');
      text(c, 'analisis.pdf', -32, -71, FONT.sans(14, 500), '#334155');
      [1, 0.75, 0.88, 0.62, 0.78, 0.5].forEach((w, i) => { rr(c, -66, -42 + i * 22, 132 * w, 6, 3); c.fillStyle = '#E2E8F0'; c.fill(); });
      break;
    }
    case 'note': {
      card(c, -110, -80, 220, 160, { r: 6, lift: 0.8 });
      text(c, 'Lucia: peso 65', -90, -30, FONT.light(26), '#334155'); text(c, '15/04', -90, 4, FONT.light(26), '#334155'); text(c, '- bajar pan', -90, 38, FONT.light(26), '#334155');
      break;
    }
    case 'q': {
      text(c, '?', 0, 40, FONT.sans(110, 800), '#1E40AF', 'center');
      mono('¿LA ÚLTIMA?', 0, 76, '#1E40AF', 16, 'center');
      break;
    }
    case 'docx': {
      card(c, -125, -140, 250, 280, { r: 10, lift: 1 });
      rr(c, -104, -122, 26, 26, 5); c.fillStyle = '#1E40AF'; c.fill(); text(c, 'W', -91, -102, FONT.sans(17, 800), C.white, 'center');
      text(c, 'Sin título.docx', -70, -103, FONT.sans(15, 500), '#334155');
      c.fillStyle = '#F1F5F9'; c.fillRect(-104, -78, 208, 1.5);
      text(c, 'Plan nutricional', -104, -44, FONT.sans(18, 400), '#CBD5E1');
      const blink = Math.floor(lt * 2) % 2 === 0; if (blink) { c.fillStyle = C.ink; c.fillRect(-104, -22, 2, 24); }
      mono('Página 1 de 1', -104, 116, '#94A3B8', 11); mono('Sin guardar', 104, 116, '#A16207', 11, 'right');
      break;
    }
    case 'again': {
      text(c, '¿de nuevo?', 0, 0, FONT.light(46), '#A16207', 'center');
      c.strokeStyle = '#A16207'; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(-40, 18); c.quadraticCurveTo(0, 62, 46, 38); c.stroke();
      c.beginPath(); c.moveTo(34, 26); c.lineTo(48, 38); c.lineTo(36, 48); c.stroke();
      break;
    }
    case 'lost': {
      icon(c, 'clock', -112, -17, 34, '#A16207', 2);
      mono('2H PERDIDAS', -66, 6, '#A16207', 19);
      break;
    }
  }
}

export default class Caos extends Plate {
  draw(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt, su = portrait ? 1.05 : 1, cx = W / 2, cy = portrait ? H * 0.52 : H * 0.5;
    const pos = (nx: number, ny: number) => ({ x: portrait ? W * (0.24 + nx * 0.52) : nx * W, y: portrait ? (0.36 + ny * 0.6) * H : ny * H });
    const shake = prog(lt, 10, 13.9, ease.inQuad) * 16;
    c.save();
    if (shake > 0) c.translate((noise1(lt * 9, 1) - 0.5) * 2 * shake, (noise1(lt * 9, 2) - 0.5) * 2 * shake);

    // soft tone washes (as on the landing hero)
    const wash = (x: number, y: number, r: number, col: string, a: number) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.globalAlpha = 1; };
    wash(W * 0.2, H * 0.25, W * 0.5, '#DCFCE7', 0.7); wash(W * 0.85, H * 0.3, W * 0.4, '#DBEAFE', 0.6); wash(W * 0.6, H * 0.85, W * 0.45, '#FEF3C7', 0.6);

    // ---- fragments
    const gather = (t: number) => prog(lt, 6.0 + (hash(t, 21) * 2.2), 13.75, ease.inCubic);
    for (let i = 0; i < FRAGS.length; i++) {
      const fr = FRAGS[i]!, a = pop(lt, fr.t, 0.4);
      if (a <= 0) continue;
      const base = pos(fr.nx, fr.ny), ph = hash(i, 5) * 6.28;
      let x = base.x + Math.sin(lt * 0.9 + ph) * 12, y = base.y + Math.cos(lt * 0.7 + ph * 1.3) * 10;
      let rot = (fr.rot * Math.PI) / 180 * (1 + 0.5 * (1 - a)) + Math.sin(lt * 0.8 + ph) * 0.02, sc = su * fr.s * (0.7 + 0.3 * a);
      // a beat nudge on everything that is already there
      sc *= 1 + 0.025 * pulse(lt % B, 0, 0.1) * (lt > 1 ? 1 : 0);
      let al = Math.min(1, a * 1.4);
      const g = gather(i);
      if (g > 0) {
        const dx = x - cx, dy = y - cy, r0 = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx), dir = hash(i, 9) > 0.5 ? 1 : -1;
        const r = r0 * (1 - g), an = a0 + g * 2.6 * dir;
        x = cx + Math.cos(an) * r; y = cy + Math.sin(an) * r; rot += g * 3 * dir; sc *= 1 - 0.78 * g; al *= 1 - ease.inQuad(prog(g, 0.82, 1));
      }
      c.save(); c.globalAlpha = al; c.translate(x, y); c.rotate(rot); c.scale(sc, sc);
      frag(c, fr.kind, lt);
      c.restore();
    }

    // ---- headline, one phase per bar (0-8 s)
    const tx = portrait ? 80 : 130, ty = portrait ? 330 : 250, sz = portrait ? 100 : 124;
    for (const ph of PHASES) {
      if (lt < ph.from || lt >= ph.to) continue;
      const u = lt - ph.from, out = prog(lt, ph.to - 0.22, ph.to, ease.inCubic);
      const tn = TONES[ph.tone];
      c.save(); c.globalAlpha = 1 - out;
      const lh = sz * 1.06, w = W - tx;
      eyebrow(c, ph.tag, tx + 4, ty - sz * 1.02 - 6, tn.text, portrait ? 20 : 24);
      slideUp(c, tx, ty, w, lh, ease.outExpo(prog(u, 0.0, 0.5)), (y) => hero(c, ph.l1, tx, y, sz, C.ink, 'left', 800, C.bg));
      slideUp(c, tx, ty + lh, w, lh, ease.outExpo(prog(u, 0.12, 0.62)), (y) => hero(c, ph.l2, tx, y, sz, tn.text, 'left', 800, C.bg));
      c.restore();
    }

    // ---- build 6-14: the isotipo pulls everything in; a word per bar
    if (lt >= 6) {
      const grow = prog(lt, 6, 13.8, ease.inOutCubic), beatP = pulse(lt - 6, Math.floor((lt - 6) / B) * B, 0.09);
      const hh = lerp(90, portrait ? 420 : 380, grow) * (1 + 0.05 * beatP);
      const gl = c.createRadialGradient(cx, cy, 0, cx, cy, hh * 1.6);
      gl.addColorStop(0, 'rgba(45,139,87,0.28)'); gl.addColorStop(1, 'rgba(45,139,87,0)');
      c.globalAlpha = Math.min(1, (lt - 6) * 2) * 0.9; c.fillStyle = gl; c.fillRect(cx - hh * 2, cy - hh * 2, hh * 4, hh * 4);
      c.globalAlpha = Math.min(1, (lt - 6) * 3);
      isotipo(c, cx - isoW(hh) / 2, cy - hh / 2, hh);
      c.globalAlpha = 1;
      for (let i = 0; i < WORDS.length; i++) {
        const [t0, word] = WORDS[i]!, t1 = i === 3 ? 14 : t0 + 2;
        if (lt < t0 || lt >= t1) continue;
        const u = lt - t0, s = 1 + 0.5 * (1 - ease.outExpo(prog(u, 0, 0.3))), out = i === 3 ? 0 : prog(lt, t1 - 0.2, t1, ease.inCubic);
        c.save(); c.globalAlpha = (1 - out) * prog(u, 0, 0.12);
        const size = portrait ? 170 : 210, wy = portrait ? H * 0.2 + 70 : H * 0.28;
        c.translate(cx, wy); c.scale(s, s);
        eyebrow(c, i === 3 ? 'Un solo lugar' : 'NutriOne', 0, -size * 0.92, C.logo, portrait ? 20 : 24, 'center');
        hero(c, word, 0, 0, size, i === 3 ? C.logo : C.ink, 'center', 800, C.bg);
        c.restore();
      }
    }
    c.restore();

    // ---- flash into the drop
    const fl = prog(lt, 13.45, 13.98, ease.inQuad);
    if (fl > 0) { c.globalAlpha = fl; c.fillStyle = C.white; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  }
}
