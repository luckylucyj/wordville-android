/* Wordville shared pixel-art renderer.
 * Original, deterministic pixel scenery influenced by the user's references:
 * leafy water landscapes, framed windows, quiet reading nooks, wooden
 * interiors, cozy dining tables and four light phases.
 *
 * 17 venues + residents' home share a 256x120 logical pixel canvas.
 * Most importantly, every *blocking* piece of furniture is drawn using the
 * same authored fixture rectangles used by WordvilleVenueSpec for pathfinding.
 * The existing town illustration is rendered to a low-resolution atlas then
 * nearest-neighbor scaled; no high-resolution smoothing is allowed.
 */
(function(root){
'use strict';
const W=256,H=120,venueCache=new Map();
const themes=Object.freeze({
 home:['#edcbaa','#b98266','#b9a879','#876b58','#fff2da','#bcd4b5'],
 pool:['#b5e2d8','#83b9b5','#a1ccc4','#5a9cb3','#e8faf1','#77c9dc'],
 ranch:['#dfc8a2','#a77554','#9eb878','#698765','#f5d6a1','#81b2af'],
 gym:['#dae1d3','#76968b','#a6ae9f','#556a6e','#f4e9d5','#a6babc'],
 burger:['#f3c3a0','#ba7b5e','#d4b07b','#805b4b','#f8e3bd','#e3a263'],
 icecream:['#f1cbce','#bd8d9d','#d8bdb1','#7a889a','#fff1e1','#bcd6d5'],
 pub:['#bb927e','#755548','#b79b7c','#554a49','#f1d4a0','#a19e94'],
 museum:['#ddd5bc','#927f76','#c8bfaa','#837d81','#f3e3c5','#9fb8b2'],
 greenhouse:['#d6e8ca','#91b6aa','#b7d1ab','#639b85','#f9f3d9','#9ccfc2'],
 cafe:['#ead0b4','#a8725e','#c8a982','#725b57','#fff0d1','#a9c8b4'],
 bookstore:['#d9bd9e','#875d52','#a88e72','#5a514c','#f8e8c3','#a6ad9a'],
 clinic:['#e3e7d9','#87a9a5','#b7c9bd','#607b82','#f8f7e7','#accad1'],
 library:['#d6c7a6','#806454','#a6a489','#586c68','#fff1cf','#a9c7ae'],
 studio:['#cdc5cd','#746778','#a49a9c','#504e66','#f2d9bb','#9db0bd'],
 market:['#e9d3ad','#a17b57','#d6b68b','#6c7863','#fdf0d3','#bad0a4'],
 square:['#b5c4b0','#879f8d','#c3c5a7','#819ca4','#f7ebc5','#9cb7aa'],
 workshop:['#dec7a7','#9b785e','#b7a080','#6a796a','#f1e3c8','#a5b7a0'],
 park:['#a9cfbf','#6d9f82','#a0bd8b','#508b97','#f2eacb','#8cc5bc']
});
const outdoor=new Set(['park','ranch','square']);
const context=()=>root.document?.createElement?.('canvas')||null;
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
const line=(c,x,y,x2,y2,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(Math.round(x)+.5,Math.round(y)+.5);c.lineTo(Math.round(x2)+.5,Math.round(y2)+.5);c.stroke();};
const seed=(x,y,s=0)=>{let v=((Math.floor(x)*73856093)^(Math.floor(y)*19349663)^(s*83492791))>>>0;v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967295;};
const phaseFor=(period,minute)=>{
 const hour=((Math.floor((Number.isFinite(minute)?minute:720)/60)%24)+24)%24;
 if(period==='night')return 'night';
 if(period==='dusk'||(hour>=17&&hour<20))return 'sunset';
 if(hour>=5&&hour<8)return 'dawn';
 return 'day';
};
const skyFor=phase=>({
 dawn:['#364f73','#8b91a6','#f2c29c'],
 day:['#6cb5d6','#9ad3de','#d6eee4'],
 sunset:['#394b7c','#cf797c','#ffcb99'],
 night:['#15223e','#34476a','#576784']
})[phase]||['#6cb5d6','#9ad3de','#d6eee4'];
const lightFilter={dawn:'#f6bd9650',day:'#fff1d00a',sunset:'#e88e6550',night:'#101b3870'};
let weather='clear';
const weathers=new Set(['clear','clouds','overcast','rain']);
function setWeather(value){if(!weathers.has(value))return false;weather=value;return true;}
function drawSky(c,phase,skyY=45,weatherType=weather){
 const colors=skyFor(phase);
 for(let y=0;y<skyY;y++)rect(c,0,y,W,1,colors[Math.min(2,Math.floor(y*3/skyY))]);
 if(phase==='night'){
  rect(c,190,8,7,7,'#e6e8d5');
  for(let i=0;i<48;i++){const x=Math.floor(seed(i,7,11)*W),y=Math.floor(seed(i,41,15)*skyY);rect(c,x,y,1,1,i%3?'#a5c4d5':'#f7edd9');}
 }else{
  const sun=phase==='sunset'?[195,34]:phase==='dawn'?[44,38]:[195,10];
  rect(c,sun[0],sun[1],9,9,phase==='sunset'?'#ffe5a8':'#fff5c5');
 }
 if(weatherType!=='clear'){
  for(let i=0;i<11;i++){
   const x=Math.floor(seed(i,23,3)*W),y=6+Math.floor(seed(i,37,8)*Math.max(7,skyY-22));
   const col=weatherType==='clouds'?'#e6e5de':weatherType==='rain'?'#687d8c':'#a0afb5';
   rect(c,x,y,20,3,col);rect(c,x+5,y-3,11,3,col);rect(c,x-3,y+3,24,2,col);
  }
 }
}
function foliage(c,x,y,scale=1,tint='#4c8069',bloom=false){
 const m=scale;rect(c,x-1*m,y,3*m,12*m,'#655747');
 for(let j=0;j<13;j++){
  const ax=x+Math.round(Math.sin(j*2.7)*8*m),ay=y-6*m+Math.round(Math.cos(j*1.9)*6*m);
  rect(c,ax-3*m,ay-3*m,7*m,5*m,j%3===0?'#83ad7c':tint);
  if(bloom&&j%4===0)rect(c,ax,ay,2*m,2*m,j%2?'#f3bad0':'#ffdc99');
 }
}
function woodFloor(c,theme){
 rect(c,0,25,W,H-25,theme[2]);
 for(let y=26;y<H;y+=9){
  line(c,0,y,W,y,'#92725c55');
  for(let x=-(Math.floor(y/9)%2)*15;x<W;x+=31)rect(c,x,y+1,1,8,'#6552483a');
 }
 for(let x=0;x<W;x+=32)rect(c,x,25,1,4,'#f1d9aa42');
}
function drawRoomShell(c,id,phase){
 const p=themes[id],sky=skyFor(phase);
 rect(c,0,0,W,H,p[0]);rect(c,0,0,W,31,p[0]);rect(c,0,29,W,3,p[1]);woodFloor(c,p);
 for(let x=0;x<W;x+=21)rect(c,x+3,4,1,22,p[1]+'66');
 // Framed window: dawn, daylight, sunset and night each have a distinct sky.
 const windows=id==='home'?[[91,4,73]]:id==='greenhouse'?[[21,3,90],[147,3,88]]:[[86,3,86]];
 for(const [x,y,w] of windows){
  rect(c,x-3,y-1,w+6,23,p[3]);rect(c,x,y,w,18,sky[1]);rect(c,x,y+9,w,9,sky[2]);
  rect(c,x+w/2-1,y,2,18,p[3]);rect(c,x,y+10,w,2,p[4]);
  for(let i=0;i<8;i++){
   const xx=x+Math.floor(seed(i,2,id.length)*w),yy=y+10+Math.floor(seed(i,9,id.length)*6);
   rect(c,xx,yy,2,3,'#779b80');
  }
  rect(c,x-3,y+18,w+6,3,p[4]);rect(c,x+2,y+21,w-4,2,p[1]);
  rect(c,x-7,y,4,18,'#f5eadb');rect(c,x+w+3,y,4,18,'#f5eadb');
 }
 // Coherent 2px outlines and hand-placed grass/potted plant accents.
 for(let i=0;i<3;i++){const x=13+i*111;rect(c,x,23,8,5,'#9f7658');foliage(c,x+4,16,.48,'#537b58');}
 if(id==='home'||id==='cafe'||id==='bookstore'||id==='library'){
  rect(c,32,99,52,1,'#eee1bb');rect(c,34,101,49,1,'#81695a');
  rect(c,184,36,31,1,'#f4e0bc');
 }
}
function drawOutdoor(c,id,phase){
 const p=themes[id];drawSky(c,phase,42);
 // Parallax mountains and distant foliage, original pixel shapes only.
 for(let x=0;x<W;x+=12){
  const rise=Math.floor(seed(x,31,2)*18)+8;
  rect(c,x,34-rise,15,rise+18,'#6b999b');
  rect(c,x,35-rise,11,4,'#94afa6');
 }
 rect(c,0,41,W,H-41,id==='park'?'#669c85':p[2]);
 for(let x=0;x<W;x+=11){
  const y=43+Math.round(seed(x,5,7)*12);
  rect(c,x,y-12,6,20,'#497a60');
  rect(c,x-3,y-18,12,12,'#618e69');
  rect(c,x,y-22,10,12,'#83ad7c');
 }
 for(let y=49;y<H;y+=9)for(let x=0;x<W;x+=12){
  if(seed(x,y,23)>.56)rect(c,x,y,2,3,seed(x,y,33)>.5?'#a2c77d':'#528762');
  if(seed(x,y,26)>.88)rect(c,x+2,y-2,2,2,seed(x,y,6)>.5?'#e6abb8':'#f3e6ab');
 }
 if(id==='park'){
  rect(c,79,46,98,53,'#72b9be');
  for(let y=48;y<98;y+=5)for(let x=82;x<173;x+=10){
   const n=seed(x,y,4);rect(c,x+Math.floor(n*4),y,7,2,n>.5?'#a7d9d1':'#c1e5e3');
  }
  for(let x=21;x<69;x+=14)foliage(c,x,55,1.3,'#477663',true);
  for(let x=184;x<244;x+=14)foliage(c,x,62,1.2,'#3e7660',true);
 }else if(id==='ranch'){
  for(let x=4;x<250;x+=17){rect(c,x,53,2,18,'#947450');rect(c,x,58,16,3,'#ddbe8e');rect(c,x,66,16,3,'#c7a779');}
 }else if(id==='square'){
  for(let y=51;y<H;y+=9)for(let x=(y%18===0?0:9);x<W;x+=18){
   rect(c,x,y,16,8,'#c4c8aa');rect(c,x+2,y+1,11,1,'#e6dfc3');
  }
 }
}
function drawFixture(c,f,map,theme,id){
 const sx=W/map.cols,sy=H/map.rows;
 const x=Math.round(f.x*sx),y=Math.round(f.y*sy),w=Math.max(4,Math.round(f.w*sx)),h=Math.max(3,Math.round(f.h*sy));
 const shade=theme[3],face=theme[1],hi=theme[4],accent=theme[5];
 // Fixture footprint is never shifted: every blocking prop occupies its mapped rectangle.
 rect(c,x+1,y+2,w,h,'#242b3040');
 const inset=Math.max(1,Math.floor(Math.min(w,h)/7));
 const base=(top,front=face)=>{rect(c,x,y,w,h,front);rect(c,x+inset,y+inset,w-2*inset,Math.max(1,h-2*inset),top);rect(c,x,y,w,1,shade);rect(c,x,y,1,h,shade);rect(c,x,y+h-1,w,1,'#483e36');};
 switch(f.kind){
  case 'bed':
   base('#f8efdf','#826653');
   rect(c,x+2,y+2,w-4,Math.max(2,h-4),'#e7dfcd');
   rect(c,x+2,y+2,Math.max(2,Math.floor(w/3)),Math.max(2,h-4),id==='home'?'#f2c2a0':'#f0f6ef');
   rect(c,x+Math.max(3,Math.floor(w/3)),y+3,Math.max(2,w-Math.floor(w/3)-5),Math.max(2,h-6),'#b6c7b2');
   break;
  case 'shelf':
   base('#644c45','#76594b');
   for(let yy=y+2;yy<y+h-1;yy+=Math.max(3,Math.floor(h/4))){
    rect(c,x+2,yy,w-4,1,'#d0ae7a');
    for(let xx=x+3;xx<x+w-3;xx+=3)rect(c,xx,yy-2,2,2,['#d6b272','#b5caa0','#bd8a86','#acc3c2'][(xx+yy)%4]);
   }
   break;
  case 'table':case 'counter':case 'stall':case 'kitchen':
   base(f.kind==='table'?'#d8b68c':'#edce9b');
   rect(c,x+2,y+2,w-4,1,'#f3e0b7');
   if(id==='cafe'||id==='pub'||id==='burger'||id==='icecream'){
    const n=Math.max(1,Math.floor(w/8));for(let i=0;i<n;i++){
     const xx=x+4+i*7;rect(c,xx,y+Math.floor(h/2),3,3,'#f6ead4');
     rect(c,xx+1,y+Math.floor(h/2),1,1,id==='burger'?'#c77e52':'#b98b85');
    }
   }else if(id==='library'||id==='bookstore'){
    for(let i=0;i<Math.floor(w/6);i++)rect(c,x+3+i*5,y+2,3,5,'#d3e0c9');
   }else if(id==='home'){
    rect(c,x+Math.floor(w/2),y+2,3,3,'#f8ead1');rect(c,x+Math.floor(w/2)+1,y+3,1,1,'#b58876');
   }
   break;
  case 'water':case 'pond':
   base('#55a9ba','#bde4dc');
   for(let yy=y+3;yy<y+h-2;yy+=5)for(let xx=x+3;xx<x+w-2;xx+=8){
    rect(c,xx,yy,5,1,'#c4ebe6');rect(c,xx+3,yy+2,2,1,'#7ac5c6');
   }
   break;
  case 'fountain':
   base('#8dc3c0','#b6beb0');rect(c,x+Math.floor(w/2)-2,y+2,4,Math.max(2,h-4),'#e8eee0');
   break;
  case 'planter':case 'tree':
   base('#97795d','#70594c');
   for(let yy=y+2;yy<y+h-1;yy+=5)for(let xx=x+2;xx<x+w-1;xx+=5){
    rect(c,xx,yy,5,4,(xx+yy)%3?'#4c8667':'#96c285');
    if((xx+yy)%4===0)rect(c,xx+1,yy+1,2,2,'#edb1bb');
   }
   break;
  case 'fence':case 'stable':
   base('#b9956d','#755741');
   for(let xx=x+2;xx<x+w;xx+=7)rect(c,xx,y+1,2,Math.max(2,h-2),'#ead4a2');
   rect(c,x,y+Math.floor(h/2),w,2,'#e5c994');
   break;
  case 'exhibit':
   base('#ded2b6','#90745d');rect(c,x+3,y+3,w-6,h-6,'#769e98');
   rect(c,x+Math.floor(w/3),y+3,Math.max(2,w/3),Math.max(2,h/2),'#e7c4a8');
   break;
  case 'equipment':
   base('#728e8e','#55676e');rect(c,x+3,y+2,w-6,2,'#c5d5cf');
   rect(c,x+3,y+h-4,w-6,2,'#495e66');
   break;
  case 'hay':
   base('#dbba6b','#b98750');for(let xx=x+2;xx<x+w-3;xx+=4)line(c,xx,y+2,xx+2,y+h-2,'#f5da99');
   break;
  case 'bench':
   base('#c4a479','#8c7058');rect(c,x+2,y+2,w-4,1,'#f1d39c');
   break;
  default:base(accent);
 }
}
function pixelRoom(id,phase,weatherType){
 const t=themes[id]||themes.home,canvas=context();if(!canvas)return null;
 canvas.width=W;canvas.height=H;const c=canvas.getContext('2d',{alpha:false});c.imageSmoothingEnabled=false;
 if(outdoor.has(id))drawOutdoor(c,id,phase);else drawRoomShell(c,id,phase);
 const model=root.WordvilleVenueSpec?.getMap?.(id);
 if(model)for(const f of model.fixtures.slice().sort((a,b)=>a.y-b.y))drawFixture(c,f,model,t,id);
 if(id==='greenhouse'||id==='home'||id==='cafe'||id==='bookstore'){
  for(let i=0;i<6;i++){
   const x=8+i*43,y=110;rect(c,x,y,4,3,'#ba8869');rect(c,x+1,y-3,2,4,'#65936d');
  }
 }
 if(weatherType==='rain'&&outdoor.has(id)){
  for(let i=0;i<75;i++){const x=Math.floor(seed(i,33,9)*W),y=Math.floor(seed(i,18,5)*H);rect(c,x,y,1,3,'#b2d9e0');}
 }
 if(weatherType==='overcast')rect(c,0,0,W,H,'#394e6550');
 if(phase!=='day')rect(c,0,0,W,H,lightFilter[phase]);
 return canvas;
}
function paintVenue(c,p){
 const id=p?.id;if(!id||!themes[id])return false;
 const village=root.WordvilleVillage;
 const phase=phaseFor(village?.period||'day',village?.clockMinute??720);
 const key=id+'/'+phase+'/'+weather;
 let scene=venueCache.get(key);
 if(!scene){scene=pixelRoom(id,phase,weather);venueCache.set(key,scene);}
 if(!scene)return false;
 c.save();c.imageSmoothingEnabled=false;c.clearRect(0,0,c.canvas.width,c.canvas.height);
 c.drawImage(scene,0,0,c.canvas.width,c.canvas.height);c.restore();return true;
}
const oldArt=root.WordvilleWorldArt,baseTown=oldArt?.town;
let townSource=null,townLow=null,townKey='',townUpdated=0;
function createTownCanvases(){
 if(townSource)return;
 townSource=context();townLow=context();
 if(!townSource||!townLow)return;
 townSource.width=600;townSource.height=800;townLow.width=300;townLow.height=400;
}
function paintTown(c,period,elapsed){
 if(!baseTown)return false;createTownCanvases();if(!townLow)return false;
 const village=root.WordvilleVillage;
 const phase=phaseFor(period,village?.clockMinute??720);
 const key=period+'/'+phase;
 // Refresh the illustrated map for late-loading assets and any animated water;
 // intermediate frames use a cached nearest-neighbor pixel atlas.
 const now=Date.now();
 if(key!==townKey||now-townUpdated>1800){
  const a=townSource.getContext('2d',{alpha:false});a.clearRect(0,0,600,800);a.imageSmoothingEnabled=false;
  baseTown(a,period,elapsed);
  const small=townLow.getContext('2d',{alpha:false});
  small.imageSmoothingEnabled=false;small.clearRect(0,0,300,400);
  small.drawImage(townSource,0,0,300,400);
  // A constrained per-channel palette avoids blurred pseudo-pixels while
  // preserving the composition and the project's existing clickable landmarks.
  const pix=small.getImageData(0,0,300,400),buf=pix.data;
  for(let i=0;i<buf.length;i+=4){
   for(let k=0;k<3;k++)buf[i+k]=Math.min(255,Math.round(buf[i+k]/17)*17);
  }
  small.putImageData(pix,0,0);townKey=key;townUpdated=now;
 }
 c.save();c.imageSmoothingEnabled=false;c.drawImage(townLow,0,0,600,800);
 if(phase==='dawn')rect(c,0,0,600,800,'#e8a78e20');
 if(phase==='sunset')rect(c,0,0,600,800,'#d5798438');
 if(phase==='night')rect(c,0,0,600,800,'#12213e40');
 if(weather==='overcast')rect(c,0,0,600,800,'#4c5f7650');
 if(weather==='rain'){
  rect(c,0,0,600,800,'#334d6530');
  const tick=Math.floor(elapsed*7);
  for(let i=0;i<140;i++){
   const x=Math.floor(seed(i,11,17)*300)*2, y=((Math.floor(seed(i,21,37)*400)+tick*(1+i%2))%400)*2;
   rect(c,x,y,2,8,'#bedce666');
  }
 }
 if(weather==='clouds')for(let i=0;i<7;i++){
  const x=(Math.floor(seed(i,6,15)*300)+Math.floor(elapsed*2))%310*2-10,y=Math.floor(seed(i,2,29)*42)*2;
  rect(c,x,y,34,4,'#f4f3ec60');rect(c,x+8,y-4,16,4,'#f4f3ec60');
 }
 c.restore();return true;
}
function mountWeather(){
 const controls=root.document?.querySelector?.('.village-controls');
 if(!controls||root.document.getElementById('wv-pixel-weather'))return;
 const label=root.document.createElement('label');label.className='time-select';
 label.textContent='픽셀 날씨';
 const sel=root.document.createElement('select');sel.id='wv-pixel-weather';
 sel.setAttribute('aria-label','마을 픽셀 날씨 미리보기');
 const entries=[['clear','맑음'],['clouds','구름'],['overcast','흐림'],['rain','비']];
 for(const [id,name] of entries){const option=root.document.createElement('option');option.value=id;option.textContent=name;sel.append(option);}
 sel.addEventListener('change',()=>{setWeather(sel.value);root.WordvillePlaces?.pick?.(root.WordvillePlaces.active);});
 label.append(sel);controls.append(label);
}
const api={W,H,themes,phaseFor,skyFor,weathers,get weather(){return weather;},setWeather,paintVenue,paintTown,getLogicalFixtureRect:(id,f)=>{
 const m=root.WordvilleVenueSpec?.getMap?.(id);return m?{x:Math.round(f.x*W/m.cols),y:Math.round(f.y*H/m.rows),w:Math.round(f.w*W/m.cols),h:Math.round(f.h*H/m.rows)}:null;
}};
root.WordvillePixelStyle=api;
if(oldArt){oldArt.town=(c,p,t)=>paintTown(c,p,t)||baseTown?.(c,p,t);oldArt.place=(c,p)=>paintVenue(c,p);}
if(root.document){
 mountWeather();
 root.document.addEventListener('wordville-time-changed',()=>{
  const view=root.document.getElementById('wv-places-view');
  if(view&&!view.hidden&&root.WordvillePlaces?.active){
   root.WordvillePlaces.pick(root.WordvillePlaces.active);
  }
 });
}
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
