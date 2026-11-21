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

test('image gallery JavaScript parses and Google appears as external source',()=>{
 assert.doesNotThrow(()=>new Function(gallery));
 assert.match(html,/<option value="google">Google 이미지 · 웹 검색 \(외부\)<\/option>/);
 assert.match(html,/<option value="openverse">/);
 assert.match(html,/<option value="commons">/);
 assert.match(html,/<option value="pixabay">/);
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
 assert.equal(actualUrl.searchParams.get('page_size'),'20');
 assert.equal(actualUrl.searchParams.get('q'),'campaign');
 assert.equal(actualUrl.searchParams.get('mature'),'false');
 assert.equal(images.length,1);
 assert.equal(images[0].source,'Openverse');
 assert.equal(images[0].license,'CC0');
});

test('provider failures fall back to Wikimedia and credits include the actual source',()=>{
 assert.match(gallery,/catch\(openverseError\)[\s\S]*?commonsResults\(query,controller\.signal\)/);
 assert.match(gallery,/if\(pixabayKey\.value\.trim\(\)\)results=await pixabayResults/);
 assert.match(gallery,/Pixabay API는 계정별 키가 필요합니다/);
 assert.match(gallery,/rights\.textContent=\(result\.source\|\|'출처 미상'\)/);
 assert.match(gallery,/if\(source==='google'\)/);
 assert.match(gallery,/Google 이미지 검색 결과 열기/);
});
