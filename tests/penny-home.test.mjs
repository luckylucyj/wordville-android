import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
globalThis.Image=class{set src(_value){}};
await import('../app/src/main/assets/penny-home.js');
await import('../app/src/main/assets/resident-homes.js');
await import('../app/src/main/assets/venue-config.js');
const home=globalThis.WordvillePennyHome;
const spec=globalThis.WordvilleVenueSpec;
test('Penny owns a 10-item furnished room and the original WebP is available',()=>{
 assert.equal(home.furniture.length,10);
 const image=readFileSync(new URL('../app/src/main/assets/art/penny-room.webp',import.meta.url));
 assert.equal(image.toString('ascii',0,4),'RIFF');
 assert.equal(image.toString('ascii',8,12),'WEBP');
 const m=spec.getMap('pennyHome');
 assert.equal(m.fixtures.length,10);
 assert.equal(m.cols,24);assert.equal(m.rows,18);
 assert.notDeepEqual(spec.getMap('alexHome').fixtures,m.fixtures);
});
test('Penny home exit and all 10 furniture edges stay reachable without clipping',()=>{
 const m=spec.getMap('pennyHome'),footprints=new Set();
 for(const f of m.fixtures){
  for(let y=f.y;y<f.y+f.h;y++)for(let x=f.x;x<f.x+f.w;x++){
   assert.ok(!footprints.has(x+','+y),'overlap near '+f.label);
   footprints.add(x+','+y);
   assert.ok(spec.isBlocked('pennyHome',x,y),f.label+' blocks footsteps');
  }
  const adjacent=spec.adjacentSpot('pennyHome',f,m.entrance);
  assert.ok(adjacent,f.label+' is approachable');
  assert.ok((m.entrance.x===adjacent.x&&m.entrance.y===adjacent.y)||spec.route('pennyHome',m.entrance,adjacent).length>0,f.label+' path from door');
 }
 assert.equal(spec.tile('pennyHome',m.door.x,m.door.y),'exit');
});
test('Penny original assets are all unique 896px transparent PNGs, not upscaled lossy room art',()=>{
 const unique=new Set();
 for(const f of home.furniture){
  assert.ok(f.asset&&f.crop,'each fixture references original furniture art');
  assert.ok(!unique.has(f.asset),'no sprite is reused');
  unique.add(f.asset);
  const png=readFileSync(new URL('../app/src/main/assets/art/furniture/'+f.asset,import.meta.url));
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),896);
  assert.equal(png.readUInt32BE(20),896);
 }
 assert.equal(unique.size,10);
 const placesSource=readFileSync(new URL('../app/src/main/assets/places.js',import.meta.url),'utf8');
 // Both Penny and the illustrated guest homes now use the shared hires buffer.
 assert.ok(placesSource.includes("const pennyHiRes=p.id==='home'&&homeOwner==='penny'"));
 assert.ok(placesSource.includes('const hires=pennyHiRes||referenceHiRes||venueV2;'));
 assert.ok(placesSource.includes('const targetWidth=hires?1024:512,targetHeight=hires?840:420;'));
});
