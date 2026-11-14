/* Multi-photo vocabulary memory album; independent of existing single-image storage. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const databaseName='wordville-memory-album-v1';
 const types=new Set(['image/png','image/jpeg','image/webp','image/gif']);
 const maximum=5*1024*1024;
 const searchPageSize=10,searchResultLimit=200,searchBatchSize=50;
 let connection=null,selectedId=null,wordUrls=[],archiveUrls=[],queryResults=[],searchSerial=0,searchPage=0,archiveSerial=0;
 function owner(){return cloudUser?.id||'';}
 function ownerKey(){return owner()||'local';}
 function key(w){return 'legacy:'+ownerKey()+':'+w.id;}
 function current(w){return active===w&&$('word-dialog').open;}
 const albumDb=()=>{
  if(connection)return connection;
  connection=new Promise((resolve,reject)=>{
   const request=indexedDB.open(databaseName,1);
   request.onupgradeneeded=()=>{
    if(!request.result.objectStoreNames.contains('photos'))request.result.createObjectStore('photos',{keyPath:'id'});
   };
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||new Error('이미지 보관함을 열 수 없습니다.'));
   request.onblocked=()=>reject(new Error('다른 앱 창이 이미지 보관함을 사용 중입니다.'));
  }).catch(error=>{connection=null;throw error;});
  return connection;
 };
 async function query(mode,operation,value){
  const database=await albumDb();
  return new Promise((resolve,reject)=>{
   const transaction=database.transaction('photos',mode);
   const store=transaction.objectStore('photos');
   const request=operation==='all'?store.getAll():operation==='put'?store.put(value):store.delete(value);
   let result;
   request.onsuccess=()=>result=request.result;
   transaction.oncomplete=()=>resolve(result);
   transaction.onerror=()=>reject(transaction.error||new Error('이미지 저장을 완료하지 못했습니다.'));
   transaction.onabort=()=>reject(transaction.error||new Error('이미지 저장이 취소되었습니다.'));
  });
 }
 const all=()=>query('readonly','all');
 const put=async item=>{const result=await query('readwrite','put',item);document.dispatchEvent(new Event('wordville-record-changed'));return result;};
 const del=async id=>{const result=await query('readwrite','delete',id);document.dispatchEvent(new Event('wordville-record-changed'));return result;};
 function revoked(urls){for(const url of urls)URL.revokeObjectURL(url);urls.length=0;}
 function itemDate(item){
  if(!item.savedAt)return '';
  const date=new Date(item.savedAt);
  if(!Number.isFinite(date.getTime()))return '';
  const p=n=>String(n).padStart(2,'0');
  return [date.getFullYear(),p(date.getMonth()+1),p(date.getDate())].join('-');
 }
 const uid=()=>owner();
 function record(w,blob,meta={},id=null){
  return {
   id:id||'photo:'+ownerKey()+':'+w.id+':'+Date.now()+':'+crypto.randomUUID(),
   ownerId:owner(),wordId:w.id,word:w.word,meaning:w.meaning,
   savedAt:meta.savedAt===undefined?new Date().toISOString():meta.savedAt,
   blob,source:meta.source||'기기 이미지',sourceUrl:meta.sourceUrl||'',
   license:meta.license||'',author:meta.author||''
  };
 }
 async function ensurePrimary(w,blob){
  if(!blob)return;
  const items=await all();
  if(!items.some(x=>x.id===key(w))){
   // Old images had no timestamp; do not invent one during migration.
   await put(record(w,blob,{source:'기존 저장 이미지',savedAt:null},key(w)));
  }
 }
 function safeLink(url){
  try{const parsed=new URL(url);return parsed.protocol==='https:'&&parsed.hostname==='commons.wikimedia.org'?parsed.href:null;}catch{return null;}
 }
 function photoCard(item,urls,action){
  const article=document.createElement('article');article.className='wv-photo-card';
  const button=document.createElement('button');button.type='button';button.className='wv-photo-choice';
  const img=document.createElement('img');const src=URL.createObjectURL(item.blob);urls.push(src);
  img.src=src;img.alt=item.word+' 기억 이미지';img.loading='lazy';button.append(img);
  button.addEventListener('click',()=>action(item));
  const description=document.createElement('div');description.className='wv-photo-meta';
  const word=document.createElement('strong');word.textContent=item.word;
  const date=document.createElement('small');date.textContent=itemDate(item)||'저장 날짜 미상';
  const source=document.createElement('small');source.textContent=item.source+(item.license?' · '+item.license:'');
  description.append(word,date,source);
  if(item.author){const credit=document.createElement('small');credit.textContent='업로더: '+item.author;description.append(credit);}
  article.append(button,description);
  const url=safeLink(item.sourceUrl);
  if(url){const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='이미지 출처';article.append(link);}
  return article;
 }
 async function wordPhotos(w){
  return (await all()).filter(x=>x.ownerId===owner()&&x.wordId===w.id)
   .sort((a,b)=>(b.savedAt||'').localeCompare(a.savedAt||''));
 }
 async function showSelected(w,item){
  if(!current(w))return;
  selectedId=item?.id||null;
  showImage(item?.blob||null);
  await renderWord(w);
 }
 async function renderWord(w){
  if(!current(w))return;
  const list=$('wv-memory-photo-list');revoked(wordUrls);list.replaceChildren();
  const items=await wordPhotos(w);if(!current(w))return;
  $('wv-memory-count').textContent='저장된 기억 이미지 '+items.length+'장 · 최대 5MB/장';
  for(const item of items){
   const article=photoCard(item,wordUrls,async x=>{await showSelected(w,x);});
   if(item.id===selectedId)article.classList.add('wv-photo-selected');
   list.append(article);
  }
  $('remove-image').hidden=!selectedId;
  $('sync-image').hidden=!cloudUser||selectedId!==key(w);
 }
 async function mount(w,legacyBlob){
  selectedId=null;queryResults=[];searchSerial++;revoked(wordUrls);
  $('wv-memory-search-results').replaceChildren();
  $('wv-memory-search-panel').hidden=true;
  $('wv-memory-search-query').value=w.word;
  $('wv-memory-search-status').textContent='';
  try{
   await ensurePrimary(w,legacyBlob);
   if(!current(w))return;
   const items=await wordPhotos(w);
   selectedId=items.some(x=>x.id===key(w))?key(w):items[0]?.id||null;
   showImage(items.find(x=>x.id===selectedId)?.blob||null);
   await renderWord(w);
  }catch(error){
   if(current(w)){
    showImage(legacyBlob||null);
    $('detail-status').textContent='기존 이미지는 유지됩니다. 새 이미지 보관함 오류: '+error.message;
   }
  }
 }
 function valid(file){
  return file&&types.has(file.type)&&file.size>0&&file.size<=maximum;
 }
 async function addFiles(files,w=active){
  if(!w||imageBusy)return;
  const selected=Array.from(files||[]);
  if(!selected.length)return;
  const invalid=selected.filter(file=>!valid(file));
  const accepted=selected.filter(valid);
  if(!accepted.length){$('detail-status').textContent='5MB 이하 PNG·JPG·WebP·GIF 이미지를 선택해 주세요.';return;}
  const uploadOwner=owner(),acceptedRecords=[];
  imageLock(true);
  $('detail-status').textContent=accepted.length+'장 저장 중…';
  try{
   // Preserve pre-existing one-image saves before adding the new collection.
   let original=null;
   for(const alias of Wordville.wordIds(w)){
    original=await imageAction('get',localImageKey(alias,uploadOwner));if(original)break;
   }
   if(original)await ensurePrimary(w,original);
   for(const file of accepted){
    if(owner()!==uploadOwner)throw new Error('로그인 계정이 변경되었습니다.');
    const primary=!original;
    const item=record(w,file,{source:file.source||'내 기기',sourceUrl:file.sourceUrl,license:file.license,author:file.author},primary?key(w):null);
    if(primary){await imageAction('put',localImageKey(w.id,uploadOwner),file);original=file;}
    await put(item);acceptedRecords.push(item);
   }
   if(current(w)){
    await showSelected(w,acceptedRecords[acceptedRecords.length-1]);
    $('detail-status').textContent=acceptedRecords.length+'장 저장 완료'+(invalid.length?' · '+invalid.length+'장 제외(형식/용량)':'')+'. 기기에 저장했습니다.';
   }
   await renderArchive();
  }catch(error){if(current(w))$('detail-status').textContent='이미지 저장 오류: '+error.message;}
  finally{imageLock(false);$('image-input').value='';}
 }
 async function removeCurrent(w=active){
  if(!w||imageBusy)return;
  const id=selectedId,wasPrimary=id===key(w);
  if(!id&&$('memory-image').hidden)return;
  imageLock(true);
  try{
   if(wasPrimary||!id){
    const user=owner();
    if(user&&cloud){
     const {error}=await cloud.storage.from(bucket).remove(Wordville.wordIds(w).map(alias=>cloudPath(alias,user)));
     if(error)throw new Error('서버 기본 이미지 삭제에 실패했습니다. 다시 시도해 주세요.');
    }
    for(const alias of Wordville.wordIds(w))await imageAction('delete',localImageKey(alias,user));
   }
   if(id)await del(id);
   if(current(w)){
    const items=await wordPhotos(w);
    const next=items[0]||null;selectedId=next?.id||null;
    showImage(next?.blob||null);
    await renderWord(w);
    $('detail-status').textContent='선택한 기억 이미지를 삭제했습니다.';
   }
   await renderArchive();
  }catch(error){if(current(w))$('detail-status').textContent=error.message;}
  finally{imageLock(false);}
 }
 // Import legacy one-image records when the album is first opened, without
 // deleting the old IndexedDB contents or inventing original save dates.
 async function discoverLegacy(){
  if(!db)return;
  const found=await new Promise((resolve,reject)=>{
   const request=db.transaction('images','readonly').objectStore('images').getAllKeys();
   request.onsuccess=()=>resolve(request.result||[]);
   request.onerror=()=>reject(request.error||new Error('기존 이미지 목록을 읽지 못했습니다.'));
  });
  const existing=new Set((await all()).map(item=>item.id));
  for(const storedKey of found){
   if(typeof storedKey!=='string')continue;
   const username=owner();
   if(username?!storedKey.startsWith(username+'/'):storedKey.includes('/'))continue;
   const wordId=username?storedKey.slice(username.length+1):storedKey;
   const word=words.find(w=>Wordville.wordIds(w).includes(wordId));
   if(!word||existing.has(key(word)))continue;
   const blob=await imageAction('get',storedKey);
   if(!blob)continue;
   await put(record(word,blob,{savedAt:null,source:'기존 저장 이미지'},key(word)));
   existing.add(key(word));
  }
 }
 async function renderArchive(){
  const serial=++archiveSerial;
  const view=$('wv-gallery-view');if(!view)return;
  const destination=$('wv-gallery-archive-list'),selection=$('wv-gallery-date');
  const previous=selection.value||'all';
  revoked(archiveUrls);destination.replaceChildren();
  let items;
  try{await discoverLegacy();items=(await all()).filter(x=>x.ownerId===owner());}
  catch(e){$('wv-gallery-total').textContent='보관함을 열지 못했습니다: '+e.message;return;}
  if(serial!==archiveSerial)return;
  items.sort((a,b)=>(b.savedAt||'').localeCompare(a.savedAt||''));
  const dates=[...new Set(items.map(itemDate))].filter(Boolean).sort().reverse();
  selection.replaceChildren(new Option('전체 날짜','all'),...dates.map(d=>new Option(d,d)));
  selection.value=dates.includes(previous)?previous:'all';
  $('wv-gallery-total').textContent='보관된 이미지 '+items.length+'장 · '+dates.length+'일';
  const shown=items.filter(x=>selection.value==='all'||itemDate(x)===selection.value);
  if(!shown.length){const p=document.createElement('p');p.textContent='이 날짜에 저장한 이미지가 없습니다.';destination.append(p);return;}
  const groups=new Map();
  for(const item of shown){const day=itemDate(item)||'저장 날짜 미상';if(!groups.has(day))groups.set(day,[]);groups.get(day).push(item);}
  for(const [day,photos] of groups){
   const section=document.createElement('section');section.className='wv-gallery-day';
   const title=document.createElement('h3');title.textContent=day+' · '+photos.length+'장';
   const grid=document.createElement('div');grid.className='wv-memory-grid';
   for(const item of photos)grid.append(photoCard(item,archiveUrls,async photo=>{
    const word=words.find(w=>w.id===photo.wordId);
    if(!word){$('wv-gallery-total').textContent='현재 단어장에 없는 이미지입니다.';return;}
    await openWord(word);
    if(current(word)){const candidate=(await wordPhotos(word)).find(x=>x.id===photo.id);if(candidate)await showSelected(word,candidate);}
   }));
   section.append(title,grid);destination.append(section);
  }
 }
 function cleanMeta(text){
  const temporary=document.createElement('div');
  temporary.textContent=String(text||'');return temporary.textContent.slice(0,150);
 }
 function approvedMediaUrl(href){
  try{
   const u=new URL(href);
   return u.protocol==='https:'&&['thumb.wikimedia.org','upload.wikimedia.org'].includes(u.hostname)&&
    u.pathname.startsWith('/wikipedia/commons/')?u:null;
  }catch{return null;}
 }
 function imageSources(result){
  const original=approvedMediaUrl(result.thumbnail);
  if(!original)return [];
  const sources=[original.href];
  if(original.pathname.includes('/thumb/')){
   const backup=new URL(original.href);
   backup.hostname=original.hostname==='thumb.wikimedia.org'?'upload.wikimedia.org':'thumb.wikimedia.org';
   sources.push(backup.href);
  }
  return [...new Set(sources)];
 }
 async function fetchImage(result){
  const urls=imageSources(result);
  if(!urls.length)throw new Error('허용되지 않은 이미지 URL입니다.');
  let errorMessage='';
  for(const href of urls){
   try{
    const response=await fetch(href,{credentials:'omit',cache:'default'});
    if(!response.ok){errorMessage='이미지 서버 응답 '+response.status;continue;}
    const contentLength=Number(response.headers.get('content-length')||0);
    if(contentLength>maximum)throw new Error('이미지가 5MB를 초과합니다.');
    const blob=await response.blob();
    if(!valid(blob)){errorMessage='파일 형식 또는 5MB 용량 제한을 확인하세요.';continue;}
    return blob;
   }catch(error){errorMessage=error.message||'이미지 네트워크 오류';}
  }
  throw new Error(errorMessage||'이미지 서버에서 파일을 가져올 수 없습니다.');
 }

 function renderResults(w,results){
  const destination=$('wv-memory-search-results');destination.replaceChildren();
  if(!results.length){
   const message=document.createElement('p');
   message.className='wv-search-empty';message.textContent='검색 결과가 없습니다. 다른 단어로 검색해 주세요.';
   destination.append(message);return;
  }
  const pageCount=Math.ceil(results.length/searchPageSize);
  searchPage=Math.max(0,Math.min(searchPage,pageCount-1));
  const first=searchPage*searchPageSize;
  const shown=results.slice(first,first+searchPageSize);
  const turnPage=delta=>{
   if(!current(w))return;
   const next=Math.max(0,Math.min(pageCount-1,searchPage+delta));
   if(next===searchPage)return;
   searchPage=next;renderResults(w,queryResults);
   destination.scrollIntoView({block:'start',behavior:'smooth'});
  };
  function pagination(){
   const nav=document.createElement('nav');nav.className='wv-search-pagination';
   nav.setAttribute('aria-label','이미지 검색 결과 페이지 이동');
   const previous=document.createElement('button');previous.type='button';previous.textContent='← 이전';
   previous.disabled=searchPage===0;previous.addEventListener('click',()=>turnPage(-1));
   const indicator=document.createElement('span');indicator.className='wv-search-page-number';
   indicator.textContent=(searchPage+1)+' / '+pageCount+' 페이지';
   const next=document.createElement('button');next.type='button';next.textContent='다음 →';
   next.disabled=searchPage===pageCount-1;next.addEventListener('click',()=>turnPage(1));
   nav.append(previous,indicator,next);return nav;
  }
  $('wv-memory-search-status').textContent=results.length+'개 이미지 · '+(searchPage+1)+'/'+pageCount+' 페이지 · 각 이미지의 이용 허가를 확인하세요.';
  destination.append(pagination());
  for(const result of shown){
   const article=document.createElement('article');article.className='wv-search-result';
   const img=document.createElement('img');
   const sources=imageSources(result);let index=0;
   img.alt='검색된 이미지 미리보기';img.loading='lazy';
   img.onerror=()=>{
    if(index+1<sources.length){img.src=sources[++index];return;}
    img.hidden=true;
    const failure=document.createElement('small');
    failure.className='wv-image-load-error';
    failure.textContent='미리보기를 불러오지 못했습니다. 네트워크 연결을 확인하세요.';
    article.insertBefore(failure,article.firstChild);
   };
   if(sources.length)img.src=sources[0];
   else{img.hidden=true;const failure=document.createElement('small');failure.textContent='이미지 주소가 지원되지 않습니다.';article.append(failure);}
   const rights=document.createElement('small');rights.className='wv-search-license';
   rights.textContent=(result.license||'라이선스 정보 확인 필요')+(result.author?' · 업로더 '+result.author:'');
   const save=document.createElement('button');save.type='button';save.textContent='이 이미지 저장';
   save.addEventListener('click',async()=>{
    if(!current(w)||imageBusy)return;
    save.disabled=true;$('wv-memory-search-status').textContent='이미지 파일을 가져오는 중…';
    try{
     const blob=await fetchImage(result);
     const image=new File([blob],result.title.replace(/^File:/,'').slice(0,100),{type:blob.type});
     image.source='Wikimedia Commons';image.sourceUrl=result.sourceUrl;image.license=result.license;image.author=result.author;
     await addFiles([image],w);
     $('wv-memory-search-status').textContent='기억 이미지로 저장했습니다.';
    }catch(error){$('wv-memory-search-status').textContent='저장하지 못했습니다: '+error.message;}
    finally{save.disabled=false;}
   });
   article.append(img,rights,save);destination.append(article);
  }
  destination.append(pagination());
 }
 async function search(w=active){
  if(!w)return;
  const searchText=$('wv-memory-search-query').value.trim().slice(0,120);
  if(!searchText){$('wv-memory-search-status').textContent='검색어를 입력하세요.';return;}
  const serial=++searchSerial,button=$('wv-memory-search-submit');
  button.disabled=true;searchPage=0;queryResults=[];
  $('wv-memory-search-status').textContent='Wikimedia Commons에서 여러 이미지를 검색 중…';
  $('wv-memory-search-results').replaceChildren();
  let incomplete=false,problem='';
  const results=[],seen=new Set();
  let continuation=null;
  try{
   for(let batch=0;batch<8&&results.length<searchResultLimit;batch++){
    if(serial!==searchSerial||!current(w))return;
    const params=new URLSearchParams({
     action:'query',format:'json',formatversion:'2',generator:'search',
     gsrsearch:searchText,gsrnamespace:'6',gsrlimit:String(searchBatchSize),gsrsort:'relevance',
     prop:'imageinfo',iiprop:'url|mime|extmetadata|user',iiurlwidth:'800',origin:'*'
    });
    if(continuation)for(const [name,value] of Object.entries(continuation))params.set(name,String(value));
    let data;
    try{
     const response=await fetch('https://commons.wikimedia.org/w/api.php?'+params.toString(),{credentials:'omit'});
     if(!response.ok)throw new Error('검색 서비스 접속 실패 ('+response.status+')');
     data=await response.json();
     if(data.error)throw new Error(data.error.info||'검색 API 응답 오류');
    }catch(error){
     if(!results.length)throw error;
     incomplete=true;problem=error.message||'일부 검색 결과를 불러오지 못했습니다.';break;
    }
    if(serial!==searchSerial||!current(w))return;
    const pages=Array.isArray(data.query?.pages)?data.query.pages:[];
    pages.sort((a,b)=>(a.index??0)-(b.index??0));
    for(const page of pages){
     const info=page.imageinfo?.[0],title=page.title||'';
     if(!title||seen.has(title)||!info||!types.has(info.mime)||!info.thumburl)continue;
     seen.add(title);
     results.push({title,thumbnail:info.thumburl,
      sourceUrl:'https://commons.wikimedia.org/wiki/'+encodeURIComponent(title.replace(/ /g,'_')),
      license:cleanMeta(info.extmetadata?.LicenseShortName?.value),author:cleanMeta(info.user)});
     if(results.length>=searchResultLimit)break;
    }
    $('wv-memory-search-status').textContent=results.length+'개 이미지 검색됨 · 추가 결과 확인 중…';
    continuation=data.continue&&typeof data.continue==='object'?data.continue:null;
    if(!continuation)break;
   }
   if(serial!==searchSerial||!current(w))return;
   queryResults=results;renderResults(w,results);
   if(incomplete)$('wv-memory-search-status').textContent=results.length+'개 표시 중 · 추가 검색 실패: '+problem;
  }catch(error){
   if(serial===searchSerial&&current(w))$('wv-memory-search-status').textContent='검색 오류: '+error.message+' · 인터넷 연결을 확인해 주세요.';
  }finally{if(serial===searchSerial)button.disabled=false;}
 }
 $('wv-image-search-shortcut').addEventListener('click',()=>{
  $('wv-memory-search-panel').hidden=false;
  $('wv-memory-search-toggle').setAttribute('aria-expanded','true');
  $('wv-memory-search-panel').scrollIntoView({block:'start',behavior:'smooth'});
  $('wv-memory-search-query').focus({preventScroll:true});
 });
 $('wv-memory-search-toggle').addEventListener('click',()=>{
  const panel=$('wv-memory-search-panel');panel.hidden=!panel.hidden;
  $('wv-memory-search-toggle').setAttribute('aria-expanded',String(!panel.hidden));
  if(!panel.hidden)$('wv-memory-search-query').focus();
 });
 $('wv-memory-search-form').addEventListener('submit',event=>{event.preventDefault();search();});
 $('wv-memory-open-archive').addEventListener('click',()=>{
  $('word-dialog').close();active=null;clear();showImage(null);
  globalThis.WordvilleShell?.activate('gallery');
 });
 $('wv-gallery-date').addEventListener('change',renderArchive);
 $('wv-gallery-refresh').addEventListener('click',renderArchive);
 function clear(){
  searchSerial++;selectedId=null;queryResults=[];searchPage=0;
  revoked(wordUrls);
  $('wv-memory-photo-list').replaceChildren();
  $('wv-memory-search-results').replaceChildren();
 }
 globalThis.WordvilleGallery={mount,addFiles,removeCurrent,clear,renderArchive,
  isPrimarySelected:()=>!!active&&selectedId===key(active),
  get selectedId(){return selectedId;},
  getAll:all};
})();