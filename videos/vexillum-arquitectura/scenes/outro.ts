// 55.5-60 s. Recap: the four patterns stamped on the map, then the name.
import { section } from '../stage';
import { CUE } from '../score';

export default section({
  id: 'outro',
  captions: [
    { at: 37, head: 'Cuatro patrones, *un sistema*.' },
    { at: 39, head: '*vexillum*', sub: 'vx: un orquestador de agentes de IA' },
  ],
  stamps: [
    { text: 'supervisor / worker', x: 770, y: 560, at: CUE.recap[0], rot: -0.06 },
    { text: 'worktrees', x: 300, y: 1010, at: CUE.recap[1], rot: 0.05 },
    { text: 'watcher + cola', x: 760, y: 1560, at: CUE.recap[2], rot: -0.04 },
    { text: 'gate humano', x: 300, y: 1700, at: CUE.recap[3], rot: 0.04 },
  ],
});
