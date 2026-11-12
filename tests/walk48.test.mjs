
import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.Image=class{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}addEventListener(){}};
await import('../app/src/main/assets/walk-loader.js');
await import('../app/src/main/assets/walk48-loader.js');
const W=globalThis.WordvilleWalk;
const dirs=['down','down-right','right','up-right','up','up-left','left','down-left'];
const people=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily'];
test('sprite sheet coordinates for all 12 residents cover 8 dirs x 8 unique cells',()=>{
 assert.deepEqual(W.frameSize,{width:48,height:48});
 assert.equal(W.frameCount,8);assert.equal(W.anchorY,44);
 for(const id of people){
  const set=new Set();
  for(const dir of dirs)for(let frame=0;frame<8;frame++){
   const cell=W.walk48Cell(id,dir,frame);
   assert.deepEqual([cell.x,cell.y,cell.width,cell.height],[frame*48,dirs.indexOf(dir)*48,48,48]);
   assert.equal(cell.anchorY,44);
   set.add(cell.x+','+cell.y);
  }
  assert.equal(set.size,64);
 }
});
test('distance advances 8 distinct phases, idle resets to first',()=>{
 for(let i=0;i<24;i++){
  assert.equal(W.frameFor({walkDistance:i*W.stepDistance},true),i%8);
  assert.equal(W.frameFor({walkDistance:i*W.stepDistance},false),0);
 }
 assert.deepEqual(W.walk48Phases,['contact','down','passing','up','contact','down','passing','up']);
});
test('8-way direction mapping includes diagonal travel in world screen coordinates',()=>{
 assert.equal(W.directionFromDelta(1,1),'down-right');
 assert.equal(W.directionFromDelta(-1,-1),'up-left');
 assert.equal(W.directionFromDelta(0,1),'down');
 assert.equal(W.directionFromDelta(0,-1),'up');
});
