// NutriOne brand tokens, from nutrione-design-system (tokens/, fonts/) and nutrione-web (landing-content.ts, globals.css).
import in300 from '@fontsource/inter/files/inter-latin-300-normal.woff2?url';
import in300i from '@fontsource/inter/files/inter-latin-300-italic.woff2?url';
import in400 from '@fontsource/inter/files/inter-latin-400-normal.woff2?url';
import in500 from '@fontsource/inter/files/inter-latin-500-normal.woff2?url';
import in600 from '@fontsource/inter/files/inter-latin-600-normal.woff2?url';
import in700 from '@fontsource/inter/files/inter-latin-700-normal.woff2?url';
import in800 from '@fontsource/inter/files/inter-latin-800-normal.woff2?url';
import mo400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url';
import mo500 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2?url';
import { ISO_PATHS, ISO_VB, HORIZ_PATHS, HORIZ_VB } from './logo';
import { card as kitCard, type CardOptions } from '@kit/draw';

export const C = {
  bg: '#F8FAFC', // secondary
  white: '#FFFFFF',
  ink: '#0F172A',
  slate700: '#334155',
  muted: '#64748B',
  line: '#E2E8F0',
  soft: '#F1F5F9',
  brand: '#15803D',
  bright: '#16A34A',
  logo: '#2D8B57', // primary
  accent: '#BBF7D0', // active nav item
} as const;

export type ToneKey = 'green' | 'blue' | 'yellow' | 'red';
export const TONES: Record<ToneKey, { bg: string; border: string; text: string; soft: string }> = {
  green: { bg: '#DCFCE7', border: '#86EFAC', text: '#15803D', soft: '#F0FDF4' },
  blue: { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF', soft: '#EFF6FF' },
  yellow: { bg: '#FEF3C7', border: '#FDE68A', text: '#A16207', soft: '#FEFCE8' },
  red: { bg: '#FEE2E2', border: '#FCA5A5', text: '#B91C1C', soft: '#FEF2F2' },
};

// Family names are prefixed so they never collide with the engine's own fonts.
export const FONT = {
  sans: (px: number, w: 300 | 400 | 500 | 600 | 700 | 800 = 500) => `${w} ${px}px "NP Inter"`,
  light: (px: number) => `italic 300 ${px}px "NP Inter"`,
  mono: (px: number, w: 400 | 500 = 500) => `${w} ${px}px "NP Mono"`,
};

let fontsReady: Promise<void> | null = null;
export function loadBrandFonts(): Promise<void> {
  fontsReady ??= (async () => {
    const defs: [string, string, string, string?][] = [
      ['NP Inter', in300, '300'], ['NP Inter', in300i, '300', 'italic'], ['NP Inter', in400, '400'], ['NP Inter', in500, '500'],
      ['NP Inter', in600, '600'], ['NP Inter', in700, '700'], ['NP Inter', in800, '800'],
      ['NP Mono', mo400, '400'], ['NP Mono', mo500, '500'],
    ];
    await Promise.all(defs.map(async ([family, url, weight, style]) => {
      const ff = new FontFace(family, `url(${url})`, { weight, style: style ?? 'normal' });
      await ff.load();
      document.fonts.add(ff);
    }));
  })();
  return fontsReady;
}

export { rr, text } from '@kit/draw';
export const card = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, o: CardOptions = {}) =>
  kitCard(c, x, y, w, h, { fill: C.white, border: C.line, ...o });

function paint(c: CanvasRenderingContext2D, paths: string[], vb: { w: number; h: number }, x: number, y: number, h: number, color: string, reveal: number) {
  const s = h / vb.h;
  c.save();
  c.beginPath(); c.rect(x - 4, y + h * (1 - reveal) - 4, vb.w * s + 8, h * reveal + 8); c.clip();
  c.translate(x, y); c.scale(s, s);
  c.fillStyle = color;
  for (const d of paths) c.fill(new Path2D(d));
  c.restore();
}
/** NutriOne isotipo, `h` px tall, top-left at (x, y). `reveal` 0..1 wipes it in bottom to top. */
export const isotipo = (c: CanvasRenderingContext2D, x: number, y: number, h: number, color: string = C.logo, reveal = 1) => paint(c, ISO_PATHS, ISO_VB, x, y, h, color, reveal);
/** Horizontal logo (isotipo + wordmark). */
export const logoH = (c: CanvasRenderingContext2D, x: number, y: number, h: number, color: string = C.logo, reveal = 1) => paint(c, HORIZ_PATHS, HORIZ_VB, x, y, h, color, reveal);
export const logoHW = (h: number) => (HORIZ_VB.w / HORIZ_VB.h) * h;
export const isoW = (h: number) => (ISO_VB.w / ISO_VB.h) * h;
