// Screen-space layer: the series header, the pattern being shown, and the caption card. Layout from W and H in
// 9:16 social safe zones: nothing important above ~210 px or in the bottom ~400 px.
import { ease, prog } from '@engine/util';
import { rr } from '@kit/draw';
import { C, FONT, alpha } from './brand';

export interface Caption {
  /** Seconds it appears (usually a word cue). It stays until the next caption, or `until`. */
  at: number;
  until?: number;
  /** Headline. Words between *asterisks* get the highlighter. */
  head?: string;
  /** A command, typed out in mono. */
  code?: string;
  /** Smaller supporting line. */
  sub?: string;
}

type Ctx = CanvasRenderingContext2D;
interface Word { s: string; em: boolean; w: number; hw: number; x: number; line: number }

function words(head: string): { s: string; em: boolean }[] {
  const out: { s: string; em: boolean }[] = [];
  let em = false;
  for (const raw of head.split(' ')) {
    const open = raw.startsWith('*'), close = raw.replace(/[.,:;?!]+$/, '').endsWith('*');
    if (open) em = true;
    out.push({ s: raw.replace(/\*/g, ''), em });
    if (close) em = false;
  }
  return out;
}

function wrap(c: Ctx, text: string, maxW: number) {
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    const next = cur ? `${cur} ${w}` : w;
    if (c.measureText(next).width > maxW && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

export interface OverlayAssets { card: HTMLCanvasElement; marker: HTMLCanvasElement }

export function cardRect(W: number, H: number) {
  const u = W / 1080;
  return { x: 40 * u, y: H * 0.655, w: W - 80 * u, h: 250 * u, u };
}

/**
 * Paper fades behind the header and under the card, so type never fights the drawing. `under` (0..1) is how
 * much of the world may show below the card: some on wide shots, none on close-ups (big labels there read as noise).
 */
export function drawVeils(c: Ctx, W: number, H: number, under = 0.3) {
  const top = c.createLinearGradient(0, 0, 0, H * 0.19);
  top.addColorStop(0, alpha(C.paper, 0.96));
  top.addColorStop(0.7, alpha(C.paper, 0.85));
  top.addColorStop(1, alpha(C.paper, 0));
  c.fillStyle = top;
  c.fillRect(0, 0, W, H * 0.19);
  const r = cardRect(W, H);
  const bot = c.createLinearGradient(0, r.y - 40 * r.u, 0, H);
  bot.addColorStop(0, alpha(C.paper, 0));
  bot.addColorStop(0.18, alpha(C.paper, 1 - under));
  bot.addColorStop(1, alpha(C.paper, 1 - under * 0.66));
  c.fillStyle = bot;
  c.fillRect(0, r.y - 40 * r.u, W, H - r.y + 40 * r.u);
}

export function drawHeader(c: Ctx, W: number, H: number, t: number, pattern: string | undefined, patternAt: number) {
  const u = W / 1080, y = Math.max(236 * u, H * 0.123);
  c.save();
  c.font = FONT.mono(22 * u, 700);
  c.letterSpacing = `${4 * u}px`;
  c.fillStyle = C.ink;
  c.textAlign = 'left';
  c.fillText('SYSTEM DESIGN', 56 * u, y);
  c.letterSpacing = '0px';
  c.font = FONT.mono(22 * u);
  c.fillStyle = C.muted;
  c.textAlign = 'right';
  c.fillText('vexillum por dentro', W - 56 * u, y);
  c.restore();
  if (!pattern) return;
  const p = prog(t, patternAt, patternAt + 0.4, ease.outCubic);
  c.save();
  c.beginPath(); c.rect(0, 0, 56 * u + p * (W - 56 * u), H); c.clip();
  c.font = FONT.mono(19 * u, 700);
  c.fillStyle = C.vermilion;
  c.textAlign = 'left';
  c.fillText('PATRÓN', 56 * u, y + 52 * u);
  const lx = 56 * u + c.measureText('PATRÓN').width + 16 * u;
  c.font = FONT.head(34 * u, 700);
  c.fillStyle = C.ink;
  c.fillText(pattern, lx, y + 53 * u);
  c.restore();
}

interface Laid { size: number; words: Word[]; lines: number; sub: string[] }

function layoutCaption(c: Ctx, cap: Caption, maxW: number, u: number): Laid {
  let size = 60 * u, ws: Word[] = [], lines = 0;
  if (cap.head) {
    for (; size > 36 * u; size -= 2 * u) {
      c.font = FONT.head(size);
      const sp = c.measureText(' ').width;
      ws = []; let x = 0, line = 0;
      for (const w of words(cap.head)) {
        const ww = c.measureText(w.s).width;
        if (x > 0 && x + ww > maxW) { line++; x = 0; }
        // the highlighter covers the word, not its trailing punctuation
        ws.push({ ...w, w: ww, hw: c.measureText(w.s.replace(/[.,:;?!]+$/, '')).width, x, line });
        x += ww + sp;
      }
      lines = line + 1;
      if (lines <= 2 || size <= 46 * u) break;
    }
  }
  c.font = FONT.body(29 * u);
  return { size, words: ws, lines, sub: cap.sub ? wrap(c, cap.sub, maxW).slice(0, 2) : [] };
}

/** Height of the card for a caption (the card grows or shrinks smoothly when one caption follows another). */
export function captionHeight(c: Ctx, W: number, H: number, cap: Caption) {
  const r = cardRect(W, H), u = r.u, pad = 40 * u, L = layoutCaption(c, cap, r.w - 2 * pad, u);
  let h = pad;
  if (L.lines) h += L.size * 0.86 + (L.lines - 1) * L.size * 1.12 + 14 * u;
  if (cap.code) h += 62 * u;
  if (L.sub.length) h += 12 * u + L.sub.length * 38 * u;
  return h + pad - 10 * u;
}

/**
 * The caption card: headline words land one by one, the command types itself out, the sub line follows.
 * `card` is the card's opacity (it fades in and out only where captions are not back to back).
 */
export function drawCaption(c: Ctx, A: OverlayAssets, W: number, H: number, t: number, cap: Caption, start: number, end: number, cardH: number, card: number) {
  if (card <= 0) return;
  const r = cardRect(W, H), u = r.u, pad = 40 * u, maxW = r.w - 2 * pad;
  c.save();
  c.globalAlpha = card;
  rr(c, r.x, r.y, r.w, cardH, 18 * u);
  c.fillStyle = alpha(C.card, 0.94);
  c.shadowColor = alpha(C.ink, 0.16); c.shadowBlur = 30 * u; c.shadowOffsetY = 10 * u;
  c.fill();
  c.restore();
  c.save();
  c.globalAlpha = card;
  c.globalCompositeOperation = 'multiply';
  c.drawImage(A.card, r.x, r.y, r.w, cardH);
  c.restore();

  const out = (1 - prog(t, end - 0.14, end)) * card;
  if (out <= 0) return;
  const L = layoutCaption(c, cap, maxW, u), size = L.size;
  let y = r.y + pad;
  let tNext = start;
  if (L.lines) {
    const lh = size * 1.12, base = y + size * 0.86;
    c.font = FONT.head(size);
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    L.words.forEach((w, i) => {
      const p = prog(t, start + i * 0.055, start + i * 0.055 + 0.28, ease.outCubic);
      if (p <= 0) return;
      const x = r.x + pad + w.x, yy = base + w.line * lh + (1 - p) * 16 * u;
      if (w.em) {
        c.save();
        c.beginPath(); c.rect(x - 8 * u, yy - size, (w.hw + 16 * u) * prog(t, start + i * 0.055 + 0.1, start + i * 0.055 + 0.4), size * 1.4); c.clip();
        c.globalCompositeOperation = 'multiply';
        c.globalAlpha = out;
        c.drawImage(A.marker, x - 8 * u, yy - size * 0.7, w.hw + 16 * u, size * 0.9);
        c.restore();
      }
      c.save();
      c.globalAlpha = p * out;
      c.fillStyle = C.ink;
      c.fillText(w.s, x, yy);
      c.restore();
    });
    y = base + (L.lines - 1) * lh + 14 * u;
    tNext = start + L.words.length * 0.055 + 0.1;
  }
  if (cap.code) {
    c.save();
    c.font = FONT.mono(30 * u, 700);
    const full = cap.code;
    const n = Math.floor(prog(t, tNext, tNext + full.length * 0.03) * full.length);
    const cy = y + 34 * u, h = 52 * u;
    c.globalAlpha = out * prog(t, tNext - 0.1, tNext + 0.1);
    rr(c, r.x + pad - 14 * u, cy - h / 2, Math.min(maxW + 28 * u, c.measureText(full.slice(0, n)).width + 46 * u), h, 10 * u);
    c.fillStyle = C.ink; c.fill();
    c.fillStyle = C.card;
    c.textBaseline = 'middle';
    c.fillText(full.slice(0, n), r.x + pad, cy + 2 * u);
    if (Math.floor(t * 3) % 2 === 0 || n < full.length) {
      c.fillStyle = C.ochreWash;
      c.fillRect(r.x + pad + c.measureText(full.slice(0, n)).width + 3 * u, cy - 15 * u, 13 * u, 30 * u);
    }
    c.restore();
    y += 62 * u;
    tNext += full.length * 0.03 + 0.15;
  }
  if (L.sub.length) {
    const p2 = prog(t, tNext, tNext + 0.3, ease.outCubic) * out;
    c.save();
    c.font = FONT.body(29 * u);
    c.fillStyle = C.muted;
    c.globalAlpha = p2;
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    L.sub.forEach((l, k) => c.fillText(l, r.x + pad, y + 12 * u + 29 * u + k * 38 * u));
    c.restore();
  }
}

/**
 * Which caption shows at t, its window, and the card's opacity. The card fades only where captions are not back
 * to back; at the plate's own edges (the cuts) it simply appears or goes with the cut.
 */
export function captionAt(caps: Caption[], t: number, plateStart: number, plateEnd: number) {
  for (let i = caps.length - 1; i >= 0; i--) {
    const cap = caps[i]!;
    if (t < cap.at) continue;
    const next = caps[i + 1]?.at ?? plateEnd, end = Math.min(cap.until ?? next, next);
    if (t >= end) return null;
    const prevEnd = i > 0 ? Math.min(caps[i - 1]!.until ?? cap.at, cap.at) : plateStart;
    const fadeIn = prevEnd < cap.at - 1e-3 ? prog(t, cap.at, cap.at + 0.2) : 1;
    const fadeOut = end < next - 1e-3 ? 1 - prog(t, end - 0.2, end) : 1;
    // back to back with the previous caption: the card morphs from its height instead of popping
    const morph = i > 0 && prevEnd >= cap.at - 1e-3 ? { from: i - 1, p: prog(t, cap.at, cap.at + 0.3, ease.inOutQuad) } : null;
    return { cap, index: i, start: cap.at, end, card: Math.min(fadeIn, fadeOut), morph };
  }
  return null;
}
