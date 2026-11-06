// 景點旁的小圖示。給了真實照片的景點（trip.js 的 photo 欄位）會改顯示照片。
const EMOJI = {
  plane: '✈️', hotel: '🏨', ginkgo: '🍂', store: '👜', golf: '⛳', shoe: '👟', grill: '🍖', poke: '🎮',
  torii: '⛩️', unagi: '🍱', market: '🏮', temple: '🍁', pot: '🍲', train: '🚆', shrine: '⛩️', bags: '🛍️', steak: '🥩', suitcase: '🧳',
};
export const emojiOf = (scene) => EMOJI[scene] || '📍';
export function photoBanner(src, h = 110) {
  return `<img class="cov" src="${src}" alt="" loading="lazy" style="height:${h}px;object-fit:cover">`;
}
