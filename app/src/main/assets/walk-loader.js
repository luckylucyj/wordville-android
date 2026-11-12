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
// Every row below is an individually constructed silhouette, not a replayed
// source frame. Alternating arm positions come from the three source poses;
// the offsets are new asymmetric left/right leg steps with planted feet.
// A step is contact > down > passing > up, repeated with support legs reversed.
// Two mirrored halves keep the support foot at the same source-pixel baseline.
// Arm motion comes from the opposing original whole-body source poses.
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
const FRAME_W=32,FRAME_H=48,FRAME_COUNT=stride.length,STEP_DISTANCE=2.2;
let walkAtlas=null;
function generateAtlas(){
 if(!isReady(referenceAtlas)||referenceAtlas.naturalWidth!==384||referenceAtlas.naturalHeight!==576||typeof document==='undefined')return false;
 const sheet=document.createElement('canvas');
 sheet.width=FRAME_W*FRAME_COUNT;sheet.height=FRAME_H*ids.length*4;
 const c=sheet.getContext('2d',{willReadFrequently:true});
 if(!c)return false;
 c.imageSmoothingEnabled=false;
 for(let resident=0;resident<ids.length;resident++)for(let dir=0;dir<4;dir++)for(let phase=0;phase<FRAME_COUNT;phase++){
  const pose=stride[phase],sx=(dir*3+pose.pose)*FRAME_W,sy=resident*FRAME_H;
  const dx=phase*FRAME_W,dy=(resident*4+dir)*FRAME_H;
  c.save();c.beginPath();c.rect(dx,dy,FRAME_W,FRAME_H);c.clip();
  // Keep the hair, face, arms and shirt from a single source pose; no
  // image stretching or sub-pixel resampling. A one-pixel torso dip/rise
  // distinguishes down/up without moving the planted boot.
  c.drawImage(referenceAtlas,sx,sy,FRAME_W,35,dx,dy+pose.torso,FRAME_W,35);
  // Leg overlays begin at the knees; the planted boot has y=0 in every
  // phase. The swing boot lifts up to three original sprite pixels.
  // Horizontal offsets never exceed one pixel to keep knee joints intact.
  c.drawImage(referenceAtlas,sx,sy+34,16,14,dx+pose.lx,dy+34+pose.ly,16,14);
  c.drawImage(referenceAtlas,sx+16,sy+34,16,14,dx+16+pose.rx,dy+34+pose.ry,16,14);
  c.restore();
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
 const w=Math.round(opt.width||32),h=Math.round(opt.height||50),moving=opt.walking===true;
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
  c.drawImage(referenceAtlas,dir*3*FRAME_W,index*FRAME_H,FRAME_W,FRAME_H,Math.round(x-w/2),Math.round(y-h+3),w,h);
 }else if(generatedReady){
  c.drawImage(walkAtlas,beat*FRAME_W,(index*4+dir)*FRAME_H,FRAME_W,FRAME_H,Math.round(x-w/2),Math.round(y-h+3),w,h);
 }else if(dirReady||refReady){
  // Source image is a short startup fallback; once loaded all 8 unique frames
  // are rendered from the generated atlas, never a 0,1,0,2 loop.
  const source=dirReady?custom:referenceAtlas,pose=moving?stride[beat].pose:0;
  const sourceX=(dirReady?pose:dir*3+pose)*FRAME_W;
  const sourceY=(dirReady?dir:index)*FRAME_H;
  c.drawImage(source,sourceX,sourceY,FRAME_W,FRAME_H,Math.round(x-w/2),Math.round(y-h+3),w,h);
 }else{
  const phase=[0,1,2,3,0,3,2,1][beat],sx=(index%4*4+phase)*160,sy=Math.floor(index/4)*256;
  if(direction==='left'){c.translate(Math.round(x),0);c.scale(-1,1);c.drawImage(perResidentAtlas,sx,sy,160,256,-Math.round(w/2),Math.round(y-h+3),w,h);}
  else c.drawImage(perResidentAtlas,sx,sy,160,256,Math.round(x-w/2),Math.round(y-h+3),w,h);
 }
 c.restore();return true;
}
function drawPets(c,t){
 const pets=[{id:'cat',x:250+Math.sin(t*.25)*18,y:548+Math.cos(t*.25)*5},{id:'dog',x:448+Math.sin(t*.2)*18,y:545+Math.cos(t*.2)*5}];
 for(const pet of pets){
  c.fillStyle=pet.id==='cat'?'#c89a6b':'#dbc5a0';const x=Math.round(pet.x),y=Math.round(pet.y);
  c.fillRect(x-8,y-12,16,9);c.fillRect(x-4,y-19,9,8);
  c.fillStyle='#453b37';c.fillRect(x+2,y-17,2,2);
 }
}
// This preview runs the same paint() renderer used in the village itself.
function installWalkPreview(){
 const zones=document.querySelector('.wv-map-zones');
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
 details.append(summary,controls,canvas,status);zones.after(details);
 const c=canvas.getContext('2d');if(!c)return;
 function animate(ms){
  if(details.isConnected&&details.open&&!document.hidden){
   c.imageSmoothingEnabled=false;c.fillStyle='#dce9db';c.fillRect(0,0,240,160);
   c.fillStyle='#b7c5a2';c.fillRect(0,131,240,29);
   c.fillStyle='#a8b69c';c.fillRect(0,128,240,3);
   const beat=Math.floor(ms/125)%FRAME_COUNT;
   paint(c,{id:person.value,direction:direction.value,walkDistance:beat*STEP_DISTANCE},120,126,{width:64,height:96,walking:true});
   status.textContent='32×48 원본 픽셀 · 8 FPS · '+stride[beat].phase+' · 프레임 '+(beat+1)+'/8';
  }
  root.requestAnimationFrame(animate);
 }
 root.requestAnimationFrame(animate);
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installWalkPreview,{once:true});
 else installWalkPreview();
}
root.WordvilleWalk={images,referenceAtlas,atlas:perResidentAtlas,paint,drawPets,frameFor,generateAtlas,stride,frameCount:FRAME_COUNT,sourceFrameCount:3,fps:8,stepDistance:STEP_DISTANCE,frameSize:{width:FRAME_W,height:FRAME_H},get walkAtlas(){return walkAtlas;}};
})(globalThis);
