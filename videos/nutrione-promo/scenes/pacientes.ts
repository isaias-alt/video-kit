// 24-28 s. Pacientes: the real list, a click on a row, a green wipe on the bar line (26.0) and the patient file (ficha)
// assembling card by card.
import type { Frame } from '@engine/scene';
import { Plate } from '../plate';
import { SLOW } from '../frame';
import { WIN, W, H, portrait, HEAD } from '../frame';
import { C, FONT, TONES, card, rr, text } from '../brand';
import { icon } from '../icons';
import { fichaPage } from '../pages';
import {
  AW, sidebar, pageHeader, button, badge, avatar, initials, cursor, clickRing, path, hero, eyebrow, slideUp, pop, rise,
  inWindow, track, scaled, type Rect, type Tag,
} from '../ui';
import { ease, prog, lerp } from '@engine/util';

const SWITCH = 2.0; // list -> ficha, under the green wipe

interface Row { name: string; email: string; doc: string; tel: string; st: 'Activo' | 'Pausado'; last: string; next: string }
const ROWS: Row[] = [
  { name: 'Roberto Sosa', email: 'roberto.sosa@email.com', doc: '5678901', tel: '+595 984 345678', st: 'Activo', last: '05/10/2026', next: '15/10/2026' },
  { name: 'Ana Rodriguez', email: 'ana.rodriguez@email.com', doc: '2345678', tel: '+595 983 789012', st: 'Pausado', last: '21/09/2026', next: '—' },
  { name: 'Jorge Villalba', email: 'jorge.villalba@email.com', doc: '0987654', tel: '+595 981 246810', st: 'Activo', last: '28/09/2026', next: '12/10/2026' },
  { name: 'Martin Acosta', email: 'martin.acosta@email.com', doc: '9345678', tel: '+595 988 777888', st: 'Activo', last: '30/09/2026', next: '13/10/2026' },
  { name: 'Camila Rios', email: 'camila.rios@email.com', doc: '8765432', tel: '+595 982 135791', st: 'Activo', last: '02/10/2026', next: '15/10/2026' },
  { name: 'Valentina Lopez', email: 'valentina.lopez@email.com', doc: '6123456', tel: '+595 985 111222', st: 'Activo', last: '29/09/2026', next: '12/10/2026' },
  { name: 'Diego Fernandez', email: 'diego.fernandez@email.com', doc: '7234567', tel: '+595 986 333444', st: 'Activo', last: '01/10/2026', next: '14/10/2026' },
  { name: 'Laura Gimenez', email: 'laura.gimenez@email.com', doc: '3456789', tel: '+595 989 999000', st: 'Activo', last: '06/10/2026', next: '16/10/2026' },
];
const ROW_Y = 223, ROW_H = 53;

function field(c: CanvasRenderingContext2D, x: number, y: number, w: number, label: string, ph: string, ic?: 'search', chev = false, value = '') {
  text(c, label, x, y, FONT.sans(14, 500), C.ink);
  rr(c, x, y + 8, w, 36, 6); c.fillStyle = C.white; c.fill(); c.lineWidth = 1; c.strokeStyle = C.line; c.stroke();
  let tx = x + 12;
  if (ic) { icon(c, 'search', x + 12, y + 18, 16, C.muted, 1.8); tx += 25; }
  text(c, value || ph, tx, y + 31, FONT.sans(14, value ? 500 : 400), value ? C.ink : C.muted);
  if (chev) icon(c, 'chevron-down', x + w - 26, y + 18, 16, C.ink, 1.8);
}

function listPage(c: CanvasRenderingContext2D, lt: number, hoverRow: number, press: number) {
  pageHeader(c, 77);
  text(c, 'Pacientes', 272, 46, FONT.sans(20, 700), C.ink);
  button(c, 1258, 20, 36, 'Nuevo Paciente', { icon: 'plus' });
  field(c, 264, 111, 320, 'Buscar', 'Nombre, CI o email...', 'search');
  field(c, 596, 111, 90, 'Estado', '', undefined, true, 'Todos');
  const th = rise(lt, 0.0, 0.3);
  c.save(); c.globalAlpha = th;
  card(c, 264, 183, 1152, 40 + ROWS.length * ROW_H, { r: 10, lift: 0, border: C.line });
  c.save(); rr(c, 264, 183, 1152, 40, 10); c.clip(); c.fillStyle = '#EEF4F9'; c.fillRect(264, 183, 1152, 41); c.restore();
  const cols: [string, number][] = [['PACIENTE', 273], ['NRO. DOCUMENTO', 540], ['TELÉFONO', 716], ['ESTADO', 882], ['ÚLTIMA CONSULTA', 983], ['PRÓXIMO TURNO', 1159]];
  cols.forEach(([l, x]) => text(c, l, x, 208, FONT.sans(13, 500), C.slate700));
  c.restore();
  ROWS.forEach((r, i) => {
    const a = rise(lt, 0.12 + i * 0.1, 0.3), y = ROW_Y + i * ROW_H;
    c.save(); c.globalAlpha = a; c.translate((1 - a) * -24, 0);
    if (i === hoverRow) { c.save(); c.fillStyle = '#EEF4F9'; c.globalAlpha *= 0.8; c.fillRect(265, y, 1150, ROW_H); c.restore(); }
    c.fillStyle = C.line; c.fillRect(265, y, 1150, 1);
    avatar(c, 289, y + ROW_H / 2, 16, initials(r.name));
    text(c, r.name, 317, y + 24, FONT.sans(14, 500), C.ink);
    text(c, r.email, 317, y + 41, FONT.sans(12, 400), C.muted);
    text(c, r.doc, 540, y + 31, FONT.sans(14, 400), C.slate700);
    text(c, r.tel, 716, y + 31, FONT.sans(14, 400), C.slate700);
    badge(c, 882, y + 17, r.st, r.st === 'Activo' ? 'success' : 'warning');
    text(c, r.last, 983, y + 31, FONT.sans(14, 400), C.slate700);
    text(c, r.next, 1159, y + 31, FONT.sans(14, 400), C.slate700);
    icon(c, 'pen', 1327, y + 17, 18, C.ink, 1.8); icon(c, 'trash', 1363, y + 17, 18, C.ink, 1.8);
    c.restore();
  });
  void press;
}

export default class Pacientes extends Plate {
  draw(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt / SLOW, win = WIN, isList = lt < SWITCH;
    const L: [number, Rect][] = [[0, [0, 0, AW, 782]], [1.35, [0, 0, AW, 782]], [1.95, [250, 215, 700, 75]], [2.0, [260, 90, 800, 440]], [3.5, [0, 0, AW, 782]]];
    const P: [number, Rect][] = [[0, [250, 70, 740, 740]], [1.35, [250, 70, 740, 740]], [1.95, [260, 205, 560, 120]], [2.0, [262, 95, 640, 640]], [3.1, [262, 95, 640, 640]], [3.9, [840, 300, 640, 640]]];
    const cam = track(win, lt, portrait ? P : L);
    const ROBERTO = { x: 420, y: ROW_Y + 24 };
    const cur = path(lt, [[0.9, 1180, 330], [1.55, ROBERTO.x, ROBERTO.y + 4]]);
    const press = prog(lt, 1.6, 1.66) * (1 - prog(lt, 1.66, 1.76));
    const hoverRow = lt > 1.5 ? 0 : -1;

    inWindow(c, win, cam, () => {
      if (isList) listPage(c, lt, hoverRow, press); else fichaPage(c, lt - SWITCH);
      sidebar(c, 'pacientes');
      if (isList && lt > 0.9) { clickRing(c, ROBERTO.x, ROBERTO.y + 4, lt, 1.6, 26); cursor(c, cur.x, cur.y, press, 1.1); }
    });

    // ---- caption
    if (portrait) {
      eyebrow(c, 'Pacientes', HEAD.x + 4, HEAD.y - 96, C.logo, 20);
      slideUp(c, HEAD.x, HEAD.y, W, 100, ease.outExpo(prog(lt, 0.1, 0.6)), (y) => hero(c, 'Fichas con', HEAD.x, y, 96, C.ink));
      slideUp(c, HEAD.x, HEAD.y + 100, W, 100, ease.outExpo(prog(lt, 0.2, 0.7)), (y) => hero(c, 'historia clínica.', HEAD.x, y, 96, TONES.blue.text));
    } else {
      const out = prog(lt, 1.15, 1.4, ease.inCubic);
      if (out < 1) {
        c.save(); c.globalAlpha = 1 - out; c.translate(0, out * 40);
        eyebrow(c, 'Pacientes', 392, 910, TONES.blue.text, 20);
        slideUp(c, 388, 990, W - 388, 90, ease.outExpo(prog(lt, 0.35, 0.85)), (y) => hero(c, 'Fichas con historia clínica.', 388, y, 76, C.ink));
        c.restore();
      }
    }

    // ---- green wipe over the cut at 26.0
    const wIn = ease.inOutCubic(prog(lt, 1.84, 1.97)), wOut = ease.inOutCubic(prog(lt, 2.03, 2.16));
    if (wIn > 0 && wOut < 1) {
      const x0 = lerp(-W, 0, wIn) + lerp(0, W, wOut);
      c.fillStyle = C.logo; c.fillRect(x0, 0, W, H);
    }
  }
}
