(function(root){
'use strict';
const W=256,H=210,INK='#3c293b',CREAM='#fff0d1';
const roomArt=new Map();

function painter(c,room,map){
 const [wall,panel,floor,seam,wood,cloth,shade,gold]=room.colors;
 const gx=x=>Math.round(x*W/map.cols),gy=y=>Math.round(y*H/map.rows);
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const box=(x,y,w,h,color,border=INK)=>{
  rect(x+1,y,w-2,h,border);rect(x,y+1,w,h-2,border);
  rect(x+2,y+2,w-4,h-4,color);
 };
 const band=(x,y,w,h,color)=>{
  box(x,y,w,h,color);
  rect(x+2,y+2,w-4,2,'#fff1d14d');rect(x+2,y+h-4,w-4,2,'#321d3859');
 };
 const pixel=(x,y,rows,colors,step=2)=>rows.forEach((row,j)=>{
  [...row].forEach((key,i)=>{if(colors[key])rect(x+i*step,y+j*step,step,step,colors[key]);});
 });
 const glint=(x,y,color=gold)=>{rect(x-2,y,5,1,color);rect(x,y-2,1,5,color);};
 const leaves=(x,y)=>{
  pixel(x-11,y-21,['.....l.....','..l..ll.l..','..ll.gllgg.','.lgg.ggll..','.lgggglg...','...glgg....','....gg.....','...pppp....','...ppsp....','....ss.....'],{l:'#a4bd72',g:'#5f885d',p:'#e5b888',s:'#a47561'});
 };
 const books=(x,y,w)=>{
  const spines=[cloth,'#c87567','#83a99b',gold,shade,'#b48b92'];
  for(let n=0;n<w-4;n+=4){
   const h=5+(n*7%4);
   rect(x+n,y-h,3,h,spines[(n/4)%spines.length]);rect(x+n,y-2,2,1,CREAM);
  }
 };
 const wallY=gy(root.WordvilleHomes.BACK_WALL_ROWS);
 function window(){
  const x=room.windowX,y=11,w=room.window==='wide'?67:48,h=30;
  const night=['night','observatory'].includes(room.window),arch=['arch','observatory'].includes(room.window);
  band(x-3,y-2,w+6,h+6,wood);
  c.save();
  if(arch){
   c.beginPath();c.rect(x,y+9,w,h-9);c.rect(x+4,y+4,w-8,5);c.rect(x+11,y,w-22,4);c.clip();
  }
  rect(x,y,w,h,night?'#242e52':'#a6ccd1');
  if(night){
   for(const [dx,dy] of [[5,5],[10,15],[29,6],[40,18],[36,11]])glint(x+dx,y+dy,CREAM);
   rect(x+17,y+3,8,7,gold);rect(x+21,y+2,5,5,'#242e52');
   rect(x,y+22,w,8,'#48597b');
  }else{
   rect(x+4,y+5,15,2,'#e6ede1');rect(x+9,y+2,7,3,'#e6ede1');
   rect(x,y+21,w,9,'#98b68b');
   for(let i=0;i<6;i++){rect(x+i*9,y+16+(i%3)*2,4,9,'#69917c');rect(x+i*9-1,y+21,6,7,'#69917c');}
  }
  rect(x+Math.floor(w/2),y,2,h,CREAM);rect(x,y+14,w,2,CREAM);
  c.restore();
  rect(x-3,y+h+1,w+6,2,gold);
  if(room.window==='drape'||room.window==='wide'){
   for(const side of [x-6,x+w-3]){
    rect(side,y,9,21,shade);rect(side+2,y+1,4,17,cloth);
    rect(side+2,y+15,7,4,gold);rect(side,y+20,11,8,shade);
   }
  }else if(room.window==='blind'){
   for(let i=0;i<5;i++)rect(x,y+i*3,w,1,'#f4e7cc');
  }
 }
 const motifs={
  trophy:['...gg..','..gggg.','.glggg.','..ggg..','...g...','..ggg..'],
  portrait:['..ppp..','.pgggp.','.pgllp.','..ggg..','..ppp..','.ppppp.'],
  plane:['.....l.','....ll.','.l.llg.','.llgg..','..glg..','..l....'],
  record:['..ppp..','.ppppp.','ppplppp','pplglpp','ppplppp','.ppppp.','..ppp..'],
  moon:['...gg..','..ggl..','.ggl...','.ggg..g','..gggg.','...gg..'],
  hen:['...l...','..llg..','..ll...','.llll..','.llll..','..g.g..'],
  photos:['.gg..gg','.gl..gp','.gg..gg','.......','gg..gg.','gp..gl.','gg..gg.'],
  landscape:['....gg.','....gg.','..p....','.pp..l.','ppp.lll','lllllll'],
  stars:['..g....','.ggg.l.','..g.lll','.....l.','.l.....','....g..'],
  sword:['.....l.','....ll.','...ll..','.glg...','..gg...','.g.g...'],
  quilt:['...l...','..lgl..','.lgggl.','lggpggl','.lgggl.','..lgl..','...l...']
 };
 function picture(x,y,w,h,motif){
  band(x,y,w,h,wood);rect(x+4,y+4,w-8,h-8,shade);
  pixel(x+Math.floor((w-21)/2),y+Math.floor((h-21)/2),motifs[motif],{p:INK,g:gold,l:CREAM},3);
 }
 function backdrop(){
  rect(0,0,W,H,INK);
  rect(4,4,W-8,wallY-4,wall);
  for(let x=8;x<W-5;x+=12){
   rect(x,6,1,wallY-6,panel);
   rect(x+4,8,2,2,gold+'70');
   rect(x+3,9,4,1,gold+'70');
  }
  rect(4,wallY-7,W-8,7,panel);
  rect(4,wallY-7,W-8,2,wood);
  rect(4,wallY-3,W-8,2,gold+'95');
  rect(5,wallY,W-10,H-wallY-10,floor);
  for(let y=wallY,row=0;y<H-10;y+=room.floor==='tile'?16:10,row++){
   rect(5,y,W-10,1,seam);
   const unit=room.floor==='plank'?45:room.floor==='tile'?22:24;
   const offset=room.floor==='tile'?7:7+row%2*(unit/2|0);
   for(let x=offset;x<W-6;x+=unit){
    rect(x,y,1,room.floor==='tile'?16:10,seam);
    rect(x+3,y+3,Math.min(unit-5,W-8-x),1,'#fff6cb27');
   }
  }
  const [rx,ry,rw,rh]=room.rug;
  const x=gx(rx),y=gy(ry),w=gx(rx+rw)-x,h=gy(ry+rh)-y;
  box(x,y,w,h,shade);rect(x+4,y+4,w-8,h-8,gold);rect(x+6,y+6,w-12,h-12,cloth);
  const pattern=room.floor==='tile'?'lattice':room.floor==='parquet'?'diamond':'woven';
  for(let row=0;row<Math.floor((h-12)/8);row++){
   for(let xx=x+9+(row%2)*4;xx<x+w-9;xx+=8){
    const yy=y+10+row*8;
    if(pattern==='diamond')pixel(xx-2,yy-2,['..g..','.g.g.','g...g','.g.g.','..g..'],{g:shade},1);
    else if(pattern==='woven'){rect(xx-1,yy-1,3,3,shade);rect(xx,yy,1,1,gold);}
    else glint(xx,yy,shade);
   }
  }
  for(let xx=x+4;xx<x+w-3;xx+=3){rect(xx,y-2,1,3,gold);rect(xx,y+h-1,1,3,gold);}
  window();
  const wallArtX=room.windowX<70?123:43;
  picture(wallArtX,8,34,33,room.wall);
  const secondX=room.windowX<130?183:8;
  picture(secondX,14,28,28,room.wall==='photos'?'photos':'landscape');
  for(const x of [96,225].filter(x=>x<room.windowX-10||x>room.windowX+75)){
   box(x-3,25,9,11,gold);
   rect(x,20,3,7,CREAM);rect(x-2,19,7,2,gold);glint(x+1,14);
  }
  rect(0,0,W,4,wood);rect(4,4,W-8,1,gold);rect(0,3,5,H-3,wood);rect(W-5,3,5,H-3,wood);
  rect(5,wallY,3,H-wallY-8,'#31213b30');rect(W-8,wallY,3,H-wallY-8,'#31213b30');
  const left=gx(map.door.x),right=gx(map.door.x+1);
  rect(0,H-10,left,10,wood);rect(right,H-10,W-right,10,wood);
  rect(3,H-9,left-5,2,gold);rect(right+2,H-9,W-right-5,2,gold);
  rect(left,H-10,right-left,10,shade);rect(left,H-6,right-left,4,gold);
  for(const peg of [14,57,198,241]){rect(peg,H-7,4,4,INK);rect(peg+1,H-7,2,2,CREAM);}
 }
 function monitor(x,y,w,h){
  box(x,y,w,h,'#4a526c');rect(x+3,y+2,w-6,h-5,'#27384f');
  rect(x+5,y+4,w-10,1,'#a7d5bd');rect(x+5,y+7,Math.floor(w*.4),1,'#e3bf8d');
  rect(x+(w/2|0)-1,y+h,3,3,INK);
 }
 function ornament(art,x,y,w){
  const m=x+(w/2|0);
  switch(art){
   case 'computer':
    monitor(m-18,y-12,16,12);monitor(m+1,y-12,17,12);
    rect(m-8,y+4,16,3,CREAM);rect(m-6,y+5,10,1,'#778994');break;
   case 'radio':
    band(m-11,y-8,22,11,'#4e5361');rect(m-7,y-5,8,3,'#a9c7b2');glint(m+6,y-3);break;
   case 'writer':
    band(m-12,y-5,24,13,'#49526a');box(m-7,y-15,14,11,CREAM);
    for(let j=0;j<2;j++){rect(m-4,y-12+j*2,7,1,'#af9691');rect(m-8,y+j*2,15,1,'#b3b5aa');}break;
   case 'tea':
    box(m-5,y-4,10,9,CREAM);rect(m-2,y-3,4,2,'#945942');rect(m+5,y-2,2,4,CREAM);break;
   case 'sink':
    box(m-14,y+1,28,10,'#c7d4cd');rect(m-8,y+3,16,4,'#677d8b');rect(m+3,y-4,2,8,CREAM);break;
   case 'sewing':
    pixel(m-14,y-13,['.ppppppppp....','ppggggllpp....','ppggpppppp....','ppgp....pp....','ppgp....pp....','ppgp....l.....','ppgpppppppppp.','pppppppppppppp'],{p:INK,g:cloth,l:gold});
    rect(m+7,y+4,12,4,gold);break;
   case 'photos':
    for(let i=0;i<3;i++){
     box(m-16+i*11,y-2+i%2,10,10,CREAM);rect(m-13+i*11,y+1+i%2,4,4,[cloth,gold,'#7eaa9d'][i]);
    }break;
   case 'robot':
    pixel(m-10,y-19,['....p.....','...ggg....','..gllgg...','..gpgpg...','..ggggg...','.pgggggp..','.pglglgp..','...g.g....','..pp.pp...'],{p:INK,g:'#7ba5ad',l:gold});
    glint(m+13,y-3);break;
   case 'display':
    if(room.wall==='plane'){
     pixel(m-11,y-13,motifs.plane,{l:CREAM,g:gold},3);
    }else if(room.wall==='sword'){
     for(let i=0;i<3;i++)pixel(m-15+i*13,y-10+(i%2)*2,['..l..','.lgg.','lgpgg','.gpp.','..p..'],{l:CREAM,g:cloth,p:shade});
    }else if(room.wall==='trophy'){
     for(const xx of [m-16,m+2])pixel(xx,y-12,motifs.trophy,{l:CREAM,g:gold});
    }else{
     for(let i=0;i<4;i++)band(m-18+i*9,y-6+(i%2)*2,7,10,[cloth,gold,shade,'#a2b4a4'][i]);
    }break;
   case 'sports':
    pixel(m-15,y-4,['..gg...','..gsg..','.gsssg.','.gsgsg.','..ggg..'],{g:gold,s:'#b9694f'},2);
    band(m+3,y-3,16,8,cloth);rect(m+10,y-2,2,5,CREAM);break;
   case 'skate':
    band(m-16,y-5,32,8,cloth);rect(m-11,y-3,22,2,gold);
    rect(m-11,y+3,4,3,INK);rect(m+7,y+3,4,3,INK);break;
   case 'eggs':
    band(m-16,y-2,29,10,gold);
    for(let i=0;i<3;i++){
     rect(m-12+i*7,y-5+i%2,4,6,CREAM);rect(m-11+i*7,y-6+i%2,2,8,CREAM);
    }break;
   case 'kit':
    band(m-11,y-6,22,12,gold);rect(m-4,y-9,8,3,INK);rect(m-6,y+1,12,1,wood);break;
  }
 }
 function fixture(f){
  const x=gx(f.x)+1,y=gy(f.y)+1,w=gx(f.x+f.w)-x-1,h=gy(f.y+f.h)-y-1,m=x+(w/2|0);
  const art=f.art||f.kind;
  box(x+1,y+6,w-1,h-3,'#35253a50','#35253a50');
  switch(art){
   case 'bed':
    band(x,y,w,h,wood);band(x+3,y+5,w-6,h-9,CREAM);
    box(x+6,y+8,w-12,11,'#e8dec8','#b99580');rect(x+9,y+10,w-18,2,'#fff8e2');
    band(x+3,y+21,w-6,h-25,cloth);rect(x+3,y+23,w-6,3,gold);
    for(let xx=x+8;xx<x+w-6;xx+=6)glint(xx,y+h-10,shade);
    break;
   case 'sofa':case 'armchair':
    band(x,y,w,h,shade);band(x+3,y+3,w-6,h-8,cloth);
    for(let xx=x+6;xx<x+w-8;xx+=7)rect(xx,y+6,2,2,shade);
    rect(x+3,y+Math.floor(h/2),w-6,2,shade);
    band(x+6,y+Math.floor(h/2)+2,w-12,Math.floor(h/2)-5,cloth);
    box(x+7,y+7,11,10,CREAM);box(x+w-18,y+8,10,9,gold);
    band(x,y+10,6,h-11,cloth);band(x+w-6,y+10,6,h-11,cloth);break;
   case 'shelf':
    band(x,y,w,h,wood);
    for(let j=0;j<2;j++){
     const yy=y+5+j*12;rect(x+3,yy,w-6,9,'#4a323f');books(x+5,yy+9,w-10);rect(x+3,yy+9,w-6,1,gold);
    }break;
   case 'planter':
    leaves(m,y+h-2);break;
   case 'weights':
    band(x+5,y+4,w-10,h-7,shade);band(x+10,y+5,w-20,h-12,cloth);
    rect(x+4,y+6,w-8,3,CREAM);
    for(const xx of [x+4,x+w-12]){box(xx,y+2,8,13,INK);rect(xx+2,y+4,2,8,'#a9b4ad');}break;
   case 'guitar':
    band(x+w-18,y+6,17,h-10,shade);box(x+w-16,y+10,13,14,'#687583');
    pixel(x+6,y-3,['...ll...','...ll...','...gl...','...gl...','...gl...','...gl...','..gggl..','.ggpggl.','.gggggl.','..lll...'],{l:CREAM,g:gold,p:INK},3);
    break;
   case 'camera':case 'telescope':case 'easel':
    rect(m-2,y+11,4,h-14,wood);rect(m-10,y+16,3,h-19,wood);rect(m+7,y+16,3,h-19,wood);
    if(art==='easel'){picture(m-14,y-5,28,27,'landscape');rect(m-16,y+22,32,2,gold);}
    if(art==='camera'){band(m-12,y+1,25,13,shade);box(m+1,y+2,10,10,'#83a8b3');rect(m-7,y-2,7,3,gold);}
    if(art==='telescope'){band(m-15,y+6,26,9,cloth);band(m+5,y+2,12,12,CREAM);glint(m+20,y+6);}
    break;
   default:
    if(f.kind==='shelf'||f.kind==='counter')band(x+2,y+5,w-4,h-8,wood);
    rect(x+4,y+8,4,h-10,INK);rect(x+w-8,y+8,4,h-10,INK);
    rect(x+6,y+9,2,h-12,wood);rect(x+w-7,y+9,2,h-12,wood);
    band(x,y,w,Math.floor(h/2)+4,wood);
    rect(x+3,y+4,w-6,3,gold+'56');
    ornament(art,x,y,w);
  }
 }
 return {backdrop,fixture};
}

function paint(ctx,id,map){
 const room=root.WordvilleHomes.get(id);
 const penny=id==='penny'&&root.WordvillePennyHome;
 let base=roomArt.get(id);
 if(!base){
  base=document.createElement('canvas');base.width=W;base.height=H;
  const art=painter(base.getContext('2d'),room,map);
  art.backdrop();
  if(!penny)map.fixtures.forEach(art.fixture);
  roomArt.set(id,base);
 }
 ctx.save();
 ctx.imageSmoothingEnabled=false;ctx.drawImage(base,0,0,ctx.canvas.width,ctx.canvas.height);
 if(penny){
  const art=painter(ctx,room,map);
  penny.paint(ctx,f=>{
   ctx.save();ctx.scale(ctx.canvas.width/W,ctx.canvas.height/H);
   art.fixture(f);ctx.restore();
  });
 }
 ctx.restore();
}
root.WordvilleHomeArt={paint};
})(globalThis);
