/* Wordville authored hub: one coherent, collision-aligned 600×800 map.
 * The reference garden artwork and fallback canvas art have no baked-in humans.
 * The 17 detailed venue interiors remain available in the Places screen.
 */
(function(root){'use strict';
const W=600,H=800;
const LANDMARKS=[
 {id:'library',name:'도서관',x:300,y:290},
 {id:'greenhouse',name:'식물원',x:78,y:345},
 {id:'cafe',name:'카페',x:520,y:358},
 {id:'square',name:'광장',x:303,y:583},
 {id:'park',name:'공원',x:144,y:586}
];
const palette={
 day:{sky:'#9bd5d3',hill:'#759f85',grass:'#80a96c',grass2:'#679660',stone:'#d5c8ad',stone2:'#e5dabd',shade:'#ac9f83',water:'#70b7c3',roof:'#566d8d',wall:'#e8d6ae',light:'#ffe7a1'},
 dusk:{sky:'#a89bba',hill:'#778b89',grass:'#6e9164',grass2:'#597e62',stone:'#c4b7a3',stone2:'#dbceb8',shade:'#9f8e86',water:'#6f99ab',roof:'#585a78',wall:'#d5bca6',light:'#ffe09e'},
 night:{sky:'#253e5a',hill:'#40596a',grass:'#496c5b',grass2:'#395b4f',stone:'#7e8381',stone2:'#9e9991',shade:'#626e72',water:'#456e83',roof:'#36445c',wall:'#8d948c',light:'#fbe0a3'}
};
const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function poly(c,pts,col){c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function ellipse(c,x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function text(c,s,x,y,col='#513f34',size=9){c.fillStyle=col;c.font='bold '+size+'px monospace';c.textAlign='center';c.fillText(s,x,y);}
function tree(c,x,y,p){
 rect(c,x-5,y-58,10,59,'#765d45');
 for(const [dx,dy,r] of [[-16,-63,27],[17,-70,28],[0,-88,30],[-3,-51,23]]){
  ellipse(c,x+dx,y+dy,r,r*.75,p.grass2);ellipse(c,x+dx-7,y+dy-7,r*.52,r*.3,p.grass);
 }
}
function flowers(c,x,y,w=52){
 ellipse(c,x,y,w,15,'#507957');
 for(let i=0;i<12;i++){
  const xx=x-w+((i*41+17)%(2*w)),yy=y-10+(i*7)%16;
  rect(c,xx,yy,6,5,['#f6c0c8','#eecbe7','#f2e4b6'][i%3]);
 }
}
function lamp(c,x,y,p){
 rect(c,x-2,y-49,4,49,'#4f5154');rect(c,x-7,y-58,14,8,'#42454a');
 rect(c,x-5,y-55,10,12,p.light);rect(c,x-7,y-60,14,3,'#4a464c');
}
function building(c,x,base,w,h,name,p,roof,doorX=w/2){
 rect(c,x+8,base-1,w+18,12,'#47574444');
 rect(c,x,base-h,w,h,p.wall);rect(c,x+w,base-h,17,h-4,'#9f8e79');
 poly(c,[[x-9,base-h],[x+27,base-h-36],[x+w-10,base-h-36],[x+w+12,base-h]],roof);
 for(let yy=base-h+14;yy<base-34;yy+=30){
  for(let xx=x+12;xx<x+w-12;xx+=34){
   rect(c,xx,yy,19,25,'#685b59');rect(c,xx+3,yy+3,13,17,p.light);
   rect(c,xx+9,yy+3,2,17,'#a28c6f');
  }
 }
 rect(c,x+doorX-14,base-39,28,39,'#695447');rect(c,x+doorX-10,base-35,20,31,'#c2a574');
 rect(c,x+doorX-2,base-27,3,3,'#fff0bd');
 rect(c,x+7,base-44,w-14,12,'#946b5e');text(c,name,x+w/2,base-34,'#fff0d0',9);
}
function draw(ctx,period){
 const p=palette[period]||palette.day,c=ctx;
 rect(c,0,0,W,H,p.grass);
 rect(c,0,0,W,133,p.sky);
 poly(c,[[0,125],[63,103],[119,124],[209,89],[290,128],[394,94],[474,117],[545,87],[600,118],[600,167],[0,167]],p.hill);
 for(let i=0;i<18;i++)tree(c,(i*83+27)%640-20,157+(i%3)*4,p);
 // Academy is a single destination, not a collage of interior rooms.
 building(c,189,183,223,122,'ACADEMY · LIBRARY',p,p.roof,111);
 rect(c,272,45,56,24,'#4f6686');
 poly(c,[[270,46],[300,19],[330,46]],'#c8b57a');
 rect(c,297,10,6,15,'#e5c578');
 // Two readable village venues frame a deliberately wide, clear pedestrian plaza.
 building(c,22,291,132,91,'CAFE',p,'#ac765a',65);
 building(c,446,291,131,94,'BOOKS',p,'#607d86',65);
 // Footpaths: spawn nodes and navigation edges are designed to remain on these stones.
 poly(c,[[230,184],[371,184],[437,305],[475,366],[484,515],[402,615],[210,615],[118,512],[119,364],[162,305]],p.stone);
 poly(c,[[250,191],[351,191],[403,329],[440,367],[447,498],[384,580],[230,580],[153,500],[158,369],[197,325]],p.stone2);
 for(let y=188;y<619;y+=17)for(let x=111;x<488;x+=26){
  if((x+y)%7===0)rect(c,x,y,12,2,p.shade);
 }
 // Fountain is genuinely impassable in village-model at (300,252).
 ellipse(c,300,252,77,49,'#9b9c94');ellipse(c,300,249,71,42,'#d8d3c2');
 ellipse(c,300,246,64,33,p.water);ellipse(c,300,246,45,22,'#89c7c9');
 rect(c,292,222,16,25,'#b6b2a6');rect(c,285,219,30,7,'#dfd8c2');
 rect(c,299,206,2,14,'#d9f6f0');
 flowers(c,210,228,30);flowers(c,395,229,30);
 // Two gardens and benches frame the open approach, leaving a 200px walking lane.
 flowers(c,113,358,63);flowers(c,494,358,63);
 flowers(c,135,472,53);flowers(c,467,471,49);
 rect(c,87,395,55,5,'#83644e');rect(c,92,388,46,4,'#ae8662');
 rect(c,464,395,55,5,'#83644e');rect(c,469,388,46,4,'#ae8662');
 for(const [x,y] of [[162,331],[436,330],[142,521],[462,520]])lamp(c,x,y,p);
 tree(c,52,419,p);tree(c,554,421,p);
 // Southern gate and bridge are scenic; the water does not intersect resident routes.
 rect(c,0,631,W,169,p.grass2);
 poly(c,[[0,680],[140,631],[465,631],[600,672],[600,800],[0,800]],p.water);
 poly(c,[[167,630],[215,592],[389,592],[433,630],[433,657],[167,657]],'#b4a38c');
 poly(c,[[168,628],[215,598],[388,598],[432,628]],p.stone2);
 for(let x=205;x<411;x+=31)rect(c,x,612,18,5,'#ad9e87');
 for(let i=0;i<8;i++){let x=(i*83+53)%600,y=703+(i*29)%88;ellipse(c,x,y,12,4,'#86b4a3');}
 flowers(c,65,620,52);flowers(c,535,617,54);
 if(period==='night')rect(c,0,0,W,H,'#14233835');
 else if(period==='dusk')rect(c,0,0,W,H,'#76536b18');
}
const hubImage=typeof Image==='undefined'?{complete:false,naturalWidth:0}:new Image();
if(typeof Image!=='undefined'){hubImage.decoding='async';hubImage.src='art/hub-garden.webp';}
const cached=new Map();
function paint(ctx,period){
 if(hubImage.complete&&hubImage.naturalWidth===W&&hubImage.naturalHeight===H){
   ctx.imageSmoothingEnabled=false;ctx.drawImage(hubImage,0,0,W,H);
   if(period==='night')rect(ctx,0,0,W,H,'#17294272');
   else if(period==='dusk')rect(ctx,0,0,W,H,'#78546b36');
   return;
 }
 let img=cached.get(period);
 if(!img){img=document.createElement('canvas');img.width=W;img.height=H;draw(img.getContext('2d'),period);cached.set(period,img);}
 ctx.imageSmoothingEnabled=false;ctx.drawImage(img,0,0);
}
root.WordvilleHubMap={paint,landmarks:LANDMARKS,image:hubImage,scale:{width:W,height:H},humanDecorations:0};
})(globalThis);
