/* Live, dated international search trends inside the Wordville resident board.
 * The public Google Trends RSS feed is collected by a free scheduled GitHub
 * Action and preserved on trend-data branch. No paid API or app reinstall
 * required after the first app update. Search trends != social media memes.
 */
(function(root){
'use strict';
const GEO={
 US:{zone:'America/New_York',names:['미국','United States','美国','アメリカ']},
 GB:{zone:'Europe/London',names:['영국','United Kingdom','英国','イギリス']},
 CA:{zone:'America/Toronto',names:['캐나다','Canada','加拿大','カナダ']},
 AU:{zone:'Australia/Sydney',names:['호주','Australia','澳大利亚','オーストラリア']}
};
const URL='https://raw.githubusercontent.com/luckylucyj/wordville-android/trend-data/trends/archive.json';
const CACHE='wordville:international-trends:archive:v1',MAX_CACHE_BYTES=1_500_000,MAX_REMOTE_BYTES=8_000_000;
const WORDS={
 heading:['날짜별 해외 트렌드','Daily international trends','海外每日趋势','日付別海外トレンド'],
 trendTab:['급상승 검색어','Trending searches','热门搜索','急上昇検索'],
 memeTab:['밈·바이럴 기사','Meme & viral news','迷因与热门报道','ミーム・話題のニュース'],
 memeNote:['Google 뉴스에서 검색된 밈·바이럴 관련 기사입니다. 밈 유행 순위가 아닙니다.','Google News coverage mentioning memes or viral topics, not a ranked meme chart.','Google 新闻中的迷因与热门报道，不是迷因排行榜。','Googleニュースのミーム関連記事で、流行順位ではありません。'],
 search:['날짜별 기록 검색','Search dated records','搜索历史记录','日付別記録を検索'],
 searchHint:['밈, 유행어, 인물, 주제 입력','Search a meme, phrase or topic','输入迷因、流行语或话题','ミーム・流行語・話題を入力'],
 external:['Google에서 직접 검색','Search on Google','前往 Google 搜索','Googleで直接検索'],
 pub:['기사 출처','Publisher','文章来源','掲載元'],
 results:['검색 결과','Matching records','搜索结果','検索結果'],
 subtitle:['Google 검색 관심 급상승 주제 · SNS 밈 순위가 아닙니다.','Rising Google searches · Not a social meme ranking.','Google 热门搜索 · 非社交媒体迷因榜。','Googleの急上昇検索・SNSミームの順位ではありません。'],
 country:['국가','Country','国家','国'],
 date:['날짜 (해당 국가 현지 기준)','Date (local to selected country)','日期（当地时间）','日付（選択国の現地時間）'],
 update:['새로고침','Refresh','刷新','更新'],
 latest:['최근 수집일','Latest collected day','最近采集日期','最新収集日'],
 stale:['마지막 수집 자료를 표시합니다. 실시간 자료가 아닙니다.','Showing the last collected snapshot, not live data.','显示上次采集快照，非实时数据。','最後に収集したデータです。リアルタイムではありません。'],
 fetched:['마지막 갱신','Updated','最后更新','最終更新'],
 collect:['확인된 검색 트렌드','Verified search trends','已核实的热门搜索','確認済み検索トレンド'],
 traffic:['추정 검색량','Approx. searches','估计搜索量','推定検索数'],
 source:['Google Trends에서 확인','View in Google Trends','在 Google 趋势中查看','Googleトレンドで確認'],
 news:['관련 기사','Related coverage','相关新闻','関連ニュース'],
 empty:['이 날짜에 수집된 자료가 없습니다. 수집 시작 이전의 과거 데이터는 제공하지 않습니다.','No verified snapshot for this date. Dates before collection began are not backfilled.','此日期没有已核实的数据，采集开始前的历史数据不会补造。','この日付の収集データはありません。収集開始前の履歴は補完しません。'],
 offline:['데이터를 가져올 수 없습니다. 네트워크 연결 또는 GitHub 데이터 수집 상태를 확인하세요.','Unable to load trends. Check your connection or the GitHub collector.','无法加载趋势，请检查网络或 GitHub 采集任务。','データを取得できません。通信かGitHub収集処理を確認してください。'],
 loading:['실제 트렌드 확인 중…','Loading verified trends…','正在加载已核实的趋势…','確認済みのトレンドを読み込み中…'],
 resident:['주민의 영어 연습 댓글 (가상)','Resident English practice reply (fictional)','居民英语练习评论（虚构）','住民の英語練習コメント（架空）'],
 context:['맥락이 뭐야? 무슨 일이 있었는지 알려 달라는 일상 표현.','Asking someone to explain what happened.','询问事情的来龙去脉。','何があったのか説明してほしいときの表現。'],
 catchup:['최근 이야기를 따라잡으려고 해.','I am getting up to date on this topic.','我正在了解最近的情况。','最近の話題を追いかけているところ。'],
 loop:['이 이야기를 아직 잘 몰라.','I do not know the background yet.','我还不了解这件事的背景。','まだこの話題の背景が分からない。'],
 otherPosts:['기존 주민 밈·표현 학습 게시글','Resident slang practice posts (fictional)','居民俚语练习贴（虚构）','住民のスラング学習投稿（架空）'],
 explanation:['검색어는 인기도 변화만 나타냅니다. 해당 주제가 인기인 이유나 사실관계를 증명하지 않습니다.','Trending searches reflect interest changes, not a verified explanation of events.','热门搜索反映关注变化，不等于事实或原因的核实。','急上昇検索は関心の変化を示すもので、出来事の真偽や理由を証明しません。']
};
const locales=['ko','en','zh-CN','ja'];
const language=()=>root.WordvilleI18n?.language||'ko';
const loc=()=>Math.max(0,locales.indexOf(language()));
const tr=key=>WORDS[key]?.[loc()]||key;
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&
 !Number.isNaN(Date.parse(value+'T00:00:00Z'));
const isHttps=url=>{try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
function normalizeArchive(raw){
 if(!raw||raw.schema!==1||typeof raw.countries!=='object'||!raw.countries)return null;
 const verified={schema:1,updatedAt:String(raw.updatedAt||''),countryUpdatedAt:{},countries:{},memeNews:{}};
 for(const country of Object.keys(GEO)){
  const dates=raw.countries[country];
  verified.countries[country]={};verified.memeNews[country]={};
  const datedNews=raw.memeNews?.[country];
  if(datedNews&&typeof datedNews==='object'&&!Array.isArray(datedNews)){
   for(const [date,stories] of Object.entries(datedNews)){
    if(!validDate(date)||!Array.isArray(stories))continue;
    const cleaned=stories.slice(0,16).filter(item=>item&&item.date===date&&
     typeof item.title==='string'&&item.title.length>1&&item.title.length<161&&
     isHttps(item.url)&&!Number.isNaN(Date.parse(item.publishedAt||''))).slice(0,12)
     .map(item=>({title:item.title,date,publishedAt:item.publishedAt,url:item.url,
      publisher:String(item.publisher||'').slice(0,70)}));
    if(cleaned.length)verified.memeNews[country][date]=cleaned;
   }
  }
  if(!dates||typeof dates!=='object'||Array.isArray(dates))continue;
  const update=raw.countryUpdatedAt?.[country];
  if(typeof update==='string'&&!Number.isNaN(Date.parse(update)))verified.countryUpdatedAt[country]=update;
  for(const [date,items] of Object.entries(dates)){
   if(!validDate(date)||!Array.isArray(items))continue;
   const rows=[];
   for(const item of items.slice(0,25)){
    if(!item||typeof item.title!=='string'||item.title.trim().length<2||item.title.length>160||
       item.date!==date||!Number.isFinite(Date.parse(item.publishedAt||'')))continue;
    rows.push({
     title:item.title.trim(),date,publishedAt:item.publishedAt,
     approxTraffic:typeof item.approxTraffic==='string'?item.approxTraffic.slice(0,40):'',
     news:Array.isArray(item.news)?item.news.slice(0,2).filter(n=>n&&
       typeof n.title==='string'&&n.title.length<161&&isHttps(n.url)).map(n=>({
         title:n.title,url:n.url,publisher:String(n.publisher||'').slice(0,70)
       })):[],
    });
   }
   if(rows.length)verified.countries[country][date]=rows.slice(0,20);
  }
 }
 return verified;
}
function countryDate(country,date=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{
  timeZone:GEO[country]?.zone||'UTC',year:'numeric',month:'2-digit',day:'2-digit'
 }).formatToParts(date);
 const get=part=>parts.find(p=>p.type===part)?.value||'00';
 return get('year')+'-'+get('month')+'-'+get('day');
}
function datedRows(archive,country,date){
 if(!GEO[country]||!validDate(date))return [];
 return archive?.countries?.[country]?.[date]||[];
}
function datedNews(archive,country,date){
 if(!GEO[country]||!validDate(date))return [];
 return archive?.memeNews?.[country]?.[date]||[];
}
function filterRows(items,needle=''){
 const query=String(needle).trim().toLocaleLowerCase();
 return query?items.filter(row=>(row.title+' '+(row.publisher||'')).toLocaleLowerCase().includes(query)):items;
}
function googleSearchUrl(country,query,mode='trends',date=''){
 if(!GEO[country])return '';
 const term=String(query||'').trim().slice(0,100);
 if(mode==='memes'){
  const params=new URLSearchParams({q:term||'meme viral trend',hl:'en-US',gl:country,ceid:country+':en'});
  return 'https://news.google.com/search?'+params.toString();
 }
 if(!term)return 'https://trends.google.com/trending?geo='+country;
 const dates=validDate(date)?date+' '+date:'today 7-d';
 return 'https://trends.google.com/trends/explore?'+new URLSearchParams({geo:country,q:term,date:dates});
}
function safeLink(url){return isHttps(url)?url:'';}
const api={GEO,WORDS,URL,normalizeArchive,countryDate,datedRows,datedNews,filterRows,googleSearchUrl,safeLink};
root.WordvilleInternationalTrends=api;
if(typeof document==='undefined'){
 if(typeof module!=='undefined')module.exports=api;
 return;
}
const $=id=>document.getElementById(id);
const dialog=$('wv-town-board');
if(!dialog)return;
const tag=(name,className,content)=>{
 const element=document.createElement(name);if(className)element.className=className;
 if(content!==undefined)element.textContent=String(content);
 return element;
};
const countries=tag('select'),datepicker=tag('input'),fetchButton=tag('button','wv-social-outline'),
  heading=tag('h3'),lead=tag('p','wv-social-hint'),info=tag('p','wv-social-hint'),
  controls=tag('div','wv-trends-controls'),list=tag('div','wv-trends-list'),
  area=tag('section','wv-trends-area'),
  modeTabs=tag('div','wv-trends-tabs'),
  trendTab=tag('button','wv-social-outline'),memeTab=tag('button','wv-social-outline'),
  searchField=tag('input','wv-trend-query'),searchLabel=tag('label','wv-trend-search'),
  external=tag('a','wv-trend-external');
countries.id='wv-trend-country';countries.setAttribute('aria-label','Country');
for(const country of Object.keys(GEO)){
 const option=tag('option','',GEO[country].names[loc()]);option.value=country;countries.append(option);
}
datepicker.id='wv-trend-date';datepicker.type='date';datepicker.setAttribute('aria-label','Date');
fetchButton.type='button';
trendTab.type='button';memeTab.type='button';
trendTab.id='wv-trend-mode-search';memeTab.id='wv-trend-mode-memes';
trendTab.setAttribute('aria-pressed','true');memeTab.setAttribute('aria-pressed','false');
modeTabs.append(trendTab,memeTab);
searchField.id='wv-trend-query';searchField.type='search';searchField.maxLength=100;
searchField.autocomplete='off';searchField.setAttribute('aria-label','Search overseas trends');
const queryLabel=tag('span');searchLabel.append(queryLabel,searchField);
external.id='wv-trend-google-search';external.target='_blank';external.rel='noopener noreferrer';
const countryField=tag('label','wv-trend-field'),dateField=tag('label','wv-trend-field');
const countryLabel=tag('span'),dateLabel=tag('span');
countryField.append(countryLabel,countries);dateField.append(dateLabel,datepicker);
controls.append(countryField,dateField,fetchButton);
area.append(heading,lead,modeTabs,controls,searchLabel,external,info,list);
dialog.insertBefore(area,dialog.querySelector('.wv-social-hint'));
/* Retain earlier fictional meme examples behind an explicit disclosure. */
const older=tag('details','wv-trends-older'),summary=tag('summary');
older.append(summary);
for(const id of ['.wv-social-hint','.wv-social-outline','.wv-town-posts']){
 const target=[...dialog.children].find(e=>e.matches?.(id)&&e!==area);
 if(target)older.append(target);
}
dialog.append(older);
let country='US',requestedDate='',archive=null,fetchedAt=0,busy=false,usingCached=false,mode='trends';
countries.value=country;
function latestDay(data,geo){
 return Object.keys((mode==='memes'?data?.memeNews:data?.countries)?.[geo]||{}).sort().reverse()[0]||countryDate(geo);
}
function applyDate(newCountry,preferLatest=true){
 country=newCountry;countries.value=country;
 datepicker.max=countryDate(country);
 requestedDate=preferLatest?latestDay(archive,country):countryDate(country);
 datepicker.value=requestedDate;
}
function sourceAnchor(text,url,className){
 const a=tag('a',className,text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;
}
function render(){
 heading.textContent=tr('heading');lead.textContent=tr('subtitle');
 countryLabel.textContent=tr('country');dateLabel.textContent=tr('date');
 fetchButton.textContent=tr('update');summary.textContent=tr('otherPosts');
 trendTab.textContent=tr('trendTab');memeTab.textContent=tr('memeTab');
 trendTab.setAttribute('aria-pressed',String(mode==='trends'));
 memeTab.setAttribute('aria-pressed',String(mode==='memes'));
 queryLabel.textContent=tr('search');searchField.placeholder=tr('searchHint');
 external.textContent=tr('external');
 external.href=googleSearchUrl(country,searchField.value,mode,requestedDate);
 external.setAttribute('aria-label',tr('external'));
 for(const option of countries.options)option.textContent=GEO[option.value].names[loc()];
 const when=archive?.countryUpdatedAt?.[country];
 const updated=when?new Date(when).toLocaleString(language(),{dateStyle:'medium',timeStyle:'short'}):'—';
 const stale=when&&(Date.now()-Date.parse(when)>48*3600*1000);
 info.textContent=(archive?tr('fetched')+': '+updated+' · '+tr('collect')+(usingCached?' · '+tr('stale'):'')+(stale?' · '+tr('stale'):''):tr(busy?'loading':'offline'));
 list.replaceChildren();
 const records=filterRows(mode==='memes'?datedNews(archive,country,requestedDate):datedRows(archive,country,requestedDate),searchField.value);
 if(!records.length){
  const p=tag('p','wv-trends-empty',busy?tr('loading'):tr('empty'));
  list.append(p);return;
 }
 const title=tag('p','wv-trends-day',requestedDate+' · '+GEO[country].names[loc()]+' · '+tr('results')+': '+records.length);
 if(mode==='memes')list.append(tag('p','wv-social-hint',tr('memeNote')));
 list.append(title);
 records.slice(0,10).forEach((item,index)=>{
  const resident=root.WordvilleSocial?.residents?.[(index+requestedDate.length+country.length)%22];
  const person=resident?(root.WordvilleI18n?.translate(resident.name)||resident.name):'Wordville';
  const expressions=[
   ['What’s the context?', 'context'],
   ['I’m trying to catch up.', 'catchup'],
   ['I’m out of the loop.', 'loop']
  ];
  const [phrase,meaningKey]=expressions[index%expressions.length];
  const article=tag('article','wv-town-post wv-trend-card');
  const top=tag('div','wv-post-head');
  top.append(tag('strong','',item.title),tag('small','',new Date(item.publishedAt).toLocaleTimeString(language(),
   {timeZone:GEO[country].zone,hour:'2-digit',minute:'2-digit'})));
  article.append(top);
  if(mode==='memes'){
   if(item.publisher)article.append(tag('span','wv-trends-traffic',tr('pub')+': '+item.publisher));
   const refs=tag('div','wv-trends-links');
   if(safeLink(item.url))refs.append(sourceAnchor(tr('news')+' · '+(item.publisher||'Google News'),item.url,''));
   article.append(refs);list.append(article);return;
  }
  if(item.approxTraffic)article.append(tag('span','wv-trends-traffic',tr('traffic')+': '+item.approxTraffic));
  const example=tag('div','wv-trends-example');
  example.append(tag('small','',person+' · '+tr('resident')));
  const line=tag('p','',phrase);line.lang='en';
  example.append(line,tag('span','',tr(meaningKey)));
  article.append(example);
  const links=tag('div','wv-trends-links');
  links.append(sourceAnchor(tr('source'),'https://trends.google.com/trending?geo='+country,''));
  if(item.news.length)links.append(sourceAnchor(tr('news')+' · '+item.news[0].publisher,item.news[0].url,''));
  article.append(links);
  list.append(article);
 });
 list.append(tag('p','wv-social-hint',tr('explanation')));
}
function loadCache(){
 try{
  const content=localStorage.getItem(CACHE);
  if(content&&content.length<MAX_CACHE_BYTES)archive=normalizeArchive(JSON.parse(content));
  usingCached=!!archive;
 }catch{}
}
async function fetchData(){
 if(busy)return;
 busy=true;fetchButton.disabled=true;
 if(!archive)render();
 try{
  const path=URL+'?period='+Math.floor(Date.now()/3600000);
  const response=await fetch(path,{mode:'cors',cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const body=await response.text();
  if(body.length>MAX_REMOTE_BYTES)throw Error('Archive size limit exceeded');
  const next=normalizeArchive(JSON.parse(body));
  if(!next)throw Error('Invalid source archive');
  archive=next;usingCached=false;fetchedAt=Date.now();
  // Cache only two weeks, so Wordville vocabulary and diary localStorage remain intact.
  try{
   const compact={...next,countries:{}};
   for(const [geo,days] of Object.entries(next.countries))
    compact.countries[geo]=Object.fromEntries(Object.entries(days).sort(([a],[b])=>b.localeCompare(a)).slice(0,14).map(([d,rows])=>[d,rows.slice(0,10)]));
   compact.memeNews={};
   for(const [geo,days] of Object.entries(next.memeNews||{}))
    compact.memeNews[geo]=Object.fromEntries(Object.entries(days).sort(([a],[b])=>b.localeCompare(a)).slice(0,14).map(([d,rows])=>[d,rows.slice(0,8)]));
   const small=JSON.stringify(compact);
   if(small.length<MAX_CACHE_BYTES)localStorage.setItem(CACHE,small);
  }catch{}
  if(!requestedDate||!(mode==='memes'?datedNews(archive,country,requestedDate):datedRows(archive,country,requestedDate)).length)applyDate(country,true);
 }catch(e){
  usingCached=!!archive;
  console.warn('Wordville verified trends unavailable:',e);
 }finally{
  busy=false;fetchButton.disabled=false;render();
 }
}
function open(){
 if(!requestedDate)applyDate(country,true);
 loadCache();
 if(archive)applyDate(country,true);
 render();
 if(!fetchedAt||Date.now()-fetchedAt>5*60*1000)void fetchData();
}
countries.addEventListener('change',()=>{applyDate(countries.value,true);render();});
for(const [name,button] of [['trends',trendTab],['memes',memeTab]])
 button.addEventListener('click',()=>{mode=name;applyDate(country,true);render();});
searchField.addEventListener('input',render);
datepicker.addEventListener('change',()=>{requestedDate=datepicker.value;render();});
fetchButton.addEventListener('click',()=>{void fetchData();});
document.addEventListener('wordville-board-open',open);
document.addEventListener('wordville-language-changed',()=>{render();});
})(globalThis);
