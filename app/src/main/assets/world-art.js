/* Original isometric pixel scenery for Wordville.
 * Design references: layered façades, cobblestones, covered halls, wooden
 * interiors, botanical courtyards. No third-party game screenshots or assets.
 */
(() => {
'use strict';
const COL={
 outline:'#453c35',wood:'#79553d',woodLight:'#bd8d62',woodDark:'#503b32',
 grass:'#7eac70',grass2:'#679a63',grassDark:'#507d58',
 stone:'#c8bd9e',stone2:'#e5d9b7',stoneDark:'#9b9989',
 blue:'#6f9ea6',water:'#4b858c',gold:'#d7b765',brick:'#b9765b',
 flower:'#ec969d',leaf:'#4e8067',leaf2:'#83aa78'
};
const rng=(n)=>{let v=Math.sin(n*127.1+43.17)*43758.5453;return v-Math.floor(v)};
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function poly(c,a,color){c.fillStyle=color;c.beginPath();a.forEach((p,i)=>i?c.lineTo(Math.round(p[0]),Math.round(p[1])):c.moveTo(Math.round(p[0]),Math.round(p[1])));c.closePath();c.fill();}
function line(c,x,y,a,b,color,w=1){c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(Math.round(x),Math.round(y));c.lineTo(Math.round(a),Math.round(b));c.stroke();}
function label(c,s,x,y,color='#fbefcd',size=9){c.fillStyle=color;c.font='bold '+size+'px monospace';c.textAlign='center';c.fillText(s,x,y);}
function leaf(c,x,y,scale=1,shade=COL.leaf){const z=scale;rect(c,x-2*z,y-9*z,5*z,14*z,'#6e5946');for(let i=0;i<13;i++){const dx=Math.sin(i*2.4)*14*z,dy=Math.cos(i*.9)*8*z-15*z;rect(c,x+dx-5*z,y+dy-4*z,8*z,8*z,i%4===0?COL.leaf2:shade);}for(let i=0;i<4;i++)rect(c,x+Math.sin(i*4)*11*z,y-22*z+i*3*z,3*z,3*z,'#a5c681');}
function blossom(c,x,y,i=0){const colors=['#e1a1a9','#edc6a0','#c7a5d5','#f8e2a0'];rect(c,x-2,y-2,5,5,colors[i%4]);rect(c,x,y,2,2,'#fdf0c5');}
function shrub(c,x,y,seed=1){rect(c,x-10,y-4,20,8,'#3a7651');rect(c,x-9,y-9,18,7,'#63975d');for(let j=0;j<7;j++){const dx=(rng(seed+j)*21-10)|0;blossom(c,x+dx,y-8-(rng(j+seed)*9|0),j+seed);}}
function brickWall(c,x,y,w,h){
 rect(c,x,y,w,h,'#d8c8ab');
 for(let row=0;row<h;row+=12){line(c,x,y+row,x+w,y+row,'#b7a48d',1);
  for(let xx=x+(row%24?10:0);xx<x+w;xx+=22)rect(c,xx,y+row,1,11,'#b7a48d');
 }
 rect(c,x,y,4,h,'#b49b7f');rect(c,x+w-5,y,5,h,'#b49b7f');
}
function arch(c,x,y,w,h,glass='#779dab'){
 rect(c,x-3,y-3,w+6,h+6,'#a78e75');
 rect(c,x,y+8,w,h-8,glass);
 poly(c,[[x,y+8],[x+7,y],[x+w-7,y],[x+w,y+8]],glass);
 rect(c,x+w/2-1,y+3,2,h-3,'#e8dbc6');
 rect(c,x+2,y+h*.5,w-4,2,'#d8cdbb');
 rect(c,x+2,y+8,3,h-10,'#d4d5d2');
 rect(c,x+w-5,y+8,3,h-10,'#354d58');
 for(let yy=y+9;yy<y+h-6;yy+=9){rect(c,x+5,yy,2,3,'#b0d3d1');rect(c,x+w-9,yy+3,2,3,'#c6e2dd');}
}
function lamppost(c,x,y,night){
 rect(c,x-2,y-31,4,31,'#55534b');rect(c,x-6,y-37,12,5,'#514c45');
 rect(c,x-4,y-46,8,10,night?'#f4c879':'#d2c4a2');
 rect(c,x-7,y-47,14,3,'#343c3a');
 rect(c,x-4,y-39,1,4,'#f8e8ab');
 rect(c,x-7,y-2,14,3,'#4c5952');
}
function roof(c,x,y,w,variant='brick'){
 const main=variant==='brick'?'#a96754':variant==='blue'?'#637c8e':variant==='green'?'#507d73':'#80644f';
 const hi=variant==='brick'?'#d18c68':variant==='blue'?'#91a4a5':variant==='green'?'#82a899':'#aa8061';
 poly(c,[[x-10,y],[x+28,y-46],[x+w+35,y-36],[x+w+9,y+4]],'#483a35');
 poly(c,[[x-6,y-3],[x+30,y-40],[x+w+31,y-32],[x+w+5,y]],main);
 poly(c,[[x+w+5,y],[x+w+31,y-32],[x+w+43,y-8],[x+w+14,y+11]],'#59473e');
 for(let yy=-32;yy<1;yy+=8){
  const k=(yy+39)/38,sx=x+27-k*32,ex=x+w+30-k*23;
  line(c,sx,y+yy,ex,y+yy+7,'#4a4142',2);
  for(let xx=sx+((Math.abs(yy)%16)?5:0);xx<ex;xx+=14)rect(c,xx,y+yy+1,5,2,hi);
 }
 for(let i=0;i<2;i++){
  const xx=x+47+i*62;poly(c,[[xx,y-23],[xx+8,y-38],[xx+19,y-32],[xx+19,y-13]],'#6c5145');
  arch(c,xx+7,y-29,12,16,'#6d9d9e');
 }
}
function house(c,x,y,w,h,opt={}){
 const glass=opt.night?'#f2d48c':'#78a6b4';
 rect(c,x+11,y-2,w+34,10,'#37463837');
 brickWall(c,x,y-h,w,h);
 poly(c,[[x+w,y-h],[x+w+31,y-h-17],[x+w+31,y-17],[x+w,y]],'#a89782');
 for(let yy=y-h+5;yy<y-12;yy+=15)line(c,x+w+1,yy,x+w+29,yy-16,'#d6c3a5');
 rect(c,x,y-18,w,20,'#d9c8a1');
 for(let i=0;i<Math.max(1,Math.floor(w/42));i++){
  const xx=x+12+i*43;arch(c,xx,y-h+19,24,37,glass);
  if(i%2===0){rect(c,xx-3,y-h+57,30,4,'#978674');rect(c,xx+4,y-h+61,22,5,'#cfa17f');blossom(c,xx+10,y-h+59,i);}
 }
 rect(c,x+w/2-14,y-45,28,45,'#6a5348');arch(c,x+w/2-11,y-42,22,35,glass);rect(c,x+w/2-1,y-21,3,3,'#e8d48c');
 rect(c,x+w/2-23,y-4,47,5,'#e7d7b2');rect(c,x+w/2-28,y+1,57,5,'#b5a185');
 roof(c,x,y-h,w,opt.roof||'brick');
 for(let i=0;i<3;i++)shrub(c,x+12+i*35,y+4,4+i);
 if(opt.sign){rect(c,x+w/2-40,y-13,80,18,'#675341');rect(c,x+w/2-37,y-11,74,14,'#a87657');label(c,opt.sign,x+w/2,y, '#fff0c9',8);}
}
function conservatory(c,x,y,w=135){
 const h=116;rect(c,x,y-h,w,h,'#9ebc9c');
 poly(c,[[x,y-h],[x+36,y-h-35],[x+w+8,y-h-22],[x+w,y-h+4]],'#5c887f');
 for(let j=0;j<5;j++){
  const px=x+9+j*25;
  poly(c,[[px,y-h+4],[px+21,y-h+6],[px+21,y-11],[px,y-13]],'#94c7bd');
  line(c,px,y-h+4,px,y-13,'#548478',4);line(c,px,y-45,px+20,y-46,'#d9e9d0',2);
  if(j%2===1){leaf(c,px+12,y-12,.4);blossom(c,px+12,y-35,j);}
 }
 for(let k=0;k<4;k++){rect(c,x+3+k*31,y-6,24,7,'#ad755a');leaf(c,x+15+k*31,y-6,.4);}
}
function bridge(c,x,y){
 // Canal banks, floral stone railings and lit bridge posts.
 poly(c,[[x-82,y-25],[x+85,y-75],[x+113,y-22],[x-54,y+27]],'#ded0aa');
 poly(c,[[x-83,y-20],[x+85,y-69],[x+85,y-56],[x-83,y-6]],'#ae9c84');
 for(let i=0;i<7;i++){
  const px=x-68+i*25,py=y-22-i*7;
  rect(c,px,py-14,5,17,'#e7d7b4');rect(c,px-3,py-18,12,5,'#bcb198');
 }
 for(let i=0;i<7;i++){const px=x-64+i*25,py=y+3-i*7;rect(c,px,py-7,6,12,'#d6c5a4');}
 for(const v of [[x-71,y-23],[x+77,y-67]])lamppost(c,v[0],v[1],false);
}
function water(c,x,y,w,h){
 rect(c,x,y,w,h,'#476d76');
 for(let j=0;j<90;j++){const xx=x+rng(j+71)*w,yy=y+rng(j+91)*h;rect(c,xx,yy,3+j%5,1,j%3?'#6c9d9d':'#8ab4a5');}
 for(let i=0;i<13;i++){const xx=x+rng(i+54)*w,yy=y+rng(i+83)*h;rect(c,xx,yy,8,3,'#7b9b66');rect(c,xx+4,yy-3,2,3,'#8bb77a');}
}
function cobbles(c){
 rect(c,0,-350,600,1400,'#6c966b');
 for(let yy=-340;yy<950;yy+=14){
  for(let xx=-35+(Math.floor(yy/14)%2)*17;xx<630;xx+=34){
   const n=Math.floor(xx/34)*61+yy*3;const stone=(xx>118&&xx<502&&yy>92&&yy<650)||yy>490&&yy<570||xx>290&&yy<90;
   const river=xx>450&&yy>645;
   const colors=stone?['#ccc3aa','#b9b19f','#ded1b5','#b3b3a1']:['#779f71','#72a16c','#8daf79','#6c965f'];
   const color=river?'#598d93':colors[Math.floor(rng(n)*4)];
   poly(c,[[xx,yy],[xx+17,yy-7],[xx+34,yy],[xx+17,yy+7]],color);
   if(stone){line(c,xx+3,yy,xx+16,yy-5,'#e9dcc2');rect(c,xx+25,yy+3,4,1,'#9e9686');}
   else if(!river&&rng(n+1)>.91){rect(c,xx+9,yy-2,3,4,'#4e865b');rect(c,xx+14,yy-4,2,3,'#8cbc72');}
  }
 }
 water(c,455,645,145,300);
 poly(c,[[438,630],[469,646],[469,950],[431,950]],'#d0c39f');
 for(let j=0;j<36;j++){const x=24+rng(j+117)*552,y=-300+rng(j+231)*1180;if(x>160&&x<460&&y>180&&y<500)continue;const n=j%4;rect(c,x,y,4,4,['#678f5c','#81a969','#63905e','#b5b47a'][n]);}
}
function townBackground(c,p){
 cobbles(c);
 const night=p==='night',light=p==='dusk';
 // Structures are independent from the movement graph; plazas remain open.
 house(c,25,132,177,132,{sign:'WORDVILLE LIBRARY',roof:'brick',night});
 house(c,391,105,159,116,{sign:'APOTHECARY',roof:'green',night});
 conservatory(c,455,263,140);
 house(c,6,324,118,87,{sign:'CAFE',roof:'brick',night});
 house(c,465,346,129,100,{sign:'MUSIC',roof:'blue',night});
 house(c,11,597,164,120,{sign:'BOOKSHOP',roof:'brick',night});
 house(c,335,590,143,104,{sign:'GROCER',roof:'green',night});
 house(c,22,841,175,134,{sign:'ART GALLERY',roof:'blue',night});
 house(c,285,865,161,119,{sign:'GREENHOUSE',roof:'green',night});
 // Additional explorable stores and distinct venue silhouettes.
 miniVenue(c,275,336,'POOL','#669eac');
 miniVenue(c,275,450,'GYM','#618b87');
 miniVenue(c,70,489,'BURGER','#b76f56');
 miniVenue(c,518,495,'ICE CREAM','#c489aa');
 miniVenue(c,282,578,'PUB','#8c6754');
 miniVenue(c,102,748,'WORKSHOP','#9b785d');
 miniVenue(c,523,945,'RANCH','#a16a54');
 // Garden and park at the north bank, with stepped flower borders.
 poly(c,[[222,95],[360,68],[404,108],[267,140]],'#d3c7ad');
 for(let i=0;i<5;i++){shrub(c,230+i*26,117-i*8,i);shrub(c,235+i*24,146-i*6,i+9);}
 rect(c,287,170,26,17,'#abbdb4');poly(c,[[267,183],[300,172],[332,184],[300,193]],'#b9c9be');
 poly(c,[[274,178],[300,169],[325,177],[300,187]],night?'#658f9a':'#77b9c8');
 rect(c,299,150,4,20,'#d6d2ad');rect(c,293,149,16,5,'#e1dabb');
 for(let j=0;j<5;j++)rect(c,280+j*10,172-j%2*3,2,8,'#bce2dc');
 for(const [x,y] of [[200,470],[405,485],[197,685],[352,685],[560,542],[87,705],[302,750]])leaf(c,x,y,1.3);
 for(const [x,y] of [[135,226],[442,238],[164,420],[430,416],[206,544],[330,554],[428,744]])shrub(c,x,y,Math.round(x+y));
 for(const [x,y] of [[210,212],[406,211],[132,390],[465,399],[220,580],[408,600],[208,763]])lamppost(c,x,y,night);
 // Outdoor bench and market stands.
 for(const [x,y] of [[215,461],[394,468],[259,618]]){rect(c,x-18,y-9,36,4,'#876347');rect(c,x-19,y-4,38,4,'#b78d62');rect(c,x-15,y,3,8,'#584e44');rect(c,x+14,y,3,8,'#584e44');}
 for(let i=0;i<3;i++){let x=60+i*42,y=740;rect(c,x,y-6,34,9,'#b06f55');rect(c,x+4,y-8,26,4,'#d9b86b');for(let k=0;k<5;k++)rect(c,x+7+k*5,y-12,4,5,['#a6bd7e','#d68875','#f0c57e'][k%3]);}
 bridge(c,476,715);
 for(const s of LANDMARKS)venueLabel(c,s);
 for(let j=0;j<45;j++){const x=rng(j+154)*600,y=620+rng(j+57)*300;if(x>440&&y>660)continue;if(j%3===0)blossom(c,x,y,j);}
 // Night ambience uses transparent shading, never a completely opaque overlay.
 if(night){rect(c,0,-350,600,1350,'#14243b38');}
 else if(light){rect(c,0,-350,600,1350,'#6544521c');}
}

// Map destinations align with the 17 interactive venue cards.
const LANDMARKS=[
 {id:'library',name:'도서관',x:300,y:196},
 {id:'clinic',name:'진료소',x:496,y:298},
 {id:'greenhouse',name:'식물원',x:55,y:334},
 {id:'cafe',name:'카페',x:93,y:608},
 {id:'studio',name:'음악실',x:118,y:142},
 {id:'bookstore',name:'서점',x:85,y:519},
 {id:'market',name:'시장',x:85,y:725},
 {id:'museum',name:'미술관',x:495,y:100},
 {id:'pool',name:'수영장',x:301,y:575},
 {id:'ranch',name:'목장',x:365,y:672},
 {id:'gym',name:'헬스장',x:220,y:125},
 {id:'burger',name:'햄버거',x:159,y:470},
 {id:'icecream',name:'아이스크림',x:177,y:521},
 {id:'pub',name:'펍',x:490,y:112},
 {id:'square',name:'광장',x:303,y:325},
 {id:'workshop',name:'공방',x:457,y:412},
 {id:'park',name:'공원',x:474,y:713}
];
function miniVenue(c,x,y,name,shade='#a87657'){
 // Compact, distinct roof and storefront at a consistent base pixel scale.
 rect(c,x-40,y-43,80,43,'#d4bda2');rect(c,x-44,y-47,88,7,'#755342');
 poly(c,[[x-47,y-47],[x-28,y-69],[x+27,y-69],[x+48,y-47]],shade);
 rect(c,x-35,y-35,20,21,'#7c9aa0');rect(c,x+15,y-35,20,21,'#7c9aa0');
 rect(c,x-8,y-30,16,30,'#795a46');rect(c,x+4,y-14,2,2,'#eddb9b');
 rect(c,x-40,y-9,80,7,'#aa8360');
 label(c,name,x,y-52,'#fff4d3',9);
}
function venueLabel(c,s){
 const x=s.x,y=s.y;rect(c,x-31,y-13,62,16,'#423a37');
 rect(c,x-29,y-11,58,12,'#f2deaf');
 rect(c,x-29,y-11,3,12,'#7b567b');
 label(c,s.name,x,y-2,'#493d36',9);
 rect(c,x-4,y+3,8,5,'#a8784c');
}
function drawCreature(c,kind,x,y,phase=0){
 // Tiny original pixel animals: no interpolation or image enlargement artifacts.
 const u=kind==='horse'||kind==='bear'?2:1;
 const bob=Math.floor(phase)%2;
 const R=(a,b,w,h,color)=>rect(c,x+a*u,y+(b+bob)*u,w*u,h*u,color);
 const fur={sparrow:'#8d6851',dog:'#bb946e',cat:'#9299a0',chicken:'#efe6cf',horse:'#a06b4a',hamster:'#cfae80',rabbit:'#e8e0d5',fox:'#c7774a',wolf:'#747f88',bear:'#80634e'}[kind];
 if(!fur)return;
 R(-9,1,19,2,'#37443744');
 if(kind==='sparrow'){
  R(-5,-7,9,5,fur);R(2,-9,4,4,fur);R(-7,-5,5,2,'#66584f');
  R(5,-7,4,2,'#e7bc65');R(1,-8,1,1,'#292d30');R(-2,-2,1,3,'#70563e');
 }else if(kind==='chicken'){
  R(-7,-9,12,10,fur);R(3,-12,6,7,'#e6cf9d');
  R(4,-15,3,3,'#bd6056');R(8,-10,4,2,'#d5a34a');R(6,-10,1,1,'#293238');
  R(-9,-12,4,7,'#d2ad78');R(-3,1,2,4,'#ac7a46');R(3,1,2,4,'#ac7a46');
 }else if(kind==='horse'){
  R(-11,-12,19,13,fur);R(5,-20,6,14,fur);R(9,-20,5,6,'#bd9676');
  R(7,-23,3,5,'#624738');R(11,-24,3,5,'#624738');R(11,-17,1,1,'#2d2a2e');
  R(-9,1,3,9,'#6b5143');R(2,1,3,9,'#6b5143');R(-15,-10,4,12,'#665044');
 }else if(kind==='rabbit'){
  R(-8,-8,14,9,fur);R(3,-12,7,8,fur);
  R(3,-21,3,12,fur);R(8,-22,3,13,fur);R(5,-19,1,8,'#d79da0');
  R(8,-10,1,1,'#4a3e42');R(-11,-5,5,5,'#f6eee5');
 }else if(kind==='hamster'){
  R(-9,-8,17,10,fur);R(-6,-12,5,6,fur);R(3,-12,5,6,fur);
  R(-3,-5,10,6,'#f0dfc1');R(4,-8,1,1,'#2b3434');R(9,-4,2,2,'#d7969a');
 }else if(kind==='bear'){
  R(-13,-12,25,14,fur);R(0,-22,12,14,fur);R(0,-25,4,5,fur);R(10,-25,4,5,fur);
  R(9,-15,6,5,'#ab9175');R(11,-19,1,1,'#202c34');
  R(-9,1,5,6,'#604c3e');R(6,1,5,6,'#604c3e');
 }else{
  const isFox=kind==='fox',isWolf=kind==='wolf',isCat=kind==='cat';
  R(-10,-10,17,11,fur);R(5,-16,10,12,fur);
  if(isFox||isWolf||isCat){R(4,-20,4,6,fur);R(11,-21,4,7,fur);}
  else{R(5,-18,4,9,'#7e5b4b');R(13,-17,3,8,'#7e5b4b');}
  R(13,-11,4,4,isFox?'#e6d4b9':'#b7a9a0');
  R(12,-15,1,2,'#253139');R(-7,1,3,5,'#675548');R(2,1,3,5,'#675548');
  if(isFox||isWolf){R(-19,-10,10,5,fur);R(-21,-8,5,3,isFox?'#f7e4cf':'#c1bcc0');}
  else if(isCat){R(-14,-17,4,14,fur);R(-16,-19,3,4,fur);}
  else{R(-14,-11,6,5,fur);}
 }
}
const WILDLIFE=[
 {kind:'sparrow',x:345,y:220},{kind:'dog',x:248,y:387},
 {kind:'cat',x:433,y:469},{kind:'chicken',x:130,y:678},
 {kind:'horse',x:485,y:919},{kind:'hamster',x:341,y:529},
 {kind:'rabbit',x:373,y:720},{kind:'fox',x:52,y:784},
 {kind:'wolf',x:435,y:835},{kind:'bear',x:531,y:826}
];

const cache=new Map();
const landmarkAssets={};
function referenceImage(path,id){
 if(typeof Image==='undefined')return {complete:false,naturalWidth:0};
 const img=new Image();img.decoding='async';
 if(id)img.onload=()=>document.dispatchEvent(new CustomEvent('wordville-art-ready',{detail:{id}}));
 img.src=path;return img;
}
const mapReference=referenceImage('art/town-reference.webp');
const venueIds=['pool','ranch','gym','burger','icecream','pub','museum','greenhouse','cafe','bookstore','clinic','library','studio','market','square','workshop','park'];
for(const id of venueIds){
 landmarkAssets[id]=referenceImage('art/'+id+'.webp',id);
}
function town(ctx,period,elapsed=0){
 if(globalThis.WordvilleHubMap?.paint){globalThis.WordvilleHubMap.paint(ctx,period);return;}
 if(mapReference.complete&&mapReference.naturalWidth>0){
   ctx.imageSmoothingEnabled=true;
   ctx.drawImage(mapReference,0,0,600,800);
   // Subtle tint maintains the original color detail when the village turns to night.
   if(period==='night'){rect(ctx,0,0,600,800,'#0d1e3555');}
   else if(period==='dusk'){rect(ctx,0,0,600,800,'#59455b20');}
   ctx.imageSmoothingEnabled=false;
   return;
 }
 let image=cache.get(period);
 if(!image){
  image=document.createElement('canvas');image.width=600;image.height=1400;
  const c=image.getContext('2d');c.imageSmoothingEnabled=false;c.translate(0,350);
  townBackground(c,period);cache.set(period,image);
 }
 ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,-350);
 for(let i=0;i<WILDLIFE.length;i++){const a=WILDLIFE[i];drawCreature(ctx,a.kind,a.x,a.y,Math.floor(elapsed*2+i%3));}
}
function isoBox(c,x,y,w,d,h,front='#a07855',top='#ca9e72'){
 poly(c,[[x,y-h],[x+w,y-h],[x+w+d,y-h-d*.42],[x+d,y-h-d*.42]],top);
 poly(c,[[x,y-h],[x+w,y-h],[x+w,y],[x,y]],front);
 poly(c,[[x+w,y-h],[x+w+d,y-h-d*.42],[x+w+d,y-d*.42],[x+w,y]],'#6a5544');
 line(c,x+1,y-h,x+w,y-h,'#efcd94',2);
}
function pot(c,x,y,size=1){rect(c,x-8*size,y-3*size,16*size,11*size,'#af7156');rect(c,x-10*size,y-4*size,20*size,3*size,'#c18b68');leaf(c,x,y-3*size,size*.6);blossom(c,x-4*size,y-12*size,3);}
function bookcase(c,x,y,w=70,h=103){
 isoBox(c,x,y,w,10,h,'#7f543c','#bb9061');
 for(let row=0;row<3;row++){
  const yy=y-h+13+row*28;rect(c,x+5,yy,w-10,22,'#392f30');
  for(let i=0;i<Math.floor((w-10)/7);i++){const col=['#b4b97f','#cc8f71','#88aaa0','#b9a1ba','#d2bc73'][((i+row*3)%5)];rect(c,x+7+i*7,yy+2,5,18,col);rect(c,x+7+i*7,yy+5,5,1,'#f2dbb3');}
  rect(c,x+4,yy+22,w-8,3,'#c29b66');
 }
}
function ovalRug(c,x,y,col='#79948d'){
 poly(c,[[x-99,y],[x-64,y-34],[x+56,y-47],[x+103,y-18],[x+72,y+20],[x-45,y+33]],col);
 poly(c,[[x-79,y],[x-49,y-25],[x+42,y-36],[x+82,y-17],[x+53,y+12],[x-35,y+23]],'#ead5a8');
 poly(c,[[x-58,y-2],[x-38,y-18],[x+31,y-24],[x+56,y-15],[x+32,y+6],[x-25,y+14]],col);
}
function counter(c,x,y,w=130){isoBox(c,x,y,w,23,26,'#8d6049','#d7ab75');for(let i=0;i<w-14;i+=20)rect(c,x+i+9,y-13,5,12,'#a97751');}
function candelabra(c,x,y){rect(c,x,y-12,2,13,'#e1c36b');rect(c,x-9,y-11,20,3,'#8f7048');for(let k=-1;k<=1;k++) {rect(c,x+k*9,y-22,3,13,'#e5cd8a');rect(c,x+k*9,y-24,2,3,'#fae6a0');}}
function isoroom(c,theme,p){
 rect(c,0,0,512,420,theme==='night'?'#394b4e':'#bda88d');
 poly(c,[[0,126],[258,39],[512,122],[255,219]],'#dfcead');
 poly(c,[[0,126],[257,219],[257,270],[0,177]],'#b49476');
 poly(c,[[257,219],[512,122],[512,203],[257,296]],'#ba9873');
 for(let xx=-256;xx<800;xx+=42){
  for(let yy=182;yy<630;yy+=22){
   const sx=xx+(Math.floor(yy/22)%2?21:0);
   poly(c,[[sx,yy],[sx+43,yy-12],[sx+84,yy],[sx+41,yy+12]],(xx+yy)%3===0?'#b99072':'#c6a282');
   line(c,sx,yy,sx+42,yy+12,'#a5836b');
  }
 }
 rect(c,0,0,512,15,'#654735');
 // Gabled open walls and wood panel ribs.
 for(let k=0;k<8;k++){
  const sx=k*40;rect(c,sx,132+sx*.28,5,50,'#70523d');
 }
 for(let k=0;k<8;k++){
  const sx=256+k*37;rect(c,sx,218-k*.25,5,58,'#70523d');
 }
 for(let j=0;j<4;j++){
  const x=26+j*60,y=129+j*17;
  arch(c,x,y-62,28,51,p==='night'?'#e5bd7e':'#84adb0');
 }
 // Open overhead trellis beams; wood floor grid is a deliberate cutaway.
 line(c,0,124,256,218,'#78573e',8);line(c,257,219,512,122,'#78573e',8);
 if(p==='night'){rect(c,0,0,512,420,'#16263518');}
}
function sceneDecor(c,id){
 const indoor=['gym','burger','icecream','pub','museum','cafe','bookstore','clinic','library','studio','market','workshop'].includes(id);
 if(indoor){isoroom(c,'wood','day');}
 else{
  rect(c,0,0,512,420,'#9bb9a3');
  for(let y=100;y<440;y+=18)for(let x=-28;x<560;x+=36){const h=rng((x+400)*2+y);const col=h>.5?'#cec4ac':'#b8b5a0';poly(c,[[x,y],[x+18,y-8],[x+36,y],[x+18,y+8]],col);}
  for(let j=0;j<18;j++){const x=rng(j+27)*512,y=105+rng(j+54)*330;if(j%4===0)shrub(c,x,y,j);else if(j%5===0)leaf(c,x,y,.9);}
 }
 const plant=(x,y)=>pot(c,x,y,1.15);
 const stool=(x,y)=>{isoBox(c,x,y,24,9,18,'#77523d','#c5996a');rect(c,x+4,y+1,3,8,'#5e493a');};
 if(id==='library'||id==='bookstore'){
  bookcase(c,18,229,86,135);bookcase(c,119,266,73,130);bookcase(c,397,250,78,127);
  isoBox(c,264,320,115,35,19,'#82614c','#bb966a');
  rect(c,295,291,49,6,'#d6c9a5');rect(c,306,285,25,7,'#d7dfca');
  stool(282,353);stool(365,329);
  ovalRug(c,266,370,'#77948b');
  if(id==='library'){
   // Wide stairs between two levels, a railing and a carved bust.
   for(let i=0;i<6;i++){isoBox(c,351+i*7,181+i*21,106-i*9,17,8,'#ad8e76','#e0c5a2');}
   isoBox(c,408,148,27,23,39,'#baaa8f','#d9c6a4');rect(c,419,93,10,15,'#e7d8b6');
  }else{pot(c,229,273,1.2);}
 }else if(id==='pub'||id==='cafe'||id==='burger'||id==='icecream'){
  counter(c,289,298,177);
  for(let k=0;k<4;k++)stool(282+k*43,353-k*6);
  bookcase(c,400,199,67,83);
  ovalRug(c,187,350,id==='icecream'?'#c88a98':'#6b8674');
  isoBox(c,96,335,108,40,15,'#84583d','#c89d6c');
  for(let k=0;k<3;k++)stool(105+k*32,357);
  candelabra(c,174,313);pot(c,236,258,.9);
  if(id==='pub'){isoBox(c,27,216,97,23,52,'#635143','#a16c4e');rect(c,45,153,48,45,'#3f332d');rect(c,55,185,29,10,'#e6af5b');}
  if(id==='burger'){for(let i=0;i<3;i++){rect(c,323+i*37,234,30,10,'#d4a25d');rect(c,326+i*37,244,24,7,'#729362');}}
  if(id==='icecream'){for(let i=0;i<4;i++){rect(c,310+i*38,227,22,28,['#edc7ce','#e2d8b2','#a6d4cc','#bbabc9'][i]);}}
 }else if(id==='studio'){
  bookcase(c,29,236,60,116);ovalRug(c,247,360,'#84909d');
  isoBox(c,190,343,130,52,35,'#373c4b','#5c5867');for(let i=0;i<11;i++)rect(c,220+i*7,308,6,23,i%2?'#f4e4c7':'#24232b');
  for(const x of [73,380]){isoBox(c,x,281,43,22,69,'#3e4f5a','#677d85');rect(c,x+12,247,23,20,'#243039');}
  stool(241,386);pot(c,433,332,1.1);
 }else if(id==='museum'){
  for(let i=0;i<3;i++){
   const x=27+i*75,y=80+i*19;rect(c,x,y,55,68,'#886346');rect(c,x+5,y+5,45,58,['#85a7a0','#d3a391','#b5b8c9'][i]);
   rect(c,x+13,y+32,27,17,'#e9d3ab');
  }
  ovalRug(c,242,360,'#c5a985');
  for(let i=0;i<3;i++){isoBox(c,139+i*110,342,45,28,31,'#d3c6aa','#efdfba');rect(c,154+i*110,264,20,48,'#e5d0ad');}
  pot(c,425,322,1.1);
 }else if(id==='gym'){
  ovalRug(c,260,348,'#8aaba9');
  for(let i=0;i<3;i++){isoBox(c,64+i*140,317,86,37,8,'#617377','#a8b5ae');rect(c,89+i*140,229,4,83,'#424a50');rect(c,151+i*140,236,4,72,'#424a50');rect(c,95+i*140,258,54,7,'#c9d0c2');}
  isoBox(c,31,251,82,15,28,'#6c7077','#8b969a');pot(c,450,275,1.1);
 }else if(id==='clinic'){
  for(let i=0;i<2;i++){const x=50+i*170;isoBox(c,x,329,132,60,26,'#b9c8bb','#f5ead0');rect(c,x+10,296,38,18,'#f4fff7');rect(c,x+6,308,123,6,'#cfdde5');}
  isoBox(c,368,318,78,31,30,'#9e815d','#e1b984');rect(c,401,240,29,16,'#5e958f');rect(c,414,230,5,35,'#487e6c');pot(c,453,274,1.1);
 }else if(id==='market'){
  for(let i=0;i<3;i++){const x=29+i*155;counter(c,x,322,122);
   for(let j=0;j<4;j++)for(let k=0;k<3;k++){const px=x+12+j*22,py=287+k*6;rect(c,px,py,14,8,['#d17d64','#a3ad63','#edc27b'][j%3]);}}
  bookcase(c,404,218,73,88);pot(c,234,255,1);
 }else if(id==='workshop'){
  counter(c,56,309,156);counter(c,293,327,165);
  for(let i=0;i<5;i++){const x=84+i*27;rect(c,x,273,12,19,['#aaa69a','#9f8f83','#d3b46c'][i%3]);rect(c,x+5,261,3,12,'#565e56');}
  bookcase(c,408,212,68,105);pot(c,246,332,1.1);
 }else if(id==='pool'){
  poly(c,[[55,173],[392,117],[479,218],[132,327]],'#e3dbc0');
  poly(c,[[90,194],[381,145],[450,219],[146,300]],'#5794af');
  for(let j=1;j<5;j++)line(c,98+j*6,196+j*15,388+j*12,147+j*15,'#b2d8d6',3);
  for(let j=0;j<3;j++){line(c,150+j*105,174,201+j*95,281,'#e2e4cb',2);}
  for(let i=0;i<5;i++){pot(c,44+i*92,354,1);}
 }else if(id==='ranch'){
  house(c,44,208,170,126,{sign:'WORDVILLE RANCH',roof:'brick'});
  for(let y=240;y<389;y+=55)for(let x=27;x<490;x+=56){rect(c,x,y-19,5,33,'#99744d');rect(c,x+1,y-12,46,4,'#d2b079');}
  for(let i=0;i<3;i++){rect(c,285+i*65,320-i*7,36,23,'#eadfc7');rect(c,290+i*65,338-i*7,19,7,'#a48e72');rect(c,315+i*65,321-i*7,7,7,'#6b5c52');}
 }else if(id==='greenhouse'){
  conservatory(c,66,224,334);
  for(let j=0;j<7;j++){pot(c,54+j*59,339-j%2*15,1.25);}
  isoBox(c,175,372,174,25,24,'#8e6048','#c9a076');for(let i=0;i<6;i++)shrub(c,195+i*28,350,i);
 }else if(id==='square'||id==='park'){
  for(let i=0;i<6;i++){leaf(c,40+i*86,182+i%2*44,1.1);}
  if(id==='square'){
   poly(c,[[155,268],[270,209],[373,262],[262,325]],'#c4c6b0');
   poly(c,[[173,265],[270,231],[349,265],[257,308]],'#6ca6b1');
   rect(c,264,181,12,64,'#d4d6b8');rect(c,248,178,41,9,'#d8dfc7');
   for(let i=0;i<4;i++)rect(c,210+i*31,244-i%2*14,3,20,'#b5e0d6');
  } else {water(c,116,252,261,133);bridge(c,257,260);}
  for(let i=0;i<5;i++)shrub(c,59+i*101,351-(i%2)*48,i);
 }
 const guests={ranch:['horse','chicken','dog'],park:['rabbit','sparrow','fox'],square:['sparrow','dog','cat'],greenhouse:['rabbit','hamster'],pub:['cat'],cafe:['dog'],museum:['sparrow'],workshop:['cat']};
 if(guests[id])guests[id].forEach((a,i)=>drawCreature(c,a,95+i*115,370-i*23,0));
 for(let i=0;i<9;i++){const x=22+rng(i+67)*465,y=385-rng(i+13)*18;if(i%2)rect(c,x,y,4,2,'#edcba1');}
}
// Only the venues actually identifiable in the shipped reference artwork can be
// clicked directly. All 17 venues remain accessible through the Places tab.
const REFERENCE_LANDMARKS=[
 {id:'library',name:'도서관',x:298,y:169},
 {id:'bookstore',name:'서점',x:82,y:520},
 {id:'cafe',name:'카페',x:94,y:590},
 {id:'ranch',name:'목장',x:361,y:682},
 {id:'square',name:'광장',x:297,y:344}
];
const sceneCaches=new Map();
function place(c,p){
 const id=p.id;
 const photo=landmarkAssets[id];
 if(photo?.complete&&photo.naturalWidth>0){
   c.clearRect(0,0,c.canvas.width,c.canvas.height);
   c.imageSmoothingEnabled=true;
   c.drawImage(photo,0,0,c.canvas.width,c.canvas.height);
   return;
 }if(!sceneCaches.has(id)){
  const img=document.createElement('canvas');img.width=512;img.height=420;
  const z=img.getContext('2d');z.imageSmoothingEnabled=false;sceneDecor(z,id);sceneCaches.set(id,img);
 }
 c.imageSmoothingEnabled=false;c.clearRect(0,0,c.canvas.width,c.canvas.height);
 c.drawImage(sceneCaches.get(id),0,0,c.canvas.width,c.canvas.height);
}
globalThis.WordvilleWorldArt={town,place,house,conservatory,landmarks:LANDMARKS,hubLandmarks:globalThis.WordvilleHubMap?.landmarks||[],referenceLandmarks:REFERENCE_LANDMARKS,wildlife:WILDLIFE,reference:mapReference,venueImages:landmarkAssets};
})();