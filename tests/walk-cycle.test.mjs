import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.Image=class{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}addEventListener(){}};
await import('../app/src/main/assets/walk-loader.js');
const W=globalThis.WordvilleWalk;
const ids=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily'];
const directions=['down','right','left','up'];
test('walking uses eight timing slots without separating heads from bodies',()=>{
 assert.equal(W.frameCount,8);
 assert.equal(W.sourceFrameCount,3);
 assert.deepEqual(W.stride.map(p=>p.phase),['contact','down','passing','up','contact','down','passing','up']);
 assert.deepEqual(W.stride.map(p=>p.plant),['left','left','left','left','right','right','right','right']);
 for(const phase of W.stride)assert.ok([0,1,2].includes(phase.pose));
});
test('prebuilt per-character sheets use independent full 32x48 source cells',()=>{
 assert.deepEqual(W.frameSize,{width:32,height:48});
 assert.deepEqual(W.atlasSize,{width:256,height:2304});
 for(const id of ids){
  const unique=new Set();
  for(const direction of directions)for(let frame=0;frame<8;frame++){
   const cell=W.atlasCell(id,direction,frame);
   assert.ok(cell);assert.equal(cell.width,32);assert.equal(cell.height,48);
   assert.ok(cell.x>=0&&cell.x+32<=256);assert.ok(cell.y>=0&&cell.y+48<=2304);
   unique.add(cell.x+':'+cell.y);
  }
  assert.equal(unique.size,32);
 }
});
test('moving frames advance with traveled distance and idling stays stable',()=>{
 for(let k=0;k<16;k++){
  assert.equal(W.frameFor({walkDistance:k*W.stepDistance},true),k%8);
  assert.equal(W.frameFor({walkDistance:k*W.stepDistance},false),0);
 }
});
