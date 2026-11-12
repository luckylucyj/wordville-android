/* Full-vocabulary resident role-play from the Places screen.
 * Uses the shipped offline words.json and WordvilleConversations. Nothing
 * here overwrites the existing learning records or the Residents tab picker.
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const host=$('wv-venue-study');if(!host)return;
const resident=$('wv-vstudy-resident'),day=$('wv-vstudy-day'),search=$('wv-vstudy-search');
const pdf=$('wv-vstudy-pdf'),page=$('wv-vstudy-page'),select=$('wv-vstudy-word');
const status=$('wv-vstudy-count'),practice=$('wv-vstudy-practice');
const PAGE=60;
let data=null,request=null,examples=[],index=0,currentWord=null,opening=0;
const people=root.VillageModel?.people||[];
function option(el,value,label){const item=document.createElement('option');item.value=String(value);item.textContent=label;el.add(item);}
for(const p of people)option(resident,p.id,p.name);
function reset(){
 examples=[];index=0;currentWord=null;
 practice.hidden=true;$('wv-vstudy-answer').value='';
 $('wv-vstudy-feedback').textContent='';$('wv-vstudy-example-text').hidden=true;
}
function sourceList(){
 if(!data)return [];
 const q=search.value.trim().toLocaleLowerCase();
 const scope=day.value,source=pdf.value;
 const list=data.filter(w=>(scope===''||(w.days||[]).includes(Number(scope)))&&
   (source==='all'||(w.pdfPages||[]).some(n=>Number(n)===Number(source)))&&
   (!q||w.word.toLocaleLowerCase().includes(q)||w.meaning.toLocaleLowerCase().includes(q)));
 return root.WordvilleBookOrder?.sort(list,scope)||list;
}
function refreshWords(){
 const filtered=sourceList(),pages=Math.max(1,Math.ceil(filtered.length/PAGE));
 const desired=Math.max(0,Math.min(Number(page.value)||0,pages-1));
 page.replaceChildren();
 for(let i=0;i<pages;i++)option(page,i,(i+1)+' / '+pages+' 페이지 · '+(i*PAGE+1)+'~'+Math.min((i+1)*PAGE,filtered.length));
 page.value=String(desired);populateWordOptions(filtered);
}
function populateWordOptions(items=sourceList()){
 const from=(Number(page.value)||0)*PAGE,old=select.value;
 select.replaceChildren();
 const entries=items.slice(from,from+PAGE);
 for(const w of entries)option(select,w.id,w.word+' · '+w.meaning);
 if(entries.some(w=>w.id===old))select.value=old;
 status.textContent='선택 가능한 단어 '+items.length+'개 · 현재 페이지 '+entries.length+'개';
 $('wv-vstudy-start').disabled=$('wv-vstudy-card').disabled=entries.length===0;
 reset();
}
function refreshPdf(){
 if(!data)return;
 const old=pdf.value;
 pdf.replaceChildren();option(pdf,'all','원본 PDF 전체 쪽');
 const q=search.value.trim().toLocaleLowerCase();
 const relevant=data.filter(w=>(day.value===''||(w.days||[]).includes(Number(day.value)))&&
   (!q||w.word.toLocaleLowerCase().includes(q)||w.meaning.toLocaleLowerCase().includes(q)));
 const pages=[...new Set(relevant.flatMap(w=>(w.pdfPages||[]).map(Number)))]
  .filter(n=>Number.isInteger(n)&&n>0).sort((a,b)=>a-b);
 for(const n of pages)option(pdf,n,'PDF '+n+'쪽');
 pdf.value=pages.includes(Number(old))&&old!=='all'?old:'all';
 page.value='0';refreshWords();
}
async function ensureData(){
 if(data)return data;
 if(!request)request=fetch('words.json').then(r=>{if(!r.ok)throw Error('words.json');return r.json();})
  .then(list=>{
   if(!Array.isArray(list))throw Error('Invalid vocabulary');
   data=list;
   day.replaceChildren();option(day,'','전체 Day · 모든 단어');
   for(const n of [...new Set(list.flatMap(w=>w.days||[]))].sort((a,b)=>a-b))
    option(day,n,Number(n)===0?'이디엄':'Day '+String(n).padStart(2,'0'));
   return data;
  }).catch(e=>{request=null;throw e;});
 return request;
}
function selectedWord(){return sourceList().find(w=>w.id===select.value)||null;}
function renderPractice(){
 const item=examples[index],w=currentWord;if(!item||!w)return;
 const person=people.find(p=>p.id===resident.value);
 const [a,b='']=item.english.split(/\nB:\s*/);
 $('wv-vstudy-title').textContent=(person?.name||'주민')+'과 '+w.word+' 연습';
 $('wv-vstudy-progress').textContent=(index+1)+' / '+examples.length+' · '+w.word+' · '+w.meaning;
 $('wv-vstudy-prompt').textContent=(person?.name||'주민')+': '+a.replace(/^A:\s*/,'');
 $('wv-vstudy-example-text').textContent='예시 답변: '+b;
 $('wv-vstudy-example-text').hidden=true;
 $('wv-vstudy-answer').value='';$('wv-vstudy-feedback').textContent='';
 practice.hidden=false;
}
function start(){
 const w=selectedWord();
 if(!w){status.textContent='대화할 단어를 먼저 선택해 주세요.';return;}
 const n=Number(day.value||w.days?.find(d=>d>0)||0);
 const items=root.WordvilleConversations?.get(w,n)||[];
 if(!items.length){status.textContent='선택한 단어의 대화 예시가 없습니다.';return;}
 currentWord=w;examples=items;index=0;renderPractice();
 practice.scrollIntoView({block:'nearest',behavior:'instant'});
}
async function open(id){
 const sequence=++opening;
 root.WordvilleShell?.activate('places');
 host.hidden=false;
 status.textContent='전체 단어장을 불러오는 중입니다…';
 try{
  await ensureData();if(sequence!==opening)return;
  const valid=people.find(p=>p.id===id)||people[0];
  resident.value=valid?.id||'';
  day.value='';search.value='';pdf.value='all';page.value='0';
  refreshPdf();reset();
  $('wv-vstudy-heading').textContent=(valid?.name||'주민')+'과 원하는 단어 대화하기';
  host.scrollIntoView({block:'start',behavior:'instant'});
 }catch{if(sequence===opening){status.textContent='단어장을 불러오지 못했습니다. 인터넷 연결이 필요하지 않은 앱 내 단어장 파일을 확인해 주세요.';$('wv-vstudy-start').disabled=true;}}
}
document.addEventListener('wordville-open-venue-study',event=>{open(event.detail?.residentId);});
resident.addEventListener('change',()=>{
 const name=people.find(p=>p.id===resident.value)?.name||'주민';
 $('wv-vstudy-heading').textContent=name+'과 원하는 단어 대화하기';
 if(examples.length)renderPractice();
});
day.addEventListener('change',refreshPdf);
search.addEventListener('input',refreshPdf);
pdf.addEventListener('change',()=>{page.value='0';refreshWords();});
page.addEventListener('change',()=>populateWordOptions());
select.addEventListener('change',reset);
$('wv-vstudy-start').addEventListener('click',start);
$('wv-vstudy-card').addEventListener('click',()=>{
 const w=selectedWord();
 if(w)document.dispatchEvent(new CustomEvent('village-study',{detail:{word:w.id}}));
});
$('wv-vstudy-close').addEventListener('click',()=>{host.hidden=true;reset();opening++;});
$('wv-vstudy-send').addEventListener('click',()=>{
 const written=$('wv-vstudy-answer').value.trim();
 if(!written){$('wv-vstudy-feedback').textContent='영어 답변을 먼저 입력해 주세요.';return;}
 $('wv-vstudy-example-text').hidden=false;
 $('wv-vstudy-feedback').textContent='답변을 입력했습니다. 준비된 예시와 비교해 보세요. 자동 채점은 제공하지 않습니다.';
});
$('wv-vstudy-example').addEventListener('click',()=>{
 $('wv-vstudy-example-text').hidden=false;
 $('wv-vstudy-feedback').textContent='예시 답변을 표시했습니다.';
});
$('wv-vstudy-next').addEventListener('click',()=>{
 if(!examples.length)return;index=(index+1)%examples.length;renderPractice();
});
root.WordvilleVenueStudy={open,get ready(){return !!data;},get selectedResident(){return resident.value;},get selectedWord(){return selectedWord()?.word||null;},get pageCount(){return page.options.length;}};
})(globalThis);