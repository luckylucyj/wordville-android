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
  add('wall',1,1,22,2,'벽면');
  add('bed',1,3,4,3,'침대');add('planter',7,3,5,2,'화분');
  add('bed',17,3,6,2,'침대');add('table',9,6,6,4,'식탁');
  add('counter',1,13,2,4,'수납장');add('shelf',19,13,4,3,'책장');
 }else if(id==='pool'){
  add('wall',1,1,38,3,'유리벽');
  add('planter',12,3,3,3,'화분');add('planter',25,3,3,3,'화분');
  add('counter',16,4,8,2,'수영장 접수');
  add('water',5,9,30,8,'수영 구역');
  add('bench',1,11,3,4,'휴식 벤치');add('bench',36,11,3,4,'휴식 벤치');
  add('planter',1,22,4,5,'화단');add('planter',35,22,4,5,'화단');
 }else if(id==='burger'){
  add('wall',1,1,22,2,'벽면');
  add('kitchen',15,3,8,2,'조리실');add('counter',15,5,8,3,'주문대');
  add('table',1,5,5,3,'식사 테이블');add('table',8,5,5,3,'식사 테이블');
  add('table',1,10,5,3,'식사 테이블');add('table',8,10,5,3,'식사 테이블');
  add('planter',21,13,2,3,'장식 화분');
 }else if(id==='bookstore'){
  add('wall',1,1,14,1,'서점 벽면');
  add('shelf',1,2,4,3,'마법책 서가');add('shelf',6,2,4,3,'어원책 서가');
  add('shelf',11,2,4,3,'마법 서가');add('table',1,7,3,2,'추천 도서 진열대');
  add('counter',11,7,4,2,'계산대');
 }else if(id==='library'){
  add('wall',1,1,38,4,'도서관 벽면');
  for(const x of [4,13,22,32])add('shelf',x,6,5,5,'도서관 서가');
  add('table',3,16,6,4,'독서 테이블');add('table',12,16,6,4,'독서 테이블');
  add('table',21,16,6,4,'독서 테이블');
  add('counter',31,16,3,4,'도서 대출대');add('counter',34,18,5,2,'도서 대출대');
 }else if(id==='square'){
  add('wall',1,1,38,2,'광장 화단');
  add('planter',1,3,3,3,'가로등');add('planter',36,3,3,3,'가로등');
  add('fountain',14,8,12,8,'광장 분수');
  add('bench',1,7,5,3,'광장 벤치');add('bench',1,14,5,3,'광장 벤치');
  add('bench',34,7,5,3,'광장 벤치');add('bench',34,14,5,3,'광장 벤치');
  add('planter',1,21,11,6,'화단');add('planter',28,21,11,6,'화단');
 }else if(id==='park'){
  add('pond',13,3,14,5,'공원 연못');
  add('tree',1,1,7,5,'나무 화단');add('tree',32,1,7,6,'나무 화단');
  add('bench',4,6,4,2,'공원 벤치');add('bench',4,11,4,2,'공원 벤치');
  add('table',33,8,5,3,'피크닉 테이블');
  add('tree',1,16,9,11,'화단');add('tree',30,16,9,11,'화단');
 }else if(id==='ranch'){
  add('stable',1,1,10,6,'외양간');add('fence',11,2,5,3,'목장 울타리');
  add('pond',30,2,4,3,'물통');add('hay',34,1,5,4,'건초 더미');
  add('fence',1,24,14,3,'목장 울타리');add('fence',24,24,15,3,'목장 울타리');
 }else if(id==='greenhouse'){
  add('wall',1,1,22,4,'온실 유리벽');
  add('planter',2,6,4,3,'식물 재배대');add('planter',7,6,4,3,'식물 재배대');
  add('planter',13,6,4,3,'식물 재배대');add('planter',18,6,4,3,'식물 재배대');
  add('table',9,11,6,3,'식물 관찰대');
 }else if(id==='museum'){
  add('wall',1,1,22,2,'박물관 벽면');
  add('exhibit',2,5,5,4,'화석 전시대');add('exhibit',9,5,6,4,'도자기 전시대');
  add('exhibit',2,10,5,4,'수정 전시대');add('exhibit',9,10,6,4,'유물 전시대');
  add('shelf',17,5,5,4,'유물 진열장');add('counter',17,12,6,2,'안내 데스크');
 }else if(id==='market'){
  add('wall',1,1,22,2,'마켓 벽면');
  add('stall',1,4,5,3,'과일 진열대');add('stall',7,4,5,3,'채소 진열대');
  add('stall',1,8,5,3,'베이커리 진열대');add('stall',7,8,5,3,'식료품 진열대');
  add('shelf',18,2,5,2,'식료품 선반');add('counter',16,6,7,3,'계산대');
 }else if(id==='gym'){
  add('wall',1,1,22,2,'체육관 벽면');
  add('table',1,4,4,2,'운동 매트');add('bench',5,4,2,2,'벤치 프레스');
  add('shelf',1,7,5,3,'덤벨 거치대');
  add('equipment',17,3,2,3,'러닝머신');add('equipment',20,3,2,3,'러닝머신');
  add('counter',17,7,6,3,'안내 카운터');
 }else if(id==='cafe'){
  add('wall',1,1,22,2,'카페 벽면');
  add('counter',15,3,7,2,'에스프레소 바');add('counter',15,5,8,3,'베이커리 카운터');
  for(const [x,y] of [[1,4],[7,4],[1,8],[7,8]])add('table',x,y,5,3,'카페 테이블');
 }else if(id==='icecream'){
  add('wall',1,1,22,3,'벽면');
  add('counter',14,3,2,6,'젤라토 진열대');add('counter',16,6,7,3,'아이스크림 카운터');
  for(const [x,y] of [[1,6],[7,6],[1,11],[7,11]])add('table',x,y,4,2,'아이스크림 테이블');
 }else if(id==='pub'){
  add('wall',1,1,22,2,'펍 벽면');
  add('shelf',17,2,5,3,'주류 진열장');
  add('counter',15,3,2,4,'바 카운터');add('counter',17,5,6,2,'바 카운터');
  for(const [x,y] of [[2,5],[8,5],[2,9],[8,9]])add('table',x,y,4,2,'펍 테이블');
 }else if(id==='studio'){
  add('wall',1,1,14,2,'작업실 벽면');
  add('table',2,3,2,2,'이젤');add('table',1,6,2,3,'이젤');
  add('table',9,5,5,2,'작업대');add('shelf',14,3,1,2,'화구 수납장');
 }else if(id==='clinic'){
  add('wall',1,1,14,1,'병원 벽면');
  add('shelf',10,2,5,2,'약장');
  add('bed',1,3,2,2,'진료 침대');add('bed',5,3,2,2,'진료 침대');
  add('bench',1,7,3,2,'대기 벤치');add('counter',10,4,5,2,'접수대');
 }else if(id==='workshop'){
  add('wall',1,1,14,1,'공방 벽면');
  add('counter',13,2,2,2,'모루 화덕');
  add('table',1,5,4,2,'목공 작업대');add('table',7,5,5,2,'설계 작업대');
  add('shelf',12,8,3,3,'목재 선반');
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
