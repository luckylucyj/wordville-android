(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const dialog=$('word-dialog');
 const link=$('wv-dictionary-link');
 const toggle=$('wv-dictionary-toggle');
 const editor=$('wv-dictionary-editor');
 const field=$('wv-dictionary-text');
 const save=$('wv-dictionary-save');
 const paste=$('wv-dictionary-paste');
 const status=$('wv-dictionary-status');
 const native=globalThis.WordvilleDictionaryClipboard;
 const returnKey='wordville.dictionary.return.v1';
 const drafts=new Map();
 let card=null,requestId=0,pendingPaste=null,feedback='';

 if(!native)link.target='_blank';
 function showEditor(show){
  editor.hidden=!show;
  toggle.setAttribute('aria-expanded',String(show));
 }
 function message(text){
  feedback=text;
  status.textContent=globalThis.WordvilleI18n?.translate(text)||text;
 }
 function snapshot(){
  return {text:field.value,start:field.selectionStart,end:field.selectionEnd};
 }
 function rememberReturn(){
  if(!card?.lookup)return;
  try{
   localStorage.setItem(returnKey,JSON.stringify({
    id:card.word.id,day:card.day,draft:snapshot()
   }));
  }catch{}
 }
 function pendingReturn(){
  try{
   const data=JSON.parse(localStorage.getItem(returnKey)||'null');
   if(typeof data?.id==='string'&&typeof data.day==='string')return data;
  }catch{}
  return null;
 }
 function applyDraft(draft){
  field.value=draft.text;
  field.setSelectionRange(draft.start,draft.end);
 }
 async function mount(word,returned){
  // A restored word card can open while deferred modules are still initializing.
  // Wait for the notes store rather than permanently disabling its Save button.
  if(!globalThis.WordvilleStudy&&document.readyState!=='complete'){
   await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
  }
  const study=globalThis.WordvilleStudy;
  const requestedDay=returned?.day??$('day-filter').value;
  const day=String(study?.get(word,requestedDay).day??requestedDay);
  const key=JSON.stringify([word.id,day]);
  const current={word,day,key,lookup:!!returned};
  card=current;
  pendingPaste=null;
  link.href='https://www.oxfordlearnersdictionaries.com/search/english/?q='+encodeURIComponent(word.word.trim());
  message('');
  showEditor(!!returned||drafts.has(key));
  field.value='';
  field.disabled=save.disabled=paste.disabled=true;
  const ready=await study?.ready;
  if(card!==current)return;
  const stored=study?.get(word,day).dictionaryNotes||'';
  const draft=returned?.draft||drafts.get(key);
  if(draft&&typeof draft.text==='string'&&draft.text.length<=field.maxLength){
   applyDraft(draft);
   if(draft.text!==stored)drafts.set(key,draft);
  }else{
   field.value=stored;
   field.setSelectionRange(stored.length,stored.length);
  }
  field.disabled=paste.disabled=false;
  save.disabled=!ready;
  if(!ready)message('세부내용 저장소를 열 수 없습니다.');
 }

 toggle.addEventListener('click',()=>showEditor(editor.hidden));
 link.addEventListener('click',event=>{
  if(!card||field.disabled){event.preventDefault();return;}
  const selection=snapshot();
  showEditor(true);
  field.setSelectionRange(selection.start,selection.end);
  card.lookup=true;
  rememberReturn();
 });
 field.addEventListener('input',()=>{
  if(!card)return;
  drafts.set(card.key,snapshot());
  rememberReturn();
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&dialog.open&&!field.disabled)rememberReturn();
 });
 dialog.addEventListener('close',()=>{
  if(dialog.open)return;
  card=null;
  pendingPaste=null;
  try{localStorage.removeItem(returnKey);}catch{}
 });

 function onPaste(id,text){
  const request=pendingPaste;
  if(!request||request.id!==id)return;
  pendingPaste=null;
  if(card!==request.card||!dialog.open||editor.hidden||field.value!==request.text)return;
  if(text===null){message('입력칸을 길게 눌러 붙여넣기를 선택하세요.');return;}
  if(!text){message('먼저 사전에서 텍스트를 복사하세요.');return;}
  text=text.replace(/\r\n?/g,'\n');
  const {start,end}=request;
  if(request.text.length-(end-start)+text.length>field.maxLength){
   message('최대 6,000자까지 저장할 수 있습니다. 더 짧게 복사해 주세요.');
   return;
  }
  field.focus();
  field.setRangeText(text,start,end,'end');
  field.dispatchEvent(new Event('input',{bubbles:true}));
  message('붙여넣었습니다. 세부내용 저장을 누르세요.');
 }
 paste.addEventListener('click',async()=>{
  if(!card)return;
  const id=++requestId;
  pendingPaste={...snapshot(),card,id};
  try{
   if(native){native.paste(id);return;}
   onPaste(id,await navigator.clipboard.readText());
  }catch{onPaste(id,null);}
 });
 editor.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!card||save.disabled)return;
  const current=card;
  const text=field.value;
  save.disabled=true;
  try{
   await globalThis.WordvilleStudy.saveDictionary(current.word,current.day,text);
   if(drafts.get(current.key)?.text===text)drafts.delete(current.key);
   if(card!==current)return;
   rememberReturn();
   message(field.value===text?'단어 세부내용을 저장했습니다.':'저장 후 변경된 내용을 다시 저장할 수 있습니다.');
  }catch{
   if(card===current)message('세부내용을 저장하지 못했습니다. 다시 시도해 주세요.');
  }finally{
   if(card===current)save.disabled=false;
  }
 });
 document.addEventListener('wordville-language-changed',()=>message(feedback));
 globalThis.WordvilleDictionary={mount,pendingReturn,onPaste};
})();
