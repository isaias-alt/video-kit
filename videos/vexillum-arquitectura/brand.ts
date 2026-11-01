// Brand tokens (PROVISIONAL: there is no brand yet). Every colour and font of the video comes from here, so a
// real brand is a change to this one file. Look: technical sketchbook, ink and watercolour on warm paper.
import inter500 from '@fontsource/inter/files/inter-latin-500-normal.woff2?url';
import inter700 from '@fontsource/inter/files/inter-latin-700-normal.woff2?url';
import inter800 from '@fontsource/inter/files/inter-latin-800-normal.woff2?url';
import mono400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url';
import mono700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2?url';

export const C = {
  paper: '#EFE8DA', // background
  card: '#F7F2E7', // caption cards
  ink: '#1C1E22', // text, outlines, terminal panes
  night: '#121316', // behind the terminal panes of the hook
  muted: '#6B675F',
  graphite: '#8A857A', // backdrop pencil
  lapis: '#2F5DA8', // commander, missions, primary accent
  lapisWash: '#9DB4D8',
  vermilion: '#D2512F', // sentinel, alerts
  vermWash: '#E9A68E',
  ochre: '#C8922E', // human gate, scouts
  ochreWash: '#E8C98A',
  moss: '#4F8A5B', // done, landed
  mossWash: '#A9CBA6',
} as const;

/** A token colour with alpha, for gradients and veils. */
export function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Family names are prefixed so they never collide with the engine's own fonts.
export const FONT = {
  head: (px: number, w: 700 | 800 = 800) => `${w} ${px}px "VK Inter"`,
  body: (px: number, w: 500 | 700 = 500) => `${w} ${px}px "VK Inter"`,
  mono: (px: number, w: 400 | 700 = 400) => `${w} ${px}px "VK Mono"`,
};

let fontsReady: Promise<void> | null = null;
export function loadBrandFonts(): Promise<void> {
  fontsReady ??= (async () => {
    const defs: [string, string, string][] = [
      ['VK Inter', inter500, '500'], ['VK Inter', inter700, '700'], ['VK Inter', inter800, '800'],
      ['VK Mono', mono400, '400'], ['VK Mono', mono700, '700'],
    ];
    await Promise.all(defs.map(async ([family, url, weight]) => {
      const ff = new FontFace(family, `url(${url})`, { weight });
      await ff.load();
      document.fonts.add(ff);
    }));
  })();
  return fontsReady;
}

export { rr, text } from '@kit/draw';
