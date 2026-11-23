#!/usr/bin/env python3
"""Install the user's five licensed-for-this-project MP3 files from one ZIP.
The ZIP is optional for code-only PR builds, but required for audible music.
Create it with members audio/01_morning_sunny.mp3 ... audio/05_cloudy.mp3
and upload as app/src/main/assets/wordville-music.zip to the PR branch.
"""
from pathlib import Path
from zipfile import ZipFile, BadZipFile

ASSETS=Path(__file__).resolve().parents[1]/"app/src/main/assets"
ARCHIVE=ASSETS/"wordville-music.zip"
SONGS=[
    "01_morning_sunny.mp3", "02_noon_sunny.mp3", "03_evening_sunny.mp3",
    "04_night_clear.mp3", "05_cloudy.mp3",
]
TARGET=ASSETS/"audio"

def install():
    if not ARCHIVE.is_file():
        available=[(TARGET/name).is_file() for name in SONGS]
        if any(available) and not all(available):
            raise SystemExit("Incomplete Town MP3 asset set: include all five.")
        if all(available):
            print("Town music: five unpacked MP3 assets found.")
        else:
            print("::notice::Town music ZIP has not been uploaded; built app has a silent optional BGM control.")
        return
    try:
        with ZipFile(ARCHIVE) as archive:
            members={entry.filename:entry for entry in archive.infolist()}
            expected={"audio/"+name for name in SONGS}
            missing=expected-set(members)
            if missing:
                raise ValueError("Town music ZIP is missing: "+", ".join(sorted(missing)))
            for name in sorted(expected):
                item=members[name]
                if item.is_dir() or item.file_size<1000 or item.file_size>15_000_000:
                    raise ValueError("Invalid MP3 size: "+name)
                if item.compress_size>16_000_000:
                    raise ValueError("Invalid compressed MP3 size: "+name)
                payload=archive.read(item)
                if not(payload.startswith(b"ID3") or (payload[0]==0xFF and payload[1]&0xE0==0xE0)):
                    raise ValueError("Invalid MP3 signature: "+name)
                dest=TARGET/Path(name).name
                dest.parent.mkdir(parents=True,exist_ok=True)
                dest.write_bytes(payload)
    except BadZipFile as exc:
        raise SystemExit("Corrupted music ZIP") from exc
    print("Town music: installed five offline MP3 tracks.")

if __name__=="__main__":
    install()
