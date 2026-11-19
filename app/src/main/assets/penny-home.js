/* Penny's ten original 896x896 transparent furniture sprites are drawn independently.
 * Never flatten the originals into the old 256x210 lossy room thumbnail.
 */
(function(root){'use strict';
const furniture=Object.freeze([
 {kind:'bed',label:'페니의 침대',x:16,y:4,w:6,h:5,asset:'01_cozy_bed.png',crop:[100,92,696,692]},
 {kind:'wardrobe',label:'원목 옷장',x:11,y:4,w:3,h:3,asset:'05_wardrobe.png',crop:[208,88,480,700]},
 {kind:'shelf',label:'책장',x:2,y:4,w:4,h:3,asset:'04_bookshelf.png',crop:[212,92,472,696]},
 {kind:'chair',label:'원목 의자',x:7,y:7,w:2,h:2,asset:'03_desk_chair.png',crop:[208,88,480,700]},
 {kind:'desk',label:'공부 책상',x:6,y:4,w:4,h:3,asset:'02_writing_desk.png',crop:[100,120,696,636]},
 {kind:'sofa',label:'이인용 소파',x:2,y:9,w:5,h:3,asset:'06_sage_sofa.png',crop:[100,128,696,624]},
 {kind:'armchair',label:'독서 의자',x:18,y:12,w:4,h:3,asset:'07_armchair.png',crop:[132,92,632,696]},
 {kind:'nightstand',label:'침대 협탁',x:20,y:9,w:2,h:2,asset:'10_nightstand.png',crop:[164,88,568,700]},
 {kind:'coffee_table',label:'커피 테이블',x:7,y:10,w:4,h:2,asset:'08_coffee_table.png',crop:[100,168,696,544]},
 {kind:'table',label:'원형 식탁',x:3,y:13,w:5,h:3,asset:'09_round_dining_table.png',crop:[100,152,696,572]}
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
function paint(ctx,paintFixture){
 const w=ctx.canvas.width,h=ctx.canvas.height;
 ctx.save();ctx.imageSmoothingEnabled=false;
 for(const f of furniture){
  const image=assets.get(f.asset),[sx,sy,sw,sh]=f.crop;
  const left=f.x*w/24,top=f.y*h/18,fw=f.w*w/24,fh=f.h*h/18;
  const margin=Math.max(4,Math.round(w/180));
  if(!image.complete||!image.naturalWidth){
   paintFixture?.(f);
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