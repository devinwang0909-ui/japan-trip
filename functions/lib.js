// 與網站 app.js 內的演算法完全一致：每個人每天 3 個隨機拍時間。
const DAYS = ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14'];
const ONTIME_MIN = 15;

function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function flashSlots(date, who) {
  const r = rng(hash(date + '|flash-v2|' + who)); const out = [];
  for (let tries = 0; tries < 500 && out.length < 3; tries++) {
    const t = 510 + Math.floor(r() * (1290 - 510));
    if (out.every((x) => Math.abs(x - t) >= 100)) out.push(t);
  }
  return out.sort((a, b) => a - b);
}
function photoKeyFor(uid, key) {
  const hex = Buffer.from(String(uid), 'utf8').toString('hex');
  return `${hex}__${key}`;
}
function jst(d = new Date()) {
  const j = new Date(d.getTime() + 9 * 3600e3);
  const date = j.toISOString().slice(0, 10);
  return { date, min: j.getUTCHours() * 60 + j.getUTCMinutes() };
}
// 現在這一分鐘，哪些人該收到「隨機拍」通知
function dueRandom(now, names) {
  const out = [];
  if (!DAYS.includes(now.date)) return out;
  for (const name of names) {
    flashSlots(now.date, name).forEach((t, i) => {
      if (now.min >= t && now.min < t + ONTIME_MIN) out.push({ name, n: i + 1, t, key: `r-${now.date}-${i + 1}` });
    });
  }
  return out;
}
module.exports = { DAYS, ONTIME_MIN, flashSlots, photoKeyFor, jst, dueRandom };
