import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
await import('../app/src/main/assets/village-model.js');
await import('../app/src/main/assets/wordville-board-art.js');
const M=globalThis.VillageModel,B=globalThis.WordvilleBoard;
test('three-state transparent atlas matches 128×128 frames and exactly 384×128 pixels',()=>{
 const img=readFileSync(new URL('../app/src/main/assets/wordville-board-atlas.png',import.meta.url));
 assert.deepEqual([...img.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(img.readUInt32BE(16),384);assert.equal(img.readUInt32BE(20),128);
 assert.equal(M.bulletin.sprite.frames,3);
 assert.equal(M.bulletin.sprite.frameWidth,128);
 assert.equal(M.bulletin.sprite.frameHeight,128);
 assert.equal(B.src,'wordville-board-atlas.png');
});
test('board exports 1:1 placement between 600×800 and 1200×1600 world coordinates',()=>{
 const b=M.bulletin,u=b.worldX2;
 assert.deepEqual([u.x,u.y,u.width,u.height,u.anchorY],
  [b.x*2,b.y*2,b.width*2,b.height*2,b.anchorY*2]);
 assert.ok(b.x>=395&&b.x+b.width<=490,'board is right-of-square, before cafe and above bench');
 assert.ok(b.y+b.height===b.anchorY,'y-sort at visible foot');
 assert.ok(B.stateForCount(0)===0&&B.stateForCount(4)===1&&B.stateForCount(7)===2);
 assert.ok(B.stateForCount(1)===1&&B.stateForCount(5)===2);
});
test('only ground post rectangles block walking; roof remains completely non-collidable',()=>{
 assert.equal(M.bulletin.colliderFootRects.length,3);
 assert.equal(M.collidesDecoration(421,381,0),true,'left post');
 assert.equal(M.collidesDecoration(465,381,0),true,'right post');
 assert.equal(M.collidesDecoration(437,384,0),true,'ground rail');
 assert.equal(M.collidesDecoration(436,347,0),false,'board face not solid');
 assert.equal(M.collidesDecoration(430,333,0),false,'roof not solid');
 const relevant=M.nodes.filter(n=>n.x>=380&&n.x<=480&&n.y>=340&&n.y<=430);
 for(const n of relevant)assert.equal(M.collidesDecoration(n.x,n.y,M.FOOT_RADIUS),false,'NPC waypoint '+JSON.stringify(n));
});
test('touch trigger excludes roof and accepts front approach on board',()=>{
 assert.equal(B.hitTest(435,330),false,'canopy should not trigger');
 assert.equal(B.hitTest(435,358),true,'front face');
 assert.equal(B.hitTest(435,397),true,'floor approach');
 assert.equal(B.hitTest(300,450),false);
});
test('board painter sorts with NPC feet rather than permanently appearing behind everyone',()=>{
 const village=readFileSync(new URL('../app/src/main/assets/village.js',import.meta.url),'utf8');
 assert.ok(village.includes("y:M.bulletin?.anchorY??385"));
 const push=village.indexOf('if(boardDraw)drawables.push');
 const sort=village.indexOf('drawables.sort((a,b)=>a.y-b.y)');
 assert.ok(push>=0&&sort>push);
});
