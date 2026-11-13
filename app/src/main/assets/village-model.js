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
// Coordinates are the 600×800 authored hub scene. Routes and the fountain share world units.
const fountain={x:303,y:470,rx:112,ry:73};
// All coordinates are in the same 600x800 units as the hub artwork.
// A collision box covers the part touching the ground, not a tree crown,
// floating foliage or the entire height of a building.
const FOOT_RADIUS=6;
const decorations=Object.freeze([
 {id:'fountain',kind:'ellipse',...fountain},
 {id:'academy-base',kind:'rect',x:189,y:173,w:223,h:10},
 {id:'cafe-base',kind:'rect',x:22,y:281,w:132,h:10},
 {id:'bookstore-base',kind:'rect',x:446,y:281,w:131,h:10},
 {id:'west-bench',kind:'rect',x:87,y:387,w:55,h:14},
 {id:'east-bench',kind:'rect',x:464,y:387,w:55,h:14},
 {id:'north-west-flowers',kind:'ellipse',x:210,y:228,rx:24,ry:7},
 {id:'north-east-flowers',kind:'ellipse',x:395,y:229,rx:24,ry:7},
 {id:'west-garden',kind:'ellipse',x:113,y:358,rx:45,ry:8},
 {id:'east-garden',kind:'ellipse',x:494,y:358,rx:45,ry:8},
 {id:'south-west-garden',kind:'ellipse',x:135,y:472,rx:22,ry:8},
 {id:'south-east-garden',kind:'ellipse',x:467,y:471,rx:22,ry:8},
 {id:'west-gate-flowers',kind:'ellipse',x:65,y:620,rx:40,ry:8},
 {id:'east-gate-flowers',kind:'ellipse',x:535,y:617,rx:40,ry:8},
 {id:'west-tree',kind:'ellipse',x:52,y:419,rx:7,ry:5},
 {id:'east-tree',kind:'ellipse',x:554,y:421,rx:7,ry:5},
 {id:'north-west-lamp',kind:'ellipse',x:162,y:331,rx:4,ry:4},
 {id:'north-east-lamp',kind:'ellipse',x:436,y:330,rx:4,ry:4},
 {id:'south-west-lamp',kind:'ellipse',x:142,y:521,rx:4,ry:4},
 {id:'south-east-lamp',kind:'ellipse',x:462,y:520,rx:4,ry:4}
].map(item=>Object.freeze(item))));
function collidesDecoration(x,y,radius=FOOT_RADIUS){
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||radius<0)return true;
 return decorations.some(d=>{
  if(d.kind==='rect'){
   const cx=Math.max(d.x,Math.min(x,d.x+d.w));
   const cy=Math.max(d.y,Math.min(y,d.y+d.h));
   return Math.hypot(x-cx,y-cy)<=radius;
  }
  // Conservative foot-circle padding: the tall image itself is not solid.
  const dx=(x-d.x)/(d.rx+radius),dy=(y-d.y)/(d.ry+radius);
  return dx*dx+dy*dy<=1;
 });
}
function segmentHitsDecoration(a,b,radius=FOOT_RADIUS){
 const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/2));
 for(let i=0;i<=steps;i++){
  const t=i/steps;
  if(collidesDecoration(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,radius))return true;
 }
 return false;
}

const nodes=[
 {x:300,y:615},
 {x:178,y:601},
 {x:420,y:603},
 {x:146,y:667},
 {x:455,y:666},
 {x:190,y:335},
 {x:413,y:337},
 {x:410,y:310,stair:true},
 {x:400,y:289,stair:true},
 {x:354,y:310,stair:true},
 {x:165,y:433},
 {x:438,y:430},
 {x:181,y:544},
 {x:422,y:545},
 {x:301,y:692},
 {x:278,y:725},
 {x:309,y:765},
 {x:168,y:353},
 {x:437,y:350}
];
const links=[
 [0,1],[0,2],[0,14],[1,12],[1,3],[2,13],[2,4],[5,17],[6,18],[17,10],[18,7],[10,12],[11,13],[6,7],[7,8],[8,9],[9,11],[14,15],[15,16],[5,10]
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
// Facing follows the direction of the CURRENT PATH SEGMENT, not a fluctuating
// position-to-target vector or the character's walk-animation frame.
const directions=['down','down-right','right','up-right','up','up-left','left','down-left'];
function directionFromDelta(dx,dy,previous='down'){
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)<1e-6)return previous;
 const degrees=(Math.atan2(dx,dy)*180/Math.PI+360)%360;
 return directions[Math.round(degrees/45)%8];
}
// All interiors share physical entrance nodes on the existing collision-safe road graph.
// The detailed interiors themselves are separate scenes in the Places tab.
const schedule=root.WordvilleSchedule;
const entranceNode=Object.freeze({
 home:null, pool:11,ranch:3,gym:10,burger:2,icecream:18,pub:4,museum:7,
 greenhouse:17,cafe:18,bookstore:6,clinic:7,library:9,studio:6,
 market:4,square:0,workshop:5,park:1
});
const outdoorPlaces=new Set(['square','park']);
function destinationFor(p,place){
 const node=place==='home'?p.homeNode:entranceNode[place];
 if(!Number.isInteger(node)||!nodes[node])throw Error('Unknown destination: '+place);
 return node;
}
function syncSchedule(residents,minute,{teleport=false}={}){
 if(!schedule||!Number.isFinite(minute))return;
 for(const p of residents){
  if(!schedule.BLOCKS[p.id])continue;
  const slot=schedule.at(p.id,minute);
  const key=slot.hour+'|'+slot.place+'|'+slot.activity;
  if(key===p.scheduleKey&&!teleport)continue;
  const goal=destinationFor(p,slot.place);
  p.scheduleKey=key;p.scheduleHour=slot.hour;p.schedulePlace=slot.place;
  p.activity=slot.activity;p.targetNode=goal;
  p.chat=0;p.partner=null;p.wait=0;p.onStairs=false;
  p.isMoving=false;p.activityState='travel';
  if(teleport){
   p.node=goal;p.x=nodes[goal].x;p.y=nodes[goal].y;
   p.route=[];p.atVenue=true;p.activityState='doing';
   continue;
  }
  p.route=path(p.node,goal).slice(1);
  p.atVenue=!p.route.length;
  if(p.atVenue)p.activityState='doing';
 }
}
function freshResidents(){return people.map((p,i)=>{const ni=[0,1,2,3,4,5,6,7,10,11,12,13][i];const n=nodes[ni];return {...p,x:n.x,y:n.y,node:ni,homeNode:[3,4,15,16,3,4,15,16,3,4,15,16][i],schedulePlace:null,scheduleHour:null,scheduleKey:'',targetNode:null,atVenue:false,activity:'',activityState:'travel',route:[],wait:i*.6,chat:0,partner:null,cooldown:0,steps:i*.18,walkDistance:0,stairPhase:0,onStairs:false,heading:1,direction:'down',facing:'down',movementDirection:'down',isMoving:false,visits:0};});}
function tick(residents,dt,onMeet,options={}){
 const scheduled=Boolean(schedule&&Number.isFinite(options?.minuteOfDay));
 if(scheduled)syncSchedule(residents,options.minuteOfDay,{teleport:options.teleport===true});
 dt=Math.min(.1,Math.max(0,dt));
 for(const p of residents){
  // Reset on EVERY tick: a blocked, waiting or chatting NPC is not walking.
  p.isMoving=false;
  if(p.chat>0){p.chat=Math.max(0,p.chat-dt);p.onStairs=false;continue;}
  if(p.wait>0){p.wait=Math.max(0,p.wait-dt);p.onStairs=false;continue;}
  if(!p.route.length){
   if(scheduled){p.atVenue=true;p.activityState='doing';continue;}
   const goal=(p.node+5+p.id.length+(p.visits++*7))%nodes.length;p.route=path(p.node,goal).slice(1);p.wait=.25;continue;
  }
  const nextIndex=p.route[0],n=nodes[nextIndex],dx=n.x-p.x,dy=n.y-p.y,d=Math.hypot(dx,dy);
  p.onStairs=isStairEdge(p.node,nextIndex);
  if(d<1e-6){p.node=p.route.shift();if(scheduled&&!p.route.length){p.atVenue=true;p.activityState='doing';}continue;}
  // Node-to-node direction remains identical for the whole leg. A new leg
  // may turn only after arriving at its node; blocked legs keep last facing.
  const from=nodes[p.node];
  const facing=directionFromDelta(n.x-from.x,n.y-from.y,p.direction);
  const speed=p.onStairs?12:18,step=speed*dt;
  if(step>0&&d>0){
   const travel=Math.min(step,d),nx=p.x+dx/d*travel,ny=p.y+dy/d*travel;
   // Check the actual foot position, including the final node snap.
   // Collision must not change facing or advance the walking sprite.
   if(collidesDecoration(nx,ny)||
      residents.some(other=>other!==p&&(!scheduled||!other.atVenue)&&Math.hypot(other.x-nx,other.y-ny)<23)){
    p.wait=.16;p.onStairs=false;continue;
   }
   p.x=travel>=d?n.x:nx;p.y=travel>=d?n.y:ny;
   if(travel>=d){
    p.node=p.route.shift();p.wait=.16;p.onStairs=false;
    if(scheduled&&!p.route.length){p.atVenue=true;p.activityState='doing';}
   }
   if(p.direction!==facing)p.walkDistance=0;
   p.direction=p.facing=p.movementDirection=facing;p.isMoving=true;
   p.steps+=dt;p.walkDistance+=travel;
   p.stairPhase=p.onStairs?(Math.sin(p.steps*12)+1)/2:0;
  }
 }
 for(let i=0;i<residents.length;i++){const a=residents[i];if(a.chat||a.cooldown>0||a.onStairs)continue;for(let j=i+1;j<residents.length;j++){const b=residents[j];if(b.chat||b.cooldown>0||b.onStairs)continue;
  if(scheduled&&(!a.atVenue||!b.atVenue||!outdoorPlaces.has(a.schedulePlace)||a.schedulePlace!==b.schedulePlace))continue;if(Math.hypot(a.x-b.x,a.y-b.y)<29){a.chat=b.chat=3.5;a.cooldown=b.cooldown=15;a.partner=b.id;b.partner=a.id;onMeet?.(a,b);break;}}}
 for(const p of residents)p.cooldown=Math.max(0,(p.cooldown||0)-dt);
}
const api={people,nodes,edges,links,fountain,FOOT_RADIUS,decorations,collidesDecoration,segmentHitsDecoration,inFountain,segmentHitsFountain,isStairEdge,period,path,directions,directionFromDelta,freshResidents,tick,entranceNode,outdoorPlaces,destinationFor,syncSchedule};
root.VillageModel=api;
})(globalThis);