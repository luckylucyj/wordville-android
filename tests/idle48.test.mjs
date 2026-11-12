import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

globalThis.Image=class{
 constructor(){this.complete=true;this.naturalWidth=0;this.naturalHeight=0;this._src='';}
 set src(value){
  this._src=value;
  if(value.startsWith('idle48/')){this.naturalWidth=192;this.naturalHeight=384;}
  if(value.startsWith('walk48/')){this.naturalWidth=288;this.naturalHeight=384;}
 }
 get src(){return this._src;}
 addEventListener(){}
};
await import('../app/src/main/assets/walk-loader.js');
await import('../app/src/main/assets/walk48-loader.js');
const W=globalThis.WordvilleWalk;
const DIRS=['down','down-right','right','up-right','up','up-left','left','down-left'];
const IDS=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily'];

test('twelve separate standing sprite sheets keep 48x48 cells and identical ground anchor',()=>{
 assert.equal(W.idle48FrameCount,4);
 assert.deepEqual(W.idle48Phases,['neutral','inhale','sway','exhale']);
 assert.equal(W.anchorY,43);
 for(const id of IDS){
  const png=readFileSync(new URL('../app/src/main/assets/idle48/'+id+'.png',import.meta.url));
  assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(png.readUInt32BE(16),192);
  assert.equal(png.readUInt32BE(20),384);
  const coords=new Set();
  for(const direction of DIRS)for(let f=0;f<4;f++){
   const c=W.idle48Cell(id,direction,f);
   assert.deepEqual([c.x,c.y,c.width,c.height,c.anchorX,c.anchorY],
                    [f*48,DIRS.indexOf(direction)*48,48,48,24,43]);
   coords.add(c.x+','+c.y);
  }
  assert.equal(coords.size,32);
 }
});

test('idle postures leave both feet planted even when torso moves',()=>{
 const report=JSON.parse(readFileSync(new URL('../app/src/main/assets/idle48/audit.json',import.meta.url),'utf8'));
 assert.equal(report.total_frames,384);
 assert.equal(report.frames.length,384);
 assert.deepEqual(report.anchor,[24,43]);
 assert.equal(report.feet_fixed,true);
 for(const pose of report.frames){
  assert.deepEqual(pose.anchor,[24,43]);
  assert.deepEqual(pose.feet,report.foot_centers);
  assert.equal(pose.bbox[3],44);
 }
 for(let frame=0;frame<4;frame++)assert.equal(W.idle48Frame(frame*400,'alex'),frame);
});

test('scene rendering switches to idle sheet when resident is not moving',()=>{
 const draw=[];
 const ctx={
  save(){},restore(){},beginPath(){},ellipse(){},fill(){},
  drawImage(...args){draw.push(args);},
  set imageSmoothingEnabled(v){},set fillStyle(v){}
 };
 assert.equal(W.paint(ctx,{id:'alex',direction:'up'},100,150,{walking:false,idlePhase:2,width:48,height:48}),true);
 assert.equal(draw.length,1);
 assert.equal(draw[0][0].src,'idle48/alex.png');
 assert.deepEqual(draw[0].slice(1,5),[96,4*48,48,48]);
 draw.length=0;
 assert.equal(W.paint(ctx,{id:'alex',direction:'up'},100,150,{walking:true,phase:2,width:48,height:48}),true);
 assert.equal(draw[0][0].src,'walk48/alex.png');
 assert.deepEqual(draw[0].slice(1,5),[96,4*48,48,48]);
});
