const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(()=>globalThis.WordvilleShell?.screen==='town'&&document.querySelector('.word'));
  assert.equal(await page.locator('#wv-bottom-dock .wv-dock-tab').count(),6);
  assert.equal(await page.locator('#village-canvas').isVisible(),true);
  assert.equal(await page.evaluate(()=>document.querySelector('#village-canvas').getBoundingClientRect().height>innerHeight*.68),true);
  assert.equal(await page.evaluate(()=>!!globalThis.WordvilleWorldArt?.town),true);
  await page.waitForFunction(()=>globalThis.WordvillePortraits?.image?.complete&&globalThis.WordvillePortraits?.spriteImage?.complete);
  assert.deepEqual(await page.evaluate(()=>({
    portrait:[WordvillePortraits.image.naturalWidth,WordvillePortraits.image.naturalHeight],
    sprites:[WordvillePortraits.spriteImage.naturalWidth,WordvillePortraits.spriteImage.naturalHeight]
  })),{portrait:[320,240],sprites:[256,192]});
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#village-canvas')).imageRendering==='pixelated'||getComputedStyle(document.querySelector('#village-canvas')).imageRendering==='crisp-edges'),true);
  assert.equal(await page.evaluate(()=>WordvilleVillage.residents.length),12);
  await page.locator('#wv-bottom-dock [data-screen="learn"]').click();await page.waitForSelector('.word');
  assert.equal(await page.locator('.word').count(),60);
  assert.equal(await page.evaluate(()=>WordvilleBookOrder.status),'ready');
  assert.equal(await page.locator('.word strong').first().innerText(),'resume');
  await page.locator('#day-filter').selectOption('1');
  assert.equal(await page.locator('.word strong').first().innerText(),'resume');
  await page.locator('#day-filter').selectOption('2');
  assert.equal(await page.locator('.word strong').first().innerText(),'attire');
  await page.locator('#day-filter').selectOption('30');
  assert.equal(await page.locator('.word strong').first().innerText(),'fatigue');
  await page.locator('#day-filter').selectOption('0');
  assert.equal(await page.locator('.word strong').first().innerText(),'across the board');
  await page.locator('#day-filter').selectOption('');
  await page.evaluate(async()=>{
   const alias='voca-l-effect';
   localStorage.setItem('wordville.rebuilt.v1',JSON.stringify({...Wordville.fresh(),reviews:{[alias]:{attempts:4,streak:2,due:123}}}));
   await imageAction('put',alias,new Blob(['legacy-image'],{type:'image/png'}));
  });
  await page.reload();await page.waitForFunction(()=>globalThis.WordvilleShell?.screen==='town');await page.locator('#wv-bottom-dock [data-screen="learn"]').click();await page.waitForSelector('.word');
  assert.equal(await page.evaluate(()=>state.reviews['voca-effect'].attempts),4);
  assert.ok(await page.evaluate(()=>localStorage.getItem('wordville.learning.before-vocabulary-audit')));
  await page.locator('#search').fill('effect');await page.locator('.word').filter({has:page.locator('strong',{hasText:/^effect$/})}).click();
  await page.waitForFunction(()=>!document.querySelector('#memory-image').hidden);
  await page.locator('#remove-image').click();await page.waitForFunction(()=>document.querySelector('#memory-image').hidden);
  assert.equal(await page.evaluate(()=>imageAction('get','voca-l-effect')),undefined);
  await page.locator('#close-dialog').click();await page.locator('#search').fill('');
  const fallback=await page.evaluate(async()=>{
   const original=cloud.storage.from,calls=[];
   cloud.storage.from=()=>({download:async path=>{calls.push(path);return path==='audit-user/voca-l-effect'?{data:new Blob(['cloud-alias']),error:null}:{data:null,error:{message:'missing'}};}});
   try{cloudUser={id:'audit-user'};const image=await readMemoryImage('voca-effect');cloudUser={id:'other-user'};const other=await readMemoryImage('voca-effect');return {text:await image.text(),other:!!other,calls};}
   finally{cloudUser=null;cloud.storage.from=original;}
  });
  assert.equal(fallback.text,'cloud-alias');assert.equal(fallback.other,false);
  assert.deepEqual(fallback.calls,['audit-user/voca-effect','audit-user/voca-l-effect','other-user/voca-effect','other-user/voca-l-effect']);
  await page.evaluate(()=>{localStorage.setItem('wordville.rebuilt.v1',JSON.stringify(Wordville.fresh()));});
  await page.reload();await page.waitForFunction(()=>globalThis.WordvilleShell?.screen==='town');await page.locator('#wv-bottom-dock [data-screen="learn"]').click();await page.waitForSelector('.word');
  const first=await page.locator('.word strong').first().innerText();await page.locator('#next-page').click();assert.notEqual(await page.locator('.word strong').first().innerText(),first);await page.locator('#day-filter').selectOption('2');assert.equal(await page.locator('#page-info').innerText().then(t=>t.startsWith('1 /')),true);await page.locator('#day-filter').selectOption('');
  assert.equal(await page.locator('[data-person]').count(),12);
  await page.waitForFunction(()=>globalThis.WordvillePortraits?.image?.naturalWidth>0);
  assert.equal(await page.locator('.resident-list .wv-portrait').count(),12);
  assert.ok(await page.evaluate(()=>WordvillePortraits.image.naturalWidth>=128));
  assert.ok(await page.evaluate(()=>getComputedStyle(document.querySelector('.resident-list .wv-portrait')).backgroundImage.includes('wordville-portrait-ref.webp')));
  assert.ok(await page.evaluate(()=>!!document.querySelector('link[href="stardew-ui.css"]')));
  // Place explorer: map and venue screen are mutually exclusive, not a long vertical list.
  assert.equal(await page.locator('#wv-places-view').isVisible(),false);
  await page.locator('#wv-bottom-dock [data-screen="places"]').click();
  assert.equal(await page.locator('#wv-places-view').isVisible(),true);
  assert.equal(await page.locator('#wv-map-view').isVisible(),false);
  assert.equal(await page.locator('.wv-spotlight').count(),1);
  assert.equal(await page.locator('#wv-place-name').innerText(),'수영장');
  assert.equal(await page.locator('#wv-place-rail .wv-place-chip').count(),17);
  const poolScene=await page.locator('#wv-place-canvas').evaluate(el=>el.toDataURL());
  assert.equal(await page.locator('#wv-place-canvas').getAttribute('width'),'512');
  await page.locator('#wv-place-filters [data-place-filter="culture"]').click();
  assert.equal(await page.locator('#wv-place-name').innerText(),'미술관');
  const museumScene=await page.locator('#wv-place-canvas').evaluate(el=>el.toDataURL());
  assert.notEqual(poolScene,museumScene);
  await page.locator('#wv-place-filters [data-place-filter="all"]').click();
  // Narrow screen: viewport and venue content must not overflow sideways.
  const venueLayout=await page.evaluate(()=>{
    const rect=s=>document.querySelector(s).getBoundingClientRect();
    const left=rect('#wv-place-prev'),right=rect('#wv-place-next'),rail=rect('#wv-place-rail');
    const residents=[...document.querySelectorAll('.wv-place-person')].map(e=>e.getBoundingClientRect());
    return {overflow:document.documentElement.scrollWidth>window.innerWidth+2,
      arrowOverlap:left.right>rail.left+1||right.left<rail.right-1,
      residentOverlap:residents.length>1&&residents[0].right>residents[1].left+1,
      outside:residents.some(r=>r.right>window.innerWidth+2||r.left<0)};
  });
  assert.equal(venueLayout.overflow,false,JSON.stringify(venueLayout));
  assert.equal(venueLayout.arrowOverlap,false,JSON.stringify(venueLayout));
  assert.equal(venueLayout.residentOverlap,false,JSON.stringify(venueLayout));
  assert.equal(venueLayout.outside,false,JSON.stringify(venueLayout));
  await page.locator('#wv-place-next').click();
  assert.equal(await page.locator('#wv-place-name').innerText(),'목장');
  await page.locator('#wv-place-filters [data-place-filter="leisure"]').click();
  assert.equal(await page.locator('#wv-place-rail .wv-place-chip').count(),2);
  assert.equal(await page.locator('#wv-place-name').innerText(),'수영장');
  await page.locator('#wv-place-prev').click();
  assert.equal(await page.locator('#wv-place-name').innerText(),'헬스장');
  const beforeVenueLine=await page.locator('#wv-place-dialogue-en').innerText();
  await page.locator('#wv-place-talk').click();
  assert.notEqual(await page.locator('#wv-place-dialogue-en').innerText(),beforeVenueLine);
  await page.locator('#wv-place-study').click();
  assert.equal(await page.locator('#detail-word').innerText(),'equipment');
  await page.locator('#close-dialog').click();
  await page.locator('#wv-bottom-dock [data-screen="town"]').click();
  assert.equal(await page.locator('#wv-map-view').isVisible(),true);
  assert.equal(await page.locator('#wv-places-view').isVisible(),false);
  await page.locator('#wv-bottom-dock [data-screen="learn"]').click();

  await page.locator('#search').fill('reservation');assert.ok(await page.locator('.word').count()>=1);
  await page.locator('.word').filter({has:page.locator('strong',{hasText:/^reservation$/})}).click();
  assert.equal(await page.locator('#word-examples-list li').count(),10);
  assert.equal(await page.locator('#word-examples-details').getAttribute('open'),null);
  await page.locator('#word-examples-details summary').click();
  assert.equal(await page.locator('#word-examples-list li').count(),10);
  assert.ok((await page.locator('#word-examples-list li').first().innerText()).includes('reservation'));
  assert.equal(await page.locator('#reveal').getAttribute('aria-expanded'),'false');
  for(let i=0;i<3;i++){await page.locator('#reveal').click();assert.equal(await page.locator('#detail-meaning').isVisible(),i%2===0);assert.equal(await page.locator('#reveal').innerText(),i%2===0?'뜻 숨기기':'뜻 보기');}
  await page.locator('#image-input').setInputFiles({name:'memory.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
  await page.waitForFunction(()=>document.querySelector('#detail-status').textContent.includes('기기에 저장'));
  await page.locator('#learned').click();await page.locator('#close-dialog').click();
  await page.locator('#wv-bottom-dock [data-screen="review"]').click();await page.locator('#start-review').click();const correctAnswer=await page.evaluate(()=>reviewWord.meaning.split(/[;,/]/)[0].trim());await page.locator('#answer').fill(correctAnswer);await page.locator('#answer-form button').click();assert.match(await page.locator('#balance').innerText(),/10 XP/);
  await page.locator('#wv-bottom-dock [data-screen="more"]').click();await page.locator('[data-more="lab"]').click();await page.locator('#concept-name').fill('호텔 청구');await page.locator('#combine-form .primary').click();await page.locator('#wv-bottom-dock [data-screen="more"]').click();await page.locator('[data-more="book"]').click();assert.match(await page.locator('#concepts').innerText(),/호텔 청구/);
  await page.reload();await page.waitForFunction(()=>globalThis.WordvilleShell?.screen==='town');await page.locator('#wv-bottom-dock [data-screen="learn"]').click();await page.waitForSelector('.word');assert.match(await page.locator('#balance').innerText(),/25 XP/);
  await page.locator('#search').fill('reservation');await page.locator('.word').filter({has:page.locator('strong',{hasText:/^reservation$/})}).click();await page.waitForFunction(()=>!document.querySelector('#memory-image').hidden);await page.locator('#remove-image').click();await page.waitForFunction(()=>document.querySelector('#memory-image').hidden);await page.locator('#close-dialog').click();await page.locator('#search').fill('');
  await page.locator('#wv-bottom-dock [data-screen="town"]').click();await page.locator('#wv-map-tools').click();
  await page.locator('#village-time-mode').selectOption('night');assert.equal(await page.evaluate(()=>WordvilleVillage.period),'night');
  await page.locator('#village-time-mode').selectOption('day');assert.equal(await page.evaluate(()=>WordvilleVillage.period),'day');
  await page.locator('#village-time-mode').selectOption('auto');assert.equal(await page.evaluate(()=>WordvilleVillage.period===VillageModel.period(new Date().getHours())),true);
  await page.locator('#wv-bottom-dock [data-screen="residents"]').click();if(!(await page.locator('.neighbors').evaluate(el=>el.open)))await page.locator('.neighbors').evaluate(el=>el.open=true);await page.locator('[data-person="alex"]').click();assert.equal(await page.locator('#speaker').innerText(),'알렉스');assert.equal(await page.locator('.village-dialogue .wv-dialog-portrait').count(),1);await page.locator('#resident-study').click();assert.equal(await page.locator('#detail-word').innerText(),'attend');await page.locator('#close-dialog').click();
  const before=await page.evaluate(()=>WordvilleVillage.residents.map(p=>[p.x,p.y]));await page.waitForTimeout(1600);assert.notDeepEqual(await page.evaluate(()=>WordvilleVillage.residents.map(p=>[p.x,p.y])),before);
  await page.locator('#wv-bottom-dock [data-screen="town"]').click();await page.locator('#wv-map-tools').click();
  await page.locator('#pause-village').click();const stopped=await page.evaluate(()=>WordvilleVillage.residents.map(p=>[p.x,p.y]));await page.waitForTimeout(250);assert.deepEqual(await page.evaluate(()=>WordvilleVillage.residents.map(p=>[p.x,p.y])),stopped);await page.locator('#pause-village').click();
  await page.waitForFunction(()=>WordvilleVillage.conversations>0,{},{timeout:25000});
  for(const width of [360,390,768,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${width}`);}
  await page.setViewportSize({width:1280,height:1000});await page.locator('#wv-bottom-dock [data-screen="town"]').click();if(await page.locator('#wv-map-tool-panel').isHidden())await page.locator('#wv-map-tools').click();await page.locator('#village-time-mode').selectOption('day');await page.screenshot({path:process.env.WORDVILLE_SCREENSHOT_DIR?`${process.env.WORDVILLE_SCREENSHOT_DIR}/wordville-day.png`:'/tmp/wordville-day.png',fullPage:true});
  await page.locator('#village-time-mode').selectOption('night');await page.screenshot({path:process.env.WORDVILLE_SCREENSHOT_DIR?`${process.env.WORDVILLE_SCREENSHOT_DIR}/wordville-night.png`:'/tmp/wordville-night.png',fullPage:true});
  await page.locator('#wv-bottom-dock [data-screen="learn"]').click();await page.locator('#day-filter').selectOption('30');await page.locator('#search').fill('zzzz-no-result');assert.equal(await page.locator('.word').count(),0);assert.equal(await page.locator('#next-page').isDisabled(),true);await page.locator('#wv-bottom-dock [data-screen="review"]').click();await page.locator('#start-review').click();assert.match(await page.locator('#question').innerText(),/마쳤/);await page.locator('#wv-bottom-dock [data-screen="learn"]').click();await page.locator('#search').fill('');await page.locator('#day-filter').selectOption('1');await page.locator('.word').first().click();assert.match(await page.locator('#detail-source').innerText(),/Day 1.*PDF/);await page.locator('#close-dialog').click();await page.locator('#wv-bottom-dock [data-screen="review"]').click();await page.locator('#review-limit').selectOption('40');await page.locator('#start-review').click();assert.equal(await page.evaluate(()=>queue.length),39);assert.ok(await page.evaluate(()=>queue.every(w=>w.days.includes(1))));assert.deepEqual(errors,[]);
  console.log('PASS: repeated meaning toggle, image save/reload/delete, reviews, concepts, twelve residents, movement/pause/conversations, day/night/auto, four screen widths.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
