import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../app/src/main/assets/word-usage.js';
import '../app/src/main/assets/word-pronunciation.js';

const assets=new URL('../app/src/main/assets/',import.meta.url);
const index=JSON.parse(readFileSync(new URL('word-usage-index.json',assets),'utf8'));
const words=JSON.parse(readFileSync(new URL('words.json',assets),'utf8'));
const usage=globalThis.WordvilleUsage;
const speech=globalThis.WordvillePronunciation;

test('usage uses real counts, normalizes per category size and preserves a no-evidence state',()=>{
 assert.equal(index.genres.length,11);
 assert.equal(index.sizes.reduce((a,b)=>a+b,0),451289);
 assert.ok(Object.keys(index.terms).length>3800);
 const vocabulary=new Set(words.map(word=>word.word));
 assert.ok(Object.keys(index.terms).every(term=>vocabulary.has(term)));
 const [top]=usage.findings(index,'invoice');
 assert.equal(top.id,'email');
 assert.equal(top.count,16);
 assert.ok(usage.findings(index,'get in touch with').length>0);
 assert.deepEqual(usage.findings(index,'__proto__'),[]);
 assert.deepEqual(usage.findings(index,'adjourn'),[]);
 const url=new URL(usage.examplesUrl("keep one's word"));
 assert.equal(new URLSearchParams(url.hash.split('?')[1]).get('query'),"keep one's word");
});

test('pronunciation chooses the exact regional voice and prefers an installed local voice',()=>{
 const us={lang:'en-US',localService:true};
 const uk={lang:'en_GB',localService:true};
 const networkUk={lang:'en-GB',localService:false,default:true};
 const voices=[networkUk,us,uk,{lang:'en-AU',localService:true,default:true}];
 assert.equal(speech.voiceFor(voices,'en-US'),us);
 assert.equal(speech.voiceFor(voices,'en-GB'),uk);
 assert.equal(speech.voiceFor([us],'en-GB'),undefined);
 assert.equal(speech.spokenText({word:'resume',meaning:'이력서'}),'résumé');
 assert.equal(speech.spokenText({word:'resume',meaning:'다시 시작하다'}),'resume');
});
