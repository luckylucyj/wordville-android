/* Wordville full-screen app shell. Existing vocabulary and progress state are untouched. */
(() => {
'use strict';
const get=id=>document.getElementById(id);
const main=document.querySelector('main'),village=document.querySelector('.village-section');
const map=get('wv-map-view'),places=get('wv-places-view');
const learnTabs=['learn','review','lab','book'];
const tabDefs=[
 ['town','🏘','마을'],
 ['places','🏠','장소'],
 ['residents','👥','주민'],
 ['learn','📖','단어'],
 ['review','↻','복습'],
 ['more','☰','더보기']
];
let current='town',lastScreen='town';
const residents=document.createElement('section');
residents.id='wv-residents-view';
residents.className='wv-residents-screen';
residents.setAttribute('aria-label','Wordville 주민 만나기');
residents.hidden=true;
const heading=document.createElement('div');heading.className='wv-residents-header';
heading.innerHTML='<small>MEET YOUR NEIGHBORS</small><h2>마을 주민 12명</h2><p>주민을 선택하면 대화하고 관련 영어 단어를 배울 수 있어요.</p>';
residents.append(heading);
const oldNeighbors=document.querySelector('.neighbors');
const oldDialogue=get('village-dialogue');
const oldFeed=document.querySelector('.conversation-feed');
if(oldNeighbors){oldNeighbors.open=true;residents.append(oldNeighbors);}
if(oldDialogue)residents.append(oldDialogue);
if(oldFeed)residents.append(oldFeed);
village.append(residents);
const wrap=document.querySelector('.canvas-wrap');
const timeBadge=document.querySelector('.time-badge');
if(timeBadge){timeBadge.classList.add('wv-world-clock');wrap.append(timeBadge);}
const controls=document.querySelector('.village-controls');
const timeNote=document.querySelector('.time-note');
const toolButton=document.createElement('button');
toolButton.id='wv-map-tools';
toolButton.type='button';
toolButton.textContent='⚙';
toolButton.title='마을 시간과 주민 움직임';
toolButton.setAttribute('aria-label','마을 설정 펼치기');
toolButton.setAttribute('aria-expanded','false');
wrap.append(toolButton);
const toolPanel=document.createElement('div');
toolPanel.id='wv-map-tool-panel';toolPanel.hidden=true;
if(controls)toolPanel.append(controls);
if(timeNote)toolPanel.append(timeNote);
const zoneControls=document.querySelector('.wv-map-zones');
if(zoneControls)toolPanel.append(zoneControls);
const zoneTip=document.querySelector('.wv-map-tip');
if(zoneTip)toolPanel.append(zoneTip);
wrap.append(toolPanel);
toolButton.addEventListener('click',()=>{
 toolPanel.hidden=!toolPanel.hidden;
 toolButton.setAttribute('aria-expanded',String(!toolPanel.hidden));
});
const oldNav=document.querySelector('nav[aria-label="학습 메뉴"]');
oldNav?.classList.add('wv-legacy-nav');
const account=document.createElement('section');
account.id='wv-account-view';account.hidden=true;account.className='wv-account-screen';
const accHeading=document.createElement('div');accHeading.innerHTML='<h2>계정과 기록</h2><p>기존 학습 기록과 저장 이미지를 안전하게 관리합니다.</p>';
account.append(accHeading);
const accountCard=[...main.querySelectorAll('section.card')].find(s=>s.textContent.includes('기존 앱의 기록 이어받기'));
if(accountCard)account.append(accountCard);
const cloud=document.querySelector('.cloud-panel');if(cloud)account.append(cloud);
const foot=main.querySelector('footer');if(foot)account.append(foot);
main.append(account);
const dock=document.createElement('nav');dock.className='wv-bottom-dock';
dock.id='wv-bottom-dock';dock.setAttribute('aria-label','Wordville 화면 이동');
const buttons=new Map();
for(const [key,icon,label] of tabDefs){
 const b=document.createElement('button');b.type='button';b.className='wv-dock-tab';
 b.dataset.screen=key;
 b.setAttribute('aria-label',label+(key==='more'?' 메뉴':' 화면'));
 b.innerHTML='<span aria-hidden="true" class="wv-dock-icon">'+icon+'</span><span class="wv-dock-label">'+label+'</span>';
 b.addEventListener('click',()=>key==='more'?toggleMore():activate(key));
 dock.append(b);buttons.set(key,b);
}
document.body.append(dock);
const more=document.createElement('div');more.id='wv-more-panel';more.className='wv-more-panel';
more.setAttribute('aria-label','Wordville 추가 기능');more.hidden=true;
for(const [key,icon,label] of [['notes','📝','Day별 생각코딩 노트'],['lab','✦','단어 조합실'],['book','▧','개념 도감'],['account','⚙','계정·동기화']]){
 const b=document.createElement('button');b.type='button';b.dataset.more=key;
 b.textContent=icon+' '+label;b.addEventListener('click',()=>activate(key));more.append(b);
}
document.body.append(more);
function toggleMore(){
 const toOpen=more.hidden;more.hidden=!toOpen;
 buttons.get('more').setAttribute('aria-expanded',String(toOpen));
}
function activate(screen){
 if(!['town','places','residents','learn','review','lab','book','notes','account'].includes(screen))return;
 current=screen;lastScreen=screen;
 if(screen!=='town'){toolPanel.hidden=true;toolButton.setAttribute('aria-expanded','false');}
 more.hidden=true;buttons.get('more').setAttribute('aria-expanded','false');
 document.body.dataset.screen=screen;
 village.hidden=!['town','places','residents'].includes(screen);
 if(screen==='town'){
   globalThis.WordvillePlaces?.show('map');
   map.hidden=false;places.hidden=true;residents.hidden=true;
 } else if(screen==='places'){
   globalThis.WordvillePlaces?.show('places');
   map.hidden=true;places.hidden=false;residents.hidden=true;
 } else if(screen==='residents'){
   globalThis.WordvillePlaces?.show('map');
   map.hidden=true;places.hidden=true;residents.hidden=false;
 }
 for(const id of learnTabs){
  if(learnTabs.includes(screen)){
   const legacy=oldNav?.querySelector('[data-tab="'+screen+'"]');
   if(legacy && id===screen)legacy.click();
  }
  get(id).hidden=screen!==id;
 }
 get('wv-notes-view').hidden=screen!=='notes';
 account.hidden=screen!=='account';
 for(const [key,b] of buttons){
  const active=key===screen||(key==='more'&&['notes','lab','book','account'].includes(screen));
  b.setAttribute('aria-current',active?'page':'false');
  b.setAttribute('aria-selected',String(active));
 }
 document.querySelector('.brand').textContent='▦ WORDVILLE';
 window.scrollTo({top:0,behavior:'instant'});
 if(screen==='town'){
   requestAnimationFrame(resizeVillage);
 }
}
function resizeVillage(){
 if(current!=='town')return;
 const c=get('village-canvas'),bounds=wrap.getBoundingClientRect();
 if(bounds.width<20||bounds.height<20)return;
 const width=600,height=Math.max(480,Math.min(1500,Math.round(600*bounds.height/bounds.width)));
 if(c.width!==width||c.height!==height){c.width=width;c.height=height;}
}
let resizeObserver;
if(typeof ResizeObserver!=='undefined'){
 resizeObserver=new ResizeObserver(()=>{if(current==='town')resizeVillage();});
 resizeObserver.observe(wrap);
}
window.addEventListener('resize',resizeVillage);
document.addEventListener('wordville-resident-selected',()=>activate('residents'));
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!more.hidden){more.hidden=true;buttons.get('more').setAttribute('aria-expanded','false');}
});
globalThis.WordvilleShell={activate,get screen(){return current;},resizeVillage};
activate('town');
const loadingCover=get('wv-loading-cover'),townReference=globalThis.WordvilleWorldArt?.reference;
const finishStartup=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{if(loadingCover)loadingCover.hidden=true;}));
if(!townReference||townReference.complete)finishStartup();
else{
 townReference.addEventListener('load',finishStartup,{once:true});
 townReference.addEventListener('error',finishStartup,{once:true});
}
})();