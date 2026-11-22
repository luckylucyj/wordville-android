/* Wordville 3-panel sprite atlas and real VOCA practice queue.
 * No sample words, no external audio files, no second XP source.
 */
(function(root){
 'use strict';
 class SpriteAtlasHelper {
  constructor(){this.sheets={};}
  loadSheet(name,src){
   return new Promise(resolve=>{
    if(!name||!src||typeof root.Image!=='function'){resolve(null);return;}
    const image=new root.Image();
    image.onload=()=>{
     if(image.naturalWidth>0&&image.naturalHeight>=3){
      this.sheets[name]=image;resolve(image);
     }else resolve(null);
    };
    image.onerror=()=>resolve(null);
    image.src=src;
   });
  }
  drawPanel(ctx,sheetName,panelIndex,dx,dy,dw,dh){
   const image=this.sheets[sheetName];
   if(!image||!Number.isInteger(panelIndex)||panelIndex<0||panelIndex>2||
      !Number.isFinite(dw)||!Number.isFinite(dh)||dw<=0||dh<=0)return false;
   const panelHeight=image.naturalHeight/3;
   const sx=image.naturalWidth*.22,sy=panelHeight*(panelIndex+.08);
   const sw=image.naturalWidth*.56,sh=panelHeight*.84;
   ctx.drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh);
   return true;
  }
 }
 class WordvilleStudyManager {
  constructor(words=[],options={}){
   this.queue=[];
   this.pool=[];
   this.masteredIds=new Set();
   this.audioCtx=null;
   this.scope='';
   this.key=options.storageKey||'wordville.canvas.queue.v1';
   this.storage=options.storage??root.localStorage??null;
   this.playSounds=options.playSounds!==false;
   this.setWords(words,options.scope||'all');
  }
  current(){return this.queue[0]||null;}
  setWords(words,scope='all'){
   if(!Array.isArray(words))return false;
   const unique=new Set();
   const pool=words.filter(w=>{
    const id=w?.id==null?'':String(w.id);
    if(!id||unique.has(id))return false;
    unique.add(id);return true;
   });
   const normalizedScope=String(scope||'all');
   // A WebView may initialize before words.json is available. Never replace
   // the saved queue with an empty queue during that brief startup interval.
   if(!pool.length){this.queue=[];this.pool=[];this.scope=normalizedScope;return true;}
   if(normalizedScope===this.scope&&this.pool.length===pool.length&&
      pool.every((w,i)=>String(w.id)===String(this.pool[i].id)))return true;
   this.pool=pool;
   this.scope=normalizedScope;
   const persisted=this.readQueue();
   const byId=new Map(pool.map(w=>[String(w.id),w]));
   const ordered=[];
   if(persisted&&persisted.scope===this.scope&&
      persisted.count===pool.length&&persisted.start===String(pool[0]?.id||'')&&
      persisted.end===String(pool.at(-1)?.id||'')){
    for(const id of persisted.front||[]){
     const item=byId.get(String(id));
     if(item){ordered.push(item);byId.delete(String(id));}
    }
   }
   this.queue=[...ordered,...byId.values()];
   this.persist();
   return true;
  }
  readQueue(){
   try{
    const data=JSON.parse(this.storage?.getItem(this.key)||'null');
    if(data?.version===1&&Array.isArray(data.front))return data;
   }catch{}
   return null;
  }
  persist(){
   try{
    this.storage?.setItem(this.key,JSON.stringify({
     version:1,scope:this.scope,count:this.pool.length,
     start:String(this.pool[0]?.id||''),end:String(this.pool.at(-1)?.id||''),
     front:this.queue.slice(0,24).map(w=>String(w.id))
    }));
    return true;
   }catch{return false;}
  }
  markSuccess(){
   const item=this.queue.shift();
   if(!item)return null;
   this.masteredIds.add(String(item.id));
   this.queue.push(item);
   this.persist();
   this.playTone('success');
   return item;
  }
  markRetry(){
   const item=this.queue.shift();
   if(!item)return null;
   // Two *other* questions must precede this retry. Move rather than duplicate.
   this.queue.splice(Math.min(2,this.queue.length),0,item);
   this.persist();
   this.playTone('fail');
   return item;
  }
  playTone(type){
   if(!this.playSounds)return;
   try{
    const Context=root.AudioContext||root.webkitAudioContext;
    if(!Context)return;
    if(!this.audioCtx)this.audioCtx=new Context();
    if(this.audioCtx.state==='suspended')this.audioCtx.resume().catch(()=>{});
    const osc=this.audioCtx.createOscillator();
    const gain=this.audioCtx.createGain();
    osc.connect(gain);gain.connect(this.audioCtx.destination);
    const now=this.audioCtx.currentTime;
    if(type==='success'){
     osc.type='triangle';
     osc.frequency.setValueAtTime(523.25,now);
     osc.frequency.setValueAtTime(659.25,now+.08);
     osc.frequency.setValueAtTime(783.99,now+.16);
     gain.gain.setValueAtTime(.12,now);
     gain.gain.exponentialRampToValueAtTime(.001,now+.35);
     osc.start(now);osc.stop(now+.35);
    }else{
     osc.type='sine';
     osc.frequency.setValueAtTime(240,now);
     osc.frequency.linearRampToValueAtTime(170,now+.22);
     gain.gain.setValueAtTime(.095,now);
     gain.gain.exponentialRampToValueAtTime(.001,now+.25);
     osc.start(now);osc.stop(now+.25);
    }
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
   }catch{/* Audio is supplementary: never interrupt learning. */}
  }
  dispose(){
   try{this.audioCtx?.close();}catch{}
   this.audioCtx=null;
  }
 }
 root.SpriteAtlasHelper=SpriteAtlasHelper;
 root.WordvilleStudyManager=WordvilleStudyManager;
 if(typeof module!=='undefined'&&module.exports)module.exports={SpriteAtlasHelper,WordvilleStudyManager};
})(typeof globalThis!=='undefined'?globalThis:this);
