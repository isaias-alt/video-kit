// The hook's first seconds: several agents working at once, each in its own terminal pane (a herdr layout).
// The script asks for a real herdr recording here; until there is one, this draws it: the panes, their thinking
// orbs and a log that scrolls with time. The log lines are illustrative, not captured output.
import { ease, prog } from '@engine/util';
import { drawOrb, type OrbState } from '@kit/orb';
import { rr } from '@kit/draw';
import { C, FONT, alpha } from './brand';

const PANES: { title: string; orb: OrbState; log: string[] }[] = [
  { title: 'soldier 1 · mission', orb: 'working', log: ['leyendo src/api/auth.ts', 'editando middleware de sesión', 'npm test', '  42 passed', 'git commit -m "auth: refresh token"'] },
  { title: 'soldier 2 · scout', orb: 'searching', log: ['buscando usos de retryPolicy', 'rg "retryPolicy" -n', '  7 resultados', 'leyendo docs/queues.md', 'escribiendo reporte'] },
  { title: 'soldier 3 · mission', orb: 'weaving', log: ['migración 0042_orders', 'editando schema.sql', 'npm run typecheck', '  sin errores', 'git commit -m "orders: index"'] },
  { title: 'soldier 4 · mission', orb: 'solving', log: ['reproduciendo el bug', 'npm run e2e -- checkout', '  1 failed', 'arreglando el redondeo', '  1 passed'] },
  { title: 'soldier 5 · scout', orb: 'connecting', log: ['comparando colas', 'leyendo changelog v3', 'probando en /tmp', 'anotando trade-offs', 'reporte listo'] },
  { title: 'soldier 6 · mission', orb: 'composing', log: ['renombrando UserDTO', 'editando 14 archivos', 'npm run lint', '  ok', 'git commit -m "rename UserDTO"'] },
];

/** Draw the pane grid over the whole frame; `out` (0..1) wipes it away at the end of the hook. */
export function drawPanes(c: CanvasRenderingContext2D, W: number, H: number, t: number, out: number) {
  const u = W / 1080, gap = 14 * u, cols = 2, rows = 3;
  const pw = (W - gap * (cols + 1)) / cols, ph = (H - gap * (rows + 1)) / rows;
  c.save();
  // the grid slides up and away as the diagram takes over
  c.translate(0, -ease.inCubic(out) * H);
  c.fillStyle = C.night;
  c.fillRect(0, 0, W, H);
  PANES.forEach((p, i) => {
    const x = gap + (i % cols) * (pw + gap), y = gap + Math.floor(i / cols) * (ph + gap);
    const pin = prog(t, i * 0.06, i * 0.06 + 0.3, ease.outCubic);
    c.save();
    c.globalAlpha = pin;
    rr(c, x, y, pw, ph, 12 * u);
    c.fillStyle = C.ink; c.fill();
    c.lineWidth = 2 * u; c.strokeStyle = alpha(C.card, 0.18); c.stroke();
    c.font = FONT.mono(22 * u, 700);
    c.fillStyle = alpha(C.card, 0.85);
    c.textBaseline = 'middle';
    c.fillText(p.title, x + 20 * u, y + 30 * u);
    c.fillStyle = alpha(C.card, 0.12);
    c.fillRect(x, y + 58 * u, pw, 1.5 * u);
    drawOrb(c, p.orb, x + pw / 2, y + 58 * u + (ph - 58 * u) * 0.36, t + i * 1.7, { d: 230 * u, dark: true, color: i % 3 === 1 ? C.ochreWash : C.card });
    // the log: one more line every ~0.45 s, the newest typing itself out
    c.font = FONT.mono(19 * u);
    const n = Math.floor(t / 0.45 + i * 0.7), shown = Math.min(4, n + 1);
    for (let k = 0; k < shown; k++) {
      const li = n - shown + 1 + k, line = p.log[((li % p.log.length) + p.log.length) % p.log.length]!;
      const typing = k === shown - 1 ? prog(t, (n - i * 0.7) * 0.45, (n - i * 0.7) * 0.45 + 0.3) : 1;
      c.fillStyle = line.startsWith('  ') ? C.mossWash : alpha(C.card, 0.7);
      c.fillText(`${line.startsWith('  ') ? '' : '> '}${line.slice(0, Math.ceil(line.length * typing))}`, x + 20 * u, y + ph - (shown - k) * 30 * u - 12 * u);
    }
    c.restore();
  });
  c.restore();
}
