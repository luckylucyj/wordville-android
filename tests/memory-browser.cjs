/* End-to-end memory gallery coverage, including persistence and Commons search. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const exceptions=[];page.on('pageerror',err=>exceptions.push(err.message));
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 try{
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(()=>globalThis.WordvilleGallery&&globalThis.WordvilleShell&&words.length>0&&db);
  await page.locator('#wv-bottom-dock [data-screen="learn"]').click();
  await page.locator('#search').fill('comprehensive');
  await page.locator('.word').filter({has:page.locator('strong',{hasText:/^comprehensive$/})}).click();
  await page.waitForFunction(()=>document.getElementById('wv-memory-count').textContent.includes('0장'));
  assert.equal(await page.locator('#image-input').getAttribute('multiple'),'');
  await page.locator('#image-input').setInputFiles([
   {name:'first.png',mimeType:'image/png',buffer:png},
   {name:'second.png',mimeType:'image/png',buffer:png}
  ]);
  await page.waitForFunction(()=>document.querySelector('#wv-memory-count').textContent.includes('2장'));
  assert.equal(await page.locator('#wv-memory-photo-list .wv-photo-card').count(),2);
  assert.equal(await page.locator('#memory-image').isVisible(),true);
  assert.match(await page.locator('#detail-status').innerText(),/기기에 저장했습니다/);
  await page.locator('#wv-memory-open-archive').click();
  await page.waitForFunction(()=>WordvilleShell.screen==='gallery');
  assert.equal(await page.locator('#wv-gallery-view').isVisible(),true);
  assert.match(await page.locator('#wv-gallery-total').innerText(),/2장/);
  await page.waitForFunction(()=>document.querySelectorAll('#wv-gallery-archive-list .wv-photo-card').length===2);
  assert.equal(await page.locator('#wv-gallery-archive-list .wv-photo-card').count(),2);
  assert.notEqual(await page.locator('#wv-gallery-date option').count(),1);
  // Opening a saved image returns to its vocabulary card.
  await page.locator('#wv-gallery-archive-list .wv-photo-choice').first().click();
  assert.equal(await page.locator('#word-dialog').isVisible(),true);
  assert.match(await page.locator('#detail-word').innerText(),/comprehensive/);
  await page.locator('#wv-memory-search-toggle').click();
  assert.equal(await page.locator('#wv-memory-search-panel').isVisible(),true);
  await page.route('https://commons.wikimedia.org/w/api.php?**',route=>route.fulfill({
   status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
   body:JSON.stringify({query:{pages:[{title:'File:Sample memory.png',
    imageinfo:[{mime:'image/png',thumburl:'https://upload.wikimedia.org/wikipedia/commons/thumb/sample-memory.png',
      extmetadata:{LicenseShortName:{value:'CC BY-SA 4.0'}},user:'Sample author'}]}]}})
  }));
  await page.route('https://upload.wikimedia.org/**',route=>route.fulfill({
   status:200,contentType:'image/png',headers:{'access-control-allow-origin':'*'},body:png
  }));
  await page.locator('#wv-memory-search-query').fill('comprehensive');
  await page.locator('#wv-memory-search-submit').click();
  await page.waitForFunction(()=>document.querySelectorAll('.wv-search-result').length===1);
  assert.match(await page.locator('#wv-memory-search-results').innerText(),/CC BY-SA 4.0/);
  await page.locator('.wv-search-result button').click();
  await page.waitForFunction(()=>document.querySelector('#wv-memory-count').textContent.includes('3장'));
  assert.equal(await page.evaluate(async()=>{const items=await WordvilleGallery.getAll();return items.some(i=>i.source==='Wikimedia Commons'&&i.license==='CC BY-SA 4.0'&&i.sourceUrl.startsWith('https://commons.wikimedia.org/'));}),true);
  await page.locator('#remove-image').click();
  await page.waitForFunction(()=>document.querySelector('#wv-memory-count').textContent.includes('2장'));
  await page.locator('#close-dialog').click();
  await page.reload();
  await page.waitForFunction(()=>globalThis.WordvilleGallery&&globalThis.WordvilleShell&&words.length>0&&db);
  await page.locator('#wv-bottom-dock [data-screen="learn"]').click();
  await page.locator('#search').fill('comprehensive');
  await page.locator('.word').filter({has:page.locator('strong',{hasText:/^comprehensive$/})}).click();
  await page.waitForFunction(()=>document.querySelector('#wv-memory-count').textContent.includes('2장'));
  assert.equal(await page.locator('#wv-memory-photo-list .wv-photo-card').count(),2);
  assert.equal(await page.locator('#memory-image').isVisible(),true);
  await page.locator('#close-dialog').click();
  assert.deepEqual(exceptions,[]);
  console.log('PASS: multiple images, dated archive, card navigation, Commons search/import, selected-image deletion and reload persistence');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});