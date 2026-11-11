import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../app/src/main/assets/venue-config.js';
const spec=globalThis.WordvilleVenueSpec;
const ids=Object.keys(spec.SIZES);

test('all 17 locations have a real tile collision map and usable entrance',()=>{
 assert.equal(ids.length,17);
 for(const id of ids){
  const m=spec.getMap(id);
  assert.equal(m.tiles.length,m.rows,id);
  assert.ok(m.tiles.every(row=>row.length===m.cols),id);
  assert.equal(m.tiles[m.door.y][m.door.x],'exit',id);
  assert.equal(spec.isBlocked(id,m.entrance.x,m.entrance.y),false,id);
  assert.ok(m.fixtures.length>0,id);
  for(const f of m.fixtures){
   assert.ok(f.x>=1&&f.y>=1&&f.x+f.w<=m.cols-1&&f.y+f.h<=m.rows-1,id+': '+f.label);
   for(let y=f.y;y<f.y+f.h;y++)for(let x=f.x;x<f.x+f.w;x++)
    assert.equal(spec.isBlocked(id,x,y),true,id+': '+f.kind+' '+x+','+y);
  }
 }
});
test('routes toward a corner are contiguous floor tiles and never cross furniture',()=>{
 for(const id of ids){
  const m=spec.getMap(id),end=spec.nearest(id,1,1),start=m.entrance;
  assert.ok(end,id+' nearest floor');
  const path=spec.route(id,start,end);
  assert.ok(path.length>0,id+' path should exist');
  let prev=start;
  for(const point of path){
   assert.equal(Math.abs(prev.x-point.x)+Math.abs(prev.y-point.y),1,id+' contiguous path');
   assert.equal(spec.isBlocked(id,point.x,point.y),false,id+' blocked waypoint');
   prev=point;
  }
  assert.deepEqual(prev,end,id+' path reaches goal');
 }
});
test('the 12 residents use an actual bundled source atlas rather than missing walk URLs',()=>{
 const png=readFileSync(new URL('../app/src/main/assets/portraits/wordville-walk-4phase.png',import.meta.url));
 assert.equal(png.subarray(1,4).toString(),'PNG');
 assert.equal(png.readUInt32BE(16),2560);
 assert.equal(png.readUInt32BE(20),768);
 const renderer=readFileSync(new URL('../app/src/main/assets/walk-loader.js',import.meta.url),'utf8');
 assert.ok(renderer.includes("spriteImage"),'runtime must use bundled atlas');
 assert.ok(!renderer.includes("img.src='walk/'+id+'.png'"),'do not try unshipped sprites');
});
