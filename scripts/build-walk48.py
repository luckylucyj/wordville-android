"""Build transparent 48x48/8-direction/8-frame walk sheets for every resident.
Keeps each resident's original hair, face and garment pixels in the upper body.
Synthesizes alternating grounded lower limbs and opposite-swing cuffs.
"""
from pathlib import Path
from PIL import Image, ImageDraw
from collections import Counter
import hashlib

ROOT=Path(__file__).resolve().parents[1]/'app/src/main/assets'
INPUT=ROOT/'portraits/wordville-reference-walk.png'
OUT=ROOT/'walk48'
NAMES=['alex','elliott','harvey','sam','sebastian','shane','haley','leah','maru','penny','abigail','emily']
DIRECTIONS=['down','down-right','right','up-right','up','up-left','left','down-left']
POSES=['contact','down','passing','up']*2
CELL=48
GROUND_Y=44
TARGET_H=40
POSE_INPUT=(1,1,0,2,2,2,0,1)
SOURCE_DIR=(0,1,1,3,3,3,2,2)

def dominant(im, lo, hi, default):
    pixels=[]
    for y in range(max(0,lo),min(im.height,hi)):
        for x in range(im.width):
            r,g,b,a=im.getpixel((x,y))
            if a>=192:pixels.append((r,g,b,255))
    return Counter(pixels).most_common(1)[0][0] if pixels else default

def normalize(im):
    box=im.getchannel('A').getbbox()
    if box is None:raise ValueError('Source pose has no nontransparent pixels')
    im=im.crop(box)
    w=min(40,max(1,round(im.width*TARGET_H/im.height)))
    return im.resize((w,TARGET_H),Image.Resampling.NEAREST)

def author_frame(src, row, direction, frame):
    k=frame%4
    active=0 if frame<4 else 1
    base_index=SOURCE_DIR[direction]
    pose=POSE_INPUT[frame]
    cut=src.crop(((base_index*3+pose)*32,row*48,
                  (base_index*3+pose+1)*32,(row+1)*48))
    shape=normalize(cut)
    out=Image.new('RGBA',(CELL,CELL))
    ytop=GROUND_Y-TARGET_H+1  # top 5, ground 44
    # down/up bob affects upper body only, planted sole never moves.
    bob=(0,1,0,-1)[k]
    xcenter=24
    xpos=xcenter-shape.width//2
    raw=Image.new('RGBA',(CELL,CELL))
    raw.alpha_composite(shape,(xpos,ytop+bob))
    # Source atlas has only four cardinal directions. Diagonals use an
    # authored two-pixel upper-body shear; these are derived, not painted
    # from independent 3/4-view references.
    if direction in (1,3,5,7):
        shear=Image.new('RGBA',(CELL,CELL))
        for y in range(0,36):
            shift=1 if y<21 else -1
            if direction in (5,7):shift=-shift
            for x in range(CELL):
                col=raw.getpixel((x,y))
                if col[3]:shear.putpixel((x+shift,y),col)
        raw.paste((0,0,0,0),(0,0,CELL,36))
        raw.alpha_composite(shear)
    hip=34
    # Remove existing leg pixels, retain original face, hair, torso and coat.
    d=ImageDraw.Draw(raw)
    d.rectangle((0,hip,CELL-1,CELL-1),fill=(0,0,0,0))
    out.alpha_composite(raw)
    # Colors sourced from this resident's original clothing/boots.
    pants=dominant(shape,shape.height*3//4,shape.height*9//10,(57,67,88,255))
    boots=dominant(shape,shape.height*9//10,shape.height,(59,42,46,255))
    sleeve=dominant(shape,shape.height//2,shape.height*3//4,(93,107,121,255))
    skin=(230,174,137,255)
    ink=(35,36,45,255)
    d=ImageDraw.Draw(out)
    # Two separately articulated legs, half-cycle swaps the lead foot.
    # Contact -> Down -> Passing -> Up then opposite foot contacts.
    stance_x=[-3,3][active]
    swing_x=-stance_x
    step=(6,3,0,4)[k]
    rise=(0,0,2,3)[k]
    forward=1 if direction in (1,2,3) else (-1 if direction in (5,6,7) else 0)
    # Side walking has larger horizontal stride; front/back has foot split.
    for leg,planted in ((1-active,False),(active,True)):
        side=(-3 if leg==0 else 3)
        offset=step*(1 if planted else -1)
        fx=24+side+(forward*offset if forward else offset//3)
        # stationary support always ends on same y=44
        fy=GROUND_Y if planted else GROUND_Y-rise
        hx=24+side
        bend=(fx+hx)//2 + (1 if k==1 else (-1 if k==3 else 0))
        d.line([(hx,32+bob),(bend,38),(fx,fy-1)],fill=ink,width=5)
        d.line([(hx,32+bob),(bend,38),(fx,fy-2)],fill=pants,width=3)
        d.rectangle((fx-3,fy-2,fx+3,fy),fill=ink)
        d.rectangle((fx-2,fy-2,fx+2,fy-1),fill=boots)
    # Hand position is the reverse phase of that side's leg.
    arm=(3,1,-2,-4,-3,-1,2,4)[frame]
    for side in (-1,1):
        shoulder=24+side*10
        cuffx=shoulder+round(arm*side/3)
        yhand=29+bob+round(arm*side/4)
        d.line([(shoulder,23+bob),(cuffx,yhand)],fill=ink,width=5)
        d.line([(shoulder,23+bob),(cuffx,yhand-1)],fill=sleeve,width=3)
        d.rectangle((cuffx-1,yhand,cuffx+1,yhand+2),fill=skin)
    # Preserve fixed foot anchor, transparent padding and art size.
    box=out.getchannel('A').getbbox()
    assert box and box[0]>=0 and box[2]<=48 and box[3]==45,(row,direction,frame,box)
    assert 3<=box[1]<=8,(row,direction,frame,box)
    return out

def main():
    src=Image.open(INPUT).convert('RGBA')
    assert src.size==(384,576),src.size
    OUT.mkdir(parents=True,exist_ok=True)
    count=0
    for row,name in enumerate(NAMES):
        sheet=Image.new('RGBA',(CELL*8,CELL*8))
        for direction in range(8):
            signatures=[]
            for frame in range(8):
                cell=author_frame(src,row,direction,frame)
                signatures.append(hashlib.sha256(cell.tobytes()).hexdigest())
                sheet.alpha_composite(cell,(frame*CELL,direction*CELL))
                count+=1
            assert len(set(signatures))>=6,(name,direction,'too few distinct poses')
        filename=OUT/(name+'.png')
        sheet.save(filename,optimize=True)
        assert Image.open(filename).size==(384,384)
    print('walk48 PASS',len(NAMES),'residents',count,'cells; 48x48, 8 directions, 8 frames, ground y=44')

if __name__=='__main__':main()
