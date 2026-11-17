#!/usr/bin/env python3
"""Pack the hand-drawn Alex 8-pose source art into aligned 64px game cells.

The original generated PNGs are kept in art-source/alex64. This script only
extracts, scales and anchors whole-character drawings; it never cuts limbs or
interpolates separate body parts. Run: python3 scripts/build-alex64.py
"""
from __future__ import annotations

from pathlib import Path
import json
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "art-source" / "alex64"
OUT = ROOT / "app" / "src" / "main" / "assets" / "action64"
CELL = 64
FEET_Y = 60
DIRS = ("down", "down-right", "right", "up-right", "up", "up-left", "left", "down-left")


def extract(filename: str, parts: int) -> list[Image.Image]:
    whole = Image.open(SOURCE / filename).convert("RGBA")
    frames = []
    for index in range(parts):
        x0, x1 = round(index * whole.width / parts), round((index + 1) * whole.width / parts)
        frame = whole.crop((x0, 0, x1, whole.height))
        if filename == "talk_front.png" and index == 2:
            # A sliver of the next drawn panel leaked into the right edge of
            # talk frame 3. The full Alex silhouette ends at x=257; the
            # unwanted disconnected fragment occupies x=261..270.
            ImageDraw.Draw(frame).rectangle((259, 315, frame.width, 390), fill=(0, 0, 0, 0))
            assert frame.getchannel("A").crop((259, 315, frame.width, 391)).getbbox() is None
        if filename == "walk_side_near_v2.png" and index == 3:
            # Right-facing stride 4 has a ghost THIRD arm/hand hanging behind
            # Alex's left torso edge (x≈70-105, y≈350-475). The two actual
            # arms are the sleeved foreground fist at x≈150-190 and the
            # farther forward fist at x≈190-230. Keep both intact.
            ImageDraw.Draw(frame).polygon(
                ((50, 340), (96, 340), (96, 357), (90, 386),
                 (88, 412), (96, 440), (107, 452), (108, 472),
                 (102, 485), (50, 485)), fill=(0, 0, 0, 0))
            assert frame.getpixel((76, 440))[3] == 0
            assert frame.getpixel((175, 440))[3] >= 64
            assert frame.getpixel((200, 406))[3] >= 64
        if filename == "walk_side.png" and index == 3:
            # Side walk frame 4 inadvertently contains THREE brown shoes.
            # Remove only the spurious rear-left shoe at x=60..104/y=505..580;
            # retain the raised front shoe and planted rear shoe, including
            # their unbroken trouser silhouettes and fixed ground point.
            ImageDraw.Draw(frame).polygon(
                ((49, 498), (101, 498), (104, 510), (107, 567),
                 (102, 582), (55, 583), (49, 568)), fill=(0, 0, 0, 0))
            # The extra shoe is gone, while the lifted shoe and grounded shoe
            # both retain their pixels (a deliberate regression guard).
            assert frame.getpixel((72, 545))[3] == 0
            assert frame.getpixel((125, 550))[3] >= 64
            assert frame.getpixel((120, 600))[3] >= 64
        # Ignore barely visible anti-aliasing ghosts around an otherwise clear silhouette.
        alpha = frame.getchannel("A").point(lambda a: 255 if a >= 64 else 0)
        box = alpha.getbbox()
        if box is None:
            raise ValueError(f"Missing figure in {filename} at frame {index}")
        frame = frame.crop(box)
        # Keep the reference alpha for smooth native-size edges, but eliminate fringe specks.
        frame.putalpha(frame.getchannel("A").point(lambda a: a if a >= 64 else 0))
        frames.append(frame)
    return frames


def extract_far_leg_phases() -> list[Image.Image]:
    """Keep all four re-drawn rear-leg strides, including the first forward toe.

    The image generator spaced the four figures asymmetrically; equal-width
    slicing would cut off the leading (dark, layer-2) boot in the first pose.
    These non-overlapping windows hold complete individual hand-painted frames.
    """
    whole = Image.open(SOURCE / "walk_side_far_v2.png").convert("RGBA")
    windows = ((230, 590), (690, 1030), (1160, 1500), (1620, 1970))
    frames = []
    for left, right in windows:
        part = whole.crop((left, 0, right, whole.height))
        alpha = part.getchannel("A").point(lambda a: 255 if a >= 64 else 0)
        box = alpha.getbbox()
        if not box:
            raise ValueError("A rear-leg stride frame is empty")
        part = part.crop(box)
        part.putalpha(part.getchannel("A").point(lambda a: a if a >= 64 else 0))
        frames.append(part)
    return frames


def normalize(frames: list[Image.Image], *, target_height: int = 54) -> list[Image.Image]:
    """Use one scale per motion, a centered head axis, and one foot baseline."""
    max_width = max(im.width for im in frames)
    max_height = max(im.height for im in frames)
    scale = min(target_height / max_height, 58 / max_width)
    result = []
    for im in frames:
        w, h = max(1, round(im.width * scale)), max(1, round(im.height * scale))
        # BOX downsamples source pixel blocks without generating the noisy
        # oversharpened edges of the old 48px game assets.
        sprite = im.resize((w, h), Image.Resampling.BOX)
        # The head (not the moving arms/legs) defines the stable horizontal axis.
        head = sprite.getchannel("A").crop((0, 0, w, max(1, round(h * .43))))
        head_box = head.point(lambda a: 255 if a >= 100 else 0).getbbox()
        head_center = (head_box[0] + head_box[2]) / 2 if head_box else w / 2
        dx = round(CELL / 2 - head_center)
        dy = FEET_Y - h
        cell = Image.new("RGBA", (CELL, CELL))
        cell.alpha_composite(sprite, (dx, dy))
        # Generated pose groups can have subtly different outer hair shapes.
        # After scaling, correct the *actual painted* head midpoint to within
        # half a pixel of x=32, shifting the whole body (never only its head).
        painted_head = cell.getchannel("A").crop((0, 0, CELL, 25)).getbbox()
        if painted_head:
            axis = (painted_head[0] + painted_head[2]) / 2
            shift = round(CELL / 2 - axis)
            if shift:
                aligned = Image.new("RGBA", (CELL, CELL))
                aligned.alpha_composite(cell, (shift, 0))
                cell = aligned
        result.append(cell)
    return result


def flip(frames: list[Image.Image]) -> list[Image.Image]:
    return [im.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for im in frames]


def save_atlas(name: str, rows: list[list[Image.Image]]) -> Image.Image:
    atlas = Image.new("RGBA", (CELL * 8, CELL * len(rows)))
    for row_index, row in enumerate(rows):
        assert len(row) == 8, (name, row_index)
        for frame, im in enumerate(row):
            atlas.alpha_composite(im, (frame * CELL, row_index * CELL))
    path = OUT / f"alex_{name}.png"
    atlas.save(path, optimize=True)
    print(f"{path.relative_to(ROOT)}: {atlas.width}x{atlas.height}")
    return atlas


def row_by_direction(front, side, back):
    # Side view is used for the diagonal lanes until their unique portraits
    # are painted, mirroring the established 48px directional convention.
    return [front, side, side, side, back, flip(side), flip(side), flip(side)]


def boot_red_level(frame: Image.Image, left: int, right: int) -> float:
    """Approximate the lower boot's red-channel lightness for layer QA."""
    pix = frame.load()
    values = []
    for y in range(44, 61):
        for x in range(left, right):
            r, g, b, a = pix[x, y]
            if a > 150 and 65 < r < 195 and g < 145:
                values.append(r)
    if not values:
        raise ValueError("Missing brown boot pixels in a walking frame")
    return sum(values) / len(values)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    turnaround = normalize(extract("turnaround.png", 3))
    front_static, side_static, back_static = turnaround
    fixed_front = [front_static.copy() for _ in range(8)]
    fixed_side = [side_static.copy() for _ in range(8)]
    fixed_back = [back_static.copy() for _ in range(8)]
    walk_front = normalize(extract("walk_front.png", 8))
    # The original 64px side drawing had a one-leg-only forward cycle. Keep
    # the hand-painted whole-character frames, but explicitly assemble two
    # equal four-phase support-foot halves. The lighter near leg (layer 1)
    # strides first; the darker far leg (layer 2) then visibly strides ahead
    # while remaining occluded at the hip/knee by the near leg throughout.
    walk_side = (normalize(extract("walk_side_near_v2.png", 8)[:4])
                 + normalize(extract_far_leg_phases()))
    # On the final 64px cell, the former third hand occupied (26, 36..42).
    # Confirm it is now transparent without erasing either actual fist.
    if any(walk_side[3].getpixel((26, y))[3] != 0 for y in (36, 38, 42)):
        raise ValueError("Side walk frame 4 still contains a third arm")
    if any(walk_side[3].getpixel(p)[3] < 150 for p in ((35, 40), (39, 38))):
        raise ValueError("Side walk frame 4 lost a real fist")
    # Protect against the original one-leg-only regression: frames 1-4 have
    # the brighter near shoe in the forward/right slot, but frames 5-7 MUST
    # visibly advance the darker far shoe into that same forward slot.
    def right_minus_left(frame):
        return boot_red_level(frame, 33, 53) - boot_red_level(frame, 12, 31)
    if right_minus_left(walk_side[0]) <= 5:
        raise ValueError("Near-side leg no longer leads the first half of the side gait")
    if any(right_minus_left(walk_side[f]) >= -8 for f in (4, 5, 6)):
        raise ValueError("The darker layer-2 leg must step forward during frames 5-7")
    walk_back = normalize(extract("walk_back.png", 8))
    idle_front = normalize(extract("idle_front.png", 8))
    talk_front = normalize(extract("talk_front.png", 8))
    sit_side = normalize(extract("sit_side.png", 8))

    walk = save_atlas("walk", row_by_direction(walk_front, walk_side, walk_back))
    idle = save_atlas("idle", row_by_direction(idle_front, fixed_side, fixed_back))
    talk = save_atlas("talk", row_by_direction(talk_front, fixed_side, fixed_back))
    # Preserve a right-facing sitting cycle without changing limb depth layers;
    # left-facing silhouettes are mirrored from the exact same authored art.
    sit = save_atlas("sit", row_by_direction(sit_side, sit_side, sit_side))

    # Exact right-facing 8-frame row used by the renderer, extracted without
    # changing a single sprite pixel. Provide a numbered inspection sheet so
    # frame 4 -> 5 can be compared without GIF timing obscuring the transition.
    side_row = walk.crop((0, 2 * CELL, 8 * CELL, 3 * CELL))
    side_row.save(OUT / "alex_walk_side_sheet.png", optimize=True)
    inspect = Image.new("RGBA", (8 * 144, 184), "#f1ebdd")
    marker = ImageDraw.Draw(inspect)
    for index in range(8):
        left = index * 144 + 8
        marker.line((left + 64, 26, left + 64, 154), fill="#c9d1c5", width=1)
        marker.line((left, 146, left + 128, 146), fill="#c9d1c5", width=1)
        marker.text((left + 58, 6), str(index + 1), fill="#5c4636")
        frame = side_row.crop((index * CELL, 0, (index + 1) * CELL, CELL))
        inspect.alpha_composite(frame.resize((128, 128), Image.Resampling.NEAREST), (left, 26))
    marker.line((4 * 144, 0, 4 * 144, 184), fill="#c55a4d", width=3)
    inspect.convert("RGB").save(OUT / "alex_walk_side_inspection.png", optimize=True)

    audit = {"cell": CELL, "foot_anchor_y": FEET_Y, "frames_per_action": 8,
             "directions": DIRS, "actions": {}}
    audit["side_gait_right_minus_left"] = [round(right_minus_left(frame), 1)
                                           for frame in walk_side]
    for action, atlas in (("walk", walk), ("idle", idle), ("talk", talk), ("sit", sit)):
        records = []
        for direction in range(len(DIRS)):
            for phase in range(8):
                frame = atlas.crop((phase * CELL, direction * CELL,
                                    (phase + 1) * CELL, (direction + 1) * CELL))
                bbox = frame.getchannel("A").getbbox()
                if bbox is None or bbox[3] != FEET_Y:
                    raise ValueError(f"{action} row={direction} frame={phase}: feet not anchored: {bbox}")
                head = frame.getchannel("A").crop((0, 0, CELL, 25)).getbbox()
                records.append({"direction": DIRS[direction], "frame": phase,
                                "bbox": bbox, "head_axis": round((head[0] + head[2]) / 2, 1)})
        audit["actions"][action] = records
    (OUT / "audit.json").write_text(json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Compact reference sheet for side-by-side visual QA.
    qa = Image.new("RGBA", (8 * CELL, 5 * CELL), "#e9eedf")
    # Side walk first, so the previously broken fourth frame is easy to inspect.
    for index, (atlas, lane) in enumerate(((walk, 2), (walk, 0), (idle, 0), (talk, 0), (sit, 2))):
        qa.paste(atlas.crop((0, lane * CELL, 8 * CELL, (lane + 1) * CELL)),
                 (0, index * CELL), atlas.crop((0, lane * CELL, 8 * CELL, (lane + 1) * CELL)))
    qa.save(OUT / "alex_qa.png", optimize=True)

    # A moving visual test: walk -> idle -> talk -> sit, repeated at 8 fps.
    durations = [125] * 8 + [170] * 8 + [160] * 8 + [155] * 8
    frames = []
    for atlas, lane in ((walk, 2), (idle, 0), (talk, 0), (sit, 2)):
        for phase in range(8):
            frame = Image.new("RGBA", (128, 128), "#e9eedf")
            cell = atlas.crop((phase * CELL, lane * CELL, (phase + 1) * CELL, (lane + 1) * CELL))
            frame.alpha_composite(cell.resize((112, 112), Image.Resampling.NEAREST), (8, 8))
            frames.append(frame.convert("RGB"))
    frames[0].save(OUT / "alex_actions.gif", save_all=True, append_images=frames[1:],
                   duration=durations, loop=0, optimize=False)

    # Standalone right-facing sideways gait: the eight exact in-game frames,
    # with the same feet/head axes and no interpolation or added in-betweens.
    # The left-facing lane of the atlas mirrors this sequence.
    sideways = []
    for phase in range(8):
        sheet_frame = walk.crop((phase * CELL, 2 * CELL,
                                 (phase + 1) * CELL, 3 * CELL))
        preview = Image.new("RGBA", (224, 224), "#e9eedf")
        preview.alpha_composite(sheet_frame.resize((192, 192), Image.Resampling.NEAREST), (16, 16))
        sideways.append(preview.convert("RGB"))
    sideways[0].save(OUT / "alex_walk_side.gif", save_all=True,
                     append_images=sideways[1:], duration=[120, 130] * 4,
                     disposal=2, loop=0, optimize=False)
    print("QA files: alex_qa.png, alex_actions.gif, alex_walk_side.gif")


if __name__ == "__main__":
    main()
