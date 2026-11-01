// Toma 04: the sentinel, an event-driven watcher. On-screen text corrected after checking vx (see README):
// a wake is consumed once delivered, but the sentinel also drops wakes that are no longer news.
import { takePlate } from '../stage';

export default takePlate({
  take: 3,
  pattern: (k) => ({ text: 'watcher event-driven', at: k.evento }),
  captions: (k) => [
    { at: k.sondea, head: 'Un *sentinel por máquina*.', sub: 'El aviso se borra al entregarse, o si ya no es noticia.' },
  ],
});
