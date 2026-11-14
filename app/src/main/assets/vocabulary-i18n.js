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
 en:{loading:'Preparing on-device translation… A language pack may download the first time (about 30 MB).',working:'Translating displayed vocabulary…',failed:'Translation model unavailable. Original Korean meanings are shown.',unsupported:'Vocabulary translation requires the Android app.',retry:'Retry translation'},
 'zh-CN':{loading:'正在准备设备端翻译… 首次使用可能需要下载约30MB语言包。',working:'正在翻译当前单词…',failed:'无法使用翻译模型，暂时显示韩语原文。',unsupported:'单词翻译需要 Android 应用。',retry:'重试翻译'},
 ja:{loading:'端末内翻訳を準備中… 初回は約30MBの言語パックが必要な場合があります。',working:'表示中の単語を翻訳中…',failed:'翻訳モデルが使えません。元の韓国語を表示します。',unsupported:'単語の翻訳には Android アプリが必要です。',retry:'翻訳を再試行'}
};
const nativeAvailable=()=>typeof globalThis.WordvilleTranslate?.translateBatch==='function';
function current(){return I?.language||'ko';}
function display(source,locale=current()){
 const original=String(source||'');
 if(locale==='ko'||!original.trim())return original;
 const translated=translations[locale]?.[original];
 return translated&&typeof translated==='string'?translated:original;
}
function bindText(el,original,word=''){
 if(!el)return;
 el.dataset.wvOriginalGloss=String(original||'');
 el.dataset.wvOriginalWord=String(word||'');
 applyElement(el);
}
function applyElement(el){
 const locale=current(),original=el.dataset.wvOriginalGloss||'';
 if(locale==='ko'||!original.trim()){el.textContent=original;return;}
 const mapped=translations[locale]?.[original];
 if(mapped){
  el.textContent=mapped;
  el.removeAttribute('aria-busy');
 } else {
  // When a translation model has not been downloaded yet, show the source and
  // explicitly signal that it is untranslated instead of inventing meanings.
  el.textContent=original;
  if(nativeAvailable()&&!failed.has(locale)){
   el.setAttribute('aria-busy','true');
   enqueue(original,locale);
  }else el.removeAttribute('aria-busy');
 }
}
function refreshVisible(){
 if(typeof document==='undefined')return;
 document.querySelectorAll('[data-wv-original-gloss]').forEach(applyElement);
 renderStatus();
}
function enqueue(source,locale){
 if(!nativeAvailable()||failed.has(locale)||translations[locale]?.[source])return;
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
  if(item.locale!==lang||translations[lang]?.[item.source]){
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
  if(typeof value==='string'&&value.trim().length&&value.length<600){
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
 const init=()=>{addStatus();refreshVisible();};
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
globalThis.WordvilleVocabularyLocale={bindText,display,onNativeResult,refreshVisible,get language(){return current();},get nativeAvailable(){return nativeAvailable();}};
})();