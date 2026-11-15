import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=n=>readFileSync(new URL('../app/src/main/assets/'+n,import.meta.url),'utf8');
test('both combination selectors use locale-aware option binding',()=>{
 const app=src('app.js'),journal=src('sentence-journal.js');
 assert.match(app,/WordvilleVocabularyLocale\?\.bindOption\(option,w\.word,w\.meaning\)/);
 assert.match(journal,/WordvilleVocabularyLocale\?\.bindOption\(option,w\.word,w\.meaning\)/);
 assert.doesNotMatch(journal,/option\.textContent=w\.word\+' · '\+w\.meaning/);
});
test('combine hint is localized and updates when the locale changes',()=>{
 const app=src('app.js'),translations=src('i18n.js');
 assert.match(app,/WordvilleI18n\?\.translate\('선택한 두 단어로 영어 문장을 작성하세요\.'/);
 assert.match(app,/addEventListener\('wordville-language-changed',connection\)/);
 assert.match(translations,/Write an English sentence using both words\./);
});
test('Residents tab displays portraits only; schedules are accessible from More',()=>{
 const shell=src('app-shell.js'),css=src('app-shell.css'),portrait=src('portrait-ui.js');
 assert.match(shell,/residents\.dataset\.mode='portraits'/);
 assert.match(shell,/\['schedule','🕒','주민 일정 관리'\]/);
 assert.match(shell,/residents\.dataset\.mode='schedule'/);
 assert.match(css,/#wv-residents-view\[data-mode="portraits"\] > :not\(\.neighbors\)/);
 assert.match(portrait,/button\.setAttribute\('aria-label',name\+' — '\+action\)/);
 assert.doesNotMatch(portrait,/art\.setAttribute\('role','button'\)/);
});
