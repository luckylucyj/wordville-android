import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

class FakeImage{
 constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;this._src='';}
 addEventListener(){}
 set src(value){
  this._src=value;
  if(value.startsWith('action64/')){
   this.complete=true;this.naturalWidth=512;this.naturalHeight=512;
  }
 }
 get src(){return this._src;}
}
globalThis.Image=FakeImage;
await import('../app/src/main/assets/walk-loader.js');
await import('../app/src/main/assets/walk48-loader.js');
const priorPaint=globalThis.WordvilleWalk.paint;
await import('../app/src/main/assets/alex64-loader.js');
const A=globalThis.WordvilleAlex64,W=globalThis.WordvilleWalk;

const mockContext=()=>{
 const calls=[];
 return {calls,save(){},restore(){},beginPath(){},ellipse(){},fill(){},
  drawImage(...args){calls.push(args);}};
};

test('Alex has four 64px 8-direction x 8-frame PNG atlases',()=>{
 assert.deepEqual(A.actions,['walk','idle','talk','sit']);
 assert.equal(A.cell,64);assert.equal(A.groundY,60);assert.equal(A.frameCount,8);
 for(const action of A.actions){
  const png=readFileSync(new URL(`../app/src/main/assets/action64/alex_${action}.png`,import.meta.url));
  assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(png.readUInt32BE(16),512);
  assert.equal(png.readUInt32BE(20),512);
  const unique=new Set();
  for(const direction of A.directions)for(let f=0;f<8;f++){
   const cell=A.cellFor(action,direction,f);
   assert.deepEqual([cell.x,cell.y,cell.width,cell.height,cell.anchorY],
    [f*64,A.directions.indexOf(direction)*64,64,64,60]);
   unique.add(`${cell.x},${cell.y}`);
  }
  assert.equal(unique.size,64);
 }
});

test('all painted frames keep a fixed foot baseline and stable head axis',()=>{
 const audit=JSON.parse(readFileSync(new URL('../app/src/main/assets/action64/audit.json',import.meta.url)));
 assert.equal(audit.foot_anchor_y,60);
 for(const action of A.actions){
  assert.equal(audit.actions[action].length,64);
  for(const direction of A.directions){
   const poses=audit.actions[action].filter(e=>e.direction===direction);
   const heads=poses.map(e=>e.head_axis);
   assert.ok(Math.max(...heads)-Math.min(...heads)<=1,
    `${action}/${direction}: head drifts`);
   for(const frame of poses){
    assert.equal(frame.bbox[3],60,`${action}/${direction}/${frame.frame}: feet drift`);
    assert.ok(Math.abs(frame.head_axis-32)<=1);
   }
  }
 }
});

test('side walk alternates which leg reaches forward without promoting layer 2',()=>{
 const audit=JSON.parse(readFileSync(new URL('../app/src/main/assets/action64/audit.json',import.meta.url)));
 const contrast=audit.side_gait_right_minus_left;
 assert.equal(contrast.length,8);
 assert.ok(contrast[0]>5,'first stride places the brighter layer-1 boot ahead');
 for(const phase of [4,5,6]){
  assert.ok(contrast[phase]<-8,
   `stride ${phase+1} must show the darker layer-2 boot advancing in back`);
 }
});

test('Alex uses the 64px action image and ground-anchored draw destination',()=>{
 const ctx=mockContext(),p={id:'alex',direction:'down',walkDistance:0};
 const result=W.paint(ctx,p,120,240,{width:64,height:64,walking:false,action:'talk',phase:4});
 assert.equal(result,true);
 assert.equal(ctx.calls.length,1);
 const [im,sx,sy,sw,sh,x,y,w,h]=ctx.calls[0];
 assert.equal(im.src,'action64/alex_talk.png');
 assert.deepEqual([sx,sy,sw,sh,x,y,w,h],[4*64,0,64,64,88,180,64,64]);
});

test('walking action takes precedence and stays distance-synchronized',()=>{
 const p={id:'alex',direction:'up',movementDirection:'right',walkDistance:W.stepDistance*3};
 const ctx=mockContext();
 assert.equal(A.selectAction(p,{walking:true,action:'sit'}),'walk');
 W.paint(ctx,p,60,90,{walking:true,width:64,height:64});
 assert.equal(ctx.calls[0][0].src,'action64/alex_walk.png');
 assert.deepEqual(ctx.calls[0].slice(1,3),[3*64,2*64]);
});

test('sitting transitions once and holds frame eight until the next action',()=>{
 const p={id:'alex',direction:'right'},ctx=mockContext();
 assert.equal(A.frameFor(p,'sit',1000),0);
 assert.equal(A.frameFor(p,'sit',1150),1);
 assert.equal(A.frameFor(p,'sit',2200),7);
 assert.equal(A.frameFor(p,'sit',8000),7);
 W.paint(ctx,p,60,90,{action:'idle',timestampMs:8100});
 assert.equal(A.frameFor(p,'sit',8200),0);
});

test('other villagers retain the existing 48px renderer',()=>{
 const p={id:'sam',direction:'down'};
 const ctx=mockContext();
 assert.equal(W.paint(ctx,p,10,20,{width:48,height:48,walking:false}),
  priorPaint(ctx,p,10,20,{width:48,height:48,walking:false}));
 assert.equal(ctx.calls.length,0,'Unloaded old sprite stays in the original fallback path');
});
