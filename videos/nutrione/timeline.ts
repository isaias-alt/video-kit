// The edit: which plate plays when. No audio, so the times are plain seconds.
import type { TimelineEntry } from '@engine/engine';
import type { SceneClass } from '@engine/scene';
import type { Lyrics } from '@engine/lyrics';
import type { AudioData } from '@engine/audio';
import { W, H } from '@engine/gl';

// Scene modules are discovered lazily so a missing/broken scene never breaks the build.
const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

// A light, clean look: the engine's film treatment (bloom, halation, aberration, vignette) is off,
// grain stays barely there. (_plate.ts inverts the engine's tone shoulder so light colours stay light.)
const POST = { exposure: 1, bloom: 0, halation: 0, ca: 0, grain: 0.012, vignette: 0, hud: 0 };

export function makeTimeline(_ly: Lyrics, au: AudioData): TimelineEntry[] {
  const E = (id: string, file: string, start: number, end: number, params: Record<string, any> = {}): TimelineEntry =>
    ({ id, load: scene(file), start, end, params, post: POST });
  // same edit for both formats; portrait frames use the v-* plates, laid out for 1080x1920
  const v = H > W ? 'v-' : '';
  return [
    E('agenda', `${v}agenda`, 0, 11, { fadeIn: false }),
    E('fichas', `${v}fichas`, 11, 17),
    E('planes', `${v}planes`, 17, 25),
    E('marca', `${v}marca`, 25, au.duration, { fadeOut: false }),
  ];
}
