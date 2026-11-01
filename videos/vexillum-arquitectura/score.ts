// The score: one musical grid shared by the picture (timeline, world, captions) and the beat (audio/beat.ts).
// Everything is placed in BARS, not seconds, so a cut, a caption and a drum hit can never drift apart.
// 160 BPM in 4/4, felt half-time (kick on 1, snare on 3): one bar = 1.5 s, 40 bars = 60 s.
export const BPM = 160;
export const BEAT = 60 / BPM; // 0.375 s
export const BAR = 4 * BEAT; // 1.5 s
export const BARS = 40;
export const DURATION = BARS * BAR; // 60 s

/** Seconds of a (fractional) bar. */
export const at = (bar: number) => bar * BAR;
/** Fractional bar at t seconds. */
export const barOf = (t: number) => t / BAR;

export type SectionId = 'hook' | 'commander' | 'soldiers' | 'camps' | 'sentinel' | 'land' | 'ship' | 'outro';
export const SECTIONS: { id: SectionId; from: number; to: number }[] = [
  { id: 'hook', from: 0, to: 2 },
  { id: 'commander', from: 2, to: 6 },
  { id: 'soldiers', from: 6, to: 11 },
  { id: 'camps', from: 11, to: 18 },
  { id: 'sentinel', from: 18, to: 26 },
  { id: 'land', from: 26, to: 32 },
  { id: 'ship', from: 32, to: 37 },
  { id: 'outro', from: 37, to: 40 },
];

/**
 * Cues (bars). The world animates from them, and the beat puts a sound on the ones marked in HITS.
 * Fractions are beats: .25 = beat 2, .5 = beat 3 (the half-time snare), .75 = beat 4.
 */
export const CUE = {
  hookSplit: 1,
  general: 2,
  commander: 2.25,
  talk: 2.5, // general -> commander line
  typing: 4.25, // `vx dispatch` typed until typing + 0.75
  dispatch: 6, // dispatch strokes grow (0.75 bar)
  soldiers: [6.5, 7, 7.5], // each soldier orb lands (snare-like hit)
  kinds: 7.75,
  models: [8.75, 9, 9.25],
  camps: [11, 11.25, 11.5], // camp boxes painted in
  panes: 12.5,
  main: 13,
  branches: 13.5, // grow until +1
  caution: 16,
  sentinel: 18.5,
  wakePath: 19,
  scanFrom: 19, // one radar sweep per bar from here
  done: 21, // left mission commits and settles
  report: 21.5, // the scout's report appears
  wake: [22.25, 23.75] as [number, number], // wake token travels sentinel -> commander
  awake: 24,
  states: 24.5,
  gate: 26.5,
  ask: 28.25,
  approve: 29.25,
  gateOpen: 29.5,
  ff: [30, 30.75] as [number, number], // fast-forward: main moves to the branch tip
  strike: 31,
  stations: [32.75, 33.5, 34.25], // lint, tests, review start
  reviewed: 35.5,
  pr: 36,
  outro: 37,
  recap: [37.5, 38, 38.5, 39],
  title: 39,
} as const;

/** Bars where the beat lands an impact (boom + noise burst): the big cuts and turns of the story. */
export const HITS = [0, CUE.hookSplit, 2, 6, 11, 18, CUE.awake, 26, CUE.ff[0], 32, CUE.pr, 37, CUE.title];
/** Bars with a short bright accent (pluck/chime) for smaller events. */
export const TICKS = [CUE.commander, ...CUE.soldiers, ...CUE.camps, CUE.done, CUE.report, CUE.approve, CUE.strike, ...CUE.stations, CUE.reviewed, ...CUE.recap];
