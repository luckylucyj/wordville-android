import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
await import('../app/src/main/assets/wordville-music.js');
const M=globalThis.WordvilleTownMusic;
test('each sunny Town time window selects its authored MP3',()=>{
 for(const [hour,expected] of [[0,'night'],[5,'night'],[6,'morning'],[10,'morning'],[11,'noon'],[16,'noon'],[17,'evening'],[19,'evening'],[20,'night'],[23,'night'],[24,'night']]){
  assert.equal(M.resolveTrack(hour,'clear'),M.TRACKS[expected],String(hour));
 }
});
test('clouds, overcast and rain take priority over hour; wind remains sunny',()=>{
 for(const weather of ['clouds','overcast','rain']){
  for(const hour of [0,7,12,18,23])assert.equal(M.resolveTrack(hour,weather),M.TRACKS.cloudy);
 }
 assert.equal(M.resolveTrack(7,'wind'),M.TRACKS.morning);
});
test('all five filenames are exact and the player does not start automatically',()=>{
 assert.deepEqual(Object.values(M.TRACKS).sort(),[
 'audio/01_morning_sunny.mp3','audio/02_noon_sunny.mp3',
 'audio/03_evening_sunny.mp3','audio/04_night_clear.mp3',
 'audio/05_cloudy.mp3'
 ].sort());
 assert.equal(M.enabled,false);
 const html=readFileSync(new URL('../app/src/main/assets/index.html',import.meta.url),'utf8');
 assert.match(html,/wordville-music\.js/);
 assert.match(html,/wordville-music\.css/);
});
