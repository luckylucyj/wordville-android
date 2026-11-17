import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../app/src/main/assets/',import.meta.url);
const text=path=>readFileSync(new URL(path,root),'utf8');
test('Standalone guest portraits and the reference atlas use their assigned assets',()=>{
 const js=text('portrait-ui.js'),css=text('stardew-ui.css');
 assert.match(js,/standalonePortraits=new Set\(\['momo','toshiro','aizen'\]\)/);
 assert.match(css,/\.wv-momo-portrait\{--wv-portrait-image:url\('guest-residents\/momo-portrait\.jpg'\)/);
 const momo=readFileSync(new URL('guest-residents/momo-portrait.jpg',root));
 assert.equal(momo.subarray(0,3).toString('hex'),'ffd8ff');
 for(const id of ['toshiro','aizen']){
  assert.ok(css.includes(`.wv-${id}-portrait{--wv-portrait-image:url('guest-residents/${id}-portrait.webp')}`));
  const bytes=readFileSync(new URL(`guest-residents/${id}-portrait.webp`,root));
  assert.equal(bytes.toString('ascii',8,16),'WEBPVP8L');
 }
 assert.match(js,/referencePortraitSlots=Object\.freeze\(\{madoka:1,homura:2\}\)/);
 assert.match(js,/el\.classList\.add\('wv-reference-portrait'\)/);
 assert.match(js,/referencePortraitSlots\[id\]\*50/);
 assert.match(css,/guest-residents\/character-portraits\.webp/);
 assert.match(css,/background-size:300% 100%!important/);
 assert.match(js,/guest%5\*25/); // Other guest portraits are preserved.
});
test('generated resident portraits are a compact, valid 3-column WebP atlas',()=>{
 const bytes=readFileSync(new URL('guest-residents/character-portraits.webp',root));
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 assert.ok(bytes.length>4000&&bytes.length<60000);
});
