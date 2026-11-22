// Simulate returning to Wordville after running another Android app. Verify
// both a living WebView and a destroyed/recreated WebView retain local state.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:4173';
 const boot=()=>page.waitForFunction(()=>globalThis.WordvilleWords?.length>5000&&globalThis.WordvilleShell?.screen&&document.querySelector('#wv-loading-cover')?.hidden,{timeout:30000});
 try{
  await page.goto(url);await boot();
  // User saves XP, coins, reviews and current Day before opening other apps.
  await page.evaluate(()=>{
   WordvilleShell.activate('learn');
   save({...state,xp:4221,coins:1355,reviews:{...state.reviews,['wordville-resume-test']:{streak:1,due:Date.now()+60000,attempts:1}}});
  });
  await page.locator('#day-filter').selectOption('10');
  const expectedDay=await page.locator('#day-filter').inputValue();
  assert.equal(expectedDay,'10');
  await page.evaluate(()=>{document.dispatchEvent(new Event('wordville-app-resume'));});
  assert.equal(await page.locator('#balance').innerText(),'4221 XP · 1355 코인');
  assert.equal(await page.evaluate(()=>WordvilleShell.screen),'learn');
  assert.equal(await page.locator('#day-filter').inputValue(),expectedDay);
  assert.ok(await page.evaluate(()=>!!state.reviews['wordville-resume-test']));
  // A Samsung process kill recreates the WebView. Persisted data must be
  // visible from local storage before an external login has completed.
  await page.reload();await boot();
  assert.equal(await page.evaluate(()=>WordvilleShell.screen),'learn');
  assert.equal(await page.locator('#day-filter').inputValue(),expectedDay);
  assert.equal(await page.locator('#balance').innerText(),'4221 XP · 1355 코인');
  assert.ok(await page.evaluate(()=>!!state.reviews['wordville-resume-test']));
  // Each screen must survive recreation; previously every non-learn tab
  // was reset to town by saveLastTab().
  for(const screen of ['residents','review','solo','gallery','learn']){
   await page.evaluate(s=>WordvilleShell.activate(s),screen);
   await page.reload();await boot();
   assert.equal(await page.evaluate(()=>WordvilleShell.screen),screen,'restore '+screen);
   assert.equal(await page.locator('#balance').innerText(),'4221 XP · 1355 코인');
  }
  // Trigger app resume even if Chrome throttled the hidden town canvas.
  await page.evaluate(()=>{
   WordvilleShell.activate('residents');
   document.dispatchEvent(new Event('wordville-app-resume'));
  });
  assert.equal(await page.evaluate(()=>WordvilleShell.screen),'residents');
  assert.equal(await page.locator('#wv-residents-view').isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: Android-like background/resume and cold WebView restart retain XP, reviews, coins, selected Day and last screen.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
