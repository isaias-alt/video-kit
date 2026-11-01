#!/usr/bin/env node
// video-kit CLI. Everything goes through here so VIDEO / size / ffmpeg are always set the same way.
//   npm run vk -- list
//   npm run vk -- new <name> [--duration 30]
//   npm run vk -- dev <video> [--vertical]
//   npm run vk -- stills <video> --t 1,2.5 [--vertical] [--only id1,id2]
//   npm run vk -- render <video> [--vertical] [--samples 4] [--scale 2]
//   npm run vk -- verify <video> [--vertical]   (full decode + pix_fmt/profile + brightness check of the rendered MP4)
//   npm run vk -- audio <video>      (videos with audio/beat.ts: regenerate the soundtrack and data/audio.json)
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { reportVerify } from './verify-mp4.mjs';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const [cmd, name, ...rest] = process.argv.slice(2);
const vertical = rest.includes('--vertical');
const args = rest.filter((a) => a !== '--vertical');
const die = (m) => { console.error(m); process.exit(1); };
const videos = () => readdirSync(path.join(root, 'videos'), { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('_')).map((d) => d.name);

if (!cmd || cmd === 'help') {
  const lines = readFileSync(import.meta.filename, 'utf8').split('\n').slice(1);
  die(lines.slice(0, lines.findIndex((l) => !l.startsWith('//'))).join('\n'));
}
if (cmd === 'list') { console.log(videos().join('\n')); process.exit(0); }

if (cmd === 'new') {
  if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) die('usage: vk new <kebab-case-name> [--duration 30]');
  const dest = path.join(root, 'videos', name);
  if (existsSync(dest)) die(`videos/${name} already exists`);
  cpSync(path.join(root, 'videos/_template'), dest, { recursive: true });
  const di = args.indexOf('--duration'), dur = di >= 0 ? Number(args[di + 1]) : 30;
  const f = path.join(dest, 'data/audio.json');
  const a = JSON.parse(readFileSync(f, 'utf8'));
  Object.assign(a, { duration: dur, beats: Array.from({ length: dur * 2 }, (_, i) => i * 0.5), downbeats: Array.from({ length: Math.ceil(dur / 2) }, (_, i) => i * 2), sections: [{ name: 'all', start: 0, end: dur }] });
  writeFileSync(f, JSON.stringify(a));
  console.log(`created videos/${name} (${dur}s). Edit brand.ts, scenes/, timeline.ts; the template plate is scenes/hello.ts`);
  process.exit(0);
}

if (!name || !existsSync(path.join(root, 'videos', name))) die(`unknown video "${name ?? ''}". Available: ${videos().join(', ') || '(none)'}`);
const size = vertical ? { VIDEO_W: '1080', VIDEO_H: '1920' } : { VIDEO_W: '1920', VIDEO_H: '1080' };
const bin = path.join(root, 'node_modules/.bin');
const env = {
  ...process.env, ...size, VITE_VIDEO_W: size.VIDEO_W, VITE_VIDEO_H: size.VIDEO_H, VIDEO: name,
  FFMPEG: require('ffmpeg-static'), PATH: `${bin}${path.delimiter}${process.env.PATH}`,
};
const suffix = vertical ? '-vertical' : '';
const run = (c, a) => { const r = spawnSync(c, a, { cwd: root, env, stdio: 'inherit' }); process.exit(r.status ?? 1); };

// Optional soundtrack: a video that has audio/beat.ts generates out/<video>/soundtrack.wav and its data/audio.json
// (takes, beat grid, onsets) from code; render then muxes it into the MP4. See docs/audio.md.
const beatScript = path.join(root, 'videos', name, 'audio/beat.ts');
const wav = path.join(root, 'out', name, 'soundtrack.wav');
const step = (c, a) => { const r = spawnSync(c, a, { cwd: root, env, stdio: 'inherit' }); if (r.status !== 0) process.exit(r.status ?? 1); };
const audio = () => step('bun', [beatScript]);

if (cmd === 'audio') { if (!existsSync(beatScript)) die(`videos/${name} has no audio/beat.ts`); audio(); process.exit(0); }
if (cmd === 'dev') run('vite', ['--port', vertical ? '5174' : '5173']);
if (cmd === 'verify') {
  const files = [`${name}${suffix}.mp4`, `${name}${suffix}.video.mp4`].map((f) => path.join(root, 'out', name, f)).filter(existsSync);
  if (!files.length) die(`no rendered MP4 for ${name}${suffix} in out/${name}`);
  process.exit(files.map((f) => reportVerify(env.FFMPEG, f, { size: [+size.VIDEO_W, +size.VIDEO_H], audio: !f.endsWith('.video.mp4') && existsSync(beatScript) })).every(Boolean) ? 0 : 1);
}
if (cmd === 'render') {
  mkdirSync(path.join(root, 'out', name), { recursive: true });
  // one render per video at a time: two ffmpegs writing the same MP4 (or the soundtrack being regenerated under a
  // muxing one) leave a file with two moov boxes and garbage after the mdat. See docs/mp4-corrupto.md.
  const lock = path.join(root, 'out', name, '.render.lock');
  if (existsSync(lock)) {
    const pid = Number(readFileSync(lock, 'utf8'));
    let alive = false;
    try { process.kill(pid, 0); alive = true; } catch (e) { alive = e.code === 'EPERM'; }
    if (alive) die(`another render of ${name} is running (pid ${pid}, ${path.relative(root, lock)}). Wait for it to finish.`);
  }
  writeFileSync(lock, String(process.pid));
  process.on('exit', () => rmSync(lock, { force: true }));
  const out = `out/${name}/${name}${suffix}.mp4`;
  if (!existsSync(beatScript)) run('bun', ['scripts/render.ts', 'video', '--out', out, ...args]);
  audio();
  const silent = `out/${name}/${name}${suffix}.video.mp4`;
  step('bun', ['scripts/render.ts', 'video', '--out', silent, ...args]);
  // the picture is copied as is; the soundtrack is cut to the rendered range, normalised to -14 LUFS (social) and AAC-encoded
  const fi = args.indexOf('--from'), from = fi >= 0 ? args[fi + 1] : '0';
  const partial = `out/${name}/${name}${suffix}.partial-${process.pid}.mp4`;
  process.on('exit', () => rmSync(path.join(root, partial), { force: true }));
  step(env.FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', silent, '-ss', from, '-i', wav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', '-f', 'mp4', partial]);
  if (!reportVerify(env.FFMPEG, path.join(root, partial), { size: [+size.VIDEO_W, +size.VIDEO_H], audio: true })) die(`the muxed MP4 failed verification, not publishing ${out}`);
  renameSync(path.join(root, partial), path.join(root, out));
  console.log(`wrote ${out} (picture + soundtrack)`);
  process.exit(0);
}
if (cmd === 'stills') run('bun', ['scripts/render.ts', 'stills', '--out', `out/${name}/wip${suffix}`, ...args]);
die(`unknown command "${cmd}"`);
