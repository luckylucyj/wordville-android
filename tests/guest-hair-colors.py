"""Regression checks: three guest residents keep their intended hair colors."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'app/src/main/assets/guest-residents'
IDS = ('chiikawa', 'hachiware', 'usagi', 'rakko', 'kurimanju',
       'momo', 'toshiro', 'aizen', 'homura', 'madoka')
HAIR = {'momo': '#453444', 'homura': '#24232b', 'madoka': '#f092ba'}
CELL = 48
idle = Image.open(ART / 'idle.png').convert('RGBA')
walk = Image.open(ART / 'walk.png').convert('RGBA')
portraits = Image.open(ART / 'portraits.png').convert('RGB')
assert idle.size == (CELL, len(IDS) * 8 * CELL)
assert walk.size == (CELL * 8, len(IDS) * 8 * CELL)
assert portraits.size == (320, 128)

def rgb(value):
    return tuple(bytes.fromhex(value.removeprefix('#')))

for resident, color in HAIR.items():
    index = IDS.index(resident)
    target = rgb(color)
    row = idle.crop((0, index * 8 * CELL, CELL, (index * 8 + 1) * CELL))
    amount = sum(1 for px in row.getdata() if px[:3] == target and px[3] > 0)
    assert amount > 20, f'{resident}: missing {color} in front-facing idle sprite'
    portrait = portraits.crop((index % 5 * 64, index // 5 * 64,
                               (index % 5 + 1) * 64, (index // 5 + 1) * 64))
    amount = sum(1 for px in portrait.getdata() if px == target)
    assert amount > 20, f'{resident}: portrait must match walking sprite hair'
    for direction in range(8):
        y = (index * 8 + direction) * CELL
        sample = walk.crop((0, y, CELL, y + CELL))
        assert sample.getbbox() is not None, f'{resident}: empty movement frame'

# The high bun must be visibly part of Momo's dark hairstyle, not light fabric.
momo = idle.crop((0, IDS.index('momo') * 8 * CELL,
                  CELL, (IDS.index('momo') * 8 + 1) * CELL))
assert sum(1 for px in momo.crop((16, 2, 31, 8)).getdata()
           if px[:3] == rgb(HAIR['momo']) and px[3] > 0) > 3
print('PASS: Momo dark bun/full side hair, Madoka pink hair, Homura black hair')
