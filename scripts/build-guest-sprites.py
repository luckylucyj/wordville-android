"""Draw guest resident art on the game's native 48 px grid."""
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

ASSETS = Path(__file__).resolve().parents[1] / 'app/src/main/assets/guest-residents'
CELL = 48
GROUND = 43
INK = '#372936'
FACE = '#f6d3b8'
SHADE = '#d9a492'
IDS = ('chiikawa', 'hachiware', 'usagi', 'rakko', 'kurimanju',
       'momo', 'toshiro', 'aizen', 'homura', 'madoka')
FUR = {
    'chiikawa': ('#fff9f0', '#e1d2dc', '#f7afbc'),
    'hachiware': ('#fff9f0', '#d9dfef', '#568dca'),
    'usagi': ('#ffea9f', '#dfb86e', '#f7baaa'),
    'rakko': ('#fff4de', '#dfc8ae', '#a57d6e'),
    'kurimanju': ('#ffedc3', '#e5c897', '#a1694a'),
}
CLOTHES = {
    'momo': ('#242135', '#4b4058', '#716077', '#292938', '#494657', '#f4e9df', '#58465a'),
    'toshiro': ('#a8c3d1', '#e5eff2', '#ffffff', '#282e41', '#f0efe5', '#79b5ae', '#31374b'),
    'aizen': ('#4b3441', '#815644', '#ac7552', '#332b31', '#f2e4d3', '#ede9df', '#4c3c46'),
    'homura': ('#241f3d', '#46325f', '#6b5185', '#3c3150', '#e5dfee', '#a47bc1', '#504267'),
    'madoka': ('#9d405f', '#de749b', '#f9a0bd', '#ac4868', '#ffe1e7', '#d84e71', '#d85877'),
}
# Per-foot offsets: contact, down, passing, up, then the opposite lead.
STRIDE = ((-3, 3), (-2, 2), (0, 0), (2, -2), (3, -3), (2, -2), (0, 0), (-2, 2))
RISE = ((0, -2), (0, -3), (0, -4), (0, -2), (-2, 0), (-3, 0), (-4, 0), (-2, 0))
BOB = (0, 1, 0, -1, 0, 1, 0, -1)


def sprite(resident, direction, frame=None):
    if direction > 4:
        return ImageOps.mirror(sprite(resident, 8 - direction, frame))

    image = Image.new('RGBA', (CELL, CELL))
    draw = ImageDraw.Draw(image)
    bob = BOB[frame] if frame is not None else 0
    stride = STRIDE[frame] if frame is not None else (0, 0)
    rise = RISE[frame] if frame is not None else (0, 0)
    rear = direction >= 3
    side = direction == 2
    tilt = (0, 3, 5, 3, 0)[direction]

    def poly(points, fill, outline=None, offset=0):
        draw.polygon([(x + offset, y + bob) for x, y in points], fill, outline)

    def rect(box, fill, offset=0):
        a, b, c, d = box
        draw.rectangle((a + offset, b + bob, c + offset, d + bob), fill)

    def oval(box, fill, outline=None, offset=0):
        a, b, c, d = box
        draw.ellipse((a + offset, b + bob, c + offset, d + bob), fill, outline)

    def feet(color, light, compact):
        for index, neutral in enumerate((19, 27)):
            dx = stride[index] if side else 0
            dy = rise[index]
            if direction == 1 or direction == 3:
                dx = round(stride[index] / 2)
            x = neutral + dx
            bottom = GROUND + dy
            top = (36 if compact else 33) + bob
            draw.polygon([(neutral - 2, top), (neutral + 2, top),
                          (x + 3, bottom - 2), (x + 3, bottom),
                          (x - 3, bottom), (x - 3, bottom - 2)], color, INK)
            if bottom >= top + 3:
                draw.line((x - 1, bottom - 1, x + 1, bottom - 1), light)

    if resident in FUR:
        light, shade, accent = FUR[resident]
        feet(shade, light, True)
        if resident == 'hachiware' and direction:
            poly([(12, 34), (8, 36), (6, 32), (7, 27), (10, 29), (10, 33), (15, 33)],
                 '#598acd', INK)
        if resident == 'rakko' and rear:
            oval((20, 35, 27, 41), '#b3927d', INK)
        oval((11, 25, 36, 40), shade, INK)
        oval((15, 27, 34, 38), light)
        for index, x in enumerate((12, 33)):
            arm_shift = (1 if stride[index] > 0 else -1) if frame is not None else 0
            oval((x, 30 + arm_shift, x + 4, 36 + arm_shift), light, INK)

        shift = tilt - (2 if rear and tilt else 0)
        if resident == 'usagi':
            for x, top in ((14, 3), (26 if not side else 23, 4)):
                poly([(x, 22), (x - 2, top + 4), (x, top), (x + 4, top),
                      (x + 6, top + 4), (x + 7, 22)], light, INK, shift)
                if not rear:
                    rect((x + 1, top + 5, x + 3, 17), accent, shift)
        elif resident == 'hachiware':
            for points in ([(10, 18), (10, 6), (13, 4), (21, 13)],
                           [(27, 13), (34, 4), (37, 6), (37, 19)]):
                poly(points, accent, INK, shift)
            if not rear:
                poly([(12, 11), (13, 7), (17, 13)], '#b7b9df', offset=shift)
                poly([(31, 13), (35, 7), (36, 12)], '#b7b9df', offset=shift)
        else:
            ear_color = accent if resident == 'kurimanju' else light
            oval((10, 5, 20, 16), ear_color, INK, shift)
            oval((27, 5, 37, 16), ear_color, INK, shift)
            if not rear and resident != 'kurimanju':
                oval((13, 8, 17, 12), '#e6bcb5', offset=shift)
                oval((30, 8, 34, 12), '#e6bcb5', offset=shift)
        top = 15 if resident == 'usagi' else 10
        cheek_right = 35 if not side else 32
        poly([(8, 23), (10, top + 5), (16, top + 1), (22, top),
              (30, top + 1), (36, top + 5), (39 if not side else 37, 24),
              (38, 28), (34, 32), (15, 33), (10, 30)], shade, INK, shift)
        oval((10, top + 2, 37 if not side else 36, 30), light, offset=shift)
        if resident == 'hachiware':
            poly([(11, 16), (16, 12), (24, 11), (22, 15), (17, 19), (11, 22)], accent, offset=shift)
            poly([(25, 11), (32, 12), (36, 16), (37, 21), (32, 19), (28, 17)], '#477fb9', offset=shift)
            if rear:
                oval((15, 13, 34, 23), accent, offset=shift)
        if resident == 'kurimanju':
            poly([(10, 21), (11, 16), (16, 12), (22, 11), (29, 12), (35, 15),
                  (37, 19), (32, 17), (25, 17), (18, 19)], accent, offset=shift)
            rect((18, 13, 27, 14), '#c38d5e', shift)
        if rear:
            return image
        face = 3 if direction == 1 else 0
        if not side:
            rect((16, 22, 17, 24), INK, shift + face)
            oval((12, 25, 17, 27), '#efadb5', offset=shift + face)
        rect((28 if not side else 30, 22, 29 if not side else 31, 24), INK, shift + face)
        oval((cheek_right - 6, 25, cheek_right - 1, 27), '#efadb5', offset=shift)
        mouth_x = 23 + face + (8 if side else 0)
        if resident == 'usagi':
            oval((mouth_x - 2, 25, mouth_x + 2, 29), INK, offset=shift)
            rect((mouth_x - 1, 27, mouth_x + 1, 28), '#eb899e', shift)
        else:
            poly([(mouth_x - 2, 25), (mouth_x, 26), (mouth_x + 2, 25),
                  (mouth_x + 1, 27), (mouth_x - 1, 27)], INK, offset=shift)
        if resident == 'chiikawa':
            rect((18, 19, 19, 19), '#8a6873', shift + face)
            rect((27, 19, 28, 19), '#8a6873', shift + face)
        if resident == 'rakko':
            poly([(15, 17), (17, 19), (19, 17), (19, 18), (17, 20), (15, 18)],
                 '#9c7367', offset=shift)
            if not side:
                rect((14, 21, 17, 21), INK, shift + face)
        if resident == 'kurimanju':
            rect((14, 20, 19, 21), '#6d453c', shift + face)
            rect((27, 20, 31, 21), '#6d453c', shift + face)
        return image

    dark, hair, shine, robe, outer, trim, boot = CLOTHES[resident]
    feet(boot, trim, False)
    for index, x in enumerate((14, 30)):
        lift = round(stride[index] / 2)
        poly([(x, 25), (x + 5, 25), (x + 5, 29 + lift),
              (x + 3, 34 + lift), (x - 1, 33 + lift)], outer if resident != 'momo' else robe, INK)
        rect((x, 32 + lift, x + 2, 33 + lift), FACE)
    poly([(17, 24), (29, 24), (32, 27), (31, 32), (34, 38),
          (29, 39), (23, 37), (18, 39), (13, 38), (16, 32), (15, 28)], robe, INK)
    if resident == 'madoka':
        poly([(19, 25), (27, 25), (29, 31), (34, 35), (32, 38), (26, 37),
              (23, 39), (19, 37), (14, 38), (12, 35), (17, 32)], outer, INK)
        rect((17, 34, 29, 35), '#fff6ef')
        rect((20, 31, 25, 32), trim)
    elif resident == 'homura':
        poly([(16, 25), (30, 25), (31, 32), (26, 34), (20, 34), (16, 32)], outer, offset=0)
        poly([(15, 36), (23, 34), (31, 36), (32, 38), (15, 38)], trim)
        rect((20, 30, 26, 31), trim)
        rect((17, 39, 18, 40), '#9579ae')
        rect((28, 39, 29, 40), '#9579ae')
    elif resident in ('toshiro', 'aizen'):
        if rear:
            poly([(16, 25), (31, 25), (32, 33), (34, 38), (13, 38)], outer, INK)
            poly([(23, 28), (26, 31), (23, 34), (20, 31)], '#627181')
        else:
            poly([(15, 25), (19, 26), (21, 32), (18, 38), (13, 38), (15, 31)], outer, INK)
            poly([(28, 26), (32, 25), (33, 38), (28, 38), (26, 32)], outer, INK)
        if resident == 'toshiro':
            poly([(18, 27), (20, 26), (29, 33), (27, 34)], trim)
    if not rear and resident != 'madoka':
        poly([(18, 25), (20, 25), (24, 28), (28, 25), (29, 26), (24, 31)], '#f8eee5')
        if resident == 'momo':
            rect((17, 32, 29, 33), trim)
            rect((17, 34, 29, 34), '#99837b')

    shift = tilt
    if resident == 'homura':
        poly([(12, 15), (34, 14), (35, 23), (37, 33), (35, 37), (30, 37),
              (27, 28), (17, 28), (16, 37), (10, 37), (11, 27)], hair, INK, shift)
        if rear:
            poly([(12, 15), (34, 14), (37, 33), (34, 37), (29, 36), (25, 38),
                  (18, 36), (10, 37), (11, 27)], hair, INK, shift)
            rect((15, 20, 15, 33), shine, shift)
            rect((30, 20, 31, 34), dark, shift)
    elif resident == 'madoka':
        for x in (9, 31):
            poly([(x, 10), (x + 7, 10), (x + 8, 19), (x + 6, 27), (x + 1, 25),
                  (x - 1, 20)], hair, INK, shift)
            rect((x + 2, 15, x + 3, 23), shine, shift)
    elif resident == 'momo':
        oval((15, 3, 29, 15), '#f4e9dd', INK, shift)
        poly([(17, 7), (18, 5), (23, 4), (27, 6), (26, 9), (20, 10)], '#d6c8c6', offset=shift)
    if resident == 'toshiro':
        head = [(11, 20), (11, 13), (9, 10), (15, 11), (14, 5), (20, 8),
                (22, 3), (26, 7), (31, 4), (31, 8), (37, 7), (34, 12),
                (39, 13), (36, 17), (36, 23), (30, 26), (15, 25)]
    else:
        head = [(10, 17), (11, 12), (15, 8), (21, 6), (28, 6), (34, 9),
                (37, 15), (37, 22), (34, 26), (28, 27), (17, 27), (11, 23)]
    poly(head, hair, INK, shift)
    poly([(13, 13), (17, 10), (22, 8), (28, 8), (32, 10), (31, 12),
          (25, 11), (21, 11), (15, 15)], shine, offset=shift)
    if resident == 'madoka':
        for x in (9, 31):
            poly([(x, 9), (x + 3, 10), (x + 6, 8), (x + 7, 13), (x + 3, 12), (x, 13)],
                 '#d14564', INK, shift)
    if rear:
        if resident == 'momo':
            oval((16, 11, 29, 22), '#f2e6da', INK, shift)
            rect((19, 14, 25, 15), '#d5c6c4', shift)
        if resident == 'homura':
            rect((12, 16, 15, 16), '#8f76ae', shift)
            rect((33, 16, 35, 16), '#8f76ae', shift)
        return image
    if side:
        face = [(22, 16), (27, 14), (32, 15), (35, 18), (38, 20), (35, 21),
                (35, 24), (31, 27), (23, 26), (20, 23)]
    else:
        face = [(14, 17), (18, 14), (23, 15), (28, 14), (33, 17),
                (34, 22), (31, 25), (28, 27), (20, 27), (15, 24)]
    poly(face, FACE, offset=shift)
    rect((21 if not side else 27, 25, 29 if not side else 33, 25), SHADE, shift)
    if resident == 'aizen':
        poly([(13, 14), (20, 10), (28, 10), (32, 13), (28, 14), (23, 13),
              (21, 16), (20, 19), (18, 20), (19, 15)], hair, offset=shift)
    elif resident == 'toshiro':
        poly([(12, 14), (18, 11), (29, 10), (35, 13), (30, 14), (28, 17),
              (24, 14), (21, 18), (20, 15), (15, 18)], shine, offset=shift)
    else:
        poly([(11, 15), (16, 11), (29, 11), (35, 15), (32, 17), (29, 15),
              (25, 18), (24, 14), (20, 17), (18, 16), (13, 20)], hair, offset=shift)
    if resident == 'homura':
        rect((14, 12, 33, 12), '#8f76ae', shift)
    iris = {'momo': '#715062', 'toshiro': '#3e9798', 'aizen': '#6f4c42',
            'homura': '#7654a0', 'madoka': '#b34977'}[resident]
    eyes = (30,) if side else (18 + (2 if direction == 1 else 0), 28 + (1 if direction == 1 else 0))
    for x in eyes:
        rect((x - 1, 19, x + 2, 19), INK, shift)
        rect((x, 20, x + 1, 22), iris, shift)
        rect((x - 1, 22, x - 1, 22), '#fff8ef', shift)
        if resident == 'aizen':
            draw.rectangle((x - 2 + shift, 18 + bob, x + 3 + shift, 22 + bob), outline=dark)
    if resident == 'aizen' and not side:
        rect((21, 19, 25, 19), dark, shift)
    if resident == 'madoka':
        rect((14 if not side else 25, 23, 16 if not side else 27, 23), '#e29697', shift)
    rect((32 if side else 23, 24, 33 if side else 24, 24), '#ac686b', shift)
    return image


def build():
    ASSETS.mkdir(parents=True, exist_ok=True)
    walk = Image.new('RGBA', (8 * CELL, len(IDS) * 8 * CELL))
    idle = Image.new('RGBA', (CELL, walk.height))
    portraits = Image.new('RGB', (5 * 64, 2 * 64), '#fff7e8')
    for i, resident in enumerate(IDS):
        for direction in range(8):
            y = (i * 8 + direction) * CELL
            idle.paste(sprite(resident, direction), (0, y))
            for frame in range(8):
                walk.paste(sprite(resident, direction, frame), (frame * CELL, y))
        portrait = sprite(resident, 0).crop((8, 2, 40, 34)).resize((64, 64), Image.Resampling.NEAREST)
        portraits.paste(portrait, (i % 5 * 64, i // 5 * 64), portrait)
    walk.save(ASSETS / 'walk.png', optimize=True)
    idle.save(ASSETS / 'idle.png', optimize=True)
    portraits.save(ASSETS / 'portraits.png', optimize=True)


if __name__ == '__main__':
    build()
