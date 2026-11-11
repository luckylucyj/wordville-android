/* Render the shipped 2560x768 resident atlas by default.
 * Optional future directional PNGs must be explicitly listed in WordvilleWalkManifest;
 * do not request non-existent walk/*.png resources on every screen load.
 * The shipped atlas has 4 authentic source phases per resident, not 8 directional poses.
 */
(function(root){'use strict';
const residentIds=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily'];
const names=[...residentIds,'cat','dog'],images={};
const rows={down:0,right:1,left:2,up:3};
const atlas=root.WordvillePortraits?.spriteImage||new Image();
if(!root.WordvillePortraits)atlas.src='portraits/wordville-walk-4phase.png';
const manifest=root.WordvilleWalkManifest||{};
for(const id of names){if(typeof manifest[id]==='string'&&manifest[id]){const img=new Image();img.decoding='async';img.src=manifest[id];images[id]=img;}}
const residentIndex=Object.fromEntries(residentIds.map((id,i)=>[id,i]));
function ready(im){return Boolean(im&&im.complete&&im.naturalWidth&&im.naturalHeight);}
function paint(c,p,x,y,opt={}){
 const id=p.id||p,im=images[id],animal=id==='cat'||id==='dog';
 const sw=animal?64:48,sh=animal?48:72;
 const direction=rows[p.direction]!==undefined?p.direction:(p.heading<0?'left':'right');
 const steps=Math.max(0,p.steps||0),moving=opt.walking!==false;
 const frame=moving?Math.floor(steps*10)%8:0;
 const directional=ready(im)&&im.naturalWidth===8*sw&&im.naturalHeight===4*sh;
 const ix=residentIndex[id];
 const atlasReady=ix!==undefined&&ready(atlas)&&atlas.naturalWidth===2560&&atlas.naturalHeight===768;
 if(!directional&&!atlasReady)return false;
 const w=Math.round(opt.width||(animal?29:61)),h=Math.round(opt.height||(animal?26:94));
 c.save();c.imageSmoothingEnabled=false;
 c.fillStyle='#27332c55';c.beginPath();
 c.ellipse(Math.round(x),Math.round(y+2),Math.max(5,w*.26),Math.max(2,w*.07),0,0,Math.PI*2);c.fill();
 if(directional){
  c.drawImage(im,frame*sw,rows[direction]*sh,sw,sh,Math.round(x-w/2),Math.round(y-h+5),w,h);
 }else{
  // 4 real atlas poses, played forward and backward for an 8-tick cycle.
  // Facing left is mirrored; front/back drawings are NOT falsely claimed as supplied.
  const phases=[0,1,2,3,2,1,0,1],phase=phases[frame];
  const sourceX=(ix%4*4+phase)*160,sourceY=Math.floor(ix/4)*256;
  if(direction==='left'){c.translate(Math.round(x),0);c.scale(-1,1);
   c.drawImage(atlas,sourceX,sourceY,160,256,Math.round(-w/2),Math.round(y-h+5),w,h);
  }else{
   c.drawImage(atlas,sourceX,sourceY,160,256,Math.round(x-w/2),Math.round(y-h+5),w,h);
  }
 }
 c.restore();return true;
}
function drawPets(c,t){
 const pets=[{id:'cat',x:247+Math.sin(t*.45)*32,y:469+Math.cos(t*.45)*8,direction:Math.cos(t*.45)>0?'right':'left',steps:t},{id:'dog',x:450+Math.sin(t*.34)*25,y:590+Math.cos(t*.34)*12,direction:Math.cos(t*.34)>0?'right':'left',steps:t}];
 for(const p of pets){if(!paint(c,p,p.x,p.y,{width:37,height:28,walking:true})){c.save();c.fillStyle=p.id==='cat'?'#c98d59':'#ead3a3';c.fillRect(Math.round(p.x-8),Math.round(p.y-13),16,10);c.fillRect(Math.round(p.x-5),Math.round(p.y-19),10,8);c.fillStyle='#423b31';c.fillRect(Math.round(p.x+2),Math.round(p.y-16),2,2);c.restore();}}
}
root.WordvilleWalk={images,atlas,paint,drawPets,frameCount:8,sourceFrameCount:4,fps:10};
})(globalThis);
