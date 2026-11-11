/* Venue images are loaded from the 17 verified local art/*.webp assets by world-art.js.
 * The optional user-reference overrides are opt-in: never replace a working picture
 * with an unconditional request for a missing art/wordville-*.webp file.
 */
(function(root){'use strict';
const base=root.WordvilleWorldArt?.venueImages;if(!base)return;
const overrides=root.WordvilleVenueOverrides||{};
for(const id of ['pool','burger','bookstore']){
 const src=overrides[id];
 if(typeof src!=='string'||!src.startsWith('art/')||!src.endsWith('.webp'))continue;
 const previous=base[id],image=new Image();image.decoding='async';
 image.onload=()=>document.dispatchEvent(new CustomEvent('wordville-art-ready',{detail:{id}}));
 image.onerror=()=>{base[id]=previous;document.dispatchEvent(new CustomEvent('wordville-art-ready',{detail:{id,error:true}}));};
 base[id]=image;image.src=src;
}
})(globalThis);
