// Verify imported fishing PNGs, edge-only chroma key, scroll-safe touch and asset diagnostics.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {deflateSync}=require('node:zlib');

function crc32(buffer){
 let result=0xffffffff;
 for(const byte of buffer){result^=byte;for(let i=0;i<8;i++)result=(result>>>1)^((result&1)?0xedb88320:0);}
 return (result^0xffffffff)>>>0;
}
function pngChunk(type,payload){
 const typeBuffer=Buffer.from(type,'ascii');
 const size=Buffer.alloc(4);size.writeUInt32BE(payload.length);
 const checksum=Buffer.alloc(4);checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer,payload])));
 return Buffer.concat([size,typeBuffer,payload,checksum]);
}
function png(width,height,pixel){
 const data=Buffer.alloc(height*(width*4+1));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const [r,g,b,a]=pixel(x,y);
  const offset=y*(width*4+1)+1+x*4;
  data[offset]=r;data[offset+1]=g;data[offset+2]=b;data[offset+3]=a;
 }
 const header=Buffer.alloc(13);
 header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);
 header[8]=8;header[9]=6;
 return Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  pngChunk('IHDR',header),
  pngChunk('IDAT',deflateSync(data)),
  pngChunk('IEND',Buffer.alloc(0))
 ]);
}
// Near-white edge background and enclosed white face; black outline separates them.
const charPng=png(16,16,(x,y)=>{
 if(x===3||x===12||y===3||y===12){
  if(x>=3&&x<=12&&y>=3&&y<=12)return [74,59,50,255];
 }
 return [255,255,255,255];
});
const backPng=png(16,16,()=>[46,157,181,255]);

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const pageErrors=[],assetErrors=[],requested=[];
 page.on('pageerror',error=>pageErrors.push(error.message));
 page.on('console',msg=>{if(msg.type()==='error'&&msg.text().includes('[Wordville Canvas] Image failed'))assetErrors.push(msg.text());});
 try{
  await page.route('**/images/fishing/*.png',route=>{
   const url=route.request().url();
   requested.push(url);
   return route.fulfill({status:200,contentType:'image/png',body:url.endsWith('/bg_fishing.png')?backPng:charPng});
  });
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(()=>!!globalThis.wordvilleGame&&
   !!wordvilleGame.sprites.bg_fishing&&!!wordvilleGame.sprites.hachiware_idle&&
   !!wordvilleGame.sprites.hachiware_catch,{timeout:30000});
  assert.ok(requested.some(url=>url.endsWith('/images/fishing/bg_fishing.png')));
  assert.ok(requested.some(url=>url.endsWith('/images/fishing/hachiware_idle.png')));
  assert.ok(requested.some(url=>url.endsWith('/images/fishing/hachiware_catch.png')));
  const info=await page.evaluate(()=>{
   const game=wordvilleGame;
   const sprite=game.sprites.hachiware_idle;
   const ctx=sprite.getContext('2d');
   const edge=Array.from(ctx.getImageData(0,0,1,1).data);
   const body=Array.from(ctx.getImageData(8,8,1,1).data);
   const outline=Array.from(ctx.getImageData(3,8,1,1).data);
   game.state.mode='fishing';game.state.fishing.sceneDirty=true;game.paint();
   const background=Array.from(game.ctx.getImageData(32,1200,1,1).data);
   return {edge,body,outline,background,
    css:getComputedStyle(game.canvas).touchAction,
    fileUrl:new URL('images/fishing/bg_fishing.png','file:///android_asset/index.html').href,
    safeUrl:new URL('images/fishing/bg_fishing.png','https://appassets.androidplatform.net/assets/index.html').href};
  });
  assert.equal(info.edge[3],0,'Only white background pixels are transparent');
  assert.equal(info.body[3],255,'White character face remains opaque');
  assert.deepEqual(info.body.slice(0,3),[255,255,255]);
  assert.equal(info.outline[3],255);
  assert.deepEqual(info.background.slice(0,3),[46,157,181]);
  assert.equal(info.css,'pan-y');
  assert.equal(info.fileUrl,'file:///android_asset/images/fishing/bg_fishing.png');
  assert.equal(info.safeUrl,'https://appassets.androidplatform.net/assets/images/fishing/bg_fishing.png');
  await page.locator('#wv-bottom-dock [data-screen="more"]').click();
  await page.locator('#wv-more-panel [data-more="solo"]').click();
  await page.locator('#wordvilleCanvas').scrollIntoViewIfNeeded();
  // A swipe must not trigger the fishing success callback.
  const swipe=await page.evaluate(()=>{
   const g=wordvilleGame,canvas=g.canvas,rect=canvas.getBoundingClientRect();
   g.state.mode='fishing';g.state.fishing.pos=76;g.nextActionAt=0;
   const id=g.getCurrentWord()?.id;
   const oldCount=g.state.slots.length;
   const x=rect.left+rect.width/2,y=rect.top+rect.height*.9;
   canvas.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:27,clientX:x,clientY:y}));
   canvas.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:27,clientX:x,clientY:y-85}));
   return {oldCount,newCount:g.state.slots.length,id};
  });
  assert.equal(swipe.newCount,swipe.oldCount,'Swipe must not count as a game tap');
  const reel=page.getByRole('button',{name:'낚아채기'});
  const popup=page.locator('.wv-fishing-popup');
  const phase=()=>page.locator('#wv-canvas-stage').getAttribute('data-fishing-phase');
  const setPosition=pos=>page.evaluate(value=>{
   const g=wordvilleGame;
   g.pause();g.nextActionAt=0;g.state.fishing.pos=value;g.syncFishingTiming();
  },pos);
  const total=()=>page.evaluate(()=>wordvilleGame.state.fishing.counts.reduce((a,b)=>a+b,0));
  const before=await total();
  await setPosition(20);
  await reel.tap();
  assert.match(await page.locator('#wv-fishing-hint').textContent(),/노란 구간/);
  assert.equal(await phase(),'casting');
  assert.equal(await total(),before);
  assert.equal(await popup.getAttribute('aria-hidden'),'true');

  await setPosition(76);
  assert.equal(await phase(),'biting');
  assert.equal(await page.locator('.wv-fishing-bobber').evaluate(el=>el.style.left),'76%');
  await reel.tap();
  assert.equal(await phase(),'caught');
  assert.equal(await total(),before+1,'A completed gauge tap grants one reward');
  assert.equal(await popup.getAttribute('aria-hidden'),'false');
  const [weightValue,unit]=(await popup.locator('.wv-fishing-weight').textContent()).split(' ');
  assert.equal(unit,'kg');
  assert.match(weightValue,/^\d\.\d{2}$/);
  assert.ok(Number(weightValue)>=2.5&&Number(weightValue)<=5);
  await page.evaluate(()=>wordvilleGame.update(4));
  assert.equal(await phase(),'caught','The catch waits for the player to reset it');
  await page.getByRole('button',{name:'다시 낚시하기'}).press('Enter');
  assert.equal(await phase(),'casting');
  assert.equal(await popup.getAttribute('aria-hidden'),'true');
  assert.equal(await total(),before+1,'Reset does not grant a second reward');

  await setPosition(62);
  assert.equal(await phase(),'casting','The displayed zone starts at 64%');
  await page.locator('#wordvilleCanvas').tap({position:{x:100,y:120}});
  assert.equal(await phase(),'caught','A scene tap counts at the sample’s 62% grace boundary');
  assert.equal(await total(),before+2);
  // Room drag handles intercept touch only over a furniture icon.
  await page.locator('[data-solo-tab="room"]').click();
  await page.locator('[data-room-close]').click();
  assert.equal(await page.locator('#room-drawer').isVisible(),false);
  await page.locator('#room-drawer-toggle').click();
  await page.locator('#room-item-list button').first().tap();
  assert.equal(await page.locator('.wv-room-drag-handle').count()>0,true);
  assert.equal(await page.locator('#wordvilleCanvas').evaluate(el=>getComputedStyle(el).touchAction),'pan-y');
  assert.deepEqual(await page.locator('.wv-room-drag-handle').first().evaluate(el=>{
   const style=getComputedStyle(el);
   return {touchAction:style.touchAction,background:style.backgroundColor};
  }),{touchAction:'none',background:'rgba(0, 0, 0, 0)'});
  assert.equal(await page.locator('#room-item-list button').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
  await page.evaluate(()=>wordvilleGame.reportAssetError('bg_fishing','file:///android_asset/images/fishing/bg_fishing.png','test-failure'));
  assert.ok(assetErrors.some(s=>s.includes('bg_fishing')));
  assert.match(await page.locator('#wordville-canvas-status').textContent(),/bg_fishing\.png/);
  assert.deepEqual(pageErrors,[]);
  console.log('PASS: fishing assets, swipe-scroll, gauge and scene taps, catch state, keyboard restart, and room drag handles');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
