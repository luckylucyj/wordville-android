(function(root){
'use strict';

const accents=new Set(['en-US','en-GB']);

function voiceFor(voices,accent){
 return voices.filter(voice=>voice.lang.replaceAll('_','-').toLowerCase()===accent.toLowerCase())
  .sort((a,b)=>Number(b.localService)-Number(a.localService)||Number(b.default)-Number(a.default))[0];
}

function lookupUrl(term){
 const slug=term.trim().toLowerCase().replace(/\s+/g,'-');
 return 'https://dictionary.cambridge.org/dictionary/english/'+encodeURIComponent(slug);
}

function spokenText(word){
 return word.word==='resume'&&/이력서/.test(word.meaning)?'résumé':word.word;
}

const api={voiceFor,lookupUrl,spokenText};
root.WordvillePronunciation=api;
if(typeof document==='undefined')return;

const dialog=document.getElementById('word-dialog');
const controls=document.getElementById('wv-pronunciation');
const status=document.getElementById('wv-pronunciation-status');
const dictionary=document.getElementById('wv-pronunciation-dictionary');
let word=null,currentId=0,timeout=null,playing=null;

function clear(){
 clearTimeout(timeout);
 timeout=null;
 playing=null;
 for(const button of controls.querySelectorAll('[data-accent]'))button.setAttribute('aria-pressed','false');
}

function stop(){
 currentId++;
 clear();
 root.WordvilleSpeech?.stop();
 root.speechSynthesis?.cancel();
 status.textContent='';
 dictionary.hidden=true;
}

api.mount=entry=>{
 stop();
 word=entry;
 dictionary.href=lookupUrl(spokenText(entry));
};

api.onNativeResult=(id,state)=>{
 if(id!==currentId||!playing)return;
 if(state==='playing'){
  status.textContent=playing==='en-US'?'미국식 발음 재생 중':'영국식 발음 재생 중';
  return;
 }
 clear();
 const missing=state==='unavailable';
 status.textContent=missing?'선택한 지역의 음성을 재생할 수 없습니다.':'';
 dictionary.hidden=!missing;
};

function speak(accent){
 if(!word||!accents.has(accent))return;
 stop();
 const id=currentId;
 playing=accent;
 controls.querySelector('[data-accent="'+accent+'"]').setAttribute('aria-pressed','true');
 status.textContent='음성을 준비하고 있습니다.';
 timeout=setTimeout(()=>{
  root.WordvilleSpeech?.stop();
  root.speechSynthesis?.cancel();
  api.onNativeResult(id,'unavailable');
 },12000);
 try{
  const term=spokenText(word);
  if(root.WordvilleSpeech?.speak){
   root.WordvilleSpeech.speak(term,accent,id,word.id);
   return;
  }
  const synthesis=root.speechSynthesis;
  const voice=synthesis&&voiceFor(synthesis.getVoices(),accent);
  if(!voice||!root.SpeechSynthesisUtterance){
   api.onNativeResult(id,'unavailable');
   return;
  }
  const phrase=new root.SpeechSynthesisUtterance(term);
  phrase.lang=accent;
  phrase.voice=voice;
  phrase.rate=.88;
  phrase.onstart=()=>api.onNativeResult(id,'playing');
  phrase.onend=()=>api.onNativeResult(id,'done');
  phrase.onerror=()=>api.onNativeResult(id,'unavailable');
  synthesis.speak(phrase);
 }catch{
  api.onNativeResult(id,'unavailable');
 }
}

for(const button of controls.querySelectorAll('[data-accent]')){
 button.addEventListener('click',()=>speak(button.dataset.accent));
}
dialog.addEventListener('close',()=>{if(!dialog.open)stop();});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&playing)stop();
});
})(globalThis);
