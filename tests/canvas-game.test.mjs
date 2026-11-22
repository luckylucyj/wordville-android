import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const canvas=readFileSync(new URL('../app/src/main/assets/canvas-minigames.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/src/main/assets/canvas-minigames.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../app/src/main/assets/index.html',import.meta.url),'utf8');
const solo=readFileSync(new URL('../app/src/main/assets/solo-learning.js',import.meta.url),'utf8');
const native=readFileSync(new URL('../app/src/main/java/com/wordville/app/MainActivity.java',import.meta.url),'utf8');
const backup=readFileSync(new URL('../app/src/main/assets/record-backup.js',import.meta.url),'utf8');

test('Canvas games are syntactically valid and loaded after solo progress controller',()=>{
 assert.doesNotThrow(()=>new Function(canvas));
 assert.match(html,/canvas-minigames\.js/);
 assert.match(html,/canvas-minigames\.css/);
 assert.ok(html.indexOf('solo-learning.js')<html.indexOf('canvas-minigames.js'));
 assert.match(canvas,/root\.WordvilleGameEngine=WordvilleGameEngine/);
 assert.match(canvas,/root\.wordvilleGame=new WordvilleGameEngine\('wordvilleCanvas'\)/);
});
test('all four Canvas modes, specified HUD geometry, optional art manifest',()=>{
 for(const mode of ['fishing','weeding','foraging','room'])
  assert.ok(canvas.includes("'"+mode+"'"),mode+' registered');
 for(const value of ['W=600,H=1000','this.LOGICAL_W=W','this.LOGICAL_H=H',
  'this.box(18,16,148,60','this.box(502,120,80,336','const p=this.state.popup,py=660',
  'FISH_ZONE=[64,88]','this.box(30,860,540,96'])assert.ok(canvas.includes(value),value);
 for(const path of ['images/fishing/hachiware_idle.png','images/fishing/hachiware_catch.png',
  'images/weeding/chiikawa_perfect.png','images/weeding/chiikawa_medium.png','images/weeding/chiikawa_bad.png',
  'images/foraging/chiikawa_3stage_atlas.png',
  'images/room/room-decor.webp'])
  assert.ok(canvas.includes(path),path+' asset slot');
 assert.match(canvas,/drawCritter\(/);
});
test('high DPR render keeps fixed 600x1000 logical coordinates and mobile touch support',()=>{
 assert.match(canvas,/Math\.min\(2,Math\.max\(1,root\.devicePixelRatio\|\|1\)\)/);
 assert.match(canvas,/this\.ctx\.setTransform\(width\/W,0,0,height\/H,0,0\)/);
 assert.match(css,/aspect-ratio:3\/5/);
 assert.match(canvas,/touchAction='pan-y'/);
 assert.match(css,/touch-action:pan-y/);
 assert.match(css,/\.wv-room-drag-handle[\s\S]*?touch-action:none/);
 assert.match(canvas,/className='wv-room-drag-handle'/);
 assert.match(canvas,/pointercancel/);
});
test('real user vocabulary and progress are authoritative; no sample teaching-only dictionary',()=>{
 assert.match(canvas,/loadWordsFromAndroid\(wordList\)/);
 assert.match(canvas,/root\.WordvilleWords/);
 assert.doesNotMatch(canvas,/this\.words=\[\s*\{id:1/);
 assert.match(canvas,/root\.WordvilleSolo\.learnFromCanvas\(word\.id,this\.state\.mode,true\)/);
 assert.match(solo,/Wordville\.review\(state,word\.id,Boolean\(correct\),now\)/);
 assert.match(solo,/if\(!save\(next\)\)return false/);
 assert.match(canvas,/root\.AndroidBridge\.onWordLearned\(String\(word\.id\),this\.state\.mode\)/);
 assert.match(native,/new WordvilleGameBridge\(\),"AndroidBridge"/);
});
test('foraging uses the offline three-frame atlas and separate playback controls',()=>{
 assert.match(css,/images\/foraging\/chiikawa_3stage_atlas\.png/);
 assert.match(css,/--forage-frame:50%/);
 assert.match(css,/--forage-frame:100%/);
 assert.match(canvas,/if\(this\.state\.mode!=='foraging'\|\|g\.pending\|\|Date\.now\(\)<this\.nextActionAt\)return/);
 assert.match(canvas,/if\(action==='forage'\)this\.setForageStage\(1,\.9\)/);
});
test('weeding has three result levels and timing limits',()=>{
 assert.match(canvas,/w\.status=p>=\.4&&p<=\.6\?'perfect':p>=\.22&&p<=\.78\?'medium':'bad'/);
 assert.match(canvas,/w\.timer=1\.3/);
 assert.match(canvas,/if\(w\.status==='bad'\)/);
});
test('quarter-view inventory drag positions persist and belong to backup snapshot',()=>{
 assert.match(canvas,/wordville_room_v1/);
 assert.match(canvas,/setPointerCapture/);
 assert.match(canvas,/pointermove/);
 assert.match(canvas,/constrainFloor\(/);
 assert.match(canvas,/saveRoomState\(\)/);
 assert.match(backup,/wordville_room_v1/);
});
test('foreground/hidden game pause and restoration avoid freezing on other apps',()=>{
 assert.match(canvas,/visibilitychange/);
 assert.match(canvas,/wordville-app-resume/);
 assert.match(canvas,/this\.pause\(\)/);
 assert.match(canvas,/this\.resume\(\)/);
 assert.doesNotMatch(canvas,/fetch\(/);
 assert.doesNotMatch(canvas,/WebSocket\(/);
});

test('fishing uses authored PNGs only, logs WebView URL errors and does not draw fallback scenes',()=>{
 assert.match(canvas,/bg_fishing:'images\/fishing\/bg_fishing\.png'/);
 assert.match(canvas,/hachiware_idle:'images\/fishing\/hachiware_idle\.png'/);
 assert.match(canvas,/hachiware_catch:'images\/fishing\/hachiware_catch\.png'/);
 assert.match(canvas,/new URL\(path,root\.document\.baseURI\)/);
 assert.match(canvas,/image\.onerror=\(\)=>this\.reportAssetError/);
 assert.match(canvas,/removeWhiteBackground\(image,key\)/);
 assert.match(canvas,/visited=new Uint8Array\(total\)/);
 const fishing=canvas.slice(canvas.indexOf('  renderFishing(){'),canvas.indexOf('  renderWeeding(){'));
 assert.match(fishing,/this\.paintSprite\('bg_fishing',0,0,W,H\)/);
 assert.match(fishing,/this\.paintSprite\(catching\?'hachiware_catch':'hachiware_idle'/);
 assert.match(canvas,/f\.pos>=FISH_ZONE\[0\]-2&&f\.pos<=FISH_ZONE\[1\]\+2/);
 assert.match(css,/width:var\(--fish-width\)/);
 assert.match(css,/data-fishing-phase="caught"/);
 assert.doesNotMatch(fishing,/drawCritter\(|this\.background\(|ctx\.drawLine|for\(let i=0;i<5;i\+\+\)/);
 const generator=readFileSync(new URL('../scripts/build-canvas-minigame-art.py',import.meta.url),'utf8');
 assert.doesNotMatch(generator,/fishing\/bg_dock\.png/);
 assert.doesNotMatch(generator,/\("fishing\/hachiware_(idle|catch)\.png"/);
 assert.match(generator,/if path\.exists\(\): return/);
});
