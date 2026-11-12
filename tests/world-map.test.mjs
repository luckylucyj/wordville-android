import test from 'node:test';
import assert from 'node:assert/strict';
import '../app/src/main/assets/hub-map.js';
import '../app/src/main/assets/world-art.js';
const world=globalThis.WordvilleWorldArt;
const expected=['sparrow','dog','cat','chicken','horse','hamster','rabbit','fox','wolf','bear'];
test('entire map has unique destinations for every registered venue',()=>{
 assert.equal(world.landmarks.length,17);
 assert.equal(new Set(world.landmarks.map(p=>p.id)).size,17);
 for(const p of world.landmarks){
  assert.ok(p.x>=30&&p.x<=570,p.id+' x');
  assert.ok(p.y>=0&&p.y<=800,p.id+' y');
  assert.ok(p.name.length>0);
 }
});
test('all ten requested wild and domestic animal kinds are registered',()=>{
 assert.deepEqual(world.wildlife.map(x=>x.kind),expected);
 for(const animal of world.wildlife){
  assert.ok(animal.x>=0&&animal.x<=600,animal.kind+' x');
  assert.ok(animal.y>=0&&animal.y<=1000,animal.kind+' y');
 }
});

import {statSync} from 'node:fs';
const artNames=['town-reference',...world.landmarks.map(s=>s.id)];
test('all 18 original reference art assets are present',()=>{for(const id of artNames){const file=new URL('../app/src/main/assets/art/'+id+'.webp',import.meta.url);assert.ok(statSync(file).size>50000,id);}});

test('hub map has limited landmark density and no painted background people',()=>{
 assert.ok(globalThis.WordvilleHubMap);
 assert.equal(globalThis.WordvilleHubMap.humanDecorations,0);
 assert.ok(globalThis.WordvilleHubMap.landmarks.length<=5);
});

// Background used for the compact hub is rendered as one 600x800 scene.
test('compact garden hub artwork is bundled',()=>{assert.ok(statSync(new URL('../app/src/main/assets/art/hub-garden.webp',import.meta.url)).size>100000);});
