import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base='../app/src/main/assets/portraits/';
const original=new URL(base+'wordville-portraits-original.png',import.meta.url);
const atlas=new URL(base+'wordville-walk-4phase.png',import.meta.url);
function dimensions(file){const b=readFileSync(file);assert.equal(b.subarray(1,4).toString(),'PNG');return [b.readUInt32BE(16),b.readUInt32BE(20)];}
test('original portrait matches supplied 1536x1152 image bytes',()=>{
 assert.deepEqual(dimensions(original),[1536,1152]);
 assert.equal(createHash('sha256').update(readFileSync(original)).digest('hex'),'0e70bab534788338dbc7e454a88205adb6019a3c39a7f212eba11ee073254219');
});
test('clean walking atlas has 12 residents in four 160x256 pose slots',()=>{
 assert.deepEqual(dimensions(atlas),[2560,768]);assert.ok(statSync(atlas).size>900000);
});
