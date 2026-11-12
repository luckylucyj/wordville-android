import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

globalThis.Image=class {
 constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}
 addEventListener(){}
};
await import('../app/src/main/assets/walk-loader.js');
const W=globalThis.WordvilleWalk;
const directions=['down','right','left','up'];
test('cat and dog sources use native 32x48 frames in 4 directions and 4 phases',()=>{
 assert.deepEqual(W.petFrameSize,{width:32,height:48});
 assert.equal(W.petGroundY,44);
 for(const animal of ['cat','dog']){
  assert.ok(W.petSheets[animal].src.endsWith('pets/wordville-'+animal+'-source.png'));
  const png=readFileSync(new URL('../app/src/main/assets/pets/wordville-'+animal+'-source.png',import.meta.url));
  assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(png.readUInt32BE(16),128);
  assert.equal(png.readUInt32BE(20),192);
  assert.ok(png.length>3000,'sprite should retain image-derived pixel detail');
  const cells=new Set();
  for(const direction of directions)for(let phase=0;phase<4;phase++){
   const cell=W.petCell(animal,direction,phase);
   assert.equal(cell.width,32);
   assert.equal(cell.height,48);
   assert.equal(cell.groundY,44);
   assert.ok(cell.x>=0&&cell.x+cell.width<=128);
   assert.ok(cell.y>=0&&cell.y+cell.height<=192);
   cells.add(cell.x+':'+cell.y);
  }
  assert.equal(cells.size,16);
 }
});
test('pets advance four walking poses by actual travel distance; idle pose is stable',()=>{
 for(let i=0;i<16;i++)assert.equal(W.petFrame({walkDistance:i*3.5},true),i%4);
 assert.equal(W.petFrame({walkDistance:123},false),0);
});
test('unready and invalid pet sprite lookups are rejected',()=>{
 assert.equal(W.paintPet({}, {id:'other'},0,0),false);
 assert.equal(W.paintPet({}, {id:'cat'},0,0),false);
 assert.equal(W.petCell('other','right',0),null);
 assert.equal(W.petCell('dog','right',4),null);
});
