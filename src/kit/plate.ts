// Base class for plates: a 2D canvas layer drawn as a pure function of time, composited into the engine's
// HDR target. The look is light/flat by default, so the engine's film post is meant to be (nearly) off
// (set it per entry in the video's timeline, see videos/_template/timeline.ts).
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '@engine/scene';
import { FSPass, Layer2D, W, H } from '@engine/gl';

export { W, H };

// The engine ends in a tone shoulder (identity below 0.72, compressing above) that greys out light palettes
// (white lands near #F3F3F3 and pale colours collapse together). Pre-apply its inverse so the net transfer is
// the identity. Remove it only if you want the film look (then use a dark palette and keep the engine's post).
const COMP = /* glsl */ `
uniform sampler2D tex;
void main() {
  vec3 y = min(texture(tex, vUv).rgb, vec3(0.995));
  vec3 x = mix(y, 0.72 - 0.28 * log(1.0 - (y - 0.72) / 0.28), step(0.72, y));
  fragColor = vec4(x, 1.0);
}`;

export interface PlateOptions {
  /** Background colour painted before draw() each frame (CSS colour). */
  bg: string;
  /** Resolves when the video's fonts are registered (document.fonts). Called from init(). */
  loadFonts?: () => Promise<void>;
  /** Seconds of soft cross-fade through the background at a plate's start/end (default 0.4). */
  fade?: number;
}

/**
 * Make the Plate base class for one video. In videos/<name>/plate.ts:
 *   export const Plate = makePlate({ bg: C.bg, loadFonts: loadBrandFonts });
 * Entry params `fadeIn: false` / `fadeOut: false` (timeline) disable the cross-fade at that edge.
 */
export function makePlate(opts: PlateOptions) {
  const fade = opts.fade ?? 0.4;
  abstract class Plate extends Scene {
    L = new Layer2D();
    pass!: FSPass;

    override async init() {
      await opts.loadFonts?.();
      this.pass = new FSPass(COMP, { tex: { value: this.L.texture } });
    }

    /** Draw the whole frame in W x H logical px, top-left origin (1920x1080, or 1080x1920 in portrait). */
    abstract draw(c: CanvasRenderingContext2D, f: Frame): void;

    override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides | void {
      this.L.clear(opts.bg);
      this.draw(this.L.ctx, f);
      const dur = this.ctx.end - this.ctx.start, c = this.L.ctx, p = this.ctx.params;
      const a = Math.max(p.fadeIn === false ? 0 : 1 - f.lt / fade, p.fadeOut === false ? 0 : 1 - (dur - f.lt) / fade);
      if (a > 0) { c.globalAlpha = Math.min(1, a); c.fillStyle = opts.bg; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
      this.L.upload();
      this.pass.render(this.ctx.renderer, out, true);
    }
  }
  return Plate;
}
