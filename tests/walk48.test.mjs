import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
globalThis.Image=class{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}addEventListener(){}};
await import('../app/src/main/assets/walk-loader.js');
await import('../app/src/main/assets/walk48-loader.js');
const W=globalThis.WordvilleWalk;
const DIRS=['down','down-right','right','up-right','up','up-left','left','down-left'];
const IDS=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily'];
test('12 sprites have 8 directions x 6 separate 48x48 frames',()=>{
 assert.deepEqual(W.frameSize,{width:48,height:48});
 assert.equal(W.frameCount,6);assert.equal(W.anchorY,43);assert.equal(W.fps,8);
 for(const id of IDS){
  const data=readFileSync(new URL('../app/src/main/assets/walk48/'+id+'.png',import.meta.url));
  assert.equal(data.subarray(1,4).toString(),'PNG');
  assert.equal(data.readUInt32BE(16),288);assert.equal(data.readUInt32BE(20),384);
  const coords=new Set();
  for(const direction of DIRS)for(let f=0;f<6;f++){
   const c=W.walk48Cell(id,direction,f);
   assert.deepEqual([c.x,c.y,c.width,c.height],[f*48,DIRS.indexOf(direction)*48,48,48]);
   assert.equal(c.anchorY,43);
   coords.add(c.x+','+c.y);
  }
  assert.equal(coords.size,48);
 }
});
test('two support-foot halves: contact, down, passing+up, 8FPS',()=>{
 assert.deepEqual(W.walk48Phases,['contact-left','down-left','passing-up-left','contact-right','down-right','passing-up-right']);
 for(let f=0;f<30;f++)assert.equal(W.frameFor({},true,f*125),f%6);
 assert.equal(W.frameFor({},false,10000),0);
});
test('directions include diagonals and mirrors',()=>{
 assert.equal(W.directionFromDelta(1,1),'down-right');
 assert.equal(W.directionFromDelta(-1,-1),'up-left');
 assert.equal(W.directionFromDelta(0,1),'down');
 assert.equal(W.directionFromDelta(0,-1),'up');
});
