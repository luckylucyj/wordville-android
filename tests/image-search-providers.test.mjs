import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const gallery=readFileSync(new URL('../app/src/main/assets/memory-gallery.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../app/src/main/assets/index.html',import.meta.url),'utf8');

function openverseWith(fetchImpl){
 const start=gallery.indexOf(' async function openverseResults(query,signal){');
 const end=gallery.indexOf(' async function commonsResults(query,signal){',start);
 assert.ok(start>=0&&end>start,'Openverse request function exists');
 const functionText=gallery.slice(start,end);
 return new Function('fetch','safeLink','openversePageSize',functionText+';return openverseResults;')(
  fetchImpl,url=>String(url||''),20
 );
}

test('image gallery renders unified providers with a separate API key configuration panel',()=>{
 assert.doesNotThrow(()=>new Function(gallery));
 assert.doesNotMatch(html,/id="wv-memory-search-source"/);
 assert.match(html,/id="wv-memory-api-settings"/);
 assert.match(html,/id="wv-memory-source-breakdown"/);
 assert.match(gallery,/wv-image-source-badge/);
 assert.match(gallery,/originSite/);
 assert.match(gallery,/Promise\.allSettled\(jobs\.map\(job=>job\.load\(\)\)\)/);
 for(const id of ['wv-memory-google-link','wv-memory-pixabay-link','wv-memory-unsplash-link','wv-memory-pexels-link'])
  assert.ok(!html.includes('id="'+id+'"'),'Remove old outbound search link '+id);
 assert.ok(!gallery.includes('function externalLinks('),'Outbound link updater must be removed');
 assert.match(html,/id="wv-memory-search-submit"/);
});
 
test('anonymous Openverse image request asks for no more than 20 results',async()=>{
 let actualUrl;
 const search=openverseWith(async url=>{
  actualUrl=new URL(url);
  return {ok:true,json:async()=>({results:[{
   id:'12345678-1234-1234-1234-123456789abc',title:'Campaign',
   foreign_landing_url:'https://example.org/photo',license:'cc0',creator:'Creator',mature:false
  }]})};
 });
 const images=await search('campaign',new AbortController().signal);
 assert.equal(actualUrl.origin,'https://api.openverse.org');
 assert.equal(actualUrl.searchParams.has('page_size'),false);
 assert.equal(actualUrl.searchParams.get('q'),'campaign');
 assert.equal(actualUrl.searchParams.has('mature'),false);
 assert.equal(images.length,1);
 assert.equal(images[0].source,'Openverse');
 assert.equal(images[0].license,'CC0');
});

function unifiedWith(keys,handlers){
 const first=gallery.indexOf(' async function unifiedResults(query,signal){');
 const last=gallery.indexOf(' async function search(w=active){',first);
 assert.ok(first>=0&&last>first,'unified function exists');
 const $=id=>({value:keys[id]||''});
 const methods=['openverseResults','commonsResults','unsplashResults','pexelsResults','pixabayResults'];
 return new Function('$','openverseResults','commonsResults','unsplashResults','pexelsResults','pixabayResults','approvedMediaUrl','safeLink','DOMException',
  gallery.slice(first,last)+';return unifiedResults;')($,...methods.map(name=>handlers[name]),x=>Boolean(x),x=>x,DOMException);
}
test('unified search displays all available provider results and isolates failed sources',async()=>{
 const calls=[];
 const picture=source=>({source,thumbnail:'https://example.test/'+source+'.jpg',sourceUrl:'https://example.test/'+source});
 const handlers={
  openverseResults:async()=>{calls.push('Openverse');return [picture('Openverse')]},
  commonsResults:async()=>{calls.push('Commons');return [picture('Wikimedia Commons')]},
  unsplashResults:async()=>{calls.push('Unsplash');throw Error('API 401')},
  pexelsResults:async()=>{calls.push('Pexels');return []},
  pixabayResults:async()=>{calls.push('Pixabay');return [picture('Pixabay')]}
 };
 const search=unifiedWith({'wv-memory-unsplash-key':'u','wv-memory-pixabay-key':'p'},handlers);
 const result=await search('campaign',new AbortController().signal);
 assert.equal(result.results.length,3);
 assert.deepEqual(result.results.map(x=>x.source),['Openverse','Wikimedia Commons','Pixabay']);
 assert.deepEqual(calls.sort(),['Commons','Openverse','Pixabay','Unsplash']);
 assert.match(result.details.join(' '),/Unsplash 오류 \(API 401\)/);
 assert.match(result.details.join(' '),/Pexels 키 미등록/);
});
test('two key-free sources still return images when optional API keys are absent',async()=>{
 const img=source=>({source,thumbnail:'https://example.test/pic.jpg',sourceUrl:'https://example.test/'+source});
 const unexpected=()=>{throw Error('Optional provider should not run without key');};
 const search=unifiedWith({},{
  openverseResults:async()=>[img('Openverse')],
  commonsResults:async()=>[img('Wikimedia Commons')],
  unsplashResults:unexpected,pexelsResults:unexpected,pixabayResults:unexpected
 });
 const result=await search('bank',new AbortController().signal);
 assert.deepEqual(result.results.map(x=>x.source),['Openverse','Wikimedia Commons']);
 assert.equal(result.details.filter(x=>x.includes('키 미등록')).length,3);
});
test('no external site-search links or false Google search results are shown',()=>{
 for(const phrase of ['Google 이미지에서 더 찾기','Pixabay 사이트에서 찾기',
  'Unsplash 사이트에서 찾기','Pexels 사이트에서 찾기'])
  assert.ok(!html.includes(phrase),'Remove old external search link: '+phrase);
 assert.ok(!gallery.includes("source==='google'"));
 assert.match(html,/Google 이미지 검색은 신규 사용자를 위한 공식 검색 API가 제공되지 않아 통합 검색에 포함하지 않습니다/);
});
test('API key connection, licensing and secure attribution remain available',()=>{
 assert.ok(gallery.includes('Pixabay 연결 성공'));
 assert.ok(gallery.includes('pixabayApiError(response.status)'));
 assert.ok(html.includes('<button id="wv-memory-pixabay-test" type="button">'));
 assert.ok(html.includes('https://pixabay.com/api/docs/'));
 assert.match(gallery,/site\.textContent='출처: '/);
 assert.match(gallery,/image\.source=\(result\.source/);
 assert.match(gallery,/result\.originSite\?' · 원본 '/);
});

test('Unsplash and Pexels use official authenticated photo APIs and save attribution',()=>{
 assert.match(gallery,/https:\/\/api\.unsplash\.com\/search\/photos\?/);
 assert.match(gallery,/https:\/\/api\.pexels\.com\/v1\/search\?/);
 assert.match(gallery,/Authorization:'Client-ID '\+key/);
 assert.match(gallery,/headers:\{Authorization:key\}/);
 assert.match(gallery,/license:'Unsplash License'/);
 assert.match(gallery,/license:'Pexels License'/);
 assert.match(gallery,/downloadLocation:x\.links\.download_location/);
 assert.match(gallery,/Unsplash 다운로드 기록 실패/);
 for(const provider of ['unsplash','pexels']){
  for(const suffix of ['field','key','remember','test','clear','status'])
   assert.ok(html.includes('id="wv-memory-'+provider+'-'+suffix+'"'));
 }
});
test('additional API credentials are encrypted by Android Keystore, never stored in JS storage',()=>{
 const java=readFileSync(new URL('../app/src/main/java/com/wordville/app/MainActivity.java',import.meta.url),'utf8');
 assert.match(java,/@JavascriptInterface public synchronized boolean saveProviderKey/);
 assert.match(java,/@JavascriptInterface public synchronized String getProviderKey/);
 assert.match(java,/@JavascriptInterface public synchronized boolean clearProviderKey/);
 assert.doesNotMatch(gallery,/localStorage\.setItem\([^\n]*(unsplash|pexels)/i);
});
