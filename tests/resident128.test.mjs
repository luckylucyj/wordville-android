import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

class FakeImage {
  constructor() {
    this.complete = false;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    this._src = '';
  }
  addEventListener() {}
  set src(value) {
    this._src = value;
    if (value.startsWith('residents128/')) {
      this.complete = true;
      this.naturalWidth = 1536;
      this.naturalHeight = 1024;
    } else if (value.startsWith('action64/')) {
      this.complete = true;
      this.naturalWidth = 512;
      this.naturalHeight = 512;
    }
  }
  get src() {
    return this._src;
  }
}

globalThis.Image = FakeImage;
await import('../app/src/main/assets/walk-loader.js');
await import('../app/src/main/assets/walk48-loader.js');
await import('../app/src/main/assets/alex64-loader.js');
const priorPaint = globalThis.WordvilleWalk.paint;
await import('../app/src/main/assets/resident128-loader.js');

const R = globalThis.WordvilleResidents128;
const W = globalThis.WordvilleWalk;

const mockContext = () => {
  const calls = [];
  return {
    calls,
    save() {},
    restore() {},
    beginPath() {},
    ellipse() {},
    fill() {},
    drawImage(...args) {
      calls.push(args);
    },
  };
};

test('Migrated residents have 128px 8-direction x 12-frame PNG atlases', () => {
  assert.deepEqual(R.actions, ['walk', 'idle', 'talk', 'sit']);
  assert.equal(R.cell, 128);
  assert.equal(R.groundY, 120);
  assert.equal(R.frameCount, 12);
  for (const id of R.ids) {
    for (const action of R.actions) {
      const png = readFileSync(new URL(`../app/src/main/assets/residents128/${id}/${action}.png`, import.meta.url));
      assert.equal(png.subarray(1, 4).toString(), 'PNG');
      assert.equal(png.readUInt32BE(16), 1536);
      assert.equal(png.readUInt32BE(20), 1024);
    }
  }
});

test('Alex renders from 128px atlas with ground-anchored destination', () => {
  const ctx = mockContext();
  const p = { id: 'alex', direction: 'down', walkDistance: 0 };
  const ok = W.paint(ctx, p, 120, 240, { width: 64, height: 64, walking: false, action: 'talk', phase: 5 });
  assert.equal(ok, true);
  assert.equal(ctx.calls.length, 1);
  const [im, sx, sy, sw, sh, x, y, w, h] = ctx.calls[0];
  assert.equal(im.src, 'residents128/alex/talk.png');
  assert.deepEqual([sx, sy, sw, sh, x, y, w, h], [5 * 128, 0, 128, 128, 88, 180, 64, 64]);
});

test('Sitting transitions across 12 frames and holds final frame', () => {
  const p = { id: 'alex', direction: 'right' };
  assert.equal(R.frameFor(p, 'sit', 1000), 0);
  assert.equal(R.frameFor(p, 'sit', 1100), 1);
  assert.equal(R.frameFor(p, 'sit', 2500), 11);
  assert.equal(R.frameFor(p, 'sit', 9000), 11);
});

test('Unmigrated villagers fall back cleanly to previous renderer', () => {
  const p = { id: 'visitor', direction: 'down' };
  const ctx = mockContext();
  assert.equal(
    W.paint(ctx, p, 10, 20, { width: 48, height: 48, walking: false }),
    priorPaint(ctx, p, 10, 20, { width: 48, height: 48, walking: false })
  );
  assert.equal(ctx.calls.length, 0);
});

// The four original 128px atlases were migrated from Wordville_Motion_Review.html.
test('Four guest residents render their own 128px 12-frame walk/idle/talk/sit sheets', () => {
 for(const id of ['momo','homura','aizen','madoka']){
  assert.ok(R.has(id),id+' is not registered with the high-resolution renderer');
  for(const action of R.actions){
   const png=readFileSync(new URL(`../app/src/main/assets/residents128/${id}/${action}.png`,import.meta.url));
   assert.equal(png.subarray(1,4).toString(),'PNG');
   assert.equal(png.readUInt32BE(16),1536);
   assert.equal(png.readUInt32BE(20),1024);
   const ctx=mockContext();
   assert.equal(W.paint(ctx,{id,direction:'down'},50,75,{width:64,height:64,walking:action==='walk',action,phase:3}),true);
   assert.equal(ctx.calls.length,1);
   assert.equal(ctx.calls[0][0].src,`residents128/${id}/${action}.png`);
   assert.deepEqual(ctx.calls[0].slice(1,5),[384,0,128,128]);
  }
 }
});
