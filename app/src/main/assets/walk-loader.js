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
petSheets.cat.src='pets/wordville-cat-source.png';
petSheets.dog.src='pets/wordville-dog-source.png';
// 16x24 native source cells, 2x nearest-neighbor display at 32x48.
function petFrame(p,moving){if(!moving)return 0;const d=Number.isFinite(p.walkDistance)?p.walkDistance:(p.steps||0)*18;return Math.floor((Math.max(0,d)+1e-7)/3.5)%4;}
function paintPet(c,p,x,y,opt={}){
 const id=p.id||p,img=petSheets[id];
 if(!img||!isReady(img)||img.naturalWidth!==64||img.naturalHeight!==96)return false;
 const dir=dirs[p.direction]===undefined?0:dirs[p.direction],phase=Number.isInteger(opt.phase)?((opt.phase%4)+4)%4:petFrame(p,opt.walking===true);
 const w=opt.width||32,h=opt.height||48;
 c.save();c.imageSmoothingEnabled=false;
 c.drawImage(img,dir*16,phase*24,16,24,Math.round(x-w/2),Math.round(y-h),w,h);
 c.restore();return true;
}

/* Eight ordered phases per direction and character. Every rendered cell is
 * exactly 32x48 and is sampled from the corresponding resident's three
 * original poses. The stance foot remains on one shared pixel baseline.
 *
 * Contact > down > passing > up is the first half-cycle; the second swaps
 * the planted / swinging foot. The source contact pose has the opposite arm
 * advanced, so the arm swing remains contralateral without slicing arms.
 */
const stride=[
 {phase:'contact',pose:1,torso:0,lx:-1,ly:0,rx:1,ry:0,plant:'left'},
 {phase:'down',pose:1,torso:1,lx:0,ly:0,rx:1,ry:-1,plant:'left'},
 {phase:'passing',pose:0,torso:0,lx:0,ly:0,rx:0,ry:-2,plant:'left'},
 {phase:'up',pose:2,torso:-1,lx:0,ly:0,rx:1,ry:-3,plant:'left'},
 {phase:'contact',pose:2,torso:0,lx:1,ly:0,rx:-1,ry:0,plant:'right'},
 {phase:'down',pose:2,torso:1,lx:1,ly:-1,rx:0,ry:0,plant:'right'},
 {phase:'passing',pose:0,torso:0,lx:0,ly:-2,rx:0,ry:0,plant:'right'},
 {phase:'up',pose:1,torso:-1,lx:-1,ly:-3,rx:0,ry:0,plant:'right'}
];
const FRAME_W=32,FRAME_H=48,FRAME_COUNT=stride.length,STEP_DISTANCE=2.2,GROUND_Y=46;
const ATLAS_W=FRAME_W*FRAME_COUNT,ATLAS_H=FRAME_H*ids.length*4;
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
function measureGround(c,sx,sy){
 const pixels=c.getImageData(sx,sy,FRAME_W,FRAME_H).data;
 // The supplied reference may have transparent or solid beige corners.
 const bi=4*(1+FRAME_W),bg=[pixels[bi],pixels[bi+1],pixels[bi+2],pixels[bi+3]];
 for(let y=47;y>=33;y--)for(let x=6;x<=26;x++){
  const i=4*(y*FRAME_W+x),a=pixels[i+3];
  if(a<80)continue;
  if(bg[3]<80)return y;
  const difference=Math.abs(pixels[i]-bg[0])+Math.abs(pixels[i+1]-bg[1])+Math.abs(pixels[i+2]-bg[2]);
  if(difference>85)return y;
 }
 return GROUND_Y;
}
function generateAtlas(){
 if(!isReady(referenceAtlas)||referenceAtlas.naturalWidth!==384||referenceAtlas.naturalHeight!==576||typeof document==='undefined')return false;
 const sheet=document.createElement('canvas');sheet.width=ATLAS_W;sheet.height=ATLAS_H;
 const c=sheet.getContext('2d',{willReadFrequently:true});if(!c)return false;c.imageSmoothingEnabled=false;
 const sampler=document.createElement('canvas');sampler.width=384;sampler.height=576;
 const sampleCtx=sampler.getContext('2d',{willReadFrequently:true});if(!sampleCtx)return false;
 sampleCtx.drawImage(referenceAtlas,0,0);
 sourceGroundOffsets=ids.map((id,ri)=>[0,1,2,3].map(dir=>[0,1,2].map(pose=>{
  const ground=measureGround(sampleCtx,(dir*3+pose)*FRAME_W,ri*FRAME_H);
  return alignForGroundRow(ground);
 })));
 for(let resident=0;resident<ids.length;resident++)for(let dir=0;dir<4;dir++){
  const offsets=sourceGroundOffsets[resident][dir];
  for(let phase=0;phase<FRAME_COUNT;phase++){
   const p=stride[phase],sx=(dir*3+p.pose)*FRAME_W,sy=resident*FRAME_H;
   const dx=phase*FRAME_W,dy=(resident*4+dir)*FRAME_H,shift=offsets[p.pose];
   c.save();c.beginPath();c.rect(dx,dy,FRAME_W,FRAME_H);c.clip();
   // Whole head + arms + shirt stays from one source pose. Only the torso
   // settles/rises by one *integer* pixel; hair and eyes never distort.
   c.drawImage(referenceAtlas,sx,sy,FRAME_W,37,dx,dy+shift+p.torso,FRAME_W,37);
   // Feet are assembled as independent shins. The planted one never rises,
   // the opposite one swings above the common baseline (up to 3px).
   // The 3-pixel torso/shin overlap avoids visible seams at the knees.
   c.drawImage(referenceAtlas,sx,sy+34,16,14,dx+p.lx,dy+34+shift+p.ly,16,14);
   c.drawImage(referenceAtlas,sx+16,sy+34,16,14,dx+16+p.rx,dy+34+shift+p.ry,16,14);
   c.restore();
  }
 }
 walkAtlas=sheet;return true;
}
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
  const cell=atlasCell(id,direction,beat);c.drawImage(walkAtlas,cell.x,cell.y,cell.width,cell.height,Math.round(x-w/2),Math.round(y-h),w,h);
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
 details.append(summary,controls,canvas,status,showAll,gallery);zones.after(details);
 const c=canvas.getContext('2d');if(!c)return;
 function animate(ms){
  if(details.isConnected&&details.open&&!document.hidden){
   c.imageSmoothingEnabled=false;c.fillStyle='#dce9db';c.fillRect(0,0,240,160);
   c.fillStyle='#b7c5a2';c.fillRect(0,131,240,29);
   c.fillStyle='#a8b69c';c.fillRect(0,128,240,3);
   const beat=Math.floor(ms/125)%FRAME_COUNT;
   paint(c,{id:person.value,direction:direction.value,walkDistance:beat*STEP_DISTANCE},120,126,{width:64,height:96,walking:true});
   status.textContent='32×48 원본 픽셀 · 8 FPS · '+stride[beat].phase+' · 프레임 '+(beat+1)+'/8';
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
root.WordvilleWalk={images,referenceAtlas,atlas:perResidentAtlas,petSheets,petFrame,paintPet,paint,drawPets,frameFor,generateAtlas,stride,frameCount:FRAME_COUNT,sourceFrameCount:3,fps:8,stepDistance:STEP_DISTANCE,frameSize:{width:FRAME_W,height:FRAME_H},atlasSize:{width:ATLAS_W,height:ATLAS_H},groundY:GROUND_Y,atlasCell,alignForGroundRow,get groundOffsets(){return sourceGroundOffsets;},get walkAtlas(){return walkAtlas;}};
})(globalThis);
