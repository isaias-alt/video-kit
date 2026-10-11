#!/usr/bin/env node
// video-kit CLI. Everything goes through here so VIDEO / size / ffmpeg are always set the same way.
//   npm run vk -- list
//   npm run vk -- new <name> [--duration 30]
//   npm run vk -- dev <video> [--vertical]
//   npm run vk -- stills <video> --t 1,2.5 [--vertical] [--only id1,id2]
//   npm run vk -- render <video> [--vertical] [--samples 4] [--scale 2]
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const [cmd, name, ...rest] = process.argv.slice(2);
const vertical = rest.includes('--vertical');
const args = rest.filter((a) => a !== '--vertical');
const die = (m) => { console.error(m); process.exit(1); };
const videos = () => readdirSync(path.join(root, 'videos'), { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('_')).map((d) => d.name);

if (!cmd || cmd === 'help') die(readFileSync(import.meta.filename, 'utf8').split('\n').slice(1, 8).join('\n'));
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

if (cmd === 'dev') run('vite', ['--port', vertical ? '5174' : '5173']);
if (cmd === 'render') { mkdirSync(path.join(root, 'out', name), { recursive: true }); run('bun', ['scripts/render.ts', 'video', '--out', `out/${name}/${name}${suffix}.mp4`, ...args]); }
if (cmd === 'stills') run('bun', ['scripts/render.ts', 'stills', '--out', `out/${name}/wip${suffix}`, ...args]);
die(`unknown command "${cmd}"`);
