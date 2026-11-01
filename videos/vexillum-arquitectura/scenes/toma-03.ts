// Toma 03: camps, isolation by worktree (and what it does not isolate).
import { takePlate } from '../stage';

export default takePlate({
  take: 2,
  captions: (k) => [
    { at: k.ojo, head: 'Sin container ni sandbox: el soldier tiene *acceso al host* con el usuario del sistema.', sub: 'La seguridad real está en el land.' },
  ],
});
