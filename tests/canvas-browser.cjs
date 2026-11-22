// Canvas engine end-to-end validation in Galaxy-sized mobile Chromium.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(()=>!!globalThis.WordvilleSolo&&!!globalThis.wordvilleGame&&WordvilleWords?.length>5000,{timeout:30000});
  await page.locator('#wv-bottom-dock [data-screen="more"]').click();
  await page.locator('#wv-more-panel [data-more="solo"]').click();
  assert.equal(await page.locator('#wv-solo-view').isVisible(),true);
  assert.equal(await page.locator('#wordvilleCanvas').isVisible(),true);
  const base=await page.evaluate(()=>{
   const g=wordvilleGame;
   return {width:g.canvas.width,height:g.canvas.height,mode:g.state.mode,
    first:g.getCurrentWord().id,coin:state.coins,words:g.words.length};
  });
  assert.deepEqual({w:base.width,h:base.height},{w:1200,h:2000});
  assert.ok(base.words>5000);
  assert.equal(base.mode,'fishing');
  // Award one real offline vocabulary word for a successful fishing catch.
  await page.evaluate(()=>{wordvilleGame.state.fishing.pos=.76;wordvilleGame.onTapAction();});
  assert.equal(await page.evaluate(id=>!!state.reviews[id],base.first),true);
  assert.ok((await page.evaluate(()=>state.coins))>base.coin);
  assert.match(await page.locator('#wordville-canvas-status').innerText(),/저장 완료/);
  // Weeding 3-quality timing states.
  await page.locator('[data-solo-tab="wood"]').click();
  assert.equal(await page.evaluate(()=>wordvilleGame.state.mode),'weeding');
  await page.evaluate(()=>{wordvilleGame.nextActionAt=0;wordvilleGame.state.weeding.pos=.50;wordvilleGame.onTapAction();});
  assert.equal(await page.evaluate(()=>wordvilleGame.state.weeding.status),'perfect');
  await page.waitForTimeout(80);
  await page.evaluate(()=>{wordvilleGame.state.weeding.timer=0;wordvilleGame.nextActionAt=0;wordvilleGame.state.weeding.pos=.01;wordvilleGame.onTapAction();});
  assert.equal(await page.evaluate(()=>wordvilleGame.state.weeding.status),'bad');
  // Foraging a valid word triggers each of the three staged animations.
  await page.locator('[data-solo-tab="capture"]').click();
  assert.equal(await page.evaluate(()=>wordvilleGame.state.mode),'foraging');
  const food=await page.evaluate(()=>wordvilleGame.getCurrentWord().word);
  await page.locator('#foraging-choices button').evaluateAll((buttons,word)=>{
   const matching=buttons.find(button=>button.textContent===word);
   if(!matching)throw Error('Foraging target missing from options');
   matching.click();
  },food);
  assert.equal(await page.evaluate(()=>wordvilleGame.state.foraging.stage),2);
  await page.evaluate(()=>{wordvilleGame.state.foraging.timer=.001;wordvilleGame.update(.05);});
  assert.equal(await page.evaluate(()=>wordvilleGame.state.foraging.stage),3);
  await page.evaluate(()=>{wordvilleGame.state.foraging.timer=.001;wordvilleGame.update(.05);});
  assert.equal(await page.evaluate(()=>wordvilleGame.state.foraging.stage),1);
  // Room exists as a separate Canvas mode and allows drag/reposition.
  await page.locator('[data-solo-tab="room"]').click();
  assert.equal(await page.evaluate(()=>wordvilleGame.state.mode),'room');
  assert.equal(await page.locator('#room-drawer').isVisible(),true);
  await page.locator('#room-item-list button').first().click();
  const info=await page.evaluate(()=>({
   x:wordvilleGame.state.room.placed.at(-1).x,
   y:wordvilleGame.state.room.placed.at(-1).y,
   len:wordvilleGame.state.room.placed.length
  }));
  const rect=await page.locator('#wordvilleCanvas').boundingBox();
  const p=(x,y)=>({x:rect.x+rect.width*x/600,y:rect.y+rect.height*y/1000});
  const from=p(info.x,info.y-18),to=p(360,515);
  await page.mouse.move(from.x,from.y);
  await page.mouse.down();
  await page.mouse.move(to.x,to.y,{steps:4});
  await page.mouse.up();
  const moved=await page.evaluate(()=>wordvilleGame.state.room.placed.at(-1));
  assert.notEqual(Math.round(moved.x),Math.round(info.x));
  assert.ok(await page.evaluate(()=>!!localStorage.getItem('wordville_room_v1')));
  // Foreground event plus a cold WebView reload must preserve layout and learning.
  await page.evaluate(()=>document.dispatchEvent(new Event('wordville-app-resume')));
  await page.reload();
  await page.waitForFunction(()=>!!globalThis.wordvilleGame&&WordvilleWords?.length>5000,{timeout:30000});
  const restored=await page.evaluate(()=>wordvilleGame.state.room.placed.at(-1));
  assert.ok(Math.abs(restored.x-moved.x)<2);
  assert.ok(Math.abs(restored.y-moved.y)<2);
  assert.ok(await page.evaluate(id=>!!state.reviews[id],base.first));
  assert.deepEqual(errors,[]);
  console.log('PASS: Canvas 4 modes, DPR2, real word rewards, 3-stage foraging, dragging and cold-start restoration');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
