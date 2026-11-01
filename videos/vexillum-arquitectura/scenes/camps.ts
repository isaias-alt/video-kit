// 16.5-27 s. Camps: one git worktree and branch per soldier, a real harness session in a herdr pane.
import { section } from '../stage';

export default section({
  id: 'camps',
  pattern: 'aislamiento por worktree',
  captions: [
    { at: 11, head: 'Cada soldier trabaja en su *camp*.', sub: 'un git worktree con rama propia y una sesión real en un pane de herdr' },
    { at: 13.25, head: 'Ramas separadas: nadie *pisa* el trabajo de otro.' },
    { at: 16, head: 'Ojo: un camp *no es un sandbox*.', sub: 'aísla dónde caen los commits, no lo que el proceso puede leer' },
  ],
});
