"""Check reference colors and the gait of Momo and Toshiro's map sprites."""
from pathlib import Path
from PIL import Image, ImageOps

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
    map_color = rgb('#323745') if resident == 'momo' else target
    row = idle.crop((0, index * 8 * CELL, CELL, (index * 8 + 1) * CELL))
    amount = sum(1 for px in row.getdata() if px[:3] == map_color and px[3] > 0)
    assert amount > 20, f'{resident}: missing intended hair color in front-facing idle sprite'
    portrait = portraits.crop((index % 5 * 64, index // 5 * 64,
                               (index % 5 + 1) * 64, (index // 5 + 1) * 64))
    amount = sum(1 for px in portrait.getdata() if px == target)
    assert amount > 20, f'{resident}: portrait must keep its intended hair color'
    for direction in range(8):
        y = (index * 8 + direction) * CELL
        sample = walk.crop((0, y, CELL, y + CELL))
        assert sample.getbbox() is not None, f'{resident}: empty movement frame'

def frames(sheet, resident, direction):
    y = (IDS.index(resident) * 8 + direction) * CELL
    return [sheet.crop((x, y, x + CELL, y + CELL)) for x in range(0, sheet.width, CELL)]


for resident, hair in (('momo', '#323745'), ('toshiro', '#e4eff4')):
    for direction in range(8):
        cycle = frames(walk, resident, direction)
        assert len({frame.tobytes() for frame in cycle}) == 8, (resident, direction)
        for frame in cycle + frames(idle, resident, direction):
            left, top, right, bottom = frame.getbbox()
            assert 0 < left < right < CELL and 0 < top < 8 and bottom == 44, (resident, direction)
            assert (*rgb(hair), 255) in frame.crop((0, 0, CELL, 18)).getdata(), (resident, direction)
        if direction > 4:
            other = frames(walk, resident, 8 - direction)
            assert all(a.tobytes() == ImageOps.mirror(b).tobytes() for a, b in zip(cycle, other))

momo = frames(idle, 'momo', 2)[0]
assert (*rgb('#323745'), 255) in momo.crop((12, 4, 22, 8)).getdata(), 'Momo needs a visible rear bun'
toshiro = frames(idle, 'toshiro', 0)[0]
assert (*rgb('#4488bd'), 255) in toshiro.crop((12, 25, 33, 35)).getdata(), 'Toshiro needs his blue cord'
print('PASS: guest portrait palettes and Momo/Toshiro 8-direction walk and idle cells')
