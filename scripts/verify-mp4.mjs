// Verification of a rendered MP4: it must decode end to end without a single error line and look like a video.
// Used by scripts/render.ts (picture) and scripts/vk.mjs (picture + soundtrack), also from the CLI:
//   npm run vk -- verify <video> [--vertical]      or      node scripts/verify-mp4.mjs <file.mp4> [--audio]
// See docs/mp4-corrupto.md for why this exists.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const PROFILES = ['Baseline', 'Constrained Baseline', 'Main', 'Extended', 'High', 'High 10', 'High 4:2:2', 'High 4:4:4 Predictive'];
const SAMPLES = 8;

const ff = (bin, args) => spawnSync(bin, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const lines = (s) => s.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);

/**
 * @param {string} bin ffmpeg binary
 * @param {string} file
 * @param {{ frames?: number, size?: [number, number], audio?: boolean }} [expect]
 * @returns {{ ok: boolean, problems: string[], info: string }}
 */
export function verifyMp4(bin, file, expect = {}) {
  const problems = [];
  const info = [];

  // 1. stream layout: a known H.264 profile and yuv420p (a missing avcC shows up as profile/pix_fmt "unknown")
  const probe = ff(bin, ['-hide_banner', '-i', file]).stderr;
  const v = /Stream #\S+: Video: h264 \(([^)]+)\)[^,]*, ([a-z0-9]+)[^\n]*?, (\d+)x(\d+)/.exec(probe);
  if (!v) problems.push('no H.264 video stream with a readable profile / pix_fmt (ffmpeg -i says: ' + (lines(probe).find((l) => l.includes('Video:')) ?? lines(probe).slice(-1)[0] ?? 'nothing') + ')');
  else {
    const [, profile, pix, w, h] = v;
    info.push(`${profile} ${pix} ${w}x${h}`);
    if (!PROFILES.includes(profile)) problems.push(`unknown H.264 profile "${profile}"`);
    if (pix.trim() !== 'yuv420p') problems.push(`pix_fmt is ${pix.trim()}, expected yuv420p`);
    if (expect.size && (+w !== expect.size[0] || +h !== expect.size[1])) problems.push(`size is ${w}x${h}, expected ${expect.size[0]}x${expect.size[1]}`);
  }
  const hasAudio = /Stream #\S+: Audio: aac/.test(probe);
  if (expect.audio && !hasAudio) problems.push('no AAC audio stream');
  const dur = /Duration: (\d+):(\d+):([\d.]+)/.exec(probe);
  const seconds = dur ? +dur[1] * 3600 + +dur[2] * 60 + +dur[3] : 0;
  if (!seconds) problems.push('no duration');

  // 2. full decode of every stream: not one line on stderr
  const dec = ff(bin, ['-v', 'error', '-stats', '-i', file, '-f', 'null', '-']);
  const decLines = lines(dec.stderr);
  const errors = decLines.filter((l) => !l.startsWith('frame=') && !/^size=|^video:|^\[out#/.test(l));
  if (dec.status !== 0) problems.push(`full decode exited with code ${dec.status}`);
  if (errors.length) problems.push(`full decode printed ${errors.length} error lines, first: ${errors[0]}`);
  const counted = decLines.filter((l) => l.startsWith('frame=')).pop();
  const frames = counted ? +/frame=\s*(\d+)/.exec(counted)[1] : 0;
  info.push(`${frames} frames`);
  if (!frames) problems.push('decoded 0 frames');
  if (expect.frames !== undefined && frames !== expect.frames) problems.push(`decoded ${frames} frames, expected ${expect.frames}`);

  // 3. mean luma of frames sampled at the middle of 8 equal slices: not black, not blank, not one constant value
  if (seconds && !errors.length) {
    const sig = ff(bin, ['-v', 'error', '-i', file, '-map', '0:v', '-vf',
      `fps=${SAMPLES}/${seconds}:start_time=${seconds / (2 * SAMPLES)},signalstats,metadata=mode=print:key=lavfi.signalstats.YAVG:file=-`, '-f', 'null', '-']);
    const yavg = [...sig.stdout.matchAll(/YAVG=([\d.]+)/g)].map((m) => +m[1]);
    if (yavg.length < SAMPLES / 2) problems.push(`only ${yavg.length} sample frames could be measured`);
    else {
      const mean = yavg.reduce((a, b) => a + b, 0) / yavg.length;
      const spread = Math.max(...yavg) - Math.min(...yavg);
      info.push(`YAVG ${yavg.map((y) => y.toFixed(0)).join(' ')}`);
      if (mean < 5) problems.push(`sampled frames are black (mean luma ${mean.toFixed(1)})`);
      if (mean > 250) problems.push(`sampled frames are blank white (mean luma ${mean.toFixed(1)})`);
      if (spread < 0.5) problems.push(`mean luma is constant across ${yavg.length} sampled frames (spread ${spread.toFixed(2)})`);
    }
  }
  return { ok: problems.length === 0, problems, info: info.join(', ') };
}

/** Verify and print; returns whether it passed. */
export function reportVerify(bin, file, expect) {
  const r = verifyMp4(bin, file, expect);
  if (r.ok) console.log(`verified ${file}: ${r.info}`);
  else console.error(`INVALID ${file}${r.info ? ` (${r.info})` : ''}:\n  - ${r.problems.join('\n  - ')}`);
  return r.ok;
}

if (import.meta.filename === process.argv[1]) {
  const file = process.argv[2];
  if (!file) { console.error('usage: node scripts/verify-mp4.mjs <file.mp4> [--audio]'); process.exit(2); }
  const bin = process.env.FFMPEG ?? createRequire(import.meta.url)('ffmpeg-static');
  process.exit(reportVerify(bin, file, { audio: process.argv.includes('--audio') }) ? 0 : 1);
}
