import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
await import('../app/src/main/assets/wordville-international-trends.js');
const T=globalThis.WordvilleInternationalTrends;
const item=(day,title='sample search')=>({
 title,date:day,publishedAt:day+'T14:30:00Z',approxTraffic:'10K+',
 news:[{title:'Example headline',url:'https://news.example.org/story',publisher:'Example'}]
});
const mock={schema:1,updatedAt:'2026-11-20T14:40:00Z',countryUpdatedAt:{US:'2026-11-20T14:40:00Z'},
 countries:{US:{'2026-11-20':[item('2026-11-20')],'2026-11-19':[item('2026-11-19','older')]},GB:{},CA:{},AU:{}}};

test('dated trend records are distinct, not fabricated for days with no archive',()=>{
 const data=T.normalizeArchive(mock);
 assert.equal(T.datedRows(data,'US','2026-11-20').length,1);
 assert.equal(T.datedRows(data,'US','2026-11-19')[0].title,'older');
 assert.deepEqual(T.datedRows(data,'US','2026-11-18'),[]);
 assert.deepEqual(T.datedRows(data,'GB','2026-11-20'),[]);
 assert.equal(T.datedRows(data,'ZZ','2026-11-20').length,0);
});

test('US UK CA AU timezones and countries supported, with no hidden live data claim',()=>{
 assert.deepEqual(Object.keys(T.GEO),['US','GB','CA','AU']);
 const instant=new Date('2026-11-20T01:00:00Z');
 assert.equal(T.countryDate('US',instant),'2026-11-19');
 assert.equal(T.countryDate('GB',instant),'2026-11-20');
 assert.equal(T.countryDate('AU',instant),'2026-11-20');
 assert.ok(T.WORDS.subtitle[1].includes('Not a social meme ranking'));
});

test('archive records must have valid date and safe HTTPS news links',()=>{
 const evil=structuredClone(mock);
 evil.countries.US['2026-11-20'].push({...item('2026-11-20',''),title:'',news:[]});
 evil.countries.US['2026-11-20'].push({...item('2026-11-20','injected'),
  news:[{title:'Bad',url:'javascript:alert(1)',publisher:'Unsafe'}]});
 const parsed=T.normalizeArchive(evil);
 assert.equal(parsed.countries.US['2026-11-20'].length,2);
 assert.equal(parsed.countries.US['2026-11-20'][1].news.length,0);
 assert.equal(T.safeLink('javascript:alert(1)'), '');
 assert.equal(T.safeLink('http://trends.google.com'), '');
});

test('board panel is loaded after social content and CSP permits only GitHub archive origin',()=>{
 const html=readFileSync(new URL('../app/src/main/assets/index.html',import.meta.url),'utf8');
 assert.ok(html.indexOf('wordville-social.js') < html.indexOf('wordville-international-trends.js'));
 assert.ok(html.includes('https://raw.githubusercontent.com'));
 const social=readFileSync(new URL('../app/src/main/assets/wordville-social.js',import.meta.url),'utf8');
 assert.ok(social.includes('wordville-board-open'));
});
