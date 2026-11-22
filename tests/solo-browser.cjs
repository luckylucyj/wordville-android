// One-player games / saved room end-to-end smoke test on mobile Chromium.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(()=>globalThis.WordvilleSolo&&WordvilleShell&&globalThis.WordvilleWords?.length>5000,{timeout:30000});
  await page.locator('#wv-bottom-dock [data-screen="more"]').click();
  await page.locator('#wv-more-panel [data-more="solo"]').click();
  assert.equal(await page.locator('#wv-solo-view').isVisible(),true);
  assert.equal(await page.locator('#wv-solo-game-view').isVisible(),true);
  const initial=await page.evaluate(()=>state.coins);
  async function solve(mode){
   await page.locator('[data-solo-tab="'+mode+'"]').click();
   await page.locator('#wv-solo-next').click();
   const q=await page.evaluate(()=>WordvilleSolo.currentQuestion);
   assert.ok(q&&q.choices.length===4,mode+' must show four answers');
   assert.equal(q.mode,mode);
   if(mode==='capture')assert.match(q.prompt,/_____/);
   await page.locator('#wv-solo-choices button').evaluateAll((buttons,answer)=>{
    const correct=buttons.find(b=>b.dataset.answer===answer);
    if(!correct)throw Error('correct choice missing');
    correct.click();
   },q.answer);
   await page.waitForFunction(()=>document.querySelector('#wv-solo-feedback')?.textContent.includes('정답!'));
   return q;
  }
  const fish=await solve('fish');
  assert.ok((await page.evaluate(()=>state.coins))>initial,'correct answer earns coin reward');
  const wood=await solve('wood');
  const capture=await solve('capture');
  assert.ok([fish,wood,capture].every(x=>x.word&&x.answer));
  await page.locator('[data-solo-tab="room"]').click();
  assert.equal(await page.locator('#wv-solo-room-view').isVisible(),true);
  assert.ok((await page.locator('.wv-solo-frame').count())>=1,'learned words appear as wall art');
  const coins=await page.evaluate(()=>state.coins);
  assert.ok(coins>=12,'three correct answers should fund the cheapest decoration');
  await page.locator('#wv-solo-shop .wv-solo-shop-item').first().locator('button').first().click();
  assert.equal(await page.locator('#wv-solo-furniture [data-item="rug"]').count(),1);
  await page.locator('#wv-solo-shop .wv-solo-shop-item').first().locator('.wv-solo-move').click();
  const original=await page.evaluate(()=>WordvilleSolo.progress.slots.rug);
  await page.reload();
  await page.waitForFunction(()=>globalThis.WordvilleSolo&&WordvilleShell&&globalThis.WordvilleWords?.length>5000);
  await page.locator('#wv-bottom-dock [data-screen="more"]').click();
  await page.locator('#wv-more-panel [data-more="solo"]').click();
  await page.locator('[data-solo-tab="room"]').click();
  assert.equal(await page.locator('#wv-solo-furniture [data-item="rug"]').count(),1,'room items persist');
  assert.equal(await page.evaluate(()=>WordvilleSolo.progress.slots.rug),original,'item position persists');
  assert.ok((await page.locator('.wv-solo-frame').count())>=1,'learned word frames persist');
  assert.deepEqual(errors,[]);
  console.log('PASS: solo fishing/woodcutting/cloze, shared XP and coins, shop, item placement and saved word frames');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
