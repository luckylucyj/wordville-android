/* One authoritative text-answer gate for Canvas fishing and weeding. */
(function(root){
 'use strict';
 const normalize=value=>String(value??'').normalize('NFKC').toLowerCase()
  .replace(/^\s*(?:명사|동사|형용사|부사|명|동|형|부|n|v|adj|adv)\s*[.．:)：]\s*/i,'')
  .replace(/[\s\u200b\u200c\u200d!?？。、．.,'“”\"()\[\]{}·~\-]+/g,'');
 function alternatives(word){
  const values=Array.isArray(word?.meanings)?word.meanings:[word?.meaning];
  const pieces=values.filter(v=>typeof v==='string').flatMap(v=>v.split(/[;,；，、/|]/g));
  return [...new Set(pieces.map(v=>normalize(v)).filter(Boolean))];
 }
 function matches(word,value){
  const normalized=normalize(value);
  if(!normalized||normalized.length>100)return false;
  return alternatives(word).includes(normalized);
 }
 const api={normalize,alternatives,matches};
 root.WordvilleCanvasAnswer=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
