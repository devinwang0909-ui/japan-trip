# 大阪京都家族旅 2026/11/11–14
全家共用的行程網站（純靜態網頁 + Firebase Firestore）。設定步驟見 [SETUP.md](SETUP.md)。
- `docs/trip.js`：行程資料。改完把 `SEED_VERSION` 加 1，全家就會同步到新內容。
- `docs/firebase-config.js`：Firebase 設定與行程代碼。
- `firestore.rules`：資料庫規則。
