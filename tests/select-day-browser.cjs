// Regression: submitting the word search must not erase a selected Day.
// Runs in the same Android-sized mobile browser as the other UI tests.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const boot=()=>page.waitForFunction(()=>globalThis.WordvilleWords?.length>5000&&
  !!globalThis.WordvilleShell&&document.querySelector('#day-filter option[value="30"]'),
  {timeout:30000});
 const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('wordville.word-tab.view.v1')||'null'));
 try{
  await page.goto('http://127.0.0.1:4173');
  await boot();
  await page.locator('#wv-bottom-dock [data-screen="learn"]').click();
  await page.locator('#day-filter').selectOption('30');
  await page.locator('#search').fill('fatigue');
  await page.waitForFunction(()=>document.querySelector('#words .word strong')?.textContent==='fatigue');
  // The Search button previously set day-filter.value='' and saved that reset.
  await page.locator('#wv-word-search-form button[type="submit"]').click();
  assert.equal(await page.locator('#day-filter').inputValue(),'30','Search button must retain Day 30');
  assert.equal(await page.locator('#search').inputValue(),'fatigue');
  assert.equal(await page.locator('#words .word strong').first().innerText(),'fatigue');
  assert.equal((await snapshot()).day,'30','Search must persist the selected Day, not All Days');
  // Clearing search and submitting with the keyboard must also retain Day.
  await page.locator('#search').fill('');
  await page.waitForFunction(()=>document.querySelector('#words .word strong')?.textContent==='fatigue');
  assert.equal(await page.locator('#day-filter').inputValue(),'30','Clear query must retain Day 30');
  await page.locator('#search').fill('fatigue');
  await page.locator('#search').press('Enter');
  assert.equal(await page.locator('#day-filter').inputValue(),'30','Keyboard submit must retain Day');
  // The learning-status dropdown and PDF scope should not be erased by Search.
  await page.locator('#wv-status-filter').selectOption('N');
  await page.locator('#wv-word-search-form button[type="submit"]').click();
  assert.equal(await page.locator('#wv-status-filter').inputValue(),'N');
  assert.equal(await page.locator('#day-filter').inputValue(),'30');
  assert.equal((await snapshot()).day,'30');
  assert.equal((await snapshot()).status,'N');
  // Even another screen and a cold WebView reload preserve the user's selection.
  await page.locator('#wv-bottom-dock [data-screen="town"]').click();
  await page.locator('#wv-bottom-dock [data-screen="learn"]').click();
  assert.equal(await page.locator('#day-filter').inputValue(),'30');
  await page.reload();await boot();
  await page.locator('#wv-bottom-dock [data-screen="learn"]').click();
  assert.equal(await page.locator('#day-filter').inputValue(),'30');
  assert.equal(await page.locator('#wv-status-filter').inputValue(),'N');
  assert.equal(await page.locator('#search').inputValue(),'fatigue');
  assert.deepEqual(errors,[]);
  console.log('PASS: Select Day and status survive input, Search tap, Enter, query clear, navigation and WebView reload');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
