// NutriOne brand tokens and drawing helpers. Colours and fonts come from nutrione-web
// (src/lib/landing-content.ts, src/app/globals.css, src/app/layout.tsx).
import fr400 from '@fontsource/fraunces/files/fraunces-latin-400-normal.woff2?url';
import fr400i from '@fontsource/fraunces/files/fraunces-latin-400-italic.woff2?url';
import fr600 from '@fontsource/fraunces/files/fraunces-latin-600-normal.woff2?url';
import fr700 from '@fontsource/fraunces/files/fraunces-latin-700-normal.woff2?url';
import in400 from '@fontsource/inter/files/inter-latin-400-normal.woff2?url';
import in500 from '@fontsource/inter/files/inter-latin-500-normal.woff2?url';
import in600 from '@fontsource/inter/files/inter-latin-600-normal.woff2?url';
import mo400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url';
import mo500 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2?url';
import { LOGO_PATHS, LOGO_VB } from './_logo';
import { card as kitCard, type CardOptions } from '@kit/draw';

export const C = {
  bg: '#F8FAFC', // slate-50 (secondary)
  white: '#FFFFFF',
  ink: '#0F172A', // slate-900 (foreground)
  muted: '#64748B', // slate-500
  line: '#E2E8F0', // slate-200
  brand: '#15803D',
  bright: '#16A34A',
  logo: '#2D8B57',
} as const;

export type ToneKey = 'green' | 'blue' | 'yellow' | 'red';
export const TONES: Record<ToneKey, { bg: string; border: string; text: string; soft: string }> = {
  green: { bg: '#DCFCE7', border: '#86EFAC', text: '#15803D', soft: '#F0FDF4' },
  blue: { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF', soft: '#EFF6FF' },
  yellow: { bg: '#FEF3C7', border: '#FDE68A', text: '#A16207', soft: '#FEFCE8' },
  red: { bg: '#FEE2E2', border: '#FCA5A5', text: '#B91C1C', soft: '#FEF2F2' },
};

export const FONT = {
  display: (px: number, w: 400 | 600 | 700 = 600) => `${w} ${px}px "NO Fraunces"`,
  displayItalic: (px: number) => `italic 400 ${px}px "NO Fraunces"`,
  sans: (px: number, w: 400 | 500 | 600 = 500) => `${w} ${px}px "NO Inter"`,
  mono: (px: number, w: 400 | 500 = 500) => `${w} ${px}px "NO Mono"`,
};

let fontsReady: Promise<void> | null = null;
export function loadBrandFonts(): Promise<void> {
  fontsReady ??= (async () => {
    const defs: [string, string, string, string?][] = [
      ['NO Fraunces', fr400, '400'], ['NO Fraunces', fr600, '600'], ['NO Fraunces', fr700, '700'],
      ['NO Fraunces', fr400i, '400', 'italic'],
      ['NO Inter', in400, '400'], ['NO Inter', in500, '500'], ['NO Inter', in600, '600'],
      ['NO Mono', mo400, '400'], ['NO Mono', mo500, '500'],
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
/** A white card with a soft shadow and a hairline border (brand defaults over the kit's card). */
export const card = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, o: CardOptions = {}) =>
  kitCard(c, x, y, w, h, { fill: C.white, border: C.line, ...o });

/** NutriOne isotipo, `h` px tall, top-left at (x, y). `reveal` 0..1 wipes it in bottom to top. */
export function logo(c: CanvasRenderingContext2D, x: number, y: number, h: number, color: string = C.logo, reveal = 1) {
  const s = h / LOGO_VB.h;
  c.save();
  c.beginPath();
  c.rect(x - 4, y + h * (1 - reveal) - 4, LOGO_VB.w * s + 8, h * reveal + 8);
  c.clip();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = color;
  for (const d of LOGO_PATHS) c.fill(new Path2D(d));
  c.restore();
}
export const logoWidth = (h: number) => (LOGO_VB.w / LOGO_VB.h) * h;
