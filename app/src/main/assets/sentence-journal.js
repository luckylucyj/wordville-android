/* Sentence journal, Gemini correction UI, Day 01–30 combination filters and localized file picker.
 * New storage key: never modifies existing learning or memory-image records.
 */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const KEY='wordville.sentences.v1', DAY_KEY='wordville.combine-days.v1';
 const langs=['ko','en','zh-CN','ja'];
 const ui={
  title:['✍ 나의 영어 문장','✍ My English sentences','✍ 我的英语句子','✍ 私の英文'],
  intro:['내가 쓴 문장을 날짜별로 보관하고 Google AI의 문법·자연스러운 표현 제안을 확인합니다.','Save your own sentences by date and review grammar and natural phrasing suggestions from Google AI.','按日期保存你写的英语句子，并通过 Google AI 检查语法及自然表达。','自分の英文を日付別に保存し、Google AI で文法と自然な表現を確認します。'],
  input:['내가 만든 영어 문장','My original sentence','我写的英语句子','自分で書いた英文'],
  placeholder:['직접 영어 문장을 입력하세요.','Write your own English sentence.','请输入你写的英语句子。','自分の英文を入力してください。'],
  save:['문장 저장','Save sentence','保存句子','英文を保存'],
  check:['✨ Google AI 문법 검사','✨ Check grammar with Google AI','✨ 使用 Google AI 检查语法','✨ Google AI で文法チェック'],
  history:['저장한 문장','Saved sentences','已保存的句子','保存した英文'],
  none:['저장한 문장이 없습니다.','No sentences saved yet.','还没有保存的句子。','まだ英文が保存されていません。'],
  edit:['수정','Edit','编辑','編集'],
  delete:['삭제','Delete','删除','削除'],
  new:['새 문장','New sentence','新句子','新しい英文'],
  original:['원문','Original','原句','原文'],
  corrected:['추천 수정문','Suggested correction','建议修正句','修正案'],
  alternatives:['자연스러운 대안','Natural alternatives','自然表达建议','自然な別の表現'],
  explanation:['문법·표현 설명','Grammar and phrasing','语法和表达说明','文法・表現の説明'],
  ok:['큰 문법 오류가 발견되지 않았습니다.','No major grammar errors found.','未发现明显语法错误。','大きな文法の誤りは見つかりませんでした。'],
  saved:['기기에 문장을 저장했습니다.','Sentence saved on this device.','已在此设备保存句子。','この端末に英文を保存しました。'],
  required:['영어 문장을 입력해 주세요.','Enter an English sentence.','请输入英语句子。','英文を入力してください。'],
  checking:['Google AI가 문장을 검사하고 있습니다…','Checking your sentence with Google AI…','Google AI 正在检查句子…','Google AI が英文を確認中…'],
  login:['Google AI 검사에는 Wordville 계정 로그인이 필요합니다. More → 계정·동기화에서 로그인하세요.','Sign in to Wordville under More → Account & sync to use Google AI.','请通过 更多 → 账户与同步 登录，才能使用 Google AI。','Google AI を使うには その他 → アカウント・同期 からログインしてください。'],
  unavailable:['AI 연결이 준비되지 않았습니다. 서버의 GEMINI_API_KEY 설정이 필요합니다. 문장은 기기에 저장되었습니다.','AI is not configured yet. The server needs a GEMINI_API_KEY. Your sentence is saved locally.','AI 尚未配置。服务器需要 GEMINI_API_KEY。句子已保存到设备。','AI は未設定です。サーバーの GEMINI_API_KEY が必要です。英文は端末に保存されています。'],
  failed:['문법 검사에 실패했습니다. 인터넷 연결과 로그인 상태를 확인해 주세요.','Grammar check failed. Check your connection and sign-in.','语法检查失败。请检查网络连接和登录状态。','文法チェックに失敗しました。通信とログイン状態を確認してください。'],
  sent:['AI 검사 시 해당 문장만 Google로 전송됩니다. AI 결과는 틀릴 수 있으므로 확인해 주세요.','Only the selected sentence is sent to Google for analysis. AI suggestions may be imperfect.','仅在检查时将该句子发送给 Google。AI 建议可能存在错误。','チェック時のみ対象の英文が Google に送信されます。AI の提案には誤りがある場合があります。'],
  confirm:['이 문장 기록을 삭제할까요?','Delete this sentence?','要删除这条句子记录吗？','この英文の記録を削除しますか？'],
  filterDay:['Day 범위','Day range','Day 范围','Day 範囲'],
  searchWord:['단어 검색','Search words','搜索单词','単語検索'],
  allDays:['전체 Day','All Days','全部 Day','全 Day'],
  noMatch:['해당 Day에 일치하는 단어가 없습니다.','No words match this Day.','此 Day 没有匹配的单词。','この Day に一致する単語はありません。'],
  pick:['📁 이미지 파일 선택','📁 Choose image files','📁 选择图片文件','📁 画像ファイルを選択'],
  noFile:['선택된 파일 없음','No files selected','未选择文件','ファイル未選択'],
  fileCount:['개 파일 선택됨','files selected','个文件已选择','個のファイルを選択']
 };
 const lang=()=>{const value=globalThis.WordvilleI18n?.language||'ko';return langs.includes(value)?value:'ko';};
 const t=k=>ui[k]?.[langs.indexOf(lang())]||k;
 const formatDate=iso=>{try{return new Date(iso).toLocaleString(lang()==='zh-CN'?'zh-CN':lang()==='ja'?'ja-JP':lang()==='en'?'en-US':'ko-KR');}catch{return iso;}};
 function element(tag,cls,content){const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e;}
 let entries=[],editingId='',busy=false;
 function load(){
  try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(data))entries=data.filter(e=>e&&typeof e.id==='string'&&typeof e.text==='string').slice(0,500);}catch{entries=[];}
 }
 function persist(){
  try{localStorage.setItem(KEY,JSON.stringify(entries.slice(0,500)));document.dispatchEvent(new Event('wordville-record-changed'));return true;}
  catch{setStatus(t('failed'));return false;}
 }
 const main=document.querySelector('main');
 if(!main)return;
 const view=element('section','wv-sentences-view');
 view.id='wv-sentences-view';view.hidden=true;
 view.innerHTML='<header class="wv-sentence-head"><h2 id="wv-sentences-title"></h2><p id="wv-sentences-intro"></p></header>'+
  '<form id="wv-sentence-form" class="card"><label for="wv-sentence-text" id="wv-sentence-input-label"></label>'+
  '<textarea id="wv-sentence-text" maxlength="1200" rows="4" required></textarea><div class="wv-sentence-actions">'+
  '<button type="submit" class="primary" id="wv-sentence-save"></button><button type="button" id="wv-sentence-check"></button>'+
  '<button type="button" id="wv-sentence-new"></button></div><p id="wv-sentence-status" role="status" aria-live="polite"></p>'+
  '<div id="wv-sentence-feedback" class="wv-sentence-feedback" hidden></div><p id="wv-sentence-privacy" class="muted"></p></form>'+
  '<section class="wv-sentence-archive"><h3 id="wv-sentences-history"></h3><div id="wv-sentence-list"></div></section>';
 const before=$('wv-notes-view')||$('wv-gallery-view');
 if(before)main.insertBefore(view,before);else main.append(view);
 const input=$('wv-sentence-text'),status=$('wv-sentence-status'),feedback=$('wv-sentence-feedback'),list=$('wv-sentence-list');
 function setStatus(s){status.textContent=s;}
 function reset(){editingId='';input.value='';feedback.hidden=true;feedback.replaceChildren();setStatus('');}
 function saveEntry(){
  const value=input.value.trim();
  if(!value){setStatus(t('required'));return null;}
  const now=new Date().toISOString();
  let item=entries.find(e=>e.id===editingId);
  if(item){
   if(item.text!==value){item.text=value;item.correction=null;}
   item.updatedAt=now;
  }else{
   item={id:'sentence-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),text:value,createdAt:now,updatedAt:now,correction:null};
   entries.unshift(item);editingId=item.id;
  }
  entries.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  entries=entries.slice(0,500);
  if(!persist())return null;
  renderList();return item;
 }
 function showFeedback(item){
  feedback.replaceChildren();const c=item?.correction;
  if(!c){feedback.hidden=true;return;}
  feedback.hidden=false;
  const block=(label,content)=>{
   const wrap=element('div','wv-sentence-feedback-row');
   wrap.append(element('strong','',t(label)),element('p','',content));feedback.append(wrap);
  };
  block('original',item.text);
  block('corrected',c.corrected||item.text);
  const alternatives=Array.isArray(c.alternatives)?c.alternatives.filter(Boolean):[];
  if(alternatives.length)block('alternatives',alternatives.join('\n'));
  if(c.explanation)block('explanation',c.explanation);
  if(c.isCorrect===true&&!c.explanation)block('explanation',t('ok'));
  if(Array.isArray(c.issues)&&c.issues.length){
   const ul=element('ul');for(const issue of c.issues.slice(0,8))ul.append(element('li','',String(issue).slice(0,400)));feedback.append(ul);
  }
 }
 function open(item){
  editingId=item.id;input.value=item.text;showFeedback(item);setStatus('');view.scrollIntoView({block:'start',behavior:'smooth'});
 }
 function renderList(){
  list.replaceChildren();
  if(!entries.length){list.append(element('p','muted',t('none')));return;}
  for(const item of entries){
   const card=element('article','wv-sentence-entry');
   card.append(element('time','muted',formatDate(item.createdAt)),element('p','wv-sentence-entry-text',item.text));
   const actions=element('div','wv-sentence-entry-actions');
   const edit=element('button','',t('edit'));edit.type='button';edit.addEventListener('click',()=>open(item));
   const remove=element('button','',t('delete'));remove.type='button';remove.addEventListener('click',()=>{
    if(!confirm(t('confirm')))return;
    entries=entries.filter(e=>e.id!==item.id);if(editingId===item.id)reset();persist();renderList();
   });
   actions.append(edit,remove);card.append(actions);list.append(card);
  }
 }
 function translate(){
  const fields={'wv-sentences-title':'title','wv-sentences-intro':'intro','wv-sentence-input-label':'input','wv-sentence-save':'save','wv-sentence-check':'check','wv-sentence-new':'new','wv-sentences-history':'history','wv-sentence-privacy':'sent'};
  for(const [id,key] of Object.entries(fields))$(id).textContent=t(key);
  input.placeholder=t('placeholder');renderList();
  if(editingId)showFeedback(entries.find(x=>x.id===editingId));
  updateFileLabel();
  refreshCombos();
 }
 $('wv-sentence-form').addEventListener('submit',e=>{e.preventDefault();const item=saveEntry();if(item)setStatus(t('saved'));});
 $('wv-sentence-new').addEventListener('click',()=>{reset();input.focus();});
 $('wv-sentence-check').addEventListener('click',async()=>{
  if(busy)return;
  const item=saveEntry();if(!item)return;
  const cloud=globalThis.WordvilleCloud;
  if(!cloud){setStatus(t('failed'));return;}
  const session=await cloud.auth.getSession().catch(()=>({data:{session:null}}));
  if(!session.data?.session){setStatus(t('login'));return;}
  busy=true;$('wv-sentence-check').disabled=true;
  setStatus(t('checking'));feedback.hidden=true;
  try{
   const {data,error}=await cloud.functions.invoke('check-english',{body:{sentence:item.text,locale:lang()}});
   if(error){
    if(/503|not configured/i.test(String(error.message||'')+' '+String(error.context?.status||'')))throw new Error('not-configured');
    throw error;
   }
   if(!data||typeof data.corrected!=='string')throw new Error('invalid-response');
   item.correction={
    corrected:data.corrected.slice(0,2400),
    alternatives:Array.isArray(data.alternatives)?data.alternatives.filter(x=>typeof x==='string').slice(0,3):[],
    explanation:String(data.explanation||'').slice(0,2400),
    issues:Array.isArray(data.issues)?data.issues.filter(x=>typeof x==='string').slice(0,8):[],
    isCorrect:data.isCorrect===true,
    checkedAt:new Date().toISOString()
   };
   persist();showFeedback(item);setStatus(t('saved'));renderList();
  }catch(error){setStatus(error.message==='not-configured'?t('unavailable'):t('failed'));}
  finally{busy=false;$('wv-sentence-check').disabled=false;}
 });
 load();
 // Each combination slot has its own Day (01–30) and text filter.
 const slotData={};
 let wordsReady=false;
 const combine=$('combine-form');
 const localWords=()=>Array.isArray(globalThis.WordvilleWords)?globalThis.WordvilleWords:[];
 let savedDays={};
 try{savedDays=JSON.parse(localStorage.getItem(DAY_KEY)||'{}')||{};}catch{}
 for(const key of ['a','b']){
  const target=$('word-'+key),label=target?.parentElement;
  if(!target||!label)continue;
  const row=element('div','wv-combine-options');
  const dayLabel=element('label');const dayName=element('span','wv-combine-day-label');
  const day=element('select');day.id='wv-combine-day-'+key;
  day.add(new Option('','all'));
  for(let n=1;n<=30;n++)day.add(new Option('Day '+String(n).padStart(2,'0'),String(n)));
  day.value=/^(?:all|[1-9]|[12]\d|30)$/.test(String(savedDays[key]||''))?savedDays[key]:'1';
  dayLabel.append(dayName,day);
  const searchLabel=element('label');const searchName=element('span','wv-combine-search-label');
  const search=element('input');search.type='search';search.id='wv-combine-search-'+key;search.autocomplete='off';
  searchLabel.append(searchName,search);row.append(dayLabel,searchLabel);
  label.before(row);slotData[key]={day,search,target,dayName,searchName};
  day.addEventListener('change',()=>{
   savedDays[key]=day.value;
   try{localStorage.setItem(DAY_KEY,JSON.stringify(savedDays));}catch{}
   refreshCombo(key);
  });
  search.addEventListener('input',()=>refreshCombo(key));
 }
 function refreshCombo(key){
  const slot=slotData[key],ws=localWords();if(!slot||!ws.length)return;
  const choice=slot.target.value,q=slot.search.value.trim().toLowerCase(),d=slot.day.value;
  const matches=ws.filter(w=>(d==='all'||(w.days||[]).includes(Number(d)))&&(!q||w.word.toLowerCase().includes(q)||String(w.meaning||'').toLowerCase().includes(q)));
  const fragment=document.createDocumentFragment();
  for(const w of matches){const option=document.createElement('option');option.value=w.id;option.textContent=w.word+' · '+w.meaning;fragment.append(option);}
  slot.target.replaceChildren(fragment);
  if(matches.some(w=>String(w.id)===String(choice)))slot.target.value=choice;
  slot.target.disabled=!matches.length;
  if(!matches.length)slot.target.add(new Option(t('noMatch'),''));
  slot.target.dispatchEvent(new Event('change',{bubbles:true}));
 }
 function refreshCombos(){
  for(const key of ['a','b']){
   const slot=slotData[key];if(!slot)continue;
   slot.dayName.textContent=t('filterDay');slot.searchName.textContent=t('searchWord');
   slot.search.placeholder=t('searchWord');
   slot.day.options[0].textContent=t('allDays');
   if(wordsReady)refreshCombo(key);
  }
 }
 document.addEventListener('wordville-words-ready',()=>{wordsReady=true;refreshCombos();});
 if(localWords().length){wordsReady=true;refreshCombos();}
 // Replace the old global randomizer with choices from the visible Day filters.
 $('random')?.addEventListener('click',event=>{
  if(!wordsReady)return;
  event.preventDefault();event.stopImmediatePropagation();
  const a=slotData.a.target,b=slotData.b.target;
  const xs=Array.from(a.options).map(o=>o.value).filter(Boolean),ys=Array.from(b.options).map(o=>o.value).filter(Boolean);
  if(!xs.length||!ys.length)return;
  const idA=xs[Math.floor(Math.random()*xs.length)];
  const others=ys.filter(id=>id!==idA);
  const idB=(others.length?others:ys)[Math.floor(Math.random()*(others.length||ys.length))];
  a.value=idA;b.value=idB;a.dispatchEvent(new Event('change',{bubbles:true}));
 },true);
 // The native Android file input is not an app-translatable control. Use custom accessible labels.
 const imageInput=$('image-input');
 let pickName=null,pickInfo=null;
 if(imageInput){
  imageInput.classList.add('wv-file-input');
  imageInput.setAttribute('aria-label','Memory image files');
  pickName=element('span','wv-file-pick-name');
  pickInfo=element('span','wv-file-pick-info');
  imageInput.before(pickName,pickInfo);
  imageInput.addEventListener('change',updateFileLabel);
 }
 function updateFileLabel(){
  if(!pickName||!pickInfo)return;
  pickName.textContent=t('pick');
  const count=imageInput.files?.length||0;
  pickInfo.textContent=count?String(count)+' '+t('fileCount'):t('noFile');
 }
 document.addEventListener('wordville-language-changed',translate);
 translate();
})();
