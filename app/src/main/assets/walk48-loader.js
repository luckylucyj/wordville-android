/* Wordville 48x48 pre-generated sprite-sheet playback.
 * Asset layout: 8 rows (directions) x 8 distinct frames (contact/down/passing/up for each support foot).
 * The sheet is built by scripts/build-walk48.py before packaging the APK.
 */
(function(root){'use strict';
const W=root.WordvilleWalk;if(!W)return;
const residentIds=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily'];
const labels=['알렉스','엘리엇','하비','샘','세바스찬','셰인','헤일리','레아','마루','페니','애비게일','에밀리'];
const directions=['down','down-right','right','up-right','up','up-left','left','down-left'];
const cell=48,anchorY=43,frames=8,stepDistance=2.2,fps=8;
const phases=['contact-left','down-left','passing-left','up-left','contact-right','down-right','passing-right','up-right'];
const sheets={};
for(const id of residentIds){
 const im=new Image();im.decoding='async';im.src='walk48/'+id+'.png';sheets[id]=im;
}
const existingPaint=W.paint;
function ready(im){return Boolean(im?.complete&&im.naturalWidth===384&&im.naturalHeight===384);}
function getFrame(p,moving,ms){
 if(!moving)return 0;
 const time=Number.isFinite(ms)?ms:(typeof performance!=='undefined'&&typeof performance.now==='function'?performance.now():Date.now());
 return Math.floor((Math.max(0,time)+1e-6)/125)%frames;
}
function getCell(id,direction,frame){
 if(!sheets[id]||!directions.includes(direction)||!Number.isInteger(frame)||frame<0||frame>=8)return null;
 return {x:frame*cell,y:directions.indexOf(direction)*cell,width:cell,height:cell,anchorX:24,anchorY};
}
function paint(c,p,x,y,o={}){
 const id=p?.id||p,img=sheets[id];
 if(!ready(img))return existingPaint(c,p,x,y,o);
 const direction=directions.includes(p?.direction)?p.direction:(p?.heading<0?'left':'right');
 const k=Number.isInteger(o.phase)?((o.phase%8)+8)%8:getFrame(p,o.walking===true,o.timestampMs);
 const source=getCell(id,direction,k),width=Math.round(o.width||48),height=Math.round(o.height||48);
 c.save();c.imageSmoothingEnabled=false;
 c.fillStyle='#26343838';c.beginPath();c.ellipse(Math.round(x),Math.round(y+1),Math.round(width*.21),2,0,0,Math.PI*2);c.fill();
 c.drawImage(img,source.x,source.y,cell,cell,Math.round(x-width/2),Math.round(y-anchorY*height/cell),width,height);
 c.restore();return true;
}
function directionFromDelta(dx,dy){
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||(!dx&&!dy))return 'down';
 // Canvas screen coordinates: positive y means downward travel.
 const degrees=(Math.atan2(dx,dy)*180/Math.PI+360)%360;
 return directions[Math.round(degrees/45)%8];
}
Object.assign(W,{paint,frameFor:getFrame,frameSize:{width:48,height:48},anchorY,groundY:anchorY,frameCount:8,stepDistance,fps,walk48Sheets:sheets,walk48Directions:directions,walk48Cell:getCell,walk48Phases:phases,directionFromDelta});
root.WordvilleWalk48={ids:residentIds,labels,directions,sheets,getFrame,getCell,directionFromDelta,paint,frameSize:{width:48,height:48},anchorY,fps};
function installPreview(){
 const zones=document.querySelector('.village-controls')||document.querySelector('.wv-map-zones');if(!zones)return;
 const old=document.getElementById('wv-walk-preview');if(old)old.remove();
 const panel=document.createElement('details');panel.id='wv-walk-preview';
 panel.style.cssText='margin:12px 0;padding:12px;border:2px solid #957c5b;border-radius:12px;background:#f7eed9;color:#45382e';
 const title=document.createElement('summary');title.textContent='주민 걷기 확인 · 48×48 스프라이트시트 · 8방향×8프레임';title.style.cssText='font-weight:700;cursor:pointer';
 const inputs=document.createElement('div');inputs.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:10px 0';
 const person=document.createElement('select');person.setAttribute('aria-label','주민 선택');
 residentIds.forEach((id,i)=>{const opt=document.createElement('option');opt.value=id;opt.textContent=labels[i];person.add(opt);});
 const facing=document.createElement('select');facing.setAttribute('aria-label','8방향 선택');
 directions.forEach((id)=>{const opt=document.createElement('option');opt.value=id;opt.textContent=id;facing.add(opt);});facing.value='right';
 inputs.append(person,facing);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=168;canvas.style.cssText='width:256px;max-width:100%;height:auto;image-rendering:pixelated;background:#dce9db;border-radius:8px';
 const caption=document.createElement('p');caption.style.cssText='font-size:12px;margin:6px 0 0';
 const galleryButton=document.createElement('button');galleryButton.type='button';galleryButton.textContent='12명 한꺼번에 보기';
 galleryButton.style.cssText='margin:10px 0;padding:6px 10px;border:1px solid #85694a;border-radius:8px;background:#f0dbb6;color:#46372a';
 const gallery=document.createElement('canvas');gallery.width=320;gallery.height=288;gallery.hidden=true;
 gallery.setAttribute('aria-label','12명 주민 걷기 프레임 비교');gallery.style.cssText='max-width:100%;height:auto;image-rendering:pixelated;border-radius:8px;background:#e1ead7';
 galleryButton.addEventListener('click',()=>{gallery.hidden=!gallery.hidden;galleryButton.textContent=gallery.hidden?'12명 한꺼번에 보기':'12명 보기 닫기';});
 panel.append(title,inputs,canvas,caption,galleryButton,gallery);zones.after(panel);
 const c=canvas.getContext('2d');if(!c)return;
 function animate(ms){
  if(!panel.isConnected)return;
  if(panel.open&&!document.hidden){
   c.imageSmoothingEnabled=false;c.fillStyle='#dce9db';c.fillRect(0,0,256,168);
   c.fillStyle='#98aF92';c.fillRect(0,143,256,25);
   const beat=Math.floor(ms/125)%8;
   const id=person.value,im=sheets[id];
   if(ready(im)){
    paint(c,{id,direction:facing.value,walkDistance:beat*stepDistance},128,142,{width:96,height:96,walking:true,phase:beat});
    caption.textContent='PNG 시트에서 재생 · '+phases[beat]+' · '+(beat+1)+'/8 · 8 FPS · y=43 발 접지';
   }else caption.textContent='스프라이트시트 불러오는 중. 자산 누락 시 APK 빌드 결과를 확인하세요.';
   if(!gallery.hidden){
    const g=gallery.getContext('2d');
    if(g){g.imageSmoothingEnabled=false;g.fillStyle='#e1ead7';g.fillRect(0,0,320,288);
      for(let i=0;i<residentIds.length;i++){
       const gx=i%4*80+40,gy=Math.floor(i/4)*96+64;
       paint(g,{id:residentIds[i],direction:facing.value,walkDistance:beat*stepDistance},gx,gy,{width:48,height:48,walking:true,phase:beat});
       g.textAlign='center';g.font='12px sans-serif';g.fillStyle='#47392f';
       g.fillText(labels[i],gx,Math.floor(i/4)*96+85);
      }
    }
   }
  }
  root.requestAnimationFrame(animate);
 }
 root.requestAnimationFrame(animate);
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installPreview,{once:true});
 else installPreview();
}
})(globalThis);
