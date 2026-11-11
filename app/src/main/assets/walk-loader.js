/* Nearest-neighbour directional sprites with safe legacy fallback. */
(function(root){'use strict';
const names=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily','cat','dog'],images={};
for(const id of names){const img=new Image();img.decoding='async';img.src='walk/'+id+'.png';images[id]=img;}
const rows={down:0,right:1,left:2,up:3};
function paint(c,p,x,y,opt={}){const id=p.id||p,im=images[id],animal=id==='cat'||id==='dog',sw=animal?64:48,sh=animal?48:72;
 if(!im?.complete||!im.naturalWidth||im.naturalWidth!==8*sw||im.naturalHeight!==4*sh)return false;
 const direction=rows[p.direction]!==undefined?p.direction:(p.heading<0?'left':'right'),frame=opt.walking===false?0:Math.floor((p.steps||0)*10)%8;
 const w=Math.round(opt.width||(animal?29:61)),h=Math.round(opt.height||(animal?26:94));
 c.save();c.imageSmoothingEnabled=false;
 c.fillStyle='#27332c55';c.beginPath();c.ellipse(Math.round(x),Math.round(y+2),Math.max(5,w*.26),Math.max(2,w*.07),0,0,Math.PI*2);c.fill();
 c.drawImage(im,frame*sw,rows[direction]*sh,sw,sh,Math.round(x-w/2),Math.round(y-h+5),w,h);
 c.restore();return true;
}
function drawPets(c,t){const pets=[{id:'cat',x:247+Math.sin(t*.45)*32,y:469+Math.cos(t*.45)*8,direction:Math.cos(t*.45)>0?'right':'left',steps:t}, {id:'dog',x:450+Math.sin(t*.34)*25,y:590+Math.cos(t*.34)*12,direction:Math.cos(t*.34)>0?'right':'left',steps:t}];
 for(const p of pets){if(!paint(c,p,p.x,p.y,{width:37,height:28,walking:true})){c.save();c.fillStyle=p.id==='cat'?'#c98d59':'#ead3a3';c.fillRect(Math.round(p.x-8),Math.round(p.y-13),16,10);c.fillRect(Math.round(p.x-5),Math.round(p.y-19),10,8);c.fillStyle='#423b31';c.fillRect(Math.round(p.x+2),Math.round(p.y-16),2,2);c.restore();}}
}
root.WordvilleWalk={images,paint,drawPets,frameCount:8,fps:10};
})(globalThis);
