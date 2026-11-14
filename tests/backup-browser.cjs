/* Test backup + reinstall-like local wipe + restore without a live account. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const exceptions=[];
 page.on('pageerror',e=>exceptions.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(()=>globalThis.WordvilleBackup&&globalThis.WordvilleStudy&&words.length>0&&db);
  await page.evaluate(()=>WordvilleStudy.ready);
  await page.evaluate(async()=>{
   // A realistic pre-upgrade record: progress, note and legacy image.
   const memory=Wordville.fresh();memory.xp=142;memory.coins=17;
   memory.reviews['voca-resume']={attempts:4,streak:1,due:Date.now()+86400000};
   localStorage.setItem('wordville.rebuilt.v1',JSON.stringify(memory));
   const notes=await new Promise((resolve,reject)=>{
    const req=indexedDB.open('wordville-thought-notes-v1',2);
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   });
   const note=WordvilleNoteModel.blank('voca-resume',1);
   note.notes='이전 버전에서 기록한 필기';note.summary='보존되어야 하는 노트';note.updatedAt=new Date().toISOString();
   await new Promise((resolve,reject)=>{
    const tx=notes.transaction(['entries','status-history'],'readwrite');
    tx.objectStore('entries').put(note);
    tx.objectStore('status-history').add({key:note.key,wordId:note.wordId,day:1,from:null,to:'R',kind:'initial',reason:'이전 기록',occurredAt:new Date().toISOString()});
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
   });
   notes.close();
   const image=new Blob([new Uint8Array([137,80,78,71])],{type:'image/png'});
   await imageAction('put','voca-resume',image);
   const album=await new Promise((resolve,reject)=>{
    const request=indexedDB.open('wordville-memory-album-v1',1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('photos'))request.result.createObjectStore('photos',{keyPath:'id'});};
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
   });
   await new Promise((resolve,reject)=>{
    const tx=album.transaction('photos','readwrite');
    tx.objectStore('photos').put({
      id:'photo:local:voca-resume:old',ownerId:'',wordId:'voca-resume',word:'resume',
      meaning:'이력서',savedAt:new Date().toISOString(),blob:image,source:'내 기기'
    });
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
   });
   album.close();
   const store=new Map();
   globalThis.__backupMockStore=store;
   WordvilleCloud.storage.from=()=>({
    download:async file=>store.has(file)?{data:store.get(file),error:null}:{data:null,error:{statusCode:404,message:'Object not found'}},
    upload:async(file,blob)=>{store.set(file,blob);return {data:{path:file},error:null};}
   });
   document.dispatchEvent(new CustomEvent('wordville-auth',{detail:{id:'12345678-1234-4234-8234-123456789abc'}}));
  });
  await page.waitForFunction(()=>document.querySelector('#wv-backup-state').textContent.includes('서버 백업 없음'));
  await page.locator('#wv-backup-now').click();
  await page.waitForFunction(()=>document.querySelector('#wv-backup-message').textContent.includes('클라우드 백업 완료'),null,{timeout:30000});
  const manifest=await page.evaluate(async()=>{
   const blob=globalThis.__backupMockStore.get('12345678-1234-4234-8234-123456789abc/snapshot.json');
   return JSON.parse(await blob.text());
  });
  assert.equal(manifest.schema,1);
  assert.equal(manifest.entries.length,1);
  assert.equal(manifest.events.length,1);
  assert.equal(manifest.photos.length,1);
  assert.equal(manifest.legacyImages.length,1);
  assert.equal(JSON.parse(manifest.learning['wordville.rebuilt.v1']).xp,142);
  assert.equal(await page.evaluate(()=>globalThis.__backupMockStore.size),3);
  // Simulate app uninstall by removing local WebView data but keeping cloud blobs.
  await page.evaluate(async()=>{
   for(const [databaseName,stores] of [
    ['wordville-thought-notes-v1',['entries','status-history']],
    ['wordville-memory',['images']],
    ['wordville-memory-album-v1',['photos']]
   ]){
    const db=await new Promise((resolve,reject)=>{
     const req=indexedDB.open(databaseName);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
    await new Promise((resolve,reject)=>{
     const tx=db.transaction(stores,'readwrite');
     for(const s of stores)tx.objectStore(s).clear();
     tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });
    db.close();
   }
   localStorage.removeItem('wordville.rebuilt.v1');
  });
  await page.locator('#wv-restore-now').click();
  await page.waitForFunction(()=>globalThis.WordvilleStudy&&WordvilleStudy.ready&&JSON.parse(localStorage.getItem('wordville.rebuilt.v1')||'{}').xp===142,null,{timeout:30000});
  const restored=await page.evaluate(async()=>{
   const read=async(name,store)=>{
    const db=await new Promise((resolve,reject)=>{
     const req=indexedDB.open(name);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
    const items=await new Promise((resolve,reject)=>{
     const tx=db.transaction(store,'readonly'),req=tx.objectStore(store).getAll();
     req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });db.close();return items;
   };
   const entries=await read('wordville-thought-notes-v1','entries');
   const events=await read('wordville-thought-notes-v1','status-history');
   const images=await read('wordville-memory','images');
   const photos=await read('wordville-memory-album-v1','photos');
   return {entry:entries[0]?.notes,summary:entries[0]?.summary,events:events.length,images:images.length,photos:photos.length};
  });
  assert.deepEqual(restored,{entry:'이전 버전에서 기록한 필기',summary:'보존되어야 하는 노트',events:1,images:1,photos:1});
  assert.deepEqual(exceptions,[]);
  console.log('PASS: full backup manifest, owner image paths, old notes and images, local wipe and restore');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});