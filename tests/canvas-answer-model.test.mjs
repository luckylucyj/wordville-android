import test from 'node:test';
import assert from 'node:assert/strict';
await import('../app/src/main/assets/canvas-answer-model.js');
const A=globalThis.WordvilleCanvasAnswer;
test('English prompts accept actual Korean meanings, not timing or the English word',()=>{
 const w={id:7,word:'refund',meanings:['환불, 환급; 돈을 돌려줌']};
 for(const answer of ['환불','환 급','환급','돈을 돌려줌'])assert.equal(A.matches(w,answer),true);
 for(const answer of ['','refund','환불금','다른 뜻','한국어 답 123'])assert.equal(A.matches(w,answer),false);
});
test('normalization handles punctuation and common POS markers without loose substrings',()=>{
 const w={word:'consider',meanings:['동. 고려하다; 숙고하다']};
 assert.equal(A.matches(w,'고려하다'),true);
 assert.equal(A.matches(w,'숙고하다'),true);
 assert.equal(A.matches(w,'고려'),false);
 assert.equal(A.matches(w,'  고려하다! '),true);
});
test('missing word meanings never earn a correct answer',()=>{
 assert.equal(A.matches({word:'refundable'},'환불'),false);
});
