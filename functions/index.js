const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { DAYS, ONTIME_MIN, photoKeyFor, jst, dueRandom } = require('./lib');
const { TRIP_CODE, SITE_URL, ACK_URL } = require('./trip.json');

initializeApp();
const db = getFirestore();
const base = `t/${TRIP_CODE}`;
const MAX_SENDS = 3;           // 最多提醒 3 次
const REPEAT_MS = 5 * 60e3;    // 每 5 分鐘一次

async function push(tokenDoc, n, title, body, tag, ackKey) {
  const { token } = tokenDoc.data();
  try {
    await getMessaging().send({
      token,
      data: { title: `⏰ ${title}`, body: `${body}（第 ${n}/${MAX_SENDS} 次提醒）`, tag, url: SITE_URL, ackKey, ackUrl: ACK_URL },
      webpush: { headers: { Urgency: 'high', TTL: '300' } },
    });
    return true;
  } catch (e) {
    if (/registration-token-not-registered|invalid-argument|invalid-registration/.test(e.code || e.message)) await tokenDoc.ref.delete().catch(() => {});
    console.warn('push failed', tokenDoc.id, e.code || e.message);
    return false;
  }
}

// 這個 key 該不該再送一次：沒按「我知道了」、不到 3 次、距上次滿 5 分鐘
async function claimSend(key) {
  const [ack, sent] = await Promise.all([db.doc(`${base}/acks/${key}`).get(), db.doc(`${base}/sent/${key}`).get()]);
  if (ack.exists) return 0;
  const s = sent.exists ? sent.data() : { count: 0, last: 0 };
  if (s.count >= MAX_SENDS || Date.now() - s.last < REPEAT_MS - 20e3) return 0;
  await db.doc(`${base}/sent/${key}`).set({ count: s.count + 1, last: Date.now() });
  return s.count + 1;
}

exports.tick = onSchedule({ schedule: 'every 1 minutes', timeZone: 'Asia/Tokyo', region: 'asia-northeast1', retryCount: 0 }, async () => {
  const now = jst();
  const tokens = await db.collection(`${base}/tokens`).get();
  if (tokens.empty) return;

  // 1) 集合計時
  const tdoc = await db.doc(`${base}/meta/timer`).get();
  if (tdoc.exists) {
    const t = tdoc.data();
    const ago = Date.now() - t.endsAt;
    if (t.id && !t.cancelled && ago >= 0 && ago < 30 * 60e3) {
      const key = `timer-${t.id}-${t.endsAt}`;
      const n = await claimSend(key);
      if (n) await Promise.all(tokens.docs.map((d) => push(d, n, '集合時間到！', t.label ? `集合地點：${t.label}` : '大家回來囉', 'timer', key)));
    }
  }

  // 2) 隨機拍（每人時間不同；拍了照或按「我知道了」就停）
  if (!DAYS.includes(now.date) || now.min < 6 * 60) return; // 隨機拍只在行程日，集合計時隨時可用
  const byName = new Map();
  tokens.docs.forEach((d) => { const n = d.data().name; if (n) byName.set(n, [...(byName.get(n) || []), d]); });
  for (const due of dueRandom(now, [...byName.keys()])) {
    const id = photoKeyFor(due.name, due.key);
    if ((await db.doc(`${base}/photos/${id}`).get()).exists) continue;
    const key = `r-${id}`;
    const n = await claimSend(key);
    if (n) await Promise.all(byName.get(due.name).map((d) => push(d, n, '隨機拍時間到！', `現在拍一張，${ONTIME_MIN} 分鐘內算準時`, due.key, key)));
  }
});

// 通知上按「我知道了」（或點通知）時呼叫，停止後續提醒
exports.ack = onRequest({ region: 'asia-northeast1', cors: true, maxInstances: 5 }, async (req, res) => {
  const key = String(req.query.key || '');
  if (!/^[A-Za-z0-9_\-:.]{1,200}$/.test(key)) { res.status(400).send('bad key'); return; }
  await db.doc(`${base}/acks/${key}`).set({ at: Date.now() });
  res.status(200).send('ok');
});
