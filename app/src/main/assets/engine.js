(function(root){
 'use strict';
 const DAY=86400000;
 function fresh(){return {version:1,xp:0,coins:0,reviews:{},concepts:[]};}
 function normalize(s){return String(s).normalize('NFKC').trim().toLowerCase().replace(/[.!?。]/g,'').replace(/\s+/g,'');}
 function isCorrect(answer,meaning){return meaning.split(/[,;/]/).some(x=>normalize(x)===normalize(answer)) && normalize(answer)!=='';}
 function review(state,id,correct,now=Date.now()){
  const previous=state.reviews[id]||{streak:0,attempts:0};
  const streak=correct?Math.min(previous.streak+1,5):0;
  const eligible= !previous.due || previous.due<=now;
  const reward=correct&&eligible;
  return {...state,xp:state.xp+(reward?10:0),coins:state.coins+(reward?3:0),reviews:{...state.reviews,[id]:{attempts:previous.attempts+1,streak,due:now+(correct?[1,3,7,14,30][streak-1]*DAY:600000),correct}}};
 }
 function combine(state,a,b,name){
  if(a===b)throw Error('서로 다른 단어를 선택해 주세요.');
  name=String(name).trim();if(!name||name.length>60)throw Error('개념 이름은 1~60자로 입력해 주세요.');
  const key=[a,b].sort().join('|');if(state.concepts.some(c=>c.key===key))throw Error('이미 저장한 단어 조합입니다.');
  return {...state,xp:state.xp+15,coins:state.coins+5,concepts:[...state.concepts,{key,a,b,name}]};
 }
 function wordIds(word){return [...new Set([word.id,...(word.aliases||[])])];}
 function migrateAliases(state,words){
  let next=state;
  for(const word of words){
   const records=wordIds(word).map(id=>state.reviews[id]).filter(Boolean);
   if(!records.length)continue;
   const best=records.reduce((a,b)=>(b.attempts||0)>(a.attempts||0)?b:a);
   if(state.reviews[word.id]===best)continue;
   if(next===state)next={...state,reviews:{...state.reviews}};
   next.reviews[word.id]={...best};
  }
  // Keep legacy records and concept IDs intact for old snapshots and images.
  return next;
 }
 const api={fresh,normalize,isCorrect,review,combine,wordIds,migrateAliases};
 if(typeof module!=='undefined')module.exports=api;root.Wordville=api;
})(typeof globalThis!=='undefined'?globalThis:this);
