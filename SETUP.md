# 設定步驟（全家同步＋鎖屏通知）

分三段：A 建資料庫（免費）→ B 升級 Blaze 並部署通知伺服器 → C 家人怎麼用。
GitHub Pages 已經設好，網址是 https://devinwang0909-ui.github.io/japan-trip/

## A. 建立 Firebase 資料庫（約 10 分鐘）

1. 用 Google 帳號開 https://console.firebase.google.com ，按「建立專案」，名稱填 `japan-trip`，Google Analytics 選「不啟用」。
2. 左側「建構」→「Firestore Database」→「建立資料庫」，位置選 `asia-northeast1`（東京），模式選「正式版」。
3. Firestore 的「規則」分頁，把全部內容換成專案裡 `firestore.rules` 的內容，按「發布」。
4. 「建構」→「Authentication」→「開始使用」→「登入方式」→ 啟用「**匿名**」。
5. 左上齒輪 →「專案設定」→「一般」→「您的應用程式」→ 網頁 `</>`，註冊應用程式（不要勾 Hosting），複製畫面上的 `apiKey`、`authDomain`、`projectId`、`appId`。
6. 同一頁切到「**雲端通訊**」分頁 →「網路推送憑證」→「產生金鑰組」，複製那串**公開金鑰**（VAPID key）。
7. 想一串只有你知道的亂碼當**行程代碼**，例如 `tang-osaka-8f3k2m9x`。

把這 6 個值交給 Claude：`apiKey`、`authDomain`、`projectId`、`appId`、`VAPID 公開金鑰`、`行程代碼`。

## B. 部署通知伺服器（約 15 分鐘，要綁信用卡）

雲端函式需要 Firebase 的 **Blaze（用多少付多少）** 方案。一家人這趟的用量遠低於免費額度，預期 0 元。建議到「用量與帳單」設一個預算提醒（例如 5 美元）。

1. 在 Firebase 左下角按「升級」，選 Blaze，綁信用卡。
2. 電腦安裝 Node.js 20 以上：https://nodejs.org （選 LTS 版）。
3. 打開終端機（Mac 的「終端機」、Windows 的 PowerShell），依序執行：

```bash
npm install -g firebase-tools
```

```bash
firebase login
```

4. 下載專案並進入資料夾：

```bash
git clone https://github.com/devinwang0909-ui/japan-trip.git
```

```bash
cd japan-trip
```

5. 把 `.firebaserc` 裡的 `YOUR_PROJECT_ID` 換成你的 projectId；`functions/trip.json` 的 `TRIP_CODE` 換成你的行程代碼（要和 `docs/firebase-config.js` 的一樣）。這幾步 Claude 做完會直接推上 GitHub，你 `git pull` 就好。
6. 部署：

```bash
cd functions && npm install && cd ..
```

```bash
firebase deploy --only functions,firestore:rules
```

第一次部署會問你要不要啟用幾個 API，一律答 Yes。完成後在 Firebase「Functions」頁會看到 `tick`，每分鐘跑一次。

## C. 家人怎麼用

- **iPhone**：必須是 iOS 16.4 以上。用 **Safari** 開網址 → 分享 → 加入主畫面，**從主畫面的圖示打開**，輸入名字，在首頁按「開啟通知」，選「允許」。
- **Android**：用 Chrome 開網址 → 選單 → 加到主畫面，打開後按「開啟通知」。
- 每個人都要自己按一次。名字要固定，別改。
- 出發前在飯店 Wi-Fi 先打開一次，之後沒訊號也看得到行程。
