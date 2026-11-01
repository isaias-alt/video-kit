#!/usr/bin/env bun
// The soundtrack, built from code: a synthesized beat (no samples, no third-party audio: nothing to license) under
// the general's voice takes. It reads the same score as the picture (../score.ts).
// - Voice: drop toma-01.wav ... toma-06.wav into ../voz/. Each take lasts exactly as long as its WAV (any rate,
//   bit depth or channel count; mixed to mono). A missing take uses the middle of the script's range, silent.
// - Beat: 160 BPM, half-time feel; its bar restarts at every take, so each cut lands on a downbeat with an impact.
//   It ducks under the voice.
// Deterministic: a seeded PRNG drives all noise, so the same inputs give the same WAV byte for byte.
//   bun videos/vexillum-arquitectura/audio/beat.ts            (scripts/vk.mjs runs it: `vk audio` and `vk render`)
// Writes out/<video>/soundtrack.wav (48 kHz, 16-bit stereo) and data/audio.json: the takes as "sections" (the timeline
// reads its cuts from there), the beat grid and onsets (f.beat, f.a.kick ...) and a loudness envelope.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { BAR, BEAT, BPM, TAKES, cues, duration, estimate, hits, setTakes, take, ticks } from '../score';

const VIDEO = path.basename(path.resolve(import.meta.dir, '..'));
const ROOT = path.resolve(import.meta.dir, '../../..');
const VOICE_DIR = path.resolve(import.meta.dir, '../voz');
const SR = 48000;
const S16 = BEAT / 4; // a sixteenth

/** A WAV file as mono float samples at SR (PCM 16/24/32-bit or float32; linear resampling if needed). */
function readWav(file: string): Float32Array {
  const b = readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') throw new Error(`${file}: not a WAV`);
  let fmt = 0, ch = 0, rate = 0, bits = 0, data: Buffer | null = null;
  for (let o = 12; o + 8 <= b.length;) {
    const id = b.toString('ascii', o, o + 4), size = b.readUInt32LE(o + 4);
    if (id === 'fmt ') { fmt = b.readUInt16LE(o + 8); ch = b.readUInt16LE(o + 10); rate = b.readUInt32LE(o + 12); bits = b.readUInt16LE(o + 22); if (fmt === 0xfffe) fmt = b.readUInt16LE(o + 32); }
    if (id === 'data') data = b.subarray(o + 8, o + 8 + size);
    o += 8 + size + (size & 1);
  }
  if (!data || !ch) throw new Error(`${file}: no fmt/data chunk`);
  const bps = bits / 8, frames = Math.floor(data.length / (bps * ch)), mono = new Float32Array(frames);
  const at = (k: number) => {
    if (fmt === 3) return bits === 64 ? data!.readDoubleLE(k) : data!.readFloatLE(k);
    if (bits === 16) return data!.readInt16LE(k) / 32768;
    if (bits === 24) return data!.readIntLE(k, 3) / 8388608;
    if (bits === 32) return data!.readInt32LE(k) / 2147483648;
    if (bits === 8) return (data!.readUInt8(k) - 128) / 128;
    throw new Error(`${file}: ${bits}-bit PCM not supported`);
  };
  for (let f = 0; f < frames; f++) { let v = 0; for (let c = 0; c < ch; c++) v += at((f * ch + c) * bps); mono[f] = v / ch; }
  if (rate === SR) return mono;
  const out = new Float32Array(Math.round((frames * SR) / rate));
  for (let i = 0; i < out.length; i++) { const x = (i * rate) / SR, k = Math.floor(x), u = x - k; out[i] = (mono[k] ?? 0) * (1 - u) + (mono[k + 1] ?? 0) * u; }
  return out;
}

// the takes: real recordings where they exist
const voices = TAKES.map((t) => { const f = path.join(VOICE_DIR, `${t.id}.wav`); return existsSync(f) ? readWav(f) : null; });
setTakes(TAKES.map((t, i) => (voices[i] ? voices[i]!.length / SR : estimate(t))));
const DURATION = duration();
const N = Math.round(DURATION * SR);
const C = cues();

// ---------------------------------------------------------------- tools
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x5e17);
const noise = () => rnd() * 2 - 1;
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class Bus {
  L = new Float32Array(N);
  R = new Float32Array(N);
  add(i: number, v: number, pan = 0) {
    if (i < 0 || i >= N) return;
    this.L[i]! += v * Math.cos((pan + 1) * Math.PI / 4) * Math.SQRT2;
    this.R[i]! += v * Math.sin((pan + 1) * Math.PI / 4) * Math.SQRT2;
  }
}
const drums = new Bus(), bass = new Bus(), pad = new Bus(), lead = new Bus(), fx = new Bus();

/** Band-limited sawtooth (polyBLEP). */
function blep(t: number, dt: number) {
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
}

// ---------------------------------------------------------------- arrangement
type Part = 'kick' | 'snare' | 'hat8' | 'hat16' | 'bass' | 'arp' | 'tick';
/** What plays in take i at absolute time t. */
function has(i: number, t: number, part: Part) {
  const id = TAKES[i]!.id;
  // toma-04 (the sentinel) is the breakdown: ticks and pings until the commander wakes; toma-06 lets go
  const breakdown = id === 'toma-04' && t < C.awake;
  const groove = !breakdown && id !== 'toma-06' && !(id === 'toma-01' && t < C.hookEnd - BAR);
  switch (part) {
    case 'kick': case 'snare': case 'hat8': return groove;
    case 'hat16': return groove && (id === 'toma-01' || id === 'toma-03' || (id === 'toma-05' && t >= C.ff));
    case 'bass': return id !== 'toma-06';
    case 'arp': return groove && (id === 'toma-01' || id === 'toma-03' || (id === 'toma-02' && t >= C.soldier) || (id === 'toma-05' && t >= C.ff));
    case 'tick': return breakdown;
  }
}

// D minor, two bars per chord: Dm | Bb | Gm | A (the A major leans back to Dm: tense, never settles)
const CHORDS = [
  { root: 38, notes: [50, 53, 57, 62] },
  { root: 34, notes: [50, 53, 58, 62] },
  { root: 31, notes: [50, 55, 58, 62] },
  { root: 33, notes: [49, 52, 57, 61] },
];
const chordAt = (bar: number) => CHORDS[Math.floor(bar / 2) % 4]!;

// ---------------------------------------------------------------- instruments
const kicks: [number, number][] = [], snares: [number, number][] = [], hats: [number, number][] = [];

function kick(t: number, vel = 1) {
  kicks.push([t, vel]);
  const i0 = Math.round(t * SR), n = Math.round(0.5 * SR);
  let ph = 0;
  for (let k = 0; k < n; k++) {
    const tau = k / SR;
    const f = 44 + 120 * Math.exp(-tau / 0.028);
    ph += (2 * Math.PI * f) / SR;
    const v = Math.sin(ph) * Math.exp(-tau / 0.2) + (k < 120 ? noise() * 0.3 * (1 - k / 120) : 0);
    drums.add(i0 + k, Math.tanh(v * 1.6) * 0.9 * vel);
  }
}

function snare(t: number, vel = 1) {
  snares.push([t, vel]);
  const i0 = Math.round(t * SR), n = Math.round(0.32 * SR);
  let lp = 0, prev = 0;
  for (let k = 0; k < n; k++) {
    const tau = k / SR;
    const w = noise();
    const hp = w - prev; prev = w;
    lp += 0.45 * (hp - lp);
    const body = Math.sin(2 * Math.PI * 185 * tau) * Math.exp(-tau / 0.05);
    const v = lp * Math.exp(-tau / 0.11) * 0.9 + body * 0.45;
    drums.add(i0 + k, v * 0.55 * vel, (rnd() - 0.5) * 0.3);
  }
}

function hat(t: number, vel = 1, open = false) {
  hats.push([t, vel]);
  const i0 = Math.round(t * SR), dec = open ? 0.12 : 0.028, n = Math.round(dec * 6 * SR);
  let p1 = 0, p2 = 0;
  for (let k = 0; k < n; k++) {
    const w = noise();
    const h1 = w - p1; p1 = w;
    const h2 = h1 - p2; p2 = h1;
    drums.add(i0 + k, h2 * 0.11 * vel * Math.exp(-k / SR / dec), 0.35);
  }
}

function tickClick(t: number, vel = 1) {
  const i0 = Math.round(t * SR), n = Math.round(0.05 * SR);
  for (let k = 0; k < n; k++) {
    const tau = k / SR;
    drums.add(i0 + k, Math.sin(2 * Math.PI * 2100 * tau) * Math.exp(-tau / 0.012) * 0.3 * vel, -0.3);
  }
}

/** Plucked saw through a closing low-pass: bass (low) and arp (high). */
function pluck(bus: Bus, t: number, midi: number, dur: number, amp: number, o: { cut: number; env: number; dec: number; pan?: number; sub?: number }) {
  const i0 = Math.round(t * SR), n = Math.round((dur + 0.08) * SR), f = mtof(midi), dt = f / SR;
  let ph = rnd(), l1 = 0, l2 = 0;
  for (let k = 0; k < n; k++) {
    const tau = k / SR;
    ph += dt; if (ph >= 1) ph -= 1;
    let v = 2 * ph - 1 - blep(ph, dt);
    if (o.sub) v += o.sub * Math.sin(2 * Math.PI * ph);
    const cut = Math.min(0.95, (o.cut + o.env * Math.exp(-tau / o.dec)) / SR * 2 * Math.PI);
    l1 += cut * (v - l1); l2 += cut * (l1 - l2);
    const gate = tau < dur ? 1 : Math.max(0, 1 - (tau - dur) / 0.08);
    const a = Math.min(1, tau / 0.004) * gate * amp;
    bus.add(i0 + k, l2 * a, o.pan ?? 0);
  }
}

function ping(t: number, midi: number, amp: number, pan = 0) {
  const i0 = Math.round(t * SR), n = Math.round(1.2 * SR), f = mtof(midi);
  for (let k = 0; k < n; k++) {
    const tau = k / SR;
    const v = Math.sin(2 * Math.PI * f * tau) * 0.8 + Math.sin(2 * Math.PI * f * 2.01 * tau) * 0.2 * Math.exp(-tau / 0.08);
    lead.add(i0 + k, v * amp * Math.exp(-tau / 0.35) * Math.min(1, tau / 0.002), pan);
  }
}

function impact(t: number, amp = 1) {
  const i0 = Math.round(t * SR), n = Math.round(1.6 * SR);
  let ph = 0, lp = 0;
  for (let k = 0; k < n; k++) {
    const tau = k / SR;
    ph += (2 * Math.PI * (38 + 50 * Math.exp(-tau / 0.06))) / SR;
    lp += 0.08 * (noise() - lp);
    const v = Math.sin(ph) * Math.exp(-tau / 0.5) * 0.9 + lp * Math.exp(-tau / 0.35) * 1.6;
    fx.add(i0 + k, Math.tanh(v * 1.3) * 0.7 * amp, (k % 2 ? 0.2 : -0.2) * Math.min(1, tau * 4));
  }
}

function riser(t0: number, t1: number, amp = 1) {
  const i0 = Math.round(t0 * SR), n = Math.round((t1 - t0) * SR);
  let prev = 0, lp = 0;
  for (let k = 0; k < n; k++) {
    const x = k / n;
    const w = noise();
    const hp = w - prev; prev = w;
    lp += (0.02 + 0.5 * x * x) * (hp - lp);
    fx.add(i0 + k, lp * x * x * 0.35 * amp, Math.sin(x * 20) * 0.4);
  }
}

// ---------------------------------------------------------------- the song
// Every take starts its own bar 0 (and its own chord cycle): the grid serves the cut, not the other way round.
const beatTimes: number[] = [], downbeats: number[] = [];
TAKES.forEach((_, ti) => {
  const { start, end } = take(ti), bars = Math.ceil((end - start) / BAR);
  for (let bar = 0; bar < bars; bar++) {
    for (let i = 0; i < 16; i++) {
      const t = start + bar * BAR + i * S16;
      if (t >= end) break;
      if (i % 4 === 0) beatTimes.push(t);
      if (i === 0) downbeats.push(t);
      if (has(ti, t, 'kick') && (i === 0 || i === 10 || (i === 7 && bar % 2 === 1))) kick(t, i === 0 ? 1 : 0.8);
      if (has(ti, t, 'snare') && i === 8) snare(t);
      if (has(ti, t, 'snare') && i === 15 && bar % 4 === 3) snare(t, 0.35);
      const h16 = has(ti, t, 'hat16');
      if (h16 || (has(ti, t, 'hat8') && i % 2 === 0)) hat(t, i % 4 === 2 ? 1 : i % 2 === 0 ? 0.6 : 0.35, h16 && i === 14);
      if (has(ti, t, 'tick')) tickClick(t, i % 4 === 0 ? 1 : 0.45);
      if (has(ti, t, 'tick') && i === 0) { kick(t, 0.4); ping(t, 81, 0.12, 0.6); } // heartbeat + sonar: one poll per bar
      // bass: driving eighths on the root, an octave jump on the off-beat of beat 4
      if (has(ti, t, 'bass') && i % 2 === 0) {
        const c = chordAt(bar), oct = i === 14 ? 12 : 0, quiet = has(ti, t, 'tick');
        pluck(bass, t, c.root + 12 + oct, S16 * 1.7, quiet ? 0.18 : 0.32, { cut: 180, env: quiet ? 400 : 1400, dec: 0.07, sub: 0.6 });
      }
      // arp: chord tones in sixteenths, two octaves up, alternating sides
      if (has(ti, t, 'arp')) {
        const c = chordAt(bar), seq = [0, 2, 1, 3, 2, 0, 3, 1];
        const m = c.notes[seq[i % 8]!]! + 12 + (i >= 12 ? 12 : 0);
        pluck(lead, t, m, S16 * 0.9, 0.07, { cut: 900, env: 4200, dec: 0.05, pan: i % 2 ? 0.55 : -0.55 });
      }
    }
  }
});

// pad: detuned saws per two-bar chord region of each take, slow attack, low-passed
TAKES.forEach((tk, ti) => {
  const { start, end } = take(ti), dark = tk.id === 'toma-04' || tk.id === 'toma-02';
  for (let bar = 0; start + bar * BAR < end; bar += 2) {
    const c = chordAt(bar), t0 = start + bar * BAR, len = Math.min(2 * BAR, end - t0);
    const i0 = Math.round(t0 * SR), n = Math.round(len * SR);
    for (const m of c.notes) {
      for (const det of [-0.08, 0, 0.07]) {
        const f = mtof(m + det), dt = f / SR, pan = det * 8;
        let ph = rnd(), l1 = 0, l2 = 0;
        const cut = (dark ? 700 : 1500) / SR * 2 * Math.PI;
        for (let k = 0; k < n; k++) {
          ph += dt; if (ph >= 1) ph -= 1;
          const v = 2 * ph - 1 - blep(ph, dt);
          l1 += cut * (v - l1); l2 += cut * (l1 - l2);
          const tau = k / SR, env = Math.min(1, tau / 0.25) * Math.min(1, (len - tau) / 0.12);
          pad.add(i0 + k, l2 * env * 0.03, pan);
        }
      }
    }
  }
});

// story events
const chordAtT = (t: number) => chordAt(Math.floor((t - take(TAKES.findLastIndex((_, i) => take(i).start <= t)).start) / BAR));
for (const t of hits()) impact(t, t === 0 ? 1.1 : 0.85);
for (const t of ticks()) ping(t, chordAtT(t).notes[3]! + 24, 0.13, (Math.round(t * 7) % 2) * 2 - 1);
for (const t of [take(1).start, take(2).start, take(4).start, C.awake, C.ff]) riser(Math.max(0, t - BAR), t, t === C.awake ? 1.3 : 1);

// a low fifth under the breakdown, for tension
{
  const i0 = Math.round(take(3).start * SR), n = Math.round((C.awake - take(3).start) * SR);
  for (let k = 0; k < n; k++) {
    const tau = k / SR, env = Math.min(1, tau / 1.5) * Math.min(1, (n / SR - tau) / 0.3);
    bass.add(i0 + k, (Math.sin(2 * Math.PI * mtof(26) * tau) * 0.5 + Math.sin(2 * Math.PI * mtof(33) * tau) * 0.25) * env * 0.22);
  }
}

// ---------------------------------------------------------------- mix
// side-chain: pad and bass duck under every kick (the pump)
const duck = new Float32Array(N).fill(1);
for (const [t] of kicks) {
  const i0 = Math.round(t * SR), n = Math.round(0.3 * SR);
  for (let k = 0; k < n && i0 + k < N; k++) duck[i0 + k] = Math.min(duck[i0 + k]!, 1 - 0.65 * Math.exp(-k / SR / 0.09));
}
// dotted-eighth delay on the lead bus
const D = Math.round(BEAT * 0.75 * SR);
for (let i = D; i < N; i++) { lead.L[i]! += lead.R[i - D]! * 0.32; lead.R[i]! += lead.L[i - D]! * 0.32; }

const L = new Float32Array(N), R = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const t = i / SR, fadeOut = Math.min(1, (DURATION - t) / 1.2);
  const l = drums.L[i]! + (bass.L[i]! + pad.L[i]!) * duck[i]! + lead.L[i]! + fx.L[i]!;
  const r = drums.R[i]! + (bass.R[i]! + pad.R[i]!) * duck[i]! + lead.R[i]! + fx.R[i]!;
  L[i] = Math.tanh(l * 1.1) * fadeOut;
  R[i] = Math.tanh(r * 1.1) * fadeOut;
}
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]!), Math.abs(R[i]!));
for (let i = 0; i < N; i++) { L[i]! *= 0.89 / peak; R[i]! *= 0.89 / peak; }

// the voice, centred, each take at its start; the beat sits low under it and ducks further while it speaks
const voice = new Float32Array(N);
voices.forEach((v, i) => { if (v) voice.set(v.subarray(0, N - Math.round(take(i).start * SR)), Math.round(take(i).start * SR)); });
const hasVoice = voices.some(Boolean);
if (hasVoice) {
  let vp = 0;
  for (let i = 0; i < N; i++) vp = Math.max(vp, Math.abs(voice[i]!));
  let env = 0;
  for (let i = 0; i < N; i++) {
    const x = Math.abs(voice[i]! / vp);
    env += (x > env ? 0.01 : 0.00004) * (x - env); // fast attack, ~0.5 s release
    const m = 0.4 * (1 - 0.55 * Math.min(1, env * 4)), v = (voice[i]! / vp) * 0.85;
    L[i] = L[i]! * m + v;
    R[i] = R[i]! * m + v;
  }
}
let p2 = 0;
for (let i = 0; i < N; i++) p2 = Math.max(p2, Math.abs(L[i]!), Math.abs(R[i]!));
const g = Math.min(1, 0.95 / p2);

// ---------------------------------------------------------------- write
const wav = Buffer.alloc(44 + N * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + N * 4, 4); wav.write('WAVE', 8);
wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  wav.writeInt16LE(Math.round(L[i]! * g * 32767), 44 + i * 4);
  wav.writeInt16LE(Math.round(R[i]! * g * 32767), 46 + i * 4);
}
const outDir = path.join(ROOT, 'out', VIDEO);
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, 'soundtrack.wav'), wav);

// loudness envelope at 100 fps (0..1), for the plates
const FPS = 100, rms: number[] = [];
for (let f = 0; f < DURATION * FPS; f++) {
  let s = 0;
  const a = Math.round((f / FPS) * SR), b = Math.min(N, a + SR / FPS);
  for (let i = a; i < b; i++) s += (L[i]! * g) ** 2 + (R[i]! * g) ** 2;
  rms.push(Math.sqrt(s / (2 * (b - a))));
}
const rmax = Math.max(...rms);
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const audio = {
  duration: DURATION, bpm: BPM, fps: FPS,
  beats: beatTimes.map(r3),
  downbeats: downbeats.map(r3),
  // the takes: timeline.ts cuts on these, so the edit follows the recorded voice
  sections: TAKES.map((t, i) => ({ name: t.id, start: r3(take(i).start), end: r3(take(i).end), voice: !!voices[i] })),
  features: { rms: rms.map((x) => r3(x / rmax)) },
  onsets: { kick: kicks.map(([t, v]) => [r3(t), v]), snare: snares.map(([t, v]) => [r3(t), v]), hat: hats.map(([t, v]) => [r3(t), r3(v)]) },
};
writeFileSync(path.join(import.meta.dir, '../data/audio.json'), JSON.stringify(audio));
const takes = TAKES.map((t, i) => `${t.id} ${take(i).dur.toFixed(2)}s${voices[i] ? '' : ' (sin voz: estimada)'}`).join(', ');
console.log(`soundtrack: ${path.relative(ROOT, path.join(outDir, 'soundtrack.wav'))} (${DURATION.toFixed(2)}s, ${BPM} BPM${hasVoice ? ', con voz' : ', solo beat'}). ${takes}`);
