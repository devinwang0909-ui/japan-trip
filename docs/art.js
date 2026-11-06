// 景點封面插圖：每個場景是一張 400×150 的向量圖，不用網路也能顯示。
const W = 400, H = 150;
const bg = (id, a, b) => `<defs><linearGradient id="g-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g-${id})"/>`;
const circ = (x, y, r, f, o = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" opacity="${o}"/>`;
const rect = (x, y, w, h, f, r = 0, o = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}" opacity="${o}"/>`;
const poly = (pts, f, o = 1) => `<polygon points="${pts}" fill="${f}" opacity="${o}"/>`;
const path = (d, f, extra = '') => `<path d="${d}" fill="${f}" ${extra}/>`;
const line = (x1, y1, x2, y2, c, w = 2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const cloud = (x, y, s = 1, f = '#fff', o = .9) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}"><ellipse cx="0" cy="0" rx="26" ry="9" fill="${f}"/><ellipse cx="-12" cy="-7" rx="13" ry="10" fill="${f}"/><ellipse cx="8" cy="-9" rx="15" ry="12" fill="${f}"/></g>`;
const windows = (x, y, cols, rows, w, h, gx, gy, f, lit = .5) => {
  let s = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += rect(x + c * gx, y + r * gy, w, h, f, 1, (r * 7 + c * 3) % 5 < 2 ? 1 : lit);
  return s;
};
const steam = (x, y, c = '#fff') => `<g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" opacity=".7"><path d="M${x} ${y} q-6 -10 0 -18 q6 -8 0 -16"/><path d="M${x + 16} ${y} q-6 -10 0 -18 q6 -8 0 -16"/><path d="M${x - 16} ${y} q-6 -10 0 -18 q6 -8 0 -16"/></g>`;
const leaf = (x, y, r, f) => `<path transform="translate(${x} ${y}) rotate(${r})" d="M0 -7 L3 -3 L8 -4 L5 0 L8 4 L3 3 L0 8 L-3 3 L-8 4 L-5 0 L-8 -4 L-3 -3 Z" fill="${f}"/>`;

const SCENES = {
  plane: () => bg('plane', '#6EC1F0', '#CFEBFA') + circ(330, 36, 18, '#FFE08A') + cloud(70, 40, 1.2) + cloud(250, 100, 1) + cloud(360, 70, .8)
    + rect(0, 128, W, 22, '#2B6EA8') + rect(0, 128, W, 3, '#7FC0EA')
    + `<g transform="translate(110 62) rotate(-8)">${path('M0 12 Q10 0 60 2 L150 8 Q170 12 150 18 L60 22 Q10 24 0 12Z', '#fff')}${path('M70 8 L108 -26 L122 -26 L102 8Z', '#E5EDF5')}${path('M70 20 L106 48 L120 48 L100 20Z', '#D2DEEA')}${path('M0 12 L-8 -10 L8 -10 L22 6Z', '#E5EDF5')}${rect(120, 8, 4, 3, '#4A82B8', 1)}${rect(112, 8, 4, 3, '#4A82B8', 1)}${rect(104, 8, 4, 3, '#4A82B8', 1)}${rect(96, 8, 4, 3, '#4A82B8', 1)}</g>`,
  hotel: () => bg('hotel', '#2C3F7A', '#E58F6B') + circ(70, 38, 14, '#FFF1C9') + rect(140, 14, 100, 136, '#34416E') + rect(240, 40, 60, 110, '#2B365E') + rect(100, 60, 40, 90, '#2B365E')
    + windows(150, 24, 6, 9, 10, 8, 15.5, 13, '#FFD97A', .25) + windows(250, 50, 4, 7, 9, 8, 14, 13, '#FFD97A', .25) + windows(108, 70, 3, 6, 9, 8, 12, 13, '#FFD97A', .25)
    + rect(176, 124, 28, 26, '#FFD97A') + rect(0, 140, W, 10, '#1F2848') + line(0, 145, W, 145, '#F2C94C', 1),
  ginkgo: () => bg('ginkgo', '#FFE9A8', '#F6C34A') + poly('150,150 250,150 214,70 186,70', '#6E6A66') + line(200, 150, 200, 76, '#F6E7B0', 3)
    + [[60, 120, 34], [120, 100, 26], [330, 120, 34], [280, 100, 26]].map(([x, y, r]) => rect(x - 4, y, 8, 40, '#7A5A2E') + circ(x, y - 4, r, '#F3B51B') + circ(x - r / 2, y + 4, r * .7, '#FFD24D') + circ(x + r / 2, y - 6, r * .7, '#E9A60E')).join('')
    + [[30, 70], [90, 40], [170, 30], [240, 50], [300, 30], [370, 60], [200, 110]].map(([x, y]) => `<path transform="translate(${x} ${y})" d="M0 0 q8 -2 8 6 q-6 4 -8 -6z" fill="#D88F00"/>`).join(''),
  store: () => bg('store', '#F6D2E0', '#F8EDF3') + rect(70, 40, 260, 110, '#E9A9C2') + rect(70, 40, 260, 14, '#B7416E')
    + Array.from({ length: 13 }, (_, i) => rect(70 + i * 20, 54, 10, 18, i % 2 ? '#fff' : '#D96A96')).join('') + rect(172, 96, 56, 54, '#7B2F4E')
    + windows(88, 82, 3, 2, 30, 20, 40, 28, '#FCE9F1', .8) + windows(244, 82, 3, 2, 30, 20, 26 + 14, 28, '#FCE9F1', .8)
    + `<g transform="translate(330 100)">${rect(0, 10, 40, 40, '#2B2B2B', 4)}${path('M10 10 q10 -22 20 0', 'none', 'stroke="#2B2B2B" stroke-width="4"')}${rect(8, 22, 24, 6, '#F6D2E0', 3)}</g>`,
  golf: () => bg('golf', '#9AD8F0', '#E3F5FB') + path('M0 100 Q100 60 200 100 T400 90 V150 H0Z', '#6FC27A') + path('M0 120 Q120 90 240 120 T400 112 V150 H0Z', '#3E9D58')
    + line(120, 40, 120, 112, '#F3F3F3', 3) + poly('120,40 160,52 120,64', '#E5484D') + circ(120, 114, 7, '#1F5E34') + circ(215, 126, 6, '#fff') + circ(213, 124, 2, '#E0E0E0') + cloud(300, 40, 1) + cloud(60, 36, .8),
  shoe: () => bg('shoe', '#1F4E9C', '#4C86D8') + circ(340, 28, 40, '#fff', .08) + circ(60, 120, 50, '#fff', .07)
    + `<g transform="translate(90 52)">${path('M0 60 L8 8 Q12 0 24 4 L50 20 Q70 24 105 40 Q125 48 122 62 Z', '#fff')}${path('M0 60 L122 62 L122 72 L0 72Z', '#E7ECF5')}${path('M30 36 L84 52 L80 60 L28 48Z', '#E5484D')}${line(44, 24, 52, 30, '#1F4E9C', 3)}${line(54, 28, 62, 34, '#1F4E9C', 3)}${line(64, 32, 72, 38, '#1F4E9C', 3)}</g>`
    + line(0, 140, W, 140, '#fff', 2) + line(0, 148, W, 148, '#fff', 1),
  grill: () => bg('grill', '#3A1414', '#8A2A1F') + rect(60, 88, 280, 14, '#2A2A2A', 3) + Array.from({ length: 15 }, (_, i) => line(70 + i * 18, 88, 70 + i * 18, 102, '#555', 2)).join('')
    + [[120, 60], [190, 54], [260, 62]].map(([x, y], i) => path(`M${x - 20} ${y + 28} q-14 -22 6 -34 q-2 16 12 14 q-4 -18 10 -30 q8 22 22 22 q10 14 -4 28Z`, i % 2 ? '#FF8A1F' : '#FF5A1F', 'opacity=".95"') + path(`M${x - 8} ${y + 28} q-4 -12 6 -18 q6 8 10 18Z`, '#FFD04D')).join('')
    + [[110, 80], [150, 82], [200, 80], [245, 82], [285, 80]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="17" ry="7" fill="${i % 2 ? '#C93C3C' : '#E05A4F'}"/><path d="M${x - 11} ${y} q10 -4 22 0" stroke="#F7B3A8" stroke-width="2" fill="none"/>`).join('')
    + rect(0, 118, W, 32, '#1B0C0C'),
  poke: () => bg('poke', '#F36B5C', '#FFD7A8') + circ(200, 75, 62, '#fff') + path('M138 75 A62 62 0 0 1 262 75 Z', '#E5333F') + rect(138, 71, 124, 8, '#2B2B2B') + circ(200, 75, 20, '#2B2B2B') + circ(200, 75, 13, '#fff') + circ(200, 75, 6, '#E8E8E8')
    + circ(60, 40, 8, '#fff', .6) + circ(340, 110, 12, '#fff', .5) + circ(330, 30, 5, '#FFE08A') + circ(70, 120, 6, '#FFE08A'),
  torii: () => bg('torii', '#FFD2A1', '#FFF2DE') + path('M0 110 L90 40 L170 100 L250 36 L330 96 L400 60 V150 H0Z', '#7FAE6E', 'opacity=".75"')
    + [[200, 1.0], [200, .78], [200, .6], [200, .46], [200, .36]].map(([x, s], i) => {
      const w = 130 * s, h = 120 * s, top = 150 - h - 6 + (1 - s) * 40, f = ['#D8412F', '#E4533F', '#EE6B52', '#F58A6C', '#F9A88B'][i];
      return `<g>${rect(x - w / 2, top, w, 8 * s + 3, '#2B1D1A', 2)}${rect(x - w / 2 - 8 * s, top - 6 * s, w + 16 * s, 8 * s + 2, f, 2)}${rect(x - w / 2 + 10 * s, top + 22 * s, w - 20 * s, 7 * s + 2, f)}${rect(x - w / 2 + 12 * s, top + 8 * s, 10 * s + 2, h, f)}${rect(x + w / 2 - 22 * s - 2, top + 8 * s, 10 * s + 2, h, f)}</g>`;
    }).reverse().join('') + rect(0, 140, W, 10, '#C9B497'),
  unagi: () => bg('unagi', '#F0D9B5', '#E3B87A') + `<ellipse cx="200" cy="112" rx="96" ry="12" fill="#7A3B21" opacity=".25"/>` + path('M104 78 H296 Q292 128 200 128 Q108 128 104 78Z', '#7A2E1C') + rect(98, 72, 204, 10, '#B5442C', 4)
    + `<ellipse cx="200" cy="74" rx="96" ry="12" fill="#FFF8EA"/>` + path('M120 72 q40 -22 80 -10 t80 10 q-20 12 -80 10 t-80 -10Z', '#7C3A1B') + path('M130 70 q40 -16 74 -8', 'none', 'stroke="#C0702E" stroke-width="3" stroke-linecap="round"')
    + circ(250, 66, 3, '#2E7D4F') + circ(262, 70, 3, '#2E7D4F') + steam(200, 52, '#fff'),
  market: () => bg('market', '#F9C77B', '#FBE6C2') + [0, 1, 2, 3, 4, 5, 6].map(i => `<g transform="translate(${28 + i * 55} 14)">${line(0, -14, 0, 4, '#6B4A2A', 2)}${rect(-9, 4, 18, 30, i % 2 ? '#E5484D' : '#F26B38', 8)}${rect(-5, 34, 10, 3, '#6B4A2A', 1)}${line(-5, 14, 5, 14, '#FFD9B0', 1.5)}</g>`).join('')
    + rect(0, 96, W, 54, '#C99863') + Array.from({ length: 8 }, (_, i) => poly(`${i * 50},96 ${i * 50 + 50},96 ${i * 50 + 44},74 ${i * 50 + 6},74`, i % 2 ? '#fff' : '#D95B43')).join('')
    + [[40, 118], [110, 120], [180, 118], [250, 120], [320, 118]].map(([x, y], i) => circ(x + 6, y, 9, ['#F4B13E', '#E86A6A', '#8BC27A', '#F4D35E', '#C98BD8'][i]) + circ(x + 26, y + 4, 8, ['#E86A6A', '#F4B13E', '#F4D35E', '#8BC27A', '#F4B13E'][i])).join(''),
  temple: () => bg('temple', '#42306B', '#F08A5A') + circ(320, 36, 16, '#FFF1C9') + path('M0 118 Q100 96 200 118 T400 112 V150 H0Z', '#2D2145')
    + `<g transform="translate(130 28)">${path('M-14 40 Q70 -2 154 40 L140 48 Q70 12 0 48Z', '#2B2036')}${path('M10 60 Q70 30 130 60 L122 68 Q70 44 18 68Z', '#2B2036')}${rect(18, 66, 104, 40, '#7C4A2E')}${rect(26, 74, 16, 32, '#FFD97A')}${rect(52, 74, 16, 32, '#FFD97A')}${rect(78, 74, 16, 32, '#FFD97A')}${rect(104, 74, 12, 32, '#FFD97A')}${rect(8, 104, 124, 6, '#2B2036')}</g>`
    + [[40, 62], [86, 96], [320, 80], [370, 108], [260, 50], [60, 30]].map(([x, y], i) => leaf(x, y, i * 40, i % 2 ? '#E0452E' : '#F2742C')).join('')
    + [[110, 100], [300, 100]].map(([x, y]) => rect(x - 5, y, 10, 16, '#FF9F45', 3) + circ(x, y + 8, 14, '#FFB765', .25)).join(''),
  pot: () => bg('pot', '#4A2420', '#9B4B33') + `<ellipse cx="200" cy="124" rx="130" ry="14" fill="#2A1210" opacity=".6"/>` + path('M96 82 H304 Q300 126 200 126 Q100 126 96 82Z', '#232323') + rect(88, 76, 224, 10, '#3A3A3A', 5)
    + `<ellipse cx="200" cy="80" rx="100" ry="14" fill="#B8602F"/>` + [[150, 78], [190, 82], [235, 78], [265, 82]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="22" ry="7" fill="${i % 2 ? '#E26A5C' : '#F08C7A'}"/>`).join('')
    + circ(215, 70, 7, '#F5E3A8') + path('M168 64 q10 -10 22 0', 'none', 'stroke="#4CA06B" stroke-width="5" stroke-linecap="round"') + steam(200, 56, '#fff')
    + line(320, 40, 280, 100, '#D8B88A', 3) + line(332, 44, 292, 104, '#D8B88A', 3),
  train: () => bg('train', '#BFD8EE', '#E9F2FA') + rect(0, 116, W, 34, '#4A5568') + rect(0, 112, W, 4, '#9AA6B5') + Array.from({ length: 20 }, (_, i) => rect(i * 22 + 4, 134, 10, 4, '#2D3748')).join('')
    + rect(30, 48, 340, 64, '#F2F4F7', 10) + rect(30, 86, 340, 8, '#E5171F') + rect(30, 100, 340, 4, '#2B6EA8')
    + Array.from({ length: 6 }, (_, i) => rect(54 + i * 52, 58, 38, 22, '#6AA8D8', 4)).join('') + rect(344, 58, 20, 28, '#6AA8D8', 4)
    + circ(60, 118, 7, '#2D3748') + circ(110, 118, 7, '#2D3748') + circ(290, 118, 7, '#2D3748') + circ(340, 118, 7, '#2D3748') + cloud(80, 26, 1) + cloud(300, 30, .9),
  shrine: () => bg('shrine', '#BFE3D0', '#F0F8F2') + circ(330, 34, 14, '#FFF6D0') + path('M0 118 Q120 88 240 116 T400 104 V150 H0Z', '#5FA77A')
    + [[40, 90], [70, 100], [330, 94], [360, 104]].map(([x, y]) => poly(`${x},${y - 46} ${x - 16},${y + 6} ${x + 16},${y + 6}`, '#2F7D4F') + poly(`${x},${y - 30} ${x - 20},${y + 20} ${x + 20},${y + 20}`, '#3E9462') + rect(x - 2, y + 20, 4, 12, '#6B4A2A')).join('')
    + `<g transform="translate(130 30)">${path('M-10 38 Q70 -8 150 38 L138 46 Q70 6 2 46Z', '#6A5A4A')}${rect(14, 44, 112, 46, '#F3EEE4')}${rect(14, 44, 112, 5, '#B5442C')}${rect(60, 56, 20, 34, '#7C4A2E')}${rect(8, 88, 124, 6, '#9E8E78')}${rect(0, 94, 140, 5, '#B8AA94')}</g>`,
  bags: () => bg('bags', '#FFD6A8', '#FCEBD6') + [[70, 60, '#E5484D', 52], [150, 74, '#2B6EA8', 44], [225, 56, '#F2B63D', 56], [305, 76, '#3E9D58', 44]].map(([x, y, f, h]) => rect(x, y, 56, h + 30, f, 6) + path(`M${x + 14} ${y} q14 -26 28 0`, 'none', `stroke="${f}" stroke-width="5"`) + rect(x + 10, y + 18, 36, 5, '#fff', 2, .55)).join('')
    + rect(0, 138, W, 12, '#E9C79C') + circ(360, 28, 12, '#fff', .7) + circ(36, 36, 8, '#fff', .6),
  steak: () => bg('steak', '#3B2A1E', '#7A4A2A') + `<ellipse cx="200" cy="100" rx="130" ry="32" fill="#F4F1EA"/><ellipse cx="200" cy="98" rx="104" ry="24" fill="#E6E1D6"/>`
    + [[160, 92], [200, 88], [240, 94]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="30" ry="12" transform="rotate(${i * 8 - 8} ${x} ${y})" fill="#7A3524"/><ellipse cx="${x}" cy="${y - 3}" rx="22" ry="6" transform="rotate(${i * 8 - 8} ${x} ${y})" fill="#E26B5C"/>`).join('')
    + line(180, 98, 230, 94, '#fff', 1) + circ(272, 90, 6, '#4CA06B') + circ(282, 94, 5, '#4CA06B') + steam(200, 58, '#fff'),
  suitcase: () => bg('suitcase', '#CFE3F5', '#F1F7FC') + rect(0, 128, W, 22, '#B9C9D9')
    + `<g transform="translate(150 24)">${path('M30 0 h40 q6 0 6 6 v10 h-8 v-8 h-36 v8 h-8 v-10 q0 -6 6 -6Z', '#4A5568')}${rect(0, 18, 100, 92, '#2B6EA8', 12)}${rect(14, 18, 8, 92, '#1F5282')}${rect(78, 18, 8, 92, '#1F5282')}${rect(34, 44, 32, 22, '#F2B63D', 4)}${circ(20, 114, 7, '#2D3748')}${circ(80, 114, 7, '#2D3748')}</g>`
    + `<g transform="translate(290 54)">${rect(0, 0, 54, 74, '#E5484D', 8)}${path('M14 0 q13 -20 26 0', 'none', 'stroke="#E5484D" stroke-width="5"')}${rect(10, 18, 34, 5, '#fff', 2, .6)}</g>` + cloud(70, 40, 1) + cloud(340, 24, .8),
};
const ALIAS = { airport2: 'plane' };

export function cover(scene, h = 90) {
  const fn = SCENES[ALIAS[scene] || scene] || SCENES.bags;
  return `<svg class="cov" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" style="height:${h}px" aria-hidden="true" focusable="false">${fn()}</svg>`;
}
export const SCENE_NAMES = Object.keys(SCENES);
