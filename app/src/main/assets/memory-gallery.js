/* Multi-photo vocabulary memory album; independent of existing single-image storage. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const databaseName='wordville-memory-album-v1';
 const types=new Set(['image/png','image/jpeg','image/webp','image/gif']);
 const maximum=5*1024*1024;
 const searchPageSize=10,searchResultLimit=60,searchBatchSize=50,openversePageSize=20;
 const searchCache=new Map();
 let connection=null,selectedId=null,wordUrls=[],archiveUrls=[],queryResults=[],searchSerial=0,searchPage=0,archiveSerial=0;
 let returnToCard=null;
 const labels={
  ko:['← 단어 카드로 돌아가기','← 단어장으로 돌아가기'],
  en:['← Back to word card','← Back to words'],
  'zh-CN':['← 返回单词卡','← 返回单词列表'],
  ja:['← 単語カードに戻る','← 単語一覧に戻る']
 };
 function backLabel(){
  const lang=globalThis.WordvilleI18n?.language||'ko';
  const label=labels[lang]||labels.ko;
  const button=$('wv-gallery-back');
  if(button){button.textContent=label[returnToCard?0:1];button.setAttribute('aria-label',button.textContent);}
 }
 document.addEventListener('wordville-language-changed',backLabel);
 backLabel();

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
  try{const parsed=new URL(url);return parsed.protocol==='https:'&&!parsed.username&&!parsed.password?parsed.href:null;}catch{return null;}
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
  if(url){const link=document.createElement('a');link.href=url;link.rel='noopener noreferrer';link.textContent='이미지 출처';article.append(link);}
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
  $('wv-memory-search-query').value=suggestImageQuery(w);
  externalLinks($('wv-memory-search-query').value);
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
   if(u.protocol!=='https:')return null;
   if(['thumb.wikimedia.org','upload.wikimedia.org'].includes(u.hostname)&&u.pathname.startsWith('/wikipedia/commons/'))return u;
   if(u.hostname==='api.openverse.org'&&/^\/v1\/images\/[0-9a-f-]{36}\/thumb\/?$/.test(u.pathname))return u;
   if(u.hostname==='cdn.pixabay.com'&&u.pathname.startsWith('/photo/'))return u;
   if(u.hostname==='pixabay.com'&&u.pathname.startsWith('/get/'))return u;
   if(u.hostname==='images.unsplash.com'&&/^\/photo-[A-Za-z0-9_-]+/.test(u.pathname))return u;
   if(u.hostname==='images.pexels.com'&&/^\/photos\/\d+\//.test(u.pathname))return u;
   return null;
  }catch{return null;}
 }
 function imageSources(result){
  const original=approvedMediaUrl(result.thumbnail);if(!original)return [];
  const sources=[original.href];
  if(original.pathname.includes('/thumb/')&&original.hostname.endsWith('wikimedia.org')){
   const backup=new URL(original.href);
   backup.hostname=original.hostname==='thumb.wikimedia.org'?'upload.wikimedia.org':'thumb.wikimedia.org';
   sources.push(backup.href);
  }
  return [...new Set(sources)];
 }
 async function fetchImage(result){
  const urls=imageSources(result);
  if(!urls.length)throw new Error('지원하지 않는 이미지 주소입니다.');
  // Unsplash requires download tracking when the user adds an image to the album.
  // Use the official API endpoint, never an arbitrary URL from a search result.
  if(result.source==='Unsplash'){
   const key=$('wv-memory-unsplash-key').value.trim();
   let endpoint;
   try{endpoint=new URL(result.downloadLocation);}catch{throw Error('Unsplash 다운로드 정보가 없습니다.');}
   if(endpoint.protocol!=='https:'||endpoint.hostname!=='api.unsplash.com'||
      !/^\/photos\/[A-Za-z0-9_-]+\/download\/?$/.test(endpoint.pathname))
    throw Error('Unsplash 다운로드 주소가 올바르지 않습니다.');
   if(!key)throw Error('Unsplash API 키가 필요합니다.');
   const track=await fetch(endpoint.href,{credentials:'omit',headers:{Authorization:'Client-ID '+key}});
   if(!track.ok)throw Error('Unsplash 다운로드 기록 실패 (HTTP '+track.status+').');
  }
  let problem='';
  for(const url of urls){
   try{
    const response=await fetch(url,{credentials:'omit',cache:'default'});
    if(!response.ok){problem='이미지 서버 응답 '+response.status;continue;}
    if(Number(response.headers.get('content-length')||0)>maximum)throw Error('이미지가 5MB를 초과합니다.');
    const blob=await response.blob();
    if(valid(blob))return blob;
    problem='이미지 형식 또는 용량이 지원되지 않습니다.';
   }catch(e){problem=e.message||'이미지 네트워크 오류';}
  }
  throw new Error(problem||'이미지 가져오기 실패. 원본 사이트에서 파일을 저장한 뒤 첨부해 주세요.');
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
   rights.textContent=(result.source||'출처 미상')+' · '+(result.license||'라이선스 정보 확인 필요')+(result.author?' · 업로더 '+result.author:'');
   const save=document.createElement('button');save.type='button';save.textContent='이 이미지 저장';
   save.addEventListener('click',async()=>{
    if(!current(w)||imageBusy)return;
    save.disabled=true;$('wv-memory-search-status').textContent='이미지 파일을 가져오는 중…';
    try{
     const blob=await fetchImage(result);
     const image=new File([blob],result.title.replace(/^File:/,'').slice(0,100),{type:blob.type});
     image.source=result.source||'Wikimedia Commons';image.sourceUrl=result.sourceUrl;image.license=result.license;image.author=result.author;
     await addFiles([image],w);
     $('wv-memory-search-status').textContent='기억 이미지로 저장했습니다.';
    }catch(error){$('wv-memory-search-status').textContent='저장하지 못했습니다: '+error.message;}
    finally{save.disabled=false;}
   });
   
   const origin=document.createElement('a');origin.className='wv-search-credit';origin.textContent='출처·라이선스 확인';
   const href=safeLink(result.sourceUrl);origin.hidden=!href;
   if(href){origin.href=href;origin.rel='noopener noreferrer';}
   article.append(img,rights,origin,save);destination.append(article);
  }
  destination.append(pagination());
 }

 const senseHints={
  bank:[[/강둑|강가|제방/,'river bank'],[/은행|금융/,'bank building']],
  bat:[[/박쥐/,'bat animal'],[/방망이|야구/,'baseball bat']],
  bark:[[/수피|나무껍질/,'tree bark'],[/짖/,'barking dog']],
  spring:[[/봄/,'spring flowers'],[/용수철|스프링/,'metal coil spring']],
  seal:[[/바다표범|물개/,'seal animal'],[/도장|봉인/,'wax seal']],
  match:[[/성냥/,'matchsticks'],[/경기|시합/,'sports match']],
  plant:[[/공장/,'industrial plant'],[/식물/,'green plant']]
 };
 function suggestImageQuery(w){
  const word=String(w.word||'').trim();
  const meaning=String(w.meaning||'');
  return senseHints[word.toLowerCase()]?.find(([re])=>re.test(meaning))?.[1]||word;
 }
 const sourceSelect=$('wv-memory-search-source'),pixabayKey=$('wv-memory-pixabay-key');
 const pixabayStatus=$('wv-memory-pixabay-status');
 const rememberPixabay=$('wv-memory-pixabay-remember');
 const pixabaySecure=location.origin==='https://appassets.androidplatform.net'
  && typeof globalThis.WordvillePixabaySecure?.getSavedKey==='function'
  ? globalThis.WordvillePixabaySecure:null;
 sourceSelect.addEventListener('change',()=>{
  $('wv-memory-pixabay-field').hidden=sourceSelect.value!=='pixabay';
  for(const provider of ['unsplash','pexels'])
   $('wv-memory-'+provider+'-field').hidden=sourceSelect.value!==provider;
 });
 function restorePixabayKey(){
  if(!pixabaySecure){
   rememberPixabay.checked=false;rememberPixabay.disabled=true;
   pixabayStatus.textContent='이 환경에서는 암호화 자동 저장을 사용할 수 없습니다. 현재 실행 중에는 입력한 키로 검색할 수 있습니다.';
   return;
  }
  try{
   const saved=pixabaySecure.getSavedKey();
   if(saved){
    pixabayKey.value=saved;
    pixabayStatus.textContent='저장된 Pixabay 키를 자동으로 불러왔습니다. 다시 입력하지 않아도 검색할 수 있습니다.';
   }
  }catch(error){
   pixabayStatus.textContent='저장된 키를 불러오지 못했습니다. 연결 테스트 후 다시 저장해 주세요.';
  }
 }
 restorePixabayKey();
 rememberPixabay.addEventListener('change',()=>{
  if(rememberPixabay.checked){
   pixabayStatus.textContent='연결 테스트에 성공하면 키가 이 기기에 암호화 저장됩니다.';
   return;
  }
  if(!pixabaySecure)return;
  try{
   if(!pixabaySecure.clearSavedKey())throw Error('delete failed');
   pixabayStatus.textContent='저장된 키를 삭제했습니다. 현재 입력창의 키는 앱을 닫을 때까지 사용할 수 있습니다.';
  }catch(error){
   rememberPixabay.checked=true;
   pixabayStatus.textContent='키 삭제에 실패했습니다. 저장된 키 삭제 버튼을 다시 눌러주세요.';
  }
 });
 $('wv-memory-pixabay-clear').addEventListener('click',()=>{
  if(pixabaySecure){
   try{
    if(!pixabaySecure.clearSavedKey())throw Error('delete failed');
   }catch(error){pixabayStatus.textContent='키를 삭제하지 못했습니다. 다시 시도해 주세요.';return;}
  }
  pixabayKey.value='';rememberPixabay.checked=!!pixabaySecure;
  pixabayStatus.textContent='이 기기에 저장된 Pixabay 키와 현재 입력한 키를 삭제했습니다.';
 });
 function pixabayApiError(status){
  if(status===400||status===401||status===403)return 'Pixabay API 키를 확인하세요 (HTTP '+status+').';
  if(status===429)return 'Pixabay 요청 한도를 초과했습니다 (HTTP 429).';
  return 'Pixabay 서버 응답 '+status;
 }
 $('wv-memory-pixabay-test').addEventListener('click',async()=>{
  const status=pixabayStatus,button=$('wv-memory-pixabay-test');
  const key=pixabayKey.value.trim();
  if(!key){status.textContent='Pixabay API 키를 먼저 입력해 주세요.';pixabayKey.focus();return;}
  button.disabled=true;status.textContent='Pixabay 연결을 확인하는 중…';
  try{
   const params=new URLSearchParams({key,q:'flower',per_page:'3',safesearch:'true'});
   const response=await fetch('https://pixabay.com/api/?'+params,{credentials:'omit'});
   if(!response.ok)throw Error(pixabayApiError(response.status));
   const data=await response.json();
   if(!Array.isArray(data.hits))throw Error('Pixabay 응답 형식이 올바르지 않습니다.');
   if(rememberPixabay.checked&&pixabaySecure){
    let saved=false;
    try{saved=pixabaySecure.saveKey(key);}catch(error){saved=false;}
    status.textContent=saved?
     'Pixabay 연결 성공. API 키를 암호화 저장했습니다. 다음에 앱을 실행하면 자동 연결됩니다.':
     'Pixabay 연결 성공. 하지만 암호화 저장에 실패했습니다. 다시 시도해 주세요.';
   }else{
    status.textContent='Pixabay 연결 성공. 키는 저장되지 않았고 현재 실행 중에만 사용할 수 있습니다.';
   }
  }catch(error){
   status.textContent='연결 실패: '+(error.message||'네트워크 오류')+' · 키 또는 네트워크 연결을 확인하세요. 실패한 키는 저장하지 않았습니다.';
  }finally{button.disabled=false;}
 });
 // Each account's key stays in RAM or Android Keystore, never in localStorage or GitHub.
 const providerSecure=pixabaySecure&&typeof pixabaySecure.getProviderKey==='function'?pixabaySecure:null;
 function configurePhotoProvider(provider,label){
  const field=$('wv-memory-'+provider+'-key');
  const remember=$('wv-memory-'+provider+'-remember');
  const status=$('wv-memory-'+provider+'-status');
  const button=$('wv-memory-'+provider+'-test');
  const header=key=>({Authorization:provider==='unsplash'?'Client-ID '+key:key});
  const apiUrl=provider==='unsplash'?
   'https://api.unsplash.com/search/photos?query=flower&per_page=1':
   'https://api.pexels.com/v1/search?query=flower&per_page=1';
  if(!providerSecure){
   remember.checked=false;remember.disabled=true;
   status.textContent='이 환경에서는 키 자동 저장이 지원되지 않습니다. 현재 실행 중에는 입력한 키를 사용할 수 있습니다.';
  }else{
   try{
    const saved=providerSecure.getProviderKey(provider);
    if(saved){field.value=saved;status.textContent='저장된 '+label+' API 키를 자동으로 불러왔습니다.';}
   }catch{status.textContent=label+' API 키를 불러오지 못했습니다.';}
  }
  field.addEventListener('input',()=>searchCache.clear());
  remember.addEventListener('change',()=>{
   if(remember.checked){status.textContent='연결 테스트에 성공하면 키를 기기에 암호화 저장합니다.';return;}
   if(providerSecure&&!providerSecure.clearProviderKey(provider)){
    remember.checked=true;status.textContent='저장된 키를 삭제하지 못했습니다.';
   }else{status.textContent='저장된 키를 삭제했습니다. 현재 입력한 키는 계속 사용할 수 있습니다.';}
   searchCache.clear();
  });
  $('wv-memory-'+provider+'-clear').addEventListener('click',()=>{
   if(providerSecure&&!providerSecure.clearProviderKey(provider)){
    status.textContent='저장된 키를 삭제하지 못했습니다.';return;
   }
   field.value='';searchCache.clear();
   status.textContent=label+' API 키를 삭제했습니다.';
  });
  button.addEventListener('click',async()=>{
   const key=field.value.trim();
   if(!key){status.textContent=label+' API 키를 입력하세요.';field.focus();return;}
   button.disabled=true;status.textContent=label+' 연결 확인 중…';
   try{
    const response=await fetch(apiUrl,{credentials:'omit',headers:header(key)});
    if(!response.ok)throw Error(label+' 응답 '+response.status);
    const data=await response.json();
    if(!Array.isArray(provider==='unsplash'?data.results:data.photos))throw Error('응답 형식 오류');
    if(remember.checked&&providerSecure){
     if(!providerSecure.saveProviderKey(provider,key))throw Error('암호화 저장 실패');
     status.textContent=label+' 연결 성공. 이 기기에 암호화 저장하여 다음 실행부터 자동 연결합니다.';
    }else status.textContent=label+' 연결 성공. 현재 실행 중에만 사용합니다.';
    searchCache.clear();
   }catch(error){status.textContent='연결 실패: '+error.message+' · API 키와 네트워크를 확인하세요. 실패한 키는 저장하지 않았습니다.';}
   finally{button.disabled=false;}
  });
 }
 configurePhotoProvider('unsplash','Unsplash');
 configurePhotoProvider('pexels','Pexels');

 function externalLinks(q){
  const term=encodeURIComponent(q);
  $('wv-memory-google-link').href='https://www.google.com/search?tbm=isch&q='+term;
  $('wv-memory-pixabay-link').href='https://pixabay.com/images/search/'+term+'/';
  $('wv-memory-unsplash-link').href='https://unsplash.com/s/photos/'+term;
  $('wv-memory-pexels-link').href='https://www.pexels.com/search/'+term+'/';
 }
 async function openverseResults(query,signal){
  // Anonymous access: send only the search term. Extra privileged parameters can
  // cause HTTP 401; 401 can also occur when Openverse rejects anonymous traffic.
  const params=new URLSearchParams({q:query});
  const response=await fetch('https://api.openverse.org/v1/images/?'+params,{signal,credentials:'omit'});
  if(!response.ok)throw Error(response.status===401?
   'Openverse 익명 검색 인증 거부 (HTTP 401)': 'Openverse 응답 '+response.status);
  const data=await response.json();
  if(!Array.isArray(data.results))throw Error('Openverse 검색 형식 오류');
  return data.results.filter(x=>!x.mature&&/^[a-f0-9-]{36}$/i.test(x.id||''))
   .slice(0,openversePageSize).map(x=>({
    id:x.id,title:x.title||query,
    thumbnail:'https://api.openverse.org/v1/images/'+x.id+'/thumb/',
    sourceUrl:safeLink(x.foreign_landing_url)||'https://openverse.org/image/'+x.id,
    license:[x.license?.toUpperCase(),x.license_version].filter(Boolean).join(' '),
    author:String(x.creator||'').slice(0,120),source:'Openverse'
   }));
  }
 async function commonsResults(query,signal){
  const params=new URLSearchParams({action:'query',format:'json',formatversion:'2',generator:'search',
   gsrsearch:query,gsrnamespace:'6',gsrlimit:String(searchBatchSize),gsrsort:'relevance',
   prop:'imageinfo',iiprop:'url|mime|extmetadata|user',iiurlwidth:'800',origin:'*'});
  const response=await fetch('https://commons.wikimedia.org/w/api.php?'+params,{signal,credentials:'omit'});
  if(!response.ok)throw Error('Commons 응답 '+response.status);
  const data=await response.json();
  if(data.error)throw Error(data.error.info||'Commons 검색 오류');
  return (Array.isArray(data.query?.pages)?data.query.pages:[])
   .sort((x,y)=>(x.index??0)-(y.index??0))
   .filter(x=>x.title&&types.has(x.imageinfo?.[0]?.mime)&&approvedMediaUrl(x.imageinfo?.[0]?.thumburl))
   .map(x=>({title:x.title,thumbnail:x.imageinfo[0].thumburl,
     sourceUrl:'https://commons.wikimedia.org/wiki/'+encodeURIComponent(x.title.replace(/ /g,'_')),
     license:cleanMeta(x.imageinfo[0].extmetadata?.LicenseShortName?.value),
     author:cleanMeta(x.imageinfo[0].user),source:'Wikimedia Commons'}));
 }
 async function pixabayResults(query,signal){
  const key=pixabayKey.value.trim();
  if(!key)throw Error('Pixabay API 키를 입력하세요. 키 없이 검색하려면 Openverse를 선택하세요.');
  const params=new URLSearchParams({key,q:query,image_type:'all',safesearch:'true',per_page:String(searchBatchSize)});
  const response=await fetch('https://pixabay.com/api/?'+params,{signal,credentials:'omit'});
  if(!response.ok)throw Error(pixabayApiError(response.status));
  const data=await response.json();
  return (Array.isArray(data.hits)?data.hits:[])
   .filter(x=>approvedMediaUrl(x.webformatURL)||approvedMediaUrl(x.previewURL))
   .map(x=>({title:x.tags||query,thumbnail:approvedMediaUrl(x.webformatURL)?x.webformatURL:x.previewURL,
     sourceUrl:'https://pixabay.com/photos/id-'+x.id+'/',
     license:'Pixabay Content License',author:String(x.user||''),source:'Pixabay'}));
 }
 async function unsplashResults(query,signal){
  const key=$('wv-memory-unsplash-key').value.trim();
  if(!key)throw Error('Unsplash API 키를 입력하세요.');
  const params=new URLSearchParams({query,per_page:'30',content_filter:'high'});
  const response=await fetch('https://api.unsplash.com/search/photos?'+params,
   {signal,credentials:'omit',headers:{Authorization:'Client-ID '+key}});
  if(!response.ok)throw Error('Unsplash 응답 '+response.status);
  const data=await response.json();
  if(!Array.isArray(data.results))throw Error('Unsplash 검색 형식 오류');
  return data.results.filter(x=>approvedMediaUrl(x.urls?.small||x.urls?.regular)
   &&safeLink(x.links?.html)&&x.links?.download_location)
   .slice(0,searchResultLimit).map(x=>({
    id:x.id,title:String(x.alt_description||x.description||query).slice(0,120),
    thumbnail:approvedMediaUrl(x.urls?.small)?x.urls.small:x.urls.regular,
    sourceUrl:safeLink(x.links.html),downloadLocation:x.links.download_location,
    license:'Unsplash License',author:String(x.user?.name||'').slice(0,120),source:'Unsplash'
   }));
 }
 async function pexelsResults(query,signal){
  const key=$('wv-memory-pexels-key').value.trim();
  if(!key)throw Error('Pexels API 키를 입력하세요.');
  const params=new URLSearchParams({query,per_page:'50'});
  const response=await fetch('https://api.pexels.com/v1/search?'+params,
   {signal,credentials:'omit',headers:{Authorization:key}});
  if(!response.ok)throw Error('Pexels 응답 '+response.status);
  const data=await response.json();
  if(!Array.isArray(data.photos))throw Error('Pexels 검색 형식 오류');
  return data.photos.filter(x=>approvedMediaUrl(x.src?.large||x.src?.medium)&&safeLink(x.url))
   .slice(0,searchResultLimit).map(x=>({
    id:x.id,title:String(x.alt||query).slice(0,120),
    thumbnail:approvedMediaUrl(x.src?.large)?x.src.large:x.src.medium,
    sourceUrl:safeLink(x.url),license:'Pexels License',
    author:String(x.photographer||'').slice(0,120),source:'Pexels'
   }));
 }
 let imageSearchController=null;
 async function search(w=active){
  if(!w)return;
  const query=$('wv-memory-search-query').value.trim().slice(0,120);
  if(!query){$('wv-memory-search-status').textContent='검색어를 입력하세요.';return;}
  const serial=++searchSerial,button=$('wv-memory-search-submit'),source=sourceSelect.value;
  imageSearchController?.abort();const controller=new AbortController();imageSearchController=controller;
  button.disabled=true;searchPage=0;queryResults=[];
  externalLinks(query);
  $('wv-memory-search-status').textContent='이미지 검색 중…';
  $('wv-memory-search-results').replaceChildren();
  try{
   // The official Google Custom Search JSON API is closed to new customers.
   // Link to Google's image results rather than scrape or claim API access.
   if(source==='google'){
    const destination=$('wv-memory-search-results');
    const notice=document.createElement('p');notice.className='wv-search-empty';
    notice.textContent='Google 이미지 검색은 Google 웹사이트에서 표시됩니다. 이미지를 저장하려면 원본 이용 조건을 확인한 후 파일을 내려받아 위의 파일 선택을 이용하세요.';
    const link=document.createElement('a');link.href=$('wv-memory-google-link').href;
    link.textContent='Google 이미지 검색 결과 열기';link.rel='noopener noreferrer';
    destination.append(notice,link);
    $('wv-memory-search-status').textContent='Google 이미지 웹 검색으로 연결할 수 있습니다. 앱 내부 결과 API는 제공되지 않습니다.';
    return;
   }
   const cacheKey=source+'|'+query.toLowerCase(),cache=searchCache.get(cacheKey);
   let results=source==='pixabay'?null:(cache&&Date.now()-cache.saved<600000?cache.results:null);
   let explanation='';
   if(!results){
    if(source==='commons')results=await commonsResults(query,controller.signal);
    else if(source==='pixabay'){
     if(pixabayKey.value.trim()){
      try{results=await pixabayResults(query,controller.signal);}
      catch(pixabayError){
       if(pixabayError.name==='AbortError')throw pixabayError;
       results=await commonsResults(query,controller.signal);
       explanation='Pixabay 검색 연결 실패 ('+pixabayError.message+')로 Wikimedia Commons 이미지를 표시합니다. API 키를 확인하고 연결 테스트를 실행하세요. ';
      }
     }else{
      results=await commonsResults(query,controller.signal);
      explanation='Pixabay API는 계정별 키가 필요합니다. 키 없이 Wikimedia Commons 이미지를 표시합니다. Pixabay 원본은 아래 사이트 링크에서 검색할 수 있습니다. ';
     }
    }else if(source==='unsplash'||source==='pexels'){
     const key=$('wv-memory-'+source+'-key').value.trim();
     if(!key){
      results=await commonsResults(query,controller.signal);
      explanation=(source==='unsplash'?'Unsplash':'Pexels')+'는 무료 API 키가 필요합니다. 키 등록 전에는 Wikimedia Commons 이미지를 표시합니다. ';
     }else{
      try{results=source==='unsplash'?
       await unsplashResults(query,controller.signal):await pexelsResults(query,controller.signal);}
      catch(providerError){
       if(providerError.name==='AbortError')throw providerError;
       results=await commonsResults(query,controller.signal);
       explanation=(source==='unsplash'?'Unsplash':'Pexels')+' 검색 실패 ('+providerError.message+')로 Wikimedia Commons 이미지를 표시합니다. ';
      }
     }
    }else{
     try{results=await openverseResults(query,controller.signal);}
     catch(openverseError){
      if(openverseError.name==='AbortError')throw openverseError;
      try{
       results=await commonsResults(query,controller.signal);
       explanation='Openverse 연결 오류 ('+openverseError.message+')로 Wikimedia Commons 결과를 표시합니다. ';
      }catch(commonsError){throw Error('Openverse: '+openverseError.message+' / Commons: '+commonsError.message);}
     }
     if(!results.length){
      results=await commonsResults(query,controller.signal);
      explanation='Openverse 검색 결과가 없어 Wikimedia Commons 결과로 전환했습니다. ';
     }
    }
    if(source!=='pixabay'&&!explanation){
     if(searchCache.size>12)searchCache.delete(searchCache.keys().next().value);
     searchCache.set(cacheKey,{saved:Date.now(),results});
    }
   }
   if(serial!==searchSerial||!current(w))return;
   queryResults=results;renderResults(w,results);
   if(explanation)$('wv-memory-search-status').textContent=explanation+$('wv-memory-search-status').textContent;
  }catch(error){
   if(serial===searchSerial&&current(w)&&error.name!=='AbortError')
    $('wv-memory-search-status').textContent='검색 오류: '+error.message+' · 아래 이미지 검색 사이트 링크를 이용할 수 있습니다.';
  }finally{if(serial===searchSerial){button.disabled=false;imageSearchController=null;}}
 }

 $('wv-memory-search-toggle').addEventListener('click',()=>{
  const panel=$('wv-memory-search-panel');panel.hidden=!panel.hidden;
  $('wv-memory-search-toggle').setAttribute('aria-expanded',String(!panel.hidden));
  if(!panel.hidden)$('wv-memory-search-query').focus();
 });
 $('wv-memory-search-form').addEventListener('submit',event=>{event.preventDefault();search();});
 $('wv-memory-open-archive').addEventListener('click',()=>{
  const modal=$('word-dialog');
  returnToCard=active?{
   id:active.id, scrollTop:modal.scrollTop,
   meaningShown:!$('detail-meaning').hidden,
   examplesOpen:!!$('word-examples-details')?.open,
   usageOpen:!!$('wv-word-usage')?.open,
   dictionaryOpen:!$('wv-dictionary-editor')?.hidden
  }:null;
  backLabel();
  modal.close();active=null;clear();showImage(null);
  globalThis.WordvilleShell?.activate('gallery');
 });
 $('wv-gallery-back').addEventListener('click',async()=>{
  const state=returnToCard;
  returnToCard=null;
  globalThis.WordvilleShell?.activate('learn');
  if(state){
   const word=words.find(w=>w.id===state.id);
   if(word){
    await openWord(word);
    if(state.meaningShown&&$('detail-meaning').hidden)$('reveal').click();
    if($('word-examples-details'))$('word-examples-details').open=state.examplesOpen;
    if($('wv-word-usage'))$('wv-word-usage').open=state.usageOpen;
    if(state.dictionaryOpen&&$('wv-dictionary-editor')?.hidden)
     $('wv-dictionary-toggle')?.click();
    $('word-dialog').scrollTop=state.scrollTop;
    $('wv-memory-open-archive').focus({preventScroll:true});
    return;
   }
  }
  $('search')?.focus({preventScroll:true});
 });
 $('wv-gallery-date').addEventListener('change',renderArchive);
 $('wv-gallery-refresh').addEventListener('click',renderArchive);
 function clear(){
  searchSerial++;imageSearchController?.abort();selectedId=null;queryResults=[];searchPage=0;
  revoked(wordUrls);
  $('wv-memory-photo-list').replaceChildren();
  $('wv-memory-search-results').replaceChildren();
 }
 globalThis.WordvilleGallery={mount,addFiles,removeCurrent,clear,renderArchive,
  isPrimarySelected:()=>!!active&&selectedId===key(active),
  get selectedId(){return selectedId;},
  getAll:all};
})();