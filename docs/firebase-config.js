// 照 SETUP.md 建好 Firebase 專案後，把網頁設定貼到這裡。
// 還沒設定時，網站會用「只存在這支手機」的模式運作。
export const FIREBASE_CONFIG = {
  apiKey: 'REPLACE_ME',
  authDomain: '',
  projectId: '',
  appId: '',
};
// 家人共用的行程代碼：資料都放在這個代碼底下。換成你自己的一串亂碼，不要公開。
// 推播用的金鑰：Firebase 控制台 → 專案設定 → 雲端通訊 → 網路推送憑證 → 產生金鑰組，貼公開金鑰
export const VAPID_KEY = '';
export const TRIP_CODE = 'osaka-kyoto-1111-change-me';
