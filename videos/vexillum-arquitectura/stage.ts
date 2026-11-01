// One plate per voice take. Every plate draws the same continuous world through the same camera (layout.ts),
// so takes differ only in their backdrop, their pattern and their captions. All times come from the cues
// (score.ts), which come from the takes' real lengths.
import type { Frame } from '@engine/scene';
import { prog } from '@engine/util';
import { Plate, W, H } from './plate';
import { camAt } from './layout';
import { BOIL, cardLayer, markerLayer, paperLayer, sectionLayers, worldSprites, type WorldSprites } from './paint';
import { captionAt, captionHeight, cardRect, drawCaption, drawHeader, drawVeils, type Caption, type OverlayAssets } from './overlay';
import { drawPanes } from './panes';
import { cues, take, type Cues } from './score';
import { drawStamps, drawWorld } from './world';

export interface TakeSpec {
  /** Index into TAKES (0 = toma-01). */
  take: number;
  /** The pattern this take names on screen, and when it appears. */
  pattern?: (c: Cues) => { text: string; at: number };
  captions: (c: Cues) => Caption[];
  stamps?: (c: Cues) => { text: string; x: number; y: number; at: number; rot: number }[];
  /** The hook's terminal panes, until this time. */
  panesUntil?: (c: Cues) => number;
}

/** Vertical centre of the diagram band, between the header and the caption card. */
const VIEW_Y = H * 0.404;

export function takePlate(spec: TakeSpec) {
  return class TakePlate extends Plate {
    S!: WorldSprites;
    paper!: HTMLCanvasElement;
    boil!: HTMLCanvasElement[];
    A!: OverlayAssets;
    capH: number[] | null = null;

    override async init() {
      await super.init();
      const r = cardRect(W, H);
      const [S, paper, boil, card, marker] = await Promise.all([
        worldSprites(), paperLayer(W, H), sectionLayers(spec.take, W, H), cardLayer(Math.round(r.w), Math.round(r.h * 1.3)), markerLayer(),
      ]);
      Object.assign(this, { S, paper, boil, A: { card, marker } });
    }

    draw(c: CanvasRenderingContext2D, f: Frame) {
      const t = f.t, kick = f.a.kick, u = W / 1080, K = cues(), tk = take(spec.take);
      const cam = camAt(K, t, kick);

      // backdrop: paper (slow parallax) and the take's pencil field, boiling on the eighth notes
      c.save();
      c.translate(W / 2 - (cam.x - 540) * 0.05 * u, H / 2 - (cam.y - 900) * 0.04 * u);
      c.scale(1.08, 1.08);
      c.translate(-W / 2, -H / 2);
      c.drawImage(this.paper, 0, 0);
      c.globalCompositeOperation = 'multiply';
      c.globalAlpha = Math.min(1, 0.55 + 0.45 * kick);
      c.drawImage(this.boil[((Math.floor(f.beat * 2) % BOIL) + BOIL) % BOIL]!, 0, 0);
      c.restore();

      // the world, through the camera
      c.save();
      c.translate(W / 2, VIEW_Y);
      c.scale(cam.z * u, cam.z * u);
      c.translate(-cam.x, -cam.y);
      drawWorld(c, this.S, f, K);
      if (spec.stamps) drawStamps(c, t, spec.stamps(K));
      c.restore();

      // type
      drawVeils(c, W, H, 0.3 * Math.min(1, Math.max(0, 1.6 - cam.z)));
      const pat = spec.pattern?.(K);
      drawHeader(c, W, H, t, pat?.text, pat?.at ?? 0);
      if (spec.panesUntil) {
        const until = spec.panesUntil(K);
        if (t < until + 0.5) drawPanes(c, W, H, t, prog(t, until, until + 0.5));
      }
      const caps = spec.captions(K);
      // caption texts never change with the takes' lengths (only their times do), so heights are measured once
      const hs = (this.capH ??= caps.map((cap) => captionHeight(c, W, H, cap)));
      const cur = captionAt(caps, t, tk.start, tk.end);
      if (cur) {
        const h = cur.morph ? hs[cur.morph.from]! + (hs[cur.index]! - hs[cur.morph.from]!) * cur.morph.p : hs[cur.index]!;
        drawCaption(c, this.A, W, H, t, cur.cap, cur.start, cur.end, h, cur.card);
      }
    }
  };
}

