// Vertical 0-11s: the mess snaps into one day view (a week does not fit 1080 px wide).
import type { Frame } from '@engine/scene';
import { Plate, W } from './_plate';
import { C, FONT, TONES, card, rr, text, type ToneKey } from './_brand';
import { heading, num } from './_ui';
import { ease, prog, lerp, hash } from '@engine/util';

const FX = 60, FY = 470, FW = 960, FH = 1010;
const GY = FY + 70, SLOT = 100, CX = 200, CW = 780, CH = 84;

interface Appt { name: string; tone: ToneKey }
// one appointment per 30-minute slot from 09:00
const APPTS: Appt[] = [
  { name: 'Valentina R.', tone: 'green' }, { name: 'Carlos M.', tone: 'blue' }, { name: 'Lucía F.', tone: 'yellow' },
  { name: 'Mateo B.', tone: 'green' }, { name: 'Sofía A.', tone: 'blue' }, { name: 'Diego P.', tone: 'green' },
  { name: 'Andrea G.', tone: 'yellow' }, { name: 'Julián C.', tone: 'blue' }, { name: 'Camila S.', tone: 'green' },
];
type Junk = { kind: 'chat' | 'note' | 'file'; s: string; tone: ToneKey };
const JUNK: Junk[] = [
  { kind: 'chat', s: '¿Me confirmás el jueves?', tone: 'green' },
  { kind: 'note', s: 'llamar a Rosa\n¿martes o miércoles?', tone: 'yellow' },
  { kind: 'file', s: 'fichas_FINAL_v2.xlsx', tone: 'blue' },
  { kind: 'chat', s: 'No llego, ¿puedo mañana?', tone: 'green' },
  { kind: 'note', s: 'pasar plan\na Don Pedro', tone: 'yellow' },
  { kind: 'file', s: 'plan_nuevo(3).docx', tone: 'red' },
  { kind: 'note', s: '10:30 ¿o 11?', tone: 'red' },
];
const slotY = (k: number) => GY + k * SLOT + (SLOT - CH) / 2;
const time = (k: number) => `${String(9 + Math.floor(k / 2)).padStart(2, '0')}:${k % 2 ? '30' : '00'}`;

function chaos(k: number, t: number) {
  const bx = 330 + hash(k, 1) * 420, by = 600 + hash(k, 2) * 760;
  const ph = hash(k, 3) * 6.28;
  return { x: bx + Math.sin(t * 0.55 + ph) * 30, y: by + Math.cos(t * 0.42 + ph * 1.7) * 24, r: (hash(k, 4) - 0.5) * 0.5 + Math.sin(t * 0.5 + ph) * 0.045 };
}

function drawAppt(c: CanvasRenderingContext2D, a: Appt, k: number, x: number, y: number, lift: number, done = 0) {
  const tn = TONES[a.tone];
  card(c, x, y, CW, CH, { r: 14, fill: tn.soft, border: tn.border, lift });
  c.save(); rr(c, x, y, CW, CH, 14); c.clip(); c.fillStyle = tn.text; c.fillRect(x, y, 7, CH); c.restore();
  text(c, a.name, x + 28, y + 52, FONT.sans(30, 600), C.ink);
  text(c, time(k), x + CW - 28 - (done > 0 ? 56 : 0), y + 52, FONT.mono(24, 500), tn.text, 'right');
  if (done > 0) {
    const s = ease.outBack(done), cx = x + CW - 38, cy = y + CH / 2;
    c.save(); c.translate(cx, cy); c.scale(s, s);
    c.beginPath(); c.arc(0, 0, 17, 0, 6.283); c.fillStyle = C.bright; c.fill();
    c.strokeStyle = C.white; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-7, 0.5); c.lineTo(-2, 6); c.lineTo(8, -6); c.stroke();
    c.restore();
  }
}

function drawJunk(c: CanvasRenderingContext2D, j: Junk, x: number, y: number) {
  const tn = TONES[j.tone];
  if (j.kind === 'chat') {
    card(c, x, y, 360, 84, { r: 22, fill: '#DCF8C6', border: '#B7E4A0', lift: 0.8 });
    text(c, j.s, x + 22, y + 36, FONT.sans(22, 500), '#14301B');
    text(c, 'WhatsApp  ·  11:42 ✓✓', x + 22, y + 64, FONT.mono(15, 400), '#4B7A57');
  } else if (j.kind === 'note') {
    card(c, x, y, 290, 130, { r: 6, fill: '#FEF08A', border: '#FACC15', lift: 0.9 });
    j.s.split('\n').forEach((l, i) => text(c, l, x + 20, y + 48 + i * 34, FONT.displayItalic(25), '#713F12'));
  } else {
    card(c, x, y, 290, 72, { r: 12, fill: tn.bg, border: tn.border, lift: 0.8 });
    text(c, j.s, x + 22, y + 44, FONT.mono(20, 500), tn.text);
  }
}

export default class VAgenda extends Plate {
  draw(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt;
    const frameIn = prog(lt, 5.0, 6.2, ease.outCubic);
    if (frameIn > 0) {
      c.save(); c.globalAlpha = frameIn; c.translate(0, (1 - frameIn) * 30);
      card(c, FX, FY, FW, FH, { r: 28, lift: 0.8 });
      text(c, 'HOY · LUNES', FX + 40, FY + 46, FONT.mono(20, 500), C.muted, 'left', 3);
      c.strokeStyle = C.line; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(FX + 24, GY - 6); c.lineTo(FX + FW - 24, GY - 6); c.stroke();
      for (let k = 0; k < 9; k += 2) text(c, time(k), CX - 24, slotY(k) + 52, FONT.mono(20, 400), C.muted, 'right');
      c.restore();
    }

    JUNK.forEach((j, k) => {
      const appear = prog(lt, 0.5 + k * 0.22, 1.0 + k * 0.22, ease.outBack);
      const gone = prog(lt, 4.9 + k * 0.05, 5.7 + k * 0.05, ease.inCubic);
      const s = appear * (1 - gone * 0.7) * 0.85;
      if (s <= 0.01 || gone >= 1) return;
      const p = chaos(k + 20, lt);
      c.save(); c.globalAlpha = (1 - gone) * Math.min(1, appear * 2);
      c.translate(p.x, p.y - gone * 70); c.rotate(p.r * (1 - gone)); c.scale(s, s);
      drawJunk(c, j, -150, -50);
      c.restore();
    });

    const order = [0, 4, 8, 2, 6, 1, 5, 3, 7];
    APPTS.forEach((a, k) => {
      const appear = prog(lt, 0.3 + k * 0.25, 0.9 + k * 0.25, ease.outBack);
      const move = prog(lt, 5.3 + order.indexOf(k) * 0.1, 6.5 + order.indexOf(k) * 0.1, ease.inOutCubic);
      const p = chaos(k, lt);
      const x = lerp(p.x - CW / 2, CX, move), y = lerp(p.y - CH / 2, slotY(k), move), r = lerp(p.r, 0, move);
      const scale = appear * lerp(0.62, 1, move) * (1 + 0.04 * Math.sin(move * Math.PI));
      if (scale <= 0.01) return;
      const done = a.tone === 'green' ? prog(lt, 8.4 + k * 0.25, 8.9 + k * 0.25) : 0;
      // scale about the card centre
      c.save(); c.translate(x + CW / 2, y + CH / 2); c.rotate(r); c.scale(scale, scale); c.globalAlpha = Math.min(1, appear * 2);
      drawAppt(c, a, k, -CW / 2, -CH / 2, lerp(1.1, 0.45, move), done);
      c.restore();
    });

    const now = prog(lt, 7.8, 10.4, ease.inOutQuad);
    if (now > 0 && now < 1) {
      const ny = GY + 6 + now * (SLOT * 8.6);
      c.save(); c.globalAlpha = Math.min(1, now * 8) * Math.min(1, (1 - now) * 8);
      c.strokeStyle = C.bright; c.lineWidth = 3;
      c.beginPath(); c.moveTo(CX - 12, ny); c.lineTo(FX + FW - 24, ny); c.stroke();
      c.beginPath(); c.arc(CX - 12, ny, 8, 0, 6.283); c.fillStyle = C.bright; c.fill();
      c.restore();
    }

    const places = Math.round(lerp(7, 1, prog(lt, 5.3, 6.9, ease.inOutCubic)));
    text(c, num(places, 0), W - 80, 360, FONT.display(130, 700), places === 1 ? C.brand : C.ink, 'right');
    text(c, places === 1 ? 'lugar para tus turnos' : 'lugares para tus turnos', W - 80, 406, FONT.sans(24, 500), C.muted, 'right');

    heading(c, lt, [
      { from: 0.3, to: 5.4, eyebrow: 'EL PROBLEMA', tone: 'red', lines: ['El desorden te', 'cuesta tiempo.'], accent: 1 },
      { from: 5.7, to: 11, eyebrow: 'AGENDA', tone: 'green', lines: ['Tu día,', 'a la vista.'], accent: 1 },
    ], 80, 210, 84);
  }
}
