'use strict';
const $=id=>document.getElementById(id), E=Wordville;
let state=E.fresh(),words=[],active=null,queue=[],reviewWord=null,db=null;
let cloudUser=null, imageBusy=false;
const cloud=globalThis.WordvilleCloud, bucket=globalThis.WordvilleCloudConfig?.bucket;
const storageKey='wordville.rebuilt.v1';
function notify(message){$('notice').textContent=message;}
try{const raw=localStorage.getItem(storageKey);if(raw){const s=JSON.parse(raw);if(s.version!==1||!Number.isFinite(s.xp)||!Number.isFinite(s.coins)||!s.reviews||!Array.isArray(s.concepts))throw Error();state=s;}}catch{notify('기록을 읽지 못했습니다. 저장 공간 설정을 확인해 주세요.');}
function save(next){try{localStorage.setItem(storageKey,JSON.stringify(next));state=next;renderStats();return true;}catch{notify('저장에 실패했습니다. 저장 공간을 확인해 주세요.');return false;}}
function renderStats(){$('balance').textContent=`${state.xp} XP · ${state.coins} 코인`;renderDue();}
function renderDue(){$('due').textContent=`복습할 단어 ${words.filter(w=>!state.reviews[w.id]||state.reviews[w.id].due<=Date.now()).length}개 · 정답은 1·3·7·14·30일, 오답은 10분 뒤 복습` ;}
function make(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
let wordPage=0;
const PAGE_SIZE=60;
function filteredWords(){const query=$('search').value.trim().toLowerCase(),day=$('day-filter').value,flag=$('wv-status-filter')?.value||'all';const list=words.filter(w=>(day===''||(w.days||[]).includes(Number(day)))&&(!query||w.word.toLowerCase().includes(query)||w.meaning.toLowerCase().includes(query))&&(flag==='all'||(globalThis.WordvilleStudy?.statusFor(w,day)||'new')===flag));return globalThis.WordvilleBookOrder?.sort(list,day)||list;}
function renderScope(){const list=filteredWords(),day=$('day-filter').value,query=$('search').value.trim();$('review-scope').textContent=`복습 범위: ${day==='0'?'이디엄':day?'Day '+day:'전체 Day'}${query?' · 검색: '+query:''} · ${list.length}개 중 복습할 단어`;}
function renderWords(){const filtered=filteredWords(),pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));wordPage=Math.min(wordPage,pages-1);$('words').replaceChildren();const fragment=document.createDocumentFragment();for(const w of filtered.slice(wordPage*PAGE_SIZE,(wordPage+1)*PAGE_SIZE)){const button=make('button',undefined,'word');button.append(make('strong',w.word),make('span',w.meaning));button.addEventListener('click',()=>openWord(w));const row=make('div',undefined,'wv-word-item');row.append(button);globalThis.WordvilleStudy?.attachCard(row,w,$('day-filter').value);fragment.append(row);}$('words').append(fragment);if(!filtered.length)$('words').append(make('p','검색 결과가 없습니다.'));$('filter-count').textContent=`검색 결과 ${filtered.length}개 · PDF 수록 순서 · 한 페이지 60개`;$('page-info').textContent=`${wordPage+1} / ${pages} 쪽`;$('prev-page').disabled=wordPage===0;$('next-page').disabled=wordPage>=pages-1;renderScope();globalThis.WordvilleStudy?.renderSummary();}
$('prev-page').addEventListener('click',()=>{wordPage--;renderWords();$('filter-count').scrollIntoView({block:'start'});});
$('next-page').addEventListener('click',()=>{wordPage++;renderWords();$('filter-count').scrollIntoView({block:'start'});});
$('day-filter').addEventListener('change',()=>{wordPage=0;renderWords();});
$('wv-status-filter').addEventListener('change',()=>{wordPage=0;renderWords();});
function openDatabase(){return new Promise((resolve,reject)=>{const req=indexedDB.open('wordville-memory',1);req.onupgradeneeded=()=>req.result.createObjectStore('images');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function imageAction(mode,key,value){return new Promise((resolve,reject)=>{if(!db)return reject(Error('이미지 저장소를 사용할 수 없습니다.'));const tx=db.transaction('images',mode==='get'?'readonly':'readwrite');const store=tx.objectStore('images');let request=mode==='get'?store.get(key):mode==='put'?store.put(value,key):store.delete(key);let result;request.onsuccess=()=>result=request.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
let imageUrl=null;
function showImage(blob){if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl=blob?URL.createObjectURL(blob):null;$('memory-image').hidden=!blob;$('remove-image').hidden=!blob;if(blob)$('memory-image').src=imageUrl;else $('memory-image').removeAttribute('src');refreshImageButtons();}
function renderWordConversations(w){
 const list=$('word-examples-list'),details=$('word-examples-details');
 if(!list||!details)return;
 const day=$('day-filter').value || w.days?.find(d=>d>0) || 0;
 const examples=globalThis.WordvilleConversations?.get(w,day)||[];
 const cards=document.createDocumentFragment();
 for(const item of examples){
  const li=document.createElement('li');
  const category=document.createElement('span');
  category.className='example-context';
  category.textContent='Day '+String(Number(day)).padStart(2,'0')+' · '+item.topic;
  const english=document.createElement('p');
  english.className='example-en';
  english.lang='en';
  english.textContent=item.english;
  li.append(category,english);
  cards.append(li);
 }
 list.replaceChildren(cards);
 details.open=false;
 $('word-examples-toggle').textContent='영어 대화 예시 '+examples.length+'개 펼치기';
}
async function openWord(w){active=w;renderWordConversations(w);$('detail-source').textContent=(w.days?.length?'Day '+w.days.map(d=>d===0?'이디엄':d).join(', '):'기존 예시')+(w.pdfPages?.length?' · PDF '+w.pdfPages.join(', ')+'쪽':'');$('detail-word').textContent=w.word;$('detail-meaning').textContent=w.meaning;$('detail-meaning').hidden=true;$('reveal').hidden=false;$('reveal').textContent='뜻 보기';$('reveal').setAttribute('aria-expanded','false');$('detail-example').textContent=w.example||'';$('detail-translation').textContent=w.translation||'';$('role').textContent=w.role||'나의 기억 이미지';$('dialogue').textContent=w.dialogue||'단어와 연결할 이미지를 직접 저장해 보세요.';$('detail-status').textContent='';$('image-input').value='';showImage(null);$('word-dialog').showModal();try{const blob=await readMemoryImage(w.id);if(active===w)showImage(blob);}catch{$('detail-status').textContent='이미지 저장소를 사용할 수 없습니다.';}}
function renderConcepts(){$('concepts').replaceChildren();if(!state.concepts.length)$('concepts').append(make('p','아직 저장한 개념이 없습니다. 조합실에서 만들어 보세요.'));for(const c of state.concepts){const card=make('article',undefined,'card');card.append(make('h3',c.name),make('p',`${c.a} + ${c.b}`));$('concepts').append(card);}}
function connection(){const a=words.find(w=>w.id===$('word-a').value),b=words.find(w=>w.id===$('word-b').value);if(!a||!b)return;$('connection').textContent=`${a.meaning} + ${b.meaning} — 두 뜻을 함께 사용하는 상황을 떠올리고 이름을 입력해 주세요.`;}
function nextQuestion(){reviewWord=queue.shift();$('answer-result').textContent='';$('next').hidden=true;$('answer').value='';$('answer-form').hidden=!reviewWord;if(!reviewWord){$('question').textContent='이번 복습을 마쳤어요.';return;}$('question').textContent=reviewWord.word;$('answer').focus();}
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{for(const id of ['learn','review','lab','book'])$(id).hidden=button.dataset.tab!==id;document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===button)));renderDue();renderConcepts();}));
$('search').addEventListener('input',()=>{wordPage=0;renderWords();});
$('close-dialog').addEventListener('click',()=>{$('word-dialog').close();active=null;showImage(null);});
$('reveal').addEventListener('click',()=>{const show=$('detail-meaning').hidden;$('detail-meaning').hidden=!show;$('reveal').textContent=show?'뜻 숨기기':'뜻 보기';$('reveal').setAttribute('aria-expanded',String(show));});
$('learned').addEventListener('click',()=>{if(!active)return;if(save({...state,reviews:{...state.reviews,[active.id]:state.reviews[active.id]||{streak:0,attempts:0,due:Date.now()}}}))$('detail-status').textContent='학습을 기록했습니다. 복습 메뉴에서 뜻을 입력해 보세요.';});
function localImageKey(id, uid=cloudUser?.id){return uid?`${uid}/${id}`:id;}
function cloudPath(id,uid=cloudUser?.id){if(!uid)throw Error('먼저 로그인해 주세요.');return `${uid}/${id}`;}
function imageLock(value){imageBusy=value;for(const id of ['image-input','remove-image','sync-image'])$(id).disabled=value;}
function refreshImageButtons(){ $('sync-image').hidden=!cloudUser||$('memory-image').hidden; }
async function readMemoryImage(id){
 const uid=cloudUser?.id,ids=E.wordIds(words.find(w=>w.id===id)||{id});
 let cached=null;for(const candidate of ids){try{cached=await imageAction('get',localImageKey(candidate,uid));}catch{}if(cached)break;}
 if(!uid||!cloud)return cached;
 for(const candidate of ids){
  const {data,error}=await cloud.storage.from(bucket).download(cloudPath(candidate,uid));
  if(error)continue;
  try{await imageAction('put',localImageKey(id,uid),data);}catch{}
  return data;
 }
 if(active?.id===id)$('detail-status').textContent=cached?'기기에 저장된 이미지를 표시합니다. 서버 불러오기는 완료하지 못했습니다.':'서버에 저장된 이미지가 없거나 연결하지 못했습니다.';
 return cached;
}
$('image-input').addEventListener('change',async event=>{
 const file=event.target.files[0],w=active,uid=cloudUser?.id;if(!file||!w||imageBusy)return;
 if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>5*1024*1024){$('detail-status').textContent='5MB 이하의 PNG·JPG·WebP·GIF 파일을 선택해 주세요.';return;}
 imageLock(true);
 try{
  let localSaved=false;try{await imageAction('put',localImageKey(w.id,uid),file);localSaved=true;}catch{}
  if(active===w){showImage(file);$('detail-status').textContent=uid?'서버에 저장 중…':localSaved?'기억용 이미지를 기기에 저장했습니다. 로그인하면 서버에도 저장할 수 있어요.':'기기 저장에 실패했습니다.';}
  if(uid&&cloud){if(cloudUser?.id!==uid)throw Error('계정이 바뀌었습니다. 다시 선택해 주세요.');const {error}=await cloud.storage.from(bucket).upload(cloudPath(w.id,uid),file,{upsert:true,contentType:file.type});if(error)throw Error(localSaved?'기기에는 저장했지만 서버 저장에 실패했습니다. 아래 서버 저장 버튼으로 다시 시도해 주세요.':'서버 저장에 실패했습니다. 연결 상태를 확인해 주세요.');if(active===w)$('detail-status').textContent='기억용 이미지를 서버에 저장했습니다.';}
 }catch(e){if(active===w)$('detail-status').textContent=e.message;}finally{imageLock(false);refreshImageButtons();}
});
$('sync-image').addEventListener('click',async()=>{const w=active,uid=cloudUser?.id;if(!w||!uid||imageBusy)return;imageLock(true);try{const file=await imageAction('get',localImageKey(w.id,uid));if(!file)throw Error('먼저 이미지를 선택해 주세요.');const {error}=await cloud.storage.from(bucket).upload(cloudPath(w.id,uid),file,{upsert:true,contentType:file.type});if(error)throw Error('서버 저장에 실패했습니다. 다시 로그인하거나 인터넷 연결을 확인해 주세요.');if(active===w)$('detail-status').textContent='기억용 이미지를 서버에 저장했습니다.';}catch(e){if(active===w)$('detail-status').textContent=e.message;}finally{imageLock(false);}});
$('remove-image').addEventListener('click',async()=>{const w=active,uid=cloudUser?.id;if(!w||imageBusy)return;imageLock(true);try{if(uid&&cloud){const {error}=await cloud.storage.from(bucket).remove(E.wordIds(w).map(id=>cloudPath(id,uid)));if(error)throw Error('서버 이미지를 삭제하지 못했습니다. 연결 상태를 확인해 주세요.');}for(const id of E.wordIds(w))await imageAction('delete',localImageKey(id,uid));if(active===w){showImage(null);$('detail-status').textContent=uid?'서버와 기기에서 이미지를 삭제했습니다.':'기기에서 이미지를 삭제했습니다.';}}catch(e){if(active===w)$('detail-status').textContent=e.message;}finally{imageLock(false);}});
$('start-review').addEventListener('click',()=>{const list=filteredWords().filter(w=>!state.reviews[w.id]||state.reviews[w.id].due<=Date.now());const limit=$('review-limit').value;queue=limit==='all'?list:list.slice(0,Number(limit));$('review-card').hidden=false;nextQuestion();});
$('answer-form').addEventListener('submit',event=>{event.preventDefault();if(!reviewWord)return;const correct=E.isCorrect($('answer').value,reviewWord.meaning);const next=E.review(state,reviewWord.id,correct);if(!save(next))return;$('answer-result').textContent=correct?'정답입니다. +10 XP · +3 코인':`뜻: ${reviewWord.meaning}. 10분 뒤 다시 복습해요.`;$('answer-form').hidden=true;$('next').hidden=false;reviewWord=null;});
$('next').addEventListener('click',nextQuestion);
$('combine-form').addEventListener('submit',event=>{event.preventDefault();try{if(save(E.combine(state,$('word-a').value,$('word-b').value,$('concept-name').value))){notify('개념 도감에 저장했습니다. +15 XP · +5 코인');$('concept-name').value='';}}catch(e){notify(e.message);}});
$('word-a').addEventListener('change',connection);$('word-b').addEventListener('change',connection);
$('random').addEventListener('click',()=>{let a=Math.floor(Math.random()*words.length),b=(a+1+Math.floor(Math.random()*(words.length-1)))%words.length;$('word-a').selectedIndex=a;$('word-b').selectedIndex=b;connection();});
function migrateLearningAliases(){const next=E.migrateAliases(state,words);if(next!==state){localStorage.setItem('wordville.learning.before-vocabulary-audit',JSON.stringify(state));save(next);}}
async function init(){try{db=await openDatabase();}catch{notify('기억용 이미지 저장을 사용할 수 없습니다.');}try{const res=await fetch('words.json');if(!res.ok)throw Error();words=await res.json();if(!globalThis.WordvilleBookOrder?.prepare(words))notify('PDF 순서 정보를 확인하지 못해 기존 순서로 표시합니다.');migrateLearningAliases();$('word-count').textContent=`총 ${words.length.toLocaleString()}개`;for(const day of [...new Set(words.flatMap(w=>w.days||[]))].sort((a,b)=>a-b)){const option=make('option',day===0?'이디엄':`Day ${String(day).padStart(2,'0')}`);option.value=day;$('day-filter').append(option);}for(const w of words){for(const id of ['word-a','word-b']){const option=make('option',`${w.word} · ${w.meaning}`);option.value=w.id;$(id).append(option);}}$('word-b').selectedIndex=1;connection();renderWords();renderStats();}catch{notify('단어장을 불러오지 못했습니다. 앱을 다시 실행해 주세요.');}}
init();

function authState(user){
 const changed=cloudUser?.id!==user?.id;cloudUser=user||null;
 $('cloud-auth').hidden=!!user;$('cloud-account').hidden=!user;$('cloud-status').textContent=user?'로그인됨 · 이미지 서버 저장':'로그인 전 · 기기에 저장';
 $('cloud-user').textContent=user?`${user.email} · 내 이미지만 표시됩니다.`:'';
 if(changed&&active){$('word-dialog').close();active=null;showImage(null);}
 refreshImageButtons();
}
function credentials(){if(!$('cloud-auth').reportValidity())return null;return {email:$('cloud-email').value.trim(),password:$('cloud-password').value};}
function authMessage(s){$('cloud-message').textContent=s;}
let authBusy=false;
async function authAction(kind){
 const value=credentials();if(!value||authBusy)return;if(!cloud){authMessage('서버 연결 모듈을 불러오지 못했습니다. 앱을 다시 실행해 주세요.');return;}authBusy=true;
 const buttons=$('cloud-auth').querySelectorAll('button');buttons.forEach(b=>b.disabled=true);authMessage(kind==='signup'?'가입 처리 중…':'로그인 중…');
 try{const {data,error}=await (kind==='signup'?cloud.auth.signUp(value):cloud.auth.signInWithPassword(value));if(error)throw error;
 $('cloud-password').value='';if(data.session){authState(data.user);authMessage('로그인했습니다. 이미지를 선택하면 서버에 저장됩니다.');}
 else authMessage('가입 요청을 보냈습니다. 이메일의 인증 링크를 연 다음, 앱으로 돌아와 로그인해 주세요. 이미 가입한 이메일이라면 기존 비밀번호로 로그인하세요.');
 }catch(e){authMessage(e.code==='email_not_confirmed'?'이메일 인증 후 로그인해 주세요.':kind==='signup'?'가입하지 못했습니다. 이메일·비밀번호 또는 잠시 후 다시 시도해 주세요.':'로그인하지 못했습니다. 이메일 인증 여부와 비밀번호, 인터넷 연결을 확인해 주세요.');}
 finally{authBusy=false;buttons.forEach(b=>b.disabled=false);}
}
$('cloud-auth').addEventListener('submit',e=>{e.preventDefault();authAction('signin');});
$('cloud-signup').addEventListener('click',()=>authAction('signup'));
$('cloud-logout').addEventListener('click',async()=>{const {error}=await cloud.auth.signOut();if(error){authMessage('로그아웃하지 못했습니다. 연결 상태를 확인해 주세요.');return;}authState(null);authMessage('로그아웃했습니다.');});
$('upload-local-images').addEventListener('click',async e=>{
 const uid=cloudUser?.id;if(!uid)return;e.currentTarget.disabled=true;let count=0;authMessage('기존 이미지를 서버에 복사하는 중…');
 try{for(const w of words){if(cloudUser?.id!==uid)throw Error();let file=null;for(const id of E.wordIds(w)){file=await imageAction('get',id);if(file)break;}if(!file)continue;
 if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))continue;
 const {error}=await cloud.storage.from(bucket).upload(cloudPath(w.id,uid),file,{upsert:true,contentType:file.type});if(error)throw error;await imageAction('put',localImageKey(w.id,uid),file);count++;}authMessage(`${count}개 이미지를 서버에 복사했습니다. 기존 기기 원본은 유지됩니다.`);
 }catch{authMessage(`${count}개 저장 후 중단됐습니다. 연결을 확인하고 다시 시도해 주세요.`);}finally{e.currentTarget.disabled=false;}
});
if(cloud){cloud.auth.onAuthStateChange((_event,session)=>{authState(session?.user||null);});cloud.auth.getSession().then(({data,error})=>{if(error)authMessage('로그인 정보를 확인하지 못했습니다. 다시 로그인해 주세요.');else authState(data.session?.user||null);});}else{$('cloud-status').textContent='서버 모듈 로드 실패';}
document.addEventListener('village-study',e=>{const w=words.find(w=>E.wordIds(w).includes(e.detail.word));if(w)openWord(w);});

/* Explicit learning snapshot sync; existing device records stay untouched until chosen. */
(function(){
 const host=$('cloud-account'); if(!host)return;
 const box=document.createElement('section');box.className='card';
 const heading=document.createElement('h3');heading.textContent='학습 기록 · 다이어리 연동';
 const info=document.createElement('p');info.textContent='XP·코인·복습·개념 기록을 같은 계정의 다이어리에서 확인합니다. 서버 저장과 불러오기는 직접 선택합니다.';
 const msg=document.createElement('p');msg.setAttribute('role','status');
 const push=document.createElement('button');push.type='button';push.textContent='이 기기 학습 기록 서버에 저장';
 const pull=document.createElement('button');pull.type='button';pull.textContent='서버 학습 기록 이 기기로 불러오기';
 box.append(heading,info,push,pull,msg);host.append(box);
 let working=false;
 function valid(s){return s&&s.version===1&&Number.isFinite(s.xp)&&s.xp>=0&&Number.isFinite(s.coins)&&s.coins>=0&&s.reviews&&typeof s.reviews==='object'&&!Array.isArray(s.reviews)&&Array.isArray(s.concepts)&&JSON.stringify(s).length<490000;}
 async function withLock(action){if(working)return;const uid=cloudUser?.id;if(!uid||!cloud){msg.textContent='먼저 Wordville 계정으로 로그인해 주세요.';return;}working=true;push.disabled=pull.disabled=true;msg.textContent='서버 확인 중…';try{await action(uid);}catch(e){msg.textContent=e.message||'연결에 실패했습니다. 기기 기록은 유지됩니다.';}finally{working=false;push.disabled=pull.disabled=false;}}
 push.addEventListener('click',()=>withLock(async uid=>{
 const snapshot=JSON.parse(JSON.stringify(state));if(!valid(snapshot))throw Error('학습 기록 형식을 확인해 주세요.');
 const {data:old,error}=await cloud.from('wordville_learning').select('payload,version,updated_at').eq('owner_id',uid).maybeSingle();if(error)throw Error('서버 학습 기록을 읽지 못했습니다. 연결을 확인해 주세요.');
 if(old&&JSON.stringify(old.payload)!==JSON.stringify(snapshot)&&!confirm('서버 '+old.payload.xp+' XP / 이 기기 '+snapshot.xp+' XP입니다. 이 기기 기록으로 서버 기록을 바꿀까요?')){msg.textContent='취소했습니다. 기록은 유지됩니다.';return;}
 if(cloudUser?.id!==uid)throw Error('계정이 바뀌었습니다. 다시 시도해 주세요.');
 const values={owner_id:uid,payload:snapshot,version:(old?.version||0)+1,updated_at:new Date().toISOString()};
 const result=old?await cloud.from('wordville_learning').update(values).eq('owner_id',uid).eq('version',old.version).select('version'):await cloud.from('wordville_learning').insert(values).select('version');
 if(result.error||!result.data?.length)throw Error('서버 저장 실패 또는 다른 기기에서 변경했습니다. 다시 확인해 주세요.');
 msg.textContent='서버 저장 완료 · '+new Date().toLocaleString()+' · 다이어리의 Wordville 탭에서 같은 계정으로 확인하세요.';
 }));
 pull.addEventListener('click',()=>withLock(async uid=>{
 const {data:row,error}=await cloud.from('wordville_learning').select('payload,updated_at').eq('owner_id',uid).maybeSingle();
 if(error)throw Error('서버 기록을 읽지 못했습니다.');if(!row)throw Error('저장된 서버 학습 기록이 없습니다. 먼저 기록이 있는 기기에서 서버에 저장해 주세요.');if(!valid(row.payload))throw Error('서버 기록 형식이 맞지 않습니다.');
 if(!confirm('이 기기 '+state.xp+' XP를 서버 '+row.payload.xp+' XP 기록으로 바꿀까요? 현재 기록은 이 기기에 백업합니다.')){msg.textContent='취소했습니다.';return;}
 if(cloudUser?.id!==uid)throw Error('계정이 바뀌었습니다.');
 localStorage.setItem('wordville.learning.backup.'+Date.now(),JSON.stringify(state));
 if(!save(E.migrateAliases(row.payload,words)))throw Error('기기에 저장하지 못했습니다.');renderConcepts();msg.textContent='서버 기록을 불러왔습니다. 이전 기기 기록은 백업했습니다.';
 }));
})();
