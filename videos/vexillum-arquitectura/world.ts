// The diagram, drawn as a pure function of time: painted sprites revealed on their cues, plus the live parts
// (thinking orbs, the sentinel's polls, the wake, the fast-forward) in Canvas2D. World units; the caller has
// already applied the camera.
import type { Frame } from '@engine/scene';
import { clamp, ease, lerp, pointAtLength, polylineLengths, prog, type V2 } from '@engine/util';
import { drawOrb, type OrbState } from '@kit/orb';
import { rr } from '@kit/draw';
import { C, FONT, alpha } from './brand';
import {
  CAMPS, CAMP_W, CAMP_Y, COMMANDER, CUE, GATE, GENERAL, LEFT_BRANCH, LEFT_COMMITS, LEFT_LEN, MAIN_COMMITS, MAIN_X, MAIN_Y,
  SENTINEL, STATIONS, STATION_W, WAKE_PATH, campBottom, campTop,
} from './layout';
import type { Sprite, WorldSprites } from './paint';
import { barOf } from './score';

export interface WorldOpts {
  /** Show the world as it is at this bar (the hook previews the finished system). Default: now. */
  stateBar?: number;
}

type Ctx = CanvasRenderingContext2D;
type Dir = 'down' | 'up' | 'right' | 'left' | 'radial';

/** Reveal 0..1 of something that starts at bar `a` and takes `len` bars. */
const rv = (sb: number, a: number, len = 0.5, fn = ease.outCubic) => prog(sb, a, a + len, fn);

/** A sprite, multiplied onto the paper, wiped in by p (0..1). */
function put(c: Ctx, s: Sprite, p = 1, dir: Dir = 'radial', alpha = 1) {
  if (p <= 0 || alpha <= 0) return;
  c.save();
  if (p < 1) {
    c.beginPath();
    if (dir === 'radial') c.arc(s.x + s.w / 2, s.y + s.h / 2, p * Math.hypot(s.w, s.h) / 2, 0, Math.PI * 2);
    else if (dir === 'down') c.rect(s.x, s.y, s.w, s.h * p);
    else if (dir === 'up') c.rect(s.x, s.y + s.h * (1 - p), s.w, s.h * p);
    else if (dir === 'right') c.rect(s.x, s.y, s.w * p, s.h);
    else c.rect(s.x + s.w * (1 - p), s.y, s.w * p, s.h);
    c.clip();
  }
  c.globalCompositeOperation = 'multiply';
  c.globalAlpha = alpha;
  c.drawImage(s.img, s.x, s.y, s.w, s.h);
  c.restore();
}

function label(c: Ctx, s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'center', alpha = 1) {
  if (alpha <= 0) return;
  c.save();
  c.globalAlpha = alpha;
  c.font = font;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.fillText(s, x, y);
  c.restore();
}

function dot(c: Ctx, x: number, y: number, r: number, fill: string, ring = C.paper, alpha = 1) {
  c.save();
  c.globalAlpha = alpha;
  c.beginPath(); c.arc(x, y, r + 3, 0, Math.PI * 2); c.fillStyle = ring; c.fill();
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
  c.restore();
}

function chip(c: Ctx, s: string, x: number, y: number, o: { font: string; color: string; fill?: string; border?: string; align?: 'left' | 'center' | 'right'; alpha?: number; pad?: number }) {
  const a = o.alpha ?? 1;
  if (a <= 0) return;
  c.save();
  c.globalAlpha = a;
  c.font = o.font;
  const w = c.measureText(s).width, pad = o.pad ?? 12, h = parseFloat(o.font.split(' ')[1]!) * 1.55;
  const x0 = o.align === 'right' ? x - w - 2 * pad : o.align === 'left' ? x : x - w / 2 - pad;
  rr(c, x0, y - h / 2, w + 2 * pad, h, h / 2);
  c.fillStyle = o.fill ?? C.card;
  c.fill();
  if (o.border !== 'none') { c.lineWidth = 2; c.strokeStyle = o.border ?? o.color; c.stroke(); }
  c.fillStyle = o.color;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(s, x0 + pad, y + 1);
  c.restore();
}

/** Two orb states cross-faded around bar `at`. */
function orbSwap(c: Ctx, sb: number, at: number, from: OrbState, to: OrbState, x: number, y: number, t: number, o: Parameters<typeof drawOrb>[5]) {
  const k = prog(sb, at - 0.12, at + 0.12);
  if (k < 1) drawOrb(c, from, x, y, t, { ...o, alpha: (o.alpha ?? 1) * (1 - k) });
  if (k > 0) drawOrb(c, to, x, y, t, { ...o, alpha: (o.alpha ?? 1) * k });
}

function check(c: Ctx, x: number, y: number, r: number, color: string, p: number) {
  if (p <= 0) return;
  c.save();
  c.translate(x, y);
  c.scale(ease.outBack(p), ease.outBack(p));
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fillStyle = color; c.fill();
  c.strokeStyle = C.card; c.lineWidth = r * 0.24; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-r * 0.45, 0); c.lineTo(-r * 0.1, r * 0.35); c.lineTo(r * 0.48, -r * 0.35); c.stroke();
  c.restore();
}

const pts = (a: [number, number][]) => a.map(([x, y]) => ({ x, y }));
const WAKE = pts(WAKE_PATH);
const WAKE_L = polylineLengths(WAKE);

/** Thick ink along a polyline from length s0 to s1 (the fast-forward rewriting a branch into main). */
function inkAlong(c: Ctx, path: V2[], L: Float32Array, s0: number, s1: number, w: number, color: string) {
  if (s1 <= s0) return;
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.strokeStyle = color; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  const a = pointAtLength(path, L, s0);
  c.moveTo(a.x, a.y);
  for (let i = 0; i < path.length; i++) if (L[i]! > s0 && L[i]! < s1) c.lineTo(path[i]!.x, path[i]!.y);
  const b = pointAtLength(path, L, s1);
  c.lineTo(b.x, b.y);
  c.stroke();
  c.restore();
}

/** Arc length along the left branch at height y (its upper part is vertical). */
function leftLenAtY(y: number) {
  for (let i = 1; i < LEFT_BRANCH.length; i++) if (LEFT_BRANCH[i]!.y <= y) {
    const a = LEFT_BRANCH[i - 1]!, b = LEFT_BRANCH[i]!;
    return LEFT_LEN[i - 1]! + (LEFT_LEN[i]! - LEFT_LEN[i - 1]!) * clamp((a.y - y) / (a.y - b.y || 1));
  }
  return LEFT_LEN[LEFT_LEN.length - 1]!;
}

export function drawWorld(c: Ctx, S: WorldSprites, f: Frame, o: WorldOpts = {}) {
  const t = f.t, bar = barOf(t), sb = o.stateBar ?? bar;
  const kick = f.a.kick, preview = o.stateBar !== undefined;

  // ---- the general and the commander
  const pg = rv(sb, CUE.general);
  put(c, S.general, pg);
  label(c, 'vos', GENERAL.x + 62, GENERAL.y - 30, FONT.mono(24, 700), C.ink, 'left', pg);
  label(c, 'el general', GENERAL.x + 62, GENERAL.y - 2, FONT.mono(20), C.muted, 'left', pg);
  put(c, S.talk, rv(sb, CUE.talk, 0.5), 'down');
  // a prompt travelling down to the commander on every bar of the commander beat
  if (!preview && bar >= CUE.talk + 0.5 && bar < 6) {
    const k = ease.inOutQuad(((bar - CUE.talk - 0.5) % 1));
    dot(c, GENERAL.x, lerp(GENERAL.y + 66, COMMANDER.y - COMMANDER.r - 18, k), 7, C.ochre, C.paper, Math.sin(k * Math.PI));
  }
  const ph = rv(sb, CUE.commander);
  put(c, S.halo, ph);
  const asleep = !preview && sb >= CUE.sentinel && sb < CUE.awake;
  if (ph > 0) {
    const d = 178 * ease.outBack(ph) * (1 + 0.05 * kick);
    const busy: OrbState = 'connecting';
    if (sb < CUE.sentinel || preview) orbSwap(c, sb, CUE.typing, 'breathing', busy, COMMANDER.x, COMMANDER.y - 6, t, { d, color: C.lapis });
    else orbSwap(c, sb, CUE.awake, 'breathing', busy, COMMANDER.x, COMMANDER.y - 6, t, { d, color: C.lapis, alpha: asleep ? 0.5 : 1, speed: asleep ? 0.5 : 1 });
    label(c, 'commander', COMMANDER.x, COMMANDER.y + 114, FONT.mono(28, 700), C.ink, 'center', ph);
    if (asleep) label(c, 'en espera', COMMANDER.x, COMMANDER.y + 140, FONT.mono(18), C.muted, 'center', rv(sb, CUE.sentinel + 0.5));
  }
  // woken: a ring bursts out of the commander
  const wk = !preview ? prog(bar, CUE.awake, CUE.awake + 0.6) : 0;
  if (wk > 0 && wk < 1) {
    c.save();
    c.globalAlpha = 1 - wk;
    c.strokeStyle = C.vermilion; c.lineWidth = 6 * (1 - wk) + 1;
    c.beginPath(); c.arc(COMMANDER.x, COMMANDER.y, COMMANDER.r + 10 + ease.outCubic(wk) * 140, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  // ---- dispatch and the soldiers
  S.dispatch.forEach((s, i) => put(c, s, rv(sb, CUE.dispatch + i * 0.15, 0.6), 'down'));
  const struck = rv(sb, CUE.strike, 0.5, ease.inOutQuad);
  CAMPS.forEach((cp, i) => {
    const x = cp.x - CAMP_W / 2;
    const fade = i === 0 ? 1 - struck : 1;
    put(c, S.camps[i]!, rv(sb, CUE.camps[i]!, 0.5), 'down', fade);
    const ph = rv(sb, CUE.camps[i]! + 0.25, 0.4);
    label(c, `camp ${i + 1}`, x + 16, campTop + 29, FONT.mono(21, 700), C.ink, 'left', ph * fade);
    label(c, 'herdr', x + CAMP_W - 16, campTop + 29, FONT.mono(21), C.muted, 'right', rv(sb, CUE.panes + i * 0.15, 0.4) * fade);

    // the soldier travels from the commander down its dispatch stroke, then works in its camp
    const land = CUE.soldiers[i]!, ox = cp.x, oy = CAMP_Y - 22;
    const tr = prog(sb, land - 0.5, land, ease.inQuad);
    if (tr <= 0) return;
    const sx = lerp(COMMANDER.x, ox, tr), sy = lerp(COMMANDER.y + 30, oy, tr) - Math.sin(tr * Math.PI) * 60;
    const done = (i === 0 && sb >= CUE.done) || (i === 1 && sb >= CUE.report) || (i === 2 && sb >= CUE.pr);
    const d = 128 * lerp(0.35, 1, tr) * (1 + 0.04 * kick);
    const alpha = (done ? 0.5 : 1) * fade;
    if (done) orbSwap(c, sb, i === 0 ? CUE.done : i === 1 ? CUE.report : CUE.pr, cp.orb, 'breathing', sx, sy, t, { d, color: cp.color, alpha: fade });
    else drawOrb(c, cp.orb, sx, sy, t + i * 3.1, { d, color: cp.color, alpha });
    const rip = prog(sb, land, land + 0.4);
    if (rip > 0 && rip < 1 && !preview) {
      c.save(); c.globalAlpha = (1 - rip) * 0.8; c.strokeStyle = cp.color; c.lineWidth = 3;
      c.beginPath(); c.arc(ox, oy, 60 + rip * 70, 0, Math.PI * 2); c.stroke(); c.restore();
    }
    const pk = rv(sb, CUE.kinds + i * 0.12, 0.4);
    label(c, cp.kind.toUpperCase(), ox, CAMP_Y + 76, FONT.mono(28, 700), cp.color, 'center', pk * fade);
    label(c, cp.model, ox, CAMP_Y + 104, FONT.mono(22), C.muted, 'center', rv(sb, CUE.models[i]!, 0.4) * fade);
    label(c, cp.branch, ox, CAMP_Y + 129, FONT.mono(21, 700), cp.kind === 'scout' ? C.muted : C.ink, 'center', rv(sb, CUE.branches + 0.3 * i, 0.5) * fade);
    // status badge (top-right corner): running, then done
    const pb = rv(sb, Math.max(land, CUE.camps[i]! + 0.4), 0.3) * fade;
    if (pb > 0) {
      const bx = x + CAMP_W - 2, by = campTop + 2;
      if (!done) dot(c, bx, by, 9 + 3 * Math.sin(t * 6 + i), cp.color, C.paper, pb);
      else check(c, bx, by, 17, C.moss, rv(sb, i === 0 ? CUE.done : i === 1 ? CUE.report : CUE.pr, 0.35, ease.linear) * fade);
    }
  });
  if (struck > 0) label(c, 'strike: el camp vuelve al pool', CAMPS[0]!.x + 10, CAMP_Y, FONT.mono(19, 700), C.muted, 'center', struck);

  // ---- caution: a camp is not a sandbox
  const pc = !preview ? rv(sb, CUE.caution, 0.5) * (1 - rv(sb, 18, 0.4)) : 0;
  if (pc > 0) {
    put(c, S.host, pc);
    label(c, '~/.ssh', S.host.x + S.host.w / 2 + 2, S.host.y + S.host.h + 18, FONT.mono(20, 700), C.vermilion, 'center', pc);
    c.save();
    c.globalAlpha = pc;
    c.setLineDash([10, 9]); c.lineDashOffset = -t * 40;
    c.strokeStyle = C.vermilion; c.lineWidth = 3;
    c.beginPath(); c.moveTo(CAMPS[0]!.x - 70, campTop + 6); c.quadraticCurveTo(CAMPS[0]!.x - 80, campTop - 50, S.host.x + S.host.w / 2 + 30, S.host.y + S.host.h - 16); c.stroke();
    c.restore();
    label(c, 'puede leer', CAMPS[0]!.x + 6, campTop - 60, FONT.mono(19, 700), C.vermilion, 'left', pc);
  }

  // ---- git: main and the mission branches
  const pm = rv(sb, CUE.main, 0.75);
  put(c, S.main, pm, 'right');
  const pbr = rv(sb, CUE.branches, 1, ease.inOutQuad);
  put(c, S.branchL, pbr, 'up');
  put(c, S.branchR, pbr, 'up');
  for (const x of MAIN_COMMITS) if (pm > (x - 70) / 480) dot(c, x, MAIN_Y, 9, C.ink);
  // the left mission's commits, then main fast-forwarding through them
  const ff = !preview ? prog(sb, CUE.ff[0], CUE.ff[1], ease.inOutCubic) : 0;
  const tipLen = leftLenAtY(LEFT_COMMITS[1]!);
  if (ff > 0) inkAlong(c, LEFT_BRANCH, LEFT_LEN, 0, tipLen * ff, 9, C.ink);
  LEFT_COMMITS.forEach((y, k) => { const p = rv(sb, CUE.done + k * 0.25, 0.3, ease.outBack); if (p > 0) dot(c, CAMPS[0]!.x, y, 9 * p, ff * tipLen >= leftLenAtY(y) ? C.ink : C.lapis); });
  if (pm > 0.9) {
    const at = pointAtLength(LEFT_BRANCH, LEFT_LEN, tipLen * ff);
    const onMain = ff <= 0;
    chip(c, 'main', onMain ? MAIN_X[1] : at.x - 22, onMain ? MAIN_Y + 46 : at.y, { font: FONT.mono(20, 700), color: C.card, fill: C.ink, border: 'none', align: onMain ? 'center' : 'right', alpha: rv(sb, CUE.main + 0.5, 0.3) });
  }

  // ---- the sentinel
  const ps = rv(sb, CUE.sentinel);
  put(c, S.sentinel, ps);
  put(c, S.wake, rv(sb, CUE.wakePath, 0.75, ease.inOutQuad), 'up', 0.55);
  if (ps > 0) {
    drawOrb(c, 'listening', SENTINEL.x, SENTINEL.y - 12, t, { d: 140 * ease.outBack(ps) * (1 + 0.05 * f.a.snare), color: C.vermilion });
    label(c, 'sentinel', SENTINEL.x, SENTINEL.y + 84, FONT.mono(27, 700), C.vermilion, 'center', ps);
  }
  // polling: one radar sweep per bar, and a probe running to every pane and back
  if (sb >= CUE.scanFrom && (sb < CUE.awake || preview) && ps > 0) {
    const ph = bar % 1;
    c.save();
    c.globalAlpha = 0.45 * (1 - ph);
    c.strokeStyle = C.vermilion; c.lineWidth = 3;
    c.beginPath(); c.arc(SENTINEL.x, SENTINEL.y, SENTINEL.r + ph * 620, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    c.restore();
    CAMPS.forEach((cp, i) => {
      const k = ((bar + i * 0.22) % 1) / 0.6;
      if (k > 1) return;
      const y0 = SENTINEL.y - SENTINEL.r, y1 = campBottom + 8, x0 = SENTINEL.x + (cp.x - SENTINEL.x) * 0.3;
      const u = k < 0.5 ? k * 2 : 2 - k * 2;
      c.save();
      c.globalAlpha = 0.5;
      c.setLineDash([3, 9]); c.strokeStyle = C.vermilion; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(cp.x, y1); c.stroke();
      c.restore();
      dot(c, lerp(x0, cp.x, u), lerp(y0, y1, u), 6, C.vermilion);
    });
  }
  // the wake: from the sentinel to the commander's queue
  const wp = !preview ? prog(bar, CUE.wake[0], CUE.wake[1], ease.inOutCubic) : 0;
  if (wp > 0 && wp < 1) {
    for (let k = 6; k >= 0; k--) {
      const q = pointAtLength(WAKE, WAKE_L, WAKE_L[WAKE_L.length - 1]! * Math.max(0, wp - k * 0.025));
      dot(c, q.x, q.y, 15 - k * 1.6, C.vermilion, C.paper, k === 0 ? 1 : 0.35 * (1 - k / 7));
    }
    const q = pointAtLength(WAKE, WAKE_L, WAKE_L[WAKE_L.length - 1]! * wp);
    chip(c, 'wake: camp 1 done', q.x + 26, q.y, { font: FONT.mono(19, 700), color: C.vermilion, align: 'left' });
  }
  // the states a soldier can settle in
  const pst = !preview ? rv(sb, CUE.states, 0.5) * (1 - rv(sb, 26, 0.3)) : 0;
  if (pst > 0) {
    const words = ['done', 'blocked', 'interrupted', 'unconfirmed'];
    c.font = FONT.mono(24, 700);
    const ws = words.map((w) => c.measureText(w).width + 24), gap = 12, total = ws.reduce((a, b) => a + b, 0) + gap * 3;
    let x = SENTINEL.x - total / 2;
    words.forEach((w, k) => {
      chip(c, w, x, 1398, { font: FONT.mono(24, 700), color: k === 0 ? C.moss : C.vermilion, align: 'left', alpha: rv(sb, CUE.states + k * 0.12, 0.3) * (pst > 0 ? 1 : 0) * Math.min(1, pst * 2) });
      x += ws[k]! + gap;
    });
  }

  // ---- the scout's report
  const pr = rv(sb, CUE.report);
  put(c, S.report, pr);
  label(c, 'reporte.md', S.report.x + S.report.w / 2, S.report.y + S.report.h + 14, FONT.mono(17, 700), C.ink, 'center', pr);

  // ---- land: the gate, the question, the fast-forward
  const pgt = rv(sb, CUE.gate);
  put(c, S.gatePosts, pgt);
  if (pgt > 0) {
    const open = !preview ? prog(sb, CUE.gateOpen, CUE.gateOpen + 0.3, ease.outBack) : 0;
    const top = GATE.y - GATE.h / 2;
    c.save();
    c.beginPath(); c.rect(S.gateBar.x - 200, S.gateBar.y - 200, S.gateBar.w + 400, (S.gateBar.h + 200) * pgt + 200); c.clip();
    c.translate(GATE.x, top - 8);
    c.rotate(-open * Math.PI * 0.5);
    c.translate(-GATE.x, -(top - 8));
    put(c, S.gateBar);
    c.restore();
    label(c, 'aprobación', GATE.x, top - 34, FONT.mono(19, 700), C.ochre, 'center', pgt);
  }
  if (!preview) {
    const pa = rv(sb, CUE.ask, 0.35) * (1 - rv(sb, 31.5, 0.4));
    if (pa > 0) chip(c, 'commander: ¿aterrizo camp 1?', 70, 1690, { font: FONT.mono(21, 700), color: C.lapis, align: 'left', alpha: pa, pad: 16 });
    const py = rv(sb, CUE.approve, 0.3, ease.outBack) * (1 - rv(sb, 31.5, 0.4));
    if (py > 0) chip(c, 'vos: sí', 470, 1748, { font: FONT.mono(21, 700), color: C.ochre, align: 'left', alpha: Math.min(1, py), pad: 16 });
    const pf = rv(sb, CUE.ff[0], 0.4) * (1 - rv(sb, 32, 0.3));
    if (pf > 0) {
      label(c, 'fast-forward', CAMPS[0]!.x + 22, LEFT_COMMITS[1]! - 84, FONT.mono(20, 700), C.ink, 'left', pf);
      label(c, 'sin merge commit', CAMPS[0]!.x + 22, LEFT_COMMITS[1]! - 60, FONT.mono(19), C.muted, 'left', pf);
    }
  }

  // ---- ship: the tribunal stations on the right branch
  STATIONS.forEach((s, k) => {
    const p = rv(sb, 32.1 + k * 0.15, 0.4);
    if (p <= 0) return;
    put(c, S.stations[k]!, p);
    const x = CAMPS[2]!.x;
    const big = s.label === 'review';
    label(c, s.label === 'PR' ? 'PR abierto' : s.label, x, s.y + (big ? -26 : 9), FONT.mono(26, 700), s.label === 'review' ? C.vermilion : C.ink, 'center', p);
    if (big) label(c, 'sesión nueva', x, s.y + 2, FONT.mono(18), C.muted, 'center', p);
    const passAt = k < 2 ? CUE.stations[k]! : k === 2 ? CUE.reviewed : CUE.pr;
    check(c, x + STATION_W / 2 - 4, s.y - s.h / 2 + 4, 15, C.moss, rv(sb, passAt, 0.3, ease.linear));
    if (big && sb >= CUE.stations[2]!) drawOrb(c, sb < CUE.reviewed ? 'solving' : 'breathing', x, s.y + 40, t, { d: 58, color: C.vermilion, alpha: rv(sb, CUE.stations[2]!, 0.3) });
  });
  // the change moving through the stations
  if (!preview && sb >= 32.4 && sb < CUE.pr + 0.6) {
    const ys = [campBottom + 20, STATIONS[0]!.y, STATIONS[1]!.y, STATIONS[2]!.y, STATIONS[3]!.y];
    const ts = [32.4, CUE.stations[0], CUE.stations[1], CUE.stations[2], CUE.pr] as number[];
    let y = ys[0]!;
    for (let k = 1; k < ts.length; k++) if (sb >= ts[k - 1]!) y = lerp(ys[k - 1]!, ys[k]!, prog(sb, ts[k - 1]!, ts[k - 1]! + 0.3, ease.inOutCubic));
    dot(c, CAMPS[2]!.x - STATION_W / 2 - 18, y, 9, C.lapis);
  }
}

/** Recap stamps on the map (outro): one per pattern, in world space next to the part it names. */
export function drawStamps(c: Ctx, sb: number, stamps: { text: string; x: number; y: number; at: number; rot: number }[]) {
  for (const s of stamps) {
    const p = rv(sb, s.at, 0.25, ease.outBack);
    if (p <= 0) continue;
    c.save();
    c.translate(s.x, s.y);
    c.rotate(s.rot);
    c.scale(1.6 - 0.6 * p, 1.6 - 0.6 * p);
    c.globalAlpha = Math.min(1, p);
    c.font = FONT.mono(54, 700);
    const w = c.measureText(s.text).width;
    rr(c, -w / 2 - 20, -44, w + 40, 80, 10);
    c.fillStyle = alpha(C.card, 0.92); c.fill();
    c.lineWidth = 5; c.strokeStyle = C.vermilion; c.stroke();
    c.fillStyle = C.vermilion; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(s.text, 0, -4);
    c.restore();
  }
}
