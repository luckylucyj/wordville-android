import test from 'node:test';import assert from 'node:assert/strict';
globalThis.Image=class{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}addEventListener(){}};
await import('../app/src/main/assets/walk-loader.js');
const W=globalThis.WordvilleWalk;
test('both pets have independent 4-direction 4-frame sprite sheets',()=>{
 assert.ok(W.petSheets.cat.src.endsWith('pets/wordville-cat-source.png'));
 assert.ok(W.petSheets.dog.src.endsWith('pets/wordville-dog-source.png'));
 for(let i=0;i<16;i++)assert.equal(W.petFrame({walkDistance:i*3.5},true),i%4);
 assert.equal(W.petFrame({walkDistance:100},false),0);
});
test('unloaded pets and unknown IDs do not claim successful rendering',()=>{
 assert.equal(W.paintPet({}, {id:'other'},0,0),false);
 assert.equal(W.paintPet({}, {id:'cat'},0,0),false);
});
