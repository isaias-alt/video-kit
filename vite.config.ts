import { defineConfig, normalizePath, type Plugin } from 'vite';
import path from 'node:path';
import { existsSync } from 'node:fs';

const root = import.meta.dirname;
// VIDEO selects videos/<name>/ (timeline, scenes, data). scripts/vk.mjs always sets it.
const video = process.env.VIDEO;
if (!video || !existsSync(path.join(root, 'videos', video))) {
  throw new Error(`VIDEO=${video ?? '(unset)'}: no such folder in videos/. Use: npm run vk -- dev <video>`);
}
const videoDir = path.join(root, 'videos', video);

// The engine fetches data/audio.json and data/lyrics.json: serve them from the selected video.
function videoData(): Plugin {
  return {
    name: 'video-data',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith('/data/')) req.url = `/@fs/${encodeURI(normalizePath(videoDir))}${req.url}`;
        next();
      });
    },
  };
}

export default defineConfig({
  root,
  publicDir: 'public',
  plugins: [videoData()],
  // PDOOM_NO_HMR=1: no live reload (export renders must not reload mid-run when a file changes)
  server: { port: 5173, strictPort: false, hmr: process.env.PDOOM_NO_HMR ? false : undefined, fs: { allow: [root] } },
  resolve: { alias: { '@engine': path.join(root, 'src/engine'), '@kit': path.join(root, 'src/kit'), '@video': videoDir } },
  build: { target: 'esnext', assetsInlineLimit: 0 },
});
