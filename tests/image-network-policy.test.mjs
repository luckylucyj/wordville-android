import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const activity=readFileSync(new URL('../app/src/main/java/com/wordville/app/MainActivity.java',import.meta.url),'utf8');
const html=readFileSync(new URL('../app/src/main/assets/index.html',import.meta.url),'utf8');
const gallery=readFileSync(new URL('../app/src/main/assets/memory-gallery.js',import.meta.url),'utf8');
test('Android WebView explicitly allows external image search APIs and thumbnails',()=>{
 for(const host of ['api.openverse.org','pixabay.com','cdn.pixabay.com','api.unsplash.com','images.unsplash.com','api.pexels.com','images.pexels.com']){
  assert.ok(activity.includes('"'+host+'".equals(url.getHost())'),host);
  assert.ok(html.includes('https://'+host),host+' content-security-policy');
 }
 assert.ok(activity.includes('"www.google.com".equals(host)'));
 assert.ok(activity.includes('if(!known&&!request.hasGesture())return true'));
 assert.ok(!/id="wv-memory-google-link"[^>]*target="_blank"/.test(html));
 assert.ok(gallery.includes('function openverseResults('));
});
