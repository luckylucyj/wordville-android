import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const store=new Map();
globalThis.localStorage={
 getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,String(value))
};
await import('../app/src/main/assets/resident-schedule.js');
await import('../app/src/main/assets/village-model.js');
await import('../app/src/main/assets/wordville-schedule-locale.js');
await import('../app/src/main/assets/wordville-social.js');
const L=globalThis.WordvilleScheduleLocale;
const S=globalThis.WordvilleSocial;

test('all 22 residents have distinct editable app birthdays and local status',()=>{
 assert.equal(S.residents.length,22);
 assert.equal(S.phrases.length,22);
 assert.equal(new Set(S.phrases.map(row=>row[0])).size,22);
 for(const p of S.residents){
  assert.match(S.birthday(p.id),/^\d{2}-\d{2}$/);
  const state=S.status(p.id,new Date('2026-11-20T15:00:00'));
  assert.ok(state.mood.length===4,p.id);
  assert.ok(state.affinity>=0&&state.affinity<=100,p.id);
  assert.ok(Array.isArray(state.plan),p.id);
 }
 assert.equal(S.updateBirthday('chiikawa','2000-02-29'),true);
 assert.equal(S.birthday('chiikawa'),'02-29');
 assert.equal(S.updateBirthday('chiikawa','2001-02-29'),false);
 assert.equal(S.updateBirthday('no-such-resident','2000-01-01'),false);
});

test('daily authored bulletin board includes real IDs and examples, never live social data',()=>{
 const day=new Date('2026-11-20T12:00:00');
 const recent=S.posts(day),all=S.posts(day,true);
 assert.equal(recent.length,8);
 assert.equal(all.length,22);
 assert.equal(new Set(all.map(p=>p[0])).size,22);
 assert.deepEqual(recent,S.posts(day));
 for(const row of all){
  assert.equal(row.length,7);
  assert.match(row[2],/[a-z]/i);
  assert.ok(row.slice(3).every(v=>typeof v==='string'&&v.length>5));
 }
});

test('affinity updates on deliberate conversations, and meetings appear in both residents history',()=>{
 const before=S.affection('hachiware');
 const result=S.hello('hachiware');
 assert.equal(result.added,2);
 assert.equal(S.affection('hachiware'),before+2);
 const date=S.today();
 assert.ok(S.status('hachiware').talks.some(e=>e.date===date&&e.type==='player'));
 S.meeting('chiikawa','hachiware','Hello, Hachiware!','안녕, 하치와레!');
 assert.ok(S.status('chiikawa').talks.some(e=>e.other==='hachiware'));
 assert.ok(S.status('hachiware').talks.some(e=>e.other==='chiikawa'));
});

test('schedule locale never mutates the underlying Korean routine data',()=>{
 const original=globalThis.WordvilleSchedule.at('chiikawa',6*60);
 assert.equal(original.activity,'제초 5급 시험 공부');
 assert.equal(L.place('square','en'),'Town square');
 assert.equal(L.place('square','zh-CN'),'村庄广场');
 assert.equal(L.place('square','ja'),'村の広場');
 assert.equal(L.knownAction(original.activity,'en'),'Study for the weeding exam');
 assert.equal(L.knownAction(original.activity,'zh-CN'),'备考除草五级考试');
 assert.equal(L.knownAction(original.activity,'ja'),'草むしり検定5級の勉強');
 assert.equal(globalThis.WordvilleSchedule.at('chiikawa',360).activity,'제초 5급 시험 공부');
});

test('town event hooks support write pose and social board interactions',()=>{
 const village=readFileSync(new URL('../app/src/main/assets/village.js',import.meta.url),'utf8');
 const venue=readFileSync(new URL('../app/src/main/assets/venue-runtime.js',import.meta.url),'utf8');
 const shell=readFileSync(new URL('../app/src/main/assets/index.html',import.meta.url),'utf8');
 assert.ok(village.includes("'write'"));
 assert.ok(village.includes('WordvilleSocial?.drawTownBoard'));
 assert.ok(village.includes('WordvilleSocial?.boardHit'));
 assert.ok(venue.includes("?\'write\'")||venue.includes("'write'"));
 for(const file of ['wordville-social.js','wordville-schedule-locale.js','wordville-polish.css'])assert.ok(shell.includes(file),file);
});
