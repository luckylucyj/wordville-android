"""Generate the offline UK clips for bundled vocabulary cards."""

import json
import os
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ASSETS = Path(__file__).resolve().parents[1] / "app/src/main/assets"
OUTPUT = ASSETS / "pronunciation/uk"


def generate_clip(entry):
    word_id = entry["id"]
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,179}", word_id):
        raise ValueError(f"Invalid vocabulary ID: {word_id!r}")

    text = entry["word"]
    if text == "resume" and "이력서" in entry["meaning"]:
        text = "résumé"

    wave = subprocess.run(
        ["espeak-ng", "-b", "1", "-v", "en", "-s", "155", "--stdout", "--stdin"],
        input=text.encode("utf-8"),
        capture_output=True,
        check=True,
    ).stdout
    if len(wave) <= 44:
        raise RuntimeError(f"No speech generated for {word_id}")

    clip = OUTPUT / f"{word_id}.mp3"
    subprocess.run(
        ["lame", "--silent", "-m", "m", "-b", "24", "-", str(clip)],
        input=wave,
        check=True,
    )
    if clip.stat().st_size == 0:
        raise RuntimeError(f"Empty MP3 for {word_id}")


def main():
    entries = json.loads((ASSETS / "words.json").read_text(encoding="utf-8"))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for clip in OUTPUT.glob("*.mp3"):
        clip.unlink()
    with ThreadPoolExecutor(max_workers=min(4, os.cpu_count() or 1)) as workers:
        for _ in workers.map(generate_clip, entries):
            pass
    print(f"Generated {len(entries)} offline UK pronunciation clips.")


if __name__ == "__main__":
    main()
