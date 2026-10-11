// NutriOne app components redrawn in Canvas2D, in "app px": the 1440 px wide layout of the design-system
// screenshots (sidebar 240 px, content to the right). Everything here only draws what exists in nutrione-web.
import { C, FONT, TONES, card, rr, text, logoH, type ToneKey } from './brand';
import { icon, type IconName } from './icons';
import { ease, prog, lerp, clamp } from '@engine/util';

export const AW = 1440; // app viewport width
export const AH = 810; // app viewport height (16:9)
export const SB = 240; // sidebar width
export const B = 0.5; // one beat at 120 bpm, in seconds

export type Nav = 'todo' | 'agenda' | 'pacientes' | 'planes';
const NAV: [Nav, string, IconName][] = [
  ['todo', 'Todo', 'layout-dashboard'], ['agenda', 'Agenda', 'calendar'], ['pacientes', 'Pacientes', 'users'], ['planes', 'Planes', 'file-text'],
];

/** Pop-in scale (0 -> 1 with a little overshoot) for something that appears at `t0`. */
export const pop = (lt: number, t0: number, dur = 0.32) => prog(lt, t0, t0 + dur, ease.outBack);
/** Fade/slide-in progress for something that appears at `t0`. */
export const rise = (lt: number, t0: number, dur = 0.4) => prog(lt, t0, t0 + dur, ease.outCubic);

/** Scale an element about (cx, cy) by `s` with alpha `a`, then run fn. */
export function scaled(c: CanvasRenderingContext2D, cx: number, cy: number, s: number, a: number, fn: () => void) {
  if (a <= 0 || s <= 0) return;
  c.save();
  c.globalAlpha *= Math.min(1, a);
  c.translate(cx, cy); c.scale(s, s); c.translate(-cx, -cy);
  fn();
  c.restore();
}

// ---- small widgets -----------------------------------------------------------------------------

export type BtnOpts = { variant?: 'primary' | 'outline' | 'ghost'; icon?: IconName; press?: number; size?: number; hover?: number };
/** App button. (x, y) top-left. Returns its width. */
export function button(c: CanvasRenderingContext2D, x: number, y: number, h: number, label: string, o: BtnOpts = {}) {
  const fs = o.size ?? 14, pad = 16, ic = o.icon ? fs + 8 : 0;
  c.font = FONT.sans(fs, 500);
  const w = Math.ceil(c.measureText(label).width) + pad * 2 + ic;
  const pr = o.press ?? 0, v = o.variant ?? 'primary';
  c.save();
  c.translate(x + w / 2, y + h / 2); c.scale(1 - 0.04 * pr, 1 - 0.04 * pr); c.translate(-w / 2, -h / 2);
  if (v === 'primary') {
    rr(c, 0, 0, w, h, 6); c.fillStyle = (o.hover ?? 0) > 0 ? C.brand : C.logo; c.fill();
  } else if (v === 'outline') {
    rr(c, 0, 0, w, h, 6); c.fillStyle = (o.hover ?? 0) > 0 ? C.soft : C.white; c.fill();
    c.lineWidth = 1; c.strokeStyle = C.line; c.stroke();
  }
  const col = v === 'primary' ? C.white : C.ink;
  let tx = pad;
  if (o.icon) { icon(c, o.icon, pad, h / 2 - fs / 2 - 1, fs + 2, col, 2); tx += ic; }
  text(c, label, tx, h / 2 + fs * 0.36, FONT.sans(fs, 500), col);
  c.restore();
  return w;
}

export type Tag = 'info' | 'success' | 'warning' | 'destructive';
const TAG: Record<Tag, ToneKey> = { info: 'blue', success: 'green', warning: 'yellow', destructive: 'red' };
/** Status badge (Programado, Activo, Pausado...). (x, y) top-left, returns width. */
export function badge(c: CanvasRenderingContext2D, x: number, y: number, label: string, tag: Tag, fs = 12) {
  const tn = TONES[TAG[tag]];
  c.font = FONT.sans(fs, 500);
  const w = Math.ceil(c.measureText(label).width) + 18, h = fs + 10;
  rr(c, x, y, w, h, h / 2); c.fillStyle = tn.soft; c.fill();
  c.lineWidth = 1; c.strokeStyle = tn.border; c.stroke();
  text(c, label, x + w / 2, y + h / 2 + fs * 0.36, FONT.sans(fs, 500), tn.text, 'center');
  return w;
}

export function avatar(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, initials: string, bg: string = TONES.green.bg, fg: string = TONES.green.text) {
  c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fillStyle = bg; c.fill();
  text(c, initials, cx, cy + r * 0.3, FONT.sans(Math.round(r * 0.72), 500), fg, 'center');
}

export const initials = (n: string) => n.split(' ').map((s) => s[0]).join('').slice(0, 2);

/** Mouse cursor (arrow). Tip at (x, y). `press` 0..1 shrinks it a touch. */
export function cursor(c: CanvasRenderingContext2D, x: number, y: number, press = 0, k = 1) {
  c.save();
  c.translate(x, y); c.scale(k * (1 - 0.08 * press), k * (1 - 0.08 * press));
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 17); c.lineTo(4.3, 13.2); c.lineTo(7.2, 20); c.lineTo(10, 18.8); c.lineTo(7.1, 12.2); c.lineTo(12.6, 12.2); c.closePath();
  c.shadowColor = 'rgba(15,23,42,0.25)'; c.shadowBlur = 5; c.shadowOffsetY = 2;
  c.fillStyle = C.ink; c.fill();
  c.shadowColor = 'transparent';
  c.lineWidth = 1.4; c.strokeStyle = C.white; c.stroke();
  c.restore();
}
/** Expanding click ring at (x, y) started at `t0`. */
export function clickRing(c: CanvasRenderingContext2D, x: number, y: number, lt: number, t0: number, r = 34, color: string = C.logo) {
  const p = prog(lt, t0, t0 + 0.45, ease.outCubic);
  if (p <= 0 || p >= 1) return;
  c.save(); c.globalAlpha = 0.5 * (1 - p); c.lineWidth = 3; c.strokeStyle = color;
  c.beginPath(); c.arc(x, y, 6 + r * p, 0, 6.2832); c.stroke(); c.restore();
}
/** A path of waypoints [t, x, y] -> eased position. Linear between waypoints with ease-in-out on each leg. */
export function path(lt: number, pts: [number, number, number][]): { x: number; y: number } {
  if (lt <= pts[0]![0]) return { x: pts[0]![1], y: pts[0]![2] };
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!, b = pts[i]!;
    if (lt <= b[0]) { const p = ease.inOutCubic(clamp((lt - a[0]) / (b[0] - a[0]))); return { x: lerp(a[1], b[1], p), y: lerp(a[2], b[2], p) }; }
  }
  const l = pts[pts.length - 1]!; return { x: l[1], y: l[2] };
}

// ---- app shell ---------------------------------------------------------------------------------

/** Sidebar. `navIn` = time each nav item appears (stagger), `hl` = index being "hovered" for a beat. */
export function sidebar(c: CanvasRenderingContext2D, active: Nav, lt = 99, t0 = 0, hl = -1) {
  c.fillStyle = C.white; c.fillRect(0, 0, SB, AH);
  c.fillStyle = C.line; c.fillRect(SB - 1, 0, 1, AH);
  logoH(c, 24, 24, 40);
  NAV.forEach(([id, label, ic], i) => {
    const a = rise(lt, t0 + i * 0.12, 0.35), y = 94 + i * 36;
    c.save(); c.globalAlpha = a; c.translate((1 - a) * -16, 0);
    if (id === active) { rr(c, 12, y, 215, 32, 6); c.fillStyle = C.accent; c.fill(); }
    else if (i === hl) { rr(c, 12, y, 215, 32, 6); c.fillStyle = C.soft; c.fill(); }
    icon(c, ic, 24, y + 8, 16, id === active ? '#14532D' : C.ink, 2);
    text(c, label, 50, y + 21, FONT.sans(14, 500), id === active ? '#14532D' : C.ink);
    c.restore();
  });
  // footer: theme, user, logout
  c.save(); c.globalAlpha = rise(lt, t0 + 0.5, 0.4);
  c.fillStyle = C.line; c.fillRect(0, 580, SB - 1, 1);
  c.strokeStyle = C.ink; c.lineWidth = 1.8; c.lineCap = 'round';
  c.beginPath(); c.arc(30, 609, 4, 0, 6.2832); c.stroke();
  for (let k = 0; k < 8; k++) { const an = k * Math.PI / 4; c.beginPath(); c.moveTo(30 + Math.cos(an) * 7, 609 + Math.sin(an) * 7); c.lineTo(30 + Math.cos(an) * 9, 609 + Math.sin(an) * 9); c.stroke(); }
  text(c, 'Cambiar tema', 50, 614, FONT.sans(14, 500), C.ink);
  avatar(c, 32, 653, 16, 'LT', C.soft, C.muted);
  text(c, 'Lucia Torres', 60, 658, FONT.sans(14, 500), C.ink);
  rr(c, 12, 681, 215, 36, 6); c.fillStyle = C.white; c.fill(); c.lineWidth = 1; c.strokeStyle = C.line; c.stroke();
  text(c, 'Cerrar sesión', 75, 704, FONT.sans(14, 500), C.ink);
  c.restore();
}

/** Page header bar of the content area (white, bottom border). */
export function pageHeader(c: CanvasRenderingContext2D, h = 76) {
  c.fillStyle = C.white; c.fillRect(SB, 0, AW - SB, h);
  c.fillStyle = C.line; c.fillRect(SB, h - 1, AW - SB, 1);
}

/** Appointment block, as in the calendar grid (status styles from appointment-block.tsx). */
export type ApptStatus = 'scheduled' | 'completed' | 'noshow';
const APPT = {
  scheduled: { bg: '#BFDBFE', bar: '#2563EB', fg: '#1E3A8A' },
  completed: { bg: '#F0FDF4', bar: '#16A34A', fg: '#14532D' },
  noshow: { bg: '#FEF08A', bar: '#CA8A04', fg: '#713F12' },
} as const;
export function apptBlock(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, name: string, range: string, st: ApptStatus = 'scheduled', fs = 14) {
  const s = APPT[st];
  c.save();
  rr(c, x, y, w, h, 6); c.clip();
  c.fillStyle = s.bg; c.fillRect(x, y, w, h);
  c.fillStyle = s.bar; c.fillRect(x, y, 2.5, h);
  c.restore();
  text(c, name, x + 9, y + fs + 4, FONT.sans(fs, 600), s.fg);
  if (h >= 40) { c.save(); c.globalAlpha = 0.75; text(c, range, x + 9, y + fs * 2 + 5, FONT.sans(fs - 2, 400), s.fg); c.restore(); }
}

// ---- week calendar ----------------------------------------------------------------------------

export interface Block { day: number; h0: number; m0?: number; dur: number; name: string; st?: ApptStatus; t: number }
export const HOUR = 64; // px per hour in the app
const hm = (h: number, m = 0) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
export const range = (b: Block) => { const e = b.h0 * 60 + (b.m0 ?? 0) + b.dur; return `${hm(b.h0, b.m0 ?? 0)} - ${hm(Math.floor(e / 60), e % 60)}`; };

export interface WeekOpts {
  x: number; y: number; w: number; hours: [number, number]; // visible hour range [from, to)
  days: { dow: string; n: number; today?: boolean }[];
  blocks: Block[]; lt: number; head?: number; gutter?: number; fs?: number; nowAt?: number;
}
/** Week grid card. Blocks pop in at their `t`. Returns the geometry for placing a cursor. */
export function weekGrid(c: CanvasRenderingContext2D, o: WeekOpts) {
  const head = o.head ?? 64, gut = o.gutter ?? 56, rows = o.hours[1] - o.hours[0];
  const h = head + rows * HOUR, cw = (o.w - gut) / o.days.length;
  card(c, o.x, o.y, o.w, h, { r: 12, lift: 0, border: C.line });
  c.save(); rr(c, o.x, o.y, o.w, h, 12); c.clip();
  // day headers
  o.days.forEach((d, i) => {
    const cx = o.x + gut + cw * (i + 0.5);
    text(c, d.dow, cx, o.y + 28, FONT.sans(12, 500), C.muted, 'center', 1);
    if (d.today) { c.beginPath(); c.arc(cx, o.y + 46, 15, 0, 6.2832); c.fillStyle = C.logo; c.fill(); }
    text(c, String(d.n), cx, o.y + 52, FONT.sans(16, 600), d.today ? C.white : C.ink, 'center');
  });
  c.fillStyle = C.line;
  c.fillRect(o.x, o.y + head, o.w, 1);
  for (let r = 0; r < rows; r++) {
    const y = o.y + head + r * HOUR;
    if (r > 0) { c.fillStyle = C.line; c.fillRect(o.x + gut, y, o.w - gut, 1); }
    text(c, hm(o.hours[0] + r), o.x + gut - 10, y + 5, FONT.sans(12, 400), C.muted, 'right');
  }
  c.fillStyle = C.line;
  for (let i = 0; i <= o.days.length; i++) c.fillRect(o.x + gut + cw * i, o.y + head, 1, rows * HOUR);
  c.restore();
  // blocks
  for (const b of o.blocks) {
    const s = pop(o.lt, b.t, 0.34);
    if (s <= 0) continue;
    const bx = o.x + gut + cw * b.day + 3, bw = cw - 6;
    const by = o.y + head + ((b.h0 - o.hours[0]) * 60 + (b.m0 ?? 0)) / 60 * HOUR + 1, bh = b.dur / 60 * HOUR - 2;
    scaled(c, bx + bw / 2, by + bh / 2, 0.82 + 0.18 * s, rise(o.lt, b.t, 0.2), () => apptBlock(c, bx, by, bw, bh, b.name, range(b), b.st ?? 'scheduled', o.fs ?? 14));
  }
  if (o.nowAt !== undefined) {
    const y = o.y + head + (o.nowAt - o.hours[0]) * HOUR;
    c.fillStyle = C.logo; c.fillRect(o.x + gut, y - 1, o.w - gut, 2);
    c.beginPath(); c.arc(o.x + gut, y, 5, 0, 6.2832); c.fill();
  }
  return { h, cw, gut, colX: (d: number) => o.x + gut + cw * d, rowY: (hh: number) => o.y + head + (hh - o.hours[0]) * HOUR };
}

// ---- kinetic type (video-level, not app) -------------------------------------------------------

/** Heavy tight sans like the landing hero. `ls` is in em. Returns the measured width. */
export function hero(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'left', w = 800, halo?: string) {
  c.save();
  c.font = FONT.sans(size, w as 700 | 800); c.letterSpacing = `${-0.04 * size}px`; c.textAlign = align; c.textBaseline = 'alphabetic';
  if (halo) { c.lineJoin = 'round'; c.lineWidth = size * 0.1; c.strokeStyle = halo; c.strokeText(s, x, y); }
  c.fillStyle = color; c.fillText(s, x, y);
  const m = c.measureText(s).width;
  c.restore();
  return m;
}
/** Light italic green accent word ("ordenado."), gradient like the landing. */
export function accent(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, align: CanvasTextAlign = 'left', halo?: string) {
  c.save();
  c.font = FONT.light(size); c.letterSpacing = `${-0.03 * size}px`; c.textAlign = align; c.textBaseline = 'alphabetic';
  const m = c.measureText(s).width, x0 = align === 'center' ? x - m / 2 : align === 'right' ? x - m : x;
  const g = c.createLinearGradient(x0, y - size, x0 + m, y);
  g.addColorStop(0, '#16A34A'); g.addColorStop(0.5, '#15803D'); g.addColorStop(1, '#166534');
  if (halo) { c.lineJoin = 'round'; c.lineWidth = size * 0.14; c.strokeStyle = halo; c.strokeText(s, x, y); }
  c.fillStyle = g; c.fillText(s, x, y);
  c.restore();
  return m;
}
/** Mono eyebrow (uppercase, wide tracking). */
export function eyebrow(c: CanvasRenderingContext2D, s: string, x: number, y: number, color: string = C.logo, size = 16, align: CanvasTextAlign = 'left') {
  text(c, s.toUpperCase(), x, y, FONT.mono(size, 500), color, align, size * 0.2);
}
/** Line that slides up from behind its baseline (masked). draw(y) paints the line at baseline y. */
export function slideUp(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, p: number, draw: (yy: number) => void) {
  if (p <= 0) return;
  c.save();
  c.beginPath(); c.rect(x, y - h, w, h * 1.28); c.clip();
  draw(y + (1 - p) * h * 0.95);
  c.restore();
}

/** Window the app lives in: rounded, shadowed, clipped. Returns after fn drew inside the app transform. */
export interface Win { x: number; y: number; w: number; h: number; r: number }
export interface Cam { cx: number; cy: number; k: number }
export function inWindow(c: CanvasRenderingContext2D, win: Win, cam: Cam, fn: () => void, shadow = 1) {
  c.save();
  c.shadowColor = `rgba(15,23,42,${0.16 * shadow})`; c.shadowBlur = 60 * shadow; c.shadowOffsetY = 24 * shadow;
  rr(c, win.x, win.y, win.w, win.h, win.r); c.fillStyle = C.bg; c.fill();
  c.restore();
  c.save();
  rr(c, win.x, win.y, win.w, win.h, win.r); c.clip();
  c.fillStyle = C.bg; c.fillRect(win.x, win.y, win.w, win.h);
  c.translate(win.x + win.w / 2, win.y + win.h / 2); c.scale(cam.k, cam.k); c.translate(-cam.cx, -cam.cy);
  fn();
  c.restore();
  c.save();
  rr(c, win.x, win.y, win.w, win.h, win.r); c.lineWidth = 1.5; c.strokeStyle = C.line; c.stroke();
  c.restore();
}
/** Screen position of an app point under a window + camera. */
export const toScreen = (win: Win, cam: Cam, ax: number, ay: number) => ({ x: win.x + win.w / 2 + (ax - cam.cx) * cam.k, y: win.y + win.h / 2 + (ay - cam.cy) * cam.k });
/** Mix two cameras. */
export const mixCam = (a: Cam, b: Cam, t: number): Cam => ({ cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), t)) });

// ---- camera ------------------------------------------------------------------------------------

export type Rect = [number, number, number, number]; // app px: x, y, w, h
/** Camera that fits an app-space rect inside the window (contain). */
export const fit = (win: Win, r: Rect): Cam => ({ cx: r[0] + r[2] / 2, cy: r[1] + r[3] / 2, k: Math.min(win.w / r[2], win.h / r[3]) });
/** Camera moving through rect keyframes [time, rect]; eased between consecutive keys. */
export function track(win: Win, lt: number, keys: [number, Rect][]): Cam {
  if (lt <= keys[0]![0]) return fit(win, keys[0]![1]);
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1]!, b = keys[i]!;
    if (lt <= b[0]) return mixCam(fit(win, a[1]), fit(win, b[1]), ease.inOutCubic(clamp((lt - a[0]) / (b[0] - a[0]))));
  }
  return fit(win, keys[keys.length - 1]![1]);
}

/** Brand-green wipe across the screen: covers during [a, b], swaps at the centre, uncovers during [c0, d]. */
export function wipe(c: CanvasRenderingContext2D, W: number, H: number, lt: number, a: number, b: number, c0: number, d: number) {
  const wIn = ease.inOutCubic(prog(lt, a, b)), wOut = ease.inOutCubic(prog(lt, c0, d));
  if (wIn <= 0 || wOut >= 1) return;
  c.fillStyle = C.logo; c.fillRect(lerp(-W, 0, wIn) + lerp(0, W, wOut), 0, W, H);
}
