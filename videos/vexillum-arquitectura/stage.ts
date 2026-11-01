// One plate per section of the score. Every plate draws the same continuous world through the same global
// camera (layout.ts), so sections differ only in their backdrop, their pattern and their captions.
import type { Frame } from '@engine/scene';
import { Plate, W, H } from './plate';
import { camAt } from './layout';
import { BOIL, cardLayer, markerLayer, paperLayer, sectionLayers, worldSprites, type WorldSprites } from './paint';
import { captionAt, cardRect, drawCaption, drawHeader, drawVeils, type Caption, type OverlayAssets } from './overlay';
import { SECTIONS, at, barOf, type SectionId } from './score';
import { drawStamps, drawWorld } from './world';

export interface SectionSpec {
  id: SectionId;
  /** The design pattern this beat shows (header). */
  pattern?: string;
  captions: Caption[];
  /** Draw the world as it is at this bar instead of now (the hook previews the running system). */
  stateBar?: number;
  stamps?: { text: string; x: number; y: number; at: number; rot: number }[];
}

/** Vertical centre of the diagram band, between the header and the caption card. */
const VIEW_Y = H * 0.404;

export function section(spec: SectionSpec) {
  const sec = SECTIONS.find((s) => s.id === spec.id)!;
  return class Section extends Plate {
    S!: WorldSprites;
    paper!: HTMLCanvasElement;
    boil!: HTMLCanvasElement[];
    A!: OverlayAssets;

    override async init() {
      await super.init();
      const r = cardRect(W, H);
      const [S, paper, boil, card, marker] = await Promise.all([
        worldSprites(), paperLayer(W, H), sectionLayers(spec.id, W, H), cardLayer(Math.round(r.w), Math.round(r.h)), markerLayer(),
      ]);
      Object.assign(this, { S, paper, boil, A: { card, marker } });
    }

    draw(c: CanvasRenderingContext2D, f: Frame) {
      const t = f.t, kick = f.a.kick, u = W / 1080;
      const cam = camAt(barOf(t), t, kick);

      // backdrop: paper (slow parallax) and the section's pencil field, boiling on the eighth notes
      c.save();
      c.translate(W / 2 - (cam.x - 540) * 0.05 * u, H / 2 - (cam.y - 900) * 0.04 * u);
      c.scale(1.08, 1.08);
      c.translate(-W / 2, -H / 2);
      c.drawImage(this.paper, 0, 0);
      c.globalCompositeOperation = 'multiply';
      c.globalAlpha = Math.min(1, 0.55 + 0.45 * kick);
      c.drawImage(this.boil[Math.floor(f.beat * 2) % BOIL]!, 0, 0);
      c.restore();

      // the world, through the camera
      c.save();
      c.translate(W / 2, VIEW_Y);
      c.scale(cam.z * u, cam.z * u);
      c.translate(-cam.x, -cam.y);
      drawWorld(c, this.S, f, { stateBar: spec.stateBar });
      if (spec.stamps) drawStamps(c, barOf(t), spec.stamps);
      c.restore();

      // type
      drawVeils(c, W, H, 0.3 * Math.min(1, Math.max(0, 1.6 - cam.z)));
      drawHeader(c, W, H, t, spec.pattern, at(sec.from));
      const cur = captionAt(spec.captions, t, sec.to);
      if (cur) drawCaption(c, this.A, W, H, t, cur.cap, cur.start, cur.end);
    }
  };
}
