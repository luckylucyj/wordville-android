import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.Image=class {
 constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}
 addEventListener(){}
};
await import('../app/src/main/assets/walk-loader.js');
const W=globalThis.WordvilleWalk;
const ids=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily'];
const directions=['down','right','left','up'];
test('the gait is contact/down/passing/up twice with opposite support feet',()=>{
 assert.equal(W.frameCount,8);
 assert.deepEqual(W.stride.map(p=>p.phase),['contact','down','passing','up','contact','down','passing','up']);
 assert.deepEqual(W.stride.map(p=>p.plant),['left','left','left','left','right','right','right','right']);
 assert.deepEqual(W.stride.slice(0,4).map(p=>p.pose),[1,1,0,2]);
 assert.deepEqual(W.stride.slice(4).map(p=>p.pose),[2,2,0,1]);
 for(const p of W.stride){
  assert.ok([0,1,2].includes(p.pose));
  assert.ok([p.lx,p.ly,p.rx,p.ry,p.torso].every(Number.isInteger));
  assert.ok(Math.abs(p.lx)<=1&&Math.abs(p.rx)<=1);
  assert.equal(p.plant==='left'?p.ly:p.ry,0);
 }
});
test('all 384 resident/direction/frame cells are unique and within the atlas',()=>{
 assert.deepEqual(W.frameSize,{width:32,height:48});
 assert.deepEqual(W.atlasSize,{width:256,height:2304});
 const rectangles=new Set();
 for(const id of ids)for(const direction of directions)for(let f=0;f<8;f++){
  const box=W.atlasCell(id,direction,f);
  assert.ok(box,'missing '+id+' '+direction+' '+f);
  assert.equal(box.width,32);assert.equal(box.height,48);
  assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=256&&box.y+box.height<=2304);
  const key=[box.x,box.y].join(':');assert.ok(!rectangles.has(key),'duplicate '+key);rectangles.add(key);
 }
 assert.equal(rectangles.size,384);
 assert.equal(W.atlasCell('unknown','down',0),null);
 assert.equal(W.atlasCell('alex','down',8),null);
});
test('ground normalization uses bounded whole pixels',()=>{
 assert.equal(W.groundY,46);
 for(const ground of [44,45,46,47,48]){
  const offset=W.alignForGroundRow(ground);
  assert.ok(Number.isInteger(offset)&&Math.abs(offset)<=2);
 }
 assert.equal(W.alignForGroundRow(46),0);
 assert.equal(W.alignForGroundRow(44),2);
 assert.equal(W.alignForGroundRow(48),-2);
});
test('walking advances by traveled distance, with a stable stationary frame',()=>{
 assert.equal(W.fps,8);
 const spacing=W.stepDistance;
 for(let k=0;k<24;k++){
  assert.equal(W.frameFor({walkDistance:k*spacing},true),k%8);
  assert.equal(W.frameFor({walkDistance:k*spacing},false),0);
 }
});
