// The window the app lives in, per orientation. Landscape: near full-bleed. Portrait: a square-ish window below the
// headline zone and above the social UI zone (about 210 px at the top and 400 px at the bottom stay clear).
import { W, H, portrait } from './plate';
import type { Win } from './ui';

export const WIN: Win = portrait ? { x: 40, y: 480, w: W - 80, h: 1010, r: 28 } : { x: 40, y: 40, w: W - 80, h: H - 80, r: 28 };
export { portrait, W, H };
/** Headline anchor (top-left) for text outside the window in portrait. */
export const HEAD = { x: 70, y: 330 };

/** The app plates play at 1/SLOW speed: their 4 s of action is spread over 6 s so each part of the UI can be read. */
export const SLOW = 1.5;
