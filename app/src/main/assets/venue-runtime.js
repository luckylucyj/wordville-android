/* Real tile-based venue navigation: NPCs and the selected resident use the same
 * fixture collision map. Collision visualization can be toggled for inspection.
 * Background reference images are visual guides, not pixel-derived geometry.
 */
(function(root){'use strict';
const spec=root.WordvilleVenueSpec,walk=root.WordvilleWalk,places=root.WordvillePlaces;
const canvas=document.getElementById('wv-place-canvas');if(!canvas||!spec||!places)return;
const stage=canvas.parentElement;stage.style.position='relative';
const overlay=document.createElement('canvas');overlay.width=canvas.width;overlay.height=canvas.height;
overlay.id='wv-venue-actors';overlay.setAttribute('aria-hidden','true');
Object.assign(overlay.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',imageRendering:'pixelated',zIndex:'2'});
stage.append(overlay);
const ctx=overlay.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=false;
canvas.tabIndex=0;canvas.setAttribute('aria-label','장소 안에서 이동하기. 원하는 곳을 터치하거나 화살표 키를 누르세요.');
const toggle=document.createElement('button');toggle.type='button';toggle.textContent='충돌 영역';toggle.setAttribute('aria-pressed','false');
toggle.setAttribute('aria-label','가구와 벽의 충돌 영역 표시');Object.assign(toggle.style,{position:'absolute',right:'8px',top:'8px',zIndex:'3',fontSize:'11px',padding:'5px 7px',background:'#f3e4bc',color:'#563920',border:'2px solid #8c6a43'});
stage.append(toggle);let showCollision=false;
toggle.addEventListener('click',()=>{showCollision=!showCollision;toggle.setAttribute('aria-pressed',String(showCollision));});
// Walk through the actual exit tile before returning to the village.
const exitButton=document.createElement('button');
exitButton.id='wv-venue-exit';exitButton.type='button';exitButton.textContent='🚪 마을로 나가기';
exitButton.setAttribute('aria-label','출입구까지 걸어서 마을로 돌아가기');
Object.assign(exitButton.style,{position:'absolute',right:'8px',bottom:'8px',zIndex:'3',fontSize:'11px',padding:'5px 7px',background:'#f3e4bc',color:'#563920',border:'2px solid #8c6a43'});
stage.append(exitButton);
const notice=document.createElement('div');notice.id='wv-venue-movement-status';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.hidden=true;
Object.assign(notice.style,{position:'absolute',bottom:'5px',left:'8px',right:'133px',zIndex:'3',pointerEvents:'none',background:'#fff1dce8',color:'#4c3426',fontSize:'12px',padding:'5px',borderRadius:'3px'});
stage.append(notice);
const announce=message=>{notice.textContent=message;notice.hidden=!message;};
const people=root.VillageModel?.people||[];
function person(id){return people.find(p=>p.id===id)||{id,name:id,shirt:'#765ca6',hair:'#443452'};}
const occupiedExcept=a=>actors.filter(b=>b!==a).map(b=>({x:Math.round(b.x),y:Math.round(b.y)}));
let actors=[],scene='',last=0;
function reset(){
 scene=places.active;const s=spec.forPlace(scene),p=places.places.find(x=>x.id===scene);
 const roster=[...(p?.people||[])];
 if(['burger','bookstore','park','square','cafe'].includes(scene))roster.push('cat','dog');
 const spots=[[.12,.80],[.84,.81],[.19,.89],[.78,.87]];
 actors=[];announce('');
 for(let i=0;i<Math.min(4,roster.length);i++){
  const target=spots[i],q=spec.nearest(scene,Math.floor(target[0]*s.cols),Math.floor(target[1]*s.rows),actors);
  if(!q)continue;
  actors.push({...person(roster[i]),id:roster[i],x:q.x,y:q.y,route:[],target:null,steps:0,walkDistance:0,direction:'down',next:1+i*1.2,wait:0,player:i===0});
 }
}
function moveTo(a,x,y){
 if(!a||!scene)return false;
 const occupied=occupiedExcept(a),start={x:Math.round(a.x),y:Math.round(a.y)};
 const dest=spec.nearest(scene,Math.round(x),Math.round(y),occupied);
 if(!dest)return false;
 if(dest.x===start.x&&dest.y===start.y){a.route=[];a.target=dest;return true;}
 let path=spec.route(scene,start,dest,occupied);
 // A moving resident may temporarily block the only corridor. Try that route,
 // but do not ever walk through another resident: update() still blocks overlap.
 if(!path.length)path=spec.route(scene,start,dest);
 if(!path.length)return false;
 a.target=dest;a.route=path;a.wait=0;return true;
}
exitButton.addEventListener('click',()=>{
 if(!actors.length||!scene)return;
 const door=spec.getMap(scene).door;
 announce(moveTo(actors[0],door.x,door.y)?'출입구까지 걸어갑니다.':'출입구로 이동할 수 없습니다.');
});
function update(dt){
 for(const a of actors){
  const step=a.route[0];
  if(!step){
   if(!a.player){a.next-=dt;if(a.next<=0){
     const s=spec.forPlace(scene),goal=spec.nearest(scene,2+Math.floor(Math.random()*(s.cols-4)),2+Math.floor(Math.random()*(s.rows-4)),occupiedExcept(a));
     if(goal)moveTo(a,goal.x,goal.y);a.next=2+Math.random()*4;
   }}
   continue;
  }
  const dx=step.x-a.x,dy=step.y-a.y,d=Math.hypot(dx,dy);
  if(d<.035){a.x=step.x;a.y=step.y;a.route.shift();a.wait=0;
   if(a.player&&!a.route.length&&a.target&&a.target.x===a.x&&a.target.y===a.y){
    if(spec.tile(scene,a.x,a.y)==='exit'){
     announce('마을로 돌아갑니다.');
     root.WordvilleShell?.activate('town');
    }else announce('목적지에 도착했습니다.');
   }
   continue;
  }
  a.direction=Math.abs(dx)>=Math.abs(dy)?(dx>=0?'right':'left'):(dy>=0?'down':'up');
  const delta=Math.min(d,2.1*dt),nx=a.x+(dx/d)*delta,ny=a.y+(dy/d)*delta;
  if(actors.some(b=>b!==a&&Math.hypot(b.x-nx,b.y-ny)<1.1)){
   a.wait+=dt;
   if(a.wait>.45&&a.target){
    const alternative=spec.route(scene,{x:Math.round(a.x),y:Math.round(a.y)},a.target,occupiedExcept(a));
    if(alternative.length)a.route=alternative;
    a.wait=0;
   }
   continue;
  }
  a.wait=0;a.walkDistance+=Math.hypot(nx-a.x,ny-a.y)*8.5;a.x=nx;a.y=ny;a.steps+=dt;
 }
}
function pixelCreature(a,x,y,scale){ctx.fillStyle=a.id==='cat'?'#db9b62':'#ead4af';
 ctx.fillRect(Math.round(x-scale*.25),Math.round(y-scale*.4),Math.round(scale*.5),Math.round(scale*.3));
 ctx.fillRect(Math.round(x-scale*.15),Math.round(y-scale*.6),Math.round(scale*.28),Math.round(scale*.25));
 ctx.fillStyle='#4d403d';ctx.fillRect(Math.round(x),Math.round(y-scale*.5),2,2);
}
function draw(){
 const s=spec.forPlace(scene);ctx.clearRect(0,0,overlay.width,overlay.height);
 if(showCollision){
  const m=spec.getMap(scene),tw=overlay.width/m.cols,th=overlay.height/m.rows;
  ctx.save();ctx.fillStyle='#9e2e2780';ctx.strokeStyle='#f9d87a';ctx.lineWidth=.7;
  for(const f of m.fixtures){ctx.fillRect(f.x*tw,f.y*th,f.w*tw,f.h*th);ctx.strokeRect(f.x*tw,f.y*th,f.w*tw,f.h*th);}
  ctx.fillStyle='#f8d447bb';ctx.fillRect(m.door.x*tw,m.door.y*th,tw,th);ctx.restore();
 }
 for(const a of [...actors].sort((a,b)=>a.y-b.y)){
  const x=Math.round((a.x+.5)/s.cols*overlay.width),y=Math.round((a.y+.5)/s.rows*overlay.height),moving=a.route.length>0;
  const height=32,width=32;
  if(!walk?.paint(ctx,a,x,y,{height,width,walking:moving})){
   if(a.id==='cat'||a.id==='dog')pixelCreature(a,x,y,Math.min(28,height));
   else{ctx.fillStyle=a.shirt||'#675f9a';ctx.fillRect(x-6,y-20,12,16);ctx.fillStyle=a.hair||'#4a3542';ctx.fillRect(x-7,y-30,14,11);ctx.fillStyle='#e9bca0';ctx.fillRect(x-5,y-24,10,8);}
  }
 }
 const p=actors[0];if(p){const x=Math.round((p.x+.5)/s.cols*overlay.width),y=Math.round((p.y+.5)/s.rows*overlay.height);
  ctx.strokeStyle='#f7de87';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,9,4,0,0,Math.PI*2);ctx.stroke();
 }
}
canvas.addEventListener('click',e=>{
 if(document.getElementById('wv-places-view')?.hidden||!actors.length)return;
 const rect=canvas.getBoundingClientRect(),s=spec.forPlace(scene);
 const x=Math.max(0,Math.min(s.cols-1,Math.floor((e.clientX-rect.left)/rect.width*s.cols)));
 const y=Math.max(0,Math.min(s.rows-1,Math.floor((e.clientY-rect.top)/rect.height*s.rows)));
 const fixture=spec.getMap(scene).fixtures.find(f=>x>=f.x&&x<f.x+f.w&&y>=f.y&&y<f.y+f.h);
 if(fixture){
  const q=spec.adjacentSpot(scene,fixture,actors[0],occupiedExcept(actors[0]));
  announce(q&&moveTo(actors[0],q.x,q.y)?fixture.label+' 근처로 이동합니다.':'이 가구에는 접근할 수 없습니다.');
 }else{
  announce(moveTo(actors[0],x,y)?'선택한 위치로 이동합니다.':'이 위치로 이동할 수 없습니다.');
 }
});
canvas.addEventListener('keydown',e=>{
 const dir={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];
 if(!dir||document.getElementById('wv-places-view')?.hidden||!actors.length)return;
 e.preventDefault();const p=actors[0],pos=p.target&&p.route.length?p.target:{x:Math.round(p.x),y:Math.round(p.y)};
 const x=pos.x+dir[0],y=pos.y+dir[1];
 if(!spec.isBlocked(scene,x,y)){if(!moveTo(p,x,y))announce('지금은 이동할 수 없습니다.');}
 else announce('벽이나 가구가 있어 이동할 수 없습니다.');
});
function frame(ms){
 const dt=last?Math.min((ms-last)/1000,.04):0;last=ms;
 if(places.active!==scene)reset();
 if(!document.hidden&&!document.getElementById('wv-places-view')?.hidden){update(dt);draw();}
 requestAnimationFrame(frame);
}
reset();requestAnimationFrame(frame);
root.WordvilleVenueRuntime={get actors(){return actors;},get scene(){return scene;},moveTo,get dimensions(){return spec.forPlace(scene);},get showCollision(){return showCollision;}};
})(globalThis);
