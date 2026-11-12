/* Direction-aware resident walking. The user 4-direction reference atlas (12 rows,
 * 3 source poses per heading, 32x48 pixels per frame) is bundled with the APK.
 * A 4-beat 0,1,0,2 cycle reuses the 3 authentic poses without fabricating a fourth.
 * All residents keep exactly the same ground anchor; no rotation or body bobbing.
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
const cycle=[0,1,0,2];
function frameFor(p,moving){
 if(!moving)return 0;
 const traveled=p.walkDistance;
 return Math.floor((Number.isFinite(traveled)?traveled:Math.max(0,p.steps||0)*18)/2.7)%4;
}
function paint(c,p,x,y,opt={}){
 const id=p.id||p,index=indices[id],direction=dirs[p.direction]!==undefined?p.direction:(p.heading<0?'left':'right');
 const w=Math.round(opt.width||32),h=Math.round(opt.height||50),moving=opt.walking===true;
 const beat=frameFor(p,moving);
 const custom=images[id],dirReady=isReady(custom)&&custom.naturalWidth===32*3&&custom.naturalHeight===48*4;
 const refReady=index!==undefined&&isReady(referenceAtlas)&&referenceAtlas.naturalWidth===384&&referenceAtlas.naturalHeight===576;
 const oldReady=index!==undefined&&isReady(perResidentAtlas)&&perResidentAtlas.naturalWidth===2560&&perResidentAtlas.naturalHeight===768;
 if(!dirReady&&!refReady&&!oldReady)return false;
 c.save();c.imageSmoothingEnabled=false;
 c.fillStyle='#2b3b3544';c.beginPath();c.ellipse(Math.round(x),Math.round(y+1),Math.round(w*.29),3,0,0,Math.PI*2);c.fill();
 if(dirReady||refReady){
  const source=dirReady?custom:referenceAtlas,pose=cycle[beat],sourceX=(dirReady?pose:dirs[direction]*3+pose)*32;
  const sourceY=(dirReady?dirs[direction]:index)*48;
  c.drawImage(source,sourceX,sourceY,32,48,Math.round(x-w/2),Math.round(y-h+3),w,h);
 }else{
  // Four original source poses remain a compatibility fallback while loading the new atlas.
  const phase=[0,1,2,3][beat],sx=(index%4*4+phase)*160,sy=Math.floor(index/4)*256;
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
root.WordvilleWalk={images,referenceAtlas,atlas:perResidentAtlas,paint,drawPets,frameFor,frameCount:4,sourceFrameCount:3,fps:7};
})(globalThis);
