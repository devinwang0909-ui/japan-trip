// 景點旁的小圖示（寶可夢沒有 emoji，用向量寶貝球）。給了真實照片的景點（trip.js 的 photo 欄位）會改顯示照片。
const EMOJI = {
  plane: '✈️', hotel: '🏨', ginkgo: '🍂', store: '👜', golf: '⛳', shoe: '👟', grill: '🍖', poke: '<svg viewBox="0 0 24 24" width="1em" height="1em" style="vertical-align:-0.12em"><circle cx="12" cy="12" r="10.5" fill="#fff" stroke="#2B2B2B" stroke-width="2"/><path d="M1.5 12a10.5 10.5 0 0 1 21 0z" fill="#E5333F" stroke="#2B2B2B" stroke-width="2" stroke-linejoin="round"/><line x1="1.5" y1="12" x2="22.5" y2="12" stroke="#2B2B2B" stroke-width="2"/><circle cx="12" cy="12" r="3.6" fill="#fff" stroke="#2B2B2B" stroke-width="2"/></svg>',
  torii: '⛩️', unagi: '🍱', market: '🏮', temple: '🍁', pot: '🍲', train: '🚆', shrine: '⛩️', bags: '🛍️', steak: '🥩', suitcase: '🧳',
};
export const emojiOf = (scene) => EMOJI[scene] || '📍';
export function photoBanner(src) {
  return `<img class="cov" src="${src}" alt="" loading="lazy" style="aspect-ratio:2/1;height:auto;object-fit:cover">`;
}
