#!/usr/bin/env python3
"""Wordville: generate 12 separate 384x384 sheets, 8 directions x 8 unique poses.
Native frame 48x48, original character height ~40px, foot anchor y=43.
No screenshot cell cropping. Original source faces/hair and clothing are kept;
new arm and leg poses are pixel-art transformations of intact original bodies.
"""
from pathlib import Path
from PIL import Image
import hashlib, json
ASSETS=Path(__file__).resolve().parents[1]/'app/src/main/assets'
OUT=ASSETS/'walk48';OUT.mkdir(parents=True,exist_ok=True)
IDS=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily']
DIRS=['down','down-right','right','up-right','up','up-left','left','down-left']
MIRROR={'up-left':'up-right','left':'right','down-left':'down-right'}
SOURCE={'down':'down','down-right':'down','right':'right','up-right':'right','up':'up'}
# Stable 48x48 sprite center. Shoe positions CROSS at passing frames 3 and 6.
FOOT_X=[(-7,7),(-5,5),(3,-3),(7,-7),(5,-5),(-3,3)]
FOOT_Y=[(43,41),(43,41),(43,39),(41,43),(41,43),(39,43)]
SUPPORT=['left','left','left','right','right','right']
BOB=[0,1,-1,0,1,-1]
ARM_SWING=[(2,-2),(1,-1),(-1,1),(-2,2),(-1,1),(1,-1)]
PHASE_NAMES=['contact-left','down-left','passing-cross-left','contact-right','down-right','passing-cross-right']
assert FOOT_X[0][0]<FOOT_X[0][1] and FOOT_X[2][0]>FOOT_X[2][1]
assert FOOT_X[3][0]>FOOT_X[3][1] and FOOT_X[5][0]<FOOT_X[5][1]
assert FOOT_Y[2][1]<FOOT_Y[2][0] and FOOT_Y[5][0]<FOOT_Y[5][1]
HI=Image.open(ASSETS/'portraits/wordville-walk-4phase.png').convert('RGBA')
BACK=Image.open(ASSETS/'portraits/wordville-reference-walk.png').convert('RGBA')
assert HI.size==(2560,768) and BACK.size==(384,576)
def bbox(im):
 return im.getchannel('A').point(lambda a:255 if a>=140 else 0).getbbox()
def scaled(im,scale):
 b=bbox(im)
 if not b:raise ValueError('empty source')
 crop=im.crop(b)
 w=max(1,round(crop.width*scale));h=max(1,round(crop.height*scale))
 assert w<=43 and h<=40,(w,h)
 out=Image.new('RGBA',(48,48))
 out.alpha_composite(crop.resize((w,h),Image.Resampling.NEAREST),((48-w)//2,44-h))
 return out
def character_sources(i):
 row,col=divmod(i,4)
 a=HI.crop((col*4*160,row*256,(col*4+1)*160,(row+1)*256))
 b=HI.crop(((col*4+1)*160,row*256,(col*4+2)*160,(row+1)*256))
 rear=BACK.crop((9*32,i*48,10*32,(i+1)*48))
 boxes=[bbox(a),bbox(b)]
 scale=min(40/max(q[3]-q[1] for q in boxes),43/max(q[2]-q[0] for q in boxes))
 rb=bbox(rear)
 scale_back=min(40/(rb[3]-rb[1]),43/(rb[2]-rb[0]))
 return {'down':scaled(a,scale),'right':scaled(b,scale),'up':scaled(rear,scale_back)}
def waist_center(im,hip):
 cols=[x for y in range(max(0,hip-4),hip+1) for x in range(48) if im.getpixel((x,y))[3]>140]
 return round(sum(cols)/len(cols)) if cols else 24
def select_original_palette(im,cx,hip):
 px=im.load()
 def sample(y0,y1,x0,x1,fraction):
  shades=[px[x,y] for y in range(y0,y1) for x in range(x0,x1)
          if 0<=x<48 and 0<=y<48 and px[x,y][3]>180]
  shades.sort(key=lambda c:sum(c[:3]))
  return shades[int((len(shades)-1)*fraction)] if shades else (80,60,45,255)
 return (sample(hip,41,cx-9,cx+9,.70),
         sample(40,44,cx-10,cx+10,.35),
         sample(35,44,cx-10,cx+10,.06))

def animate(im,k):
 """Whole-body pose with two independently jointed legs that change x order."""
 bounds=bbox(im)
 if not bounds:raise ValueError('source blank')
 left,top,right,bottom=bounds
 cx=24;hip=max(31,max(top+15,min(35,top+round((bottom-top)*.75))))
 sx=[cx+u for u in FOOT_X[k]];sy=FOOT_Y[k];bob=BOB[k]
 pants,shoes,ink=select_original_palette(im,cx,hip)
 out=Image.new('RGBA',(48,48))
 # Keep head, face, hair and full upper torso connected; remove old legs.
 out.alpha_composite(im.crop((0,0,48,hip+2)),(0,bob))
 original=im.load()
 start=max(top+20,hip-9);end=hip-1
 if start<end:
  for arm,(x0,x1) in enumerate(((max(0,left-1),max(0,cx-6)),
                               (min(48,cx+6),min(48,right+1)))):
   for y in range(start,end+1):
    for x in range(x0,x1):
     color=original[x,y]
     if color[3]<=100:continue
     dx=round(ARM_SWING[k][arm]*(y-start+1)/(end-start+1))
     xx=max(0,min(47,x+dx));yy=y+bob
     if 0<=yy<48:out.putpixel((xx,yy),color)
 from PIL import ImageDraw
 draw=ImageDraw.Draw(out)
 hipxs=(cx-3,cx+3)
 # Swing leg behind stance leg; crossing silhouettes use appropriate occlusion.
 draw_order=(1,0) if SUPPORT[k]=='left' else (0,1)
 for leg in draw_order:
  hx=hipxs[leg];fx=sx[leg];fy=sy[leg]
  ky=round((hip+fy)/2)
  kx=round(hx*.46+fx*.54)+(1 if k in (1,4) else -1 if k in (2,5) else 0)
  draw.line([(hx,hip+bob),(kx,ky),(fx,fy-1)],fill=ink,width=3)
  draw.line([(hx,hip+bob),(kx,ky),(fx,fy-2)],fill=pants,width=2)
  draw.rectangle((fx-3,fy-1,fx+2,fy),fill=ink)
  draw.rectangle((fx-2,fy-2,fx+2,fy-1),fill=shoes)
 draw.line((cx-3,hip,cx+3,hip),fill=pants,width=2)
 for leg in (0,1):
  assert out.getpixel((sx[leg],sy[leg]))[3]>160,('missing shoe',k,leg)
 return out

def directional(src,di,k):
 im=src[SOURCE[di]]
 if di in ('down-right','up-right'):
  sheared=Image.new('RGBA',(48,48))
  for y in range(48):
   shift=(0 if y<18 else 1 if y<31 else 2) if di=='down-right' else (-1 if y<20 else 0 if y<31 else 1)
   sheared.alpha_composite(im.crop((0,y,48,y+1)),(shift,y))
  im=sheared
 return animate(im,k)
def main_fraction(im):
 pix=im.load();visited=set();components=[]
 for y in range(48):
  for x in range(48):
   if (x,y) in visited or pix[x,y][3]<=160:continue
   visited.add((x,y));stack=[(x,y)];size=0
   while stack:
    xx,yy=stack.pop();size+=1
    for a,b in ((xx+1,yy),(xx-1,yy),(xx,yy+1),(xx,yy-1)):
     if 0<=a<48 and 0<=b<48 and (a,b) not in visited and pix[a,b][3]>160:
      visited.add((a,b));stack.append((a,b))
   components.append(size)
 return max(components)/sum(components) if components else 0
audit=[]
for i,id in enumerate(IDS):
 src=character_sources(i);sheet=Image.new('RGBA',(288,384))
 for d,di in enumerate(DIRS):
  frame_hashes=[]
  for f in range(6):
   im=directional(src,MIRROR[di],f).transpose(Image.Transpose.FLIP_LEFT_RIGHT) if di in MIRROR else directional(src,di,f)
   b=bbox(im)
   assert b and b[0]>=1 and b[1]>=1 and b[2]<=47 and b[3]<=47,(id,di,f,'clipped',b)
   assert b[3]-1==43,(id,di,f,'anchor',b)
   assert 37<=b[3]-b[1]<=42,(id,di,f,'height',b)
   connected=main_fraction(im)
   assert connected>=.85,(id,di,f,'disconnected',connected)
   h=hashlib.sha256(im.tobytes()).hexdigest();frame_hashes.append(h)
   sheet.alpha_composite(im,(f*48,d*48))
   audit.append({'character':id,'direction':di,'frame':f+1,'height':b[3]-b[1],'anchor':43,'connected_fraction':round(connected,4)})
  assert len(set(frame_hashes))==6,(id,di,'duplicate frames')
 sheet.save(OUT/(id+'.png'),optimize=True)
 assert Image.open(OUT/(id+'.png')).size==(288,384)
assert len(audit)==576
(OUT/'audit.json').write_text(json.dumps({
 'resident_count':12,'direction_count':8,'frames_per_direction':6,'total_frames':576,
 'cell_size':[48,48],'sheet_size':[384,384],'foot_anchor_y':43,'fps':8,
 'unique_per_direction':6,'mirrored_directions':['up-left','left','down-left'],
 'phases':PHASE_NAMES,
 'crossing_keypoints':[{'frame':k+1,'left':[24+FOOT_X[k][0],FOOT_Y[k][0]],'right':[24+FOOT_X[k][1],FOOT_Y[k][1]],'support':SUPPORT[k]} for k in range(6)],
 'limitations':'New motions are procedural pixel edits to original whole bodies; diagonals are adapted from cardinal source views rather than individually hand-drawn.',
 'frame_stats':audit},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('WORDVILLE_GAIT_PASS 12 residents x 8 directions x 6 new frames = 576; 48px cell, y43 anchor')
