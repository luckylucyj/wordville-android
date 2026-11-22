import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../app/src/main/assets/canvas-minigames.js',import.meta.url),'utf8');

function createHarness(savedRoom) {
 const values=new Map();
 if(savedRoom!==undefined)values.set('wordville_room_v1',JSON.stringify(savedRoom));
 const calls=[];
 const root={
  document:{
   readyState:'loading',
   addEventListener(){},
   getElementById(){return null;},
   querySelectorAll(){return [];}
  },
  localStorage:{
   getItem:key=>values.get(key)||null,
   setItem:(key,value)=>values.set(key,String(value))
  },
  AndroidBridge:{onWordLearned:(id,gameType)=>calls.push([id,gameType])},
  WordvilleSolo:{learnFromCanvas:()=>true}
 };
 new Function('window',source)(root);
 const engine=Object.create(root.WordvilleGameEngine.prototype);
 engine.message=()=>{};
 return {engine,root,values,calls};
}

test('mini-world 4 destinations match fixed 600x1000 logical coordinates',()=>{
 const {engine}=createHarness();
 for(const [x,y,expected] of [
  [145,470,'fishing'],[445,275,'weeding'],
  [455,555,'foraging'],[300,710,'room'],
  [10,10,null],[-100,500,null],[NaN,470,null]
 ]){
  assert.equal(engine.worldDestinationAt(x,y),expected);
 }
});

test('legacy housing data loads safely without erasing placed furniture',()=>{
 const {engine}=createHarness({
  unlocked:[{id:'rug'}],
  placed:[{id:'chair',x:325,y:480},{id:'plant',x:130,y:450}]
 });
 const room=engine.loadRoomState();
 assert.equal(room.theme,'cozy');
 assert.equal(room.placed.length,2);
 assert.equal(room.placed[0].flipX,false);
 assert.ok(room.unlocked.some(item=>item.id==='rug'));
 assert.ok(room.unlocked.some(item=>item.id==='bed'));
});

test('house theme, furniture flip and removal persist without removing unlocked inventory',()=>{
 const {engine,values}=createHarness({
  unlocked:[{id:'chair'}],
  placed:[{id:'chair',x:325,y:480,flipX:true}],
  theme:'night'
 });
 const room=engine.loadRoomState();
 assert.equal(room.theme,'night');
 assert.equal(room.placed[0].flipX,true);
 engine.state={room};
 assert.equal(engine.saveRoomState(),true);
 let saved=JSON.parse(values.get('wordville_room_v1'));
 assert.equal(saved.theme,'night');
 assert.equal(saved.placed[0].flipX,true);
 engine.state.room.placed.splice(0,1);
 assert.equal(engine.saveRoomState(),true);
 saved=JSON.parse(values.get('wordville_room_v1'));
 assert.equal(saved.placed.length,0);
 assert.ok(saved.unlocked.some(item=>item.id==='chair'));
 assert.equal(saved.dragIdx,undefined);
});

test('unknown themes are sanitized and saved coordinates remain inside the room floor',()=>{
 const {engine}=createHarness({
  unlocked:[],
  placed:[{id:'bed',x:10000,y:-3000,flipX:true}],
  theme:'untrusted_theme'
 });
 const room=engine.loadRoomState();
 assert.equal(room.theme,'cozy');
 assert.ok(engine.floorPoint(room.placed[0].x,room.placed[0].y));
 assert.equal(room.placed[0].flipX,true);
});

test('one successful vocabulary answer unlocks furniture using the existing reward/bridge flow',()=>{
 const {engine,values,calls}=createHarness();
 engine.state={mode:'fishing',slots:[],popup:null,room:engine.loadRoomState()};
 const word={id:'5',word:'sprout',meanings:['새싹']}; // char code 53 % 6 => rug
 assert.equal(engine.state.room.unlocked.some(x=>x.id==='rug'),false);
 assert.equal(engine.award(word,'🐟'),true);
 assert.equal(engine.state.room.unlocked.some(x=>x.id==='rug'),true);
 assert.ok(JSON.parse(values.get('wordville_room_v1')).unlocked.some(x=>x.id==='rug'));
 assert.deepEqual(calls,[['5','fishing']]);
 assert.equal(engine.unlockWordFurniture(word),false,'same reward is not duplicated');
});

test('world navigation remains separate from Wordville existing solo quiz state',()=>{
 const {engine}=createHarness();
 let resumed=0,refreshed=0;
 engine.state={
  mode:'fishing',weeding:{timer:0,status:'idle',pendingRetry:false},
  foraging:{stage:1,timer:0,pending:false},room:{theme:'cozy'}
 };
 engine.resume=()=>{resumed++;};
 engine.refreshHeaderUI=()=>{refreshed++;};
 engine.switchMode('world');
 assert.equal(engine.state.mode,'world');
 assert.equal(resumed,1);
 assert.equal(refreshed,1);
 engine.switchMode('no-such-mode');
 assert.equal(engine.state.mode,'world');
});

test('Android bridge accepts JSON strings and direct vocabulary arrays without demo words',()=>{
 const {engine}=createHarness();
 engine.state={wordIdx:0,mode:'fishing'};
 engine.words=[];engine.sourceWords=[];
 engine.studyManager={setWords(){},current(){return null;}};
 engine.refreshHeaderUI=()=>{};
 engine.buildForagingChoices=()=>{};
 const original=[{id:900,word:'meadow',meaning:'초원',days:[1]}];
 assert.equal(engine.loadWordsFromAndroid(JSON.stringify(original)),true);
 assert.equal(engine.sourceWords[0].word,'meadow');
 assert.equal(engine.loadWordsFromAndroid([{id:901,word:'harvest',meaning:'수확하다',days:[2]}]),true);
 assert.equal(engine.sourceWords[0].id,901);
 assert.equal(engine.loadWordsFromAndroid('this is not JSON'),false);
 assert.equal(engine.sourceWords[0].id,901,'bad JSON must not replace valid vocabulary');
});

test('fishing keeps legacy background support and accepts authored bg_dock.png',()=>{
 assert.ok(source.includes("bg_fishing:'images/fishing/bg_fishing.png'"));
 assert.ok(source.includes('images/fishing/bg_dock.png'));
 assert.ok(source.includes('image.onerror=()=>this.reportAssetError'));
});
