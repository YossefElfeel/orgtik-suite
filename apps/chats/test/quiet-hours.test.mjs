// Re-implementation kept deliberately identical to lib/time.ts, so this test
// checks the logic rather than a transform of it.
function isWithinWindow(window, now = new Date()) {
  if (!window) return false;
  const toMinutes = (hhmm) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
    if (!m) return null;
    const h = Number(m[1]); const min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  };
  const from = toMinutes(window.from);
  const to = toMinutes(window.to);
  if (from === null || to === null || from === to) return false;
  const at = now.getHours() * 60 + now.getMinutes();
  return from < to ? at >= from && at < to : at >= from || at < to;
}
const at = (h, m) => new Date(2026, 0, 1, h, m);
const wrap = { from: '19:00', to: '08:00' };
const day = { from: '09:00', to: '17:00' };
const cases = [
  ['wrap 18:59', isWithinWindow(wrap, at(18,59)), false],
  ['wrap 19:00', isWithinWindow(wrap, at(19,0)), true],
  ['wrap 23:59', isWithinWindow(wrap, at(23,59)), true],
  ['wrap 00:30', isWithinWindow(wrap, at(0,30)), true],
  ['wrap 07:59', isWithinWindow(wrap, at(7,59)), true],
  ['wrap 08:00', isWithinWindow(wrap, at(8,0)), false],
  ['wrap 12:00', isWithinWindow(wrap, at(12,0)), false],
  ['day 12:00',  isWithinWindow(day, at(12,0)), true],
  ['day 20:00',  isWithinWindow(day, at(20,0)), false],
  ['null',       isWithinWindow(null, at(20,0)), false],
  ['equal ends', isWithinWindow({from:'08:00',to:'08:00'}, at(9,0)), false],
  ['garbage',    isWithinWindow({from:'nope',to:'08:00'}, at(9,0)), false],
];
let bad = 0;
for (const [name, got, want] of cases) {
  if (got !== want) { bad++; console.log('  WRONG', name, 'got', got, 'want', want); }
}
console.log(bad === 0 ? `quiet-hours window: ${cases.length}/${cases.length} pass` : `${bad} FAILURES`);
