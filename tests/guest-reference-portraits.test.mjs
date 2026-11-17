import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../app/src/main/assets/',import.meta.url);
const text=path=>readFileSync(new URL(path,root),'utf8');
test('Standalone guest portraits use their individual assets',()=>{
 const js=text('portrait-ui.js'),css=text('stardew-ui.css');
 assert.match(js,/standalonePortraits=new Set\(\['momo','toshiro','aizen','madoka','homura'\]\)/);
 assert.match(css,/\.wv-momo-portrait\{--wv-portrait-image:url\('guest-residents\/momo-portrait\.jpg'\)/);
 const momo=readFileSync(new URL('guest-residents/momo-portrait.jpg',root));
 assert.equal(momo.subarray(0,3).toString('hex'),'ffd8ff');
 for(const id of ['toshiro','aizen','madoka','homura']){
  assert.ok(css.includes(`.wv-${id}-portrait{--wv-portrait-image:url('guest-residents/${id}-portrait.webp')}`));
  const bytes=readFileSync(new URL(`guest-residents/${id}-portrait.webp`,root));
  assert.equal(bytes.toString('ascii',8,16),'WEBPVP8L');
 }
 assert.match(js,/guest%5\*25/); // Other guest portraits are preserved.
});
