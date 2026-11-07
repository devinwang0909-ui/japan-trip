# 大阪京都家族旅 2026/11/11–14（專案備忘）

全家共用的旅遊網站，純靜態網頁（GitHub Pages，`docs/`）＋ Firebase（Firestore、匿名登入、雲端函式推播）。
使用者用繁體中文溝通。網站網址：https://devinwang0909-ui.github.io/japan-trip/

## 重要規則（使用者已決定）
- **Katherine 專屬功能**：只有使用者名字輸入 `Katherine`（英文，不分大小寫、去掉前後空白）才會出現專屬提示與功能。中文名或其他拼法一律不算。
  - 這些功能「不是驚喜」，家人不會輸入她的名字，**寫在程式碼裡沒關係**，不需要保密或密碼。
  - 專屬功能與通知的內容，使用者之後再提供，在那之前不要自己發明。
  - 程式裡統一用 `isKatherine()`（docs/app.js）判斷；伺服器端用 `functions/lib.js` 的 `isKatherine(name)`。通知伺服器以 token 上的 `name` 對應使用者。
- 每個景點每人只能拍一張照片，傳送後不能改（資料庫規則：照片只能新增）。
- 隨機拍時間每人不同（以名字為種子，每天 3 次）。
- 不要加多餘小字說明；介面風格：象牙白 #F5F2EA、黑曜石黑 #171717、香檳金 #B99B62、深灰 #292929，標題襯線字。

## 部署
- 網站：推到 `main` 即自動發布（GitHub Pages，`/docs`）。
- 通知伺服器（`functions/`）：使用者要在自己的 Mac 重新下載 zip 後，`cd functions && npm install && cd ..`，再 `npx firebase-tools deploy --only functions,firestore:rules`。
- Firebase 專案 ID：`japan-trip-d4004`，行程代碼在 `docs/firebase-config.js` 與 `functions/trip.json`（需一致）。
