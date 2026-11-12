import test from 'node:test';
import assert from 'node:assert/strict';
import '../app/src/main/assets/venue-config.js';
import '../app/src/main/assets/pixel-map-style.js';

const style=globalThis.WordvillePixelStyle;
const spec=globalThis.WordvilleVenueSpec;

test('the entire village and all 18 destinations have one crisp pixel-art renderer',()=>{
 assert.equal(style.W,256);
 assert.equal(style.H,120);
 assert.deepEqual(Object.keys(style.themes).sort(),Object.keys(spec.SIZES).sort());
 assert.equal(Object.keys(style.themes).length,18,'17 public places + resident home');
 for(const [id,colors] of Object.entries(style.themes)){
  assert.equal(colors.length,6,id);
  assert.ok(colors.every(c=>/^#[0-9a-f]{6}$/i.test(c)),id);
 }
});

test('four light phases cover dawn, day, sunset and night',()=>{
 assert.equal(style.phaseFor('day',6*60),'dawn');
 assert.equal(style.phaseFor('day',12*60),'day');
 assert.equal(style.phaseFor('day',18*60),'sunset');
 assert.equal(style.phaseFor('night',12*60),'night');
 assert.equal(style.phaseFor('day',23*60),'day','manual day preview overrides the actual local time');
 for(const phase of ['dawn','day','sunset','night'])assert.equal(style.skyFor(phase).length,3);
});

test('each blocking fixture gets a visible rectangle in the authored collision tile',()=>{
 for(const id of Object.keys(spec.SIZES)){
  const map=spec.getMap(id);
  for(const f of map.fixtures){
   const r=style.getLogicalFixtureRect(id,f);
   assert.ok(r.w>0&&r.h>0,id+': '+f.kind);
   assert.ok(r.x>=0&&r.x+r.w<=style.W+1,id+': '+f.kind);
   assert.ok(r.y>=0&&r.y+r.h<=style.H+1,id+': '+f.kind);
   assert.equal(spec.isBlocked(id,f.x,f.y),true,id+': '+f.kind);
  }
 }
});

test('offline weather can be previewed without removing resident location geometry',()=>{
 for(const w of ['clear','clouds','overcast','rain']){
  assert.equal(style.setWeather(w),true);
  assert.equal(style.weather,w);
 }
 assert.equal(style.setWeather('invalid'),false);
 assert.equal(style.weather,'rain');
 assert.equal(style.setWeather('clear'),true);
});
