// Brand tokens for this video: colours, fonts, and (if there is one) the logo. Replace the placeholders with
// the real brand's values (read them from the product's repo: theme css, tailwind config, logo svg).
import inter500 from '@fontsource/inter/files/inter-latin-500-normal.woff2?url';
import inter700 from '@fontsource/inter/files/inter-latin-700-normal.woff2?url';

export const C = {
  bg: '#F8FAFC',
  ink: '#0F172A',
  muted: '#64748B',
  line: '#E2E8F0',
  accent: '#16A34A',
} as const;

// Family names are prefixed so they never collide with the engine's own fonts.
export const FONT = {
  sans: (px: number, w: 500 | 700 = 500) => `${w} ${px}px "VK Inter"`,
};

let fontsReady: Promise<void> | null = null;
/** Register the video's fonts once. Fontsource packages ship woff2: `npm i -D @fontsource/<family>`. */
export function loadBrandFonts(): Promise<void> {
  fontsReady ??= (async () => {
    const defs: [string, string, string][] = [['VK Inter', inter500, '500'], ['VK Inter', inter700, '700']];
    await Promise.all(defs.map(async ([family, url, weight]) => {
      const ff = new FontFace(family, `url(${url})`, { weight });
      await ff.load();
      document.fonts.add(ff);
    }));
  })();
  return fontsReady;
}

export { rr, card, text } from '@kit/draw';
