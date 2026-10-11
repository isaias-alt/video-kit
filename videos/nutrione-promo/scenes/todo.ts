// 16-20 s. The drop: white flash, "Todo en un mismo lugar.", then the real dashboard assembles beat by beat.
import type { Frame } from '@engine/scene';
import { Plate } from '../plate';
import { WIN, W, H, portrait } from '../frame';
import { C, FONT, card, rr, text } from '../brand';
import { icon } from '../icons';
import {
  AW, AH, SB, B, sidebar, pageHeader, button, badge, weekGrid, apptBlock, cursor, clickRing, path, hero, accent, slideUp,
  pop, rise, inWindow, track, toScreen, scaled, type Block, type Rect,
} from '../ui';
import { ease, prog } from '@engine/util';
import { WEEK, WEEK_DAYS, UPCOMING, RECENT } from '../data';

const t0 = 1.5; // blocks start popping here (a beat after the window lands)
const BLOCKS: Block[] = WEEK.map((e, i) => ({ day: e.day, h0: e.h0, dur: 60, name: e.name, st: e.st, t: t0 + i * 0.12 }));

function listCard(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, ic: 'calendar' | 'users', lt: number, at: number, rows: (i: number, ry: number) => void, n: number) {
  const a = rise(lt, at, 0.45);
  c.save(); c.globalAlpha = a; c.translate(0, (1 - a) * 30);
  card(c, x, y, w, h, { r: 12, lift: 0, border: C.line });
  icon(c, ic, x + 21, y + 21, 20, C.muted, 1.8);
  text(c, title, x + 45, y + 38, FONT.sans(18, 600), C.ink);
  text(c, 'Ver todos', x + w - 21, y + 38, FONT.sans(14, 500), C.logo, 'right');
  c.restore();
  for (let i = 0; i < n; i++) {
    const ra = rise(lt, at + 0.25 + i * 0.1, 0.3);
    c.save(); c.globalAlpha = ra; c.translate(0, (1 - a) * 30 + (1 - ra) * 10);
    rows(i, y + 82 + i * 43);
    c.restore();
  }
}

export default class Todo extends Plate {
  draw(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt, cx = W / 2;
    // ---- the headline slam (0 - 1.1)
    const out = ease.inExpo(prog(lt, 1.0, 1.5));
    if (lt < 1.6) {
      const sz = portrait ? 150 : 210, y1 = portrait ? 470 : H / 2 - 20, lh = sz * 1.04;
      c.save(); c.translate(0, -out * H * 0.7);
      const s = 1 + 0.18 * (1 - ease.outExpo(prog(lt, 0, 0.35)));
      c.translate(cx, y1 + lh / 2); c.scale(s, s); c.translate(-cx, -(y1 + lh / 2));
      c.globalAlpha = prog(lt, 0, 0.08);
      slideUp(c, 0, y1, W, lh, ease.outExpo(prog(lt, 0, 0.45)), (y) => hero(c, 'Todo en un', cx, y, sz, C.ink, 'center'));
      slideUp(c, 0, y1 + lh, W, lh, ease.outExpo(prog(lt, 0.1, 0.55)), (y) => accent(c, 'mismo lugar.', cx, y, sz, 'center'));
      c.restore();
    }

    // ---- window rises at 1.0
    const win = { ...WIN };
    const up = ease.outExpo(prog(lt, 1.0, 1.7));
    win.y = WIN.y + (1 - up) * (H - WIN.y + 40);
    const keysL: [number, Rect][] = [[0, [0, 0, AW, 782]], [1.7, [0, 0, AW, 782]], [2.9, [0, 0, AW, 782]], [3.9, [0, 20, 560, 270]]];
    const keysP: [number, Rect][] = [[0, [0, 0, 780, 770]], [1.7, [0, 0, 780, 770]], [2.2, [250, 40, 780, 770]], [3.0, [660, 40, 780, 770]], [3.5, [660, 40, 780, 770]], [3.95, [0, 20, 520, 520]]];
    const cam = track(win, lt, portrait ? keysP : keysL);
    // the "Agenda" nav item is where the cursor ends up
    const target = { x: 120, y: 146 };
    const cur = path(lt, [[2.4, 1100, 520], [3.5, target.x + 10, target.y + 4]]);
    const hover = lt > 3.55 ? 1 : 0;

    inWindow(c, win, cam, () => {
      // content
      pageHeader(c, 88);
      const ha = rise(lt, 1.3, 0.4);
      c.save(); c.globalAlpha = ha;
      text(c, 'Semana Actual', 272, 42, FONT.sans(22, 700), C.ink);
      text(c, 'Del 12 de octubre de 2026 al 18 de octubre de 2026', 272, 66, FONT.sans(14, 400), C.muted);
      rr(c, 1199, 28, 31, 31, 6); c.strokeStyle = C.line; c.lineWidth = 1; c.stroke(); icon(c, 'chevron-left', 1207, 36, 15, C.ink, 2);
      rr(c, 1239, 28, 31, 31, 6); c.stroke(); icon(c, 'chevron-right', 1247, 36, 15, C.ink, 2);
      button(c, 1279, 26, 36, 'Nuevo turno', { icon: 'plus', size: 14 });
      c.restore();
      // week grid
      const ga = rise(lt, 1.35, 0.5);
      c.save(); c.globalAlpha = ga; c.translate(0, (1 - ga) * 24);
      weekGrid(c, { x: 272, y: 108, w: 1136, hours: [8, 12], days: WEEK_DAYS, blocks: BLOCKS, lt, head: 64, gutter: 57 });
      c.restore();
      // lower cards
      listCard(c, 272, 450, 666, 258, 'Próximos Turnos', 'calendar', lt, 2.0, (i, ry) => {
        const [h, n] = UPCOMING[i]!;
        text(c, h, 293, ry + 4, FONT.sans(15, 400), C.muted);
        text(c, n, 349, ry + 4, FONT.sans(15, 500), C.ink);
        badge(c, 817, ry - 14, 'Programado', 'info');
        c.fillStyle = C.line; c.fillRect(293, ry + 20, 614, 1);
      }, 4);
      listCard(c, 963, 450, 445, 258, 'Pacientes', 'users', lt, 2.25, (i, ry) => {
        const [n, tag, l] = RECENT[i]!;
        text(c, n, 985, ry + 4, FONT.sans(15, 500), C.ink);
        const w = (() => { c.font = FONT.sans(12, 500); return c.measureText(l).width + 18; })();
        badge(c, 1387 - w, ry - 14, l, tag);
        c.fillStyle = C.line; c.fillRect(985, ry + 20, 402, 1);
      }, 4);
      // sidebar last so its items step in one by one (Todo is the active section)
      sidebar(c, 'todo', lt, 1.1, hover ? 1 : -1);
      if (lt >= 2.4) { clickRing(c, target.x + 10, target.y + 4, lt, 3.88, 26); cursor(c, cur.x, cur.y, prog(lt, 3.85, 3.92) * (1 - prog(lt, 3.92, 4.0)), 1.1); }
    });

    // ---- flash + shockwave at the downbeat
    const fl = 1 - ease.outCubic(prog(lt, 0, 0.3));
    if (fl > 0) { c.globalAlpha = fl; c.fillStyle = C.white; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    const ring = prog(lt, 0, 0.7, ease.outExpo);
    if (ring > 0 && ring < 1) { c.save(); c.globalAlpha = 0.55 * (1 - ring); c.lineWidth = 10 * (1 - ring) + 2; c.strokeStyle = C.logo; c.beginPath(); c.arc(cx, H / 2, ring * W * 0.7, 0, 6.2832); c.stroke(); c.restore(); }
  }
}
