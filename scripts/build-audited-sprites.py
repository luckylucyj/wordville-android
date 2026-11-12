from PIL import Image
from pathlib import Path
import hashlib
A=Path(__file__).resolve().parents[1]/'app/src/main/assets'
O=A/'sprites32';O.mkdir(exist_ok=True)
N=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily']
B='01210212';C='00200202';D='22222222'
P=[[B]*4,[B]*4,[B]*4,[B]*4,[C,C,B,C],[C,B,D,D],[C]*4,[C,C,C,B],[D,'11211212',B,D],[D,C,D,D],[C]*4,[C,C,C,D]]
SH={'portraits/wordville-reference-walk.png':'d6adda91d6f83a80fe505bf1405b72de37532aeca26c33ad26c8c44fabd4bab0','pets/wordville-cat-source.png':'300785150a82f4f356d1f27fbb14b118e1e96ecaa135b18fd3a52c44def2e9d0','pets/wordville-dog-source.png':'d7cc9be857d5c4eacd0522e6938a578f4a53fbf8c81b5dca39169af09e5e5e5c'}
for path,sha in SH.items():assert hashlib.sha256((A/path).read_bytes()).hexdigest()==sha,'Source changed '+path
def bounds(im):
 a=im.getchannel('A')
 p=[(x,y) for y in range(im.height) for x in range(im.width) if a.getpixel((x,y))>160]
 assert p,'Empty source'
 return min(x for x,y in p),min(y for x,y in p),max(x for x,y in p),max(y for x,y in p)
def frame(im,s):
 x,y,X,Y=bounds(im)
 cut=im.crop((x,y,X+1,Y+1))
 ww=max(1,round(cut.width*s));hh=max(1,round(cut.height*s))
 assert ww<=30 and hh<=30
 cell=Image.new('RGBA',(32,32))
 cell.alpha_composite(cut.resize((ww,hh),Image.Resampling.NEAREST),((32-ww)//2,30-hh))
 a=cell.getchannel('A'); rows=[yy for yy in range(32) for xx in range(32) if a.getpixel((xx,yy))>160]
 assert rows
 if max(rows)!=30:
  fixed=Image.new('RGBA',(32,32));fixed.alpha_composite(cell,(0,30-max(rows)));cell=fixed;a=cell.getchannel('A')
 assert all(a.getpixel((i,0))<=160 and a.getpixel((i,31))<=160 and a.getpixel((0,i))<=160 and a.getpixel((31,i))<=160 for i in range(32))
 assert max(yy for yy in range(32) for xx in range(32) if a.getpixel((xx,yy))>160)==30
 colors={px[:3] for px in im.getdata() if px[3]>160}
 assert all(px[:3] in colors for px in cell.getdata() if px[3]>160)
 return cell
source=Image.open(A/'portraits/wordville-reference-walk.png').convert('RGBA')
assert source.size==(384,576)
count=0
for i,n in enumerate(N):
 rows=[];dims=[]
 for d in range(4):
  arr=[]
  for phase in P[i][d]:
   p=int(phase);im=source.crop(((d*3+p)*32,i*48,(d*3+p+1)*32,(i+1)*48))
   x,y,X,Y=bounds(im);dims.append((X-x+1,Y-y+1));arr.append(im)
  rows.append(arr)
 s=min(29/max(t[0] for t in dims),29/max(t[1] for t in dims),1.)
 atlas=Image.new('RGBA',(256,128))
 for d in range(4):
  for k in range(8):
   atlas.alpha_composite(frame(rows[d][k],s),(k*32,d*32));count+=1
 atlas.save(O/(n+'.png'))
for n in ['cat','dog']:
 orig=Image.open(A/('pets/wordville-'+n+'-source.png')).convert('RGBA')
 assert orig.size==(128,192)
 rows=[];dims=[]
 for d in range(4):
  arr=[]
  for k in range(4):
   im=orig.crop((d*32,k*48,d*32+32,k*48+48));x,y,X,Y=bounds(im)
   dims.append((X-x+1,Y-y+1));arr.append(im)
  rows.append(arr)
 s=min(29/max(t[0] for t in dims),29/max(t[1] for t in dims),1.)
 atlas=Image.new('RGBA',(256,128))
 for d in range(4):
  for k in range(8):
   atlas.alpha_composite(frame(rows[d][k%4],s),(k*32,d*32));count+=1
 atlas.save(O/(n+'.png'))
assert count==448 and len(list(O.glob('*.png')))==14
print('AUDIT PASS: 14 PNGs, 448 cells, 32x32, transparent borders, y=30, unchanged palette')
