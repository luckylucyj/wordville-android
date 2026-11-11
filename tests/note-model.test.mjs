import test from 'node:test';
import assert from 'node:assert/strict';
import '../app/src/main/assets/note-model.js';
const N=globalThis.WordvilleNoteModel;
test('thought-coding form has exact seven photo-based regions',()=>{
 assert.deepEqual(N.FIELD_NAMES,['overview','topic','category','notes','opinion','summary']);
 assert.equal(N.blank('voca-resume',1).checks.length,5);
});
test('same word in different days gets different persistent keys',()=>{
 assert.notEqual(N.key('voca-resume',1),N.key('voca-resume',2));
 assert.equal(N.blank('voca-resume',1).day,1);
 assert.equal(N.blank('voca-resume',2).day,2);
 assert.equal(N.dayLabel(0),'이디엄');
 assert.equal(N.dayLabel(13),'Day 13');
});
test('normalization safeguards status, checks, lengths and saved notes',()=>{
 const doc=N.clean({status:'mastered',checks:[true,false,true],notes:'hello',summary:'one line',topic:'t'.repeat(400)},'voca-resume',1);
 assert.equal(doc.status,'mastered');
 assert.deepEqual(doc.checks,[true,false,true,false,false]);
 assert.equal(doc.topic.length,180);
 assert.equal(doc.notes,'hello');
 assert.equal(doc.summary,'one line');
 assert.equal(N.hasContent(doc),true);
 assert.equal(N.hasContent(N.blank('voca-resume',1)),false);
 const invalid=N.clean({status:'injected',checks:['yes'],notes:null},'voca-resume',1);
 assert.equal(invalid.status,'new');
 assert.deepEqual(invalid.checks,[false,false,false,false,false]);
 assert.equal(invalid.notes,'');
 assert.throws(()=>N.key('a',31));
 assert.throws(()=>N.key('a',-1));
});
