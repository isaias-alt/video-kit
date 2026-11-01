// Toma 02: commander and soldiers, supervisor-worker.
import { takePlate } from '../stage';

const DISPATCH = 'vx dispatch "<prompt>" --kind mission|scout';

export default takePlate({
  take: 1,
  pattern: (k) => ({ text: 'supervisor-worker', at: k.supervisor }),
  captions: (k) => [
    { at: k.start[1], code: DISPATCH },
    { at: k.soldier, head: '*mission* = cambia código / *scout* = solo investiga', code: DISPATCH },
  ],
});
