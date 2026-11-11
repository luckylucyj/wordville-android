/* Day-specific vocabulary status + thought-coding notes.
 * Uses a separate IndexedDB: does not touch Wordville XP, reviews or memory images.
 */
(() => {
 'use strict';
 const N=globalThis.WordvilleNoteModel;
 const $=id=>document.getElementById(id);
 const dbName='wordville-thought-notes-v1',storeName='entries',historyStore='status-history';
 const cache=new Map();
 const history=[]; // Append-only status events; distinct from notes and review scores.
 let db=null,loadingError='',statusWord=null,noteWord=null,noteDirty=false;
 const statusDialog=$('wv-status-dialog'),noteDialog=$('wv-note-dialog');
 const ids={overview:'wv-note-overview',topic:'wv-note-topic',category:'wv-note-category',notes:'wv-note-body',opinion:'wv-note-opinion',summary:'wv-note-summary'};
 const pageDay=()=>$('day-filter').value;
 function dayOf(w,requested){
  const days=Array.isArray(w?.days)?w.days.filter(N.validDay).map(Number):[];
  if(requested!==''&&requested!==undefined&&requested!==null&&days.includes(Number(requested)))return Number(requested);
  return days[0]??0;
 }
 function getEntry(w,day){const d=dayOf(w,day);return cache.get(N.key(w.id,d))||N.blank(w.id,d);}
 function statusFor(w,day){return getEntry(w,day).status;}
 function statusClass(s){return 'wv-status-'+(s==='✓'?'ok':N.STATUS_IDS.has(s)?s:'N');}
 function openDb(){
  return new Promise((resolve,reject)=>{
   if(!globalThis.indexedDB)return reject(new Error('기기에서 IndexedDB를 지원하지 않습니다.'));
   const request=indexedDB.open(dbName,2);
   request.onupgradeneeded=()=>{
    if(!request.result.objectStoreNames.contains(storeName))request.result.createObjectStore(storeName,{keyPath:'key'});
    if(!request.result.objectStoreNames.contains(historyStore)){
     const changes=request.result.createObjectStore(historyStore,{keyPath:'id',autoIncrement:true});
     changes.createIndex('wordDay','key',{unique:false});
    }
   };
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||new Error('노트 저장소를 열지 못했습니다.'));
   request.onblocked=()=>reject(new Error('다른 앱 창에서 노트 저장소를 사용 중입니다.'));
  });
 }
 function readAll(database,table=storeName){
  return new Promise((resolve,reject)=>{
   const tx=database.transaction(table,'readonly'),req=tx.objectStore(table).getAll();
   req.onsuccess=()=>resolve(req.result||[]);
   req.onerror=()=>reject(req.error||new Error('노트를 불러올 수 없습니다.'));
  });
 }
 function put(entry,event=null){
  return new Promise((resolve,reject)=>{
   if(!db)return reject(new Error(loadingError||'저장소가 준비되지 않았습니다.'));
   // A status change and its history event commit together or not at all.
   const tx=db.transaction(event?[storeName,historyStore]:[storeName],'readwrite');
   tx.objectStore(storeName).put(entry);
   let assigned=null;
   if(event){
    const req=tx.objectStore(historyStore).add(event);
    req.onsuccess=()=>{assigned=req.result;};
   }
   tx.oncomplete=()=>{
    cache.set(entry.key,entry);
    if(event){history.push({...event,id:assigned});history.sort(eventSort);}
    resolve(entry);
   };
   tx.onerror=()=>reject(tx.error||new Error('노트 저장에 실패했습니다.'));
   tx.onabort=()=>reject(tx.error||new Error('노트 저장이 중단됐습니다.'));
  });
 }
 function eventSort(a,b){return Date.parse(a.occurredAt)-Date.parse(b.occurredAt)||Number(a.id||0)-Number(b.id||0);}
 function localNow(){
  const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
 }
 function eventsFor(w,day){
  const k=N.key(w.id,dayOf(w,day));
  return history.filter(e=>e.key===k).sort(eventSort);
 }
 function displayDate(value){
  return new Date(value).toLocaleString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
 }
 function renderStatusHistory(){
  const list=$('wv-status-history-list');list.replaceChildren();
  if(!statusWord)return;
  const changes=eventsFor(statusWord,$('wv-status-day').value).slice().reverse();
  if(!changes.length){list.append(makeEl('p','아직 기록된 상태 변경 이력이 없습니다. 이번에 저장하는 기록부터 표시됩니다.','wv-empty-history'));return;}
  for(const e of changes){
   const item=makeEl('article',undefined,'wv-history-event');
   const header=makeEl('div',undefined,'wv-history-head');
   const code=makeEl('b',(e.from?e.from+' → ':'')+e.to,statusClass(e.to));
   const kind=e.kind==='initial'?'최초 체크':e.kind==='recheck'?'상태 유지·재점검':'상태 변경';
   header.append(code,makeEl('span',kind+' · '+displayDate(e.occurredAt)));
   item.append(header,makeEl('p',e.reason||'원인 메모 없음'));
   list.append(item);
  }
 }
 function daysOptions(select,w,value){
  select.replaceChildren();
  const days=[...new Set((w.days||[]).filter(N.validDay).map(Number))];
  if(!days.length)days.push(0);
  for(const day of days){const o=new Option(N.dayLabel(day),String(day));select.add(o);}
  const chosen=dayOf(w,value);
  select.value=String(chosen);
 }
 function wordById(id){return words.find(w=>w.id===id)||null;}
 function exposeStatus(w,day){
  statusWord=w;
  daysOptions($('wv-status-day'),w,day);
  $('wv-status-word-name').textContent=w.word+' · '+w.meaning;
  showStatusSelection();
  $('wv-status-message').textContent=loadingError||'';
  if($('word-dialog').open)$('word-dialog').close();
  if(!statusDialog.open)statusDialog.showModal();
 }
 function showStatusSelection(){
  if(!statusWord)return;
  const item=getEntry(statusWord,$('wv-status-day').value);
  const radio=statusDialog.querySelector('input[name="wv-study-status"][value="'+item.status+'"]');
  if(radio)radio.checked=true;
  $('wv-status-date').value=localNow();
  $('wv-status-reason').value='';
  showReasonChoices();
  const old=$('wv-status-legacy');
  old.hidden=!item.legacyStatus;
  if(item.legacyStatus)old.textContent='이전 기록: '+N.LEGACY_LABEL[item.legacyStatus]+' → '+item.status+' (임시 분류). 이전 상태의 정확한 원인을 알 수 없어 직접 다시 선택해 주세요.';
  $('wv-status-message').textContent='';
  renderStatusHistory();
 }
 const reasonPresets={
  'N':['처음 보는 단어','반복해서 봐도 계속 낯설게 느껴짐'],
  'R':['봤지만 뜻이 생각나지 않음','5번 봤지만 회상 실패','어제 기억했지만 오늘 잊음'],
  'F':['대략 알지만 뜻이 흐릿함','유사한 뜻 중 정확한 의미를 구분하지 못함'],
  'X':['비슷한 철자의 단어와 혼동','다른 단어의 한국어 뜻과 혼동'],
  'U':['한국어 번역의 개념을 이해하지 못함','정의를 봐도 의미를 설명할 수 없음'],
  'C':['번역은 알지만 쓰이는 상황을 모르겠음','실제 대화에서 자연스럽게 사용하지 못함'],
  '✓':['뜻을 가리지 않고 스스로 회상 성공','예문에서 의미를 바로 이해함']
 };
 function showReasonChoices(){
  const chosen=statusDialog.querySelector('input[name="wv-study-status"]:checked')?.value||'N';
  const sel=$('wv-status-reason-preset');
  sel.replaceChildren(new Option('직접 입력 또는 선택', ''));
  for(const reason of reasonPresets[chosen]||[])sel.add(new Option(reason,reason));
  $('wv-status-advice').textContent='권장 행동: '+N.statusMeta(chosen).action;
 }
 function exposeNote(w,day){
  noteWord=w;noteDirty=false;
  daysOptions($('wv-note-day'),w,day);
  $('wv-note-day').dataset.lastDay=$('wv-note-day').value;
  $('wv-note-word-name').textContent=w.word+' · '+w.meaning;
  if(statusDialog.open)statusDialog.close();
  if($('word-dialog').open)$('word-dialog').close();
  showNoteValues();
  if(!noteDialog.open)noteDialog.showModal();
 }
 function showNoteValues(){
  if(!noteWord)return;
  const entry=getEntry(noteWord,$('wv-note-day').value);
  for(const f of N.FIELD_NAMES){
   const prefill=!entry.updatedAt&&f==='topic'?noteWord.word:!entry.updatedAt&&f==='overview'?noteWord.meaning:'';
   $(ids[f]).value=entry[f]||prefill;
  }
  noteDialog.querySelectorAll('[data-check]').forEach(el=>el.checked=entry.checks[Number(el.dataset.check)]===true);
  $('wv-note-state-label').textContent='학습 상태: '+N.statusName(entry.status);
  $('wv-note-message').textContent=loadingError||'';
  noteDirty=false;
 }
 function noteData(){
  const d=Number($('wv-note-day').value),existing=getEntry(noteWord,d),next={...existing};
  for(const f of N.FIELD_NAMES)next[f]=$(ids[f]).value;
  next.checks=Array.from(noteDialog.querySelectorAll('[data-check]')).map(el=>el.checked);
  next.updatedAt=new Date().toISOString();
  return N.clean(next,noteWord.id,d);
 }
 function cancelNote(){
  if(noteDirty&&!confirm('저장하지 않은 노트 변경 사항을 버릴까요?'))return false;
  noteDirty=false;noteDialog.close();return true;
 }
 function cardButtons(row,w,day){
  const selected=dayOf(w,day),entry=getEntry(w,selected);
  const actions=document.createElement('div');actions.className='wv-word-actions';
  const status=document.createElement('button');status.type='button';status.className='wv-word-status '+statusClass(entry.status);
  status.textContent=entry.status;
  status.title=entry.status+' · '+N.statusName(entry.status)+(entry.legacyStatus?' (이전 상태 재분류 필요)':'');
  status.setAttribute('aria-label',w.word+' '+N.dayLabel(selected)+' 상태 '+entry.status+' '+N.statusName(entry.status)+' 변경');
  status.addEventListener('click',()=>exposeStatus(w,selected));
  // Put exactly one character next to the word, never a full status label.
  const head=document.createElement('div');head.className='wv-word-head';
  const wordButton=row.querySelector('.word');
  if(wordButton)head.append(wordButton,status);
  row.prepend(head);
  const note=document.createElement('button');note.type='button';note.className='wv-word-note';
  note.textContent=N.hasContent(entry)?'📝 노트 보기':'＋ 노트';
  note.setAttribute('aria-label',w.word+' '+N.dayLabel(selected)+' 생각코딩 노트 편집');
  note.addEventListener('click',()=>exposeNote(w,selected));
  actions.append(note);row.append(actions);
 }
 function renderSummary(){
  if(!$('wv-day-status-summary'))return;
  const day=pageDay();
  const matching=words.filter(w=>day===''||(w.days||[]).includes(Number(day)));
  const stats=N.distribution(matching.map(w=>getEntry(w,day)));
  $('wv-day-status-summary').textContent=(day===''?'전체 Day':N.dayLabel(day))+' · '+matching.length+'개 | 체크 '+stats.marked+' · 미기록 '+stats.unmarked+' · ✓ '+stats.counts['✓']+'개';
 }
 function sync(){
  if(typeof renderWords==='function'&&words.length)renderWords();
  renderArchive();
 }
 function makeEl(tag,content,className){
  const e=document.createElement(tag);
  if(content!==undefined)e.textContent=content;
  if(className)e.className=className;
  return e;
 }
 function renderArchive(){
  const container=$('wv-note-archive-list');
  if(!container)return;
  container.replaceChildren();
  const archiveDay=$('wv-notes-day').value,status=$('wv-notes-filter').value;
  const saved=[...cache.values()].filter(entry=>
    N.hasContent(entry)&&(archiveDay==='all'||entry.day===Number(archiveDay))&&(status==='all'||entry.status===status));
  saved.sort((a,b)=>a.day-b.day||a.wordId.localeCompare(b.wordId));
  if(archiveDay!=='all'&&saved.length>1){
   const sorted=globalThis.WordvilleBookOrder?.sort(words.filter(w=>w.days.includes(Number(archiveDay))),archiveDay)||[];
   const rank=new Map(sorted.map((w,i)=>[w.id,i]));
   saved.sort((a,b)=>(rank.get(a.wordId)??1e7)-(rank.get(b.wordId)??1e7));
  }
  $('wv-note-archive-status').textContent='저장된 노트 및 상태 '+saved.length+'건';
  if(!saved.length){container.append(makeEl('p','이 Day에 저장된 노트나 체크한 학습 상태가 없습니다. 단어장에서 상태나 노트를 입력해 보세요.','wv-empty-notes'));globalThis.WordvilleStatusCharts?.render(archiveDay);return;}
  const fragment=document.createDocumentFragment();
  for(const entry of saved){
   const w=wordById(entry.wordId);if(!w)continue;
   const item=makeEl('article',undefined,'wv-note-archive-card');
   const head=makeEl('div',undefined,'wv-note-archive-head');
   const title=makeEl('strong',w.word);
   const tag=makeEl('span',N.dayLabel(entry.day)+' · '+entry.status+' '+N.statusName(entry.status),statusClass(entry.status));
   head.append(title,tag);
   const brief=(entry.summary||entry.notes||entry.overview||entry.opinion||w.meaning).trim();
   const excerpt=makeEl('p',brief.length>110?brief.slice(0,110)+'…':brief,'wv-note-excerpt');
   const review=makeEl('small','점검 '+entry.checks.filter(Boolean).length+'/5'+(entry.updatedAt?' · '+new Date(entry.updatedAt).toLocaleDateString('ko-KR'):''),'wv-note-archive-sub');
   const actions=makeEl('div',undefined,'wv-note-archive-actions');
   const b=makeEl('button','노트 열기');b.type='button';b.addEventListener('click',()=>exposeNote(w,entry.day));
   const c=makeEl('button','상태 변경');c.type='button';c.addEventListener('click',()=>exposeStatus(w,entry.day));
   actions.append(b,c);item.append(head,excerpt,review,actions);fragment.append(item);
  }
  container.append(fragment);
  globalThis.WordvilleStatusCharts?.render(archiveDay);
 }
 function initSelects(){
  const select=$('wv-notes-day');
  for(let d=0;d<=30;d++)select.add(new Option(N.dayLabel(d),String(d)));
  select.addEventListener('change',renderArchive);
  $('wv-notes-filter').addEventListener('change',renderArchive);
  $('wv-open-day-notes').addEventListener('click',()=>{
   $('wv-notes-day').value=pageDay()===''?'all':pageDay();
   globalThis.WordvilleShell?.activate('notes');renderArchive();
  });
 }
 $('wv-status-day').addEventListener('change',showStatusSelection);
 statusDialog.querySelectorAll('input[name="wv-study-status"]').forEach(radio=>radio.addEventListener('change',showReasonChoices));
 $('wv-status-reason-preset').addEventListener('change',()=>{
  if($('wv-status-reason-preset').value)$('wv-status-reason').value=$('wv-status-reason-preset').value;
 });
 $('wv-status-close').addEventListener('click',()=>statusDialog.close());
 $('wv-status-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!statusWord)return;
  const d=Number($('wv-status-day').value),radio=statusDialog.querySelector('input[name="wv-study-status"]:checked');
  if(!radio){$('wv-status-message').textContent='학습 상태를 선택하세요.';return;}
  const base=getEntry(statusWord,d),dateInput=$('wv-status-date').value;
  const changedAt=new Date(dateInput);
  if(!dateInput||!Number.isFinite(changedAt.getTime())){$('wv-status-message').textContent='유효한 날짜와 시간을 선택해 주세요.';return;}
  const occurredAt=changedAt.toISOString(),reason=$('wv-status-reason').value.trim();
  const kind=!base.hasStatus?'initial':base.status===radio.value?'recheck':'change';
  const next=N.clean({...base,status:radio.value,hasStatus:true,legacyStatus:'',statusChangedAt:occurredAt,updatedAt:new Date().toISOString()},statusWord.id,d);
  const eventRecord={key:next.key,wordId:statusWord.id,day:d,from:base.hasStatus?base.status:null,to:radio.value,
   kind,reason,occurredAt,recordedAt:new Date().toISOString()};
  const button=statusDialog.querySelector('button[type="submit"]');button.disabled=true;
  try{await put(next,eventRecord);statusDialog.close();sync();}
  catch(error){$('wv-status-message').textContent='저장 실패: '+error.message;}
  finally{button.disabled=false;}
 });
 $('wv-status-to-note').addEventListener('click',()=>{if(statusWord)exposeNote(statusWord,$('wv-status-day').value);});
 $('wv-word-status').addEventListener('click',()=>{if(active)exposeStatus(active,pageDay());});
 $('wv-word-note').addEventListener('click',()=>{if(active)exposeNote(active,pageDay());});
 $('wv-note-form').addEventListener('input',event=>{if(event.target.id!=='wv-note-day')noteDirty=true;});
 $('wv-note-form').addEventListener('change',event=>{if(event.target.id!=='wv-note-day')noteDirty=true;});
 $('wv-note-close').addEventListener('click',cancelNote);
 $('wv-note-day').addEventListener('change',event=>{
  if(!noteWord)return;
  const prev=event.target.dataset.lastDay??String(dayOf(noteWord,pageDay()));
  if(noteDirty&&!confirm('저장하지 않은 변경 사항이 있습니다. 현재 Day의 변경 내용을 버리고 이동할까요?')){
   event.target.value=prev;return;
  }
  event.target.dataset.lastDay=event.target.value;
  showNoteValues();
 });
 $('wv-note-check-status').addEventListener('click',()=>{
  if(!noteWord)return;
  if(noteDirty&&!confirm('저장하지 않은 필기를 버리고 상태 체크로 이동할까요?'))return;
  const w=noteWord,d=$('wv-note-day').value;noteDirty=false;noteDialog.close();exposeStatus(w,d);
 });
 $('wv-note-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!noteWord)return;
  const saveBtn=$('wv-note-save');saveBtn.disabled=true;
  try{const next=noteData();await put(next);noteDirty=false;$('wv-note-message').textContent='저장 완료 · '+N.dayLabel(next.day)+' · '+new Date(next.updatedAt).toLocaleString('ko-KR');sync();}
  catch(err){$('wv-note-message').textContent='저장 실패: '+err.message;}
  finally{saveBtn.disabled=false;}
 });
 noteDialog.addEventListener('cancel',event=>{if(noteDirty){event.preventDefault();cancelNote();}});
 noteDialog.addEventListener('close',()=>{noteDirty=false;});
 const ready=(async()=>{
  try{db=await openDb();for(const item of await readAll(db)){
    if(!item?.wordId||!N.validDay(item.day))continue;
    const normalized=N.clean(item,item.wordId,item.day);cache.set(normalized.key,normalized);
   }
   for(const raw of await readAll(db,historyStore)){
    const event=N.normalizeEvent(raw);if(event)history.push(event);
   }
   history.sort(eventSort);
  }
  catch(err){loadingError=err.message;console.warn('Wordville notes storage:',err.message);}
  sync();return !loadingError;
 })();
 const api={ready,statusFor,attachCard:cardButtons,renderSummary,renderArchive,openNote:exposeNote,openStatus:exposeStatus,get:(w,d)=>getEntry(w,d),eventsFor,
   get events(){return history.slice();},get count(){return cache.size;},get error(){return loadingError;}};
 globalThis.WordvilleStudy=api;
 initSelects();renderArchive();
})();
