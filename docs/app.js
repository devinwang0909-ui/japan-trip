import { createData } from './data.js';
import { DAY_CITY } from './trip.js';
import { emojiOf, photoBanner } from './art.js';
const guessArt=s=>s.art||(/燒肉|烤肉/.test(s.name)?'grill':/鰻/.test(s.name)?'unagi':/神社|大社|稻荷/.test(s.name)?'shrine':/寺/.test(s.name)?'temple':/機場/.test(s.name)?'plane':/飯店|旅館|民宿/.test(s.name)?'hotel':/拉麵|餐|食|吃|壽司|咖啡|居酒屋/.test(s.name)?'pot':/高爾夫|golf/i.test(s.name)?'golf':/寶可夢/.test(s.name)?'poke':/市場|商店街/.test(s.name)?'market':'bags');
(() => {
const DAYS = ['2026-11-11','2026-11-12','2026-11-13','2026-11-14'];
const DOW = ['日','一','二','三','四','五','六'];
const ONTIME_MIN = 15;              // 隨機拍：開放後幾分鐘內算準時
const S = {tab:'plan', day:null, stops:[], info:null, weather:{}, photos:[], uid:null,
  canWrite:true, db:null, ready:false, stale:false, sheet:null, pending:null, full:{}, timer:null, toolOpen:{fx:false,timer:false}, fx:{rate:0.21,at:'',live:false,jpy:'',twd:''}};

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
function flashSlots(date,who){
  const r=rng(hash(date+'|flash-v2|'+(who??S.uid??'guest')));let out=[];
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
function photoKeyFor(uid,key){const hex=Array.from(new TextEncoder().encode(String(uid))).map(b=>b.toString(16).padStart(2,'0')).join('');return `${hex}__${key}`}
const myPhoto = key => S.photos.find(p=>p.uid===S.uid&&p.key===key);

/* ---------- rendering ---------- */
function renderDays(){
  const now=jst();
  $('#days').innerHTML=DAYS.map((d,i)=>`<button class="day${d===now.date?' today':''}" data-day="${d}" aria-pressed="${d===S.day}"><b>${md(d)}</b><small>Day ${i+1}・${DOW[dowOf(d)]}</small></button>`).join('');
  $('#days').hidden = S.tab!=='plan';
  $('#ttl').textContent = S.tab==='plan'?(S.info?.title||'大阪京都家族旅'):({tools:'工具',album:'旅行相簿',sos:'緊急資訊'}[S.tab]||'');
}
function render(){
  syncLens();
  renderDays();
  document.querySelectorAll('.tab[data-tab]').forEach(t=>t.setAttribute('aria-current',t.dataset.tab===S.tab?'page':'false'));
  const v=$('#view');
  if(S.tab==='plan') v.innerHTML=viewPlan();
  else if(S.tab==='tools') v.innerHTML=viewTools();
  else if(S.tab==='album') v.innerHTML=viewAlbum();
  else v.innerHTML=viewSOS();
  if(S.sheet) renderSheet();
}

function viewPlan(){
  const now=jst(); const day=S.day; const list=sorted(day);
  const out=[];
  if(!S.ready&&!S.stops.length) out.push(`<div class="status">載入行程中…</div>`);
  if(S.stale) out.push(`<div class="banner info">目前連不上資料庫，顯示的是這支手機上次存下的行程。</div>`);
  const isToday = day===now.date;
  const nxt = isToday ? list.find(s=>!s.visited) : null;
  if(nxt){
    const st=hoursState(nxt,now);
    if(st&&st.kind==='soon') out.push(`<div class="banner warn" role="alert"><div><b>下一站「${esc(nxt.name)}」快打烊了</b>${esc(st.text)}。現在出發可能來不及，考慮先改去別站。</div></div>`);
    if(st&&st.kind==='off') out.push(`<div class="banner bad" role="alert"><div><b>「${esc(nxt.name)}」${esc(st.text)}</b>可以跳過這站，或在行程裡把它標為已去過。</div></div>`);
  }
  // 1) 需要你行動的事放最前面：拍照時間、下一站
  const flash=flashState(day,now);
  if(flash.active) out.push(flashAlert(flash,day));
  if(nxt) out.push(viewNext(nxt,now));
  else if(now.date<DAYS[0] && day===DAYS[0] && list[0]){
    const days=Math.round((Date.parse(DAYS[0]+'T00:00:00+09:00')-Date.now())/864e5);
    out.push(`<div class="card next"><div class="label">還有 ${Math.max(days,0)} 天出發</div><h2>第一站：${esc(list[0].name)}</h2></div>`);
  }
  // 2) 背景資訊壓成一條：天氣、隨機拍
  out.push(`<div class="card strip">${viewWeather(day)}${flash.active?'':flashRow(flash)}${pushRow()}</div>`);
  // 3) 行程時間軸
  if(!list.length){
    out.push(`<div class="empty"><h3>${md(day)} 還沒有行程</h3><p>想臨時加一個地方，點下方「新增景點」。</p></div>`);
  } else {
    const tl=[]; const hotel=hotelFor(day);
    list.forEach((s,i)=>{
      if(s.transit) tl.push(legRow(s,list[i-1]));
      const st=hoursState(s,isToday?now:null);
      const ph=S.photos.filter(p=>p.key==='s-'+s.id).length;
      const pills=[
        s.visited?`<span class="pill go">已抵達</span>`:'',
        s.kind==='added'?`<span class="pill ai">臨時加入</span>`:'',
        st&&st.kind!=='info'&&st.kind!=='open'?`<span class="pill ${st.kind==='soon'?'warn':'bad'}">${esc(st.text)}</span>`:'',
        ph?`<span class="pill ai">${ph} 張照片</span>`:'',
      ].filter(Boolean).join('');
      tl.push(`<button class="stop${s.visited?' visited':''}${s.kind==='added'?' added':''}" data-open="${esc(s.id)}">
        <div class="body">
          ${s.photo?`<div class="ph2">${photoBanner(s.photo)}${s.time?`<span class="tchip">${esc(s.time)}</span>`:''}</div>`:(s.time?`<div class="tm">${esc(s.time)}</div>`:'')}
          <h3><span class="em" aria-hidden="true">${emojiOf(guessArt(s))}</span>${esc(s.name)}</h3>
          ${s.nameJa?`<div class="ja1">${esc(s.nameJa)}</div>`:''}
          ${pills?`<div class="meta">${pills}</div>`:''}
        </div></button>`);
    });
    if(hotel&&list.length) tl.push(`<div class="lg end">回到住宿・${esc(hotel.name)}</div>`);
    out.push(`<div><div class="dayhead"><b>${md(day)}（${DOW[dowOf(day)]}）</b><span>${list.length} 站</span></div><div class="tl">${tl.join('')}</div></div>`);
  }
  return out.join('');
}
function legRow(s,prev){
  const t=s.transit; const chips=[];
  (t.legs||[]).forEach(l=>{
    if(l.type==='walk') chips.push(`<span class="chip plain">步行 ${l.minutes?l.minutes+' 分':''}</span>`);
    else if(l.type==='taxi') chips.push(`<span class="chip plain">計程車 ${l.minutes?l.minutes+' 分':''}</span>`);
    else chips.push(`<span class="chip" style="--c:${esc(l.color||'#777')}"><i>${esc(l.code||'')}</i>${esc(l.line||'')}</span>`);
  });
  if(!chips.length&&t.summary) chips.push(`<span>${esc(t.summary)}</span>`);
  return `<button class="lg" data-route="${esc(s.id)}"><span class="lgchips">${chips.join('')}</span><span class="lgend">${t.minutes?`<span class="mono">約 ${t.minutes} 分</span>`:''}<span class="chev">›</span></span></button>`;
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
    ${t?.exit?`<div class="note" style="margin-bottom:10px">出口：<b>${esc(t.exit)}</b></div>`:''}
    <div class="btns three">
      <a class="btn primary" href="${esc(gmaps(s))}" target="_blank" rel="noopener">${I.map}導航</a>
      <a class="btn" href="${esc(uber(s))}" target="_blank" rel="noopener">${I.car}Uber</a>
      <button class="btn" data-route="${esc(s.id)}">怎麼去</button>
    </div></div>`;
}
function viewWeather(day){
  const w=S.weather[day];
  const city=w?.city||S.info?.city||'';
  const q=encodeURIComponent((city||'日本')+' 天氣');
  if(!w) return `<div class="srow"><span class="sico">☁️</span><div class="grow"><b>${md(day)} 天氣</b><div class="note">出發前 7 天內才有預報</div></div><a class="btn ghost sm" href="https://www.google.com/search?q=${q}" target="_blank" rel="noopener">查看</a></div>`;
  const hrs=(w.hourly||[]).map(h=>`<div>${esc(h.h)}<b>${Math.round(h.t)}°</b>${h.pop!=null?h.pop+'%':''}</div>`).join('');
  return `<details class="wxd"><summary class="srow"><span class="sico wxi">${wxIcon(w.code)}</span>
    <div class="grow"><b class="mono">${Math.round(w.tmax)}° / ${Math.round(w.tmin)}°</b> <span class="note">${esc(city)}・${esc(w.summary||wxText(w.code))}${w.pop!=null?`・降雨 ${w.pop}%`:''}</span></div><span class="chev">›</span></summary>
    ${hrs?`<div class="hours">${hrs}</div>`:''}<div class="note wxu">更新於 ${esc(w.updatedAt||'')}</div></details>`;
}
function flashState(day,now){
  const slots=flashSlots(day); const isToday=now.date===day; const after=now.date>day, before=now.date<day;
  const items=slots.map((t,i)=>{
    const key=`r-${day}-${i+1}`; const mine=myPhoto(key);
    const opened=after||(isToday&&now.min>=t);
    let st='wait';
    if(mine) st='done'; else if(opened&&after) st='miss'; else if(opened) st='open';
    return {i,t,key,st,mine,left:t+ONTIME_MIN-now.min,late:mine?.late};
  });
  const cur=items.find(x=>x.st==='open');
  return {items,active:!!cur,cur,before,after,isToday};
}
function pushRow(){
  if(!S.db||S.db.mode!=='cloud'||!S.db.pushReady) return '';
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  const ios=/iP(hone|ad|od)/.test(navigator.userAgent);
  if(ls.get('pushOn',false)&&typeof Notification!=='undefined'&&Notification.permission==='granted')
    return `<div class="srow"><span class="sico">🔔</span><div class="grow"><b>通知已開啟</b> <span class="note">隨機拍、集合時間到會提醒你</span></div></div>`;
  if(ios&&!standalone) return `<div class="srow"><span class="sico">🔔</span><div class="grow"><b>想收通知？</b><div class="note">先用 Safari「加入主畫面」，再從主畫面圖示打開</div></div></div>`;
  return `<div class="srow"><span class="sico">🔔</span><div class="grow"><b>開啟通知</b><div class="note">不開網頁也會提醒隨機拍和集合</div></div><button class="btn primary sm" data-act="push-on">開啟</button></div>`;
}
async function enablePush(){
  if(!S.uid){askName();return}
  try{
    await S.db.enablePush(S.uid); ls.set('pushOn',true); toast('通知已開啟'); render();
  }catch(e){
    toast(e?.code==='denied'?'你沒有允許通知，請到手機設定開啟':e?.code==='unsupported'?'這個瀏覽器不支援通知':'開啟失敗，請稍後再試',4000);
  }
}
function flashAlert(f,day){
  const c=f.cur;
  return `<div class="card flashcard"><div class="row"><div class="grow"><div class="label">隨機拍・第 ${c.i+1} 次</div>
    <div style="font-weight:700;font-size:17px">現在！拍一張</div>
    <div class="note" style="color:inherit;opacity:.8">${c.left>0?`還剩 ${c.left} 分鐘算準時`:'已過準時，遲到也能拍'}</div></div>
    <button class="btn" style="background:var(--flash-ink);color:var(--flash);border:0;min-height:48px;padding:0 20px;font-size:16px" data-shoot="${esc(c.key)}">${I.cam}拍</button></div></div>`;
}
function flashRow(f){
  const dots=f.items.map(x=>`<span class="dot3 ${x.st}" title="第 ${x.i+1} 次">${x.st==='done'?'✓':x.st==='miss'?'✕':''}</span>`).join('');
  const done=f.items.filter(x=>x.st==='done').length;
  const sub=f.before?'每天 3 次，每人時間不同':(f.after?`已拍 ${done} 張`:`今天已拍 ${done} / 3`);
  return `<div class="srow"><span class="sico">📷</span><div class="grow"><b>隨機拍</b> <span class="note">${esc(sub)}</span></div><div class="dots3">${dots}</div></div>`;
}


/* ---------- 集合計時 ---------- */
const RING=2*Math.PI*88;
const fmtT=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
function timerLeft(){return S.timer&&!S.timer.cancelled?S.timer.endsAt-Date.now():null}
/* ---------- 匯率計算 ---------- */
const FX_DEFAULT=0.21;
const fxFmt=(n,d=0)=>Number.isFinite(n)?n.toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d}):'';
/* ---------- 工具頁：可摺疊的區塊 ---------- */
function toolSection(id,icon,title,sum,body){
  const open=!!S.toolOpen[id];
  return `<details class="tool card" data-tool="${id}"${open?' open':''}><summary><span class="tico">${icon}</span><span class="tt"><b>${title}</b><small id="sum-${id}">${sum}</small></span><span class="chev">›</span></summary><div class="tbody">${body}</div></details>`;
}
function timerSummary(){
  const left=timerLeft();
  return left!=null&&left>0?`倒數 ${fmtT(left)}${S.timer?.label?`・${esc(S.timer.label)}`:''}`:'各自行動，時間到全家一起響';
}
function viewTools(){
  return toolSection('fx','💴','匯率計算',`1 日圓 = ${esc(String(S.fx.rate))} 台幣`,viewFx())
    +toolSection('timer','⏱️','集合計時',timerSummary(),viewTimer());
}
document.addEventListener('toggle',e=>{const d=e.target;if(d?.matches?.('details.tool'))S.toolOpen[d.dataset.tool]=d.open},true);
function viewFx(){
  const f=S.fx;
  const note=f.live?`即時匯率，更新於 ${esc(f.at||'')}`:'離線預設匯率，連網後自動更新，也可以手動改';
  return `<div class="card fx">
    <div class="fxrow">
      <label class="fxbox"><span>日圓 JPY</span><div><b>¥</b><input id="fxJpy" inputmode="decimal" autocomplete="off" placeholder="0" value="${esc(f.jpy)}"></div></label>
      <label class="fxbox"><span>台幣 TWD</span><div><b>NT$</b><input id="fxTwd" inputmode="decimal" autocomplete="off" placeholder="0" value="${esc(f.twd)}"></div></label>
    </div>
    <div class="chips">${[500,1000,3000,5000,10000,30000].map(v=>`<button class="fxchip" data-fx="${v}">¥${fxFmt(v)}</button>`).join('')}<button class="fxchip ghost" data-fx="clear">清除</button></div>
    <label class="fxrate"><span>1 日圓 =</span><input id="fxRate" inputmode="decimal" value="${esc(String(f.rate))}"><span>台幣</span></label>
    <div class="note">${note}</div></div>`;
}
async function loadFx(){
  const c=ls.get('fx',null); if(c&&c.rate) Object.assign(S.fx,{rate:c.rate,at:c.at,live:!!c.live});
  if(c&&Date.now()-(c.ts||0)<6*3600e3) return;
  try{
    const r=await fetch('https://open.er-api.com/v6/latest/JPY'); if(!r.ok) throw 0;
    const j=await r.json(); const rate=j?.rates?.TWD; if(!rate) throw 0;
    const at=new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    Object.assign(S.fx,{rate:+rate.toFixed(5),at,live:true}); ls.set('fx',{rate:S.fx.rate,at,live:true,ts:Date.now()});
    if(S.tab==='tools'&&!document.activeElement?.matches?.('input')) render();
  }catch{}
}
function fxInput(id,val){
  const f=S.fx; const n=parseFloat(String(val).replace(/,/g,''));
  if(id==='fxRate'){ if(n>0){f.rate=n;ls.set('fx',{rate:n,at:f.at,live:false,ts:Date.now()});f.live=false;const j=parseFloat(f.jpy);if(j>=0){f.twd=String(Math.round(j*n*100)/100);const e=$('#fxTwd');if(e)e.value=f.twd}} return }
  if(id==='fxJpy'){f.jpy=val; const e=$('#fxTwd'); f.twd=Number.isFinite(n)?String(Math.round(n*f.rate*100)/100):''; if(e)e.value=f.twd}
  if(id==='fxTwd'){f.twd=val; const e=$('#fxJpy'); f.jpy=Number.isFinite(n)?String(Math.round(n/f.rate)):''; if(e)e.value=f.jpy}
}
document.addEventListener('input',e=>{const id=e.target?.id;if(id==='fxJpy'||id==='fxTwd'||id==='fxRate')fxInput(id,e.target.value)});
function viewTimer(){
  const left=timerLeft(); const t=S.timer;
  if(left!=null&&left>0){
    const total=(t.minutes||1)*60000;
    return `<div class="tmr card">
      <div class="label">${esc(t.by||'有人')} 設定的集合倒數${t.label?`・${esc(t.label)}`:''}</div>
      <div class="ring"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" class="rbg"/><circle id="tmrArc" cx="100" cy="100" r="88" class="rfg" stroke-dasharray="${RING}" stroke-dashoffset="${RING*(1-Math.max(0,left)/total)}"/></svg><div class="rnum mono" id="tmrNum">${fmtT(left)}</div></div>
      <div class="note" style="text-align:center">時間到時，全家手機會響。<br>請保持網頁開著、螢幕不要鎖定。</div>
      <div class="btns"><button class="btn" data-tmr="plus">+5 分鐘</button><button class="btn danger" data-tmr="cancel">取消</button></div></div>`;
  }
  const mins=[10,15,20,30,45,60];
  return `<div class="tmr card">
      <div class="label">各自行動，時間到集合</div>
      <div class="presets">${mins.map(m=>`<button class="pre${m===(S.tmrMin||20)?' on':''}" data-tmrpre="${m}">${m}<small>分</small></button>`).join('')}</div>
      <div class="f"><label for="tmrCustom">自訂分鐘</label><input id="tmrCustom" type="number" inputmode="numeric" min="1" max="240" value="${S.tmrMin||20}"></div>
      <div class="f"><label for="tmrLabel">集合地點（選填）</label><input id="tmrLabel" maxlength="20" placeholder="例如：飯店大廳、阪急門口" value="${esc(S.tmrLabel||'')}"></div>
      <button class="btn primary big" data-tmr="start">開始計時</button>
      <div class="note">按下後，全家手機都會開始倒數。時間到會響鈴和震動，請保持網頁開著、螢幕不要鎖定。</div>
    </div>`;
}
function setTimerObj(minutes,label){
  const t={id:'t'+Date.now(),endsAt:Date.now()+minutes*60000,minutes,label:label||'',by:S.uid||'有人',createdAt:Date.now()};
  return S.db.setTimer(t);
}
async function timerAction(kind){
  if(!S.db){toast('還在載入，請稍後再試');return}
  unlockAudio();
  try{
    if(kind==='start'){
      const m=Math.max(1,Math.min(240,Math.round(+($('#tmrCustom')?.value||S.tmrMin||20))));
      S.tmrMin=m;S.tmrLabel=$('#tmrLabel')?.value.trim()||'';
      try{if('Notification' in window&&Notification.permission==='default')Notification.requestPermission()}catch{}
      await setTimerObj(m,S.tmrLabel);toast(`已開始，${m} 分鐘後集合`);
    }else if(kind==='plus'&&S.timer){await S.db.setTimer({...S.timer,endsAt:S.timer.endsAt+5*60000,minutes:(S.timer.minutes||0)+5})}
    else if(kind==='cancel'){await S.db.setTimer({...(S.timer||{}),cancelled:true});toast('已取消')}
  }catch(e){toast('操作失敗，請檢查網路')}
}
let audioCtx=null,beepT=null,wake=null;
function unlockAudio(){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}catch{}}
document.addEventListener('pointerdown',unlockAudio,{once:false,passive:true});
function beepOnce(){
  if(!audioCtx) return;
  const t0=audioCtx.currentTime;
  [0,.22,.44].forEach(d=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=880;g.gain.setValueAtTime(0,t0+d);g.gain.linearRampToValueAtTime(.5,t0+d+.02);g.gain.linearRampToValueAtTime(0,t0+d+.18);o.connect(g).connect(audioCtx.destination);o.start(t0+d);o.stop(t0+d+.2)});
}
function startRinging(){stopRinging();beepOnce();vib([400,150,400,150,400]);beepT=setInterval(()=>{beepOnce();vib([400,150,400])},1800)}
function stopRinging(){clearInterval(beepT);beepT=null}
function showTimerDone(t,late){
  if($('#tmrDone')) return;
  const m=document.createElement('div');m.id='tmrDone';m.className='flashmodal tmrdone';m.setAttribute('role','alertdialog');
  m.innerHTML=`<div style="font-size:64px">⏰</div><h2>集合時間到！</h2><div>${t.label?`集合地點：<b>${esc(t.label)}</b><br>`:''}${late>60?`已經超過 ${Math.round(late/60)} 分鐘了`:'大家回來囉'}</div><button class="btn" style="background:var(--flash-ink);color:var(--flash);border:0;font-size:18px;padding:14px 32px" data-act="tmr-ok">知道了</button>`;
  document.body.appendChild(m);
  startRinging();
  try{if('Notification' in window&&Notification.permission==='granted'&&document.hidden)new Notification('集合時間到！',{body:t.label||'大家回來囉'})}catch{}
}
function timerTick(){
  const left=timerLeft();
  if(S.timer&&!S.timer.cancelled&&left!=null){
    if(left<=0){
      const seen=ls.get('tmrSeen',{});
      if(!seen[S.timer.id]&&(-left)<30*60000){seen[S.timer.id]=1;ls.set('tmrSeen',seen);showTimerDone(S.timer,-left/1000)}
    }
    if(S.tab==='tools'){
      const sm=$('#sum-timer'); if(sm) sm.textContent=left>0?`倒數 ${fmtT(left)}${S.timer?.label?`・${S.timer.label}`:''}`:'各自行動，時間到全家一起響';
      const n=$('#tmrNum');
      if(left>0&&n){n.textContent=fmtT(left);const a=$('#tmrArc');if(a)a.style.strokeDashoffset=RING*(1-left/((S.timer.minutes||1)*60000))}
      else if(left<=0&&n) render();
    }
    if(left>0&&!wake&&!document.hidden&&navigator.wakeLock){navigator.wakeLock.request('screen').then(w=>{wake=w;w.addEventListener('release',()=>{wake=null})}).catch(()=>{})}
  }
}
setInterval(timerTick,500);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)timerTick()});

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
    [1,2,3].forEach(n=>{const g=ps.filter(p=>p.key===`r-${d}-${n}`);if(g.length)groups.push([`隨機拍 第 ${n} 次`,g])});
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
    ${ph('駐大阪辦事處 緊急聯絡','090-8794-4568','你們這趟的轄區（大阪、京都）。被捕、重大犯罪受害、緊急就醫')}
    ${ph('駐大阪辦事處 上班時間','06-6227-8623','護照遺失、一般領務')}
    ${ph('駐日代表處（東京）緊急聯絡','080-1009-7179','備用，東京總館')}
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
  else if(sh.type==='route'){const s=S.stops.find(x=>x.id===sh.id); if(!s){closeSheet();return} inner=sheetRoute(s)}
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
function routeCard(t,fromName){
  if(!t) return '';
  return `<div class="card"><div class="label" style="margin-bottom:8px">怎麼搭${fromName?`（從 ${esc(fromName)}）`:''}</div>
      ${(t.enter||t.exit)?`<div class="exitbox" style="margin-bottom:12px">${t.enter?`<div><span class="note">上車</span><b>${esc(t.enter)}</b></div>`:''}${t.exit?`<div><span class="note">下車走</span><b>${esc(t.exit)}</b></div>`:''}</div>`:''}
      ${(t.legs||[]).length?`<div class="route">${t.legs.map(legStep).join('')}</div>`:''}
      ${(t.steps||[]).length?`<ol style="margin:4px 0 0;padding-left:20px">${t.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:''}
      ${(t.minutes||t.fare)?`<div class="row note" style="margin-top:8px">${t.minutes?`<span class="mono">約 ${t.minutes} 分鐘</span>`:''}${t.fare?`<span class="mono">車資 ${esc(t.fare)}</span>`:''}</div>`:''}
    </div>`;
}
function showCardHtml(c,id){
  return c?`<button class="btn flash paperbtn" data-paper="${esc(id)}"><span class="pb-t">🎫 買票提示!</span><span class="pb-s">點開給櫃台人員看</span></button>`:'';
}
function openImgView(src,caption){
  if($('#imgView')) return;
  const w=document.createElement('div');w.id='imgView';w.className='imgview';
  w.innerHTML=`<div class="iv-bar"><div class="iv-cap">${esc(caption||'')}</div><button class="iv-x" data-act="imgview-close" aria-label="關閉">${I.x}</button></div><div class="iv-body"><img src="${esc(src)}" alt="" data-act="imgview-zoom"></div><div class="iv-hint">點圖可放大、再點縮回；放大後可拖曳</div>`;
  document.body.appendChild(w); document.body.style.overflow='hidden';
}
function closeImgView(){const w=$('#imgView');if(!w)return;w.remove();if(!S.sheet)document.body.style.overflow=''}
function openPaper(c){
  if($('#paperWrap')) return;
  const w=document.createElement('div');w.id='paperWrap';w.className='paperwrap';
  w.innerHTML=`<div class="paper" role="dialog" aria-modal="true" aria-label="給櫃台人員看的購票資訊"><i class="pbg"></i><i class="rod t"></i><i class="rod b"></i>
    <button class="paperx" data-act="paper-close" aria-label="關閉">${I.x}</button>
    <div class="paperin"><div class="plabel">${esc(c.label)}</div>${c.ja.map((x,i)=>`<div class="pjp${i===0?' first':''}">${esc(x)}</div>`).join('')}<div class="pzh">${esc(c.zh)}</div></div></div>`;
  document.body.appendChild(w);
  document.body.style.overflow='hidden';
}
function closePaper(){
  const w=$('#paperWrap'); if(!w||w.classList.contains('closing')) return;
  const done=()=>{w.remove();if(!S.sheet)document.body.style.overflow=''};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){done();return}
  w.classList.add('closing');
  w.querySelector('.pbg').addEventListener('animationend',done,{once:true});
  setTimeout(done,1000);
}
function floorMapHtml(x){
  const m=x.floorMap; if(!m) return '';
  return `<div class="card"><div class="label" style="margin-bottom:8px">店內位置</div><a href="${esc(m.src)}" target="_blank" rel="noopener"><img src="${esc(m.src)}" alt="${esc(m.caption)}" loading="lazy" style="width:100%;height:auto;border-radius:10px;display:block"></a><div class="note" style="margin-top:8px">${esc(m.caption)}<br>點圖可放大。</div></div>`;
}
function imgsHtml(x){
  const imgs=(x.transit?.images||[]);
  if(!(imgs.length||(x.links||[]).length)) return '';
  return `<div class="card"><div class="label" style="margin-bottom:8px">車站實拍與官方連結</div>
      ${imgs.length?`<div class="imgs">${imgs.map(im=>`<figure><a href="${esc(im.src)}" target="_blank" rel="noopener"><img src="${esc(im.src)}" alt="${esc(im.caption||'車站圖')}" loading="lazy"></a>${im.caption?`<figcaption>${esc(im.caption)}</figcaption>`:''}</figure>`).join('')}</div>`:''}
      <div class="row" style="margin-top:8px">${(x.links||[]).map(k=>`<a class="btn ghost" href="${esc(k.url)}" target="_blank" rel="noopener">${esc(k.label)}</a>`).join('')}</div>
    </div>`;
}
// 去 dest 要看的全部內容：給櫃台的卡片、路線、實拍圖
function routeBundle(dest,from){
  return `${showCardHtml(dest.showCard,dest.id)}${routeCard(dest.transit,from?.name)}${imgsHtml(dest)}`;
}
function bullets(text){
  const items=String(text||'').split(/\n|。/).map(x=>x.trim()).filter(Boolean);
  if(!items.length) return '';
  return `<ul class="bul">${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
}
function sheetRoute(s){
  const prev=prevOf(s);
  return `<div class="grab"><div class="wrap"><div class="head"><div class="grow"><div class="label">${md(s.day)}${s.time?'・'+esc(s.time):''}</div><h2><span class="em" aria-hidden="true">${emojiOf(guessArt(s))}</span>去 ${esc(s.name)}</h2>${prev?`<div class="note">從 ${esc(prev.name)}</div>`:''}</div><button class="x" data-act="close" aria-label="關閉">${I.x}</button></div></div></div>
  <div class="wrap">
    <div class="btns">
      <a class="btn primary" href="${esc(gmaps(s,prev))}" target="_blank" rel="noopener">${I.map}導航</a>
      <a class="btn" href="${esc(uber(s,prev))}" target="_blank" rel="noopener">${I.car}Uber</a>
    </div>
    ${routeBundle(s,prev)}
  </div>`;
}
function sheetStop(s){
  const prev=prevOf(s); const now=jst(); const st=hoursState(s,now);
  const h=s.hours||{};
  const key='s-'+s.id; const mine=myPhoto(key);
  const all=S.photos.filter(p=>p.key===key);
  return `${s.photo?`<div class="hero">${photoBanner(s.photo,170)}</div>`:''}<div class="grab"><div class="wrap"><div class="head"><div class="grow"><div class="label">${md(s.day)}${s.time?'・'+esc(s.time):''}</div><h2><span class="em" aria-hidden="true">${emojiOf(guessArt(s))}</span>${esc(s.name)}</h2>${s.nameJa?`<div class="note">${esc(s.nameJa)}</div>`:''}</div>${s.kind==='added'?`<button class="btn ghost" style="min-height:34px;padding:4px 10px;font-size:13px" data-edit="${esc(s.id)}">編輯</button>`:''}<button class="x" data-act="close" aria-label="關閉">${I.x}</button></div></div></div>
  <div class="wrap">
    ${st&&st.kind!=='info'&&st.kind!=='open'?`<div class="banner ${st.kind==='soon'?'warn':'bad'}"><div><b>${esc(st.text)}</b></div></div>`:''}
    <div class="card"><div class="label" style="margin-bottom:8px">這站資訊</div>
      <div class="infogrid${s.floorMap?' hasmap':''}"><div class="infomain">
      <dl class="kv">
        ${(h.open||h.close)?`<dt>營業</dt><dd class="mono">${h.open&&h.close?`${esc(h.open)}–${esc(h.close)}`:h.open?`${esc(h.open)} 起`:`至 ${esc(h.close)}`}</dd>`:''}
        ${h.lastEntry?`<dt>最後入場</dt><dd class="mono">${esc(h.lastEntry)}</dd>`:''}
        ${(h.closedDays||[]).length?`<dt>公休</dt><dd>週${h.closedDays.map(d=>DOW[d]).join('、')}</dd>`:''}
        ${h.note?`<dt>備註</dt><dd>${esc(h.note)}</dd>`:''}
        ${s.price?`<dt>門票</dt><dd>${esc(s.price)}</dd>`:''}
        ${s.duration?`<dt>建議停留</dt><dd>${esc(s.duration)}</dd>`:''}
        ${s.address||s.addressJa?`<dt>地址</dt><dd><a href="${esc(gplace(s))}" target="_blank" rel="noopener">${esc(s.addressJa||s.address)}</a></dd>`:''}
      </dl>
      ${!(h.open||h.close||s.price||s.address||s.addressJa)?'<div class="note">還沒填營業時間或門票。</div>':''}
      ${bullets(s.notes)}
      </div>${s.floorMap?`<button class="mapthumb" data-imgview="${esc(s.id)}" aria-label="放大樓層圖"><img src="${esc(s.floorMap.src)}" alt="" loading="lazy"><span>樓層圖・點擊放大</span></button>`:''}</div>
    </div>
    ${s.transit||s.showCard?routeBundle(s,prev):''}
    <div class="card"><div class="row" style="margin-bottom:8px"><div class="label grow">打卡照片・每人一張</div><span class="note">${all.length} 張</span></div>
      ${all.length?`<div class="pgrid" style="margin-bottom:10px">${all.map(thumb).join('')}</div>`:''}
      ${mine?`<div class="note">你已經在這裡拍過了。</div>`:`<button class="btn flash" style="width:100%" data-shoot="${esc(key)}">${I.cam}打卡拍照（只能拍一次）</button>`}
    </div>
  </div>`;
}
function legStep(l){
  if(l.type==='taxi') return `<div class="rstep"><div class="dot walk"><span style="--c:var(--muted)"></span></div><div class="txt"><b>搭計程車${l.minutes?` 約 ${l.minutes} 分鐘`:''}</b>${l.text?`<div class="note">${esc(l.text)}</div>`:''}</div></div>`;
  if(l.type==='walk') return `<div class="rstep"><div class="dot walk"><span style="--c:var(--muted)"></span></div><div class="txt"><b>步行${l.minutes?` ${l.minutes} 分鐘`:''}</b>${l.text?`<div class="note">${esc(l.text)}</div>`:''}</div></div>`;
  return `<div class="rstep" style="--c:${esc(l.color||'#777')}"><div class="dot"><span></span></div><div class="txt">
    <b>${esc(l.from||'')} 上車</b>
    <span class="chip" style="--c:${esc(l.color||'#777')};margin:4px 0"><i>${esc(l.code||'')}</i>${esc(l.line||'')}</span>
    ${l.direction?`<div>往 <b style="display:inline">${esc(l.direction)}</b> 方向</div>`:''}
    <div class="note">${[l.platform&&`${l.platform} 月台`, l.car&&`建議車廂：${l.car}`].filter(Boolean).map(esc).join('・')}</div>
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
    if(doc.stopId) S.db.saveStop(doc.stopId,{visited:true}).catch(()=>{});
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
/* ---------- 液態玻璃底部欄 ---------- */
const TAB_ORDER=['plan','album','__add','tools','sos'];
let lensIdx=0;
/* 選取玻璃圈：每個畫面用彈簧物理計算位置與大小，跟著手指連續滑動；速度越快越拉長 */
const L={x:0,tx:0,v:0,s:1,ts:1,sv:0,raf:0,last:0,inited:false,hot:-1,down:false};
function pillEls(){const pill=$('#pill');return pill?{pill,lens:$('#lens'),tabs:[...pill.querySelectorAll('.tab')]}:null}
const tabW=()=>{const e=pillEls();return e?(e.pill.clientWidth-10)/5:0};
const lensPos=i=>i*tabW();
function applyLens(){
  const e=pillEls(); if(!e) return;
  const sp=Math.min(.22,Math.abs(L.v)/3500);
  e.lens.style.transform=`translate3d(${L.x.toFixed(2)}px,0,0) scale(${(L.s*(1+sp)).toFixed(4)},${(L.s*(1-sp*.35)).toFixed(4)})`;
  if(L.down){const c=Math.max(0,Math.min(4,Math.round(L.x/tabW())));if(c!==L.hot){L.hot=c;e.tabs.forEach((t,k)=>t.classList.toggle('hot',k===c));vib(6)}}
}
function stepLens(t){
  const dt=Math.min(.032,((t-L.last)/1000)||.016); L.last=t;
  const kx=430,cx=2*Math.sqrt(kx)*.8;
  L.v+=(kx*(L.tx-L.x)-cx*L.v)*dt; L.x+=L.v*dt;
  const ks=380,cs=2*Math.sqrt(ks)*.6;
  L.sv+=(ks*(L.ts-L.s)-cs*L.sv)*dt; L.s+=L.sv*dt;
  applyLens();
  if(Math.abs(L.tx-L.x)<.12&&Math.abs(L.v)<1.5&&Math.abs(L.ts-L.s)<.002&&Math.abs(L.sv)<.04){L.x=L.tx;L.s=L.ts;L.v=0;L.sv=0;applyLens();L.raf=0;return}
  L.raf=requestAnimationFrame(stepLens);
}
function kick(){ if(!L.raf){L.last=performance.now();L.raf=requestAnimationFrame(stepLens)} }
function syncLens(){
  const e=pillEls(); if(!e) return;
  lensIdx=Math.max(0,TAB_ORDER.indexOf(S.tab));
  L.tx=lensPos(lensIdx);
  if(!L.inited){L.x=L.tx;L.inited=true;applyLens()} else if(!L.down) kick();
}
function tabAt(clientX){
  const {pill}=pillEls(); const r=pill.getBoundingClientRect();
  return Math.max(0,Math.min(4,Math.floor((clientX-r.left-5)/((r.width-10)/5))));
}
function initPill(){
  const e=pillEls(); if(!e) return; const {pill,lens,tabs}=e;
  let synth=false,downT=0;
  pill.addEventListener('click',ev=>{ if(!synth&&ev.detail>0){ev.stopPropagation();ev.preventDefault()} },true);
  const fingerX=x=>{const r=pill.getBoundingClientRect();const w=(r.width-10)/5;return Math.max(0,Math.min(4*w,x-r.left-5-w/2))};
  pill.addEventListener('pointerdown',ev=>{
    if(ev.button>0) return;
    try{pill.setPointerCapture(ev.pointerId)}catch{}
    L.down=true; L.hot=-1; downT=Date.now();
    lens.classList.add('up'); L.ts=1.32; L.tx=fingerX(ev.clientX); kick(); vib(8);
  });
  pill.addEventListener('pointermove',ev=>{ if(!L.down) return; L.tx=fingerX(ev.clientX); kick(); });
  const end=(ev,cancel)=>{
    if(!L.down) return;
    const idx=cancel?-1:tabAt(ev.clientX);
    setTimeout(()=>{
      L.down=false; L.hot=-1; tabs.forEach(t=>t.classList.remove('hot'));
      lens.classList.remove('up');
      const target=idx>=0&&TAB_ORDER[idx]!=='__add'?idx:lensIdx;
      L.tx=lensPos(target); L.ts=1; kick();
      if(idx>=0){synth=true;tabs[idx].dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));synth=false}
    },Math.max(0,170-(Date.now()-downT)));  // 輕點也會先放大再縮回
  };
  pill.addEventListener('pointerup',ev=>end(ev,false));
  pill.addEventListener('pointercancel',ev=>end(ev,true));
  window.addEventListener('resize',()=>{L.x=L.tx=lensPos(lensIdx);applyLens()});
  syncLens();
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-day],[data-tab],[data-act],[data-open],[data-shoot],[data-visit],[data-edit],[data-del],[data-view],[data-copy],[data-rename],[data-paper],[data-route],[data-imgview],[data-tmr],[data-tmrpre],[data-fx]');
  if(!t) return;
  const d=t.dataset;
  if(d.day){S.day=d.day;ls.set('day',{d:d.day,at:jst().date});render();window.scrollTo({top:0})}
  else if(d.tab){S.tab=d.tab;render();window.scrollTo({top:0})}
  else if(d.fx){const f=S.fx;if(d.fx==='clear'){f.jpy='';f.twd=''}else{f.jpy=d.fx;f.twd=String(Math.round(+d.fx*f.rate*100)/100)}const j=$('#fxJpy'),t=$('#fxTwd');if(j)j.value=f.jpy;if(t)t.value=f.twd}
  else if(d.tmr){timerAction(d.tmr)}
  else if(d.tmrpre){S.tmrMin=+d.tmrpre;const c=$('#tmrCustom');if(c)c.value=d.tmrpre;document.querySelectorAll('.pre').forEach(b=>b.classList.toggle('on',b.dataset.tmrpre===d.tmrpre))}
  else if(d.act==='push-on'){enablePush()}
  else if(d.act==='tmr-ok'){if(S.timer)S.db?.ack?.(`timer-${S.timer.id}-${S.timer.endsAt}`).catch(()=>{});stopRinging();$('#tmrDone')?.remove();if(S.tab==='tools')render()}
  else if(d.imgview){const m=S.stops.find(x=>x.id===d.imgview)?.floorMap;if(m)openImgView(m.src,m.caption)}
  else if(d.route){e.preventDefault();openSheet({type:'route',id:d.route})}
  else if(d.open){e.preventDefault();openSheet({type:'stop',id:d.open})}
  else if(d.shoot) startShoot(d.shoot);
  else if(d.view) openSheet({type:'photo',id:d.view,back:S.sheet});
  else if(d.edit) openSheet({type:'form',id:d.edit});
  else if(d.paper){const c=S.stops.find(x=>x.id===d.paper)?.showCard;if(c)openPaper(c)}
  else if(d.rename){askName(true)}
  else if(d.copy){const v=d.copy;navigator.clipboard?.writeText(v).then(()=>toast('已複製 '+v),()=>toast(v))}
  else if(d.visit){const s=S.stops.find(x=>x.id===d.visit);if(s&&S.db)S.db.saveStop(s.id,{visited:!s.visited}).catch(()=>toast('儲存失敗'))}
  else if(d.del){S.db?.deleteStop(d.del).then(()=>{toast('已刪除');closeSheet()},()=>toast('刪除失敗'))}
  else if(d.act==='jump-next'){document.getElementById('nextAnchor')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}
  else if(d.act==='imgview-close'){closeImgView()}
  else if(d.act==='imgview-zoom'){t.closest('.iv-body').classList.toggle('zoomed')}
  else if(d.act==='paper-close'){closePaper()}
  else if(d.act==='close'){ if(S.sheet?.type==='photo'&&S.sheet.back){S.sheet=S.sheet.back;renderSheet()} else closeSheet() }
  else if(d.act==='add'){ openSheet({type:'form',day:S.day}) }
  else if(d.act==='askdel'){S.sheet.confirmDel=true;renderSheet()}
  else if(d.act==='nodel'){S.sheet.confirmDel=false;renderSheet()}
  else if(d.act==='export-all') exportAlbum(false);
  else if(d.act==='export-mine') exportAlbum(true);
  else if(d.act==='flash-go'){S.db?.ack?.('r-'+photoKeyFor(S.uid,d.key)).catch(()=>{});$('#flashModal')?.remove();startShoot(d.key)}
  else if(d.act==='flash-later'){S.db?.ack?.('r-'+photoKeyFor(S.uid,d.key)).catch(()=>{});$('#flashModal')?.remove()}
});
document.addEventListener('submit',e=>{if(e.target.id==='stopForm'){e.preventDefault();submitForm(e.target)}});
$('#cam').addEventListener('change',e=>onShot(e.target.files[0]));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if($('#imgView'))closeImgView();else if($('#paperWrap'))closePaper();else if(S.sheet)closeSheet()}});

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
        m.innerHTML=`<div style="width:56px;height:56px">${I.bolt}</div><h2>隨機拍時間到！</h2><div>現在拍一張！${ONTIME_MIN} 分鐘內算準時</div><div class="mono">${hm(t)}</div><button class="btn" style="background:var(--flash-ink);color:var(--flash);border:0;font-size:18px;padding:14px 28px" data-act="flash-go" data-key="${key}">${I.cam}現在拍</button><button class="btn ghost" style="color:inherit;border-color:currentColor" data-act="flash-later" data-key="${key}">等一下</button>`;
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
  loadFx(); initPill(); initDay(); S.uid=ls.get('me',null); loadCache(); render(); tick();
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
  db.onTimer(t=>{S.timer=t;timerTick();if(S.tab==='tools'&&!document.activeElement?.matches?.('input'))render()},()=>{});
  if(!S.uid) setTimeout(()=>{if(!S.uid)askName()},600);
  if(S.uid&&db.enablePush&&ls.get('pushOn',false)&&typeof Notification!=='undefined'&&Notification.permission==='granted') db.enablePush(S.uid).catch(()=>{});
}
boot();
})();
