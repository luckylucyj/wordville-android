import test from 'node:test';
import assert from 'node:assert/strict';
import '../app/src/main/assets/village-model.js';
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
