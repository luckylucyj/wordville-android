#!/usr/bin/env python3
"""Build crisp 2x (1200x1600) top-down pixel-art town base and animated Y-sorted
foreground prop sheets from the generated Wordville town square assets.
"""
from __future__ import annotations

from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance

ROOT = Path(r"D:\wordville-dev")
BRAIN = Path(r"C:\Users\whgus\.gemini\antigravity\brain\2dd23221-543b-403d-a411-35c11028d394")
MAP_SRC = BRAIN / "wordville_town_square_map_1795062015478.jpg"
PROPS_SRC = BRAIN / "town_square_props_sheet_1795062016147.jpg"
OUT_DIR = ROOT / "app" / "src" / "main" / "assets" / "art" / "town-v2"
HUB_WEBP = ROOT / "app" / "src" / "main" / "assets" / "art" / "hub-garden.webp"
SCRATCH = BRAIN / "scratch" / "town_v2"


def flood_clear_white(
    im: Image.Image,
    thresh: int = 232,
    clear_enclosed: bool = False,
    enclosed_max_y_ratio: float = 1.0,
) -> Image.Image:
    arr = np.array(im.convert("RGBA"))
    h, w, _ = arr.shape
    rgb = arr[:, :, :3].astype(np.int16)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    near_white = (rgb[:, :, 0] > thresh) & (rgb[:, :, 1] > thresh) & (rgb[:, :, 2] > thresh) & (sat <= 24)

    visited = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near_white[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near_white[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and near_white[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    if clear_enclosed:
        max_y = int(h * enclosed_max_y_ratio)
        pure_hole = (rgb[:, :, 0] > 240) & (rgb[:, :, 1] > 240) & (rgb[:, :, 2] > 240) & (sat <= 14)
        pure_hole[max_y:, :] = False
        q2 = deque(map(tuple, np.argwhere(pure_hole & ~visited)))
        for py, px in q2:
            visited[py, px] = True
        while q2:
            cy, cx = q2.popleft()
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < max_y and 0 <= nx < w and not visited[ny, nx] and near_white[ny, nx]:
                    visited[ny, nx] = True
                    q2.append((ny, nx))

    arr[visited, 3] = 0
    # Remove 1-2px bright white anti-aliased fringe touching cleared background
    for _ in range(2):
        alpha = arr[:, :, 3]
        trans = alpha == 0
        p = np.pad(trans, 1, mode="constant", constant_values=True)
        adj = p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
        halo = (alpha > 0) & adj & (rgb[:, :, 0] > 205) & (rgb[:, :, 1] > 205) & (rgb[:, :, 2] > 205) & (sat <= 26)
        arr[halo, 3] = 0
    return Image.fromarray(arr)


def filter_small_components(im: Image.Image, min_area: int = 30, keep_largest_only: bool = False) -> Image.Image:
    arr = np.array(im.convert("RGBA"))
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
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            if dy == 0 and dx == 0:
                                continue
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


def crisp_resize_prop(crop: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Downsample cleanly with BOX and snap binary alpha + crisp 1px dark outline."""
    im = crop.resize((target_w, target_h), Image.Resampling.BOX)
    arr = np.array(im).astype(np.int16)
    a = arr[:, :, 3] >= 145
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    lum = (r * 299 + g * 587 + b * 114) // 1000
    # Darken pale outer boundary pixels into crisp warm pixel-art outline
    p_a = np.pad(a, 1, mode="constant", constant_values=False)
    bg4 = (~p_a[:-2, 1:-1]) | (~p_a[2:, 1:-1]) | (~p_a[1:-1, :-2]) | (~p_a[1:-1, 2:])
    pale_edge = a & bg4 & (lum > 185) & ((np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) < 25)
    a[pale_edge] = False
    arr[~a] = 0
    out = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")
    out.putalpha(Image.fromarray((a * 255).astype(np.uint8), mode="L"))
    return filter_small_components(out, min_area=18)


def save_png8(im: Image.Image, out_path: Path, colors: int = 255) -> None:
    arr = np.array(im.convert("RGBA"))
    a = arr[:, :, 3] > 0
    if not a.all():
        op = arr[a][:, :3]
        w_s = 256
        h_s = max(1, (len(op) + w_s - 1) // w_s)
        pad = np.zeros((h_s * w_s, 3), dtype=np.uint8)
        pad[:len(op)] = op
        sim = Image.fromarray(pad.reshape(h_s, w_s, 3), "RGB")
        pal_im = sim.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        q_idx = np.array(Image.fromarray(arr[:, :, :3], "RGB").quantize(palette=pal_im, dither=Image.Dither.NONE))
        q_idx[~a] = 255
        pal = pal_im.getpalette()[:255 * 3]
        pal = pal + [0] * (255 * 3 - len(pal)) + [0, 0, 0]
        p_im = Image.fromarray(q_idx, mode="P")
        p_im.putpalette(pal)
        p_im.save(out_path, format="PNG", transparency=255, optimize=True, compress_level=9)
    else:
        rgb = im.convert("RGB")
        pal_im = rgb.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        pal_im.save(out_path, format="PNG", optimize=True, compress_level=9)


def shift_rows_horizontal(im: Image.Image, row_shifts: dict[int, int]) -> Image.Image:
    """Pixel-crisp horizontal shear per scanline (zero blur, preserves outlines)."""
    arr = np.array(im.convert("RGBA"))
    h, w, _ = arr.shape
    out = np.zeros_like(arr)
    for y in range(h):
        dx = row_shifts.get(y, 0)
        if dx == 0:
            out[y] = arr[y]
        elif dx > 0:
            out[y, dx:] = arr[y, :-dx]
        else:
            out[y, :dx] = arr[y, -dx:]
    return Image.fromarray(out, "RGBA")


def build_fountain_4f(base: Image.Image) -> Image.Image:
    """Create a 4-frame animated fountain strip with cascading water droplets, splash rings & basin sparkles."""
    w, h = base.size
    arr0 = np.array(base.convert("RGBA"))
    r, g, b, a = arr0[:, :, 0].astype(int), arr0[:, :, 1].astype(int), arr0[:, :, 2].astype(int), arr0[:, :, 3] > 0
    # Identify turquoise/cyan water & white foam pixels inside the fountain
    is_water = a & (b >= 150) & (g >= 145) & (b > r + 15)
    is_foam = a & (r >= 200) & (g >= 230) & (b >= 235)
    strip = Image.new("RGBA", (w * 4, h), (0, 0, 0, 0))

    # Locate bounding box of water region for proportional sparkle/ripple coordinates
    wys, wxs = np.where(is_water | is_foam)
    wy0, wy1 = int(wys.min()), int(wys.max())
    wx0, wx1 = int(wxs.min()), int(wxs.max())
    wcx = (wx0 + wx1) // 2

    for f in range(4):
        frame = arr0.copy()
        # 1) Animated shimmer bands inside turquoise water (subtle alternating highlight wave)
        yy, xx = np.indices((h, w))
        wave = is_water & (((yy + f * 2) % 8 == 0) & ((xx + f * 3) % 6 < 2))
        frame[wave, 0] = np.minimum(255, frame[wave, 0].astype(int) + 42)
        frame[wave, 1] = np.minimum(255, frame[wave, 1].astype(int) + 34)
        frame[wave, 2] = np.minimum(255, frame[wave, 2].astype(int) + 24)

        # 2) Cascading falling droplets along the upper & mid water arcs (vertical phase)
        arc_band = (is_foam | is_water) & (yy >= wy0) & (yy <= wy0 + int((wy1 - wy0) * 0.72))
        drop_bright = arc_band & (((yy - f * 3) % 10) < 2)
        frame[drop_bright, 0] = 242
        frame[drop_bright, 1] = 253
        frame[drop_bright, 2] = 255

        # 3) Expanding/pulsing concentric splash rings & 4-point twinkling pixel stars STRICTLY inside water
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        splashes = [
            (wx0 + int((wx1 - wx0) * 0.21), wy0 + int((wy1 - wy0) * 0.62)),
            (wcx, wy0 + int((wy1 - wy0) * 0.72)),
            (wx0 + int((wx1 - wx0) * 0.79), wy0 + int((wy1 - wy0) * 0.62)),
        ]
        rad_seq = [4, 7, 10, 6]
        for s_i, (sx, sy) in enumerate(splashes):
            rad = rad_seq[(f + s_i) % 4]
            col = (232, 252, 255, 225) if (f + s_i) % 2 == 0 else (175, 238, 248, 195)
            draw.ellipse((sx - rad, sy - max(2, rad // 2), sx + rad, sy + max(2, rad // 2)), outline=col, width=2)
            dy_pop = [-4, -7, -5, -2][(f + s_i) % 4]
            draw.rectangle((sx - 3, sy + dy_pop, sx - 2, sy + dy_pop + 1), fill=(245, 254, 255, 255))
            draw.rectangle((sx + 2, sy + dy_pop - 1, sx + 3, sy + dy_pop), fill=(245, 254, 255, 255))

        sparkle_pts = [
            (wx0 + int((wx1 - wx0) * 0.30), wy0 + int((wy1 - wy0) * 0.70)),
            (wx0 + int((wx1 - wx0) * 0.70), wy0 + int((wy1 - wy0) * 0.68)),
            (wx0 + int((wx1 - wx0) * 0.42), wy0 + int((wy1 - wy0) * 0.76)),
            (wx0 + int((wx1 - wx0) * 0.58), wy0 + int((wy1 - wy0) * 0.56)),
        ]
        for sp_i, (px, py) in enumerate(sparkle_pts):
            phase = (f + sp_i) % 4
            if phase in (0, 2):
                arm = 4 if phase == 0 else 2
                draw.rectangle((px - arm, py, px + arm, py + 1), fill=(250, 255, 255, 255))
                draw.rectangle((px, py - arm, px + 1, py + arm), fill=(250, 255, 255, 255))

        # Clip overlay strictly to water/foam pixels so ripples never bleed onto stone rim
        ov_arr = np.array(overlay)
        ov_arr[~(is_water | is_foam), 3] = 0
        im_f = Image.fromarray(frame, "RGBA")
        im_f.alpha_composite(Image.fromarray(ov_arr, "RGBA"))

        # Top crown fountain jet bounce
        draw_top = ImageDraw.Draw(im_f)
        jet_y = wy0 + 2
        j_off = [0, -2, -1, 1][f]
        draw_top.rectangle((wcx - 2, max(0, jet_y + j_off), wcx + 2, max(1, jet_y + j_off + 2)), fill=(245, 254, 255, 255))

        strip.alpha_composite(im_f, (f * w, 0))
    return strip


def build_sway_4f(base: Image.Image, max_shift: int, anchor_ratio: float) -> Image.Image:
    """Create a 4-frame wind-sway strip with locked bottom trunk/base and smooth top pixel shift."""
    w, h = base.size
    pad_x = max_shift + 2
    cw = w + pad_x * 2
    centered = Image.new("RGBA", (cw, h), (0, 0, 0, 0))
    centered.alpha_composite(base, (pad_x, 0))
    strip = Image.new("RGBA", (cw * 4, h), (0, 0, 0, 0))
    anchor_y = int(h * anchor_ratio)
    factors = (0.0, 0.6, 1.0, 0.45)
    for f, fac in enumerate(factors):
        shifts = {}
        for y in range(anchor_y):
            t = (anchor_y - y) / max(1, anchor_y)
            # Quantize to crisp 2px pixel steps so pixel clusters stay crisp (2x retina = 1 logical pixel)
            dx = int(round(t * t * max_shift * fac / 2.0)) * 2
            shifts[y] = dx
        strip.alpha_composite(shift_rows_horizontal(centered, shifts), (f * cw, 0))
    return strip


def build_lamp_sheet(base: Image.Image) -> Image.Image:
    """Create a 4-frame x 2-row street lamp sheet:
    Row 0: Daytime (cool glass lantern) + fluttering pennant banner
    Row 1: Dusk/Night (warm glowing amber lantern) + fluttering pennant banner
    """
    w, h = base.size
    pad_x = 4
    cw = w + pad_x * 2
    centered = Image.new("RGBA", (cw, h), (0, 0, 0, 0))
    centered.alpha_composite(base, (pad_x, 0))

    arr = np.array(centered).astype(np.int16)
    a = arr[:, :, 3] > 0
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    yy, xx = np.indices((h, cw))

    # Lantern glass sits in upper ~10%..30% height, warm yellow/cream pixels
    glass = a & (yy >= int(h * 0.08)) & (yy <= int(h * 0.31)) & (r > 180) & (g > 140)
    # Pennant banner sits to the right of post in y ~ 34%..64%
    post_cx = cw // 2 - 4
    banner_zone = (yy >= int(h * 0.34)) & (yy <= int(h * 0.65)) & (xx > post_cx + 5)

    # Row 0: Daytime cool glass variant
    day_arr = arr.copy()
    day_arr[glass, 0] = np.clip(day_arr[glass, 0] * 0.78 + 20, 0, 255)
    day_arr[glass, 1] = np.clip(day_arr[glass, 1] * 0.88 + 22, 0, 255)
    day_arr[glass, 2] = np.clip(day_arr[glass, 2] * 1.12 + 38, 0, 255)
    day_base = Image.fromarray(day_arr.astype(np.uint8), "RGBA")

    # Row 1: Night glowing warm golden lantern
    night_arr = arr.copy()
    night_arr[glass, 0] = np.clip(night_arr[glass, 0] * 1.08 + 28, 0, 255)
    night_arr[glass, 1] = np.clip(night_arr[glass, 1] * 1.04 + 18, 0, 255)
    night_arr[glass, 2] = np.clip(night_arr[glass, 2] * 0.72, 0, 255)
    night_base = Image.fromarray(night_arr.astype(np.uint8), "RGBA")

    sheet = Image.new("RGBA", (cw * 4, h * 2), (0, 0, 0, 0))
    by0, by1 = int(h * 0.36), int(h * 0.64)
    flutter = (0, 2, 4, 2)
    for row_i, row_im in enumerate((day_base, night_base)):
        base_a = np.array(row_im)
        for f, amp in enumerate(flutter):
            frame = base_a.copy()
            # Clear banner region & re-paste with progressive bottom-tip flutter
            b_only = np.zeros_like(base_a)
            b_only[banner_zone] = base_a[banner_zone]
            frame[banner_zone] = 0
            shifted = np.zeros_like(b_only)
            for y in range(by0, min(h, by1 + 1)):
                t = max(0.0, (y - by0) / max(1, by1 - by0))
                dx = int(round(t * amp / 2.0)) * 2
                if dx == 0:
                    shifted[y] = b_only[y]
                elif dx > 0:
                    shifted[y, dx:] = b_only[y, :-dx]
            out_im = Image.fromarray(frame, "RGBA")
            out_im.alpha_composite(Image.fromarray(shifted, "RGBA"))
            sheet.alpha_composite(out_im, (f * cw, row_i * h))
    return sheet


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    SCRATCH.mkdir(parents=True, exist_ok=True)

    # 1. Build crisp 1200x1600 town base map (2x retina of 600x800 world) + 600x800 hub-garden.webp
    raw_map = Image.open(MAP_SRC).convert("RGB")
    # Crisp 600x800 -> keep full detail at 1200x1600 with clean pixel sharpening
    map_1200 = raw_map.resize((1200, 1600), Image.Resampling.LANCZOS)
    map_1200 = ImageEnhance.Sharpness(map_1200).enhance(1.35)
    save_png8(map_1200, OUT_DIR / "town-base.png")

    map_600 = raw_map.resize((600, 800), Image.Resampling.LANCZOS)
    map_600 = ImageEnhance.Sharpness(map_600).enhance(1.25)
    map_600.save(HUB_WEBP, format="WEBP", lossless=True)
    print(
        f"Saved town-base.png ({(OUT_DIR / 'town-base.png').stat().st_size / 1024:.1f} KB, 1200x1600) "
        f"and hub-garden.webp ({HUB_WEBP.stat().st_size / 1024:.1f} KB, 600x800)"
    )

    # 2. Extract 5 props from props sheet (1200x896)
    raw_props = Image.open(PROPS_SRC).convert("RGBA")
    pw, ph = raw_props.size
    # Clean crop regions matching the 2-row layout (generous white margins)
    boxes = {
        "fountain": (0, 0, int(pw * 0.50), int(ph * 0.56)),
        "tree": (int(pw * 0.52), 0, pw, int(ph * 0.58)),
        "bench": (0, int(ph * 0.62), int(pw * 0.40), ph),
        "lamp": (int(pw * 0.40), int(ph * 0.48), int(pw * 0.62), ph),
        "bush": (int(pw * 0.62), int(ph * 0.60), pw, ph),
    }
    # Target 2x retina pixel dimensions (in 1200x1600 space, so world_size = px / 2)
    # Fountain: ~152x134 world -> 304x268 px
    # Tree:     ~110x114 world -> 220x228 px
    # Bench:    ~58x38 world   -> 116x76 px
    # Lamp:     ~32x78 world   -> 64x156 px
    # Bush:     ~54x42 world   -> 108x84 px
    targets = {
        "fountain": (300, 264),
        "tree": (220, 228),
        "bench": (116, 76),
        "lamp": (68, 160),
        "bush": (112, 86),
    }
    extracted = {}
    for name, box in boxes.items():
        sub = raw_props.crop(box)
        enc = name in ("bench", "fountain", "lamp")
        enc_ratio = 0.42 if name == "fountain" else 1.0
        cleaned = flood_clear_white(sub, thresh=232, clear_enclosed=enc, enclosed_max_y_ratio=enc_ratio)
        cleaned = filter_small_components(cleaned, keep_largest_only=True)
        bbox = cleaned.getchannel("A").getbbox()
        assert bbox is not None, f"Empty prop crop for {name}"
        tight = cleaned.crop(bbox)
        # Preserve aspect ratio within target box
        tw, th = targets[name]
        scale = min(tw / tight.width, th / tight.height)
        nw, nh = max(2, round(tight.width * scale / 2) * 2), max(2, round(tight.height * scale / 2) * 2)
        prop_im = crisp_resize_prop(tight, nw, nh)
        extracted[name] = prop_im
        print(f"Extracted {name:10s}: raw_tight={tight.size} -> crisp_2x={prop_im.size}")

    # 3. Build animated sheets & save optimized PNG8
    fountain_4f = build_fountain_4f(extracted["fountain"])
    tree_4f = build_sway_4f(extracted["tree"], max_shift=6, anchor_ratio=0.72)
    bush_4f = build_sway_4f(extracted["bush"], max_shift=4, anchor_ratio=0.78)
    lamp_4f = build_lamp_sheet(extracted["lamp"])
    bench_im = extracted["bench"]

    save_png8(fountain_4f, OUT_DIR / "fountain_4f.png")
    save_png8(tree_4f, OUT_DIR / "tree_4f.png")
    save_png8(bush_4f, OUT_DIR / "bush_4f.png")
    save_png8(lamp_4f, OUT_DIR / "lamp_4f.png")
    save_png8(bench_im, OUT_DIR / "bench.png")

    meta = {
        "fountain": {"frames": 4, "w": extracted["fountain"].width, "h": extracted["fountain"].height},
        "tree": {"frames": 4, "w": tree_4f.width // 4, "h": tree_4f.height},
        "bush": {"frames": 4, "w": bush_4f.width // 4, "h": bush_4f.height},
        "lamp": {"frames": 4, "rows": 2, "w": lamp_4f.width // 4, "h": lamp_4f.height // 2},
        "bench": {"frames": 1, "w": bench_im.width, "h": bench_im.height},
    }
    print("Animated prop sheet metadata:", meta)

    # 4. Composite QA Preview (with placed props + 2 sample 128px residents + collision overlay)
    qa = map_1200.convert("RGBA")
    # Place props at exact 2x world coordinates (bottom-center anchored)
    placements = [
        ("fountain", fountain_4f.crop((0, 0, meta["fountain"]["w"], meta["fountain"]["h"])), 300, 496),
        ("west-bench", bench_im, 98, 404),
        ("east-bench", bench_im, 502, 404),
        ("nw-lamp", lamp_4f.crop((0, 0, meta["lamp"]["w"], meta["lamp"]["h"])), 232, 338),
        ("ne-lamp", lamp_4f.crop((0, 0, meta["lamp"]["w"], meta["lamp"]["h"])), 368, 338),
        ("sw-lamp", lamp_4f.crop((0, 0, meta["lamp"]["w"], meta["lamp"]["h"])), 226, 572),
        ("se-lamp", lamp_4f.crop((0, 0, meta["lamp"]["w"], meta["lamp"]["h"])), 374, 572),
        ("nw-bush", bush_4f.crop((0, 0, meta["bush"]["w"], meta["bush"]["h"])), 196, 332),
        ("ne-bush", bush_4f.crop((0, 0, meta["bush"]["w"], meta["bush"]["h"])), 404, 332),
        ("sw-bush", bush_4f.crop((0, 0, meta["bush"]["w"], meta["bush"]["h"])), 102, 568),
        ("se-bush", bush_4f.crop((0, 0, meta["bush"]["w"], meta["bush"]["h"])), 498, 568),
        ("w-tree", tree_4f.crop((0, 0, meta["tree"]["w"], meta["tree"]["h"])), 28, 534),
        ("e-tree", tree_4f.crop((0, 0, meta["tree"]["w"], meta["tree"]["h"])), 572, 534),
    ]
    # Add two 128px residents (rendered at 64x64 world = 128x128 in 2x map!) to check scale harmony!
    alex = Image.open(ROOT / "app/src/main/assets/residents128/alex/idle.png").convert("RGBA").crop((0, 0, 128, 128))
    abigail = Image.open(ROOT / "app/src/main/assets/residents128/abigail/idle.png").convert("RGBA").crop((0, 0, 128, 128))
    placements.append(("alex", alex, 200, 448))
    placements.append(("abigail", abigail, 300, 376))

    # Sort by ground baseline y (just like real Y-sorting!)
    placements.sort(key=lambda item: item[3])
    for name, spr, wx, wy in placements:
        # Residents anchor at groundY=120 of 128
        dy = 120 if name in ("alex", "abigail") else spr.height
        qa.alpha_composite(spr, (wx * 2 - spr.width // 2, wy * 2 - dy))

    qa.save(SCRATCH / "town_v2_composite_qa.png")

    # Also save props strip QA on dark checkerboard to verify clean cutouts!
    pqa = Image.new("RGBA", (1200, 620), (48, 68, 62, 255))
    pqa.alpha_composite(fountain_4f, (0, 10))
    pqa.alpha_composite(tree_4f, (0, 290))
    pqa.alpha_composite(lamp_4f, (920, 280))
    pqa.alpha_composite(bush_4f, (0, 520))
    pqa.alpha_composite(bench_im, (520, 520))
    pqa.save(SCRATCH / "props_cutout_qa.png")
    print("Saved QA previews to", SCRATCH)


if __name__ == "__main__":
    main()
