// The edit: one plate per voice take, cut where the takes meet. The takes' lengths come from data/audio.json
// "sections", written by audio/beat.ts from the real WAVs (or the script's estimates until they exist), and are
// handed to score.ts so every cue inside a take follows the recording.
import type { TimelineEntry } from '@engine/engine';
import type { SceneClass } from '@engine/scene';
import type { Lyrics } from '@engine/lyrics';
import type { AudioData } from '@engine/audio';
import { TAKES, setTakes, take } from './score';

const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const load = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`plate not found: scenes/${name}.ts`));
};

// Light paper look: film post off, a breath of grain.
const POST = { exposure: 1, bloom: 0, halation: 0, ca: 0, grain: 0.014, vignette: 0, hud: 0 };

export function makeTimeline(_ly: Lyrics, au: AudioData): TimelineEntry[] {
  const secs = TAKES.map((tk) => au.sections.find((s) => s.name === tk.id));
  if (secs.some((s) => !s)) throw new Error('data/audio.json has no take sections: run `npm run vk -- audio <video>`');
  setTakes(secs.map((s) => s!.end - s!.start));
  return TAKES.map((tk, i) => ({
    id: tk.id, load: load(tk.id), start: take(i).start, end: take(i).end, post: POST,
    params: { fadeIn: false, fadeOut: false },
  }));
}
