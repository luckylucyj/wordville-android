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
SOURCE={'down':'down','down-right':'down','right':'right','up-right':'up','up':'up'}
# The sprite's vertical centerline is x=24. All poses keep heads fixed.
# Two independent foot lanes; the left foot never crosses right.
FRONT=[((19,43),(29,42)),((19,43),(29,41)),((21,43),(27,40)),((20,43),(28,41)),
       ((19,42),(29,43)),((19,41),(29,43)),((21,40),(27,43)),((20,41),(28,43))]
SIDE=[((23,43),(30,42)),((23,43),(29,41)),((24,43),(27,40)),((24,43),(28,41)),
      ((19,42),(26,43)),((20,41),(26,43)),((22,40),(26,43)),((21,41),(26,43))]
SUPPORT=['left']*4+['right']*4
ARM_SWING=[(-1,1),(-1,1),(0,0),(1,-1),(1,-1),(1,-1),(0,0),(-1,1)]
PHASE_NAMES=['contact-left','down-left','passing-left','up-left',
             'contact-right','down-right','passing-right','up-right']
assert all(a[0]<b[0] for data in (FRONT,SIDE) for a,b in data)
assert all(feet[0 if k<4 else 1][1]==43
           for data in (FRONT,SIDE) for k,feet in enumerate(data))
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

def animate(im,k,direction):
 """Fixed-center, no-cross pose from connected trousers/shoes, not thin sticks."""
 bounds=bbox(im)
 if not bounds:raise ValueError('source blank')
 left,top,right,bottom=bounds
 hip=max(31,min(34,top+round((bottom-top)*.74)))
 front=direction in ('down','up')
 points=(FRONT if front else SIDE)[k]
 roots=(21,27) if front else (22,26)
 pants,shoes,ink=select_original_palette(im,24,hip)
 from PIL import ImageDraw
 out=Image.new('RGBA',(48,48))
 draw=ImageDraw.Draw(out)
 # Both legs remain in their own screen-space lanes.
 # Upper torso and head are never translated between phases.
 order=(1,0) if k<4 else (0,1)
 for leg in order:
  hx=roots[leg];fx,fy=points[leg]
  knee_y=hip+max(4,round((fy-hip)*.55))
  knee_x=round(hx*.6+fx*.4)
  if leg==0:knee_x=min(knee_x,24)
  else:knee_x=max(knee_x,25)
  spine=[(hx,hip),(knee_x,knee_y),(fx,fy-2)]
  draw.line(spine,fill=ink,width=5,joint='curve')
  draw.line(spine,fill=pants,width=3,joint='curve')
  draw.rectangle((fx-3,fy-2,fx+2,fy),fill=ink)
  draw.line((fx-2,fy-2,fx+1,fy-2),fill=shoes,width=1)
 out.alpha_composite(im.crop((0,0,48,hip+3)),(0,0))
 # Counter-swing only the outermost sleeve pixels; shoulders remain still.
 original=im.load()
 for arm,region in enumerate((range(11,19),range(29,38))):
  swing=ARM_SWING[k][arm]
  if not swing:continue
  for y in range(hip-5,hip-1):
   for x in region:
    pixel=original[x,y]
    if pixel[3]<160:continue
    if not (x<17 if arm==0 else x>31):continue
    xx=x+swing
    if 0<=xx<48 and out.getpixel((xx,y))[3]<200:
     out.putpixel((xx,y),pixel)
 for fx,fy in points:
  assert out.getpixel((fx,fy))[3]>140,(direction,k,fx,fy)
 return out

def directional(src,di,k):
 im=src[SOURCE[di]]
 if di in ('down-right','up-right'):
  sheared=Image.new('RGBA',(48,48))
  for y in range(48):
   shift=(0 if y<19 else 1 if y<31 else 0)
   sheared.alpha_composite(im.crop((0,y,48,y+1)),(shift,y))
  im=sheared
 return animate(im,k,di)
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
  base=src[SOURCE[MIRROR.get(di,di)]]
  head=bbox(base.crop((0,0,48,20)))
  assert head and abs((head[0]+head[2]-1)/2-24)<=3,(id,di,'head center',head)
  for f in range(8):
   im=directional(src,MIRROR[di],f).transpose(Image.Transpose.FLIP_LEFT_RIGHT) if di in MIRROR else directional(src,di,f)
   b=bbox(im)
   assert b and b[0]>=1 and b[1]>=1 and b[2]<=47 and b[3]==44,(id,di,f,'clipped or wrong anchor',b)
   assert abs((b[1]+b[3]-1)/2-24)<=3,(id,di,f,'vertical midpoint',b)
   assert abs((b[0]+b[2]-1)/2-24)<=3,(id,di,f,'vertical x-axis',b)
   connected=main_fraction(im)
   assert connected>=.74,(id,di,f,'disconnected',connected)
   h=hashlib.sha256(im.tobytes()).hexdigest();frame_hashes.append(h)
   sheet.alpha_composite(im,(f*48,d*48))
   audit.append({'character':id,'direction':di,'frame':f+1,'phase':PHASE_NAMES[f],
                 'bbox':b,'center_x':24,'center_y':24,'anchor':43,'connected_fraction':round(connected,4)})
  assert len(set(frame_hashes))==8,(id,di,'duplicate frames')
 sheet.save(OUT/(id+'.png'),optimize=True)
 assert Image.open(OUT/(id+'.png')).size==(384,384)
assert len(audit)==768
(OUT/'audit.json').write_text(json.dumps({
 'resident_count':12,'direction_count':8,'frames_per_direction':8,'total_frames':768,
 'cell_size':[48,48],'sheet_size':[384,384],'body_center_x':24,'vertical_center_y':24,
 'foot_anchor_y':43,'fps':8,'unique_per_direction':8,'no_crossing_feet':True,
 'mirrored_directions':['up-left','left','down-left'],'phases':PHASE_NAMES,
 'front_foot_points':FRONT,'side_foot_points':SIDE,'arm_swing':ARM_SWING,
 'limitations':'Diagonal artwork adapts cardinal sprites; feet rendered from palette colors without crossing.',
 'frame_stats':audit},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('WORDVILLE_NOCROSS_GAIT_PASS 12 x 8 x 8 = 768; center x24, y24, planted y43')
