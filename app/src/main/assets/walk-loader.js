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
const stride=[
 {pose:0,lx:0,ly:0,rx:0,ry:0},
 {pose:1,lx:-1,ly:-1,rx:0,ry:0},
 {pose:1,lx:-2,ly:-2,rx:1,ry:0},
 {pose:2,lx:-1,ly:0,rx:2,ry:-1},
 {pose:0,lx:1,ly:0,rx:-1,ry:0},
 {pose:2,lx:1,ly:0,rx:-1,ry:-1},
 {pose:2,lx:2,ly:0,rx:-2,ry:-2},
 {pose:1,lx:1,ly:-1,rx:-1,ry:0}
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
  // Original pixels above the knees do not stretch or rotate.
  c.drawImage(referenceAtlas,sx,sy,FRAME_W,35,dx,dy,FRAME_W,35);
  // Each walking pose uses two individually displaced boot/leg halves.
  // Translations are pixel-integer and clipped inside the correct cell.
  c.drawImage(referenceAtlas,sx,sy+35,16,13,dx+pose.lx,dy+35+pose.ly,16,13);
  c.drawImage(referenceAtlas,sx+16,sy+35,16,13,dx+16+pose.rx,dy+35+pose.ry,16,13);
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
 return Math.floor(Math.max(0,distance)/STEP_DISTANCE)%FRAME_COUNT;
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
 if(generatedReady){
  c.drawImage(walkAtlas,beat*FRAME_W,(index*4+dir)*FRAME_H,FRAME_W,FRAME_H,Math.round(x-w/2),Math.round(y-h+3),w,h);
 }else if(dirReady||refReady){
  // Source image is a short startup fallback; once loaded all 8 unique frames
  // are rendered from the generated atlas, never a 0,1,0,2 loop.
  const source=dirReady?custom:referenceAtlas,pose=stride[beat].pose;
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
root.WordvilleWalk={images,referenceAtlas,atlas:perResidentAtlas,paint,drawPets,frameFor,generateAtlas,stride,frameCount:FRAME_COUNT,sourceFrameCount:3,fps:8,get walkAtlas(){return walkAtlas;}};
})(globalThis);
