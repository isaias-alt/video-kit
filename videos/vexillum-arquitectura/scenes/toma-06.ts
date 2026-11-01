// Toma 06: the four patterns stamped on the map as they are said, then the name.
import { takePlate } from '../stage';

export default takePlate({
  take: 5,
  captions: (k) => [{ at: k.title, head: '*vexillum*', sub: 'Serie System Design' }],
  stamps: (k) => [
    { text: 'supervisor-worker', x: 770, y: 560, at: k.stamps[0], rot: -0.06 },
    { text: 'aislamiento por worktree', x: 470, y: 1010, at: k.stamps[1], rot: 0.05 },
    { text: 'watcher por eventos', x: 560, y: 1440, at: k.stamps[2], rot: -0.04 },
    { text: 'gate humano', x: 330, y: 1565, at: k.stamps[3], rot: 0.04 },
  ],
});
