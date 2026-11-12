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
GAIT=[
 ('contact-left',(-3,3),(0,0),0,(3,-3)),
 ('down-left',(-2,2),(0,1),1,(2,-2)),
 ('passing-left',(0,0),(0,2),0,(0,0)),
 ('up-left',(2,-2),(0,2),-1,(-2,2)),
 ('contact-right',(3,-3),(0,0),0,(-3,3)),
 ('down-right',(2,-2),(1,0),1,(-2,2)),
 ('passing-right',(0,0),(2,0),0,(0,0)),
 ('up-right',(-2,2),(2,0),-1,(2,-2))
]
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
def animate(im,k):
 name,moves,lifts,bob,arms=GAIT[k]
 bounds=bbox(im)
 if not bounds:raise ValueError('empty animation base')
 l,t,r,b=bounds
 hip=max(t+15,min(36,t+round((b-t)*.76)))
 mid=waist_center(im,hip)
 upper=Image.new('RGBA',(48,48));lower=Image.new('RGBA',(48,48))
 source=im.load();up=upper.load();low=lower.load()
 for y in range(48):
  for x in range(48):
   if y<=hip+1:up[x,y]=source[x,y]
   if y>=hip-1:low[x,y]=source[x,y]
 result=Image.new('RGBA',(48,48))
 result.alpha_composite(upper,(0,bob))
 arm_start=max(t+20,hip-9);arm_end=hip-1
 if arm_start<arm_end:
  for side,(lo,hi) in enumerate(((max(0,l-1),max(0,mid-6)),(min(48,mid+6),min(48,r+1)))):
   for y in range(arm_start,arm_end+1):
    for x in range(lo,hi):
     p=source[x,y]
     if p[3]<=100:continue
     delta=round(arms[side]*(y-arm_start+1)/(arm_end-arm_start+1))
     nx=max(0,min(47,x+delta));ny=y+bob
     if 0<=ny<48:result.putpixel((nx,ny),p)
 for leg in (0,1):
  lo,hi=(0,mid+1) if leg==0 else (mid,48)
  for y in range(hip-1,44):
   t=(y-hip+1)/max(1,44-hip+1)
   dx=round(moves[leg]*t);dy=-round(lifts[leg]*t)
   for x in range(lo,hi):
    p=low[x,y]
    if p[3]==0:continue
    xx=x+dx;yy=y+dy
    if 0<=xx<48 and 0<=yy<48:result.putpixel((xx,yy),p)
 for y in range(hip-1,hip+3):
  for x in range(max(0,mid-4),min(48,mid+5)):
   p=source[x,y];yy=y+bob
   if p[3] and 0<=yy<48:result.putpixel((x,yy),p)
 return result
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
 src=character_sources(i);sheet=Image.new('RGBA',(384,384))
 for d,di in enumerate(DIRS):
  frame_hashes=[]
  for f in range(8):
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
  assert len(set(frame_hashes))==8,(id,di,'duplicate frames')
 sheet.save(OUT/(id+'.png'),optimize=True)
 assert Image.open(OUT/(id+'.png')).size==(384,384)
assert len(audit)==768
(OUT/'audit.json').write_text(json.dumps({
 'resident_count':12,'direction_count':8,'frames_per_direction':8,'total_frames':768,
 'cell_size':[48,48],'sheet_size':[288,384],'foot_anchor_y':43,'fps':8,
 'unique_per_direction':8,'mirrored_directions':['up-left','left','down-left'],
 'phases':['contact-left','down-left','passing-left','up-left','contact-right','down-right','passing-right','up-right'],
 'limitations':'New motions are procedural pixel edits to original whole bodies; diagonals are adapted from cardinal source views rather than individually hand-drawn.',
 'frame_stats':audit},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('WORDVILLE_GAIT_PASS 12 residents x 8 directions x 8 new frames = 768; 48px cell, y43 anchor')
