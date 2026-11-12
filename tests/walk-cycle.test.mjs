import test from 'node:test';
import assert from 'node:assert/strict';
// The atlas is built in a browser; frame-state contracts can be tested in Node.
globalThis.Image=class {
 constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}
 addEventListener(){}
};
await import('../app/src/main/assets/walk-loader.js');
const W=globalThis.WordvilleWalk;
test('eight poses use four ordered gait states per alternating support foot',()=>{
 assert.equal(W.frameCount,8);
 assert.deepEqual(W.stride.map(p=>p.phase),['contact','down','passing','up','contact','down','passing','up']);
 assert.deepEqual(W.stride.map(p=>p.plant),['left','left','left','left','right','right','right','right']);
 assert.deepEqual(W.frameSize,{width:32,height:48});
 for(const p of W.stride){
  assert.ok([0,1,2].includes(p.pose));
  assert.ok([p.lx,p.ly,p.rx,p.ry,p.torso].every(Number.isInteger));
  assert.ok(Math.abs(p.lx)<=1&&Math.abs(p.rx)<=1);
  assert.equal(p.plant==='left'?p.ly:p.ry,0,'support shoe remains grounded');
 }
});
test('traveled distance drives all eight frames, stationary people hold neutral pose',()=>{
 assert.equal(W.fps,8);
 const spacing=W.stepDistance;
 for(let k=0;k<16;k++){
  const p={walkDistance:k*spacing};
  assert.equal(W.frameFor(p,true),k%8);
  assert.equal(W.frameFor(p,false),0);
 }
 assert.equal(W.frameFor({walkDistance:0},true),0);
});
