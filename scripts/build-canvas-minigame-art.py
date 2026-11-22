#!/usr/bin/env python3
"""Generate original pastel Canvas game sprites when authored PNG art is absent.
Build output is bundled as local WebView assets; no runtime API, internet or GPU.
Character artwork is a lightweight placeholder and can be replaced by a matching
512x512 transparent PNG without modifying Canvas game code.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import math

BASE=Path(__file__).resolve().parents[1]/"app/src/main/assets/images"
S=2
INK="#4A3B32"
WHITE="#fffefa"
BLUE="#86b5df"
PINK="#f3b1b9"
CLOUD="#fff7e8"

def points(*values):
    return tuple(round(x*S) for x in values)

def picture(width=512,height=512,transparent=True):
    im=Image.new("RGBA",points(width,height),(0,0,0,0) if transparent else CLOUD)
    return im,ImageDraw.Draw(im)

def ellipse(d,box,fill,outline=INK,w=4):
    d.ellipse(points(*box),fill=fill,outline=outline,width=round(w*S) if outline else 1)

def rect(d,box,fill,outline=INK,w=3,r=10):
    d.rounded_rectangle(points(*box),radius=r*S,fill=fill,outline=outline,width=w*S if outline else 1)

def polygon(d,xy,fill,outline=INK,w=4):
    p=[points(x,y) for x,y in xy]
    d.polygon(p,fill=fill)
    if outline:d.line(p+[p[0]],fill=outline,width=w*S,joint="curve")

def line(d,xy,color=INK,width=5):
    d.line([points(x,y) for x,y in xy],fill=color,width=width*S,joint="curve")

def eyes(d,x,y,mood):
    ellipse(d,(x-42,y-8,x-28,y+9),INK,None)
    ellipse(d,(x+28,y-8,x+42,y+9),INK,None)
    ellipse(d,(x-81,y+11,x-53,y+24),PINK,None)
    ellipse(d,(x+53,y+11,x+81,y+24),PINK,None)
    if mood in ("happy","perfect","catch","food_3"):
        d.arc(points(x-14,y+18,x+14,y+43),0,180,fill=INK,width=4*S)
    elif mood=="bad":
        d.arc(points(x-13,y+26,x+13,y+46),175,360,fill=INK,width=4*S)
        ellipse(d,(x+50,y+35,x+62,y+62),"#94cce1",None)
    else:
        ellipse(d,(x-5,y+22,x+5,y+34),INK,None)
    if mood=="medium":
        ellipse(d,(x+75,y-12,x+84,y+11),"#93cfe8",None)

def char(name,mood,path):
    im,d=picture()
    hachi=name=="hachiware"
    if hachi:
        polygon(d,[(154,166),(166,51),(226,131)],BLUE)
        polygon(d,[(284,129),(348,53),(360,168)],BLUE)
    else:
        ellipse(d,(146,74,210,189),WHITE)
        ellipse(d,(301,74,365,189),WHITE)
    # Feet, SD body and arms
    ellipse(d,(192,395,235,458),WHITE)
    ellipse(d,(288,395,330,458),WHITE)
    ellipse(d,(184,295,327,430),WHITE)
    ellipse(d,(154,321,205,370),WHITE)
    ellipse(d,(309,320,360,372),WHITE)
    ellipse(d,(123,140,388,340),WHITE,w=6)
    if hachi:
        # Signature pastel blue forehead markings.
        polygon(d,[(135,161),(157,137),(211,157),(239,203),(257,223),(226,220),(194,191),(160,191)],BLUE,None)
        polygon(d,[(378,161),(356,137),(302,157),(274,203),(257,223),(288,220),(321,191),(353,191)],BLUE,None)
    eyes(d,256,249,mood)
    if hachi:
        # Fishing rod and float.
        line(d,[(354,335),(410,198),(443,124)],INK,5)
        line(d,[(443,124),(458,365)],"#b0a196",2)
        ellipse(d,(448,355,469,381),"#fa8d79",INK,3)
        if mood=="catch":
            ellipse(d,(378,390,449,425),"#85bad0",INK,3)
            polygon(d,[(444,407),(471,393),(468,427)],"#85bad0")
    else:
        if mood in ("perfect","medium","bad"):
            if mood=="bad":
                line(d,[(172,368),(145,326)],"#70ac73",6)
                polygon(d,[(142,325),(122,312),(134,292)],"#91c990")
            else:
                line(d,[(185,356),(169,248)],"#619b6f",7)
                for dx in [-22,8,28]:
                    ellipse(d,(160+dx,250,190+dx,269),"#9ed29b",INK,2)
                if mood=="perfect":
                    for dx in [-12,0,13]:line(d,[(169,355),(169+dx,379)],"#b18d69",3)
        if mood.startswith("food_"):
            y=388 if mood=="food_1" else 310 if mood=="food_2" else 165
            ellipse(d,(221,y,295,y+60),"#f4d59f",INK,4)
            ellipse(d,(243,y+9,271,y+24),"#f2a8a8",None)
    # Sparkles and marks.
    if mood in ("catch","perfect","food_3"):
        for x,y in [(99,190),(414,258),(366,86)]:
            line(d,[(x-10,y),(x+10,y)],"#f4cc68",3)
            line(d,[(x,y-10),(x,y+10)],"#f4cc68",3)
    path.parent.mkdir(parents=True,exist_ok=True)
    im.resize((512,512),Image.Resampling.LANCZOS).save(path,optimize=True)

def bg(scene,path):
    im,d=picture(600,1000,False)
    if scene=="fishing":
        d.rectangle(points(0,0,600,520),fill="#f6e2ba")
        ellipse(d,(-70,10,190,240),"#fff8e4",None)
        d.rectangle(points(0,520,600,1000),fill="#b3dce9")
        for y in range(560,1000,60):
            d.arc(points(-40,y,640,y+42),0,180,fill="#e8f8ec",width=3*S)
        for n in range(6):
            x=55+n*85
            rect(d,(x,455,x+115,532),"#ba8e6d",INK,2,r=5)
            line(d,[(x+15,468),(x+15,523)],"#8f674e",2)
    elif scene=="weeding":
        d.rectangle(points(0,0,600,1000),fill="#dcecc7")
        ellipse(d,(-50,345,660,1120),"#a8d3a1",None)
        for i in range(45):
            x=(i*53)%600;y=480+(i*97)%470
            line(d,[(x,y+16),(x+8,y)],"#5eae7c",3)
            ellipse(d,(x-4,y-9,x+13,y+7),["#f6b6b8","#efdc8a","#d5b8e9"][i%3],None)
    elif scene=="foraging":
        d.rectangle(points(0,0,600,1000),fill="#e3eccd")
        for i in range(6):
            x=25+i*118
            rect(d,(x,155,x+25,630),"#b9926c",INK,2,r=5)
            ellipse(d,(x-57,80,x+95,356),["#91c6a4","#a3ce9a","#add7ac"][i%3],INK,2)
        ellipse(d,(-90,600,680,1190),"#c4d8a1",None)
    elif scene=="room":
        d.rectangle(points(0,0,600,1000),fill="#e5efdc")
        polygon(d,[(300,130),(545,255),(545,470),(300,345)],"#fff8e9")
        polygon(d,[(300,130),(55,255),(55,470),(300,345)],"#f6e8d2")
        polygon(d,[(300,345),(545,470),(300,615),(55,470)],"#d4a373")
        for i in range(1,6):
            t=i/6
            line(d,[(55+490*t,470-125*t),(300+245*t,615-145*t)],"#e2b589",2)
        # Wall artwork, window and hanging lamp.
        polygon(d,[(127,283),(203,320),(203,394),(127,356)],"#b4d6df")
        ellipse(d,(139,301,183,354),"#fff4c2",None)
    path.parent.mkdir(parents=True,exist_ok=True)
    im.save(path,optimize=True)

def main():
    for file,name,mood in [
      ("fishing/hachiware_idle.png","hachiware","idle"),
      ("fishing/hachiware_catch.png","hachiware","catch"),
      ("weeding/chiikawa_perfect.png","chiikawa","perfect"),
      ("weeding/chiikawa_medium.png","chiikawa","medium"),
      ("weeding/chiikawa_bad.png","chiikawa","bad"),
      ("foraging/chiikawa_food_1.png","chiikawa","food_1"),
      ("foraging/chiikawa_food_2.png","chiikawa","food_2"),
      ("foraging/chiikawa_food_3.png","chiikawa","food_3")
    ]:char(name,mood,BASE/file)
    for scene,file in [("fishing","fishing/bg_dock.png"),("weeding","weeding/bg_meadow.png"),
                       ("foraging","foraging/bg_forest.png"),("room","room/bg_isometric_room.png")]:
        bg(scene,BASE/file)
    # Optional vertical atlas sheets: 3 equal 512x512 panels in one 512x1536 PNG.
    # This preserves the independent character sprites and supports user-provided
    # 3-panel illustrations with the same 0/1/2 panel mapping.
    for output,parts in [
        ("weeding/chiikawa_3state_atlas.png",[
            "weeding/chiikawa_perfect.png","weeding/chiikawa_medium.png",
            "weeding/chiikawa_bad.png"]),
        ("foraging/chiikawa_3stage_atlas.png",[
            "foraging/chiikawa_food_1.png","foraging/chiikawa_food_2.png",
            "foraging/chiikawa_food_3.png"])
    ]:
        sheet=Image.new("RGBA",(512,1536),(0,0,0,0))
        for index,name in enumerate(parts):
            with Image.open(BASE/name) as source:
                assert source.size==(512,512),name
                sheet.alpha_composite(source.convert("RGBA"),(0,index*512))
        sheet.save(BASE/output,optimize=True)
    print("Generated 14 Canvas PNG assets: 8 character images, 4 scenes and 2 three-panel atlases")

if __name__=="__main__":
    main()
