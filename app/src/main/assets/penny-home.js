/* Penny's ten original 896x896 transparent furniture sprites are drawn independently.
 * Never flatten the originals into the old 256x210 lossy room thumbnail.
 */
(function(root){'use strict';
const furniture=Object.freeze([
 {kind:'bed',label:'페니의 침대',x:1,y:2,w:6,h:4,asset:'01_cozy_bed.png',crop:[100,92,696,692]},
 {kind:'wardrobe',label:'원목 옷장',x:8,y:1,w:3,h:5,asset:'05_wardrobe.png',crop:[208,88,480,700]},
 {kind:'shelf',label:'책장',x:12,y:1,w:4,h:5,asset:'04_bookshelf.png',crop:[212,92,472,696]},
 {kind:'chair',label:'원목 의자',x:18,y:1,w:4,h:5,asset:'03_desk_chair.png',crop:[208,88,480,700]},
 {kind:'desk',label:'공부 책상',x:1,y:8,w:5,h:4,asset:'02_writing_desk.png',crop:[100,120,696,636]},
 {kind:'sofa',label:'이인용 소파',x:8,y:8,w:5,h:4,asset:'06_sage_sofa.png',crop:[100,128,696,624]},
 {kind:'armchair',label:'독서 의자',x:15,y:8,w:3,h:4,asset:'07_armchair.png',crop:[132,92,632,696]},
 {kind:'nightstand',label:'침대 협탁',x:20,y:8,w:3,h:3,asset:'10_nightstand.png',crop:[164,88,568,700]},
 {kind:'coffee_table',label:'커피 테이블',x:2,y:13,w:4,h:3,asset:'08_coffee_table.png',crop:[100,168,696,544]},
 {kind:'table',label:'원형 식탁',x:10,y:13,w:6,h:3,asset:'09_round_dining_table.png',crop:[100,152,696,572]}
]);
const assets=new Map();
let loaded=0,failed=0;
const repaint=()=>root.WordvillePlaces?.redraw?.();
for(const f of furniture){
 const image=new Image();image.decoding='async';
 image.onload=()=>{loaded++;repaint();};
 image.onerror=()=>{failed++;repaint();};
 assets.set(f.asset,image);
 image.src='art/furniture/'+f.asset;
}
// A preview is only a fallback when an original PNG is unavailable.
const fallback=new Image();fallback.decoding='async';
let fallbackReady=false;
fallback.onload=()=>{fallbackReady=true;if(loaded===0)repaint();};
fallback.src='art/penny-room.webp';
function backdrop(ctx,w,h){
 ctx.fillStyle='#e7d6b7';ctx.fillRect(0,0,w,h);
 const seam=Math.round(h*.28);
 ctx.fillStyle='#dbbd96';ctx.fillRect(0,seam,w,h-seam);
 ctx.fillStyle='#977356';ctx.fillRect(0,seam-11,w,11);
 ctx.fillStyle='#b49370';ctx.fillRect(0,seam+5,w,4);
 ctx.strokeStyle='#bb9874';ctx.lineWidth=2;
 for(let y=seam+52,row=0;y<h;y+=69,row++){
  ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();
  for(let x=(row%2)*48;x<w;x+=96){ctx.beginPath();ctx.moveTo(x,y-69);ctx.lineTo(x,y);ctx.stroke();}
 }
 // Window and curtains are painted behind the free-standing furniture.
 const x=Math.round(w*.09),y=Math.round(h*.072),ww=Math.round(w*.13),hh=Math.round(h*.17);
 ctx.fillStyle='#b48b68';ctx.fillRect(x-9,y-9,ww+18,hh+18);
 ctx.fillStyle='#e8f3e3';ctx.fillRect(x-4,y-4,ww+8,hh+8);
 ctx.fillStyle='#97bdb1';ctx.fillRect(x,y,ww,hh);
 ctx.fillStyle='#f2e4cb';ctx.fillRect(x+ww/2-4,y,8,hh);ctx.fillRect(x,y+hh/2-4,ww,8);
}
function paint(ctx){
 const w=ctx.canvas.width,h=ctx.canvas.height;
 ctx.save();ctx.clearRect(0,0,w,h);
 // Prevent lossy thumbnail from appearing behind the independently placed sprites.
 if(loaded+failed<furniture.length&&fallbackReady){ctx.imageSmoothingEnabled=false;ctx.drawImage(fallback,0,0,w,h);ctx.restore();return;}
 backdrop(ctx,w,h);
 ctx.imageSmoothingEnabled=false;
 for(const f of furniture){
  const image=assets.get(f.asset),[sx,sy,sw,sh]=f.crop;
  const left=f.x*w/24,top=f.y*h/18,fw=f.w*w/24,fh=f.h*h/18;
  const margin=Math.max(4,Math.round(w/180));
  if(!image.complete||!image.naturalWidth){
   // Missing assets remain individually identifiable, not hidden by a broken-image icon.
   ctx.fillStyle='#aa866a';ctx.fillRect(left+margin,top+margin,fw-2*margin,fh-2*margin);
   continue;
  }
  const scale=Math.min((fw-2*margin)/sw,(fh-2*margin)/sh);
  const dw=Math.round(sw*scale),dh=Math.round(sh*scale);
  const dx=Math.round(left+(fw-dw)/2),dy=Math.round(top+fh-dh-margin);
  ctx.drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh);
 }
 ctx.restore();
}
root.WordvillePennyHome={furniture,paint,get ready(){return loaded===furniture.length;},get loaded(){return loaded;},get failed(){return failed;},get resolution(){return {width:896,height:896};}};
if(typeof module!=='undefined')module.exports=root.WordvillePennyHome;
})(globalThis);