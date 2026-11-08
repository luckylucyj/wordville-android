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
function renderWords(){const query=$('search').value.trim().toLowerCase();$('words').replaceChildren();const filtered=words.filter(w=>w.word.includes(query)||w.meaning.includes(query));for(const w of filtered){const button=make('button',undefined,'word');button.append(make('strong',w.word),make('span',w.meaning));button.addEventListener('click',()=>openWord(w));$('words').append(button);}if(!filtered.length)$('words').append(make('p','검색 결과가 없습니다.'));}
function openDatabase(){return new Promise((resolve,reject)=>{const req=indexedDB.open('wordville-memory',1);req.onupgradeneeded=()=>req.result.createObjectStore('images');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function imageAction(mode,key,value){return new Promise((resolve,reject)=>{if(!db)return reject(Error('이미지 저장소를 사용할 수 없습니다.'));const tx=db.transaction('images',mode==='get'?'readonly':'readwrite');const store=tx.objectStore('images');let request=mode==='get'?store.get(key):mode==='put'?store.put(value,key):store.delete(key);let result;request.onsuccess=()=>result=request.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
let imageUrl=null;
function showImage(blob){if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl=blob?URL.createObjectURL(blob):null;$('memory-image').hidden=!blob;$('remove-image').hidden=!blob;if(blob)$('memory-image').src=imageUrl;else $('memory-image').removeAttribute('src');refreshImageButtons();}
async function openWord(w){active=w;$('detail-word').textContent=w.word;$('detail-meaning').textContent=w.meaning;$('detail-meaning').hidden=true;$('reveal').hidden=false;$('reveal').textContent='뜻 보기';$('reveal').setAttribute('aria-expanded','false');$('detail-example').textContent=w.example;$('detail-translation').textContent=w.translation;$('role').textContent=w.role;$('dialogue').textContent=w.dialogue;$('detail-status').textContent='';$('image-input').value='';showImage(null);$('word-dialog').showModal();try{const blob=await readMemoryImage(w.id);if(active===w)showImage(blob);}catch{$('detail-status').textContent='이미지 저장소를 사용할 수 없습니다.';}}
function renderConcepts(){$('concepts').replaceChildren();if(!state.concepts.length)$('concepts').append(make('p','아직 저장한 개념이 없습니다. 조합실에서 만들어 보세요.'));for(const c of state.concepts){const card=make('article',undefined,'card');card.append(make('h3',c.name),make('p',`${c.a} + ${c.b}`));$('concepts').append(card);}}
function connection(){const a=words.find(w=>w.id===$('word-a').value),b=words.find(w=>w.id===$('word-b').value);if(!a||!b)return;$('connection').textContent=`${a.meaning} + ${b.meaning} — 두 뜻을 함께 사용하는 상황을 떠올리고 이름을 입력해 주세요.`;}
function nextQuestion(){reviewWord=queue.shift();$('answer-result').textContent='';$('next').hidden=true;$('answer').value='';$('answer-form').hidden=!reviewWord;if(!reviewWord){$('question').textContent='이번 복습을 마쳤어요.';return;}$('question').textContent=reviewWord.word;$('answer').focus();}
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{for(const id of ['learn','review','lab','book'])$(id).hidden=button.dataset.tab!==id;document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===button)));renderDue();renderConcepts();}));
$('search').addEventListener('input',renderWords);
$('close-dialog').addEventListener('click',()=>{$('word-dialog').close();active=null;showImage(null);});
$('reveal').addEventListener('click',()=>{const show=$('detail-meaning').hidden;$('detail-meaning').hidden=!show;$('reveal').textContent=show?'뜻 숨기기':'뜻 보기';$('reveal').setAttribute('aria-expanded',String(show));});
$('learned').addEventListener('click',()=>{if(!active)return;if(save({...state,reviews:{...state.reviews,[active.id]:state.reviews[active.id]||{streak:0,attempts:0,due:Date.now()}}}))$('detail-status').textContent='학습을 기록했습니다. 복습 메뉴에서 뜻을 입력해 보세요.';});
function localImageKey(id, uid=cloudUser?.id){return uid?`${uid}/${id}`:id;}
function cloudPath(id,uid=cloudUser?.id){if(!uid)throw Error('먼저 로그인해 주세요.');return `${uid}/${id}`;}
function imageLock(value){imageBusy=value;for(const id of ['image-input','remove-image','sync-image'])$(id).disabled=value;}
function refreshImageButtons(){ $('sync-image').hidden=!cloudUser||$('memory-image').hidden; }
async function readMemoryImage(id){
 const uid=cloudUser?.id,key=localImageKey(id,uid);
 let cached=null;try{cached=await imageAction('get',key);}catch{}
 if(!uid||!cloud)return cached;
 const {data,error}=await cloud.storage.from(bucket).download(cloudPath(id,uid));
 if(error){if(active?.id===id)$('detail-status').textContent=cached?'기기에 저장된 이미지를 표시합니다. 서버 불러오기는 완료하지 못했습니다.':'서버에 저장된 이미지가 없거나 연결하지 못했습니다.';return cached;}
 try{await imageAction('put',key,data);}catch{}
 return data;
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
$('remove-image').addEventListener('click',async()=>{const w=active,uid=cloudUser?.id;if(!w||imageBusy)return;imageLock(true);try{if(uid&&cloud){const {error}=await cloud.storage.from(bucket).remove([cloudPath(w.id,uid)]);if(error)throw Error('서버 이미지를 삭제하지 못했습니다. 연결 상태를 확인해 주세요.');}await imageAction('delete',localImageKey(w.id,uid));if(active===w){showImage(null);$('detail-status').textContent=uid?'서버와 기기에서 이미지를 삭제했습니다.':'기기에서 이미지를 삭제했습니다.';}}catch(e){if(active===w)$('detail-status').textContent=e.message;}finally{imageLock(false);}});
$('start-review').addEventListener('click',()=>{queue=words.filter(w=>!state.reviews[w.id]||state.reviews[w.id].due<=Date.now());$('review-card').hidden=false;nextQuestion();});
$('answer-form').addEventListener('submit',event=>{event.preventDefault();if(!reviewWord)return;const correct=E.isCorrect($('answer').value,reviewWord.meaning);const next=E.review(state,reviewWord.id,correct);if(!save(next))return;$('answer-result').textContent=correct?'정답입니다. +10 XP · +3 코인':`뜻: ${reviewWord.meaning}. 10분 뒤 다시 복습해요.`;$('answer-form').hidden=true;$('next').hidden=false;reviewWord=null;});
$('next').addEventListener('click',nextQuestion);
$('combine-form').addEventListener('submit',event=>{event.preventDefault();try{if(save(E.combine(state,$('word-a').value,$('word-b').value,$('concept-name').value))){notify('개념 도감에 저장했습니다. +15 XP · +5 코인');$('concept-name').value='';}}catch(e){notify(e.message);}});
$('word-a').addEventListener('change',connection);$('word-b').addEventListener('change',connection);
$('random').addEventListener('click',()=>{let a=Math.floor(Math.random()*words.length),b=(a+1+Math.floor(Math.random()*(words.length-1)))%words.length;$('word-a').selectedIndex=a;$('word-b').selectedIndex=b;connection();});
async function init(){try{db=await openDatabase();}catch{notify('기억용 이미지 저장을 사용할 수 없습니다.');}try{const res=await fetch('words.json');if(!res.ok)throw Error();words=await res.json();for(const w of words){for(const id of ['word-a','word-b']){const option=make('option',`${w.word} · ${w.meaning}`);option.value=w.id;$(id).append(option);}}$('word-b').selectedIndex=1;connection();renderWords();renderStats();}catch{notify('단어장을 불러오지 못했습니다. 앱을 다시 실행해 주세요.');}}
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
 try{for(const w of words){if(cloudUser?.id!==uid)throw Error();const file=await imageAction('get',w.id);if(!file)continue;
 if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))continue;
 const {error}=await cloud.storage.from(bucket).upload(cloudPath(w.id,uid),file,{upsert:true,contentType:file.type});if(error)throw error;await imageAction('put',localImageKey(w.id,uid),file);count++;}authMessage(`${count}개 이미지를 서버에 복사했습니다. 기존 기기 원본은 유지됩니다.`);
 }catch{authMessage(`${count}개 저장 후 중단됐습니다. 연결을 확인하고 다시 시도해 주세요.`);}finally{e.currentTarget.disabled=false;}
});
if(cloud){cloud.auth.onAuthStateChange((_event,session)=>{authState(session?.user||null);});cloud.auth.getSession().then(({data,error})=>{if(error)authMessage('로그인 정보를 확인하지 못했습니다. 다시 로그인해 주세요.');else authState(data.session?.user||null);});}else{$('cloud-status').textContent='서버 모듈 로드 실패';}
document.addEventListener('village-study',e=>{const w=words.find(w=>w.id===e.detail.word);if(w)openWord(w);});
