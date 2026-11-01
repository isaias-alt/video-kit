// Toma 01: hook and the four pieces. Agents working in parallel panes, then the empty diagram fills in as each
// piece is named (the labels are the on-screen text).
import { takePlate } from '../stage';

export default takePlate({
  take: 0,
  panesUntil: (k) => k.hookEnd,
  captions: (k) => [{ at: k.noneMerges, until: k.hookEnd, head: 'Ninguno *mergea solo*.' }],
});
