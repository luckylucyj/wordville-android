import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code=fs.readFileSync(new URL('../app/src/main/assets/i18n.js',import.meta.url),'utf8');
function load(storageValue){
 const saved=new Map(storageValue?[['wordville.ui-language.v1',storageValue]]:[]);
 const context={localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)}};
 vm.runInNewContext(code,context);
 return {i18n:context.WordvilleI18n,saved};
}
test('Wordville provides Korean, English, Simplified Chinese and Japanese offline UI labels',()=>{
 const {i18n}=load('ja');
 assert.equal(i18n.language,'ja');
 assert.deepEqual(Array.from(i18n.languages),['ko','en','zh-CN','ja']);
 for(const [locale,wanted] of [['ko','복습'],['en','Review'],['zh-CN','复习'],['ja','復習']]){
  assert.equal(i18n.translate('복습',locale),wanted);
 }
});
test('Numeric UI text is translated without changing the numbers',()=>{
 const {i18n}=load();
 assert.equal(i18n.translate('37 XP · 8 코인','en'),'37 XP · 8 coins');
 assert.equal(i18n.translate('3번의 대화','zh-CN'),'3 次对话');
 assert.equal(i18n.translate('검색 결과 120개 · PDF 수록 순서 · 한 페이지 60개','ja'),'検索結果 120 件・PDF順・1ページ60語');
});
test('English menus translate actual venues and descriptions without leaking Korean',()=>{
 const {i18n}=load('en');
 assert.equal(i18n.translate('마을'),'Town');
 assert.equal(i18n.translate('장소'),'Places');
 assert.equal(i18n.translate('주민의 집'),"Resident's home");
 assert.equal(i18n.translate('동물을 돌보고 목장 생활을 체험해요.'),
              'Care for animals and experience ranch life.');
 assert.equal(i18n.translate('책상과 책장, 침대와 소파가 있는 페니의 개인 생활 공간입니다. 가구를 누르면 주변으로 이동합니다.'),
              "Penny's home has a desk, bookshelves, a bed and a sofa. Tap furniture to walk nearby.");
});
test('Vocabulary meanings and user notes have no automatic translation',()=>{
 const {i18n}=load('en');
 assert.equal(i18n.translate('예금; 맡겨 놓은 돈'), '예금; 맡겨 놓은 돈');
 assert.equal(i18n.translate('A custom diary note'), 'A custom diary note');
 assert.equal(i18n.translate('복습','xx'),'복습');
});
