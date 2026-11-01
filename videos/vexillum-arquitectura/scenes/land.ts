// 39-48 s. Land: a mission is done when it has a commit; vx land fast-forwards, after the human says yes.
import { section } from '../stage';

export default section({
  id: 'land',
  pattern: 'gate de aprobación humana',
  captions: [
    { at: 26, head: 'Una mission está lista cuando hay un *commit* en su rama.' },
    { at: 28, head: 'Por defecto, el commander te pide *aprobación*.' },
    { at: 30, head: 'vx land: *solo fast-forward*.', sub: 'si la rama divergió o el checkout está sucio, se niega. Nunca fuerza.' },
  ],
});
