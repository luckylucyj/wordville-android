/* Shared tile and animation specification for every Wordville venue. */
(function(root){'use strict';
const TIERS=Object.freeze({small:Object.freeze({cols:16,rows:12}),medium:Object.freeze({cols:24,rows:18}),large:Object.freeze({cols:40,rows:28})});
const SIZES={pool:'large',library:'large',square:'large',park:'large',ranch:'large',burger:'medium',cafe:'medium',icecream:'medium',pub:'medium',gym:'medium',market:'medium',museum:'medium',greenhouse:'medium',bookstore:'small',clinic:'small',studio:'small',workshop:'small'};
function forPlace(id){const tier=SIZES[id]||'small';return {id,tier,...TIERS[tier],tileWidth:64,tileHeight:32,npcSpacingTiles:1.5,walkFPS:10,renderFPS:60,walkingFrames:8};}
function neighbors(x,y){return [[x+1,y],[x-1,y],[x,y+1],[x,y-1]];}
function isBlocked(id,x,y){const z=forPlace(id),{cols:w,rows:h}=z;
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<1||y<1||x>=w-1||y>=h-1)return true;
 if(id==='pool'&&x>=Math.round(w*.16)&&x<=Math.round(w*.83)&&y>=Math.round(h*.30)&&y<=Math.round(h*.73))return true;
 if(id==='burger'&&x>=Math.round(w*.47)&&y<=Math.round(h*.35))return true;
 if((id==='bookstore'||id==='library')&&y<=Math.round(h*.25))return true;
 return false;
}
function route(id,a,b){const z=forPlace(id),sx=Math.round(a.x),sy=Math.round(a.y),ex=Math.round(b.x),ey=Math.round(b.y);
 if(isBlocked(id,ex,ey))return [];
 const key=(x,y)=>x+','+y,src=key(sx,sy),q=[[sx,sy]],seen=new Map([[src,null]]);
 while(q.length){const [x,y]=q.shift(),k=key(x,y);if(x===ex&&y===ey){const out=[];let v=k;while(v&&v!==src){const [px,py]=v.split(',').map(Number);out.push({x:px,y:py});v=seen.get(v);}return out.reverse();}
 for(const [nx,ny] of neighbors(x,y)){const nk=key(nx,ny);if(isBlocked(id,nx,ny)||seen.has(nk))continue;seen.set(nk,k);q.push([nx,ny]);}
 }
 return [];
}
root.WordvilleVenueSpec={TIERS,SIZES,forPlace,isBlocked,route};
})(globalThis);
