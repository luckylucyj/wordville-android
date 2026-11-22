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
  // Buttons appear in the requested vertical order: album above search.
  const buttons=await page.evaluate(()=>[...document.querySelectorAll('.wv-memory-actions button')].map(x=>x.id));
  assert.deepEqual(buttons,['wv-memory-open-archive','wv-memory-search-toggle']);
  await page.locator('#reveal').click();
  await page.locator('#word-examples-details').evaluate(x=>x.open=true);
  await page.locator('#wv-memory-open-archive').click();
  await page.waitForFunction(()=>WordvilleShell.screen==='gallery');
  assert.equal(await page.locator('#wv-gallery-view').isVisible(),true);
  assert.match(await page.locator('#wv-gallery-total').innerText(),/2장/);
  await page.waitForFunction(()=>document.querySelectorAll('#wv-gallery-archive-list .wv-photo-card').length===2);
  assert.equal(await page.locator('#wv-gallery-archive-list .wv-photo-card').count(),2);
  assert.notEqual(await page.locator('#wv-gallery-date option').count(),1);
  // Back returns to the exact previously opened Word Card and its reading state.
  await page.locator('#wv-gallery-back').click();
  await page.waitForFunction(()=>WordvilleShell.screen==='learn'&&document.getElementById('word-dialog').open);
  assert.equal(await page.locator('#detail-word').textContent(),'comprehensive');
  // Card opens before IndexedDB photo loading finishes. Wait for the
  // saved reading state to be restored, not merely for dialog.open.
  await page.waitForFunction(()=>!document.getElementById('detail-meaning').hidden&&
   document.getElementById('word-examples-details').open,{timeout:10000});
  assert.equal(await page.locator('#detail-meaning').isVisible(),true);
  assert.equal(await page.locator('#word-examples-details').evaluate(x=>x.open),true);
  // Reopen the album and verify the existing album-to-card navigation still works.
  await page.locator('#wv-memory-open-archive').click();
  await page.waitForFunction(()=>WordvilleShell.screen==='gallery');
  // Opening a saved image returns to its vocabulary card.
  await page.locator('#wv-gallery-archive-list .wv-photo-choice').first().click();
  assert.equal(await page.locator('#word-dialog').isVisible(),true);
  assert.match(await page.locator('#detail-word').innerText(),/comprehensive/);
  await page.locator('#wv-memory-search-toggle').click();
  assert.equal(await page.locator('#wv-memory-search-panel').isVisible(),true);
  await page.route('https://commons.wikimedia.org/w/api.php?**',route=>route.fulfill({
   status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
   body:JSON.stringify({query:{pages:[{title:'File:Sample memory.png',
    imageinfo:[{mime:'image/png',thumburl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/sample-memory.png',
      extmetadata:{LicenseShortName:{value:'CC BY-SA 4.0'}},user:'Sample author'}]}]}})
  }));
  await page.route('https://thumb.wikimedia.org/**',route=>route.fulfill({
   status:200,contentType:'image/png',headers:{'access-control-allow-origin':'*'},body:png
  }));
  // Unified search must keep Wikimedia images even when Openverse HTTP 401s.
  await page.route('https://api.openverse.org/v1/images/?**',route=>route.fulfill({
   status:401,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{}'
  }));
  assert.equal(await page.locator('#wv-memory-search-source').count(),0);
  // No site picker or four external search links should occupy word-card space.
  for(const id of ['wv-memory-google-link','wv-memory-pixabay-link',
    'wv-memory-unsplash-link','wv-memory-pexels-link'])
   assert.equal(await page.locator('#'+id).count(),0,'Remove outbound search link '+id);
  assert.equal(await page.locator('#wv-memory-api-settings').isVisible(),true,
    'Advanced credential settings are retained but collapsed');
  assert.equal(await page.locator('#wv-memory-api-settings').evaluate(e=>e.open),false);

  await page.locator('#wv-memory-search-query').fill('comprehensive');
  await page.locator('#wv-memory-search-submit').click();
  await page.waitForFunction(()=>document.querySelectorAll('.wv-search-result').length===1);
  assert.match(await page.locator('#wv-memory-search-results').innerText(),/CC BY-SA 4.0/);
  assert.match(await page.locator('.wv-image-source-badge').first().innerText(),/Wikimedia Commons/);
  assert.match(await page.locator('#wv-memory-source-breakdown').innerText(),/Openverse 오류/);
  await page.waitForFunction(()=>{const img=document.querySelector('.wv-search-result img');return img?.complete&&img.naturalWidth>0;});
  assert.equal(await page.locator('.wv-search-result img').isVisible(),true);
  await page.locator('.wv-search-result button').click();
  await page.waitForFunction(()=>document.querySelector('#wv-memory-count').textContent.includes('3장'));
  assert.equal(await page.evaluate(async()=>{const items=await WordvilleGallery.getAll();return items.some(i=>i.source==='Wikimedia Commons'&&i.license==='CC BY-SA 4.0'&&i.sourceUrl.startsWith('https://commons.wikimedia.org/'));}),true);
  // Multi-page Openverse search must remain inside a 320px device viewport.
  await page.route('https://api.openverse.org/v1/images/?**',route=>route.fulfill({
   status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
   body:JSON.stringify({results:Array.from({length:20},(_,i)=>({
    id:'00000000-0000-4000-8000-'+String(i).padStart(12,'0'),
    title:'Photo '+i,license:'cc0',license_version:'1.0',creator:'Photo creator',
    foreign_landing_url:'https://example.org/photo/'+i,mature:false}))})
  }));
  // The same search button interleaves 20 Openverse and 1 Commons images.
  await page.locator('#wv-memory-search-query').fill('bank');
  await page.locator('#wv-memory-search-submit').click();
  await page.waitForFunction(()=>document.querySelectorAll('.wv-search-result').length===10);
  await page.setViewportSize({width:320,height:740});
  const pager=await page.locator('.wv-search-pagination').first().evaluate(nav=>{
   const a=nav.getBoundingClientRect();
   return {left:a.left,right:a.right,buttons:[...nav.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right};})};
  });
  assert.ok(pager.buttons.every(b=>b.left>=pager.left-1&&b.right<=pager.right+1),'image pagination buttons must not overflow');
  await page.locator('.wv-search-pagination').first().locator('button').last().click();
  await page.waitForFunction(()=>document.querySelector('.wv-search-page-number')?.textContent.includes('2 / 3'));
  await page.setViewportSize({width:390,height:844});
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