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
RAKKO_FUR = ('#fff4de', '#dfc8ae')
CLOTHES = {
    'momo': ('#28222e', '#453444', '#766074', '#292938', '#494657', '#f4e9df', '#58465a'),
    'toshiro': ('#a8c3d1', '#e5eff2', '#ffffff', '#282e41', '#f0efe5', '#79b5ae', '#31374b'),
    'aizen': ('#4b3441', '#815644', '#ac7552', '#332b31', '#f2e4d3', '#ede9df', '#4c3c46'),
    'homura': ('#181820', '#24232b', '#45434f', '#3c3150', '#e5dfee', '#a47bc1', '#504267'),
    'madoka': ('#9d405f', '#f092ba', '#ffd0df', '#ac4868', '#ffe1e7', '#d84e71', '#d85877'),
}
# Per-foot offsets: contact, down, passing, up, then the opposite lead.
STRIDE = ((-3, 3), (-2, 2), (0, 0), (2, -2), (3, -3), (2, -2), (0, 0), (-2, 2))
RISE = ((0, -2), (0, -3), (0, -4), (0, -2), (-2, 0), (-3, 0), (-4, 0), (-2, 0))
BOB = (0, 1, 0, -1, 0, 1, 0, -1)


# These residents share rounded, continuous silhouettes. Ear and cap contours
# attach to the face so there is no separate band between the head and body.
STORYBOOK_FUR = {
    'chiikawa': ('#fffdfb', '#e9e2e6'),
    'hachiware': ('#fffdfb', '#e3ebef'),
    'usagi': ('#fff0c6', '#f2d99d'),
    'kurimanju': ('#ffebca', '#f2dab3'),
}
CHESTNUT_CAP = ((37, 12.4), (30.8, 3.5, 17, 3.3, 11, 12.7))
STORYBOOK_CROWNS = {
    'chiikawa': ((36, 13), (37, 8, 34, 6, 31, 8), (30, 8, 29, 10, 29, 11),
                 (26, 10, 22, 10, 19, 11), (18, 7, 14, 7, 13, 9),
                 (12, 10, 12, 13, 13, 14)),
    'hachiware': ((38, 16), (36, 14, 37, 9, 34, 7), (32, 6, 30, 9, 28, 11),
                  (25, 10, 22, 10, 20, 11), (18, 10, 15, 6, 13, 7),
                  (11, 8, 11, 13, 10, 15)),
    'usagi': ((29, 16), (31, 11, 33, 5, 31, 3), (28, 1, 26, 9, 25, 15),
              (24, 15, 23, 15, 22, 15), (22, 10, 23, 3, 21, 3),
              (18, 2, 16, 9, 17, 16)),
    'kurimanju': ((39, 15.6), (43, 15, 42.5, 12, 37, 12.4),
                  CHESTNUT_CAP[1], (5, 12.5, 5.3, 16.1, 9, 15.7)),
}


def storybook_sprite(resident, direction, frame=None, portrait=False):
    scale = 6
    image = Image.new('RGBA', (CELL * scale, CELL * scale))
    draw = ImageDraw.Draw(image)
    fur, shade = STORYBOOK_FUR[resident]
    ink, blue, blush = '#31252a', '#7da7bb', '#f6b5c0'
    bob = BOB[frame] if frame is not None else 0
    stride = STRIDE[frame] if frame is not None else (0, 0)
    rise = RISE[frame] if frame is not None else (0, 0)
    side, rear = direction == 2, direction >= 3
    width = (1, .94, .82, .94, 1)[direction]
    crown = STORYBOOK_CROWNS[resident]
    chestnut = resident == 'kurimanju'

    def point(x, y):
        return (round(((x - 24) * width + 24) * scale), round((y + bob) * scale))

    def path(segments, fill=None, stroke=0):
        x, y = segments[0]
        points = [point(x, y)]
        for a, b, c, d, u, v in segments[1:]:
            for n in range(1, 13):
                t = n / 12
                s = 1 - t
                points.append(point(s**3*x + 3*s*s*t*a + 3*s*t*t*c + t**3*u,
                                    s**3*y + 3*s*s*t*b + 3*s*t*t*d + t**3*v))
            x, y = u, v
        if fill:
            draw.polygon(points, fill=fill)
            if stroke:
                points.append(points[0])
        if stroke:
            draw.line(points, fill=ink, width=round(scale * stroke), joint='curve')
            for a, b in (points[0], points[-1]):
                r = scale * stroke / 2
                draw.ellipse((a - r, b - r, a + r, b + r), fill=ink)

    def oval(x, y, w, h, color, stroke=0):
        draw.ellipse((*point(x - w / 2, y - h / 2), *point(x + w / 2, y + h / 2)),
                     fill=color, outline=ink if stroke else None, width=round(scale * stroke))

    if resident == 'hachiware' and direction == 0:
        path(((33, 37), (36, 37, 38, 35, 40, 35), (45, 35, 43, 41, 39, 41),
              (37, 41, 35, 40, 33, 39)), blue, 1.45)
    elif resident == 'hachiware':
        path(((15, 36), (13, 36, 11, 36, 9, 35), (3, 32, 3, 38, 7, 40),
              (9, 41, 13, 40, 16, 38)), blue, 1.45)
    elif resident == 'usagi' and 0 < direction < 4:
        oval(11, 37, 7, 6, '#fffdfb', 1.35)

    # Anchor the feet to the same ground line in every view while the body bobs.
    centers = (15, 31) if side else (16, 32) if chestnut else (18, 29)
    for i, center in sorted(enumerate(centers), key=lambda item: rise[item[0]]):
        foot_x = center + stride[i] * (0.75 if side else 0.35)
        foot_y = GROUND + rise[i] - bob - 1.7
        oval(foot_x, foot_y, 5.5, 5, fur, 1.45)

    arm_left = 0 if frame is None else stride[1] * .45
    arm_right = 0 if frame is None else stride[0] * .45
    right_crown_x, right_crown_y = crown[0]
    left_crown_x, left_crown_y = crown[-1][-2:]
    if chestnut:
        path((*crown,
              (3, 21, 3, 29, 11, 32),
              (10, 34 + arm_left, 10, 38 + arm_left, 13.5, 36),
              (14.5, 42, 33.5, 42, 34.5, 36),
              (38, 38 + arm_right, 38, 34 + arm_right, 37, 32),
              (45, 28, 46, 22, 39, 15.6)), fur, 1.65)
        path(((13.5, 36), (14, 35, 14, 34, 14, 34 + arm_left)), stroke=1.05)
        path(((34.5, 36), (34, 35, 34, 34, 34, 34 + arm_right)), stroke=1.05)
        edge = {
            0: ((16, 20.3, 31.8, 21.1, 37, 12.4),),
            1: ((17, 21.2, 32.5, 20.1, 37, 12.4),),
            2: ((15, 21.5, 31.2, 20.1, 37, 12.4),),
            3: ((15.9, 22.4, 31.5, 23, 37, 12.4),),
            4: ((16, 23, 32, 23, 37, 12.4),),
        }[direction]
        path((*CHESTNUT_CAP, *edge), '#a2745b', 1.55)
    else:
        path((crown[0], *crown[1:],
              (3, left_crown_y + 4, 3, 27, 9, 32),
              (5, 32 + arm_left, 5, 36 + arm_left, 11, 35),
              (12, 41.5, 33, 43, 36, 35),
              (41, 36 + arm_right, 43, 33 + arm_right, 38, 32),
              (45, 27, 44, right_crown_y + 5, right_crown_x, right_crown_y)), fur, 1.65)
        path(((13, 37), (18, 41, 29, 42, 34, 37), (32, 42, 17, 43, 13, 37)), shade)

    if resident == 'hachiware':
        edge = ((12, 20, 19, 21, 24, 16), (29, 21, 35, 21, 38, 16))
        if side:
            edge = ((14, 23, 22, 23, 29, 17), (32, 18, 35, 19, 38, 16))
        elif rear:
            edge = ((15, 24, 33, 24, 38, 16),)
        elif direction == 1:
            edge = ((14, 21, 22, 21, 27, 16), (31, 20, 35, 20, 38, 16))
        path((*crown, *edge), blue, 1.55)
    if direction == 4 and resident in ('chiikawa', 'usagi'):
        oval(24, 37.5, 6 if resident == 'usagi' else 5, 5, '#fffdfb', 1.2)
    if resident == 'usagi' and not rear:
        path(((18.7, 14), (17.8, 10, 19, 4.5, 20.3, 4.5),
              (21.7, 4.6, 19.6, 11.2, 19.6, 14)), blush)
        path(((26.1, 14), (26.6, 10, 29, 4, 30.2, 4.4),
              (31.4, 5.3, 28.4, 12, 27.4, 14)), blush)
    if not rear:
        shift = (0, 4, 8)[direction]
        face_y = -1.7 if chestnut else 1 if resident == 'usagi' else 0
        eyes = (21 + shift,) if side else (18 + shift, 29 + shift * .66)
        cheeks = (16 + shift,) if side else (13 + shift, 34 + shift * .70)
        cheek_marks = (-2.45, -.85, .85, 2.45) if chestnut and portrait else (-1.55, 0, 1.55)
        for cheek in cheeks:
            oval(cheek, 28 + face_y, 7.5 if chestnut else 6.8, 4.7, blush)
            for dx in cheek_marks:
                x, y = cheek + dx, 28 + face_y
                path(((x - .35, y + .75), (x, y, x, y, x + .35, y - .75)), stroke=.75)
        for x in eyes:
            y = 24.8 + face_y
            if chestnut:
                oval(x, y, 4.1, 4.25, ink)
            else:
                oval(x, y, 4.8, 4.95, ink)
            oval(x - .25, y - .70, 2.25, 1.85, '#fffdfb')
            oval(x + .1, y + 1.3, 1.45, .65, '#fffdfb')
            if resident == 'usagi':
                sign = 1 if x == eyes[0] else -1
                path(((x - 3.5*sign, y - 3), (x - 3*sign, y - 5.2, x - sign, y - 6.1,
                      x + 1.8*sign, y - 6.4)), stroke=1.05)
            elif not chestnut:
                sign = 1 if x == eyes[0] else -1
                path(((x - 1.3*sign, y - 4.5), (x - .6*sign, y - 5.1, x, y - 5.1,
                      x + .5*sign, y - 5)), stroke=.85)
        mouth_x, mouth_y = 23.6 + shift, 29 + face_y
        if resident == 'usagi':
            path(((mouth_x - 2.1, mouth_y), (mouth_x - 1.4, mouth_y + 6.4,
                  mouth_x + 1.4, mouth_y + 6.4, mouth_x + 2.1, mouth_y)), '#f191a7', 1.1)
        path(((mouth_x - 3, mouth_y), (mouth_x - 2.6, mouth_y + 2, mouth_x - .2, mouth_y + 2,
              mouth_x, mouth_y - .9), (mouth_x + .2, mouth_y + 2, mouth_x + 2.6, mouth_y + 2,
              mouth_x + 3, mouth_y)), stroke=1.25)
        if resident != 'usagi':
            path(((mouth_x - .7, mouth_y + 3.1), (mouth_x - .35, mouth_y + 3.5,
                  mouth_x + .35, mouth_y + 3.5, mouth_x + .7, mouth_y + 3.1)), stroke=.8)
    if portrait:
        crop = (1, 0, 47, 46) if resident == 'usagi' else (3, 4, 45, 46)
        return image.crop(tuple(edge * scale for edge in crop)).resize(
            (64, 64), Image.Resampling.LANCZOS)
    return image.resize((CELL, CELL), Image.Resampling.NEAREST)


def sprite(resident, direction, frame=None):
    if direction > 4:
        return ImageOps.mirror(sprite(resident, 8 - direction, frame))

    if resident in STORYBOOK_FUR:
        return storybook_sprite(resident, direction, frame)

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

    if resident == 'rakko':
        light, shade = RAKKO_FUR
        feet(shade, light, True)
        if rear:
            oval((20, 35, 27, 41), '#b3927d', INK)
        oval((11, 25, 36, 40), shade, INK)
        oval((15, 27, 34, 38), light)
        for index, x in enumerate((12, 33)):
            arm_shift = (1 if stride[index] > 0 else -1) if frame is not None else 0
            oval((x, 30 + arm_shift, x + 4, 36 + arm_shift), light, INK)

        shift = tilt - (2 if rear and tilt else 0)
        oval((10, 5, 20, 16), light, INK, shift)
        oval((27, 5, 37, 16), light, INK, shift)
        if not rear:
            oval((13, 8, 17, 12), '#e6bcb5', offset=shift)
            oval((30, 8, 34, 12), '#e6bcb5', offset=shift)
        top = 10
        cheek_right = 35 if not side else 32
        poly([(8, 23), (10, top + 5), (16, top + 1), (22, top),
              (30, top + 1), (36, top + 5), (39 if not side else 37, 24),
              (38, 28), (34, 32), (15, 33), (10, 30)], shade, INK, shift)
        oval((10, top + 2, 37 if not side else 36, 30), light, offset=shift)
        if rear:
            return image
        face = 3 if direction == 1 else 0
        if not side:
            rect((16, 22, 17, 24), INK, shift + face)
            oval((12, 25, 17, 27), '#efadb5', offset=shift + face)
        rect((28 if not side else 30, 22, 29 if not side else 31, 24), INK, shift + face)
        oval((cheek_right - 6, 25, cheek_right - 1, 27), '#efadb5', offset=shift)
        mouth_x = 23 + face + (8 if side else 0)
        poly([(mouth_x - 2, 25), (mouth_x, 26), (mouth_x + 2, 25),
              (mouth_x + 1, 27), (mouth_x - 1, 27)], INK, offset=shift)
        poly([(15, 17), (17, 19), (19, 17), (19, 18), (17, 20), (15, 18)],
             '#9c7367', offset=shift)
        if not side:
            rect((14, 21, 17, 21), INK, shift + face)
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
        # The tied-up bun is the SAME dark hair as the head, not a white disc.
        # Keep the bun smaller than the face, and centered above the crown.
        oval((16, 2, 30, 16), hair, INK, shift)
        poly([(18, 7), (19, 4), (23, 3), (27, 5),
              (28, 9), (26, 11), (21, 10)], shine, offset=shift)
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
    if resident == 'momo':
        # Narrow tie makes the high bun read as gathered hair in every view.
        rect((19, 11, 28, 12), dark, shift)
        rect((21, 10, 26, 10), '#998090', shift)
    if rear:
        if resident == 'momo':
            # Two soft side sections remain visible behind the bun.
            poly([(13, 17), (16, 19), (16, 30), (12, 33), (10, 27)], hair, INK, shift)
            poly([(32, 18), (35, 17), (38, 27), (34, 33), (30, 30)], hair, INK, shift)
            poly([(18, 15), (24, 17), (30, 15), (28, 20), (20, 20)], shine, offset=shift)
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
    if resident == 'momo':
        # Keep the face uncovered while making the side hair fuller.
        if side:
            poly([(17, 14), (20, 16), (22, 21), (20, 30),
                  (16, 33), (13, 27), (14, 19)], hair, INK, shift)
            rect((17, 21, 18, 27), shine, shift)
        else:
            poly([(11, 14), (16, 15), (17, 19), (17, 28),
                  (14, 32), (10, 31), (9, 24)], hair, INK, shift)
            poly([(32, 15), (36, 15), (38, 24), (37, 31),
                  (33, 33), (30, 29), (31, 20)], hair, INK, shift)
            rect((12, 20, 13, 27), shine, shift)
            rect((34, 20, 35, 27), shine, shift)
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


def reference_walk_sprite(resident, direction, frame=None):
    """Draw Momo and Toshiro from their full-body references on the map grid."""
    if direction > 4:
        return ImageOps.mirror(reference_walk_sprite(resident, 8 - direction, frame))

    image = Image.new('RGBA', (CELL, CELL))
    draw = ImageDraw.Draw(image)
    momo = resident == 'momo'
    rear = direction >= 3
    side = direction == 2
    bob = BOB[frame] if frame is not None else 0
    stride = STRIDE[frame] if frame is not None else (0, 0)
    rise = RISE[frame] if frame is not None else (0, 0)
    ink = '#181a24'
    robe = '#303747' if momo else '#222631'
    fold = '#4b5264' if momo else '#3c4250'
    hem = '#242735' if momo else '#171a24'
    collar = '#afb3c0' if momo else '#e5edf2'
    skin, skin_shade = '#f3c693', '#c78b68'

    def shape(points, fill, outline=None, dx=0):
        draw.polygon([(x + dx, y + bob) for x, y in points], fill, outline)

    def line(points, fill, dx=0, width=1):
        draw.line([(x + dx, y + bob) for x, y in points], fill, width=width)

    # The two shoes keep separate lanes. Draw the raised/far shoe first.
    centers = (19, 28) if not side else (20, 27)
    projection = (0, 0.5, 1, 0.5, 0)[direction]
    for i in sorted(range(2), key=lambda index: (rise[index], index)):
        x = centers[i] + round(stride[i] * projection)
        y = GROUND + rise[i]
        top = 34 + bob
        draw.polygon([(centers[i] - 3, top), (centers[i] + 3, top),
                      (x + 2, y - 4), (x - 3, y - 3)], fill=fold, outline=ink)
        toe = 3 if side or direction in (1, 3) else 0
        draw.polygon([(x - 3, y - 3), (x + 2, y - 3), (x + 3 + toe, y - 1),
                      (x + 3 + toe, y), (x - 3, y)], fill=ink)
        draw.line((x - 1, y - 2, x + 1 + toe, y - 2), fill=skin_shade if momo else collar)

    def sleeve(x, swing, far=False):
        y = 29 + round(swing * 0.65)
        dx = round(swing * projection)
        shape([(x - 2, 25), (x + 3, 26), (x + dx + 3, y + 3),
               (x + dx, y + 5), (x + dx - 3, y + 3)], hem if far else robe, ink)
        line([(x + dx - 2, y + 2), (x + dx + 2, y + 3)], fold if far else collar)
        shape([(x + dx - 1, y + 4), (x + dx + 2, y + 3), (x + dx + 2, y + 5),
               (x + dx, y + 6), (x + dx - 1, y + 5)], skin_shade if far else skin)

    sleeve(16 if not side else 27, stride[1], True)
    center = (24, 25, 23, 24, 24)[direction]
    shape([(center - 6, 24), (center + 5, 24), (center + 7, 28), (center + 5, 33),
           (center + 8, 37), (center + 4, 39), (center, 37), (center - 5, 39),
           (center - 8, 37), (center - 5, 32), (center - 7, 27)], robe, ink)
    line([(center - 4, 32), (center - 5, 36), (center - 5, 37)], fold)
    line([(center + 2, 34), (center + 4, 37)], fold)
    if not rear:
        line([(center - 5, 25), (center, 29), (center + 5, 25)], collar, width=2)
        line([(center - 4, 32), (center + 4, 32)], collar)
        draw.point((center + 1, 33 + bob), fill=collar)
    if not momo:
        # Pale coat edging, blue cord and a compact sheathed sword from the reference.
        line([(center - 6, 26), (center - 5, 32), (center - 7, 37)], collar, width=2)
        line([(center + 5, 25), (center + 5, 31), (center + 7, 36)], '#a5b4c4', width=2)
        line([(center - 4, 25), (center - 2, 29), (center + 2, 33)], '#4488bd', width=2)
        if rear:
            line([(center + 7, 23), (center + 2, 30), (center - 8, 38)], ink, width=3)
            line([(center + 7, 23), (center + 3, 29), (center - 8, 38)], '#8599a9')
            line([(center + 8, 22), (center + 6, 24)], '#d4b765', width=2)
        else:
            line([(center - 7, 30), (center - 9, 33), (center - 11, 37)], '#758998', width=2)
            line([(center - 8, 30), (center - 6, 31)], '#d4b765')
    sleeve(30 if not side else 21, stride[0])

    # Positive views look right. Mirroring above turns head and torso together.
    dx = (0, 2, 3, 1, 0)[direction]
    if not rear:
        face = [(18, 14), (25, 12), (30, 14), (32, 19), (31, 23), (27, 26),
                (21, 25), (17, 22)]
        if side:
            face = [(20, 14), (27, 13), (31, 15), (32, 18), (34, 20), (32, 21),
                    (32, 23), (28, 26), (22, 24), (19, 21)]
        shape(face, skin, ink, dx)
        line([(20, 23), (23, 25), (27, 25)], skin_shade, dx)
        eyes = ((27, 19),) if side else ((20, 19), (28, 19))
        for x, y in eyes:
            line([(x - 1, y), (x + 1, y)], ink, dx)
            line([(x, y + 1), (x, y + 2)], '#665b59' if momo else '#4295a4', dx)
        line([(29 if side else 24, 23), (30 if side else 25, 23)], '#996459', dx)

    if momo:
        hair, shade, highlight = '#323745', '#232735', '#616a7b'
        bun_x = (25, 20, 17, 19, 24)[direction]
        draw.ellipse((bun_x - 5, 4 + bob, bun_x + 5, 13 + bob), fill=hair, outline=ink)
        line([(bun_x - 3, 7), (bun_x, 5), (bun_x + 3, 6)], highlight)
        crown = [(14, 17), (14, 13), (17, 9), (22, 7), (27, 8), (31, 10), (33, 14),
                 (32, 18), (29, 17), (27, 13), (25, 13), (23, 17), (20, 18), (19, 23), (16, 21)]
        if rear:
            crown = [(14, 17), (15, 12), (18, 9), (23, 7), (29, 8), (33, 12),
                     (34, 18), (32, 23), (28, 26), (21, 26), (16, 23)]
        shape(crown, hair, ink, dx)
        line([(16, 15), (19, 11), (24, 9), (28, 10)], highlight, dx)
        line([(20, 13), (22, 11), (26, 11)], '#474e60', dx)
        line([(17, 17), (17, 20), (19, 23)], shade, dx, 2)
        if rear:
            line([(20, 24), (24, 25), (28, 24), (31, 20)], shade, dx, 2)
        else:
            line([(31, 16), (32, 19), (31, 22)], shade, dx)
    else:
        fringe = [(12, 17), (15, 13), (11, 12), (17, 10), (13, 7), (20, 8),
                  (20, 3), (25, 7), (29, 4), (28, 8), (34, 6), (32, 11), (37, 11),
                  (33, 15), (34, 18), (29, 16), (27, 20), (26, 15), (22, 18),
                  (21, 14), (17, 19), (17, 15)]
        if rear:
            fringe = fringe[:14] + [(33, 21), (29, 25), (23, 26), (17, 23), (15, 19)]
        shape(fringe, '#e4eff4', '#8297a7', dx)
        line([(16, 13), (21, 10), (20, 7)], '#a4d3e1', dx, 2)
        line([(19, 16), (24, 11), (28, 10), (32, 12)], '#a4d3e1', dx, 2)
        line([(22, 9), (25, 9), (28, 7)], '#fcffff', dx)
        line([(25, 13), (29, 12), (32, 13)], '#fcffff', dx)
        if rear:
            line([(19, 20), (23, 23), (29, 22), (32, 18)], '#a9c2d2', dx, 2)
    return image


def build():
    ASSETS.mkdir(parents=True, exist_ok=True)
    walk = Image.new('RGBA', (8 * CELL, len(IDS) * 8 * CELL))
    idle = Image.new('RGBA', (CELL, walk.height))
    portraits = Image.new('RGB', (5 * 64, 2 * 64), '#fff7e8')
    for i, resident in enumerate(IDS):
        map_sprite = reference_walk_sprite if resident in ('momo', 'toshiro') else sprite
        for direction in range(8):
            y = (i * 8 + direction) * CELL
            idle.paste(map_sprite(resident, direction), (0, y))
            for frame in range(8):
                walk.paste(map_sprite(resident, direction, frame), (frame * CELL, y))
        if resident in STORYBOOK_FUR:
            portrait = storybook_sprite(resident, 0, portrait=True)
        else:
            portrait = sprite(resident, 0).crop((8, 2, 40, 34)).resize((64, 64), Image.Resampling.NEAREST)
        portraits.paste(portrait, (i % 5 * 64, i // 5 * 64), portrait)
    walk.save(ASSETS / 'walk.png', optimize=True)
    idle.save(ASSETS / 'idle.png', optimize=True)
    portraits.save(ASSETS / 'portraits.png', optimize=True)


if __name__ == '__main__':
    build()
