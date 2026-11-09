import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../app/src/main/assets/engine.js';
const E=globalThis.Wordville;
test('Korean answer normalization and blank rejection',()=>{assert.equal(E.isCorrect(' 이용 가능한! ','이용 가능한'),true);assert.equal(E.isCorrect('','예약'),false);assert.equal(E.isCorrect('청구서','예약'),false);});
test('correct answer schedules first and third day and gives rewards once per due cycle',()=>{let s=E.review(E.fresh(),'a',true,1000);assert.equal(s.xp,10);assert.equal(s.reviews.a.due,86401000);s=E.review(s,'a',true,2000);assert.equal(s.xp,10);assert.equal(s.reviews.a.due,259202000);});
test('wrong answer schedules retry after ten minutes without reward',()=>{const s=E.review(E.fresh(),'a',false,1000);assert.equal(s.coins,0);assert.equal(s.reviews.a.due,601000);assert.equal(s.reviews.a.streak,0);});
test('interval caps at thirty days',()=>{let s=E.fresh(),now=1000;for(let i=0;i<8;i++){s=E.review(s,'a',true,now);now=s.reviews.a.due;}assert.equal(s.reviews.a.streak,5);assert.equal(s.reviews.a.due,now);});
test('combination prevents reverse duplicates and same-word rewards',()=>{let s=E.combine(E.fresh(),'reservation','confirm','예약 확인');assert.equal(s.coins,5);assert.equal(s.concepts[0].name,'예약 확인');assert.throws(()=>E.combine(s,'confirm','reservation','확인 예약'));assert.throws(()=>E.combine(s,'x','x','같음'));assert.throws(()=>E.combine(s,'x','y',' '));});
test('review and concept data survive JSON persistence',()=>{let s=E.combine(E.review(E.fresh(),'invoice',false,1000),'invoice','deadline','청구서 기한');assert.deepEqual(JSON.parse(JSON.stringify(s)),s);});
test('expanded vocabulary has stable IDs, merged senses and source pages',()=>{
 const words=JSON.parse(fs.readFileSync(new URL('../app/src/main/assets/words.json',import.meta.url)));
 assert.ok(words.length>5000);assert.equal(new Set(words.map(w=>w.id)).size,words.length);assert.equal(new Set(words.map(w=>w.word.toLowerCase())).size,words.length);
 const original=JSON.parse(fs.readFileSync(new URL('./original-word-ids.json',import.meta.url)));
 for(const [word,id] of Object.entries(original))assert.equal(words.find(w=>w.word===word)?.id,id);
 for(const w of words){assert.ok(w.word&&w.meaning);assert.doesNotMatch(w.word,/[가-힣]/);assert.ok(w.meanings.length);assert.deepEqual(w.days,[...new Set(w.days)].sort((a,b)=>a-b));assert.ok(w.pdfPages.every(p=>Number.isInteger(p)&&p>=1&&p<=565));}
 for(let day=1;day<=30;day++)assert.ok(words.filter(w=>w.days.includes(day)).length>=150);
 assert.ok(words.filter(w=>w.sourceTypes.includes('이디엄')).length>=115);
});
