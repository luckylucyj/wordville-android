/* Offline resident social journal, notice board and birthday/status UI.
 * Board posts are authored English-learning examples, not live internet posts.
 * Interaction records remain local. */
(function(root){
'use strict';
const residents=root.VillageModel?.people||[];
const S=root.WordvilleSchedule;
const STORAGE_KEY='wordville.resident-social.v1';
const langs=['ko','en','zh-CN','ja'];
const current=()=>root.WordvilleI18n?.language||'ko';
const idx=lang=>Math.max(0,langs.indexOf(lang||current()));
const tr=(rows,lang=current())=>rows?.[idx(lang)]||rows?.[0]||'';
const lex={
 board:['주민 게시판','Town bulletin board','居民公告板','住民掲示板'],
 boardOpen:['주민 영어 게시판 열기','Open English bulletin board','打开英语公告板','英語掲示板を開く'],
 boardHint:['주민들이 쓴 가상의 일상 게시글로 영어권의 캐주얼한 표현을 배웁니다. 실제 SNS 게시물이나 실시간 유행 순위가 아닙니다.','Fictional posts teach informal English. These are not live social posts or a real-time trend ranking.','通过虚构的居民帖子学习非正式英语。并非真实社交媒体帖子或实时热度排行。','架空の住民投稿でカジュアルな英語を学びます。実際のSNS投稿やリアルタイムランキングではありません。'],
 boardAll:['모든 주민 글','All resident posts','所有居民帖子','全住民の投稿'],
 boardToday:['오늘의 글','Today’s posts','今日帖子','今日の投稿'],
 register:['주민 상태창','Resident status','居民状态','住民ステータス'],
 openStatus:['생일·호감도·기분·대화 보기','View birthday, affinity and conversations','查看生日、好感度与对话','誕生日・好感度・会話を見る'],
 birthday:['원작 생일','Original birthday','原作生日','原作の誕生日'],
 birthdayUnknown:['공식 생일 확인 안 됨','Official birthday unconfirmed','官方生日未确认','公式の誕生日は未確認'],
 affinity:['나와의 호감도','Affinity with you','对你的好感度','あなたへの好感度'],
 residentAffinity:['주민 사이의 호감도','Affinity between residents','居民之间的好感度','住民同士の好感度'],
 relationshipHint:['Wordville 설정 · 왼쪽 이름에서 오른쪽 이름을 향한 점수','Wordville scores from the name on the left toward the name on the right','Wordville设定 · 从左侧角色对右侧角色的分数','Wordville設定・左の住民から右の住民への好感度'],
 mood:['오늘 기분','Today’s mood','今日心情','今日の気分'],
 day:['오늘의 일정','Today’s routine','今日安排','今日の予定'],
 observed:['대화·상호작용 기록','Conversations & interactions','对话与互动记录','会話・交流の記録'],
 noTalk:['오늘 기록된 대화가 없습니다.','No conversations recorded today.','今天尚无对话记录。','今日の会話記録はありません。'],
 plan:['일정표 기준 (실제 행동 측정값이 아님)','Based on the schedule, not a measured activity log','根据预设日程，并非实际行为追踪','予定表に基づく表示で、実測した行動履歴ではありません'],
 sayHi:['인사하고 영어 표현 배우기','Say hello & learn an expression','打招呼并学英语表达','挨拶して英語表現を学ぶ'],
 hiDone:['인사했습니다. 호감도','You said hello. Affinity','已打招呼，好感度','挨拶しました。好感度'],
 hiFull:['호감도가 100점이에요.','Affinity is at 100.','好感度已达100。','好感度は100です。'],
 storageError:['호감도를 저장하지 못했습니다.','Could not save affinity.','无法保存好感度。','好感度を保存できませんでした。'],
 hiLimit:['오늘의 호감도 보상을 모두 받았습니다. 대화는 계속할 수 있습니다.','Today’s affinity rewards are used up. You can keep talking.','今日好感度奖励已达上限，仍可继续交谈。','今日の好感度報酬は上限です。会話は続けられます。'],
 close:['닫기','Close','关闭','閉じる'],
 today:['오늘','Today','今天','今日'],
 origin:['표현 뜻','Meaning & usage','释义与用法','意味・使い方'],
 fictional:['학습용 가상 게시글','Practice post · fictional','学习用虚构帖子','学習用の架空投稿'],
 all:['전체 22명','All 22 residents','全部22名居民','全22名の住民']
};
const moods=[
 ['기분 좋음','Cheerful','愉快','ご機嫌'],
 ['평온함','Calm','平静','穏やか'],
 ['신남','Excited','兴奋','わくわく'],
 ['집중함','Focused','专注','集中している'],
 ['조금 피곤함','A little tired','有点累','少し疲れた'],
 ['친구를 만나고 싶음','Sociable','想见朋友','友達に会いたい']
];
/* 22 fictional resident posts. English is the study target; explanation is localized. */
const phrases=[
 ['alex','No cap','That workout was tough, no cap.','거짓말 아니고, 정말이라는 강조. 친한 사이에서 사용.','For real; honestly. Very informal.','真的，不夸张。非常口语化。','本当に、嘘じゃなく。とてもくだけた言い方。'],
 ['elliott','It’s giving','This café is giving cozy autumn vibes.','~한 느낌이 난다. 뒤에 분위기나 특징을 붙임.','It has the feeling or style of something.','给人一种……的感觉。','〜っぽい雰囲気を感じる。'],
 ['harvey','Low-key','I low-key enjoy the quiet mornings.','살짝, 은근히, 조용히 인정하는 느낌.','Quietly or to a modest degree.','有点、暗暗地。','ひそかに、ちょっと。'],
 ['sam','That slaps','This new song absolutely slaps!','음악·음식 등이 아주 좋다는 비격식 칭찬.','Something sounds or tastes excellent.','形容音乐或食物特别棒。','曲や食べ物がすごく良いという口語。'],
 ['sebastian','I’m cooked','My code broke before the demo. I’m cooked.','큰일 났다, 망했다는 과장된 표현.','I’m in trouble or exhausted.','我完蛋了，麻烦大了。','やばい、詰んだという誇張表現。'],
 ['shane','Real','A nap after work? Real.','상대 말에 진심으로 공감한다는 짧은 반응.','A short way to strongly agree.','表示非常赞同。','強く共感する短い返事。'],
 ['haley','Ate','You ate that outfit!','아주 잘했다, 멋지게 해냈다는 칭찬.','You did an excellent job.','你做得太漂亮了。','最高にうまくやったという褒め言葉。'],
 ['leah','Vibe check','Vibe check: does this painting feel peaceful?','현재 분위기나 감정을 확인하는 표현.','Checking the mood or atmosphere.','确认现场氛围或情绪。','その場の雰囲気を確かめる表現。'],
 ['maru','Brain rot','I’ve watched too many silly clips. Brain rot!','온라인 콘텐츠에 너무 몰입했다는 농담.','Joking about consuming too much trivial online content.','戏称刷了太多无聊网络内容。','ネット動画を見過ぎたという冗談。'],
 ['penny','FOMO','I had FOMO when everyone visited the book fair.','소외될까 걱정하거나 놓칠까 불안한 마음.','Fear of missing out on something others do.','害怕错过大家参与的事情。','他の人の体験を逃したくない不安。'],
 ['abigail','Main character energy','I’m bringing main character energy to this adventure.','주인공처럼 당당하고 자신감 있는 분위기.','Confident, protagonist-like behavior.','像主角一样自信的状态。','主人公のような自信あふれる姿勢。'],
 ['emily','Slay','You made that jacket yourself? Slay!','잘했다, 멋지다라는 가벼운 칭찬.','An enthusiastic informal compliment.','表示太棒了的热情夸赞。','最高！というくだけた褒め言葉。'],
 ['chiikawa','Bet','We’re studying together after lunch? Bet!','좋아, 알겠어, 그렇게 하자는 응답.','Sure; okay; agreed.','好啊，一言为定。','いいね、了解、賛成。'],
 ['hachiware','I’m dead','That cat photo is so funny. I’m dead.','너무 웃기다는 과장. 실제 죽음과 무관.','I’m laughing very hard. Not literal.','笑死我了，夸张说法。','面白すぎて笑いが止まらない。比喩表現。'],
 ['usagi','Say less','You want a rap battle? Say less!','더 설명 안 해도 알겠어, 바로 하자는 뜻.','I understand; no need to explain more.','懂了，不用多说。','了解！それ以上の説明は不要。'],
 ['rakko','Lock in','Time to lock in and finish training.','집중해서 제대로 시작하자는 표현.','Focus seriously on a task.','集中精力完成任务。','集中して本気で取り組む。'],
 ['kurimanju','Hits different','Warm soup on a rainy day hits different.','특별히 더 좋고 다르게 느껴진다는 말.','It feels unusually good or special.','感觉特别不一样、格外好。','いつもより特別に良く感じる。'],
 ['momo','Rent-free','That beautiful garden lives rent-free in my head.','특정 장면·생각이 머릿속에서 계속 맴돎.','Something you keep thinking about.','某个画面一直在脑海里。','忘れられず頭から離れない。'],
 ['toshiro','Goated','That swim coach is goated.','역대급으로 훌륭하다는 칭찬.','Exceptionally great; one of the best.','顶级的、非常厉害的。','最高クラスにすごい。'],
 ['aizen','Delulu','Thinking I can finish ten books today is delulu.','현실적이지 않은 기대를 농담처럼 말함.','Playfully unrealistic or delusional.','开玩笑说自己幻想得不切实际。','非現実的な期待を冗談めかして言う。'],
 ['homura','FR','I’d do anything to help my friends, fr.','for real을 줄여 진심임을 강조.','Abbreviation for “for real”.','for real 的缩写，表示真的。','for realの略。本当にという強調。'],
 ['madoka','It’s a whole mood','A quiet evening with friends is a whole mood.','지금 감정이나 분위기에 딱 맞는다는 표현.','A feeling or atmosphere you strongly relate to.','特别能共鸣的氛围或心情。','すごく共感できる雰囲気や気分。']
];
const ids=new Set(residents.map(p=>p.id));
const byId=new Map(phrases.map(a=>[a[0],a]));
// Stardew Valley in-game Calendar. The original uses seasons rather than months.
const seasonalBirthdays={
 alex:['summer',13],elliott:['fall',5],harvey:['winter',14],sam:['summer',17],
 sebastian:['winter',10],shane:['spring',20],haley:['spring',14],leah:['winter',23],
 maru:['summer',10],penny:['fall',2],abigail:['fall',13],emily:['spring',27]
};
const seasons={
 spring:['봄','Spring','春','春'],summer:['여름','Summer','夏','夏'],
 fall:['가을','Fall','秋','秋'],winter:['겨울','Winter','冬','冬']
};
// Official Chiikawa notices, BLEACH character profiles, and Aniplex's Madoka birthday notice.
const calendarBirthdays={
 chiikawa:[5,1],hachiware:[5,1],usagi:[1,22],momo:[6,3],toshiro:[12,20],aizen:[5,29],madoka:[10,3]
};
const relationLabels={
 close:['절친','Close friends','密友','親友'],
 friends:['친구','Friends','朋友','友人'],
 family:['가족','Family','家人','家族'],
 colleagues:['동료','Colleagues','同事','同僚'],
 mentor:['선후배','Mentor and pupil','前辈与后辈','先輩と後輩'],
 complicated:['복잡한 사이','Complicated','关系复杂','複雑な関係'],
 acquaintance:['아는 사이','Acquaintances','熟人','知り合い']
};
const pairKey=(a,b)=>a<b?a+'|'+b:b+'|'+a;
const profiles=new Map([
 ['homura','madoka','close',88,78,3,2],['momo','toshiro','close',79,82,2,2],
 ['chiikawa','hachiware','close',82,82,2,2],
 ['chiikawa','usagi','friends',68,72,2,2],['hachiware','usagi','friends',73,68,2,2],
 ['rakko','chiikawa','mentor',65,77,1,2],['rakko','hachiware','mentor',64,76,1,2],
 ['sam','sebastian','close',76,75,2,2],['abigail','sam','friends',68,68,2,2],
 ['abigail','sebastian','friends',74,73,2,2],['haley','emily','family',68,77,1,2],
 ['maru','sebastian','family',55,41,1,1],['harvey','maru','colleagues',65,63,1,1],
 ['alex','haley','friends',64,64,2,2],['elliott','leah','friends',65,65,2,2],
 ['momo','aizen','complicated',40,24,1,-1],['toshiro','aizen','complicated',17,24,-1,-1]
].map(([a,b,type,ab,ba,da,db])=>[pairKey(a,b),{
 type,initial:{[a]:ab,[b]:ba},change:{[a]:da,[b]:db}
}]));
function today(date=new Date()){return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
let record={birthdays:{},affinity:{},talks:[],rewards:{},pairs:{}};
try{
 const parsed=JSON.parse(root.localStorage?.getItem(STORAGE_KEY)||'null');
 if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)){
  record.birthdays=parsed.birthdays&&typeof parsed.birthdays==='object'?parsed.birthdays:{};
  record.affinity=parsed.affinity&&typeof parsed.affinity==='object'?parsed.affinity:{};
  record.talks=Array.isArray(parsed.talks)?parsed.talks.filter(e=>e&&ids.has(e.id)).slice(-120):[];
  record.rewards=parsed.rewards&&typeof parsed.rewards==='object'?parsed.rewards:{};
  record.pairs=parsed.pairs&&typeof parsed.pairs==='object'&&!Array.isArray(parsed.pairs)?parsed.pairs:{};
 }
}catch{}
function persist(){
 try{root.localStorage?.setItem(STORAGE_KEY,JSON.stringify(record));root.document?.dispatchEvent(new Event('wordville-record-changed'));return true;}catch{return false;}
}
const person=id=>residents.find(p=>p.id===id);
function birthday(id){
 if(seasonalBirthdays[id]){
  const [season,day]=seasonalBirthdays[id];return {season,day};
 }
 if(calendarBirthdays[id]){
  const [month,day]=calendarBirthdays[id];return {month,day};
 }
 return null;
}
function birthdayText(id){
 const value=birthday(id);
 if(!value)return tr(lex.birthdayUnknown);
 if(value.season){
  const season=tr(seasons[value.season]),day=value.day;
  return [season+' '+day+'일',season+' '+day,season+'第'+day+'日',season+'の'+day+'日'][idx()];
 }
 return [value.month+'월 '+value.day+'일',new Intl.DateTimeFormat('en',{month:'long',timeZone:'UTC'}).format(Date.UTC(2000,value.month-1,1))+' '+value.day,
  value.month+'月'+value.day+'日',value.month+'月'+value.day+'日'][idx()];
}
const score=(value,fallback=30)=>Number.isFinite(value)?Math.round(Math.max(0,Math.min(100,value))):fallback;
const affection=id=>score(record.affinity[id]);
function relationship(a,b){
 if(a===b||!ids.has(a)||!ids.has(b))return null;
 const key=pairKey(a,b),profile=profiles.get(key),saved=record.pairs[key]?.scores;
 return {id:b,type:profile?.type||'acquaintance',
  outgoing:score(saved?.[a],profile?.initial[a]??30),incoming:score(saved?.[b],profile?.initial[b]??30)};
}
function publishSocial(){
 root.document?.dispatchEvent(new Event('wordville-social-updated'));
}
function mood(id,date=new Date()){
 const n=[...String(id)+today(date)].reduce((sum,ch)=>sum+ch.charCodeAt(0),0);
 return moods[n%moods.length];
}
function dayPlan(id,date=new Date()){
 if(!ids.has(id)||!S)return [];
 const currentHour=date.getHours();
 return S.day(id).filter((slot,i,list)=>slot.hour<=currentHour&&i>0&&
  !/잠|취침|수면/.test(slot.activity)&& (slot.hour===currentHour||slot.hour===6||slot.hour===9||slot.hour===12||slot.hour===17||slot.hour===20))
  .slice(-6);
}
function postFor(id){return byId.get(id);}
function posts(date=new Date(),all=false){
 const n=Number(today(date).replace(/-/g,''));
 const ordered=phrases.map((p,i)=>({p,i,rank:(i*11+n*7)%phrases.length})).sort((a,b)=>a.rank-b.rank).map(x=>x.p);
 return all?ordered:ordered.slice(0,8);
}
function meeting(a,b,english,korean,date=new Date()){
 const pair=relationship(a,b);
 if(!pair)return;
 const d=today(date),stamp=date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
 const key=pairKey(a,b), hour=d+'T'+date.getHours(), prior=record.pairs[key];
 if(prior?.hour===hour)return pair;
 const profile=profiles.get(key), oldTalks=record.talks;
 record.pairs[key]={hour,scores:{
  [a]:score(pair.outgoing+(profile?.change[a]??1)),
  [b]:score(pair.incoming+(profile?.change[b]??1))
 }};
 const talk={date:d,stamp,english:String(english||'').slice(0,200),korean:String(korean||'').slice(0,200),type:'residents'};
 record.talks=[...oldTalks,{...talk,id:a,other:b},{...talk,id:b,other:a}].slice(-120);
 if(!persist()){
  record.talks=oldTalks;
  if(prior)record.pairs[key]=prior;else delete record.pairs[key];
  return pair;
 }
 publishSocial();
 return relationship(a,b);
}
function hello(id,date=new Date()){
 if(!ids.has(id))return {added:0,score:0,saved:false};
 const d=today(date),reward=record.rewards[id],before=affection(id);
 const used=reward?.date===d?Math.max(0,Number(reward.count)||0):0;
 const added=used<5?Math.min(2,100-before):0;
 const previous=record.affinity[id],oldTalks=record.talks;
 if(added){record.rewards[id]={date:d,count:used+1};record.affinity[id]=before+added;}
 const p=postFor(id);
 record.talks=[...oldTalks,{id,other:'player',date:d,stamp:date.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),english:p?.[2]||'Hello!',korean:p?.[3]||'',type:'player'}].slice(-120);
 if(!persist()){
  record.talks=oldTalks;
  if(added){
   if(reward)record.rewards[id]=reward;else delete record.rewards[id];
   if(previous!==undefined)record.affinity[id]=previous;else delete record.affinity[id];
  }
  return {added:0,score:before,saved:false};
 }
 publishSocial();
 return {added,score:affection(id),saved:true};
}
function status(id,date=new Date()){
 const relations=residents.filter(p=>p.id!==id).map(p=>relationship(id,p.id)).filter(Boolean)
  .sort((a,b)=>Number(a.type==='acquaintance')-Number(b.type==='acquaintance')||b.outgoing-a.outgoing);
 return {id, birthday:birthday(id),affinity:affection(id),relations,mood:mood(id,date),plan:dayPlan(id,date),
  talks:record.talks.filter(t=>t.id===id&&t.date===today(date)).slice(-8).reverse()};
}
const api={STORAGE_KEY,residents,phrases,lex,postFor,posts,today,birthday,birthdayText,affection,relationship,mood,dayPlan,status,hello,meeting,tr,current};
root.WordvilleSocial=api;
if(typeof document==='undefined'){if(typeof module!=='undefined')module.exports=api;return;}
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const add=(parent,...children)=>{parent.append(...children);return parent;};
const button=(label,fn,cls)=>{const b=el('button',cls,label);b.type='button';b.addEventListener('click',fn);return b;};
function buildDialog(id,title){
 const d=el('dialog','wv-social-dialog');d.id=id;d.setAttribute('aria-label',title);
 const head=el('div','wv-social-head'),heading=el('h2','',title),close=button('×',()=>d.close(),'wv-social-close');
 close.setAttribute('aria-label',tr(lex.close));add(head,heading,close);d.append(head);
 document.body.append(d);return {d,heading,close};
}
const BOARD_PIN_KEY='wordville.board.pins.v1';
const pinned=new Set();
try{
 const old=JSON.parse(root.localStorage?.getItem(BOARD_PIN_KEY)||'[]');
 if(Array.isArray(old))for(const id of old)if(ids.has(id))pinned.add(id);
}catch{}
function boardNoticeCount(){return pinned.size;}
function boardPin(id,enabled=!pinned.has(id)){
 if(!ids.has(id))return false;
 if(enabled)pinned.add(id);else pinned.delete(id);
 try{root.localStorage?.setItem(BOARD_PIN_KEY,JSON.stringify([...pinned]));}catch{}
 root.document?.dispatchEvent(new CustomEvent('wordville-board-notices-changed',{detail:{count:pinned.size}}));
 return true;
}
function boardClear(){
 for(const id of [...pinned])pinned.delete(id);
 try{root.localStorage?.setItem(BOARD_PIN_KEY,'[]');}catch{}
 root.document?.dispatchEvent(new CustomEvent('wordville-board-notices-changed',{detail:{count:0}}));
}
const boardWords={
 pins:['게시판에 붙인 공지','Pinned notices','固定公告','貼り付けたお知らせ'],
 pin:['게시판에 붙이기','Pin to board','固定到公告板','掲示板に貼る'],
 unpin:['게시판에서 떼기','Unpin from board','从公告板移除','掲示板から外す'],
 clear:['공지 모두 떼기','Clear board','清空公告板','掲示板を空にする'],
 helper:['주민 글의 붙이기 버튼을 누르면 마을 게시판 그림이 비어 있음(0) → 일부(1~4) → 가득 참(5개 이상) 순서로 바뀝니다.','Pin resident posts to change the town sprite: empty (0), partial (1–4), full (5+).','点击固定帖子可切换公告板：空（0）、部分（1–4）、满（5个以上）。','住民の投稿を貼ると掲示板が空（0）、一部（1～4）、満杯（5件以上）に変わります。']
};
const board=buildDialog('wv-town-board',tr(lex.board));
const boardHint=el('p','wv-social-hint'),boardSwitch=button('',()=>{showAll=!showAll;renderBoard();},'wv-social-outline');
const boardPinsBar=el('div','wv-board-pins-bar'),boardPinsCount=el('strong','wv-board-pins-count'),
 boardPinsClear=button('',()=>{boardClear();renderBoard();},'wv-social-outline'),boardPinsHint=el('p','wv-social-hint');
boardPinsBar.append(boardPinsCount,boardPinsClear);
const boardList=el('div','wv-town-posts');
add(board.d,boardHint,boardPinsHint,boardPinsBar,boardSwitch,boardList);
let showAll=false;
function renderBoard(){
 board.heading.textContent=tr(lex.board);boardHint.textContent=tr(lex.boardHint);
 boardSwitch.textContent=tr(showAll?lex.boardToday:lex.boardAll);
 boardPinsCount.textContent=tr(boardWords.pins)+': '+boardNoticeCount();
 boardPinsClear.textContent=tr(boardWords.clear);
 boardPinsClear.disabled=!pinned.size;
 boardPinsHint.textContent=tr(boardWords.helper);
 const f=document.createDocumentFragment();
 for(const p of posts(new Date(),showAll)){
  const resident=person(p[0]),card=el('article','wv-town-post');
  const head=el('div','wv-post-head'),name=el('strong','',root.WordvilleI18n?.translate(resident?.name||p[0])||resident?.name||p[0]),tag=el('small','',tr(lex.fictional));
  add(head,name,tag);
  const phrase=el('b','wv-post-phrase',p[1]),example=el('p','wv-post-example',p[2]);example.lang='en';
  const meaning=el('p','wv-post-meaning',tr(lex.origin)+': '+p[3+idx()]);
  const pin=button(tr(pinned.has(p[0])?boardWords.unpin:boardWords.pin),()=>{
   boardPin(p[0]);renderBoard();
  },'wv-post-pin');
  pin.setAttribute('aria-pressed',String(pinned.has(p[0])));
  add(card,head,phrase,example,meaning,pin);f.append(card);
 }
 boardList.replaceChildren(f);
}
const statusDialog=buildDialog('wv-social-status',tr(lex.register));
const personField=el('label','wv-social-picker'),personSelect=el('select');
const personLabel=el('span','',tr(lex.register));personSelect.setAttribute('aria-label',tr(lex.register));
for(const p of residents){const o=el('option','',p.name);o.value=p.id;personSelect.append(o);}
add(personField,personLabel,personSelect);
const statusBody=el('div','wv-social-body');add(statusDialog.d,personField,statusBody);
let selected=residents[0]?.id||'alex';
function renderStatus(){
 statusDialog.heading.textContent=tr(lex.register);
 personLabel.textContent=tr(lex.register);personSelect.value=selected;
 const s=status(selected),p=person(selected),f=document.createDocumentFragment();
 const title=el('h3','wv-social-name',root.WordvilleI18n?.translate(p?.name||selected)||p?.name||selected);
 const top=el('div','wv-social-top'),moodLine=el('div','wv-social-stat',tr(lex.mood)+': '+tr(s.mood)),aff=el('div','wv-social-stat',tr(lex.affinity)+': '+s.affinity+'/100');
 const progress=el('progress','wv-social-progress');progress.max=100;progress.value=s.affinity;progress.setAttribute('aria-label',tr(lex.affinity));add(aff,progress);
 add(top,moodLine,aff);
 const bday=el('div','wv-social-stat wv-canon-birthday');
 add(bday,el('strong','',tr(lex.birthday)),el('span','',birthdayText(selected)));
 add(f,title,top,bday);
 const relations=el('details','wv-pair-affinity');
 const pairList=el('ul','');
 const residentName=id=>{
  const name=person(id)?.name||id;
  return root.WordvilleI18n?.translate(name)||name;
 };
 const selfName=residentName(selected);
 for(const relation of s.relations){
  const other=residentName(relation.id),row=el('li','');
  add(row,el('strong','',other+' · '+tr(relationLabels[relation.type])),
   el('span','',selfName+' → '+other+' ♥ '+relation.outgoing+'/100'),
   el('span','',other+' → '+selfName+' ♥ '+relation.incoming+'/100'));
  pairList.append(row);
 }
 relations.open=statusBody.querySelector('.wv-pair-affinity')?.open||false;
 add(relations,el('summary','',tr(lex.residentAffinity)),el('p','wv-social-hint',tr(lex.relationshipHint)),pairList);
 f.append(relations);
 const planH=el('h3','',tr(lex.day)),planInfo=el('p','wv-social-hint',tr(lex.plan)),timeline=el('ol','wv-social-timeline');
 for(const row of s.plan){
  const item=el('li'),time=el('time','',S.formatHour(row.hour)),details=el('div');
  const l=root.WordvilleScheduleLocale;
  if(l)l.appendSlot(details,row);else details.textContent=row.placeName+' · '+row.activity;
  add(item,time,details);timeline.append(item);
 }
 if(!s.plan.length)timeline.append(el('li','wv-social-hint',tr(lex.plan)));
 add(f,planH,planInfo,timeline);
 const talkHead=el('h3','',tr(lex.observed)),log=el('ul','wv-social-conversations');
 for(const item of s.talks){
  const other=item.other==='player'?tr(lex.sayHi):(root.WordvilleI18n?.translate(person(item.other)?.name)||person(item.other)?.name||item.other);
  const li=el('li');
  add(li,el('strong','',item.stamp+' · '+other),el('span','',item.english));
  if(idx()===0)add(li,el('small','',item.korean));
  log.append(li);
 }
 if(!log.childNodes.length)log.append(el('li','wv-social-hint',tr(lex.noTalk)));
 const greetStatus=el('p','wv-social-feedback');
 const greet=button(tr(lex.sayHi),()=>{
  const result=hello(selected),msg=statusBody.querySelector('.wv-social-greet-feedback');
  if(msg)msg.textContent=!result.saved?tr(lex.storageError):result.added?tr(lex.hiDone)+' +'+result.added:
   tr(result.score===100?lex.hiFull:lex.hiLimit);
 },'wv-social-action');
 greetStatus.classList.add('wv-social-greet-feedback');
 add(f,talkHead,log,greet,greetStatus);statusBody.replaceChildren(f);
}
function openBoard(){showAll=false;renderBoard();if(!board.d.open)board.d.showModal();document.dispatchEvent(new Event('wordville-board-open'));}
function openResident(id){if(ids.has(id))selected=id;renderStatus();if(!statusDialog.d.open)statusDialog.d.showModal();}
// Each resident has a portrait/location button and a separate affinity action.
const residentCards=new Map();
function syncResidentCards(){
 const list=document.getElementById('resident-list');
 if(!list)return;
 for(const portraitButton of [...list.querySelectorAll(':scope > button[data-person]')]){
  const id=portraitButton.dataset.person;
  if(!ids.has(id))continue;
  const card=el('article','wv-resident-card');
  card.dataset.residentCard=id;
  portraitButton.classList.add('wv-resident-portrait-button');
  // The existing portrait continues to navigate to the resident's location.
  for(const child of [...portraitButton.childNodes])
   if(child.nodeType===Node.TEXT_NODE)child.remove();
  const footer=el('div','wv-resident-card-footer');
  const name=el('strong','wv-resident-card-name');
  const affinity=button('',()=>openResident(id),'wv-resident-affinity-button');
  affinity.dataset.residentAffinity=id;
  affinity.type='button';
  add(footer,name,affinity);
  add(card,portraitButton,footer);list.append(card);
  residentCards.set(id,{card,name,affinity});
 }
 for(const [id,elements] of residentCards){
  if(!elements.card.isConnected){residentCards.delete(id);continue;}
  const original=person(id)?.name||id;
  const translated=root.WordvilleI18n?.translate(original)||original;
  const aff=affection(id);
  elements.name.textContent=translated;
  elements.affinity.textContent='♥';
  elements.affinity.setAttribute('aria-label',translated+' · '+tr(lex.affinity)+' '+aff+'/100 · '+tr(lex.openStatus));
  elements.affinity.title=translated+' · '+tr(lex.affinity)+' '+aff+'/100';
 }
}
syncResidentCards();

board.d.addEventListener('close',()=>boardButton?.focus());
personSelect.addEventListener('change',()=>{selected=personSelect.value;renderStatus();});
const mapHeader=document.querySelector('.wv-map-header');
const boardButton=button('📌',openBoard,'wv-board-trigger');
boardButton.id='wv-board-open';boardButton.setAttribute('aria-label',tr(lex.boardOpen));boardButton.title=tr(lex.boardOpen);
if(mapHeader)mapHeader.insertBefore(boardButton,document.getElementById('wv-map-tools'));
const more=document.getElementById('wv-more-panel');
if(more)more.append(button('👥 '+tr(lex.register),()=>{more.hidden=true;openResident(selected);},'wv-social-more'));
document.addEventListener('wordville-resident-selected',e=>{if(ids.has(e.detail?.id))selected=e.detail.id;});
document.addEventListener('wordville-language-changed',()=>{
 boardButton.setAttribute('aria-label',tr(lex.boardOpen));boardButton.title=tr(lex.boardOpen);
 syncResidentCards();
 document.querySelector('.wv-social-more')&&(document.querySelector('.wv-social-more').textContent='👥 '+tr(lex.register));
 board.close.setAttribute('aria-label',tr(lex.close));statusDialog.close.setAttribute('aria-label',tr(lex.close));
 if(board.d.open)renderBoard();if(statusDialog.d.open)renderStatus();
});
document.addEventListener('wordville-social-updated',()=>{syncResidentCards();if(statusDialog.d.open)renderStatus();});
api.openBoard=openBoard;api.openResident=openResident;
api.boardPinnedCount=boardNoticeCount;api.boardPin=boardPin;api.boardClear=boardClear;
api.boardIsPinned=id=>pinned.has(id);api.boardState=()=>boardNoticeCount()===0?0:boardNoticeCount()<=4?1:2;
api.boardHit=(x,y)=>x>=423&&x<=471&&y>=333&&y<=388;
api.drawTownBoard=(ctx)=>{
 ctx.save();ctx.fillStyle='#65442d';ctx.fillRect(430,354,4,29);ctx.fillRect(464,354,4,29);
 ctx.fillStyle='#b88146';ctx.fillRect(421,329,54,34);
 ctx.strokeStyle='#593c27';ctx.lineWidth=3;ctx.strokeRect(421,329,54,34);
 ctx.fillStyle='#f4deb0';ctx.fillRect(426,333,44,24);
 ctx.fillStyle='#8b9e64';ctx.fillRect(433,337,15,10);
 ctx.fillStyle='#f4b4a2';ctx.fillRect(452,337,12,13);
 ctx.fillStyle='#755536';ctx.fillRect(433,352,29,2);
 ctx.restore();
};
})(globalThis);
