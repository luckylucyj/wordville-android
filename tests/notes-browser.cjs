const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(()=>globalThis.WordvilleStudy&&globalThis.WordvilleShell&&words.length>0);
  assert.equal(await page.evaluate(()=>WordvilleStudy.ready),true);
  await page.locator('#wv-bottom-dock [data-screen="learn"]').click();
  await page.locator('#day-filter').selectOption('1');
  const resume=page.locator('.wv-word-item').filter({has:page.locator('.word strong',{hasText:/^resume$/})});
  assert.equal(await resume.count(),1);
  await resume.locator('.wv-word-status').click();
  assert.equal(await page.locator('#wv-status-dialog').isVisible(),true);
  assert.equal(await page.locator('#wv-status-day').inputValue(),'1');
  await page.locator('#wv-status-dialog input[value="learning"]').check();
  await page.locator('#wv-status-form button[type="submit"]').click();
  await page.waitForFunction(()=>WordvilleStudy.get(words.find(w=>w.word==='resume'),1).status==='learning');
  assert.match(await resume.locator('.wv-word-status').innerText(),/학습 중/);
  await resume.locator('.wv-word-note').click();
  assert.equal(await page.locator('#wv-note-dialog').isVisible(),true);
  for(const [id,val] of [
   ['wv-note-overview','채용 관련 기본 용어'],['wv-note-topic','resume · 이력서'],
   ['wv-note-category','취업과 지원 서류'],['wv-note-body','I updated my résumé.\n입사 지원 전에 이력서를 업데이트했다.'],
   ['wv-note-opinion','cover letter와의 차이가 궁금하다.'],['wv-note-summary','이력서를 의미하며 지원할 때 자주 사용한다.']
  ])await page.locator('#'+id).fill(val);
  await page.locator('#wv-note-dialog [data-check="0"]').check();
  await page.locator('#wv-note-dialog [data-check="2"]').check();
  await page.locator('#wv-note-save').click();
  await page.waitForFunction(()=>WordvilleStudy.get(words.find(w=>w.word==='resume'),1).summary.includes('이력서를 의미'));
  assert.match(await page.locator('#wv-note-message').innerText(),/저장 완료/);
  await page.locator('#wv-note-close').click();
  await page.locator('#day-filter').selectOption('2');
  const attire=page.locator('.wv-word-item').filter({has:page.locator('.word strong',{hasText:/^attire$/})});
  assert.equal(await attire.count(),1);
  await attire.locator('.wv-word-status').click();
  assert.equal(await page.locator('#wv-status-day').inputValue(),'2');
  await page.locator('#wv-status-dialog input[value="review"]').check();
  await page.locator('#wv-status-form button[type="submit"]').click();
  await page.waitForFunction(()=>WordvilleStudy.get(words.find(w=>w.word==='attire'),2).status==='review');
  await page.locator('#day-filter').selectOption('1');
  assert.match(await resume.locator('.wv-word-status').innerText(),/학습 중/);
  assert.match(await page.locator('#wv-day-status-summary').innerText(),/학습 중 1/);
  await page.locator('#wv-status-filter').selectOption('learning');
  assert.equal(await resume.count(),1);
  await page.locator('#wv-status-filter').selectOption('review');
  assert.equal(await resume.count(),0);
  await page.locator('#wv-status-filter').selectOption('all');
  await page.reload();
  await page.waitForFunction(()=>WordvilleStudy?.ready&&words.length>0);
  await page.evaluate(()=>WordvilleStudy.ready);
  await page.locator('#wv-bottom-dock [data-screen="learn"]').click();
  await page.locator('#day-filter').selectOption('1');
  assert.match(await resume.locator('.wv-word-status').innerText(),/학습 중/);
  await resume.locator('.wv-word-note').click();
  assert.equal(await page.locator('#wv-note-summary').inputValue(),'이력서를 의미하며 지원할 때 자주 사용한다.');
  assert.equal(await page.locator('#wv-note-opinion').inputValue(),'cover letter와의 차이가 궁금하다.');
  assert.equal(await page.locator('#wv-note-dialog [data-check="2"]').isChecked(),true);
  await page.locator('#wv-note-close').click();
  await page.locator('#wv-open-day-notes').click();
  assert.equal(await page.evaluate(()=>WordvilleShell.screen),'notes');
  assert.equal(await page.locator('#wv-notes-day').inputValue(),'1');
  assert.equal(await page.locator('#wv-note-archive-list article').count(),1);
  assert.match(await page.locator('#wv-note-archive-list').innerText(),/resume/);
  await page.locator('#wv-notes-day').selectOption('2');
  assert.equal(await page.locator('#wv-note-archive-list article').count(),1);
  assert.match(await page.locator('#wv-note-archive-list').innerText(),/attire/);
  const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,buttons:document.querySelectorAll('#wv-note-archive-list article button').length}));
  assert.equal(layout.overflow,false);
  assert.equal(layout.buttons,2);
  await page.locator('#wv-note-archive-list article button').first().click();
  assert.equal(await page.locator('#wv-note-dialog').isVisible(),true);
  await page.locator('#wv-note-close').click();
  for(const width of [360,390,768]){
   await page.setViewportSize({width,height:900});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'page overflow '+width);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: status popup, note seven fields, checkboxes, Day isolation, reload persistence, archive and mobile widths');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
