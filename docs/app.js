import { createData } from './data.js';
import { DAY_CITY } from './trip.js';
(() => {
const DAYS = ['2026-11-11','2026-11-12','2026-11-13','2026-11-14'];
const DOW = ['日','一','二','三','四','五','六'];
const ONTIME_MIN = 15;              // 隨機拍：開放後幾分鐘內算準時
const S = {tab:'plan', day:null, stops:[], info:null, weather:{}, photos:[], uid:null,
  canWrite:true, db:null, ready:false, stale:false, sheet:null, pending:null, full:{}};

/* ---------- utils ---------- */
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ls = {get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}},
            set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const fmtJ = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
function jst(d=new Date()){const p=Object.fromEntries(fmtJ.formatToParts(d).map(x=>[x.type,x.value]));const h=(+p.hour)%24;return{date:`${p.year}-${p.month}-${p.day}`,min:h*60+(+p.minute)}}
const dowOf = date => new Date(date+'T12:00:00+09:00').getUTCDay();
const toMin = t => {if(!t)return null;const m=/^(\d{1,2}):(\d{2})/.exec(t);return m?(+m[1])*60+(+m[2]):null};
const hm = m => `${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const md = d => d.slice(5).replace('-','/');
function toast(msg,ms=2600){const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),ms)}
function vib(p){try{navigator.vibrate&&navigator.vibrate(p)}catch{}}
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* 隨機拍時間：同一天全家相同；08:30–21:30 之間，彼此至少間隔 100 分鐘 */
function flashSlots(date){
  const r=rng(hash(date+'|flash-v1'));let out=[];
  for(let tries=0;tries<500&&out.length<3;tries++){
    const t=510+Math.floor(r()*(1290-510));
    if(out.every(x=>Math.abs(x-t)>=100)) out.push(t);
  }
  return out.sort((a,b)=>a-b);
}

/* ---------- icons ---------- */
const I = {
  map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
  car:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 16V11l2-5h10l2 5v5z"/><circle cx="8" cy="16" r="2"/><circle cx="16" cy="16" r="2"/></svg>',
  cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M8 6l2-3h4l2 3"/><circle cx="12" cy="13" r="3.5"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
  x:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
};
function wxIcon(code){
  const sun='<circle cx="22" cy="22" r="8" fill="#F2B233"/>';
  const cloud=(y=0,c='#9AA8BC')=>`<path d="M14 ${34+y}h20a7 7 0 0 0 0-14 10 10 0 0 0-19 2 6 6 0 0 0-1 12z" fill="${c}"/>`;
  let body;
  if(code==null) body=cloud();
  else if(code<=1) body=sun;
  else if(code<=3) body=`<g transform="translate(-4,-6)">${sun}</g>`+cloud(4);
  else if(code<=48) body=cloud(0,'#B5BFCC');
  else if(code<=67||code>=80&&code<=82) body=cloud(-4)+'<path d="M18 38l-2 5M25 38l-2 5M32 38l-2 5" stroke="#3B7BD8" stroke-width="2.5" stroke-linecap="round"/>';
  else if(code<=77||code>=85&&code<=86) body=cloud(-4)+'<g fill="#7FA9E0"><circle cx="18" cy="41" r="2"/><circle cx="25" cy="43" r="2"/><circle cx="32" cy="41" r="2"/></g>';
  else body=cloud(-4,'#7D8899')+'<path d="M25 36l-4 7h5l-3 6" stroke="#F2B233" stroke-width="2.5" fill="none" stroke-linejoin="round"/>';
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${body}</svg>`;
}
function wxText(c){if(c==null)return'';if(c===0)return'晴';if(c<=2)return'晴時多雲';if(c===3)return'陰';if(c<=48)return'霧';if(c<=57)return'毛毛雨';if(c<=67)return'雨';if(c<=77)return'雪';if(c<=82)return'陣雨';if(c<=86)return'陣雪';return'雷雨'}

/* ---------- links ---------- */
function place(s){ if(s&&s.lat!=null&&s.lng!=null) return `${s.lat},${s.lng}`; return [s?.nameJa||s?.name, s?.addressJa||s?.address].filter(Boolean).join(' ') }
function gmaps(dest, origin, mode='transit'){
  const u=new URL('https://www.google.com/maps/dir/');u.searchParams.set('api','1');
  if(origin) u.searchParams.set('origin',place(origin));
  u.searchParams.set('destination',place(dest));u.searchParams.set('travelmode',mode);
  return u.toString();
}
function gplace(s){ if(s.mapsUrl) return s.mapsUrl; const u=new URL('https://www.google.com/maps/search/');u.searchParams.set('api','1');u.searchParams.set('query',place(s));return u.toString() }
function uber(dest, origin){
  const p=new URLSearchParams();p.set('action','setPickup');
  if(origin&&origin.lat!=null){p.set('pickup[latitude]',origin.lat);p.set('pickup[longitude]',origin.lng);p.set('pickup[nickname]',origin.nameJa||origin.name||'');if(origin.addressJa||origin.address)p.set('pickup[formatted_address]',origin.addressJa||origin.address)}
  else p.set('pickup','my_location');
  if(dest.lat!=null){p.set('dropoff[latitude]',dest.lat);p.set('dropoff[longitude]',dest.lng)}
  p.set('dropoff[nickname]',dest.nameJa||dest.name||'');
  if(dest.addressJa||dest.address)p.set('dropoff[formatted_address]',dest.addressJa||dest.address);
  return 'https://m.uber.com/ul/?'+p.toString();
}

/* ---------- data helpers ---------- */
const sorted = day => S.stops.filter(s=>s.day===day).sort((a,b)=>(a.order??0)-(b.order??0));
const prevOf = s => { if(s.noPrev) return null; const l=sorted(s.day);const i=l.findIndex(x=>x.id===s.id);return i>0?l[i-1]:(i===0?hotelFor(s.day):null) };
function hotelFor(day){const hs=S.info?.hotels||[];return hs.find(h=>(!h.from||h.from<=day)&&(!h.to||day<h.to))||hs[0]||null}
function hoursState(s, now){
  const h=s.hours||{}; const res={};
  const dw=dowOf(s.day);
  if(Array.isArray(h.closedDays)&&h.closedDays.includes(dw)) return {kind:'off',text:'當天公休'};
  const o=toMin(h.open); let c=toMin(h.lastEntry)??toMin(h.close);
  if(c==null) return null;
  if(o!=null&&c<=o) c+=1440;
  const word = h.lastEntry?'最後入場':'打烊';
  if(!now||now.date!==s.day) return {kind:'info',text:`${word} ${hm(c)}`};
  const left=c-now.min;
  if(left<=0) return {kind:'off',text:`已過${word}時間 ${hm(c)}`};
  if(left<=60) return {kind:'soon',text:`${left} 分鐘後${word}（${hm(c)}）`,left};
  if(o!=null&&now.min<o) return {kind:'info',text:`${hm(o)} 開門`};
  return {kind:'open',text:`${word} ${hm(c)}`};
}
function photoKeyFor(uid,key){return `${uid}__${key}`.replace(/[^A-Za-z0-9_\-.~:@+]/g,'_')}
const myPhoto = key => S.photos.find(p=>p.uid===S.uid&&p.key===key);

/* ---------- rendering ---------- */
function renderDays(){
  const now=jst();
  $('#days').innerHTML=DAYS.map((d,i)=>`<button class="day${d===now.date?' today':''}" data-day="${d}" aria-pressed="${d===S.day}"><b>${md(d)}</b><small>Day ${i+1}・${DOW[dowOf(d)]}</small></button>`).join('');
  $('#days').hidden = S.tab!=='plan';
}
function render(){
  renderDays();
  document.querySelectorAll('.tab[data-tab]').forEach(t=>t.setAttribute('aria-current',t.dataset.tab===S.tab?'page':'false'));
  const v=$('#view');
  if(S.tab==='plan') v.innerHTML=viewPlan();
  else if(S.tab==='album') v.innerHTML=viewAlbum();
  else v.innerHTML=viewSOS();
  if(S.sheet) renderSheet();
}

function viewPlan(){
  const now=jst(); const day=S.day; const list=sorted(day);
  const out=[];
  if(!S.ready&&!S.stops.length) out.push(`<div class="status">載入行程中…</div>`);
  if(S.stale) out.push(`<div class="banner info">目前連不上資料庫，顯示的是這支手機上次存下的行程。</div>`);
  // alerts for next stop
  const isToday = day===now.date;
  const nxt = isToday ? list.find(s=>!s.visited) : null;
  if(nxt){
    const st=hoursState(nxt,now);
    if(st&&st.kind==='soon') out.push(`<div class="banner warn" role="alert"><div><b>下一站「${esc(nxt.name)}」快打烊了</b>${esc(st.text)}。現在出發可能來不及，考慮先改去別站。</div></div>`);
    if(st&&st.kind==='off') out.push(`<div class="banner bad" role="alert"><div><b>「${esc(nxt.name)}」${esc(st.text)}</b>可以跳過這站，或在行程裡把它標為已去過。</div></div>`);
  }
  out.push(viewFlash(day,now));
  out.push(viewWeather(day));
  if(nxt) out.push(viewNext(nxt,now));
  else if(now.date<DAYS[0] && day===DAYS[0] && list[0]){
    const days=Math.round((Date.parse(DAYS[0]+'T00:00:00+09:00')-Date.now())/864e5);
    out.push(`<div class="card next"><div class="label">還有 ${Math.max(days,0)} 天出發</div><h2>第一站：${esc(list[0].name)}</h2><div class="note">出發當天這裡會顯示「下一站」怎麼去。</div></div>`);
  }
  // timeline
  if(!list.length){
    out.push(`<div class="empty"><h3>${md(day)} 還沒有行程</h3><p>行程排好後會按時間列在這裡。<br>想臨時加一個地方，點下方「新增景點」。</p></div>`);
  } else {
    const tl=[];
    const hotel=hotelFor(day);
    list.forEach((s,i)=>{
      if(s.transit) tl.push(legRow(s));
      const st=hoursState(s,isToday?now:null);
      const ph=S.photos.filter(p=>p.key==='s-'+s.id).length;
      tl.push(`<button class="stop${s.visited?' visited':''}${s.kind==='added'?' added':''}" data-open="${esc(s.id)}">
        <div class="time">${esc(s.time||'')}</div>
        <div class="body">
          <h3>${esc(s.name)}</h3>
          ${s.nameJa?`<div class="note">${esc(s.nameJa)}</div>`:''}
          <div class="meta">
            ${s.visited?`<span class="pill go">已抵達</span>`:''}
            ${s.kind==='added'?`<span class="pill ai">臨時加入</span>`:''}
            ${st?`<span class="pill ${st.kind==='soon'?'warn':st.kind==='off'?'bad':'ai'}">${esc(st.text)}</span>`:''}
            ${s.price?`<span>${esc(s.price)}</span>`:''}
            ${ph?`<span>${ph} 張照片</span>`:''}
          </div>
        </div></button>`);
    });
    if(hotel) tl.push(`<div class="leg"><div class="rail"></div><div class="what">回到住宿：${esc(hotel.name)}</div></div>`);
    out.push(`<div><div class="label" style="margin-bottom:8px">${md(day)}（${DOW[dowOf(day)]}）行程</div><div class="tl">${tl.join('')}</div></div>`);
  }
  return out.join('');
}
function legRow(s){
  const t=s.transit; const chips=[];
  (t.legs||[]).forEach(l=>{
    if(l.type==='walk') chips.push(`<span class="chip plain">步行 ${l.minutes?l.minutes+' 分':''}</span>`);
    else if(l.type==='taxi') chips.push(`<span class="chip plain">計程車 ${l.minutes?l.minutes+' 分':''}</span>`);
    else chips.push(`<span class="chip" style="--c:${esc(l.color||'#777')}"><i>${esc(l.code||'')}</i>${esc(l.line||'')}</span>`);
  });
  if(!chips.length&&t.summary) chips.push(`<span>${esc(t.summary)}</span>`);
  return `<div class="leg"><div class="rail"></div><div class="what">${chips.join('')}${t.minutes?`<span class="mono">約 ${t.minutes} 分</span>`:''}${t.fare?`<span class="mono">${esc(t.fare)}</span>`:''}</div></div>`;
}
function viewNext(s,now){
  const prev=prevOf(s); const st=hoursState(s,now);
  const t=s.transit;
  return `<div class="card next">
    <div class="label">下一站</div>
    <h2>${esc(s.name)}</h2>${s.nameJa?`<div class="ja">${esc(s.nameJa)}</div>`:''}
    <div class="meta row" style="margin:6px 0 10px">
      ${s.time?`<span class="pill ai mono">預計 ${esc(s.time)}</span>`:''}
      ${st?`<span class="pill ${st.kind==='soon'?'warn':st.kind==='off'?'bad':'go'}">${esc(st.text)}</span>`:''}
    </div>
    ${t?`<div class="note" style="margin-bottom:10px">${esc(t.summary||'')}${t.exit?`・出口：<b>${esc(t.exit)}</b>`:''}</div>`:''}
    <div class="btns three">
      <a class="btn primary" href="${esc(gmaps(s))}" target="_blank" rel="noopener">${I.map}導航</a>
      <a class="btn" href="${esc(uber(s))}" target="_blank" rel="noopener">${I.car}Uber</a>
      <button class="btn" data-open="${esc(s.id)}">怎麼去</button>
    </div></div>`;
}
function viewWeather(day){
  const w=S.weather[day];
  const city=w?.city||S.info?.city||'';
  const q=encodeURIComponent((city||'日本')+' 天氣');
  if(!w) return `<div class="card"><div class="row"><div class="grow"><div class="label">${md(day)} 天氣</div><div class="note">每天早上自動更新；出發前 7 天內才會有預報。</div></div><a class="btn" href="https://www.google.com/search?q=${q}" target="_blank" rel="noopener">查看</a></div></div>`;
  const hrs=(w.hourly||[]).map(h=>`<div>${esc(h.h)}<b>${Math.round(h.t)}°</b>${h.pop!=null?h.pop+'%':''}</div>`).join('');
  return `<div class="card"><div class="wx">${wxIcon(w.code)}
    <div class="grow"><div class="label">${esc(city)} ${md(day)} 天氣</div>
    <div class="t">${Math.round(w.tmax)}°<span> / ${Math.round(w.tmin)}°</span></div>
    <div class="note">${esc(w.summary||wxText(w.code))}${w.pop!=null?`・降雨機率 ${w.pop}%`:''}</div></div></div>
    ${hrs?`<div class="hours">${hrs}</div>`:''}
    <div class="note" style="margin-top:8px;font-size:11px">更新於 ${esc(w.updatedAt||'')}</div></div>`;
}
function viewFlash(day,now){
  const slots=flashSlots(day);
  const isToday=now.date===day;
  const before=now.date<day, after=now.date>day;
  let active=false;
  const cells=slots.map((t,i)=>{
    const key=`r-${day}-${i+1}`; const mine=myPhoto(key);
    const opened = after || (isToday&&now.min>=t);
    if(mine) return `<div class="slot done"><b>${hm(t)}</b>已拍${mine.late?'（遲到）':''}</div>`;
    if(!opened) return `<div class="slot"><b>??:??</b>第 ${i+1} 次</div>`;
    if(after) return `<div class="slot"><b>${hm(t)}</b>錯過了</div>`;
    const left=t+ONTIME_MIN-now.min; active=true;
    return `<div class="slot open"><b>${hm(t)}</b>${left>0?`還剩 ${left} 分`:'遲到也能拍'}</div>`;
  }).join('');
  const openIdx=slots.findIndex((t,i)=>isToday&&now.min>=t&&!myPhoto(`r-${day}-${i+1}`));
  const total=S.photos.filter(p=>p.kind==='random'&&p.day===day).length;
  return `<div class="card flashcard${active?'':' idle'}">
    <div class="row"><div class="grow"><div class="label">隨機拍・每天 3 次</div>
    <div style="font-weight:700">${active?'現在是拍照時間！全家一起拍':before?'旅途中每天會隨機跳出 3 次，全家同一時間拍':'下一次時間保密，打開網頁時會提醒'}</div></div>
    ${openIdx>=0?`<button class="btn" style="background:var(--flash-ink);color:var(--flash);border:0" data-shoot="r-${day}-${openIdx+1}">${I.cam}拍</button>`:''}</div>
    <div class="slots">${cells}</div>
    ${total?`<div class="note" style="margin-top:8px;color:inherit;opacity:.75">今天全家已拍 ${total} 張</div>`:''}
  </div>`;
}

function viewAlbum(){
  const out=[];
  const mine=S.photos.filter(p=>p.uid===S.uid).length;
  out.push(`<div class="card"><div class="row"><div class="grow"><h2 style="font-size:20px">旅行相簿</h2><div class="note">全家共 ${S.photos.length} 張，你（${esc(S.uid||'未命名')}）拍了 ${mine} 張。<button class="btn ghost" style="min-height:28px;padding:2px 8px;font-size:12px" data-rename="1">改名</button></div></div></div>
    <div class="btns" style="margin-top:10px"><button class="btn primary" data-act="export-all" ${S.photos.length?'':'disabled'}>匯出全家相簿</button><button class="btn" data-act="export-mine" ${mine?'':'disabled'}>只匯出我的</button></div>
    <div class="note" style="margin-top:8px">匯出成 ZIP：照片按天分資料夾，附一個可以用瀏覽器打開的相簿頁。</div></div>`);
  if(!S.photos.length) out.push(`<div class="empty"><h3>還沒有照片</h3><p>到了景點，打開那一站點「打卡拍照」。<br>每人每個景點一張，另外每天有 3 次隨機拍。</p></div>`);
  DAYS.forEach((d,i)=>{
    const ps=S.photos.filter(p=>p.day===d); if(!ps.length) return;
    const groups=[];
    sorted(d).forEach(s=>{const g=ps.filter(p=>p.key==='s-'+s.id);if(g.length)groups.push([s.name,g])});
    const orphan=ps.filter(p=>p.kind==='spot'&&!S.stops.some(s=>'s-'+s.id===p.key));
    if(orphan.length) groups.push(['其他景點',orphan]);
    flashSlots(d).forEach((t,k)=>{const g=ps.filter(p=>p.key===`r-${d}-${k+1}`);if(g.length)groups.push([`隨機拍 ${hm(t)}`,g])});
    out.push(`<section class="album-day"><h2>Day ${i+1}<small>${md(d)}（${DOW[dowOf(d)]}）</small></h2>${groups.map(([t,g])=>`<div class="astop"><div class="t">${esc(t)}</div><div class="pgrid">${g.map(thumb).join('')}</div></div>`).join('')}</section>`);
  });
  return out.join('');
}
const who = uid => uid||'家人';
function thumb(p){return `<button class="ph" data-view="${esc(p.id)}"><img loading="lazy" src="${esc(p.thumb||'')}" alt="${esc(who(p.uid))} 拍的照片"><span>${esc(who(p.uid))}</span>${p.late?'<span class="late">遲到</span>':''}</button>`}

function viewSOS(){
  const hs=S.info?.hotels||[];
  const hotelCards = hs.length ? hs.map(h=>`<div class="taxi">
      <div class="label">給計程車司機看・住宿</div>
      <div class="jp">${esc(h.nameJa||h.name)}</div>
      <div style="font-size:18px">${esc(h.addressJa||h.address||'')}</div>
      <div class="jp" style="font-size:18px">ここまでお願いします。</div>
      ${h.phone?`<div class="mono">TEL ${esc(h.phone)}</div>`:''}
      <div class="note">${esc(h.name)}${h.from?`・${md(h.from)}–${md(h.to||h.from)}`:''}</div>
      <div class="btns"><a class="btn" href="${esc(gmaps(h))}" target="_blank" rel="noopener">${I.map}回飯店</a><a class="btn" href="${esc(uber(h))}" target="_blank" rel="noopener">${I.car}Uber 回飯店</a></div>
    </div>`).join('') : `<div class="empty"><h3>住宿資料待補</h3><p>行程匯入後，這裡會有飯店的日文名稱和地址，可以直接拿給司機看。</p></div>`;
  const ph=(name,num,sub)=>`<div class="phone"><div class="grow"><div>${name}</div>${sub?`<div class="note">${sub}</div>`:''}</div><span class="n">${num}</span><button class="btn" data-copy="${esc(num)}">複製</button></div>`;
  return `
  <div class="sosgrid">
    <div class="card"><div class="label">報警</div><div class="big">110</div><div class="note">警察（日語）</div></div>
    <div class="card"><div class="label">救護車・火災</div><div class="big">119</div><div class="note">說「救急車」或「火事」</div></div>
  </div>
  ${hotelCards}
  <div class="card"><div class="label">緊急電話（在日本用手機直撥）</div>
    ${ph('駐日代表處 緊急聯絡（東京）','080-1009-7179','被捕、重大犯罪受害、緊急就醫等危及安全時使用')}
    ${ph('駐日代表處 緊急聯絡（東京）備用','080-1009-7436','')}
    ${ph('駐大阪辦事處 緊急聯絡','090-8794-4568','京都、大阪、兵庫等關西地區')}
    ${ph('駐日代表處 上班時間','03-3280-7811','護照遺失、一般領務')}
    ${ph('日本觀光局訪日旅客熱線','050-3816-2787','24 小時，有中文、英文')}
    ${ph('急病諮詢（要不要叫救護車）','#7119','東京、大阪等地適用')}
  </div>
  <div class="card"><div class="label">護照或錢包不見了</div>
    <ol style="margin:6px 0 0;padding-left:20px;font-size:14px">
      <li>到最近的警察局（交番）報案，拿「遺失届出証明」或「盗難届出受理番号」。</li>
      <li>護照遺失：帶報案證明和 2 吋照片到代表處辦「入國證明書」。</li>
      <li>信用卡：立刻打發卡銀行電話掛失（卡片背面）。</li>
    </ol></div>
  <p class="note">電話號碼來源：外交部領事事務局。出發前建議再到官網確認一次。</p>`;
}

/* ---------- sheets ---------- */
function openSheet(s){S.sheet=s;renderSheet()}
function closeSheet(){S.sheet=null;$('#layer').innerHTML='';document.body.style.overflow=''}
function renderSheet(){
  const sh=S.sheet; if(!sh){return}
  let inner='';
  if(sh.type==='stop'){const s=S.stops.find(x=>x.id===sh.id); if(!s){closeSheet();return} inner=sheetStop(s)}
  else if(sh.type==='form') inner=sheetForm(sh);
  else if(sh.type==='photo'){const p=S.photos.find(x=>x.id===sh.id); if(!p){closeSheet();return}
    if(!S.full[p.id]&&S.db){S.full[p.id]='loading';S.db.getFull(p.id).then(u=>{S.full[p.id]=u||p.thumb;if(S.sheet?.id===p.id)renderSheet()}).catch(()=>{S.full[p.id]=p.thumb;renderSheet()})}
    const fu=S.full[p.id]&&S.full[p.id]!=='loading'?S.full[p.id]:p.thumb;
    $('#layer').innerHTML=`<div class="lightbox" data-act="close"><img src="${esc(fu||'')}" alt=""><div>${esc(who(p.uid))}・${esc(new Date(p.takenAt).toLocaleString('zh-TW',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}))}${p.late?'・遲到':''}</div><button class="btn" data-act="close">關閉</button></div>`;return}
  const keepScroll=$('#layer .sheet')?.scrollTop;
  $('#layer').innerHTML=`<div class="scrim" data-act="close"></div><div class="sheet" role="dialog" aria-modal="true">${inner}</div>`;
  if(keepScroll) $('#layer .sheet').scrollTop=keepScroll;
  document.body.style.overflow='hidden';
}
function sheetStop(s){
  const prev=prevOf(s); const now=jst(); const st=hoursState(s,now);
  const t=s.transit||null; const h=s.hours||{};
  const key='s-'+s.id; const mine=myPhoto(key);
  const all=S.photos.filter(p=>p.key===key);
  const route = t ? `
    <div class="card"><div class="label" style="margin-bottom:8px">怎麼去${prev?`（從 ${esc(prev.name)}）`:''}</div>
      ${t.summary?`<p style="margin:0 0 10px">${esc(t.summary)}</p>`:''}
      ${(t.enter||t.exit)?`<div class="exitbox" style="margin-bottom:12px">${t.enter?`<div><span class="note">上車</span><b>${esc(t.enter)}</b></div>`:''}${t.exit?`<div><span class="note">下車走</span><b>${esc(t.exit)}</b></div>`:''}</div>`:''}
      ${(t.legs||[]).length?`<div class="route">${t.legs.map(legStep).join('')}</div>`:''}
      ${(t.steps||[]).length?`<ol style="margin:4px 0 0;padding-left:20px">${t.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:''}
      ${(t.minutes||t.fare)?`<div class="row note" style="margin-top:8px">${t.minutes?`<span class="mono">約 ${t.minutes} 分鐘</span>`:''}${t.fare?`<span class="mono">車資 ${esc(t.fare)}</span>`:''}</div>`:''}
    </div>` : '';
  const imgs=(t?.images||[]);
  const imgBlock = (imgs.length||(s.links||[]).length) ? `<div class="card"><div class="label" style="margin-bottom:8px">車站實拍與官方連結</div>
      ${imgs.length?`<div class="imgs">${imgs.map(im=>`<figure><a href="${esc(im.src)}" target="_blank" rel="noopener"><img src="${esc(im.src)}" alt="${esc(im.caption||'車站圖')}" loading="lazy"></a>${im.caption?`<figcaption>${esc(im.caption)}</figcaption>`:''}</figure>`).join('')}</div>`:''}
      <div class="row" style="margin-top:8px">${(s.links||[]).map(k=>`<a class="btn ghost" href="${esc(k.url)}" target="_blank" rel="noopener">${esc(k.label)}</a>`).join('')}</div>
    </div>` : '';
  return `<div class="grab"><div class="wrap"><div class="head"><div class="grow"><div class="label">${md(s.day)}${s.time?'・'+esc(s.time):''}</div><h2>${esc(s.name)}</h2>${s.nameJa?`<div class="note">${esc(s.nameJa)}</div>`:''}</div><button class="x" data-act="close" aria-label="關閉">${I.x}</button></div></div></div>
  <div class="wrap">
    ${st&&st.kind!=='info'&&st.kind!=='open'?`<div class="banner ${st.kind==='soon'?'warn':'bad'}"><div><b>${esc(st.text)}</b></div></div>`:''}
    <div class="btns">
      <a class="btn primary" href="${esc(gmaps(s))}" target="_blank" rel="noopener">${I.map}從我這裡導航</a>
      <a class="btn" href="${esc(uber(s))}" target="_blank" rel="noopener">${I.car}Uber 叫車</a>
      ${prev?`<a class="btn" href="${esc(gmaps(s,prev))}" target="_blank" rel="noopener">從上一站的路線</a><a class="btn" href="${esc(uber(s,prev))}" target="_blank" rel="noopener">Uber（上一站出發）</a>`:''}
    </div>
    ${s.showCard?`<div class="taxi"><div class="label">${esc(s.showCard.label)}</div>${s.showCard.ja.map((x,i)=>`<div class="jp" style="${i===0?'':'font-size:20px'}">${esc(x)}</div>`).join('')}<div class="note" style="margin-top:6px">${esc(s.showCard.zh)}</div></div>`:''}
    ${s.approx?`<div class="note">定位點是約略位置。搭 Uber 或導航前，請在地圖上確認上車點和目的地。</div>`:''}
    ${route}
    ${imgBlock}
    <div class="card"><div class="label" style="margin-bottom:8px">營業資訊</div>
      <dl class="kv">
        ${(h.open||h.close)?`<dt>營業</dt><dd class="mono">${esc(h.open||'')}–${esc(h.close||'')}</dd>`:''}
        ${h.lastEntry?`<dt>最後入場</dt><dd class="mono">${esc(h.lastEntry)}</dd>`:''}
        ${(h.closedDays||[]).length?`<dt>公休</dt><dd>週${h.closedDays.map(d=>DOW[d]).join('、')}</dd>`:''}
        ${h.note?`<dt>備註</dt><dd>${esc(h.note)}</dd>`:''}
        ${s.price?`<dt>門票</dt><dd>${esc(s.price)}</dd>`:''}
        ${s.duration?`<dt>建議停留</dt><dd>${esc(s.duration)}</dd>`:''}
        ${s.address||s.addressJa?`<dt>地址</dt><dd><a href="${esc(gplace(s))}" target="_blank" rel="noopener">${esc(s.addressJa||s.address)}</a></dd>`:''}
      </dl>
      ${!(h.open||h.close||s.price||s.address||s.addressJa)?'<div class="note">還沒填營業時間或門票。</div>':''}
      ${s.notes?`<p style="margin:10px 0 0;white-space:pre-wrap">${esc(s.notes)}</p>`:''}
    </div>
    <div class="card"><div class="row" style="margin-bottom:8px"><div class="label grow">打卡照片・每人一張</div><span class="note">${all.length} 張</span></div>
      ${all.length?`<div class="pgrid" style="margin-bottom:10px">${all.map(thumb).join('')}</div>`:''}
      ${mine?`<div class="note">你已經在這裡拍過了。</div>`:`<button class="btn flash" style="width:100%" data-shoot="${esc(key)}">${I.cam}打卡拍照（只能拍一次）</button>`}
    </div>
    ${S.canWrite?`<div class="btns"><button class="btn ${s.visited?'':'go'}" data-visit="${esc(s.id)}">${I.check}${s.visited?'改回未抵達':'標記已抵達'}</button><button class="btn" data-edit="${esc(s.id)}">編輯這站</button></div>`:''}
  </div>`;
}
function legStep(l){
  if(l.type==='taxi') return `<div class="rstep"><div class="dot walk"><span style="--c:var(--muted)"></span></div><div class="txt"><b>搭計程車${l.minutes?` 約 ${l.minutes} 分鐘`:''}</b>${l.text?`<div class="note">${esc(l.text)}</div>`:''}</div></div>`;
  if(l.type==='walk') return `<div class="rstep"><div class="dot walk"><span style="--c:var(--muted)"></span></div><div class="txt"><b>步行${l.minutes?` ${l.minutes} 分鐘`:''}</b>${l.text?`<div class="note">${esc(l.text)}</div>`:''}</div></div>`;
  return `<div class="rstep" style="--c:${esc(l.color||'#777')}"><div class="dot"><span></span></div><div class="txt">
    <b>${esc(l.from||'')} 上車</b>
    <span class="chip" style="--c:${esc(l.color||'#777')};margin:4px 0"><i>${esc(l.code||'')}</i>${esc(l.line||'')}</span>
    ${l.direction?`<div>往 <b style="display:inline">${esc(l.direction)}</b> 方向</div>`:''}
    <div class="note">${[l.platform&&`${l.platform} 月台`, l.stops&&`坐 ${l.stops} 站`, l.minutes&&`${l.minutes} 分鐘`, l.car&&`建議車廂：${l.car}`].filter(Boolean).map(esc).join('・')}</div>
    ${l.text?`<div class="note">${esc(l.text)}</div>`:''}
    <b style="margin-top:6px">${esc(l.to||'')} 下車</b>
  </div></div>`;
}
function sheetForm(sh){
  const s = sh.id ? S.stops.find(x=>x.id===sh.id) : null;
  const day = s?.day || sh.day || S.day;
  const h=s?.hours||{};
  const list=sorted(day).filter(x=>x.id!==s?.id);
  const coords = s?.lat!=null?`${s.lat}, ${s.lng}`:'';
  return `<div class="grab"><div class="wrap"><div class="head"><h2>${s?'編輯景點':'臨時新增景點'}</h2><button class="x" data-act="close" aria-label="關閉">${I.x}</button></div></div></div>
  <div class="wrap"><form id="stopForm">
    <div class="f2">
      <div class="f"><label for="f-day">日期</label><select id="f-day" name="day">${DAYS.map(d=>`<option value="${d}" ${d===day?'selected':''}>${md(d)}（${DOW[dowOf(d)]}）</option>`).join('')}</select></div>
      <div class="f"><label for="f-time">預計抵達</label><input id="f-time" name="time" type="time" value="${esc(s?.time||'')}"></div>
    </div>
    ${!s?`<div class="f"><label for="f-after">排在哪一站之後</label><select id="f-after" name="after"><option value="__start">放在最前面</option>${list.map((x,i)=>`<option value="${esc(x.id)}" ${i===list.length-1?'selected':''}>${esc(x.time||'')} ${esc(x.name)}</option>`).join('')}</select></div>`:''}
    <div class="f"><label for="f-name">名稱</label><input id="f-name" name="name" required value="${esc(s?.name||'')}" placeholder="例如：一蘭拉麵 上野店"></div>
    <div class="f"><label for="f-ja">日文名稱（選填，叫車和導航更準）</label><input id="f-ja" name="nameJa" value="${esc(s?.nameJa||'')}"></div>
    <div class="f"><label for="f-loc">Google Maps 連結或座標</label><input id="f-loc" name="loc" value="${esc(s?.mapsUrl||coords)}" placeholder="在 Google Maps 長按地點，複製座標貼上">
      <span class="note">貼座標（35.71, 139.79）最準，Uber 也要靠座標才能設好目的地。</span></div>
    <div class="f"><label for="f-addr">地址（選填）</label><input id="f-addr" name="address" value="${esc(s?.addressJa||s?.address||'')}"></div>
    <div class="f2">
      <div class="f"><label for="f-open">開門</label><input id="f-open" name="open" type="time" value="${esc(h.open||'')}"></div>
      <div class="f"><label for="f-close">打烊</label><input id="f-close" name="close" type="time" value="${esc(h.close||'')}"></div>
    </div>
    <div class="f"><label>公休日</label><div class="dows">${DOW.map((d,i)=>`<label><input type="checkbox" name="cd" value="${i}" ${(h.closedDays||[]).includes(i)?'checked':''}>週${d}</label>`).join('')}</div></div>
    <div class="f"><label for="f-price">門票／價格（選填）</label><input id="f-price" name="price" value="${esc(s?.price||'')}"></div>
    <div class="f"><label for="f-tr">怎麼去（選填，一行一步）</label><textarea id="f-tr" name="steps" placeholder="例如：&#10;銀座線 往淺草 坐 3 站&#10;上野廣小路站 A3 出口出來右轉">${esc((s?.transit?.steps||[]).join('\n'))}</textarea></div>
    <div class="f"><label for="f-notes">備註</label><textarea id="f-notes" name="notes">${esc(s?.notes||'')}</textarea></div>
    <button class="btn primary" type="submit">${s?'儲存':'加入行程'}</button>
    ${s?`<div id="delZone">${sh.confirmDel?`<div class="banner bad"><div class="grow"><b>確定刪除「${esc(s.name)}」？</b>這站的照片會留在相簿。<div class="btns" style="margin-top:8px"><button class="btn danger" type="button" data-del="${esc(s.id)}">刪除</button><button class="btn" type="button" data-act="nodel">取消</button></div></div></div>`:`<button class="btn danger" type="button" data-act="askdel" style="width:100%">刪除這站</button>`}</div>`:''}
  </form></div>`;
}
function parseLoc(v){
  v=(v||'').trim(); if(!v) return {};
  const m=/@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(v)||/[?&](?:q|query|ll|destination)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i.exec(v)||/^(-?\d+\.\d+)\s*[, ]\s*(-?\d+\.\d+)$/.exec(v);
  const out={}; if(m){out.lat=+(+m[1]).toFixed(6);out.lng=+(+m[2]).toFixed(6)}
  if(/^https?:\/\//.test(v)) out.mapsUrl=v;
  return out;
}
async function submitForm(form){
  if(!S.db){toast('還在載入，請稍後再試');return}
  const fd=new FormData(form); const sh=S.sheet; const old=sh.id?S.stops.find(x=>x.id===sh.id):null;
  const day=fd.get('day'); const loc=parseLoc(fd.get('loc'));
  const steps=String(fd.get('steps')||'').split('\n').map(x=>x.trim()).filter(Boolean);
  const hours={...(old?.hours||{}),open:fd.get('open')||'',close:fd.get('close')||'',closedDays:fd.getAll('cd').map(Number)};
  const data={day,time:fd.get('time')||'',name:String(fd.get('name')).trim(),nameJa:String(fd.get('nameJa')||'').trim(),
    address:String(fd.get('address')||'').trim(),hours,price:String(fd.get('price')||'').trim(),notes:String(fd.get('notes')||'').trim(),
    lat:loc.lat??(old&&!fd.get('loc')?null:old?.lat??null),lng:loc.lng??(old&&!fd.get('loc')?null:old?.lng??null),mapsUrl:loc.mapsUrl||''};
  if(old?.addressJa&&data.address===old.addressJa){data.address=old.address||'';data.addressJa=old.addressJa}
  const transit={...(old?.transit||{})}; if(steps.length||transit.steps) transit.steps=steps;
  if(Object.keys(transit).length) data.transit=transit;
  if(!data.name){toast('請填名稱');return}
  form.querySelector('[type=submit]').disabled=true;
  try{
    if(old){
      if(old.day!==day) data.order=Math.max(0,...sorted(day).map(x=>x.order||0))+10;
      await S.db.saveStop(old.id,data);
      toast('已儲存');openSheet({type:'stop',id:old.id});
    } else {
      const list=sorted(day); const a=fd.get('after');
      let order;
      if(a==='__start'||!list.length) order=(list[0]?.order??20)-10;
      else {const i=list.findIndex(x=>x.id===a);const cur=list[i]?.order??0;const nx=list[i+1]?.order;order=nx!=null?(cur+nx)/2:cur+10}
      await S.db.saveStop(S.db.newId(),{...data,order,kind:'added',visited:false,addedBy:S.uid||null,createdAt:new Date().toISOString()});
      S.day=day; toast('已加入行程，全家都看得到'); closeSheet(); render();
    }
  }catch(e){toast('儲存失敗，請檢查網路後再試');form.querySelector('[type=submit]').disabled=false}
}

/* ---------- photos ---------- */
async function compress(file,max=1800,q=.82){
  let src; try{src=await createImageBitmap(file,{imageOrientation:'from-image'})}catch{
    src=await new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=URL.createObjectURL(file)})}
  const w=src.width,h=src.height,k=Math.min(1,max/Math.max(w,h));
  const c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);
  c.getContext('2d').drawImage(src,0,0,c.width,c.height);
  return await new Promise(r=>c.toBlob(r,'image/jpeg',q));
}
function startShoot(key){
  if(!S.db){toast('還在載入，請稍後再試');return}
  if(!S.uid){askName();return}
  if(myPhoto(key)){toast('這裡你已經拍過了');return}
  S.pending=key; const el=$('#cam'); el.value=''; el.click();
}
function dataUrlOf(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob)})}
async function onShot(file){
  const key=S.pending; S.pending=null; if(!file||!key) return;
  if(myPhoto(key)){toast('這裡你已經拍過了');return}
  toast('上傳中…',6000);
  try{
    const full=await dataUrlOf(await compress(file,1280,.72));
    const thumb=await dataUrlOf(await compress(file,260,.6));
    const now=jst(); let doc={uid:S.uid,key,thumb,takenAt:new Date().toISOString()};
    if(key.startsWith('s-')){const s=S.stops.find(x=>'s-'+x.id===key);Object.assign(doc,{kind:'spot',stopId:s?.id||'',day:s?.day||now.date,place:s?.name||''})}
    else {const [, d, n]=/^r-(\d{4}-\d\d-\d\d)-(\d)$/.exec(key);const t=flashSlots(d)[+n-1];Object.assign(doc,{kind:'random',day:d,slot:+n,late:now.date!==d||now.min>t+ONTIME_MIN})}
    await S.db.putPhoto(photoKeyFor(S.uid,key),doc,full);
    vib(60); toast(doc.late?'已上傳（遲到了，但有拍到！）':'已上傳');
  }catch(e){console.error(e);toast(e?.code==='permission-denied'||e?.code==='exists'?'這張你已經拍過了':'上傳失敗，請檢查網路再試一次',4000)}
}

/* ---------- name ---------- */
function askName(change){
  if($('#nameModal')) return;
  const m=document.createElement('div');m.id='nameModal';m.className='scrim';m.style.zIndex=70;
  m.innerHTML=`<div class="sheet" style="padding:20px 16px calc(24px + env(safe-area-inset-bottom,0px))"><div class="wrap"><h2>${change?'改名字':'你是誰？'}</h2><p class="note" style="margin:0">相簿會用這個名字標示是誰拍的。每人用同一個名字，換手機也不會重拍。</p><form id="nameForm"><div class="f"><label for="nm">名字</label><input id="nm" required maxlength="12" value="${esc(S.uid||'')}" placeholder="例如：爸爸、媽媽、Devin" autocomplete="off"></div><button class="btn primary" type="submit">確定</button></form></div></div>`;
  document.body.appendChild(m);
  $('#nm').focus();
  $('#nameForm').addEventListener('submit',ev=>{ev.preventDefault();const v=$('#nm').value.trim();if(!v)return;S.uid=v;ls.set('me',v);m.remove();render()});
}

/* ---------- export ---------- */
async function exportAlbum(onlyMine){
  if(!window.JSZip){toast('匯出工具還沒載入，請稍後再試');return}
  const ps=S.photos.filter(p=>!onlyMine||p.uid===S.uid);
  if(!ps.length) return;
  toast(`正在打包 ${ps.length} 張照片…`,8000);
  const zip=new JSZip(); const entries=[]; let fail=0;
  const safe=s=>String(s||'').replace(/[\\/:*?"<>|]/g,'').slice(0,40);
  const ordered=[...ps].sort((a,b)=>a.takenAt<b.takenAt?-1:1);
  let n=0;
  for(const p of ordered){
    try{
      const u=await S.db.getFull(p.id); if(!u) throw 0;
      const b=await (await fetch(u)).blob(); n++;
      const di=DAYS.indexOf(p.day)+1; const folder=`Day${di||'x'}_${(p.day||'').slice(5).replace('-','')}`;
      const label = p.kind==='random'?`隨機拍${p.slot}`:safe(p.place||S.stops.find(s=>s.id===p.stopId)?.name||'景點');
      const name=`${folder}/${String(n).padStart(3,'0')}_${label}_${safe(who(p.uid))}.jpg`;
      zip.file(name,b); entries.push({name,p,label});
    }catch{fail++}
  }
  const days=DAYS.map((d,i)=>{const es=entries.filter(e=>e.p.day===d);if(!es.length)return'';
    return `<h2>Day ${i+1}・${md(d)}</h2><div class="g">${es.map(e=>`<figure><img src="${esc(e.name)}" loading="lazy"><figcaption>${esc(e.label)}・${esc(who(e.p.uid))}${e.p.late?'・遲到':''}<br><small>${esc(new Date(e.p.takenAt).toLocaleString('zh-TW',{timeZone:'Asia/Tokyo'}))}</small></figcaption></figure>`).join('')}</div>`}).join('');
  zip.file('相簿.html',`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>日本家族旅 2026</title><style>body{font-family:system-ui,"PingFang TC","Microsoft JhengHei",sans-serif;margin:0;padding:24px;background:#f3f5f9;color:#172031}h1{margin:0 0 4px}h2{margin:28px 0 10px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}figure{margin:0;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06)}img{width:100%;aspect-ratio:1;object-fit:cover;display:block}figcaption{padding:8px 10px;font-size:14px}small{color:#667}</style><h1>日本家族旅</h1><p>2026/11/11–11/14・共 ${entries.length} 張</p>${days}`);
  try{
    const blob=await zip.generateAsync({type:'blob'});
    const fname=onlyMine?'日本旅行_我的照片.zip':'日本旅行_全家相簿.zip';
    const file=new File([blob],fname,{type:'application/zip'});
    const ios=/iP(hone|ad|od)/.test(navigator.userAgent);
    if(ios&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:fname})}
    else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fname;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
    toast(fail?`已匯出，有 ${fail} 張讀取失敗`:'已匯出相簿');
  }catch(e){ if(e?.name!=='AbortError') toast('沒有完成下載') }
}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-day],[data-tab],[data-act],[data-open],[data-shoot],[data-visit],[data-edit],[data-del],[data-view],[data-copy],[data-rename]');
  if(!t) return;
  const d=t.dataset;
  if(d.day){S.day=d.day;ls.set('day',{d:d.day,at:jst().date});render();window.scrollTo({top:0})}
  else if(d.tab){S.tab=d.tab;render();window.scrollTo({top:0})}
  else if(d.open){e.preventDefault();openSheet({type:'stop',id:d.open})}
  else if(d.shoot) startShoot(d.shoot);
  else if(d.view) openSheet({type:'photo',id:d.view,back:S.sheet});
  else if(d.edit) openSheet({type:'form',id:d.edit});
  else if(d.rename){askName(true)}
  else if(d.copy){const v=d.copy;navigator.clipboard?.writeText(v).then(()=>toast('已複製 '+v),()=>toast(v))}
  else if(d.visit){const s=S.stops.find(x=>x.id===d.visit);if(s&&S.db)S.db.saveStop(s.id,{visited:!s.visited}).catch(()=>toast('儲存失敗'))}
  else if(d.del){S.db?.deleteStop(d.del).then(()=>{toast('已刪除');closeSheet()},()=>toast('刪除失敗'))}
  else if(d.act==='close'){ if(S.sheet?.type==='photo'&&S.sheet.back){S.sheet=S.sheet.back;renderSheet()} else closeSheet() }
  else if(d.act==='add'){ openSheet({type:'form',day:S.day}) }
  else if(d.act==='askdel'){S.sheet.confirmDel=true;renderSheet()}
  else if(d.act==='nodel'){S.sheet.confirmDel=false;renderSheet()}
  else if(d.act==='export-all') exportAlbum(false);
  else if(d.act==='export-mine') exportAlbum(true);
  else if(d.act==='flash-go'){$('#flashModal')?.remove();startShoot(d.key)}
  else if(d.act==='flash-later'){$('#flashModal')?.remove()}
});
document.addEventListener('submit',e=>{if(e.target.id==='stopForm'){e.preventDefault();submitForm(e.target)}});
$('#cam').addEventListener('change',e=>onShot(e.target.files[0]));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.sheet)closeSheet()});

/* ---------- ticking: clock, flash alerts, closing alerts ---------- */
function tick(){
  const now=jst();
  $('#clock').textContent=`日本 ${hm(now.min)}`;
  if(DAYS.includes(now.date)){
    flashSlots(now.date).forEach((t,i)=>{
      const key=`r-${now.date}-${i+1}`; const seen=ls.get('flashSeen',{});
      if(now.min>=t&&now.min<t+ONTIME_MIN&&!myPhoto(key)&&!seen[key]&&!$('#flashModal')){
        seen[key]=1;ls.set('flashSeen',seen);vib([250,120,250,120,400]);
        const m=document.createElement('div');m.id='flashModal';m.className='flashmodal';m.setAttribute('role','alertdialog');
        m.innerHTML=`<div style="width:56px;height:56px">${I.bolt}</div><h2>隨機拍時間到！</h2><div>全家現在一起拍一張，${ONTIME_MIN} 分鐘內算準時</div><div class="mono">${hm(t)}</div><button class="btn" style="background:var(--flash-ink);color:var(--flash);border:0;font-size:18px;padding:14px 28px" data-act="flash-go" data-key="${key}">${I.cam}現在拍</button><button class="btn ghost" style="color:inherit;border-color:currentColor" data-act="flash-later">等一下</button>`;
        document.body.appendChild(m);
      }
    });
    const nxt=sorted(now.date).find(s=>!s.visited);
    if(nxt){const st=hoursState(nxt,now);const seen=ls.get('closeSeen',{});
      if(st?.kind==='soon'&&!seen[nxt.id]){seen[nxt.id]=1;ls.set('closeSeen',seen);vib([400,150,400]);toast(`注意：${nxt.name} ${st.text}`,6000)}}
  }
  if(S.tab==='plan'&&!S.sheet) $('#view').innerHTML=viewPlan();
}

/* ---------- boot ---------- */
function initDay(){
  const now=jst(); const saved=ls.get('day',null);
  if(DAYS.includes(now.date)) S.day=(saved&&saved.at===now.date&&DAYS.includes(saved.d))?saved.d:now.date;
  else S.day=(saved&&DAYS.includes(saved.d))?saved.d:DAYS[0];
}
const WX_KEY='wx2';
async function loadWeather(){
  const cache=ls.get(WX_KEY,{}); S.weather=cache.data||{}; render();
  if(cache.at&&Date.now()-cache.at<3*3600e3&&Object.keys(S.weather).length) return;
  const cities={}; DAYS.forEach(d=>{const c=DAY_CITY[d];if(c)(cities[c.name]=cities[c.name]||{c,days:[]}).days.push(d)});
  const out={...S.weather};
  try{
    await Promise.all(Object.values(cities).map(async({c,days})=>{
      const u=`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=temperature_2m,precipitation_probability,weather_code&timezone=Asia%2FTokyo&start_date=${DAYS[0]}&end_date=${DAYS[DAYS.length-1]}`;
      const r=await fetch(u); if(!r.ok) throw 0; const j=await r.json();
      const upd=new Date().toLocaleString('zh-TW',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
      days.forEach(d=>{const i=j.daily.time.indexOf(d);if(i<0)return;
        const hourly=[];j.hourly.time.forEach((t,k)=>{if(t.startsWith(d)){const h=+t.slice(11,13);if(h>=8&&h<=22&&h%2===0)hourly.push({h:String(h).padStart(2,'0')+':00',t:j.hourly.temperature_2m[k],pop:j.hourly.precipitation_probability[k]})}});
        out[d]={city:c.name,code:j.daily.weather_code[i],tmax:j.daily.temperature_2m_max[i],tmin:j.daily.temperature_2m_min[i],pop:j.daily.precipitation_probability_max[i],hourly,updatedAt:upd}});
    }));
    S.weather=out; ls.set(WX_KEY,{at:Date.now(),data:out}); render();
  }catch{}
}
function loadCache(){
  const c=ls.get('cache2',null); if(!c) return;
  S.stops=c.stops||[];S.info=c.info||null;S.photos=c.photos||[];
}
let cacheT; function saveCache(){clearTimeout(cacheT);cacheT=setTimeout(()=>{if(!ls.set('cache2',{stops:S.stops,info:S.info,photos:S.photos}))ls.set('cache2',{stops:S.stops,info:S.info,photos:[]})},500)}
async function boot(){
  initDay(); S.uid=ls.get('me',null); loadCache(); render(); tick();
  setInterval(tick,15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();loadWeather()}});
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
  loadWeather();
  const timer=setTimeout(()=>{S.stale=true;S.ready=true;render()},10000);
  let db; try{db=await createData()}catch(e){console.error(e)}
  if(!db){clearTimeout(timer);S.stale=!!S.stops.length;S.ready=true;render();return}
  S.db=db; db.init().catch(()=>{});
  const err=()=>{clearTimeout(timer);S.stale=true;S.ready=true;render()};
  db.onStops((list,fromCache)=>{S.stops=list;if(!fromCache){clearTimeout(timer);S.stale=false}S.ready=true;saveCache();render()},err);
  db.onInfo(i=>{S.info=i;if(i?.title)$('#ttl').textContent=i.title;saveCache();render()},err);
  db.onPhotos(list=>{S.photos=list;saveCache();render()},err);
  if(!S.uid) setTimeout(()=>{if(!S.uid)askName()},600);
}
boot();
})();
