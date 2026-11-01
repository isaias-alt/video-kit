// 9-16.5 s. Soldiers: mission or scout, each with a model from the profile table.
import { section } from '../stage';

export default section({
  id: 'soldiers',
  pattern: 'supervisor / worker',
  captions: [
    { at: 6, head: 'Cada tarea es un *soldier*.', sub: 'mission: cambia código y termina en un commit. scout: investiga y entrega un reporte.' },
    { at: 8.5, head: 'El modelo sale de una *tabla de perfiles*.', code: 'vx models' },
  ],
});
