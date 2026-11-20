/* Real mobile-browser smoke test for town bulletin sprites and pin-to-frame UI. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>globalThis.WordvilleBoard?.loaded&&
   globalThis.WordvilleSocial?.openBoard&&globalThis.WordvilleVillage?.mapView,{timeout:45000});
  await page.evaluate(()=>WordvilleShell.activate('town'));
  const board=await page.evaluate(()=>({
   loaded:WordvilleBoard.loaded,
   dimensions:[WordvilleBoard.image.naturalWidth,WordvilleBoard.image.naturalHeight],
   starting:WordvilleBoard.state(),
   props:VillageModel.bulletin.worldX2
  }));
  assert.equal(board.loaded,true);
  assert.deepEqual(board.dimensions,[384,128]);
  assert.equal(board.starting,0);
  assert.equal(board.props.width,148);
  await page.evaluate(()=>WordvilleSocial.openBoard());
  assert.equal(await page.locator('#wv-town-board').isVisible(),true);
  // Overseas-trend board intentionally groups the fictional resident posts in a
  // collapsed <details>. Expand it as an actual mobile user would.
  const residentDisclosure=page.locator('#wv-town-board .wv-trends-older > summary');
  await residentDisclosure.click();
  assert.equal(await page.locator('#wv-town-board .wv-trends-older').evaluate(e=>e.open),true);
  assert.equal(await page.locator('.wv-town-post .wv-post-pin').count(),8);
  for(let i=0;i<4;i++){
   await page.locator('.wv-town-post .wv-post-pin').nth(i).click();
  }
  assert.equal(await page.evaluate(()=>WordvilleBoard.state()),1);
  assert.match(await page.locator('.wv-board-pins-count').textContent(),/4/);
  await page.locator('.wv-town-post .wv-post-pin').nth(4).click();
  assert.equal(await page.evaluate(()=>WordvilleBoard.state()),2);
  await page.locator('.wv-social-head .wv-social-close').first().click();
  await page.waitForFunction(()=>!document.querySelector('#wv-town-board').open);
  await page.screenshot({path:'wordville-board-browser.png',fullPage:false});
  // Clicking the correct world-space ground contact opens the bulletin board.
  const p=await page.evaluate(()=>{
   const canvas=document.getElementById('village-canvas'),r=canvas.getBoundingClientRect();
   const v=WordvilleVillage.mapView();
   return {x:r.x+(437*v.scale+v.offsetX)*r.width/canvas.width,
    y:r.y+(393*v.scale+v.offsetY)*r.height/canvas.height};
  });
  await page.mouse.click(p.x,p.y);
  assert.equal(await page.locator('#wv-town-board').isVisible(),true);
  await page.locator('.wv-board-pins-bar button').click();
  assert.equal(await page.evaluate(()=>WordvilleBoard.state()),0);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('wordville.board.pins.v1')).length),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: board atlas 3 states, 2x geometry, clickable world trigger, post pinning and clearing');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
