/* Wordville tile geometry, collision and four-direction A* pathfinding.
 * Collision is authored for the rendered furniture tiles, NOT inferred from an illustration.
 */
(function(root){
'use strict';
const TIERS=Object.freeze({small:Object.freeze({cols:16,rows:12}),medium:Object.freeze({cols:24,rows:18}),large:Object.freeze({cols:40,rows:28})});
const SIZES={home:'medium',pool:'large',library:'large',square:'large',park:'large',ranch:'large',burger:'medium',cafe:'medium',icecream:'medium',pub:'medium',gym:'medium',market:'medium',museum:'medium',greenhouse:'medium',bookstore:'small',clinic:'small',studio:'small',workshop:'small'};
const cache=new Map();
function forPlace(id){const tier=id==='pennyHome'?'medium':SIZES[id]||'small';return {id,tier,...TIERS[tier],tileWidth:64,tileHeight:32,npcSpacingTiles:1.5,walkFPS:10,renderFPS:60,walkingFrames:8};}
function build(id){
 const s=forPlace(id),{cols:w,rows:h}=s,tiles=Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>x===0||y===0||x===w-1||y===h-1?'wall':'floor'));
 const fixtures=[],door={x:Math.floor(w/2),y:h-1},labels={pool:'온실 수영장',burger:'마법학교 햄버거 가게',bookstore:'마법서점',library:'중앙 도서관'};
 function add(kind,x,y,width,height,label){x=Math.round(x);y=Math.round(y);width=Math.round(width);height=Math.round(height);
  const f={kind,x,y,w:width,h:height,label:label||kind};fixtures.push(f);
  for(let cy=Math.max(1,y);cy<Math.min(h-1,y+height);cy++)for(let cx=Math.max(1,x);cx<Math.min(w-1,x+width);cx++)tiles[cy][cx]=kind;
 }
 // Each displayed prop has the same footprint as its collision rectangle.
 if(id==='pennyHome'){
  for(const f of root.WordvillePennyHome?.furniture||[])add(f.kind,f.x,f.y,f.w,f.h,f.label);
 }else if(id==='home'){
  add('bed',3,3,5,3,'침대');add('bed',14,3,5,3,'침대');
  add('table',8,9,5,3,'식탁');add('shelf',19,8,2,5,'책장');
  add('counter',4,12,4,2,'수납장');
 }else if(id==='pool'){
  add('water',8,7,24,13,'수영 구역');add('bench',3,5,3,1,'휴식 벤치');add('bench',34,6,3,1,'휴식 벤치');
  add('planter',3,18,3,3,'화단');add('planter',34,18,3,3,'화단');
  add('counter',17,3,6,2,'수영장 접수');
 }else if(id==='burger'){
  add('counter',15,4,6,2,'주문대');add('kitchen',18,2,4,2,'조리실');
  add('table',3,5,3,2,'식사 테이블');add('table',8,5,3,2,'식사 테이블');
  add('table',3,11,3,2,'식사 테이블');add('table',9,11,3,2,'식사 테이블');
  add('planter',20,11,2,2,'장식 화분');
 }else if(id==='bookstore'){
  add('shelf',2,2,2,5,'마법책 서가');add('shelf',6,2,2,5,'어원책 서가');
  add('shelf',10,2,2,5,'마법 서가');add('counter',11,8,3,1,'계산대');
  add('table',3,8,2,1,'추천 도서 진열대');
 }else if(id==='library'){
  for(const x of [3,9,15,21,27,33])add('shelf',x,4,2,10,'도서관 서가');
  add('table',7,19,5,2,'독서 테이블');add('table',18,19,5,2,'독서 테이블');
  add('table',29,19,5,2,'독서 테이블');add('counter',29,23,7,2,'도서 대출대');
 }else if(id==='square'||id==='park'){
  add(id==='square'?'fountain':'pond',Math.floor(w/2)-5,Math.floor(h/2)-4,10,8,id==='square'?'분수대':'연못');
  add('bench',4,9,3,1,'벤치');add('bench',w-7,9,3,1,'벤치');
  add('tree',4,h-8,3,3,'나무');add('tree',w-7,h-8,3,3,'나무');
 }else if(id==='ranch'){
  add('stable',3,3,10,6,'마구간');add('fence',16,5,17,2,'목장 울타리');
  add('hay',23,11,5,3,'건초');add('pond',5,16,7,4,'물통');
 }else if(id==='greenhouse'){
  for(const x of [3,8,13,18])add('planter',x,4,3,5,'식물 재배대');
  add('table',8,12,6,2,'식물 관찰대');
 }else if(id==='museum'){
  add('exhibit',3,4,4,3,'전시품');add('exhibit',10,4,4,3,'전시품');add('exhibit',17,4,4,3,'전시품');
  add('bench',10,11,4,1,'관람 벤치');
 }else if(id==='market'){
  for(const x of [3,9,15])add('stall',x,4,4,4,'상품 판매대');
  add('counter',9,12,6,2,'계산대');
 }else if(id==='gym'){
  for(const x of [3,9,15])add('equipment',x,4,4,3,'운동 기구');
  add('bench',7,12,3,1,'운동 벤치');
 }else if(id==='cafe'||id==='icecream'||id==='pub'){
  add('counter',15,3,6,2,id==='cafe'?'카페 주문대':id==='pub'?'음료 바':'아이스크림 주문대');
  for(const [x,y] of [[3,5],[9,5],[3,11],[9,11]])add('table',x,y,3,2,'테이블');
 }else if(id==='studio'){
  add('equipment',3,3,4,3,'악기');add('equipment',9,3,4,3,'녹음 장비');add('table',5,8,5,2,'믹싱 데스크');
 }else if(id==='clinic'){
  add('bed',3,3,5,2,'진찰대');add('counter',10,3,4,2,'접수대');add('bench',3,8,4,1,'대기 의자');
 }else if(id==='workshop'){
  add('table',3,3,5,3,'제작대');add('shelf',10,3,4,2,'도구 보관장');add('counter',3,8,5,1,'작업대');
 }else{
  add('counter',w-7,3,4,2,'접수대');add('table',3,5,4,2,'테이블');
 }
 tiles[door.y][door.x]='exit';
 const map={id,name:labels[id]||id,...s,tiles,fixtures,door,entrance:{x:door.x,y:h-2}};
 return map;
}
function getMap(id){if(!cache.has(id))cache.set(id,build(id));return cache.get(id);}
function tile(id,x,y){const m=getMap(id);return m.tiles[y]?.[x]||'wall';}
function isBlocked(id,x,y){return !Number.isInteger(x)||!Number.isInteger(y)||!['floor','exit'].includes(tile(id,x,y));}
function neighbors(x,y){return [[x,y-1],[x-1,y],[x+1,y],[x,y+1]];}
function nearest(id,x,y,occupied=[]){
 const m=getMap(id);let best=null,score=Infinity;
 for(let yy=1;yy<m.rows;yy++)for(let xx=1;xx<m.cols-1;xx++){
  if(isBlocked(id,xx,yy)||occupied.some(p=>Math.hypot(xx-p.x,yy-p.y)<1.5))continue;
  const d=Math.abs(xx-x)+Math.abs(yy-y);if(d<score){score=d;best={x:xx,y:yy};}
 }
 return best;
}
function route(id,a,b,occupied=[]){
 const sx=Math.round(a.x),sy=Math.round(a.y),tx=Math.round(b.x),ty=Math.round(b.y);
 if(isBlocked(id,sx,sy)||isBlocked(id,tx,ty))return [];
 const key=(x,y)=>x+','+y,origin=key(sx,sy),target=key(tx,ty),queue=[[sx,sy]],parents=new Map([[origin,null]]);
 for(let qi=0;qi<queue.length;qi++){
  const [x,y]=queue[qi],k=key(x,y);
  if(k===target){const result=[];for(let v=k;v&&v!==origin;v=parents.get(v)){const [cx,cy]=v.split(',').map(Number);result.push({x:cx,y:cy});}return result.reverse();}
  for(const [nx,ny] of neighbors(x,y)){
   const nk=key(nx,ny);
   if(parents.has(nk)||isBlocked(id,nx,ny)||occupied.some(p=>Math.hypot(p.x-nx,p.y-ny)<1.25))continue;
   parents.set(nk,k);queue.push([nx,ny]);
  }
 }
 return [];
}
function adjacentSpot(id,fixture,from,occupied=[]){
 const m=getMap(id);let best=null,length=Infinity;
 for(let y=fixture.y-1;y<=fixture.y+fixture.h;y++)for(let x=fixture.x-1;x<=fixture.x+fixture.w;x++){
  if(x>=fixture.x&&x<fixture.x+fixture.w&&y>=fixture.y&&y<fixture.y+fixture.h)continue;
  if(isBlocked(id,x,y))continue;
  const path=route(id,from,{x,y},occupied);
  if((path.length||x===Math.round(from.x)&&y===Math.round(from.y))&&path.length<length){best={x,y};length=path.length;}
 }
 return best;
}
const api={TIERS,SIZES,forPlace,getMap,tile,isBlocked,neighbors,nearest,route,adjacentSpot};
root.WordvilleVenueSpec=api;
if(typeof module!=='undefined')module.exports=api;
})(globalThis);
