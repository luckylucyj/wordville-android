#!/usr/bin/env python3
"""Unified Step-0 pipeline for remaking Wordville residents in 3-head-tall 128x128 pixel art.

Usage:
  python scripts/resident128_pipeline.py prepare-turnaround --resident alex --input <path>
  python scripts/resident128_pipeline.py generate-videos --resident alex --actions walk_front walk_side walk_back talk_front sit_side
  python scripts/resident128_pipeline.py extract-frames --resident alex
  python scripts/resident128_pipeline.py build-walk --resident alex
"""
from __future__ import annotations

import argparse
import base64
from collections import deque
import json
import os
from pathlib import Path
import re
import subprocess
import time
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ART_ROOT = ROOT / "art-source" / "residents128"
DEFAULT_KEY_FILE = Path(r"C:\Users\whgus\Desktop\업무관련\결이든\구글 AI Studio API키.txt")

CELL = 128
GROUND_Y = 120
TARGET_H = 108
DIRS_8 = ("down", "down-right", "right", "up-right", "up", "up-left", "left", "down-left")

COMMON_VIDEO_LOCK = (
    "Keep the exact 3-head-tall pixel-art character proportions, face, hair, outfit colors, "
    "and details consistent across every frame. Keep exactly two arms and two legs. Locked static "
    "camera, fixed scale, centered horizontally on a pure flat solid magenta (#FF00FF) background "
    "with NO floor, NO shadows, NO text, NO camera movement, and NO pink or purple lighting."
)

ACTION_PROMPTS = {
    ("walk", "side"): (
        "Animate the supplied pixel-art character into a smooth, steady WALK IN PLACE facing "
        "strictly screen right, like walking on a treadmill. Alternate left and right legs "
        "naturally through contact, passing, and push-off poses, with opposite arms swinging "
        "naturally. " + COMMON_VIDEO_LOCK
    ),
    ("walk", "front"): (
        "Animate the supplied pixel-art character into a smooth, steady WALK IN PLACE facing "
        "strictly straight forward toward the camera (0-degree orthographic front view, shoulders "
        "and hips square to the viewer at all times), like walking straight toward the viewer on "
        "a treadmill. NEVER turn the body, hips, or feet sideways or diagonally into a three-quarter "
        "angle. Alternate left and right knees and feet stepping straight forward and back along "
        "vertical lanes with symmetrical opposite arm swings. " + COMMON_VIDEO_LOCK
    ),
    ("walk", "back"): (
        "Animate the supplied pixel-art character into a smooth, steady WALK IN PLACE facing "
        "straight away from the viewer (rear view), like walking on a treadmill. Alternate left "
        "and right feet lifting naturally with opposite arm swings. " + COMMON_VIDEO_LOCK
    ),
    ("talk", "front"): (
        "Animate the supplied pixel-art character standing in place facing straight toward the "
        "viewer having a friendly conversation: natural blinking, mouth speaking softly, gentle "
        "expressive hand gestures near chest height while feet stay planted on the ground. "
        + COMMON_VIDEO_LOCK
    ),
    ("sit", "side"): (
        "Animate the supplied pixel-art character facing strictly screen right smoothly bending "
        "knees from the standing pose into a natural seated posture (as if sitting on an invisible "
        "bench, thighs horizontal, lower legs vertical, feet resting flat, hands relaxed on lap) "
        "and holding the seated pose calmly without disappearing or adding any chair. "
        + COMMON_VIDEO_LOCK
    ),
}


def res_dir(resident: str) -> Path:
    return ART_ROOT / resident


def load_api_key() -> str:
    env_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if env_key:
        return env_key.strip()
    if DEFAULT_KEY_FILE.exists():
        raw = DEFAULT_KEY_FILE.read_text(encoding="utf-8", errors="ignore")
        m = re.search(r"AIza[0-9A-Za-z_\-]+", raw)
        if m:
            return m.group(0)
        for line in raw.splitlines():
            s = line.strip()
            if s:
                if "=" in s:
                    s = s.split("=", 1)[-1].strip()
                elif ":" in s:
                    s = s.split(":", 1)[-1].strip()
                if s:
                    return s
    raise RuntimeError("No GEMINI_API_KEY found in environment or key file.")


def flood_clear_white(im: Image.Image, thresh: int = 232) -> Image.Image:
    arr = np.array(im.convert("RGBA"))
    h, w, _ = arr.shape
    rgb = arr[:, :, :3].astype(np.int16)
    near_white = (rgb[:, :, 0] > thresh) & (rgb[:, :, 1] > thresh) & (rgb[:, :, 2] > thresh)
    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        if near_white[0, x]:
            visited[0, x] = True
            q.append((0, x))
        if near_white[h - 1, x] and not visited[h - 1, x]:
            visited[h - 1, x] = True
            q.append((h - 1, x))
    for y in range(h):
        if near_white[y, 0] and not visited[y, 0]:
            visited[y, 0] = True
            q.append((y, 0))
        if near_white[y, w - 1] and not visited[y, w - 1]:
            visited[y, w - 1] = True
            q.append((y, w - 1))
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and near_white[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))
    arr[visited, 3] = 0
    alpha = arr[:, :, 3]
    transparent = alpha == 0
    padded = np.pad(transparent, 1, mode="constant", constant_values=True)
    adj_trans = padded[:-2, 1:-1] | padded[2:, 1:-1] | padded[1:-1, :-2] | padded[1:-1, 2:]
    halo = (alpha > 0) & adj_trans & (rgb[:, :, 0] > 215) & (rgb[:, :, 1] > 215) & (rgb[:, :, 2] > 215)
    arr[halo, 3] = 0
    return Image.fromarray(arr)


def split_three_views(clean: Image.Image) -> list[Image.Image]:
    arr = np.array(clean)
    col_counts = (arr[:, :, 3] > 0).sum(axis=0)
    w = clean.width
    cuts = [0]
    for k in range(1, 3):
        ideal = round(k * w / 3)
        lo, hi = max(20, ideal - 60), min(w - 20, ideal + 60)
        cuts.append(lo + int(np.argmin(col_counts[lo:hi])))
    cuts.append(w)

    views = []
    for x0, x1 in zip(cuts[:-1], cuts[1:]):
        crop = clean.crop((x0, 0, x1, clean.height))
        crop = filter_components(crop, min_area=200)
        box = crop.getchannel("A").getbbox()
        if not box:
            raise ValueError(f"Empty view in span {x0}..{x1}")
        views.append(crop.crop(box))
    return views


def filter_components(cell: Image.Image, min_area: int = 25, keep_largest_only: bool = False) -> Image.Image:
    arr = np.array(cell)
    m = arr[:, :, 3] > 0
    h, w = m.shape
    vis = np.zeros((h, w), dtype=bool)
    comps = []
    for sy in range(h):
        for sx in range(w):
            if m[sy, sx] and not vis[sy, sx]:
                pts = []
                q = deque([(sy, sx)])
                vis[sy, sx] = True
                while q:
                    cy, cx = q.popleft()
                    pts.append((cy, cx))
                    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and m[ny, nx] and not vis[ny, nx]:
                            vis[ny, nx] = True
                            q.append((ny, nx))
                comps.append(pts)
    if keep_largest_only and comps:
        largest = max(comps, key=len)
        for pts in comps:
            if pts is not largest:
                for cy, cx in pts:
                    arr[cy, cx, :] = 0
    else:
        for pts in comps:
            if len(pts) < min_area:
                for cy, cx in pts:
                    arr[cy, cx, :] = 0
    return Image.fromarray(arr)


def apply_uniform_1px_outline(rgba_canvas: Image.Image, cell_w: int = CELL, cell_h: int = CELL) -> Image.Image:
    resized = rgba_canvas.resize((cell_w, cell_h), Image.Resampling.BOX)
    arr = np.array(resized).astype(np.int16)
    a = arr[:, :, 3] >= 155
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    c_lum = (r * 299 + g * 587 + b * 114) // 1000
    p_a = np.pad(a, 1, mode="constant", constant_values=False)
    n4_a = (
        p_a[:-2, 1:-1].astype(int)
        + p_a[2:, 1:-1].astype(int)
        + p_a[1:-1, :-2].astype(int)
        + p_a[1:-1, 2:].astype(int)
    )
    spike = a & (c_lum < 95) & (n4_a <= 1)
    a[spike] = False

    p_lc_raw = np.pad(a & (c_lum >= 65), 1, mode="constant", constant_values=False)
    adj_lc = p_lc_raw[:-2, 1:-1] | p_lc_raw[2:, 1:-1] | p_lc_raw[1:-1, :-2] | p_lc_raw[1:-1, 2:]
    p_a2 = np.pad(a, 1, mode="constant", constant_values=False)
    bg4 = (~p_a2[:-2, 1:-1]) | (~p_a2[2:, 1:-1]) | (~p_a2[1:-1, :-2]) | (~p_a2[1:-1, 2:])
    p_lc2 = np.pad(adj_lc, 1, mode="constant", constant_values=False)
    within2_lc = p_lc2[:-2, 1:-1] | p_lc2[2:, 1:-1] | p_lc2[1:-1, :-2] | p_lc2[1:-1, 2:]
    extra_thick = a & (c_lum < 65) & bg4 & (~adj_lc) & within2_lc
    a[extra_thick] = False

    light_char = a & (c_lum >= 65)
    p_lc = np.pad(light_char, 1, mode="constant", constant_values=False)
    adj_light = p_lc[:-2, 1:-1] | p_lc[2:, 1:-1] | p_lc[1:-1, :-2] | p_lc[1:-1, 2:]
    need_outline = (~a) & adj_light
    arr[need_outline, 0] = 26
    arr[need_outline, 1] = 21
    arr[need_outline, 2] = 28
    a = a | need_outline

    p_a3 = np.pad(a, 1, mode="constant", constant_values=False)
    bg_touch = (~p_a3[:-2, 1:-1]) | (~p_a3[2:, 1:-1]) | (~p_a3[1:-1, :-2]) | (~p_a3[1:-1, 2:])
    gray_border = a & bg_touch & (c_lum < 105)
    arr[gray_border, 0] = np.minimum(arr[gray_border, 0], 30)
    arr[gray_border, 1] = np.minimum(arr[gray_border, 1], 24)
    arr[gray_border, 2] = np.minimum(arr[gray_border, 2], 32)

    g_cast = a & (arr[:, :, 1] > arr[:, :, 0] + 15) & (arr[:, :, 1] > arr[:, :, 2] + 15)
    arr[g_cast, 1] = (arr[g_cast, 0] + arr[g_cast, 2]) // 2

    cell = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGBA")
    cell.putalpha(Image.fromarray((a * 255).astype(np.uint8), mode="L"))
    return filter_components(cell, min_area=25)


def make_flow_16x9(sprite: Image.Image, out_path: Path, target_height: int = 380) -> None:
    canvas = Image.new("RGB", (1280, 720), (255, 0, 255))
    scale = target_height / sprite.height
    w = max(1, round(sprite.width * scale))
    h = max(1, round(sprite.height * scale))
    resized = sprite.resize((w, h), Image.Resampling.NEAREST)
    x = (1280 - w) // 2
    y = (720 - h) // 2
    canvas.paste(resized, (x, y), resized.getchannel("A").point(lambda p: 255 if p >= 128 else 0))
    canvas.save(out_path)


RESIDENT_DESCS = {
    "harvey": "wavy brown hair, round glasses, neat brown mustache, white doctor lab coat over sage-green shirt and tie, grey trousers, black shoes",
    "sam": "spiky golden-blonde hair, blue eyes, energetic smile, orange jacket with dark blue collar over blue inner shirt, dark grey-brown pants, black sneakers",
    "sebastian": "messy dark purple-indigo bangs swept across one eye, cool calm expression, dark plum-purple zip hoodie jacket, dark charcoal-brown pants, black boots",
    "shane": "messy dark chestnut-brown hair, relaxed calm expression, royal-blue zip hoodie jacket over cream-grey t-shirt, slate-blue jeans, black shoes",
    "haley": "long wavy golden-blonde hair with small pink hair bow, violet-blue eyes, pink off-shoulder blouse over cream skirt, tan mid-calf boots with dark soles",
    "leah": "fiery copper-orange hair in a long side braid, green eyes, olive-green overalls over cream blouse, olive-brown trousers, dark brown boots",
    "maru": "curly reddish-brown bob hair, round glasses, warm tan skin, bright purple cardigan over cream shirt, khaki pants, dark grey boots",
    "penny": "copper-orange bob hair, green eyes, mustard-yellow sweater with red collar ribbon bow, brown pleated skirt, dark tights and black shoes",
    "abigail": "long wavy vibrant purple hair, purple eyes, dark plum jacket over dark purple pleated skirt, dark grey knee-high boots",
    "emily": "short vibrant royal-blue bob hair, bright blue eyes, turquoise earrings, coral-red long-sleeve top with blue waist sash over cream skirt, tan tall boots",
}


def cmd_generate_turnaround(residents: list[str], model: str = "gemini-3.1-flash-image") -> None:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=load_api_key())
    style_ref = (ART_ROOT / "alex" / "turnaround_master.png").read_bytes()

    for rid in residents:
        out_dir = res_dir(rid)
        out_dir.mkdir(parents=True, exist_ok=True)
        port_bytes = (out_dir / "_ref_portrait.png").read_bytes()
        outfit_bytes = (out_dir / "_ref_outfit.png").read_bytes()
        desc = RESIDENT_DESCS[rid]
        prompt = (
            f"Generate a wide 16:9 3-view pixel-art character turnaround sheet (Front view on left, "
            f"Right-side profile facing strictly screen-right in center, Back view on right) for {rid}: "
            f"{desc}. "
            f"Strictly match the exact 3-head-tall chibi proportion, crisp dark pixel-art outline weight, "
            f"shading style, and wide horizontal spacing of the first style reference image (Alex turnaround), "
            f"while faithfully keeping the face from the portrait reference and full-body outfit colors from "
            f"the outfit reference. All 3 poses stand neutral with identical height and foot baseline on a "
            f"pure flat solid white (#FFFFFF) background with NO shadows, NO floor, NO grid lines, NO text."
        )
        print(f"[{rid}] Generating 3-view turnaround via {model}...")
        t0 = time.time()
        resp = client.models.generate_content(
            model=model,
            contents=[
                types.Part.from_bytes(data=style_ref, mime_type="image/png"),
                types.Part.from_bytes(data=port_bytes, mime_type="image/png"),
                types.Part.from_bytes(data=outfit_bytes, mime_type="image/png"),
                prompt,
            ],
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(aspect_ratio="16:9"),
            ),
        )
        img_bytes = None
        for part in resp.candidates[0].content.parts:
            if part.inline_data and part.inline_data.data:
                img_bytes = part.inline_data.data
                break
        if not img_bytes:
            raise RuntimeError(f"No image returned for {rid}")
        raw_path = out_dir / "turnaround_api_raw.png"
        raw_path.write_bytes(img_bytes)
        print(f"[{rid}] Saved {raw_path.name} ({len(img_bytes)} bytes, {time.time()-t0:.1f}s)")
        cmd_prepare_turnaround(rid, raw_path)


def cmd_prepare_turnaround(resident: str, input_path: Path) -> None:
    out_dir = res_dir(resident)
    out_dir.mkdir(parents=True, exist_ok=True)
    src = Image.open(input_path).convert("RGBA")
    src.save(out_dir / "turnaround_master.png")
    clean = flood_clear_white(src)
    views = split_three_views(clean)
    names = ("front", "side", "back")

    max_h = max(v.height for v in views)
    max_w = max(v.width for v in views)
    scale = min(TARGET_H / max_h, 112 / max_w)
    cells = []
    for name, v in zip(names, views):
        v.save(out_dir / f"{name}_master.png")
        make_flow_16x9(v, out_dir / f"flow_input_{name}_16x9.png", target_height=380)

        # Normalize to 128x128 with uniform 1px outline
        cw = round(CELL / scale)
        canvas = Image.new("RGBA", (cw, cw), (0, 0, 0, 0))
        dx = round((cw - v.width) / 2)
        dy = round(GROUND_Y / scale - v.height)
        canvas.alpha_composite(v, (dx, max(0, dy)))
        cell = apply_uniform_1px_outline(canvas, CELL, CELL)
        cell.save(out_dir / f"{name}_128.png")
        cells.append(cell)

    sheet = Image.new("RGBA", (CELL * 3, CELL))
    for i, c in enumerate(cells):
        sheet.alpha_composite(c, (i * CELL, 0))
    sheet.save(out_dir / "standing128_sheet.png")

    qa = Image.new("RGBA", (860, 320), "#e9eedf")
    draw = ImageDraw.Draw(qa)
    draw.rectangle((20, 20, 840, 292), fill="#dce9db")
    draw.rectangle((20, 20 + GROUND_Y * 2, 840, 292), fill="#b7c5a2")
    qa.alpha_composite(sheet.resize((CELL * 3 * 2, CELL * 2), Image.Resampling.NEAREST), (46, 20))
    qa.save(out_dir / "turnaround_qa.png")
    print(f"[{resident}] Prepared turnaround_qa.png, standing128_sheet.png, and flow_input_*_16x9.png")


def key_video_frame(im: Image.Image) -> Image.Image:
    """Chroma-key neon-magenta video background via border flood-fill + edge-only despill.

    Flood-filling from exterior borders + pure neon-magenta seeds (`mag > 160`)
    protects interior purple/pink palettes (e.g. Abigail, Haley, Sebastian, Maru)
    while stripping outer anti-aliased magenta fringe cleanly.
    """
    arr = np.array(im.convert("RGBA")).astype(np.float32)
    h, w, _ = arr.shape
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    mag = np.minimum(r, b) - g

    # Pure neon-magenta background vs. max ~125 mag in bright purple character hair
    bg_walk = (mag > 130.0) & (r > 185.0) & (b > 175.0) & (g < 90.0)
    bg_seed = (mag > 160.0) & (r > 215.0) & (b > 205.0) & (g < 65.0)

    # Seed from cropped side bands + top/bottom borders + interior neon-magenta holes
    bg_walk[:, :170] = True
    bg_walk[:, 470:] = True
    visited = bg_seed.copy()
    visited[:, :170] = True
    visited[:, 470:] = True
    for x in range(170, min(470, w)):
        if bg_walk[0, x]:
            visited[0, x] = True
        if bg_walk[h - 1, x]:
            visited[h - 1, x] = True
    q: deque[tuple[int, int]] = deque(map(tuple, np.argwhere(visited)))
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 170 <= nx < min(470, w) and not visited[ny, nx] and bg_walk[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    alpha = np.where(visited, 0.0, 255.0)

    # 1px outer transition feather only on pixels directly touching keyed background
    p_bg = np.pad(visited, 1, mode="constant", constant_values=True)
    adj1 = (~visited) & (p_bg[:-2, 1:-1] | p_bg[2:, 1:-1] | p_bg[1:-1, :-2] | p_bg[1:-1, 2:])
    lum = r * 0.299 + g * 0.587 + b * 0.114
    fringe = adj1 & (mag > 60.0) & (lum >= 55.0)
    alpha[fringe] = np.clip((105.0 - mag[fringe]) / 45.0, 0.0, 1.0) * 255.0

    # Edge-only despill (within 2px of background), leaving interior clothing/hair 100% intact
    trans = alpha < 128.0
    p_t1 = np.pad(trans, 1, mode="constant", constant_values=True)
    near1 = (~trans) & (p_t1[:-2, 1:-1] | p_t1[2:, 1:-1] | p_t1[1:-1, :-2] | p_t1[1:-1, 2:])
    edge_zone = trans | near1
    p_t2 = np.pad(edge_zone, 1, mode="constant", constant_values=True)
    near2 = (~trans) & (near1 | p_t2[:-2, 1:-1] | p_t2[2:, 1:-1] | p_t2[1:-1, :-2] | p_t2[1:-1, 2:])
    spill = near2 & (mag > 22.0) & (alpha > 0)
    cap = g + 16.0
    r[spill] = np.minimum(r[spill], cap[spill])
    b[spill] = np.minimum(b[spill], cap[spill])

    arr[:, :, 0] = np.clip(r, 0, 255)
    arr[:, :, 1] = np.clip(g, 0, 255)
    arr[:, :, 2] = np.clip(b, 0, 255)
    arr[:, :, 3] = np.clip(alpha, 0, 255)
    out = arr.astype(np.uint8)
    out[:, :170, 3] = 0
    out[:, 470:, 3] = 0
    return filter_components(Image.fromarray(out), min_area=180)


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


def cmd_generate_videos(resident: str, jobs: list[str], resolution: str = "360p", duration: str = "4s") -> None:
    from google import genai

    client = genai.Client(api_key=load_api_key())
    out_dir = res_dir(resident)
    media_dir = out_dir / "media"
    media_dir.mkdir(parents=True, exist_ok=True)

    for job in jobs:
        action, direction = job.split("_", 1)
        img_path = out_dir / f"flow_input_{direction}_16x9.png"
        b64_img = base64.b64encode(img_path.read_bytes()).decode("ascii")
        prompt = ACTION_PROMPTS[(action, direction)]
        print(f"[{resident}/{job}] Submitting to gemini-omni-1.2-flash ({resolution}, {duration})...")
        t0 = time.time()
        interaction = client.interactions.create(
            model="gemini-omni-1.2-flash",
            input=[
                {"type": "image", "data": b64_img, "mime_type": "image/png"},
                {"type": "text", "text": prompt},
            ],
            generation_config={"video_config": {"task": "image_to_video"}},
            response_format={
                "type": "video",
                "aspect_ratio": "16:9",
                "resolution": resolution,
                "duration": duration,
                "delivery": "inline",
            },
            timeout=300.0,
        )
        status = getattr(interaction, "status", None)
        iid = getattr(interaction, "id", None)
        while status in ("in_progress", "requires_action") and iid:
            time.sleep(5)
            interaction = client.interactions.get(iid)
            status = getattr(interaction, "status", None)
        ov = getattr(interaction, "output_video", None)
        data = getattr(ov, "data", None) if ov else None
        if not data:
            for item in (getattr(interaction, "outputs", None) or []):
                if getattr(item, "type", None) == "video" and getattr(item, "data", None):
                    data = item.data
                    break
        if not data:
            raise RuntimeError(f"No video bytes for {resident}/{job} (status={status})")
        video_bytes = bytes(data) if isinstance(data, (bytes, bytearray)) else base64.b64decode(data)
        mp4_path = media_dir / f"{job}_{resolution}.mp4"
        mp4_path.write_bytes(video_bytes)
        print(f"[{resident}/{job}] Saved {mp4_path.name} ({len(video_bytes)} bytes, {time.time()-t0:.1f}s)")


def cmd_extract_frames(resident: str) -> None:
    out_dir = res_dir(resident)
    media_dir = out_dir / "media"
    frames_root = out_dir / "video-frames"
    for mp4 in sorted(media_dir.glob("*.mp4")):
        tag = mp4.stem.rsplit("_", 1)[0]
        fdir = frames_root / f"{tag}_raw"
        fdir.mkdir(parents=True, exist_ok=True)
        for old in fdir.glob("f_*.png"):
            old.unlink()
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(mp4), str(fdir / "f_%03d.png")],
            check=True,
            capture_output=True,
        )
        frames = sorted(fdir.glob("f_*.png"))
        pick = list(range(0, len(frames), 4))[:24]
        sheet = Image.new("RGB", (6 * 220, 4 * 140), (30, 30, 30))
        draw = ImageDraw.Draw(sheet)
        for i, idx in enumerate(pick):
            im = Image.open(frames[idx]).resize((220, 140), Image.Resampling.BILINEAR)
            r, c = divmod(i, 6)
            sheet.paste(im, (c * 220, r * 140))
            draw.rectangle((c * 220, r * 140, c * 220 + 40, r * 140 + 18), fill=(0, 0, 0))
            draw.text((c * 220 + 4, r * 140 + 3), str(idx), fill=(255, 255, 0))
        sheet.save(frames_root / f"{tag}_contact.png")
        print(f"[{resident}/{tag}] Extracted {len(frames)} frames -> {tag}_contact.png")


def detect_best_loop(frame_paths: list[Path]) -> tuple[int, int]:
    masks, bboxes = [], []
    for p in frame_paths:
        arr = np.array(Image.open(p).convert("RGB")).astype(np.int16)
        mag = np.minimum(arr[:, :, 0], arr[:, :, 2]) - arr[:, :, 1]
        fg = mag < 55
        ys, xs = np.where(fg)
        bboxes.append((int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())) if len(ys) else (0, 0, 0, 0))
        masks.append(arr)
    best = None
    for s in range(8, min(52, len(frame_paths) - 20)):
        for L in range(18, 35):
            e = s + L
            if e >= len(frame_paths) - 4:
                continue
            x0 = min(bboxes[s][0], bboxes[e][0]) - 5
            y0 = min(bboxes[s][1], bboxes[e][1]) - 5
            x1 = max(bboxes[s][2], bboxes[e][2]) + 5
            y1 = max(bboxes[s][3], bboxes[e][3]) + 5
            diff = float(np.abs(masks[s][y0:y1, x0:x1] - masks[e][y0:y1, x0:x1]).mean())
            mid_diff = float(np.abs(masks[s][y0:y1, x0:x1] - masks[s + L // 2][y0:y1, x0:x1]).mean())
            if mid_diff < 5.0:
                continue
            score = diff - 0.05 * mid_diff
            if best is None or score < best[0]:
                best = (score, s, e)
    assert best is not None
    return best[1], best[2]


def find_neck_y(cell: Image.Image, top_y: int) -> int:
    """Locate the narrowest neck row between head and shoulders (works for any resident)."""
    aa = np.array(cell)[:, :, 3] > 0
    lo = max(0, top_y + 26)
    hi = min(CELL, top_y + 44)
    if hi <= lo:
        return min(CELL - 1, top_y + 34)
    widths = aa[lo:hi, :].sum(axis=1)
    return lo + int(np.argmin(widths))


def head_top_in_band(cell: Image.Image, x0: int = 40, x1: int = 88) -> int:
    aa = np.array(cell)[:, x0:x1, 3] > 0
    ys, _ = np.where(aa)
    return int(ys.min()) if len(ys) else 12


def lock_walk_row(cells: list[Image.Image]) -> list[Image.Image]:
    """Lock the full head (hair + face + chin down to neck) from frame 0, following smooth bounce."""
    ref = cells[0]
    ref_top = head_top_in_band(ref)
    ref_neck = find_neck_y(ref, ref_top)
    head_h = ref_neck - ref_top
    hx0, hx1 = 30, 98
    head_patch = ref.crop((hx0, ref_top, hx1, ref_neck + 1))

    out = []
    for c in cells:
        paste_top = max(0, head_top_in_band(c))
        arr = np.array(c)
        clear_end = max(0, min(CELL, paste_top + head_h))
        arr[:clear_end, hx0:hx1, :] = 0
        base = Image.fromarray(arr)
        base.alpha_composite(head_patch, (hx0, paste_top))
        out.append(filter_components(base, min_area=25))
    return out


def pack_8dir_atlas(
    front: list[Image.Image],
    side: list[Image.Image],
    back: list[Image.Image],
    out_path: Path,
) -> Image.Image:
    left = [c.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for c in side]
    rows_8 = [front, side, side, side, back, left, left, left]
    n = len(front)
    atlas = Image.new("RGBA", (CELL * n, CELL * 8))
    for r_i, row in enumerate(rows_8):
        assert len(row) == n
        for c_i, cell in enumerate(row):
            atlas.alpha_composite(cell, (c_i * CELL, r_i * CELL))
    atlas.save(out_path, optimize=True)
    return atlas


def normalize_clip_frames(
    paths: list[Path],
    indices: list[int],
    scale: float,
    anchor_cx: float,
    anchor_bot: float,
    damp_y: bool = False,
) -> list[Image.Image]:
    win = round(CELL / scale)
    keyed = [key_video_frame(Image.open(paths[idx])) for idx in indices]
    tops = []
    for im in keyed:
        ys, _ = np.where(np.array(im)[:, :, 3] >= 96)
        tops.append(int(ys.min()) if len(ys) else 85)
    med_top = float(np.median(tops))
    y1_base = min(keyed[0].height, round(anchor_bot) + max(2, round((CELL - GROUND_Y) / scale)))
    x0 = round(anchor_cx - win / 2)
    x1 = x0 + win

    cells = []
    for im, f_top in zip(keyed, tops):
        y_shift = round((f_top - med_top) * 0.55) if damp_y else 0
        y1 = min(im.height, y1_base + y_shift)
        y0 = max(0, y1 - win)
        y1 = y0 + win
        cells.append(apply_uniform_1px_outline(im.crop((x0, y0, x1, y1)), CELL, CELL))
    return cells


def cmd_build_walk(resident: str, num_frames: int = 12) -> None:
    cmd_build_actions(resident, num_frames=num_frames, walk_only=True)


def cmd_build_actions(resident: str, num_frames: int = 12, walk_only: bool = False) -> None:
    out_dir = res_dir(resident)
    frames_root = out_dir / "video-frames"
    raw_by_dir = {}
    loops = {}
    heights = []
    anchors = {}

    for d in ("front", "side", "back"):
        paths = sorted((frames_root / f"walk_{d}_raw").glob("f_*.png"))
        s, e = detect_best_loop(paths)
        loops[d] = (s, e)
        indices = [s + round(i * (e - s) / num_frames) for i in range(num_frames)]
        keyed = [key_video_frame(Image.open(paths[idx])) for idx in indices]
        raw_by_dir[d] = keyed
        hxs_all, bots_all = [], []
        for im in keyed:
            arr = np.array(im)
            fg = arr[:, :, 3] >= 96
            ys, _ = np.where(fg)
            if len(ys):
                heights.append(int(ys.max() - ys.min()))
                bots_all.append(int(ys.max()))
            _, hxs = np.where(fg[85:145, 285:345])
            if len(hxs):
                hxs_all.append(float(np.median(hxs)) + 285.0)
        anchors[d] = (float(np.median(hxs_all)), float(max(bots_all)))
    print(f"[{resident}] Detected walk loops: {loops}")

    scale = TARGET_H / float(np.median(heights))
    walk_dirs = {}
    for d in ("front", "side", "back"):
        paths = sorted((frames_root / f"walk_{d}_raw").glob("f_*.png"))
        s, e = loops[d]
        indices = [s + round(i * (e - s) / num_frames) for i in range(num_frames)]
        cx, bot = anchors[d]
        cells = normalize_clip_frames(paths, indices, scale, cx, bot, damp_y=(d in ("front", "back")))
        walk_dirs[d] = lock_walk_row(cells)

    walk_atlas = pack_8dir_atlas(walk_dirs["front"], walk_dirs["side"], walk_dirs["back"], out_dir / f"{resident}_walk_128.png")

    # Compact 3-direction walk GIF
    gw, gh = 3 * 256 + 80, 256 + 48
    gif_frames = []
    for idx in range(num_frames):
        frame = Image.new("RGBA", (gw, gh), "#dce9db")
        draw = ImageDraw.Draw(frame)
        draw.rectangle((0, 24 + GROUND_Y * 2, gw, gh), fill="#b7c5a2")
        for col, d in enumerate(("front", "side", "back")):
            frame.alpha_composite(walk_dirs[d][idx].resize((256, 256), Image.Resampling.NEAREST), (20 + col * 276, 24))
        gif_frames.append(frame)
    save_ditherfree_gif(gif_frames, out_dir / f"{resident}_walk_preview.gif", 83)
    print(f"[{resident}] Saved {resident}_walk_128.png ({walk_atlas.size}) and {resident}_walk_preview.gif")

    if walk_only:
        return

    # Build idle, talk, sit aligned to exact same character scale & ground baseline
    front_static = Image.open(out_dir / "front_128.png").convert("RGBA")
    side_static = Image.open(out_dir / "side_128.png").convert("RGBA")
    back_static = Image.open(out_dir / "back_128.png").convert("RGBA")

    # Idle: steady neutral standing (12 identical frames so idle is 100% still without boiling)
    idle_atlas = pack_8dir_atlas(
        [front_static.copy() for _ in range(num_frames)],
        [side_static.copy() for _ in range(num_frames)],
        [back_static.copy() for _ in range(num_frames)],
        out_dir / f"{resident}_idle_128.png",
    )

    # Talk: front conversational gesture loop from talk_front frames 14..70 (measured from neutral frame 0)
    talk_paths = sorted((frames_root / "talk_front_raw").glob("f_*.png"))
    tf0 = key_video_frame(Image.open(talk_paths[0]))
    tb0 = tf0.getchannel("A").point(lambda p: 255 if p >= 96 else 0).getbbox()
    t_cx, t_bot = (tb0[0] + tb0[2]) / 2.0, float(tb0[3])
    talk_indices = [round(14 + i * (70 - 14) / (num_frames - 1)) for i in range(num_frames)]
    talk_front = normalize_clip_frames(talk_paths, talk_indices, scale, t_cx, t_bot, damp_y=False)
    talk_atlas = pack_8dir_atlas(
        talk_front,
        [side_static.copy() for _ in range(num_frames)],
        [back_static.copy() for _ in range(num_frames)],
        out_dir / f"{resident}_talk_128.png",
    )

    # Sit: side standing -> seated transition from sit_side frames 8..56 (measured from neutral frame 0)
    sit_paths = sorted((frames_root / "sit_side_raw").glob("f_*.png"))
    sf0 = key_video_frame(Image.open(sit_paths[0]))
    sb0 = sf0.getchannel("A").point(lambda p: 255 if p >= 96 else 0).getbbox()
    s_cx, s_bot = (sb0[0] + sb0[2]) / 2.0, float(sb0[3])
    sit_indices = [round(8 + i * (56 - 8) / (num_frames - 1)) for i in range(num_frames)]
    sit_side = normalize_clip_frames(sit_paths, sit_indices, scale, s_cx, s_bot, damp_y=False)
    sit_atlas = pack_8dir_atlas(
        sit_side,
        sit_side,
        sit_side,
        out_dir / f"{resident}_sit_128.png",
    )

    # Combined actions QA PNG (rows: walk_side, walk_front, idle_front, talk_front, sit_side)
    qa = Image.new("RGBA", (CELL * num_frames, CELL * 5), "#e9eedf")
    qdraw = ImageDraw.Draw(qa)
    lanes = ((walk_atlas, 2), (walk_atlas, 0), (idle_atlas, 0), (talk_atlas, 0), (sit_atlas, 2))
    for r_i, (atlas, lane) in enumerate(lanes):
        y = r_i * CELL
        qdraw.rectangle((0, y + GROUND_Y, qa.width, y + CELL), fill="#b7c5a2")
        qa.alpha_composite(atlas.crop((0, lane * CELL, qa.width, (lane + 1) * CELL)), (0, y))
    qa.save(out_dir / f"{resident}_actions_qa.png", optimize=True)

    # Combined actions GIF preview (walk -> idle -> talk -> sit at 2x)
    act_gif = []
    for atlas, lane in ((walk_atlas, 2), (walk_atlas, 0), (talk_atlas, 0), (sit_atlas, 2)):
        for c_i in range(num_frames):
            frame = Image.new("RGBA", (280, 280), "#dce9db")
            d = ImageDraw.Draw(frame)
            d.rectangle((0, 12 + GROUND_Y * 2, 280, 280), fill="#b7c5a2")
            cell = atlas.crop((c_i * CELL, lane * CELL, (c_i + 1) * CELL, (lane + 1) * CELL))
            frame.alpha_composite(cell.resize((256, 256), Image.Resampling.NEAREST), (12, 12))
            act_gif.append(frame)
    save_ditherfree_gif(act_gif, out_dir / f"{resident}_actions_preview.gif", 100)
    print(f"[{resident}] Saved idle/talk/sit 128px atlases, {resident}_actions_qa.png, and {resident}_actions_preview.gif")


def main() -> None:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)

    p0 = sub.add_parser("generate-turnaround")
    p0.add_argument("--residents", nargs="+", required=True)
    p0.add_argument("--model", default="gemini-3.1-flash-image")

    p1 = sub.add_parser("prepare-turnaround")
    p1.add_argument("--resident", required=True)
    p1.add_argument("--input", required=True, type=Path)

    p2 = sub.add_parser("generate-videos")
    p2.add_argument("--resident", required=True)
    p2.add_argument("--actions", nargs="+", default=["walk_front", "walk_side", "walk_back"])
    p2.add_argument("--resolution", default="360p")
    p2.add_argument("--duration", default="4s")

    p3 = sub.add_parser("extract-frames")
    p3.add_argument("--resident", required=True)

    p4 = sub.add_parser("build-walk")
    p4.add_argument("--resident", required=True)
    p4.add_argument("--frames", type=int, default=12)

    p5 = sub.add_parser("build-actions")
    p5.add_argument("--resident", required=True)
    p5.add_argument("--frames", type=int, default=12)

    args = p.parse_args()
    if args.cmd == "generate-turnaround":
        cmd_generate_turnaround(args.residents, args.model)
    elif args.cmd == "prepare-turnaround":
        cmd_prepare_turnaround(args.resident, args.input)
    elif args.cmd == "generate-videos":
        cmd_generate_videos(args.resident, args.actions, args.resolution, args.duration)
    elif args.cmd == "extract-frames":
        cmd_extract_frames(args.resident)
    elif args.cmd == "build-walk":
        cmd_build_walk(args.resident, args.frames)
    elif args.cmd == "build-actions":
        cmd_build_actions(args.resident, args.frames)


if __name__ == "__main__":
    main()
