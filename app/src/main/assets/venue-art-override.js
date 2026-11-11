/* Prefer user's exact source references; preserve existing art as offline fallback. */
(function(root){'use strict';
const base=root.WordvilleWorldArt?.venueImages;if(!base)return;
for(const id of ['pool','burger','bookstore']){
 const previous=base[id],image=new Image();image.decoding='async';
 image.onload=()=>document.dispatchEvent(new CustomEvent('wordville-art-ready',{detail:{id}}));
 image.onerror=()=>{base[id]=previous;document.dispatchEvent(new CustomEvent('wordville-art-ready',{detail:{id}}));};
 base[id]=image;image.src='art/wordville-'+id+'.webp';
}
})(globalThis);
