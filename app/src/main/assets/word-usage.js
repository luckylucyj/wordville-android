(function(root){
'use strict';

const genreNames={
 academic:'교재·학술 글',blog:'블로그 글',conversation:'대화·인터뷰',email:'이메일·편지',
 fiction:'소설',forum:'게시판·질문답변',guide:'사용법·여행 안내',legal:'법정 기록',
 news:'뉴스',reference:'전기·해설 글',review:'후기'
};

function findings(index,term){
 const rows=Object.hasOwn(index.terms,term)?index.terms[term]:[];
 return rows.map(([position,count])=>({
  id:index.genres[position], count, rate:count/index.sizes[position]
 })).sort((a,b)=>b.rate-a.rate||b.count-a.count||a.id.localeCompare(b.id)).slice(0,3);
}

function examplesUrl(term){
 return 'https://skell.sketchengine.eu/#result?f=concordance&lang=en&query='+encodeURIComponent(term);
}

const api={findings,examplesUrl};
root.WordvilleUsage=api;
if(typeof document==='undefined')return;

const panel=document.getElementById('wv-word-usage');
const source=document.getElementById('wv-usage-topic');
const status=document.getElementById('wv-usage-status');
const list=document.getElementById('wv-usage-genres');
const details=document.getElementById('wv-usage-method');
const examples=document.getElementById('wv-usage-examples');
let currentWord=null;
let indexPromise;

function loadIndex(){
 if(!indexPromise)indexPromise=fetch('word-usage-index.json').then(response=>{
  if(!response.ok)throw Error('Usage index unavailable');
  return response.json();
 }).catch(error=>{
  indexPromise=null;
  throw error;
 });
 return indexPromise;
}

async function render(word){
 status.textContent='용례를 찾는 중입니다.';
 list.replaceChildren();
 details.hidden=true;
 try{
  const index=await loadIndex();
  if(word!==currentWord||!panel.open)return;
  const contexts=findings(index,word.word);
  status.textContent=contexts.length?'표본에서 확인된 분야':'이 표본에서 확인되는 용례가 없습니다.';
  for(const item of contexts){
   const li=document.createElement('li');
   const genre=document.createElement('span');
   genre.textContent=genreNames[item.id]||item.id;
   const count=document.createElement('strong');
   const language=root.WordvilleI18n?.language||'ko';
   const number=item.count.toLocaleString(language);
   const unit={ko:'회',en:item.count===1?' match':' matches','zh-CN':'次',ja:'回'}[language]||'';
   count.textContent=number+unit;
   li.append(genre,count);
   list.append(li);
  }
  details.hidden=!contexts.length;
 }catch{
  if(word===currentWord&&panel.open)status.textContent='용례 자료를 불러오지 못했습니다.';
 }
}

api.mount=word=>{
 currentWord=word;
 panel.open=false;
 status.textContent='';
 list.replaceChildren();
 details.hidden=true;
 const topics=root.WordvilleConversations?.topics||[];
 const labels=[...new Set((word.days||[]).map(day=>topics[day]).filter(Boolean))];
 source.replaceChildren(...labels.map(label=>{
  const text=document.createElement('span');
  text.textContent=label;
  return text;
 }));
 examples.href=examplesUrl(word.word);
};

panel.addEventListener('toggle',()=>{
 if(panel.open&&currentWord)render(currentWord);
});
document.addEventListener('wordville-language-changed',()=>{
 if(panel.open&&currentWord)render(currentWord);
});
})(globalThis);
