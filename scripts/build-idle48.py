#!/usr/bin/env python3
"""Build 8-direction standing/idle sprite atlases from Wordville's walk48 sources.

Residents: 12. Every native cell is 48x48 with an invariant foot anchor
(24, 43). Unlike walking contact/down/passing/up, an idle loop has two
planted feet: tiny upper-body breathing/sway never advances foot positions.
Run AFTER scripts/build-walk48.py.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib
import json

ASSETS = Path(__file__).resolve().parents[1] / "app/src/main/assets"
WALK = ASSETS / "walk48"
OUT = ASSETS / "idle48"
OUT.mkdir(parents=True, exist_ok=True)
IDS = ["alex", "elliott", "harvey", "sam", "sebastian", "shane",
       "haley", "leah", "maru", "penny", "abigail", "emily"]
DIRECTIONS = ["down", "down-right", "right", "up-right",
              "up", "up-left", "left", "down-left"]
SIZE = 48
ANCHOR = (24, 43)
# Neutral -> inhale -> small sway -> exhale. Both feet remain planted.
POSTURES = [(0, 0), (0, -1), (1, -1), (-1, 0)]
POSTURE_NAMES = ["neutral", "inhale", "sway", "exhale"]
FOOT_CENTERS = (19, 29)
PANT_HIP_Y = 33


def bounds(img):
    return img.getchannel("A").point(lambda a: 255 if a >= 140 else 0).getbbox()


def palette(img):
    points = [img.getpixel((x, y)) for y in range(31, 43)
              for x in range(16, 33)
              if img.getpixel((x, y))[3] > 180]
    if not points:
        raise ValueError("no opaque waist/leg colors in source")
    points.sort(key=lambda rgba: sum(rgba[:3]))
    shoes = [img.getpixel((x, y)) for y in range(39, 44)
             for x in range(11, 37)
             if img.getpixel((x, y))[3] > 180]
    shoes.sort(key=lambda rgba: sum(rgba[:3]))
    return (points[int((len(points)-1)*.58)],
            shoes[int((len(shoes)-1)*.2)] if shoes else points[0],
            points[0])


def standing_pose(base, posture):
    dx, dy = POSTURES[posture]
    pants, shoes, ink = palette(base)
    img = Image.new("RGBA", (SIZE, SIZE))
    d = ImageDraw.Draw(img)
    # Two independent, parallel legs. The ankle centers are *constant* in
    # all four frames and the foot sole always rests at source y=43.
    for sign, foot in ((-1, FOOT_CENTERS[0]), (1, FOOT_CENTERS[1])):
        hipx = 24 + sign * 3 + dx
        knee = 24 + sign * 4
        d.line([(hipx, PANT_HIP_Y+dy), (knee, 38),
                (foot, 41)], fill=ink, width=6)
        d.line([(hipx, PANT_HIP_Y+dy), (knee, 38),
                (foot, 41)], fill=pants, width=4)
        d.rectangle((foot-3, 41, foot+3, 43), fill=ink)
        d.line([(foot-2, 42), (foot+2, 42)], fill=shoes, width=1)
    # Preserve authentic source face, hair and clothing. Do not move shoes.
    # The waist overlaps the leg origins, so the torso stays connected.
    top = base.crop((0, 0, SIZE, PANT_HIP_Y+3))
    img.alpha_composite(top, (dx, dy))
    return img


audit = []
for resident in IDS:
    src = Image.open(WALK / (resident + ".png")).convert("RGBA")
    assert src.size == (384, 384), (resident, src.size)
    atlas = Image.new("RGBA", (SIZE*len(POSTURES), SIZE*len(DIRECTIONS)))
    for row, direction in enumerate(DIRECTIONS):
        # Source walk contact frame supplies the original costume, not the
        # walking feet. Walking feet are replaced by planted standing feet.
        base = src.crop((0, row*SIZE, SIZE, (row+1)*SIZE))
        hashes = []
        for k in range(len(POSTURES)):
            frame = standing_pose(base, k)
            b = bounds(frame)
            assert b and b[0] >= 0 and b[1] >= 0 and b[2] <= 48 and b[3] == 44, (resident, direction, k, b)
            assert all(frame.getpixel((x, ANCHOR[1]))[3] > 160 for x in FOOT_CENTERS), (resident, direction, k, "missing feet")
            h = hashlib.sha256(frame.tobytes()).hexdigest()
            hashes.append(h)
            atlas.alpha_composite(frame, (k*SIZE, row*SIZE))
            audit.append({"character": resident, "direction": direction,
                          "frame": k, "posture": POSTURE_NAMES[k],
                          "anchor": list(ANCHOR), "bbox": list(b),
                          "feet": [[x, ANCHOR[1]] for x in FOOT_CENTERS]})
        assert len(set(hashes)) == len(POSTURES), (resident, direction, "duplicate idle posture")
    atlas.save(OUT / (resident + ".png"), optimize=True)

assert len(audit) == 12*8*4
(OUT / "audit.json").write_text(json.dumps({
    "resident_count": 12, "direction_count": 8, "frames_per_direction": 4,
    "total_frames": len(audit), "cell_size": [SIZE, SIZE],
    "sheet_size": [SIZE*4, SIZE*8], "anchor": list(ANCHOR),
    "fps": 2.5, "postures": POSTURE_NAMES,
    "foot_centers": [[x, ANCHOR[1]] for x in FOOT_CENTERS],
    "feet_fixed": True, "source": "walk48 first frame, with new neutral planted legs",
    "frames": audit
}, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
print("WORDVILLE_IDLE_PASS 12 residents x 8 directions x 4 poses = 384; 48px cell, y43 feet planted")
