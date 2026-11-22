/* Four offline single-player Canvas games. Built for the trusted local Android WebView asset origin.
 * 600x1000 logical points, 1200x2000 backing at DPR>=2. Original vocabulary and
 * existing WordvilleSolo progress are authoritative; the Canvas never creates demo words.
 */
(function(root){
 'use strict';
 const W=600,H=1000,INK='#4A3B32',SKIN='#fffdf8',WOOD='#b78961',ROOM_KEY='wordville_room_v1';
 const modes=['fishing','weeding','foraging','room'];
 const eq=(value,min,max)=>Math.min(max,Math.max(min,value));
 const label=w=>String((w?.meanings&&w.meanings[0])||w?.meaning||'').split(/[;；]/)[0].trim();
 const itemTypes={
  bed:{name:'포근침대',icon:'🛏️'},shelf:{name:'원목책장',icon:'📚'},chair:{name:'핑크의자',icon:'🪑'},
  plant:{name:'화분',icon:'🪴'},lamp:{name:'스탠드조명',icon:'🪔'},rug:{name:'원형러그',icon:'🧶'},
  desk:{name:'책상',icon:'🪑'},books:{name:'책장',icon:'📚'},aquarium:{name:'수족관',icon:'🐠'},
  sofa:{name:'소파',icon:'🛋️'}
 };
 function freshRoom(){
  return {unlocked:['bed','shelf','chair','plant','lamp'].map(id=>({id,...itemTypes[id]})),
   placed:[{id:'bed',x:245,y:410},{id:'shelf',x:455,y:466},{id:'plant',x:135,y:472}],
   dragIdx:-1};
 }
 class WordvilleGameEngine {
  constructor(canvasId){
   this.canvas=document.getElementById(canvasId);
   if(!this.canvas)throw new Error('Wordville Canvas element missing: '+canvasId);
   this.ctx=this.canvas.getContext('2d',{alpha:false});
   if(!this.ctx)throw new Error('Canvas 2D context unavailable');
   this.LOGICAL_W=W;this.LOGICAL_H=H;
   this.sprites={};
   this.spriteManifest={
    bg_fishing:'images/fishing/bg_fishing.png',hachiware_idle:'images/fishing/hachiware_idle.png',
    hachiware_catch:'images/fishing/hachiware_catch.png',
    bg_weeding:'images/weeding/bg_meadow.png',weed_perfect:'images/weeding/chiikawa_perfect.png',
    weed_medium:'images/weeding/chiikawa_medium.png',weed_bad:'images/weeding/chiikawa_bad.png',
    bg_foraging:'images/foraging/bg_forest.png',food_1:'images/foraging/chiikawa_food_1.png',
    food_2:'images/foraging/chiikawa_food_2.png',food_3:'images/foraging/chiikawa_food_3.png',
    bg_room:'images/room/bg_isometric_room.png'
   };
   this.words=[];this.sourceWords=[];
   this.atlas=new root.SpriteAtlasHelper();
   this.studyManager=new root.WordvilleStudyManager([]);
   this.stateScope='all';
   this.state={mode:'fishing',wordIdx:0,slots:[],popup:null,
    fishing:{pos:.15,dir:1,zone:[.68,.86],catchTimer:0},
    weeding:{pos:0,dir:1,status:'idle',timer:0,pendingRetry:false},
    foraging:{stage:1,timer:0,choices:[],pending:false},
    room:this.loadRoomState()};
   this.running=false;this.raf=0;this.lastFrame=0;this.nextActionAt=0;
   this.status=root.document.getElementById('wordville-canvas-status');
   this.choicesNode=root.document.getElementById('foraging-choices');
   this.inventoryNode=root.document.getElementById('room-item-list');
   this.drawer=root.document.getElementById('room-drawer');
   this.preloadSprites();this.bindEvents();this.resize();
   this.loadWordsFromAndroid(root.WordvilleWords||[]);
   this.switchMode('fishing');
   this.resume();
  }
  loadRoomState(){
   const defaults=freshRoom();
   try{
    const saved=JSON.parse(root.localStorage.getItem(ROOM_KEY)||'null');
    if(saved&&Array.isArray(saved.unlocked)&&Array.isArray(saved.placed)){
     const unlocked=saved.unlocked.filter(it=>it&&typeof it.id==='string'&&itemTypes[it.id])
      .map(it=>({id:it.id,...itemTypes[it.id]})).slice(0,20);
     const unique=[...new Map([...defaults.unlocked,...unlocked].map(it=>[it.id,it])).values()];
     const placed=saved.placed.filter(it=>it&&itemTypes[it.id]&&Number.isFinite(it.x)&&Number.isFinite(it.y))
      .slice(0,35).map(it=>({id:it.id,...this.constrainFloor(it.x,it.y)}));
     return {unlocked:unique,placed,dragIdx:-1};
    }
   }catch{}
   return defaults;
  }
  saveRoomState(){
   try{
    root.localStorage.setItem(ROOM_KEY,JSON.stringify({
     unlocked:this.state.room.unlocked,placed:this.state.room.placed,dragIdx:-1
    }));
    return true;
   }catch{this.message('가구 저장에 실패했습니다. 기기 저장 공간을 확인해 주세요.');return false;}
  }
  preloadSprites(){
   // Resolve against this HTML document, NOT against file:///android_asset or
   // hard-coded WebViewAssetLoader URLs. Both trusted origins work unchanged.
   void this.atlas.loadSheet('weeding_states','images/weeding/chiikawa_3state_atlas.png');
   void this.atlas.loadSheet('foraging_stages','images/foraging/chiikawa_3stage_atlas.png');
   if(typeof root.Image!=='function')return;
   Object.entries(this.spriteManifest).forEach(([key,path])=>{
    const url=new URL(path,root.document.baseURI).href;
    const image=new root.Image();
    image.onload=()=>{
     if(!image.naturalWidth||!image.naturalHeight){
      this.reportAssetError(key,url,'decoded to an empty image');return;
     }
     if(key==='hachiware_idle'||key==='hachiware_catch'){
      const cleaned=this.removeWhiteBackground(image,key);
      if(!cleaned){this.reportAssetError(key,url,'chroma-key processing failed');return;}
      this.sprites[key]=cleaned;
     }else this.sprites[key]=image;
     if(key.startsWith('hachiware_')||key==='bg_fishing')
      console.info('[Wordville Fishing] PNG loaded',key,url,image.naturalWidth+'x'+image.naturalHeight);
    };
    image.onerror=()=>this.reportAssetError(key,url,'image.onerror');
    image.src=url;
   });
  }
  reportAssetError(key,url,reason){
   console.error('[Wordville Canvas] Image failed to load:',key,url,reason);
   if(key==='bg_fishing'||key==='hachiware_idle'||key==='hachiware_catch'){
    this.message('낚시 PNG 파일을 찾거나 처리하지 못했습니다: '+this.spriteManifest[key]+
     ' · app/src/main/assets/images/fishing/ 위치와 파일명을 확인하세요.');
   }
  }
  removeWhiteBackground(image,key){
   // Flood-fill ONLY edge-connected near-white pixels. The character's white
   // face and body are enclosed by dark outlines and must stay opaque.
   const width=image.naturalWidth,height=image.naturalHeight;
   if(width*height>8000000){
    console.error('[Wordville Fishing] Character image is too large for chroma key:',key,width,height);
    return null;
   }
   try{
    const surface=root.document.createElement('canvas');
    surface.width=width;surface.height=height;
    const ctx=surface.getContext('2d',{willReadFrequently:true});
    if(!ctx)return null;
    ctx.drawImage(image,0,0);
    const content=ctx.getImageData(0,0,width,height),data=content.data;
    const total=width*height,visited=new Uint8Array(total),queue=new Int32Array(total);
    let head=0,tail=0;
    const white=(p)=>{
     const i=p*4,r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
     return a===0 || (r>=235&&g>=235&&b>=235&&
      Math.max(r,g,b)-Math.min(r,g,b)<=24);
    };
    const enqueue=(p)=>{
     if(!visited[p]&&white(p)){visited[p]=1;queue[tail++]=p;}
    };
    for(let x=0;x<width;x++){enqueue(x);enqueue((height-1)*width+x);}
    for(let y=1;y<height-1;y++){enqueue(y*width);enqueue(y*width+width-1);}
    while(head<tail){
     const p=queue[head++];
     data[p*4+3]=0;
     const x=p%width,y=(p/width)|0;
     if(x>0)enqueue(p-1);
     if(x+1<width)enqueue(p+1);
     if(y>0)enqueue(p-width);
     if(y+1<height)enqueue(p+width);
    }
    ctx.putImageData(content,0,0);
    return surface;
   }catch(error){
    console.error('[Wordville Fishing] White-background removal error:',key,error);
    return null;
   }
  }
  resize(){
   // Fixed logical space: resizing does not change H or HUD/interaction coordinates.
   const dpr=Math.min(2,Math.max(1,root.devicePixelRatio||1));
   const width=Math.round(W*dpr),height=Math.round(H*dpr);
   if(this.canvas.width!==width)this.canvas.width=width;
   if(this.canvas.height!==height)this.canvas.height=height;
   this.ctx.setTransform(width/W,0,0,height/H,0,0);
  }
  loadWordsFromAndroid(wordList){
   if(!Array.isArray(wordList))return false;
   this.sourceWords=wordList.filter(w=>w&&typeof w.word==='string'&&w.id!=null&&label(w));
   this.refreshWordPool();
   return this.words.length>0;
  }
  refreshWordPool(){
   const day=root.document.getElementById('wv-solo-day')?.value||'all';
   const filtered=this.sourceWords.filter(w=>day==='all'||(w.days||[]).includes(Number(day)));
   this.words=filtered.length?filtered:this.sourceWords;
   this.studyManager.setWords(this.words,day);
   this.stateScope=day;
   this.state.wordIdx=Math.max(0,this.words.findIndex(w=>w.id===this.getCurrentWord()?.id));
   this.buildForagingChoices();
   this.refreshHeaderUI();
  }
  getCurrentWord(){return this.studyManager.current();}
  advanceWord(silent=false){
   if(!this.getCurrentWord())return;
   this.studyManager.markSuccess(silent);
   this.state.wordIdx=Math.max(0,this.words.findIndex(w=>w.id===this.getCurrentWord()?.id));
   if(this.state.mode==='foraging')this.buildForagingChoices();
   this.refreshHeaderUI();
  }
  retryWord(silent=false){
   if(!this.getCurrentWord())return;
   const failed=this.studyManager.markRetry(silent);
   // The failed card has moved two positions back: its input cooldown must
   // never block the *next* word's fresh answer button.
   this.nextActionAt=0;
   this.state.wordIdx=Math.max(0,this.words.findIndex(w=>w.id===this.getCurrentWord()?.id));
   if(this.state.mode==='foraging')this.buildForagingChoices();
   this.refreshHeaderUI();
   return failed;
  }
  switchMode(mode){
   if(!modes.includes(mode))return;
   this.state.mode=mode;this.nextActionAt=0;this.state.weeding.timer=0;
   this.state.weeding.status='idle';this.state.weeding.pendingRetry=false;
   this.state.foraging.stage=1;this.state.foraging.timer=0;this.state.foraging.pending=false;
   if(this.choicesNode)this.choicesNode.hidden=mode!=='foraging';
   if(this.drawer)this.drawer.hidden=mode!=='room';
   const action=root.document.getElementById('wordville-action');
   if(action)action.hidden=mode==='foraging'||mode==='room';
   if(mode==='foraging')this.buildForagingChoices();
   if(mode==='room')this.renderRoomInventoryUI();
   this.refreshHeaderUI();this.resume();
  }
  refreshHeaderUI(){
   const word=this.getCurrentWord();
   const titles={fishing:'🎣 낚시 · 하치와레',weeding:'🌱 잡초 뽑기 · 치이카와',
    foraging:'🍙 음식 줍기 · 치이카와',room:'🏠 나의 방 꾸미기'};
   const badge=root.document.getElementById('game-badge');
   if(badge)badge.textContent=titles[this.state.mode];
   const hint=root.document.getElementById('target-hint');
   if(hint)hint.textContent=this.state.mode==='room'?'가구를 선택한 후 방 바닥에서 드래그해 배치하세요':
    this.state.mode==='foraging'?'뜻을 확인하고 알맞은 영단어 버튼을 선택하세요':
    '아래 움직이는 게이지를 목표 구간에서 눌러보세요';
   const current=root.document.getElementById('target-meaning');
   if(current)current.textContent=word?word.word+' — '+label(word):'단어를 불러오는 중입니다';
  }
  message(text){
   if(this.status)this.status.textContent=text;
  }
  box(x,y,w,h,r,fill,stroke=INK,lw=3){
   const c=this.ctx;
   c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();
   if(lw){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}
  }
  text(text,x,y,size=18,color=INK,weight='700',maxWidth){
   const c=this.ctx;c.fillStyle=color;c.textAlign='center';c.font=weight+' '+size+'px system-ui, sans-serif';
   c.fillText(String(text),x,y,maxWidth||W-40);
  }
  background(top,bottom){
   const g=this.ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,top);g.addColorStop(1,bottom);
   this.ctx.fillStyle=g;this.ctx.fillRect(0,0,W,H);
  }
  paintSprite(key,x,y,w,h){
   const img=this.sprites[key];
   if(!img||img.complete===false||!(img.naturalWidth||img.width))return false;
   this.ctx.drawImage(img,x,y,w,h);return true;
  }
  drawHUD(){
   const c=this.ctx,word=this.getCurrentWord(),hour=new Date().getHours(),isDay=hour>=6&&hour<19;
   this.box(18,16,148,60,12,WOOD,INK,3.5);
   this.box(27,24,64,31,9,isDay?'#fff0b6':'#ddd7a0',INK,1.5);
   this.box(94,24,64,31,9,!isDay?'#5d799f':'#a1b4c4',INK,1.5);
   this.text('☀',58,47,24,isDay?'#f4a261':'#b38d67');
   this.text('☾',125,47,23,!isDay?'#f9dc82':'#cfdbde');
   this.box(179,16,401,76,15,'#fff3dc',INK,3);
   this.text(this.state.mode==='room'?'나의 방 · 가구 배치':
    (word?.word||'단어 준비 중'),379,47,22,INK,'850',375);
   this.text(this.state.mode==='room'?'학습한 단어와 꾸미기를 이어가세요':
    label(word||{}),379,73,16,'#735847','600',370);
   if(this.state.mode==='room')return;
   this.box(502,120,80,336,16,'#c99d7c',INK,3);
   for(let i=0;i<4;i++){
    const y=132+i*79;
    this.box(511,y,62,67,10,'#fffaf0',INK,2);
    const slot=this.state.slots[i];
    if(slot)this.text(slot.icon,540,y+43,29);
    this.text(String(i+1),563,y+59,12,'#ba5c43','900');
   }
   if(this.state.popup&&this.state.popup.timer>0){
    const p=this.state.popup,py=660;
    this.box(24,py,164,164,20,'#fff9e8',INK,3);
    this.text('NEW',106,py+30,24,'#cb714b','900');
    this.text(p.icon,106,py+89,43);
    this.text(p.word,106,py+125,17,INK,'850',150);
    this.text(p.weight,106,py+147,13,'#775a47','650',152);
   }
  }
  update(dt){
   if(this.state.popup)this.state.popup.timer=Math.max(0,this.state.popup.timer-dt);
   const f=this.state.fishing,w=this.state.weeding,g=this.state.foraging;
   if(f.catchTimer>0)f.catchTimer=Math.max(0,f.catchTimer-dt);
   if(this.state.mode==='fishing'&&f.catchTimer<=0){
    f.pos+=f.dir*dt*.62;
    if(f.pos>=.96){f.pos=.96;f.dir=-1;}
    if(f.pos<=.04){f.pos=.04;f.dir=1;}
   }
   if(this.state.mode==='weeding'){
    if(w.timer>0){
     w.timer=Math.max(0,w.timer-dt);
     if(!w.timer){
      if(w.pendingRetry){w.pendingRetry=false;this.retryWord(true);}
      w.status='idle';
     }
    }
    else{
     w.pos+=w.dir*dt*.8;
     if(w.pos>=1){w.pos=1;w.dir=-1;}
     if(w.pos<=0){w.pos=0;w.dir=1;}
    }
   }
   if(this.state.mode==='foraging'&&g.stage!==1){
    g.timer=Math.max(0,g.timer-dt);
    if(g.timer<=0){
     if(g.stage===2){g.stage=3;g.timer=1;}
     else{g.stage=1;g.pending=false;this.advanceWord(true);}
    }
   }
  }
  renderFishing(){
   const c=this.ctx;
   // Do not synthesize scenery or character shapes: only the user's authored
   // PNGs are rendered. A combined background illustration always goes first.
   this.paintSprite('bg_fishing',0,0,W,H);
   const catching=this.state.fishing.catchTimer>0;
   this.paintSprite(catching?'hachiware_catch':'hachiware_idle',216,288,238,252);
   // Fishing timing gauge is an interactive HUD, not an illustrated fallback.
   this.box(30,855,540,115,18,'#fffaf0');
   this.text('물고기 구간에서 눌러보세요',300,880,17,INK,'800');
   this.box(52,907,496,35,18,'#def2d8',INK,2.5);
   const z=this.state.fishing.zone;
   c.fillStyle='#89c8ec';c.fillRect(52+496*z[0],911,496*(z[1]-z[0]),27);
   this.text('🐟',52+496*(z[0]+z[1])/2,934,18);
   this.box(52+496*this.state.fishing.pos-9,901,18,47,6,'#ef7773',INK,2);
  }
  renderWeeding(){
   const c=this.ctx,w=this.state.weeding;
   if(!this.paintSprite('bg_weeding',0,0,W,H)){
    this.background('#f8dfbc','#bbdfbb');
    c.fillStyle='#99c899';c.beginPath();c.ellipse(300,680,290,240,0,0,Math.PI*2);c.fill();
    for(let i=0;i<13;i++)this.text('✿',34+i*43,570+Math.sin(i)*24,19,['#f7bac9','#f0d07d','#c4bbf7'][i%3]);
   }
   const key=w.status==='idle'?'weed_medium':'weed_'+w.status;
   if(!this.paintSprite(key,162,306,265,280)&&
      !this.atlas.drawPanel(c,'weeding_states',
       w.status==='perfect'?0:w.status==='bad'?2:1,162,306,265,280))
    this.drawCritter(290,480,false,w.status);
   const labels={idle:'타이밍을 맞춰 잡초를 뽑으세요',perfect:'✨ 적합! 뿌리째 깔끔하게!',medium:'💦 중간! 힘껏 뽑았어요',bad:'💫 비적합! 줄기가 끊어졌어요'};
   this.box(104,579,392,46,11,'#fff8e5',INK,2);
   this.text(labels[w.status],300,610,18);
   this.box(30,860,540,96,18,'#fffaf0');
   this.box(52,889,496,36,17,'#f69ca3',INK,2);
   c.fillStyle='#f8d387';c.fillRect(52+496*.22,893,496*.56,28);
   c.fillStyle='#89dba5';c.fillRect(52+496*.4,893,496*.2,28);
   this.box(52+496*w.pos-8,883,16,48,6,INK,INK,1);
   this.text('비적합       중간         적합         중간        비적합',300,947,12);
  }
  renderForaging(){
   const c=this.ctx,g=this.state.foraging;
   if(!this.paintSprite('bg_foraging',0,0,W,H)){
    this.background('#e8edcb','#b5d6a3');
    for(let i=0;i<6;i++){const x=25+i*105;this.box(x,240,20,360,8,'#9c815e',INK,1);
     c.fillStyle='#98be93';c.beginPath();c.ellipse(x+9,251,65,115,0,0,Math.PI*2);c.fill();}
    c.fillStyle='#d6dfac';c.fillRect(0,600,W,400);
   }
   const stage=g.stage;
   if(!this.paintSprite('food_'+stage,160,280,250,270)&&
      !this.atlas.drawPanel(c,'foraging_stages',stage-1,160,280,250,270))
    this.drawCritter(280,450,false,'food_'+stage);
   const labels={1:'1/3 발견 · 맞는 영단어를 선택하세요',2:'2/3 줍기 · 두 손으로 조심히',3:'3/3 획득 · 머리 위로 번쩍!'};
   this.box(88,546,424,47,11,'#fff9e8',INK,2);
   this.text(labels[stage],300,576,18);
   const choices=g.choices||[];
   for(let i=0;i<3;i++){
    const x=140+i*160;this.box(x-48,618,96,76,16,'#fff9e5');
    this.text(['🍮','🍙','🍰'][i],x,665,43);
   }
   this.box(56,760,488,170,16,'#fff9e6');
   this.text('아래 단어 버튼으로 음식을 주우세요',300,801,21);
   this.text(choices.map(x=>x.word).join('  ·  '),300,853,17,'#7b5c47','650',450);
  }
  floorPoint(x,y){
   const dx=(x-300)/245,dy=(y-480)/135;
   return Math.abs(dx)+Math.abs(dy)<=1.01;
  }
  constrainFloor(x,y){
   let dx=(x-300)/245,dy=(y-480)/135;
   const sum=Math.abs(dx)+Math.abs(dy);
   if(sum>0.89){const r=.89/sum;dx*=r;dy*=r;}
   return {x:300+245*dx,y:480+135*dy};
  }
  renderRoom(){
   const c=this.ctx;
   if(!this.paintSprite('bg_room',0,0,W,H)){
    this.background('#f7e6d0','#c9e0c7');
    c.fillStyle='#fff7e8';c.lineWidth=4;c.strokeStyle=INK;
    c.beginPath();c.moveTo(300,130);c.lineTo(545,255);c.lineTo(545,470);c.lineTo(300,345);c.closePath();c.fill();c.stroke();
    c.beginPath();c.moveTo(300,130);c.lineTo(55,255);c.lineTo(55,470);c.lineTo(300,345);c.closePath();c.fill();c.stroke();
    c.fillStyle='#d1a27c';c.beginPath();c.moveTo(300,345);c.lineTo(545,470);c.lineTo(300,615);c.lineTo(55,470);c.closePath();c.fill();c.stroke();
    c.strokeStyle='#e8c4a0';c.lineWidth=2;
    for(let i=1;i<8;i++){const u=i/8;c.beginPath();c.moveTo(55+490*u,470-125*u);c.lineTo(300+245*u,615-145*u);c.stroke();}
   }
   this.drawCritter(285,465,false,'food_3',.53);
   this.drawCritter(367,479,true,'catch',.53);
   for(let i=0;i<this.state.room.placed.length;i++){
    const it=this.state.room.placed[i],info=itemTypes[it.id]||{icon:'📦'};
    this.text(info.icon,it.x,it.y+13,47);
    if(this.state.room.dragIdx===i)this.text('↕',it.x,it.y-46,24,'#cd6748');
   }
   this.box(40,735,520,120,18,'#fffaf0');
   this.text('가구를 눌러 이동해요 · 방 바닥에서 놓으세요',300,784,21);
   this.text('방 꾸미기는 기기에 자동 저장됩니다',300,824,16,'#7b5a45','650');
  }
  drawCritter(x,y,isHachi,pose,scale=1){
   const c=this.ctx;c.save();c.translate(x,y);c.scale(scale,scale);
   if(pose==='bad')c.rotate(-.35);
   if(pose==='food_2')c.translate(0,14);
   this.box(-38,-28,76,63,30,SKIN,INK,3.5);
   if(isHachi){
    c.fillStyle='#84b3df';c.strokeStyle=INK;c.lineWidth=3;
    for(const sign of [-1,1]){c.beginPath();c.moveTo(sign*25,-95);c.lineTo(sign*50,-142);c.lineTo(sign*12,-117);c.closePath();c.fill();c.stroke();}
   }else{
    for(const sign of [-1,1]){c.beginPath();c.ellipse(sign*37,-119,16,24,0,0,Math.PI*2);c.fillStyle=SKIN;c.fill();c.strokeStyle=INK;c.lineWidth=3;c.stroke();}
   }
   c.beginPath();c.arc(0,-78,54,0,Math.PI*2);c.fillStyle=SKIN;c.fill();c.strokeStyle=INK;c.lineWidth=3.5;c.stroke();
   if(isHachi){c.fillStyle='#83b5e1';c.beginPath();c.arc(-18,-100,35,Math.PI*1.07,Math.PI*1.9);c.lineTo(0,-91);c.fill();}
   c.fillStyle='#f3a6ad';
   for(const sign of [-1,1]){c.beginPath();c.ellipse(sign*30,-65,10,5,0,0,Math.PI*2);c.fill();}
   c.fillStyle=INK;
   for(const sign of [-1,1]){c.beginPath();c.arc(sign*18,-83,4.8,0,Math.PI*2);c.fill();}
   c.strokeStyle=INK;c.lineWidth=3;c.beginPath();c.arc(0,-72,pose==='bad'?5:9,0,Math.PI);c.stroke();
   if(pose==='medium'||pose==='bad')this.text('💦',51,-80,24);
   if(pose==='perfect'||pose==='catch'||pose==='food_3')this.text('✨',58,-130,27);
   c.restore();
  }
  award(word,icon){
   // One answer records one review; never reward if the persistent save failed.
   if(!word||!root.WordvilleSolo?.learnFromCanvas)return false;
   const result=root.WordvilleSolo.learnFromCanvas(word.id,this.state.mode,true);
   if(result===false)return false;
   this.state.popup={icon,word:word.word,weight:(1+(word.word.length%7)*.45).toFixed(2)+'kg',timer:2.2};
   if(this.state.slots.length>=4)this.state.slots.shift();
   this.state.slots.push({icon,word:word.word});
   if(root.AndroidBridge&&typeof root.AndroidBridge.onWordLearned==='function'){
    try{root.AndroidBridge.onWordLearned(String(word.id),this.state.mode);}catch{}
   }
   this.message('✅ '+word.word+' = '+label(word)+' · 학습 기록과 코인 저장 완료');
   return true;
  }
  onTapAction(){
   if(Date.now()<this.nextActionAt||!this.getCurrentWord()||this.state.mode==='room')return;
   const word=this.getCurrentWord();this.nextActionAt=Date.now()+450;
   if(this.state.mode==='fishing'){
    const f=this.state.fishing,z=f.zone;
    if(f.pos>=z[0]&&f.pos<=z[1]){
     if(this.award(word,'🐟')){f.catchTimer=1.1;this.advanceWord();this.nextActionAt=Date.now()+1000;}
    }else this.message('아쉬워요! 표시가 파란 물고기 구간에 올 때 눌러보세요.');
   }else if(this.state.mode==='weeding'){
    const w=this.state.weeding;if(w.timer>0)return;
    const p=w.pos;w.status=p>=.4&&p<=.6?'perfect':p>=.22&&p<=.78?'medium':'bad';
    w.timer=1.3;this.nextActionAt=Date.now()+1300;
    if(w.status==='bad'){
     this.message('비적합: 뿌리째 뽑지 못했어요. 다시 도전해 보세요.');
     if(root.WordvilleSolo?.learnFromCanvas(word.id,this.state.mode,false)!==false){
      this.studyManager.playTone('fail');
      w.pendingRetry=true;
     }
    }else if(this.award(word,w.status==='perfect'?'🌱':'🌿'))this.advanceWord();
   }
  }
  buildForagingChoices(){
   const node=this.choicesNode;if(!node)return;
   node.replaceChildren();
   const word=this.getCurrentWord();if(!word)return;
   const others=this.words.filter(w=>w.word!==word.word).slice();
   for(let i=others.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[others[i],others[j]]=[others[j],others[i]];}
   const options=[word,...others.slice(0,2)];
   for(let i=options.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
   this.state.foraging.choices=options;
   for(const w of options){
    const button=root.document.createElement('button');button.type='button';
    button.className='wv-canvas-choice';button.textContent=w.word;
    button.addEventListener('click',()=>{
     const g=this.state.foraging;
     if(this.state.mode!=='foraging'||g.stage!==1||Date.now()<this.nextActionAt)return;
     if(w.id!==word.id){
      this.message('❌ '+w.word+'는 정답이 아닙니다. 뜻을 다시 확인해 주세요.');
      this.nextActionAt=Date.now()+450;
      if(root.WordvilleSolo?.learnFromCanvas(word.id,this.state.mode,false)!==false)
       this.retryWord();
      return;
     }
     if(this.award(word,word.word.length%2?'🍮':'🍙')){
      this.studyManager.playTone('success');
      g.stage=2;g.timer=.85;g.pending=true;
      this.nextActionAt=Date.now()+900;
     }
    });
    node.append(button);
   }
  }
  renderRoomInventoryUI(){
   const list=this.inventoryNode;if(!list)return;
   const r=this.state.room;list.replaceChildren();
   const fromExisting=root.WordvilleSolo?.progress?.owned||[];
   for(const id of fromExisting)if(itemTypes[id]&&!r.unlocked.some(x=>x.id===id))
    r.unlocked.push({id,...itemTypes[id]});
   for(const item of r.unlocked){
    const button=root.document.createElement('button');
    button.type='button';button.className='wv-canvas-inventory-item';
    button.textContent=item.icon+' '+item.name;
    button.addEventListener('click',()=>{
     r.placed.push({id:item.id,x:300,y:478});this.saveRoomState();
     this.message(item.name+' 배치 완료 · 드래그해서 위치를 변경하세요.');
    });
    list.append(button);
   }
  }
  pointerXY(e){
   const rect=this.canvas.getBoundingClientRect();
   if(!rect.width||!rect.height)return null;
   return {x:(e.clientX-rect.left)/rect.width*W,y:(e.clientY-rect.top)/rect.height*H};
  }
  bindEvents(){
   this.canvas.style.touchAction='none';
   this.canvas.addEventListener('pointerdown',event=>{
    const p=this.pointerXY(event);if(!p)return;
    if(this.state.mode==='room'){
     for(let i=this.state.room.placed.length-1;i>=0;i--){
      const it=this.state.room.placed[i];
      if(Math.hypot(p.x-it.x,p.y-(it.y-18))<=53){
       this.state.room.dragIdx=i;this.canvas.setPointerCapture?.(event.pointerId);return;
      }
     }
     return;
    }
    if(this.state.mode!=='foraging'&&p.y>=820)this.onTapAction();
   });
   this.canvas.addEventListener('pointermove',event=>{
    const r=this.state.room;if(this.state.mode!=='room'||r.dragIdx<0)return;
    const p=this.pointerXY(event);if(!p)return;
    const xy=this.constrainFloor(p.x,p.y+18);
    Object.assign(r.placed[r.dragIdx],xy);
   });
   const end=()=>{const r=this.state.room;if(r.dragIdx>=0){r.dragIdx=-1;this.saveRoomState();}};
   this.canvas.addEventListener('pointerup',end);
   this.canvas.addEventListener('pointercancel',end);
   root.addEventListener('pointerup',end);
   root.addEventListener('resize',()=>this.resize());
   root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden)this.pause();else this.resume();});
   root.document.addEventListener('wordville-app-resume',()=>{this.resize();this.resume();this.refreshWordPool();});
   root.document.addEventListener('wordville-words-ready',()=>this.loadWordsFromAndroid(root.WordvilleWords||[]));
   root.document.getElementById('wordville-action')?.addEventListener('click',()=>this.onTapAction());
   root.document.getElementById('btn-clear-room')?.addEventListener('click',()=>{
    this.state.room.placed=[];this.saveRoomState();this.message('배치만 초기화했습니다. 보유 가구는 그대로 유지됩니다.');
   });
   root.document.getElementById('wv-solo-day')?.addEventListener('change',()=>this.refreshWordPool());
  }
  paint(){
   this.ctx.clearRect(0,0,W,H);
   if(this.state.mode==='fishing')this.renderFishing();
   else if(this.state.mode==='weeding')this.renderWeeding();
   else if(this.state.mode==='foraging')this.renderForaging();
   else this.renderRoom();
   this.drawHUD();
  }
  pause(){this.running=false;if(this.raf)root.cancelAnimationFrame(this.raf);this.raf=0;this.lastFrame=0;}
  resume(){
   const view=root.document.getElementById('wv-solo-view');
   if(root.document.hidden||view?.hidden||this.running)return;
   this.running=true;this.lastFrame=0;
   const tick=now=>{
    if(!this.running||root.document.hidden||view?.hidden){this.pause();return;}
    const dt=this.lastFrame?Math.min(.05,(now-this.lastFrame)/1000):0;
    this.lastFrame=now;this.update(dt);this.paint();
    this.raf=root.requestAnimationFrame(tick);
   };
   this.raf=root.requestAnimationFrame(tick);
  }
  destroy(){this.pause();this.studyManager.dispose();}
 }
 root.WordvilleGameEngine=WordvilleGameEngine;
 function init(){
  const solo=root.document.getElementById('wv-solo-view');
  if(!solo||root.wordvilleGame)return;
  const panel=root.document.createElement('div');panel.className='wv-canvas-panel';
  const heading=root.document.createElement('h3');heading.id='game-badge';heading.textContent='🎣 낚시 · 하치와레';
  const target=root.document.createElement('p');target.id='target-meaning';target.setAttribute('aria-live','polite');
  const hint=root.document.createElement('p');hint.id='target-hint';
  const canvas=root.document.createElement('canvas');canvas.id='wordvilleCanvas';
  canvas.width=600;canvas.height=1000;canvas.setAttribute('aria-label','Wordville 600 × 1000 캔버스 단어 미니게임');
  const status=root.document.createElement('p');status.id='wordville-canvas-status';
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const choices=root.document.createElement('div');choices.id='foraging-choices';choices.hidden=true;
  const drawer=root.document.createElement('div');drawer.id='room-drawer';drawer.hidden=true;
  const drawerTitle=root.document.createElement('strong');drawerTitle.textContent='내 방 가구 서랍';
  const items=root.document.createElement('div');items.id='room-item-list';
  const clear=root.document.createElement('button');clear.id='btn-clear-room';clear.type='button';clear.textContent='가구 배치만 초기화';
  drawer.append(drawerTitle,items,clear);
  const action=root.document.createElement('button');action.type='button';
  action.id='wordville-action';action.textContent='🎯 타이밍 맞춰 누르기';
  panel.append(heading,target,hint,canvas,action,choices,drawer,status);
  const navbar=solo.querySelector('.wv-solo-topnav');navbar?.after(panel);
  root.wordvilleGame=new WordvilleGameEngine('wordvilleCanvas');
 }
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})(typeof window!=='undefined'?window:globalThis);
