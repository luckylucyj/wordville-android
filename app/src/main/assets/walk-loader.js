/* Eight distinct, per-direction pixel walking frames generated from the user's
 * original 32x48, three-pose-per-direction atlas. The unchanged faces, hair,
 * and upper-body source pixels are retained; new stride poses are authored
 * by independently repositioning the left/right lower-leg pixel regions.
 * Frame geometry is 32x48, with a constant ground anchor and no interpolation.
 */
(function(root){'use strict';
const ids=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily'];
const dirs={down:0,right:1,left:2,up:3};
const perResidentAtlas=root.WordvillePortraits?.spriteImage||new Image();
if(!root.WordvillePortraits)perResidentAtlas.src='portraits/wordville-walk-4phase.png';
const directionalManifest=root.WordvilleWalkManifest||{},images={};
for(const [id,url] of Object.entries(directionalManifest)){
 if(typeof url!=='string'||!url)continue;
 const im=new Image();im.decoding='async';im.src=url;images[id]=im;
}
const referenceAtlas=new Image();referenceAtlas.decoding='async';
referenceAtlas.src='portraits/wordville-reference-walk.png';
const isReady=im=>!!(im&&im.complete&&im.naturalWidth>0&&im.naturalHeight>0);
const indices=Object.fromEntries(ids.map((id,i)=>[id,i]));
const petSheets={cat:new Image(),dog:new Image()};
petSheets.cat.decoding='async';petSheets.dog.decoding='async';
// High-resolution, reference-derived sprites: four directions (columns) and
// four independent walking phases (rows), native cell size 32×48.
petSheets.cat.src='pets/wordville-cat-source.png';
petSheets.dog.src='pets/wordville-dog-source.png';
const PET_W=32,PET_H=48,PET_PHASES=4,PET_GROUND_Y=44;
function petFrame(p,moving){
 if(!moving)return 0;
 const d=Number.isFinite(p.walkDistance)?p.walkDistance:(p.steps||0)*18;
 return Math.floor((Math.max(0,d)+1e-7)/3.5)%PET_PHASES;
}
function petCell(id,direction,phase){
 if(!(id in petSheets)||!(direction in dirs)||!Number.isInteger(phase)||phase<0||phase>=PET_PHASES)return null;
 return {x:dirs[direction]*PET_W,y:phase*PET_H,width:PET_W,height:PET_H,groundY:PET_GROUND_Y};
}
function paintPet(c,p,x,y,opt={}){
 const id=p?.id||p,img=petSheets[id];
 if(!img||!isReady(img)||img.naturalWidth!==PET_W*4||img.naturalHeight!==PET_H*4)return false;
 const direction=dirs[p?.direction]!==undefined?p.direction:'down';
 const phase=Number.isInteger(opt.phase)?((opt.phase%4)+4)%4:petFrame(p,opt.walking===true);
 const cell=petCell(id,direction,phase);
 const w=Math.round(opt.width||PET_W),h=Math.round(opt.height||PET_H);
 // Every cell has the same paw/shadow baseline (source y=44). Keep its
 // world-space anchor stable even in contact/down/passing/up transitions.
 const left=Math.round(x-w/2),top=Math.round(y-PET_GROUND_Y*h/PET_H);
 c.save();c.imageSmoothingEnabled=false;
 c.drawImage(img,cell.x,cell.y,cell.width,cell.height,left,top,w,h);
 c.restore();return true;
}
/* Separate 256x192 sheet per resident. Intact full-body frames are
 * extracted from the original high-resolution 2560x768 source. The old
 * 384x576 pose atlas has clipped/overlapping action frames, so they are
 * excluded. Eight time slots reuse valid authored whole-body poses. */
const stride=[
 {phase:'contact',pose:1,plant:'left'},
 {phase:'down',pose:1,plant:'left'},
 {phase:'passing',pose:0,plant:'left'},
 {phase:'up',pose:2,plant:'left'},
 {phase:'contact',pose:2,plant:'right'},
 {phase:'down',pose:2,plant:'right'},
 {phase:'passing',pose:0,plant:'right'},
 {phase:'up',pose:1,plant:'right'}
];
const FRAME_W=32,FRAME_H=48,FRAME_COUNT=8,STEP_DISTANCE=2.2,GROUND_Y=46;
const ATLAS_W=256,ATLAS_H=FRAME_H*ids.length*4;
const residentSheets={};
let walkAtlas=null,sourceGroundOffsets=null;
function alignForGroundRow(row){
 if(!Number.isFinite(row))return 0;
 return Math.max(-2,Math.min(2,GROUND_Y-Math.round(row)));
}
function atlasCell(id,direction,phase){
 const i=indices[id],dir=dirs[direction];
 if(i===undefined||dir===undefined||!Number.isInteger(phase)||phase<0||phase>=FRAME_COUNT)return null;
 return {x:phase*FRAME_W,y:(i*4+dir)*FRAME_H,width:FRAME_W,height:FRAME_H};
}
function generateAtlas(){
 // The tiny 384x576 directional atlas has several clipped/cross-contaminated
 // action poses. Only its intact back-facing neutral pose is used here.
 // All moving/front/side frames come from the original complete 160x256
 // resident atlas, which retains the full connected head, arms, torso and feet.
 if(!isReady(perResidentAtlas)||perResidentAtlas.naturalWidth!==2560||perResidentAtlas.naturalHeight!==768||!isReady(referenceAtlas)||referenceAtlas.naturalWidth!==384||referenceAtlas.naturalHeight!==576||typeof document==='undefined')return false;
 const combined=document.createElement('canvas');combined.width=ATLAS_W;combined.height=ATLAS_H;
 const cc=combined.getContext('2d');if(!cc)return false;cc.imageSmoothingEnabled=false;
 for(let i=0;i<ids.length;i++){
  const sheet=document.createElement('canvas');sheet.width=ATLAS_W;sheet.height=FRAME_H*4;
  const c=sheet.getContext('2d');if(!c)return false;c.imageSmoothingEnabled=false;
  for(let dir=0;dir<4;dir++){
   for(let beat=0;beat<8;beat++){
    const dx=beat*32,dy=dir*48;
    if(dir===3){
     // The sole verified intact rear view. No invalid walking pose is used.
     c.drawImage(referenceAtlas,9*32,i*48,32,48,dx,dy,32,48);
    }else{
     // 4 authentic complete-body source cells, not split into limb fragments.
     const pose=dir===0?[0,0,2,0,2,2,0,2][beat]:[1,1,3,1,3,3,1,3][beat];
     const sx=(i%4*4+pose)*160,sy=Math.floor(i/4)*256;
     if(dir===2){
      c.save();c.translate(dx+32,0);c.scale(-1,1);
      c.drawImage(perResidentAtlas,sx,sy,160,256,0,dy,32,48);
      c.restore();
     }else c.drawImage(perResidentAtlas,sx,sy,160,256,dx,dy,32,48);
    }
   }
   cc.drawImage(sheet,0,dir*48,256,48,0,(i*4+dir)*48,256,48);
  }
  residentSheets[ids[i]]=sheet;
 }
 sourceGroundOffsets=ids.map(()=>[0,0,0,0].map(()=>[0,0,0]));
 walkAtlas=combined;return true;
}
perResidentAtlas.addEventListener('load',generateAtlas,{once:true});
referenceAtlas.addEventListener('load',generateAtlas,{once:true});
if(referenceAtlas.complete&&referenceAtlas.naturalWidth)generateAtlas();
function frameFor(p,moving){
 if(!moving)return 0;
 const traveled=p.walkDistance;
 const distance=Number.isFinite(traveled)?traveled:Math.max(0,p.steps||0)*18;
 return Math.floor((Math.max(0,distance)+1e-7)/STEP_DISTANCE)%FRAME_COUNT;
}
function paint(c,p,x,y,opt={}){
 const id=p.id||p,index=indices[id],direction=dirs[p.direction]!==undefined?p.direction:(p.heading<0?'left':'right');
 const w=Math.round(opt.width||32),h=Math.round(opt.height||48),moving=opt.walking===true;
 if(id==='cat'||id==='dog')return paintPet(c,p,x,y,{width:w,height:h,walking:moving});
 const beat=frameFor(p,moving),dir=dirs[direction];
 const custom=images[id],dirReady=isReady(custom)&&custom.naturalWidth===32*3&&custom.naturalHeight===48*4;
 const generatedReady=!!walkAtlas&&index!==undefined;
 const refReady=index!==undefined&&isReady(referenceAtlas)&&referenceAtlas.naturalWidth===384&&referenceAtlas.naturalHeight===576;
 const oldReady=index!==undefined&&isReady(perResidentAtlas)&&perResidentAtlas.naturalWidth===2560&&perResidentAtlas.naturalHeight===768;
 if(!dirReady&&!generatedReady&&!refReady&&!oldReady)return false;
 c.save();c.imageSmoothingEnabled=false;
 c.fillStyle='#2b3b3544';c.beginPath();c.ellipse(Math.round(x),Math.round(y+1),Math.round(w*.29),3,0,0,Math.PI*2);c.fill();
 if(refReady&&!moving){
  // Neutral, feet-parallel original frame instead of freezing at contact.
  c.drawImage(referenceAtlas,dir*3*FRAME_W,index*FRAME_H,FRAME_W,FRAME_H,Math.round(x-w/2),Math.round(y-h),w,h);
 }else if(generatedReady){
  // Draw from this resident's prebuilt complete-frame sheet only.
  c.drawImage(residentSheets[id],beat*32,dir*48,32,48,Math.round(x-w/2),Math.round(y-h),w,h);
 }else if(dirReady||refReady){
  // Source image is a short startup fallback; once loaded all 8 unique frames
  // are rendered from the generated atlas, never a 0,1,0,2 loop.
  const source=dirReady?custom:referenceAtlas,pose=moving?stride[beat].pose:0;
  const sourceX=(dirReady?pose:dir*3+pose)*FRAME_W;
  const sourceY=(dirReady?dir:index)*FRAME_H;
  c.drawImage(source,sourceX,sourceY,FRAME_W,FRAME_H,Math.round(x-w/2),Math.round(y-h),w,h);
 }else{
  const phase=[0,1,2,3,0,3,2,1][beat],sx=(index%4*4+phase)*160,sy=Math.floor(index/4)*256;
  if(direction==='left'){c.translate(Math.round(x),0);c.scale(-1,1);c.drawImage(perResidentAtlas,sx,sy,160,256,-Math.round(w/2),Math.round(y-h),w,h);}
  else c.drawImage(perResidentAtlas,sx,sy,160,256,Math.round(x-w/2),Math.round(y-h),w,h);
 }
 c.restore();return true;
}
function drawPets(c,t){
 for(const pet of [{id:'cat',x:250+Math.sin(t*.25)*18,y:548+Math.cos(t*.25)*5,direction:Math.cos(t*.25)>=0?'right':'left',walkDistance:t*3.6},{id:'dog',x:448+Math.sin(t*.2)*18,y:545+Math.cos(t*.2)*5,direction:Math.cos(t*.2)>=0?'right':'left',walkDistance:t*3.2}])
  paintPet(c,pet,Math.round(pet.x),Math.round(pet.y),{width:32,height:48,walking:true});
}
// This preview runs the same paint() renderer used in the village itself.
function installWalkPreview(){
 const zones=document.querySelector('.village-controls')||document.querySelector('.wv-map-zones');
 if(!zones||document.getElementById('wv-walk-preview'))return;
 const details=document.createElement('details');details.id='wv-walk-preview';
 details.style.cssText='margin:12px 0;padding:12px;border:2px solid #957c5b;border-radius:12px;background:#f7eed9;color:#45382e';
 const summary=document.createElement('summary');summary.textContent='주민 걷기 확인 · 실제 게임 스프라이트 8프레임';
 summary.style.cssText='font-weight:700;cursor:pointer';
 const controls=document.createElement('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:12px 0';
 const person=document.createElement('select');person.setAttribute('aria-label','걷기 미리보기 주민');
 ids.forEach((id,i)=>{const o=document.createElement('option');o.value=id;o.textContent=['알렉스','엘리엇','하비','샘','세바스찬','셰인','헤일리','레아','마루','페니','애비게일','에밀리'][i];person.add(o);});
 const direction=document.createElement('select');direction.setAttribute('aria-label','걷기 미리보기 방향');
 [['down','앞면'],['right','오른쪽'],['left','왼쪽'],['up','뒷면']].forEach(([value,title])=>{const o=document.createElement('option');o.value=value;o.textContent=title;direction.add(o);});
 direction.value='right';controls.append(person,direction);
 const canvas=document.createElement('canvas');canvas.width=240;canvas.height=160;
 canvas.setAttribute('role','img');canvas.setAttribute('aria-label','선택한 주민이 8프레임으로 걷는 확대 미리보기');
 canvas.style.cssText='display:block;width:240px;max-width:100%;height:auto;image-rendering:pixelated;border-radius:8px;background:#e1ead7';
 const status=document.createElement('p');status.style.cssText='font-size:12px;margin:8px 0 0';status.textContent='32×48 원본 픽셀 · 8 FPS · 발 접지 기준 고정';
 // All-resident view uses the very same renderer (not a separate GIF).
 const showAll=document.createElement('button');showAll.type='button';showAll.textContent='12명 한꺼번에 보기';
 showAll.style.cssText='margin:8px 0;padding:6px 10px;border:1px solid #85694a;border-radius:8px;background:#f0dbb6;color:#46372a';
 const gallery=document.createElement('canvas');gallery.width=320;gallery.height=288;gallery.hidden=true;
 gallery.setAttribute('aria-label','주민 12명의 현재 걷기 프레임 비교');
 gallery.style.cssText='max-width:100%;height:auto;image-rendering:pixelated;border-radius:8px;background:#e1ead7';
 showAll.addEventListener('click',()=>{gallery.hidden=!gallery.hidden;showAll.textContent=gallery.hidden?'12명 한꺼번에 보기':'12명 보기 닫기';});
 const petLabel=document.createElement('p');petLabel.textContent='고양이 · 강아지 걷기 미리보기 (32×48px 원본 셀)';
 petLabel.style.cssText='font-size:12px;font-weight:bold;margin:12px 0 6px';
 const petPreview=document.createElement('canvas');petPreview.width=240;petPreview.height=128;
 petPreview.setAttribute('role','img');petPreview.setAttribute('aria-label','실제 게임 도트 스프라이트 고양이와 강아지 4방향 걷기');
 petPreview.style.cssText='display:block;width:240px;max-width:100%;height:auto;image-rendering:pixelated;border-radius:8px;background:#e1ead7';
 details.append(summary,controls,canvas,status,showAll,gallery,petLabel,petPreview);zones.after(details);
 const c=canvas.getContext('2d');if(!c)return;
 function animate(ms){
  if(details.isConnected&&details.open&&!document.hidden){
   c.imageSmoothingEnabled=false;c.fillStyle='#dce9db';c.fillRect(0,0,240,160);
   c.fillStyle='#b7c5a2';c.fillRect(0,131,240,29);
   c.fillStyle='#a8b69c';c.fillRect(0,128,240,3);
   const beat=Math.floor(ms/125)%FRAME_COUNT;
   paint(c,{id:person.value,direction:direction.value,walkDistance:beat*STEP_DISTANCE},120,126,{width:64,height:96,walking:true});
   status.textContent='32×48 원본 픽셀 · 8 FPS · '+stride[beat].phase+' · 프레임 '+(beat+1)+'/8';
   const petCtx=petPreview.getContext('2d');
   if(petCtx){
    petCtx.imageSmoothingEnabled=false;petCtx.fillStyle='#e1ead7';petCtx.fillRect(0,0,240,128);
    petCtx.fillStyle='#9baf8f';petCtx.fillRect(0,108,240,2);
    const petBeat=Math.floor(ms/175)%4;
    for(const [id,x,label] of [['cat',62,'고양이'],['dog',180,'강아지']]){
     paintPet(petCtx,{id,direction:direction.value,walkDistance:petBeat*3.5},x,107,{width:64,height:96,walking:true});
     petCtx.fillStyle='#47392f';petCtx.font='12px sans-serif';petCtx.textAlign='center';petCtx.fillText(label,x,122);
    }
   }
   if(!gallery.hidden){
    const g=gallery.getContext('2d');if(g){g.imageSmoothingEnabled=false;g.fillStyle='#e1ead7';g.fillRect(0,0,320,288);
     for(let i=0;i<ids.length;i++){
      const col=i%4,row=Math.floor(i/4),gx=col*80+40,gy=row*96+63;
      paint(g,{id:ids[i],direction:direction.value,walkDistance:beat*STEP_DISTANCE},gx,gy,{width:32,height:48,walking:true});
      g.textAlign='center';g.font='12px sans-serif';g.fillStyle='#47392f';
      g.fillText(['알렉스','엘리엇','하비','샘','세바스찬','셰인','헤일리','레아','마루','페니','애비게일','에밀리'][i],gx,row*96+85);
     }
    }
   }
  }
  root.requestAnimationFrame(animate);
 }
 root.requestAnimationFrame(animate);
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installWalkPreview,{once:true});
 else installWalkPreview();
}
root.WordvilleWalk={images,referenceAtlas,atlas:perResidentAtlas,petSheets,petFrame,petCell,petFrameSize:{width:PET_W,height:PET_H},petGroundY:PET_GROUND_Y,paintPet,paint,drawPets,frameFor,generateAtlas,stride,frameCount:FRAME_COUNT,sourceFrameCount:3,residentSheets,fps:8,stepDistance:STEP_DISTANCE,frameSize:{width:FRAME_W,height:FRAME_H},atlasSize:{width:ATLAS_W,height:ATLAS_H},groundY:GROUND_Y,atlasCell,alignForGroundRow,get groundOffsets(){return sourceGroundOffsets;},get walkAtlas(){return walkAtlas;}};
})(globalThis);
