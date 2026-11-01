// The diagram, drawn as a pure function of time: painted sprites revealed on their cues (words of the voice
// takes, see score.ts), plus the live parts (thinking orbs, the sentinel's polls, the wakes, the fast-forward) in
// Canvas2D. World units; the caller has already applied the camera.
import type { Frame } from '@engine/scene';
import { clamp, ease, lerp, pointAtLength, polylineLengths, prog, type V2 } from '@engine/util';
import { drawOrb, type OrbState } from '@kit/orb';
import { rr } from '@kit/draw';
import { C, FONT, alpha } from './brand';
import {
  CAMPS, CAMP_W, CAMP_Y, COMMANDER, GATE, GENERAL, LEFT_BRANCH, LEFT_COMMITS, LEFT_LEN, MAIN_COMMITS, MAIN_X, MAIN_Y,
  QUEUE, SENTINEL, WAKE_PATH, campBottom, campTop,
} from './layout';
import type { Sprite, WorldSprites } from './paint';
import type { Cues } from './score';

type Ctx = CanvasRenderingContext2D;
type Dir = 'down' | 'up' | 'right' | 'left' | 'radial';

/** Reveal 0..1 of something that starts at `a` seconds and takes `len` seconds. */
const rv = (t: number, a: number, len = 0.6, fn = ease.outCubic) => prog(t, a, a + len, fn);

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

/** A "?" badge: blocked, waiting for an answer. */
function mark(c: Ctx, x: number, y: number, r: number, p: number) {
  if (p <= 0) return;
  c.save();
  c.translate(x, y);
  c.scale(ease.outBack(p), ease.outBack(p));
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fillStyle = C.vermilion; c.fill();
  c.fillStyle = C.card; c.font = FONT.mono(r * 1.3, 700); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('?', 0, 1);
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

export function drawWorld(c: Ctx, S: WorldSprites, f: Frame, K: Cues) {
  const t = f.t, kick = f.a.kick;

  // ---- the commander (named in toma-01), busy from the first dispatch, free (not blocked) while soldiers work
  const ph = rv(t, K.pieces[0]);
  put(c, S.halo, ph);
  if (ph > 0) {
    const d = 178 * ease.outBack(ph) * (1 + 0.05 * kick);
    const free = t >= K.start[3] && t < K.awake;
    if (t < K.start[3]) orbSwap(c, t, K.reparte, 'breathing', 'connecting', COMMANDER.x, COMMANDER.y - 6, t, { d, color: C.lapis });
    else orbSwap(c, t, K.awake, 'breathing', 'connecting', COMMANDER.x, COMMANDER.y - 6, t, { d, color: C.lapis, alpha: free ? 0.6 : 1, speed: free ? 0.6 : 1 });
    label(c, 'commander', COMMANDER.x, COMMANDER.y + 114, FONT.mono(28, 700), C.ink, 'center', ph);
    if (free) label(c, 'libre', COMMANDER.x, COMMANDER.y + 142, FONT.mono(20), C.muted, 'center', rv(t, K.start[3] + 0.3));
  }
  const wk = prog(t, K.awake, K.awake + 0.7);
  if (wk > 0 && wk < 1) {
    c.save();
    c.globalAlpha = 1 - wk;
    c.strokeStyle = C.vermilion; c.lineWidth = 6 * (1 - wk) + 1;
    c.beginPath(); c.arc(COMMANDER.x, COMMANDER.y, COMMANDER.r + 10 + ease.outCubic(wk) * 140, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  // ---- the human, who only shows up to approve (toma-05)
  const pg = rv(t, K.gate);
  put(c, S.general, pg);
  label(c, 'vos', GENERAL.x + 62, GENERAL.y - 30, FONT.mono(24, 700), C.ink, 'left', pg);
  label(c, 'el humano', GENERAL.x + 62, GENERAL.y - 2, FONT.mono(20), C.muted, 'left', pg);
  put(c, S.talk, rv(t, K.gate + 0.3), 'down');

  // ---- soldiers (named in toma-01), dispatched and labelled in toma-02, in their camps
  S.dispatch.forEach((s, i) => put(c, s, rv(t, K.reparte + i * 0.15, 0.7), 'down'));
  CAMPS.forEach((cp, i) => {
    const x = cp.x - CAMP_W / 2;
    put(c, S.camps[i]!, rv(t, K.pieces[2] + i * 0.1, 0.5), 'down');
    const pb = rv(t, K.pieces[2] + i * 0.1 + 0.25, 0.4);
    label(c, `camp ${i + 1}`, x + 16, campTop + 29, FONT.mono(21, 700), C.ink, 'left', pb);
    label(c, 'herdr', x + CAMP_W - 16, campTop + 29, FONT.mono(21), C.muted, 'right', rv(t, K.panel + i * 0.12, 0.4));

    const ox = cp.x, oy = CAMP_Y - 22;
    const ps = rv(t, K.pieces[1] + i * 0.12, 0.45, ease.outBack);
    if (ps <= 0) return;
    const done = i === 0 && t >= K.done, blocked = i === 2 && t >= K.blocked;
    const d = 128 * ps * (1 + 0.04 * kick);
    if (i === 0) orbSwap(c, t, K.done, cp.orb, 'breathing', ox, oy, t, { d, color: cp.color, alpha: done ? 0.55 : 1 });
    else drawOrb(c, cp.orb, ox, oy, t + i * 3.1, { d, color: cp.color, alpha: blocked ? 0.55 : 1, speed: blocked ? 0.3 : 1 });
    // a dispatched soldier arrives: a ring on its pane
    const rip = prog(t, K.reparte + 0.5 + i * 0.15, K.reparte + 1 + i * 0.15);
    if (rip > 0 && rip < 1) {
      c.save(); c.globalAlpha = (1 - rip) * 0.8; c.strokeStyle = cp.color; c.lineWidth = 3;
      c.beginPath(); c.arc(ox, oy, 60 + rip * 70, 0, Math.PI * 2); c.stroke(); c.restore();
    }
    label(c, cp.kind.toUpperCase(), ox, CAMP_Y + 76, FONT.mono(28, 700), cp.color, 'center', rv(t, K.soldier + i * 0.12, 0.4));
    label(c, cp.branch, ox, CAMP_Y + 112, FONT.mono(21, 700), cp.kind === 'scout' ? C.muted : C.ink, 'center', rv(t, K.branch + 0.3 * i, 0.5));
    // status, top-right corner: working, then done (camp 1) or blocked (camp 3)
    const bx = x + CAMP_W - 2, by = campTop + 2, pa = rv(t, K.reparte + 0.6, 0.3);
    if (done) check(c, bx, by, 17, C.moss, rv(t, K.done, 0.35, ease.linear));
    else if (blocked) mark(c, bx, by, 17, rv(t, K.blocked, 0.35, ease.linear));
    else if (pa > 0) dot(c, bx, by, 9 + 3 * Math.sin(t * 6 + i), cp.color, C.paper, pa);
    if (done) chip(c, 'done', ox, campTop - 26, { font: FONT.mono(22, 700), color: C.moss, alpha: rv(t, K.done, 0.3) });
    if (blocked) chip(c, 'blocked', ox, campTop - 26, { font: FONT.mono(22, 700), color: C.vermilion, alpha: rv(t, K.blocked, 0.3) });
  });
  // toma-03: the camp is a worktree with its own branch
  const pw = rv(t, K.worktree, 0.5) * (1 - rv(t, K.ojo - 0.3, 0.3));
  if (pw > 0) chip(c, 'camp = git worktree', CAMPS[0]!.x + 40, campTop - 44, { font: FONT.mono(26, 700), color: C.ink, alpha: pw, pad: 16 });

  // ---- caution: no container, no sandbox
  const pc = rv(t, K.ojo, 0.5) * (1 - rv(t, K.end[2] - 0.2, 0.2));
  if (pc > 0) {
    put(c, S.host, pc);
    label(c, '~/.ssh', S.host.x + S.host.w / 2 + 2, S.host.y + S.host.h + 18, FONT.mono(20, 700), C.vermilion, 'center', pc);
    c.save();
    c.globalAlpha = pc;
    c.setLineDash([10, 9]); c.lineDashOffset = -t * 40;
    c.strokeStyle = C.vermilion; c.lineWidth = 3;
    c.beginPath(); c.moveTo(CAMPS[0]!.x - 70, campTop + 6); c.quadraticCurveTo(CAMPS[0]!.x - 80, campTop - 50, S.host.x + S.host.w / 2 + 30, S.host.y + S.host.h - 16); c.stroke();
    c.restore();
    label(c, 'lee el host', CAMPS[0]!.x + 6, campTop - 60, FONT.mono(19, 700), C.vermilion, 'left', pc);
  }

  // ---- git: main and the mission branches (toma-03), the commits (toma-04), the fast-forward (toma-05)
  const pm = rv(t, K.branch, 0.6);
  put(c, S.main, pm, 'right');
  const pbr = rv(t, K.branch + 0.3, 0.9, ease.inOutQuad);
  put(c, S.branchL, pbr, 'up');
  put(c, S.branchR, pbr, 'up');
  for (const x of MAIN_COMMITS) if (pm > (x - 70) / 480) dot(c, x, MAIN_Y, 9, C.ink);
  const ff = prog(t, K.ff, K.ff + 1.2, ease.inOutCubic);
  const tipLen = leftLenAtY(LEFT_COMMITS[1]!);
  if (ff > 0) inkAlong(c, LEFT_BRANCH, LEFT_LEN, 0, tipLen * ff, 9, C.ink);
  LEFT_COMMITS.forEach((y, k) => { const p = rv(t, K.done + k * 0.2, 0.35, ease.outBack); if (p > 0) dot(c, CAMPS[0]!.x, y, 9 * p, ff * tipLen >= leftLenAtY(y) ? C.ink : C.lapis); });
  if (pm > 0.9) {
    const at = pointAtLength(LEFT_BRANCH, LEFT_LEN, tipLen * ff);
    const onMain = ff <= 0;
    chip(c, 'main', onMain ? MAIN_X[1] : at.x - 22, onMain ? MAIN_Y + 46 : at.y, { font: FONT.mono(20, 700), color: C.card, fill: C.ink, border: 'none', align: onMain ? 'center' : 'right', alpha: rv(t, K.branch + 0.5, 0.3) });
  }

  // ---- the sentinel (named in toma-01), polling in toma-04
  const pse = rv(t, K.pieces[3]);
  put(c, S.sentinel, pse);
  if (pse > 0) {
    drawOrb(c, 'listening', SENTINEL.x, SENTINEL.y - 12, t, { d: 140 * ease.outBack(pse) * (1 + 0.05 * f.a.snare), color: C.vermilion });
    label(c, 'sentinel', SENTINEL.x, SENTINEL.y + 84, FONT.mono(27, 700), C.vermilion, 'center', pse);
  }
  if (t >= K.sondea && t < K.end[3] + 0.5) {
    const k0 = rv(t, K.sondea, 0.4), loud = 1 + 0.6 * (prog(t, K.polling, K.polling + 0.2) - prog(t, K.polling + 1.4, K.polling + 1.8));
    const ph = (f.bar % 1 + 1) % 1;
    c.save();
    c.globalAlpha = 0.45 * (1 - ph) * k0;
    c.strokeStyle = C.vermilion; c.lineWidth = 3;
    c.beginPath(); c.arc(SENTINEL.x, SENTINEL.y, SENTINEL.r + ph * 620, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    c.restore();
    CAMPS.forEach((cp, i) => {
      const y0 = SENTINEL.y - SENTINEL.r, y1 = campBottom + 8, x0 = SENTINEL.x + (cp.x - SENTINEL.x) * 0.3;
      c.save();
      c.globalAlpha = 0.5 * k0 * loud;
      c.setLineDash([3, 9]); c.strokeStyle = C.vermilion; c.lineWidth = 2 * loud;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(cp.x, y1); c.stroke();
      c.restore();
      const k = ((f.bar + i * 0.22) % 1 + 1) % 1 / 0.6;
      if (k <= 1) { const u = k < 0.5 ? k * 2 : 2 - k * 2; dot(c, lerp(x0, cp.x, u), lerp(y0, y1, u), 6, C.vermilion, C.paper, k0); }
    });
    label(c, 'sondeo', SENTINEL.x + 128, SENTINEL.y - 70, FONT.mono(20, 700), C.vermilion, 'left', k0);
  }

  // ---- the wakes: the sentinel drops an aviso in the commander's queue; the Stop hook delivers it (and it is gone)
  put(c, S.wake, rv(t, K.sondea, 0.8, ease.inOutQuad), 'up', 0.55);
  const pq = rv(t, K.sondea + 0.3, 0.4);
  put(c, S.queue, pq);
  label(c, 'cola de avisos', QUEUE.x, QUEUE.y - QUEUE.h / 2 + 24, FONT.mono(17, 700), C.vermilion, 'center', pq);
  const wakes = [{ at: K.done + 0.1, text: 'camp 1: done' }, { at: K.blocked + 0.1, text: 'camp 3: blocked' }];
  wakes.forEach((w, k) => {
    const travel = prog(t, w.at, w.at + 0.9, ease.inOutCubic);
    const deliver = prog(t, K.awake + k * 0.45, K.awake + k * 0.45 + 0.45, ease.inOutCubic);
    if (travel <= 0 || deliver >= 1) return;
    const slot = { x: QUEUE.x - QUEUE.w / 2 + (k + 0.5) * (QUEUE.w / 3), y: QUEUE.y + 20 };
    let x: number, y: number;
    if (travel < 1) { const q = pointAtLength(WAKE, WAKE_L, WAKE_L[WAKE_L.length - 1]! * travel); x = q.x; y = q.y; }
    else if (deliver <= 0) { x = slot.x; y = slot.y; }
    else { x = lerp(slot.x, COMMANDER.x + COMMANDER.r - 10, deliver); y = lerp(slot.y, COMMANDER.y - 10, deliver); }
    dot(c, x, y, 13, C.vermilion);
    if (travel < 1) chip(c, w.text, x + 24, y, { font: FONT.mono(19, 700), color: C.vermilion, align: 'left' });
  });
  // delivery is an event for the commander: a solid arrow from the queue
  const pe = rv(t, K.awake, 0.3) * (1 - rv(t, K.end[3] - 0.3, 0.3));
  if (pe > 0) {
    const x0 = QUEUE.x - QUEUE.w / 2 - 6, x1 = COMMANDER.x + COMMANDER.r + 8, y = QUEUE.y - 6;
    c.save();
    c.globalAlpha = pe;
    c.strokeStyle = C.vermilion; c.fillStyle = C.vermilion; c.lineWidth = 5;
    c.beginPath(); c.moveTo(x0, y); c.lineTo(x1 + 14, y); c.stroke();
    c.beginPath(); c.moveTo(x1, y); c.lineTo(x1 + 18, y - 11); c.lineTo(x1 + 18, y + 11); c.closePath(); c.fill();
    c.restore();
    label(c, 'evento', (x0 + x1) / 2 + 6, y - 16, FONT.mono(20, 700), C.vermilion, 'center', rv(t, K.evento, 0.3));
  }

  // ---- land (toma-05): the gate, the question, the yes, the fast-forward
  const pgt = rv(t, K.gate);
  put(c, S.gatePosts, pgt);
  if (pgt > 0) {
    const open = prog(t, K.approve + 0.3, K.approve + 0.75, ease.outBack);
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
  const fadeLand = 1 - rv(t, K.end[4] - 0.3, 0.3);
  const pa = rv(t, K.ask, 0.4) * fadeLand;
  if (pa > 0) chip(c, 'commander: ¿aterrizo camp 1?', 70, 1690, { font: FONT.mono(21, 700), color: C.lapis, align: 'left', alpha: pa, pad: 16 });
  const py = rv(t, K.approve, 0.35, ease.outBack) * fadeLand;
  if (py > 0) chip(c, 'vos: sí', 470, 1748, { font: FONT.mono(21, 700), color: C.ochre, align: 'left', alpha: Math.min(1, py), pad: 16 });
  const pf = rv(t, K.ff, 0.5) * fadeLand;
  if (pf > 0) {
    label(c, 'fast-forward', CAMPS[0]!.x + 22, LEFT_COMMITS[1]! - 84, FONT.mono(20, 700), C.ink, 'left', pf);
    label(c, 'sin merge commit', CAMPS[0]!.x + 22, LEFT_COMMITS[1]! - 60, FONT.mono(19), C.muted, 'left', pf);
  }
}

/** Pattern stamps on the map (toma-06): one per pattern, in world space next to the part it names. */
export function drawStamps(c: Ctx, t: number, stamps: { text: string; x: number; y: number; at: number; rot: number }[]) {
  for (const s of stamps) {
    const p = rv(t, s.at, 0.35, ease.outBack);
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
