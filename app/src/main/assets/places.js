/* Single-scene venue explorer: one location is shown at a time. */
(() => {
'use strict';
const places=[
 {id:'pool',name:'수영장',en:'Swimming Pool',type:'leisure',people:['alex','haley'],word:'attend',desc:'수영 레인을 예약하고 친구와 연습해요.',lines:[['Can I attend the swimming class?','수영 수업에 참여할 수 있나요?'],['The pool is available this afternoon.','오늘 오후에는 수영장을 이용할 수 있어요.']]},
 {id:'ranch',name:'목장',en:'Ranch',type:'nature',people:['leah','shane'],word:'shipment',desc:'동물을 돌보고 목장 생활을 체험해요.',lines:[['The feed shipment arrived this morning.','사료 배송이 오늘 아침 도착했어요.'],['Would you like to help feed the animals?','동물 먹이 주는 일을 도와줄래요?']]},
 {id:'gym',name:'헬스장',en:'Fitness Center',type:'leisure',people:['alex','sebastian'],word:'equipment',desc:'운동 기구를 살펴보고 함께 운동해요.',lines:[['Is this equipment available?','이 운동 기구를 사용할 수 있나요?'],['Let’s check our workout schedule.','운동 일정을 확인해요.']]},
 {id:'burger',name:'햄버거 가게',en:'Burger Shop',type:'food',people:['sam','shane'],word:'customer',desc:'메뉴를 고르고 주문을 연습해요.',lines:[['The customer ordered a cheeseburger.','손님이 치즈버거를 주문했어요.'],['Can I change my order?','주문을 변경할 수 있나요?']]},
 {id:'icecream',name:'아이스크림 가게',en:'Ice Cream Shop',type:'food',people:['haley','penny'],word:'available',desc:'맛을 고르고 재고를 물어봐요.',lines:[['What flavors are available today?','오늘은 어떤 맛을 주문할 수 있나요?'],['Could I have two scoops?','두 스쿱 주세요.']]},
 {id:'pub',name:'펍',en:'Pub',type:'food',people:['shane','elliott'],word:'reservation',desc:'음료를 주문하고 모임 시간을 정해요.',lines:[['Do we need a reservation?','예약이 필요한가요?'],['Let’s meet here after work.','퇴근 후 여기서 만나요.']]},
 {id:'museum',name:'미술관',en:'Art Museum',type:'culture',people:['leah','elliott'],word:'application',desc:'전시를 감상하고 작품에 대해 이야기해요.',lines:[['I submitted an application for the exhibition.','전시 참가 신청서를 제출했어요.'],['This painting is on display today.','이 그림은 오늘 전시 중이에요.']]},
 {id:'greenhouse',name:'식물원',en:'Botanical Garden',type:'nature',people:['leah','maru'],word:'maintenance',desc:'식물을 관찰하고 관리 방법을 배워요.',lines:[['These plants need regular maintenance.','이 식물은 정기적인 관리가 필요해요.'],['Let’s examine the flowers.','꽃을 관찰해 봐요.']]},
 {id:'cafe',name:'카페',en:'Café',type:'food',people:['sam','penny'],word:'schedule',desc:'음료를 주문하고 학습 약속을 잡아요.',lines:[['Can we review our schedule?','우리 일정을 확인할까요?'],['One tea, please.','차 한 잔 주세요.']]},
 {id:'bookstore',name:'서점',en:'Bookstore',type:'culture',people:['elliott','penny'],word:'purchase',desc:'책을 둘러보고 구매에 관한 표현을 익혀요.',lines:[['I would like to purchase this book.','이 책을 구매하고 싶어요.'],['Do you have a dictionary?','사전이 있나요?']]},
 {id:'clinic',name:'진료소',en:'Clinic',type:'life',people:['harvey','maru'],word:'appointment',desc:'진료 예약과 접수 상황을 연습해요.',lines:[['I have an appointment at three.','3시에 진료 예약이 있어요.'],['Please confirm your appointment.','예약을 확인해 주세요.']]},
 {id:'library',name:'도서관',en:'Library',type:'culture',people:['penny','elliott'],word:'deadline',desc:'책을 읽고 반납 기한을 확인해요.',lines:[['What is the return deadline?','반납 기한이 언제인가요?'],['Let’s study together quietly.','조용히 함께 공부해요.']]},
 {id:'studio',name:'음악 작업실',en:'Music Studio',type:'culture',people:['sam','sebastian'],word:'equipment',desc:'악기와 녹음 장비를 살펴봐요.',lines:[['We need recording equipment.','녹음 장비가 필요해요.'],['Our rehearsal starts at six.','리허설은 6시에 시작해요.']]},
 {id:'market',name:'시장',en:'Market',type:'life',people:['shane','emily'],word:'purchase',desc:'물건 가격을 물어보고 장을 봐요.',lines:[['I want to purchase some fresh fruit.','신선한 과일을 사고 싶어요.'],['How much does this cost?','이것은 얼마인가요?']]},
 {id:'square',name:'마을 광장',en:'Town Square',type:'life',people:['abigail','alex'],word:'attend',desc:'주민들을 만나고 마을 행사에 참여해요.',lines:[['Will you attend the festival?','축제에 참석할 거예요?'],['Let’s meet at the fountain.','분수대 앞에서 만나요.']]},
 {id:'workshop',name:'공방',en:'Craft Workshop',type:'culture',people:['leah','emily'],word:'maintenance',desc:'직접 물건을 만들고 수리 방법을 배워요.',lines:[['The tools need maintenance.','도구에 관리가 필요해요.'],['Would you like to make something?','무언가 만들어 볼래요?']]},
 {id:'park',name:'공원',en:'Park',type:'nature',people:['alex','abigail'],word:'available',desc:'산책하거나 야외 활동을 즐겨요.',lines:[['The picnic area is available.','피크닉 공간을 사용할 수 있어요.'],['Let’s take a walk together.','함께 산책해요.']]}
];
const filters=[['all','전체'],['leisure','운동·휴식'],['food','먹거리'],['culture','문화'],['nature','자연'],['life','생활']];
const ids=id=>document.getElementById(id), canvas=ids('wv-place-canvas'), ctx=canvas.getContext('2d');
let filter='all',active='pool',speakerIndex=0,lineIndex=0;
const people=Object.fromEntries((globalThis.VillageModel?.people||[]).map(p=>[p.id,p]));
const portraits=globalThis.WordvillePortraits;
const mapView=ids('wv-map-view'),siteView=ids('wv-places-view');
function listed(){return places.filter(p=>filter==='all'||p.type===filter);}
function current(){return places.find(p=>p.id===active);}
function pick(id){if(!places.some(p=>p.id===id))return;active=id;speakerIndex=0;lineIndex=0;render();}
function show(view){
 const isSite=view==='places';mapView.hidden=isSite;siteView.hidden=!isSite;
 ids('wv-map-tab').setAttribute('aria-selected',String(!isSite));
 ids('wv-places-tab').setAttribute('aria-selected',String(isSite));
 ids('wv-map-tab').tabIndex=isSite?-1:0;
 ids('wv-places-tab').tabIndex=isSite?0:-1;
 document.querySelector('.village-section').dataset.view=view;
 if(isSite)render();
}
function button(label,className,handler){const b=document.createElement('button');b.type='button';b.textContent=label;b.className=className;b.addEventListener('click',handler);return b;}
function appendPortrait(parent,id,small=false){
 const p=people[id];if(!p)return;
 const b=button(p.name,'wv-place-person',()=>{speakerIndex=current().people.indexOf(id);lineIndex=0;renderConversation();});
 b.setAttribute('aria-pressed',String(current().people[speakerIndex]===id));
 if(portraits?.portrait)b.prepend(portraits.portrait(id,small?'wv-venue-mini':'wv-venue-portrait'));
 parent.append(b);
}
function renderConversation(){
 const p=current(),person=people[p.people[speakerIndex]]||people[p.people[0]];
 ids('wv-place-speaker').textContent=(person?.name||'주민')+'의 이야기';
 ids('wv-place-dialogue-en').textContent=p.lines[lineIndex][0];
 ids('wv-place-dialogue-ko').textContent=p.lines[lineIndex][1];
 ids('wv-place-study').textContent='관련 단어 배우기 · '+p.word;
 ids('wv-place-people').replaceChildren();
 p.people.forEach(id=>appendPortrait(ids('wv-place-people'),id));
}
function render(){
 const items=listed();if(!items.find(p=>p.id===active))active=items[0].id;
 const p=current(),idx=items.findIndex(x=>x.id===active);
 ids('wv-place-count').textContent=(idx+1)+' / '+items.length+'곳';
 ids('wv-place-name').textContent=p.name;
 ids('wv-place-en').textContent=p.en;
 ids('wv-place-description').textContent=p.desc;
 ids('wv-place-category').textContent=filters.find(x=>x[0]===p.type)?.[1]||'마을';
 ids('wv-place-canvas').setAttribute('aria-label',p.name+' 픽셀아트 장소 풍경');
 ids('wv-place-rail').replaceChildren();
 for(const place of items){
   const b=button(place.name,'wv-place-chip',()=>pick(place.id));
   b.dataset.place=place.id;
   b.setAttribute('aria-pressed',String(place.id===p.id));
   ids('wv-place-rail').append(b);
 }
 const rail=ids('wv-place-rail');
 const activeButton=rail.querySelector('[aria-pressed="true"]');
 // Scroll only the horizontal venue strip; do not move the entire page.
 if(activeButton)rail.scrollLeft=Math.max(0,activeButton.offsetLeft-rail.offsetLeft-12);
 ids('wv-place-filters').querySelectorAll('[data-place-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.placeFilter===filter)));
 renderConversation();draw(p);
}
function step(d){const items=listed(),i=items.findIndex(p=>p.id===active);pick(items[(i+d+items.length)%items.length].id);}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
function outlined(x,y,w,h,c,b='#624736'){rect(x-4,y-4,w+8,h+8,b);rect(x,y,w,h,c);}
function text(s,x,y,size=17,c='#513523'){ctx.fillStyle=c;ctx.textAlign='center';ctx.font='bold '+size+'px monospace';ctx.fillText(s,x,y);}
function scenery(p){
 const indoor=['gym','burger','icecream','pub','museum','cafe','bookstore','clinic','library','studio','market','workshop'].includes(p.id);
 rect(0,0,512,240,indoor?'#bfa078':'#9fc7bd');
 rect(0,indoor?176:158,512,indoor?64:82,indoor?'#a47b53':'#70975a');
 if(indoor){
  rect(0,0,512,13,'#6c513b');rect(0,134,512,8,'#98744f');
  for(let i=0;i<12;i++)rect(i*44,179,2,61,'#8b6648');
 } else {
  for(let i=0;i<4;i++){rect(i*146+17,36,46,10,'#e4ead1');rect(i*146+28,26,25,11,'#e4ead1');}
  for(let i=0;i<8;i++){const x=i*68+15;rect(x,180,5,28,'#665b3b');rect(x-9,161,23,20,'#517d49');rect(x-6,150,16,20,'#6d9d5d');}
 }
}
function draw(p){
 if(globalThis.WordvilleWorldArt?.place){globalThis.WordvilleWorldArt.place(ctx,p);return;}
 ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,512,240);scenery(p);
 const i=p.id;
 if(i==='pool'){outlined(68,115,378,109,'#71a8b6');rect(82,126,351,88,'#4b98c6');for(let n=0;n<4;n++)rect(86,143+n*19,343,3,'#e8f5da');rect(48,111,12,94,'#d5dbd2');rect(44,120,19,5,'#f3f7e4');rect(455,111,10,94,'#d5dbd2');rect(454,129,15,5,'#f3f7e4');}
 else if(i==='ranch'){outlined(158,63,196,140,'#bb644a');outlined(176,38,160,44,'#725441');outlined(232,122,56,82,'#744f32');for(let n=0;n<9;n++){rect(n*62,199,5,38,'#e0c393');rect(n*62,207,52,7,'#e0c393');}outlined(72,157,58,35,'#f2e3c1');rect(85,182,24,6,'#8f704c');}
 else if(i==='gym'){outlined(66,117,378,91,'#647b89');for(let n=0;n<4;n++){outlined(100+n*80,87,52,26,'#c2d4c4');rect(120+n*80,120,7,73,'#4c4b51');}outlined(170,210,176,12,'#3f4747');}
 else if(i==='burger'){outlined(56,119,400,91,'#a76648');for(let n=0;n<3;n++){const x=110+n*125;rect(x,130,88,13,'#e2af59');rect(x+6,145,75,8,'#6f9b55');rect(x,156,88,15,'#ab6744');rect(x+8,172,71,9,'#e5b76d');}text('BURGER',256,92,27);}
 else if(i==='icecream'){outlined(83,111,346,106,'#d7aab2');for(let n=0;n<4;n++){const x=125+n*76;rect(x,141,34,30,'#d1a46c');rect(x-4,117,42,28,['#f7dbb4','#e9aac1','#c6d7b3','#bbd3ea'][n]);}text('ICE CREAM',256,82,26);}
 else if(i==='pub'){outlined(64,123,384,88,'#5c493c');rect(83,135,345,12,'#c79b62');for(let n=0;n<5;n++){outlined(95+n*70,178,34,22,'#8e7051');rect(104+n*70,155,13,22,'#8b634a');}text('PUB',256,78,29);}
 else if(i==='museum'){for(let n=0;n<3;n++){outlined(87+n*137,63,102,102,'#b3875c');rect(96+n*137,72,84,84,['#80a6a1','#bd8f9e','#98aa78'][n]);rect(109+n*137,93,44,45,'#edd0a0');}outlined(240,185,32,49,'#e4d9ba');}
 else if(i==='greenhouse'){outlined(89,61,334,151,'#9cc5b2');rect(106,85,302,114,'#d3ebcb');for(let n=0;n<5;n++){const x=126+n*60;rect(x,128,12,59,'#527e54');rect(x-14,113,42,30,'#649f64');rect(x-11,182,40,18,'#b57e58');}rect(80,51,352,10,'#6b8b6d');}
 else if(i==='cafe'){outlined(66,108,380,99,'#bb8067');for(let n=0;n<3;n++){const x=111+n*132;rect(x,129,78,11,'#f5dfb7');rect(x+35,139,7,49,'#5e4e41');rect(x+25,119,28,10,'#e3d9bb');}text('CAFE',256,82,30);}
 else if(i==='bookstore'||i==='library'){for(let n=0;n<3;n++){outlined(66+n*136,45,119,165,'#765742');for(let row=0;row<3;row++)for(let j=0;j<5;j++)rect(78+n*136+j*20,60+row*48,12,35,['#bd7958','#76a0a2','#d5b369','#997ea6'][j%4]);}text(i==='library'?'LIBRARY':'BOOKS',256,35,21);}
 else if(i==='clinic'){outlined(83,105,346,107,'#e5e8db');outlined(113,149,284,48,'#acccd5');rect(244,33,24,70,'#d85d55');rect(220,55,72,27,'#d85d55');}
 else if(i==='studio'){for(let n=0;n<2;n++){outlined(62+n*317,62,92,142,'#393b4b');for(let k=0;k<2;k++)outlined(88+n*317,82+k*64,39,37,'#77808b','#242a32');}rect(242,92,14,121,'#4f4d56');outlined(226,70,42,37,'#c0c6c3');}
 else if(i==='market'){for(let n=0;n<3;n++){let x=66+n*136;outlined(x,119,110,91,'#b78e59');rect(x-9,105,128,27,['#b65e4b','#598b6f','#d8a15a'][n]);for(let k=0;k<5;k++)rect(x+9+k*20,152,14,15,['#c96c4f','#dcb767','#85a35a'][k%3]);}}
 else if(i==='square'){outlined(174,155,165,71,'#9aa8a0');rect(188,160,138,44,'#79bac5');rect(245,97,22,69,'#d8e1d8');rect(237,105,39,10,'#e5f1e3');for(let n=0;n<4;n++)rect(203+n*32,149,4,26,'#b6e6ef');}
 else if(i==='workshop'){outlined(66,134,380,77,'#9a6b4d');for(let n=0;n<4;n++){outlined(106+n*83,87,45,42,'#7b8870');rect(120+n*83,62,14,29,'#d7b79d');}rect(95,219,324,14,'#715239');}
 else if(i==='park'){rect(64,171,384,28,'#b6a07a');for(let n=0;n<4;n++){const x=102+n*106;rect(x,94,12,93,'#6c6340');rect(x-27,52,65,65,'#4c8059');rect(x-20,40,51,62,'#649d60');}outlined(223,176,68,30,'#c69b63');}
 rect(0,224,512,16,'#705943');for(let n=0;n<512;n+=32)rect(n,225,20,3,'#b68a57');
}
ids('wv-map-tab').addEventListener('click',()=>show('map'));
ids('wv-places-tab').addEventListener('click',()=>show('places'));
ids('wv-place-prev').addEventListener('click',()=>step(-1));
ids('wv-place-next').addEventListener('click',()=>step(1));
ids('wv-place-talk').addEventListener('click',()=>{lineIndex=(lineIndex+1)%current().lines.length;renderConversation();});
ids('wv-place-study').addEventListener('click',()=>document.dispatchEvent(new CustomEvent('village-study',{detail:{word:current().word}})));
for(const [id,label] of filters){
 const b=button(label,'wv-place-filter',()=>{filter=id;pick(listed()[0].id);});
 b.dataset.placeFilter=id;
 b.setAttribute('aria-pressed',String(id==='all'));
 ids('wv-place-filters').append(b);
}
for(const tab of [ids('wv-map-tab'),ids('wv-places-tab')]){
 tab.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
   e.preventDefault();const dest=tab.id==='wv-map-tab'?ids('wv-places-tab'):ids('wv-map-tab');
   show(dest.id==='wv-places-tab'?'places':'map');dest.focus();
  }
 });
}
document.addEventListener('wordville-art-ready',e=>{if(e.detail?.id===active&&siteView&&!siteView.hidden)draw(current());});
render();
show('map');
globalThis.WordvillePlaces={places,filters,show,pick,step,get active(){return active;},get filter(){return filter;}};
})();