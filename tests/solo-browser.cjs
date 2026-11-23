// Unified Canvas vocabulary gameplay and saved room end-to-end test.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(()=>globalThis.WordvilleSolo&&globalThis.wordvilleGame&&WordvilleWords?.length>5000,{timeout:30000});
  await page.locator('#wv-bottom-dock [data-screen="more"]').click();
  await page.locator('#wv-more-panel [data-more="solo"]').click();
  assert.equal(await page.locator('#wv-solo-view').isVisible(),true);
  assert.equal(await page.locator('#wv-solo-question').isVisible(),false,'Duplicate quiz should be hidden');
  assert.equal(await page.locator('#wv-solo-scene').isVisible(),false,'Duplicate emoji game should be hidden');
  const initial=await page.evaluate(()=>state.coins);
  for(const [tab,mode,pos] of [['fish','fishing',76],['wood','weeding',.5]]){
   await page.locator('[data-solo-tab="'+tab+'"]').click();
   await page.evaluate(({mode,pos})=>{
    const g=wordvilleGame;g.pause();g.nextActionAt=0;
    if(mode==='fishing'){g.state.fishing.pos=pos;g.state.fishing.caught=false;}
    else{g.state.weeding.pos=pos;g.state.weeding.timer=0;}
    g.onTapAction();
   },{mode,pos});
   assert.equal(await page.locator('#wv-canvas-answer').isVisible(),true);
   const meaning=await page.evaluate(()=>WordvilleCanvasAnswer.alternatives(wordvilleGame.getCurrentWord())[0]);
   assert.ok(meaning,'Missing VOCA meaning');
   await page.locator('#wv-answer-input').fill(meaning);
   await page.locator('#wv-canvas-answer button[type=submit]').click();
   assert.match(await page.locator('#wordville-canvas-status').innerText(),/저장 완료/);
  }
  await page.locator('[data-solo-tab="capture"]').click();
  await page.evaluate(()=>{
   const g=wordvilleGame,word=g.getCurrentWord();
   const choice=[...document.querySelectorAll('#foraging-choices button')].find(b=>b.textContent===word.word);
   if(!choice)throw Error('Foraging correct choice missing');
   choice.click();
  });
  assert.ok(await page.evaluate(()=>WordvilleSolo.progress.learned.length>=3));
  assert.ok((await page.evaluate(()=>state.coins))>initial);
  await page.locator('[data-solo-tab="room"]').click();
  assert.equal(await page.locator('#wv-solo-room-view').isVisible(),true);
  assert.ok((await page.locator('.wv-solo-frame').count())>=1);
  const coins=await page.evaluate(()=>state.coins);
  assert.ok(coins>=12);
  await page.locator('#wv-solo-shop .wv-solo-shop-item').first().locator('button').first().click();
  assert.equal(await page.locator('#wv-solo-furniture [data-item="rug"]').count(),1);
  await page.locator('#wv-solo-shop .wv-solo-shop-item').first().locator('.wv-solo-move').click();
  const original=await page.evaluate(()=>WordvilleSolo.progress.slots.rug);
  await page.reload();
  await page.waitForFunction(()=>globalThis.WordvilleSolo&&WordvilleShell&&globalThis.WordvilleWords?.length>5000);
  await page.locator('#wv-bottom-dock [data-screen="more"]').click();
  await page.locator('#wv-more-panel [data-more="solo"]').click();
  await page.locator('[data-solo-tab="room"]').click();
  assert.equal(await page.locator('#wv-solo-furniture [data-item="rug"]').count(),1);
  assert.equal(await page.evaluate(()=>WordvilleSolo.progress.slots.rug),original);
  assert.ok((await page.locator('.wv-solo-frame').count())>=1);
  assert.deepEqual(errors,[]);
  console.log('PASS: unified Canvas fishing/weeding typed answers, foraging and saved room');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
