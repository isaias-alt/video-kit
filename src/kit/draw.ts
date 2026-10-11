// Small Canvas2D helpers shared by all videos. Colours are parameters: brand defaults live in each video's brand.ts.

/** Rounded-rect path. */
export function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + k, y);
  c.arcTo(x + w, y, x + w, y + h, k);
  c.arcTo(x + w, y + h, x, y + h, k);
  c.arcTo(x, y + h, x, y, k);
  c.arcTo(x, y, x + w, y, k);
  c.closePath();
}

export interface CardOptions { r?: number; fill?: string; border?: string; lift?: number }

/** A card with a soft shadow and a hairline border. `lift` scales the shadow (0 = flat). */
export function card(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, o: CardOptions = {}) {
  const lift = o.lift ?? 1;
  c.save();
  c.shadowColor = `rgba(15,23,42,${0.10 * lift})`;
  c.shadowBlur = 40 * lift;
  c.shadowOffsetY = 14 * lift;
  rr(c, x, y, w, h, o.r ?? 20);
  c.fillStyle = o.fill ?? '#FFFFFF';
  c.fill();
  c.restore();
  c.save();
  rr(c, x, y, w, h, o.r ?? 20);
  c.lineWidth = 1.5;
  c.strokeStyle = o.border ?? '#E2E8F0';
  c.stroke();
  c.restore();
}

/** Single-line text at a baseline position; `ls` is letter-spacing in px. */
export function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left', ls = 0) {
  c.font = font;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.letterSpacing = `${ls}px`;
  c.fillText(s, x, y);
  c.letterSpacing = '0px';
  c.textAlign = 'left';
}
