#!/usr/bin/env python3
"""Pack the hand-drawn Alex 8-pose source art into aligned 64px game cells.

The original generated PNGs are kept in art-source/alex64. This script only
extracts, scales and anchors whole-character drawings; it never cuts limbs or
interpolates separate body parts. Run: python3 scripts/build-alex64.py
"""
from __future__ import annotations

from pathlib import Path
import json
from PIL import Image


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


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    turnaround = normalize(extract("turnaround.png", 3))
    front_static, side_static, back_static = turnaround
    fixed_front = [front_static.copy() for _ in range(8)]
    fixed_side = [side_static.copy() for _ in range(8)]
    fixed_back = [back_static.copy() for _ in range(8)]
    walk_front = normalize(extract("walk_front.png", 8))
    walk_side = normalize(extract("walk_side.png", 8))
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

    audit = {"cell": CELL, "foot_anchor_y": FEET_Y, "frames_per_action": 8,
             "directions": DIRS, "actions": {}}
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
    qa = Image.new("RGBA", (8 * CELL, 4 * CELL), "#e9eedf")
    for index, (atlas, lane) in enumerate(((walk, 0), (idle, 0), (talk, 0), (sit, 2))):
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
    print("QA files: alex_qa.png, alex_actions.gif")


if __name__ == "__main__":
    main()
