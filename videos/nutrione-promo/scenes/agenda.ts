// 20-24 s. Agenda: the week with its appointments, "Nuevo turno" (the real dialog), the new block, then the Mes view.
import type { Frame } from '@engine/scene';
import { Plate } from '../plate';
import { SLOW } from '../frame';
import { WIN, W, H, portrait, HEAD } from '../frame';
import { C, FONT, TONES, card, rr, text } from '../brand';
import { icon } from '../icons';
import {
  AW, sidebar, pageHeader, button, weekGrid, apptBlock, cursor, clickRing, path, hero, eyebrow, slideUp, pop, rise,
  inWindow, track, scaled, range, type Block, type Rect, type ApptStatus,
} from '../ui';
import { ease, prog, lerp } from '@engine/util';
import { WEEK, WEEK_EXTRA, NEW_APPT, WEEK_DAYS, MONTH_EVENTS, MONTH_FIRST_DOW, MONTH_DAYS } from '../data';

const GX = 257, GY = 85, GW = 1166;
const HOURS: [number, number] = [8, 14];
const T_DLG = 1.55, T_SAVE = 2.8, T_NEW = 3.1, T_MES = 3.5;

const BLOCKS: Block[] = [
  ...WEEK.map((e) => ({ day: e.day, h0: e.h0, dur: 60, name: e.name, st: e.st, t: -1 })),
  ...WEEK_EXTRA.map((e, i) => ({ day: e.day, h0: e.h0, dur: 60, name: e.name, st: e.st, t: 0.5 + i * 0.25 })),
  { day: NEW_APPT.day, h0: NEW_APPT.h0, dur: 60, name: NEW_APPT.name, st: 'scheduled' as ApptStatus, t: T_NEW },
];

/** Lets a string "type" itself: first n characters at `rate` chars/s since `t0`. */
const typed = (s: string, lt: number, t0: number, rate = 22) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor((lt - t0) * rate) + 1)));

function input(c: CanvasRenderingContext2D, x: number, y: number, w: number, label: string, value: string, placeholder: string, focus: boolean, ic?: 'calendar' | 'chevron-down', chev = false) {
  text(c, label, x, y, FONT.sans(14, 500), C.ink);
  rr(c, x, y + 8, w, 36, 6); c.fillStyle = C.white; c.fill();
  c.lineWidth = focus ? 2 : 1; c.strokeStyle = focus ? C.logo : C.line; c.stroke();
  let tx = x + 13;
  if (ic === 'calendar') { icon(c, 'calendar', x + 13, y + 17, 16, C.muted, 1.8); tx += 24; }
  text(c, value || placeholder, tx, y + 31, FONT.sans(14, 400), value ? C.ink : C.muted);
  if (chev) icon(c, 'chevron-down', x + w - 28, y + 18, 16, C.muted, 1.8);
}

function dialog(c: CanvasRenderingContext2D, lt: number, press: number) {
  const x = 496, y = 190, w = 448, h = 350;
  const a = prog(lt, T_DLG, T_DLG + 0.22, ease.outCubic), out = prog(lt, T_SAVE + 0.12, T_SAVE + 0.3, ease.inCubic);
  if (a <= 0 || out >= 1) return;
  const al = a * (1 - out);
  // dim over the whole app
  c.save(); c.globalAlpha = 0.42 * al; c.fillStyle = '#000'; c.fillRect(-2000, -2000, 6000, 6000); c.restore();
  const s = lerp(0.94, 1, ease.outBack(prog(lt, T_DLG, T_DLG + 0.3))) * (1 - 0.04 * out);
  scaled(c, x + w / 2, y + h / 2, s, al, () => {
    card(c, x, y, w, h, { r: 12, lift: 1.4, border: C.white });
    text(c, 'Nuevo Turno', x + 25, y + 42, FONT.sans(18, 600), C.ink);
    icon(c, 'x', x + w - 38, y + 17, 16, C.muted, 1.8);
    const pac = lt > 1.85 ? 'Martin Acosta' : '';
    input(c, x + 25, y + 74, 398, 'Paciente', pac, 'Selecciona un paciente', lt > 1.7 && lt < 2.0, undefined, true);
    input(c, x + 25, y + 148, 398, 'Fecha', lt > 2.0 ? '14/10/2026' : '11/10/2026', '', lt > 2.0 && lt < 2.1, 'calendar');
    const hi = lt < 2.1 ? '19:53' : typed('11:00', lt, 2.1, 20), hf = typed('12:00', lt, 2.35, 20);
    input(c, x + 25, y + 222, 191, 'Hora Inicio', hi, '', lt >= 2.1 && lt < 2.35);
    input(c, x + 232, y + 222, 191, 'Hora Fin', lt >= 2.35 ? hf : '', 'hh:mm', lt >= 2.35 && lt < T_SAVE - 0.1);
    text(c, 'Cancelar', x + 240, y + 312, FONT.sans(14, 500), C.ink, 'center');
    button(c, x + 294, y + 289, 36, 'Guardar Turno', { variant: 'outline', press, hover: press > 0 ? 1 : 0 });
  });
}

function monthView(c: CanvasRenderingContext2D, lt: number, t0: number) {
  const x = GX, y = GY, w = GW, head = 33, rows = 5, ch = 96.5, cw = w / 7;
  card(c, x, y, w, head + rows * ch, { r: 12, lift: 0, border: C.line });
  c.save(); rr(c, x, y, w, head + rows * ch, 12); c.clip();
  ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].forEach((d, i) => text(c, d, x + cw * (i + 0.5), y + 22, FONT.sans(12, 500), C.muted, 'center', 1));
  c.fillStyle = C.line; c.fillRect(x, y + head, w, 1);
  for (let i = 1; i < 7; i++) c.fillRect(x + cw * i, y + head, 1, rows * ch);
  for (let r = 1; r < rows; r++) c.fillRect(x, y + head + r * ch, w, 1);
  for (let cell = 0; cell < rows * 7; cell++) {
    const day = cell - MONTH_FIRST_DOW + 1, r = Math.floor(cell / 7), q = cell % 7;
    const inMonth = day >= 1 && day <= MONTH_DAYS, label = inMonth ? day : day < 1 ? 30 + day : day - MONTH_DAYS;
    const cx = x + cw * (q + 1) - 12, cy = y + head + r * ch;
    const ap = rise(lt, t0 + (r * 0.05 + q * 0.015), 0.25);
    c.save(); c.globalAlpha = ap;
    text(c, String(label), cx, cy + 22, FONT.sans(14, 600), inMonth ? C.ink : C.muted, 'right');
    if (inMonth && day === 12) { c.beginPath(); c.arc(cx - 6, cy + 17, 15, 0, 6.2832); c.strokeStyle = C.logo; c.lineWidth = 2; c.stroke(); }
    (inMonth ? MONTH_EVENTS[day] ?? [] : []).forEach((ev, i) => {
      const ey = cy + 44 + i * 22, dot = ev.st === 'completed' ? '#16A34A' : '#2563EB';
      c.beginPath(); c.arc(x + cw * q + 15, ey - 4, 3.2, 0, 6.2832); c.fillStyle = dot; c.fill();
      c.font = FONT.sans(12, 400);
      const tw = c.measureText(ev.t).width;
      text(c, ev.t, x + cw * q + 24, ey, FONT.sans(12, 400), C.muted);
      text(c, ev.name, x + cw * q + 24 + tw + 6, ey, FONT.sans(12, 600), C.ink);
    });
    c.restore();
  }
  c.restore();
}

export default class Agenda extends Plate {
  draw(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt / SLOW, win = WIN;
    const L: [number, Rect][] = [[0, [0, 20, 560, 270]], [0.6, [0, 0, AW, 782]], [1.35, [0, 0, AW, 782]], [1.8, [420, 120, 640, 460]], [2.8, [420, 120, 640, 460]], [3.25, [0, 0, AW, 782]]];
    const P: [number, Rect][] = [[0, [0, 20, 520, 520]], [0.6, [250, 50, 700, 700]], [1.35, [250, 50, 700, 700]], [1.8, [430, 150, 580, 560]], [2.8, [430, 150, 580, 560]], [3.25, [250, 50, 700, 700]], [3.55, [250, 50, 700, 700]]];
    const cam = track(win, lt, portrait ? P : L);

    // cursor script (app coords)
    const NEWBTN = { x: 1351, y: 34 }, GUARDAR = { x: 850, y: 502 }, MES = { x: 1248, y: 34 };
    const cur = path(lt, [[0.7, 1180, 470], [1.45, NEWBTN.x - 20, NEWBTN.y + 10], [1.9, 700, 300], [2.55, 760, 380], [T_SAVE, GUARDAR.x, GUARDAR.y], [3.1, GUARDAR.x + 6, GUARDAR.y + 4], [3.45, MES.x - 6, MES.y + 6]]);
    const press1 = prog(lt, 1.5, 1.56) * (1 - prog(lt, 1.56, 1.66)), press2 = prog(lt, T_SAVE, T_SAVE + 0.06) * (1 - prog(lt, T_SAVE + 0.06, T_SAVE + 0.16)), press3 = prog(lt, T_MES, T_MES + 0.06) * (1 - prog(lt, T_MES + 0.06, T_MES + 0.16));
    const month = ease.inOutCubic(prog(lt, T_MES, T_MES + 0.35));
    const isMes = lt >= T_MES;

    inWindow(c, win, cam, () => {
      pageHeader(c, 69);
      // header: nav + toggle + new
      rr(c, 264, 18, 31, 31, 6); c.strokeStyle = C.line; c.lineWidth = 1; c.stroke(); icon(c, 'chevron-left', 272, 26, 15, C.ink, 2);
      button(c, 304, 17, 33, 'Hoy', { variant: 'outline' });
      rr(c, 364, 18, 31, 31, 6); c.stroke(); icon(c, 'chevron-right', 372, 26, 15, C.ink, 2);
      text(c, 'Octubre 2026', 412, 39, FONT.sans(15, 600), C.ink);
      // Día | Semana | Mes
      const seg = [['Día', 1098, 47], ['Semana', 1145, 78], ['Mes', 1223, 52]] as const;
      rr(c, 1098, 18, 177, 33, 6); c.fillStyle = C.white; c.fill(); c.strokeStyle = C.line; c.stroke();
      seg.forEach(([l, sx, sw], i) => {
        const on = (i === 1 && !isMes) || (i === 2 && isMes);
        if (on) { c.save(); rr(c, 1098, 18, 177, 33, 6); c.clip(); c.fillStyle = C.logo; c.fillRect(sx, 18, sw, 33); c.restore(); }
        text(c, l, sx + sw / 2, 39, FONT.sans(14, 500), on ? C.white : C.ink, 'center');
      });
      button(c, 1287, 16, 36, 'Nuevo turno', { icon: 'plus', press: press1 });

      // week / month with a quick cross-fade
      c.save(); c.globalAlpha = 1 - month; c.translate(0, -month * 10);
      if (month < 1) weekGrid(c, { x: GX, y: GY, w: GW, hours: HOURS, days: WEEK_DAYS, blocks: BLOCKS, lt, gutter: 56 });
      c.restore();
      if (month > 0) { c.save(); c.globalAlpha = month; monthView(c, lt, T_MES + 0.05); c.restore(); }
      // ring around the block that was just created
      const rp = prog(lt, T_NEW, T_NEW + 0.55, ease.outCubic);
      if (rp > 0 && rp < 1 && month < 0.5) {
        const cw = (GW - 56) / 7, bx = GX + 56 + cw * NEW_APPT.day + 3, by = GY + 64 + (NEW_APPT.h0 - HOURS[0]) * 64 + 1;
        c.save(); c.globalAlpha = 0.7 * (1 - rp); c.lineWidth = 3; c.strokeStyle = '#2563EB'; rr(c, bx - 8 * rp, by - 8 * rp, cw - 6 + 16 * rp, 62 + 16 * rp, 10); c.stroke(); c.restore();
      }
      sidebar(c, 'agenda');
      dialog(c, lt, press2);
      if (lt > 0.7) { clickRing(c, NEWBTN.x - 20, NEWBTN.y + 10, lt, 1.5, 26); clickRing(c, GUARDAR.x, GUARDAR.y, lt, T_SAVE, 26); clickRing(c, MES.x - 6, MES.y + 6, lt, T_MES, 26); cursor(c, cur.x, cur.y, Math.max(press1, press2, press3), 1.1); }
    });

    // ---- caption
    if (portrait) {
      eyebrow(c, 'Agenda', HEAD.x + 4, HEAD.y - 96, C.logo, 20);
      slideUp(c, HEAD.x, HEAD.y, W, 100, ease.outExpo(prog(lt, 0.1, 0.6)), (y) => hero(c, 'Agenda con vista', HEAD.x, y, 96, C.ink));
      slideUp(c, HEAD.x, HEAD.y + 100, W, 100, ease.outExpo(prog(lt, 0.2, 0.7)), (y) => hero(c, 'día, semana y mes.', HEAD.x, y, 96, TONES.green.text));
    } else {
      const out = prog(lt, 1.15, 1.4, ease.inCubic);
      if (out < 1) {
        c.save(); c.globalAlpha = 1 - out; c.translate(0, out * 40);
        eyebrow(c, 'Agenda', 392, 808, C.logo, 20);
        slideUp(c, 388, 906, W - 388, 90, ease.outExpo(prog(lt, 0.35, 0.85)), (y) => hero(c, 'Agenda con vista día, semana y mes.', 388, y, 82, C.ink));
        c.restore();
      }
    }
  }
}
