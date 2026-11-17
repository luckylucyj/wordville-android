/* Wordville residents, pixel-portrait sheet supplied for this project.
 * Keep village's existing interaction and learning logic intact. */
(() => {
 'use strict';
 const ids=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily'];
 const labels=['알렉스','엘리엇','하비','샘','세바스찬','셰인','헤일리','레아','마루','페니','애비게일','에밀리'];
 const guests=globalThis.VillageModel.people.filter(person=>!ids.includes(person.id));
 const guestOrder=new Map(guests.map(({id},i)=>[id,i]));
 // Three portrait-only overrides, ordered within the authored 3 × 96px atlas.
 // Walking/idle sprites remain separately animated on the native 48px grid.
 const referencePortraitSlots=Object.freeze({momo:0,madoka:1,homura:2});
 const galleryPeople=[...ids.map((id,i)=>({id,name:labels[i]})),...guests];
 const sheet='portraits/wordville-portraits-original.png';
 const spriteSheet='portraits/wordville-walk-4phase.png';
 const spriteImage=new Image();spriteImage.decoding='async';spriteImage.src=spriteSheet;
 const image=new Image();image.decoding='async';image.src=sheet;
 const order=Object.fromEntries(ids.map((id,i)=>[id,i]));
 function position(id){const i=order[id];if(i==null)return null;return {index:i,col:i%4,row:Math.floor(i/4)};}
 function portrait(id,extra=''){
  const p=position(id), guest=guestOrder.get(id);
  const el=document.createElement('span');
  if(!p&&guest===undefined)return el;
  el.className='wv-portrait '+extra;
  el.setAttribute('aria-hidden','true');
  if(p)el.style.backgroundPosition=(p.col*100/3)+'% '+(p.row*50)+'%';
  else {
   el.classList.add('wv-guest-portrait');
   if(Object.prototype.hasOwnProperty.call(referencePortraitSlots,id)){
    el.classList.add('wv-reference-portrait');
    el.style.backgroundPosition=(referencePortraitSlots[id]*50)+'% 0%';
   }else{
    el.style.backgroundPosition=(guest%5*25)+'% '+(Math.floor(guest/5)*100)+'%';
   }
  }
  return el;
 }
 function decorate(){
   const list=document.getElementById('resident-list');
   for(const button of list?.querySelectorAll('[data-person]')||[]){
     const id=button.dataset.person;if(!position(id)&&!guestOrder.has(id))continue;
     button.querySelector('.wv-portrait')?.remove();
     const dot=button.querySelector('.resident-dot');dot?.remove();
     const art=portrait(id,'wv-portrait-small');
     // Use the parent button as the single accessible click target.
     button.prepend(art);
     const original=galleryPeople.find(p=>p.id===id).name;
     const name=globalThis.WordvilleI18n?.translate(original)||original;
     const action=globalThis.WordvilleI18n?.translate('현재 위치로 이동')||'현재 위치로 이동';
     button.setAttribute('aria-label',name+' — '+action);
     button.title=name+' — '+action;
   }
   const neighbors=document.querySelector('.neighbors');
   if(neighbors)neighbors.open=true;
   const panel=document.getElementById('village-dialogue');
   const speaker=document.getElementById('speaker');
   if(!panel||!speaker)return;
   let last='';
   function sync(){
     const shown=speaker.textContent.trim();const person=galleryPeople.find(({name})=>shown===name||shown===globalThis.WordvilleI18n?.translate(name));const id=person?.id;if(id===last)return;last=id;
     panel.querySelector('.wv-dialog-portrait-jump')?.remove();
     if(id){
      const jump=document.createElement('button');
      jump.type='button';jump.className='wv-dialog-portrait-jump';
      jump.setAttribute('aria-label',person.name+' 현재 장소로 이동');
      jump.append(portrait(id,'wv-dialog-portrait'));
      jump.addEventListener('click',()=>globalThis.WordvilleVillage?.visitResident?.(id));
      panel.prepend(jump);
     }
   }
   new MutationObserver(sync).observe(speaker,{characterData:true,childList:true,subtree:true});
   sync();
 }
 globalThis.WordvillePortraits={image,spriteImage,order,position,portrait,sheet,spriteSheet,portraitCell:384,spriteCell:{width:160,height:256,frames:4}};
 // Loaded with defer after village.js: HTML and residents already exist.
 decorate();
 document.addEventListener('wordville-language-changed',()=>{
  for(const button of document.querySelectorAll('#resident-list [data-person]')){
   const id=button.dataset.person;if(!position(id)&&!guestOrder.has(id))continue;
   const original=galleryPeople.find(p=>p.id===id).name;
     const name=globalThis.WordvilleI18n?.translate(original)||original;
   const action=globalThis.WordvilleI18n?.translate('현재 위치로 이동')||'현재 위치로 이동';
   button.setAttribute('aria-label',name+' — '+action);
   button.title=name+' — '+action;
  }
 });
 // Safely populate late-added residents without duplicating portraits.
 const list=document.getElementById('resident-list');
 if(list)new MutationObserver(()=>{if(list.querySelector('[data-person]:not(:has(.wv-portrait))'))decorate();}).observe(list,{childList:true});
})();