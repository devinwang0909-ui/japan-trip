// 行程資料（來源：大阪京都四天詳細行程.docx，2026/11/05 版）
// 改這個檔案的內容後，把 SEED_VERSION 加 1，網站就會把新內容同步給全家。
export const SEED_VERSION = 5;

const HOTEL = { lat: 34.6724, lng: 135.4995, approx: true };
const C = { metro: '#E5171F', nankai: '#B3122D', keihan: '#0F6BB5', jr: '#F08300', loop: '#E60012' };
const walk = (minutes, text) => ({ type: 'walk', minutes, text });
const metro = (o) => ({ type: 'rail', line: '御堂筋線', code: 'M', color: C.metro, ...o });
const keihan = (o) => ({ type: 'rail', line: '京阪', code: 'KH', color: C.keihan, ...o });
const taxi = (minutes, text) => ({ type: 'taxi', minutes, text });

export const INFO = {
  title: '大阪京都家族旅',
  city: '大阪',
  hotels: [{
    name: '大阪日航飯店', nameJa: 'ホテル日航大阪',
    address: '大阪市中央區西心齋橋1-3-3', addressJa: '〒542-0086 大阪市中央区西心斎橋1-3-3',
    phone: '06-6244-1111', ...HOTEL, from: '2026-11-11', to: '2026-11-14',
    note: '心齋橋站南改札，8 號出口連通飯店，櫃台在 2 樓。帶大件行李走 4-A 電梯出口。',
  }],
};

const IMG_HOTEL = [
  { src: 'assets/t1.jpg', caption: 'PARCO 旁南改札出站：往左前方找 4-A 出口電梯' },
  { src: 'assets/t2.jpg', caption: '看到 4-A 電梯：從 B1 搭到 1 樓地面' },
  { src: 'assets/t3.jpg', caption: '面向御堂筋右轉：到第一個紅綠燈，過斑馬線到飯店正門' },
];
const IMG_KIX = [
  { src: 'assets/kix1.jpg', caption: '① 入境後搭手扶梯上樓（往 2 樓）' },
  { src: 'assets/kix2.jpg', caption: '② 過連接橋，前方是關西機場站' },
  { src: 'assets/kix3.jpg', caption: '③ 進站大廳：右手邊是乘車處，左手邊「Ticket Office」是南海人工售票櫃台，買票往左' },
  { src: 'assets/kix5.jpg', caption: '④ 月台看板：紅色「特急 ラピート」往 なんば（NK01）就是要搭的；橘色是空港急行' },
];
const IMG_YODOYA = [
  { src: 'assets/t4.jpg', caption: '① 先出御堂筋線「北改札」，找「京阪本線（淀屋橋駅）」箭頭向右。不要跟下方「京阪中之島線」走' },
  { src: 'assets/t5.jpg', caption: '② 找黃色「2 出口／京阪本線」招牌，沿通道走，不用上地面' },
];
const IMG_MAP = [{ src: 'assets/t6.jpg', caption: '大阪地鐵路線圖（紅色 M 是御堂筋線）' }];

const L = {
  hno: { label: '大阪日航交通與出口（官方）', url: 'https://www.hno.co.jp/other/access-route.html' },
  namba3f: { label: '南海難波 3 樓轉地鐵（圖解）', url: 'https://spacely.co.jp/nankai/namba3f_to_subway_jp' },
  nankaiTT: { label: '南海關空→難波 時刻表 PDF', url: 'https://www.nankai.co.jp/traffic/jikoku/pdf/kansaiairport/a_02.pdf' },
  kixTrain: { label: '關西機場電車位置圖', url: 'https://www.kansai-airport.or.jp/tw/access/from-airport/train' },
  yodoya: { label: '淀屋橋地鐵站內圖（官方）', url: 'https://subway.osakametro.co.jp/station_guide/M/m17/index.php' },
  yodoyaPhoto: { label: '淀屋橋轉京阪 實拍步行說明', url: 'https://123a.jp/archives/17696' },
  yodoyaPhoto2: { label: '京阪→御堂筋線 反方向實拍', url: 'https://123a.jp/archives/20049' },
  keihanTrains: { label: '京阪路線圖與車種', url: 'https://www.keihan.co.jp/travel/tw/trains/' },
  metroMap: { label: 'Osaka Metro 官方路線圖 PDF', url: 'https://subway.osakametro.co.jp/img/osakametro_rosenzu_20250404.pdf' },
};

export const STOPS = [
  /* ---------- 11/11 ---------- */
  {
    id: 'd1-airport', art: 'plane', day: '2026-11-11', order: 10, time: '', noPrev: true,
    name: '關西機場 抵達', nameJa: '関西国際空港 第1ターミナル', address: '大阪府泉佐野市泉州空港北1',
    notes: '去程班號與抵達時間還沒確認，確認後再調整當天安排。出關後到飯店約 75～100 分鐘。',
  },
  {
    id: 'd1-hotel', art: 'hotel', day: '2026-11-11', order: 20, time: '', name: '大阪日航飯店 入住／寄放行李', nameJa: 'ホテル日航大阪',
    addressJa: '大阪市中央区西心斎橋1-3-3', ...HOTEL, phone: '06-6244-1111',
    notes: '15:00 起可入住，還不能進房先寄放行李，休息約 30 分鐘。櫃台在 2 樓。',
    transit: {
      summary: '關西機場站 → 南海電鐵到難波 → 御堂筋線一站到心齋橋',
      enter: '南海 關西機場站', exit: '心齋橋 8 號出口（連通飯店）', minutes: 90, fare: '含 Rapi:t 特急券另計',
      legs: [
        walk(10, '第一航廈 1 樓到達大廳，跟「鉄道／Railways」指標上 2 樓，走連接通道到關西機場站'),
        { type: 'rail', line: '南海 Rapi:t／空港急行', code: 'NK', color: C.nankai, from: '關西機場', to: '南海難波', direction: 'なんば／難波', minutes: 39, text: 'Rapi:t 需指定席特急券；空港急行不用。不要搭往和歌山市的車。' },
        { ...walk(5, '南海難波 3 樓：從「北改札／North Gate」出站，跟「Osaka Metro／御堂筋線」一路下樓到 B1'), buf: 15 },
        metro({ from: '難波 M20', to: '心齋橋 M19', direction: '梅田／新大阪／箕面萱野', stops: 1, minutes: 1, text: '另刷卡進地鐵。南海票不含這一段。', stationMap: L.yodoya.url }),
        { ...walk(2, '南改札出站，約 140 公尺。沒有大件行李走 8 號出口連通道進飯店，上 2 樓；帶行李改走 4-A 電梯上地面，過御堂筋到正門'), buf: 10 },
      ],
      images: [...IMG_KIX, ...IMG_HOTEL],
    },
    showCard: {
      label: '給南海售票櫃台看（關西機場站）',
      ja: ['関西空港 → 難波（なんば）', '大人 4名', '特急券＋乗車券', '一番早く乗れる特急（ラピート）をお願いします。'],
      zh: '4 位大人，關西機場到難波，要買特急券＋乘車券，搭最快能搭到的那一班。',
    },
    links: [L.hno, L.namba3f, L.nankaiTT, L.kixTrain],
  },
  {
    id: 'd1-midosuji', art: 'ginkgo', day: '2026-11-11', order: 30, time: '', name: '御堂筋 銀杏散步', nameJa: '御堂筋', ...HOTEL,
    notes: '飯店正門就是御堂筋。拍照走走約 15～20 分鐘，看到銀杏轉黃就多停一下，再回心齋橋站。',
  },
  {
    id: 'd1-me', art: 'store', day: '2026-11-11', order: 40, time: '', name: '阪急梅田本店 7F me ISSEY MIYAKE', nameJa: '阪急うめだ本店 7F',
    addressJa: '大阪市北区角田町8-7', lat: 34.7039, lng: 135.4985, approx: true,
    notes: '媽媽購物抓約 30 分鐘。要找 7 樓的 me ISSEY MIYAKE。',
    transit: {
      summary: '心齋橋搭御堂筋線往梅田，經本町、淀屋橋，到梅田 M16', enter: '心齋橋 M19', exit: '梅田 中央或南側改札', minutes: 15,
      legs: [
        metro({ from: '心齋橋 M19', to: '梅田 M16', direction: '梅田／新大阪／箕面萱野', stops: 3, minutes: 8, text: '經本町 M18、淀屋橋 M17' }),
        walk(5, '出中央或南側改札，跟「阪急うめだ本店」往東約 2 分鐘，上 7 樓'),
      ],
    },
    links: [{ label: '阪急梅田本店 7F 樓層導覽', url: 'https://www.hankyu-dept.co.jp/honten/floor/floor7f.html' }, { label: '阪急梅田本店交通', url: 'https://www.hankyu-dept.co.jp/honten/map/index.html' }, { label: 'me ISSEY MIYAKE 門市查詢', url: 'https://www.isseymiyake.com/pages/stores?brand=6' }],
  },
  {
    id: 'd1-alpen', art: 'golf', day: '2026-11-11', order: 50, time: '', name: 'Alpen OSAKA（Golf5）', nameJa: 'アルペン OSAKA ゴルフ5',
    addressJa: '大阪市北区茶屋町1-32 YANMAR FLYING-Y BUILDING', lat: 34.7072, lng: 135.5012, approx: true,
    hours: { open: '10:00', close: '21:00' }, notes: 'Golf5 在 B1、B2。只逛這間，鶴屋已取消。',
    transit: { summary: '從阪急往茶屋町方向步行', minutes: 10, legs: [walk(8, '阪急大阪梅田站、茶屋町方向，步行約 5～10 分鐘')] },
  },
  {
    id: 'd1-mizuno', art: 'shoe', day: '2026-11-11', order: 60, time: '', name: 'MIZUNO OSAKA CHAYAMACHI', nameJa: 'ミズノ 大阪茶屋町',
    addressJa: '大阪市北区茶屋町13-5', lat: 34.7092, lng: 135.5024, approx: true,
    hours: { open: '11:00', close: '20:00' }, notes: 'Alpen 和美津濃兩間含中間步行，最多抓 1.5 小時。',
    transit: { summary: '往茶屋町北側步行', minutes: 10, legs: [walk(8, '從 Alpen 往茶屋町北側步行約 5～10 分鐘')] },
  },
  {
    id: 'd1-dinner', art: 'grill', day: '2026-11-11', order: 70, time: '', name: '燒肉力丸 心齋橋店', nameJa: '焼肉力丸 心斎橋店',
    addressJa: '大阪市中央区心斎橋 ヨーロッパ通り 4F',
    notes: '訂位尚未確認成功。購物袋多可先回飯店。',
    transit: {
      summary: '梅田搭御堂筋線回心齋橋（往難波／天王寺／中百舌鳥）', enter: '梅田 M16', exit: '心齋橋 南改札・4 號出口區域', minutes: 25,
      legs: [
        walk(5, '步行回御堂筋線梅田站'),
        metro({ from: '梅田 M16', to: '心齋橋 M19', direction: '難波／天王寺／中百舌鳥', stops: 3, minutes: 8, text: '經淀屋橋、本町' }),
        walk(7, '南改札 → 4 號出口區域上地面，到御堂筋東側往南走，在「ヨーロッパ通り」左轉向東，找燒肉力丸招牌，上 4 樓'),
      ],
    },
  },
  {
    id: 'd1-pokemon', art: 'poke', day: '2026-11-11', order: 80, time: '', name: '寶可夢中心 OSAKA DX（彈性）', nameJa: 'ポケモンセンターオーサカDX',
    hours: { close: '20:00', note: '營業至 20:00' },
    notes: '你與表弟單獨逛，先送爸媽回飯店。時段未固定，至少留 45～60 分鐘；接近 20:00 就改排別的時段。拉麵是彈性宵夜，不限店家。',
  },

  /* ---------- 11/12 ---------- */
  {
    id: 'd2-inari', art: 'torii', day: '2026-11-12', order: 10, time: '09:30', name: '伏見稻荷大社', nameJa: '伏見稲荷大社',
    addressJa: '京都市伏見区深草藪之内町68', lat: 34.9671, lng: 135.7727, approx: true,
    notes: '建議 08:00 出門。參拜以山下本殿、千本鳥居前段為主，不排登頂。記得買狐狸煎餅。',
    transit: {
      summary: '御堂筋線到淀屋橋 → 京阪特急到丹波橋 → 換車到伏見稻荷（特急不停）', enter: '心齋橋 M19', exit: '伏見稻荷站，往東沿參道 5 分鐘', minutes: 90,
      legs: [
        metro({ from: '心齋橋 M19', to: '淀屋橋 M17', direction: '梅田／新大阪／箕面萱野', stops: 2, minutes: 5, text: '經本町 M18', stationMap: L.yodoya.url }),
        walk(10, '出地鐵閘門，跟「京阪電車／KEIHAN」走，另刷卡進京阪（實拍圖在下方）'),
        keihan({ from: '淀屋橋', to: '丹波橋', direction: '出町柳', minutes: 40, text: '搭特急' }),
        keihan({ from: '丹波橋', to: '伏見稻荷', direction: '京都市區方向（同方向）', minutes: 8, text: '轉普通或準急，確認停靠「伏見稻荷」。特急不停！' }),
        walk(5, '往東沿參道到大社'),
      ],
      images: IMG_YODOYA,
    },
    links: [{ label: '伏見稻荷大社交通', url: 'https://inari.jp/access/' }, L.yodoya, L.yodoyaPhoto, L.keihanTrains],
  },
  {
    id: 'd2-okuniya', art: 'unagi', day: '2026-11-12', order: 20, time: '12:30', name: '大國屋鰻兵衞（午餐）', nameJa: '大国屋鰻兵衞 おおくにやまんべい',
    addressJa: '京都市中京区菊屋町534', lat: 35.005, lng: 135.759, approx: true,
    notes: '申請 11/12 12:30、4 人，預約姓名 Tang／YiWei，尚待飯店回覆。現煮飯需等候，用餐留 1～1.5 小時。',
    transit: {
      summary: '約 11:30～11:40 從伏見稻荷離開，搭計程車直達餐廳', minutes: 45,
      legs: [taxi(45, '預留 40～50 分鐘含叫車與路上緩衝，目標 12:15 到附近')],
    },
    links: [{ label: '大國屋鰻兵衞官網', url: 'https://manbei.bubu-unagi.com/' }],
  },
  {
    id: 'd2-nishiki', art: 'market', day: '2026-11-12', order: 30, time: '14:00', name: '錦市場・河原町', nameJa: '錦市場', lat: 35.005, lng: 135.765, approx: true,
    notes: '以「錦市場」為導航，由西往東逛，接寺町、新京極，再到河原町購物或喝咖啡。想逛哪裡就逛哪裡，不必走完。前往高台寺前預留叫車時間。',
    transit: { summary: '餐廳在錦市場西側附近，步行即可', minutes: 5, legs: [walk(5, '沿市場由西往東')] },
  },
  {
    id: 'd2-kodaiji', art: 'temple', day: '2026-11-12', order: 40, time: '16:00', name: '高台寺（含夜間點燈）', nameJa: 'こうだいじ 高台寺',
    lat: 35.0003, lng: 135.7807, approx: true,
    hours: { lastEntry: '21:30', close: '22:00', note: '夜間特別開放 10/23～12/13；17:00 點燈。日間時間以官網為準。' },
    notes: '暫排 16:00～17:30。11/12 有開放，成片紅葉依當時葉況。下車後跟「拝観入口」指標走，仍有步行與階梯。',
    transit: {
      summary: '河原町搭計程車，目的地「高台寺」', minutes: 20,
      legs: [taxi(20, '從京都河原町站步行官方列約 20 分鐘，帶爸媽優先搭車')],
    },
    links: [{ label: '高台寺活動資訊', url: 'https://www.kodaiji.com/saiji' }],
  },
  {
    id: 'd2-moritaya', art: 'pot', day: '2026-11-12', order: 50, time: '18:00', name: 'モリタ屋 木屋町店（晚餐）', nameJa: 'モリタ屋 木屋町店',
    addressJa: '京都市中京区上大阪町531', lat: 35.0072, lng: 135.7712, approx: true,
    notes: '晚餐暫估 18:00～18:30 開始，訂位尚未確認成功。',
    transit: { summary: '高台寺搭計程車', minutes: 25, legs: [taxi(25, '交通留 20～30 分鐘緩衝')] },
    links: [{ label: 'モリタ屋木屋町店', url: 'https://moritaya-kyoto.co.jp/restaurant/kiyamachi/' }],
  },
  {
    id: 'd2-return', art: 'train', day: '2026-11-12', order: 60, time: '', name: '回大阪日航飯店', nameJa: 'ホテル日航大阪', addressJa: '大阪市中央区西心斎橋1-3-3', ...HOTEL,
    notes: '餐廳到飯店預留約 80～100 分鐘。特急一般車廂用普通車資即可；Premium Car 指定席須另買券。',
    transit: {
      summary: '京阪三條 → 特急到淀屋橋 → 御堂筋線回心齋橋', enter: '京阪三條站 7 號出口', exit: '心齋橋 8 號出口', minutes: 90,
      legs: [
        walk(5, '餐廳步行到京阪三條站，走 7 號出口下樓進站'),
        keihan({ from: '三條', to: '淀屋橋', direction: '淀屋橋（上車前確認終點）', minutes: 50, text: '搭特急' }),
        walk(10, '淀屋橋出京阪閘門，跟紅色 M「御堂筋線」轉地鐵，另刷卡'),
        metro({ from: '淀屋橋 M17', to: '心齋橋 M19', direction: '難波／天王寺／中百舌鳥', stops: 2, minutes: 5, text: '經本町' }),
        walk(8, '南改札出站，8 號出口連通道回日航'),
      ],
      images: [...IMG_YODOYA, ...IMG_HOTEL],
    },
    links: [L.yodoyaPhoto2, L.keihanTrains],
  },

  /* ---------- 11/13 ---------- */
  {
    id: 'd3-otori', art: 'shrine', day: '2026-11-13', order: 10, time: '09:00', name: '大鳥大社', nameJa: '大鳥大社',
    addressJa: '堺市西区鳳北町1-1-2',
    hours: { open: '05:30', close: '18:00', note: '御守・御朱印授與所 09:00～16:30' },
    notes: '約 09:00～10:00 參拜。約 08:00 出門，整段留 60～75 分鐘。',
    transit: {
      summary: '御堂筋線到天王寺 → JR 快速到鳳 → 西出口步行 5 分鐘', minutes: 70, enter: '心齋橋 M19', exit: '鳳站 西出口',
      legs: [
        metro({ from: '心齋橋 M19', to: '天王寺 M23', direction: '天王寺／中百舌鳥', minutes: 15 }),
        walk(8, '出地鐵閘門，跟「JR／阪和線」指標，另刷卡進 JR'),
        { type: 'rail', line: 'JR 阪和線 快速', code: 'JR', color: C.jr, from: '天王寺', to: '鳳', direction: '鳳／和歌山／關西機場', minutes: 20, text: '搭快速，確認停靠「鳳」' },
        walk(5, '鳳站走西出口，步行約 5 分鐘到大社'),
      ],
    },
    links: [{ label: '大鳥大社交通', url: 'https://www.ootoritaisha.jp/access/' }, L.metroMap],
  },
  {
    id: 'd3-kadoma', art: 'bags', day: '2026-11-13', order: 20, time: '12:00', name: '三井 OUTLET PARK 大阪門真', nameJa: '三井アウトレットパーク 大阪門真',
    addressJa: '大阪府門真市松生町1-11',
    notes: '中午在商場吃飯，下午購物。約 16:45 離開商場。大鳥大社與門真分處南北兩端，這天交通緩衝要多留。',
    transit: {
      summary: '鳳 → JR 到京橋 → 京阪普通到門真市（不是門真南）', minutes: 105, enter: '鳳站', exit: '京阪 門真市站，步行約 8 分鐘',
      legs: [
        walk(5, '步行回 JR 鳳站'),
        { type: 'rail', line: 'JR 關空快速／紀州路快速', code: 'JR', color: C.jr, from: '鳳', to: '京橋', direction: '京橋', minutes: 45, text: '經天王寺不用下車。若列車終點是天王寺，在天王寺轉大阪環狀線內回り，往鶴橋・京橋。' },
        walk(8, '京橋下車出 JR 閘門，跟「京阪電車 KEIHAN」，另刷卡進站'),
        keihan({ from: '京橋', to: '門真市', direction: '京都方向（普通 Local）', minutes: 10, text: '搭普通，在「門真市」下車，不是門真南' }),
        walk(8, '跟「ららぽーと門真／三井アウトレットパーク」指標走'),
      ],
    },
    links: [{ label: '門真 Outlet 交通', url: 'https://mitsui-shopping-park.com/mop/osakakadoma/access/' }, { label: '電車路線 PDF', url: 'https://mitsui-shopping-park.com/mop/osakakadoma/access/pdf/train.pdf' }],
  },
  {
    id: 'd3-asatsu', art: 'steak', day: '2026-11-13', order: 30, time: '18:00', name: '肉のあさつ 梅田お初天神店（晚餐）', nameJa: '肉のあさつ 梅田お初天神店',
    addressJa: '大阪市北区曽根崎2-5-20 お初天神ビル3F',
    notes: '晚餐暫抓 18:00，訂位尚未確認成功。',
    transit: {
      summary: '門真市 → 京阪普通到淀屋橋 → 御堂筋線一站到梅田，13 號出口', minutes: 70, enter: '京阪 門真市站', exit: '梅田 13 號出口，步行約 5 分鐘',
      legs: [
        walk(8, '約 16:45 離開商場，走回京阪門真市站'),
        keihan({ from: '門真市', to: '淀屋橋', direction: '淀屋橋（確認終點）', minutes: 25, text: '搭普通' }),
        walk(10, '淀屋橋出京阪閘門，轉御堂筋線'),
        metro({ from: '淀屋橋 M17', to: '梅田 M16', direction: '梅田／新大阪／箕面萱野', stops: 1, minutes: 3 }),
        walk(5, '走 13 號出口上地面，導航到「お初天神ビル」上 3 樓'),
      ],
      images: IMG_YODOYA,
    },
    links: [{ label: '肉のあさつ', url: 'https://nikunoasatsu.owst.jp/map' }, L.yodoyaPhoto2],
  },
  {
    id: 'd3-return', art: 'train', day: '2026-11-13', order: 40, time: '', name: '回大阪日航飯店', nameJa: 'ホテル日航大阪', addressJa: '大阪市中央区西心斎橋1-3-3', ...HOTEL,
    transit: {
      summary: '梅田 13 號出口 → 御堂筋線往難波方向到心齋橋', minutes: 35, enter: '梅田 13 號出口', exit: '心齋橋 8 號出口',
      legs: [
        walk(5, '回御堂筋線梅田站'),
        metro({ from: '梅田 M16', to: '心齋橋 M19', direction: '難波／天王寺／中百舌鳥', stops: 3, minutes: 8, text: '經淀屋橋、本町' }),
        walk(10, '南改札 → 8 號出口連通道 → 日航，預留 30～40 分鐘'),
      ],
      images: IMG_HOTEL,
    },
  },

  /* ---------- 11/14 ---------- */
  {
    id: 'd4-checkout', art: 'suitcase', day: '2026-11-14', order: 10, time: '', name: '飯店早餐・退房', nameJa: 'ホテル日航大阪', addressJa: '大阪市中央区西心斎橋1-3-3', ...HOTEL,
    notes: '回程班號與起飛時間還沒確認，要依班機倒推出門時間。飯店到航廈先抓約 90 分鐘，另外保留國際線報到時間。',
  },
  {
    id: 'd4-airport', art: 'plane', day: '2026-11-14', order: 20, time: '', name: '關西機場 出發', nameJa: '関西国際空港 第1ターミナル 4F 国際線出発', address: '大阪府泉佐野市泉州空港北1',
    notes: '利木津巴士是備選，班次要配合實際航班確認。長榮報到櫃台在 4 樓國際線出發大廳。',
    transit: {
      summary: '心齋橋 → 御堂筋線一站到難波 → 南海到關西機場', minutes: 90, enter: '心齋橋 M19', exit: '關西機場站，連接通道到第一航廈',
      legs: [
        walk(5, '早餐、退房，帶行李進心齋橋站'),
        metro({ from: '心齋橋 M19', to: '難波 M20', direction: '天王寺／中百舌鳥', stops: 1, minutes: 2 }),
        walk(10, '出地鐵閘門，跟「南海電車 NANKAI」指標上樓到南海難波站'),
        { type: 'rail', line: '南海 Rapi:t／空港急行', code: 'NK', color: C.nankai, from: '南海難波', to: '關西機場', direction: '関西空港', minutes: 40, text: '確認目的地「関西空港」，不要搭往和歌山市的列車' },
        walk(10, '出站走連接通道到第一航廈 2 樓，搭電梯到 4 樓國際線出發大廳，找長榮報到櫃台'),
      ],
      images: IMG_MAP,
    },
    links: [L.namba3f, L.nankaiTT, L.kixTrain],
  },
];

// 每天天氣查哪個城市
export const DAY_CITY = {
  '2026-11-11': { name: '大阪', lat: 34.69, lng: 135.5 },
  '2026-11-12': { name: '京都', lat: 35.01, lng: 135.77 },
  '2026-11-13': { name: '大阪', lat: 34.69, lng: 135.5 },
  '2026-11-14': { name: '大阪', lat: 34.69, lng: 135.5 },
};
