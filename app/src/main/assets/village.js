'use strict';
(() => {
const M=VillageModel,S=globalThis.WordvilleSchedule,canvas=document.getElementById('village-canvas'),ctx=canvas.getContext('2d');
const panel=document.getElementById('village-dialogue'),feed=document.getElementById('village-feed');
const residents=M.freshResidents();let mode='auto',schedulePreview='auto',selected=null,zoom=1,last=0,t=0,paused=false,chatCount=0,minute='',period='day',viewZone='all',followId=null;
const scheduleMinute=()=>schedulePreview==='auto'?S.minuteNow():Number(schedulePreview)*60;

const paints={day:{sky:'#9ccdda',ground:'#93b078',stone:'#d8ceb3',shade:'#b3a58b',roof:'#536a82',wall:'#e1d3b8',side:'#b5ac98',leaf:'#5c8b59',leaf2:'#83a15e',window:'#668396',path:'#c9c4b2'},dusk:{sky:'#b5a1b3',ground:'#718064',stone:'#b9a695',shade:'#94887e',roof:'#4c566c',wall:'#cbb7a8',side:'#9a8e8b',leaf:'#526e56',leaf2:'#71825a',window:'#e8c482',path:'#aaa199'},night:{sky:'#172b48',ground:'#344a43',stone:'#667078',shade:'#4c5766',roof:'#2d405a',wall:'#839096',side:'#616e7c',leaf:'#324f48',leaf2:'#436459',window:'#eed598',path:'#657480'}};
const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function poly(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(Math.round(x),Math.round(y)):ctx.moveTo(Math.round(x),Math.round(y)));ctx.closePath();ctx.fill();}
function text(s,x,y,size=7,color='#263b3d'){ctx.fillStyle=color;ctx.font=`${size}px monospace`;ctx.textAlign='center';ctx.fillText(s,Math.round(x),Math.round(y));}
function tree(x,y,p){r(x-2,y-27,4,29,'#78634f');r(x-11,y-51,21,32,p.leaf);r(x-18,y-45,36,23,p.leaf);r(x-12,y-58,24,31,p.leaf);r(x-9,y-53,15,22,p.leaf2);r(x-15,y-43,11,12,p.leaf2);r(x-8,y+1,17,3,'#334e4433');}
function building(x,y,w,h,label,accent,p,variant=0){
 const side=11,roof=17;r(x+7,y+4,w+side,7,'#273b4233');r(x,y-h,w,h,p.wall);poly([[x+w,y-h],[x+w+side,y-h-8],[x+w+side,y-6],[x+w,y]],p.side);
 poly([[x-4,y-h],[x+4,y-h-roof],[x+w-6,y-h-roof],[x+w+4,y-h]],p.roof);poly([[x+w-6,y-h-roof],[x+w+side,y-h-24],[x+w+side,y-h-8],[x+w+4,y-h]],'#405469');r(x,y-h, w,3,'#f0e4c7');
 for(let row=0;row<Math.floor((h-27)/24);row++)for(let col=0;col<Math.floor(w/19);col++){
  let wx=x+8+col*19,wy=y-h+10+row*24;r(wx-2,wy-2,12,17,p.side);r(wx,wy,8,12,p.window);r(wx+3,wy,1,12,p.roof);r(wx,wy+5,8,1,p.roof);r(wx-2,wy+13,12,2,'#e9dcc0');
  if(variant&&col===0&&row%2===0){r(wx-6,wy,3,21,p.leaf);r(wx-8,wy+5,7,3,p.leaf2);}
 }
 r(x+3,y-26,w-6,11,accent);for(let k=0;k<w-6;k+=8)r(x+3+k,y-26,4,4,'#f6ebcd');
 text(label,x+w/2,y-17,6,'#fff3d9');r(x+w/2-5,y-14,10,14,'#4e575c');r(x+w/2-3,y-12,6,9,'#87a6a6');r(x+w/2+2,y-5,1,1,'#e4d5a4');r(x+7,y-13,10,10,p.window);r(x+w-17,y-13,10,10,p.window);
 for(let k=6;k<w;k+=16)r(x+k,y-3,1,3,p.side);
}
function tower(p){const x=300,y=180;poly([[x-18,y],[x-4,y-83],[x-2,y-106],[x+2,y-106],[x+4,y-83],[x+18,y]],period==='night'?'#a3c4c1':'#edf3dd');r(x-2,y-121,4,16,'#eff6df');r(x-12,y-43,24,3,'#a6b6b5');r(x-9,y-66,18,3,'#b6cac6');for(let k=0;k<5;k++){const yy=y-20-k*13,ww=15-k*2;r(x-ww,yy,ww*2,1,p.sky);poly([[x-ww,yy-2],[x+ww,yy-11],[x+ww,yy-9],[x-ww,yy]],p.sky);}r(x-4,y-13,8,13,p.sky);}
function lamp(x,y,p){if(period!=='day'){ctx.fillStyle='#f7d89012';ctx.beginPath();ctx.arc(x,y-20,27,0,7);ctx.fill();}r(x-1,y-29,2,30,'#526268');r(x-4,y-37,8,9,'#4c5b62');r(x-2,y-35,4,6,period==='day'?'#d9d5af':'#ffdb8e');r(x-5,y-38,10,2,'#4c5b62');}
function bench(x,y,p){r(x,y-6,21,3,'#96795b');r(x,y-11,21,3,'#a18461');r(x+2,y-2,2,5,'#4f5e59');r(x+17,y-2,2,5,'#4f5e59');}
function ground(p){
 r(0,0,600,460,p.sky);if(period==='night'){for(let i=0;i<65;i++){const x=(i*83+17)%600,y=(i*29+9)%140;r(x,y,1+(i%3===0),1,'#e9e8cd');}r(535,32,12,13,'#f3edd1');r(540,29,11,13,p.sky);}else{for(let i=0;i<5;i++){const x=(i*157+t*1.1)%700-65;r(x,35+i%2*22,45,7,'#f2f1df66');r(x+9,29+i%2*22,27,8,'#f2f1df66');}}
 poly([[0,160],[80,123],[190,170],[300,144],[450,160],[550,130],[600,160],[600,235],[0,235]],period==='night'?'#2e4b50':'#80a7a3');
 r(0,204,600,256,p.ground);r(114,236,373,194,p.path);r(285,173,30,103,p.path);r(199,252,202,156,p.stone);r(112,334,377,38,p.stone);r(127,393,346,27,p.stone);
 for(let y=258;y<427;y+=7)for(let x=119;x<485;x+=13)if(!((x<194||x>400)&&y<332)){r(x+(y%14===0?6:0),y,11,1,p.shade);r(x,y,1,6,p.shade);}
 r(198,252,2,76,'#e2dcc4');r(399,252,2,76,'#e2dcc4');
 tower(p);
 building(21,290,75,110,'LIBRARY','#59877c',p,1);building(103,267,72,104,'CAFE','#bb6c66',p);building(184,240,64,79,'BOOKS','#687d9b',p,1);
 building(421,263,67,106,'STUDIO','#7d7094',p,1);building(499,292,75,124,'MARKET','#b38757',p);building(348,238,61,81,'CLINIC','#628c83',p);
 // Fountain and clipped garden beds keep the walking paths clear.
 r(272,290,56,5,p.shade);r(276,283,48,8,'#a1b5bb');r(281,284,38,4,period==='night'?'#587e94':'#79b3c3');r(295,267,10,18,'#bac8c2');r(291,266,18,3,'#c4d0c8');r(298,260,3,7,'#a6d7db');
 for(let i=0;i<4;i++){const yy=273+(t*10+i*5)%14;r(287+i*8,yy,1,3,'#d2eddf');}
 for(const [x,y] of [[45,326],[93,335],[510,332],[558,340],[171,311],[433,310],[177,397],[433,397]])tree(x,y,p);
 for(const [x,y] of [[117,329],[480,329],[204,400],[397,400],[258,246],[335,246]])lamp(x,y,p);
 bench(156,379,p);bench(422,379,p);bench(249,389,p);bench(332,389,p);
 for(let i=0;i<35;i++){const x=22+i*17%550,y=419+i%3*3;if(x>112&&x<488)continue;r(x,y,4,2,i%2?'#d5a274':'#d8bd81');}
 // Ivy, book stall, cafe terrace, bicycles.
 r(11,375,82,5,p.shade);r(21,358,43,16,'#8b7761');r(17,352,51,8,'#b86f64');for(let i=0;i<6;i++)r(25+i*6,361,4,7,['#d2ba73','#859e91','#a58f98'][i%3]);
 for(const [x,y] of [[527,370],[556,389]]){r(x-9,y-9,18,3,'#a88e67');r(x-1,y-6,2,10,'#665e55');r(x-15,y-4,5,3,'#778c70');r(x+10,y-4,5,3,'#778c70');}
}
function sprite(p){
 // A scheduled villager inside a building (or asleep at home) is drawn in
 // that indoor place, not simultaneously outside in the town square.
 if(p.atVenue&&!M.outdoorPlaces.has(p.schedulePlace))return;
 const x=p.x,y=p.y,walking=!paused&&p.chat<=0&&p.isMoving===true;
 const assets=globalThis.WordvillePortraits,img=assets?.spriteImage,index=assets?.order?.[p.id];
 // 48px frame with an approximately 40px tall resident; fixed ground anchor.
 const width=48,height=48;
 if(globalThis.WordvilleWalk?.paint(ctx,p,x,y,{width,height,walking})){}else if(index!==undefined&&img?.complete&&img.naturalWidth===2560&&img.naturalHeight===768){
  const col=index%4,row=Math.floor(index/4),time=p.steps*7.5+index*.19;
  // Two source-identical poses + two clean transitional variants = four animation slots.
  const motion=[1,2,3,2];
  const pose=walking?motion[Math.floor(time)%motion.length]:0;
  const sx=col*640+pose*160,sy=row*256;
  const lift=walking?(p.onStairs?1.5+Math.abs(Math.sin(time*1.4))*3:Math.abs(Math.sin(time))*1.3):0;
  const tilt=walking?(Math.sin(time)*.013+(p.onStairs?.019:0)):Math.sin(t*1.15+index)*.003;
  ctx.save();
  ctx.fillStyle='#302d3044';ctx.beginPath();ctx.ellipse(x,y+3,15,3,0,0,Math.PI*2);ctx.fill();
  ctx.translate(x,Math.round(y-lift));
  if(p.heading<0)ctx.scale(-1,1);
  ctx.rotate(tilt);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(img,sx,sy,160,256,-width/2,-height+5,width,height);
  ctx.restore();
 }else{
  r(x-4,y-17,8,7,p.hair);r(x-3,y-11,6,5,p.skin);
  r(x-5,y-7,10,8,p.shirt);r(x-3,y+1,3,5,'#4b4850');r(x+1,y+1,3,5,'#4b4850');
 }
 if(p.id===selected){
  ctx.strokeStyle='#ffe08b';ctx.lineWidth=2;
  ctx.strokeRect(Math.round(x-width/2-2),Math.round(y-height+4),width+4,height+7);
 }
 if(p.chat>0){r(x-11,y-height-18,22,13,'#f8f1dc');text('···',x,y-height-9,8);}
 if(zoom>1.6||p.id===selected){
  const w=p.name.length*7+8;
  r(x-w/2,y+10,w,12,period==='night'?'#243849dd':'#fbf3dadd');
  text(p.name,x,y+18,7,period==='night'?'#f4e7c8':'#35494a');
 }
}
function syncTime(){
 const now=new Date(),clock=scheduleMinute(),h=Math.floor(clock/60)%24;
 period=mode==='auto'?M.period(h):mode;
 const stamp=schedulePreview==='auto'?now.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'}):S.formatHour(Math.floor(clock/60));
 document.getElementById('village-clock').textContent=stamp;
 document.getElementById('village-period').textContent=({day:'낮',dusk:'저녁',night:'밤'})[period]+(schedulePreview==='auto'?' · 실제 시각':' · 일정 미리보기');
 document.querySelector('.village-section').dataset.period=period;
 document.documentElement.dataset.period=period;minute=now.getMinutes();
 if(document.getElementById('wv-resident-schedule')?.open)renderScheduleRows();
 document.dispatchEvent(new CustomEvent('wordville-time-changed',{detail:{period,minute:clock}}));
}
function select(id){selected=id;const p=residents.find(r=>r.id===id);const partner=residents.find(r=>r.id===p.partner);document.getElementById('speaker').textContent=p.name;const slot=S.at(id,scheduleMinute());document.getElementById('resident-home').textContent='📍 '+slot.placeName+' · '+slot.activity;document.getElementById('resident-line').textContent=p.chat>0&&partner?`${partner.name}와 대화 중이에요.`:p.atVenue?`${slot.placeName}에서 ${slot.activity} 중이에요.`:`${slot.placeName}(으)로 이동하고 있어요.`;document.getElementById('resident-english').textContent=p.chat>0?'Would you like to study together?':'Let’s learn a new word together.';document.getElementById('resident-korean').textContent=p.chat>0?'함께 공부할래요?':'새로운 단어를 함께 배워요.';panel.hidden=false;document.querySelectorAll('[data-person]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.person===id)));document.dispatchEvent(new CustomEvent('wordville-resident-selected',{detail:{id}}));}
function meet(a,b){chatCount++;const messages=[['Let’s meet at the cafe.','카페에서 만나요.'],['Can you confirm the reservation?','예약을 확인해 줄 수 있나요?'],['The shipment will arrive tomorrow.','배송 물품은 내일 도착해요.'],['The appointment is at ten.','약속은 10시예요.'],['Let’s review our schedule.','우리 일정을 확인해요.']];const [en,ko]=messages[(chatCount-1)%messages.length];const li=document.createElement('li');li.textContent=`${a.name} ↔ ${b.name} · ${ko}`;feed.prepend(li);while(feed.children.length>5)feed.lastChild.remove();document.getElementById('conversation-count').textContent=chatCount+'번의 대화';if(selected===a.id||selected===b.id){const p=selected===a.id?a:b;document.getElementById('speaker').textContent=p.name;document.getElementById('resident-line').textContent=`${a.name}와 ${b.name}의 대화`;document.getElementById('resident-english').textContent=en;document.getElementById('resident-korean').textContent=ko;panel.hidden=false;}}

// Clicking a portrait is navigation, not just selection of a canned word.
function visitResident(id){
 const p=residents.find(p=>p.id===id);
 if(!p)return false;
 selected=id;
 document.querySelectorAll('[data-person]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.person===id)));
 const slot=S.at(id,scheduleMinute());
 const here=p.atVenue?p.schedulePlace:null;
 const indoor=here&&!M.outdoorPlaces.has(here);
 if(indoor&&globalThis.WordvillePlaces?.places?.some(place=>place.id===here)){
  followId=null;
  globalThis.WordvilleShell?.activate('places');
  globalThis.WordvillePlaces.pick(here);
  globalThis.WordvilleVenueRuntime?.focusResident?.(id);
 }else{
  followId=id;viewZone='all';zoom=1.5;
  globalThis.WordvilleShell?.activate('town');
  const controls=document.querySelectorAll('[data-map-zone]');
  controls.forEach(button=>button.setAttribute('aria-pressed','false'));
  // Walking NPCs are focused at their actual interpolated position.
 }
 document.getElementById('wv-visit-feedback').textContent=
  p.atVenue?S.PLACE_NAMES[slot.place]+' · '+slot.activity:'이동 중 · '+S.PLACE_NAMES[slot.place]+'(으)로 가는 길';
 return true;
}
function selectedPlace(){return selected?residents.find(p=>p.id===selected)?.schedulePlace:null;}
const VISIBLE_RESIDENTS=new Set(M.people.map(person=>person.id));
const MAP_ZONES={all:400,north:160,central:405,south:645};
function currentMapView(){
 const scale=(viewZone==='all'?Math.max(canvas.width/600,canvas.height/800):Math.max(canvas.width/600,canvas.height/800)*1.25)*zoom;
 const follow=followId?residents.find(p=>p.id===followId):null;
 if(follow&&!follow.atVenue)return {scale,offsetX:canvas.width/2-follow.x*scale,offsetY:canvas.height/2-(follow.y-42)*scale};
 if(follow&&M.outdoorPlaces.has(follow.schedulePlace))return {scale,offsetX:canvas.width/2-follow.x*scale,offsetY:canvas.height/2-(follow.y-42)*scale};
 return {scale,offsetX:canvas.width/2-300*scale,offsetY:canvas.height/2-MAP_ZONES[viewZone]*scale};
}
function setMapZone(zone){
 if(!Object.hasOwn(MAP_ZONES,zone))return;
 viewZone=zone;zoom=1;followId=null;
 document.querySelectorAll('[data-map-zone]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mapZone===zone)));
}
function frame(ms){const dt=last?Math.min((ms-last)/1000,.1):0;last=ms;if(!paused&&!document.hidden){t+=dt;M.tick(residents,dt,meet,{minuteOfDay:scheduleMinute()});}if(new Date().getMinutes()!==minute)syncTime();ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#3b5146';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.save();const view=currentMapView();ctx.translate(view.offsetX,view.offsetY);ctx.scale(view.scale,view.scale);(globalThis.WordvilleWorldArt?.town?globalThis.WordvilleWorldArt.town(ctx,period,t):ground(paints[period]));for(const p of [...residents].filter(p=>VISIBLE_RESIDENTS.has(p.id)||p.id===selected).sort((a,b)=>a.y-b.y))sprite(p);globalThis.WordvilleWalk?.drawPets(ctx,t);ctx.restore();requestAnimationFrame(frame);}
for(const p of M.people){const b=document.createElement('button');b.type='button';b.dataset.person=p.id;b.setAttribute('aria-pressed','false');const dot=document.createElement('span');dot.className='resident-dot';dot.style.background=p.shirt;b.append(dot,document.createTextNode(p.name));b.addEventListener('click',()=>select(p.id));document.getElementById('resident-list').append(b);}
canvas.addEventListener('click',e=>{const box=canvas.getBoundingClientRect(),view=currentMapView(),x=(e.clientX-box.left)/box.width*canvas.width,y=(e.clientY-box.top)/box.height*canvas.height,wx=(x-view.offsetX)/view.scale,wy=(y-view.offsetY)/view.scale;const found=[...residents].filter(p=>Math.abs(p.x-wx)<27&&wy>=p.y-53&&wy<=p.y+12).sort((a,b)=>Math.abs((a.y-25)-wy)+Math.abs(a.x-wx)-Math.abs((b.y-25)-wy)-Math.abs(b.x-wx))[0];if(found){select(found.id);return;}
// The reference painting has different entrances from the generated fallback map.
const art=globalThis.WordvilleWorldArt;
const landmarks=art?.hubLandmarks?.length?art.hubLandmarks:(art?.reference?.complete&&art.reference.naturalWidth>0?art.referenceLandmarks:art?.landmarks)||[];
const place=landmarks.map(s=>({ ...s,dist:Math.hypot(s.x-wx,s.y-wy)})).filter(s=>s.dist<35).sort((a,b)=>a.dist-b.dist)[0];
if(place&&globalThis.WordvillePlaces){if(globalThis.WordvilleShell?.activate)globalThis.WordvilleShell.activate('places');else globalThis.WordvillePlaces.show('places');globalThis.WordvillePlaces.pick(place.id);}
});
document.querySelectorAll('[data-map-zone]').forEach(button=>button.addEventListener('click',()=>setMapZone(button.dataset.mapZone)));
function syncCanvasResolution(){
 const rect=canvas.getBoundingClientRect();
 if(rect.width<2||rect.height<2)return;
 const scale=Math.min(window.devicePixelRatio||1,2);
 const w=Math.max(2,Math.round(rect.width*scale)),h=Math.max(2,Math.round(rect.height*scale));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
}
new ResizeObserver(syncCanvasResolution).observe(canvas);
window.addEventListener('resize',syncCanvasResolution);
syncCanvasResolution();
// Interactive resident timetable, available offline and persisted per device.
const scheduleHourSelect=document.getElementById('wv-schedule-hour');
for(let hour=0;hour<=24;hour++){
 const o=document.createElement('option');o.value=String(hour);o.textContent=S.formatHour(hour)+(hour===24?' (다음 날)':'');
 scheduleHourSelect.add(o);
}
scheduleHourSelect.addEventListener('change',()=>{
 schedulePreview=scheduleHourSelect.value;
 M.syncSchedule(residents,scheduleMinute(),{teleport:true});
 syncTime();if(selected)select(selected);
});
const scheduleBox=document.getElementById('wv-resident-schedule');
const personSelect=document.getElementById('wv-sched-person');
for(const p of M.people){const opt=document.createElement('option');opt.value=p.id;opt.textContent=p.name;personSelect.add(opt);}
const placeSelect=document.getElementById('wv-sched-edit-place');
for(const [key,name] of Object.entries(S.PLACE_NAMES)){const opt=document.createElement('option');opt.value=key;opt.textContent=name;placeSelect.add(opt);}
const editor=document.getElementById('wv-sched-editor'),activityInput=document.getElementById('wv-sched-edit-action');
let editHour=null;
function renderScheduleRows(){
 if(!scheduleBox.open)return;
 const id=personSelect.value,currentHour=S.hourOf(scheduleMinute()),container=document.getElementById('wv-sched-rows');
 const list=document.createDocumentFragment();
 for(const slot of S.day(id)){
  const item=document.createElement('div');item.className='wv-schedule-row';item.setAttribute('role','listitem');
  item.dataset.current=String(slot.hour===currentHour);
  const when=document.createElement('span');when.className='when';when.textContent=S.formatHour(slot.hour);
  const detail=document.createElement('span');detail.className='what';
  const name=document.createElement('strong');name.textContent=slot.placeName;
  detail.append(name,document.createTextNode(slot.activity+(slot.custom?' · 수정됨':'')));
  const edit=document.createElement('button');edit.type='button';edit.textContent='수정';
  edit.setAttribute('aria-label',S.formatHour(slot.hour)+' 일정 수정');
  edit.addEventListener('click',()=>{
   editHour=slot.hour;editor.hidden=false;placeSelect.value=slot.place;
   activityInput.value=slot.activity;
   document.getElementById('wv-sched-edit-title').textContent=S.formatHour(slot.hour)+'–'+S.formatHour(slot.hour+1)+' 일정 수정';
   activityInput.focus();
  });
  item.append(when,detail,edit);list.append(item);
 }
 container.replaceChildren(list);
 const now=S.at(id,scheduleMinute());
 document.getElementById('wv-sched-now').textContent='현재 '+now.placeName+' · '+now.activity;
}
personSelect.addEventListener('change',()=>{editor.hidden=true;renderScheduleRows();});
scheduleBox.addEventListener('toggle',renderScheduleRows);
const msg=document.getElementById('wv-sched-status');
function closeEditor(){editor.hidden=true;editHour=null;}
document.getElementById('wv-sched-cancel').addEventListener('click',closeEditor);
function updateAfterEdit(saved){
 closeEditor();M.syncSchedule(residents,scheduleMinute());
 renderScheduleRows();if(selected)select(selected);
 msg.textContent=saved?'일정을 이 기기에 저장했습니다.':'이 기기의 저장 공간에 접근할 수 없어 현재 실행에만 적용했습니다.';
}
document.getElementById('wv-sched-save').addEventListener('click',()=>{
 if(editHour===null)return;
 try{
  const saved=S.setHour(personSelect.value,editHour,placeSelect.value,activityInput.value);
  updateAfterEdit(saved);
 }catch(e){msg.textContent=e.message;}
});
document.getElementById('wv-sched-reset').addEventListener('click',()=>{
 if(editHour===null)return;
 try{updateAfterEdit(S.resetHour(personSelect.value,editHour));}
 catch(e){msg.textContent=e.message;}
});
M.syncSchedule(residents,scheduleMinute(),{teleport:true});

document.getElementById('village-time-mode').addEventListener('change',e=>{mode=e.target.value;syncTime();});
document.getElementById('zoom-in').addEventListener('click',()=>{zoom=Math.min(2,zoom+.25);});document.getElementById('zoom-out').addEventListener('click',()=>{zoom=Math.max(1,zoom-.25);});
document.getElementById('pause-village').addEventListener('click',e=>{paused=!paused;e.currentTarget.textContent=paused?'주민 움직이기':'잠시 멈추기';e.currentTarget.setAttribute('aria-pressed',String(paused));});
document.getElementById('resident-study').addEventListener('click',()=>{if(selected)document.dispatchEvent(new CustomEvent('village-study',{detail:{residentId:selected,choose:true}}));});
document.addEventListener('visibilitychange',()=>{last=0;syncTime();});
globalThis.WordvilleVillage={residents,select,visitResident,get visitingPlace(){return selectedPlace();},get clockMinute(){return scheduleMinute();},get schedulePreview(){return schedulePreview;},get period(){return period;},get conversations(){return chatCount;},get zoom(){return zoom;},get zone(){return viewZone;},setZone:setMapZone,resize:syncCanvasResolution,mapView:currentMapView,visibleResidents:[...VISIBLE_RESIDENTS]};
syncTime();requestAnimationFrame(frame);
})();