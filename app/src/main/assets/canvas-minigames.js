/* Four offline single-player Canvas games. Built for the trusted local Android WebView asset origin.
 * 600x1000 logical points, 1200x2000 backing at DPR>=2. Original vocabulary and
 * existing WordvilleSolo progress are authoritative; the Canvas never creates demo words.
 */
(function(root){
 'use strict';
 const W=600,H=1000,INK='#4A3B32',SKIN='#fffdf8',WOOD='#b78961',ROOM_KEY='wordville_room_v1';
 const modes=['fishing','weeding','foraging','room'];
 const FORAGE_STAGES=[
  {label:'Perfect!',progress:30},
  {label:'Careful!',progress:68},
  {label:'Success!',progress:100}
 ];
 const ART_W=1147,ART_H=1536;
 const FISH_ZONE=[64,88];
 const FISH_HINT='화면 또는 게이지를 탭해서 낚아채세요!';
 const ROOM_CARD_X=[133,315,493,672,850];
 const ROOM_FLOOR_OFFSET=140;
 const ROOM_ITEM_LIMIT=35;
 const ROOM_ART={
  bed:[145,1310,136,123,'M3 48 Q7 22 58 6 L68 4 L75 23 L85 35 L132 60 L135 100 L109 114 L95 119 L76 106 L70 101 L42 85 L22 81 L3 69 Z'],
  shelf:[345,1300,99,143,'M4 22 L32 4 L94 43 L92 122 L71 139 L5 93 Z'],
  chair:[523,1303,107,137,'M39 15 Q55 0 76 10 Q101 19 99 52 L100 113 L83 127 L69 124 L65 114 Q67 136 49 133 Q41 134 40 116 L29 111 Q23 129 12 119 L10 104 Q4 100 4 87 Q3 70 36 50 Z'],
  plant:[700,1303,110,135,'M32 28 Q12 9 35 11 Q46 11 52 24 Q50 2 66 5 Q78 4 78 16 L79 26 Q111 10 96 38 L86 49 Q113 41 102 57 L82 76 L92 87 L84 116 Q76 131 52 131 Q31 131 23 115 L19 91 Q11 90 15 80 L30 72 Q5 59 14 49 L29 47 Q15 36 32 28 Z'],
  lamp:[886,1304,92,134,'M5 51 Q7 37 19 18 Q27 1 53 4 Q77 5 87 37 Q97 60 83 69 L55 80 L55 100 Q73 102 74 114 Q72 129 48 131 Q24 129 22 116 Q21 105 37 101 L37 80 Q12 79 5 66 Z']
 };
 const FURNITURE_IMAGES={desk:'02_writing_desk.png',books:'04_bookshelf.png',sofa:'06_sage_sofa.png'};
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
   placed:[],
   dragIdx:-1};
 }
 class WordvilleGameEngine {
  constructor(canvasId){
   this.canvas=document.getElementById(canvasId);
   if(!this.canvas)throw new Error('Wordville Canvas element missing: '+canvasId);
   this.ctx=this.canvas.getContext('2d',{alpha:true});
   if(!this.ctx)throw new Error('Canvas 2D context unavailable');
   this.LOGICAL_W=W;this.LOGICAL_H=H;
   this.sprites={};
   this.spriteManifest={
    reference_fishing:'images/reference/fishing.gif',reference_weeding:'images/reference/weeding.gif',
    bg_fishing:'images/fishing/bg_fishing.png',hachiware_idle:'images/fishing/hachiware_idle.png',
    hachiware_catch:'images/fishing/hachiware_catch.png',
    bg_weeding:'images/weeding/bg_meadow.png',weed_perfect:'images/weeding/chiikawa_perfect.png',
    weed_medium:'images/weeding/chiikawa_medium.png',weed_bad:'images/weeding/chiikawa_bad.png',
    bg_room:'images/room/room-decor.webp',
    ...Object.fromEntries(Object.entries(FURNITURE_IMAGES).map(([id,file])=>[
     'furniture_'+id,'art/furniture/'+file
    ]))
   };
   this.words=[];this.sourceWords=[];
   this.atlas=new root.SpriteAtlasHelper();
   this.studyManager=new root.WordvilleStudyManager([]);
   this.stateScope='all';this.pendingAnswer=null;
   this.answerForm=root.document.getElementById('wv-canvas-answer');
   this.answerPrompt=root.document.getElementById('wv-answer-prompt');
   this.answerInput=root.document.getElementById('wv-answer-input');
   this.fishingWord=root.document.getElementById('wv-fishing-word');
   this.weedingWord=root.document.getElementById('wv-weeding-word');
   this.artError=root.document.getElementById('wv-fishing-art-error');
   this.state={mode:'fishing',wordIdx:0,slots:[],popup:null,
    fishing:{pos:15,dir:1,caught:false,sceneDirty:true,counts:[0,0,0,0]},
    weeding:{pos:0,dir:1,status:'idle',timer:0,pendingRetry:false},
    foraging:{stage:1,timer:0,choices:[],pending:false},
    room:this.loadRoomState()};
   this.running=false;this.raf=0;this.lastFrame=0;this.nextActionAt=0;
   this.status=root.document.getElementById('wordville-canvas-status');
   this.choicesNode=root.document.getElementById('foraging-choices');
   this.forageCard=root.document.getElementById('wv-forage-card');
   this.forageBadge=this.forageCard.querySelector('.wv-forage-badge');
   this.forageGauge=this.forageCard.querySelector('.wv-forage-gauge');
   this.forageButtons=this.forageCard.querySelectorAll('[data-forage-action]');
   this.inventoryNode=root.document.getElementById('room-item-list');
   this.drawer=root.document.getElementById('room-drawer');
   this.stage=this.canvas.parentElement;
   this.fishingControls=root.document.getElementById('wv-fishing-controls');
   this.fishingReel=this.fishingControls.querySelector('.wv-fishing-reel');
   this.fishingBobber=this.fishingControls.querySelector('.wv-fishing-bobber');
   this.fishingHint=this.fishingControls.querySelector('.wv-fishing-hint');
   this.fishingPopup=this.fishingControls.querySelector('.wv-fishing-popup');
   this.fishingWeight=this.fishingPopup.querySelector('.wv-fishing-weight');
   this.fishingControls.style.setProperty('--fish-start',FISH_ZONE[0]+'%');
   this.fishingControls.style.setProperty('--fish-width',(FISH_ZONE[1]-FISH_ZONE[0])+'%');
   this.roomToggle=root.document.getElementById('room-drawer-toggle');
   this.inventoryPage=0;
   this.selectedFurniture='bed';
   this.roomArt={};
   this.roomHandleLayer=root.document.getElementById('wv-room-drag-targets');
   this.roomPointerId=null;
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
      .slice(0,ROOM_ITEM_LIMIT).map(it=>({id:it.id,...this.constrainFloor(it.x,it.y)}));
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
      this.sprites[key]=cleaned||image;
      if(!cleaned)console.warn('[Wordville Fishing] Chroma key unavailable, showing original PNG:',key);
     }else this.sprites[key]=image;
     if(key==='bg_room'){this.prepareRoomArt(image);this.paint();}
     if(key==='reference_fishing'||key==='reference_weeding'){
      this.stage.dataset.referenceArt='true';
      this.state.fishing.sceneDirty=true;
     }
     if(key==='bg_fishing'&&this.artError)this.artError.hidden=true;
     if(key.startsWith('hachiware_')||key==='bg_fishing'){
      this.state.fishing.sceneDirty=true;
      console.info('[Wordville Fishing] PNG loaded',key,url,image.naturalWidth+'x'+image.naturalHeight);
     }
    };
    image.onerror=()=>{
     if(key==='reference_fishing'||key==='reference_weeding')return; // optional user-uploaded reference GIF
     this.reportAssetError(key,url,'image.onerror');
    };
    image.src=url;
   });
  }
  reportAssetError(key,url,reason){
   console.error('[Wordville Canvas] Image failed to load:',key,url,reason);
   if(key==='bg_room'&&this.state.mode==='room')this.message('방 꾸미기 이미지를 불러오지 못했습니다.');
   if(key==='bg_fishing'||key==='hachiware_idle'||key==='hachiware_catch'){
    if(key==='bg_fishing'&&this.artError){this.artError.hidden=false;this.artError.textContent='낚시 배경 이미지를 불러오지 못했습니다. 앱의 이미지 에셋을 확인해 주세요.';}
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
   this.state.fishing.sceneDirty=true;
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
   this.state.mode=mode;this.stage.dataset.mode=mode;this.nextActionAt=0;
   this.pendingAnswer=null;this.answerForm.hidden=true;
   if(this.weedingWord)this.weedingWord.hidden=mode!=='weeding';
   if(this.artError)this.artError.hidden=true;
   this.stage.dataset.referenceArt=String(Boolean(this.sprites[mode==='fishing'?'reference_fishing':'reference_weeding']));
   this.message('');
   this.state.fishing.sceneDirty=true;
   this.fishingControls.hidden=mode!=='fishing';
   if(mode==='fishing')this.resetFishing();
   this.state.weeding.timer=0;
   this.state.weeding.status='idle';this.state.weeding.pendingRetry=false;
   this.state.foraging.pending=false;
   this.setForageStage(1);
   this.forageCard.hidden=mode!=='foraging';
   this.canvas.hidden=mode==='foraging';
   if(this.choicesNode)this.choicesNode.hidden=mode!=='foraging';
   if(this.roomToggle)this.roomToggle.hidden=mode!=='room';
   root.document.getElementById('btn-clear-room').hidden=mode!=='room';
   this.setDrawerOpen(mode==='room');
   if(this.roomHandleLayer)this.roomHandleLayer.hidden=mode!=='room';
   const action=root.document.getElementById('wordville-action');
   if(action)action.hidden=mode!=='weeding';
   if(mode==='foraging')this.buildForagingChoices();
   if(mode==='room'){this.renderRoomInventoryUI();this.syncRoomHandles();}
   this.refreshHeaderUI();this.resume();
  }
  refreshHeaderUI(){
   const word=this.getCurrentWord();
   const titles={fishing:'🎣 낚시 · 하치와레',weeding:'🌱 잡초 뽑기 · 치이카와',
    foraging:'🍙 음식 줍기 · 치이카와',room:'🏠 나의 방 꾸미기'};
   const badge=root.document.getElementById('game-badge');
   if(badge)badge.textContent=titles[this.state.mode];
   const hint=root.document.getElementById('target-hint');
   if(hint)hint.hidden=this.state.mode==='fishing';
   if(hint)hint.textContent=this.state.mode==='room'?'가구를 선택한 후 방 바닥에서 드래그해 배치하세요':
    this.state.mode==='foraging'?'뜻에 맞는 영단어를 골라 음식을 모으세요. 색깔 버튼으로 3단계 동작을 볼 수 있어요.':
    '아래 움직이는 게이지를 목표 구간에서 눌러보세요';
   const current=root.document.getElementById('target-meaning');
   if(current)current.hidden=this.state.mode==='room';
   if(current)current.textContent=word?
    (this.state.mode==='foraging'?label(word):this.state.mode==='fishing'||this.state.mode==='weeding'?'영단어를 보고 한국어 뜻을 입력하세요':word.word+' — '+label(word)):
    '단어를 불러오는 중입니다';
   if(this.fishingWord)this.fishingWord.textContent=word?.word||'단어 준비 중';
   if(this.weedingWord)this.weedingWord.textContent=word?.word||'단어 준비 중';
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
   if(this.state.mode==='fishing'&&!f.caught&&!this.pendingAnswer){
    f.pos+=f.dir*dt*69;
    if(f.pos>=92){f.pos=92;f.dir=-1;}
    if(f.pos<=8){f.pos=8;f.dir=1;}
    this.syncFishingTiming();
   }
   if(this.state.mode==='weeding'){
    if(w.timer>0){
     w.timer=Math.max(0,w.timer-dt);
     if(!w.timer){
      if(w.pendingRetry){w.pendingRetry=false;this.retryWord(true);}
      w.status='idle';
     }
    }
    else if(!this.pendingAnswer){
     w.pos+=w.dir*dt*.8;
     if(w.pos>=1){w.pos=1;w.dir=-1;}
     if(w.pos<=0){w.pos=0;w.dir=1;}
    }
   }
   if(this.state.mode==='foraging'&&g.timer>0){
    g.timer=Math.max(0,g.timer-dt);
    if(!g.timer){
     if(g.stage===1)this.setForageStage(2,1.4);
     else if(g.stage===2)this.setForageStage(3,g.pending?1:0);
     else{
      g.pending=false;
      this.setForageStage(1);
     }
    }
   }
  }
  setForageStage(stage,timer=0){
   const game=this.state.foraging,display=FORAGE_STAGES[stage-1];
   game.stage=stage;
   game.timer=timer;
   this.forageCard.dataset.stage=String(stage);
   this.forageBadge.textContent=display.label;
   this.forageGauge.setAttribute('aria-valuenow',String(display.progress));
   for(const button of this.forageButtons)button.disabled=game.pending;
   for(const button of this.choicesNode.children)button.disabled=game.pending;
  }
  syncFishingTiming(){
   const fish=this.state.fishing;
   this.fishingBobber.style.left=fish.pos+'%';
   if(this.fishingWord)this.fishingWord.style.left=eq(fish.pos,18,83)+'%';
   const phase=fish.caught?'caught':
    fish.pos>=FISH_ZONE[0]&&fish.pos<=FISH_ZONE[1]?'biting':'casting';
   if(this.stage.dataset.fishingPhase!==phase)this.stage.dataset.fishingPhase=phase;
  }
  resetFishing(){
   const fish=this.state.fishing;
   fish.pos=15;fish.dir=1;fish.caught=false;fish.sceneDirty=true;
   this.fishingPopup.setAttribute('aria-hidden','true');
   this.fishingHint.textContent=FISH_HINT;
   this.fishingReel.setAttribute('aria-label','낚아채기');
   this.syncFishingTiming();
  }
  renderFishing(){
   if(this.paintSprite('reference_fishing',0,0,W,H))return;
   if(!this.paintSprite('bg_fishing',0,0,W,H)){
    if(this.artError)this.artError.hidden=false;
    return;
   }
   const c=this.ctx,f=this.state.fishing;
   const catching=f.caught;
   c.save();
   c.scale(W/ART_W,H/ART_H);
   const frame=catching?[76,410,797,459]:[550,445,323,424];
   this.paintSprite(catching?'hachiware_catch':'hachiware_idle',...frame);

   // The original bitmap includes sample numbers. Replace only its UI labels.
   const countPositions=[[1035,312],[1031,459],[1038,602],[1035,751]];
   countPositions.forEach(([x,y],index)=>{
    this.box(x-13,y-21,26,29,7,'#f8ede2',INK,0);
    this.text(String(f.counts[index]),x,y+1,23,'#774822','850',25);
   });
   this.box(176,919,157,55,12,'#fff9ed',INK,0);
   if(!catching)this.text('FISH',253,960,36,'#925824','850',140);
   this.box(141,1116,215,73,10,'#fff9ed',INK,0);
   c.restore();
  }
  renderWeeding(){
   const c=this.ctx,w=this.state.weeding;
   const hasReference=this.paintSprite('reference_weeding',0,0,W,H);
   if(!hasReference){
    if(!this.paintSprite('bg_weeding',0,0,W,H)){
     this.message('제초 배경 에셋이 없습니다. GIF 또는 PNG 이미지 파일을 추가해 주세요.');
     return;
    }
    const key=w.status==='idle'?'weed_medium':'weed_'+w.status;
    // No procedurally drawn character fallback: only authored images.
    if(!this.paintSprite(key,162,306,265,280))
     this.atlas.drawPanel(c,'weeding_states',
      w.status==='perfect'?0:w.status==='bad'?2:1,162,306,265,280);
   }
   const labels={idle:'타이밍을 맞춰 잡초를 누른 후 단어 뜻을 입력하세요',
    perfect:'✨ 타이밍·뜻 정답!',medium:'🌱 뜻 정답!',
    bad:'❌ 타이밍 또는 단어 뜻 오답'};
   // Timing meter is interactive UI; scenery and characters are images.
   this.box(30,860,540,96,18,'#fffaf0');
   this.box(52,889,496,36,17,'#f69ca3',INK,2);
   c.fillStyle='#f8d387';c.fillRect(52+496*.22,893,496*.56,28);
   c.fillStyle='#89dba5';c.fillRect(52+496*.4,893,496*.2,28);
   this.box(52+496*w.pos-8,883,16,48,6,INK,INK,1);
   this.text(labels[w.status],300,839,18,INK,'800',510);
  }
  constrainFloor(x,y){
   let dx=(x-300)/245,dy=(y-480)/135;
   const sum=Math.abs(dx)+Math.abs(dy);
   if(sum>0.89){const r=.89/sum;dx*=r;dy*=r;}
   return {x:300+245*dx,y:480+135*dy};
  }
  prepareRoomArt(image){
   // Use the reference's illustrated inventory icons as transparent room props.
   for(const [id,[x,y,w,h,outline]] of Object.entries(ROOM_ART)){
    const sprite=root.document.createElement('canvas');sprite.width=w;sprite.height=h;
    const ctx=sprite.getContext('2d');
    ctx.clip(new Path2D(outline));
    ctx.drawImage(image,x,y,w,h,0,0,w,h);
    this.roomArt[id]=sprite;
   }
  }
  renderRoom(){
   this.ctx.fillStyle='#acc8aa';this.ctx.fillRect(0,0,W,H);
   if(!this.paintSprite('bg_room',0,0,W,H))return;
   const c=this.ctx,room=this.state.room;
   const furniture=room.placed.map((item,index)=>({item,index})).sort((a,b)=>a.item.y-b.item.y);
   for(const {item,index} of furniture){
    const y=item.y+ROOM_FLOOR_OFFSET;
    const sprite=this.roomArt[item.id]||this.sprites['furniture_'+item.id];
    if(sprite){
     const width=item.id==='bed'?112:78;
     const height=width*(sprite.naturalHeight||sprite.height)/(sprite.naturalWidth||sprite.width)*1.3;
     c.drawImage(sprite,item.x-width/2,y-height,width,height);
    }else this.text(itemTypes[item.id].icon,item.x,y,43);
    if(room.dragIdx===index)this.text('↕',item.x,y-12,22,'#8b4f39');
   }
   c.save();c.scale(W/ART_W,H/ART_H);
   if(this.drawer?.hidden){
    // Leave the isometric room intact and cover the closed tray below the platform.
    c.beginPath();c.moveTo(0,1135);c.lineTo(442,1135);c.lineTo(572,1208);
    c.lineTo(862,1040);c.lineTo(1147,1040);c.lineTo(1147,1536);c.lineTo(0,1536);
    c.closePath();c.fillStyle='#acc8aa';c.fill();
   }else{
    const items=room.unlocked.slice(this.inventoryPage*5,this.inventoryPage*5+5);
    for(let i=0;i<ROOM_CARD_X.length;i++){
     const x=ROOM_CARD_X[i],item=items[i];
     if(this.inventoryPage>0||(i===0&&this.selectedFurniture!=='bed')){
      this.box(x,1290,160,164,24,item?'#fff7ec':'#c59a79','#795646',4);
      if(item){
       const art=this.roomArt[item.id]||this.sprites['furniture_'+item.id];
       if(art)c.drawImage(art,x+33,1313,94,108);
       else this.text(item.icon,x+80,1402,69);
      }
     }
     if(!item)continue;
     if(item.id===this.selectedFurniture)this.box(x+3,1294,154,154,24,'#ffe18a35','#fff7d5',7);
     const count=room.placed.filter(placed=>placed.id===item.id).length;
     this.box(x+121,1417,42,39,11,'#f6ac85','#754f42',3);
     this.text(String(count),x+142,1445,24,'#55382e','850',36);
    }
   }
   c.restore();
  }
  award(word,icon,weight){
   // One answer records one review; never reward if the persistent save failed.
   if(!word||!root.WordvilleSolo?.learnFromCanvas)return false;
   const result=root.WordvilleSolo.learnFromCanvas(word.id,this.state.mode,true);
   if(result===false)return false;
   this.state.popup={icon,word:word.word,weight:weight??(1+(word.word.length%7)*.45).toFixed(2)+'kg',timer:2.2};
   if(this.state.slots.length>=4)this.state.slots.shift();
   this.state.slots.push({icon,word:word.word});
   if(root.AndroidBridge&&typeof root.AndroidBridge.onWordLearned==='function'){
    try{root.AndroidBridge.onWordLearned(String(word.id),this.state.mode);}catch{}
   }
   this.message('✅ '+word.word+' = '+label(word)+' · 학습 기록과 코인 저장 완료');
   return true;
  }
  openAnswer(mode,quality){
   const word=this.getCurrentWord();
   if(!word||this.pendingAnswer)return false;
   this.pendingAnswer={wordId:String(word.id),mode,quality};
   this.answerInput.value='';
   this.answerPrompt.textContent='“'+word.word+'”의 한국어 뜻을 입력하세요';
   this.answerForm.hidden=false;
   this.message('단어 뜻이 맞아야 정답과 코인이 인정됩니다.');
   this.answerInput.focus({preventScroll:true});
   return true;
  }
  submitAnswer(value){
   const pending=this.pendingAnswer;
   if(!pending||this.state.mode!==pending.mode)return false;
   const word=this.getCurrentWord();
   if(!word||String(word.id)!==pending.wordId){
    this.cancelAnswer();return false;
   }
   const correct=root.WordvilleCanvasAnswer?.matches(word,value)===true;
   this.pendingAnswer=null;this.answerForm.hidden=true;this.nextActionAt=Date.now()+500;
   if(!correct){
    if(root.WordvilleSolo?.learnFromCanvas(word.id,pending.mode,false)!==false)
     this.retryWord(true);
    if(pending.mode==='fishing')this.resetFishing();
    else {this.state.weeding.status='bad';this.state.weeding.timer=1.3;}
    this.message('❌ 오답 · '+word.word+' = '+label(word)+' · 다시 복습하세요.');
    return false;
   }
   if(!this.award(word,pending.mode==='fishing'?'🐟':pending.quality==='perfect'?'🌱':'🌿')){
    this.message('학습 기록을 저장하지 못했습니다. 저장 공간을 확인해 주세요.');
    return false;
   }
   if(pending.mode==='fishing'){
    const f=this.state.fishing;
    const weight=(Math.random()*2.5+2.5).toFixed(2)+' kg';
    f.counts[word.word.length%f.counts.length]++;
    f.caught=true;f.sceneDirty=true;
    this.fishingWeight.textContent=weight;
    this.fishingHint.textContent='정답! 다음 낚시를 하려면 찌를 누르세요';
    this.fishingPopup.setAttribute('aria-hidden','false');
    this.fishingReel.setAttribute('aria-label','다시 낚시하기');
    this.syncFishingTiming();
   }else{
    this.state.weeding.status=pending.quality;
    this.state.weeding.timer=1.3;
   }
   this.advanceWord(true);
   return true;
  }
  cancelAnswer(){
   this.pendingAnswer=null;this.answerForm.hidden=true;
   this.message('단어 뜻 입력을 취소했습니다. 다시 타이밍을 맞춰 눌러주세요.');
  }
  onTapAction(){
   if(this.pendingAnswer)return;
   if(this.state.mode==='fishing'){
    const f=this.state.fishing;
    if(f.caught){this.resetFishing();this.message('');return;}
    if(!this.getCurrentWord()||Date.now()<this.nextActionAt)return;
    if(f.pos>=FISH_ZONE[0]-2&&f.pos<=FISH_ZONE[1]+2){
     this.openAnswer('fishing','perfect');
    }else{
     this.fishingHint.textContent='찌가 노란 구간에 들어올 때 탭하세요!';
     this.message('찌를 노란 구간에 맞추면 단어 뜻 입력창이 열립니다.');
    }
    return;
   }
   if(this.state.mode==='weeding'){
    if(Date.now()<this.nextActionAt||!this.getCurrentWord())return;
    const w=this.state.weeding;
    if(w.timer>0)return;
    const p=w.pos,quality=p>=.4&&p<=.6?'perfect':p>=.22&&p<=.78?'medium':'bad';
    if(quality==='bad'){
     w.status='bad';w.timer=1.3;this.nextActionAt=Date.now()+1300;
     const word=this.getCurrentWord();
     if(root.WordvilleSolo?.learnFromCanvas(word.id,this.state.mode,false)!==false)
      w.pendingRetry=true;
     this.message('타이밍이 맞지 않습니다. 단어를 맞혀도 점수가 지급되지 않습니다.');
     return;
    }
    this.openAnswer('weeding',quality);
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
    button.disabled=this.state.foraging.pending;
    button.addEventListener('click',()=>{
     const g=this.state.foraging;
     if(this.state.mode!=='foraging'||g.pending||Date.now()<this.nextActionAt)return;
     if(w.id!==word.id){
      this.setForageStage(1);
      this.message('❌ '+w.word+'는 정답이 아닙니다. 뜻을 다시 확인해 주세요.');
      this.nextActionAt=Date.now()+450;
      if(root.WordvilleSolo?.learnFromCanvas(word.id,this.state.mode,false)!==false)
       this.retryWord();
      return;
     }
     if(this.award(word,word.word.length%2?'🍮':'🍙')){
      this.studyManager.playTone('success');
      g.pending=true;
      this.setForageStage(2,1.4);
      this.advanceWord(true);
     }
    });
    node.append(button);
   }
  }
  setDrawerOpen(open){
   if(this.drawer)this.drawer.hidden=!open;
   this.roomToggle?.setAttribute('aria-expanded',String(open));
  }
  renderRoomInventoryUI(){
   const list=this.inventoryNode;if(!list)return;
   const room=this.state.room;list.replaceChildren();
   const fromExisting=root.WordvilleSolo?.progress?.owned||[];
   for(const id of fromExisting)if(itemTypes[id]&&!room.unlocked.some(x=>x.id===id))
    room.unlocked.push({id,...itemTypes[id]});
   const count=Math.ceil(room.unlocked.length/5);
   this.inventoryPage=eq(this.inventoryPage,0,count-1);
   this.drawer.querySelector('[data-turn="-1"]').disabled=count<2;
   this.drawer.querySelector('[data-turn="1"]').disabled=count<2;
   for(const item of room.unlocked.slice(this.inventoryPage*5,this.inventoryPage*5+5)){
    const button=root.document.createElement('button');
    button.type='button';button.className='wv-canvas-inventory-item';
    button.setAttribute('aria-label',item.name+' 배치');
    button.addEventListener('click',()=>{
     if(room.placed.length>=ROOM_ITEM_LIMIT){
      this.message('가구는 최대 '+ROOM_ITEM_LIMIT+'개까지 배치할 수 있습니다.');return;
     }
     const offset=room.placed.length%6;
     const placed={id:item.id,...this.constrainFloor(242+offset*31,532-(offset%2)*34)};
     room.placed.push(placed);
     if(!this.saveRoomState()){room.placed.pop();return;}
     this.selectedFurniture=item.id;this.syncRoomHandles();
     this.message(item.name+' 배치 완료 · 드래그해서 위치를 변경하세요.');
    });
    list.append(button);
   }
   this.syncRoomHandles();
  }
  syncRoomHandles(){
   const layer=this.roomHandleLayer;
   if(!layer)return;
   const items=this.state.room.placed;
   while(layer.children.length>items.length)layer.lastElementChild.remove();
   while(layer.children.length<items.length){
    const handle=root.document.createElement('button');
    handle.type='button';handle.className='wv-room-drag-handle';
    handle.addEventListener('pointerdown',event=>{
     if(this.state.mode!=='room')return;
     event.preventDefault();event.stopPropagation();
     const index=Number(handle.dataset.index);
     if(!Number.isInteger(index)||!this.state.room.placed[index])return;
     const p=this.pointerXY(event);if(!p)return;
     const item=this.state.room.placed[index];
     this.roomDragOffset={x:item.x-p.x,y:item.y-p.y};
     this.state.room.dragIdx=index;this.roomPointerId=event.pointerId;
     handle.setPointerCapture?.(event.pointerId);
    });
    handle.addEventListener('pointermove',event=>{
     if(this.state.room.dragIdx<0||this.roomPointerId!==event.pointerId)return;
     const p=this.pointerXY(event);if(!p)return;
     Object.assign(this.state.room.placed[this.state.room.dragIdx],
      this.constrainFloor(p.x+this.roomDragOffset.x,p.y+this.roomDragOffset.y));
     this.syncRoomHandles();
    });
    const end=event=>{
     if(this.state.room.dragIdx<0||this.roomPointerId!==event.pointerId)return;
     this.state.room.dragIdx=-1;this.roomPointerId=null;this.saveRoomState();
    };
    handle.addEventListener('pointerup',end);
    handle.addEventListener('pointercancel',end);
    layer.append(handle);
   }
   for(let i=0;i<items.length;i++){
    const item=items[i],handle=layer.children[i];
    handle.dataset.index=String(i);
    handle.style.left=(item.x/W*100)+'%';
    handle.style.top=((item.y+ROOM_FLOOR_OFFSET-28)/H*100)+'%';
    handle.style.zIndex=String(Math.round(item.y));
    handle.setAttribute('aria-label',(itemTypes[item.id]?.name||'가구')+' 위치 이동');
   }
  }
  pointerXY(e){
   const rect=this.canvas.getBoundingClientRect();
   if(!rect.width||!rect.height)return null;
   return {x:(e.clientX-rect.left)/rect.width*W,y:(e.clientY-rect.top)/rect.height*H};
  }
  isActionPoint(p){
   if(!p)return false;
   if(this.state.mode==='weeding')return p.y>=820||(p.x>=120&&p.x<=490&&p.y>=200&&p.y<=780);
   return this.state.mode==='fishing'&&p.x>=0&&p.x<=W&&p.y>=0&&p.y<=H;
  }
  bindEvents(){
   // Keep vertical page gestures available over the entire Canvas.
   // Only the small furniture handles disable pan, when directly dragged.
   this.canvas.style.touchAction='pan-y';
   let tap=null;
   this.stage.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    tap=null;
    const p=this.pointerXY(event);
    if(!this.isActionPoint(p))return;
    tap={id:event.pointerId,x:event.clientX,y:event.clientY,at:Date.now(),mode:this.state.mode};
   },{passive:true});
   this.stage.addEventListener('pointerup',event=>{
    const gesture=tap;tap=null;
    if(!gesture||event.pointerId!==gesture.id||gesture.mode!==this.state.mode)return;
    if(Date.now()-gesture.at>800||
     Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>13)return;
    const p=this.pointerXY(event);
    if(this.isActionPoint(p))this.onTapAction();
   },{passive:true});
   this.stage.addEventListener('pointercancel',()=>{tap=null;});
   // Pointer taps are handled by the shared swipe-aware stage listener.
   this.answerForm.addEventListener('submit',event=>{
    event.preventDefault();this.submitAnswer(this.answerInput.value);
   });
   root.document.getElementById('wv-answer-cancel')?.addEventListener('click',()=>this.cancelAnswer());
   this.fishingReel.addEventListener('click',event=>{
    if(event.detail===0&&this.state.mode==='fishing')this.onTapAction();
   });
   root.addEventListener('resize',()=>this.resize());
   root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden)this.pause();else this.resume();});
   root.document.addEventListener('wordville-app-resume',()=>{this.resize();this.resume();this.refreshWordPool();});
   root.document.addEventListener('wordville-words-ready',()=>this.loadWordsFromAndroid(root.WordvilleWords||[]));
   for(const button of this.forageButtons){
    button.addEventListener('click',()=>{
     if(this.state.mode!=='foraging'||this.state.foraging.pending)return;
     const action=button.dataset.forageAction;
     if(action==='forage')this.setForageStage(1,.9);
     else this.setForageStage(action==='eat'?2:3);
    });
   }
   root.document.getElementById('wordville-action')?.addEventListener('click',()=>this.onTapAction());
   this.roomToggle?.addEventListener('click',()=>this.setDrawerOpen(this.drawer.hidden));
   this.drawer.querySelector('[data-room-close]').addEventListener('click',()=>{
    this.setDrawerOpen(false);this.roomToggle.focus();
   });
   for(const button of this.drawer.querySelectorAll('[data-turn]')){
    button.addEventListener('click',()=>{
     const pages=Math.ceil(this.state.room.unlocked.length/5);
     this.inventoryPage=(this.inventoryPage+Number(button.dataset.turn)+pages)%pages;
     this.renderRoomInventoryUI();
    });
   }
   root.document.getElementById('btn-clear-room')?.addEventListener('click',()=>{
    this.state.room.placed=[];this.saveRoomState();this.syncRoomHandles();
    this.message('배치만 초기화했습니다. 보유 가구는 그대로 유지됩니다.');
   });
   root.document.getElementById('wv-solo-day')?.addEventListener('change',()=>this.refreshWordPool());
  }
  paint(){
   if(this.state.mode==='foraging')return;
   if(this.state.mode==='fishing'&&!this.state.fishing.sceneDirty&&!this.sprites.reference_fishing)return;
   this.ctx.clearRect(0,0,W,H);
   if(this.state.mode==='fishing'){
    this.renderFishing();
    this.state.fishing.sceneDirty=false;
   }else if(this.state.mode==='weeding'){
    this.renderWeeding();
   }else this.renderRoom();
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
  const stage=root.document.createElement('div');stage.id='wv-canvas-stage';stage.className='wv-canvas-stage';
  const handles=root.document.createElement('div');handles.id='wv-room-drag-targets';
  handles.className='wv-room-drag-targets';handles.hidden=true;
  stage.append(canvas,handles);
  const weedWord=root.document.createElement('strong');weedWord.id='wv-weeding-word';
  weedWord.setAttribute('aria-label','제초할 영단어');stage.append(weedWord);
  const artError=root.document.createElement('p');artError.id='wv-fishing-art-error';
  artError.hidden=true;artError.setAttribute('role','status');stage.append(artError);
  stage.insertAdjacentHTML('beforeend',`
   <div id="wv-fishing-controls" hidden>
    <span class="wv-fishing-shimmer" aria-hidden="true"></span>
    <div class="wv-fishing-popup" aria-hidden="true">
     <span class="wv-fishing-new" lang="en">✨ NEW ✨</span>
     <span class="wv-fishing-weight"></span>
    </div>
    <button class="wv-fishing-reel" type="button" aria-label="낚아채기" aria-describedby="wv-fishing-hint">
     <span class="wv-fishing-track" aria-hidden="true">
      <span class="wv-fishing-zone"></span>
      <span class="wv-fishing-fish">🐟</span>
      <span class="wv-fishing-bobber"></span>
      <span class="wv-fishing-word" id="wv-fishing-word"></span>
     </span>
     <span class="wv-fishing-hint" id="wv-fishing-hint"></span>
    </button>
   </div>
   <div id="wv-forage-card" data-stage="1" hidden>
    <div class="wv-forage-viewport">
     <div class="wv-forage-sprite" aria-hidden="true"></div>
     <span class="wv-forage-badge" role="status" lang="en">Perfect!</span>
    </div>
    <div class="wv-forage-controls">
     <div class="wv-forage-gauge" role="progressbar" aria-label="음식 줍기 단계"
      aria-valuemin="0" aria-valuemax="100" aria-valuenow="30">
      <div class="wv-forage-fill"></div>
     </div>
     <button type="button" data-forage-action="forage" lang="en" aria-label="Forage · 3단계 보기">Forage</button>
     <button type="button" data-forage-action="eat" lang="en" aria-label="Eat · 먹는 동작 보기">Eat</button>
     <button type="button" data-forage-action="pack" lang="en" aria-label="Pack · 수확 동작 보기">Pack</button>
    </div>
   </div>`);
  const quiz=root.document.createElement('form');quiz.id='wv-canvas-answer';quiz.hidden=true;
  quiz.innerHTML='<label id="wv-answer-prompt" for="wv-answer-input"></label><div class="wv-answer-line"><input type="text" id="wv-answer-input" inputmode="text" enterkeyhint="done" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="100" required placeholder="한국어 뜻 입력"><button type="submit">정답 확인</button><button type="button" id="wv-answer-cancel">취소</button></div>';
  const status=root.document.createElement('p');status.id='wordville-canvas-status';
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const choices=root.document.createElement('div');choices.id='foraging-choices';choices.hidden=true;
  const drawer=root.document.createElement('div');drawer.id='room-drawer';drawer.hidden=true;
  const drawerButton=(label,property,value)=>{
   const button=root.document.createElement('button');button.type='button';
   button.setAttribute('aria-label',label);button.dataset[property]=value;
   return button;
  };
  const toggle=drawerButton('가구 서랍 열기 또는 닫기','roomToggle','');
  toggle.id='room-drawer-toggle';toggle.hidden=true;toggle.setAttribute('aria-controls','room-drawer');
  const close=drawerButton('가구 서랍 닫기','roomClose','');
  const previous=drawerButton('이전 가구','turn','-1');
  const next=drawerButton('다음 가구','turn','1');
  const items=root.document.createElement('div');items.id='room-item-list';
  const clear=root.document.createElement('button');clear.id='btn-clear-room';clear.type='button';clear.textContent='가구 배치만 초기화';
  drawer.append(items,close,previous,next);
  stage.append(drawer,toggle);
  const action=root.document.createElement('button');action.type='button';
  action.id='wordville-action';action.textContent='🎯 타이밍 맞춰 누르기';
  panel.append(heading,target,hint,stage,quiz,action,choices,clear,status);
  const navbar=solo.querySelector('.wv-solo-topnav');navbar?.after(panel);
  root.wordvilleGame=new WordvilleGameEngine('wordvilleCanvas');
 }
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})(typeof window!=='undefined'?window:globalThis);
