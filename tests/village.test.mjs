import test from 'node:test';
import assert from 'node:assert/strict';
import '../app/src/main/assets/village-model.js';
const M=globalThis.VillageModel;
test('twelve named unique residents',()=>{assert.equal(M.people.length,12);assert.equal(new Set(M.people.map(p=>p.id)).size,12);assert.deepEqual(M.people.map(p=>p.name),['알렉스','엘리엇','하비','샘','세바스찬','셰인','헤일리','레아','마루','페니','애비게일','에밀리']);});
test('device clock phase boundaries',()=>{for(const [hour,phase] of [[0,'night'],[5,'night'],[6,'day'],[17,'day'],[18,'dusk'],[19,'dusk'],[20,'night'],[23,'night']])assert.equal(M.period(hour),phase);});
test('routes stay on connected walkways',()=>{for(let a=0;a<M.nodes.length;a++)for(let b=0;b<M.nodes.length;b++){const path=M.path(a,b);assert.equal(path.at(-1),b);for(let i=1;i<path.length;i++)assert.ok(M.edges[path[i-1]].includes(path[i]));}});
test('residents move, meet and resume after conversations',()=>{const ps=M.freshResidents(),initial=ps.map(p=>[p.x,p.y]);let meets=0;for(let i=0;i<2000;i++)M.tick(ps,.1,()=>meets++);assert.ok(meets>2);assert.ok(ps.some((p,i)=>p.x!==initial[i][0]||p.y!==initial[i][1]));for(const p of ps){assert.ok(p.x>=135&&p.x<=465);assert.ok(p.y>=220&&p.y<=405);assert.ok(Number.isFinite(p.x));}});
