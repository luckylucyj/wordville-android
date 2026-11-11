/* Wordville thought-coding note schema, seven precise memory states. */
(function(root){
 'use strict';
 // N includes both first exposure and 'still unfamiliar after repetitions'.
 // R includes recent forgetting and repeated failure to retrieve a known meaning.
 const STATUSES=Object.freeze([
  {id:'N',label:'처음/매우 낯섦',hint:'처음 보거나 반복해서 봐도 여전히 낯설어요.',action:'뜻을 확인하고 짧게 다시 보기',color:'#7d8796'},
  {id:'R',label:'회상 안 됨',hint:'본 적 있지만 뜻이 안 떠올라요. 어제 알았거나 5번 봤어도 포함해요.',action:'정답 확인 후 예문과 함께 다시 인출',color:'#dc8e4f'},
  {id:'F',label:'의미 흐림',hint:'대략 알지만 정확한 뜻이 명확하지 않아요.',action:'핵심 뜻과 짧은 예문을 다시 확인',color:'#ba985d'},
  {id:'X',label:'다른 단어와 혼동',hint:'비슷한 철자나 뜻의 다른 단어와 섞여요.',action:'헷갈리는 단어 둘을 나란히 비교',color:'#be6787'},
  {id:'U',label:'뜻을 이해 못함',hint:'한국어 해석을 읽어도 개념 자체가 이해되지 않아요.',action:'쉬운 정의와 구체적인 예시 찾기',color:'#876eb4'},
  {id:'C',label:'맥락이 와닿지 않음',hint:'뜻은 알지만 언제 자연스럽게 쓰는지 감이 없어요.',action:'실제 상황 문장 2~3개 확인',color:'#5c94b1'},
  {id:'✓',label:'지금은 회상 가능',hint:'뜻을 보지 않고 지금 스스로 떠올릴 수 있어요.',action:'며칠 뒤 다시 회상해 확인',color:'#538d62'}
 ]);
 const FIELD_NAMES=['overview','topic','category','notes','opinion','summary'];
 const LIMITS={overview:900,topic:180,category:300,notes:6000,opinion:2200,summary:2200};
 const STATUS_IDS=new Set(STATUSES.map(s=>s.id));
 const LEGACY=Object.freeze({new:'N',learning:'N',review:'R',mastered:'✓'});
 const LEGACY_LABEL=Object.freeze({new:'미학습',learning:'학습 중',review:'복습 필요',mastered:'암기 완료'});
 function validDay(d){
  if(d===null||d===undefined||d==='')return false;
  const n=Number(d);return Number.isInteger(n)&&n>=0&&n<=30;
 }
 function dayLabel(d){return Number(d)===0?'이디엄':'Day '+String(Number(d)).padStart(2,'0');}
 function key(id,day){
  if(typeof id!=='string'||!id||id.length>200||!validDay(day))throw new Error('단어 또는 Day가 올바르지 않습니다.');
  return JSON.stringify([Number(day),id]);
 }
 function blank(id,day){
  return {key:key(id,day),wordId:id,day:Number(day),status:'N',hasStatus:false,legacyStatus:'',
    statusChangedAt:'',checks:[false,false,false,false,false],overview:'',topic:'',category:'',notes:'',opinion:'',summary:'',updatedAt:''};
 }
 function clean(data,id,day){
  const v=blank(id,day),source=data&&typeof data==='object'?data:{};
  const sourceStatus=String(source.status||'N');
  v.status=STATUS_IDS.has(sourceStatus)?sourceStatus:(LEGACY[sourceStatus]||'N');
  v.legacyStatus=source.legacyStatus&&LEGACY_LABEL[source.legacyStatus]?source.legacyStatus:
    (Object.hasOwn(LEGACY,sourceStatus)?sourceStatus:'');
  v.hasStatus=source.hasStatus===true||(source.hasStatus===undefined&&
    (['learning','review','mastered'].includes(sourceStatus)||(sourceStatus==='new'&&!!source.updatedAt)));
  v.statusChangedAt=typeof source.statusChangedAt==='string'&&Number.isFinite(Date.parse(source.statusChangedAt))?source.statusChangedAt:'';
  v.checks=Array.from({length:5},(_,i)=>source.checks?.[i]===true);
  for(const n of FIELD_NAMES)v[n]=String(source[n]??'').slice(0,LIMITS[n]);
  v.updatedAt=typeof source.updatedAt==='string'&&Number.isFinite(Date.parse(source.updatedAt))?source.updatedAt:'';
  return v;
 }
 function statusName(id){return STATUSES.find(s=>s.id===id)?.label||STATUSES[0].label;}
 function statusMeta(id){return STATUSES.find(s=>s.id===id)||STATUSES[0];}
 function hasContent(item){return !!item&&(item.hasStatus||item.checks.some(Boolean)||FIELD_NAMES.some(n=>item[n]?.trim()));}
 function distribution(items){
  const counts=Object.fromEntries(STATUSES.map(s=>[s.id,0]));let unmarked=0;
  for(const item of items){if(item?.hasStatus&&Object.hasOwn(counts,item.status))counts[item.status]++;else unmarked++;}
  return {counts,unmarked,total:items.length,marked:items.length-unmarked};
 }
 function normalizeEvent(record){
  if(!record||!STATUS_IDS.has(record.to)||!validDay(record.day)||typeof record.wordId!=='string')return null;
  const date=Date.parse(record.occurredAt);if(!Number.isFinite(date))return null;
  return {...record,occurredAt:new Date(date).toISOString(),reason:String(record.reason||'').slice(0,300)};
 }
 const api={STATUSES,STATUS_IDS,FIELD_NAMES,LIMITS,LEGACY_LABEL,blank,clean,key,dayLabel,validDay,hasContent,statusName,statusMeta,distribution,normalizeEvent};
 root.WordvilleNoteModel=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
