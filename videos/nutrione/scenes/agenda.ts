// 0-11s: the mess (appointments, chats, files, notes scattered everywhere) snaps into one weekly agenda.
import type { Frame } from '@engine/scene';
import { Plate, W } from './_plate';
import { C, FONT, TONES, card, rr, text, type ToneKey } from './_brand';
import { heading, num } from './_ui';
import { ease, prog, lerp, hash } from '@engine/util';

// ---- agenda geometry
const FX = 140, FY = 340, FW = 1640, FH = 660;
const GX = 240, HEAD = 64, COLW = 304;
const GY = FY + HEAD, ROWH = 97;
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];
const CW = 280, CH = 84;

interface Appt { name: string; day: number; row: number; tone: ToneKey; min: number }
const APPTS: Appt[] = [
  { name: 'Valentina R.', day: 0, row: 0, tone: 'green', min: 0 },
  { name: 'Carlos M.', day: 0, row: 2, tone: 'blue', min: 30 },
  { name: 'Lucía F.', day: 1, row: 1, tone: 'yellow', min: 0 },
  { name: 'Mateo B.', day: 1, row: 3, tone: 'green', min: 30 },
  { name: 'Sofía A.', day: 2, row: 0, tone: 'blue', min: 30 },
  { name: 'Diego P.', day: 2, row: 2, tone: 'green', min: 0 },
  { name: 'Andrea G.', day: 3, row: 1, tone: 'yellow', min: 30 },
  { name: 'Julián C.', day: 3, row: 4, tone: 'blue', min: 0 },
  { name: 'Camila S.', day: 4, row: 2, tone: 'green', min: 30 },
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

const slot = (a: Appt) => ({ x: GX + a.day * COLW + (COLW - CW) / 2, y: GY + a.row * ROWH + (ROWH - CH) / 2 });
const hh = (a: Appt) => `${String(9 + a.row).padStart(2, '0')}:${a.min === 0 ? '00' : '30'}`;

/** Where card k floats while it is still chaos (a slow seeded drift). */
function chaos(k: number, t: number) {
  const bx = 190 + hash(k, 1) * 1380, by = 400 + hash(k, 2) * 430;
  const ph = hash(k, 3) * 6.28;
  return {
    x: bx + Math.sin(t * 0.55 + ph) * 34, y: by + Math.cos(t * 0.42 + ph * 1.7) * 26,
    r: (hash(k, 4) - 0.5) * 0.5 + Math.sin(t * 0.5 + ph) * 0.045,
  };
}

function drawAppt(c: CanvasRenderingContext2D, a: Appt, x: number, y: number, lift: number, done = 0) {
  const tn = TONES[a.tone];
  card(c, x, y, CW, CH, { r: 14, fill: tn.soft, border: tn.border, lift });
  c.save();
  rr(c, x, y, CW, CH, 14); c.clip();
  c.fillStyle = tn.text; c.fillRect(x, y, 7, CH);
  c.restore();
  text(c, a.name, x + 26, y + 38, FONT.sans(25, 600), C.ink);
  text(c, hh(a), x + 26, y + 66, FONT.mono(19, 500), tn.text);
  if (done > 0) {
    const s = ease.outBack(done), cx = x + CW - 34, cy = y + CH / 2;
    c.save(); c.translate(cx, cy); c.scale(s, s);
    c.beginPath(); c.arc(0, 0, 15, 0, 6.283); c.fillStyle = C.bright; c.fill();
    c.strokeStyle = C.white; c.lineWidth = 3.5; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-6, 0.5); c.lineTo(-1.5, 5); c.lineTo(7, -5); c.stroke();
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

export default class Agenda extends Plate {
  draw(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt;
    const frameIn = prog(lt, 5.0, 6.2, ease.outCubic);

    // the agenda frame appears behind the cards once the cleanup starts
    if (frameIn > 0) {
      c.save();
      c.globalAlpha = frameIn;
      c.translate(0, (1 - frameIn) * 30);
      card(c, FX, FY, FW, FH, { r: 28, lift: 0.8 });
      DAYS.forEach((d, i) => text(c, d.toUpperCase(), GX + i * COLW + COLW / 2, FY + 42, FONT.mono(20, 500), C.muted, 'center', 3));
      c.strokeStyle = C.line; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(FX + 24, FY + HEAD); c.lineTo(FX + FW - 24, FY + HEAD); c.stroke();
      HOURS.forEach((h, i) => {
        text(c, h, GX - 22, GY + i * ROWH + 30, FONT.mono(18, 400), C.muted, 'right');
        if (i > 0) { c.beginPath(); c.moveTo(GX - 10, GY + i * ROWH); c.lineTo(FX + FW - 24, GY + i * ROWH); c.stroke(); }
      });
      c.restore();
    }

    // junk: floats, then gets swept away as the agenda forms
    JUNK.forEach((j, k) => {
      const appear = prog(lt, 0.5 + k * 0.22, 1.0 + k * 0.22, ease.outBack);
      const gone = prog(lt, 4.9 + k * 0.05, 5.7 + k * 0.05, ease.inCubic);
      const s = appear * (1 - gone * 0.7);
      if (s <= 0.01 || gone >= 1) return;
      const p = chaos(k + 20, lt);
      c.save();
      c.globalAlpha = (1 - gone) * Math.min(1, appear * 2);
      c.translate(p.x, p.y - gone * 70);
      c.rotate(p.r * (1 - gone));
      c.scale(s, s);
      drawJunk(c, j, 0, 0);
      c.restore();
    });

    // appointments: float as chaos, then settle into their slot, one after another
    const order = [0, 4, 8, 2, 6, 1, 5, 3, 7];
    APPTS.forEach((a, k) => {
      const appear = prog(lt, 0.3 + k * 0.25, 0.9 + k * 0.25, ease.outBack);
      const move = prog(lt, 5.3 + order.indexOf(k) * 0.1, 6.5 + order.indexOf(k) * 0.1, ease.inOutCubic);
      const p = chaos(k, lt), s = slot(a);
      const x = lerp(p.x, s.x, move), y = lerp(p.y, s.y, move), r = lerp(p.r, 0, move);
      const scale = appear * (1 + 0.05 * Math.sin(move * Math.PI));
      if (scale <= 0.01) return;
      const done = a.tone === 'green' ? prog(lt, 8.4 + (a.day + a.row * 0.3) * 0.25, 8.9 + (a.day + a.row * 0.3) * 0.25) : 0;
      c.save();
      c.translate(x + CW / 2, y + CH / 2);
      c.rotate(r);
      c.scale(scale, scale);
      c.globalAlpha = Math.min(1, appear * 2);
      drawAppt(c, a, -CW / 2, -CH / 2, lerp(1.1, 0.45, move), done);
      c.restore();
    });

    // "now" line sweeping the week once everything is in place
    const now = prog(lt, 7.8, 10.4, ease.inOutQuad);
    if (now > 0 && now < 1) {
      const ny = GY + 12 + now * (ROWH * 4.6);
      c.save();
      c.globalAlpha = Math.min(1, now * 8) * Math.min(1, (1 - now) * 8);
      c.strokeStyle = C.bright; c.lineWidth = 3;
      c.beginPath(); c.moveTo(GX, ny); c.lineTo(FX + FW - 24, ny); c.stroke();
      c.beginPath(); c.arc(GX - 4, ny, 8, 0, 6.283); c.fillStyle = C.bright; c.fill();
      c.restore();
    }

    // counter, top-right: the count of "places" shrinks to 1
    const places = Math.round(lerp(7, 1, prog(lt, 5.3, 6.9, ease.inOutCubic)));
    const label = places === 1 ? 'lugar' : 'lugares';
    text(c, num(places, 0), W - 140 - 150, 214, FONT.display(120, 700), places === 1 ? C.brand : C.ink, 'right');
    text(c, label, W - 140 - 130, 188, FONT.sans(28, 500), C.muted);
    text(c, 'para tus turnos', W - 140 - 130, 224, FONT.sans(28, 500), C.muted);

    heading(c, lt, [
      { from: 0.3, to: 5.4, eyebrow: 'EL PROBLEMA', tone: 'red', lines: ['El desorden te', 'cuesta tiempo.'], accent: 1 },
      { from: 5.7, to: 11, eyebrow: 'AGENDA', tone: 'green', lines: ['Tu semana,', 'a la vista.'], accent: 1 },
    ]);
  }
}
