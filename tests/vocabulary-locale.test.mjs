import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const i18n=fs.readFileSync(new URL('../app/src/main/assets/i18n.js',import.meta.url),'utf8');
const vocab=fs.readFileSync(new URL('../app/src/main/assets/vocabulary-i18n.js',import.meta.url),'utf8');

function setup(lang='en',withNative=true){
 const data=new Map([['wordville.ui-language.v1',lang]]);
 const bridgeCalls=[];
 const context={
  localStorage:{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)},
  setTimeout(fn){fn();return 1}
 };
 if(withNative)context.WordvilleTranslate={translateBatch:(json,target,id)=>bridgeCalls.push({source:JSON.parse(json),target,id})};
 vm.runInNewContext(i18n,context);
 vm.runInNewContext(vocab,context);
 return {i18n:context.WordvilleI18n,vocab:context.WordvilleVocabularyLocale,bridgeCalls,data};
}
test('residents display localized names without renaming source model records',()=>{
 const {i18n}=setup();
 assert.equal(i18n.translate('헤일리','en'),'Haley');
 assert.equal(i18n.translate('레아','ja'),'リア');
 assert.equal(i18n.translate('마루','zh-CN'),'玛鲁');
 assert.equal(i18n.translate('페니의 이야기','en'),"Penny's story");
 assert.equal(i18n.translate('애비게일의 집','ja'),'アビゲイルの家');
});
test('Day status summary and total word count change with selected UI language',()=>{
 const {i18n}=setup();
 assert.equal(i18n.translate('총 5,620개','en'),'Total 5,620 words');
 assert.equal(i18n.translate('Day 30 · 198개 | 체크 0 · 미기록 198 · ✓ 0개','en'),
 'Day 30 · 198 words | Checked 0 · Unrecorded 198 · ✓ 0');
});
test('native translator gets Korean gloss; original word and record data are unchanged',()=>{
 const {vocab,bridgeCalls,data}=setup();
 const word={id:'fatigue',word:'fatigue',meaning:'피로'};
 const span={dataset:{},textContent:'',setAttribute(){},removeAttribute(){}};
 vocab.bindText(span,word.meaning,word.word);
 assert.equal(span.textContent,'피로');
 assert.equal(bridgeCalls.length,1);
 assert.equal(bridgeCalls[0].source[0],'피로');
 assert.equal(bridgeCalls[0].target,'en');
 vocab.onNativeResult(JSON.stringify({id:bridgeCalls[0].id,locale:'en',values:['fatigue'],error:''}));
 vocab.bindText(span,word.meaning,word.word);
 assert.equal(span.textContent,'fatigue');
 assert.equal(word.meaning,'피로');
 assert.ok(data.get('wordville.gloss-translations.v1.en').includes('fatigue'));
});
test('without Android translation bridge the Korean source is retained, never fabricated',()=>{
 const {vocab}=setup('ja',false);
 const span={dataset:{},textContent:'',setAttribute(){},removeAttribute(){}};
 vocab.bindText(span,'피로','fatigue');
 assert.equal(span.textContent,'피로');
});
