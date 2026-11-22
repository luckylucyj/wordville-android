/* Wordville single-player vocabulary game questions. Uses only local VOCA data. */
(function(root){
 'use strict';
 const DAY=86400000;
 const MODES=['fish','wood','capture'];
 const FILTERS=['all','due','wrong'];
 const normalize=s=>String(s||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
 const firstMeaning=w=>String((Array.isArray(w?.meanings)&&w.meanings[0])||w?.meaning||'').split(/[;；]/)[0].trim().slice(0,100);
 const term=w=>String(w?.word||'').trim();
 function blankExample(w){
  const sentence=String(w?.example||'').trim(), target=term(w);
  if(!sentence||!target||target.length>60)return null;
  const escaped=target.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const match=new RegExp('(^|[^A-Za-z])('+escaped+')(?=$|[^A-Za-z])','i');
  if(!match.test(sentence))return null;
  return {prompt:sentence.replace(match,(whole,prefix)=>prefix+'_____'),original:sentence,translation:String(w.translation||'').slice(0,300)};
 }
 function candidates(words,mode,day='all'){
  const seen=new Set();
  return (Array.isArray(words)?words:[]).filter(w=>{
   if(!w||!w.id||!term(w)||!firstMeaning(w))return false;
   if(day!=='all'&&!w.days?.includes(Number(day)))return false;
   if(mode==='capture'&&!blankExample(w))return false;
   const key=normalize(term(w));
   if(seen.has(key))return false;
   seen.add(key);return true;
  });
 }
 function pick(items,random=Math.random){
  if(!items.length)return null;
  const r=Number(random());return items[Math.min(items.length-1,Math.max(0,Math.floor((Number.isFinite(r)?r:0)*items.length)))];
 }
 function question(words,options={}){
  const mode=MODES.includes(options.mode)?options.mode:'fish';
  const pool=candidates(words,mode,options.day||'all');
  const reviews=options.reviews||{}, mistakes=options.mistakes||{}, now=Number(options.now)||Date.now();
  const filter=FILTERS.includes(options.filter)?options.filter:'all';
  const eligible=pool.filter(w=>filter==='wrong'?Number(mistakes[w.id]||0)>0:
   filter==='due'?(reviews[w.id]?.due??0)<=now:true);
  const seen=new Set(options.seen||[]);
  const unseen=eligible.filter(w=>!seen.has(w.id));
  const available=unseen.length>=1?unseen:eligible;
  if(available.length<1)return null;
  const priority=available.filter(w=>Number(mistakes[w.id]||0)>0||(reviews[w.id]?.due??0)<=now);
  const target=pick(priority.length?priority:available,options.random);
  if(!target)return null;
  const meaningMode=mode==='wood';
  const answer=meaningMode?firstMeaning(target):term(target);
  const used=new Set([normalize(answer)]),other=[];
  for(const w of pool){
   if(w.id===target.id)continue;
   const text=meaningMode?firstMeaning(w):term(w),key=normalize(text);
   if(!key||used.has(key))continue;
   used.add(key);other.push(text);
  }
  if(other.length<3)return null;
  // Fisher-Yates on a copy; deterministic injected RNG in tests.
  const random=typeof options.random==='function'?options.random:Math.random;
  const shuffle=array=>{
   const result=array.slice();
   for(let i=result.length-1;i>0;i--){
    const n=Number(random());
    const j=Math.min(i,Math.max(0,Math.floor((Number.isFinite(n)?n:0)* (i+1))));
    [result[i],result[j]]=[result[j],result[i]];
   }
   return result;
  };
  const choices=shuffle([answer,...shuffle(other).slice(0,3)]);
  const example=mode==='capture'?blankExample(target):null;
  return {id:target.id,word:target,mode,answer,choices,
   prompt:mode==='fish'?firstMeaning(target):mode==='wood'?term(target):example.prompt,
   example:example?.original||String(target.example||''),
   translation:example?.translation||String(target.translation||''),
   meaning:firstMeaning(target)};
 }
 function reviewEligible(reviews,id,now=Date.now()){
  const due=reviews?.[id]?.due;
  return !Number.isFinite(due)||due<=now;
 }
 function reward(streak,eligible){
  return eligible?Math.min(6,1+Math.floor(Math.max(0,Number(streak)||0)/3)):0;
 }
 const api={MODES,FILTERS,DAY,firstMeaning,blankExample,candidates,question,reviewEligible,reward};
 root.WordvilleSoloModel=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
