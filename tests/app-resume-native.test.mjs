import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../app/src/main/',import.meta.url);
const java=readFileSync(new URL('java/com/wordville/app/MainActivity.java',root),'utf8');
const app=readFileSync(new URL('assets/app.js',root),'utf8');
const shell=readFileSync(new URL('assets/app-shell.js',root),'utf8');

test('native resume health verifies vocabulary and visible screen without requiring hidden Town rendering',()=>{
 assert.ok(java.includes("var townReady=screen!=='town'"));
 assert.match(java,/townReady;\}\)\(\)"/);
 assert.match(java,/Array\.isArray\(words\)&&words\.length>0/);
 assert.match(java,/var words=window\.WordvilleWords/);
 assert.match(java,/screenTimeout=\(\)->/);
 assert.match(java,/expected\.postVisualStateCallback/);
});
test('native WebView foreground recovery does not erase user data',()=>{
 assert.match(java,/web\.onResume\(\)/);
 assert.match(java,/web\.resumeTimers\(\)/);
 assert.match(java,/onRenderProcessGone/);
 assert.match(java,/recoverScreen\(/);
 assert.doesNotMatch(java,/\.clearCache\(true\)|WebStorage\.getInstance\(\)\.deleteAllData|clearHistory\(\)/);
});
test('last user-selected screen is saved to native storage and restored after WebView recreation',()=>{
 for(const tab of ['town','places','residents','learn','review','lab','book','notes','gallery','account','sentences','interpretation','schedule','solo']){
  assert.ok(java.includes('"'+tab+'"'),'native can save '+tab);
  assert.ok(shell.includes("'"+tab+"'"),'web can restore '+tab);
 }
 assert.match(shell,/const rememberedTab=screen;/);
 assert.match(shell,/activate\(resumeScreen\);/);
 assert.doesNotMatch(shell,/const rememberedTab=screen==='learn'\?'learn':'town'/);
});
test('vocabulary is not blocked by optional POS or photo database loading',()=>{
 assert.doesNotMatch(app,/await Promise\.all\(\[fetch\('words\.json'\),loadWordPartsOfSpeech/);
 assert.match(app,/databaseReady=openDatabase\(\)\.then/);
 assert.match(app,/void loadWordPartsOfSpeech\(\)\.then/);
 assert.match(app,/try\{const res=await fetch\('words\.json'\)/);
 assert.match(app,/async function imageAction\(mode,key,value\)\{if\(!db&&databaseReady\)await databaseReady;/);
});
test('startup and local record save functions are actually executable (not commented by escaped newlines)',()=>{
 assert.match(app,/^function save\\(next\\)/m);
 assert.match(app,/^\\$\\('balance'\\)\\.textContent=/m);
 assert.match(shell,/^document\\.addEventListener\\('wordville-words-ready',finishStartup/m);
 assert.match(shell,/^if\\(globalThis\\.WordvilleWords\\?\\.length\\)finishStartup\\(\\);/m);
});

test('existing XP/coins and reviews are restored from localStorage on foreground without network',()=>{
 assert.match(app,/function rehydrateStudyOnForeground\(\)/);
 assert.match(app,/localStorage\.getItem\(storageKey\)/);
 assert.match(app,/document\.addEventListener\('wordville-app-resume',rehydrateStudyOnForeground\)/);
 assert.match(app,/else rehydrateStudyOnForeground\(\);/);
 assert.match(app,/renderStats\(\);/);
});
