/* Penny's house has its own tiled, non-overlapping furniture layout. */
(function(root){'use strict';
const furniture=Object.freeze([
 {kind:'bed',label:'페니의 침대',x:1,y:2,w:6,h:4},
 {kind:'wardrobe',label:'원목 옷장',x:8,y:1,w:3,h:5},
 {kind:'shelf',label:'책장',x:12,y:1,w:4,h:5},
 {kind:'dresser',label:'거울 화장대',x:18,y:1,w:4,h:5},
 {kind:'desk',label:'공부 책상',x:1,y:8,w:5,h:4},
 {kind:'sofa',label:'이인용 소파',x:8,y:8,w:5,h:4},
 {kind:'chair',label:'독서 의자',x:15,y:8,w:3,h:4},
 {kind:'nightstand',label:'침대 협탁',x:20,y:8,w:3,h:3},
 {kind:'coffee_table',label:'커피 테이블',x:2,y:13,w:4,h:3},
 {kind:'table',label:'원형 식탁',x:10,y:13,w:6,h:3}
]);
const image=new Image();image.decoding='async';
let ready=false,failed=false;
image.onload=()=>{ready=true;root.WordvillePlaces?.redraw?.();};
image.onerror=()=>{failed=true;root.WordvillePlaces?.redraw?.();};
image.src='art/penny-room.webp';
function paint(ctx){
 const w=ctx.canvas.width,h=ctx.canvas.height;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,w,h);
 if(ready){ctx.drawImage(image,0,0,w,h);}
 else{
  ctx.fillStyle='#dfc9ad';ctx.fillRect(0,0,w,h*.25);
  ctx.fillStyle='#c6a078';ctx.fillRect(0,h*.25,w,h*.75);
  for(const f of furniture){ctx.fillStyle='#947153';ctx.fillRect(f.x*w/24+3,f.y*h/18+3,f.w*w/24-6,f.h*h/18-6);}
 }
 ctx.restore();
}
root.WordvillePennyHome={furniture,paint,get ready(){return ready;},get failed(){return failed;}};
})(globalThis);
