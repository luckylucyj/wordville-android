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
 assert.equal(span.textContent,'Translating meaning…');
 assert.equal(bridgeCalls.length,1);
 assert.equal(bridgeCalls[0].source[0],'피로');
 assert.equal(bridgeCalls[0].target,'en');
 vocab.onNativeResult(JSON.stringify({id:bridgeCalls[0].id,locale:'en',values:['fatigue'],error:''}));
 vocab.bindText(span,word.meaning,word.word);
 assert.equal(span.textContent,'fatigue');
 assert.equal(word.meaning,'피로');
 assert.ok(data.get('wordville.gloss-translations.v1.en').includes('fatigue'));
});
test('without Android translation bridge the Korean source remains in storage but not on the translated screen',()=>{
 const {vocab}=setup('ja',false);
 const span={dataset:{},textContent:'',setAttribute(){},removeAttribute(){}};
 vocab.bindText(span,'피로','fatigue');
 assert.equal(span.textContent,'意味を表示できません');
});
test('selected word options do not leak Korean or trigger a 6000-word translation queue',()=>{
 const {vocab,bridgeCalls}=setup('en');
 const option={dataset:{},textContent:'',setAttribute(){},removeAttribute(){}};
 vocab.bindOption(option,'disturb','방해하다');
 assert.equal(option.textContent,'disturb');
 assert.equal(bridgeCalls.length,0);
 vocab.requestGloss('방해하다');
 assert.equal(bridgeCalls.length,1);
 const request=bridgeCalls[0];
 vocab.onNativeResult(JSON.stringify({id:request.id,locale:'en',values:['interrupt'],error:''}));
 vocab.bindOption(option,'disturb','방해하다');
 assert.equal(option.textContent,'disturb · interrupt');
});

test('Chinese and Japanese meanings are displayed instead of source Korean',()=>{
 for(const [lang,expected] of [['zh-CN','保险'],['ja','保険']]){
  const {vocab}=setup(lang,false);
  const span={dataset:{},textContent:'',setAttribute(){},removeAttribute(){}};
  vocab.bindText(span,'보험','insurance');
  assert.equal(span.textContent,expected);
  assert.equal(vocab.display('영양'),lang==='ja'?'栄養':'营养');
  assert.equal(vocab.display('영양사'),lang==='ja'?'栄養士':'营养师');
  assert.doesNotMatch(vocab.display('빼앗다'),/[가-힣]/);
 }
});
test('preexisting untranslated cached glosses cannot leak Korean into Chinese and Japanese views',()=>{
 for(const lang of ['zh-CN','ja']){
  const {vocab,data}=setup(lang,false);
  data.set('wordville.gloss-translations.v1.'+lang,JSON.stringify({'보험':'보험'}));
  const span={dataset:{},textContent:'',setAttribute(){},removeAttribute(){}};
  vocab.bindText(span,'보장','coverage');
  assert.doesNotMatch(span.textContent,/[가-힣]/);
 }
});
