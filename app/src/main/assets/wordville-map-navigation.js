/* Shared touch, mouse, wheel zoom and pan for Town and every Place/home.
 * Does not resize the authored pixel art. A move greater than 7px cancels
 * tap-to-move, while a simple tap continues to target the same tile.
 */
(function(root){'use strict';
const MAX=3,MIN=1;
const cap=(n,low,high)=>Math.max(low,Math.min(high,n));
const labels={
 ko:{in:'확대',out:'축소',reset:'원래 크기',hint:'두 손가락으로 확대·축소하고 확대 후 밀어서 이동'},
 en:{in:'Zoom in',out:'Zoom out',reset:'Reset view',hint:'Pinch to zoom; drag to inspect the map'},
 'zh-CN':{in:'放大',out:'缩小',reset:'重置视图',hint:'双指缩放，放大后拖动地图'},
 ja:{in:'拡大',out:'縮小',reset:'表示をリセット',hint:'ピンチで拡大縮小、拡大してドラッグ'}
};
function constrained(width,height,zoom,x,y){
 const z=cap(Number(zoom)||1,MIN,MAX);
 return {zoom:z,x:cap(Number(x)||0,width*(1-z),0),y:cap(Number(y)||0,height*(1-z),0)};
}
function anchored(view,next,px,py,width,height){
 const z=cap(next,MIN,MAX),ratio=z/view.zoom;
 return constrained(width,height,z,px-(px-view.x)*ratio,py-(py-view.y)*ratio);
}
const api={constrained,anchored,labels};
root.WordvilleMapNavigation=api;
if(typeof document==='undefined'){
 if(typeof module!=='undefined')module.exports=api;
 return;
}
const language=()=>labels[root.WordvilleI18n?.language]||labels.ko;
const town=document.getElementById('village-canvas'),place=document.getElementById('wv-place-canvas');
const stage=place?.parentElement;
if(!town||!stage)return;
const overlay=document.getElementById('wv-venue-actors');
const wrapper=document.createElement('div');wrapper.id='wv-venue-viewport-content';
stage.insertBefore(wrapper,place);wrapper.append(place);
if(overlay)wrapper.append(overlay);
const controls=document.createElement('div');controls.id='wv-venue-zoom-controls';
controls.setAttribute('role','group');
stage.append(controls);
const makeButton=(icon,key,action)=>{
 const b=document.createElement('button');b.type='button';b.textContent=icon;
 b.dataset.zoom=key;b.addEventListener('click',action);controls.append(b);return b;
};
let view=constrained(stage.clientWidth,stage.clientHeight,1,0,0);
const redrawPlace=()=>{
 const width=stage.clientWidth,height=stage.clientHeight;
 view=constrained(width,height,view.zoom,view.x,view.y);
 wrapper.style.transform='translate('+view.x+'px,'+view.y+'px) scale('+view.zoom+')';
 zoomOut.disabled=view.zoom<=MIN;zoomIn.disabled=view.zoom>=MAX;
};
function setPlaceZoom(z,x=stage.clientWidth/2,y=stage.clientHeight/2){
 view=anchored(view,z,x,y,stage.clientWidth,stage.clientHeight);redrawPlace();return view;
}
const zoomIn=makeButton('+','in',()=>setPlaceZoom(view.zoom+.25));
const zoomOut=makeButton('−','out',()=>setPlaceZoom(view.zoom-.25));
const reset=makeButton('⌖','reset',()=>{view=constrained(stage.clientWidth,stage.clientHeight,1,0,0);redrawPlace();});
function resetPlace(){
 view=constrained(stage.clientWidth,stage.clientHeight,1,0,0);
 redrawPlace();
}
const rename=()=>{const l=language();for(const b of [zoomIn,zoomOut,reset]){b.title=l[b.dataset.zoom];b.setAttribute('aria-label',l[b.dataset.zoom]);}
 town.title=l.hint;place.title=l.hint;};
rename();document.addEventListener('wordville-language-changed',rename);
root.addEventListener('resize',redrawPlace);
if(typeof ResizeObserver!=='undefined')new ResizeObserver(redrawPlace).observe(stage);
const pointers=new Map(), clickBlocked=new WeakMap();
api.consumeClick=el=>{
 if((clickBlocked.get(el)||0)>Date.now()){clickBlocked.delete(el);return true;}
 return false;
};
api.placeView=()=>({...view});
api.setPlaceZoom=setPlaceZoom;
api.resetPlace=resetPlace;
api.panPlace=(dx,dy)=>{
 if(view.zoom<=MIN)return view;
 view=constrained(stage.clientWidth,stage.clientHeight,view.zoom,view.x+dx,view.y+dy);
 redrawPlace();return view;
};
const screenPoint=(el,event)=>{
 const r=el===town?town.getBoundingClientRect():stage.getBoundingClientRect();
 return {x:event.clientX-r.left,y:event.clientY-r.top};
};
const pinchDistance=entries=>Math.hypot(entries[0].x-entries[1].x,entries[0].y-entries[1].y);
function bind(el,kind){
 const state={points:new Map(),origin:null,pinch:null,dragging:false};
 const moveFor=(dx,dy)=>{
  if(kind==='town'){
   const r=town.getBoundingClientRect(),cx=town.width/r.width,cy=town.height/r.height;
   root.WordvilleVillage?.panBy?.(dx*cx,dy*cy);
  }else api.panPlace(dx,dy);
 };
 const zoomFor=(next,x,y)=>{
  if(kind==='town'){
   const r=town.getBoundingClientRect();root.WordvilleVillage?.zoomAt?.(next,x*town.width/r.width,y*town.height/r.height);
  }else setPlaceZoom(next,x,y);
 };
 el.addEventListener('pointerdown',ev=>{
  if(ev.pointerType==='mouse'&&ev.button!==0)return;
  const p=screenPoint(el,ev);state.points.set(ev.pointerId,{...p,moved:0});
  try{el.setPointerCapture(ev.pointerId);}catch{}
  if(state.points.size===1){state.origin=p;state.dragging=false;state.pinch=null;}
  if(state.points.size===2){
   const arr=[...state.points.values()];
   state.pinch={distance:pinchDistance(arr),zoom:kind==='town'?(root.WordvilleVillage?.zoom||1):view.zoom};
   state.dragging=true;
   clickBlocked.set(el,Date.now()+700);
  }
 });
 el.addEventListener('pointermove',ev=>{
  const last=state.points.get(ev.pointerId);if(!last)return;
  const p=screenPoint(el,ev);
  const dx=p.x-last.x,dy=p.y-last.y;
  if(Math.hypot(p.x-(state.origin?.x??p.x),p.y-(state.origin?.y??p.y))>7)state.dragging=true;
  state.points.set(ev.pointerId,p);
  if(state.points.size>=2){
   const arr=[...state.points.values()],middle={x:(arr[0].x+arr[1].x)/2,y:(arr[0].y+arr[1].y)/2};
   const next=cap(state.pinch.zoom*(pinchDistance(arr)/Math.max(1,state.pinch.distance)),MIN,kind==='town'?2:MAX);
   zoomFor(next,middle.x,middle.y);
   state.dragging=true;clickBlocked.set(el,Date.now()+700);
   ev.preventDefault();
  }else if(state.dragging){
   moveFor(dx,dy);
   clickBlocked.set(el,Date.now()+700);
   ev.preventDefault();
  }
 });
 function end(ev){
  if(!state.points.has(ev.pointerId))return;
  state.points.delete(ev.pointerId);
  if(state.dragging)clickBlocked.set(el,Date.now()+700);
  if(state.points.size===1){
   state.origin=[...state.points.values()][0];state.pinch=null;
  }
  if(!state.points.size){state.origin=null;state.pinch=null;state.dragging=false;}
 }
 el.addEventListener('pointerup',end);
 el.addEventListener('pointercancel',end);
 el.addEventListener('wheel',ev=>{
  ev.preventDefault();
  const p=screenPoint(el,ev);
  const z=kind==='town'?(root.WordvilleVillage?.zoom||1):view.zoom;
  zoomFor(z+(ev.deltaY<0?.25:-.25),p.x,p.y);
 },{passive:false});
}
bind(town,'town');bind(place,'place');
redrawPlace();
})(globalThis);
