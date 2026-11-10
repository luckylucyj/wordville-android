(function(root){
'use strict';
const P=root.VillageModel.people,F=root.VillageFacilities.facilities,D=root.VillageLifeData;
const nodes=[],edges=[],places=[];function node(x,y){nodes.push({x,y});edges.push([]);return nodes.length-1;}function link(a,b){edges[a].push(b);edges[b].push(a);}
for(let row=0;row<7;row++){const road=[];for(const x of [18,86,226,366,506,582])road.push(node(x,100+row*118));for(let i=1;i<road.length;i++)link(road[i-1],road[i]);if(row){link(road[0],road[0]-10);link(road[5],road[5]-10);}for(let col=0;col<4;col++){const door=node(86+col*140,80+row*118);link(road[col+1],door);const index=row*4+col;let p;if(index<13){const f=F[index];p={id:f.id,name:f.name,color:f.color,kind:'facility'};}else if(index>=16){const person=P[index-16];p={id:'home:'+person.id,name:person.name+'의 집',color:root.VillageHomes.get(person.id).roof,kind:'home',owner:person.id};}if(p)places.push({...p,node:door,x:36+col*140,y:27+row*118,w:100,h:53});}}
const byId=id=>places.find(p=>p.id===id);
function path(a,b){const q=[[a]],seen=new Set([a]);for(let i=0;i<q.length;i++){const route=q[i],last=route.at(-1);if(last===b)return route;for(const next of edges[last])if(!seen.has(next)){seen.add(next);q.push([...route,next]);}}return [];}
function scheduled(id,hour,round=0){if(hour>=22||hour<6)return 'home:'+id;const prefs=D.preferences[id];return prefs[(Math.floor((hour-6)/4)+round)%prefs.length];}
function create(hour=new Date().getHours()){return {hour,time:0,social:0,events:[],residents:P.map((p,i)=>{const place=scheduled(p.id,hour),n=nodes[byId(place).node];return {id:p.id,place,destination:place,stage:'inside',node:byId(place).node,x:n.x,y:n.y,route:[],dwell:18+i*2,round:0,activity:i%3};})};}
function note(s,type,data){s.events.unshift({type,time:s.time,...data});s.events.length=Math.min(40,s.events.length);}
function depart(s,p,dest){const place=byId(dest);if(!place)return false;p.destination=dest;if(p.stage==='walking'&&p.route.length){const next=p.route[0];p.route=[next,...path(next,place.node).slice(1)];}else{p.route=path(p.node,place.node).slice(1);}if(!p.route.length){p.stage='inside';p.place=dest;p.dwell=25;return true;}p.stage='walking';note(s,'depart',{id:p.id,place:dest});return true;}
function invite(s,id,dest){const p=s.residents.find(p=>p.id===id);return p?depart(s,p,dest):false;}
function occupants(s,id){return s.residents.filter(p=>p.stage==='inside'&&p.place===id);}
function exchange(place,a,b,index=0){if(place.startsWith('home:')){const h=root.VillageHomes.get(place.slice(5));return {a,b,first:h.greeting,second:D.voices[b]?.[0]||'편하게 이야기하자.',english:h.english,korean:h.korean};}const line=D.lines[place][index%D.lines[place].length];return {a,b,first:line[0]+' '+D.voices[a][0],second:line[1]+' '+(D.voices[b]?.[1]||D.voices[a][1]),english:line[2],korean:line[3]};}
function tick(s,dt,hour=s.hour){dt=Math.max(0,Math.min(.25,Number.isFinite(dt)?dt:0));s.time+=dt;
if(hour!==s.hour){s.hour=hour;for(const p of s.residents)depart(s,p,scheduled(p.id,hour,p.round));}
for(const p of s.residents){if(p.stage==='inside'){p.dwell-=dt;if(p.dwell<=0){p.round++;const next=scheduled(p.id,s.hour,p.round);if(next===p.place){p.dwell=25;p.activity=(p.activity+1)%3;}else depart(s,p,next);}continue;}
const n=nodes[p.route[0]];if(!n)continue;const dx=n.x-p.x,dy=n.y-p.y,d=Math.hypot(dx,dy),step=60*dt;if(d<=step){p.x=n.x;p.y=n.y;p.node=p.route.shift();if(!p.route.length){p.stage='inside';p.place=p.destination;p.dwell=26+(p.round%3)*5;p.activity=(p.activity+1)%3;note(s,'arrive',{id:p.id,place:p.place});}}else{p.x+=dx/d*step;p.y+=dy/d*step;}}
s.social+=dt;if(s.social>=8){s.social=0;for(const place of places){const ps=occupants(s,place.id);if(ps.length>1){const index=Math.floor(s.time/8),a=ps[index%ps.length],b=ps[(index+1)%ps.length];note(s,'chat',{place:place.id,...exchange(place.id,a.id,b.id,index)});}}}return s;}
root.VillageLife={places,nodes,edges,byId,path,scheduled,create,invite,occupants,exchange,tick};
})(globalThis);
