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
 const ROOM_FLOOR_OFFSET=0;
 const ROOM_ITEM_LIMIT=35;
 const ROOM_ART={
  bed:[145,1310,136,123,'M3 48 Q7 22 58 6 L68 4 L75 23 L85 35 L132 60 L135 100 L109 114 L95 119 L76 106 L70 101 L42 85 L22 81 L3 69 Z'],
  shelf:[345,1300,99,143,'M4 22 L32 4 L94 43 L92 122 L71 139 L5 93 Z'],
  chair:[523,1303,107,137,'M39 15 Q55 0 76 10 Q101 19 99 52 L100 113 L83 127 L69 124 L65 114 Q67 136 49 133 Q41 134 40 116 L29 111 Q23 129 12 119 L10 104 Q4 100 4 87 Q3 70 36 50 Z'],
  plant:[700,1303,110,135,'M32 28 Q12 9 35 11 Q46 11 52 24 Q50 2 66 5 Q78 4 78 16 L79 26 Q111 10 96 38 L86 49 Q113 41 102 57 L82 76 L92 87 L84 116 Q76 131 52 131 Q31 131 23 115 L19 91 Q11 90 15 80 L30 72 Q5 59 14 49 L29 47 Q15 36 32 28 Z'],
  lamp:[886,1304,92,134,'M5 51 Q7 37 19 18 Q27 1 53 4 Q77 5 87 37 Q97 60 83 69 L55 80 L55 100 Q73 102 74 114 Q72 129 48 131 Q24 129 22 116 Q21 105 37 101 L37 80 Q12 79 5 66 Z']
 };
 const FURNITURE_IMAGES={desk:'02_writing_desk.png',books:'04_bookshelf.png',sofa:'06_sage_sofa.png'};
 const PIXEL_FURNITURE_MAP={
  bed:'pixel_furn_bed',shelf:'pixel_furn_bookshelf',books:'pixel_furn_bookshelf',
  desk:'pixel_furn_table',chair:'pixel_furn_cushions',sofa:'pixel_furn_dresser',
  aquarium:'pixel_furn_aquarium',lamp:'pixel_furn_lamp',plant:'pixel_furn_plant',
  rug:'pixel_furn_cushions'
 };
 // Foot collision half-extents (hw, hh) & height layerBias in logical 600x1000 space.
 // Flat items (cushions/rug) use negative layerBias so characters sit/stand over them; tall items occlude behind.
 const FURNITURE_FOOTPRINTS={
  bed:{hw:54,hh:26,sit:true,layerBias:0},shelf:{hw:34,hh:20,layerBias:4},books:{hw:34,hh:20,layerBias:4},
  desk:{hw:38,hh:22,layerBias:0},chair:{hw:36,hh:18,sit:true,layerBias:-22},sofa:{hw:38,hh:22,sit:true,layerBias:2},
  aquarium:{hw:34,hh:22,layerBias:4},lamp:{hw:18,hh:14,layerBias:4},plant:{hw:20,hh:14,layerBias:2},rug:{hw:36,hh:18,sit:true,layerBias:-26}
 };
 const MASCOT_IDS=new Set(['chiikawa','hachiware','usagi','rakko','kurimanju']);
 const ALL_RESIDENT_NAMES=[
  ['chiikawa','치이카와'],['hachiware','하치와레'],['usagi','우사기'],['rakko','랏코'],['kurimanju','쿠리만쥬'],
  ['alex','알렉스'],['elliott','엘리엇'],['harvey','하비'],['sam','샘'],['sebastian','세바스찬'],['shane','셰인'],
  ['haley','헤일리'],['leah','레아'],['maru','마루'],['penny','페니'],['abigail','애비게일'],['emily','에밀리'],
  ['toshiro','토시로'],['momo','모모'],['aizen','아이젠'],['madoka','마도카'],['homura','호무라']
 ];
 const FOOD_PROPS=['food_onigiri','food_pudding','food_cake','food_ramen'];
 // Proportional rendering scale: mascots (~56px) vs human residents (~86px), matching town proportions!
 const actorMetrics=id=>MASCOT_IDS.has(id)?{size:56,radius:17}:{size:86,radius:22};
 const eq=(value,min,max)=>Math.min(max,Math.max(min,value));
 const label=w=>String((w?.meanings&&w.meanings[0])||w?.meaning||'').split(/[;；]/)[0].trim();
 const itemTypes={
  bed:{name:'포근침대',icon:'🛏️'},shelf:{name:'원목책장',icon:'📚'},chair:{name:'방석세트',icon:'🪑'},
  plant:{name:'화분',icon:'🪴'},lamp:{name:'스탠드조명',icon:'🪔'},rug:{name:'원형러그',icon:'🧶'},
  desk:{name:'원형테이블',icon:'🪑'},books:{name:'책장',icon:'📚'},aquarium:{name:'수족관',icon:'🐠'},
  sofa:{name:'나무서랍장',icon:'🛋️'}
 };
 function freshRoom(){
  return {
   host:'chiikawa',
   guests:['usagi'],
   aquariumFish:[{name:'파랑물고기',color:'#5eaee0'},{name:'금붕어',color:'#f4945e'}],
   unlocked:['bed','shelf','chair','plant','lamp','desk','aquarium'].map(id=>({id,...itemTypes[id]})),
   placed:[
    {id:'bed',x:225,y:388},
    {id:'shelf',x:412,y:398},
    {id:'aquarium',x:162,y:442},
    {id:'chair',x:240,y:462},
    {id:'desk',x:382,y:462}
   ],
   dragIdx:-1
  };
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
    reference_fishing:'images/reference/fishing.gif',reference_foraging:'images/reference/foraging.gif',
    bg_fishing:'images/fishing/bg_fishing.png',hachiware_idle:'images/fishing/hachiware_idle.png',
    hachiware_catch:'images/fishing/hachiware_catch.png',
    bg_weeding:'images/weeding/bg_meadow.png',weed_perfect:'images/weeding/chiikawa_perfect.png',
    weed_medium:'images/weeding/chiikawa_medium.png',weed_bad:'images/weeding/chiikawa_bad.png',
    bg_room:'images/room/room-decor.webp',
    room_chiikawa:'images/minigames/room_chiikawa_empty.webp',
    room_hachiware:'images/minigames/room_hachiware_empty.webp',
    room_chiikawa_fg:'images/minigames/room_chiikawa_fg.png',
    room_hachiware_fg:'images/minigames/room_hachiware_fg.png',
    meadow_bg:'images/minigames/meadow_bg.webp',
    prop_weed_full:'images/minigames/props/weed_full.png',
    prop_weed_damaged:'images/minigames/props/weed_damaged.png',
    prop_weed_clover:'images/minigames/props/weed_clover.png',
    prop_food_onigiri:'images/minigames/props/food_onigiri.png',
    prop_food_pudding:'images/minigames/props/food_pudding.png',
    prop_food_cake:'images/minigames/props/food_cake.png',
    prop_food_ramen:'images/minigames/props/food_ramen.png',
    pixel_furn_bed:'images/minigames/furniture/bed.png',
    pixel_furn_bookshelf:'images/minigames/furniture/bookshelf.png',
    pixel_furn_table:'images/minigames/furniture/table.png',
    pixel_furn_aquarium:'images/minigames/furniture/aquarium.png',
    pixel_furn_cushions:'images/minigames/furniture/cushions.png',
    pixel_furn_dresser:'images/minigames/furniture/dresser.png',
    pixel_furn_lamp:'images/minigames/furniture/lamp.png',
    pixel_furn_plant:'images/minigames/furniture/plant.png',
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
    weeding:{pos:0,dir:1,status:'idle',timer:0,pendingRetry:false,combo:0,bushHp:4,maxHp:4,
     actor:{id:'chiikawa',x:195,y:580,tx:225,ty:580,direction:'right',walkDistance:0,action:'idle',jumpT:0},
     particles:[],matchPairs:[],selectedEn:null,matchedIds:[]},
    foraging:{stage:1,timer:0,choices:[],pending:false,foodIdx:0},
    room:this.loadRoomState()};
   this.roomActors=[];
   this.roomInviteOpen=false;
   this.roomGuestQuery='';
   this.roomSocialBar=root.document.getElementById('wv-room-social-bar');
   this.weedMatchNode=root.document.getElementById('wv-weed-match');
   this.forageSentenceNode=root.document.getElementById('wv-forage-sentence');
   this.forageFoodImg=root.document.getElementById('wv-forage-food-prop');
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
     const host=saved.host==='hachiware'?'hachiware':'chiikawa';
     const validIds=new Set(ALL_RESIDENT_NAMES.map(x=>x[0]));
     const guests=Array.isArray(saved.guests)?saved.guests.filter(id=>validIds.has(id)&&id!==host).slice(0,4):defaults.guests;
     const aquariumFish=Array.isArray(saved.aquariumFish)?saved.aquariumFish.slice(-8):defaults.aquariumFish;
     return {host,guests,aquariumFish,unlocked:unique,placed,dragIdx:-1};
    }
   }catch{}
   return defaults;
  }
  saveRoomState(){
   try{
    root.localStorage.setItem(ROOM_KEY,JSON.stringify({
     host:this.state.room.host,
     guests:this.state.room.guests,
     aquariumFish:this.state.room.aquariumFish,
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
     if(key==='reference_fishing'){
      this.state.fishing.sceneDirty=true;
      if(this.state.mode==='fishing')this.stage.dataset.referenceArt='true';
     }
     if(key==='reference_foraging')this.forageCard.dataset.referenceArt='true';
     if(key==='bg_fishing'&&this.artError)this.artError.hidden=true;
     if(key.startsWith('hachiware_')||key==='bg_fishing'){
      this.state.fishing.sceneDirty=true;
      console.info('[Wordville Fishing] PNG loaded',key,url,image.naturalWidth+'x'+image.naturalHeight);
     }
    };
    image.onerror=()=>{
     if(key==='reference_fishing'||key==='reference_foraging')return; // optional user-uploaded reference GIF
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
   this.stage.dataset.referenceArt=String(mode==='fishing'&&Boolean(this.sprites.reference_fishing));
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
   if(this.roomSocialBar)this.roomSocialBar.hidden=mode!=='room';
   if(this.weedMatchNode)this.weedMatchNode.hidden=mode!=='weeding';
   if(this.forageSentenceNode)this.forageSentenceNode.hidden=mode!=='foraging';
   const action=root.document.getElementById('wordville-action');
   if(action)action.hidden=mode!=='weeding';
   if(mode==='weeding')this.buildWeedingMatchUI();
   if(mode==='foraging')this.buildForagingChoices();
   if(mode==='room'){this.renderRoomInventoryUI();this.renderRoomSocialUI();this.syncRoomActors();this.syncRoomHandles();}
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
    // Live Chiikawa weeding actor animation & leaf particles
    const wa=w.actor;
    if(wa){
     const dx=wa.tx-wa.x,dy=wa.ty-wa.y,dist=Math.hypot(dx,dy);
     if(dist>2){
      const step=Math.min(dist,dt*95);
      wa.x+=dx/dist*step;wa.y+=dy/dist*step;
      wa.walkDistance=(wa.walkDistance||0)+step*0.08;
      wa.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
      wa.action='walk';
     }else{
      wa.action=w.status==='perfect'?'talk':'idle';
     }
     if(wa.jumpT>0)wa.jumpT=Math.max(0,wa.jumpT-dt);
    }
    if(Array.isArray(w.particles)){
     for(let i=w.particles.length-1;i>=0;i--){
      const pt=w.particles[i];
      pt.x+=pt.vx*dt;pt.y+=pt.vy*dt;pt.vy+=260*dt;pt.life-=dt;
      if(pt.life<=0)w.particles.splice(i,1);
     }
    }
   }
   if(this.state.mode==='room')this.updateRoomActors(dt);
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
   // The complete authored PNG/GIF already contains Hachiware and the fishing rod.
   // Do not stamp a duplicate character or procedural scenery over it.
   if(this.paintSprite('reference_fishing',0,0,W,H))return;
   if(this.paintSprite('bg_fishing',0,0,W,H))return;
   // The CSS bitmap remains visible when Canvas decode fails; never fill black.
   if(this.artError){
    this.artError.hidden=false;
    this.artError.textContent='낚시 이미지를 불러오지 못했습니다. 앱 이미지 에셋을 확인해 주세요.';
   }
  }
  renderWeeding(){
   const c=this.ctx,w=this.state.weeding;
   // The second user GIF is food collection, NOT a weed-removal scene.
   if(!this.paintSprite('meadow_bg',0,0,W,H)&&!this.paintSprite('bg_weeding',0,0,W,H)){
    this.message('제초 배경 PNG 로드 실패 · 설치 이미지 확인 필요');
    return;
   }
   // Top giant weed bush HP + combo HUD
   const hpRatio=Math.max(0,w.bushHp/Math.max(1,w.maxHp));
   this.box(28,18,544,68,16,'#fffaf0e8',INK,3);
   this.text('🌱 거대 잡초 덤불'+(w.combo>1?' · 연속 제초 x'+w.combo:''),300,44,18,INK,'850',500);
   this.box(46,56,508,18,9,'#e8dcc8',INK,2);
   if(hpRatio>0)this.box(48,58,Math.max(12,504*hpRatio),14,7,'#7bc670',INK,1);
   // 3-stage pixel weed bush (full -> damaged -> lucky four-leaf clover!)
   const bushKey=w.bushHp<=0?'prop_weed_clover':(w.bushHp<w.maxHp?'prop_weed_damaged':'prop_weed_full');
   const shake=w.timer>0&&w.status!=='bad'?Math.sin(Date.now()/28)*7:0;
   if(!this.paintSprite(bushKey,292+shake,420,185,165)){
    const key=w.status==='idle'?'weed_medium':'weed_'+w.status;
    if(!this.paintSprite(key,162,306,265,280))
     this.atlas.drawPanel(c,'weeding_states',
      w.status==='perfect'?0:w.status==='bad'?2:1,162,306,265,280);
   }
   // Live animated Chiikawa sprite (walks to bush, shakes/pulls, jumps on clear!)
   const wa=w.actor;
   if(wa&&root.WordvilleWalk?.paint){
    const jumpOff=wa.jumpT>0?-Math.abs(Math.sin(wa.jumpT*Math.PI*3))*26:0;
    const m=actorMetrics('chiikawa');
    root.WordvilleWalk.paint(c,wa,wa.x,wa.y+jumpOff,{
     width:m.size*1.45,height:m.size*1.45,walking:wa.action==='walk',action:wa.action
    });
   }
   // Leaf burst particles on match/pull
   for(const pt of (w.particles||[])){
    c.save();c.fillStyle=pt.color;c.beginPath();c.ellipse(pt.x,pt.y,6,3.5,pt.rot,0,Math.PI*2);c.fill();c.restore();
   }
   const labels={idle:'아래 4쌍 단어 연결 또는 타이밍 제초!',
    perfect:'✨ 연속 제초! 뜻 정답!',medium:'🌱 제초 성공!',
    bad:'❌ 타이밍 또는 단어 뜻 오답'};
   // Interactive timing meter only; never generate placeholder character geometry.
   this.box(30,860,540,96,18,'#fffaf0');
   this.box(52,889,496,36,17,'#f69ca3',INK,2);
   c.fillStyle='#f8d387';c.fillRect(52+496*.22,893,496*.56,28);
   c.fillStyle='#89dba5';c.fillRect(52+496*.4,893,496*.2,28);
   this.box(52+496*w.pos-8,883,16,48,6,INK,INK,1);
   this.text(labels[w.status],300,839,18,INK,'800',510);
  }
  constrainFloor(x,y){
   let dx=(x-300)/192,dy=(y-412)/78;
   const len=Math.hypot(dx,dy);
   if(len>1){dx/=len;dy/=len;}
   return {x:300+192*dx,y:412+78*dy};
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
   const c=this.ctx,room=this.state.room;
   const bgKey=room.host==='hachiware'?'room_hachiware':'room_chiikawa';
   c.fillStyle=room.host==='hachiware'?'#e6ddc7':'#1b1714';
   c.fillRect(0,0,W,H);
   // Paint Chiikawa / Hachiware circular pixel-art room base centered in upper stage
   const hasPixelRoom=this.paintSprite(bgKey,-24,95,648,560);
   if(!hasPixelRoom&&!this.paintSprite('bg_room',0,0,W,H))return;
   // Wall learned-word frames (top inner wall)
   const learnedFrames=(root.WordvilleSolo?.progress?.frames||[]).slice(0,2);
   const fallbackWords=this.words.slice(0,2).map(w=>({word:w.word,meaning:label(w)}));
   const wallFrames=learnedFrames.length?learnedFrames:fallbackWords;
   wallFrames.forEach((fr,i)=>{
    const fx=i===0?148:354,fy=228;
    this.box(fx,fy,98,52,8,'#fffaf0f0','#9c724c',3);
    this.text(fr.word||'word',fx+49,fy+22,13,INK,'850',88);
    this.text(fr.meaning||'',fx+49,fy+40,11,'#7d5e48','650',88);
   });
   // Depth-sort placed furniture, live room actors, AND front doorway arch/pillars by footY!
   const drawList=[];
   room.placed.forEach((item,index)=>{
    const bias=FURNITURE_FOOTPRINTS[item.id]?.layerBias||0;
    drawList.push({kind:'furn',footY:item.y+ROOM_FLOOR_OFFSET,sortY:item.y+ROOM_FLOOR_OFFSET+bias,item,index});
   });
   for(const actor of this.roomActors){
    drawList.push({kind:'actor',footY:actor.y+ROOM_FLOOR_OFFSET,sortY:actor.y+ROOM_FLOOR_OFFSET,actor});
   }
   // Front stone arch / dome door arch + lower rim occludes actors & furniture behind y=488
   const fgKey=room.host==='hachiware'?'room_hachiware_fg':'room_chiikawa_fg';
   if(this.sprites[fgKey]){
    drawList.push({kind:'room_fg',footY:488,sortY:488,fgKey});
   }
   drawList.sort((a,b)=>a.sortY-b.sortY);
   const nowSec=Date.now()/1000;
   for(const entry of drawList){
    if(entry.kind==='room_fg'){
     this.paintSprite(entry.fgKey,-24,95,648,560);
    }else if(entry.kind==='furn'){
     const {item,index}=entry;
     const y=entry.footY;
     const pixKey=PIXEL_FURNITURE_MAP[item.id];
     const sprite=(pixKey&&this.sprites[pixKey])||this.roomArt[item.id]||this.sprites['furniture_'+item.id];
     if(sprite){
      const width=item.id==='bed'?118:item.id==='lamp'?54:item.id==='plant'?60:84;
      const height=width*(sprite.naturalHeight||sprite.height)/(sprite.naturalWidth||sprite.width);
      c.drawImage(sprite,item.x-width/2,y-height,width,height);
      // Swimming fish inside aquarium linked to Fishing minigame!
      if(item.id==='aquarium'){
       const fishes=room.aquariumFish||[];
       fishes.slice(0,5).forEach((fish,fi)=>{
        const fx=item.x+Math.sin(nowSec*(1.1+fi*.25)+fi*1.7)*(width*0.26);
        const fy=y-height*0.48+Math.cos(nowSec*(1.4+fi*.2)+fi)*6;
        c.save();c.fillStyle=fish.color||'#5eaee0';c.strokeStyle='#2c4c68';c.lineWidth=1.5;
        c.beginPath();c.ellipse(fx,fy,6,3.5,0,0,Math.PI*2);c.fill();c.stroke();c.restore();
       });
      }
     }else this.text(itemTypes[item.id].icon,item.x,y,43);
     if(room.dragIdx===index)this.text('↕',item.x,y-12,22,'#8b4f39');
    }else{
     const a=entry.actor,m=actorMetrics(a.id);
     if(root.WordvilleWalk?.paint){
      root.WordvilleWalk.paint(c,a,a.x,entry.footY,{
       width:m.size,height:m.size,walking:a.action==='walk',action:a.action
      });
     }
     if(a.bubble&&a.bubbleT>0){
      const bw=Math.min(180,Math.max(88,a.bubble.length*9+22));
      const bx=eq(a.x-bw/2,20,W-bw-20),by=entry.footY-m.size-26;
      this.box(bx,by,bw,24,10,'#fffdf5f2',INK,2);
      this.text(a.bubble,bx+bw/2,by+16,11,INK,'800',bw-12);
     }
    }
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
     this.box(x,1290,160,164,24,item?'#fff7ec':'#c59a79','#795646',4);
     if(item){
      const pixKey=PIXEL_FURNITURE_MAP[item.id];
      const art=(pixKey&&this.sprites[pixKey])||this.roomArt[item.id]||this.sprites['furniture_'+item.id];
      if(art){
       const aw=art.naturalWidth||art.width||1,ah=art.naturalHeight||art.height||1;
       const scale=Math.min(112/aw,112/ah);
       const dw=aw*scale,dh=ah*scale;
       c.drawImage(art,x+80-dw/2,1368-dh/2,dw,dh);
      }
      else this.text(item.icon,x+80,1402,69);
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
    // Automatically add caught fish to the Room Aquarium!
    const fishColors=['#5eaee0','#f4945e','#76c990','#e888b2'];
    if(!Array.isArray(this.state.room.aquariumFish))this.state.room.aquariumFish=[];
    this.state.room.aquariumFish.push({name:word.word,color:fishColors[word.word.length%fishColors.length]});
    if(this.state.room.aquariumFish.length>8)this.state.room.aquariumFish.shift();
    this.saveRoomState();
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
   // Rotate giant pixel food prop & update sentence blank hint
   const foodKey=FOOD_PROPS[(word.word.length+(this.state.foraging.foodIdx||0))%FOOD_PROPS.length];
   if(this.forageFoodImg)this.forageFoodImg.src='images/minigames/props/'+foodKey+'.png';
   if(this.forageSentenceNode){
    const rawEx=String(word.example||word.sentence||'').trim();
    const masked=rawEx?rawEx.replace(new RegExp(word.word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'),'______'):
     'I want to learn "______" today!';
    this.forageSentenceNode.innerHTML='<strong>'+masked+'</strong><span>뜻 힌트: '+label(word)+'</span>';
   }
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
      g.pending=true;g.foodIdx=(g.foodIdx||0)+1;
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
  isPointBlockedByFurniture(x,y,radius=16){
   for(const item of this.state.room.placed){
    const fp=FURNITURE_FOOTPRINTS[item.id]||{hw:30,hh:18};
    if(Math.abs(x-item.x)<fp.hw+radius&&Math.abs(y-item.y)<fp.hh+radius*0.65)return item;
   }
   return null;
  }
  syncRoomActors(){
   const room=this.state.room;
   const desiredIds=[room.host,...(room.guests||[]).filter(id=>id!==room.host)];
   const existing=new Map(this.roomActors.map(a=>[a.id,a]));
   const next=[];
   desiredIds.forEach((id,idx)=>{
    if(existing.has(id)){next.push(existing.get(id));return;}
    // Spawn on clear floor spot avoiding furniture footprints
    let sx=280+idx*34,sy=428+(idx%2)*24;
    for(let tries=0;tries<16;tries++){
     const p=this.constrainFloor(185+((idx*73+tries*41)%230),365+((idx*53+tries*37)%115));
     if(!this.isPointBlockedByFurniture(p.x,p.y,actorMetrics(id).radius)){sx=p.x;sy=p.y;break;}
    }
    next.push({id,x:sx,y:sy,tx:sx,ty:sy,direction:'down',walkDistance:0,action:'idle',stateTimer:1.2+idx*0.6,bubble:'',bubbleT:0});
   });
   this.roomActors=next;
   // Run initial separation passes so spawned host + guests never overlap on frame 1
   for(let pass=0;pass<5;pass++){
    for(let i=0;i<this.roomActors.length;i++){
     for(let j=i+1;j<this.roomActors.length;j++){
      const a=this.roomActors[i],b=this.roomActors[j];
      const minSep=actorMetrics(a.id).radius+actorMetrics(b.id).radius+12;
      const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||0.1;
      if(d<minSep){
       const push=(minSep-d)*0.55;
       const pa=this.constrainFloor(a.x-(dx/d)*push,a.y-(dy/d)*push);
       const pb=this.constrainFloor(b.x+(dx/d)*push,b.y+(dy/d)*push);
       if(!this.isPointBlockedByFurniture(pa.x,pa.y,12)){a.x=pa.x;a.y=pa.y;}
       if(!this.isPointBlockedByFurniture(pb.x,pb.y,12)){b.x=pb.x;b.y=pb.y;}
      }
     }
    }
   }
  }
  updateRoomActors(dt){
   if(!this.roomActors.length)this.syncRoomActors();
   const room=this.state.room;
   for(const a of this.roomActors){
    const m=actorMetrics(a.id);
    if(a.bubbleT>0)a.bubbleT=Math.max(0,a.bubbleT-dt);
    a.stateTimer-=dt;
    if(a.action==='walk'){
     const dx=a.tx-a.x,dy=a.ty-a.y,dist=Math.hypot(dx,dy);
     if(dist<5||a.stateTimer<=0){
      a.action=a.nextAction||'idle';
      a.stateTimer=2.4+Math.random()*2.5;
      if(a.action==='write')a.direction='up';
      else if(a.action==='sit')a.direction='down';
      if(Math.random()<0.45&&this.words.length){
       const w=this.words[Math.floor(Math.random()*Math.min(20,this.words.length))];
       a.bubble=w.word+' = '+label(w);a.bubbleT=3.0;
      }
     }else{
      const speed=MASCOT_IDS.has(a.id)?46:54;
      const nx=a.x+(dx/dist)*speed*dt,ny=a.y+(dy/dist)*speed*dt;
      const clamped=this.constrainFloor(nx,ny);
      if(!this.isPointBlockedByFurniture(clamped.x,clamped.y,m.radius*0.75)){
       a.x=clamped.x;a.y=clamped.y;a.walkDistance+=speed*dt*0.07;
       a.direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
      }else{
       a.action='idle';a.stateTimer=0.8;
      }
     }
    }else if(a.stateTimer<=0){
     // Pick a new collision-free destination (wall word frame -> write, cushion/bed -> sit, or wander)
     const roll=Math.random();
     let goal=null,nextAct='idle';
     if(roll<0.25){
      goal=this.constrainFloor(205+(Math.random()<0.5?0:190),346);nextAct='write';
     }else if(roll<0.55){
      const seats=room.placed.filter(it=>FURNITURE_FOOTPRINTS[it.id]?.sit);
      if(seats.length){
       const s=seats[Math.floor(Math.random()*seats.length)];
       const fp=FURNITURE_FOOTPRINTS[s.id];
       goal=this.constrainFloor(s.x,s.y+fp.hh+m.radius*0.6);nextAct='sit';
      }
     }
     if(!goal){
      for(let t=0;t<10;t++){
       const cand=this.constrainFloor(150+Math.random()*300,350+Math.random()*145);
       if(!this.isPointBlockedByFurniture(cand.x,cand.y,m.radius*0.85)){goal=cand;break;}
      }
     }
     if(goal){a.tx=goal.x;a.ty=goal.y;a.action='walk';a.nextAction=nextAct;a.stateTimer=5.0;}
     else{a.stateTimer=1.5;}
    }
   }
   // Actor-to-actor separation so mascots & human residents never overlap!
   for(let i=0;i<this.roomActors.length;i++){
    for(let j=i+1;j<this.roomActors.length;j++){
     const a=this.roomActors[i],b=this.roomActors[j];
     const minSep=actorMetrics(a.id).radius+actorMetrics(b.id).radius+10;
     const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||0.1;
     if(d<minSep){
      const push=(minSep-d)*0.5;
      const pa=this.constrainFloor(a.x-(dx/d)*push,a.y-(dy/d)*push);
      const pb=this.constrainFloor(b.x+(dx/d)*push,b.y+(dy/d)*push);
      if(!this.isPointBlockedByFurniture(pa.x,pa.y,12)){a.x=pa.x;a.y=pa.y;}
      if(!this.isPointBlockedByFurniture(pb.x,pb.y,12)){b.x=pb.x;b.y=pb.y;}
     }
    }
   }
  }
  renderRoomSocialUI(){
   const bar=this.roomSocialBar;if(!bar)return;
   const room=this.state.room;
   bar.replaceChildren();
   const hostRow=root.document.createElement('div');hostRow.className='wv-room-social-row';
   const hl=root.document.createElement('span');hl.className='wv-room-social-label';hl.textContent='🏠 방 호스트:';
   hostRow.append(hl);
   for(const [hid,hname] of [['chiikawa','치이카와 방'],['hachiware','하치와레 방']]){
    const btn=root.document.createElement('button');btn.type='button';btn.className='wv-host-btn';
    btn.dataset.host=hid;btn.setAttribute('aria-pressed',String(room.host===hid));btn.textContent=hname;
    btn.addEventListener('click',()=>{
     room.host=hid;
     room.guests=(room.guests||[]).filter(id=>id!==hid);
     this.saveRoomState();this.syncRoomActors();this.renderRoomSocialUI();
     this.message(hname+'으로 전환했습니다!');
    });
    hostRow.append(btn);
   }
   // Accordion header showing invited resident count + compact badges + expand/collapse arrow
   const accBtn=root.document.createElement('button');accBtn.type='button';accBtn.className='wv-guest-accordion-btn';
   accBtn.setAttribute('aria-expanded',String(Boolean(this.roomInviteOpen)));
   const summary=root.document.createElement('span');summary.className='wv-guest-summary';
   const guests=room.guests||[];
   const nameMap=new Map(ALL_RESIDENT_NAMES);
   summary.append('👥 마을 주민 초대 ('+guests.length+'/4)');
   guests.forEach(gid=>{
    const badge=root.document.createElement('span');badge.className='wv-guest-badge';
    badge.textContent=nameMap.get(gid)||gid;
    summary.append(badge);
   });
   const arrow=root.document.createElement('span');
   arrow.textContent=this.roomInviteOpen?'접기 ▴':'펼치기 ▾';
   accBtn.append(summary,arrow);

   const panel=root.document.createElement('div');panel.className='wv-guest-panel';
   panel.hidden=!this.roomInviteOpen;
   const search=root.document.createElement('input');
   search.type='search';search.className='wv-guest-search';
   search.placeholder='🔍 주민 이름 검색 (예: 우사기, 토시로, 알렉스)...';
   search.value=this.roomGuestQuery||'';
   const chips=root.document.createElement('div');chips.className='wv-guest-chips';

   const populateChips=()=>{
    chips.replaceChildren();
    const q=(this.roomGuestQuery||'').trim().toLowerCase();
    let count=0;
    for(const [rid,rname] of ALL_RESIDENT_NAMES){
     if(rid===room.host)continue;
     if(q&&!rname.toLowerCase().includes(q)&&!rid.toLowerCase().includes(q))continue;
     count++;
     const active=(room.guests||[]).includes(rid);
     const chip=root.document.createElement('button');chip.type='button';chip.className='wv-guest-chip';
     chip.setAttribute('aria-pressed',String(active));
     chip.textContent=active?rname+' ✓':rname+' +';
     chip.addEventListener('click',()=>{
      const cur=room.guests||[];
      if(cur.includes(rid)){
       room.guests=cur.filter(id=>id!==rid);
      }else{
       if(cur.length>=4){this.message('마을 주민은 최대 4명까지 함께 초대할 수 있어요.');return;}
       room.guests=[...cur,rid];
      }
      this.saveRoomState();this.syncRoomActors();this.renderRoomSocialUI();
     });
     chips.append(chip);
    }
    if(!count){
     const empty=root.document.createElement('span');empty.className='wv-guest-empty';
     empty.textContent='“'+this.roomGuestQuery+'”에 해당하는 주민이 없습니다.';
     chips.append(empty);
    }
   };
   search.addEventListener('input',()=>{
    this.roomGuestQuery=search.value;
    populateChips();
   });
   accBtn.addEventListener('click',()=>{
    this.roomInviteOpen=!this.roomInviteOpen;
    panel.hidden=!this.roomInviteOpen;
    accBtn.setAttribute('aria-expanded',String(this.roomInviteOpen));
    arrow.textContent=this.roomInviteOpen?'접기 ▴':'펼치기 ▾';
   });
   populateChips();
   panel.append(search,chips);
   bar.append(hostRow,accBtn,panel);
  }
  buildWeedingMatchUI(){
   const box=this.weedMatchNode;if(!box||!this.words.length)return;
   const w=this.state.weeding;
   const cur=this.getCurrentWord();
   const pool=this.words.filter(x=>x&&cur&&x.id!==cur.id).slice();
   for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
   const picks=[cur,...pool.slice(0,3)].filter(Boolean);
   w.matchPairs=picks;w.selectedEn=null;w.matchedIds=[];w.bushHp=picks.length;w.maxHp=picks.length;
   const leftOrder=picks.slice();
   const rightOrder=picks.slice();
   for(let i=rightOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[rightOrder[i],rightOrder[j]]=[rightOrder[j],rightOrder[i]];}
   box.replaceChildren();
   const colL=root.document.createElement('div');colL.className='wv-weed-col';
   const colR=root.document.createElement('div');colR.className='wv-weed-col';
   const leftBtns=new Map(),rightBtns=new Map();
   const spawnLeaves=()=>{
    const cols=['#7ec468','#a4db7c','#5b9e4b','#f5e47a'];
    for(let k=0;k<10;k++){
     w.particles.push({x:375,y:495,vx:(Math.random()-.5)*210,vy:-90-Math.random()*130,rot:Math.random()*6,life:0.65+Math.random()*0.3,color:cols[k%cols.length]});
    }
   };
   for(const item of leftOrder){
    const b=root.document.createElement('button');b.type='button';b.className='wv-weed-card';b.textContent=item.word;
    b.addEventListener('click',()=>{
     if(w.matchedIds.includes(item.id))return;
     leftBtns.forEach(btn=>btn.dataset.selected='false');
     w.selectedEn=item.id;b.dataset.selected='true';
     w.actor.tx=245;w.actor.ty=565;
    });
    leftBtns.set(item.id,b);colL.append(b);
   }
   for(const item of rightOrder){
    const b=root.document.createElement('button');b.type='button';b.className='wv-weed-card';b.textContent=label(item);
    b.addEventListener('click',()=>{
     if(w.matchedIds.includes(item.id)||w.selectedEn==null)return;
     if(w.selectedEn===item.id){
      w.matchedIds.push(item.id);w.combo=(w.combo||0)+1;w.bushHp=Math.max(0,w.bushHp-1);
      leftBtns.get(item.id).dataset.matched='true';b.dataset.matched='true';
      leftBtns.get(item.id).dataset.selected='false';w.selectedEn=null;
      w.status='perfect';w.timer=0.8;w.actor.tx=270;w.actor.jumpT=0.6;
      spawnLeaves();
      this.studyManager.playTone('success');
      this.award(item,'🌱');
      if(w.bushHp<=0){
       this.message('🍀 거대 잡초 제초 완료! 네잎클로버 획득! (연속 제초 x'+w.combo+')');
       this.advanceWord(true);
       setTimeout(()=>{if(this.state.mode==='weeding')this.buildWeedingMatchUI();},850);
      }
     }else{
      w.combo=0;w.status='bad';w.timer=0.6;
      b.dataset.wrong='true';
      setTimeout(()=>{b.dataset.wrong='false';},420);
      this.message('❌ 뜻이 맞지 않습니다. 다시 연결해 보세요!');
     }
    });
    rightBtns.set(item.id,b);colR.append(b);
   }
   box.append(colL,colR);
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
     const placed={id:item.id,...this.constrainFloor(235+offset*26,422-(offset%2)*30)};
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
     <img id="wv-forage-food-prop" class="wv-forage-food-prop" src="images/minigames/props/food_pudding.png" alt="" aria-hidden="true">
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
  const weedMatch=root.document.createElement('div');weedMatch.id='wv-weed-match';weedMatch.hidden=true;
  const forageSentence=root.document.createElement('div');forageSentence.id='wv-forage-sentence';forageSentence.hidden=true;
  const roomSocial=root.document.createElement('div');roomSocial.id='wv-room-social-bar';roomSocial.hidden=true;
  panel.append(heading,target,hint,stage,quiz,weedMatch,action,forageSentence,choices,roomSocial,clear,status);
  const navbar=solo.querySelector('.wv-solo-topnav');navbar?.after(panel);
  root.wordvilleGame=new WordvilleGameEngine('wordvilleCanvas');
 }
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})(typeof window!=='undefined'?window:globalThis);
