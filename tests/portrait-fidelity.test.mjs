import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='../app/src/main/assets/portraits/';
test('original 1536x1152 portrait sheet is bit-for-bit identical to user supplied PNG',()=>{
 const file=new URL(root+'wordville-portraits-original.png',import.meta.url);
 assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),'0e70bab534788338dbc7e454a88205adb6019a3c39a7f212eba11ee073254219');
});
test('lossless transparent sprite sheet is bundled and remains nonempty',()=>{
 const file=new URL(root+'wordville-poses-hires.webp',import.meta.url);
 assert.ok(statSync(file).size>700000);
 const bytes=readFileSync(file);
 assert.equal(bytes.subarray(0,4).toString(),'RIFF');
 assert.equal(bytes.subarray(8,12).toString(),'WEBP');
});
