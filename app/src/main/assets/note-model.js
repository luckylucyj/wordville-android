/* Wordville thought-coding note schema: local, per word ID and Day. */
(function(root){
 'use strict';
 const STATUSES=Object.freeze([
  {id:'new',label:'미학습',hint:'아직 확인하지 않았어요.'},
  {id:'learning',label:'학습 중',hint:'뜻과 사용법을 공부하고 있어요.'},
  {id:'review',label:'복습 필요',hint:'다시 확인해야 해요.'},
  {id:'mastered',label:'암기 완료',hint:'스스로 기억해 낼 수 있어요.'}
 ]);
 const FIELD_NAMES=['overview','topic','category','notes','opinion','summary'];
 const LIMITS={overview:900,topic:180,category:300,notes:6000,opinion:2200,summary:2200};
 const STATUS_IDS=new Set(STATUSES.map(s=>s.id));
 function dayLabel(d){return Number(d)===0?'이디엄':'Day '+String(Number(d)).padStart(2,'0');}
 function validDay(d){return Number.isInteger(Number(d))&&Number(d)>=0&&Number(d)<=30;}
 function key(id,day){
  if(typeof id!=='string'||!id||id.length>200||!validDay(day))throw new Error('단어/Day가 올바르지 않습니다.');
  return JSON.stringify([Number(day),id]);
 }
 function blank(id,day){return {key:key(id,day),wordId:id,day:Number(day),status:'new',checks:[false,false,false,false,false],overview:'',topic:'',category:'',notes:'',opinion:'',summary:'',updatedAt:''};}
 function clean(data,id,day){
  const v=blank(id,day),source=data&&typeof data==='object'?data:{};
  v.status=STATUS_IDS.has(source.status)?source.status:'new';
  v.checks=Array.from({length:5},(_,i)=>source.checks?.[i]===true);
  for(const n of FIELD_NAMES)v[n]=String(source[n]??'').slice(0,LIMITS[n]);
  v.updatedAt=(typeof source.updatedAt==='string'&&/^\d{4}-\d\d-\d\dT/.test(source.updatedAt))?source.updatedAt:'';
  return v;
 }
 function hasContent(item){return !!item&&(item.status!=='new'||item.checks.some(Boolean)||FIELD_NAMES.some(n=>item[n]?.trim()));}
 function statusName(id){return STATUSES.find(s=>s.id===id)?.label||'미학습';}
 const api={STATUSES,FIELD_NAMES,LIMITS,blank,clean,key,dayLabel,validDay,hasContent,statusName};
 root.WordvilleNoteModel=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
