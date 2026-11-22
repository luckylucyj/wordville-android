/* Offline, single-player Wordville minigames and personal room. No matchmaking. */
(() => {
 'use strict';
 const model=globalThis.WordvilleSoloModel;
 const host=document.querySelector('main');
 if(!host||!model)return;
 const byId=id=>document.getElementById(id);
 const storeKey='wordville.solo-learning.v1';
 const games={
  fish:{name:'단어 낚시',icon:'🎣',description:'한국어 뜻을 보고 맞는 영단어를 낚으세요.',prize:'잡은 물고기'},
  wood:{name:'단어 벌목',icon:'🪓',description:'영단어와 일치하는 한국어 뜻을 골라 나무를 베세요.',prize:'모은 통나무'},
  capture:{name:'예문 포획',icon:'🐑',description:'기존 영어 예문의 빈칸에 알맞은 단어를 넣으세요.',prize:'발견한 동물'}
 };
 const furniture=[
  {id:'rug',name:'크림 러그',icon:'🟠',cost:12},
  {id:'lamp',name:'작은 스탠드',icon:'💡',cost:18},
  {id:'plant',name:'화분',icon:'🪴',cost:22},
  {id:'desk',name:'책상',icon:'🪑',cost:28},
  {id:'books',name:'책장',icon:'📚',cost:35},
  {id:'aquarium',name:'수족관',icon:'🐠',cost:48},
  {id:'sofa',name:'폭신한 소파',icon:'🛋️',cost:55},
  {id:'bed',name:'포근한 침대',icon:'🛏️',cost:65}
 ];
 const themes=[
  {id:'cream',name:'따뜻한 방',cost:0},
  {id:'mint',name:'민트 벽지',cost:25},
  {id:'sky',name:'하늘 벽지',cost:25}
 ];
 const fresh=()=>({version:1,stats:Object.fromEntries(Object.keys(games).map(k=>[k,{plays:0,correct:0,best:0}])),
  mistakes:{},learned:[],frames:[],owned:[],placed:[],slots:{},wallpapers:['cream'],theme:'cream',
  date:'',dailyCorrect:0,dailyBonus:false,earned:0});
 let progress=fresh();
 try{
  const v=JSON.parse(localStorage.getItem(storeKey)||'null');
  if(v&&v.version===1&&typeof v==='object'){
   progress={...progress,...v,
    stats:{...progress.stats,...(v.stats||{})},
    mistakes:v.mistakes&&typeof v.mistakes==='object'&&!Array.isArray(v.mistakes)?v.mistakes:{},
    learned:Array.isArray(v.learned)?v.learned.slice(-5000):[],
    frames:Array.isArray(v.frames)?v.frames.slice(0,4):[],
    owned:Array.isArray(v.owned)?v.owned:[],placed:Array.isArray(v.placed)?v.placed:[],
    slots:v.slots&&typeof v.slots==='object'?v.slots:{},
    wallpapers:Array.isArray(v.wallpapers)?v.wallpapers:['cream']};
  }
 }catch{}
 const saveProgress=()=>{
  try{localStorage.setItem(storeKey,JSON.stringify(progress));document.dispatchEvent(new Event('wordville-record-changed'));return true;}
  catch{return false;}
 };
 const el=(tag,cls,txt)=>{
  const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;
 };
 function button(label,fn,cls=''){
  const b=el('button',cls,label);b.type='button';b.addEventListener('click',fn);return b;
 }
 const screen=el('section','wv-solo-screen');
 screen.id='wv-solo-view';screen.hidden=true;
 screen.innerHTML=`
 <div class="wv-solo-heading"><small>WORDVILLE · SOLO VOCABULARY</small>
 <h2>🎮 나만의 영어 게임</h2>
 <p>영상에서 본 낚시·벌목·예문 포획과 나의 방을 혼자 즐겨요. 친구 대결과 온라인 순위는 없습니다.</p></div>
 <div class="wv-solo-wallet" aria-live="polite">
  <span id="wv-solo-coins">🪙 0 코인</span>
  <span id="wv-solo-streak">🔥 연속 정답 0</span>
  <span id="wv-solo-daily">오늘 0 / 10 정답</span>
 </div>
 <div class="wv-solo-topnav" role="group" aria-label="게임 및 내 방 선택">
  <button type="button" data-solo-tab="fish">🎣 낚시</button>
  <button type="button" data-solo-tab="wood">🪓 벌목</button>
  <button type="button" data-solo-tab="capture">🐑 포획</button>
  <button type="button" data-solo-tab="room">🏠 나의 방</button>
 </div>
 <section id="wv-solo-game-view">
  <p id="wv-solo-description"></p>
  <div class="wv-solo-controls">
   <label>학습 범위<select id="wv-solo-day"><option value="all">전체 Day</option></select></label>
   <label>문제 선택<select id="wv-solo-filter"><option value="all">모든 단어</option><option value="due">복습할 단어</option><option value="wrong">틀렸던 단어</option></select></label>
  </div>
  <div class="wv-solo-scene" id="wv-solo-scene" data-game="fish">
    <div class="wv-solo-scene-art" id="wv-solo-scene-art" aria-hidden="true">🎣 🐟</div>
    <span class="wv-solo-scene-counter" id="wv-solo-counter">0개 획득</span>
  </div>
  <div class="wv-solo-question" id="wv-solo-question">
   <div class="wv-solo-question-top"><span id="wv-solo-round">1번째 문제</span><span id="wv-solo-score">정답 0 / 0</span></div>
   <p class="wv-solo-prompt" id="wv-solo-prompt">아래 시작 버튼을 눌러 주세요.</p>
   <div class="wv-solo-choices" id="wv-solo-choices"></div>
   <p id="wv-solo-feedback" role="status" aria-live="polite"></p>
   <div class="wv-solo-actions">
    <button type="button" id="wv-solo-next" class="primary">학습 시작</button>
    <button type="button" id="wv-solo-restart">새 게임</button>
   </div>
  </div>
  <div class="wv-solo-stats" id="wv-solo-stats"></div>
  <p class="wv-solo-note">기존 VOCA의 뜻과 원문 예문을 사용합니다. 정답은 기존 복습 주기에 반영되며, 복습 가능 시 코인이 지급됩니다. 오답은 10분 뒤 복습할 수 있습니다.</p>
 </section>
 <section id="wv-solo-room-view" hidden>
  <h3>🏠 나의 방 꾸미기</h3>
  <p>공부해서 얻은 Wordvile 코인으로 가구를 구매하세요. 배운 단어는 액자에 걸 수 있습니다.</p>
  <div class="wv-solo-room" id="wv-solo-room" data-theme="cream">
   <div class="wv-solo-room-wall">
    <span class="wv-solo-window" aria-hidden="true">☁️</span>
    <div class="wv-solo-frames" id="wv-solo-frames"></div>
   </div>
   <div class="wv-solo-room-floor" id="wv-solo-room-floor">
    <div class="wv-solo-mascot" aria-hidden="true">🐻</div>
    <div id="wv-solo-furniture" class="wv-solo-furniture"></div>
   </div>
  </div>
  <div class="wv-solo-room-tools">
   <label>배운 단어로 액자 만들기<select id="wv-solo-frame-word"><option value="">단어를 먼저 학습하세요</option></select></label>
   <button type="button" id="wv-solo-frame-add">단어 액자 걸기</button>
  </div>
  <h4>벽지 바꾸기</h4><div id="wv-solo-themes" class="wv-solo-shop"></div>
  <h4>가구 상점 · 구매한 가구는 배치/숨기기</h4><div id="wv-solo-shop" class="wv-solo-shop"></div>
  <p id="wv-solo-room-status" role="status" aria-live="polite"></p>
 </section>`;
 host.append(screen);
 const get=id=>byId('wv-solo-'+id);
 let mode='fish',round=null,locked=false,seen=[],streak=0,session={plays:0,correct:0};
 function listWords(){
  return Array.isArray(globalThis.WordvilleWords)?globalThis.WordvilleWords:[];
 }
 const wallet=()=>typeof state!=='undefined'&&Number.isFinite(state?.coins)?state.coins:0;
 const reviews=()=>typeof state!=='undefined'&&state?.reviews?state.reviews:{};
 function updateWallet(delta){
  if(typeof save!=='function'||typeof state==='undefined'||!Number.isFinite(state.coins))return false;
  return save({...state,coins:Math.max(0,state.coins+delta)});
 }
 function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
 function resetDate(){
  if(progress.date===today())return;
  progress.date=today();progress.dailyCorrect=0;progress.dailyBonus=false;saveProgress();
 }
 function updateHeading(){
  resetDate();
  get('coins').textContent='🪙 '+wallet().toLocaleString()+' 코인';
  get('streak').textContent='🔥 연속 정답 '+streak;
  get('daily').textContent='오늘 '+progress.dailyCorrect+' / 10 정답'+(progress.dailyBonus?' · 보너스 완료':'');
 }
 function loadDays(){
  const select=get('day'),current=select.value;
  const days=[...new Set(listWords().flatMap(w=>w.days||[]))].sort((a,b)=>a-b);
  select.replaceChildren(new Option('전체 Day','all'),...days.map(n=>new Option(n===0?'이디엄':'Day '+String(n).padStart(2,'0'),String(n))));
  select.value=[...select.options].some(o=>o.value===current)?current:'all';
 }
 function setTab(tab){
  if(!(tab==='room'||games[tab]))return;
  if(games[tab])mode=tab;
  get('game-view').hidden=tab==='room';
  get('room-view').hidden=tab!=='room';
  screen.querySelectorAll('[data-solo-tab]').forEach(b=>{const active=b.dataset.soloTab===tab;b.setAttribute('aria-pressed',String(active));});
  if(tab==='room'){renderRoom();return;}
  get('description').textContent=games[mode].description;
  get('scene').dataset.game=mode;
  renderGame();
 }
 function scene(){
  get('scene-art').textContent=mode==='fish'?'🎣  🌊  🐟':mode==='wood'?'🌲  🪓  🌳':'🌿  🐑  🌼';
  get('counter').textContent=(progress.stats[mode]?.correct||0)+'개 '+games[mode].prize;
 }
 function renderStats(){
  const stats=get('stats');stats.replaceChildren();
  for(const [key,game] of Object.entries(games)){
   const v=progress.stats[key]||{plays:0,correct:0,best:0};
   const acc=v.plays?Math.round(100*v.correct/v.plays):0;
   stats.append(el('div','wv-solo-stat',game.icon+' '+game.name+' · '+v.correct+'/'+v.plays+' 정답 ('+acc+'%) · 최고 '+v.best+'연속'));
  }
 }
 function renderGame(){
  updateHeading();renderStats();scene();
  get('round').textContent=(session.plays+1)+'번째 문제';
  get('score').textContent='정답 '+session.correct+' / '+session.plays;
  if(!round){
   get('prompt').textContent='학습 시작을 누르면 단어가 출제됩니다.';
   get('choices').replaceChildren();
   get('feedback').textContent='';
   get('next').textContent='학습 시작';
  }
 }
 function start(){
  if(!listWords().length){
   get('feedback').textContent='단어장을 불러오는 중입니다. 단어 학습 탭에 접속한 뒤 다시 시도해 주세요.';
   return;
  }
  const item=model.question(listWords(),{mode,day:get('day').value,filter:get('filter').value,reviews:reviews(),
   mistakes:progress.mistakes,seen});
  if(!item){
   round=null;locked=false;
   get('prompt').textContent='현재 조건에서 객관식 문제 4개를 구성할 단어가 부족합니다.';
   get('feedback').textContent='학습 범위를 전체 Day / 모든 단어로 변경해 주세요.';
   get('choices').replaceChildren();get('next').textContent='다시 출제';
   return;
  }
  seen.push(item.id);if(seen.length>1000)seen=seen.slice(-500);
  round=item;locked=false;
  get('round').textContent=(session.plays+1)+'번째 문제';
  get('next').hidden=true;
  get('score').textContent='정답 '+session.correct+' / '+session.plays;
  get('feedback').textContent='';
  get('prompt').textContent=mode==='fish'?'뜻: '+item.prompt:mode==='wood'?'단어: '+item.prompt:item.prompt;
  get('choices').replaceChildren();
  item.choices.forEach((option,index)=>{
   const b=button((index+1)+'. '+option,()=>submit(option,b),'wv-solo-choice');
   b.dataset.answer=option;get('choices').append(b);
  });
  scene();
 }
 function submit(choice,buttonEl){
  if(!round||locked)return;
  locked=true;
  const correct=choice===round.answer,now=Date.now(),eligible=model.reviewEligible(reviews(),round.id,now);
  const currentStats=progress.stats[mode]||{plays:0,correct:0,best:0};
  let bonus=0,original=0,daily=0;
  if(typeof Wordville!=='undefined'&&typeof state!=='undefined'&&typeof save==='function'){
   const before=wallet();
   let next=Wordville.review(state,round.id,correct,now);
   if(correct){
    bonus=model.reward(streak+1,eligible);
    const rewardToday=progress.dailyCorrect+1>=10&&!progress.dailyBonus;
    daily=rewardToday?15:0;
    next={...next,coins:next.coins+bonus+daily};
   }
   if(!save(next)){get('feedback').textContent='학습 기록을 저장하지 못했습니다. 저장 공간을 확인해 주세요.';locked=false;return;}
   original=next.coins-before-bonus-daily;
  }
  currentStats.plays=(currentStats.plays||0)+1;
  currentStats.correct=(currentStats.correct||0)+(correct?1:0);
  session.plays++;if(correct)session.correct++;
  streak=correct?streak+1:0;
  currentStats.best=Math.max(currentStats.best||0,streak);
  progress.stats[mode]=currentStats;
  if(correct){
   delete progress.mistakes[round.id];
   if(!progress.learned.includes(round.id))progress.learned.push(round.id);
   if(!progress.frames.includes(round.id)&&progress.frames.length<4)progress.frames.push(round.id);
   progress.dailyCorrect++;
   if(daily)progress.dailyBonus=true;
   progress.earned+=Math.max(0,original+bonus+daily);
  }else progress.mistakes[round.id]=(progress.mistakes[round.id]||0)+1;
  if(!saveProgress()){
   get('feedback').textContent='단어 기록은 반영됐지만 게임 장식 기록 저장에 실패했습니다.';
  }
  get('choices').querySelectorAll('button').forEach(b=>{
   b.disabled=true;
   if(b.dataset.answer===round.answer)b.classList.add('correct');
   if(b===buttonEl&&!correct)b.classList.add('incorrect');
  });
  let message=(correct?'✅ 정답!':'❌ 오답. 정답: '+round.answer)+
   ' · '+round.word.word+' = '+round.meaning;
  if(correct)message+=' · +'+(original+bonus+daily)+' 코인'+(daily?' (하루 10문제 보너스)':'');
  if(mode==='capture')message+=' · '+round.example+(round.translation?' / '+round.translation:'');
  if(mode==='fish'&&correct)get('scene-art').textContent='🎣  🐟✨  💦';
  if(mode==='wood'&&correct)get('scene-art').textContent='🪵  🪓  ✨';
  if(mode==='capture'&&correct)get('scene-art').textContent='🐑  ✨  🏡';
  get('feedback').textContent=message;
  get('next').hidden=false;get('next').textContent='다음 문제';
  get('score').textContent='정답 '+session.correct+' / '+session.plays;
  sceneStatsOnly();updateHeading();
 }
 function sceneStatsOnly(){
  get('counter').textContent=(progress.stats[mode]?.correct||0)+'개 '+games[mode].prize;
  renderStats();
 }
 function newSession(){
  round=null;seen=[];streak=0;session={plays:0,correct:0};locked=false;
  get('next').hidden=false;get('next').textContent='학습 시작';
  renderGame();
 }
 function roomMessage(message){get('room-status').textContent=message;updateHeading();}
 function spend(cost){
  if(wallet()<cost)return false;
  return updateWallet(-cost);
 }
 function roomItem(id){return furniture.find(x=>x.id===id);}
 function renderRoom(){
  updateHeading();
  const available=new Map(listWords().map(w=>[w.id,w]));
  get('room').dataset.theme=themes.some(t=>t.id===progress.theme)?progress.theme:'cream';
  const frames=get('frames');frames.replaceChildren();
  for(const id of progress.frames.slice(-4)){
   const w=available.get(id);if(!w)continue;
   const frame=el('div','wv-solo-frame');
   frame.append(el('small','', 'WORD CARD'),el('strong','',w.word),el('small','',model.firstMeaning(w)));
   frames.append(frame);
  }
  if(!frames.children.length)frames.append(el('span','wv-solo-room-empty','정답을 맞히면 배운 단어가 액자로 걸립니다.'));
  const list=get('frame-word');const old=list.value;
  list.replaceChildren(new Option('액자로 걸 단어 선택',''));
  for(const id of progress.learned.slice(-300).reverse()){
   const w=available.get(id);if(w)list.append(new Option(w.word+' · '+model.firstMeaning(w),id));
  }
  list.value=[...list.options].some(o=>o.value===old)?old:'';
  const floor=get('furniture');floor.replaceChildren();
  for(const id of progress.placed){
   const item=roomItem(id);if(!item||!progress.owned.includes(id))continue;
   const spot=el('span','wv-solo-room-object',item.icon);
   spot.dataset.item=id;spot.title=item.name;
   const slot=Number(progress.slots[id]);spot.style.setProperty('--slot',String(Number.isInteger(slot)&&slot>=0&&slot<6?slot:furniture.indexOf(item)%6));
   spot.addEventListener('click',()=>moveItem(id));
   floor.append(spot);
  }
  const themeShop=get('themes');themeShop.replaceChildren();
  for(const t of themes){
   const owned=progress.wallpapers.includes(t.id),active=progress.theme===t.id;
   const b=button(t.name+(active?' · 적용 중':owned?' · 적용': ' · '+t.cost+' 코인'),()=>{
    if(!owned){
     if(!spend(t.cost)){roomMessage('코인이 부족합니다. 게임으로 단어를 공부해 주세요.');return;}
     progress.wallpapers.push(t.id);
    }
    progress.theme=t.id;
    if(!saveProgress()){roomMessage('벽지 변경을 저장하지 못했습니다.');return;}
    renderRoom();roomMessage(t.name+' 벽지를 적용했습니다.');
   },'wv-solo-shop-button');b.disabled=active;themeShop.append(b);
  }
  const shop=get('shop');shop.replaceChildren();
  for(const f of furniture){
   const owned=progress.owned.includes(f.id),placed=progress.placed.includes(f.id);
   const card=el('div','wv-solo-shop-item');
   card.append(el('span','wv-solo-shop-icon',f.icon),el('strong','',f.name));
   card.append(button(owned?(placed?'숨기기':'배치하기'):'구매 · '+f.cost+' 코인',()=>{
    if(!owned){
     if(!spend(f.cost)){roomMessage('코인이 부족합니다. 게임에서 정답을 맞혀 보세요.');return;}
     progress.owned.push(f.id);progress.placed.push(f.id);progress.slots[f.id]=progress.owned.length%6;
    }else if(placed)progress.placed=progress.placed.filter(x=>x!==f.id);
    else progress.placed.push(f.id);
    if(!saveProgress()){roomMessage('가구 변경 기록을 저장하지 못했습니다.');return;}
    renderRoom();roomMessage(f.name+(owned?' 상태를 변경했습니다.':' 구매·배치 완료!'));
   }));
   if(placed)card.append(button('위치 바꾸기 ↔',()=>moveItem(f.id),'wv-solo-move'));
   shop.append(card);
  }
 }
 function moveItem(id){
  if(!progress.owned.includes(id))return;
  progress.slots[id]=(Number(progress.slots[id]||0)+1)%6;
  if(!saveProgress()){roomMessage('가구 위치를 저장하지 못했습니다.');return;}
  renderRoom();roomMessage(roomItem(id).name+' 위치를 변경했습니다.');
 }
 screen.querySelectorAll('[data-solo-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.soloTab)));
 get('next').addEventListener('click',start);
 get('restart').addEventListener('click',newSession);
 for(const id of ['day','filter'])get(id).addEventListener('change',newSession);
 get('frame-add').addEventListener('click',()=>{
  const id=get('frame-word').value;
  if(!id||!progress.learned.includes(id)){roomMessage('먼저 단어를 학습한 후 선택해 주세요.');return;}
  progress.frames=[...progress.frames.filter(x=>x!==id),id].slice(-4);
  if(!saveProgress()){roomMessage('액자 기록을 저장하지 못했습니다.');return;}
  renderRoom();roomMessage('배운 단어 액자를 걸었습니다.');
 });
 document.addEventListener('wordville-words-ready',()=>{loadDays();if(globalThis.WordvilleShell?.screen==='solo')renderRoom();});
 document.addEventListener('wordville-record-changed',updateHeading);
 loadDays();setTab('fish');
 globalThis.WordvilleSolo={open(){loadDays();updateHeading();renderRoom();},get progress(){return progress;},get currentQuestion(){return round;}};
})();
