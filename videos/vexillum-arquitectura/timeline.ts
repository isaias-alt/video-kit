// The edit: one plate per section of the score (score.ts), cut on the downbeat with no cross-fade: the world is
// continuous, the camera does the transitions. Total length = data/audio.json "duration" (written by audio/beat.ts).
import type { TimelineEntry } from '@engine/engine';
import type { SceneClass } from '@engine/scene';
import type { Lyrics } from '@engine/lyrics';
import type { AudioData } from '@engine/audio';
import { SECTIONS, at } from './score';

const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const load = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`plate not found: scenes/${name}.ts`));
};

// Light paper look: film post off, a breath of grain.
const POST = { exposure: 1, bloom: 0, halation: 0, ca: 0, grain: 0.014, vignette: 0, hud: 0 };

export function makeTimeline(_ly: Lyrics, _au: AudioData): TimelineEntry[] {
  return SECTIONS.map((s) => ({
    id: s.id, load: load(s.id), start: at(s.from), end: at(s.to), post: POST,
    params: { fadeIn: false, fadeOut: false },
  }));
}
