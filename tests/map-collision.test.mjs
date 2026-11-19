import test from 'node:test';
import assert from 'node:assert/strict';
import '../app/src/main/assets/resident-schedule.js';
import '../app/src/main/assets/village-model.js';
import '../app/src/main/assets/hub-map.js';

const M=globalThis.VillageModel,H=globalThis.WordvilleHubMap;
test('every drawn ground decoration has a named foot collision area',()=>{
 assert.ok(M.decorations.length>=20);
 assert.equal(H.collision,M.decorations);
 assert.ok(M.decorations.some(d=>d.id==='fountain'));
 for(const d of M.decorations){
  if(d.kind==='polygon'){
   for(const [x,y] of d.points)assert.ok(M.collidesDecoration(x,y,0),d.id);
   continue;
  }
  assert.ok(M.collidesDecoration(d.kind==='rect'?d.x+d.w/2:d.x,d.kind==='rect'?d.y+d.h/2:d.y,0),d.id);
 }
 assert.equal(M.collidesDecoration(300,300),false,'open pavement must remain passable');
});
test('garden hedges block residents while the adjacent paved lanes stay open',()=>{
 for(const [x,y] of [[120,620],[480,620],[196,324],[404,324],[102,560],[498,560]])
  assert.ok(M.collidesDecoration(x,y),`${x},${y} is inside a garden bed`);
 assert.equal(M.collidesDecoration(246,620,0),false);
 assert.equal(M.collidesDecoration(246,620),true,'clearance applies beyond the garden edge');
 for(const [x,y] of [[180,542],[300,544],[420,542],[300,356]])
  assert.equal(M.collidesDecoration(x,y),false,`${x},${y} is on pavement`);
});
test('outside venues can place all residents on distinct paved positions',()=>{
 for(let parkCount=0;parkCount<=M.people.length;parkCount++){
  const residents=M.freshResidents().map((p,i)=>({...p,atVenue:true,schedulePlace:i<parkCount?'park':'square'}));
  const spots=M.outdoorStandingPositions(residents);
  assert.equal(spots.size,residents.length);
  assert.equal(new Set(spots.values()).size,spots.size,'park and square share no slot');
  for(const [id,{x,y}] of spots)assert.equal(M.collidesDecoration(x,y),false,id);
 }
});
test('evening park and square residents walk in separated, collision-free spots',()=>{
 const residents=M.freshResidents(),minuteOfDay=18*60;
 M.syncSchedule(residents,minuteOfDay,{teleport:true});
 const outside=residents.filter(p=>M.outdoorPlaces.has(p.schedulePlace));
 const moved=new Set();
 for(let i=0;i<250;i++){
  M.tick(residents,.1,undefined,{minuteOfDay});
  for(const p of outside){
   assert.equal(M.collidesDecoration(p.x,p.y),false,p.id);
   if(p.isMoving)moved.add(p.id);
   for(const other of outside){
    if(p!==other)assert.ok(Math.hypot(p.x-other.x,p.y-other.y)>=37,`${p.id} and ${other.id}`);
   }
  }
 }
 assert.equal(moved.size,outside.length);
});
test('all authored walking routes avoid decoration collision with foot clearance',()=>{
 for(const [i,n] of M.nodes.entries()){
  assert.equal(M.collidesDecoration(n.x,n.y),false,'node '+i+' is inside a decoration');
 }
 for(const [a,b] of M.links){
  assert.equal(M.segmentHitsDecoration(M.nodes[a],M.nodes[b]),false,'route '+a+'-'+b+' clips decoration');
 }
 for(let a=0;a<M.nodes.length;a++)for(let b=0;b<M.nodes.length;b++)
  assert.equal(M.path(a,b).at(-1),b,'route connectivity '+a+'->'+b);
});
test('residents remain outside all scenery while wandering and on a scheduled trip',()=>{
 const people=M.freshResidents();
 for(let i=0;i<6000;i++){
  M.tick(people,.1);
  for(const p of people)assert.equal(M.collidesDecoration(p.x,p.y),false,p.id);
 }
 const hour=10*60,scheduled=M.freshResidents();
 M.syncSchedule(scheduled,hour,{teleport:true});
 M.syncSchedule(scheduled,hour+60);
 for(let i=0;i<2000;i++){
  M.tick(scheduled,.1,undefined,{minuteOfDay:hour+60});
  for(const p of scheduled)assert.equal(M.collidesDecoration(p.x,p.y),false,p.id+' scheduled trip');
 }
});
