const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const day='2026-11-20';
const trend={title:'Wordville overseas sample trend',date:day,publishedAt:day+'T09:30:00Z',
 approxTraffic:'20K+',news:[{title:'Sample source',url:'https://news.example.org/story',publisher:'Example News'}]};
const meme={title:'New viral meme coverage example',date:day,publishedAt:day+'T10:00:00Z',
 publisher:'Example Publisher',url:'https://news.google.com/articles/sample'};
const snapshot={schema:1,updatedAt:day+'T11:00:00Z',
 countryUpdatedAt:{US:day+'T11:00:00Z'},
 countries:{US:{[day]:[trend]},GB:{},CA:{},AU:{}},
 memeNews:{US:{[day]:[meme]},GB:{},CA:{},AU:{}}};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.route('https://raw.githubusercontent.com/luckylucyj/wordville-android/trend-data/trends/archive.json**',route=>
   route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(snapshot),
    headers:{'access-control-allow-origin':'*'}}));
  await page.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>globalThis.WordvilleMapNavigation?.setPlaceZoom&&globalThis.WordvilleSocial?.openBoard&&
   globalThis.WordvilleVillage?.zoomAt&&document.querySelector('#wv-pixel-weather'),{timeout:60000});
  // Language change replaces both weather label and all select choices immediately.
  for(const [lang,expected] of [
   ['en',['Pixel weather','Sunny','Windy','Cloudy','Overcast','Rainy']],
   ['zh-CN',['像素天气','晴朗','有风','多云','阴天','下雨']],
   ['ja',['ピクセル天気','晴れ','風','雲','曇り','雨']],
   ['ko',['픽셀 날씨','맑음','바람','구름','흐림','비']]
  ]){
   await page.evaluate(l=>WordvilleI18n.setLanguage(l),lang);
   const labels=await page.evaluate(()=>[
    document.querySelector('#wv-pixel-weather-title').textContent,
    ...[...document.querySelector('#wv-pixel-weather').options].map(o=>o.textContent)]);
   assert.deepEqual(labels,expected,lang);
  }
  await page.evaluate(()=>WordvilleShell.activate('town'));
  // On mobile, 1x uses contain rather than cropping the map.
  const zoomLimits=await page.evaluate(()=>{
   const v=WordvilleVillage;
   v.zoomAt(.75);const low=v.zoom;
   v.zoomAt(3);const high=v.zoom;
   v.zoomAt(1);return {low,high,defaultScale:v.mapView().scale};
  });
  assert.equal(zoomLimits.low,.75);
  assert.equal(zoomLimits.high,3);
  const world=await page.evaluate(()=>{
   const v=WordvilleVillage;
   v.zoomAt(1.7);
   const before=v.mapView();
   v.panBy(-70,-45);
   const after=v.mapView();
   return {scale:after.scale,moved:Math.abs(after.offsetX-before.offsetX)+Math.abs(after.offsetY-before.offsetY),
    limits:after.offsetX<=0&&after.offsetY<=0};
  });
  assert.ok(world.scale>1&&world.moved>20&&world.limits,JSON.stringify(world));
  // 17 locations and all resident homes share the same camera controls.
  await page.evaluate(()=>{WordvilleShell.activate('places');WordvillePlaces.pick('pool');});
  await page.locator('#wv-place-canvas').scrollIntoViewIfNeeded();
  const before=await page.evaluate(()=>WordvilleMapNavigation.placeView());
  assert.equal(before.zoom,1);
  await page.locator('#wv-venue-zoom-controls [data-zoom="in"]').click();
  let zoomed=await page.evaluate(()=>WordvilleMapNavigation.placeView());
  assert.equal(zoomed.zoom,1.25);
  const moved=await page.evaluate(()=>{
   const camera=WordvilleMapNavigation;
   camera.setPlaceZoom(2);
   const a=camera.placeView();
   camera.panPlace(-48,-24);
   const b=camera.placeView();
   return {a,b};
  });
  assert.ok(moved.b.x<moved.a.x||moved.b.y<moved.a.y,'drag translation must reveal other parts of map');
  await page.locator('#wv-venue-zoom-controls [data-zoom="reset"]').click();
  assert.equal(await page.evaluate(()=>WordvilleMapNavigation.placeView().zoom),1);
  await page.evaluate(()=>WordvillePlaces.pick('home','chiikawa'));
  assert.equal(await page.evaluate(()=>WordvilleMapNavigation.placeView().zoom),1);
  await page.evaluate(()=>WordvilleMapNavigation.setPlaceZoom(3));
  assert.equal(await page.evaluate(()=>WordvilleMapNavigation.placeView().zoom),3);
  await page.evaluate(()=>WordvillePlaces.pick('home','hachiware'));
  assert.equal(await page.evaluate(()=>WordvilleMapNavigation.placeView().zoom),1);
  await page.evaluate(()=>{WordvilleShell.activate('town');WordvilleSocial.openBoard();});
  await page.locator('#wv-trend-country').waitFor();
  await page.waitForFunction(()=>document.querySelector('#wv-trends-list')?.textContent?.includes('Wordville overseas sample trend'),{timeout:15000}).catch(()=>{});
  await page.waitForFunction(()=>document.getElementById('wv-town-board')?.textContent?.includes('Wordville overseas sample trend'),null,{timeout:15000});
  assert.equal(await page.locator('#wv-trend-country').inputValue(),'US');
  assert.equal(await page.locator('#wv-trend-date').inputValue(),day);
  await page.locator('#wv-trend-query').fill('overseas');
  assert.equal(await page.locator('.wv-trend-card').count(),1);
  assert.match(await page.locator('#wv-trend-google-search').getAttribute('href'),/trends.google.com/);
  await page.locator('#wv-trend-mode-memes').click();
  await page.locator('#wv-trend-query').fill('viral');
  assert.equal(await page.locator('.wv-trend-card').count(),1);
  assert.match(await page.locator('.wv-trend-card .wv-trends-links a').getAttribute('href'),/news.google.com/);
  assert.match(await page.locator('#wv-trend-google-search').getAttribute('href'),/news.google.com\/search/);
  await page.locator('#wv-trend-date').fill('2026-11-19');
  assert.equal(await page.locator('.wv-trend-card').count(),0,'uncollected historical dates must be blank');
  await page.locator('#wv-trend-mode-instagram').click();
  assert.equal(await page.locator('#wv-trend-date').inputValue(),day);
  await page.locator('#wv-trend-query').fill('viral');
  assert.equal(await page.locator('.wv-trend-card').count(),1);
  const instagramLink=await page.locator('.wv-trend-card .wv-instagram-link').getAttribute('href');
  assert.match(instagramLink,/^https:\/\/www\.instagram\.com\/explore\/search\/keyword\/\?q=/);
  assert.match(await page.locator('#wv-trend-google-search').getAttribute('href'),/instagram\.com/);
  assert.match(await page.locator('#wv-town-board').textContent(),/Instagram/);
  await page.locator('#wv-trend-query').fill('#viral meme');
  assert.match(await page.locator('#wv-trend-google-search').getAttribute('href'),/q=%23viral%20meme/);
  assert.deepEqual(errs,[],'browser must not produce JavaScript runtime exceptions');
  console.log('Wordville browser QA passed: 4 languages, town camera, indoor/home camera, real-versus-meme Google search');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
