import test from 'node:test';
import assert from 'node:assert/strict';
import '../app/src/main/assets/village-model.js';
import '../app/src/main/assets/resident-homes.js';
import '../app/src/main/assets/venue-config.js';
globalThis.Image=class{set src(_value){}};
await import('../app/src/main/assets/penny-home.js');

const homes=globalThis.WordvilleHomes;
const spec=globalThis.WordvilleVenueSpec;

test('every resident has a distinct, fully navigable 24 × 18 home',()=>{
 const themes=new Set(),layouts=new Set();
 for(const {id} of globalThis.VillageModel.people){
  const room=homes.get(id),mapId=homes.mapId(id),map=spec.getMap(mapId);
  assert.ok(room,id);
  assert.deepEqual([map.cols,map.rows],[24,18],id);
  assert.ok(map.fixtures.length>=6,id);
  assert.ok(!spec.isBlocked(mapId,map.entrance.x,map.entrance.y),id);
  assert.deepEqual(spec.route(mapId,map.entrance,map.door),[map.door],id);
  const footprint=new Set(),reached=new Set();
  for(const fixture of map.fixtures){
   assert.ok(fixture.y>=homes.BACK_WALL_ROWS,id);
   for(let y=fixture.y;y<fixture.y+fixture.h;y++)for(let x=fixture.x;x<fixture.x+fixture.w;x++){
    const key=x+','+y;
    assert.ok(x>0&&x<map.cols-1&&y<map.rows-1,id+' fixture outside interior');
    assert.ok(!footprint.has(key),id+' overlapping furniture at '+key);
    assert.equal(spec.tile(mapId,x,y),fixture.kind,id+' furniture tile '+key);
    footprint.add(key);
   }
   assert.ok(spec.adjacentSpot(mapId,fixture,map.entrance),id+' inaccessible '+fixture.label);
  }
  const queue=[map.entrance];
  while(queue.length){
   const {x,y}=queue.pop(),key=x+','+y;
   if(reached.has(key)||spec.isBlocked(mapId,x,y))continue;
   reached.add(key);
   for(const [nx,ny] of spec.neighbors(x,y))queue.push({x:nx,y:ny});
  }
  for(let y=0;y<map.rows;y++)for(let x=0;x<map.cols;x++){
   if(y<homes.BACK_WALL_ROWS)assert.equal(spec.tile(mapId,x,y),'wall',id);
   if(!spec.isBlocked(mapId,x,y))assert.ok(reached.has(x+','+y),id+' unreachable floor '+x+','+y);
  }
  themes.add(room.theme[0]);
  layouts.add([...footprint].sort().join(';'));
 }
 assert.equal(themes.size,12);
 assert.equal(layouts.size,12);
});
