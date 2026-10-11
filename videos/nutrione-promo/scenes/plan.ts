// 28-32 s. Planes: the template grid ("Armá una vez, usá siempre."), then on the patient's file: Asignar Plan ->
// pick a template -> Personalizar y asignar -> Asignar Plan -> the plan card -> Exportar PDF -> toast. Real flow of the app.
import type { Frame } from '@engine/scene';
import { Plate } from '../plate';
import { SLOW } from '../frame';
import { WIN, W, H, portrait, HEAD } from '../frame';
import { C, FONT, TONES, card, rr, text } from '../brand';
import { icon } from '../icons';
import {
  AW, sidebar, pageHeader, button, cursor, clickRing, path, hero, eyebrow, slideUp, pop, rise, inWindow, track, scaled, wipe,
  type Rect,
} from '../ui';
import { fichaPage, assignedPlan, buttonW, ASSIGN_BTN } from '../pages';
import { ease, prog, lerp } from '@engine/util';

const SWITCH = 1.0; // grid -> patient file, under the green wipe
const T_OPEN = 1.5, T_PICK = 1.85, T_STEP2 = 2.1, T_ASSIGN = 2.55, T_DL = 3.0, T_TOAST = 3.4;
const DLG = { x: 336, y: 40, w: 768, h: 720 };

const PLANS = [
  { name: 'Plan Diabetico BIG', cat: 'Control glucemico', desc: ['Plan bajo en carbohidratos simples y azucares,', 'disenado para control glucemico.'], tags: ['1700 kcal', 'diabetico', 'bajo glucemico'] },
  { name: 'Plan Masa Muscular 2400 kcal', cat: 'Ganancia muscular', desc: ['Plan balanceado para aumento de masa muscular', 'con distribucion proteica optimizada.'], tags: ['2400 kcal', 'proteico', 'normocalorico'] },
  { name: 'Plan Hipocalorico 1500 kcal', cat: 'Descenso de peso', desc: ['Plan estructurado para descenso gradual de peso,', 'bajo en grasas saturadas y alto en fibra.'], tags: ['1500 kcal', 'hipocalorico', 'fibra'] },
];

function bowl(c: CanvasRenderingContext2D, x: number, y: number, col: string) {
  c.save(); c.strokeStyle = col; c.lineWidth = 1.6; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x + 7, y); c.arc(x, y, 7, 0, Math.PI); c.stroke();
  c.beginPath(); c.arc(x - 2.5, y - 4, 3, Math.PI * 0.9, Math.PI * 2.1); c.stroke();
  c.beginPath(); c.arc(x + 3, y - 3.5, 2.4, Math.PI, Math.PI * 2.2); c.stroke();
  c.restore();
}

function plansPage(c: CanvasRenderingContext2D, lt: number) {
  pageHeader(c, 77);
  text(c, 'Planes Nutricionales', 272, 46, FONT.sans(20, 700), C.ink);
  button(c, 1263, 20, 36, 'Nueva plantilla', { icon: 'plus' });
  const fld = (x: number, label: string, w: number, v: string, ph: string, ic = false, chev = false) => {
    text(c, label, x, 117, FONT.sans(14, 500), C.ink);
    rr(c, x, 130, w, 36, 6); c.fillStyle = C.white; c.fill(); c.lineWidth = 1; c.strokeStyle = C.line; c.stroke();
    let tx = x + 12; if (ic) { icon(c, 'search', x + 12, 140, 16, C.muted, 1.8); tx += 25; }
    text(c, v || ph, tx, 153, FONT.sans(14, v ? 500 : 400), v ? C.ink : C.muted);
    if (chev) icon(c, 'chevron-down', x + w - 26, 140, 16, C.ink, 1.8);
  };
  fld(264, 'Buscar plantillas', 320, '', 'Nombre o etiquetas...', true);
  fld(596, 'Categoría', 90, 'Todas', '', false, true);
  PLANS.forEach((p, i) => {
    const x = 264 + i * 389.5, y = 190, w = 373, h = 210, t = i * 0.25;
    const s = pop(lt, t, 0.36);
    if (s <= 0) return;
    scaled(c, x + w / 2, y + h / 2, 0.88 + 0.12 * s, rise(lt, t, 0.2), () => {
      card(c, x, y, w, h, { r: 12, lift: 0, border: C.line });
      c.save(); rr(c, x, y, w, h, 12); c.clip(); c.fillStyle = '#EEF3F8'; c.fillRect(x, y, w, 60); c.restore();
      rr(c, x + 17, y + 15, 32, 32, 8); c.fillStyle = C.white; c.fill(); bowl(c, x + 33, y + 33, C.slate700);
      c.font = FONT.sans(12, 600); const cw = c.measureText(p.cat).width + 22;
      rr(c, x + w - 16 - cw, y + 19, cw, 24, 12); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill(); c.strokeStyle = C.line; c.lineWidth = 1; c.stroke();
      text(c, p.cat, x + w - 16 - cw / 2, y + 36, FONT.sans(12, 600), C.slate700, 'center', 0.4);
      text(c, p.name, x + 17, y + 89, FONT.sans(16, 600), C.ink);
      text(c, p.desc[0]!, x + 17, y + 115, FONT.sans(14, 400), C.muted); text(c, p.desc[1]!, x + 17, y + 135, FONT.sans(14, 400), C.muted);
      let tx = x + 17;
      p.tags.forEach((tg) => {
        c.font = FONT.sans(12, 500); const tw = c.measureText(tg).width + 20;
        rr(c, tx, y + 162, tw, 24, 12); c.strokeStyle = C.line; c.lineWidth = 1; c.stroke(); text(c, tg, tx + tw / 2, y + 178, FONT.sans(12, 500), C.ink, 'center');
        tx += tw + 7;
      });
      icon(c, 'trash', x + w - 68, y + 166, 16, C.ink, 1.8); icon(c, 'eye', x + w - 32, y + 166, 16, C.ink, 1.8);
    });
  });
  const s4 = pop(lt, 0.75, 0.36);
  if (s4 > 0) scaled(c, 450, 526, 0.9 + 0.1 * s4, rise(lt, 0.75, 0.2), () => {
    rr(c, 264, 417, 373, 218, 12); c.fillStyle = C.white; c.fill(); c.setLineDash([6, 5]); c.lineWidth = 1.5; c.strokeStyle = '#CBD5E1'; c.stroke(); c.setLineDash([]);
    c.beginPath(); c.arc(450, 487, 19, 0, 6.2832); c.fillStyle = '#EEF3F8'; c.fill(); icon(c, 'plus', 440, 477, 20, C.slate700, 2);
    text(c, 'Crear nueva plantilla', 450, 531, FONT.sans(16, 500), C.slate700, 'center');
    text(c, 'Empieza desde cero y diseña un nuevo', 450, 555, FONT.sans(14, 400), C.muted, 'center');
    text(c, 'esquema nutricional.', 450, 575, FONT.sans(14, 400), C.muted, 'center');
  });
}

function checkCircle(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string) {
  c.save(); c.strokeStyle = col; c.lineWidth = 1.8; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.stroke();
  c.beginPath(); c.moveTo(cx - r * 0.4, cy); c.lineTo(cx - r * 0.1, cy + r * 0.32); c.lineTo(cx + r * 0.42, cy - r * 0.3); c.stroke(); c.restore();
}
function fieldBox(c: CanvasRenderingContext2D, x: number, y: number, w: number, label: string, value: string, chev = false) {
  text(c, label, x, y, FONT.sans(14, 500), C.ink);
  rr(c, x, y + 8, w, 36, 6); c.fillStyle = C.white; c.fill(); c.lineWidth = 1; c.strokeStyle = C.line; c.stroke();
  text(c, value, x + 12, y + 31, FONT.sans(14, 400), C.ink);
  if (chev) icon(c, 'chevron-down', x + w - 28, y + 18, 16, C.muted, 1.8);
}

function assignDialog(c: CanvasRenderingContext2D, lt: number, press: number) {
  const d = DLG, a = prog(lt, T_OPEN, T_OPEN + 0.2, ease.outCubic), out = prog(lt, T_ASSIGN + 0.08, T_ASSIGN + 0.26, ease.inCubic);
  if (a <= 0 || out >= 1) return;
  c.save(); c.globalAlpha = 0.42 * a * (1 - out); c.fillStyle = '#000'; c.fillRect(-2000, -2000, 6000, 6000); c.restore();
  const step2 = lt >= T_STEP2, picked = lt >= T_PICK;
  scaled(c, d.x + d.w / 2, d.y + d.h / 2, lerp(0.94, 1, ease.outBack(prog(lt, T_OPEN, T_OPEN + 0.3))) * (1 - 0.04 * out), a * (1 - out), () => {
    card(c, d.x, d.y, d.w, d.h, { r: 12, lift: 1.4, border: C.white });
    text(c, 'Asignar Plan', d.x + 25, d.y + 44, FONT.sans(18, 600), C.ink);
    text(c, 'Asigna un plan nutricional desde una plantilla existente o crea uno personalizado.', d.x + 25, d.y + 70, FONT.sans(14, 400), C.muted);
    icon(c, 'x', d.x + d.w - 40, d.y + 18, 16, C.muted, 1.8);
    // tabs
    rr(c, d.x + 25, d.y + 96, 718, 36, 8); c.fillStyle = C.soft; c.fill();
    rr(c, d.x + 28, d.y + 99, 353, 30, 6); c.fillStyle = C.white; c.fill(); c.strokeStyle = C.line; c.lineWidth = 1; c.stroke();
    text(c, 'Desde plantilla', d.x + 204, d.y + 119, FONT.sans(14, 500), C.ink, 'center');
    text(c, 'Plan personalizado', d.x + 564, d.y + 119, FONT.sans(14, 500), C.muted, 'center');
    const cy = d.y + 156;
    if (!step2) {
      rr(c, d.x + 25, cy, 718, 36, 6); c.fillStyle = C.white; c.fill(); c.strokeStyle = C.line; c.stroke();
      icon(c, 'search', d.x + 37, cy + 10, 16, C.muted, 1.8); text(c, 'Buscar plantilla...', d.x + 62, cy + 23, FONT.sans(14, 400), C.muted);
      const ly = cy + 52, lh = 380;
      rr(c, d.x + 25, ly, 718, lh, 6); c.strokeStyle = C.line; c.stroke();
      c.save(); rr(c, d.x + 25, ly, 718, lh, 6); c.clip();
      PLANS.forEach((p, i) => {
        const iy = ly + i * 62, sel = picked && i === 0;
        if (sel) { c.fillStyle = 'rgba(45,139,87,0.10)'; c.fillRect(d.x + 25, iy, 718, 62); }
        if (i > 0) { c.fillStyle = C.line; c.fillRect(d.x + 25, iy, 718, 1); }
        text(c, p.name, d.x + 41, iy + 27, FONT.sans(14, 500), C.ink);
        text(c, p.desc[0]! + ' ' + p.desc[1]!, d.x + 41, iy + 46, FONT.sans(12, 400), C.muted);
        if (sel) checkCircle(c, d.x + 725, iy + 31, 8, C.logo);
      });
      c.restore();
    } else {
      icon(c, 'chevron-left', d.x + 33, cy + 6, 18, C.ink, 2); text(c, 'Plan Diabetico BIG', d.x + 64, cy + 20, FONT.sans(14, 500), C.ink);
      const by = cy + 44;
      rr(c, d.x + 25, by, 718, 228, 12); c.fillStyle = 'rgba(241,245,249,0.6)'; c.fill(); c.strokeStyle = C.line; c.stroke();
      fieldBox(c, d.x + 41, by + 28, 686, 'Nombre del plan', 'Plan Diabetico BIG');
      fieldBox(c, d.x + 41, by + 102, 335, 'Categoría', 'Control glucemico', true);
      fieldBox(c, d.x + 392, by + 102, 335, 'Calorías diarias', '1700');
      fieldBox(c, d.x + 41, by + 176 - 4, 686, 'Etiquetas', 'diabetico, bajo glucemico, sin azucar');
      text(c, 'Horario semanal', d.x + 25, by + 268, FONT.sans(14, 600), C.ink);
      rr(c, d.x + 25, by + 282, 520, 34, 8); c.fillStyle = C.soft; c.fill();
      ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].forEach((dn, i) => {
        const xs = [33, 95, 163, 250, 322, 394, 468][i]!;
        if (i === 0) { rr(c, d.x + xs - 6, by + 285, 58, 28, 6); c.fillStyle = C.white; c.fill(); c.strokeStyle = C.line; c.stroke(); }
        text(c, dn, d.x + xs + 23 + (i === 2 ? 14 : i === 3 ? 4 : 0), by + 304, FONT.sans(13, 500), i === 0 ? C.ink : C.muted, 'center');
      });
    }
    // footer buttons (two equal halves)
    const fy = d.y + 660;
    const half = 355;
    rr(c, d.x + 25, fy, half, 36, 6); c.fillStyle = C.white; c.fill(); c.strokeStyle = C.line; c.lineWidth = 1; c.stroke();
    text(c, 'Cancelar', d.x + 25 + half / 2, fy + 23, FONT.sans(14, 500), C.ink, 'center');
    c.save(); c.translate(d.x + 33 + half + half / 2, fy + 18); c.scale(1 - 0.03 * press, 1 - 0.03 * press);
    rr(c, -half / 2, -18, half, 36, 6); c.globalAlpha = picked ? 1 : 0.5; c.fillStyle = C.logo; c.fill();
    text(c, step2 ? 'Asignar Plan' : 'Personalizar y asignar', 0, 5, FONT.sans(14, 500), C.white, 'center');
    c.restore();
  });
}

function toast(c: CanvasRenderingContext2D, lt: number) {
  const a = prog(lt, T_TOAST, T_TOAST + 0.3, ease.outBack);
  if (a <= 0) return;
  const w = 380, h = 56, x = 1000, y = 720 + (1 - a) * 30;
  c.save(); c.globalAlpha = Math.min(1, a * 1.5);
  card(c, x, y, w, h, { r: 8, lift: 0.9, border: C.line });
  checkCircle(c, x + 28, y + h / 2, 9, C.logo);
  text(c, 'PDF descargado. Este link es de un solo uso.', x + 50, y + h / 2 + 5, FONT.sans(13, 500), C.ink);
  c.restore();
}

export default class Plan extends Plate {
  draw(c: CanvasRenderingContext2D, f: Frame) {
    const lt = f.lt / SLOW, win = WIN, isGrid = lt < SWITCH;
    const OV: Rect = [0, 0, AW, 782], CARD: Rect = [790, 560, 640, 240], DL: Rect = [336, 40, 768, 720];
    const L: [number, Rect][] = [[0, OV], [0.85, OV], [1.0, CARD], [T_OPEN + 0.1, CARD], [T_OPEN + 0.5, DL], [T_ASSIGN + 0.1, DL], [T_ASSIGN + 0.45, CARD]];
    const PC: Rect = [830, 600, 600, 200], PD: Rect = [330, 60, 780, 700];
    const P: [number, Rect][] = [[0, [250, 70, 740, 740]], [0.85, [250, 70, 740, 740]], [1.0, PC], [T_OPEN + 0.1, PC], [T_OPEN + 0.5, PD], [T_ASSIGN + 0.1, PD], [T_ASSIGN + 0.45, PC]];
    const cam = track(win, lt, portrait ? P : L);

    const btn = { x: ASSIGN_BTN.x, y: ASSIGN_BTN.y }, dlIcon = { x: 1308, y: 642 };
    const cur = path(lt, [
      [0.95, 1100, 520], [T_OPEN - 0.05, btn.x, btn.y], [T_PICK - 0.2, btn.x - 20, btn.y - 100], [T_PICK, 660, 319], [T_STEP2 - 0.1, 902, 758], [T_STEP2 + 0.2, 902, 756], [T_ASSIGN - 0.05, 902, 758], [T_ASSIGN + 0.4, 1150, 700], [T_DL - 0.02, dlIcon.x, dlIcon.y],
    ]);
    const click = (t: number) => prog(lt, t, t + 0.06) * (1 - prog(lt, t + 0.06, t + 0.16));
    const pAny = Math.max(click(T_OPEN - 0.05), click(T_PICK), click(T_STEP2 - 0.05), click(T_ASSIGN - 0.02), click(T_DL));
    const assigned = lt >= T_ASSIGN + 0.15;
    const dl = lt < T_DL + 0.05 ? 0 : lt < T_TOAST ? prog(lt, T_DL + 0.05, T_TOAST) : 2;

    inWindow(c, win, cam, () => {
      if (isGrid) { plansPage(c, lt); sidebar(c, 'planes'); }
      else {
        const planFn = assigned ? () => {
          const k = pop(lt, T_ASSIGN + 0.15, 0.35);
          c.save(); c.globalAlpha = Math.min(1, k * 1.4); assignedPlan(c, dl); c.restore();
        } : undefined;
        fichaPage(c, 99, planFn);
        sidebar(c, 'pacientes');
        assignDialog(c, lt, click(T_STEP2 - 0.05) > 0 || click(T_ASSIGN - 0.02) > 0 ? 1 : 0);
        toast(c, lt);
      }
      if (!isGrid && lt > 0.95) {
        [T_OPEN - 0.05, T_PICK, T_STEP2 - 0.05, T_ASSIGN - 0.02, T_DL].forEach((t, i) => {
          const pos = [btn, { x: 660, y: 319 }, { x: 902, y: 758 }, { x: 902, y: 758 }, dlIcon][i]!;
          clickRing(c, pos.x, pos.y, lt, t, 24);
        });
        cursor(c, cur.x, cur.y, pAny, 1.1);
      }
    });

    // ---- captions
    const phaseA = lt < SWITCH + 0.0, late = lt >= T_TOAST;
    if (portrait) {
      const [e, l1, l2, tone] = phaseA ? ['Planes', 'Armá una vez,', 'usá siempre.', TONES.yellow.text] : late ? ['Planes', 'PDF listo para', 'el paciente.', TONES.red.text] : ['Planes', 'Asigna planes', 'nutricionales.', TONES.yellow.text];
      eyebrow(c, e as string, HEAD.x + 4, HEAD.y - 96, C.logo, 20);
      slideUp(c, HEAD.x, HEAD.y, W, 100, ease.outExpo(prog(lt, 0.1, 0.6)) * (late ? ease.outExpo(prog(lt, T_TOAST, T_TOAST + 0.35)) : 1), (y) => hero(c, l1 as string, HEAD.x, y, 96, C.ink));
      slideUp(c, HEAD.x, HEAD.y + 100, W, 100, ease.outExpo(prog(lt, 0.2, 0.7)) * (late ? ease.outExpo(prog(lt, T_TOAST + 0.05, T_TOAST + 0.4)) : 1), (y) => hero(c, l2 as string, HEAD.x, y, 96, tone as string));
    } else if (phaseA) {
      const out = prog(lt, 0.75, 0.95, ease.inCubic);
      c.save(); c.globalAlpha = 1 - out; c.translate(0, out * 40);
      eyebrow(c, 'Planes', 392, 910, TONES.yellow.text, 20);
      slideUp(c, 388, 990, W - 388, 90, ease.outExpo(prog(lt, 0.15, 0.65)), (y) => hero(c, 'Armá una vez, usá siempre.', 388, y, 76, C.ink));
      c.restore();
    } else {
      // pill card over the zoomed UI
      const txt = late ? 'PDF listo para el paciente.' : 'Asigna planes nutricionales.', k0 = late ? T_TOAST : SWITCH + 0.15;
      // hidden while the dialog is open (it would cover the dialog title)
      const hide = prog(lt, T_OPEN + 0.05, T_OPEN + 0.2) * (1 - prog(lt, T_ASSIGN + 0.3, T_ASSIGN + 0.45));
      const a = ease.outExpo(prog(lt, k0, k0 + 0.4)) * (1 - hide);
      if (a > 0) {
        c.save(); c.globalAlpha = Math.min(1, a * 1.5); c.translate(0, (1 - a) * 30);
        c.font = FONT.sans(56, 800); c.letterSpacing = `${-0.04 * 56}px`; const tw = c.measureText(txt).width; c.letterSpacing = '0px';
        const px = 80, py = 80, pw = tw + 64, ph = 128;
        card(c, px, py, pw, ph, { r: 24, lift: 1.1, border: C.line });
        eyebrow(c, 'Planes', px + 32, py + 40, late ? TONES.red.text : TONES.yellow.text, 15);
        hero(c, txt, px + 32, py + 100, 56, C.ink);
        c.restore();
      }
    }

    wipe(c, W, H, lt, 0.84, 0.97, 1.03, 1.16);
  }
}
