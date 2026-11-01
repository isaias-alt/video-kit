// 48-55.5 s. Ship: the tribunal (lint, tests, adversarial review by a fresh session) before a real PR.
import { section } from '../stage';

export default section({
  id: 'ship',
  pattern: 'maker-checker',
  captions: [
    { at: 32, head: '¿Querés un PR real?', code: 'vx ship <tarea>' },
    { at: 34, head: 'Lint, tests y una *revisión adversarial*.', sub: 'la hace una sesión nueva, sin el contexto del autor' },
    { at: 36, head: 'Si todo pasa, *abre el PR*.' },
  ],
});
