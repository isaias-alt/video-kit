// The edit: which plate plays when. No audio, so times are plain seconds; total length is data/audio.json "duration".
import type { TimelineEntry } from '@engine/engine';
import type { SceneClass } from '@engine/scene';
import type { Lyrics } from '@engine/lyrics';
import type { AudioData } from '@engine/audio';
import { H, W } from '@engine/gl';

const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const portrait = H > W;
const load = (name: string) => () => {
  const m = (portrait && modules[`./scenes/v-${name}.ts`]) || modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`plate not found: scenes/${name}.ts`));
};

// Flat look: film post (bloom, halation, aberration, vignette) off, grain barely there.
const POST = { exposure: 1, bloom: 0, halation: 0, ca: 0, grain: 0.012, vignette: 0, hud: 0 };

export function makeTimeline(_ly: Lyrics, _au: AudioData): TimelineEntry[] {
  const E = (id: string, start: number, end: number, params: Record<string, any> = {}): TimelineEntry =>
    ({ id, load: load(id), start, end, params, post: POST });
  return [
    E('intro', 0, 3.4, { fadeIn: false, speed: 1.2 }),
    E('orden', 3.4, 8.8, { speed: 1.3 }),
    E('camps', 8.8, 15.2, { speed: 1.25 }),
    E('sentinel', 15.2, 23.4, { speed: 1.15 }),
    E('ship', 23.4, 30.6, { speed: 1.25 }),
    E('outro', 30.6, 34.6, { fadeOut: false }),
  ];
}
