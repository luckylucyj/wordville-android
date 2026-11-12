/* Real tile-based venue navigation: NPCs and the selected resident use the same
 * fixture collision map. Collision visualization can be toggled for inspection.
 * Background reference images are visual guides, not pixel-derived geometry.
 */
(function(root){'use strict';
const spec=root.WordvilleVenueSpec,walk=root.WordvilleWalk,places=root.WordvillePlaces,schedule=root.WordvilleSchedule;
const clockMinute=()=>root.WordvilleVillage?.clockMinute??schedule.minuteNow();
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
const guestStatus=document.createElement('div');guestStatus.id='wv-venue-scheduled-guests';guestStatus.setAttribute('role','status');guestStatus.style.cssText='font-size:12px;line-height:1.6;padding:8px;color:#4c372b;background:#f6ead1;border:1px solid #a68b66;border-radius:8px;margin:8px 0';stage.after(guestStatus);

function person(id){return people.find(p=>p.id===id)||{id,name:id,shirt:'#765ca6',hair:'#443452'};}
const occupiedExcept=a=>actors.filter(b=>b!==a).map(b=>({x:Math.round(b.x),y:Math.round(b.y)}));
let actors=[],scene='',last=0,rosterKey='',focusedResidentId=null;
function scheduleRosterKey(){const m=clockMinute();return places.active+'|'+schedule.hourOf(m)+'|'+schedule.occupants(places.active,m).map(id=>id+':'+schedule.at(id,m).activity).join('|');}
function reset(){
 scene=places.active;
 rosterKey=scheduleRosterKey();
 const s=spec.forPlace(scene);
 const guests=schedule.occupants(scene,clockMinute());
 // The visitor is not a scheduled villager. Resident NPCs show up here ONLY
 // during their actual scheduled activity; no default always-present NPC.
 const prioritized=focusedResidentId&&guests.includes(focusedResidentId)?[focusedResidentId,...guests.filter(id=>id!==focusedResidentId)]:guests;
 const roster=['visitor',...prioritized];
 const spots=[[.12,.80],[.84,.81],[.19,.89],[.78,.87],[.38,.80],
              [.65,.78],[.30,.65],[.7,.65],[.47,.87],[.53,.65]];
 actors=[];announce('');
 for(let i=0;i<Math.min(spots.length,roster.length);i++){
  const id=roster[i],npc=id!=='visitor';
  const target=spots[i],q=spec.nearest(scene,Math.floor(target[0]*s.cols),
    Math.floor(target[1]*s.rows),actors);
  if(!q)continue;
  const slot=npc?schedule.at(id,clockMinute()):null;
  actors.push({...person(id),id,x:q.x,y:q.y,route:[],target:null,steps:0,
   walkDistance:0,direction:'down',facing:'down',movementDirection:'down',
   facingStep:null,isMoving:false,wait:0,player:!npc,
   schedulePlace:scene,activity:slot?.activity||'장소 방문',activityState:npc?'travel':'visiting'});
 }
 for(const a of actors){
  if(!a.player)walkToActivity(a);
 }
 const when=schedule.formatHour(schedule.hourOf(clockMinute()));
 guestStatus.textContent=when+' 이 장소에 있는 주민: '+(guests.length?
  guests.map(id=>{const p=person(id);return p.name+' · '+schedule.at(id,clockMinute()).activity;}).join(' / '):
  '현재 예약된 활동이 없습니다.');
}
function walkToActivity(a){
 const m=spec.getMap(scene),fx=m.fixtures;
 // Route to a fixture suited to the resident's concrete scheduled action.
 const typePref={
  library:['shelf','table'],bookstore:['shelf','table'],cafe:['table','counter'],
  burger:['table','counter'],icecream:['table','counter'],pub:['table','counter'],
  clinic:['bed','counter'],gym:['equipment','bench'],pool:['water','bench'],
  ranch:['hay','stable'],workshop:['table','shelf'],studio:['equipment','table'],
  museum:['exhibit','bench'],greenhouse:['planter','table'],market:['stall','counter'],
  square:['bench'],park:['bench']
 };
 const prefs=typePref[scene]||[];
 const byActivity=(a.activity.includes('정리')||a.activity.includes('장비')||a.activity.includes('수리'))?
  ['counter','shelf','table','equipment',...prefs]:prefs;
 let goal=null;
 for(const kind of byActivity){
  for(const fixture of fx.filter(item=>item.kind===kind)){
   goal=spec.adjacentSpot(scene,fixture,{x:a.x,y:a.y},occupiedExcept(a));
   if(goal)break;
  }
  if(goal)break;
 }
 if(goal&&moveTo(a,goal.x,goal.y))a.activityState='travel';
 else a.activityState='doing';
}
function moveTo(a,x,y){
 if(!a||!scene)return false;
 const occupied=occupiedExcept(a),start={x:Math.round(a.x),y:Math.round(a.y)};
 const dest=spec.nearest(scene,Math.round(x),Math.round(y),occupied);
 if(!dest)return false;
 if(dest.x===start.x&&dest.y===start.y){a.route=[];a.target=dest;a.isMoving=false;a.facingStep=null;return true;}
 let path=spec.route(scene,start,dest,occupied);
 // A moving resident may temporarily block the only corridor. Try that route,
 // but do not ever walk through another resident: update() still blocks overlap.
 if(!path.length)path=spec.route(scene,start,dest);
 if(!path.length)return false;
 a.target=dest;a.route=path;a.wait=0;a.isMoving=false;a.facingStep=null;return true;
}
exitButton.addEventListener('click',()=>{
 if(!actors.length||!scene)return;
 const door=spec.getMap(scene).door;
 announce(moveTo(actors[0],door.x,door.y)?'출입구까지 걸어갑니다.':'출입구로 이동할 수 없습니다.');
});
function update(dt){
 for(const a of actors){
  a.isMoving=false;
  const step=a.route[0];
  if(!step){
   if(!a.player)a.activityState='doing';
   continue;
  }
  const dx=step.x-a.x,dy=step.y-a.y,d=Math.hypot(dx,dy);
  if(d<.035){a.x=step.x;a.y=step.y;a.route.shift();a.wait=0;a.facingStep=null;
   if(!a.route.length&&!a.player)a.activityState='doing';
   if(a.player&&!a.route.length&&a.target&&a.target.x===a.x&&a.target.y===a.y){
    if(spec.tile(scene,a.x,a.y)==='exit'){
     announce('마을로 돌아갑니다.');
     root.WordvilleShell?.activate('town');
    }else announce('목적지에 도착했습니다.');
   }
   continue;
  }
  const delta=Math.min(d,2.1*dt),nx=a.x+(dx/d)*delta,ny=a.y+(dy/d)*delta;
  if(delta<=0)continue;
  if(actors.some(b=>b!==a&&Math.hypot(b.x-nx,b.y-ny)<1.1)){
   a.wait+=dt;
   if(a.wait>.45&&a.target){
    const alternative=spec.route(scene,{x:Math.round(a.x),y:Math.round(a.y)},a.target,occupiedExcept(a));
    if(alternative.length){a.route=alternative;a.facingStep=null;}
    a.wait=0;
   }
   continue;
  }
  // Only turn if the actor actually moved. Hold direction through the
  // current tile leg, across all six walk-animation frames.
  const segment=step.x+','+step.y;
  if(a.facingStep!==segment){
   a.direction=root.VillageModel?.directionFromDelta(dx,dy,a.direction) || a.direction;
   a.facing=a.movementDirection=a.direction;a.walkDistance=0;
   a.facingStep=segment;
  }
  a.isMoving=true;a.wait=0;
  a.walkDistance+=Math.hypot(nx-a.x,ny-a.y)*8.5;a.x=nx;a.y=ny;a.steps+=dt;
 }
}
function focusResident(id){
 const guests=schedule.occupants(places.active,clockMinute());
 if(!guests.includes(id))return false;
 focusedResidentId=id;reset();
 return actors.some(a=>a.id===id);
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
  const x=Math.round((a.x+.5)/s.cols*overlay.width),y=Math.round((a.y+.5)/s.rows*overlay.height),moving=a.isMoving===true;
  const height=(a.id==='cat'||a.id==='dog')?32:48,width=height;
  if(!walk?.paint(ctx,a,x,y,{height,width,walking:moving})){
   if(a.id==='cat'||a.id==='dog')pixelCreature(a,x,y,Math.min(28,height));
   else{ctx.fillStyle=a.shirt||'#675f9a';ctx.fillRect(x-6,y-20,12,16);ctx.fillStyle=a.hair||'#4a3542';ctx.fillRect(x-7,y-30,14,11);ctx.fillStyle='#e9bca0';ctx.fillRect(x-5,y-24,10,8);}
  }
  if(a.id===focusedResidentId){
   ctx.strokeStyle='#ffdf67';ctx.lineWidth=2;
   ctx.beginPath();ctx.ellipse(x,y+2,12,4,0,0,Math.PI*2);ctx.stroke();
   ctx.font='bold 10px sans-serif';ctx.textAlign='center';
   ctx.fillStyle='#fff3c9';ctx.fillRect(x-35,y-height-30,70,14);
   ctx.fillStyle='#59412e';ctx.fillText('현재 위치',x,y-height-20);
  }
  if(!a.player&&!moving&&a.activityState==='doing'){
   ctx.fillStyle='#fff6dfed';
   const label=a.activity.length>11?a.activity.slice(0,11)+'…':a.activity;
   ctx.font='bold 10px sans-serif';ctx.textAlign='center';
   const w=Math.min(145,Math.max(55,ctx.measureText(label).width+12));
   ctx.fillRect(x-w/2,y-height-17,w,15);
   ctx.fillStyle='#523e2f';ctx.fillText(label,x,y-height-6);
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
 if(places.active!==scene||rosterKey!==scheduleRosterKey())reset();
 if(!document.hidden&&!document.getElementById('wv-places-view')?.hidden){update(dt);draw();}
 requestAnimationFrame(frame);
}
reset();requestAnimationFrame(frame);
root.WordvilleVenueRuntime={get actors(){return actors;},get scene(){return scene;},get focusedResident(){return focusedResidentId;},focusResident,moveTo,get dimensions(){return spec.forPlace(scene);},get showCollision(){return showCollision;}};
})(globalThis);
