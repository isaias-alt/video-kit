// 0-3 s. Hook: one agent you talk to, many that work. The world is shown already running (bar 20.5).
import { section } from '../stage';

export default section({
  id: 'hook',
  stateBar: 20.5,
  captions: [
    { at: 0, head: 'Le hablás a *un* agente.' },
    { at: 1, head: 'Trabajan *varios*, en paralelo, sin pisarse.' },
  ],
});
