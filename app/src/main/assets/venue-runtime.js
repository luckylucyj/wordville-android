/* Navigable character overlay; visual scenery is not treated as collision geometry. */
(function(root){'use strict';
const spec=root.WordvilleVenueSpec,walk=root.WordvilleWalk,places=root.WordvillePlaces;
const canvas=document.getElementById('wv-place-canvas');if(!canvas||!spec||!places)return;
const stage=canvas.parentElement;stage.style.position='relative';
const overlay=document.createElement('canvas');overlay.width=canvas.width;overlay.height=canvas.height;
overlay.id='wv-venue-actors';overlay.setAttribute('aria-hidden','true');
Object.assign(overlay.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',imageRendering:'pixelated',zIndex:'2'});
stage.append(overlay);
const ctx=overlay.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=false;
let actors=[],scene='',last=0,elapsed=0;
const names=root.VillageModel?.people||[];
function person(id){return names.find(p=>p.id===id)||{id,name:id,shirt:'#765ca6',hair:'#443452'};}
function safe(id,x,y){let bx=1,by=1,best=Infinity;const cfg=spec.forPlace(id);for(let cy=1;cy<cfg.rows-1;cy++)for(let cx=1;cx<cfg.cols-1;cx++){if(spec.isBlocked(id,cx,cy))continue;const d=Math.abs(cx-x)+Math.abs(cy-y);if(d<best){best=d;bx=cx;by=cy;}}return {x:bx,y:by};}
function reset(){scene=places.active;const s=spec.forPlace(scene),p=places.places.find(x=>x.id===scene);
 const roster=[...(p?.people||[])];if(['burger','bookstore','park','square','cafe'].includes(scene))roster.push('cat','dog');
 const spots=[[.12,.80],[.84,.81],[.19,.89],[.78,.87]];
 actors=roster.slice(0,4).map((id,i)=>{const q=safe(scene,Math.floor(spots[i][0]*s.cols),Math.floor(spots[i][1]*s.rows));return {...person(id),id,x:q.x,y:q.y,route:[],steps:0,direction:'down',next:1+i*1.2,player:i===0};});
}
function moveTo(a,x,y){const q=safe(scene,x,y);a.route=spec.route(scene,{x:Math.round(a.x),y:Math.round(a.y)},q);}
function update(dt){for(let i=0;i<actors.length;i++){const a=actors[i],step=a.route?.[0];
 if(!step){if(!a.player){a.next-=dt;if(a.next<=0){const s=spec.forPlace(scene),goal=safe(scene,2+Math.floor(Math.random()*(s.cols-4)),2+Math.floor(Math.random()*(s.rows-4)));moveTo(a,goal.x,goal.y);a.next=2+Math.random()*4;}}continue;}
 const dx=step.x-a.x,dy=step.y-a.y,d=Math.hypot(dx,dy);if(d<.035){a.x=step.x;a.y=step.y;a.route.shift();continue;}
 a.direction=Math.abs(dx)>=Math.abs(dy)?(dx>=0?'right':'left'):(dy>=0?'down':'up');
 const speed=2.1,delta=Math.min(d,speed*dt),nx=a.x+(dx/d)*delta,ny=a.y+(dy/d)*delta;
 if(actors.some(b=>b!==a&&Math.hypot(b.x-nx,b.y-ny)<1.1)){a.next=Math.max(a.next,.25);continue;}
 a.x=nx;a.y=ny;a.steps+=dt;
}}
function pixelCreature(a,x,y,scale){ctx.fillStyle=a.id==='cat'?'#db9b62':'#ead4af';
 ctx.fillRect(Math.round(x-scale*.25),Math.round(y-scale*.4),Math.round(scale*.5),Math.round(scale*.3));
 ctx.fillRect(Math.round(x-scale*.15),Math.round(y-scale*.6),Math.round(scale*.28),Math.round(scale*.25));
 ctx.fillStyle='#4d403d';ctx.fillRect(Math.round(x),Math.round(y-scale*.5),2,2);
}
function draw(){const s=spec.forPlace(scene);ctx.clearRect(0,0,overlay.width,overlay.height);
 for(const a of [...actors].sort((a,b)=>a.y-b.y)){const x=Math.round((a.x+.5)/s.cols*overlay.width),y=Math.round((a.y+.5)/s.rows*overlay.height),moving=a.route.length>0;
 const height=Math.round(Math.max(28,Math.min(60,overlay.height/s.rows*1.75))),width=Math.round(height*.68);
 if(!walk?.paint(ctx,a,x,y,{height,width,walking:moving})){
  if(a.id==='cat'||a.id==='dog')pixelCreature(a,x,y,Math.min(28,height));
  else {ctx.fillStyle=a.shirt||'#675f9a';ctx.fillRect(x-6,y-20,12,16);ctx.fillStyle=a.hair||'#4a3542';ctx.fillRect(x-7,y-30,14,11);ctx.fillStyle='#e9bca0';ctx.fillRect(x-5,y-24,10,8);}
 }
 }
 const a=actors[0];if(a){const x=Math.round((a.x+.5)/s.cols*overlay.width),y=Math.round((a.y+.5)/s.rows*overlay.height);ctx.strokeStyle='#f7de87';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,9,4,0,0,Math.PI*2);ctx.stroke();}
}
canvas.addEventListener('click',e=>{if(document.getElementById('wv-places-view')?.hidden)return;
 const box=canvas.getBoundingClientRect(),s=spec.forPlace(places.active),x=Math.floor((e.clientX-box.left)/box.width*s.cols),y=Math.floor((e.clientY-box.top)/box.height*s.rows);
 if(!actors.length||spec.isBlocked(places.active,x,y))return;moveTo(actors[0],x,y);
});
function frame(ms){const dt=last?Math.min((ms-last)/1000,.04):0;last=ms;
 if(places.active!==scene)reset();
 if(!document.hidden&&!document.getElementById('wv-places-view')?.hidden){elapsed+=dt;update(dt);draw();}
 requestAnimationFrame(frame);
}
reset();requestAnimationFrame(frame);
root.WordvilleVenueRuntime={get actors(){return actors;},get scene(){return scene;},moveTo,get dimensions(){return spec.forPlace(scene);}};
})(globalThis);
