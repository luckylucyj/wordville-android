/* Wordville authored hub v2: crisp 2x (1200×1600 -> 600×800 world) 3/4 top-down
 * pixel-art town square with Y-sorted animated foreground props and weather/time
 * atmosphere (sunbeams, wind sway & drifting petals, rain ripples, night glow).
 */
(function(root){'use strict';
const W=600,H=800;
const FOUNTAIN={x:300,y:450,rx:66,ry:42};
const LANDMARKS=[
 {id:'library',name:'도서관',x:300,y:220},
 {id:'greenhouse',name:'식물원',x:88,y:290},
 {id:'cafe',name:'카페',x:535,y:310},
 {id:'square',name:'광장',x:300,y:450},
 {id:'park',name:'공원',x:165,y:745}
];
const palette={
 day:{sky:'#9bd5d3',hill:'#759f85',grass:'#80a96c',grass2:'#679660',stone:'#d5c8ad',stone2:'#e5dabd',shade:'#ac9f83',water:'#70b7c3',roof:'#566d8d',wall:'#e8d6ae',light:'#ffe7a1'},
 dusk:{sky:'#a89bba',hill:'#778b89',grass:'#6e9164',grass2:'#597e62',stone:'#c4b7a3',stone2:'#dbceb8',shade:'#9f8e86',water:'#6f99ab',roof:'#585a78',wall:'#d5bca6',light:'#ffe09e'},
 night:{sky:'#253e5a',hill:'#40596a',grass:'#496c5b',grass2:'#395b4f',stone:'#7e8381',stone2:'#9e9991',shade:'#626e72',water:'#456e83',roof:'#36445c',wall:'#8d948c',light:'#fbe0a3'}
};
const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const seed=(x,y,s=0)=>{let v=((Math.floor(x)*73856093)^(Math.floor(y)*19349663)^(s*83492791))>>>0;v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967295;};
function loadImg(src){
 if(typeof Image==='undefined')return {complete:false,naturalWidth:0,naturalHeight:0,src};
 const im=new Image();im.decoding='async';im.src=src;return im;
}
const hubImage=loadImg('art/hub-garden.webp');
const hdBase=loadImg('art/town-v2/town-base.png');
const sheets={
 fountain:loadImg('art/town-v2/fountain_4f.png'),
 tree:loadImg('art/town-v2/tree_4f.png'),
 bush:loadImg('art/town-v2/bush_4f.png'),
 lamp:loadImg('art/town-v2/lamp_4f.png'),
 bench:loadImg('art/town-v2/bench.png')
};
const ready=im=>Boolean(im&&im.complete&&im.naturalWidth>0&&im.naturalHeight>0);

// Placed Y-sorted foreground props matching VillageModel.decorations 1:1.
// `y` is the Y-sort ground plane; `drawY` is the bottom edge of the drawn sprite.
const PROPS=[
 {id:'nw-bush',kind:'bush',x:196,y:324,drawY:334,w:62,h:40,phase:0},
 {id:'ne-bush',kind:'bush',x:404,y:324,drawY:334,w:62,h:40,phase:2},
 {id:'nw-lamp',kind:'lamp',x:232,y:336,drawY:340,w:32,h:80,phase:0},
 {id:'ne-lamp',kind:'lamp',x:368,y:336,drawY:340,w:32,h:80,phase:1},
 {id:'west-bench',kind:'bench',x:98,y:398,drawY:404,w:58,h:36,phase:0},
 {id:'east-bench',kind:'bench',x:502,y:398,drawY:404,w:58,h:36,phase:0},
 {id:'fountain',kind:'fountain',x:300,y:450,drawY:496,w:149,h:132,phase:0},
 {id:'w-tree',kind:'tree',x:28,y:526,drawY:534,w:114,h:114,phase:0},
 {id:'e-tree',kind:'tree',x:572,y:526,drawY:534,w:114,h:114,phase:2},
 {id:'sw-bush',kind:'bush',x:102,y:560,drawY:570,w:62,h:40,phase:1},
 {id:'se-bush',kind:'bush',x:498,y:560,drawY:570,w:62,h:40,phase:3},
 {id:'sw-lamp',kind:'lamp',x:226,y:568,drawY:572,w:32,h:80,phase:2},
 {id:'se-lamp',kind:'lamp',x:374,y:568,drawY:572,w:32,h:80,phase:3}
];

function drawCanalShimmer(c,period,elapsed,weather){
 const t=Number.isFinite(elapsed)?elapsed:0;
 const speed=weather==='wind'?20:weather==='rain'?14:8;
 const col=period==='night'?'#7ec8d855':'#e6fdff78';
 const col2=period==='night'?'#4e98b844':'#a6f2ff66';
 const bands=[[8,232],[368,592]];
 for(const [x0,x1] of bands){
  for(let i=0;i<16;i++){
   const y=616+((i*17+7)%76);
   const span=x1-x0-18;
   const x=x0+Math.floor((seed(i,y,3)*span+t*speed*(i%2?1:0.7))%span);
   const len=6+((i*5)%10);
   rect(c,x,y,len,2,i%3===0?col:col2);
  }
 }
 // Gentle water highlights under the canal bridge banks
 const pulse=Math.floor(t*4)%4;
 rect(c,240,624+pulse*4,4,8,col2);
 rect(c,356,632+((pulse+2)%4)*4,4,8,col2);
}

function drawNightWindows(c,period){
 if(period==='day')return;
 const glow=period==='night'?'#ffd87a48':'#ffcf7028';
 const core=period==='night'?'#ffe89a70':'#ffe59c3c';
 // Library arched windows (matched to town-base.png), doorway, and cafe windows
 const wins=[[192,86,20,30],[289,68,22,32],[386,86,20,30],[192,156,20,30],[386,156,20,30],[276,156,48,54],[485,302,26,16],[565,302,26,16]];
 for(const [x,y,w,h] of wins){
  rect(c,x-2,y-2,w+4,h+4,glow);
  rect(c,x,y,w,h,core);
 }
 // Soft greenhouse glass moonlight/warm interior tint
 rect(c,20,214,114,84,period==='night'?'#ffe5991c':'#ffd68014');
}

function drawFallback(ctx,period){
 const p=palette[period]||palette.day;
 rect(ctx,0,0,W,H,p.grass);
 rect(ctx,160,20,280,205,p.wall);
 rect(ctx,46,330,508,252,p.stone2);
 rect(ctx,0,590,W,114,p.water);
 rect(ctx,246,584,108,148,p.stone);
}

function paintBase(ctx,period='day',elapsed=0,weather='clear'){
 ctx.save();
 ctx.imageSmoothingEnabled=false;
 if(ready(hdBase)){
  ctx.drawImage(hdBase,0,0,W,H);
 }else if(ready(hubImage)){
  ctx.drawImage(hubImage,0,0,W,H);
 }else{
  drawFallback(ctx,period);
 }
 drawCanalShimmer(ctx,period,elapsed,weather);
 drawNightWindows(ctx,period);
 ctx.restore();
 return true;
}

function drawProp(ctx,prop,period='day',elapsed=0,weather='clear'){
 const t=Number.isFinite(elapsed)?elapsed:0;
 const windy=weather==='wind';
 const swayFps=windy?6.2:weather==='rain'?2.6:1.4;
 const im=sheets[prop.kind];
 if(!ready(im))return false;
 ctx.save();
 ctx.imageSmoothingEnabled=false;
 // Ground contact shadow ellipse
 ctx.fillStyle=period==='night'?'#13192644':'#2f24282e';
 ctx.beginPath();
 if(prop.kind==='fountain')ctx.ellipse(prop.x,prop.y+12,68,38,0,0,Math.PI*2);
 else if(prop.kind==='tree')ctx.ellipse(prop.x,prop.y+2,38,14,0,0,Math.PI*2);
 else if(prop.kind==='bush')ctx.ellipse(prop.x,prop.y+4,26,9,0,0,Math.PI*2);
 else if(prop.kind==='bench')ctx.ellipse(prop.x,prop.y+3,28,7,0,0,Math.PI*2);
 else ctx.ellipse(prop.x,prop.y+2,11,4,0,0,Math.PI*2);
 ctx.fill();

 const dx=Math.round(prop.x-prop.w/2);
 const dy=Math.round(prop.drawY-prop.h);
 if(prop.kind==='bench'){
  ctx.drawImage(im,0,0,im.naturalWidth,im.naturalHeight,dx,dy,prop.w,prop.h);
 }else if(prop.kind==='fountain'){
  const fw=im.naturalWidth/4,fh=im.naturalHeight;
  const f=Math.floor(t*6)%4;
  ctx.drawImage(im,f*fw,0,fw,fh,dx,dy,prop.w,prop.h);
 }else if(prop.kind==='lamp'){
  const fw=im.naturalWidth/4,fh=im.naturalHeight/2;
  const row=period==='day'?0:1;
  const f=Math.floor(t*(windy?7.5:2.2)+prop.phase)%4;
  ctx.drawImage(im,f*fw,row*fh,fw,fh,dx,dy,prop.w,prop.h);
 }else{
  const fw=im.naturalWidth/4,fh=im.naturalHeight;
  const f=Math.floor(t*swayFps+prop.phase)%4;
  ctx.drawImage(im,f*fw,0,fw,fh,dx,dy,prop.w,prop.h);
 }
 ctx.restore();
 return true;
}

function paintOverlay(ctx,period='day',phase='day',elapsed=0,weather='clear'){
 const t=Number.isFinite(elapsed)?elapsed:0;
 ctx.save();
 ctx.imageSmoothingEnabled=false;

 // 1) Time-of-day atmospheric color grade
 if(phase==='dawn')rect(ctx,0,0,W,H,'#f0b18c26');
 else if(phase==='sunset'||period==='dusk')rect(ctx,0,0,W,H,'#d9786438');
 else if(phase==='night'||period==='night')rect(ctx,0,0,W,H,'#111e3c68');

 // 2) Weather-driven motion & lighting frames
 if(weather==='clear'&&period==='day'){
  // Gently breathing diagonal sunlit shafts (sunbeams)
  const breath=0.5+0.5*Math.sin(t*1.1);
  ctx.save();
  ctx.globalAlpha=0.06+breath*0.045;
  ctx.fillStyle='#fff6cc';
  for(let i=0;i<4;i++){
   const sx=-40+i*185+Math.sin(t*0.35+i)*14;
   ctx.beginPath();
   ctx.moveTo(sx,0);ctx.lineTo(sx+76,0);ctx.lineTo(sx+260,H);ctx.lineTo(sx+184,H);
   ctx.closePath();ctx.fill();
  }
  ctx.restore();
  // Soft drifting sunlight dust motes & 3 fluttering pixel butterflies
  for(let i=0;i<14;i++){
   const mx=(seed(i,3,9)*W+t*5*(i%2?1:-0.7)+W)%W;
   const my=(seed(i,8,13)*560+Math.sin(t*1.6+i)*10+560)%560;
   const blink=Math.floor(t*3+i)%3===0;
   if(blink)rect(ctx,mx,my,2,2,'#fff9d6bb');
  }
  const flap=Math.floor(t*9)%2;
  const bcols=['#fff1a8','#f6b2d2','#b8ecff'];
  for(let b=0;b<3;b++){
   const bx=120+b*175+Math.sin(t*(0.9+b*0.2)+b*2)*48;
   const by=360+b*75+Math.cos(t*(1.3+b*0.15)+b)*24;
   rect(ctx,bx-2,by,2,flap?3:1,bcols[b]);
   rect(ctx,bx+1,by,2,flap?3:1,bcols[b]);
   rect(ctx,bx,by+1,1,2,'#44332a');
  }
 }

 if(weather==='wind'){
  // Crisp drifting pixel wind ribbons visible over sunlit stone & grass
  for(let i=0;i<11;i++){
   const y=80+Math.floor(seed(i,19,5)*660);
   const x=((seed(i,7,3)*740+t*155*(0.8+0.3*(i%3)))%740)-90;
   const len=28+(i%3)*14;
   rect(ctx,x,y,len,2,'#ffffff6e');
   rect(ctx,x+4,y+2,len-6,1,'#7ba8b836');
   rect(ctx,x+12,y-4,14,1,'#ffffff52');
  }
  // 34 vivid pixel flower petals & green leaves with subtle dark pixel rim blowing diagonally
  const leafCols=['#f28db8','#ffbfd9','#5cb85c','#45944a','#c78ee8','#f5d056'];
  for(let i=0;i<34;i++){
   const spd=62+(i%5)*14;
   const px=((seed(i,11,2)*680+t*spd)%680)-40;
   const py=((seed(i,23,6)*860+t*(22+(i%4)*7)+Math.sin(t*3.2+i)*14)%860)-30;
   const spin=Math.floor(t*7+i)%2;
   const col=leafCols[i%leafCols.length];
   const pw=spin?5:4,ph=spin?3:4;
   rect(ctx,px-1,py,pw+2,ph,'#36283055');
   rect(ctx,px,py-1,pw,ph+2,'#36283055');
   rect(ctx,px,py,pw,ph,col);
   rect(ctx,px+1,py,1,1,'#ffffffaa');
  }
 }

 if(weather==='clouds'||weather==='overcast'){
  if(weather==='overcast')rect(ctx,0,0,W,H,'#465b7346');
  // Soft drifting cloud shadows across the ground
  const count=weather==='overcast'?5:3;
  for(let i=0;i<count;i++){
   const cx=((seed(i,4,17)*780+t*14)%780)-110;
   const cy=120+i*155;
   ctx.fillStyle=weather==='overcast'?'#25364a22':'#283a4d18';
   ctx.beginPath();
   ctx.ellipse(cx,cy,95+(i%2)*35,34,0,0,Math.PI*2);
   ctx.fill();
  }
 }

 if(weather==='rain'){
  rect(ctx,0,0,W,H,'#243e5c44');
  // Slanted crisp pixel rain streaks (high-contrast blue-white on sunlit stone)
  const tick=t*235;
  for(let i=0;i<150;i++){
   const rx=((seed(i,11,17)*640-tick*0.28)%640+640)%640;
   const ry=((seed(i,21,37)*820+tick*(0.9+0.35*(i%3)))%820)-10;
   ctx.fillStyle=i%2?'#9fd6f4aa':'#dff4ff99';
   ctx.fillRect(Math.round(rx),Math.round(ry),1,8);
   ctx.fillRect(Math.round(rx-1),Math.round(ry+6),1,5);
  }
  // 4-frame expanding pixel puddle ripples on cobblestones & canal
  const rTick=Math.floor(t*8);
  for(let i=0;i<26;i++){
   const frame=(rTick+i)%8;
   if(frame>=4)continue;
   const px=70+Math.floor(seed(i+Math.floor((rTick+i)/8)*31,5,9)*460);
   const py=340+Math.floor(seed(i+Math.floor((rTick+i)/8)*31,13,2)*350);
   const rad=2+frame*2;
   ctx.strokeStyle=frame<2?'#bfeaffcc':'#8ecbe877';
   ctx.lineWidth=1.2;
   ctx.beginPath();
   ctx.ellipse(px,py,rad,Math.max(1,Math.round(rad*0.45)),0,0,Math.PI*2);
   ctx.stroke();
  }
 }

 // 3) Dusk/Night warm glowing lamp halos & floating fireflies
 if(period==='night'||period==='dusk'||phase==='sunset'){
  const lamps=PROPS.filter(p=>p.kind==='lamp');
  const glowA=period==='night'?0.34:0.18;
  for(const lp of lamps){
   const lx=lp.x-2,ly=lp.drawY-64;
   const grad=ctx.createRadialGradient(lx,ly,3,lx,ly,44);
   grad.addColorStop(0,`rgba(255,232,148,${glowA})`);
   grad.addColorStop(0.5,`rgba(255,198,104,${glowA*0.45})`);
   grad.addColorStop(1,'rgba(255,180,80,0)');
   ctx.fillStyle=grad;
   ctx.beginPath();ctx.arc(lx,ly,44,0,Math.PI*2);ctx.fill();
  }
  if(period==='night'){
   for(let i=0;i<16;i++){
    const fx=40+seed(i,31,4)*520+Math.sin(t*1.2+i*1.7)*18;
    const fy=240+seed(i,41,9)*520+Math.cos(t*1.5+i*1.3)*12;
    const glow=0.35+0.65*(0.5+0.5*Math.sin(t*3.2+i*2.1));
    ctx.fillStyle=`rgba(255,242,150,${glow.toFixed(2)})`;
    ctx.fillRect(Math.round(fx),Math.round(fy),2,2);
   }
  }
 }
 ctx.restore();
}

function paint(ctx,period='day',elapsed=0,weather='clear'){
 paintBase(ctx,period,elapsed,weather);
 for(const prop of PROPS)drawProp(ctx,prop,period,elapsed,weather);
 paintOverlay(ctx,period,period,elapsed,weather);
}

root.WordvilleHubMap={
 paint,paintBase,drawProp,paintOverlay,props:PROPS,landmarks:LANDMARKS,
 image:hubImage,hdBase,propSheets:sheets,
 scale:{width:W,height:H},fountain:FOUNTAIN,
 collision:root.VillageModel?.decorations||[],humanDecorations:0
};
})(globalThis);
