import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const js=readFileSync(new URL('../app/src/main/assets/memory-gallery.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../app/src/main/assets/index.html',import.meta.url),'utf8');
const java=readFileSync(new URL('../app/src/main/java/com/wordville/app/MainActivity.java',import.meta.url),'utf8');
const manifest=readFileSync(new URL('../app/src/main/AndroidManifest.xml',import.meta.url),'utf8');

function session({saved='',android=true,valid=true}={}){
 const refs=new Map();
 const element=id=>{
  if(!refs.has(id))refs.set(id,{
   value:'',hidden:false,checked:true,disabled:false,textContent:'',handlers:{},
   addEventListener(name,fn){this.handlers[name]=fn;},focus(){}
  });
  return refs.get(id);
 };
 let secret=saved,saveCalls=0;
 const secure={
  getSavedKey:()=>secret,
  saveKey:key=>{saveCalls++;secret=key;return true;},
  clearSavedKey:()=>{secret='';return true;}
 };
 class Params{constructor(q){this.fields=q;}toString(){return Object.entries(this.fields).map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&');}}
 const mockFetch=async()=>valid?({ok:true,json:async()=>({hits:[]})}):({ok:false,status:401});
 const start=js.indexOf(" const sourceSelect=$('wv-memory-search-source'),pixabayKey=$('wv-memory-pixabay-key');");
 const end=js.indexOf(' function externalLinks(q){',start);
 assert.ok(start>=0&&end>start,'Key UI initialization is present');
 new Function('$','location','globalThis','fetch','URLSearchParams',js.slice(start,end))(
  element,{origin:android?'https://appassets.androidplatform.net':'https://localhost'},
  {WordvillePixabaySecure:android?secure:undefined},mockFetch,Params
 );
 return {el:element,get secret(){return secret;},get saveCalls(){return saveCalls;}};
}

test('Android encrypts key with Keystore AES-GCM and does not back up app credentials',()=>{
 assert.match(java,/KeyStore\.getInstance\("AndroidKeyStore"\)/);
 assert.match(java,/Cipher\.getInstance\("AES\/GCM\/NoPadding"\)/);
 assert.match(java,/new GCMParameterSpec\(128,nonce\)/);
 assert.match(java,/WordvillePixabaySecureBridge/);
 assert.match(java,/@JavascriptInterface public synchronized boolean clearSavedKey/);
 assert.match(manifest,/android:allowBackup="false"/);
 assert.doesNotMatch(js,/localStorage\.setItem\([^\n]*pixabay/i);
 assert.match(html,/id="wv-memory-pixabay-remember"/);
 assert.match(html,/id="wv-memory-pixabay-clear"/);
});

test('saved key automatically restores into the Pixabay field at app launch',()=>{
 const s=session({saved:'PIXABAYSAFE123456'});
 assert.equal(s.el('wv-memory-pixabay-key').value,'PIXABAYSAFE123456');
 assert.match(s.el('wv-memory-pixabay-status').textContent,/자동으로 불러왔습니다/);
});

test('verified key is saved for subsequent launches',async()=>{
 const s=session();
 s.el('wv-memory-pixabay-key').value='MYPIXABAYKEY5678';
 await s.el('wv-memory-pixabay-test').handlers.click();
 assert.equal(s.secret,'MYPIXABAYKEY5678');
 assert.equal(s.saveCalls,1);
 assert.match(s.el('wv-memory-pixabay-status').textContent,/암호화 저장했습니다/);
 const next=session({saved:s.secret});
 assert.equal(next.el('wv-memory-pixabay-key').value,'MYPIXABAYKEY5678');
});

test('invalid key is not saved and existing secret is not overwritten',async()=>{
 const s=session({saved:'PREVIOUSKEYVALID',valid:false});
 s.el('wv-memory-pixabay-key').value='WRONGKEY';
 await s.el('wv-memory-pixabay-test').handlers.click();
 assert.equal(s.secret,'PREVIOUSKEYVALID');
 assert.equal(s.saveCalls,0);
 assert.match(s.el('wv-memory-pixabay-status').textContent,/연결 실패/);
});

test('clearing the saved key removes the current input and the persistent secret',()=>{
 const s=session({saved:'SAVEDOLDKEY'});
 s.el('wv-memory-pixabay-clear').handlers.click();
 assert.equal(s.secret,'');
 assert.equal(s.el('wv-memory-pixabay-key').value,'');
});

test('non-Android browser does not persist a secret',async()=>{
 const s=session({android:false});
 assert.equal(s.el('wv-memory-pixabay-remember').disabled,true);
 assert.equal(s.el('wv-memory-pixabay-remember').checked,false);
 s.el('wv-memory-pixabay-key').value='UNSAVEDKEY';
 await s.el('wv-memory-pixabay-test').handlers.click();
 assert.equal(s.saveCalls,0);
 assert.match(s.el('wv-memory-pixabay-status').textContent,/키는 저장되지 않았고/);
});


test('turning off remember deletes saved key but keeps the current input for this session',()=>{
 const s=session({saved:'PERSISTEDPIXABAYKEY'});
 s.el('wv-memory-pixabay-remember').checked=false;
 s.el('wv-memory-pixabay-remember').handlers.change();
 assert.equal(s.secret,'');
 assert.equal(s.el('wv-memory-pixabay-key').value,'PERSISTEDPIXABAYKEY');
 const restarted=session();
 assert.equal(restarted.el('wv-memory-pixabay-key').value,'');
});

test('a verified key is not persisted when remember is disabled',async()=>{
 const s=session();
 s.el('wv-memory-pixabay-remember').checked=false;
 s.el('wv-memory-pixabay-key').value='TEMPORARYPIXABAYKEY';
 await s.el('wv-memory-pixabay-test').handlers.click();
 assert.equal(s.secret,'');
 assert.equal(s.saveCalls,0);
 assert.match(s.el('wv-memory-pixabay-status').textContent,/키는 저장되지 않았고/);
});
