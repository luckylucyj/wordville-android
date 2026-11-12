import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
globalThis.Image=class{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}addEventListener(){}};
await import('../app/src/main/assets/walk-loader.js');
await import('../app/src/main/assets/walk48-loader.js');
const W=globalThis.WordvilleWalk;
const DIRS=['down','down-right','right','up-right','up','up-left','left','down-left'];
const IDS=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily'];
test('12 sprites have 8 directions x 8 separate 48x48 frames',()=>{
 assert.deepEqual(W.frameSize,{width:48,height:48});
 assert.equal(W.frameCount,8);assert.equal(W.anchorY,43);assert.equal(W.fps,8);
 for(const id of IDS){
  const data=readFileSync(new URL('../app/src/main/assets/walk48/'+id+'.png',import.meta.url));
  assert.equal(data.subarray(1,4).toString(),'PNG');
  assert.equal(data.readUInt32BE(16),384);assert.equal(data.readUInt32BE(20),384);
  const coords=new Set();
  for(const direction of DIRS)for(let f=0;f<8;f++){
   const c=W.walk48Cell(id,direction,f);
   assert.deepEqual([c.x,c.y,c.width,c.height],[f*48,DIRS.indexOf(direction)*48,48,48]);
   assert.equal(c.anchorY,43);
   coords.add(c.x+','+c.y);
  }
  assert.equal(coords.size,64);
 }
});
test('two four-phase support-foot halves: contact, down, passing, up, 8FPS',()=>{
 assert.deepEqual(W.walk48Phases,['contact-left','down-left','passing-left','up-left','contact-right','down-right','passing-right','up-right']);
 for(let f=0;f<30;f++)assert.equal(W.frameFor({},true,f*125),f%8);
 assert.equal(W.frameFor({},false,10000),0);
});
test('distance-based animation stops foot slipping when movement is blocked',()=>{
 assert.equal(W.frameFor({walkDistance:0},true,9999),0);
 assert.equal(W.frameFor({walkDistance:W.stepDistance*4},true,1),4);
 assert.equal(W.frameFor({walkDistance:W.stepDistance*8},true,0),0);
});
test('directions include diagonals and mirrors',()=>{
 assert.equal(W.directionFromDelta(1,1),'down-right');
 assert.equal(W.directionFromDelta(-1,-1),'up-left');
 assert.equal(W.directionFromDelta(0,1),'down');
 assert.equal(W.directionFromDelta(0,-1),'up');
});

test('feet never cross the body centerline in any walk pose',()=>{
 const report=JSON.parse(readFileSync(new URL('../app/src/main/assets/walk48/audit.json',import.meta.url),'utf8'));
 assert.equal(report.no_crossing_feet,true);
 assert.equal(report.no_lateral_figure_eight,true);
 assert.equal(report.body_center_x,24);
 assert.equal(report.vertical_center_y,24);
 assert.equal(report.foot_anchor_y,43);
 assert.equal(report.total_frames,768);
 for(const lane of [report.front_foot_points,report.side_foot_points]){
  assert.equal(lane.length,8);
  for(let i=0;i<8;i++){
   const [left,right]=lane[i];
   assert.ok(left[0]<right[0],'left foot must stay left of right');
   assert.equal((i<4?left:right)[1],43,'stance foot must be planted');
   if(i>0){assert.equal(left[0],lane[0][0][0]);assert.equal(right[0],lane[0][1][0]);}
  }
 }
 for(const frame of report.frame_stats){
  const [x1,y1,x2,y2]=frame.bbox;
  assert.ok(Math.abs((x1+x2-1)/2-24)<=3);
  assert.ok(Math.abs((y1+y2-1)/2-24)<=3);
  assert.equal(y2,44);
 }
});

test('face source and lower-body gait agree for all eight directions',()=>{
 const report=JSON.parse(readFileSync(new URL('../app/src/main/assets/walk48/audit.json',import.meta.url),'utf8'));
 const mirrored={'up-left':'up-right',left:'right','down-left':'down-right'};
 const expectedSource={down:'down','down-right':'down',right:'right','up-right':'up',up:'up'};
 const expectedAxis={down:'front','down-right':'front',right:'side','up-right':'front',up:'front'};
 for(const frame of report.frame_stats){
  const orientation=mirrored[frame.direction]||frame.direction;
  assert.equal(frame.face_source,expectedSource[orientation]);
  assert.equal(frame.leg_axis,expectedAxis[orientation]);
 }
 assert.equal(report.frame_stats.length,768);
});
test('one direction determines the head, torso and shoe atlas row',()=>{
 assert.equal(W.directionForSprite({direction:'up',movementDirection:'down-right'},true),'down-right');
 assert.equal(W.directionForSprite({direction:'up',movementDirection:'down-right'},false),'up');
 assert.equal(W.walk48Cell('alex',W.directionForSprite({direction:'up',movementDirection:'down-right'},true),0).y,48);
});
