import { FIREBASE_CONFIG, TRIP_CODE } from './firebase-config.js';
import { INFO, STOPS, SEED_VERSION, REMOVED_IDS } from './trip.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';
const configured = FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.startsWith('REPLACE');
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (v === undefined ? null : v)));

/* ---------- 只存在這支手機 ---------- */
function localData() {
  const subs = { stops: [], info: [], photos: [], timer: [] };
  let stops = lsGet('L_stops', null);
  if (!stops || (lsGet('L_ver', 0) < SEED_VERSION)) {
    const old = new Map((stops || []).map((s) => [s.id, s]));
    stops = STOPS.map((s) => ({ ...s, visited: old.get(s.id)?.visited || false }))
      .concat((stops || []).filter((s) => s.kind === 'added'));
    lsSet('L_stops', stops); lsSet('L_ver', SEED_VERSION);
  }
  const photos = lsGet('L_photos', []);
  let timer = lsGet('L_timer', null);
  const fulls = new Map();
  const emit = (k, v) => subs[k].forEach((f) => f(v));
  return {
    mode: 'local',
    async init() { return true; },
    onStops(cb) { subs.stops.push(cb); cb(stops); },
    onInfo(cb) { subs.info.push(cb); cb(INFO); },
    onPhotos(cb) { subs.photos.push(cb); cb(photos); },
    onTimer(cb) { subs.timer.push(cb); cb(timer); },
    async setTimer(t) { timer = t; lsSet('L_timer', t); emit('timer', t); },
    newId() { return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
    async saveStop(id, data) {
      const i = stops.findIndex((s) => s.id === id);
      if (i >= 0) stops[i] = { ...stops[i], ...data }; else stops.push({ id, ...data });
      lsSet('L_stops', stops); emit('stops', stops);
    },
    async deleteStop(id) { stops = stops.filter((s) => s.id !== id); lsSet('L_stops', stops); emit('stops', stops); },
    async putPhoto(id, meta, full) {
      if (photos.some((p) => p.id === id)) throw Object.assign(new Error('exists'), { code: 'exists' });
      photos.push({ id, ...meta }); fulls.set(id, full); lsSet('L_photos', photos); emit('photos', photos);
    },
    async getFull(id) { return fulls.get(id) || photos.find((p) => p.id === id)?.thumb || ''; },
  };
}

/* ---------- Firebase（全家同步） ---------- */
async function firebaseData() {
  const [{ initializeApp }, { getAuth, signInAnonymously }, fs] = await Promise.all([
    import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  const db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
  const auth = getAuth(app);
  if (!auth.currentUser) await signInAnonymously(auth);
  const base = `t/${TRIP_CODE}`;
  const col = (n) => fs.collection(db, `${base}/${n}`);
  const ref = (n, id) => fs.doc(db, `${base}/${n}/${id}`);
  const listen = (q, cb, onErr) => fs.onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })), snap.metadata.fromCache), onErr);

  async function seedIfNeeded() {
    try {
      const snap = await fs.getDocFromServer(ref('meta', 'info'));
      const cur = snap.exists() ? snap.data().seedVersion || 0 : 0;
      if (cur >= SEED_VERSION) return;
      for (let i = 0; i < STOPS.length; i += 400) {
        const b = fs.writeBatch(db);
        STOPS.slice(i, i + 400).forEach((s) => b.set(ref('stops', s.id), strip(s), { merge: true }));
        await b.commit();
      }
      for (const id of REMOVED_IDS) await fs.deleteDoc(ref('stops', id)).catch(() => {});
      await fs.setDoc(ref('meta', 'info'), { ...strip(INFO), seedVersion: SEED_VERSION });
    } catch (e) { console.warn('seed skipped', e?.code || e); }
  }
  return {
    mode: 'cloud',
    async init() { await seedIfNeeded(); return true; },
    onStops(cb, err) { listen(col('stops'), cb, err); },
    onInfo(cb, err) { fs.onSnapshot(ref('meta', 'info'), (s) => cb(s.exists() ? s.data() : INFO), err); },
    onPhotos(cb, err) { listen(col('photos'), cb, err); },
    onTimer(cb, err) { fs.onSnapshot(ref('meta', 'timer'), (s) => cb(s.exists() ? s.data() : null), err); },
    async setTimer(t) { await fs.setDoc(ref('meta', 'timer'), strip(t)); },
    newId() { return fs.doc(col('stops')).id; },
    async saveStop(id, data) { await fs.setDoc(ref('stops', id), strip(data), { merge: true }); },
    async deleteStop(id) { await fs.deleteDoc(ref('stops', id)); },
    async putPhoto(id, meta, full) {
      await fs.setDoc(ref('photoData', id), { img: full });
      await fs.setDoc(ref('photos', id), strip(meta));
    },
    async getFull(id) { const s = await fs.getDoc(ref('photoData', id)); return s.exists() ? s.data().img : ''; },
  };
}

export async function createData() {
  if (configured) {
    try { return await firebaseData(); } catch (e) { console.warn('firebase failed, using local mode', e); }
  }
  return localData();
}
