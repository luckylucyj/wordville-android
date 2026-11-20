/* Remade 3-head-tall native-128px resident animations (walk, idle, talk, sit, write).
 * Assets: residents128/<id>/{walk,idle,talk,sit,write}.png (1536x1024 = 12 frames x 8 directions @ 128x128).
 * Unmigrated residents fall back cleanly to the previous 48px/64px renderer.
 */
(function(root){'use strict';
const W=root.WordvilleWalk;if(!W)return;
const actions=['walk','idle','talk','sit','write'];
const directions=W.walk48Directions||['down','down-right','right','up-right','up','up-left','left','down-left'];
const ids=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily','toshiro','momo','homura','aizen','madoka'];
const sheets={};
for(const id of ids){
 sheets[id]={};
 for(const action of actions){
  const im=new Image();im.decoding='async';im.src='residents128/'+id+'/'+action+'.png';
  sheets[id][action]=im;
 }
}
const previousPaint=W.paint,frameCount=12,cell=128,groundY=120;
const state=new WeakMap();
const loaded=im=>Boolean(im&&im.complete&&im.naturalWidth===cell*frameCount&&im.naturalHeight===cell*directions.length);
const clock=ms=>Number.isFinite(ms)?ms:(root.performance?.now?.()??Date.now());
const has=id=>Boolean(id&&sheets[id]);
function selectAction(p,opts={}){
 if(opts.walking===true)return 'walk';
 return actions.includes(opts.action)&&opts.action!=='walk'?opts.action:'idle';
}
function frameFor(p,action,ms){
 if(action==='walk'){
  const d=p?.walkDistance;
  if(Number.isFinite(d)){
   const stepDist=W.stepDistance||2.25;
   return Math.floor((Math.max(0,d)+1e-6)/(stepDist*2/3))%frameCount;
  }
  const time=clock(ms);
  return Math.floor(Math.max(0,time)/83)%frameCount;
 }
 const time=clock(ms);
 const stepMs=action==='idle'?200:(action==='write'?140:(action==='talk'?110:100));
 if(!p||typeof p!=='object')return action==='sit'?frameCount-1:Math.floor(Math.max(0,time)/stepMs)%frameCount;
 const current=state.get(p);
 if(!current||current.action!==action){
  state.set(p,{action,startedAt:time});return 0;
 }
 const elapsedFrames=Math.max(0,Math.floor((time-current.startedAt)/stepMs));
 return action==='sit'?Math.min(frameCount-1,elapsedFrames):elapsedFrames%frameCount;
}
function cellFor(action,direction,phase){
 if(!actions.includes(action)||!directions.includes(direction)||!Number.isInteger(phase)||phase<0||phase>=frameCount)return null;
 return {x:phase*cell,y:directions.indexOf(direction)*cell,width:cell,height:cell,anchorX:cell/2,anchorY:groundY};
}
function paint(ctx,p,x,y,opts={}){
 const id=p?.id||p;
 if(!has(id))return previousPaint(ctx,p,x,y,opts);
 const action=selectAction(p,opts);
 const img=sheets[id][action];
 if(!loaded(img))return previousPaint(ctx,p,x,y,opts);
 if(action==='walk'&&p&&typeof p==='object')state.delete(p);
 const direction=W.directionForSprite?W.directionForSprite(p,action==='walk'):(p?.direction||'down');
 const phase=Number.isInteger(opts.phase)?((opts.phase%frameCount)+frameCount)%frameCount:frameFor(p,action,opts.timestampMs);
 const source=cellFor(action,direction,phase);
 const width=Math.round(opts.width||64),height=Math.round(opts.height||64);
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#26343838';ctx.beginPath();ctx.ellipse(Math.round(x),Math.round(y+1),Math.round(width*.21),2,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(img,source.x,source.y,cell,cell,Math.round(x-width/2),Math.round(y-groundY*height/cell),width,height);
 ctx.restore();return true;
}
W.paint=paint;
root.WordvilleResidents128={ids,actions,directions,sheets,cell,groundY,frameCount,has,cellFor,frameFor,selectAction,paint,loaded};
})(globalThis);
