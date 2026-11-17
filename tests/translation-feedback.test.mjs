import test from 'node:test';
import assert from 'node:assert/strict';
import '../app/src/main/assets/translation-feedback-model.js';

const M=globalThis.WordvilleInterpretationModel;
const check=(source,draft,locale='en')=>Object.fromEntries(
 M.checkpoints(source,draft,locale).map(({title,found})=>[title,found])
);

test('aligns sentence pairs and compares the whole text when inputs do not line up',()=>{
 assert.deepEqual(M.align('He left. She stayed.','그는 떠났다. 그녀는 남았다.','en'),{
  combined:false,pairs:[
   {original:'He left.',draft:'그는 떠났다.'},
   {original:'She stayed.',draft:'그녀는 남았다.'}
  ]
 });
 const combined=M.align('He left. She stayed.','그는 떠났고 그녀는 남았다.','en');
 assert.equal(combined.combined,true);
 assert.equal(combined.pairs.length,1);
 assert.equal(M.align('One. '.repeat(9),'하나. '.repeat(9),'en').combined,true);
});

test('checks obligation, contrast, tense, and direction of comparisons',()=>{
 assert.equal(check("You don't have to pay.",'지불하면 안 된다.')['의무의 부정'],false);
 assert.equal(check("You don't have to pay.",'지불할 필요가 없다.')['의무의 부정'],true);
 const source='Although she had already paid, they charged her again.';
 assert.deepEqual(check(source,'그녀가 지불해서 그들은 다시 청구했다.'),{'양보':false,'과거보다 앞선 일':false});
 assert.deepEqual(check(source,'이미 지불했는데도 그들은 그녀에게 다시 청구했다.'),{'양보':true,'과거보다 앞선 일':true});
 assert.deepEqual(check('We need at least 5 copies.','최대 3부가 필요하다.'),{'비교 범위':false,'숫자·시간':false});
 assert.deepEqual(check('We need at least 5 copies.','최소 5부가 필요하다.'),{'비교 범위':true});
 assert.deepEqual(check('It costs 2,500 won.','2500원이에요.'),{});
});

test('uses source-language patterns and shows reference wording as a comparison',()=>{
 assert.equal(check('行かなければならない。','가야 한다.','ja')['의무'],true);
 assert.equal(check('虽然下雨，但是他还是来了。','비가 와서 그는 왔다.','zh')['양보'],false);
 assert.equal(check('No viene.','그는 오지 않아요.','es')['부정 표현'],true);
 assert.equal(check('Il ne vient pas.','그는 와요.','fr')['부정 표현'],false);
 assert.equal(check('Er kommt nicht.','그는 와요.','de')['부정 표현'],false);
 assert.ok(M.compareReference('관리자가 보고서를 승인했다.','팀장이 문서를 승인했다.').includes('보고서'));
});
