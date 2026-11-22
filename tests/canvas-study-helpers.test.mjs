import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../app/src/main/assets/canvas-study-helpers.js';

const {WordvilleStudyManager,SpriteAtlasHelper}=globalThis;
const words=['reservation','invoice','deadline','harvest','breeze'].map(id=>({id,word:id,meaning:id}));
const storage=()=>{const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
const ids=manager=>manager.queue.map(x=>x.id);

test('A failed answer is moved behind exactly two other words, never duplicated',()=>{
 const mgr=new WordvilleStudyManager(words,{storage:storage()});
 const failed=mgr.markRetry();
 assert.equal(failed.id,'reservation');
 assert.deepEqual(ids(mgr),['invoice','deadline','reservation','harvest','breeze']);
 assert.equal(new Set(ids(mgr)).size,5);
 const succeeded=mgr.markSuccess();
 assert.equal(succeeded.id,'invoice');
 assert.deepEqual(ids(mgr),['deadline','reservation','harvest','breeze','invoice']);
 assert.deepEqual([...mgr.masteredIds],['invoice']);
});
test('Repeated wrong answers cannot create an unbounded review queue',()=>{
 const mgr=new WordvilleStudyManager(words,{storage:storage()});
 for(let i=0;i<40;i++){
  const failed=mgr.current()?.id;
  assert.equal(mgr.markRetry()?.id,failed);
  assert.equal(mgr.queue.length,words.length);
  assert.equal(new Set(ids(mgr)).size,words.length);
 }
});
test('A WebView empty boot cannot overwrite the saved queue; cold restart restores its front',()=>{
 const local=storage();
 const first=new WordvilleStudyManager(words,{storage:local});
 first.markRetry();first.markSuccess();
 const expected=ids(first).slice(0,4);
 const before=local.getItem(first.key);
 const reboot=new WordvilleStudyManager([],{storage:local});
 assert.equal(local.getItem(first.key),before,'must not erase existing queue during boot');
 reboot.setWords(words);
 assert.deepEqual(ids(reboot).slice(0,4),expected);
 assert.equal(reboot.current().id,first.current().id);
});
test('Selected Day scopes have independent queue identity',()=>{
 const local=storage();
 const day10=new WordvilleStudyManager(words.slice(0,3),{storage:local,scope:'10'});
 day10.markRetry();
 const day11=new WordvilleStudyManager(words.slice(3),{storage:local,scope:'11'});
 assert.equal(day11.current().id,'harvest');
 day11.setWords(words.slice(0,3),'10');
 assert.deepEqual(ids(day11),['invoice','deadline','reservation']);
});
test('Three-panel atlas crops only the center 56% of selected panel',()=>{
 const atlas=new SpriteAtlasHelper();
 atlas.sheets.test={naturalWidth:512,naturalHeight:1536};
 const calls=[],ctx={drawImage:(...args)=>calls.push(args)};
 assert.equal(atlas.drawPanel(ctx,'test',2,130,225,250,280),true);
 assert.equal(calls.length,1);
 const [img,sx,sy,sw,sh,dx,dy,dw,dh]=calls[0];
 assert.equal(img,atlas.sheets.test);
 assert.ok(Math.abs(sx-512*.22)<.001);
 assert.ok(Math.abs(sy-(2+.08)*512)<.001);
 assert.ok(Math.abs(sw-512*.56)<.001);
 assert.ok(Math.abs(sh-512*.84)<.001);
 assert.deepEqual([dx,dy,dw,dh],[130,225,250,280]);
 assert.equal(atlas.drawPanel(ctx,'test',3,0,0,10,10),false);
 assert.equal(atlas.drawPanel(ctx,'missing',0,0,0,10,10),false);
});
test('Web Audio feedback is optional and never prevents progress without audio support',()=>{
 const mgr=new WordvilleStudyManager(words,{storage:storage()});
 assert.doesNotThrow(()=>mgr.playTone('success'));
 assert.doesNotThrow(()=>mgr.markRetry());
 assert.doesNotThrow(()=>mgr.markSuccess());
});
test('The existing secure WebView origin and String-ID Java bridge are retained',()=>{
 const native=readFileSync(new URL('../app/src/main/java/com/wordville/app/MainActivity.java',import.meta.url),'utf8');
 const manifest=readFileSync(new URL('../app/src/main/AndroidManifest.xml',import.meta.url),'utf8');
 const html=readFileSync(new URL('../app/src/main/assets/index.html',import.meta.url),'utf8');
 const canvas=readFileSync(new URL('../app/src/main/assets/canvas-minigames.js',import.meta.url),'utf8');
 assert.match(native,/package com\.wordville\.app;/);
 assert.match(native,/private final class WordvilleGameBridge/);
 assert.match(native,/onWordLearned\(String wordId,String gameType\)/);
 assert.match(native,/WebViewAssetLoader/);
 assert.doesNotMatch(native,/file:\/\/\/android_asset\/index\.html/);
 assert.doesNotMatch(manifest,/MiniGameActivity/);
 assert.ok(html.indexOf('canvas-study-helpers.js')<html.indexOf('canvas-minigames.js'));
 assert.match(canvas,/new root\.WordvilleStudyManager\(\[\]\)/);
 assert.match(canvas,/this\.atlas\.drawPanel\(/);
 assert.match(canvas,/this\.studyManager\.markRetry\(silent\)/);
});
