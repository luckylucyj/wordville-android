(function(root){
'use strict';
const people=[
 ['alex','알렉스','체육 공원','attend','#457f52','#5b3a2a'],['elliott','엘리엇','서점','application','#b66641','#9f5a35'],
 ['harvey','하비','진료소','appointment','#698e75','#533c2e'],['sam','샘','음악 카페','schedule','#e09345','#d6b84e'],
 ['sebastian','세바스찬','작업실','equipment','#565980','#292b41'],['shane','셰인','식료품점','shipment','#685c9a','#3a3446'],
 ['haley','헤일리','사진관','available','#dd8d92','#e2bf58'],['leah','레아','공방','purchase','#9a7352','#a55132'],
 ['maru','마루','연구실','maintenance','#7b8aa9','#663e39'],['penny','페니','도서관','deadline','#bc8951','#b96639'],
 ['abigail','애비게일','광장','reservation','#836aa1','#895995'],['emily','에밀리','재봉실','customer','#b96463','#4d74ab']
].map(([id,name,home,word,shirt,hair],i)=>({id,name,home,word,shirt,hair,skin:['#edbe98','#d19b78','#f0c8a2','#b9805e'][i%4]}));
// Only these connected walkways are navigable; buildings and gardens are excluded.
const nodes=[{x:300,y:380},{x:220,y:375},{x:380,y:385},{x:135,y:400},{x:465,y:400},{x:300,y:290},{x:220,y:290},{x:380,y:290},{x:300,y:225},{x:220,y:490},{x:380,y:490},{x:135,y:490},{x:465,y:490}];
const edges=[[1,2,5],[0,3,6,9],[0,4,7,10],[1,11],[2,12],[0,6,7,8],[1,5],[2,5],[5],[1,10,11],[2,9,12],[3,9],[4,10]];
function period(hour){return hour>=6&&hour<18?'day':hour>=18&&hour<20?'dusk':'night';}
function path(from,to){const q=[[from]],visited=new Set([from]);while(q.length){const p=q.shift(),last=p.at(-1);if(last===to)return p;for(const next of edges[last])if(!visited.has(next)){visited.add(next);q.push([...p,next]);}}return [from];}
function freshResidents(){return people.map((p,i)=>{const n=nodes[i%nodes.length];return {...p,x:n.x,y:n.y,node:i%nodes.length,route:[],wait:i*.7,chat:0,partner:null,steps:0};});}
function tick(residents,dt,onMeet){dt=Math.min(.1,Math.max(0,dt));for(const p of residents){if(p.chat>0){p.chat=Math.max(0,p.chat-dt);continue;}if(p.wait>0){p.wait-=dt;continue;}if(!p.route.length){const goal=(p.node+3+p.id.length)%nodes.length;p.route=path(p.node,goal).slice(1);p.wait=.4;continue;}const n=nodes[p.route[0]],dx=n.x-p.x,dy=n.y-p.y,d=Math.hypot(dx,dy),s=15*dt;if(d<=s){p.x=n.x;p.y=n.y;p.node=p.route.shift();p.wait=.3;}else{p.x+=dx/d*s;p.y+=dy/d*s;p.steps+=dt;}}
 for(let i=0;i<residents.length;i++){const a=residents[i];if(a.chat||a.cooldown>0)continue;for(let j=i+1;j<residents.length;j++){const b=residents[j];if(b.chat||b.cooldown>0)continue;if(Math.hypot(a.x-b.x,a.y-b.y)<15){a.chat=b.chat=4.5;a.cooldown=b.cooldown=18;a.partner=b.id;b.partner=a.id;onMeet?.(a,b);break;}}}for(const p of residents)p.cooldown=Math.max(0,(p.cooldown||0)-dt);
}
const api={people,nodes,edges,period,path,freshResidents,tick};root.VillageModel=api;
})(globalThis);