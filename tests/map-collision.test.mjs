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
  assert.ok(M.collidesDecoration(d.kind==='rect'?d.x+d.w/2:d.x,d.kind==='rect'?d.y+d.h/2:d.y,0),d.id);
 }
 assert.equal(M.collidesDecoration(300,300),false,'open pavement must remain passable');
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
