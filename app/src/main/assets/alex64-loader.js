/* Non-jittering native-64px Alex animation pilot.
 * Source: imagegen hand-drawn whole-body frames in art-source/alex64.
 * Never alters the other eleven villagers' 48px assets or rendering.
 */
(function(root){'use strict';
const W=root.WordvilleWalk;if(!W)return;
const actions=['walk','idle','talk','sit'];
const directions=W.walk48Directions||['down','down-right','right','up-right','up','up-left','left','down-left'];
const sheets={};
for(const action of actions){
 const image=new Image();image.decoding='async';image.src='action64/alex_'+action+'.png';sheets[action]=image;
}
const previousPaint=W.paint,frameCount=8,cell=64,groundY=60;
const state=new WeakMap();
const loaded=im=>Boolean(im&&im.complete&&im.naturalWidth===512&&im.naturalHeight===512);
const clock=ms=>Number.isFinite(ms)?ms:(root.performance?.now?.()??Date.now());
function selectAction(p,opts={}){
 if(opts.walking===true)return 'walk';
 return actions.includes(opts.action)&&opts.action!=='walk'?opts.action:'idle';
}
function frameFor(p,action,ms){
 if(action==='walk')return W.frameFor(p,true,ms);
 const time=clock(ms);
 if(action==='idle')return Math.floor(Math.max(0,time)/350)%frameCount;
 if(action==='talk')return Math.floor(Math.max(0,time)/150)%frameCount;
 // Sitting is a transition (standing -> seated), not an endless stand/sit loop.
 if(!p||typeof p!=='object')return 7;
 const current=state.get(p);
 if(!current||current.action!=='sit'){
  state.set(p,{action:'sit',startedAt:time});return 0;
 }
 return Math.min(7,Math.max(0,Math.floor((time-current.startedAt)/150)));
}
function cellFor(action,direction,phase){
 if(!actions.includes(action)||!directions.includes(direction)||!Number.isInteger(phase)||phase<0||phase>=frameCount)return null;
 return {x:phase*cell,y:directions.indexOf(direction)*cell,width:cell,height:cell,anchorX:32,anchorY:groundY};
}
function paint(ctx,p,x,y,opts={}){
 const id=p?.id||p;
 if(id!=='alex')return previousPaint(ctx,p,x,y,opts);
 const action=selectAction(p,opts);
 const img=sheets[action];
 if(!loaded(img))return previousPaint(ctx,p,x,y,opts);
 // Clear prior sit start when the player switches to a different action.
 if(action!=='sit'&&p&&typeof p==='object')state.delete(p);
 const direction=W.directionForSprite(p,action==='walk');
 const phase=Number.isInteger(opts.phase)?((opts.phase%frameCount)+frameCount)%frameCount:frameFor(p,action,opts.timestampMs);
 const source=cellFor(action,direction,phase);
 const width=Math.round(opts.width||64),height=Math.round(opts.height||64);
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#26343838';ctx.beginPath();ctx.ellipse(Math.round(x),Math.round(y+1),Math.round(width*.21),2,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(img,source.x,source.y,cell,cell,Math.round(x-width/2),Math.round(y-groundY*height/cell),width,height);
 ctx.restore();return true;
}
W.paint=paint;
root.WordvilleAlex64={actions,directions,sheets,cell,groundY,frameCount,cellFor,frameFor,selectAction,paint,loaded};
})(globalThis);
