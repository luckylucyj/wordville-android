import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../app/src/main/assets/word-conversations.js';

const words=JSON.parse(readFileSync(new URL('../app/src/main/assets/words.json',import.meta.url),'utf8'));
const conversations=globalThis.WordvilleConversations;
test('all source vocabulary entries provide 10 unique two-person dialogues offline',()=>{
 assert.equal(words.length,5620);
 for(const w of words){
  const cards=conversations.get(w,w.days.find(d=>d>0) ?? 0);
  assert.equal(cards.length,10,w.word+' conversation count');
  assert.equal(new Set(cards.map(c=>c.english)).size,10,w.word+' duplicated dialogue');
  for(const c of cards){
   assert.ok(c.english.startsWith('A: '),w.word+' A line missing');
   assert.ok(c.english.includes('\nB: '),w.word+' B line missing');
   assert.ok(c.english.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(w.word.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()),w.word+' not actually present');
   assert.ok(c.topic,w.word+' topic missing');
  }
 }
});
test('conversation contexts change by Day without losing base word data',()=>{
 const resume=words.find(x=>x.word==='resume');
 assert.deepEqual(conversations.get(resume,1).map(x=>x.english),conversations.get(resume,6).map(x=>x.english));
 assert.equal(conversations.get(resume,1)[0].topic,'채용·면접');
 assert.equal(conversations.get(resume,6)[0].topic,'여가·공동체');
 assert.ok(conversations.get(resume,1)[0].english.includes('résumé'));
 const example=words.find(x=>x.word==='reservation');
 assert.equal(conversations.get(example,18).length,10);
});
