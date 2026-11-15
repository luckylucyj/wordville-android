const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const exceptions=[];
 page.on('pageerror',error=>exceptions.push(error.message));
 try{
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(()=>window.WordvilleShell&&window.WordvilleWords?.length>100);
  await page.evaluate(()=>WordvilleI18n.setLanguage('en'));
  await page.locator('#wv-bottom-dock [data-screen="more"]').click();
  assert.match(await page.locator('[data-more="notes"]').innerText(),/Notes by Day/);
  assert.match(await page.locator('[data-more="gallery"]').innerText(),/Memory image gallery/);
  assert.match(await page.locator('[data-more="lab"]').innerText(),/Word combinations/);
  assert.match(await page.locator('[data-more="book"]').innerText(),/Concept collection/);
  assert.match(await page.locator('[data-more="account"]').innerText(),/Account & sync/);
  assert.match(await page.locator('[data-more="sentences"]').innerText(),/My English sentences/);
  await page.locator('[data-more="sentences"]').click();
  assert.equal(await page.locator('#wv-sentences-view').isVisible(),true);
  await page.locator('#wv-sentence-text').fill('I have went to the market yesterday.');
  await page.locator('#wv-sentence-save').click();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('wordville.sentences.v1')).length),1);
  assert.match(await page.locator('#wv-sentence-list').innerText(),/I have went/);
  await page.reload();
  await page.waitForFunction(()=>window.WordvilleShell&&window.WordvilleWords?.length>100);
  await page.locator('#wv-bottom-dock [data-screen="more"]').click();
  await page.locator('[data-more="sentences"]').click();
  assert.match(await page.locator('#wv-sentence-list').innerText(),/I have went/);
  await page.locator('#wv-sentence-entry-missing').count(); // nonexistent selector is harmless
  await page.locator('.wv-sentence-entry-actions button').first().click();
  assert.equal(await page.locator('#wv-sentence-text').inputValue(),'I have went to the market yesterday.');
  await page.locator('#wv-bottom-dock [data-screen="more"]').click();
  await page.locator('[data-more="lab"]').click();
  assert.equal(await page.locator('#wv-combine-day-a option').count(),31);
  await page.locator('#wv-combine-day-a').selectOption('30');
  await page.locator('#wv-combine-day-b').selectOption('30');
  assert.ok(await page.locator('#word-a option').count()>0);
  assert.ok(await page.locator('#word-b option').count()>0);
  const chosen=await page.evaluate(()=>[document.getElementById('word-a').value,document.getElementById('word-b').value]);
  assert.notEqual(chosen[0],chosen[1]);
  assert.equal(await page.evaluate(()=>WordvilleWords.find(w=>w.id===document.getElementById('word-a').value)?.days?.includes(30)),true);
  await page.locator('#wv-combine-search-a').fill('zz-not-a-real-word');
  assert.equal(await page.locator('#word-a').isDisabled(),true);
  await page.locator('#wv-combine-search-a').fill('');
  assert.equal(await page.locator('#word-a').isEnabled(),true);
  // The duplicate image-search shortcut was removed. The actual search remains.
  assert.equal(await page.locator('#wv-image-search-shortcut').count(),0);
  assert.equal(await page.locator('#wv-memory-search-toggle').count(),1);
  assert.equal(await page.locator('#image-input').getAttribute('multiple'),'');
  assert.ok(await page.locator('.wv-file-pick-name').count()===1);
  await page.evaluate(()=>WordvilleI18n.setLanguage('ja'));
  assert.match(await page.locator('.wv-file-pick-name').innerText(),/画像ファイル/);
  await page.evaluate(()=>WordvilleI18n.setLanguage('zh-CN'));
  assert.match(await page.locator('.wv-file-pick-name').innerText(),/选择图片/);
  // Regression: localization previously caused the migration card to stay outside
  // the Account tab and block every Town/Places/Residents screen.
  for(const locale of ['en','ja','zh-CN','ko']){
   await page.evaluate(value=>WordvilleI18n.setLanguage(value),locale);
   await page.reload();
   await page.waitForFunction(()=>WordvilleShell?.screen&&window.WordvilleWords?.length>100);
   assert.equal(await page.evaluate(()=>document.getElementById('wv-migration-card')?.parentElement?.id),'wv-account-view',
     'The migration card must be placed under Account even when translated before app-shell.js runs: '+locale);
   for(const screen of ['town','places','residents','learn','review']){
    await page.locator('#wv-bottom-dock [data-screen="'+screen+'"]').click();
    assert.equal(await page.evaluate(()=>WordvilleShell.screen),screen);
    const target={town:'#wv-map-view',places:'#wv-places-view',residents:'#wv-residents-view',learn:'#learn',review:'#review'}[screen];
    assert.equal(await page.locator(target).isVisible(),true,screen+' is not displayed ('+locale+')');
    assert.equal(await page.locator('#wv-migration-card').isVisible(),false,
      'Old-account notice leaked into '+screen+' ('+locale+')');
   }
   await page.locator('#wv-bottom-dock [data-screen="more"]').click();
   await page.locator('[data-more="lab"]').click();
   assert.equal(await page.locator('#lab').isVisible(),true);
   await page.locator('#wv-bottom-dock [data-screen="town"]').click();
   assert.equal(await page.locator('#wv-map-view').isVisible(),true);
   assert.equal(await page.locator('#wv-migration-card').isVisible(),false);
   await page.locator('#wv-bottom-dock [data-screen="more"]').click();
   await page.locator('[data-more="account"]').click();
   assert.equal(await page.locator('#wv-migration-card').isVisible(),true);
   await page.locator('#wv-bottom-dock [data-screen="residents"]').click();
   assert.equal(await page.locator('#wv-residents-view').isVisible(),true);
   assert.equal(await page.locator('#wv-migration-card').isVisible(),false);
  }
  assert.deepEqual(exceptions,[]);
  console.log('Sentence journal, Gemini UI, Day 30 picker, localized menus and file picker: OK');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
