// NutriOne promo, 40 s, 120 bpm (1 beat = 0.5 s, 1 bar = 2 s). Hard cuts on the beat; each plate draws its own wipes.
// The track (out/audio/musica.wav, from its second 2) is muxed after render: intro 0-6, build 6-14, drop at 14.0, full section after.
import type { TimelineEntry } from '@engine/engine';
import type { SceneClass } from '@engine/scene';
import type { Lyrics } from '@engine/lyrics';
import type { AudioData } from '@engine/audio';
import { W, H } from '@engine/gl';

// Plates are discovered lazily so a missing/broken plate never breaks the build.
const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const portrait = H > W;
// In portrait, scenes/v-<name>.ts is used when it exists, otherwise the same plate (it lays out from W/H).
const load = (name: string) => () => {
  const m = (portrait && modules[`./scenes/v-${name}.ts`]) || modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`plate not found: scenes/${name}.ts`));
};

// Flat light look: film post off, grain barely there.
const POST = { exposure: 1, bloom: 0, halation: 0, ca: 0, grain: 0.012, vignette: 0, hud: 0 };

export function makeTimeline(_ly: Lyrics, au: AudioData): TimelineEntry[] {
  const E = (id: string, file: string, start: number, end: number, params: Record<string, any> = {}): TimelineEntry =>
    ({ id, load: load(file), start, end, params: { fadeIn: false, fadeOut: false, ...params }, post: POST });
  return [
    E('caos', 'caos', 0, 14),
    E('todo', 'todo', 14, 18),
    E('agenda', 'agenda', 18, 24),
    E('pacientes', 'pacientes', 24, 30),
    E('plan', 'plan', 30, 36),
    E('cierre', 'cierre', 36, au.duration, { fadeOut: true }),
  ];
}
