// The edit: which plate plays when. There is no audio, so times are plain seconds. The total length is
// data/audio.json "duration" (`au.duration`).
import type { TimelineEntry } from '@engine/engine';
import type { SceneClass } from '@engine/scene';
import type { Lyrics } from '@engine/lyrics';
import type { AudioData } from '@engine/audio';
import { W, H } from '@engine/gl';

// Plate modules are discovered lazily so a missing/broken plate never breaks the build.
const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const portrait = H > W;
// In portrait, scenes/v-<name>.ts is used when it exists, otherwise the same plate (it must then lay out from W/H).
const load = (name: string) => () => {
  const m = (portrait && modules[`./scenes/v-${name}.ts`]) || modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`plate not found: scenes/${name}.ts`));
};

// Film post (bloom, halation, aberration, vignette) is off for a flat/light look; grain stays barely there.
// For a dark cinematic look drop this override and remove the tone-shoulder inverse in src/kit/plate.ts.
const POST = { exposure: 1, bloom: 0, halation: 0, ca: 0, grain: 0.012, vignette: 0, hud: 0 };

export function makeTimeline(_ly: Lyrics, au: AudioData): TimelineEntry[] {
  const E = (id: string, file: string, start: number, end: number, params: Record<string, any> = {}): TimelineEntry =>
    ({ id, load: load(file), start, end, params, post: POST });
  return [
    // first plate has no fade-in, last one no fade-out
    E('hello', 'hello', 0, au.duration, { fadeIn: false, fadeOut: false }),
  ];
}
