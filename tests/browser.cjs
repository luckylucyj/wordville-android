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
  await page.waitForFunction(()=>globalThis.WordvilleWorldArt?.reference?.naturalWidth===840&&Object.values(globalThis.WordvilleWorldArt?.venueImages||{}).length===17&&Object.values(globalThis.WordvilleWorldArt.venueImages).every(x=>x.naturalWidth===640));
  assert.equal(await page.evaluate(()=>WordvilleWorldArt.landmarks.length),17);
  await page.waitForFunction(()=>document.getElementById('wv-loading-cover')?.hidden===true);
  assert.equal(await page.locator('#wv-loading-cover').isVisible(),false);

  assert.equal(await page.evaluate(()=>document.querySelector('#village-canvas').getBoundingClientRect().height>innerHeight*.68),true);
  assert.equal(await page.evaluate(()=>!!globalThis.WordvilleWorldArt?.town),true);
  await page.waitForFunction(()=>globalThis.WordvillePortraits?.image?.complete&&globalThis.WordvillePortraits?.spriteImage?.complete);
  assert.deepEqual(await page.evaluate(()=>({
    portrait:[WordvillePortraits.image.naturalWidth,WordvillePortraits.image.naturalHeight],
    sprites:[WordvillePortraits.spriteImage.naturalWidth,WordvillePortraits.spriteImage.naturalHeight]
  })),{portrait:[1536,1152],sprites:[2560,768]});
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#village-canvas')).imageRendering==='auto'),true);
  await page.waitForFunction(()=>WordvilleWalk?.referenceAtlas?.naturalWidth===384&&WordvilleWalk.referenceAtlas.naturalHeight===576);
  assert.equal(await page.evaluate(()=>WordvilleVillage.residents.length),12);
  assert.equal(await page.evaluate(()=>WordvilleWalk.sourceFrameCount),3);
  assert.equal(await page.evaluate(()=>WordvilleWalk.frameCount),8);
  await page.waitForFunction(()=>WordvilleWalk.petSheets.cat.naturalWidth===128&&WordvilleWalk.petSheets.dog.naturalWidth===128&&WordvilleWalk.petSheets.cat.naturalHeight===192&&WordvilleWalk.petSheets.dog.naturalHeight===192);
  // Read every actual source cell, not just its declared layout. The cat and
  // dog must each provide sixteen distinct frames and a shared ground row.
  const petAudit=await page.evaluate(()=>{
    const report={};
    for(const id of ['cat','dog']){
      const img=WordvilleWalk.petSheets[id],can=document.createElement('canvas');
      can.width=128;can.height=192;
      const ctx=can.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
      const hashes=[],bottoms=[];
      for(const dir of ['down','right','left','up'])for(let f=0;f<4;f++){
        const cell=WordvilleWalk.petCell(id,dir,f);
        const pixels=ctx.getImageData(cell.x,cell.y,32,48).data;
        let hash=2166136261,last=-1;
        for(let k=0;k<pixels.length;k++)hash=Math.imul(hash^pixels[k],16777619)>>>0;
        for(let y=0;y<48;y++)for(let x=0;x<32;x++)if(pixels[(y*32+x)*4+3]>128)last=Math.max(last,y);
        hashes.push(hash);bottoms.push(last);
      }
      report[id]={unique:new Set(hashes).size,bottoms};
    }
    return report;
  });
  for(const id of ['cat','dog']){
    assert.equal(petAudit[id].unique,16,id+' should have 16 distinct images');
    assert.deepEqual(petAudit[id].bottoms,Array(16).fill(44),id+' ground anchors must match');
  }

  await page.waitForFunction(()=>WordvilleWalk.walkAtlas?.width===256&&WordvilleWalk.walkAtlas.height===2304);
  // Verify actual image pixels: 8 distinct frames for each of 12 residents in all 4 directions.
  const duplicateWalkFrames=await page.evaluate(()=>{
   const c=WordvilleWalk.walkAtlas.getContext('2d',{willReadFrequently:true}),bad=[];
   for(let resident=0;resident<12;resident++)for(let dir=0;dir<4;dir++){
    const signatures=[];
    for(let frame=0;frame<8;frame++){
     const pixels=c.getImageData(frame*32,(resident*4+dir)*48,32,48).data;
     let hash=2166136261;
     for(let i=0;i<pixels.length;i++)hash=Math.imul(hash^pixels[i],16777619)>>>0;
     signatures.push(hash);
    }
    if(new Set(signatures).size<2)bad.push({resident,dir,unique:new Set(signatures).size});
   }
   return bad;
  });
  assert.deepEqual(duplicateWalkFrames,[],'Every resident and direction must have real whole-pose variations without cropped body fragments');
  // Verify exactly one canvas per resident, and that the main renderer
  // reads it instead of assembling sliced knees/heads on every draw call.
  const perResidentSheets=await page.evaluate(()=>Object.entries(WordvilleWalk.residentSheets).map(([id,im])=>[id,im.width,im.height]));
  assert.equal(perResidentSheets.length,12);
  for(const [,width,height] of perResidentSheets)assert.deepEqual([width,height],[256,192]);
  // Export quality-control PNGs of every separate prebuilt sheet.
  const fs=require('node:fs'),path=require('node:path');
  const output=path.join(process.cwd(),'wordville-resident-sheets');
  fs.mkdirSync(output,{recursive:true});
  const sheetFiles=await page.evaluate(()=>Object.entries(WordvilleWalk.residentSheets).map(([id,sheet])=>[id,sheet.toDataURL('image/png').split(',')[1]]));
  for(const [id,data] of sheetFiles)fs.writeFileSync(path.join(output,id+'.png'),Buffer.from(data,'base64'));
  await page.screenshot({path:'wordville-resident-walk-qa.png'});

  // Check user-facing preview, including the 12-resident comparison view.
  const walkPreview=page.locator('#wv-walk-preview');
  assert.equal(await walkPreview.count(),1);
  await walkPreview.locator('summary').click();
  assert.equal(await walkPreview.locator('select').count(),2);
  await walkPreview.locator('select').first().selectOption('emily');
  await walkPreview.locator('select').nth(1).selectOption('left');
  assert.equal(await walkPreview.locator('canvas').nth(1).getAttribute('hidden'),'');
  await walkPreview.getByRole('button',{name:'12명 한꺼번에 보기'}).click();
  assert.equal(await walkPreview.locator('canvas').nth(1).getAttribute('hidden'),null);
  assert.equal(await walkPreview.locator('canvas').nth(1).isVisible(),true);
  assert.equal(await walkPreview.locator('canvas').nth(1).getAttribute('width'),'320');
  await walkPreview.locator('summary').click();

  assert.equal(await page.evaluate(()=>WordvilleHubMap.humanDecorations),0);
  await page.waitForFunction(()=>WordvilleHubMap.image.naturalWidth===600&&WordvilleHubMap.image.naturalHeight===800);
  assert.equal(await page.evaluate(()=>VillageModel.links.every(([a,b])=>!VillageModel.segmentHitsFountain(VillageModel.nodes[a],VillageModel.nodes[b]))),true);
  assert.equal(await page.evaluate(()=>VillageModel.links.filter(([a,b])=>VillageModel.isStairEdge(a,b)).length),2);
  await page.locator('#wv-bottom-dock [data-screen="residents"]').click();
  assert.equal(await page.locator('.wv-residents-screen .wv-portrait').count(),12);
  assert.equal(await page.evaluate(()=>WordvillePortraits.spriteCell.frames),4);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.wv-residents-screen .wv-portrait')).imageRendering),'auto');
  await page.screenshot({path:'wordville-portraits-browser.png'});
  await page.locator('#wv-bottom-dock [data-screen="town"]').click();
  // Fullscreen town map zone controls must remain accessible inside the gear menu.
  await page.locator('#wv-map-tools').click();
  assert.equal(await page.locator('#wv-map-tool-panel [data-map-zone]').count(),4);
  await page.locator('#wv-map-tool-panel [data-map-zone="south"]').click();
  assert.equal(await page.evaluate(()=>WordvilleVillage.zone),'south');
  await page.locator('#wv-map-tool-panel [data-map-zone="all"]').click();
  assert.equal(await page.evaluate(()=>WordvilleVillage.zone),'all');
  await page.locator('#wv-map-tools').click();
  // Clicking a map landmark must navigate the entire app to the corresponding venue.
  const visited=await page.evaluate(()=>{
    const c=document.getElementById('village-canvas'),r=c.getBoundingClientRect();
    const s=WordvilleWorldArt.hubLandmarks.find(p=>p.id==='cafe');
    const scale=WordvilleVillage.mapView().scale;
    const v=WordvilleVillage.mapView();
    const x=v.offsetX+s.x*scale;
    const y=v.offsetY+s.y*scale;
    c.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+x/c.width*r.width,clientY:r.top+y/c.height*r.height}));
    return {screen:WordvilleShell.screen,place:WordvillePlaces.active};
  });
  assert.deepEqual(visited,{screen:'places',place:'cafe'});
  await page.evaluate(()=>WordvillePlaces.pick('pool'));
  await page.locator('#wv-bottom-dock [data-screen="town"]').click();
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
  assert.ok(await page.evaluate(()=>getComputedStyle(document.querySelector('.resident-list .wv-portrait')).backgroundImage.includes('wordville-portraits-original.png')));
  assert.ok(await page.evaluate(()=>!!document.querySelector('link[href="stardew-ui.css"]')));
  // Place explorer: map and venue screen are mutually exclusive, not a long vertical list.
  assert.equal(await page.locator('#wv-places-view').isVisible(),false);
  await page.locator('#wv-bottom-dock [data-screen="places"]').click();
  assert.equal(await page.locator('#wv-places-view').isVisible(),true);
  assert.equal(await page.locator('#wv-map-view').isVisible(),false);
  assert.equal(await page.locator('.wv-spotlight').count(),1);
  assert.equal(await page.locator('#wv-place-name').innerText(),'수영장');
  // Exit button routes the resident through the real door; it must not teleport.
  assert.equal(await page.locator('#wv-venue-exit').isVisible(),true);
  await page.evaluate(()=>{
    const m=WordvilleVenueSpec.getMap(WordvilleVenueRuntime.scene);
    const player=WordvilleVenueRuntime.actors[0];
    player.x=m.entrance.x;player.y=m.entrance.y;player.route=[];player.target=null;
  });
  await page.locator('#wv-venue-exit').click();
  assert.equal(await page.evaluate(()=>WordvilleShell.screen),'places');
  await page.waitForFunction(()=>WordvilleShell.screen==='town',null,{timeout:4000});
  await page.locator('#wv-bottom-dock [data-screen="places"]').click();
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
