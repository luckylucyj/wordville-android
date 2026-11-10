(() => {
'use strict';
const F=VillageFacilities,$=id=>document.getElementById(id),dialog=$('facility-dialog');let current=0,state=F.fresh();
try{state=F.normalize(JSON.parse(localStorage.getItem(F.KEY)));}catch{}
function draw(canvas,f){const ctx=canvas.getContext('2d');ctx.save();ctx.scale(canvas.width/600,canvas.height/340);ctx.imageSmoothingEnabled=false;
const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);},label=(s,x,y,size=19)=>{ctx.fillStyle='#34463f';ctx.font=size+'px sans-serif';ctx.textAlign='center';ctx.fillText(s,x,y);},circle=(x,y,r,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
rect(0,0,600,340,'#e8ecdf');rect(24,24,552,112,f.color);rect(24,136,552,180,'#dfd0b3');for(let y=140;y<316;y+=25)rect(24,y,552,2,'#cab99b');rect(43,42,514,62,'#f3edda');label(f.sign,300,81,24);
switch(f.id){
case 'ranch':
rect(24,136,552,180,'#a2b780');rect(52,146,166,124,'#b87761');rect(65,139,140,14,'#846351');rect(112,194,45,76,'#73564c');rect(80,160,30,29,'#eed9af');
for(let x=238;x<555;x+=30){rect(x,212,8,83,'#eee3bd');}rect(233,228,327,8,'#eee3bd');rect(233,263,327,8,'#eee3bd');
rect(286,174,88,47,'#f0e7cd');rect(345,158,40,43,'#f0e7cd');rect(301,181,23,18,'#766657');rect(333,198,20,18,'#766657');rect(294,218,9,26,'#8d7a65');rect(354,218,9,26,'#8d7a65');rect(368,170,5,5,'#3e4841');circle(456,197,22,'#f4e6bc');circle(472,180,15,'#f4e6bc');rect(468,160,10,8,'#bc7361');rect(481,180,9,6,'#d1a354');rect(448,214,4,22,'#c29453');rect(463,214,4,22,'#c29453');label('FEED',120,301,16);break;
case 'gym':
for(const x of [73,246]){rect(x,178,118,77,'#6d8183');rect(x+8,187,102,47,'#434f55');rect(x+32,157,10,25,'#6d8183');rect(x+75,157,10,25,'#6d8183');rect(x+10,254,12,24,'#566c6d');rect(x+96,254,12,24,'#566c6d');}
rect(414,228,102,12,'#887662');for(const x of [430,492]){rect(x,172,12,70,'#556477');rect(x-11,178,34,40,'#556477');}rect(76,287,296,12,'#8fa99a');label('TRAIN · REST · REPEAT',300,304,16);break;
case 'sauna':
for(let y=142;y<310;y+=22)rect(45,y,510,3,'#bc9472');for(const y of [204,258]){rect(60,y,305,16,'#ad805a');rect(74,y+16,12,30,'#8c694c');rect(334,y+16,12,30,'#8c694c');}
rect(421,208,96,60,'#737f7d');for(let i=0;i<5;i++)rect(426+i*17,195-i%2*10,16,25,'#9a9e92');for(const x of [150,250,465]){rect(x,151,7,25,'#f4efdf');rect(x+7,134,7,20,'#f4efdf');}rect(390,289,140,12,'#88a9a7');break;
case 'salon':
for(const x of [100,265,430]){rect(x-32,139,64,76,'#b7917c');rect(x-24,147,48,60,'#b9d3d1');rect(x-36,231,72,34,'#b77c8d');rect(x-3,264,6,26,'#6b7779');rect(x-28,290,56,7,'#6b7779');rect(x-38,216,76,7,'#8b7561');}label('CUT / COLOR / STYLE',300,319,15);break;
case 'pool':
rect(50,152,500,143,'#8bb8bc');rect(60,162,480,122,'#71b7c4');for(let y=175;y<285;y+=30){rect(66,y,466,3,'#e8ead0');for(let x=70;x<535;x+=25)rect(x,y,8,3,'#b58c6f');}for(let x=80;x<530;x+=54)rect(x,204+x%3*12,25,3,'#add7d7');rect(485,143,5,59,'#ebead7');rect(505,143,5,59,'#ebead7');for(let y=154;y<205;y+=15)rect(485,y,25,3,'#ebead7');label('SWIM',300,318,16);break;
case 'market':
for(let row=0;row<2;row++){for(const x of [60,235,410]){rect(x,163+row*65,130,9,'#9f8260');for(let k=0;k<6;k++){rect(x+8+k*19,137+row*65,13,26,['#a8bb87','#d7aa72','#af8082'][k%3]);rect(x+9+k*19,133+row*65,11,5,'#ede6cd');}}}rect(168,282,260,23,'#9b9b6a');label('MILK · BREAD · APPLES',300,274,17);break;
case 'hospital':
rect(62,197,235,80,'#91b3a3');rect(52,185,255,17,'#e8e6d5');rect(100,144,70,41,'#677d83');rect(105,149,60,29,'#b9d0c3');rect(373,191,147,47,'#eee6d1');rect(385,178,32,17,'#fbf5e2');rect(375,238,8,40,'#7e9491');rect(509,238,8,40,'#7e9491');rect(442,139,16,44,'#86a99c');rect(428,153,44,16,'#86a99c');label('RECEPTION',180,248,17);break;
case 'cafe':
rect(52,172,168,100,'#a58264');rect(43,163,187,14,'#766454');rect(72,128,58,35,'#738f88');rect(151,130,39,33,'#c1b695');for(const x of [320,465]){circle(x,222,45,'#b5906c');rect(x-4,255,8,40,'#79654f');rect(x-57,209,20,51,'#899c7c');rect(x+37,209,20,51,'#899c7c');rect(x-9,208,19,20,'#f1ebd1');rect(x+10,212,8,12,'#d8c9a5');}label('A LITTLE BREAK',300,316,17);break;

case 'burger':
rect(44,227,512,64,'#a67859');rect(40,216,520,15,'#755d49');for(const x of [130,300,470]){rect(x-49,184,98,18,'#c59454');rect(x-44,169,88,15,'#716247');rect(x-47,160,94,9,'#8baf6c');rect(x-44,146,88,14,'#d1a453');rect(x-36,130,72,16,'#d9ad62');for(let i=0;i<4;i++)rect(x-25+i*17,137,4,3,'#eee0b1');}label('BURGERS · FRIES · DRINKS',300,319,17);break;
case 'icecream':
rect(45,205,510,86,'#a3bdb5');rect(54,212,492,58,'#c5d9ce');for(let i=0;i<6;i++){rect(66+i*80,222,65,36,['#e6d6af','#9c7d68','#d8a6ad'][i%3]);}for(const [x,color] of [[180,'#ead6ac'],[300,'#9e7d69'],[420,'#d5a0a5']]){rect(x-10,178,20,23,'#c69e70');circle(x,163,23,color);}label('CHOOSE YOUR FLAVOR',300,318,17);break;
case 'pub':
rect(24,136,552,180,'#b4a38c');rect(45,162,245,105,'#806752');rect(37,154,261,14,'#60534a');for(let i=0;i<7;i++){rect(60+i*31,132,14,22,['#a2b09a','#c6b075','#aaa2b3'][i%3]);rect(63+i*31,122,8,12,'#9aa58e');}for(const x of [82,160,238]){circle(x,277,21,'#787185');rect(x-3,293,6,17,'#655a52');}rect(359,186,167,90,'#938471');rect(434,139,6,86,'#61616a');circle(437,133,10,'#adaab1');rect(409,223,58,9,'#61616a');rect(367,206,35,54,'#66647b');rect(485,206,35,54,'#66647b');label('MUSIC · FOOD · DRINKS',300,319,16);break;
case 'gallery':
for(const x of [112,300,488]){rect(x-57,143,114,93,'#a38d69');rect(x-49,151,98,77,'#e9e2cf');}rect(70,185,82,37,'#a3b59c');rect(80,169,30,16,'#a3b59c');circle(131,167,10,'#d2bc7e');rect(262,163,76,49,'#a5b2b6');rect(275,180,50,32,'#7a9696');rect(458,170,62,47,'#bb9c91');rect(477,156,23,28,'#bb9c91');rect(269,263,62,41,'#a1a497');rect(279,232,42,31,'#b3b4a8');rect(289,215,22,21,'#c5c3b5');label('LOOK · DISCOVER · REFLECT',300,323,16);break;
case 'botanical':
rect(24,136,552,180,'#c5d2b2');for(const x of [65,180,295,410,525]){rect(x-19,264,38,35,'#b28c6b');rect(x-3,170,6,100,'#6b9063');for(let i=0;i<4;i++){rect(x-30+(i%2)*27,180+i*18,32,13,['#7a9e6b','#8eab70'][i%2]);}}rect(47,118,506,12,'#9db4a0');for(const x of [70,185,300,415,530])rect(x,110,5,38,'#9db4a0');label('GROW · OBSERVE · CARE',300,322,17);break;

}
ctx.restore();}
function save(next){try{localStorage.setItem(F.KEY,JSON.stringify(next));state=next;return true;}catch{$('facility-result').textContent='기록을 저장할 수 없어요. 저장 공간 설정을 확인해 주세요.';return false;}}
function records(){const f=F.facilities[current],entry=state.records[f.id],counts=entry?.counts||[0,0,0];$('facility-records').replaceChildren();
if(f.id==='salon'){const p=document.createElement('p');p.textContent=entry?.choice!=null?'현재 스타일: '+f.actions[entry.choice].replace(' 선택',''):'아직 선택한 스타일이 없어요.';$('facility-records').append(p);}
else{const ul=document.createElement('ul');f.actions.forEach((action,i)=>{const li=document.createElement('li');li.textContent=action+' · '+counts[i]+(f.id==='market'?'개':'회');ul.append(li);});$('facility-records').append(ul);} $('facility-reset').disabled=!counts.some(Boolean);}
function render(){const f=F.facilities[current];$('facility-sign').textContent=f.sign;$('facility-title').textContent=f.name;$('facility-description').textContent=f.description;$('facility-residents').textContent='이곳을 좋아하는 주민 · '+f.residents;$('facility-activity').textContent=f.activity;$('facility-scene').setAttribute('aria-label',f.name+' 실내 공간');draw($('facility-scene'),f);$('facility-result').textContent='';$('facility-english').textContent=f.english;$('facility-korean').textContent=f.korean;$('facility-actions').replaceChildren();
f.actions.forEach((name,i)=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>{if(save(F.act(state,f.id,i))){$('facility-result').textContent=f.results[i];records();}};$('facility-actions').append(b);});records();}
function open(id){const index=F.facilities.findIndex(f=>f.id===id);if(index<0)return;current=index;render();if(!dialog.open)dialog.showModal();dialog.scrollTop=0;}
for(const f of F.facilities){const b=document.createElement('button');b.className='facility-card';b.dataset.facility=f.id;b.setAttribute('aria-label',f.name+' 방문하기');const cv=document.createElement('canvas');cv.width=300;cv.height=170;cv.setAttribute('aria-hidden','true');draw(cv,f);const name=document.createElement('strong'),desc=document.createElement('span'),tag=document.createElement('small');name.textContent=f.name;desc.textContent=f.description;tag.textContent=f.residents;b.append(cv,name,desc,tag);b.onclick=()=>open(f.id);$('facility-list').append(b);}
$('facility-close').onclick=()=>dialog.close();$('facility-prev').onclick=()=>{current=(current+F.facilities.length-1)%F.facilities.length;render();dialog.scrollTop=0;};$('facility-next').onclick=()=>{current=(current+1)%F.facilities.length;render();dialog.scrollTop=0;};$('facility-reset').onclick=()=>{const next=F.normalize(state);delete next.records[F.facilities[current].id];if(save(next)){$('facility-result').textContent='이 시설의 기록을 초기화했어요.';records();}};
$('facility-study').onclick=()=>{const f=F.facilities[current];dialog.close();document.dispatchEvent(new CustomEvent('village-study',{detail:{word:f.word}}));};
globalThis.WordvilleFacilities={open,get selected(){return F.facilities[current].id;}};
})();
