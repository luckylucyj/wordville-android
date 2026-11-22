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
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
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
   game.state.mode='fishing';game.paint();
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
   g.state.mode='fishing';g.state.fishing.pos=.76;g.nextActionAt=0;
   const id=g.getCurrentWord()?.id;
   const oldCount=g.state.slots.length;
   const x=rect.left+rect.width/2,y=rect.top+rect.height*.9;
   canvas.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:27,clientX:x,clientY:y}));
   canvas.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:27,clientX:x,clientY:y-85}));
   return {oldCount,newCount:g.state.slots.length,id};
  });
  assert.equal(swipe.newCount,swipe.oldCount,'Swipe must not count as a game tap');
  // One true tap inside the gauge counts exactly once.
  const tap=await page.evaluate(()=>{
   const g=wordvilleGame,c=g.canvas,r=c.getBoundingClientRect();
   g.nextActionAt=0;g.state.fishing.pos=.76;
   const before=g.state.slots.length,x=r.left+r.width/2,y=r.top+r.height*.9;
   c.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:28,clientX:x,clientY:y}));
   c.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:28,clientX:x,clientY:y}));
   return {before,after:g.state.slots.length};
  });
  assert.equal(tap.after,tap.before+1,'A completed gauge tap grants one reward');
  // Room drag handles intercept touch only over a furniture icon.
  await page.locator('[data-solo-tab="room"]').click();
  assert.equal(await page.locator('.wv-room-drag-handle').count()>0,true);
  assert.equal(await page.locator('#wordvilleCanvas').evaluate(el=>getComputedStyle(el).touchAction),'pan-y');
  assert.equal(await page.locator('.wv-room-drag-handle').first().evaluate(el=>getComputedStyle(el).touchAction),'none');
  await page.evaluate(()=>wordvilleGame.reportAssetError('bg_fishing','file:///android_asset/images/fishing/bg_fishing.png','test-failure'));
  assert.ok(assetErrors.some(s=>s.includes('bg_fishing')));
  assert.match(await page.locator('#wordville-canvas-status').textContent(),/bg_fishing\.png/);
  assert.deepEqual(pageErrors,[]);
  console.log('PASS: PNG-only fishing, alpha-safe edge chroma, both WebView paths, swipe-scroll, tap, room drag handles, onerror diagnostics');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
