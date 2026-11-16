/* Vocabulary display localization: never mutate word.meaning, XP, reviews or saved notes. */
(() => {
'use strict';
const I=globalThis.WordvilleI18n;
const LANGS=['en','zh-CN','ja'], KEY='wordville.gloss-translations.v1.';
const translations=Object.fromEntries(LANGS.map(lang=>{
 let stored={};
 try{
  const raw=JSON.parse(localStorage.getItem(KEY+lang)||'{}');
  if(raw&&typeof raw==='object'&&!Array.isArray(raw))stored=raw;
 }catch{}
 return [lang,stored];
}));
const queue=[],queued=new Set(),failed=new Set();
const inFlight=new Map();
let serial=0,activeRequest=null,scheduled=false;
const text={
 en:{loading:'Preparing on-device translation… A language pack may download the first time (about 30 MB).',working:'Translating displayed vocabulary…',failed:'English meanings are unavailable. Retry translation.',unsupported:'Vocabulary translation requires the Android app.',retry:'Retry translation'},
 'zh-CN':{loading:'正在准备设备端翻译… 首次使用可能需要下载约30MB语言包。',working:'正在翻译当前单词…',failed:'翻译暂不可用，请重试。',unsupported:'单词翻译需要 Android 应用。',retry:'重试翻译'},
 ja:{loading:'端末内翻訳を準備中… 初回は約30MBの言語パックが必要な場合があります。',working:'表示中の単語を翻訳中…',failed:'翻訳が利用できません。再試行してください。',unsupported:'単語の翻訳には Android アプリが必要です。',retry:'翻訳を再試行'}
};
const nativeAvailable=()=>typeof globalThis.WordvilleTranslate?.translateBatch==='function';
const placeholders={en:{pending:'Translating meaning…',unavailable:'English meaning unavailable'},'zh-CN':{pending:'正在翻译词义…',unavailable:'暂无法显示释义'},ja:{pending:'意味を翻訳中…',unavailable:'意味を表示できません'}};
const containsKorean=value=>/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/u.test(String(value));
// Immediate verified glosses for the first visible Day 30 cards. All other
// meanings continue through the native, cached KO→target translation pipeline.
const offlineGlosses={
 'zh-CN':{'보험':'保险','영양':'营养','영양분이 많은':'营养丰富的','영양사':'营养师'},
 ja:{'보험':'保険','영양':'栄養','영양분이 많은':'栄養価が高い','영양사':'栄養士'},
 en:{'보험':'insurance','영양':'nutrition','영양분이 많은':'nutritious','영양사':'nutritionist'}
};
function localizedGloss(original,locale){
 const cached=translations[locale]?.[original];
 if(typeof cached==='string'&&cached.trim()&&!containsKorean(cached))return cached.trim();
 return offlineGlosses[locale]?.[original]||null;
}
function current(){return I?.language||'ko';}
function display(source,locale=current()){
 const original=String(source||'');
 if(locale==='ko'||!original.trim()||!containsKorean(original))return original;
 const translated=localizedGloss(original,locale);
 if(translated)return translated;
 if(locale===current())enqueue(original,locale);
 return placeholders[locale]?.pending||'Meaning unavailable';
}
function bindText(el,original,word=''){
 if(!el)return;
 el.dataset.wvOriginalGloss=String(original||'');
 el.dataset.wvOriginalWord=String(word||'');
 applyElement(el);
}
function bindOption(el,word,original){
 if(!el)return;
 el.dataset.wvOriginalGloss=String(original||'');
 el.dataset.wvOriginalWord=String(word||'');
 el.dataset.wvGlossFormat='option';
 applyElement(el);
}
function requestGloss(original){
 const lang=current();
 if(lang!=='ko'&&original)enqueue(String(original),lang);
}
function applyElement(el){
 const locale=current(),original=el.dataset.wvOriginalGloss||'';
 const option=el.dataset.wvGlossFormat==='option';
 const word=el.dataset.wvOriginalWord||'';
 if(locale==='ko'||!original.trim()||!containsKorean(original)){
  const next=option?(word+(original?' · '+original:'')):original;
  if(el.textContent!==next)el.textContent=next;
  el.removeAttribute('aria-busy');
  return;
 }
 const mapped=localizedGloss(original,locale);
 const available=!!mapped;
 if(available){
  const next=option?(word+' · '+mapped):mapped;
  if(el.textContent!==next)el.textContent=next;
  el.removeAttribute('aria-busy');
 } else {
  // Never display untranslated Korean definitions in a non-Korean UI.
  // Keep the word selectable and preserve the original definition in storage.
  const canTranslate=nativeAvailable()&&!failed.has(locale);
  const next=option?word:canTranslate?placeholders[locale].pending:placeholders[locale].unavailable;
  if(el.textContent!==next)el.textContent=next;
  if(canTranslate){
   el.setAttribute('aria-busy','true');
   // A selector can have thousands of options: translate only chosen words,
   // not every option during app startup.
   if(!option)enqueue(original,locale);
  }else el.removeAttribute('aria-busy');
 }
}
function bindMissingCardGlosses(){
 // Guard against any word card created by another renderer without binding.
 // A missing binding must never leave source Korean in Chinese/Japanese UI.
 const root=document.getElementById('words');
 if(!root)return;
 root.querySelectorAll('.word span').forEach(el=>{
  if(!Object.hasOwn(el.dataset,'wvOriginalGloss')){
   const word=el.closest('.word')?.querySelector('strong')?.textContent||'';
   bindText(el,el.textContent||'',word);
  }
 });
}
function refreshVisible(){
 if(typeof document==='undefined')return;
 bindMissingCardGlosses();
 document.querySelectorAll('[data-wv-original-gloss]').forEach(applyElement);
 renderStatus();
}
function enqueue(source,locale){
 if(!nativeAvailable()||failed.has(locale)||localizedGloss(source,locale)||!containsKorean(source))return;
 const key=locale+'\u0000'+source;
 if(queued.has(key))return;
 queued.add(key);queue.push({source,locale});
 if(!scheduled){scheduled=true;setTimeout(processQueue,35);}
}
function processQueue(){
 scheduled=false;
 if(activeRequest||!nativeAvailable())return;
 const lang=current();
 if(lang==='ko'||failed.has(lang))return;
 const group=[];
 for(let i=0;i<queue.length&&group.length<16;){
  const item=queue[i];
  if(item.locale!==lang||localizedGloss(item.source,lang)){
   queued.delete(item.locale+'\u0000'+item.source);
   queue.splice(i,1);
   continue;
  }
  queue.splice(i,1);group.push(item.source);
 }
 if(!group.length){renderStatus();return;}
 const id=++serial;
 activeRequest={id,lang,group};
 inFlight.set(id,activeRequest);
 renderStatus();
 try{globalThis.WordvilleTranslate.translateBatch(JSON.stringify(group),lang,id);}
 catch{inFlight.delete(id);activeRequest=null;failed.add(lang);refreshVisible();}
}
function onNativeResult(json){
 let result;
 try{result=typeof json==='string'?JSON.parse(json):json;}catch{return;}
 if(!result||!Number.isInteger(result.id))return;
 const request=inFlight.get(result.id);
 if(!request||request.lang!==result.locale)return;
 inFlight.delete(result.id);
 if(activeRequest?.id===result.id)activeRequest=null;
 const values=Array.isArray(result.values)?result.values:[];
 let got=0;
 for(let i=0;i<request.group.length;i++){
  const source=request.group[i],value=values[i];
  queued.delete(request.lang+'\u0000'+source);
  if(typeof value==='string'&&value.trim().length&&value.length<600&&!containsKorean(value)){
   translations[request.lang][source]=value.trim();
   got++;
  }
 }
 if(result.error||got===0){
  failed.add(request.lang);
  for(let i=queue.length-1;i>=0;i--)if(queue[i].locale===request.lang)queue.splice(i,1);
 }else{
  try{localStorage.setItem(KEY+request.lang,JSON.stringify(translations[request.lang]));}catch{}
 }
 refreshVisible();
 if(queue.some(item=>item.locale===current())&&!failed.has(current()))setTimeout(processQueue,0);
}
function renderStatus(){
 if(typeof document==='undefined')return;
 const el=document.getElementById('wv-gloss-translation-status');
 if(!el)return;
 const lang=current();
 el.hidden=lang==='ko';
 if(el.hidden)return;
 const messages=text[lang],working=activeRequest?.lang===lang||queue.some(x=>x.locale===lang);
 const status=el.querySelector('.wv-gloss-status-text');
 const button=el.querySelector('button');
 const error=failed.has(lang);
 status.textContent=!nativeAvailable()?messages.unsupported:error?messages.failed:working?messages.working:messages.loading;
 button.hidden=!error;
 button.textContent=messages.retry;
}
function addStatus(){
 if(document.getElementById('wv-gloss-translation-status'))return;
 const host=document.getElementById('learn');
 if(!host)return;
 const bar=document.createElement('div');bar.id='wv-gloss-translation-status';bar.className='wv-gloss-status';
 bar.setAttribute('role','status');bar.setAttribute('aria-live','polite');
 bar.setAttribute('data-i18n-ignore','');
 const span=document.createElement('span');span.className='wv-gloss-status-text';
 const button=document.createElement('button');button.type='button';button.hidden=true;
 button.addEventListener('click',()=>{
  const lang=current();
  failed.delete(lang);
  document.querySelectorAll('[data-wv-original-gloss]').forEach(el=>{
   if(el.dataset.wvOriginalGloss)enqueue(el.dataset.wvOriginalGloss,lang);
  });
  refreshVisible();
 });
 bar.append(span,button);
 host.prepend(bar);
 renderStatus();
}
if(typeof document!=='undefined'){
 const init=()=>{
  addStatus();refreshVisible();
  const host=document.getElementById('words');
  if(host&&typeof MutationObserver!=='undefined'){
   new MutationObserver(()=>bindMissingCardGlosses()).observe(host,{childList:true,subtree:true});
  }
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
 document.addEventListener('wordville-language-changed',()=>{
  // An old response may still arrive; its locale is stored separately and is
  // never applied to a new language's card.
  const lang=current();
  failed.delete(lang);
  refreshVisible();
  if(queue.some(x=>x.locale===lang))setTimeout(processQueue,0);
 });
}
globalThis.WordvilleVocabularyLocale={bindText,bindOption,requestGloss,display,onNativeResult,refreshVisible,get language(){return current();},get nativeAvailable(){return nativeAvailable();}};
})();