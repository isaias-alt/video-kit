// 27-39 s. The sentinel: polls every pane, turns a settled soldier into a durable wake, a Stop hook delivers it.
import { section } from '../stage';

export default section({
  id: 'sentinel',
  pattern: 'watcher + cola durable',
  captions: [
    { at: 18, head: 'El commander *no se queda mirando*.' },
    { at: 20, head: 'Un *sentinel*, uno por máquina, consulta cada pane.' },
    { at: 22, head: 'Si un soldier termina o se traba, deja un *wake* en la cola.' },
    { at: 24, head: 'Un Stop hook *despierta* al commander.', code: 'vx sentinel await' },
  ],
});
