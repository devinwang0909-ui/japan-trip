# 設定步驟（約 10 分鐘，只做一次）

## A. 建立 Firebase 資料庫（讓全家同步行程和照片，免費）

1. 用 Google 帳號開 https://console.firebase.google.com ，按「建立專案」，名稱隨意（例如 japan-trip），Google Analytics 選「不啟用」。
2. 左側選單 **建構 → Firestore Database → 建立資料庫**。位置選 `asia-northeast1`（東京）。模式選「正式版」。
3. 進 Firestore 的 **規則** 分頁，把整段內容換成這個專案裡 `firestore.rules` 的內容，按「發布」。
4. 左側 **建構 → Authentication → 開始使用 → 登入方式**，啟用「**匿名**」。
5. 左上齒輪 → **專案設定 → 一般 → 您的應用程式 → 網頁（`</>`）**，註冊一個應用程式，複製畫面上 `firebaseConfig` 那一段。
6. 打開 `docs/firebase-config.js`，把 `apiKey`、`authDomain`、`projectId`、`appId` 換成你複製的值；`TRIP_CODE` 改成你自己的一串亂碼（資料都放在這個代碼底下）。

> 不用綁信用卡，免費方案夠一家人用。照片是壓縮後存進 Firestore，不需要 Storage。

## B. 發布到 GitHub Pages

1. 在 GitHub 建一個空的 repo（例如 `japan-trip`）。
2. Repo 的 **Settings → Pages → Build and deployment**：Source 選 `Deploy from a branch`，Branch 選 `main`，資料夾選 `/docs`。
3. 幾分鐘後網址會是 `https://你的帳號.github.io/japan-trip/`。

## C. 家人怎麼用

- iPhone：用 **Safari** 開網址 → 分享 → 加入主畫面。**從主畫面的圖示打開**，第一次輸入自己的名字。
- Android：用 Chrome 開網址 → 選單 → 加到主畫面。
- 出發前在飯店 Wi-Fi 先打開一次，之後沒訊號也看得到行程。
