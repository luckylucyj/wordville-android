import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
await import('../app/src/main/assets/wordville-map-navigation.js');
await import('../app/src/main/assets/wordville-international-trends.js');
await import('../app/src/main/assets/village-model.js');
const map=globalThis.WordvilleMapNavigation,trend=globalThis.WordvilleInternationalTrends,M=globalThis.VillageModel;
test('every interior camera supports zoom 1-3 and pan bounded to actual view',()=>{
 assert.deepEqual(map.constrained(360,294,1,-250,70),{zoom:1,x:0,y:0});
 const a=map.anchored({zoom:1,x:0,y:0},2,180,147,360,294);
 assert.deepEqual(a,{zoom:2,x:-180,y:-147});
 const b=map.constrained(360,294,2,-3000,3000);
 assert.deepEqual(b,{zoom:2,x:-360,y:0});
 assert.equal(map.anchored(a,1,180,147,360,294).x,0);
 assert.equal(map.anchored(a,1,180,147,360,294).y,0);
});
test('town cat and dog use long continuous collision-safe closed loops',()=>{
 const src=readFileSync(new URL('../app/src/main/assets/walk-loader.js',import.meta.url),'utf8');
 const match=src.match(/const petRoutes=Object\.freeze\(([\s\S]*?)\);/);
 assert.ok(match,'pet paths are declared');
 const routes=(new Function('return '+match[1]))();
 for(const [name,points] of Object.entries(routes)){
  assert.ok(points.length>=12,name);
  assert.deepEqual(points[0],points.at(-1));
  assert.ok(Math.max(...points.map(x=>x[0]))-Math.min(...points.map(x=>x[0]))>150,name+' horizontal range');
  assert.ok(Math.max(...points.map(x=>x[1]))-Math.min(...points.map(x=>x[1]))>180,name+' vertical range');
  for(let i=1;i<points.length;i++){
   const a={x:points[i-1][0],y:points[i-1][1]},b={x:points[i][0],y:points[i][1]};
   assert.equal(M.segmentHitsDecoration(a,b,8),false,name+' path segment '+i+' must avoid gardens and buildings');
  }
 }
});
test('Google News meme articles and Google Trends topics are distinct source types',()=>{
 const d='2026-11-20';
 const entry={title:'Internet meme explained',date:d,publishedAt:d+'T12:00:00Z',url:'https://news.google.com/articles/example',publisher:'Example'};
 const raw={schema:1,countryUpdatedAt:{US:d+'T12:00:00Z'},countries:{US:{[d]:[{title:'sports event',date:d,publishedAt:d+'T10:00:00Z'}]}},memeNews:{US:{[d]:[entry,{...entry,url:'javascript:bad',title:'unsafe'}]}}};
 const normal=trend.normalizeArchive(raw);
 assert.equal(trend.datedNews(normal,'US',d).length,1);
 assert.equal(trend.datedRows(normal,'US',d).length,1);
 assert.equal(trend.datedNews(normal,'US','2026-11-19').length,0);
 assert.equal(trend.filterRows(trend.datedNews(normal,'US',d),'internet').length,1);
 assert.equal(trend.filterRows(trend.datedNews(normal,'US',d),'sports').length,0);
 assert.equal(trend.googleSearchUrl('US','Hello meme','trends',d).includes('q=Hello+meme'),true);
 assert.equal(trend.googleSearchUrl('GB','viral','memes',d).startsWith('https://news.google.com/search?'),true);
});
test('language labels for weather are rebuilt explicitly rather than left in Korean',()=>{
 const src=readFileSync(new URL('../app/src/main/assets/pixel-map-style.js',import.meta.url),'utf8');
 assert.ok(src.includes('refreshWeatherLabels'));
 for(const key of ['en:',"'zh-CN':",'ja:'])assert.ok(src.includes(key));
 const html=readFileSync(new URL('../app/src/main/assets/index.html',import.meta.url),'utf8');
 assert.ok(html.includes('wordville-map-navigation.js'));
});
