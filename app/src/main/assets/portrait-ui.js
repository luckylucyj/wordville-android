/* Wordville residents, pixel-portrait sheet supplied for this project.
 * Keep village's existing interaction and learning logic intact. */
(() => {
 'use strict';
 const ids=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily'];
 const labels=['알렉스','엘리엇','하비','샘','세바스찬','셰인','헤일리','레아','마루','페니','애비게일','에밀리'];
 const sheet='portraits/wordville-portraits-original.png';
 const spriteSheet='portraits/wordville-poses-hires.webp';
 const spriteImage=new Image();spriteImage.decoding='async';spriteImage.src=spriteSheet;
 const image=new Image();image.decoding='async';image.src=sheet;
 const order=Object.fromEntries(ids.map((id,i)=>[id,i]));
 function position(id){const i=order[id];if(i==null)return null;return {index:i,col:i%4,row:Math.floor(i/4)};}
 function portrait(id,extra=''){const p=position(id);if(!p)return document.createElement('span');const el=document.createElement('span');el.className='wv-portrait '+extra;el.setAttribute('aria-hidden','true');el.style.backgroundPosition=(p.col*100/3)+'% '+(p.row*50)+'%';return el;}
 function decorate(){
   const list=document.getElementById('resident-list');
   for(const button of list?.querySelectorAll('[data-person]')||[]){
     const id=button.dataset.person;if(!position(id))continue;
     button.querySelector('.wv-portrait')?.remove();
     const dot=button.querySelector('.resident-dot');dot?.remove();
     button.prepend(portrait(id,'wv-portrait-small'));
     button.title=labels[order[id]]+' 주민 만나기';
   }
   const neighbors=document.querySelector('.neighbors');
   if(neighbors)neighbors.open=true;
   const panel=document.getElementById('village-dialogue');
   const speaker=document.getElementById('speaker');
   if(!panel||!speaker)return;
   let last='';
   function sync(){
     const id=ids[labels.indexOf(speaker.textContent.trim())];if(id===last)return;last=id;
     panel.querySelector('.wv-dialog-portrait')?.remove();
     if(id)panel.prepend(portrait(id,'wv-dialog-portrait'));
   }
   new MutationObserver(sync).observe(speaker,{characterData:true,childList:true,subtree:true});
   sync();
 }
 globalThis.WordvillePortraits={image,spriteImage,order,position,portrait,sheet,spriteSheet,portraitCell:384,spriteCell:{width:164,height:252}};
 // Loaded with defer after village.js: HTML and residents already exist.
 decorate();
 // Safely populate late-added residents without duplicating portraits.
 const list=document.getElementById('resident-list');
 if(list)new MutationObserver(()=>{if(list.querySelector('[data-person]:not(:has(.wv-portrait))'))decorate();}).observe(list,{childList:true});
})();