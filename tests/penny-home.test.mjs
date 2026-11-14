import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
globalThis.Image=class{set src(_value){}};
await import('../app/src/main/assets/penny-home.js');
await import('../app/src/main/assets/venue-config.js');
const home=globalThis.WordvillePennyHome;
const spec=globalThis.WordvilleVenueSpec;
test('Penny owns a separate 10-item furnished room with a bundled WebP scene',()=>{
 assert.equal(home.furniture.length,10);
 const image=readFileSync(new URL('../app/src/main/assets/art/penny-room.webp',import.meta.url));
 assert.equal(image.toString('ascii',0,4),'RIFF');
 assert.equal(image.toString('ascii',8,12),'WEBP');
 const m=spec.getMap('pennyHome');
 assert.equal(m.fixtures.length,10);
 assert.equal(m.cols,24);assert.equal(m.rows,18);
 assert.equal(spec.getMap('home').fixtures.length,5,'other homes keep the old floor plan');
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
test('Penny shortcut and private collision map are wired into the existing venue',()=>{
 const p=readFileSync(new URL('../app/src/main/assets/places.js',import.meta.url),'utf8');
 const r=readFileSync(new URL('../app/src/main/assets/venue-runtime.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../app/src/main/assets/index.html',import.meta.url),'utf8');
 assert.ok(page.includes('src="penny-home.js"'));
 assert.ok(p.includes('페니의 집')&&p.includes("focusResident?.('penny')"));
 assert.ok(r.includes("?'pennyHome':scene"));
 assert.ok(r.includes('places.redraw?.()'));
});
