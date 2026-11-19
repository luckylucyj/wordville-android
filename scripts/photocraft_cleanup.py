#!/usr/bin/env python3
"""Trim leftover background pockets, hanging outline loops, and magenta scraps
from all 12 Wordville 128px resident sprite sheets using headless PhotoCraft
(`photocraft-cli.exe`), without regenerating any video/image via API.
"""
from __future__ import annotations

from collections import deque
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(r"D:\wordville-dev")
APP_ROOT = ROOT / "app" / "src" / "main" / "assets" / "residents128"
ART_ROOT = ROOT / "art-source" / "residents128"
PHOTOCRAFT_CLI = Path(
    r"C:\Users\whgus\AppData\Local\Programs\CraftingApps\photocraft-0.10.0-windows-x64-portable\photocraft-cli.exe"
)
RESIDENTS = [
    "alex", "elliott", "harvey", "sam", "sebastian", "shane",
    "haley", "leah", "maru", "penny", "abigail", "emily",
]
CELL = 128
GROUND_Y = 120


def dilate4(m: np.ndarray) -> np.ndarray:
    p = np.pad(m, 1, mode="constant", constant_values=False)
    return p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]


def dilate8(m: np.ndarray) -> np.ndarray:
    p = np.pad(m, 1, mode="constant", constant_values=False)
    return (
        p[:-2, :-2] | p[:-2, 1:-1] | p[:-2, 2:]
        | p[1:-1, :-2] | p[1:-1, 2:]
        | p[2:, :-2] | p[2:, 1:-1] | p[2:, 2:]
    )


def compute_cell_cut_mask(cell: np.ndarray, rid: str, act: str, row_idx: int = 0) -> np.ndarray:
    arr = cell.astype(np.int16)
    a = arr[:, :, 3] > 0
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    lum = (r * 299 + g * 587 + b * 114) // 1000
    mag = np.minimum(r, b) - g
    rb_diff = np.abs(r - b)
    yy, xx = np.indices((CELL, CELL))
    cut = np.zeros((CELL, CELL), dtype=bool)

    # 1. Enclosed neutral-white armpit / under-arm pockets
    # Only on front/back views (row_idx in 0, 4) and never on sit or Harvey's white lab coat
    if rid != "harvey" and act != "sit" and row_idx in (0, 4):
        arm_zone = (yy >= 63) & (yy <= 90) & (((xx >= 38) & (xx <= 56)) | ((xx >= 72) & (xx <= 90)))
        white_seed = a & arm_zone & (r >= 220) & (g >= 220) & (b >= 220) & (sat <= 20)
        pocket = white_seed.copy()
        grow_cand = a & arm_zone & (lum >= 165) & (sat <= 22) & ((r - b) < 18)
        q = deque(map(tuple, np.argwhere(pocket)))
        while q:
            cy, cx = q.popleft()
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < CELL and 0 <= nx < CELL and not pocket[ny, nx] and grow_cand[ny, nx]:
                    pocket[ny, nx] = True
                    q.append((ny, nx))
        cut |= pocket

        # Exterior transparent pixels connected to cell border
        ext = np.zeros((CELL, CELL), dtype=bool)
        q = deque()
        for i in range(CELL):
            for py, px in ((0, i), (CELL - 1, i), (i, 0), (i, CELL - 1)):
                if not a[py, px] and not ext[py, px]:
                    ext[py, px] = True
                    q.append((py, px))
        while q:
            cy, cx = q.popleft()
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < CELL and 0 <= nx < CELL and not a[ny, nx] and not ext[ny, nx]:
                    ext[ny, nx] = True
                    q.append((ny, nx))

        # 1b. Hanging 1px dark outline loop bounding a cleared white pocket (e.g. Penny/Sebastian talk)
        if pocket.any():
            rem_a = a & (~cut)
            pocket_zone = pocket.copy()
            for _ in range(6):
                body_interior = rem_a & ((sat > 18) | (lum >= 120))
                p_bi = np.pad(body_interior, 1, mode="constant", constant_values=False)
                n8_bi = (
                    p_bi[:-2, :-2].astype(int) + p_bi[:-2, 1:-1] + p_bi[:-2, 2:]
                    + p_bi[1:-1, :-2] + p_bi[1:-1, 2:]
                    + p_bi[2:, :-2] + p_bi[2:, 1:-1] + p_bi[2:, 2:]
                )
                p_r = np.pad(rem_a, 1, mode="constant", constant_values=False)
                n4_r = p_r[:-2, 1:-1].astype(int) + p_r[2:, 1:-1] + p_r[1:-1, :-2] + p_r[1:-1, 2:]
                wire = rem_a & (lum < 125) & dilate8(pocket_zone) & dilate4(ext) & ((n8_bi == 0) | (n4_r <= 1))
                if not wire.any():
                    break
                cut |= wire
                pocket_zone |= wire
                rem_a = a & (~cut)

    # 2. Un-cut magenta background slivers (never on idle, which came from white-bg turnaround)
    if act != "idle":
        mag_cut = np.zeros((CELL, CELL), dtype=bool)
        if rid == "penny":
            mag_cut = a & (mag >= 26) & (rb_diff <= 45)
        elif rid == "haley":
            # Protect violet-blue eyes (y<52) and warm pink blouse/bow (R - B >= 40)
            mag_cut = a & (((yy < 52) & (mag >= 75) & (rb_diff <= 30)) | ((yy >= 52) & (mag >= 38) & (rb_diff <= 30)))
        elif rid == "sebastian":
            low_or_side = (yy >= 84) | ((yy >= 78) & ((xx <= 55) | (xx >= 73)))
            mag_cut = a & (((mag >= 60) & (rb_diff <= 38)) | (low_or_side & (act != "sit") & (mag >= 25) & (rb_diff <= 42)))
        elif rid == "maru":
            # Protect purple cardigan (y=46..87)
            mag_cut = a & (((mag >= 100) & (rb_diff <= 38)) | (((yy <= 45) | (yy >= 88)) & (act != "sit") & (mag >= 26) & (rb_diff <= 40)))
        elif rid == "abigail":
            # Protect purple hair & skirt (y<=91)
            mag_cut = a & (((mag >= 132) & (rb_diff <= 35)) | ((yy >= 92) & (act != "sit") & (mag >= 26) & (rb_diff <= 42)))
        elif rid != "elliott":
            mag_cut = a & (mag >= 45) & (rb_diff <= 35)

        if mag_cut.any():
            if rid not in ("abigail", "maru"):
                fringe = a & (~mag_cut) & dilate4(mag_cut) & (mag >= 18) & (rb_diff <= 40)
                mag_cut |= fringe
            elif act != "sit":
                y_min = 92 if rid == "abigail" else 88
                fringe = a & (~mag_cut) & (yy >= y_min) & dilate4(mag_cut) & (mag >= 16) & (rb_diff <= 42)
                mag_cut |= fringe
        cut |= mag_cut

    # 3. Clean 1px dark stray whiskers adjacent to cuts & tiny disconnected components (<25px)
    for _ in range(3):
        rem_a = a & (~cut)
        p_a = np.pad(rem_a, 1, mode="constant", constant_values=False)
        n4 = p_a[:-2, 1:-1].astype(int) + p_a[2:, 1:-1] + p_a[1:-1, :-2] + p_a[1:-1, 2:]
        spike = rem_a & (lum < 105) & (n4 <= 1) & dilate4(cut)
        if not spike.any():
            break
        cut |= spike

    rem_a = a & (~cut)
    vis = np.zeros((CELL, CELL), dtype=bool)
    ys, xs = np.where(rem_a)
    for sy, sx in zip(ys, xs):
        if vis[sy, sx]:
            continue
        pts = []
        q = deque([(int(sy), int(sx))])
        vis[sy, sx] = True
        while q:
            cy, cx = q.popleft()
            pts.append((cy, cx))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dy == 0 and dx == 0:
                        continue
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < CELL and 0 <= nx < CELL and rem_a[ny, nx] and not vis[ny, nx]:
                        vis[ny, nx] = True
                        q.append((ny, nx))
        if len(pts) < 25:
            for cy, cx in pts:
                cut[cy, cx] = True

    return cut


def mask_to_rect_runs(mask: np.ndarray) -> list[tuple[int, int, int, int]]:
    """Compress a boolean 2D mask into non-overlapping rectangles (merge identical adjacent rows)."""
    h, w = mask.shape
    row_runs: list[list[tuple[int, int]]] = []
    for y in range(h):
        row = mask[y]
        if not row.any():
            row_runs.append([])
            continue
        padded = np.concatenate(([False], row, [False]))
        diff = np.diff(padded.astype(np.int8))
        starts = np.where(diff == 1)[0]
        ends = np.where(diff == -1)[0]
        row_runs.append([(int(s), int(e - s)) for s, e in zip(starts, ends)])

    # Merge vertically contiguous identical (x, width) runs into taller rects
    active: dict[tuple[int, int], tuple[int, int]] = {}  # (x, w) -> (y0, height)
    rects: list[tuple[int, int, int, int]] = []
    for y, runs in enumerate(row_runs):
        run_set = set(runs)
        for key in list(active.keys()):
            if key not in run_set:
                y0, rh = active.pop(key)
                rects.append((key[0], y0, key[1], rh))
        for key in runs:
            if key in active:
                y0, rh = active[key]
                active[key] = (y0, rh + 1)
            else:
                active[key] = (y, 1)
    for key, (y0, rh) in active.items():
        rects.append((key[0], y0, key[1], rh))
    return rects


def clean_png_with_photocraft(png_path: Path, rects: list[tuple[int, int, int, int]]) -> None:
    """Execute pixel-exact rectangular selections + edit.clear inside PhotoCraft CLI."""
    steps = []
    for idx, (x, y, w, h) in enumerate(rects):
        steps.append({
            "command": "select.rect",
            "params": {
                "x": x,
                "y": y,
                "width": w,
                "height": h,
                "antiAlias": False,
                "mode": "replace" if idx == 0 else "add",
            },
        })
    steps.append({"command": "edit.clear", "params": {}})
    steps.append({"command": "select.deselect", "params": {}})

    with tempfile.TemporaryDirectory() as td:
        td_path = Path(td)
        in_dir = td_path / "in"
        out_dir = td_path / "out"
        in_dir.mkdir()
        out_dir.mkdir()
        actions_json = td_path / "actions.json"
        actions_json.write_text(json.dumps({"steps": steps}), encoding="utf-8")
        shutil.copy2(png_path, in_dir / png_path.name)
        res = subprocess.run(
            [
                str(PHOTOCRAFT_CLI),
                "batch",
                "--actions", str(actions_json),
                "--in", str(in_dir),
                "--out", str(out_dir),
                "--format", "png",
            ],
            capture_output=True,
            text=True,
        )
        if res.returncode != 0:
            raise RuntimeError(f"PhotoCraft failed on {png_path}: {res.stderr or res.stdout}")
        out_file = out_dir / png_path.name
        if not out_file.exists():
            raise RuntimeError(f"PhotoCraft did not produce {out_file}")
        shutil.copy2(out_file, png_path)


def save_ditherfree_gif(frames_rgba: list[Image.Image], out_path: Path, duration_ms: int) -> None:
    rgb_frames = [f.convert("RGB") for f in frames_rgba]
    step = max(1, len(rgb_frames) // 6)
    samples = rgb_frames[::step]
    w, h = samples[0].size
    mosaic = Image.new("RGB", (w * len(samples), h))
    for i, s in enumerate(samples):
        mosaic.paste(s, (i * w, 0))
    pal_img = mosaic.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    p_frames = [rf.quantize(palette=pal_img, dither=Image.Dither.NONE) for rf in rgb_frames]
    p_frames[0].save(out_path, save_all=True, append_images=p_frames[1:], duration=duration_ms, loop=0, optimize=False)


def rebuild_previews(rid: str) -> None:
    src_dir = APP_ROOT / rid
    art_dir = ART_ROOT / rid
    walk_atlas = Image.open(src_dir / "walk.png").convert("RGBA")
    idle_atlas = Image.open(src_dir / "idle.png").convert("RGBA")
    talk_atlas = Image.open(src_dir / "talk.png").convert("RGBA")
    sit_atlas = Image.open(src_dir / "sit.png").convert("RGBA")

    # Sync art-source 128px masters with PhotoCraft-cleaned PNGs
    for act in ("walk", "idle", "talk", "sit"):
        shutil.copy2(src_dir / f"{act}.png", art_dir / f"{rid}_{act}_128.png")

    num_frames = 12
    # 3-dir walk GIF
    gw, gh = 3 * 256 + 80, 256 + 48
    gif_frames = []
    for idx in range(num_frames):
        frame = Image.new("RGBA", (gw, gh), "#dce9db")
        draw = ImageDraw.Draw(frame)
        draw.rectangle((0, 24 + GROUND_Y * 2, gw, gh), fill="#b7c5a2")
        for col, lane in enumerate((0, 2, 4)):
            cell = walk_atlas.crop((idx * CELL, lane * CELL, (idx + 1) * CELL, (lane + 1) * CELL))
            frame.alpha_composite(cell.resize((256, 256), Image.Resampling.NEAREST), (20 + col * 276, 24))
        gif_frames.append(frame)
    save_ditherfree_gif(gif_frames, art_dir / f"{rid}_walk_preview.gif", 83)

    # Combined actions QA PNG
    qa = Image.new("RGBA", (CELL * num_frames, CELL * 5), "#e9eedf")
    qdraw = ImageDraw.Draw(qa)
    lanes = ((walk_atlas, 2), (walk_atlas, 0), (idle_atlas, 0), (talk_atlas, 0), (sit_atlas, 2))
    for r_i, (atlas, lane) in enumerate(lanes):
        y = r_i * CELL
        qdraw.rectangle((0, y + GROUND_Y, qa.width, y + CELL), fill="#b7c5a2")
        qa.alpha_composite(atlas.crop((0, lane * CELL, qa.width, (lane + 1) * CELL)), (0, y))
    qa.save(art_dir / f"{rid}_actions_qa.png", optimize=True)

    # Combined actions GIF
    act_gif = []
    for atlas, lane in ((walk_atlas, 2), (walk_atlas, 0), (talk_atlas, 0), (sit_atlas, 2)):
        for c_i in range(num_frames):
            frame = Image.new("RGBA", (280, 280), "#dce9db")
            d = ImageDraw.Draw(frame)
            d.rectangle((0, 12 + GROUND_Y * 2, 280, 280), fill="#b7c5a2")
            cell = atlas.crop((c_i * CELL, lane * CELL, (c_i + 1) * CELL, (lane + 1) * CELL))
            frame.alpha_composite(cell.resize((256, 256), Image.Resampling.NEAREST), (12, 12))
            act_gif.append(frame)
    save_ditherfree_gif(act_gif, art_dir / f"{rid}_actions_preview.gif", 100)


def main() -> None:
    import sys
    targets = sys.argv[1:] if len(sys.argv) > 1 else RESIDENTS
    total_files = 0
    total_pixels = 0
    for rid in targets:
        cleaned_any = False
        summary = []
        for act in ("walk", "idle", "talk", "sit"):
            png_path = APP_ROOT / rid / f"{act}.png"
            arr = np.array(Image.open(png_path).convert("RGBA"))
            full_mask = np.zeros((arr.shape[0], arr.shape[1]), dtype=bool)
            for r_i in range(8):
                for c_i in range(12):
                    cell = arr[r_i * CELL:(r_i + 1) * CELL, c_i * CELL:(c_i + 1) * CELL]
                    full_mask[r_i * CELL:(r_i + 1) * CELL, c_i * CELL:(c_i + 1) * CELL] = compute_cell_cut_mask(
                        cell, rid, act, r_i
                    )
            px = int(full_mask.sum())
            if px == 0:
                continue
            rects = mask_to_rect_runs(full_mask)
            clean_png_with_photocraft(png_path, rects)
            total_files += 1
            total_pixels += px
            cleaned_any = True
            summary.append(f"{act}:{px}px({len(rects)}rects)")
        if cleaned_any:
            rebuild_previews(rid)
        print(f"[{rid:10s}] " + (", ".join(summary) if summary else "clean (0px)"))
    print(f"DONE: PhotoCraft cleaned {total_files} sheets, {total_pixels} scrap pixels total.")


if __name__ == "__main__":
    main()
