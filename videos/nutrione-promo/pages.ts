// Shared app pages (drawn in app px) used by more than one plate.
import { C, FONT, card, rr, text } from './brand';
import { icon } from './icons';
import { button, badge, avatar, pop, rise, scaled, pageHeader } from './ui';
import { ease, prog, lerp } from '@engine/util';

/** A dashboard-style card that pops in at t. */
export function pcard(c: CanvasRenderingContext2D, lt: number, t: number, x: number, y: number, w: number, h: number, fn: () => void) {
  const s = pop(lt, t, 0.34);
  if (s <= 0) return;
  scaled(c, x + w / 2, y + h / 2, 0.9 + 0.1 * s, rise(lt, t, 0.2), () => { card(c, x, y, w, h, { r: 12, lift: 0, border: C.line }); fn(); });
}
export const label = (c: CanvasRenderingContext2D, s: string, x: number, y: number) => text(c, s, x, y, FONT.sans(12, 600), C.logo, 'left', 1.2);

export function fichaPage(c: CanvasRenderingContext2D, u: number, planCard?: () => void) {
  pageHeader(c, 77);
  icon(c, 'arrow-left', 282, 29, 18, C.ink, 2);
  text(c, 'Ficha del Paciente', 320, 45, FONT.sans(18, 600), C.ink);
  button(c, 1258, 20, 36, 'Nuevo Paciente', { icon: 'plus' });
  pcard(c, u, 0.0, 272, 109, 1136, 114, () => {
    avatar(c, 329, 166, 32, 'RS');
    text(c, 'Roberto Sosa', 377, 164, FONT.sans(24, 700), C.ink);
    badge(c, 538, 144, 'Activo', 'success');
    text(c, 'Hombre | 28 años | 5678901 | roberto.sosa@email.com | +595 984 345678', 377, 190, FONT.sans(14, 400), C.muted);
    button(c, 1091, 135, 34, 'Nuevo Turno', { variant: 'outline', icon: 'calendar' });
    button(c, 1234, 135, 34, 'Editar Paciente', { variant: 'outline', icon: 'pen' });
  });
  pcard(c, u, 0.25, 272, 243, 560, 106, () => {
    label(c, 'OBJETIVO', 293, 278);
    text(c, 'Descender 15 kg. Antecedente de ansiedad alimentaria.', 293, 305, FONT.sans(14, 400), C.ink);
  });
  pcard(c, u, 0.5, 849, 243, 559, 106, () => {
    label(c, 'OBSERVACIONES', 869, 278);
    text(c, 'Requiere acompañamiento mas frecuente. Historial de dietas', 869, 305, FONT.sans(14, 400), C.ink);
    text(c, 'restrictivas previas.', 869, 326, FONT.sans(14, 400), C.ink);
  });
  pcard(c, u, 0.75, 272, 370, 558, 226, () => {
    text(c, 'Historial de Consultas', 293, 408, FONT.sans(16, 600), C.ink);
    text(c, 'Ver todo', 809, 408, FONT.sans(14, 500), C.logo, 'right');
    c.fillStyle = '#EEF4F9'; c.fillRect(293, 430, 516, 40);
    [['Fecha', 301], ['Hora', 464], ['Estado', 525]].forEach(([l, x]) => text(c, l as string, x as number, 455, FONT.sans(14, 500), C.slate700));
    [['15 de octubre de 2026', '08:00'], ['29 de octubre de 2026', '10:00']].forEach(([d, h], i) => {
      const ry = 470 + i * 49, a = rise(u, 1.0 + i * 0.12, 0.3);
      c.save(); c.globalAlpha = a;
      c.fillStyle = C.line; c.fillRect(293, ry, 516, 1);
      text(c, d!, 301, ry + 30, FONT.sans(14, 400), C.ink); text(c, h!, 464, ry + 30, FONT.sans(14, 400), C.muted);
      badge(c, 525, ry + 14, 'Programado', 'info');
      button(c, 643, ry + 7, 36, 'Realizar consulta', { variant: 'outline' });
      c.restore();
    });
  });
  pcard(c, u, 1.0, 850, 370, 558, 216, () => {
    text(c, 'Seguimiento', 871, 408, FONT.sans(16, 600), C.ink);
    text(c, 'Ver historial completo', 1387, 408, FONT.sans(14, 500), C.logo, 'right');
    const kg = lerp(91, 88, ease.outCubic(prog(u, 1.1, 1.8)));
    text(c, `${kg.toFixed(kg > 88.04 ? 1 : 0).replace('.', ',')} kg`, 871, 452, FONT.sans(20, 600), C.ink);
    text(c, '5 DE OCTUBRE DE 2026', 871, 472, FONT.sans(11, 500), C.muted, 'left', 0.8);
    [['89,5 kg', '21 DE SEPTIEMBRE DE 2026'], ['91 kg', '7 DE SEPTIEMBRE DE 2026']].forEach(([k, d], i) => {
      const ry = 486 + i * 48, a = rise(u, 1.3 + i * 0.12, 0.3);
      c.save(); c.globalAlpha = a; c.fillStyle = C.line; c.fillRect(871, ry, 516, 1);
      text(c, k!, 871, ry + 26, FONT.sans(15, 600), C.ink); text(c, d!, 871, ry + 42, FONT.sans(11, 500), C.muted, 'left', 0.8); c.restore();
    });
  });
  pcard(c, u, 1.5, 850, 606, 558, PLAN_H, () => {
    if (planCard) { planCard(); return; }
    emptyPlan(c);
  });
}


export const PLAN_H = 172;
/** Width of an app button (same metrics as ui.button). */
export function buttonW(c: CanvasRenderingContext2D, label: string, size = 14, hasIcon = false) {
  c.font = FONT.sans(size, 500);
  return Math.ceil(c.measureText(label).width) + 32 + (hasIcon ? size + 8 : 0);
}
export const ASSIGN_BTN = { x: 1129, y: 753 }; // centre of "Asignar Plan" in the empty plan card
function emptyPlan(c: CanvasRenderingContext2D) {
  c.beginPath(); c.arc(1129, 650, 21, 0, 6.2832); c.fillStyle = '#EEF4F9'; c.fill(); icon(c, 'file-text', 1118, 639, 22, C.muted, 1.8);
  text(c, 'Sin plan asignado', 1129, 703, FONT.sans(15, 600), C.ink, 'center');
  text(c, 'Asigna un plan nutricional a este paciente', 1129, 723, FONT.sans(13, 400), C.muted, 'center');
  const w = buttonW(c, 'Asignar Plan', 13, true);
  button(c, ASSIGN_BTN.x - w / 2, 737, 32, 'Asignar Plan', { variant: 'outline', icon: 'plus', size: 13 });
}

/** The "Plan Diabetico BIG" assigned card content (plan-section.tsx). `dl` = download state: 0 idle, 0..1 progress, 2 done. */
export function assignedPlan(c: CanvasRenderingContext2D, dl: number) {
  rr(c, 870, 626, 36, 36, 6); c.fillStyle = 'rgba(45,139,87,0.10)'; c.fill();
  icon(c, 'file-text', 879, 635, 18, C.logo, 1.8);
  text(c, 'Plan Diabetico BIG', 918, 642, FONT.sans(14, 500), C.ink);
  text(c, 'Asignado hace menos de un minuto', 918, 661, FONT.sans(12, 400), C.muted);
  rr(c, 918, 673, 48, 20, 6); c.fillStyle = C.soft; c.fill();
  text(c, 'Activo', 942, 687, FONT.sans(12, 500), C.ink, 'center');
  const ics: ['eye' | 'download' | 'plus' | 'archive', number][] = [['eye', 1260], ['download', 1292], ['plus', 1324], ['archive', 1356]];
  ics.forEach(([n, x]) => {
    if (n === 'download' && dl > 0 && dl < 2) return;
    icon(c, n, x + 8, 634, 16, n === 'download' && dl === 2 ? C.logo : C.ink, 1.8);
  });
  if (dl > 0 && dl < 2) {
    icon(c, 'loader', 1238, 633, 14, C.muted, 2);
    text(c, `Generando ${Math.round(dl * 100)}%`, 1258, 645, FONT.sans(12, 400), C.muted);
    rr(c, 1238, 656, 144, 4, 2); c.fillStyle = C.line; c.fill();
    rr(c, 1238, 656, 144 * dl, 4, 2); c.fillStyle = C.logo; c.fill();
  }
}
