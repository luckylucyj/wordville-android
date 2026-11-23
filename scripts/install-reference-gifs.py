#!/usr/bin/env python3
"""Install uploaded user GIFs for exact reference-backed Wordville gameplay."""
from pathlib import Path
from zipfile import ZipFile, BadZipFile

ASSETS=Path(__file__).resolve().parents[1]/"app/src/main/assets"
ARCHIVE=ASSETS/"wordville-reference-gifs.zip"
NEEDED=("images/reference/fishing.gif","images/reference/weeding.gif")

def main():
    if not ARCHIVE.exists():
        available=[(ASSETS/name).is_file() for name in NEEDED]
        if any(available) and not all(available):
            raise SystemExit("Please include BOTH reference GIFs.")
        if all(available):
            print("Reference animations: two GIFs already provided.")
        else:
            print("::notice::Reference GIF ZIP not uploaded. Original PNGs will be used until user GIF upload.")
        return
    try:
        with ZipFile(ARCHIVE) as z:
            names=set(z.namelist())
            if not set(NEEDED).issubset(names):
                raise ValueError("Missing user GIF(s): "+", ".join(set(NEEDED)-names))
            for name in NEEDED:
                item=z.getinfo(name)
                if item.is_dir() or not 1000<item.file_size<12_000_000:
                    raise ValueError("Invalid GIF size: "+name)
                data=z.read(name)
                if data[:6] not in (b"GIF87a",b"GIF89a"):
                    raise ValueError("Not a GIF: "+name)
                target=ASSETS/name
                target.parent.mkdir(parents=True,exist_ok=True)
                target.write_bytes(data)
    except (BadZipFile, ValueError) as exc:
        raise SystemExit("Could not install reference artwork: "+str(exc)) from exc
    ARCHIVE.unlink()  # Prevent a duplicate ZIP inflating the APK.
    print("Reference animations: original fishing and weeding GIFs installed.")

if __name__=="__main__":
    main()
