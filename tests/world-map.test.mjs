import test from 'node:test';
import assert from 'node:assert/strict';
import '../app/src/main/assets/world-art.js';
const world=globalThis.WordvilleWorldArt;
const expected=['sparrow','dog','cat','chicken','horse','hamster','rabbit','fox','wolf','bear'];
test('entire map has unique destinations for every registered venue',()=>{
 assert.equal(world.landmarks.length,17);
 assert.equal(new Set(world.landmarks.map(p=>p.id)).size,17);
 for(const p of world.landmarks){
  assert.ok(p.x>=30&&p.x<=570,p.id+' x');
  assert.ok(p.y>=0&&p.y<=1000,p.id+' y');
  assert.ok(p.name.length>0);
 }
});
test('all ten requested wild and domestic animal kinds are rendered',()=>{
 assert.deepEqual(world.wildlife.map(x=>x.kind),expected);
 for(const animal of world.wildlife){
  assert.ok(animal.x>=0&&animal.x<=600,animal.kind+' x');
  assert.ok(animal.y>=0&&animal.y<=1000,animal.kind+' y');
 }
});
