(function(root){
'use strict';
const data=root.WordvilleEtymologyData;
function normalize(word){return typeof word==='string'?word.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' '):'';}
function searchUrl(word){return 'https://www.oxfordlearnersdictionaries.com/search/english/?q='+encodeURIComponent(normalize(word));}
function lookup(word){const key=normalize(word);return Object.hasOwn(data,key)?data[key]:null;}
function safeOxfordUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&['www.oxfordlearnersdictionaries.com','www.oxfordlearnersdictionaries.co.uk'].includes(u.hostname)&&!u.username&&!u.password&&(!u.port||u.port==='443')&&/^\/(?:us\/)?(?:definition\/english\/|search\/english\/)/.test(u.pathname);}catch{return false;}}
function render(word){const $=id=>document.getElementById(id),entry=lookup(word.word);$('etymology-section').open=false;$('etymology-history').replaceChildren();$('etymology-section').dataset.word=word.word;
$('etymology-status').textContent=entry?'출처 확인 · 한국어 학습 요약':'어원 요약 미확인';
$('etymology-summary').textContent=entry?entry.summaryKo:'아직 확인된 어원 요약이 없습니다. Oxford에서 이 단어의 Word Origin 항목을 확인해 주세요. 원문에 어원 항목이 없는 단어도 있습니다.';
if(entry){for(const item of entry.history){const li=document.createElement('li');li.textContent=item;$('etymology-history').append(li);}}
$('etymology-history').hidden=!entry;$('etymology-source').href=entry&&safeOxfordUrl(entry.sourceUrl)?entry.sourceUrl:searchUrl(word.word);$('etymology-source').textContent=entry?'Oxford 출처 원문 보기':'Oxford에서 이 단어 검색';$('etymology-date').textContent=entry?entry.sourceTitle+' · 확인일 '+entry.checkedOn:'단어·숙어를 그대로 검색합니다. 추정 어원을 표시하지 않습니다.';}
root.WordvilleEtymology={normalize,lookup,searchUrl,safeOxfordUrl,render,count:Object.keys(data).length};
const badge=document.getElementById('etymology-coverage');if(badge)badge.textContent='Oxford 출처 기반 어원 요약 '+Object.keys(data).length+'개 · 모든 단어에서 Oxford 검색 가능';
})(globalThis);
