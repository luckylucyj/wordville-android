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
  await page.waitForFunction(()=>
   wordvilleGame.sprites.bg_fishing?.naturalWidth===1147 &&
   wordvilleGame.sprites.bg_room?.naturalWidth===1147 &&
   wordvilleGame.atlas.sheets.weeding_states?.naturalHeight===1536 &&
   wordvilleGame.atlas.sheets.foraging_stages?.naturalHeight===1536,
   {timeout:15000});
  // Fishing timing only opens the actual vocabulary answer form.
  await page.evaluate(()=>{wordvilleGame.state.fishing.pos=76;wordvilleGame.onTapAction();});
  assert.equal(await page.locator('#wv-canvas-answer').isVisible(),true);
  assert.equal(await page.evaluate(()=>wordvilleGame.state.fishing.counts.reduce((a,b)=>a+b)),0,
   'Timing cannot grant reward without a correct word meaning');
  await page.locator('#wv-answer-input').fill(await page.evaluate(()=>
   WordvilleCanvasAnswer.alternatives(wordvilleGame.getCurrentWord())[0]));
  await page.locator('#wv-canvas-answer button[type=submit]').click();
  assert.equal(await page.evaluate(()=>wordvilleGame.state.fishing.counts.reduce((a,b)=>a+b)),1);
  assert.match(await page.locator('#wordville-canvas-status').innerText(),/저장 완료/);

  await page.locator('[data-solo-tab="wood"]').click();
  assert.equal(await page.evaluate(()=>wordvilleGame.state.mode),'weeding');
  await page.evaluate(()=>{wordvilleGame.nextActionAt=0;wordvilleGame.state.weeding.pos=.50;wordvilleGame.onTapAction();});
  assert.equal(await page.locator('#wv-canvas-answer').isVisible(),true);
  assert.equal(await page.evaluate(()=>wordvilleGame.state.weeding.status),'idle',
   'Perfect timing cannot mark correct before the typed meaning is checked');
  await page.locator('#wv-answer-input').fill(await page.evaluate(()=>
   WordvilleCanvasAnswer.alternatives(wordvilleGame.getCurrentWord())[0]));
  await page.locator('#wv-canvas-answer button[type=submit]').click();
  assert.equal(await page.evaluate(()=>wordvilleGame.state.weeding.status),'perfect');

  await page.evaluate(()=>{
   wordvilleGame.state.weeding.timer=0;
   wordvilleGame.nextActionAt=0;
   wordvilleGame.state.weeding.pos=.01;
   wordvilleGame.onTapAction();
  });
  assert.equal(await page.evaluate(()=>wordvilleGame.state.weeding.status),'bad');
  assert.equal(await page.locator('#wv-canvas-answer').isVisible(),false);

  // Foraging a valid word triggers each of the three staged animations.
  await page.locator('[data-solo-tab="capture"]').click();
  assert.equal(await page.evaluate(()=>wordvilleGame.state.mode),'foraging');
  const card=page.locator('#wv-forage-card');
  const gauge=card.getByRole('progressbar');
  assert.equal(await card.isVisible(),true);
  assert.equal(await page.locator('#wordvilleCanvas').isVisible(),false);
  const previewBefore=await page.evaluate(()=>({
   coins:state.coins,word:wordvilleGame.getCurrentWord()?.id,review:JSON.stringify(state.reviews)
  }));
  await card.getByRole('button',{name:/Forage/}).tap();
  assert.equal(await gauge.getAttribute('aria-valuenow'),'30');
  await page.waitForFunction(()=>document.querySelector('#wv-forage-card').dataset.stage==='2');
  assert.equal(await gauge.getAttribute('aria-valuenow'),'68');
  await page.waitForFunction(()=>document.querySelector('#wv-forage-card').dataset.stage==='3');
  assert.equal(await gauge.getAttribute('aria-valuenow'),'100');
  await card.getByRole('button',{name:/Forage/}).tap();
  await card.getByRole('button',{name:/Pack/}).tap();
  assert.equal(await card.locator('.wv-forage-badge').textContent(),'Success!');
  assert.equal(await page.evaluate(()=>wordvilleGame.state.foraging.timer),0,
   'Manual Pack cancels a running Forage preview');
  await card.getByRole('button',{name:/Eat/}).tap();
  assert.equal(await gauge.getAttribute('aria-valuenow'),'68');
  assert.deepEqual(await page.evaluate(()=>({
   coins:state.coins,word:wordvilleGame.getCurrentWord()?.id,review:JSON.stringify(state.reviews)
  })),previewBefore,'Preview never changes vocabulary or rewards');
  // An incorrect food choice also advances to the next card and schedules
  // the failed word after two intervening cards.
  const firstWrong=await page.evaluate(()=>wordvilleGame.getCurrentWord().id);
  await page.locator('#foraging-choices button').evaluateAll((buttons,answerId)=>{
   const incorrect=buttons.find(button=>{
    const entry=wordvilleGame.state.foraging.choices.find(w=>w.word===button.textContent);
    return entry&&entry.id!==answerId;
   });
   if(!incorrect)throw Error('Foraging incorrect option missing');
   incorrect.click();
  },firstWrong);
  assert.equal(await page.evaluate(id=>wordvilleGame.studyManager.queue[2]?.id===id,firstWrong),true);
  const correct=await page.evaluate(()=>({
   word:wordvilleGame.getCurrentWord().word,id:wordvilleGame.getCurrentWord().id,coins:state.coins
  }));
  const food=correct.word;
  await page.locator('#foraging-choices button').evaluateAll((buttons,word)=>{
   const matching=buttons.find(button=>button.textContent===word);
   if(!matching)throw Error('Foraging target missing from options');
   matching.click();
  },food);
  assert.equal(await page.evaluate(()=>wordvilleGame.state.foraging.stage),2);
  assert.equal(await card.getByRole('button',{name:/Forage/}).isDisabled(),true);
  assert.equal(await page.locator('#foraging-choices button').first().isDisabled(),true);
  assert.equal(await page.evaluate(id=>state.reviews[id]?.correct,correct.id),true);
  assert.ok(await page.evaluate(coins=>state.coins>coins,correct.coins));
  await page.evaluate(()=>{wordvilleGame.state.foraging.timer=.001;wordvilleGame.update(.05);});
  assert.equal(await page.evaluate(()=>wordvilleGame.state.foraging.stage),3);
  await page.evaluate(()=>{wordvilleGame.state.foraging.timer=.001;wordvilleGame.update(.05);});
  assert.equal(await page.evaluate(()=>wordvilleGame.state.foraging.stage),1);
  assert.equal(await card.getByRole('button',{name:/Forage/}).isEnabled(),true);
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
  await page.locator('#wordvilleCanvas').scrollIntoViewIfNeeded();
  const rect=await page.locator('#wordvilleCanvas').boundingBox();
  const p=(x,y)=>({x:rect.x+rect.width*x/600,y:rect.y+rect.height*y/1000});
  const handle=await page.locator('.wv-room-drag-handle').last().boundingBox();
  const from={x:handle.x+handle.width/2,y:handle.y+handle.height/2},to=p(360,640);
  await page.mouse.move(from.x,from.y);
  await page.mouse.down();
  assert.ok((await page.evaluate(()=>wordvilleGame.state.room.dragIdx))>=0,'Furniture must be selected before dragging');
  await page.mouse.move(to.x,to.y,{steps:6});
  await page.mouse.up();
  const moved=await page.evaluate(()=>wordvilleGame.state.room.placed.at(-1));
  assert.notEqual(Math.round(moved.x),Math.round(info.x));
  assert.ok(await page.evaluate(()=>!!localStorage.getItem('wordville_room_v1')));
  // Foreground event plus a cold WebView reload must preserve layout and learning.
  await page.evaluate(()=>document.dispatchEvent(new Event('wordville-app-resume')));
  const pendingWord=await page.evaluate(()=>wordvilleGame.getCurrentWord()?.id);
  await page.reload();
  await page.waitForFunction(()=>!!globalThis.wordvilleGame&&WordvilleWords?.length>5000,{timeout:30000});
  const restored=await page.evaluate(()=>wordvilleGame.state.room.placed.at(-1));
  assert.ok(Math.abs(restored.x-moved.x)<2);
  assert.ok(Math.abs(restored.y-moved.y)<2);
  assert.ok(await page.evaluate(id=>!!state.reviews[id],base.first));
  assert.equal(await page.evaluate(()=>wordvilleGame.getCurrentWord()?.id),pendingWord,
   'Pending word order remains stable after Android WebView recreation');
  assert.deepEqual(errors,[]);
  console.log('PASS: Canvas 4 modes, DPR2, real word rewards, 3-stage foraging, dragging and cold-start restoration');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
