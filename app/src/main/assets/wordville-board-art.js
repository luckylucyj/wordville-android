/* Wordville board atlas — 3 hand-finished pixel-art states at a fixed foot pivot.
 * The world stays 600×800 in-game; 1200×1600 is precisely a 2× export.
 * No roof collision: VillageModel defines only the two posts and floor rail.
 */
(function(root){
 'use strict';
 const model=root.VillageModel;
 const config=model?.bulletin||{x:408,y:305,width:74,height:80,anchorY:385,trigger:{x:403,y:369,w:72,h:43}};
 const SRC='wordville-board-atlas.png';
 const image=typeof Image!=='undefined'?new Image():null;
 if(image){image.decoding='async';image.src=SRC;}
 const stateForCount=n=>!Number.isFinite(n)||n<=0?0:n<=4?1:2;
 const count=()=>Math.max(0,Number(root.WordvilleSocial?.boardPinnedCount?.()||0));
 const state=()=>stateForCount(count());
 function hitTest(x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  const f=config.trigger;
  // Click/tap region includes the board face and the front floor approach.
  // The roof alone is never a touch target.
  const face=x>=config.x+6&&x<=config.x+config.width-6&&
   y>=config.y+34&&y<=config.anchorY;
  const front=x>=f.x&&x<=f.x+f.w&&y>=f.y&&y<=f.y+f.h;
  return face||front;
 }
 function placeholder(ctx,frame){
  const {x,y,width:w,height:h}=config;
  ctx.save();
  ctx.fillStyle='#38251b';ctx.fillRect(x+5,y+17,w-10,h-21);
  ctx.fillStyle='#70492e';ctx.fillRect(x+8,y+18,w-16,h-31);
  ctx.fillStyle='#aa7750';ctx.fillRect(x+6,y+47,7,29);ctx.fillRect(x+w-13,y+47,7,29);
  ctx.fillStyle='#b18b57';ctx.fillRect(x+3,y+17,w-6,13);
  for(let i=0;i<3;i++){ctx.fillStyle=i%2?'#866141':'#a98156';ctx.fillRect(x+4,y+19+i*5,w-8,4);}
  const cards=frame===0?0:frame===1?4:7;
  for(let i=0;i<cards;i++){
   const cols=frame===1?2:4;
   const cx=x+18+i%cols*11,cy=y+39+Math.floor(i/cols)*12;
   ctx.fillStyle=['#eed8ae','#bcd38b','#90b8cf'][i%3];ctx.fillRect(cx,cy,8,10);
   ctx.fillStyle='#935b4d';ctx.fillRect(cx+3,cy-1,2,2);
  }
  ctx.restore();
 }
 function draw(ctx){
  if(!ctx)return;
  const n=state();
  const ready=image?.complete&&image.naturalWidth>=384&&image.naturalHeight>=128;
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(ready){
   ctx.drawImage(image,n*128,0,128,128,config.x,config.y,config.width,config.height);
  }else placeholder(ctx,n);
  ctx.restore();
 }
 const api={config,image,stateForCount,state,count,hitTest,draw,
  get src(){return SRC;},get loaded(){return !!image?.complete&&image.naturalWidth===384&&image.naturalHeight===128;}};
 root.WordvilleBoard=api;
 // Keep the two previous entry points working for existing map interactions.
 if(root.WordvilleSocial){
  root.WordvilleSocial.drawTownBoard=draw;
  root.WordvilleSocial.boardHit=hitTest;
 }
 if(typeof module!=='undefined')module.exports=api;
})(globalThis);
