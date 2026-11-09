const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173');await page.waitForSelector('.word');
  assert.equal(await page.locator('.word').count(),60);
  const first=await page.locator('.word strong').first().innerText();await page.locator('#next-page').click();assert.notEqual(await page.locator('.word strong').first().innerText(),first);await page.locator('#day-filter').selectOption('2');assert.equal(await page.locator('#page-info').innerText().then(t=>t.startsWith('1 /')),true);await page.locator('#day-filter').selectOption('');
  assert.equal(await page.locator('[data-person]').count(),12);
  await page.locator('#search').fill('reservation');assert.ok(await page.locator('.word').count()>=1);
  await page.locator('.word').filter({has:page.locator('strong',{hasText:/^reservation$/})}).click();
  assert.equal(await page.locator('#reveal').getAttribute('aria-expanded'),'false');
  for(let i=0;i<3;i++){await page.locator('#reveal').click();assert.equal(await page.locator('#detail-meaning').isVisible(),i%2===0);assert.equal(await page.locator('#reveal').innerText(),i%2===0?'뜻 숨기기':'뜻 보기');}
  await page.locator('#image-input').setInputFiles({name:'memory.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
  await page.waitForFunction(()=>document.querySelector('#detail-status').textContent.includes('기기에 저장'));
  await page.locator('#learned').click();await page.locator('#close-dialog').click();
  await page.locator('[data-tab="review"]').click();await page.locator('#start-review').click();await page.locator('#answer').fill('예약');await page.locator('#answer-form button').click();assert.match(await page.locator('#balance').innerText(),/10 XP/);
  await page.locator('[data-tab="lab"]').click();await page.locator('#concept-name').fill('호텔 청구');await page.locator('#combine-form .primary').click();await page.locator('[data-tab="book"]').click();assert.match(await page.locator('#concepts').innerText(),/호텔 청구/);
  await page.reload();await page.waitForSelector('.word');assert.match(await page.locator('#balance').innerText(),/25 XP/);
  await page.locator('#search').fill('reservation');await page.locator('.word').filter({has:page.locator('strong',{hasText:/^reservation$/})}).click();await page.waitForFunction(()=>!document.querySelector('#memory-image').hidden);await page.locator('#remove-image').click();await page.waitForFunction(()=>document.querySelector('#memory-image').hidden);await page.locator('#close-dialog').click();await page.locator('#search').fill('');
  await page.locator('#village-time-mode').selectOption('night');assert.equal(await page.evaluate(()=>WordvilleVillage.period),'night');
  await page.locator('#village-time-mode').selectOption('day');assert.equal(await page.evaluate(()=>WordvilleVillage.period),'day');
  await page.locator('#village-time-mode').selectOption('auto');assert.equal(await page.evaluate(()=>WordvilleVillage.period===VillageModel.period(new Date().getHours())),true);
  await page.locator('.neighbors summary').click();await page.locator('[data-person="alex"]').click();assert.equal(await page.locator('#speaker').innerText(),'알렉스');await page.locator('#resident-study').click();assert.equal(await page.locator('#detail-word').innerText(),'attend');await page.locator('#close-dialog').click();
  const before=await page.evaluate(()=>WordvilleVillage.residents.map(p=>[p.x,p.y]));await page.waitForTimeout(1600);assert.notDeepEqual(await page.evaluate(()=>WordvilleVillage.residents.map(p=>[p.x,p.y])),before);
  await page.locator('#pause-village').click();const stopped=await page.evaluate(()=>WordvilleVillage.residents.map(p=>[p.x,p.y]));await page.waitForTimeout(250);assert.deepEqual(await page.evaluate(()=>WordvilleVillage.residents.map(p=>[p.x,p.y])),stopped);await page.locator('#pause-village').click();
  await page.waitForFunction(()=>WordvilleVillage.conversations>0,{},{timeout:25000});
  for(const width of [360,390,768,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${width}`);}
  await page.setViewportSize({width:1280,height:1000});await page.locator('#village-time-mode').selectOption('day');await page.screenshot({path:process.env.WORDVILLE_SCREENSHOT_DIR?`${process.env.WORDVILLE_SCREENSHOT_DIR}/wordville-day.png`:'/tmp/wordville-day.png',fullPage:true});
  await page.locator('#village-time-mode').selectOption('night');await page.screenshot({path:process.env.WORDVILLE_SCREENSHOT_DIR?`${process.env.WORDVILLE_SCREENSHOT_DIR}/wordville-night.png`:'/tmp/wordville-night.png',fullPage:true});
  await page.locator('[data-tab="learn"]').click();await page.locator('#day-filter').selectOption('30');await page.locator('#search').fill('zzzz-no-result');assert.equal(await page.locator('.word').count(),0);assert.equal(await page.locator('#next-page').isDisabled(),true);await page.locator('[data-tab="review"]').click();await page.locator('#start-review').click();assert.match(await page.locator('#question').innerText(),/마쳤/);await page.locator('[data-tab="learn"]').click();await page.locator('#search').fill('');await page.locator('#day-filter').selectOption('1');await page.locator('.word').first().click();assert.match(await page.locator('#detail-source').innerText(),/Day 1.*PDF/);await page.locator('#close-dialog').click();await page.locator('[data-tab="review"]').click();await page.locator('#review-limit').selectOption('40');await page.locator('#start-review').click();assert.equal(await page.evaluate(()=>queue.length),39);assert.ok(await page.evaluate(()=>queue.every(w=>w.days.includes(1))));assert.deepEqual(errors,[]);
  console.log('PASS: repeated meaning toggle, image save/reload/delete, reviews, concepts, twelve residents, movement/pause/conversations, day/night/auto, four screen widths.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
