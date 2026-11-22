import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../app/src/main/assets/solo-learning-model.js';

const model=globalThis.WordvilleSoloModel;
const words=JSON.parse(readFileSync(new URL('../app/src/main/assets/words.json',import.meta.url),'utf8'));
const solo=readFileSync(new URL('../app/src/main/assets/solo-learning.js',import.meta.url),'utf8');
const shell=readFileSync(new URL('../app/src/main/assets/app-shell.js',import.meta.url),'utf8');
const index=readFileSync(new URL('../app/src/main/assets/index.html',import.meta.url),'utf8');
const backup=readFileSync(new URL('../app/src/main/assets/record-backup.js',import.meta.url),'utf8');

test('All three games use actual local vocabulary cards, not fake samples',()=>{
 assert.ok(words.length>5000);
 for(const mode of model.MODES){
  const eligible=model.candidates(words,mode);
  assert.ok(eligible.length>100,mode+' eligible words');
  const q=model.question(words,{mode,random:()=>0.27,now:Date.now()});
  assert.ok(q,mode+' sample question');
  assert.equal(q.mode,mode);
  assert.equal(q.choices.length,4);
  assert.equal(new Set(q.choices).size,4);
  assert.equal(q.choices.filter(x=>x===q.answer).length,1);
  assert.ok(words.some(w=>w.id===q.id),mode+' word ID from VOCA');
  if(mode==='fish')assert.equal(q.prompt,model.firstMeaning(q.word));
  if(mode==='wood')assert.equal(q.prompt,q.word.word);
  if(mode==='capture'){
   assert.ok(q.prompt.includes('_____'));
   assert.ok(q.example.includes(q.word.word)||new RegExp(q.word.word,'i').test(q.example));
   assert.ok(!q.prompt.includes(q.word.word),'no answer leaked in masked example');
  }
 }
});

test('Sampled Day and one mistaken word are playable with other words as distractors',()=>{
 const day=String(words.find(w=>w.days?.includes(3)).days.find(d=>d===3));
 const scoped=model.candidates(words,'fish',day);
 assert.ok(scoped.length>3);
 const q=model.question(words,{mode:'fish',day,random:()=>0});
 assert.ok(q.word.days.includes(3));
 const one=scoped[0];
 const wrong=model.question(words,{mode:'fish',day,filter:'wrong',mistakes:{[one.id]:2},random:()=>0});
 assert.equal(wrong?.id,one.id);
 assert.equal(wrong?.choices.length,4);
 const due=model.question(words,{mode:'fish',day,filter:'due',reviews:{[one.id]:{due:Date.now()+500000}},random:()=>0});
 assert.notEqual(due?.id,one.id,'future-due word is not chosen while other words are due');
});

test('Uses a real example to create a single hidden word gap',()=>{
 const a=words.find(w=>w.word==='reservation');
 assert.ok(a);
 const q=model.blankExample(a);
 assert.equal(q?.original,a.example);
 assert.ok(q.prompt.includes('_____'));
 assert.ok(!q.prompt.includes('reservation'));
 assert.equal(model.blankExample({...a,example:'This sentence does not use the target.'}),null);
});

test('Reward depends on review eligibility and preserves delayed review schedule',()=>{
 const now=Date.now();
 assert.equal(model.reviewEligible({},'reservation',now),true);
 assert.equal(model.reviewEligible({reservation:{due:now+1000}},'reservation',now),false);
 assert.equal(model.reward(3,false),0);
 assert.equal(model.reward(3,true),2);
});

test('Solo screen is loaded and attached to more menu without replacing existing learning',()=>{
 assert.doesNotThrow(()=>new Function(solo));
 assert.match(index,/solo-learning-model\.js/);
 assert.match(index,/solo-learning\.js/);
 assert.match(index,/solo-learning\.css/);
 assert.match(shell,/\['solo','🎮','혼자 하는 단어 게임'\]/);
 assert.match(shell,/soloView\.hidden=screen!=='solo'/);
 assert.match(solo,/Wordville\.review\(state,round\.id,correct,now\)/);
 assert.match(solo,/save\(next\)/);
 assert.match(solo,/progress\.frames/);
 assert.match(solo,/roomItem\(id\)/);
 assert.match(backup,/wordville\.solo-learning\.v1/);
});

test('No outside player or online opponent is required',()=>{
 assert.doesNotMatch(solo,/fetch\(/);
 assert.doesNotMatch(solo,/WebSocket\(/);
 assert.doesNotMatch(solo,/RTCPeerConnection\(/);
});
