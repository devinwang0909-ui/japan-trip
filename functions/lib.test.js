const fs = require('fs'); const assert = require('assert');
const { flashSlots, photoKeyFor, dueRandom } = require('./lib');
const src = fs.readFileSync(__dirname + '/../docs/app.js', 'utf8');
const grab = (n) => { const i = src.indexOf('function ' + n); let d = 0; const j = src.indexOf('{', i); for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); } } };
const S = { uid: null };
const client = new Function('S', 'TextEncoder', grab('hash') + grab('rng') + grab('flashSlots') + grab('photoKeyFor') + 'return {flashSlots,photoKeyFor};')(S, TextEncoder);
const clientSlots = client.flashSlots, clientKey = client.photoKeyFor;
for (const who of ['爸爸', '媽媽', 'Devin', '表弟', 'a b']) for (const d of ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14']) {
  assert.deepStrictEqual(flashSlots(d, who), clientSlots(d, who), `slots differ for ${who} ${d}`);
}
assert.strictEqual(photoKeyFor('媽媽', 'r-2026-11-12-1'), clientKey('媽媽', 'r-2026-11-12-1'));
assert.notStrictEqual(photoKeyFor('爸爸', 'k'), photoKeyFor('媽媽', 'k'));
const s = flashSlots('2026-11-12', '爸爸'); // 13:02
const due = dueRandom({ date: '2026-11-12', min: s[0] + 3 }, ['爸爸', '媽媽']);
assert.strictEqual(due.length, 1); assert.strictEqual(due[0].name, '爸爸'); assert.strictEqual(due[0].n, 1);
assert.strictEqual(dueRandom({ date: '2026-11-12', min: s[0] + 16 }, ['爸爸']).length, 0);
assert.strictEqual(dueRandom({ date: '2026-12-01', min: 600 }, ['爸爸']).length, 0);
console.log('ok: client and server agree; due-window logic correct');
