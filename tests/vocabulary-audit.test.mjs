import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../app/src/main/assets/engine.js';
const E=globalThis.Wordville;
const words=JSON.parse(fs.readFileSync(new URL('../app/src/main/assets/words.json',import.meta.url)));
const find=word=>words.find(w=>w.word===word);
const key=s=>s.normalize('NFKC').replace(/^~\s*[을를이가에와과의]?\s*/,'').replace(/[\s·~]/g,'');

test('audited words have no duplicate senses, broken glyphs, POS residue or ID collisions',()=>{
 const allIds=words.flatMap(w=>E.wordIds(w));
 assert.equal(new Set(allIds).size,allIds.length);
 for(const w of words){
  assert.equal(w.meaning,w.meanings.join('; '),w.word);
  assert.equal(new Set(w.meanings.map(key)).size,w.meanings.length,w.word);
  assert.doesNotMatch(w.meaning,/[�□■ㄱ-ㅎㅏ-ㅣ]|\b(?:adj|adv|phr|prep|V)\b/,w.word);
  assert.equal((w.meaning.match(/\(/g)||[]).length,(w.meaning.match(/\)/g)||[]).length,w.word);
 }
});
test('OCR regressions preserve correct spelling, numerals and source ownership',()=>{
 for(const word of ['boardroom','break down','postal','selective','at one\'s request','cut back','travel agency','prepare a meal','result in','check out','work around'])assert.ok(find(word),word);
 for(const [word,meaning] of [['decade','10년'],['fortnight','2주간'],['overnight stay','1박'],['double occupancy','2인실 사용'],['except','~을 제외하고']])assert.equal(find(word).meaning,meaning);
 assert.deepEqual(find('fall').pdfPages,[164]);
 assert.ok(!find('fair').pdfPages.includes(164));assert.ok(find('fair').pdfPages.includes(166));assert.ok(find('fair').days.includes(9));
 assert.doesNotMatch(find('fair').meaning,/하락/);
 assert.match(find('effect').meaning,/가져오다/);
 assert.match(find('representative').meaning,/대리의/);
});
test('merged IDs preserve legacy learning, images and concepts without rewards or deletion',()=>{
 const effect=find('effect'),old=effect.aliases[0];
 const legacy={...E.fresh(),xp:30,coins:9,reviews:{[old]:{attempts:7,streak:3,due:123}},concepts:[{key:old+'|invoice',a:old,b:'invoice',name:'효과'}]};
 const snapshot=JSON.stringify(legacy),migrated=E.migrateAliases(legacy,words);
 assert.equal(JSON.stringify(legacy),snapshot);
 assert.deepEqual(migrated.reviews[effect.id],legacy.reviews[old]);
 assert.deepEqual(migrated.reviews[old],legacy.reviews[old]);
 assert.deepEqual(migrated.concepts,legacy.concepts);assert.equal(migrated.xp,30);assert.equal(migrated.coins,9);
 assert.deepEqual(E.wordIds(effect),[effect.id,old]);
 assert.equal(E.migrateAliases(migrated,words),migrated);
});
