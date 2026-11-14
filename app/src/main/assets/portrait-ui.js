/* Wordville residents, pixel-portrait sheet supplied for this project.
 * Keep village's existing interaction and learning logic intact. */
(() => {
 'use strict';
 const ids=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily'];
 const labels=['알렉스','엘리엇','하비','샘','세바스찬','셰인','헤일리','레아','마루','페니','애비게일','에밀리'];
 const sheet='portraits/wordville-portraits-original.png';
 const spriteSheet='portraits/wordville-walk-4phase.png';
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
     const art=portrait(id,'wv-portrait-small');
     art.title='자화상을 누르면 현재 위치로 이동';
     art.setAttribute('role','button');art.setAttribute('tabindex','0');
     art.removeAttribute('aria-hidden');
     art.setAttribute('aria-label',labels[order[id]]+' 현재 장소로 이동');
     const navigate=e=>{
      e.stopPropagation();e.preventDefault();
      globalThis.WordvilleVillage?.visitResident?.(id);
     };
     art.addEventListener('click',navigate);
     art.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){navigate(e);}});
     button.prepend(art);
     button.title=labels[order[id]]+' 주민 선택 · 자화상 터치 시 위치 이동';
   }
   const neighbors=document.querySelector('.neighbors');
   if(neighbors)neighbors.open=true;
   const panel=document.getElementById('village-dialogue');
   const speaker=document.getElementById('speaker');
   if(!panel||!speaker)return;
   let last='';
   function sync(){
     const shown=speaker.textContent.trim();const id=ids.find((candidate,i)=>shown===labels[i]||shown===globalThis.WordvilleI18n?.translate(labels[i]));if(id===last)return;last=id;
     panel.querySelector('.wv-dialog-portrait-jump')?.remove();
     if(id){
      const jump=document.createElement('button');
      jump.type='button';jump.className='wv-dialog-portrait-jump';
      jump.setAttribute('aria-label',labels[order[id]]+' 현재 장소로 이동');
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
 // Safely populate late-added residents without duplicating portraits.
 const list=document.getElementById('resident-list');
 if(list)new MutationObserver(()=>{if(list.querySelector('[data-person]:not(:has(.wv-portrait))'))decorate();}).observe(list,{childList:true});
})();