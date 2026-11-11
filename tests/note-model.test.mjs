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
 const doc=N.clean({status:'✓',hasStatus:true,checks:[true,false,true],notes:'hello',summary:'one line',topic:'t'.repeat(400)},'voca-resume',1);
 assert.equal(doc.status,'✓');
 assert.deepEqual(doc.checks,[true,false,true,false,false]);
 assert.equal(doc.topic.length,180);
 assert.equal(doc.notes,'hello');
 assert.equal(doc.summary,'one line');
 assert.equal(N.hasContent(doc),true);
 assert.equal(N.hasContent(N.blank('voca-resume',1)),false);
 const invalid=N.clean({status:'injected',checks:['yes'],notes:null},'voca-resume',1);
 assert.equal(invalid.status,'N');
 assert.deepEqual(invalid.checks,[false,false,false,false,false]);
 assert.equal(invalid.notes,'');
 assert.throws(()=>N.key('a',31));
 assert.throws(()=>N.key('a',-1));
});

test('seven one-character statuses have distinct codes and directly observable meanings',()=>{
 assert.deepEqual(N.STATUSES.map(s=>s.id),['N','R','F','X','U','C','✓']);
 assert.equal(new Set(N.STATUSES.map(s=>s.color)).size,7);
 assert.equal(N.statusName('R'),'회상 안 됨');
 assert.equal(N.statusName('U'),'뜻을 이해 못함');
});
test('old learning status is not falsely treated as a diagnosed memory failure',()=>{
 const existing=N.clean({status:'learning',notes:'내가 쓴 필기',updatedAt:'2026-11-10T05:22:00.000Z'},'voca-resume',1);
 assert.equal(existing.status,'N');assert.equal(existing.legacyStatus,'learning');
 assert.equal(existing.hasStatus,true);assert.equal(existing.notes,'내가 쓴 필기');
 assert.equal(existing.statusChangedAt,'');
 assert.equal(N.clean({status:'mastered'},'voca-resume',1).status,'✓');
 assert.equal(N.clean({status:'review'},'voca-resume',1).status,'R');
});
test('count only manually marked entries in color distribution',()=>{
 const untouched=N.blank('a',1);
 const r=N.clean({status:'R',hasStatus:true},'b',1);
 const c=N.clean({status:'C',hasStatus:true},'c',1);
 assert.deepEqual(N.distribution([untouched,r,c]),{
  counts:{N:0,R:1,F:0,X:0,U:0,C:1,'✓':0},unmarked:1,total:3,marked:2
 });
});
