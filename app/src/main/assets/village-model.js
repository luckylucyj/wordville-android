(function(root){
'use strict';
const people=[
 ['alex','알렉스','체육 공원','attend','#457f52','#5b3a2a'],['elliott','엘리엇','서점','application','#b66641','#9f5a35'],
 ['harvey','하비','진료소','appointment','#698e75','#533c2e'],['sam','샘','음악 카페','schedule','#e09345','#d6b84e'],
 ['sebastian','세바스찬','작업실','equipment','#565980','#292b41'],['shane','셰인','식료품점','shipment','#685c9a','#3a3446'],
 ['haley','헤일리','사진관','available','#dd8d92','#e2bf58'],['leah','레아','공방','purchase','#9a7352','#a55132'],
 ['maru','마루','연구실','maintenance','#7b8aa9','#663e39'],['penny','페니','도서관','deadline','#bc8951','#b96639'],
 ['abigail','애비게일','광장','reservation','#836aa1','#895995'],['emily','에밀리','재봉실','customer','#b96463','#4d74ab']
].map(([id,name,home,word,shirt,hair],i)=>({id,name,home,word,shirt,hair,skin:['#edbe98','#d19b78','#f0c8a2','#b9805e'][i%4]}));
// The source map is 840×1120, displayed at a 600×800 world coordinate scale.
// Fountain water/stone: center (299,318), ellipse radii 77×49 INCLUDING a safety margin.
const fountain={x:299,y:316,rx:77,ry:49};
const nodes=[
 {x:300,y:390},  // 0 southern plaza below fountain
 {x:203,y:390},  // 1 west plaza
 {x:397,y:390},  // 2 east plaza
 {x:139,y:419},  // 3 west cobblestone path
 {x:460,y:425},  // 4 east cobblestone path
 {x:207,y:267},  // 5 west upper promenade
 {x:393,y:267},  // 6 east upper promenade
 {x:300,y:258,stair:true}, // 7 staircase landing
 {x:300,y:237,stair:true}, // 8 staircase middle
 {x:300,y:214,stair:true}, // 9 staircase at main entrance
 {x:198,y:313},  // 10 left of fountain
 {x:402,y:313},  // 11 right of fountain
 {x:208,y:370},  // 12 southwest perimeter
 {x:392,y:370},  // 13 southeast perimeter
 {x:302,y:438},  // 14 bridge approach
 {x:277,y:470},  // 15 bridge entry
 {x:306,y:495},  // 16 on the bridge
 {x:168,y:267},  // 17 west terrace
 {x:437,y:267}   // 18 east terrace
];
const links=[
 [0,1],[0,2],[0,14],[1,12],[1,3],[2,13],[2,4],
 [5,7],[6,7],[7,8],[8,9],
 [5,10],[6,11],[10,12],[11,13],
 [5,17],[6,18],[14,15],[15,16]
];
const edges=nodes.map(()=>[]);
for(const [a,b] of links){edges[a].push(b);edges[b].push(a);}
function inFountain(x,y){const dx=(x-fountain.x)/fountain.rx,dy=(y-fountain.y)/fountain.ry;return dx*dx+dy*dy<=1;}
function segmentHitsFountain(a,b){for(let i=0;i<=96;i++){const t=i/96;if(inFountain(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return true;}return false;}
const stairEdges=new Set(['7-8','8-9']);
const edgeKey=(a,b)=>[Math.min(a,b),Math.max(a,b)].join('-');
function isStairEdge(a,b){return stairEdges.has(edgeKey(a,b));}
function period(hour){return hour>=6&&hour<18?'day':hour>=18&&hour<20?'dusk':'night';}
function path(from,to){const q=[[from]],visited=new Set([from]);while(q.length){const p=q.shift(),last=p.at(-1);if(last===to)return p;for(const next of edges[last])if(!visited.has(next)){visited.add(next);q.push([...p,next]);}}return [from];}
function freshResidents(){return people.map((p,i)=>{const ni=[0,1,2,3,4,5,6,7,10,11,12,13][i];const n=nodes[ni];return {...p,x:n.x,y:n.y,node:ni,route:[],wait:i*.6,chat:0,partner:null,cooldown:0,steps:i*.18,stairPhase:0,onStairs:false,heading:1,visits:0};});}
function tick(residents,dt,onMeet){
 dt=Math.min(.1,Math.max(0,dt));
 for(const p of residents){
  if(p.chat>0){p.chat=Math.max(0,p.chat-dt);p.onStairs=false;continue;}
  if(p.wait>0){p.wait=Math.max(0,p.wait-dt);p.onStairs=false;continue;}
  if(!p.route.length){const goal=(p.node+5+p.id.length+(p.visits++*7))%nodes.length;p.route=path(p.node,goal).slice(1);p.wait=.25;continue;}
  const nextIndex=p.route[0],n=nodes[nextIndex],dx=n.x-p.x,dy=n.y-p.y,d=Math.hypot(dx,dy);
  p.onStairs=isStairEdge(p.node,nextIndex);
  p.heading=dx<-.5?-1:dx>.5?1:p.heading;p.direction=Math.abs(dx)>=Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
  const speed=p.onStairs?12:18,step=speed*dt;
  if(d<=step){p.x=n.x;p.y=n.y;p.node=p.route.shift();p.wait=.16;p.onStairs=false;}
  else{const nx=p.x+dx/d*step,ny=p.y+dy/d*step;if(residents.some(other=>other!==p&&Math.hypot(other.x-nx,other.y-ny)<16)){p.wait=.16;continue;}p.x=nx;p.y=ny;p.steps+=dt;p.stairPhase=p.onStairs?(Math.sin(p.steps*12)+1)/2:0;}
 }
 for(let i=0;i<residents.length;i++){const a=residents[i];if(a.chat||a.cooldown>0||a.onStairs)continue;for(let j=i+1;j<residents.length;j++){const b=residents[j];if(b.chat||b.cooldown>0||b.onStairs)continue;if(Math.hypot(a.x-b.x,a.y-b.y)<15){a.chat=b.chat=3.5;a.cooldown=b.cooldown=15;a.partner=b.id;b.partner=a.id;onMeet?.(a,b);break;}}}
 for(const p of residents)p.cooldown=Math.max(0,(p.cooldown||0)-dt);
}
const api={people,nodes,edges,links,fountain,inFountain,segmentHitsFountain,isStairEdge,period,path,freshResidents,tick};
root.VillageModel=api;
})(globalThis);