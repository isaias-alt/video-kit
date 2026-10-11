// Shared drawing helpers for the vexillum plates. Everything is a pure function of time.
import { ease, prog } from '@engine/util';
import { C, FONT, rr, text } from '../brand';
import { W } from '../plate';

export const M = 120; // outer margin
export const FLAG = 'M10,9.6 L22,9.6 L22,23 L20,25.5 L18,23 L16,25.5 L14,23 L12,25.5 L10,23 Z';

/** The vexillum mark (32x32 viewBox), drawn in three beats: pole, crossbar, flag. p in 0..1. */
export function mark(c: CanvasRenderingContext2D, cx: number, cy: number, size: number, col: string, p: number) {
  const s = size / 32;
  c.save();
  c.translate(cx - 16 * s, cy - 16 * s);
  c.scale(s, s);
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineWidth = 2.4;
  c.lineCap = 'round';
  const pole = prog(p, 0, 0.4, ease.outCubic), bar = prog(p, 0.3, 0.65, ease.outCubic), flag = prog(p, 0.55, 1, ease.outCubic);
  c.beginPath(); c.moveTo(16, 3); c.lineTo(16, 3 + 24 * pole); c.stroke();
  if (bar > 0) { c.beginPath(); c.moveTo(16 - 9 * bar, 9); c.lineTo(16 + 9 * bar, 9); c.stroke(); }
  c.beginPath(); c.arc(16, 3, 1.5 * prog(p, 0, 0.12), 0, Math.PI * 2); c.fill();
  if (flag > 0) {
    c.save();
    c.globalAlpha *= flag;
    c.translate(0, (1 - flag) * -2.5);
    c.fill(new Path2D(FLAG));
    c.restore();
  }
  c.restore();
}

/** Run fn with an opacity and a vertical slide-in, both driven by p (0..1). */
export function appear(c: CanvasRenderingContext2D, p: number, dy: number, fn: () => void) {
  if (p <= 0) return;
  c.save();
  c.globalAlpha *= p;
  c.translate(0, (1 - p) * dy);
  fn();
  c.restore();
}

/** Typewriter: the first characters of s that have been typed by time lt. */
export function typed(s: string, lt: number, t0: number, cps: number) {
  return s.slice(0, Math.max(0, Math.min(s.length, Math.floor((lt - t0) * cps))));
}
export const typedDone = (s: string, lt: number, t0: number, cps: number) => (lt - t0) * cps >= s.length;

/** Section header: "0N / LABEL" in bronze mono, then a serif title. */
export function header(c: CanvasRenderingContext2D, lt: number, num: string, label: string, title: string) {
  appear(c, prog(lt, 0.3, 0.9, ease.outCubic), 18, () => {
    text(c, `${num} / ${label}`, M, 130, FONT.mono(22, 500), C.bronze, 'left', 4);
    text(c, title, M, 210, FONT.serif(68), C.text);
  });
}

export type Tone = 'accent' | 'success' | 'bronze' | 'muted' | 'danger';
export const TONE: Record<Tone, { fg: string; bg: string }> = {
  accent: { fg: C.accent, bg: C.accentSoft },
  success: { fg: C.success, bg: C.successSoft },
  bronze: { fg: C.bronze, bg: C.bronzeSoft },
  muted: { fg: C.text2, bg: 'rgba(160,163,169,0.12)' },
  danger: { fg: C.danger, bg: 'rgba(224,130,104,0.14)' },
};

/** A pill with an optional status dot. (x, y) is its top-left; returns its width. `scale` pops it from its centre. */
export function chip(c: CanvasRenderingContext2D, x: number, y: number, label: string, tone: Tone, o: { dot?: number; scale?: number; h?: number; px?: number; right?: boolean } = {}) {
  const px = o.px ?? 22, h = o.h ?? 40;
  c.font = FONT.mono(Math.round(h * 0.45), 500);
  const tw = c.measureText(label).width + (o.dot !== undefined ? h * 0.5 : 0);
  const w = tw + px * 2;
  const x0 = o.right ? x - w : x;
  const t = TONE[tone];
  c.save();
  const sc = o.scale ?? 1;
  c.translate(x0 + w / 2, y + h / 2);
  c.scale(sc, sc);
  c.translate(-w / 2, -h / 2);
  rr(c, 0, 0, w, h, h / 2);
  c.fillStyle = t.bg;
  c.fill();
  let tx = px;
  if (o.dot !== undefined) {
    c.save();
    c.beginPath();
    c.arc(px + h * 0.1, h / 2, h * 0.11 * (0.75 + 0.25 * o.dot), 0, Math.PI * 2);
    c.fillStyle = t.fg;
    c.globalAlpha *= 0.55 + 0.45 * o.dot;
    c.fill();
    c.restore();
    tx += h * 0.5;
  }
  text(c, label, tx, h / 2 + h * 0.16, FONT.mono(Math.round(h * 0.45), 500), t.fg);
  c.restore();
  return w;
}

/** A dark window with a hairline border and a title bar. Returns the content origin y. */
export function win(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, glow = 0) {
  c.save();
  rr(c, x, y, w, h, 18);
  c.fillStyle = C.surface;
  c.fill();
  c.lineWidth = 1.5;
  c.strokeStyle = glow > 0 ? C.accent : C.border;
  c.globalAlpha *= 1;
  c.stroke();
  if (glow > 0) {
    c.save();
    c.globalAlpha *= glow * 0.35;
    c.lineWidth = 6;
    c.strokeStyle = C.accent;
    rr(c, x, y, w, h, 18);
    c.stroke();
    c.restore();
  }
  c.beginPath(); c.moveTo(x, y + 52); c.lineTo(x + w, y + 52);
  c.lineWidth = 1; c.strokeStyle = C.border; c.stroke();
  for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x + 28 + i * 22, y + 26, 6, 0, Math.PI * 2); c.fillStyle = C.borderStrong; c.fill(); }
  text(c, title, x + w / 2, y + 33, FONT.mono(17, 500), C.muted, 'center', 1);
  c.restore();
  return y + 52;
}

/** Greedy word wrap with the current font; returns lines. */
export function wrap(c: CanvasRenderingContext2D, s: string, maxW: number, font: string) {
  c.font = font;
  const out: string[] = [];
  let line = '';
  for (const w of s.split(' ')) {
    const t = line ? `${line} ${w}` : w;
    if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}

/** Block cursor, blinking on the global clock. */
export function cursor(c: CanvasRenderingContext2D, x: number, y: number, t: number, h = 26, col: string = C.accent) {
  if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = col; c.fillRect(x + 2, y - h + 4, h * 0.5, h); }
}

export const center = () => W / 2;
