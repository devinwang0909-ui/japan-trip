const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { DAYS, ONTIME_MIN, photoKeyFor, jst, dueRandom } = require('./lib');
const { TRIP_CODE, SITE_URL } = require('./trip.json');

initializeApp();
const db = getFirestore();
const base = `t/${TRIP_CODE}`;

async function push(tokenDoc, title, body, tag) {
  const { token } = tokenDoc.data();
  try {
    await getMessaging().send({
      token,
      data: { title, body, tag, url: SITE_URL },
      webpush: { headers: { Urgency: 'high', TTL: '900' } },
    });
    return true;
  } catch (e) {
    if (/registration-token-not-registered|invalid-argument|invalid-registration/.test(e.code || e.message)) await tokenDoc.ref.delete().catch(() => {});
    console.warn('push failed', tokenDoc.id, e.code || e.message);
    return false;
  }
}

// 每分鐘檢查一次：隨機拍時間到的人、集合計時到的時候，送推播
exports.tick = onSchedule({ schedule: 'every 1 minutes', timeZone: 'Asia/Tokyo', region: 'asia-northeast1', retryCount: 0 }, async () => {
  const now = jst();
  if (!DAYS.includes(now.date) || now.min < 6 * 60) return; // 行程以外的日子與深夜不跑，省額度
  const tokens = await db.collection(`${base}/tokens`).get();
  if (tokens.empty) return;

  // 1) 集合計時
  const tdoc = await db.doc(`${base}/meta/timer`).get();
  if (tdoc.exists) {
    const t = tdoc.data();
    if (t.id && !t.cancelled && t.endsAt <= Date.now() && Date.now() - t.endsAt < 30 * 60e3) {
      const sent = db.doc(`${base}/sent/timer-${t.id}`);
      if (!(await sent.get()).exists) {
        await sent.set({ at: Date.now() });
        await Promise.all(tokens.docs.map((d) => push(d, '集合時間到！', t.label ? `集合地點：${t.label}` : '大家回來囉', 'timer')));
      }
    }
  }

  // 2) 隨機拍（每個人時間不同）
  const byName = new Map();
  tokens.docs.forEach((d) => { const n = d.data().name; if (n) byName.set(n, [...(byName.get(n) || []), d]); });
  for (const due of dueRandom(now, [...byName.keys()])) {
    const sentRef = db.doc(`${base}/sent/r-${photoKeyFor(due.name, due.key)}`);
    if ((await sentRef.get()).exists) continue;
    await sentRef.set({ at: Date.now() });
    const taken = await db.doc(`${base}/photos/${photoKeyFor(due.name, due.key)}`).get();
    if (taken.exists) continue;
    await Promise.all(byName.get(due.name).map((d) => push(d, '隨機拍時間到！', `現在拍一張，${ONTIME_MIN} 分鐘內算準時`, due.key)));
  }
});
