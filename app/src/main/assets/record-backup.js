/* Durable Wordville backup across app uninstall/reinstall.
 * Logged-in owner-only Supabase Storage. Legacy IndexedDB/localStorage is never
 * dropped or restructured by backup. Cloud snapshot published LAST.
 */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const BUCKET='wordville-backups', MANIFEST='snapshot.json';
 const LEARNING='wordville.rebuilt.v1',WORD_TAB='wordville.word-tab.view.v1';
 const VISIBLE_FIELDS=['wordville.rebuilt.v1','wordville.word-tab.view.v1','wordville.last-learning-tab.v1'];
 const MAX_IMAGE=5*1024*1024;
 const ALLOWED=new Set(['image/png','image/jpeg','image/webp','image/gif']);
 const client=globalThis.WordvilleCloud;
 let ownerId='',busy=false,initialized=false,remote=null,remoteVersion='',timer=null,revision=0,muted=false,sessionToken=0,dirty=false;
 const message=$('wv-backup-message'),status=$('wv-backup-state'),backupButton=$('wv-backup-now'),restoreButton=$('wv-restore-now');
 const storage=()=>client.storage.from(BUCKET);
 const say=text=>{message.textContent=text;};
 const path=uid=>uid+'/'+MANIFEST;
 const safeISO=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
 const getLocal=key=>{try{return localStorage.getItem(key)||'';}catch{return '';}};
 function validateLearning(raw){
  try{
   const s=JSON.parse(raw);
   return s&&s.version===1&&Number.isFinite(s.xp)&&s.xp>=0&&Number.isFinite(s.coins)&&s.coins>=0&&s.reviews&&typeof s.reviews==='object'&&!Array.isArray(s.reviews)&&Array.isArray(s.concepts);
  }catch{return false;}
 }
 function openDb(name,version=null){
  return new Promise((resolve,reject)=>{
   const req=version?indexedDB.open(name,version):indexedDB.open(name);
   req.onupgradeneeded=()=>{
    // Only create known stores; never delete or rewrite older data.
    for(const [store,option] of (name==='wordville-memory'?[['images',undefined]]:name==='wordville-memory-album-v1'?[['photos',{keyPath:'id'}]]:[['entries',{keyPath:'key'}],['status-history',{keyPath:'id',autoIncrement:true}]])){
     if(!req.result.objectStoreNames.contains(store))req.result.createObjectStore(store,option);
    }
   };
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>reject(req.error||new Error('기기 저장소 열기 실패: '+name));
  });
 }
 function readStore(db,store,operation='getAll'){
  return new Promise((resolve,reject)=>{
   if(!db.objectStoreNames.contains(store))return resolve([]);
   const tx=db.transaction(store,'readonly'),req=tx.objectStore(store)[operation]();
   req.onsuccess=()=>resolve(req.result||[]);
   req.onerror=()=>reject(req.error||new Error('기기 기록을 읽지 못했습니다.'));
  });
 }
 function writeStore(db,store,items){
  return new Promise((resolve,reject)=>{
   if(!items.length)return resolve();
   const tx=db.transaction(store,'readwrite'),object=tx.objectStore(store);
   for(const item of items){
    if(store==='images')object.put(item.blob,item.key);
    else object.put(item);
   }
   tx.oncomplete=resolve;
   tx.onerror=()=>reject(tx.error||new Error('복원 저장 실패'));
   tx.onabort=()=>reject(tx.error||new Error('복원이 중단되었습니다.'));
  });
 }
 async function deviceSnapshot(){
  const learning={};
  for(const k of VISIBLE_FIELDS)learning[k]=getLocal(k);
  // Last view is stored in both WebView and Android native preferences.
  try{if(!learning[WORD_TAB])learning[WORD_TAB]=globalThis.WordvilleSettings?.getWordView()||'';}catch{}
  const notesDb=await openDb('wordville-thought-notes-v1',2);
  const memoryDb=await openDb('wordville-memory',1);
  const albumDb=await openDb('wordville-memory-album-v1',1);
  try{
   const [entries,events,legacyKeys,photos]=await Promise.all([
    readStore(notesDb,'entries'),readStore(notesDb,'status-history'),readStore(memoryDb,'images','getAllKeys'),readStore(albumDb,'photos')
   ]);
   const legacyImages=[];
   for(const key of legacyKeys){
    const blob=await new Promise((resolve,reject)=>{
     const transaction=memoryDb.transaction('images','readonly'),req=transaction.objectStore('images').get(key);
     req.onsuccess=()=>resolve(req.result);
     req.onerror=()=>reject(req.error||new Error('기억 이미지 읽기 실패'));
    });
    if(blob instanceof Blob)legacyImages.push({key:String(key),blob});
   }
   return {learning,entries,events,photos,legacyImages};
  }finally{notesDb.close();memoryDb.close();albumDb.close();}
 }
 function hasRecords(s){
  const raw=s.learning[LEARNING];
  let learning=false;
  if(validateLearning(raw)){
   const parsed=JSON.parse(raw);
   learning=parsed.xp>0||parsed.coins>0||Object.keys(parsed.reviews).length>0||parsed.concepts.length>0;
  }
  return learning||!!s.entries.length||!!s.events.length||!!s.photos.length||!!s.legacyImages.length;
 }
 function mediaPath(uid,section,name,blob){
  const nameHash=Array.from(new TextEncoder().encode(section+':'+name)).map(b=>b.toString(16).padStart(2,'0')).join('');
  // All keys consist of owner-owned app data; hex path cannot traverse storage directories.
  const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'}[blob.type];
  return uid+'/photos/'+section+'/'+nameHash+'.'+ext;
 }
 function validImage(blob){return blob instanceof Blob&&ALLOWED.has(blob.type)&&blob.size>0&&blob.size<=MAX_IMAGE;}
 function ensureOwner(uid){
  if(!uid||uid!==ownerId)throw new Error('백업 도중 로그인 계정이 바뀌었습니다.');
 }
 async function readRemote(uid){
  ensureOwner(uid);
  const {data,error}=await storage().download(path(uid));
  if(error){
   if(error.statusCode===404||error.status===404||/not found|object not found/i.test(error.message||''))return null;
   throw new Error('서버 백업 확인 실패: '+error.message);
  }
  if(!data||data.size>MAX_IMAGE)throw new Error('서버 백업 파일이 올바르지 않습니다.');
  const doc=JSON.parse(await data.text());
  if(doc.schema!==1||doc.ownerId!==uid||!Array.isArray(doc.photos)||!Array.isArray(doc.legacyImages)||!Array.isArray(doc.entries)||!Array.isArray(doc.events)||!doc.learning||!safeISO(doc.savedAt))
   throw new Error('서버 백업 형식이 올바르지 않습니다.');
  return doc;
 }
 function readOnlySummary(doc){return doc?'서버 백업: '+new Date(doc.savedAt).toLocaleString('ko-KR')+' · 노트 '+doc.entries.length+'건 · 이미지 '+(doc.photos.length+doc.legacyImages.length)+'장':'서버 백업 없음';}
 function present(){status.textContent=ownerId?readOnlySummary(remote):'로그인하면 백업 및 복원을 사용할 수 있습니다.';}
 function controls(){backupButton.disabled=restoreButton.disabled=busy||!ownerId;}
 async function upload(uid,blob,target,ctype,upsert=true){
  ensureOwner(uid);
  const {error}=await storage().upload(target,blob,{upsert,contentType:ctype,cacheControl:'60'});
  if(error)throw new Error('서버 저장 실패: '+error.message);
 }
 // Auto backup never overwrites a snapshot created by another device.
 async function backup(manual=false){
  if(busy||!ownerId)return;
  const uid=ownerId;
  busy=true;controls();
  try{
   await globalThis.WordvilleStudy?.ready;
   const local=await deviceSnapshot();
   if(!manual&&!hasRecords(local))return;
   const latest=await readRemote(uid);
   // New install, or another device wrote to cloud since this session last read.
   if(latest&&latest.savedAt!==remoteVersion){
    remote=latest;present();
    throw new Error('다른 기기 또는 이전 설치의 백업이 있습니다. 자동 덮어쓰기를 중단했습니다. 먼저 복원 상태를 확인하세요.');
   }
   if(manual&&latest&&latest.savedAt!==remoteVersion){
    throw new Error('서버 백업이 갱신되었습니다. 기록을 확인한 뒤 다시 백업하세요.');
   }
   if(!manual&&!dirty&&latest)return;
   const images=[];
   const convert=async(section,values,select)=>{
    for(const item of values){
     ensureOwner(uid);
     const id=select(item),blob=item.blob;
     if(!validImage(blob))throw new Error('이미지의 형식이나 크기가 맞지 않습니다: '+id);
     const file=mediaPath(uid,section,id,blob);
     const previous=(section==='album'?latest?.photos:latest?.legacyImages)?.find(v=>v.id===id);
     if(!previous||previous.size!==blob.size||previous.type!==blob.type||previous.lastModified!==Number(blob.lastModified||0))
      await upload(uid,blob,file,blob.type);
     images.push({id,file,size:blob.size,type:blob.type,lastModified:Number(blob.lastModified||0),
      ...(section==='album'?{
       ownerId:item.ownerId||'',wordId:item.wordId,word:item.word,meaning:item.meaning,savedAt:item.savedAt,
       source:item.source,sourceUrl:item.sourceUrl,license:item.license,author:item.author
      }:{})});
    }
    return images.splice(0);
   };
   const photos=await convert('album',local.photos,x=>x.id);
   const legacyImages=await convert('legacy',local.legacyImages,x=>x.key);
   ensureOwner(uid);
   const savedAt=new Date().toISOString();
   const doc={schema:1,ownerId:uid,savedAt,learning:local.learning,entries:local.entries,events:local.events,photos,legacyImages};
   const blob=new Blob([JSON.stringify(doc)],{type:'application/json'});
   if(blob.size>MAX_IMAGE)throw new Error('노트 백업 크기가 5MB를 초과했습니다. 서버 백업을 덮어쓰지 않았습니다.');
   // Publish the new snapshot only after every image has been safely uploaded.
   await upload(uid,blob,path(uid),'application/json');
   remote=doc;remoteVersion=savedAt;dirty=false;present();
   say('클라우드 백업 완료 · '+new Date(savedAt).toLocaleString('ko-KR')+' · 노트 '+local.entries.length+'건 · 이미지 '+(photos.length+legacyImages.length)+'장');
  }catch(error){say('백업 실패 · '+error.message);}
  finally{busy=false;controls();}
 }
 async function downloadImage(uid,entry){
  const expected=uid+'/photos/';
  if(!entry.file.startsWith(expected)||entry.file.includes('..'))throw new Error('허용되지 않은 이미지 백업 경로입니다.');
  const {data,error}=await storage().download(entry.file);
  if(error)throw new Error('이미지 복원 실패: '+error.message);
  if(!validImage(data)||data.size!==entry.size||data.type!==entry.type)throw new Error('이미지 백업 파일이 손상되었거나 일치하지 않습니다.');
  return data;
 }
 async function restore(automatic=false){
  if(busy||!ownerId)return;
  const uid=ownerId;busy=true;controls();muted=true;
  try{
   await globalThis.WordvilleStudy?.ready;
   const server=await readRemote(uid);
   if(!server)throw new Error('클라우드 백업이 없습니다. 기록이 있는 앱에서 먼저 백업하세요.');
   const local=await deviceSnapshot();
   if(hasRecords(local)){
    if(automatic){
     say('이 기기에도 기록이 있습니다. 충돌을 막기 위해 자동 복원을 중단했습니다. 서버와 기기 기록을 확인한 뒤 복원 버튼을 선택하세요.');
     return;
    }
    if(!confirm('현재 기기에 저장된 노트·이미지·학습 기록이 서버 백업 기록으로 바뀔 수 있습니다. 먼저 중요한 기록을 별도로 보관하세요. 서버 백업을 복원하시겠습니까?'))return;
   }
   if(server.learning[LEARNING]&&!validateLearning(server.learning[LEARNING]))throw new Error('서버 학습 기록이 올바르지 않습니다.');
   // Download and validate EVERYTHING before making any changes to local records.
   const images=[];
   for(const item of [...server.photos,...server.legacyImages]){
    ensureOwner(uid);images.push(await downloadImage(uid,item));
   }
   ensureOwner(uid);
   const notesDb=await openDb('wordville-thought-notes-v1',2);
   const albumDb=await openDb('wordville-memory-album-v1',1);
   const memoryDb=await openDb('wordville-memory',1);
   try{
    const photoItems=server.photos.map((photo,i)=>({
     ...photo, id:photo.id,ownerId:uid,blob:images[i]
    }));
    const oldItems=server.legacyImages.map((image,i)=>{
     let key=image.id;
     // Old guest photos become available to the authenticated owner on the new install.
     if(!key.includes('/'))key=uid+'/'+key;
     return {key,blob:images[server.photos.length+i]};
    });
    await writeStore(notesDb,'entries',server.entries);
    await writeStore(notesDb,'status-history',server.events);
    await writeStore(albumDb,'photos',photoItems);
    await writeStore(memoryDb,'images',oldItems);
   }finally{notesDb.close();albumDb.close();memoryDb.close();}
   for(const k of VISIBLE_FIELDS)if(typeof server.learning[k]==='string'&&server.learning[k]){
    localStorage.setItem(k,server.learning[k]);
   }
   try{
    if(server.learning[WORD_TAB])globalThis.WordvilleSettings?.saveWordView(server.learning[WORD_TAB]);
   }catch{}
   remote=server;remoteVersion=server.savedAt;dirty=false;
   say('복원 완료 · 앱 화면을 새로 불러옵니다.');
   location.reload();
  }catch(error){say('복원 실패 · '+error.message);}
  finally{muted=false;busy=false;controls();}
 }
 function schedule(){
  if(muted||!ownerId)return;
  dirty=true;revision++;
  if(timer)clearTimeout(timer);
  timer=setTimeout(()=>{timer=null;backup(false);},12000);
 }
 async function identity(uid){
  const token=++sessionToken;
  if(timer)clearTimeout(timer);timer=null;
  ownerId=uid||'';remote=null;remoteVersion='';dirty=false;controls();present();
  if(!ownerId)return;
  const requested=ownerId;
  try{
   await globalThis.WordvilleStudy?.ready;
   const server=await readRemote(requested);
   if(token!==sessionToken||ownerId!==requested)return;
   remote=server;remoteVersion=server?.savedAt||'';present();
   const local=await deviceSnapshot();
   if(token!==sessionToken||ownerId!==requested)return;
   if(server&&!hasRecords(local)){
    say('서버 백업을 발견했습니다. 비어 있는 기기에 기존 기록을 복원합니다.');
    await restore(true);
   }else if(server&&hasRecords(local)){
    say('기존 기기 기록과 서버 백업이 모두 있습니다. 안전을 위해 자동 덮어쓰지 않습니다. 복원 버튼으로 선택할 수 있습니다.');
   }else if(!server&&hasRecords(local)){
    dirty=true;await backup(false);
   }else say('서버와 기기에 아직 저장된 기록이 없습니다.');
  }catch(error){if(token===sessionToken)say('백업 상태 확인 오류: '+error.message);}
 }
 backupButton.addEventListener('click',()=>{dirty=true;backup(true);});
 restoreButton.addEventListener('click',()=>restore(false));
 document.addEventListener('wordville-record-changed',schedule);
 document.addEventListener('wordville-auth',event=>identity(event.detail?.id||''));
 client?.auth.getSession().then(({data})=>identity(data.session?.user?.id||'')).catch(()=>identity(''));
 globalThis.WordvilleBackup={backup,restore,deviceSnapshot,hasRecords,schedule};
})();