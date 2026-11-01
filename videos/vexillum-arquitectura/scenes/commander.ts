// 3-9 s. The commander: the only agent the human talks to. It never does the work, it dispatches it.
import { section } from '../stage';

export default section({
  id: 'commander',
  pattern: 'supervisor / worker',
  captions: [
    { at: 2, head: 'Vexillum: hablás con *un solo agente*, el commander.' },
    { at: 4, head: 'No escribe código. *Despacha*.', code: 'vx dispatch "<tarea>"' },
  ],
});
