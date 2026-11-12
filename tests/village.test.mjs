import test from 'node:test';
import assert from 'node:assert/strict';
import '../app/src/main/assets/resident-schedule.js';
import '../app/src/main/assets/village-model.js';
const S=globalThis.WordvilleSchedule;
const M=globalThis.VillageModel;
test('twelve named unique residents',()=>{assert.equal(M.people.length,12);assert.equal(new Set(M.people.map(p=>p.id)).size,12);assert.deepEqual(M.people.map(p=>p.name),['알렉스','엘리엇','하비','샘','세바스찬','셰인','헤일리','레아','마루','페니','애비게일','에밀리']);});
test('device clock phase boundaries',()=>{for(const [hour,phase] of [[0,'night'],[5,'night'],[6,'day'],[17,'day'],[18,'dusk'],[19,'dusk'],[20,'night'],[23,'night']])assert.equal(M.period(hour),phase);});
test('routes stay on connected walkways',()=>{for(let a=0;a<M.nodes.length;a++)for(let b=0;b<M.nodes.length;b++){const path=M.path(a,b);assert.equal(path.at(-1),b);for(let i=1;i<path.length;i++)assert.ok(M.edges[path[i-1]].includes(path[i]));}});
test('residents move, meet and resume after conversations',()=>{const ps=M.freshResidents(),initial=ps.map(p=>[p.x,p.y]);let meets=0;for(let i=0;i<2000;i++)M.tick(ps,.1,()=>meets++);assert.ok(meets>2);assert.ok(ps.some((p,i)=>p.x!==initial[i][0]||p.y!==initial[i][1]));for(const p of ps){assert.ok(p.x>=135&&p.x<=465);assert.ok(p.y>=200&&p.y<=800);assert.ok(Number.isFinite(p.x));}});

test('all navigation edges and points avoid fountain stone and water',()=>{
 assert.equal(M.nodes.length,19);
 for(const [a,b] of M.links){
  assert.ok(!M.inFountain(M.nodes[a].x,M.nodes[a].y),'node '+a);
  assert.ok(!M.inFountain(M.nodes[b].x,M.nodes[b].y),'node '+b);
  assert.ok(!M.segmentHitsFountain(M.nodes[a],M.nodes[b]),'edge '+a+'-'+b+' hits fountain');
 }
 for(let a=0;a<M.nodes.length;a++)for(let b=0;b<M.nodes.length;b++)assert.equal(M.path(a,b).at(-1),b);
});
test('stairs are connected and traversed with an active staircase motion flag',()=>{
 assert.equal(M.isStairEdge(7,8),true);
 assert.equal(M.isStairEdge(8,9),true);
 const ps=M.freshResidents(),p=ps[0];
 p.x=M.nodes[9].x;p.y=M.nodes[9].y;p.node=9;p.route=[8,7];p.wait=0;
 let sawStair=false;
 for(let k=0;k<60;k++){M.tick([p],.1);sawStair ||= p.onStairs;assert.ok(!M.inFountain(p.x,p.y));}
 assert.ok(sawStair);
});
test('simulated village residents never cross fountain',()=>{
 const ps=M.freshResidents();
 for(let i=0;i<6000;i++){M.tick(ps,.1);for(const p of ps)assert.ok(!M.inFountain(p.x,p.y),p.id);}
});


test('one visual facing direction remains locked across a straight walking segment',()=>{
 const p=M.freshResidents()[0]; // starts at node 0
 p.route=[2,13];p.wait=0;p.chat=0;p.direction='down';
 assert.equal(M.directionFromDelta(1,0),'right');
 assert.equal(M.directionFromDelta(0,-1),'up');
 assert.equal(M.directionFromDelta(-1,1),'down-left');
 for(let frame=0;frame<40;frame++){
  const previous={x:p.x,y:p.y};
  M.tick([p],.1);
  assert.equal(p.direction,'right','the entire node-0 to node-2 leg faces right');
  assert.equal(p.isMoving,true);
  assert.ok(p.x>previous.x);
 }
 // The same resident turns only when walking the next path leg.
 p.x=M.nodes[2].x;p.y=M.nodes[2].y;p.node=2;p.route=[13];p.wait=0;
 M.tick([p],.1);
 assert.equal(p.direction,'up');
 assert.equal(p.isMoving,true);
 assert.ok(p.y<M.nodes[2].y);
});

test('standing, chatting and blocked residents retain their last facing and stop walking',()=>{
 const p=M.freshResidents()[0];
 p.direction='up';p.route=[2];p.wait=2;
 M.tick([p],.1);
 assert.equal(p.direction,'up');assert.equal(p.isMoving,false);
 p.wait=0;p.chat=2;
 M.tick([p],.1);
 assert.equal(p.direction,'up');assert.equal(p.isMoving,false);
 p.chat=0;
 // One resident is placed at the very next intended movement position.
 const blocker={...M.freshResidents()[1],x:p.x+1.8,y:p.y-.18,wait:100,route:[]};
 M.tick([p,blocker],.1);
 assert.equal(p.isMoving,false);
 assert.equal(p.direction,'up','collision must not rotate a stationary resident');
 assert.equal(p.wait,.16);
});


test('heading, face and actual walking vector stay identical for every moving resident',()=>{
 const ps=M.freshResidents();
 let verified=0,turns=0;
 const history=new Map(ps.map(p=>[p.id,p.direction]));
 for(let i=0;i<1800;i++){
  const old=ps.map(p=>({x:p.x,y:p.y,direction:p.direction}));
  M.tick(ps,.1);
  ps.forEach((p,j)=>{
   if(!p.isMoving)return;
   const dx=p.x-old[j].x,dy=p.y-old[j].y;
   assert.ok(Math.hypot(dx,dy)>0,p.id+' must move to animate');
   const expected=M.directionFromDelta(dx,dy,p.direction);
   assert.equal(p.direction,expected,p.id+' facing vs movement vector');
   assert.equal(p.facing,p.direction,p.id+' head direction');
   assert.equal(p.movementDirection,p.direction,p.id+' foot direction');
   if(history.get(p.id)!==p.direction)turns++;
   history.set(p.id,p.direction);
   verified++;
  });
 }
 assert.ok(verified>50,'walking positions must be exercised');
 assert.ok(turns>2,'turning between path segments must be exercised');
});


test('all 12 villagers have complete 00:00–24:00 schedules at 1-hour resolution',()=>{
 const ids=M.people.map(p=>p.id);
 assert.deepEqual(Object.keys(S.BLOCKS).sort(),ids.slice().sort());
 const coveredPlaces=new Set();
 for(const id of ids){
  const all=S.day(id);
  assert.equal(all.length,24,id);
  assert.equal(all[0].hour,0);
  assert.equal(all[23].hour,23);
  assert.deepEqual(S.at(id,24*60),S.at(id,0),'24:00 rolls over to 00:00');
  const distinctActions=new Set(),distinctPlaces=new Set();
  for(let hour=0;hour<24;hour++){
   const row=all[hour];assert.equal(row.hour,hour);
   assert.ok(S.PLACE_NAMES[row.place],id+' '+hour+' place is known');
   assert.ok(row.activity.length>=2&&row.activity.length<=36,id+' '+hour+' actionable label');
   distinctPlaces.add(row.place);coveredPlaces.add(row.place);
   distinctActions.add(row.activity);
  }
  assert.ok(distinctPlaces.size>=4,id+' visits multiple distinct venues');
  assert.ok(distinctActions.size>=6,id+' has concrete varied behaviors');
 }
 for(const place of Object.keys(S.PLACE_NAMES))assert.ok(coveredPlaces.has(place),place+' never receives a visit');
 assert.equal(S.hourOf(1439),23);
 assert.equal(S.hourOf(1440),0);
 assert.equal(S.hourOf(-1),23);
 assert.equal(S.formatHour(24),'24:00');
});
test('time-dependent residents travel to destination node and perform the right task',()=>{
 const minute=7*60;
 const ps=M.freshResidents();
 M.syncSchedule(ps,minute,{teleport:true});
 const alex=ps.find(p=>p.id==='alex'),eli=ps.find(p=>p.id==='elliott');
 assert.equal(alex.schedulePlace,'gym');
 assert.equal(alex.activity,'근력 운동');
 assert.equal(alex.node,M.entranceNode.gym);
 assert.equal(alex.atVenue,true);
 assert.equal(alex.activityState,'doing');
 assert.equal(eli.schedulePlace,'cafe');
 const p=alex;
 M.syncSchedule([p],10*60);
 assert.equal(p.schedulePlace,'park');assert.equal(p.atVenue,false);
 assert.ok(p.route.length>0,'should actually walk rather than teleport');
 let movements=0;
 for(let frame=0;frame<4000&&p.route.length;frame++){
  const x=p.x,y=p.y;
  M.tick([p],.1,undefined,{minuteOfDay:10*60});
  if(p.x!==x||p.y!==y)movements++;
  assert.ok(!M.inFountain(p.x,p.y),'route must avoid fountain');
  if(p.isMoving){
   assert.equal(p.facing,p.movementDirection);
   assert.equal(p.direction,p.movementDirection);
  }
 }
 assert.ok(movements>0);
 assert.equal(p.node,M.entranceNode.park);
 assert.equal(p.atVenue,true);assert.equal(p.activityState,'doing');
});
test('residents are at home when sleeping and in the correct venue when clock is previewed',()=>{
 for(const person of M.people){
  const p=M.freshResidents().find(x=>x.id===person.id);
  for(let hour=0;hour<24;hour++){
   M.syncSchedule([p],hour*60,{teleport:true});
   const slot=S.at(person.id,hour*60);
   assert.equal(p.activity,slot.activity);
   assert.equal(p.schedulePlace,slot.place);
   assert.equal(p.node,M.destinationFor(p,slot.place));
   assert.equal(p.route.length,0);
   assert.equal(p.atVenue,true);
  }
 }
 assert.equal(S.at('alex',23*60).place,'home');
 assert.equal(S.at('sam',17*60).place,'square');
 assert.equal(S.at('harvey',14*60).place,'clinic');
});
test('editing any one hour updates the timetable and can be restored without changing others',()=>{
 const id='alex',hour=8,original=S.at(id,hour*60),adjacent=S.at(id,9*60);
 const saved=S.setHour(id,hour,'museum','전시 관찰');
 assert.equal(typeof saved,'boolean');
 assert.equal(S.at(id,hour*60).place,'museum');
 assert.equal(S.at(id,hour*60).activity,'전시 관찰');
 assert.equal(S.at(id,9*60).activity,adjacent.activity);
 assert.ok(S.occupants('museum',hour*60).includes(id));
 S.resetHour(id,hour);
 assert.equal(S.at(id,hour*60).activity,original.activity);
 assert.equal(S.at(id,hour*60).place,original.place);
 assert.throws(()=>S.setHour(id,24,'home','잠자기'));
 assert.throws(()=>S.setHour(id,8,'invalid','잠자기'));
 assert.throws(()=>S.setHour(id,8,'home',''));
});
