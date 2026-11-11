import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../app/src/main/assets/book-order.js';

const W=JSON.parse(readFileSync(new URL('../app/src/main/assets/words.json',import.meta.url),'utf8'));
const book=globalThis.WordvilleBookOrder;
test('PDF book positions load for original word data without changing IDs or meanings',()=>{
 const before=W.map(x=>[x.id,x.meaning]);
 assert.equal(book.prepare(W),true,book.status);
 assert.equal(book.status,'ready');
 assert.deepEqual(W.map(x=>[x.id,x.meaning]),before);
 assert.equal(W.length,5620);
});
test('all 30 days have stable, complete, duplicate-free PDF order',()=>{
 for(let day=1;day<=30;day++){
  const cards=book.sort(W.filter(w=>w.days.includes(day)),String(day));
  assert.equal(cards.length,book.counts[day],'Day '+day+' count mismatch');
  assert.equal(new Set(cards.map(w=>w.id)).size,cards.length);
  for(const w of cards)assert.ok(w.days.includes(day));
 }
});
test('printed first headwords match PDF for Day 01/02/30 and idioms',()=>{
 assert.deepEqual(book.sort(W.filter(x=>x.days.includes(1)),'1').slice(0,3).map(w=>w.word),['resume','opening','applicant']);
 assert.deepEqual(book.sort(W.filter(x=>x.days.includes(2)),'2').slice(0,3).map(w=>w.word),['attire','code','concern']);
 assert.deepEqual(book.sort(W.filter(x=>x.days.includes(30)),'30').slice(0,3).map(w=>w.word),['fatigue','checkup','symptom']);
 assert.equal(book.sort(W.filter(x=>x.days.includes(0)),'0')[0].word,'across the board');
 assert.equal(book.sort([...W],'')[0].word,'resume');
});
test('word order reacts to Day filter, not earlier appearances in other Days',()=>{
 const a=book.sort(W.filter(w=>w.days.includes(1)),'1').map(w=>w.word);
 const b=book.sort(W.filter(w=>w.days.includes(7)),'7').map(w=>w.word);
 assert.notDeepEqual(a.slice(0,20),b.slice(0,20));
 assert.equal(b[0],'survey');
});
test('changed or reordered word data is detected and blocked',()=>{
 const swapped=[...W];[swapped[0],swapped[1]]=[swapped[1],swapped[0]];
 assert.equal(book.prepare(swapped),false);
 assert.equal(book.status,'data-version-mismatch');
 assert.equal(book.prepare(W),true);
});
