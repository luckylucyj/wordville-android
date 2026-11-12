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
# Eight authored moments: contact / down / passing / up, then swap the
# support and swing legs. A planted foot remains at y=43 throughout its
# HALF cycle. The opposite foot passes across it in moments 3 and 7.
# Each row in the sheet shares cell dimensions and the same foot anchor.
FOOT_X=[(21,29),(21,25),(21,18),(21,16),
        (19,27),(23,27),(30,27),(32,27)]
FOOT_Y=[(43,41),(43,41),(43,40),(43,41),
        (41,43),(41,43),(40,43),(41,43)]
SUPPORT=['left']*4+['right']*4
BOB=[0,1,0,-1,0,1,0,-1]
ARM_SWING=[(-2,2),(-1,1),(0,0),(1,-1),
           (2,-2),(1,-1),(0,0),(-1,1)]
PHASE_NAMES=['contact-left','down-left','passing-cross-left','up-left',
             'contact-right','down-right','passing-cross-right','up-right']
assert FOOT_X[2][0]>FOOT_X[2][1] and FOOT_X[6][0]>FOOT_X[6][1]
assert all(FOOT_Y[k][0 if k<4 else 1]==43 for k in range(8))
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
 """Render cohesive pixel-art legs with a planted sole and counter-swinging arms.

 The original, unscaled source face/hair/shirt pixels remain intact. No
 interpolation, antialiasing, or floating disconnected line-segment legs.
 """
 bounds=bbox(im)
 if not bounds:raise ValueError('source blank')
 left,top,right,bottom=bounds
 cx=24
 hip=max(31,min(35,top+round((bottom-top)*.75)))
 bob=BOB[k]
 pants,shoes,ink=select_original_palette(im,cx,hip)
 from PIL import ImageDraw
 out=Image.new('RGBA',(48,48))
 draw=ImageDraw.Draw(out)
 # Opaque, chunky outlines and four-pixel trouser fills read as the
 # SAME pixel density as the torso; thin independent 2px sticks do not.
 hipxs=(21,27)
 moving=(1,0) if SUPPORT[k]=='left' else (0,1)
 for leg in moving:
  hx=hipxs[leg]
  fx,fy=FOOT_X[k][leg],FOOT_Y[k][leg]
  knee_y=min(hip+5,fy-4)
  knee_x=round(hx*.55+fx*.45)
  # One coherent leg silhouette: thick thigh, knee, ankle, then shoe.
  spine=[(hx,hip+bob),(knee_x,knee_y),(fx,fy-2)]
  draw.line(spine,fill=ink,width=6,joint='curve')
  draw.line(spine,fill=pants,width=4,joint='curve')
  # Small original-palette highlight, never smooth shading.
  inner_x=(knee_x+(-1 if leg==0 else 1))
  draw.point((inner_x,knee_y),fill=shoes)
  draw.rectangle((fx-3,fy-2,fx+3,fy),fill=ink)
  draw.rectangle((fx-2,fy-2,fx+2,fy-1),fill=shoes)
 # Preserve source shirt, hair, head and arms over the hip seam.
 out.alpha_composite(im.crop((0,0,48,hip+3)),(0,bob))
 # Shift only outer sleeve pixels after clearing their old positions.
 # The shoulder row is not shifted, preventing disconnected arms.
 original=im.load()
 arm_top=max(top+20,hip-11)
 arm_end=hip-2
 for y in range(arm_top,arm_end+1):
  occupied=[x for x in range(left,right) if original[x,y][3]>140]
  if len(occupied)<12:continue
  for arm,edge in enumerate((occupied[:3],occupied[-3:])):
   amplitude=ARM_SWING[k][arm]
   shift=round(amplitude*(y-arm_top+1)/(max(1,arm_end-arm_top+1)))
   if not shift:continue
   # Cache source colors before erasing, then move 1 or 2 full pixels.
   kept=[(x,original[x,y]) for x in edge]
   for x,color in kept:
    if color[3]>140:out.putpixel((x,y+bob),(0,0,0,0))
   for x,color in kept:
    nx=x+shift
    if 0<=nx<48 and 0<=y+bob<48 and color[3]>140:
     out.putpixel((nx,y+bob),color)
 # Feet must be present at the same baseline in every pose.
 assert out.getpixel((FOOT_X[k][0],FOOT_Y[k][0]))[3]>160
 assert out.getpixel((FOOT_X[k][1],FOOT_Y[k][1]))[3]>160
 return out

def directional(src,di,k):
 im=src[SOURCE[di]]
 if di in ('down-right','up-right'):
  sheared=Image.new('RGBA',(48,48))
  for y in range(48):
   shift=(0 if y<18 else 1 if y<31 else 2) if di=='down-right' else (0 if y<18 else 1 if y<31 else 2)
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
   assert b and b[0]>=0 and b[1]>=0 and b[2]<=48 and b[3]<=44,(id,di,f,'clipped',b)
   assert b[3]-1==43,(id,di,f,'anchor',b)
   assert 36<=b[3]-b[1]<=44,(id,di,f,'height',b)
   connected=main_fraction(im)
   assert connected>=.74,(id,di,f,'disconnected',connected)
   h=hashlib.sha256(im.tobytes()).hexdigest();frame_hashes.append(h)
   sheet.alpha_composite(im,(f*48,d*48))
   audit.append({'character':id,'direction':di,'frame':f+1,'phase':PHASE_NAMES[f],
                 'height':b[3]-b[1],'anchor':43,'connected_fraction':round(connected,4)})
  assert len(set(frame_hashes))==8,(id,di,'duplicate frames')
 sheet.save(OUT/(id+'.png'),optimize=True)
 assert Image.open(OUT/(id+'.png')).size==(384,384)
assert len(audit)==768
(OUT/'audit.json').write_text(json.dumps({
 'resident_count':12,'direction_count':8,'frames_per_direction':8,'total_frames':768,
 'cell_size':[48,48],'sheet_size':[384,384],'foot_anchor_y':43,'fps':8,
 'unique_per_direction':8,'mirrored_directions':['up-left','left','down-left'],
 'phases':PHASE_NAMES,'arm_swing':ARM_SWING,
 'crossing_keypoints':[{'frame':k+1,'left':[FOOT_X[k][0],FOOT_Y[k][0]],
                         'right':[FOOT_X[k][1],FOOT_Y[k][1]],'support':SUPPORT[k]}
                        for k in range(8)],
 'limitations':'Pixel clusters are procedurally reconstructed from original costume colors; diagonal views use nearest-pixel adaptations.',
 'frame_stats':audit},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('WORDVILLE_GAIT_PASS 12 residents x 8 directions x 8 distinct frames = 768; 48px cell, y43 anchor')
