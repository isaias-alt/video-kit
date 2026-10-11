// Demo data for the video (fictitious times and figures). Names are the ones in the product's demo seed.
import type { ApptStatus } from './ui';

export const WEEK_DAYS = [
  { dow: 'LUN', n: 12, today: true }, { dow: 'MAR', n: 13 }, { dow: 'MIÉ', n: 14 }, { dow: 'JUE', n: 15 },
  { dow: 'VIE', n: 16 }, { dow: 'SÁB', n: 17 }, { dow: 'DOM', n: 18 },
];
export interface Ev { day: number; h0: number; name: string; st?: ApptStatus }
/** Appointments of the week of 12-18 October 2026 (day 0 = Monday). All last one hour. */
export const WEEK: Ev[] = [
  { day: 0, h0: 8, name: 'Valentina Lopez', st: 'completed' }, { day: 0, h0: 10, name: 'Jorge Villalba' },
  { day: 1, h0: 9, name: 'Ana Rodriguez' }, { day: 1, h0: 11, name: 'Martin Acosta' },
  { day: 2, h0: 10, name: 'Diego Fernandez' }, { day: 3, h0: 8, name: 'Roberto Sosa' },
  { day: 3, h0: 10, name: 'Camila Rios' }, { day: 4, h0: 9, name: 'Laura Gimenez' }, { day: 4, h0: 11, name: 'Sofia Benitez' },
];
/** Appointments that get added while the Agenda scene plays. */
export const WEEK_EXTRA: Ev[] = [
  { day: 0, h0: 12, name: 'Laura Gimenez' }, { day: 3, h0: 12, name: 'Martin Acosta' }, { day: 5, h0: 9, name: 'Sofia Benitez' },
];
/** The one created through "Nuevo Turno". */
export const NEW_APPT: Ev = { day: 2, h0: 11, name: 'Martin Acosta' };

export const UPCOMING: [string, string][] = [['08:00', 'Valentina Lopez'], ['09:00', 'Ana Rodriguez'], ['10:00', 'Jorge Villalba'], ['11:00', 'Martin Acosta']];
export const RECENT: [string, 'success' | 'warning', string][] = [
  ['Roberto Sosa', 'success', 'Activo'], ['Ana Rodriguez', 'warning', 'Pausado'], ['Jorge Villalba', 'success', 'Activo'], ['Martin Acosta', 'success', 'Activo'],
];

/** Month view (October 2026): date -> events. Week of the 12th mirrors WEEK + extras + the new one. */
export const MONTH_FIRST_DOW = 3; // 1 Oct 2026 is a Thursday (Mon = 0)
export const MONTH_DAYS = 31;
export const MONTH_EVENTS: Record<number, { t: string; name: string; st?: ApptStatus }[]> = {
  2: [{ t: '09:00', name: 'Laura Gimenez', st: 'completed' }],
  5: [{ t: '10:00', name: 'Sofia Benitez', st: 'completed' }],
  6: [{ t: '08:00', name: 'Roberto Sosa', st: 'completed' }, { t: '11:00', name: 'Ana Rodriguez', st: 'completed' }],
  8: [{ t: '09:00', name: 'Martin Acosta', st: 'completed' }],
  9: [{ t: '10:00', name: 'Camila Rios', st: 'completed' }, { t: '12:00', name: 'Diego Fernandez', st: 'completed' }],
  12: [{ t: '08:00', name: 'Valentina Lopez', st: 'completed' }, { t: '10:00', name: 'Jorge Villalba' }, { t: '12:00', name: 'Laura Gimenez' }],
  13: [{ t: '09:00', name: 'Ana Rodriguez' }, { t: '11:00', name: 'Martin Acosta' }],
  14: [{ t: '10:00', name: 'Diego Fernandez' }, { t: '11:00', name: 'Martin Acosta' }, { t: '12:00', name: 'Roberto Sosa' }],
  15: [{ t: '08:00', name: 'Roberto Sosa' }, { t: '10:00', name: 'Camila Rios' }, { t: '12:00', name: 'Martin Acosta' }],
  16: [{ t: '09:00', name: 'Laura Gimenez' }, { t: '11:00', name: 'Sofia Benitez' }],
  17: [{ t: '09:00', name: 'Sofia Benitez' }],
  20: [{ t: '09:00', name: 'Jorge Villalba' }], 22: [{ t: '10:00', name: 'Ana Rodriguez' }, { t: '11:00', name: 'Valentina Lopez' }],
  27: [{ t: '08:00', name: 'Camila Rios' }], 29: [{ t: '10:00', name: 'Roberto Sosa' }],
};
