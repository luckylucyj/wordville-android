(function(root){
'use strict';
const people=[
 ['alex','알렉스','체육 공원','attend','#457f52','#5b3a2a'],['elliott','엘리엇','서점','application','#b66641','#9f5a35'],
 ['harvey','하비','진료소','appointment','#698e75','#533c2e'],['sam','샘','음악 카페','schedule','#e09345','#d6b84e'],
 ['sebastian','세바스찬','작업실','equipment','#565980','#292b41'],['shane','셰인','식료품점','shipment','#685c9a','#3a3446'],
 ['haley','헤일리','사진관','available','#dd8d92','#e2bf58'],['leah','레아','공방','purchase','#9a7352','#a55132'],
 ['maru','마루','연구실','maintenance','#7b8aa9','#663e39'],['penny','페니','도서관','deadline','#bc8951','#b96639'],
 ['abigail','애비게일','광장','reservation','#836aa1','#895995'],['emily','에밀리','재봉실','customer','#b96463','#4d74ab'],
 ['chiikawa','치이카와','공원','available','#f4ebee','#fff6ef'],
 ['hachiware','하치와레','서점','purchase','#5795cd','#3d7bb8'],
 ['usagi','우사기','마을 광장','attend','#e5b75e','#f7dd91'],
 ['rakko','랏코','헬스장','equipment','#a58971','#f6e3d1'],
 ['kurimanju','쿠리만쥬','카페','customer','#c3905e','#9f6242'],
 ['momo','히나모리 모모','도서관','deadline','#494659','#453444'],
 ['toshiro','히츠가야 토시로','공원','schedule','#78a7ab','#e9f1ef'],
 ['aizen','아이젠','도서관','application','#69564e','#7a503a'],
 ['homura','호무라','서점','reservation','#777091','#24232b'],
 ['madoka','마도카','식물원','maintenance','#d979a4','#f092ba']
].map(([id,name,home,word,shirt,hair],i)=>({id,name,home,word,shirt,hair,skin:['#edbe98','#d19b78','#f0c8a2','#b9805e'][i%4]}));
// Coordinates are the 600×800 authored hub scene. Routes and the fountain share world units.
const fountain={x:300,y:450,rx:66,ry:42};
// All coordinates are in the same 600x800 units as the hub artwork.
// A collision box covers the part touching the ground, not a tree crown,
// floating foliage or the entire height of a building.
const FOOT_RADIUS=6;
function hedge(id,points){
 const xs=points.map(([x])=>x),ys=points.map(([,y])=>y);
 return {id,kind:'polygon',points:Object.freeze(points.map(point=>Object.freeze(point))),
  left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
}
const decorations=Object.freeze([
 {id:'fountain',kind:'ellipse',...fountain},
 {id:'academy-base',kind:'rect',x:162,y:214,w:276,h:12},
 {id:'library-west-lawn',kind:'rect',x:166,y:226,w:80,h:98},
 {id:'library-east-lawn',kind:'rect',x:354,y:226,w:88,h:98},
 {id:'greenhouse-base',kind:'rect',x:0,y:218,w:162,h:112},
 {id:'cafe-base',kind:'rect',x:454,y:244,w:146,h:94},
 {id:'west-grass-north',kind:'rect',x:0,y:374,w:46,h:48},
 {id:'east-grass-north',kind:'rect',x:554,y:340,w:46,h:82},
 {id:'west-canal-bank',kind:'rect',x:0,y:586,w:242,h:118},
 {id:'east-canal-bank',kind:'rect',x:358,y:586,w:242,h:118},
 {id:'west-bench',kind:'rect',x:74,y:386,w:48,h:16},
 {id:'east-bench',kind:'rect',x:478,y:386,w:48,h:16},
 {id:'north-west-flowers',kind:'ellipse',x:196,y:324,rx:22,ry:9},
 {id:'north-east-flowers',kind:'ellipse',x:404,y:324,rx:22,ry:9},
 {id:'south-west-garden',kind:'ellipse',x:102,y:560,rx:24,ry:10},
 {id:'south-east-garden',kind:'ellipse',x:498,y:560,rx:24,ry:10},
 {id:'west-gate-flowers',kind:'ellipse',x:58,y:740,rx:52,ry:22},
 {id:'east-gate-flowers',kind:'ellipse',x:528,y:748,rx:64,ry:24},
 {id:'west-tree',kind:'ellipse',x:28,y:526,rx:14,ry:8},
 {id:'east-tree',kind:'ellipse',x:572,y:526,rx:14,ry:8},
 {id:'north-west-lamp',kind:'ellipse',x:232,y:336,rx:6,ry:4},
 {id:'north-east-lamp',kind:'ellipse',x:368,y:336,rx:6,ry:4},
 {id:'south-west-lamp',kind:'ellipse',x:226,y:568,rx:6,ry:4},
 {id:'south-east-lamp',kind:'ellipse',x:374,y:568,rx:6,ry:4}
].map(item=>Object.freeze(item)));
function hitsHedge(hedge,x,y,radius){
 if(x<hedge.left-radius||x>hedge.right+radius||y<hedge.top-radius||y>hedge.bottom+radius)return false;
 let inside=false;
 const points=hedge.points;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [ax,ay]=points[j],[bx,by]=points[i];
  const dx=bx-ax,dy=by-ay;
  const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
  if((x-ax-t*dx)**2+(y-ay-t*dy)**2<=radius**2)return true;
  if((ay>y)!==(by>y)&&x<ax+(y-ay)*dx/dy)inside=!inside;
 }
 return inside;
}
function collidesDecoration(x,y,radius=FOOT_RADIUS){
 if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||radius<0)return true;
 return decorations.some(d=>{
  if(d.kind==='polygon')return hitsHedge(d,x,y,radius);
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
 {x:300,y:544},
 {x:180,y:542},
 {x:420,y:542},
 {x:148,y:514},
 {x:452,y:514},
 {x:196,y:372},
 {x:404,y:372},
 {x:300,y:356,stair:true},
 {x:300,y:276,stair:true},
 {x:300,y:242,stair:true},
 {x:180,y:448},
 {x:420,y:448},
 {x:180,y:498},
 {x:420,y:498},
 {x:300,y:604},
 {x:300,y:668},
 {x:300,y:748},
 {x:134,y:356},
 {x:520,y:362}
];
const links=[
 [0,1],[0,2],[0,14],[1,12],[1,3],[2,13],[2,4],[12,10],[13,11],[10,5],[11,6],[5,17],[6,18],[5,7],[6,7],[7,8],[8,9],[14,15],[15,16],[5,6]
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
const PATROL_RADIUS=9;
// Park and square share the plaza grid. Check the whole walking lane against scenery.
const standingSlots=[];
for(const y of [382,435,488,541]){
 for(let x=65;x<=521;x+=57){
  if(!segmentHitsDecoration({x:x-PATROL_RADIUS,y},{x:x+PATROL_RADIUS,y})){
   const road=nodes.map((n,i)=>({n,i,d:Math.hypot(n.x-x,n.y-y)})).sort((a,b)=>a.d-b.d)
    .find(({n})=>!segmentHitsDecoration(n,{x:x-PATROL_RADIUS,y})&&!segmentHitsDecoration(n,{x:x+PATROL_RADIUS,y}));
   if(road)standingSlots.push(Object.freeze({x,y,node:road.i}));
  }
 }
}
const slotsByPlace=new Map([...outdoorPlaces].map(place=>{
 const center=nodes[entranceNode[place]];
 const distance=p=>(p.x-center.x)**2+(p.y-center.y)**2;
 return [place,[...standingSlots].sort((a,b)=>distance(a)-distance(b))];
}));
function outdoorStandingPositions(residents){
 const positions=new Map(),claimed=new Set();
 for(const p of residents){
  if(!p.atVenue||!outdoorPlaces.has(p.schedulePlace)||!p.outdoorSpot)continue;
  positions.set(p.id,p.outdoorSpot);claimed.add(p.outdoorSpot);
 }
 for(const place of outdoorPlaces){
  const slots=slotsByPlace.get(place);
  for(const p of residents){
   if(!p.atVenue||p.schedulePlace!==place||positions.has(p.id))continue;
   const slot=slots.find(point=>!claimed.has(point));
   if(slot){claimed.add(slot);positions.set(p.id,slot);}
  }
 }
 return positions;
}
function placeOutdoorResidents(residents){
 if(!residents.some(p=>p.atVenue&&outdoorPlaces.has(p.schedulePlace)&&!p.outdoorSpot))return;
 const positions=outdoorStandingPositions(residents);
 residents.forEach((p,i)=>{
  const spot=positions.get(p.id);
  if(!spot||p.outdoorSpot)return;
  p.outdoorSpot=spot;p.x=spot.x;p.y=spot.y;
  p.patrolSide=i%2?1:-1;p.patrolWait=1+(i%7)*.55;
  p.isMoving=false;
 });
}
function recordWalk(p,dx,dy,travel,dt){
 p.direction=p.facing=p.movementDirection=directionFromDelta(dx,dy,p.direction);
 p.isMoving=true;p.steps+=dt;p.walkDistance+=travel;
 p.stairPhase=p.onStairs?(Math.sin(p.steps*12)+1)/2:0;
}
function stroll(p,residents,dt){
 if(p.patrolWait>0){p.patrolWait-=dt;return;}
 const target=p.outdoorSpot.x+p.patrolSide*PATROL_RADIUS;
 const dx=target-p.x,travel=Math.min(Math.abs(dx),16*dt);
 if(travel===0){p.patrolSide*=-1;p.patrolWait=3;return;}
 const x=p.x+Math.sign(dx)*travel;
 if(!canTakeStep(p,residents,x,p.y,true))return;
 p.x=x;
 recordWalk(p,dx,0,travel,dt);
}
function canTakeStep(p,residents,x,y,scheduled){
 return !collidesDecoration(x,y)&&!residents.some(other=>{
  if(other===p||(scheduled&&other.atVenue&&!outdoorPlaces.has(other.schedulePlace)))return false;
  const clearance=scheduled&&!other.atVenue?16:23;
  const separation=Math.hypot(other.x-x,other.y-y);
  return separation<clearance&&separation<Math.hypot(other.x-p.x,other.y-p.y);
 });
}
const appointments=[
 {pair:['momo','toshiro'],hour:17,place:'park',chatDuration:3.5},
 {pair:['homura','madoka'],hour:18,place:'square',chatDuration:7,waitingHour:17}
];
const relationships=new Map();
for(const appointment of appointments){
 const [first,second]=appointment.pair;
 relationships.set(first,{...appointment,partner:second});
 relationships.set(second,{...appointment,partner:first});
}
function hasAppointment(id,slot){
 const appointment=relationships.get(id);
 if(!appointment||slot.custom||slot.place!==appointment.place)return false;
 const waitsEarly=id===appointment.pair[0]&&slot.hour===appointment.waitingHour;
 if(slot.hour!==appointment.hour&&!waitsEarly)return false;
 const companionSlot=schedule.at(appointment.partner,appointment.hour*60);
 return !companionSlot.custom&&companionSlot.place===appointment.place;
}
function beginsPrimaryVisit(p,slot){
 return !slot.custom&&slot.hour>=schedule.PRIMARY_START&&slot.hour<schedule.PRIMARY_END
  &&schedule.PRIMARY_PLACES[p.id]===slot.place&&p.schedulePlace!==slot.place;
}
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
  const spot=p.outdoorSpot;
  if(!teleport&&p.schedulePlace===slot.place){
   p.scheduleKey=key;p.scheduleHour=slot.hour;p.activity=slot.activity;
   continue;
  }
  // Arrive on time for the daytime venue or a shared appointment.
  const arrive=teleport||beginsPrimaryVisit(p,slot)||hasAppointment(p.id,slot);
  p.scheduleKey=key;p.scheduleHour=slot.hour;p.schedulePlace=slot.place;
  p.activity=slot.activity;p.targetNode=goal;
  p.outdoorSpot=null;p.detour=null;
  p.chat=0;p.partner=null;p.wait=0;p.onStairs=false;
  p.isMoving=false;p.activityState='travel';
  if(arrive){
   p.cooldown=0;
   p.node=goal;p.x=nodes[goal].x;p.y=nodes[goal].y;
   p.route=[];p.atVenue=true;p.activityState='doing';
   continue;
  }
  p.route=spot?[spot.node,...path(spot.node,goal).slice(1)]:path(p.node,goal).slice(1);
  p.atVenue=!p.route.length;
  if(p.atVenue)p.activityState='doing';
 }
 placeOutdoorResidents(residents);
}
const spawnNodes=[0,1,2,3,4,5,6,7,10,11,12,13,8,9,14,15,16,17,18];
const homeNodes=[3,4,15,16];
function freshResidents(){return people.map((p,i)=>{const ni=spawnNodes[i%spawnNodes.length];const n=nodes[ni];return {...p,x:n.x,y:n.y,node:ni,homeNode:homeNodes[i%homeNodes.length],schedulePlace:null,scheduleHour:null,scheduleKey:'',targetNode:null,atVenue:false,activity:'',activityState:'travel',route:[],wait:i*.6,chat:0,partner:null,cooldown:0,steps:i*.18,walkDistance:0,stairPhase:0,onStairs:false,heading:1,direction:'down',facing:'down',movementDirection:'down',isMoving:false,visits:0};});}
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
   if(scheduled){
    p.atVenue=true;p.activityState='doing';
    if(p.outdoorSpot&&dt>0)stroll(p,residents,dt);
    continue;
   }
   const goal=(p.node+5+p.id.length+(p.visits++*7))%nodes.length;p.route=path(p.node,goal).slice(1);p.wait=.25;continue;
  }
  const nextIndex=p.route[0],n=nodes[nextIndex];
  const target=scheduled&&p.detour?p.detour:n;
  const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy);
  p.onStairs=isStairEdge(p.node,nextIndex);
  if(d<1e-6){
   if(p.detour){p.detour=null;continue;}
   p.node=p.route.shift();
   if(scheduled&&!p.route.length){p.atVenue=true;p.activityState='doing';}
   continue;
  }
  // Node-to-node direction remains identical for the whole leg. A new leg
  // may turn only after arriving at its node; blocked legs keep last facing.
  const speed=p.onStairs?12:18,step=speed*dt;
  if(step>0&&d>0){
   const travel=Math.min(step,d),nx=p.x+dx/d*travel,ny=p.y+dy/d*travel;
   // Check the actual foot position, including the final node snap.
   // Collision must not change facing or advance the walking sprite.
   if(!canTakeStep(p,residents,nx,ny,scheduled)){
    if(scheduled&&!p.onStairs){
     p.detour=null;
     // Rounded corners can share the road without requiring everyone to step
     // on the same pixel. Only use a clear connection to the next waypoint.
     const next=nodes[p.route[1]];
     if(Math.hypot(n.x-p.x,n.y-p.y)<26&&(!next||!segmentHitsDecoration(p,next))){
      p.node=p.route.shift();
      if(!p.route.length){p.atVenue=true;p.activityState='doing';}
      continue;
     }
     for(const side of [1,-1]){
      const sx=-dy/d*side,sy=dx/d*side;
      const around={x:p.x+sx*24,y:p.y+sy*24};
      if(segmentHitsDecoration(p,around)||!canTakeStep(p,residents,p.x+sx*step,p.y+sy*step,scheduled))continue;
      p.detour=around;
      break;
     }
    }
    p.wait=.16;p.onStairs=false;continue;
   }
   p.x=travel>=d?target.x:nx;p.y=travel>=d?target.y:ny;
   if(travel>=d&&p.detour)p.detour=null;
   else if(travel>=d){
    p.node=p.route.shift();p.onStairs=false;
    if(!p.route.length){
     p.wait=.16;
     if(scheduled){p.atVenue=true;p.activityState='doing';}
    }
   }
   recordWalk(p,dx,dy,travel,dt);
  }
 }
 if(scheduled)placeOutdoorResidents(residents);
 const available=p=>p&&!p.chat&&p.cooldown<=0&&!p.onStairs;
 function tryMeet(a,b){
  if(!available(a)||!available(b))return false;
  if(scheduled&&(!a.atVenue||!b.atVenue||!outdoorPlaces.has(a.schedulePlace)||a.schedulePlace!==b.schedulePlace))return false;
  const relationship=relationships.get(a.id);
  const appointment=scheduled&&relationship?.partner===b.id&&
   a.scheduleHour===relationship.hour&&a.schedulePlace===relationship.place;
  const nearby=scheduled?60:29;
  if(!appointment&&Math.hypot(a.x-b.x,a.y-b.y)>=nearby)return false;
  a.chat=b.chat=relationship?.partner===b.id?relationship.chatDuration:3.5;
  a.cooldown=b.cooldown=15;
  a.partner=b.id;
  b.partner=a.id;
  onMeet?.(a,b);
  return true;
 }
 for(const a of residents){
  const preferred=relationships.get(a.id)?.partner;
  if(preferred)tryMeet(a,residents.find(b=>b.id===preferred));
 }
 for(let i=0;i<residents.length;i++){
  const a=residents[i];
  if(!available(a))continue;
  for(let j=i+1;j<residents.length;j++)if(tryMeet(a,residents[j]))break;
 }
 for(const p of residents)p.cooldown=Math.max(0,(p.cooldown||0)-dt);
}
const api={people,nodes,edges,links,fountain,FOOT_RADIUS,decorations,collidesDecoration,segmentHitsDecoration,inFountain,segmentHitsFountain,isStairEdge,period,path,directions,directionFromDelta,freshResidents,tick,entranceNode,outdoorPlaces,outdoorStandingPositions,relationships,destinationFor,syncSchedule};
root.VillageModel=api;
})(globalThis);
