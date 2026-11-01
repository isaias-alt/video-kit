// Toma 05: land, a human gate and fast-forward only.
import { takePlate } from '../stage';

export default takePlate({
  take: 4,
  pattern: (k) => ({ text: 'gate humano antes del merge', at: k.noForce }),
  captions: (k) => [
    { at: k.start[4], code: 'vx land <task-id>', sub: 'Por defecto = salvo yolo mode, que activa el humano.' },
    { at: k.refuses, head: 'Se niega si: checkout sucio, rama divergida o *sin commits*.', code: 'vx land <task-id>' },
  ],
});
