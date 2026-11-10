'use strict';
(() => {
const M=VillageModel,canvas=document.getElementById('village-canvas'),ctx=canvas.getContext('2d');
const panel=document.getElementById('village-dialogue'),feed=document.getElementById('village-feed');
const residents=M.freshResidents();let mode='auto',selected=null,zoom=1,last=0,t=0,paused=false,chatCount=0,minute='',period='day';
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
function sprite(p){const x=Math.round(p.x),y=Math.round(p.y),walk=!p.chat&&p.wait<=0&&p.route.length>0?Math.floor(p.steps*6)%2:0;r(x-5,y+1,10,2,'#24394744');r(x-4,y-17,8,6,p.hair);r(x-3,y-13,6,5,p.skin);r(x-4,y-9,8,8,p.shirt);r(x-6,y-8,2,6,p.skin);r(x+4,y-8,2,6,p.skin);r(x-3,y-1,2,4+walk,'#404852');r(x+1,y-1,2,5-walk,'#404852');r(x-3,y+3+walk,3,1,'#343c44');r(x+1,y+4-walk,3,1,'#343c44');r(x-2,y-12,1,1,'#394347');r(x+2,y-12,1,1,'#394347');
 // Resident hair and face are cropped from the same portrait sheet used in dialogue.
 const portraits=globalThis.WordvillePortraits;
 const index=portraits?.order?.[p.id];
 const img=portraits?.image;
 if(index!==undefined&&img?.complete&&img.naturalWidth>=4&&img.naturalHeight>=3){
   const tileW=img.naturalWidth/4,tileH=img.naturalHeight/3;
   // A compact pixel face sits above the walking body; nearest-neighbor keeps the grid crisp.
   const sx=(index%4)*tileW,sy=Math.floor(index/4)*tileH;
   ctx.drawImage(img,sx+tileW*0.19,sy+tileH*0.03,tileW*0.62,tileH*0.64,x-7,y-24,14,14);
 }
 if(p.id===selected){r(x-7,y-21,14,1,'#f9d993');r(x-7,y-21,1,22,'#f9d993');r(x+7,y-21,1,22,'#f9d993');}
 if(p.chat>0){r(x-6,y-27,13,7,'#f8f1dc');text('···',x,y-21,7);}
 if(zoom>1.2||p.id===selected){const width=p.name.length*7+8;r(x-width/2,y+7,width,11,period==='night'?'#243849dd':'#fbf3dadd');text(p.name,x,y+15,7,period==='night'?'#f4e7c8':'#35494a');}
}
function syncTime(){const now=new Date(),h=now.getHours();period=mode==='auto'?M.period(h):mode;const stamp=now.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});document.getElementById('village-clock').textContent=stamp;document.getElementById('village-period').textContent=({day:'낮',dusk:'저녁',night:'밤'})[period]+(mode==='auto'?' · 현재 시간':' · 미리보기');document.querySelector('.village-section').dataset.period=period;document.documentElement.dataset.period=period;minute=now.getMinutes();}
function select(id){selected=id;const p=residents.find(r=>r.id===id);const partner=residents.find(r=>r.id===p.partner);document.getElementById('speaker').textContent=p.name;document.getElementById('resident-home').textContent=p.home;document.getElementById('resident-line').textContent=p.chat>0&&partner?`${partner.name}, 오늘은 ${p.home}에서 함께 공부할래요?`:`안녕하세요! 저는 ${p.name}이에요. ${p.home}에서 자주 만날 수 있어요.`;document.getElementById('resident-english').textContent=p.chat>0?'Would you like to study together?':'Let’s learn a new word together.';document.getElementById('resident-korean').textContent=p.chat>0?'함께 공부할래요?':'새로운 단어를 함께 배워요.';panel.hidden=false;document.querySelectorAll('[data-person]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.person===id)));}
function meet(a,b){chatCount++;const messages=[['Let’s meet at the cafe.','카페에서 만나요.'],['Can you confirm the reservation?','예약을 확인해 줄 수 있나요?'],['The shipment will arrive tomorrow.','배송 물품은 내일 도착해요.'],['The appointment is at ten.','약속은 10시예요.'],['Let’s review our schedule.','우리 일정을 확인해요.']];const [en,ko]=messages[(chatCount-1)%messages.length];const li=document.createElement('li');li.textContent=`${a.name} ↔ ${b.name} · ${ko}`;feed.prepend(li);while(feed.children.length>5)feed.lastChild.remove();document.getElementById('conversation-count').textContent=chatCount+'번의 대화';if(selected===a.id||selected===b.id){const p=selected===a.id?a:b;document.getElementById('speaker').textContent=p.name;document.getElementById('resident-line').textContent=`${a.name}와 ${b.name}의 대화`;document.getElementById('resident-english').textContent=en;document.getElementById('resident-korean').textContent=ko;panel.hidden=false;}}
function frame(ms){const dt=last?Math.min((ms-last)/1000,.1):0;last=ms;if(!paused&&!document.hidden){t+=dt;M.tick(residents,dt,meet);}if(new Date().getMinutes()!==minute)syncTime();ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();const scale=canvas.width/600*zoom;ctx.translate(canvas.width/2-300*scale,canvas.height/2-245*scale);ctx.scale(scale,scale);ground(paints[period]);for(const p of [...residents].sort((a,b)=>a.y-b.y))sprite(p);ctx.restore();requestAnimationFrame(frame);}
for(const p of M.people){const b=document.createElement('button');b.type='button';b.dataset.person=p.id;b.setAttribute('aria-pressed','false');const dot=document.createElement('span');dot.className='resident-dot';dot.style.background=p.shirt;b.append(dot,document.createTextNode(p.name));b.addEventListener('click',()=>select(p.id));document.getElementById('resident-list').append(b);}
canvas.addEventListener('click',e=>{const box=canvas.getBoundingClientRect(),scale=canvas.width/600*zoom,x=(e.clientX-box.left)/box.width*canvas.width,y=(e.clientY-box.top)/box.height*canvas.height,wx=(x-canvas.width/2)/scale+300,wy=(y-canvas.height/2)/scale+245;const found=[...residents].sort((a,b)=>Math.hypot(a.x-wx,a.y-wy)-Math.hypot(b.x-wx,b.y-wy))[0];if(Math.hypot(found.x-wx,found.y-wy)<24)select(found.id);});
document.getElementById('village-time-mode').addEventListener('change',e=>{mode=e.target.value;syncTime();});
document.getElementById('zoom-in').addEventListener('click',()=>{zoom=Math.min(2,zoom+.25);});document.getElementById('zoom-out').addEventListener('click',()=>{zoom=Math.max(1,zoom-.25);});
document.getElementById('pause-village').addEventListener('click',e=>{paused=!paused;e.currentTarget.textContent=paused?'주민 움직이기':'잠시 멈추기';e.currentTarget.setAttribute('aria-pressed',String(paused));});
document.getElementById('resident-study').addEventListener('click',()=>{const p=residents.find(r=>r.id===selected);if(p)document.dispatchEvent(new CustomEvent('village-study',{detail:{word:p.word}}));});
document.addEventListener('visibilitychange',()=>{last=0;syncTime();});
globalThis.WordvilleVillage={residents,select,get period(){return period;},get conversations(){return chatCount;},get zoom(){return zoom;}};
syncTime();requestAnimationFrame(frame);
})();
