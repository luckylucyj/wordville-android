import test from 'node:test';
import assert from 'node:assert/strict';
await import('../app/src/main/assets/wordville-international-trends.js');
const T=globalThis.WordvilleInternationalTrends;
const day='2026-11-20';
const archive=T.normalizeArchive({schema:1,updatedAt:day+'T12:00:00Z',countryUpdatedAt:{US:day+'T12:00:00Z'},
 countries:{US:{[day]:[{title:'Friday meme',date:day,publishedAt:day+'T11:00:00Z',news:[]} ]}},
 memeNews:{US:{[day]:[{title:'New viral video reported',date:day,publishedAt:day+'T12:00:00Z',url:'https://news.example.org/story',publisher:'Example'}]}}});
test('Instagram search safely encodes text/hashtags and routes only to Instagram official domain',()=>{
 assert.equal(T.instagramSearchUrl(''), 'https://www.instagram.com/explore/');
 assert.equal(T.instagramSearchUrl('cat meme'), 'https://www.instagram.com/explore/search/keyword/?q=cat%20meme');
 assert.ok(T.instagramSearchUrl('#funny').endsWith('q=%23funny'));
 assert.ok(T.instagramSearchUrl('foo&bar').endsWith('q=foo%26bar'));
 assert.ok(T.instagramSearchUrl('치이카와').startsWith('https://www.instagram.com/'));
 assert.equal(new URL(T.instagramSearchUrl(' https://evil.example/?x=1 ')).hostname,'www.instagram.com');
});
test('Instagram discovery candidates are sourced, dated and never claim Instagram trend counts',()=>{
 const items=T.instagramTopics(archive,'US',day);
 assert.equal(items.length,2);
 assert.deepEqual(items.map(x=>x.source),['Google Trends','Google News']);
 assert.equal(items[1].date,day);
 assert.equal(items[1].url,'https://news.example.org/story');
 assert.deepEqual(T.instagramTopics(archive,'US','2026-11-19'),[]);
 assert.deepEqual(T.instagramTopics(archive,'GB',day),[]);
 assert.equal(T.filterRows(items,'viral').length,1);
 assert.ok(T.WORDS.instagramNote[1].includes('NOT Instagram popularity rankings'));
 assert.equal(T.WORDS.instagramTab.length,4);
});
