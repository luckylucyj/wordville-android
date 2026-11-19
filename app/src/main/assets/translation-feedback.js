(() => {
'use strict';
const model=globalThis.WordvilleInterpretationModel;
const $=id=>document.getElementById(id);
const key='wordville.interpretation-draft.v1';
const lang=$('wv-interpretation-language'), original=$('wv-interpretation-source'), draft=$('wv-interpretation-draft');
const result=$('wv-interpretation-results'), status=$('wv-interpretation-status'), button=$('wv-interpretation-check');
let sequence=0,pending=null,requestTimeout=null;

function make(tag,value){
 const element=document.createElement(tag);
 element.textContent=value;
 return element;
}
function label(parent,heading,value,locale){
 const block=document.createElement('div');
 const name=make('strong',heading);
 const content=make('p',value);
 content.lang=locale;
 content.setAttribute('data-i18n-ignore','');
 block.append(name,content);
 parent.append(block);
}

function storeDraft(){
 try{localStorage.setItem(key,JSON.stringify({language:lang.value,source:original.value,draft:draft.value}));}catch{}
}
function restoreDraft(){
 try{
  const saved=JSON.parse(localStorage.getItem(key)||'{}');
  if(model.languages.includes(saved.language))lang.value=saved.language;
  if(typeof saved.source==='string')original.value=saved.source.slice(0,model.maxLength);
  if(typeof saved.draft==='string')draft.value=saved.draft.slice(0,model.maxLength);
 }catch{}
}
function clearPending(){
 clearTimeout(requestTimeout);
 requestTimeout=null;
 pending=null;
 button.disabled=false;
}
function resetResult(){
 clearPending();
 status.textContent='';
 result.hidden=true;
 result.replaceChildren();
 original.lang=lang.value;
 storeDraft();
}
function populateRules(card,original,draft,locale){
 const points=model.checkpoints(original,draft,locale);
 const title=make('h4','원문에서 확인할 표현');
 card.append(title);
 if(!points.length){
  card.append(make('p','원문의 주어와 핵심 동사를 먼저 찾으세요. 누가 무엇을 했는지, 언제나 어느 조건에서 일어났는지 내 해석에 들어갔는지 확인해 보세요.'));
  return;
 }
 const sorted=[...points.filter(p=>!p.found),...points.filter(p=>p.found)];
 const list=document.createElement('ul');
 list.className='wv-interpretation-points';
 for(const point of sorted){
  const row=document.createElement('li');
  const heading=make('strong',point.title);
  const signal=make('span',point.found?'해석에 관련 표현이 보여요':'해석에서 이 의미를 확인해 보세요');
  signal.className='wv-interpretation-signal';
  const excerpt=make('code',point.source);
  excerpt.lang=locale;
  excerpt.setAttribute('data-i18n-ignore','');
  row.append(heading,signal,excerpt,make('p',point.guide));
  list.append(row);
 }
 card.append(list);
}
function render(pairs,locale,combined){
 result.hidden=false;
 result.replaceChildren();
 if(combined)result.append(make('p','문장 수가 다르거나 8개를 넘어서 전체 글을 비교했습니다. 문장별로 보고 싶다면 대응하는 문장을 한 줄씩 맞춰 보세요.'));
 return pairs.map((pair,index)=>{
  const card=document.createElement('article');
  card.className='wv-interpretation-card';
  card.append(make('h3',combined?'전체 글':String(index+1)+'번째 문장'));
  label(card,'외국어 원문',pair.original,locale);
  label(card,'내가 쓴 해석',pair.draft,'ko');
  const reference=document.createElement('section');
  reference.className='wv-interpretation-reference';
  reference.hidden=true;
  card.append(reference);
  populateRules(card,pair.original,pair.draft,locale);
  result.append(card);
  return {reference,draft:pair.draft};
 });
}
function showReference(section,translation,attempt){
 label(section,'참고 해석',translation,'ko');
 const credit=make('a','Powered by Google Translate');
 credit.className='wv-interpretation-credit';
 credit.href='https://translate.google.com/';
 credit.rel='noopener noreferrer';
 section.append(credit);
 const keyTerms=model.compareReference(translation,attempt);
 if(keyTerms.length){
  section.append(make('strong','참고 해석과 비교할 표현'));
  const terms=make('p',keyTerms.join(' · '));
  terms.setAttribute('data-i18n-ignore','');
  section.append(terms,make('p','같은 뜻을 다른 표현으로 쓸 수 있어요. 이 표현이 담고 있는 의미가 내 해석에도 들어갔는지 확인하세요.'));
 }
 section.hidden=false;
}
globalThis.WordvilleInterpretation={
 onNativeResult(json){
  let response;
  try{response=JSON.parse(json);}catch{return;}
  if(!pending||response.id!==pending.id)return;
  const {sections}=pending;
  clearPending();
  if(response.error){
   status.textContent='참고 해석을 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 눌러 주세요. 표현 조언은 아래에서 볼 수 있어요.';
   return;
  }
  let shown=0;
  sections.forEach(({reference,draft},index)=>{
   const translation=response.values?.[index];
   if(typeof translation!=='string'||!translation.trim())return;
   showReference(reference,translation,draft);
   shown++;
  });
  status.textContent=shown===sections.length?'해석 피드백을 확인하세요.':'일부 문장의 참고 해석을 불러오지 못했습니다. 표현 조언은 아래에서 볼 수 있어요.';
 }
};

$('wv-interpretation-form').addEventListener('submit',event=>{
 event.preventDefault();
 clearPending();
 const locale=lang.value;
 const source=original.value.trim(),attempt=draft.value.trim();
 if(!model.languages.includes(locale)||!source||!attempt)return;
 const {pairs,combined}=model.align(source,attempt,locale);
 const sections=render(pairs,locale,combined);
 const translator=globalThis.WordvilleInterpretationNative;
 if(!translator?.translate){
  status.textContent='표현 조언을 표시했습니다. 참고 해석은 안드로이드 앱에서 사용할 수 있어요.';
  return;
 }
 const id=++sequence;
 pending={id,sections};
 status.textContent='참고 해석을 준비하고 있습니다. 처음에는 번역 파일을 내려받는 데 시간이 걸릴 수 있어요.';
 button.disabled=true;
 requestTimeout=setTimeout(()=>{
  if(pending?.id!==id)return;
  clearPending();
  status.textContent='참고 해석 준비에 시간이 걸리고 있어요. 잠시 후 다시 눌러 주세요. 표현 조언은 아래에서 볼 수 있어요.';
 },90000);
 try{translator.translate(JSON.stringify(pairs.map(pair=>pair.original)),locale,id);}
 catch{globalThis.WordvilleInterpretation.onNativeResult(JSON.stringify({id,error:'unavailable'}));}
});
lang.addEventListener('change',resetResult);
original.addEventListener('input',resetResult);
draft.addEventListener('input',resetResult);
restoreDraft();
original.lang=lang.value;
})();
