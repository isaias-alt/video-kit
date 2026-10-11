// Vexillum brand tokens ("Marmol y Lapislazuli", dark). Values come from vexillum/site/app/globals.css and
// site/design/forum-tokens.css; fonts are Spectral (display) and JetBrains Mono (everything else), as on the site.
import sp400i from '@fontsource/spectral/files/spectral-latin-400-italic.woff2?url';
import sp500 from '@fontsource/spectral/files/spectral-latin-500-normal.woff2?url';
import sp600 from '@fontsource/spectral/files/spectral-latin-600-normal.woff2?url';
import mo400 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url';
import mo500 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2?url';
import mo700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2?url';

export const C = {
  bg: '#15171a',
  surface: '#1c1f24',
  sunken: '#20242a',
  border: '#292d33',
  borderStrong: '#3a3f47',
  text: '#e9eaec',
  text2: '#a0a3a9',
  muted: '#6e7177',
  accent: '#6fa1cb',
  accentSoft: 'rgba(111,161,203,0.14)',
  success: '#6fbe9a',
  successSoft: 'rgba(111,190,154,0.14)',
  danger: '#e08268',
  bronze: '#c9a15a',
  bronzeSoft: 'rgba(201,161,90,0.18)',
} as const;

// Family names are prefixed so they never collide with the engine's own fonts.
export const FONT = {
  serif: (px: number, w: 500 | 600 = 600) => `${w} ${px}px "VX Spectral"`,
  italic: (px: number) => `italic 400 ${px}px "VX Spectral"`,
  mono: (px: number, w: 400 | 500 | 700 = 400) => `${w} ${px}px "VX Mono"`,
};

let fontsReady: Promise<void> | null = null;
export function loadBrandFonts(): Promise<void> {
  fontsReady ??= (async () => {
    const defs: [string, string, string, string?][] = [
      ['VX Spectral', sp400i, '400', 'italic'], ['VX Spectral', sp500, '500'], ['VX Spectral', sp600, '600'],
      ['VX Mono', mo400, '400'], ['VX Mono', mo500, '500'], ['VX Mono', mo700, '700'],
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
